import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { type DragEvent, type KeyboardEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_IMAGE_BUCKET = "event-media";
const ADMIN_IMAGE_ACCEPT = "image/*";

const safeFileName = (fileName: string) =>
  fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

const todayPath = () => new Date().toISOString().slice(0, 10);

type AdminImageUploaderProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  uploadPrefix: string;
  previewAlt: string;
  hint?: string;
  clearLabel?: string;
  chooseLabel?: string;
  uploadingLabel?: string;
};

export function AdminImageUploader({
  label,
  value,
  onChange,
  uploadPrefix,
  previewAlt,
  hint,
  clearLabel = "Clear image",
  chooseLabel = "Choose image",
  uploadingLabel = "Uploading...",
}: AdminImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setUploading(true);
    const path = `${uploadPrefix}/${todayPath()}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(ADMIN_IMAGE_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });
    setUploading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const { data } = supabase.storage.from(ADMIN_IMAGE_BUCKET).getPublicUrl(path);
    onChange(data.publicUrl);
  };

  const handleFile = (file?: File) => {
    if (!file) return;
    void uploadFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    inputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Input
          value={value}
          placeholder="https://..."
          onChange={(event) => onChange(event.target.value)}
        />
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-5 text-center transition ${
          dragging ? "border-primary bg-primary/5" : "border-border bg-background/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ADMIN_IMAGE_ACCEPT}
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        {value ? (
          <img
            src={value}
            alt={previewAlt || label}
            className="max-h-56 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <ImagePlus className="h-8 w-8" />
            <span>{chooseLabel}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={uploading}>
            <UploadCloud className="mr-1.5 h-4 w-4" />
            {uploading ? uploadingLabel : chooseLabel}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {clearLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
