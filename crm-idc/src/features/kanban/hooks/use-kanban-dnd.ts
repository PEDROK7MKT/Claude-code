"use client";

import type * as React from "react";
import {
  KeyboardCode,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type KeyboardCodes,
  type KeyboardCoordinateGetter,
  type MeasuringConfiguration,
  type PointerSensorOptions,
  type ScreenReaderInstructions,
  type SensorDescriptor,
  type SensorOptions,
  type TouchSensorOptions,
} from "@dnd-kit/core";

import { isLeadRow } from "@/features/leads/api/lead-query-utils";
import {
  KANBAN_DRAG_INSTRUCTIONS,
  announceDragCancel,
  announceDragEnd,
  announceDragOver,
  announceDragStart,
} from "@/features/kanban/lib/announcements";
import { statusFromColumnId } from "@/features/kanban/lib/columns";
import { centeredLeft, pickAdjacentColumn, type ColumnRect } from "@/features/kanban/lib/keyboard";
import { canTransition, isLeadStatus } from "@/lib/lead-status";
import type { Lead, LeadStatus } from "@/types/database";

/** Dados anexados ao card arrastável. */
export interface DraggableLeadData {
  lead: Lead;
}

/** Dados anexados à coluna (área de soltar). */
export interface DroppableColumnData {
  status: LeadStatus;
}

export function leadFromDragData(data: unknown): Lead | null {
  if (typeof data !== "object" || data === null || !("lead" in data)) return null;
  const { lead } = data;
  return isLeadRow(lead) ? lead : null;
}

export function statusFromDropData(data: unknown, id?: unknown): LeadStatus | null {
  if (typeof data === "object" && data !== null && "status" in data && isLeadStatus(data.status)) return data.status;
  return statusFromColumnId(id);
}

/** Elementos dentro do card que não iniciam arraste (telefone, menu). */
export const NO_DRAG_ATTRIBUTE = "data-no-dnd";

function startsInsideNoDragZone(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(`[${NO_DRAG_ATTRIBUTE}]`) !== null;
}

/**
 * Mouse/caneta: arrasta depois de 6px. Toques ficam com o TouchSensor (espera
 * 200ms), senão rolar o quadro no celular iniciaria arrastes.
 */
class KanbanPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent: event }: React.PointerEvent, { onActivation }: PointerSensorOptions): boolean => {
        if (event.pointerType === "touch" || !event.isPrimary || event.button !== 0) return false;
        if (startsInsideNoDragZone(event.target)) return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

/** Toque: segurar 200ms (tolerância de 5px) — deslizar continua rolando a tela. */
class KanbanTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: ({ nativeEvent: event }: React.TouchEvent, { onActivation }: TouchSensorOptions): boolean => {
        if (event.touches.length > 1 || startsInsideNoDragZone(event.target)) return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

/** Espaço pega o card (Enter fica para abrir o lead); Espaço/Enter soltam; Esc cancela. */
const KEYBOARD_CODES: KeyboardCodes = {
  start: [KeyboardCode.Space],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space, KeyboardCode.Enter],
};

const ARROW_KEYS: readonly string[] = [KeyboardCode.Left, KeyboardCode.Right, KeyboardCode.Up, KeyboardCode.Down];

/**
 * Setas ← → pulam direto para a coluna vizinha que aceita o card (a de
 * origem incluída); ↑ ↓ não fazem nada (a ordem dentro da coluna é por data).
 */
const columnCoordinateGetter: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
  if (!ARROW_KEYS.includes(event.code)) return undefined;
  event.preventDefault();
  if (event.code !== KeyboardCode.Left && event.code !== KeyboardCode.Right) return undefined;

  const { active, collisionRect, droppableRects, droppableContainers } = context;
  const lead = leadFromDragData(active?.data.current);
  if (!lead || !collisionRect) return undefined;

  const candidates: ColumnRect[] = [];
  for (const container of droppableContainers.getEnabled()) {
    const status = statusFromDropData(container.data.current, container.id);
    const rect = droppableRects.get(container.id);
    if (!status || !rect) continue;
    if (status !== lead.status && !canTransition(lead.status, status)) continue;
    candidates.push({ id: String(container.id), left: rect.left, width: rect.width });
  }

  const target = pickAdjacentColumn(collisionRect, candidates, event.code === KeyboardCode.Right ? "right" : "left");
  if (!target) return undefined;
  return { x: centeredLeft(target, collisionRect.width), y: currentCoordinates.y };
};

/** Ponteiro dentro da coluna; sem ponteiro (teclado) ou entre colunas, maior interseção. */
export const kanbanCollisionDetection: CollisionDetection = (args) => {
  const byPointer = pointerWithin(args);
  return byPointer.length > 0 ? byPointer : rectIntersection(args);
};

/** Colunas remedidas sempre (o quadro rola na horizontal e as colunas na vertical). */
export const KANBAN_MEASURING: MeasuringConfiguration = {
  droppable: { strategy: MeasuringStrategy.Always },
};

export const KANBAN_SCREEN_READER_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable: KANBAN_DRAG_INSTRUCTIONS,
};

function dragArgs(activeData: unknown, overData: unknown, overId: unknown) {
  const lead = leadFromDragData(activeData);
  if (!lead) return null;
  return { name: lead.name, from: lead.status, over: statusFromDropData(overData, overId) };
}

/** Anúncios pt-BR para leitores de tela (início, coluna sob o card, soltar, cancelar). */
export const KANBAN_ANNOUNCEMENTS: Announcements = {
  onDragStart({ active }) {
    const lead = leadFromDragData(active.data.current);
    return lead ? announceDragStart(lead.name, lead.status) : undefined;
  },
  onDragOver({ active, over }) {
    const args = dragArgs(active.data.current, over?.data.current, over?.id);
    return args ? announceDragOver(args) : undefined;
  },
  onDragEnd({ active, over }) {
    const args = dragArgs(active.data.current, over?.data.current, over?.id);
    return args ? announceDragEnd(args) : undefined;
  },
  onDragCancel({ active }) {
    const lead = leadFromDragData(active.data.current);
    return lead ? announceDragCancel({ name: lead.name, from: lead.status }) : undefined;
  },
};

/** Sensores do quadro: mouse (6px), toque (segurar 200ms) e teclado. */
export function useKanbanSensors(): SensorDescriptor<SensorOptions>[] {
  return useSensors(
    useSensor(KanbanPointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KanbanTouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { keyboardCodes: KEYBOARD_CODES, coordinateGetter: columnCoordinateGetter }),
  );
}
