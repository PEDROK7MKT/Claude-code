"use client";

import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  /** Chamado quando o estado do Caps Lock muda (aviso ao digitar a senha). */
  onCapsLockChange?: (active: boolean) => void;
};

/** Campo de senha com botão mostrar/ocultar (acessível por teclado e leitor de tela). */
export function PasswordInput({ className, id, onCapsLockChange, onKeyDown, onKeyUp, onBlur, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);
  const fallbackId = React.useId();
  const inputId = id ?? fallbackId;

  const reportCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof event.getModifierState === "function") onCapsLockChange?.(event.getModifierState("CapsLock"));
  };

  return (
    <div className="relative">
      <Input
        id={inputId}
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn("pr-11", className)}
        onKeyDown={(event) => {
          reportCapsLock(event);
          onKeyDown?.(event);
        }}
        onKeyUp={(event) => {
          reportCapsLock(event);
          onKeyUp?.(event);
        }}
        onBlur={(event) => {
          onCapsLockChange?.(false);
          onBlur?.(event);
        }}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
        aria-controls={inputId}
        disabled={props.disabled}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? <EyeOffIcon aria-hidden="true" className="size-4" /> : <EyeIcon aria-hidden="true" className="size-4" />}
      </button>
    </div>
  );
}
