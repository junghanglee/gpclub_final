import type { ChangeEvent, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CmsContentLang = "vi" | "en";

export type CmsLocalizedText = {
  vi: string;
  en: string;
};

function langLabel(currentLang: CmsContentLang) {
  return currentLang === "vi" ? "Tiếng Việt" : "English";
}

export function LocalizedTextField({
  label,
  value,
  onChange,
  activeLang = "vi",
  compareMode = false,
  multiline = false,
}: {
  label: string;
  value: CmsLocalizedText;
  onChange: (value: CmsLocalizedText) => void;
  activeLang?: CmsContentLang;
  compareMode?: boolean;
  multiline?: boolean;
}) {
  const Comp = multiline ? Textarea : Input;
  const inactiveLang: CmsContentLang = activeLang === "vi" ? "en" : "vi";
  return (
    <div className={compareMode ? "grid gap-3 md:grid-cols-2" : "grid gap-3"}>
      <div>
        <Label>
          {label} - {langLabel(activeLang)}
        </Label>
        <Comp
          className="mt-1.5"
          value={value[activeLang]}
          rows={multiline ? 3 : undefined}
          onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange({ ...value, [activeLang]: e.target.value })
          }
        />
      </div>
      {compareMode ? (
        <div>
          <Label>
            {label} - {langLabel(inactiveLang)}
          </Label>
          <Comp
            className="mt-1.5 bg-muted/40 text-muted-foreground"
            value={value[inactiveLang]}
            rows={multiline ? 3 : undefined}
            readOnly
          />
        </div>
      ) : null}
    </div>
  );
}

export function PlainTextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-1.5" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function CmsPanel({
  title,
  children,
  defaultOpen = false,
  issueCount = 0,
  summary,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  issueCount?: number;
  summary?: string;
}) {
  const statusLabel =
    issueCount > 0 ? `${issueCount} missing field${issueCount === 1 ? "" : "s"}` : "Ready";

  return (
    <details
      className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-display text-xl">{title}</span>
          {summary ? <span className="block text-sm text-muted-foreground">{summary}</span> : null}
        </span>
        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${
            issueCount > 0
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {statusLabel}
        </span>
      </summary>
      <div className="mt-4 space-y-4">{children}</div>
    </details>
  );
}
