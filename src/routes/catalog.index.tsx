import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { fetchProductCatalogs, type ProductCatalog } from "@/lib/product-catalogs";
import { useCatalogProducts, type CatalogProduct } from "@/lib/catalog-products";

export const Route = createFileRoute("/catalog/")({
  head: () => ({
    meta: [
      { title: "GPCLUB Vietnam Product Catalog Download" },
      {
        name: "description",
        content: "Search, preview and download GPCLUB Vietnam product catalogs.",
      },
    ],
  }),
  component: CatalogDownloadPage,
});

function CatalogDownloadPage() {
  const { lang } = useI18n();
  const { rows: products } = useCatalogProducts();
  const [catalogs, setCatalogs] = useState<ProductCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCatalogId, setActiveCatalogId] = useState("");

  useEffect(() => {
    let alive = true;
    fetchProductCatalogs()
      .then((rows) => {
        if (!alive) return;
        setCatalogs(rows);
        setActiveCatalogId(rows.find((row) => row.is_representative)?.id || rows[0]?.id || "");
      })
      .catch(() => alive && setCatalogs([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const filteredCatalogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalogs;
    return catalogs.filter((catalog) => {
      const productNames = catalog.product_ids
        .map((id) => productMap.get(id))
        .filter(Boolean)
        .map(
          (product) => `${product?.brand_name} ${product?.product_name} ${product?.product_type}`,
        )
        .join(" ");
      return `${catalog.title} ${catalog.subtitle} ${catalog.description} ${productNames}`
        .toLowerCase()
        .includes(query);
    });
  }, [catalogs, productMap, search]);

  useEffect(() => {
    if (!filteredCatalogs.length) return;
    if (!filteredCatalogs.some((catalog) => catalog.id === activeCatalogId)) {
      setActiveCatalogId(
        filteredCatalogs.find((catalog) => catalog.is_representative)?.id || filteredCatalogs[0].id,
      );
    }
  }, [activeCatalogId, filteredCatalogs]);

  const copy =
    lang === "vi"
      ? {
          kicker: "TẢI CATALOG",
          title: "Xem catalog theo từng tab và tải PDF",
          subtitle:
            "Chọn catalog ở phía trên, xem nhanh nội dung sản phẩm và tải bản PDF riêng cho từng catalog.",
          search: "Tìm catalog, thương hiệu, loại sản phẩm...",
          empty: "Chưa có catalog. Vui lòng xem danh sách sản phẩm trước.",
          products: "sản phẩm",
          download: "Tải PDF",
          preview: "Xem PDF",
          viewProducts: "Xem sản phẩm",
          representative: "Đại diện",
          template: "Mẫu",
          includedProducts: "Sản phẩm trong catalog",
        }
      : {
          kicker: "CATALOG DOWNLOAD",
          title: "Preview catalogs by tab and download each PDF",
          subtitle:
            "Choose a catalog from the top tabs, review the included products, then download the exact PDF you need.",
          search: "Search catalog, brand, product type...",
          empty: "No catalogs are available yet. Please view the product list first.",
          products: "products",
          download: "Download PDF",
          preview: "Preview PDF",
          viewProducts: "View Products",
          representative: "Representative",
          template: "Template",
          includedProducts: "Included products",
        };

  return (
    <main className="min-h-screen bg-gradient-luxe">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 border-b border-primary/40 pb-1 text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
            <FileText className="h-3.5 w-3.5" /> {copy.kicker}
          </div>
          <h1 className="mt-6 font-display text-4xl font-black leading-tight tracking-tight text-foreground md:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-base font-semibold leading-7 text-foreground/72 md:text-lg">
            {copy.subtitle}
          </p>
        </div>

        <div className="mt-10 flex items-center gap-3 rounded-2xl border border-border bg-white/80 p-3 shadow-soft backdrop-blur">
          <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={copy.search}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="mt-8">
          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
          {!loading && filteredCatalogs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-white/70 p-8 text-center">
              <p className="text-sm font-semibold text-muted-foreground">{copy.empty}</p>
              <Button asChild className="mt-5 rounded-none">
                <Link to="/products">{copy.viewProducts}</Link>
              </Button>
            </div>
          ) : null}

          {filteredCatalogs.length > 0 ? (
            <Tabs
              value={activeCatalogId || filteredCatalogs[0].id}
              onValueChange={setActiveCatalogId}
            >
              <TabsList className="sticky top-20 z-20 flex h-auto w-full flex-wrap justify-start gap-2 rounded-3xl border border-border bg-white/90 p-2 shadow-soft backdrop-blur">
                {filteredCatalogs.map((catalog) => (
                  <TabsTrigger
                    key={catalog.id}
                    value={catalog.id}
                    className="rounded-2xl px-4 py-3 text-left data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <span className="flex flex-col items-start gap-1">
                      <span className="flex items-center gap-1.5 text-sm font-black">
                        {catalog.is_representative ? <Star className="h-3.5 w-3.5" /> : null}
                        {catalog.title}
                      </span>
                      <span className="text-[11px] font-semibold opacity-80">
                        {catalog.product_ids.length} {copy.products}
                      </span>
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {filteredCatalogs.map((catalog) => {
                const selectedProducts = catalog.product_ids
                  .map((id) => productMap.get(id))
                  .filter(Boolean) as CatalogProduct[];
                const brands = Array.from(
                  new Set(selectedProducts.map((product) => product.brand_name).filter(Boolean)),
                );
                return (
                  <TabsContent key={catalog.id} value={catalog.id} className="mt-6">
                    <article className="rounded-[2rem] border border-border bg-white/90 p-5 shadow-soft backdrop-blur md:p-7">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {catalog.is_representative ? (
                              <Badge className="gap-1">
                                <Star className="h-3 w-3" /> {copy.representative}
                              </Badge>
                            ) : null}
                            <Badge variant="outline">
                              {copy.template}: {catalog.template}
                            </Badge>
                            <Badge variant="secondary">
                              {catalog.product_ids.length} {copy.products}
                            </Badge>
                          </div>
                          <h2 className="mt-4 font-display text-3xl font-black leading-tight md:text-4xl">
                            {catalog.title}
                          </h2>
                          <p className="mt-2 text-base font-semibold text-muted-foreground">
                            {catalog.subtitle}
                          </p>
                          {catalog.description ? (
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/70">
                              {catalog.description}
                            </p>
                          ) : null}
                          {brands.length ? (
                            <p className="mt-4 line-clamp-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                              {brands.join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                          <Button
                            asChild
                            className="rounded-none bg-foreground text-background hover:bg-primary"
                          >
                            <Link
                              to="/catalog/$catalogId"
                              params={{ catalogId: catalog.id }}
                              target="_blank"
                            >
                              <Eye className="mr-2 h-4 w-4" /> {copy.preview}
                            </Link>
                          </Button>
                          <Button asChild variant="outline" className="rounded-none bg-white">
                            <Link
                              to="/catalog/$catalogId"
                              params={{ catalogId: catalog.id }}
                              target="_blank"
                            >
                              <Download className="mr-2 h-4 w-4" /> {copy.download}
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <div className="mt-8">
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">
                          {copy.includedProducts}
                        </h3>
                        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {selectedProducts.slice(0, 24).map((product) => (
                            <div
                              key={product.id}
                              className="rounded-2xl border border-border/70 bg-background/70 p-4"
                            >
                              <div className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                                {product.brand_name}
                              </div>
                              <div className="mt-1 font-semibold leading-snug">
                                {product.product_name}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {product.product_type}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  </TabsContent>
                );
              })}
            </Tabs>
          ) : null}
        </div>
      </section>
    </main>
  );
}
