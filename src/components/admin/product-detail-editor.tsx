import {
  Bold,
  Code2,
  Eye,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Pilcrow,
  Underline,
} from "lucide-react";
import {
  forwardRef,
  type MouseEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeProductDetailHtml } from "@/lib/product-detail-html";
import { cn } from "@/lib/utils";

type ToolbarItem = {
  label: string;
  icon: typeof Bold;
  command: string;
  value?: string;
};

type ProductDetailEditorProps = {
  value: string | null;
  onChange: (html: string) => void;
  labelId?: string;
};

export type ProductDetailEditorHandle = {
  commit: () => string;
};

type EditorMode = "write" | "preview" | "source";

const toolbarGroups: ToolbarItem[][] = [
  [
    { label: "Paragraph", icon: Pilcrow, command: "formatBlock", value: "p" },
    { label: "Heading 2", icon: Heading2, command: "formatBlock", value: "h2" },
    { label: "Heading 3", icon: Heading3, command: "formatBlock", value: "h3" },
  ],
  [
    { label: "Bold", icon: Bold, command: "bold" },
    { label: "Italic", icon: Italic, command: "italic" },
    { label: "Underline", icon: Underline, command: "underline" },
  ],
  [
    { label: "Bullet list", icon: List, command: "insertUnorderedList" },
    { label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
  ],
];

export const ProductDetailEditor = forwardRef<ProductDetailEditorHandle, ProductDetailEditorProps>(
  function ProductDetailEditor({ value, onChange, labelId }, ref) {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastHtmlRef = useRef("");
    const draftHtmlRef = useRef("");
    const sourceDraftRef = useRef("");
    const [mode, setMode] = useState<EditorMode>("write");
    const [sourceDraft, setSourceDraft] = useState("");
    const [committedHtml, setCommittedHtml] = useState("");

    const sanitizedValue = sanitizeProductDetailHtml(value);

    useEffect(() => {
      if (!editorRef.current) return;
      if (sanitizedValue === lastHtmlRef.current) return;
      if (document.activeElement === editorRef.current) return;

      setCommittedHtml(sanitizedValue);
      setSourceDraft(sanitizedValue);
      sourceDraftRef.current = sanitizedValue;
      lastHtmlRef.current = sanitizedValue;
      draftHtmlRef.current = sanitizedValue;

      if (mode !== "write") return;
      editorRef.current.innerHTML = sanitizedValue || "<p></p>";
    }, [mode, sanitizedValue]);

    const commit = useCallback(() => {
      const raw = mode === "source" ? sourceDraftRef.current : editorRef.current?.innerHTML || "";
      const next = sanitizeProductDetailHtml(raw);

      setCommittedHtml(next);
      setSourceDraft(next);
      sourceDraftRef.current = next;
      draftHtmlRef.current = next;
      if (editorRef.current && mode !== "write") {
        editorRef.current.innerHTML = next || "<p></p>";
      }

      if (next === lastHtmlRef.current) return next;
      lastHtmlRef.current = next;
      onChange(next);
      return next;
    }, [mode, onChange]);

    useImperativeHandle(ref, () => ({ commit }), [commit]);

    const markDirty = () => {
      if (editorRef.current) {
        draftHtmlRef.current = editorRef.current.innerHTML || "";
      }
    };

    const keepEditorSelection = (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
    };

    const focusEditor = () => editorRef.current?.focus({ preventScroll: true });

    const runCommand = (command: string, commandValue?: string) => {
      focusEditor();
      document.execCommand(command, false, commandValue);
      markDirty();
    };

    const addLink = () => {
      const href = window.prompt("Paste link URL");
      if (!href) return;
      runCommand("createLink", href);
    };

    const addImage = () => {
      const src = window.prompt("Paste image URL");
      if (!src) return;
      focusEditor();
      document.execCommand("insertHTML", false, `<img src="${src}" alt="Product image" />`);
      markDirty();
    };

    const updateSource = (html: string) => {
      sourceDraftRef.current = html;
      setSourceDraft(html);
    };

    const changeMode = (nextMode: EditorMode) => {
      if (mode !== nextMode) {
        const next = commit();
        if (nextMode === "write" && editorRef.current) {
          editorRef.current.innerHTML = next || "<p></p>";
        }
      }
      setMode(nextMode);
    };

    return (
      <div className="rounded-2xl border border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-2">
          <div
            className="flex flex-wrap gap-1"
            role="toolbar"
            aria-label="Product detail formatting"
          >
            {toolbarGroups.map((group, groupIndex) => (
              <div
                key={groupIndex}
                className="flex gap-1 border-r border-border pr-1 last:border-r-0"
              >
                {group.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={item.label}
                    title={item.label}
                    disabled={mode !== "write"}
                    onMouseDown={keepEditorSelection}
                    onClick={() => runCommand(item.command, item.value)}
                  >
                    <item.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            ))}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Insert link"
              title="Insert link"
              disabled={mode !== "write"}
              onMouseDown={keepEditorSelection}
              onClick={addLink}
            >
              <Link className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Insert image"
              title="Insert image"
              disabled={mode !== "write"}
              onMouseDown={keepEditorSelection}
              onClick={addImage}
            >
              <Image className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex rounded-md border border-border p-0.5">
            {(
              [
                ["write", "Write", Pilcrow],
                ["preview", "Preview", Eye],
                ["source", "HTML", Code2],
              ] as const
            ).map(([nextMode, label, Icon]) => (
              <Button
                key={nextMode}
                type="button"
                size="sm"
                variant={mode === nextMode ? "secondary" : "ghost"}
                className="h-7 px-2"
                onClick={() => changeMode(nextMode)}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-3">
          <div
            ref={editorRef}
            role="textbox"
            aria-labelledby={labelId}
            aria-multiline="true"
            contentEditable={mode === "write"}
            suppressContentEditableWarning
            className={cn(
              "max-h-[360px] min-h-[220px] overflow-y-auto rounded-xl border border-input bg-background px-4 py-3 text-sm leading-7 outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
              "[&_a]:text-primary [&_a]:underline [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_img]:my-4 [&_img]:max-h-[320px] [&_img]:rounded-xl [&_img]:border [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6",
              mode === "write" ? "block" : "hidden",
            )}
            onInput={markDirty}
            onBlur={commit}
          />

          {mode === "preview" ? (
            <div
              className="max-h-[360px] min-h-[220px] overflow-y-auto rounded-xl border border-input bg-muted/20 px-4 py-3 text-sm leading-7 [&_a]:text-primary [&_a]:underline [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_img]:my-4 [&_img]:max-h-[320px] [&_img]:rounded-xl [&_img]:border [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6"
              dangerouslySetInnerHTML={{
                __html: sanitizeProductDetailHtml(committedHtml) || "<p>Product details</p>",
              }}
            />
          ) : null}

          {mode === "source" ? (
            <Textarea
              aria-label="Sanitized product detail HTML"
              className="max-h-[360px] min-h-[220px] overflow-y-auto font-mono text-xs"
              value={sourceDraft}
              onBlur={commit}
              onChange={(event) => updateSource(event.target.value)}
            />
          ) : null}

          <p className="mt-2 text-xs text-muted-foreground">
            Use the toolbar for headings, lists, links, and images. Saved output remains HTML and is
            sanitized before customers see it.
          </p>
        </div>
      </div>
    );
  },
);
