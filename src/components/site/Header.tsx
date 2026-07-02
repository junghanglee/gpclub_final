import { Link } from "@tanstack/react-router";
import { Download, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import gpclubLogo from "@/assets/gpclub-logo-dark.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageToggle, useI18n } from "@/lib/i18n";

const mainNav = [
  { to: "/brand", key: "nav.brand" as const },
  { to: "/products", key: "nav.products" as const },
  { to: "/gippy-ai", key: "nav.gippyAi" as const },
  { to: "/events", key: "nav.events" as const },
  { to: "/b2b", key: "nav.b2b" as const },
  { to: "/contact", key: "nav.contact" as const },
] as const;

const allNav = [{ to: "/", key: "nav.home" as const }, ...mainNav] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "sticky top-0 z-40 border-b transition-all duration-300 " +
        (scrolled
          ? "border-border/80 bg-background/85 backdrop-blur-md shadow-soft"
          : "border-transparent bg-background")
      }
    >
      <div
        className={
          "mx-auto flex max-w-[1400px] items-center gap-6 px-4 sm:px-6 lg:px-10 transition-all duration-300 " +
          (scrolled ? "h-14" : "h-20")
        }
      >
        {/* Mobile menu */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="mt-8 flex flex-col gap-1">
                {allNav.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    activeProps={{ className: "text-primary" }}
                    className="rounded-sm px-3 py-3 text-base font-bold uppercase tracking-[0.12em] text-foreground hover:bg-secondary"
                  >
                    {t(n.key)}
                  </Link>
                ))}
                <div className="mt-4 px-3">
                  <LanguageToggle />
                </div>
                <Button
                  asChild
                  className="mt-4 rounded-none bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link to="/catalog" onClick={() => setOpen(false)}>
                    Catalog Download
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo (left) */}
        <Link
          to="/"
          className="flex items-center transition-transform duration-300 hover:scale-[1.03]"
          aria-label="GPCLUB Vietnam home"
        >
          <img
            src={gpclubLogo}
            alt="GPCLUB"
            className={
              "w-auto select-none transition-all duration-300 " +
              (scrolled ? "h-6 md:h-7" : "h-8 md:h-9")
            }
            draggable={false}
          />
        </Link>

        {/* Desktop nav */}
        <nav className="ml-8 hidden flex-1 items-center gap-8 lg:flex">
          {mainNav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeProps={{ className: "text-primary" }}
              className="nav-link text-[13px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:text-primary"
            >
              {t(n.key)}
            </Link>
          ))}
        </nav>

        {/* Right icons */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageToggle />
          </div>
          <Link
            to="/catalog"
            aria-label="Product catalog download"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-3 text-xs font-black uppercase tracking-[0.12em] text-primary transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Download className="h-[16px] w-[16px]" strokeWidth={1.8} />
            <span className="hidden sm:inline">Catalog</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
