import type { PageHeroBackground } from "@/lib/page-content";

export function HeroBackground({ background }: { background: PageHeroBackground }) {
  const desktopUrl = background.desktopUrl || background.mobileUrl;
  const mobileUrl = background.mobileUrl || background.desktopUrl;

  if (!desktopUrl) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileUrl} />
        <img
          src={desktopUrl}
          alt=""
          loading="eager"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      </picture>
      <div className="absolute inset-0 bg-background/75 md:bg-background/68" />
    </div>
  );
}
