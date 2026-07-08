import { ExternalLink, RefreshCw } from "lucide-react";
import type { CmsContentLang } from "@/components/admin/cms-form-fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CmsPageOption<PageValue extends string> = {
  key: PageValue;
  label: string;
};

export type CmsLangOption = {
  value: CmsContentLang;
  label: string;
};

export function CmsFormShell<PageValue extends string>({
  title,
  description,
  pageLabel,
  languageLabel,
  pageOptions,
  selectedPage,
  onSelectedPageChange,
  languageOptions,
  selectedLanguage,
  onSelectedLanguageChange,
  compareMode,
  onCompareModeChange,
  compareLabel,
  editingScopeLabel,
  selectedPageLabel,
  selectedLanguageLabel,
  previewVietnameseLabel,
  previewEnglishLabel,
  onPreview,
  onReload,
  onReset,
  onSave,
  saving,
  reloadLabel,
  resetLabel,
  saveLabel,
  savingLabel,
  saveScopeLabel,
  resetScopeLabel,
  validationIssues,
}: {
  title: string;
  description: string;
  pageLabel: string;
  languageLabel: string;
  pageOptions: CmsPageOption<PageValue>[];
  selectedPage: PageValue;
  onSelectedPageChange: (value: PageValue) => void;
  languageOptions: CmsLangOption[];
  selectedLanguage: CmsContentLang;
  onSelectedLanguageChange: (value: CmsContentLang) => void;
  compareMode: boolean;
  onCompareModeChange: (value: boolean) => void;
  compareLabel: string;
  editingScopeLabel: string;
  selectedPageLabel: string;
  selectedLanguageLabel: string;
  previewVietnameseLabel: string;
  previewEnglishLabel: string;
  onPreview: (lang: CmsContentLang) => void;
  onReload: () => void;
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
  reloadLabel: string;
  resetLabel: string;
  saveLabel: string;
  savingLabel: string;
  saveScopeLabel: string;
  resetScopeLabel: string;
  validationIssues: string[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(180px,260px)_minmax(180px,240px)]">
          <div>
            <Label>{pageLabel}</Label>
            <Select
              value={selectedPage}
              onValueChange={(value) => onSelectedPageChange(value as PageValue)}
            >
              <SelectTrigger className="mt-1.5 rounded-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageOptions.map((page) => (
                  <SelectItem key={page.key} value={page.key}>
                    {page.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{languageLabel}</Label>
            <Select
              value={selectedLanguage}
              onValueChange={(value) => onSelectedLanguageChange(value as CmsContentLang)}
            >
              <SelectTrigger className="mt-1.5 rounded-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center">
          <label className="flex min-h-11 items-center gap-2 rounded-full border border-border/60 bg-background px-3 text-foreground">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={compareMode}
              onChange={(event) => onCompareModeChange(event.target.checked)}
            />
            <span>{compareLabel}</span>
          </label>
          <p>
            {editingScopeLabel}: {selectedPageLabel} / {selectedLanguageLabel}
            {compareMode ? ` / ${compareLabel}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:min-w-52">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => onPreview("vi")}
            className="rounded-full px-3"
            type="button"
          >
            <ExternalLink className="mr-1 h-4 w-4" />
            {previewVietnameseLabel}
          </Button>
          <Button
            variant="outline"
            onClick={() => onPreview("en")}
            className="rounded-full px-3"
            type="button"
          >
            <ExternalLink className="mr-1 h-4 w-4" />
            {previewEnglishLabel}
          </Button>
        </div>
        <Button variant="outline" onClick={onReload} className="rounded-full">
          <RefreshCw className="mr-1 h-4 w-4" /> {reloadLabel}
        </Button>
        <Button variant="outline" onClick={onReset} className="rounded-full">
          {resetLabel}
        </Button>
        <Button onClick={onSave} disabled={saving} className="rounded-full">
          {saving ? savingLabel : saveLabel}
        </Button>
        <p className="text-xs text-muted-foreground">
          {saveScopeLabel}: {selectedPageLabel} / {selectedLanguageLabel}
        </p>
        <p className="text-xs text-muted-foreground">
          {resetScopeLabel}: {selectedPageLabel} / {selectedLanguageLabel}
        </p>
        <div
          className={`rounded-xl border px-3 py-2 text-xs ${
            validationIssues.length > 0
              ? "border-destructive/40 bg-destructive/5 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          <p className="font-medium">
            Publish checklist: {selectedLanguageLabel} {"-"}{" "}
            {validationIssues.length > 0
              ? `${validationIssues.length} missing field${validationIssues.length === 1 ? "" : "s"}`
              : "Ready"}
          </p>
          {validationIssues.length > 0 ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {validationIssues.slice(0, 4).map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
              {validationIssues.length > 4 ? (
                <li>{validationIssues.length - 4} more fields</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
