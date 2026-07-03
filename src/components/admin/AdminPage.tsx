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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type AdminLang, ADMIN_LANG_OPTIONS, ADMIN_I18N, tx } from "@/components/admin/admin-i18n";
import { supabase } from "@/integrations/supabase/client";

const StatsTab = lazy(() => import("@/components/admin/tabs/StatsTab"));
const HomeEditorTab = lazy(() => import("@/components/admin/tabs/HomeEditorTab"));
const DealersTab = lazy(() => import("@/components/admin/tabs/DealersTab"));
const ContactsTab = lazy(() => import("@/components/admin/tabs/ContactsTab"));
const FaqsTab = lazy(() => import("@/components/admin/tabs/FaqsTab"));
const PopupsTab = lazy(() => import("@/components/admin/tabs/PopupsTab"));
const EventsTab = lazy(() => import("@/components/admin/tabs/EventsTab"));
const SettingsTab = lazy(() => import("@/components/admin/tabs/SettingsTab"));
const ChatbotTab = lazy(() => import("@/components/admin/tabs/ChatbotTab"));
const ProductCatalogsTab = lazy(() => import("@/components/admin/tabs/ProductCatalogsTab"));
const ProductsTab = lazy(() => import("@/components/admin/tabs/ProductsTab"));

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

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center text-muted-foreground">
        {t("loading")}
      </div>
    );
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
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> {t("dashboard")}
          </TabsTrigger>
          <TabsTrigger value="productManagement" className="gap-1.5">
            <PackageOpen className="h-3.5 w-3.5" /> {t("productManagement")}
          </TabsTrigger>
          <TabsTrigger value="customerManagement" className="gap-1.5">
            <Inbox className="h-3.5 w-3.5" /> {t("customerManagement")}
          </TabsTrigger>
          <TabsTrigger value="contentManagement" className="gap-1.5">
            <Home className="h-3.5 w-3.5" /> {t("contentManagement")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" /> {t("settings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <Suspense
            fallback={
              <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                {t("loading")}
              </div>
            }
          >
            <StatsTab lang={adminLang} />
          </Suspense>
        </TabsContent>

        <TabsContent value="productManagement" className="mt-6">
          <Tabs defaultValue="products">
            <TabsList className="mb-5 flex w-full flex-wrap justify-start gap-1 bg-background p-1 shadow-soft">
              <TabsTrigger value="products" className="gap-1.5">
                <PackageOpen className="h-3.5 w-3.5" /> {t("products")}
              </TabsTrigger>
              <TabsTrigger value="catalogs" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> {t("catalogManagement")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                    {t("loading")}
                  </div>
                }
              >
                <ProductsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="catalogs">
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                    {t("loading")}
                  </div>
                }
              >
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
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                    {t("loading")}
                  </div>
                }
              >
                <DealersTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="contacts">
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                    {t("loading")}
                  </div>
                }
              >
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
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                    {t("loading")}
                  </div>
                }
              >
                <HomeEditorTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="events">
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                    {t("loading")}
                  </div>
                }
              >
                <EventsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="popups">
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                    {t("loading")}
                  </div>
                }
              >
                <PopupsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="faqs">
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                    {t("loading")}
                  </div>
                }
              >
                <FaqsTab lang={adminLang} />
              </Suspense>
            </TabsContent>
            <TabsContent value="chatbot">
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                    {t("loading")}
                  </div>
                }
              >
                <ChatbotTab lang={adminLang} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Suspense
            fallback={
              <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
                {t("loading")}
              </div>
            }
          >
            <SettingsTab lang={adminLang} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </section>
  );
}
