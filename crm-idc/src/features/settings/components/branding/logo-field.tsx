"use client";

import * as React from "react";
import { CircleCheckIcon, ImageIcon, Loader2Icon, TriangleAlertIcon, XIcon } from "lucide-react";
import type { Control, UseFormSetValue } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LOGO_URL_MAX, type BrandingValues } from "../../lib/branding";
import { LogoPreview, type LogoStatus } from "./logo-preview";

export interface LogoFieldProps {
  control: Control<BrandingValues>;
  setValue: UseFormSetValue<BrandingValues>;
  /** URL válida e estável (após o debounce) para a prévia; null = sem logo */
  previewUrl: string | null;
  clinicName: string;
  disabled?: boolean;
}

interface LoadState {
  url: string;
  status: LogoStatus;
  size?: { width: number; height: number };
}

/** URL do logo com prévia ao vivo e fallback para o selo padrão (spec §12: placeholder). */
export function LogoField({ control, setValue, previewUrl, clinicName, disabled }: LogoFieldProps) {
  const [load, setLoad] = React.useState<LoadState | null>(null);
  // o estado vale só para a URL atual da prévia
  const status: LogoStatus = !previewUrl ? "none" : load?.url === previewUrl ? load.status : "loading";
  const size = load?.url === previewUrl ? load.size : undefined;

  return (
    <FormField
      control={control}
      name="logo_url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>URL do logo</FormLabel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <LogoPreview
              key={previewUrl ?? "sem-logo"}
              url={previewUrl}
              alt={`Logo — ${clinicName}`}
              onStatusChange={(next, nextSize) => {
                if (previewUrl) setLoad({ url: previewUrl, status: next, size: nextSize });
              }}
            />
            <div className="grid min-w-0 flex-1 gap-2">
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    {...field}
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={LOGO_URL_MAX}
                    placeholder="https://institutodeciocarrilho.com.br/logo.png"
                    disabled={disabled}
                  />
                </FormControl>
                {field.value ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Remover logo"
                    title="Remover logo"
                    disabled={disabled}
                    onClick={() => setValue("logo_url", "", { shouldDirty: true, shouldValidate: true })}
                  >
                    <XIcon aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
              <LogoStatusNote status={status} size={size} />
            </div>
          </div>
          <FormDescription>
            Endereço público de uma imagem PNG, SVG ou JPG (de preferência com fundo transparente). Aparece na barra
            lateral e na tela de login.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function LogoStatusNote({ status, size }: { status: LogoStatus; size?: { width: number; height: number } }) {
  const content: Record<LogoStatus, { icon: typeof ImageIcon; text: string; tone: string }> = {
    none: { icon: ImageIcon, text: "Sem logo: o CRM usa o selo padrão com o dente.", tone: "text-muted-foreground" },
    loading: { icon: Loader2Icon, text: "Carregando imagem…", tone: "text-muted-foreground" },
    loaded: {
      icon: CircleCheckIcon,
      text: size ? `Imagem carregada (${formatNumber(size.width)} × ${formatNumber(size.height)} px).` : "Imagem carregada.",
      tone: "text-green-700",
    },
    error: {
      icon: TriangleAlertIcon,
      text: "Não foi possível carregar a imagem deste endereço. Confira o link — até lá, o selo padrão é exibido.",
      tone: "text-yellow-900 bg-warning/15 rounded-md px-2.5 py-2",
    },
  };
  const { icon: Icon, text, tone } = content[status];
  return (
    <p role="status" className={cn("flex items-start gap-1.5 text-xs leading-snug", tone)}>
      <Icon aria-hidden="true" className={cn("mt-px size-3.5 shrink-0", status === "loading" && "animate-spin")} />
      <span>{text}</span>
    </p>
  );
}
