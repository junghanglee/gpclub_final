import { Link } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone, Facebook, Instagram, Music2 } from "lucide-react";
import { useCompanyInfo, buildZaloLink } from "@/lib/site-settings";
import gpclubLogo from "@/assets/gpclub-logo-dark.png";
import { useI18n } from "@/lib/i18n";

const ZALO_EN_PHONE = "0911412309";
const ZALO_VN_PHONE = "0703321243";
const ZALO_VN_DISPLAY = "070 332 1243";

export function Footer() {
  const COMPANY = useCompanyInfo();
  const { t, lang } = useI18n();
  const zaloVnLink = () => buildZaloLink(ZALO_VN_PHONE);
  const zaloEnLink = () => buildZaloLink(ZALO_EN_PHONE);
  return (
    <footer className="mt-24 border-t border-border bg-background">
      {/* Top hot-pink ribbon (AHC-style accent) */}
      <div className="bg-primary py-3">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 text-[12px] font-bold uppercase tracking-[0.18em] text-primary-foreground sm:px-6 lg:px-10">
          <span>{t("footer.ribbon")}</span>
          <Link to="/b2b" className="underline-offset-4 hover:underline">
            {t("footer.ribbonCTA")}
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-10">
        <div className="md:col-span-2">
          <img src={gpclubLogo} alt="GPCLUB" className="h-9 w-auto select-none" draggable={false} />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            {lang === "vi"
              ? "Nền tảng đối tác chính thức cho JMsolution, Jmella và Trois Touch tại Việt Nam — hỗ trợ nguồn hàng, bán sỉ và tăng trưởng kênh phân phối."
              : "Official partner platform for JMsolution, Jmella and Trois Touch in Vietnam — supporting supply, wholesale and channel growth."}
          </p>
          <dl className="mt-6 space-y-2 text-[12px] leading-relaxed text-muted-foreground">
            <div className="flex gap-2">
              <dt className="min-w-[110px] font-semibold text-foreground">{t("footer.company")}</dt>
              <dd>{COMPANY.legalName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[110px] font-semibold text-foreground">{t("footer.taxCode")}</dt>
              <dd>{COMPANY.taxCode}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[110px] font-semibold text-foreground">
                {t("footer.representative")}
              </dt>
              <dd>{COMPANY.representative}</dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="mt-0.5 min-w-[110px] font-semibold text-foreground">
                <MapPin className="inline h-3.5 w-3.5" /> {t("footer.address")}
              </dt>
              <dd>{COMPANY.address}</dd>
            </div>
          </dl>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
            {t("footer.explore")}
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <Link to="/brand" className="hover:text-primary">
                {lang === "vi" ? "Hồ sơ thương hiệu" : "Brand Profiles"}
              </Link>
            </li>
            <li>
              <Link to="/products" className="hover:text-primary">
                {lang === "vi" ? "Sản phẩm" : "Products"}
              </Link>
            </li>
            <li>
              <Link to="/b2b" className="hover:text-primary">
                {lang === "vi" ? "Yêu cầu B2B" : "B2B Inquiry"}
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                {lang === "vi" ? "Liên hệ" : "Contact"}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
            {t("footer.connect")}
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <a
                href={zaloVnLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" /> Zalo VN
              </a>
            </li>
            <li>
              <a
                href={zaloEnLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" /> Zalo EN
              </a>
            </li>
            <li>
              <a
                href={`mailto:${COMPANY.email}`}
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <Mail className="h-4 w-4" /> {COMPANY.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${ZALO_VN_PHONE}`}
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <Phone className="h-4 w-4" /> {ZALO_VN_DISPLAY}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Brand social channels */}
      <div className="border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-10">
          <SocialBlock
            brand="Jmella Vietnam"
            facebook="https://www.facebook.com/share/18aaeXRVWN/?mibextid=wwXIfr"
            instagram="https://www.instagram.com/jmella.vn?igsh=MTkwZm90N2x1dXI1dw=="
            tiktok="https://www.tiktok.com/@jmellavn_official?lang=vi-VN"
          />
          <SocialBlock
            brand="JMsolution Vietnam"
            facebook="https://www.facebook.com/share/1aSGGcEqEU/?mibextid=wwXIfr"
            instagram="https://www.instagram.com/jmsolution.vn?igsh=M200a2VuMGEzb3Y5"
            tiktok="https://www.tiktok.com/@jmsolutionvn_official?lang=vi-VN"
          />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-4 py-6 text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:px-6 lg:px-10">
          <div>
            © {new Date().getFullYear()} GPCLUB Vietnam.{" "}
            {lang === "vi" ? "Đã đăng ký bản quyền." : "All rights reserved."}
          </div>
          <div>JMsolution - Jmella - Trois Touch</div>
        </div>
      </div>

      <div className="border-t border-border bg-secondary">
        <div className="mx-auto flex max-w-[1400px] items-center justify-end px-4 py-3 sm:px-6 lg:px-10">
          <Link
            to="/admin"
            className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-primary"
          >
            Admin Portal →
          </Link>
        </div>
      </div>
    </footer>
  );
}

function SocialBlock({
  brand,
  facebook,
  instagram,
  tiktok,
}: {
  brand: string;
  facebook: string;
  instagram: string;
  tiktok: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">
        {brand}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SocialBtn href={facebook} label="Facebook">
          <Facebook className="h-4 w-4" />
        </SocialBtn>
        <SocialBtn href={instagram} label="Instagram">
          <Instagram className="h-4 w-4" />
        </SocialBtn>
        <SocialBtn href={tiktok} label="TikTok">
          <Music2 className="h-4 w-4" />
        </SocialBtn>
      </div>
    </div>
  );
}

function SocialBtn({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary"
    >
      {children}
      <span>{label}</span>
    </a>
  );
}
