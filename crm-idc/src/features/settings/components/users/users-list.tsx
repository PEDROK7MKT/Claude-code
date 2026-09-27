"use client";

import { ShieldCheckIcon, StethoscopeIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/dates";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Profile, UserRole } from "@/types/database";
import type { UserAction } from "../../lib/users";
import { UserRowActions } from "./user-row-actions";

export interface UsersListProps {
  users: readonly Profile[];
  currentUserId: string;
  onAction: (action: UserAction, user: Profile) => void;
}

/** Usuários: tabela a partir de `md`, cards empilhados no celular. */
export function UsersList({ users, currentUserId, onAction }: UsersListProps) {
  return (
    <>
      <ul className="space-y-3 md:hidden" aria-label="Usuários">
        {users.map((user) => (
          <li key={user.id}>
            <UserCard user={user} currentUserId={currentUserId} onAction={onAction} />
          </li>
        ))}
      </ul>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Usuário</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className={cn(!user.active && "text-muted-foreground")}>
                <TableCell className="max-w-80">
                  <UserIdentity user={user} isSelf={user.id === currentUserId} />
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell>
                  <ActiveBadge active={user.active} />
                </TableCell>
                <TableCell className="tabular-nums">{formatDate(user.created_at)}</TableCell>
                <TableCell className="text-right">
                  <UserRowActions user={user} currentUserId={currentUserId} onAction={onAction} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function UserCard({ user, currentUserId, onAction }: { user: Profile } & Omit<UsersListProps, "users">) {
  return (
    <article
      aria-label={user.full_name}
      className={cn("space-y-3 rounded-lg border p-4", !user.active && "bg-muted/40")}
    >
      <div className="flex items-start justify-between gap-3">
        <UserIdentity user={user} isSelf={user.id === currentUserId} />
        <UserRowActions user={user} currentUserId={currentUserId} onAction={onAction} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RoleBadge role={user.role} />
        <ActiveBadge active={user.active} />
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          Criado em {formatDate(user.created_at)}
        </span>
      </div>
    </article>
  );
}

function UserIdentity({ user, isSelf }: { user: Profile; isSelf: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            user.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {initials(user.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium">
          <span className={cn("break-words", user.active ? "text-foreground" : "text-muted-foreground")}>
            {user.full_name}
          </span>
          {isSelf ? (
            <Badge variant="outline" className="text-[10px]">
              você
            </Badge>
          ) : null}
        </p>
        <p className="text-muted-foreground truncate text-sm" title={user.email ?? undefined}>
          {user.email ?? "—"}
        </p>
      </div>
    </div>
  );
}

const ROLE_ICON = { admin: ShieldCheckIcon, dentist: StethoscopeIcon } as const;

export function RoleBadge({ role }: { role: UserRole }) {
  const Icon = ROLE_ICON[role];
  return (
    <Badge
      variant={role === "admin" ? "default" : "secondary"}
      className={cn(role === "dentist" && "border-primary/15")}
    >
      <Icon aria-hidden="true" />
      {ROLE_LABEL[role]}
    </Badge>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(active ? "border-success/30 text-green-700" : "text-muted-foreground")}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground/60")} />
      {active ? "Ativo" : "Desativado"}
    </Badge>
  );
}
