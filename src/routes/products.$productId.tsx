import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle, Image as ImageIcon, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCoverImage, useCatalogProducts } from "@/lib/catalog-products";
import { useI18n } from "@/lib/i18n";
import { B2BInquiryDialog } from "@/components/site/B2BInquiryDialog";

export const Route = createFileRoute("/products/$productId")({
  component: ProductDetailPage,
});

const text = {
  vi: {
    back: "Back to Products",
    notFound: "Không tìm thấy sản phẩm.",
    new: "New",
    popular: "Popular",
    featured: "Featured",
    details: "Product details",
    media: "Photos & videos",
    conditions: "Conditions",
    inquiry: "Start B2B inquiry",
    hidden: "Các điều kiện ẩn sẽ không hiển thị cho khách.",
  },
  en: {
    back: "Back to Products",
    notFound: "Product not found.",
    new: "New",
    popular: "Popular",
    featured: "Featured",
    details: "Product details",
    media: "Photos & videos",
    conditions: "Conditions",
    inquiry: "Start B2B inquiry",
    hidden: "Hidden conditions are not shown to customers.",
  },
};

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const { lang } = useI18n();
  const t = text[lang];
  const { rows } = useCatalogProducts();
  const product = rows.find((p) => p.id === productId);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  if (!product) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-muted-foreground">{t.notFound}</p>
        <Button asChild variant="outline" className="mt-6 rounded-full">
          <Link to="/products">{t.back}</Link>
        </Button>
      </section>
    );
  }

  const visibleConditions = product.conditions.filter((c) => c.visible);
  const cover = getCoverImage(product);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 rounded-full">
        <Link to="/products"><ArrowLeft className="mr-2 h-4 w-4" /> {t.back}</Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-3xl border border-border bg-muted">
            {cover ? <img src={cover} alt={product.product_name} className="aspect-square w-full object-cover" /> : null}
          </div>
          {product.media.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {product.media.map((m, idx) => (
                <a key={`${m.url}-${idx}`} href={m.url} target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-2xl border border-border bg-card">
                  {m.type === "image" ? (
                    <img src={m.url} alt={m.alt || product.product_name} className="aspect-square w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="grid aspect-square place-items-center bg-foreground text-background">
                      <Video className="h-8 w-8" />
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{product.brand_name}</Badge>
            <Badge variant="outline">{product.product_type}</Badge>
            {product.is_new ? <Badge>{t.new}</Badge> : null}
            {product.is_popular ? <Badge className="bg-foreground text-background">{t.popular}</Badge> : null}
            {product.is_featured ? <Badge className="bg-primary text-primary-foreground">{t.featured}</Badge> : null}
          </div>
          <h1 className="mt-5 font-display text-4xl font-black leading-tight md:text-6xl">{product.product_name}</h1>
          <p className="mt-5 text-lg leading-relaxed text-foreground/70">{product.short_intro}</p>

          {visibleConditions.length > 0 ? (
            <div className="mt-8 rounded-3xl border border-border bg-card p-5">
              <h2 className="font-display text-2xl font-black">{t.conditions}</h2>
              <div className="mt-4 grid gap-3">
                {visibleConditions.map((c, idx) => (
                  <div key={`${c.label}-${idx}`} className="flex items-start gap-3 rounded-2xl bg-secondary p-4">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-bold">{c.label}</div>
                      <div className="text-sm text-muted-foreground">{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 rounded-3xl border border-border bg-card p-5">
            <h2 className="font-display text-2xl font-black">{t.details}</h2>
            <div
              className="prose prose-sm mt-4 max-w-none text-foreground/75 [&_img]:rounded-2xl [&_img]:border [&_img]:border-border"
              dangerouslySetInnerHTML={{ __html: product.detail_html || "" }}
            />
          </div>

          <Button type="button" size="lg" onClick={() => setInquiryOpen(true)} className="mt-8 h-12 rounded-none px-8 text-xs font-bold uppercase tracking-[0.18em]">
            {t.inquiry}
          </Button>
        </div>
      </div>
      <B2BInquiryDialog
        open={inquiryOpen}
        onOpenChange={setInquiryOpen}
        product={{
          brandName: product.brand_name,
          productName: product.product_name,
          productType: product.product_type,
          imageUrl: cover || undefined,
        }}
        source="Product detail page"
        defaultMessage={`I am interested in B2B opportunities for ${product.brand_name} - ${product.product_name}.`}
        title="Register B2B inquiry without leaving this product"
      />
    </section>
  );
}
