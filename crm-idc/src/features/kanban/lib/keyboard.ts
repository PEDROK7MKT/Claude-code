/**
 * Navegação por teclado entre colunas durante o arraste (setas ← →).
 * Função pura — keyboard.test.ts.
 */

export interface HorizontalRect {
  left: number;
  width: number;
}

export interface ColumnRect extends HorizontalRect {
  id: string;
}

export type HorizontalDirection = "left" | "right";

/**
 * Coluna vizinha mais próxima na direção pedida, comparando os centros
 * horizontais (a própria coluna — centro a menos de 1px — é ignorada).
 */
export function pickAdjacentColumn(
  current: HorizontalRect,
  columns: readonly ColumnRect[],
  direction: HorizontalDirection,
): ColumnRect | null {
  const center = current.left + current.width / 2;
  let best: ColumnRect | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of columns) {
    const candidateCenter = candidate.left + candidate.width / 2;
    const distance = direction === "right" ? candidateCenter - center : center - candidateCenter;
    if (distance > 1 && distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

/** x do canto esquerdo que centraliza um retângulo de largura `width` sobre `target`. */
export function centeredLeft(target: HorizontalRect, width: number): number {
  return target.left + (target.width - width) / 2;
}
