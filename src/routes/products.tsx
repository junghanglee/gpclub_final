import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Search, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import gippyProductsHero from "@/assets/gippy-products-hero.png";
import { B2BInquiryDialog } from "@/components/site/B2BInquiryDialog";
import {
  HeroCopySkeleton,
  ProductCardSkeletonGrid,
  ProductImageSkeleton,
} from "@/components/site/SectionSkeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  type CatalogProduct,
  fetchPublishedCatalogProductById,
  getCoverImage,
  productSearchText,
  useCatalogProducts,
  usePublishedCatalogBrandSummaries,
} from "@/lib/catalog-products";
import { useI18n } from "@/lib/i18n";
import { usePageContent } from "@/lib/page-content";
import { sanitizeProductDetailHtml } from "@/lib/product-detail-html";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products - JMsolution, Jmella & Trois Touch | GPCLUB Vietnam" },
      {
        name: "description",
        content:
          "Review GPCLUB Vietnam product lineup for wholesale, reseller and B2B distribution opportunities.",
      },
      { property: "og:title", content: "K-Beauty Products — GPCLUB Vietnam" },
      {
        property: "og:description",
        content: "JMsolution, Jmella and Trois Touch B2B products.",
      },
    ],
  }),
  component: ProductsPage,
});

const productText = {
  vi: {
    products: "Products",
    introLink: "gửi yêu cầu B2B",
    introB: ".",
    search: "Search products, brands, product types...",
    empty: "Không có sản phẩm phù hợp với bộ lọc.",
    all: "Tất cả",
    allBrands: "Tất cả thương hiệu",
    new: "New",
    popular: "Popular",
    featured: "Featured",
    details: "Xem chi tiết",
    totalRegistered: "Tổng sản phẩm đã đăng",
    showing: "Đang hiển thị",
    brandFilter: "Thương hiệu",
    typeFilter: "Loại sản phẩm",
  },
  en: {
    products: "Products",
    introLink: "start a B2B inquiry",
    introB: ".",
    search: "Search products, brands, product types...",
    empty: "No products match your filters.",
    all: "All",
    allBrands: "All brands",
    new: "New",
    popular: "Popular",
    featured: "Featured",
    details: "View details",
    totalRegistered: "Total registered",
    showing: "Showing",
    brandFilter: "Brand",
    typeFilter: "Product type",
  },
};

const INITIAL_PRODUCT_COUNT = 8;
const PRODUCT_BATCH_SIZE = 16;

