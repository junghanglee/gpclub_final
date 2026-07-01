import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Popup = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
};

const DISMISS_KEY = (id: string) => `gpclub.popup.dismissed.${id}`;

export function PopupHost() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (cancelled || error || !data) return;
      const eligible = data.find((p: any) => {
        if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY(p.id))) return false;
        return true;
      });
      if (eligible) {
        setPopup(eligible as Popup);
        setOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    if (popup && typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY(popup.id), "1");
    }
    setOpen(false);
  };

  if (!popup) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        {popup.image_url && (
          <img src={popup.image_url} alt="" className="aspect-video w-full object-cover" />
        )}
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{popup.title}</DialogTitle>
          </DialogHeader>
          {popup.content && (
            <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{popup.content}</p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={dismiss}>Close</Button>
            {popup.cta_url && popup.cta_label && (
              <Button asChild className="rounded-full">
                <a href={popup.cta_url} target="_blank" rel="noreferrer" onClick={dismiss}>
                  {popup.cta_label}
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
