import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type B2BInquiryInsert = Database["public"]["Tables"]["b2b_inquiries"]["Insert"];

export type B2BInquiryProduct = {
  brandName: string;
  productName: string;
  productType?: string;
  imageUrl?: string;
};

type B2BInquiryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: B2BInquiryProduct | null;
  source?: string;
  defaultMessage?: string;
  title?: string;
  description?: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Please try again later.";
}

export function B2BInquiryDialog({
  open,
  onOpenChange,
  product,
  source = "B2B inquiry modal",
  defaultMessage,
  title,
  description,
}: B2BInquiryDialogProps) {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    message: defaultMessage || "",
    consent: false,
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDone(false);
      setForm((prev) => ({
        ...prev,
        message: prev.message || defaultMessage || "",
      }));
    }
    onOpenChange(nextOpen);
  };

  const submitInquiry = async () => {
    if (submitting) return;
    const name = form.name.trim();
    const email = form.email.trim();
    const company = form.company.trim();
    if (name.length < 2 || !email.includes("@") || company.length < 2 || !form.consent) {
      toast.error("Please complete the required fields", {
        description: "Name, email, company and privacy consent are required.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const messageParts = product
        ? [
            `[Product inquiry] ${product.brandName} - ${product.productName}`,
            product.productType ? `[Product type] ${product.productType}` : "",
            form.message.trim(),
          ]
        : [`[General B2B inquiry] ${source}`, form.message.trim()];

      const payload: B2BInquiryInsert = {
        company,
        position: source,
        city: "—",
        channel: product ? "Product B2B inquiry" : "Website B2B inquiry",
        monthly_volume: "—",
        brands: product?.brandName || "General partnership",
        name,
        email,
        phone: "—",
        message: messageParts.filter(Boolean).join("\n\n"),
      };
      const { error } = await supabase.from("b2b_inquiries").insert(payload);
      if (error) throw error;
      setDone(true);
      toast.success("B2B inquiry received", {
        description: "GPCLUB Vietnam will review your inquiry and reply within 24 hours.",
      });
    } catch (e: unknown) {
      toast.error("Send failed", { description: getErrorMessage(e) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
        <div className="bg-gradient-luxe px-6 py-6">
          <DialogHeader>
            <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <Send className="h-3.5 w-3.5" /> B2B Inquiry
            </div>
            <DialogTitle className="text-2xl font-black leading-tight md:text-3xl">
              {done
                ? "Inquiry received"
                : title || "Register B2B inquiry without leaving this page"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-foreground/70">
              {description ||
                (product
                  ? `${product.brandName} · ${product.productName}`
                  : "Send a partnership request while continuing to read this page.")}
            </DialogDescription>
          </DialogHeader>
        </div>

        {done ? (
          <div className="p-6">
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-black">
                Thank you. Your inquiry has been submitted.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                GPCLUB Vietnam will review your company information and business request. A
                partnership consultant will reply within 24 hours by email.
              </p>
              <div className="mt-5 grid gap-2 rounded-2xl bg-background p-4 text-left text-sm">
                <div className="font-bold text-foreground">What happens next?</div>
                <div className="text-muted-foreground">1. Channel and business fit review</div>
                <div className="text-muted-foreground">
                  2. Wholesale / reseller discussion by email
                </div>
                <div className="text-muted-foreground">
                  3. Follow-up proposal or consultation schedule
                </div>
              </div>
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="mt-6 rounded-full px-7"
              >
                Continue browsing
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {product ? (
              <div className="flex gap-4 rounded-3xl border bg-card p-4">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.productName}
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                ) : null}
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{product.brandName}</Badge>
                    {product.productType ? (
                      <Badge variant="outline">{product.productType}</Badge>
                    ) : null}
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm font-bold">{product.productName}</div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    This product will be attached to the inquiry automatically.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="b2b-inq-name">Full name *</Label>
                <Input
                  id="b2b-inq-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  maxLength={80}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b2b-inq-email">Email *</Label>
                <Input
                  id="b2b-inq-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@company.com"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="b2b-inq-company">Company / sales channel *</Label>
                <Input
                  id="b2b-inq-company"
                  value={form.company}
                  onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name, store, marketplace or distribution channel"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="b2b-inq-message">Request details</Label>
                <Textarea
                  id="b2b-inq-message"
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Expected volume, target market, wholesale/reseller request, or questions."
                  maxLength={1000}
                  className="min-h-[120px]"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4 text-sm leading-6">
              <Checkbox
                checked={form.consent}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, consent: checked === true }))
                }
                className="mt-1"
              />
              <span className="text-muted-foreground">
                I consent to GPCLUB Vietnam collecting and using my name, email and company
                information to review and respond to this B2B inquiry.
              </span>
            </label>

            <div className="rounded-2xl bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
              <strong className="text-foreground">Customer guidance:</strong> After submission, the
              GPCLUB Vietnam partnership team will contact you by email within 24 hours with product
              consultation, wholesale/reseller guidance, or next-step questions.
            </div>

            <Button
              type="button"
              onClick={submitInquiry}
              disabled={submitting}
              className="h-12 w-full rounded-full text-sm font-bold"
            >
              {submitting ? "Sending inquiry..." : "Submit B2B inquiry"}{" "}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
