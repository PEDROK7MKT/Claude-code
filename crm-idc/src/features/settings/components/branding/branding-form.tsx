"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, Loader2Icon, MessageCircleIcon, PaletteIcon, SaveIcon, TypeIcon, UndoIcon } from "lucide-react";
import { useForm, useFormState, useWatch } from "react-hook-form";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppSettings, useUpdateAppSettings } from "@/features/settings/api/app-settings";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { BRAND } from "@/lib/constants";
import type { AppSettings } from "@/types/database";
import {
  CLINIC_NAME_MAX,
  CRM_NAME_MAX,
  brandingSchema,
  brandingValuesToUpdate,
  isValidLogoUrl,
  previewColor,
  settingsToBrandingValues,
  type BrandingValues,
} from "../../lib/branding";
import { assessAccentColor, assessPrimaryColor } from "../../lib/color";
import { useUnsavedChanges } from "../use-unsaved-changes";
import { BrandPreview } from "./brand-preview";
import { ColorField } from "./color-field";
import { LogoField } from "./logo-field";
import { WhatsappMessageField } from "./whatsapp-message-field";
import { WhatsappPreview } from "./whatsapp-preview";

export interface BrandingFormProps {
  initialSettings: AppSettings;
  onDirtyChange?: (dirty: boolean) => void;
}

/**
 * Aba "Personalização" (spec §4.8): nome, logo, cores e mensagem do WhatsApp,
 * com prévia ao vivo. Ao salvar, router.refresh() faz o layout raiz reaplicar
 * --brand-primary/--brand-accent e o título das abas.
 */
export function BrandingForm({ initialSettings, onDirtyChange }: BrandingFormProps) {
  const router = useRouter();
  const { data: settings = initialSettings } = useAppSettings(initialSettings);
  const update = useUpdateAppSettings();
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: settingsToBrandingValues(settings),
    mode: "onTouched",
  });
  const { control, setValue } = form;
  const { isDirty } = useFormState({ control });
  const saving = update.isPending;
  useUnsavedChanges(isDirty, onDirtyChange);

  const [clinicName, crmName, logoUrl, primaryColor, accentColor, whatsappMessage] = useWatch({
    control,
    name: ["clinic_name", "crm_name", "logo_url", "primary_color", "accent_color", "whatsapp_message"],
  });
  const primary = previewColor(primaryColor, BRAND.primary);
  const accent = previewColor(accentColor, BRAND.accent);
  // só carrega a imagem quando o admin para de digitar
  const debouncedLogo = useDebouncedValue(logoUrl.trim(), 500);
  const previewLogo = isValidLogoUrl(debouncedLogo) ? debouncedLogo : null;

  const submit = async (values: BrandingValues) => {
    try {
      const saved = await update.mutateAsync(brandingValuesToUpdate(values));
      form.reset(settingsToBrandingValues(saved));
      router.refresh();
    } catch {
      // toast de erro já exibido pelo hook; mantém a edição
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        noValidate
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_23rem]"
      >
        <Card className="lg:col-start-1">
          <SectionHeader icon={TypeIcon} title="Identidade" description="Como a clínica e o CRM aparecem para a equipe." />
          <CardContent className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={control}
                name="clinic_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da clínica</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={CLINIC_NAME_MAX} autoComplete="organization" disabled={saving} />
                    </FormControl>
                    <FormDescription>Tela de login, relatórios e rodapé.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="crm_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do CRM</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={CRM_NAME_MAX} autoComplete="off" disabled={saving} />
                    </FormControl>
                    <FormDescription>
                      Barra lateral e título das abas (ex.: “Leads · {crmName.trim() || "IDC CRM"}”).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <LogoField
              control={control}
              setValue={setValue}
              previewUrl={previewLogo}
              clinicName={clinicName.trim() || settings.clinic_name}
              disabled={saving}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-start-1">
          <SectionHeader
            icon={PaletteIcon}
            title="Cores"
            description="Aplicadas em botões, menu, links e destaques de todo o CRM. Gráficos mantêm a paleta fixa."
          />
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <ColorField
              control={control}
              name="primary_color"
              label="Cor primária"
              description="Botões, item ativo do menu e links (texto branco por cima)."
              defaultColor={BRAND.primary}
              assess={assessPrimaryColor}
              disabled={saving}
            />
            <ColorField
              control={control}
              name="accent_color"
              label="Cor de destaque"
              description="Detalhes e badges, como o contador de novos leads."
              defaultColor={BRAND.accent}
              assess={assessAccentColor}
              disabled={saving}
            />
          </CardContent>
        </Card>

        <aside className="lg:sticky lg:top-20 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start" aria-labelledby="brand-preview-title">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle id="brand-preview-title" className="flex items-center gap-2 text-base">
                <EyeIcon aria-hidden="true" className="text-muted-foreground size-4" />
                Prévia
              </CardTitle>
              <CardDescription>Atualiza enquanto você edita. Vale para todos depois de salvar.</CardDescription>
            </CardHeader>
            <CardContent>
              <BrandPreview
                primary={primary}
                accent={accent}
                crmName={crmName.trim()}
                clinicName={clinicName.trim()}
                logoUrl={previewLogo}
              />
            </CardContent>
          </Card>
        </aside>

        <Card className="lg:col-start-1">
          <SectionHeader
            icon={MessageCircleIcon}
            title="Mensagem do WhatsApp"
            description="Texto já preenchido ao clicar em WhatsApp num lead (lista, kanban e detalhe)."
          />
          <CardContent className="grid gap-6 xl:grid-cols-2">
            <WhatsappMessageField control={control} setValue={setValue} disabled={saving} />
            <WhatsappPreview template={whatsappMessage} />
          </CardContent>
        </Card>

        <div className="bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-2 border-t px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:border sm:shadow-sm lg:col-span-2">
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {isDirty ? "Você tem alterações não salvas." : "Tudo salvo."}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={() => setConfirmDiscard(true)}
              disabled={!isDirty || saving}
            >
              <UndoIcon aria-hidden="true" />
              Descartar
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none" disabled={!isDirty || saving}>
              {saving ? <Loader2Icon aria-hidden="true" className="animate-spin" /> : <SaveIcon aria-hidden="true" />}
              {saving ? "Salvando..." : "Salvar personalização"}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        destructive
        title="Descartar alterações?"
        description="Nome, logo, cores e mensagem voltam aos valores salvos."
        confirmLabel="Descartar"
        cancelLabel="Continuar editando"
        onConfirm={() => form.reset(settingsToBrandingValues(settings))}
      />
    </Form>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof TypeIcon;
  title: string;
  description: string;
}) {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}
