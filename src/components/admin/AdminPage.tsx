import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bot,
  CalendarDays,
  FileText,
  HelpCircle,
  Home,
  Inbox,
  LogOut,
  Megaphone,
  PackageOpen,
  Settings,
  Users,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  type ADMIN_I18N,
  ADMIN_LANG_OPTIONS,
  type AdminLang,
  tx,
} from "@/components/admin/admin-i18n";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const loadStatsTab = () => import("@/components/admin/tabs/StatsTab");
const loadHomeEditorTab = () => import("@/components/admin/tabs/HomeEditorTab");
const loadDealersTab = () => import("@/components/admin/tabs/DealersTab");
const loadContactsTab = () => import("@/components/admin/tabs/ContactsTab");
const loadFaqsTab = () => import("@/components/admin/tabs/FaqsTab");
const loadPopupsTab = () => import("@/components/admin/tabs/PopupsTab");
const loadEventsTab = () => import("@/components/admin/tabs/EventsTab");
const loadSettingsTab = () => import("@/components/admin/tabs/SettingsTab");
const loadChatbotTab = () => import("@/components/admin/tabs/ChatbotTab");
const loadProductCatalogsTab = () => import("@/components/admin/tabs/ProductCatalogsTab");
const loadProductsTab = () => import("@/components/admin/tabs/ProductsTab");
const loadBrandsTab = () => import("@/components/admin/tabs/BrandsTab");

const StatsTab = lazy(loadStatsTab);
const HomeEditorTab = lazy(loadHomeEditorTab);
const DealersTab = lazy(loadDealersTab);
const ContactsTab = lazy(loadContactsTab);
const FaqsTab = lazy(loadFaqsTab);
const PopupsTab = lazy(loadPopupsTab);
const EventsTab = lazy(loadEventsTab);
const SettingsTab = lazy(loadSettingsTab);
const ChatbotTab = lazy(loadChatbotTab);
const ProductCatalogsTab = lazy(loadProductCatalogsTab);
const ProductsTab = lazy(loadProductsTab);
const BrandsTab = lazy(loadBrandsTab);