function ProductsPage() {
  const { lang } = useI18n();
  const { content: page, loading: pageLoading } = usePageContent("products");
  const t = productText[lang];
  const [brand, setBrand] = useState("All");
  const selectedBrandId = brand === "All" ? undefined : brand;
  const { rows, loading } = useCatalogProducts({
    limit: 0,
    brandId: selectedBrandId,
  });
  const { rows: brandSummaries, loading: brandsLoading } = usePublishedCatalogBrandSummaries();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [visibleCount, setVisibleCount] = useState(INITIAL_PRODUCT_COUNT);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CatalogProduct | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const totalPublishedProducts = useMemo(
    () => brandSummaries.reduce((total, item) => total + item.count, 0),
    [brandSummaries],
  );

  const selectedBrandName = useMemo(() => {
    if (brand === "All") return t.allBrands;
    return brandSummaries.find((item) => item.id === brand)?.name ?? brand;
  }, [brand, brandSummaries, t.allBrands]);

  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(rows.map((p) => p.product_type.trim()).filter(Boolean)));
    return ["All", ...types.sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    rows.forEach((p) => counts.set(p.product_type, (counts.get(p.product_type) || 0) + 1));
    return counts;
  }, [rows]);

  const filtered = useMemo(() => {
    const normalizedQuery = q.trim().toLowerCase();
    return rows.filter((p) => {
      if (cat !== "All" && p.product_type !== cat) return false;
      if (normalizedQuery && !productSearchText(p).includes(normalizedQuery)) return false;
      return true;
    });
  }, [rows, q, cat]);

  useEffect(() => {
    setVisibleCount(INITIAL_PRODUCT_COUNT);
  }, [q, cat, brand]);

  useEffect(() => {
    if (!selected?.id) {
      setSelectedDetail(null);
      setDetailLoading(false);
      return;
    }

    let active = true;
    setSelectedDetail(null);
    setDetailLoading(true);

    fetchPublishedCatalogProductById(selected.id)
      .then((detail) => {
        if (active) setSelectedDetail(detail);
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selected?.id]);

  useEffect(() => {
    if (loading) return;
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisibleCount((current) => Math.min(current + PRODUCT_BATCH_SIZE, filtered.length));
      },
      { rootMargin: "720px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [filtered.length, loading]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMoreProducts = visibleProducts.length < filtered.length;
  const dialogProduct = selectedDetail ?? selected;

  const showProductShells = loading && filtered.length === 0;

  const openInquiry = () => {
    if (!selected) return;
    setInquiryOpen(true);
  };

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/60 bg-gradient-luxe">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-36 right-[-12%] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-accent/50 blur-3xl"
        />
        <div className="relative mx-auto grid min-h-[560px] max-w-[1200px] items-center gap-12 px-4 py-20 sm:min-h-[620px] sm:px-6 md:py-28 lg:min-h-[640px] lg:grid-cols-12 lg:px-10">
          <div className="text-center lg:col-span-7 lg:text-left">
            {pageLoading ? (
              <HeroCopySkeleton />
            ) : (
              <>
                <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
                  {page.kicker[lang]}
                </div>
                <h1 className="mt-5 font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
                  {page.title[lang]}{" "}
                  <span className="bg-gradient-pink bg-clip-text text-transparent">
                    {page.highlight[lang]}
                  </span>
                </h1>
                <p className="mx-auto mt-8 max-w-2xl text-[16px] leading-relaxed text-foreground/75 lg:mx-0">
                  {page.description[lang]}{" "}
                  <Link
                    to="/b2b"
                    className="font-bold text-primary underline-offset-4 hover:underline"
                  >
                    {page.primaryCta[lang] || t.introLink}
                  </Link>
                  {t.introB}
                </p>
              </>
            )}
          </div>
          <div className="flex justify-center lg:col-span-5 lg:justify-end">
            <img
              src={gippyProductsHero}
              alt="Gippy AI product consultant mascot holding cosmetics"
              loading="eager"
              decoding="async"
              className="aspect-[3/4] max-h-[414px] w-full max-w-[311px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border/60 bg-card p-4 shadow-soft">
          {loading || brandsLoading ? (
            <ProductFilterSkeleton />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_1fr] lg:items-start">
              <div className="space-y-3 lg:col-span-3">
                <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-foreground">
                  <span>
                    {t.totalRegistered}:{" "}
                    <span className="text-primary">{totalPublishedProducts}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {t.showing}: {filtered.length}
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    {selectedBrandName}
                  </span>
                </div>
                <BrandChipFilter
                  allLabel={`${t.allBrands} (${totalPublishedProducts})`}
                  selected={brand}
                  onSelect={setBrand}
                  brands={brandSummaries.map((item) => ({
                    value: item.id,
                    label: `${item.name} (${item.count})`,
                  }))}
                />
              </div>
              <ProductRadixFilter
                ariaLabel={t.typeFilter}
                value={cat}
                onValueChange={setCat}
                options={typeOptions.map((c) => ({
                  value: c,
                  label:
                    c === "All" ? `${t.all} (${rows.length})` : `${c} (${typeCounts.get(c) || 0})`,
                }))}
              />
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t.search}
                  maxLength={60}
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {showProductShells ? (
          <ProductCardSkeletonGrid count={INITIAL_PRODUCT_COUNT} />
        ) : filtered.length === 0 ? (
          <ProductEmptyGrid message={t.empty} />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((p) => (
              <ProductCard key={p.id} product={p} labels={t} onSelect={setSelected} />
            ))}
          </div>
        )}
        {hasMoreProducts ? (
          <div ref={loadMoreRef} className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-6"
              onClick={() =>
                setVisibleCount((current) =>
                  Math.min(current + PRODUCT_BATCH_SIZE, filtered.length),
                )
              }
            >
              Load more products
            </Button>
          </div>
        ) : null}
      </section>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="grid h-[min(90vh,calc(100vh-2rem))] max-w-5xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0">
          {dialogProduct ? (
            <>
              <div className="border-b bg-gradient-luxe px-6 py-5">
                <DialogHeader>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {dialogProduct.brand_display_name || dialogProduct.brand_name}
                    </Badge>
                    <Badge variant="outline">{dialogProduct.product_type}</Badge>
                  </div>
                  <DialogTitle className="pr-8 text-2xl leading-tight md:text-3xl">
                    {dialogProduct.product_name}
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed text-foreground/70">
                    {dialogProduct.short_intro}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="min-h-0 overflow-y-auto overscroll-contain p-6">
                <div className="grid min-h-0 gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
                  <aside className="space-y-4">
                    {getCoverImage(dialogProduct) ? (
                      <ModalProductImage
                        src={getCoverImage(dialogProduct) || ""}
                        alt={dialogProduct.product_name}
                      />
                    ) : (
                      <div className="aspect-square w-full overflow-hidden rounded-3xl border bg-muted shadow-soft">
                        <ProductImageSkeleton />
                      </div>
                    )}
                    <div className="rounded-2xl border bg-muted/25 p-4">
                      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        Product summary
                      </div>
                      <dl className="grid gap-3 text-sm">
                        <div>
                          <dt className="font-semibold text-foreground">Brand</dt>
                          <dd className="text-muted-foreground">
                            {dialogProduct.brand_display_name || dialogProduct.brand_name}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-foreground">Category</dt>
                          <dd className="text-muted-foreground">{dialogProduct.product_type}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dialogProduct.is_new ? <Badge>{t.new}</Badge> : null}
                      {dialogProduct.is_popular ? (
                        <Badge variant="secondary">{t.popular}</Badge>
                      ) : null}
                      {dialogProduct.is_featured ? (
                        <Badge variant="outline">{t.featured}</Badge>
                      ) : null}
                    </div>
                  </aside>
                  <div className="min-w-0 space-y-5">
                    {detailLoading ? (
                      <ProductDetailLoadingState />
                    ) : dialogProduct.detail_html ? (
                      <div
                        className="space-y-4 text-sm leading-7 text-foreground/80 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-black [&_h3]:text-foreground [&_li]:mb-1.5 [&_section]:rounded-2xl [&_section]:border [&_section]:bg-card [&_section]:p-5 [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeProductDetailHtml(dialogProduct.detail_html),
                        }}
                      />
                    ) : (
                      <div className="rounded-2xl border bg-card p-5 text-sm leading-7 text-muted-foreground">
                        {dialogProduct.short_intro}
                      </div>
                    )}
                    {!detailLoading && dialogProduct.conditions?.filter((c) => c.visible).length ? (
                      <div className="rounded-2xl border bg-card p-5">
                        <h3 className="mb-3 text-lg font-black">Additional information</h3>
                        <div className="grid gap-2 text-sm">
                          {dialogProduct.conditions
                            .filter((c) => c.visible)
                            .map((c, idx) => (
                              <div
                                key={`${c.label}-${idx}`}
                                className="flex justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                              >
                                <span className="font-semibold">{c.label}</span>
                                <span className="text-right text-muted-foreground">{c.value}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-5 text-center md:text-left">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-black text-foreground">
                        Interested in this product?
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Send a B2B inquiry to GPCLUB Vietnam and discuss wholesale, reseller or
                        distribution opportunities.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={openInquiry}
                      className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-primary/90"
                    >
                      Register B2B inquiry <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <B2BInquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        product={
          selected
            ? {
                brandName: selected.brand_display_name || selected.brand_name,
                productName: selected.product_name,
                productType: selected.product_type,
                imageUrl: getCoverImage(selected) || undefined,
              }
            : null
        }
        source="Product detail popup"
        defaultMessage={
          selected
            ? `I am interested in B2B opportunities for ${selected.brand_display_name || selected.brand_name} - ${selected.product_name}.`
            : ""
        }
        title="Register B2B inquiry without leaving this product"
      />
    </>
  );
}

function BrandChipFilter({
  allLabel,
  selected,
  onSelect,
  brands,
}: {
  allLabel: string;
  selected: string;
  onSelect: (value: string) => void;
  brands: Array<{ value: string; label: string }>;
}) {
  const options = [{ value: "All", label: allLabel }, ...brands];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Brand filter">
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            aria-pressed={active}
            onClick={() => onSelect(option.value)}
            className="h-9 rounded-full px-4 text-xs font-bold"
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}

function ProductEmptyGrid({ message }: { message: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-dashed border-border bg-card text-left"
        >
          <div className="relative aspect-square overflow-hidden bg-muted">
            <ProductImageSkeleton />
          </div>
          <div className="p-4">
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductCard({
  product,
  labels,
  onSelect,
}: {
  product: CatalogProduct;
  labels: (typeof productText)["en"];
  onSelect: (product: CatalogProduct) => void;
}) {
  const coverImage = getCoverImage(product);

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={`group overflow-hidden rounded-2xl border bg-card text-left transition hover:-translate-y-1 hover:shadow-soft ${
        product.is_featured ? "border-primary/50 ring-2 ring-primary/10" : "border-border/60"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {coverImage ? (
          <LazyProductImage src={coverImage} alt={product.product_name} />
        ) : (
          <ProductImageSkeleton />
        )}
        <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1">
          <Badge className="max-w-full truncate bg-card text-foreground shadow-soft ring-1 ring-border/70">
            {product.brand_display_name || product.brand_name}
          </Badge>
          {product.is_new ? (
            <Badge className="gap-1 bg-primary text-primary-foreground">
              <Sparkles className="h-3 w-3" />
              {labels.new}
            </Badge>
          ) : null}
          {product.is_popular ? (
            <Badge className="gap-1 bg-foreground text-background">
              <Star className="h-3 w-3" />
              {labels.popular}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-[10px] font-semibold uppercase tracking-widest text-gold">
            {product.brand_display_name || product.brand_name}
          </div>
          <Badge variant="secondary" className="max-w-[45%] truncate text-[10px]">
            {product.product_type}
          </Badge>
        </div>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium">{product.product_name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.short_intro}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-primary">
          {labels.details} <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  );
}

function LazyProductImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded ? <ProductImageSkeleton /> : null}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}

function ModalProductImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl border bg-muted shadow-soft">
      {loaded ? null : <ProductImageSkeleton />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

function ProductDetailLoadingState() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-4 h-5 w-40 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
        <div className="space-y-3">
          <div className="h-3 w-full animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
          <div className="h-3 w-11/12 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
        </div>
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-4 h-5 w-52 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
        <div className="space-y-3">
          <div className="h-3 w-full animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
          <div className="h-3 w-10/12 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
        </div>
      </div>
    </div>
  );
}

function ProductRadixFilter({
  value,
  onValueChange,
  ariaLabel,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  ariaLabel: string;
  options: Array<{ value: string; label: string }>;
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-left text-sm shadow-sm ring-offset-background transition focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 min-w-[12rem]">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProductFilterSkeleton() {
  return (
    <div
      className="grid gap-3 lg:grid-cols-[auto_180px_220px_1fr] lg:items-center"
      aria-busy="true"
    >
      <div className="h-5 w-56 animate-pulse rounded-full bg-primary/15 ring-1 ring-primary/10" />
      <div className="h-10 animate-pulse rounded-md border border-primary/10 bg-primary/10" />
      <div className="h-10 animate-pulse rounded-md border border-primary/10 bg-primary/10" />
      <div className="h-10 animate-pulse rounded-md border border-primary/10 bg-primary/10" />
    </div>
  );
}
