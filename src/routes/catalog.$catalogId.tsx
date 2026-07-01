import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCoverImage, useCatalogProducts, type CatalogProduct } from "@/lib/catalog-products";
import { fetchCatalogById, sortCatalogProducts, type ProductCatalog } from "@/lib/product-catalogs";

export const Route = createFileRoute("/catalog/$catalogId")({
  head: () => ({
    meta: [
      { title: "GPCLUB Vietnam Product Catalog" },
      { name: "description", content: "Printable GPCLUB Vietnam product catalog." },
    ],
  }),
  component: CatalogPdfPage,
});

function CatalogPdfPage() {
  const { catalogId } = Route.useParams();
  const { rows: products, loading: productsLoading } = useCatalogProducts();
  const [catalog, setCatalog] = useState<ProductCatalog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchCatalogById(catalogId)
      .then((data) => alive && setCatalog(data))
      .catch(() => alive && setCatalog(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [catalogId]);

  const catalogProducts = useMemo(() => sortCatalogProducts(catalog, products), [catalog, products]);

  if (loading || productsLoading) {
    return <div className="min-h-screen bg-white p-10 text-sm text-slate-500">Loading catalog...</div>;
  }

  if (!catalog) {
    return <div className="min-h-screen bg-white p-10 text-sm text-slate-500">Catalog not found.</div>;
  }

  return (
    <main className="min-h-screen bg-[#f6efe9] text-slate-950 print:bg-white">
      <style>{printStyles}</style>
      <div className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.28em] text-pink-600">PDF Catalog Preview</div>
            <div className="text-sm text-slate-500">Click download, then choose Save as PDF.</div>
          </div>
          <Button onClick={() => window.print()} className="rounded-none bg-slate-950 text-white hover:bg-pink-600">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <section className="catalog-page mx-auto max-w-6xl bg-white shadow-2xl print:shadow-none">
        <CatalogCover catalog={catalog} products={catalogProducts} />
        <CatalogProductsSection catalog={catalog} products={catalogProducts} />
      </section>
    </main>
  );
}

function CatalogProductsSection({ catalog, products }: { catalog: ProductCatalog; products: CatalogProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="catalog-section px-8 py-10 print:px-0 print:py-0">
        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No products selected for this catalog.
        </div>
      </div>
    );
  }
  if (catalog.template === "compact") {
    return (
      <div className="catalog-section grid gap-3 px-8 py-10 print:grid-cols-2 print:gap-2 print:px-0 print:py-0">
        {products.map((product, index) => <CompactProductRow key={product.id} product={product} index={index} />)}
      </div>
    );
  }
  if (catalog.template === "lineup") {
    return (
      <div className="catalog-section grid gap-4 px-8 py-10 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-3 print:px-0 print:py-0">
        {products.map((product, index) => <LineupProductCard key={product.id} product={product} index={index} />)}
      </div>
    );
  }
  return (
    <div className="catalog-section grid gap-6 px-8 py-10 md:grid-cols-2 print:grid-cols-2 print:px-0 print:py-0">
      {products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
    </div>
  );
}

