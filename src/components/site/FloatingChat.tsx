import { MessageCircle, Phone } from "lucide-react";
import { useCompanyInfo } from "@/lib/site-settings";

/**
 * Floating quick-contact stack (bottom-right).
 * ZALO(en) + ZALO(vn) + Phone — for an intro/consulting site
 * (no cart). Mobile-friendly tap targets.
 */
export function FloatingChat() {
  const COMPANY = useCompanyInfo();
  // Open Zalo profile/add-friend flow by phone number.
  // Do not append ?msg= because that can route desktop users to Zalo web login/chat.
  const zaloEn = "https://zalo.me/0911412309";
  const zaloVn = "https://zalo.me/0703321243";

  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-40 flex flex-col items-start gap-2.5 sm:bottom-6 sm:left-6">
      <a
        href={zaloEn}
        target="_blank"
        rel="noreferrer"
        aria-label="Add ZALO English contact 0911412309"
        title="Add ZALO(en): 0911412309"
        className="pointer-events-auto group flex items-center gap-2 rounded-full bg-[#0068FF] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg transition hover:scale-[1.04] hover:shadow-xl"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
          <MessageCircle className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="hidden sm:inline">ZALO(en)</span>
      </a>
      <a
        href={zaloVn}
        target="_blank"
        rel="noreferrer"
        aria-label="Add ZALO Vietnamese contact 0703321243"
        title="Add ZALO(vn): 0703321243"
        className="pointer-events-auto group flex items-center gap-2 rounded-full bg-[#0084FF] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg transition hover:scale-[1.04] hover:shadow-xl"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
          <MessageCircle className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="hidden sm:inline">ZALO(vn)</span>
      </a>
      <a
        href={`tel:${COMPANY.phoneTel}`}
        aria-label="Call us"
        className="pointer-events-auto group flex items-center gap-2 rounded-full bg-foreground px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-background shadow-lg transition hover:scale-[1.04] hover:bg-primary hover:text-primary-foreground"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
          <Phone className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="hidden sm:inline">Call</span>
      </a>
    </div>
  );
}
