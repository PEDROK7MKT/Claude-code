"use client";

import * as React from "react";
import { ChevronDownIcon, MegaphoneIcon, SlidersHorizontalIcon } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FIELD_MAX_LENGTH,
  NONE_OPTION,
  OTHER_CAMPAIGN_OPTION,
  UTM_FIELDS,
  hasUtmValues,
  shouldShowAdTracking,
  type LeadFormOutput,
  type LeadFormValues,
} from "@/features/leads/lib/form-schema";
import type { UrlAutofillResult } from "@/features/leads/lib/form-url";
import { CAMPAIGNS, LEAD_SOURCES, SOURCE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { RequiredMark } from "./contact-fields";
import { UrlAutofill } from "./url-autofill";

const UTM_PLACEHOLDER: Record<(typeof UTM_FIELDS)[number], string> = {
  utm_source: "google",
  utm_medium: "cpc",
  utm_campaign: "idc_urgencia_canal",
  utm_term: "dentista barreiras",
  utm_content: "anuncio_1",
};

/**
 * Origem do lead: fonte (obrigatória), "Colar URL de origem", rastreamento do
 * anúncio (Google Ads) e UTMs em "Avançado".
 */
export function TrackingFields() {
  const form = useFormContext<LeadFormValues, unknown, LeadFormOutput>();
  const [source, campaignOption, campaignOther, keyword, adGroup, landingPage] = useWatch({
    control: form.control,
    name: ["source", "campaignOption", "campaignOther", "keyword", "ad_group", "landing_page"],
  });
  const showAdTracking = shouldShowAdTracking({
    source,
    campaignOption,
    campaignOther,
    keyword,
    ad_group: adGroup,
    landing_page: landingPage,
  });
  const [utmOpen, setUtmOpen] = React.useState(() => hasUtmValues(form.getValues()));

  const handleUrlApplied = (result: UrlAutofillResult) => {
    if (result.filled.some((field) => field.startsWith("utm_"))) setUtmOpen(true);
  };

  return (
    <div className="grid gap-4">
      <FormField
        control={form.control}
        name="source"
        render={({ field }) => (
          <FormItem className="sm:max-w-sm">
            <FormLabel>
              Fonte <RequiredMark />
            </FormLabel>
            <Select value={field.value} onValueChange={field.onChange} name={field.name}>
              <FormControl>
                <SelectTrigger ref={field.ref} onBlur={field.onBlur} aria-required="true" className="w-full">
                  <SelectValue placeholder="Como o lead chegou?" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {LEAD_SOURCES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[option.value] }}
                    />
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <UrlAutofill onApplied={handleUrlApplied} />

      {showAdTracking ? <AdTrackingFields campaignOption={campaignOption} /> : null}

      <Collapsible open={utmOpen} onOpenChange={setUtmOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 inline-flex w-fit items-center gap-2 rounded-md py-1 text-sm font-medium outline-none focus-visible:ring-[3px]"
          >
            <SlidersHorizontalIcon aria-hidden="true" className="size-4" />
            Avançado: parâmetros UTM
            <ChevronDownIcon aria-hidden="true" className={cn("size-4 transition-transform", utmOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 grid gap-4 sm:grid-cols-2">
          {UTM_FIELDS.map((name) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-mono text-xs">{name}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={FIELD_MAX_LENGTH.shortText}
                      placeholder={UTM_PLACEHOLDER[name]}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/** "Rastreamento do anúncio" — campanha, palavra-chave, grupo de anúncios e página de destino. */
function AdTrackingFields({ campaignOption }: { campaignOption: string }) {
  const form = useFormContext<LeadFormValues, unknown, LeadFormOutput>();
  const headingId = React.useId();

  return (
    <fieldset aria-labelledby={headingId} className="border-primary/20 bg-primary/[0.03] grid gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <MegaphoneIcon aria-hidden="true" className="text-primary size-4" />
        <p id={headingId} className="text-sm font-semibold">
          Rastreamento do anúncio
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="campaignOption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campanha</FormLabel>
              <Select
                value={field.value || NONE_OPTION}
                name={field.name}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value !== OTHER_CAMPAIGN_OPTION) form.setValue("campaignOther", "", { shouldDirty: true });
                }}
              >
                <FormControl>
                  <SelectTrigger ref={field.ref} onBlur={field.onBlur} className="w-full">
                    <SelectValue placeholder="Selecione a campanha" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NONE_OPTION}>Não informada</SelectItem>
                  <SelectSeparator />
                  {CAMPAIGNS.map((campaign) => (
                    <SelectItem key={campaign.value} value={campaign.label}>
                      {campaign.label}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={OTHER_CAMPAIGN_OPTION}>Outra…</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {campaignOption === OTHER_CAMPAIGN_OPTION ? (
          <FormField
            control={form.control}
            name="campaignOther"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nome da campanha <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    maxLength={FIELD_MAX_LENGTH.campaign}
                    placeholder="Nome exato no Google Ads"
                    aria-required="true"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Palavra-chave</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="off"
                  maxLength={FIELD_MAX_LENGTH.shortText}
                  placeholder="Ex.: dentista barreiras"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ad_group"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grupo de anúncios</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" maxLength={FIELD_MAX_LENGTH.shortText} placeholder="Ex.: Urgência" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="landing_page"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Página de destino</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={FIELD_MAX_LENGTH.landing_page}
                  placeholder="/urgencia"
                  className="font-mono text-sm"
                />
              </FormControl>
              <FormDescription>Caminho da página do site para onde o anúncio levou.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </fieldset>
  );
}
