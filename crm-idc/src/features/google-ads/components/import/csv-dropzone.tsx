"use client";

import * as React from "react";
import { CloudUploadIcon, Loader2Icon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CsvDropzoneProps {
  onFile: (file: File) => void;
  busy?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Área de arrastar e soltar + seletor de arquivo (acessível pelo teclado via input). */
export function CsvDropzone({ onFile, busy = false, disabled = false, className }: CsvDropzoneProps) {
  const inputId = React.useId();
  const hintId = React.useId();
  const [dragging, setDragging] = React.useState(false);

  const handleDrag = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    event.dataTransfer.dropEffect = "copy";
    if (!dragging) setDragging(true);
  };

  return (
    <label
      htmlFor={inputId}
      data-dragging={dragging}
      aria-disabled={disabled || undefined}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file && !disabled) onFile(file);
      }}
      className={cn(
        "border-input bg-muted/30 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        "hover:border-primary/50 hover:bg-primary/5",
        "has-[input:focus-visible]:border-primary has-[input:focus-visible]:ring-ring/50 has-[input:focus-visible]:ring-[3px]",
        "data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/10",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="bg-primary/10 text-primary ring-primary/5 flex size-12 items-center justify-center rounded-full ring-8"
      >
        {busy ? <Loader2Icon className="size-6 animate-spin" /> : <CloudUploadIcon className="size-6" />}
      </span>
      <span className="text-foreground font-medium">
        {dragging ? "Solte o arquivo para ler" : "Arraste o arquivo CSV aqui"}
      </span>
      <span id={hintId} className="text-muted-foreground max-w-sm text-sm text-pretty">
        ou <span className="text-primary font-medium underline underline-offset-4">clique para escolher</span>. Relatório
        do Google Ads (.csv) ou planilha com data, campanha, impressões, cliques, custo e conversões — até 5 MB.
      </span>
      <Input
        id={inputId}
        type="file"
        accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
        className="sr-only"
        disabled={disabled}
        aria-describedby={hintId}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </label>
  );
}
