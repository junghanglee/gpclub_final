import { AdminImageUploader } from "@/components/admin/admin-image-uploader";
import {
  type CmsContentLang,
  type CmsLocalizedText,
  LocalizedTextField,
} from "@/components/admin/cms-form-fields";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type CmsImageAsset = {
  url: string;
  alt: CmsLocalizedText;
  enabled?: boolean;
};

export function CmsMediaField({
  label,
  value,
  onChange,
  uploadPrefix,
  contentLang,
  compareMode,
  imageAltLabel,
  imageDetailsLabel,
  imageDetailsHint,
  uploadHint,
  clearLabel,
  chooseLabel,
  uploadingLabel,
  fallbackPreviewUrl,
  enabledLabel,
  disabledHint,
}: {
  label: string;
  value: CmsImageAsset;
  onChange: (value: CmsImageAsset) => void;
  uploadPrefix: string;
  contentLang: CmsContentLang;
  compareMode: boolean;
  imageAltLabel: string;
  imageDetailsLabel: string;
  imageDetailsHint: string;
  uploadHint?: string;
  clearLabel: string;
  chooseLabel: string;
  uploadingLabel: string;
  fallbackPreviewUrl?: string;
  enabledLabel?: string;
  disabledHint?: string;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-background/50 p-4">
      {typeof value.enabled === "boolean" && enabledLabel ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/20 p-3">
          <div>
            <Label htmlFor={`${uploadPrefix}-enabled`}>{enabledLabel}</Label>
            {!value.enabled && disabledHint ? (
              <p className="mt-1 text-xs text-muted-foreground">{disabledHint}</p>
            ) : null}
          </div>
          <Switch
            id={`${uploadPrefix}-enabled`}
            checked={value.enabled}
            onCheckedChange={(enabled) => onChange({ ...value, enabled })}
          />
        </div>
      ) : null}
      <AdminImageUploader
        label={label}
        value={value.url}
        onChange={(url) => onChange({ ...value, url })}
        uploadPrefix={uploadPrefix}
        previewAlt={value.alt.en || value.alt.vi || label}
        fallbackPreviewUrl={fallbackPreviewUrl}
        hint={uploadHint}
        clearLabel={clearLabel}
        chooseLabel={chooseLabel}
        uploadingLabel={uploadingLabel}
      />
      <details className="rounded-xl border border-border/60 bg-muted/20 p-3">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
          {imageDetailsLabel}
        </summary>
        <div className="mt-3 space-y-2">
          <LocalizedTextField
            activeLang={contentLang}
            compareMode={compareMode}
            label={imageAltLabel}
            value={value.alt}
            onChange={(alt) => onChange({ ...value, alt })}
          />
          <p className="text-xs text-muted-foreground">{imageDetailsHint}</p>
        </div>
      </details>
    </div>
  );
}
