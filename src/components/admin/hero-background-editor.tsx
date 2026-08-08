import { Monitor, Smartphone } from "lucide-react";
import { AdminImageUploader } from "@/components/admin/admin-image-uploader";
import type { PageHeroBackground } from "@/lib/page-content";

type HeroBackgroundEditorProps = {
  value: PageHeroBackground;
  onChange: (value: PageHeroBackground) => void;
  pageKey: string;
};

export function HeroBackgroundEditor({ value, onChange, pageKey }: HeroBackgroundEditorProps) {
  return (
    <div className="space-y-4 border-t border-border/60 pt-5">
      <div>
        <h3 className="text-sm font-semibold">Hero background images</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Upload separate backgrounds for desktop and mobile. These images fill the hero area behind
          the content; the current design remains when both fields are empty.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
            <Monitor className="h-4 w-4" /> Desktop recommendation: 1920 x 900 px (16:7.5)
          </div>
          <AdminImageUploader
            label="Desktop hero background"
            value={value.desktopUrl}
            onChange={(desktopUrl) => onChange({ ...value, desktopUrl })}
            uploadPrefix={`page-content/hero-background/${pageKey}/desktop`}
            previewAlt="Desktop hero background preview"
            hint="JPG, PNG or WebP. Keep important subjects near the center and allow space for text."
            clearLabel="Remove desktop background"
            chooseLabel="Choose desktop image"
            uploadingLabel="Uploading desktop image..."
          />
        </div>
        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-foreground">
            <Smartphone className="h-4 w-4" /> Mobile recommendation: 1080 x 1440 px (3:4)
          </div>
          <AdminImageUploader
            label="Mobile hero background"
            value={value.mobileUrl}
            onChange={(mobileUrl) => onChange({ ...value, mobileUrl })}
            uploadPrefix={`page-content/hero-background/${pageKey}/mobile`}
            previewAlt="Mobile hero background preview"
            hint="JPG, PNG or WebP. Use a portrait crop and keep the focal point away from text."
            clearLabel="Remove mobile background"
            chooseLabel="Choose mobile image"
            uploadingLabel="Uploading mobile image..."
          />
        </div>
      </div>
    </div>
  );
}