const preloadAdminTabs = () => {
  void Promise.allSettled([
    loadStatsTab(),
    loadProductsTab(),
    loadBrandsTab(),
    loadProductCatalogsTab(),
    loadDealersTab(),
    loadContactsTab(),
    loadHomeEditorTab(),
    loadEventsTab(),
    loadPopupsTab(),
    loadFaqsTab(),
    loadChatbotTab(),
    loadSettingsTab(),
  ]);
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [adminLang, setAdminLang] = useState<AdminLang>(() => {
    if (typeof window === "undefined") return "en";
    const saved = window.localStorage.getItem("gpclub-admin-lang");
    return saved === "vi" || saved === "ko" || saved === "en" ? saved : "en";
  });
  const t = (key: keyof typeof ADMIN_I18N) => tx(adminLang, key);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("gpclub-admin-lang", adminLang);
  }, [adminLang]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      setLoading(false);
    })();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    if (typeof window === "undefined") return;

    const id = window.setTimeout(() => preloadAdminTabs(), 800);
    return () => window.clearTimeout(id);
  }, [isAdmin]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (loading) {
    return <AdminAuthSkeleton />;
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-3xl">{t("accessDenied")}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t("accessDeniedDesc")}</p>
        <Button onClick={signOut} variant="outline" className="mt-6 rounded-full">
          {t("signOut")}
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            {t("admin")}
          </div>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">{t("controlCenter")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={adminLang} onValueChange={(v) => setAdminLang(v as AdminLang)}>
            <SelectTrigger className="h-9 w-[150px] rounded-full">
              <SelectValue aria-label={t("language")} />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_LANG_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={signOut} className="rounded-full">
            <LogOut className="mr-1 h-4 w-4" /> {t("signOut")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
          <TabsTrigger
            value="dashboard"
            className="gap-1.5"
            onMouseEnter={() => void loadStatsTab()}
            onFocus={() => void loadStatsTab()}
          >
            <BarChart3 className="h-3.5 w-3.5" /> {t("dashboard")}
          </TabsTrigger>
          <TabsTrigger
            value="productManagement"
            className="gap-1.5"
            onMouseEnter={() => void Promise.allSettled([loadProductsTab(), loadBrandsTab()])}
            onFocus={() => void Promise.allSettled([loadProductsTab(), loadBrandsTab()])}
          >
            <PackageOpen className="h-3.5 w-3.5" /> {t("productManagement")}
          </TabsTrigger>
          <TabsTrigger
            value="customerManagement"
            className="gap-1.5"
            onMouseEnter={() => void Promise.allSettled([loadDealersTab(), loadContactsTab()])}
            onFocus={() => void Promise.allSettled([loadDealersTab(), loadContactsTab()])}
          >
            <Inbox className="h-3.5 w-3.5" /> {t("customerManagement")}
          </TabsTrigger>
          <TabsTrigger
            value="contentManagement"
            className="gap-1.5"
            onMouseEnter={() =>
              void Promise.allSettled([
                loadHomeEditorTab(),
                loadEventsTab(),
                loadPopupsTab(),
                loadFaqsTab(),
                loadChatbotTab(),
              ])
            }
            onFocus={() =>
              void Promise.allSettled([
                loadHomeEditorTab(),
                loadEventsTab(),
                loadPopupsTab(),
                loadFaqsTab(),
                loadChatbotTab(),
              ])
            }
          >
            <Home className="h-3.5 w-3.5" /> {t("contentManagement")}
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="gap-1.5"
            onMouseEnter={() => void loadSettingsTab()}
            onFocus={() => void loadSettingsTab()}
          >
            <Settings className="h-3.5 w-3.5" /> {t("settings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <Suspense fallback={<AdminTabSkeleton />}>
            <StatsTab lang={adminLang} />
          </Suspense>
        </TabsContent>

        <TabsContent value="productManagement" className="mt-6">
          <Tabs defaultValue="products">
            <TabsList className="mb-5 flex w-full flex-wrap justify-start gap-1 bg-background p-1 shadow-soft">
              <TabsTrigger value="brands" className="gap-1.5">
                <PackageOpen className="h-3.5 w-3.5" /> Brands
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-1.5">
                <PackageOpen className="h-3.5 w-3.5" /> {t("products")}
              </TabsTrigger>
              <TabsTrigger value="catalogs" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> {t("catalogManagement")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="brands">
              <Suspense fallback={<AdminTabSkeleton />}>
                <BrandsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="products">
              <Suspense fallback={<AdminTabSkeleton />}>
                <ProductsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="catalogs">
              <Suspense fallback={<AdminTabSkeleton />}>
                <ProductCatalogsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="customerManagement" className="mt-6">
          <Tabs defaultValue="dealers">
            <TabsList className="mb-5 flex w-full flex-wrap justify-start gap-1 bg-background p-1 shadow-soft">
              <TabsTrigger value="dealers" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> {t("dealers")}
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-1.5">
                <Inbox className="h-3.5 w-3.5" /> {t("contacts")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dealers">
              <Suspense fallback={<AdminTabSkeleton />}>
                <DealersTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="contacts">
              <Suspense fallback={<AdminTabSkeleton />}>
                <ContactsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="contentManagement" className="mt-6">
          <Tabs defaultValue="home">
            <TabsList className="mb-5 flex w-full flex-wrap justify-start gap-1 bg-background p-1 shadow-soft">
              <TabsTrigger value="home" className="gap-1.5">
                <Home className="h-3.5 w-3.5" /> {t("home")}
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> {t("events")}
              </TabsTrigger>
              <TabsTrigger value="popups" className="gap-1.5">
                <Megaphone className="h-3.5 w-3.5" /> {t("popups")}
              </TabsTrigger>
              <TabsTrigger value="faqs" className="gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" /> {t("faq")}
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="gap-1.5">
                <Bot className="h-3.5 w-3.5" /> {t("chatbot")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="home">
              <Suspense fallback={<AdminTabSkeleton />}>
                <HomeEditorTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="events">
              <Suspense fallback={<AdminTabSkeleton />}>
                <EventsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="popups">
              <Suspense fallback={<AdminTabSkeleton />}>
                <PopupsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="faqs">
              <Suspense fallback={<AdminTabSkeleton />}>
                <FaqsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="chatbot">
              <Suspense fallback={<AdminTabSkeleton />}>
                <ChatbotTab lang={adminLang} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Suspense fallback={<AdminTabSkeleton />}>
            <SettingsTab lang={adminLang} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function AdminAuthSkeleton() {
  return (
    <main className="min-h-screen bg-background px-4 py-24" aria-busy="true">
      <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded-full bg-muted" />
          <div className="h-8 w-40 rounded-full bg-muted" />
          <div className="h-4 w-56 rounded-full bg-muted" />
        </div>
        <div className="space-y-3">
          <div className="h-11 rounded-full bg-muted" />
          <div className="h-11 rounded-full bg-muted" />
        </div>
        <div className="flex justify-end gap-2">
          <div className="h-10 w-24 rounded-full bg-muted" />
          <div className="h-10 w-24 rounded-full bg-muted" />
        </div>
      </div>
    </main>
  );
}

function AdminTabSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6" aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-full bg-muted" />
          <div className="h-8 w-44 rounded-full bg-muted" />
        </div>
        <div className="h-10 w-32 rounded-full bg-muted" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-[1fr_140px_120px]">
            <div className="h-11 rounded-xl bg-muted" />
            <div className="h-11 rounded-xl bg-muted" />
            <div className="h-11 rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
