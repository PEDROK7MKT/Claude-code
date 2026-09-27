"use client";

import { CalendarRangeIcon, MegaphoneIcon } from "lucide-react";

import { DateRangePicker, type DateKeyRange } from "@/components/shared/date-time-picker";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADS_PERIOD_OPTIONS, type AdsPeriodPreset, type AdsPeriodSelection } from "@/features/google-ads/lib/periods";

/** Valor do select de campanha para "todas". */
export const ALL_CAMPAIGNS = "__todas__";

interface AdsToolbarProps {
  selection: AdsPeriodSelection;
  range: DateKeyRange;
  todayKey: string;
  campaign: string | null;
  campaignOptions: readonly string[];
  onPresetChange: (preset: AdsPeriodPreset) => void;
  onRangeChange: (range: DateKeyRange) => void;
  onCampaignChange: (campaign: string | null) => void;
}

/** Filtros do cabeçalho: período (atalhos + calendário) e campanha. */
export function AdsToolbar({
  selection,
  range,
  todayKey,
  campaign,
  campaignOptions,
  onPresetChange,
  onRangeChange,
  onCampaignChange,
}: AdsToolbarProps) {
  return (
    <div role="group" aria-label="Filtros" className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
      <Select value={selection} onValueChange={(value) => onPresetChange(value as AdsPeriodPreset)}>
        <SelectTrigger className="w-full sm:w-48" aria-label="Período">
          <CalendarRangeIcon aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {ADS_PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          {selection === "custom" ? (
            <SelectItem value="custom" disabled>
              Personalizado
            </SelectItem>
          ) : null}
        </SelectContent>
      </Select>

      <DateRangePicker
        value={range}
        onChange={(next) => {
          if (next) onRangeChange(next);
        }}
        maxDate={todayKey}
        aria-label="Intervalo de datas"
        className="sm:w-auto"
      />

      <Select
        value={campaign ?? ALL_CAMPAIGNS}
        onValueChange={(value) => onCampaignChange(value === ALL_CAMPAIGNS ? null : value)}
      >
        <SelectTrigger className="w-full sm:w-64" aria-label="Campanha">
          <MegaphoneIcon aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={ALL_CAMPAIGNS}>Todas as campanhas</SelectItem>
          {campaignOptions.length ? <SelectSeparator /> : null}
          {campaignOptions.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