function CatalogCover({ catalog, products }: { catalog: ProductCatalog; products: CatalogProduct[] }) {
  const heroProduct = products[0];
  const heroImage = heroProduct ? getCoverImage(heroProduct) : "";

  return (
    <section className="catalog-cover relative isolate grid min-h-[820px] overflow-hidden bg-[#151014] text-white md:grid-cols-2 print:min-h-[980px] print:grid-cols-2">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.45),transparent_34%),linear-gradient(135deg,#120e11,#2a1622_55%,#f7b6c9)]" />
      <div className="flex flex-col justify-between p-10 md:p-14 print:p-12">
        <div>
          <div className="inline-flex items-center gap-2 border-b border-white/40 pb-2 text-xs font-black uppercase tracking-[0.34em] text-pink-100">
            <Sparkles className="h-4 w-4" /> GPCLUB Vietnam
          </div>
          <h1 className="mt-10 font-display text-5xl font-black leading-[0.95] tracking-tight md:text-7xl print:text-6xl">
            {catalog.title || "Product Catalog"}
          </h1>
          <p className="mt-6 max-w-xl text-xl font-semibold leading-relaxed text-white/82">
            {catalog.subtitle || "Curated K-Beauty product portfolio for Vietnam retail and B2B partners."}
          </p>
          {catalog.description ? <p className="mt-5 max-w-xl text-sm leading-7 text-white/68">{catalog.description}</p> : null}
        </div>
        <div className="mt-12 grid grid-cols-3 gap-3 text-center">
          <div className="border border-white/20 bg-white/10 p-4 backdrop-blur">
            <div className="text-3xl font-black">{products.length}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/60">Products</div>
          </div>
          <div className="border border-white/20 bg-white/10 p-4 backdrop-blur">
            <div className="text-3xl font-black">{new Set(products.map((p) => p.brand_name)).size}</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/60">Brands</div>
          </div>
          <div className="border border-white/20 bg-white/10 p-4 backdrop-blur">
            <div className="text-3xl font-black">PDF</div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/60">Catalog</div>
          </div>
        </div>
      </div>
      <div className="relative min-h-[420px] p-10 md:p-14 print:p-12">
        <div className="absolute right-10 top-10 h-40 w-40 rounded-full bg-pink-300/30 blur-3xl" />
        {heroImage ? (
          <img src={heroImage} alt={heroProduct.product_name} className="relative h-full min-h-[620px] w-full rounded-[2.5rem] object-cover shadow-2xl print:min-h-[760px]" />
        ) : (
          <div className="relative flex h-full min-h-[620px] items-center justify-center rounded-[2.5rem] border border-white/20 bg-white/10 text-center text-white/60 print:min-h-[760px]">
            Product Visual
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product, index }: { product: CatalogProduct; index: number }) {
  const image = getCoverImage(product);
  const visibleConditions = product.conditions.filter((condition) => condition.visible && condition.value);

  return (
    <article className="break-inside-avoid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm print:rounded-2xl print:shadow-none">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f6efe9]">
        {image ? <img src={image} alt={product.product_name} className="h-full w-full object-cover" /> : null}
        <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-pink-600 shadow-sm">
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">{product.brand_name}</Badge>
          <Badge variant="outline" className="rounded-full">{product.product_type}</Badge>
        </div>
        <h2 className="mt-4 font-display text-2xl font-black leading-tight">{product.product_name}</h2>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{product.short_intro}</p>
        {visibleConditions.length > 0 ? (
          <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4">
            {visibleConditions.slice(0, 4).map((condition) => (
              <div key={`${condition.label}-${condition.value}`} className="flex justify-between gap-3 text-xs">
                <span className="font-bold uppercase tracking-[0.16em] text-slate-400">{condition.label}</span>
                <span className="text-right font-semibold text-slate-700">{condition.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CompactProductRow({ product, index }: { product: CatalogProduct; index: number }) {
  const image = getCoverImage(product);
  const visibleConditions = product.conditions.filter((condition) => condition.visible && condition.value).slice(0, 2);

  return (
    <article className="break-inside-avoid grid grid-cols-[76px_1fr] gap-3 rounded-xl border border-slate-200 bg-white p-3 print:grid-cols-[52px_1fr] print:gap-2 print:p-2">
      <div className="relative overflow-hidden rounded-lg bg-[#f6efe9]">
        {image ? <img src={image} alt={product.product_name} className="h-full min-h-[76px] w-full object-cover print:min-h-[52px]" /> : null}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-pink-600">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{product.brand_name}</span>
          <span className="truncate text-slate-400">{product.product_type}</span>
        </div>
        <h2 className="mt-1 line-clamp-1 font-display text-base font-black leading-tight print:text-sm">{product.product_name}</h2>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 print:line-clamp-1 print:text-[10px]">{product.short_intro}</p>
        {visibleConditions.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {visibleConditions.map((condition) => (
              <span key={`${condition.label}-${condition.value}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                {condition.label}: {condition.value}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function LineupProductCard({ product, index }: { product: CatalogProduct; index: number }) {
  const image = getCoverImage(product);

  return (
    <article className="break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-xl print:shadow-none">
      <div className="relative aspect-square overflow-hidden bg-[#f6efe9]">
        {image ? <img src={image} alt={product.product_name} className="h-full w-full object-cover" /> : null}
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black text-pink-600">{String(index + 1).padStart(2, "0")}</div>
      </div>
      <div className="p-4 print:p-3">
        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-pink-600">{product.brand_name}</div>
        <h2 className="mt-2 line-clamp-2 font-display text-lg font-black leading-tight print:text-sm">{product.product_name}</h2>
        <div className="mt-2 text-xs font-semibold text-slate-500 print:text-[10px]">{product.product_type}</div>
      </div>
    </article>
  );
}

const printStyles = `
@page { size: A4; margin: 12mm; }
@media print {
  html, body { background: #fff !important; }
  .no-print { display: none !important; }
  .catalog-page { width: 100% !important; max-width: none !important; box-shadow: none !important; }
  .catalog-cover { page-break-after: always; }
  .catalog-section { padding: 0 !important; }
  article { page-break-inside: avoid; }
}
`;
