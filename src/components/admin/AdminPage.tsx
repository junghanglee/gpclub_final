import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Download,
  Eye,
  FileText,
  HelpCircle,
  Home,
  Inbox,
  LogOut,
  Megaphone,
  PackageOpen,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ProductDetailEditor,
  type ProductDetailEditorHandle,
} from "@/components/admin/product-detail-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  type CatalogProduct,
  canonicalBrandName,
  getCoverImage,
  normalizeBrandText,
  normalizedSearchText,
  type ProductCondition,
  type ProductMedia,
} from "@/lib/catalog-products";
import { chunkText } from "@/lib/chatbot-training";
import {
  DEFAULT_HOME_CONTENT,
  type HomeAdminContent,
  type LocalizedText,
  mergeHomeContent,
} from "@/lib/home-content";
import {
  DEFAULT_PAGE_CONTENT,
  mergePageContent,
  PAGE_CONTENT_OPTIONS,
  type PageContentKey,
  type PageEditableContent,
  pageContentStorageKey,
} from "@/lib/page-content";
import {
  createCatalogId,
  fetchProductCatalogs,
  type ProductCatalog,
  saveProductCatalogs,
} from "@/lib/product-catalogs";
import { sanitizeProductDetailHtml } from "@/lib/product-detail-html";

type AdminLang = "en" | "vi" | "ko";

type Tables = Database["public"]["Tables"];
type B2BInquiryRow = Tables["b2b_inquiries"]["Row"];
type B2BInquiryUpdate = Tables["b2b_inquiries"]["Update"];
type FaqRow = Tables["faqs"]["Row"];
type EventRow = Tables["events"]["Row"];
type HomeContentInsert = Tables["home_content"]["Insert"];
type PopupRow = Tables["popups"]["Row"];
type SiteSettingsValue = Record<string, string>;

type TriText = Record<AdminLang, string>;

const ADMIN_PAGE_SIZE = 25;
const CHATBOT_RECORD_LIMIT = 200;
const CHATBOT_ADMIN_LIMIT = 100;
const CHATBOT_CHUNK_BATCH_SIZE = 25;

const pageRange = (page: number, pageSize = ADMIN_PAGE_SIZE) => {
  const from = page * pageSize;
  return { from, to: from + pageSize - 1 };
};

const waitForBrowser = () => new Promise((resolve) => window.setTimeout(resolve, 0));

const ADMIN_LANG_OPTIONS: { value: AdminLang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tieng Viet" },
  { value: "ko", label: "Korean" },
];

const ADMIN_I18N = {
  loading: { en: "Loading...", vi: "�ang t?i...", ko: "???? ?..." },
  save: { en: "Save", vi: "Luu", ko: "??" },
  saved: { en: "Saved", vi: "�� luu", ko: "???" },
  updated: { en: "Updated", vi: "�� c?p nh?t", ko: "?????" },
  refresh: { en: "Refresh", vi: "L�m m?i", ko: "????" },
  reload: { en: "Reload", vi: "T?i l?i", ko: "?? ????" },
  cancel: { en: "Cancel", vi: "H?y", ko: "??" },
  close: { en: "Close", vi: "��ng", ko: "??" },
  delete: { en: "Delete", vi: "X�a", ko: "??" },
  view: { en: "View", vi: "Xem", ko: "??" },
  edit: { en: "Edit", vi: "Ch?nh s?a", ko: "??" },
  signOut: { en: "Sign out", vi: "�ang xu?t", ko: "????" },
  admin: { en: "Admin", vi: "Qu?n tr?", ko: "???" },
  controlCenter: {
    en: "GPCLUB Control Center",
    vi: "Trung t�m qu?n tr? GPCLUB",
    ko: "GPCLUB ?? ??",
  },
  language: { en: "Language", vi: "Ng�n ng?", ko: "??" },
  accessDenied: {
    en: "Access denied",
    vi: "T? ch?i truy c?p",
    ko: "?? ?? ??",
  },
  accessDeniedDesc: {
    en: "Your account doesn't have admin privileges. Contact a workspace owner to request access.",
    vi: "T�i kho?n c?a b?n kh�ng c� quy?n qu?n tr?. Vui l�ng li�n h? ch? s? h?u kh�ng gian l�m vi?c d? y�u c?u quy?n truy c?p.",
    ko: "? ???? ??? ??? ????. ?? ??? ?????? ????? ?????.",
  },
  overview: { en: "Overview", vi: "T?ng quan", ko: "??" },
  dashboard: { en: "Dashboard", vi: "B?ng di?u khi?n", ko: "????" },
  productManagement: {
    en: "Product Management",
    vi: "Qu?n l� s?n ph?m",
    ko: "????",
  },
  customerManagement: {
    en: "Customers / Inquiries",
    vi: "Kh�ch h�ng / Li�n h?",
    ko: "??/??",
  },
  contentManagement: {
    en: "Content Management",
    vi: "Qu?n l� n?i dung",
    ko: "?????",
  },
  settings: { en: "Settings", vi: "C�i d?t", ko: "??" },
  home: { en: "Content Edit", vi: "Ch?nh s?a n?i dung", ko: "?????" },
  dealers: { en: "B2B Applications", vi: "�on dang k� B2B", ko: "B2B ??" },
  contacts: { en: "Chatbot Records", vi: "B?n ghi chatbot", ko: "?? ??" },
  faq: { en: "FAQ", vi: "C�u h?i thu?ng g?p", ko: "FAQ" },
  popups: { en: "Popups", vi: "Popup", ko: "??" },
  events: { en: "Events", vi: "S? ki?n", ko: "???" },
  products: { en: "Products", vi: "Products", ko: "??" },
  catalogManagement: {
    en: "Catalog Management",
    vi: "Qu?n l� catalog",
    ko: "???? ??",
  },
  productCatalogs: {
    en: "Product Catalogs",
    vi: "Catalog s?n ph?m",
    ko: "?? ????",
  },
  newCatalog: { en: "New catalog", vi: "T?o catalog", ko: "???? ????" },
  representativeCatalog: {
    en: "Representative",
    vi: "Catalog d?i di?n",
    ko: "??????",
  },
  setRepresentative: {
    en: "Set representative",
    vi: "Ch?n d?i di?n",
    ko: "??? ??",
  },
  downloadPdf: { en: "Download PDF", vi: "T?i PDF", ko: "PDF ????" },
  preview: { en: "Preview", vi: "Xem tru?c", ko: "????" },
  catalogTitle: { en: "Catalog title", vi: "T�n catalog", ko: "?????" },
  catalogSubtitle: { en: "Subtitle", vi: "Ph? d?", ko: "???" },
  catalogDescription: { en: "Description", vi: "M� t?", ko: "??" },
  catalogTemplate: {
    en: "Catalog template",
    vi: "M?u catalog",
    ko: "???? ???",
  },
  selectedProducts: {
    en: "Selected products",
    vi: "S?n ph?m d� ch?n",
    ko: "?? ??",
  },
  searchProducts: {
    en: "Search products",
    vi: "T�m s?n ph?m",
    ko: "?? ??",
  },
  allBrands: { en: "All brands", vi: "T?t c? thuong hi?u", ko: "?? ???" },
  allTypes: { en: "All types", vi: "T?t c? lo?i", ko: "?? ??" },
  selectAll: { en: "Select all", vi: "Ch?n t?t c?", ko: "????" },
  selectFiltered: {
    en: "Select filtered",
    vi: "Ch?n k?t qu? l?c",
    ko: "?? ?? ????",
  },
  clearSelected: { en: "Clear selected", vi: "B? ch?n", ko: "????" },
  premiumTemplate: {
    en: "Premium visual",
    vi: "H�nh ?nh cao c?p",
    ko: "???? ???",
  },
  compactTemplate: {
    en: "Compact bulk list",
    vi: "Danh s�ch g?n",
    ko: "???? ???",
  },
  lineupTemplate: {
    en: "Lineup grid",
    vi: "Lu?i s?n ph?m",
    ko: "??? ???",
  },
  noCatalogs: {
    en: "No catalogs yet",
    vi: "Chua c� catalog",
    ko: "?? ????? ????",
  },
  deleteCatalogConfirm: {
    en: "Delete this catalog?",
    vi: "X�a catalog n�y?",
    ko: "? ????? ??????",
  },
  siteInfo: { en: "Site Info", vi: "Th�ng tin trang web", ko: "??? ??" },
  chatbot: {
    en: "Chatbot Training",
    vi: "Hu?n luy?n chatbot",
    ko: "?? ??",
  },
  dealerApplications: {
    en: "B2B applications",
    vi: "�on dang k� B2B",
    ko: "B2B ??",
  },
  newUnhandled: {
    en: "New (unhandled)",
    vi: "M?i (chua x? l�)",
    ko: "??(???)",
  },
  generalInquiries: {
    en: "Chatbot records",
    vi: "B?n ghi chatbot",
    ko: "?? ??",
  },
  publishedFaqs: {
    en: "Published FAQs",
    vi: "FAQ d� xu?t b?n",
    ko: "??? FAQ",
  },
  chatbotTraining: {
    en: "Chatbot training",
    vi: "Hu?n luy?n chatbot",
    ko: "?? ??",
  },
  company: { en: "Company", vi: "C�ng ty", ko: "??" },
  contact: { en: "Contact", vi: "Li�n h?", ko: "???" },
  city: { en: "City", vi: "Th�nh ph?", ko: "??" },
  volume: { en: "Volume", vi: "S?n lu?ng", ko: "??" },
  status: { en: "Status", vi: "Tr?ng th�i", ko: "??" },
  date: { en: "Date", vi: "Ng�y", ko: "??" },
  name: { en: "Name", vi: "T�n", ko: "??" },
  email: { en: "Email", vi: "Email", ko: "???" },
  subject: { en: "Subject", vi: "Ch? d?", ko: "??" },
  message: { en: "Message", vi: "Tin nh?n", ko: "???" },
  adminNote: { en: "Admin note", vi: "Ghi ch� qu?n tr?", ko: "??? ??" },
  saveNote: { en: "Save note", vi: "Luu ghi ch�", ko: "?? ??" },
  conversation: { en: "Conversation", vi: "Cu?c h?i tho?i", ko: "??" },
  customer: { en: "Customer", vi: "Kh�ch h�ng", ko: "??" },
  chatbotAnswer: {
    en: "Chatbot answer",
    vi: "C�u tr? l?i chatbot",
    ko: "?? ??",
  },
  dateFilter: { en: "Date filter", vi: "B? l?c ng�y", ko: "?? ??" },
  clearFilter: { en: "Clear filter", vi: "X�a b? l?c", ko: "?? ???" },
  userSessions: {
    en: "User sessions",
    vi: "Phi�n ngu?i d�ng",
    ko: "???? ??",
  },
  sessionId: { en: "Session ID", vi: "ID phi�n", ko: "??? ??" },
  messageCount: { en: "Messages", vi: "Tin nh?n", ko: "?? ?" },
  latestMessage: {
    en: "Latest message",
    vi: "Tin nh?n m?i nh?t",
    ko: "?? ???",
  },
  question: { en: "Question", vi: "C�u h?i", ko: "??" },
  answer: { en: "Answer", vi: "C�u tr? l?i", ko: "??" },
  category: { en: "Category", vi: "Danh m?c", ko: "????" },
  order: { en: "Order", vi: "Th? t?", ko: "??" },
  published: { en: "Published", vi: "�� xu?t b?n", ko: "???" },
  title: { en: "Title", vi: "Ti�u d?", ko: "??" },
  content: { en: "Content", vi: "N?i dung", ko: "???" },
  description: { en: "Description", vi: "M� t?", ko: "??" },
  imageUrl: { en: "Image URL", vi: "URL h�nh ?nh", ko: "??? URL" },
  ctaLabel: { en: "CTA label", vi: "Nh�n CTA", ko: "CTA ??" },
  ctaUrl: { en: "CTA URL", vi: "URL CTA", ko: "CTA URL" },
  active: { en: "Active", vi: "�ang ho?t d?ng", ko: "??" },
  newFaq: { en: "New FAQ", vi: "FAQ m?i", ko: "? FAQ" },
  editFaq: { en: "Edit FAQ", vi: "Ch?nh s?a FAQ", ko: "FAQ ??" },
  newPopup: { en: "New popup", vi: "Popup m?i", ko: "? ??" },
  editPopup: { en: "Edit popup", vi: "Ch?nh s?a popup", ko: "?? ??" },
  newEvent: { en: "New event", vi: "S? ki?n m?i", ko: "? ???" },
  editEvent: { en: "Edit event", vi: "Ch?nh s?a s? ki?n", ko: "??? ??" },
  noApplications: {
    en: "No applications yet",
    vi: "Chua c� don dang k�",
    ko: "?? ??? ????",
  },
  noInquiries: {
    en: "No chatbot records yet",
    vi: "Chua c� b?n ghi chatbot",
    ko: "?? ?? ??? ????",
  },
  noFaqs: { en: "No FAQs yet", vi: "Chua c� FAQ", ko: "?? FAQ? ????" },
  noPopups: {
    en: "No popups yet",
    vi: "Chua c� popup",
    ko: "?? ??? ????",
  },
  noEvents: {
    en: "No events yet",
    vi: "Chua c� s? ki?n",
    ko: "?? ???? ????",
  },
  live: { en: "Live", vi: "�ang hi?n th?", ko: "???" },
  draft: { en: "Draft", vi: "B?n nh�p", ko: "??" },
  off: { en: "Off", vi: "T?t", ko: "??" },
  scheduled: { en: "Scheduled", vi: "�� l�n l?ch", ko: "???" },
  expired: { en: "Expired", vi: "�� h?t h?n", ko: "???" },
  featured: { en: "Featured", vi: "N?i b?t", ko: "??" },
  normal: { en: "Normal", vi: "B�nh thu?ng", ko: "??" },
  event: { en: "Event", vi: "S? ki?n", ko: "???" },
  newProduct: { en: "New product", vi: "S?n ph?m m?i", ko: "???" },
  editProduct: {
    en: "Edit product",
    vi: "Ch?nh s?a s?n ph?m",
    ko: "?? ??",
  },
  productName: { en: "Product name", vi: "T�n s?n ph?m", ko: "???" },
  brandName: { en: "Brand name", vi: "T�n thuong hi?u", ko: "????" },
  productType: { en: "Product type", vi: "Lo?i s?n ph?m", ko: "????" },
  shortIntro: { en: "Short intro", vi: "Gi?i thi?u ng?n", ko: "?? ??" },
  detailEditor: {
    en: "Detail editor",
    vi: "Tr�nh ch?nh s?a chi ti?t",
    ko: "???? ???",
  },
  coverImage: {
    en: "Cover image URL",
    vi: "URL ?nh d?i di?n",
    ko: "?? ??? URL",
  },
  mediaUrls: { en: "Photos / Videos", vi: "?nh / Video", ko: "?? / ???" },
  conditions: {
    en: "Conditions / prices",
    vi: "�i?u ki?n / gi�",
    ko: "?? / ??",
  },
  showCondition: { en: "Show", vi: "Hi?n th?", ko: "??" },
  popularProduct: {
    en: "Popular product",
    vi: "S?n ph?m ph? bi?n",
    ko: "????",
  },
  featuredProduct: { en: "Featured highlight", vi: "N?i b?t", ko: "??" },
  addMedia: { en: "Add media", vi: "Th�m media", ko: "??? ??" },
  addCondition: { en: "Add condition", vi: "Th�m di?u ki?n", ko: "?? ??" },
  noProducts: {
    en: "No products yet",
    vi: "Chua c� s?n ph?m",
    ko: "?? ??? ????",
  },
  deleteProductConfirm: {
    en: "Delete this product?",
    vi: "X�a s?n ph?m n�y?",
    ko: "? ??? ??????",
  },
  media: { en: "Media", vi: "Phuong ti?n", ko: "???" },
  type: { en: "Type", vi: "Lo?i", ko: "??" },
  siteInformation: {
    en: "Site information",
    vi: "Th�ng tin trang web",
    ko: "??? ??",
  },
  saveChanges: { en: "Save changes", vi: "Luu thay d?i", ko: "???? ??" },
  saving: { en: "Saving...", vi: "�ang luu...", ko: "?? ?..." },
  enabled: { en: "Enabled", vi: "�� b?t", ko: "???" },
  on: { en: "On", vi: "B?t", ko: "??" },
  reset: { en: "Reset", vi: "�?t l?i", ko: "???" },
  resetHomeConfirm: {
    en: "Reset selected page content to code defaults?",
    vi: "�?t l?i n?i dung trang d� ch?n v? m?c d?nh trong m�?",
    ko: "??? ??? ???? ?? ????? ???????",
  },
  homeEditor: {
    en: "Content editor",
    vi: "Tr�nh ch?nh s?a n?i dung",
    ko: "?????",
  },
  homeEditorDesc: {
    en: "Choose a public site menu and edit the VI/EN text applied to that page. HOME includes the full homepage sections.",
    vi: "Ch?n menu tr�n trang c�ng khai v� ch?nh s?a n?i dung VI/EN �p d?ng cho trang d�. HOME bao g?m to�n b? c�c khu v?c trang ch?.",
    ko: "??? ??? ??? ??? ?? ???? VI/EN ??? ?????. HOME? ???? ?? ??? ?????.",
  },
  pageToEdit: {
    en: "Page to edit",
    vi: "Trang c?n ch?nh s?a",
    ko: "??? ???",
  },
  saveHome: { en: "Save content", vi: "Luu n?i dung", ko: "??? ??" },
  loadingHomeEditor: {
    en: "Loading home editor...",
    vi: "�ang t?i tr�nh ch?nh s?a trang ch?...",
    ko: "???? ???? ???? ?...",
  },
  defaultHeroImageHint: {
    en: "Leave blank to use the default Gippy image.",
    vi: "�? tr?ng d? d�ng h�nh Gippy m?c d?nh.",
    ko: "???? ?? Gippy ???? ?????.",
  },
  heroSection: { en: "Hero", vi: "Khu v?c hero", ko: "??? ??" },
  heroStats: { en: "Hero stats", vi: "Ch? s? hero", ko: "??? ??" },
  partnerHook: {
    en: "Partner hook",
    vi: "Th�ng di?p thu h�t d?i t�c",
    ko: "??? ?? ??",
  },
  trustPillars: {
    en: "Trust & pillars",
    vi: "Ni?m tin & tr? c?t",
    ko: "?? ??",
  },
  processImagesCta: {
    en: "Process / Images / CTA",
    vi: "Quy tr�nh / H�nh ?nh / CTA",
    ko: "???? / ??? / CTA",
  },
  kicker: { en: "Kicker", vi: "D�ng nh?n", ko: "?? ??" },
  subtitle: { en: "Subtitle", vi: "Ph? d?", ko: "???" },
  primaryCta: { en: "Primary CTA", vi: "CTA ch�nh", ko: "?? CTA" },
  secondaryCta: { en: "Secondary CTA", vi: "CTA ph?", ko: "?? CTA" },
  heroImageUrl: {
    en: "Hero image URL",
    vi: "URL h�nh hero",
    ko: "??? ??? URL",
  },
  heroImageAlt: {
    en: "Hero image alt",
    vi: "Alt h�nh hero",
    ko: "??? ??? ?? ???",
  },
  masksValue: { en: "Masks value", vi: "Gi� tr? m?t n?", ko: "??? ??" },
  countriesValue: {
    en: "Countries value",
    vi: "Gi� tr? qu?c gia",
    ko: "?? ??",
  },
  vietnamValue: {
    en: "Vietnam value",
    vi: "Gi� tr? Vi?t Nam",
    ko: "??? ??",
  },
  masksLabel: { en: "Masks label", vi: "Nh�n m?t n?", ko: "??? ??" },
  countriesLabel: {
    en: "Countries label",
    vi: "Nh�n qu?c gia",
    ko: "?? ??",
  },
  vietnamLabel: { en: "Vietnam label", vi: "Nh�n Vi?t Nam", ko: "??? ??" },
  highlight: { en: "Highlight", vi: "�i?m nh?n", ko: "?????" },
  trustKicker: {
    en: "Trust kicker",
    vi: "D�ng nh?n ni?m tin",
    ko: "?? ?? ??",
  },
  trustTitle: { en: "Trust title", vi: "Ti�u d? ni?m tin", ko: "?? ??" },
  smallLabel: { en: "Small", vi: "Nh�n nh?", ko: "?? ??" },
  text: { en: "Text", vi: "Van b?n", ko: "???" },
  processKicker: {
    en: "Process kicker",
    vi: "D�ng nh?n quy tr�nh",
    ko: "???? ?? ??",
  },
  processTitle: {
    en: "Process title",
    vi: "Ti�u d? quy tr�nh",
    ko: "???? ??",
  },
  processBody: {
    en: "Process body",
    vi: "N?i dung quy tr�nh",
    ko: "???? ??",
  },
  imageKicker: {
    en: "Image kicker",
    vi: "D�ng nh?n h�nh ?nh",
    ko: "??? ?? ??",
  },
  imageTitle: { en: "Image title", vi: "Ti�u d? h�nh ?nh", ko: "??? ??" },
  imageBody: { en: "Image body", vi: "N?i dung h�nh ?nh", ko: "??? ??" },
  imageCta: { en: "Image CTA", vi: "CTA h�nh ?nh", ko: "??? CTA" },
  imageSlot: { en: "Image slot", vi: "V? tr� h�nh ?nh", ko: "??? ??" },
  labelVi: { en: "Label VI", vi: "Nh�n VI", ko: "VI ??" },
  labelEn: { en: "Label EN", vi: "Nh�n EN", ko: "EN ??" },
  altVi: { en: "Alt VI", vi: "Alt VI", ko: "VI ?? ???" },
  altEn: { en: "Alt EN", vi: "Alt EN", ko: "EN ?? ???" },
  ctaKicker: { en: "CTA kicker", vi: "D�ng nh?n CTA", ko: "CTA ?? ??" },
  ctaTitle: { en: "CTA title", vi: "Ti�u d? CTA", ko: "CTA ??" },
  ctaHighlight: {
    en: "CTA highlight",
    vi: "�i?m nh?n CTA",
    ko: "CTA ?????",
  },
  ctaBody: { en: "CTA body", vi: "N?i dung CTA", ko: "CTA ??" },
  ctaButton: { en: "CTA button", vi: "N�t CTA", ko: "CTA ??" },
  numberLabel: { en: "No.", vi: "STT", ko: "??" },
  titleVi: { en: "Title VI", vi: "Ti�u d? VI", ko: "VI ??" },
  titleEn: { en: "Title EN", vi: "Ti�u d? EN", ko: "EN ??" },
  ctaVi: { en: "CTA VI", vi: "CTA VI", ko: "VI CTA" },
  ctaEn: { en: "CTA EN", vi: "CTA EN", ko: "EN CTA" },
  qa: { en: "Q&A", vi: "Q&A", ko: "Q&A" },
  legalNameEn: {
    en: "Legal name (EN)",
    vi: "T�n ph�p l� (EN)",
    ko: "???(EN)",
  },
  legalNameVi: {
    en: "Legal name (VI)",
    vi: "T�n ph�p l� (VI)",
    ko: "???(VI)",
  },
  taxCode: { en: "Tax code", vi: "M� s? thu?", ko: "?? ??" },
  representative: { en: "Representative", vi: "Ngu?i d?i di?n", ko: "???" },
  address: { en: "Address", vi: "�?a ch?", ko: "??" },
  zaloPhone: {
    en: "Zalo phone (digits only)",
    vi: "S? Zalo (ch? nh?p s?)",
    ko: "Zalo ????(???)",
  },
  whatsappPhone: {
    en: "WhatsApp phone (digits only)",
    vi: "S? WhatsApp (ch? nh?p s?)",
    ko: "WhatsApp ????(???)",
  },
  deleteApplicationConfirm: {
    en: "Delete this application?",
    vi: "X�a don dang k� n�y?",
    ko: "? ??? ??????",
  },
  deleteConfirm: { en: "Delete?", vi: "X�a?", ko: "??????" },
  deleteFaqConfirm: {
    en: "Delete FAQ?",
    vi: "X�a FAQ?",
    ko: "FAQ? ??????",
  },
  deletePopupConfirm: {
    en: "Delete popup?",
    vi: "X�a popup?",
    ko: "??? ??????",
  },
  deleteEventConfirm: {
    en: "Delete this event?",
    vi: "X�a s? ki?n n�y?",
    ko: "? ???? ??????",
  },
  deleteEntryConfirm: {
    en: "Delete entry?",
    vi: "X�a m?c n�y?",
    ko: "??? ??????",
  },
  questionAnswerRequired: {
    en: "Question and answer required",
    vi: "C?n nh?p c�u h?i v� c�u tr? l?i",
    ko: "??? ??? ?????",
  },
  titleRequired: {
    en: "Title required",
    vi: "C?n nh?p ti�u d?",
    ko: "??? ?????",
  },
  titleViEnRequired: {
    en: "Title VI/EN is required",
    vi: "C?n nh?p ti�u d? VI/EN",
    ko: "VI/EN ??? ?????",
  },
  submitted: { en: "Submitted", vi: "�� g?i", ko: "???" },
  position: { en: "Position", vi: "Ch?c v?", ko: "??" },
  channel: { en: "Channel", vi: "K�nh", ko: "??" },
  monthlyVolume: {
    en: "Monthly volume",
    vi: "S?n lu?ng h?ng th�ng",
    ko: "?? ??",
  },
  brands: { en: "Brands", vi: "Thuong hi?u", ko: "???" },
  phone: { en: "Phone", vi: "�i?n tho?i", ko: "????" },
  emailReply: { en: "Email reply", vi: "Tr? l?i qua email", ko: "??? ??" },
  sortOrder: { en: "Sort order", vi: "Th? t? s?p x?p", ko: "?? ??" },
  priority: { en: "Priority", vi: "�? uu ti�n", ko: "????" },
  higherShowsFirst: {
    en: "higher shows first",
    vi: "s? cao hon hi?n th? tru?c",
    ko: "??? ???? ?? ??",
  },
  startsAt: { en: "Starts at", vi: "B?t d?u l�c", ko: "?? ??" },
  endsAt: { en: "Ends at", vi: "K?t th�c l�c", ko: "?? ??" },
  eventPageDesc: {
    en: "Create photo, video, embed and text event posts for the public Event page.",
    vi: "T?o b�i vi?t s? ki?n d?ng ?nh, video, nh�ng v� van b?n cho trang S? ki?n c�ng khai.",
    ko: "?? ??? ???? ??? ??, ???, ???, ??? ???? ????.",
  },
  contentType: { en: "Content type", vi: "Lo?i n?i dung", ko: "??? ??" },
  newProductSpotlight: {
    en: "New product spotlight",
    vi: "�i?m nh?n s?n ph?m m?i",
    ko: "??? ??",
  },
  summary: { en: "Summary", vi: "T�m t?t", ko: "??" },
  body: { en: "Body", vi: "N?i dung", ko: "??" },
  mediaType: { en: "Media type", vi: "Lo?i phuong ti?n", ko: "??? ??" },
  imageUrlOption: { en: "Image URL", vi: "URL h�nh ?nh", ko: "??? URL" },
  videoUrl: { en: "Video URL", vi: "URL video", ko: "??? URL" },
  embedUrl: { en: "Embed URL", vi: "URL nh�ng", ko: "??? URL" },
  mediaUrl: { en: "Media URL", vi: "URL phuong ti?n", ko: "??? URL" },
  eventDate: { en: "Event date", vi: "Ng�y s? ki?n", ko: "??? ??" },
  settingsDesc: {
    en: "Override the default contact info shown across the site. Empty fields fall back to built-in defaults.",
    vi: "Ghi d� th�ng tin li�n h? m?c d?nh hi?n th? tr�n to�n trang. C�c tru?ng d? tr?ng s? d�ng gi� tr? m?c d?nh c� s?n.",
    ko: "??? ??? ???? ?? ??? ??? ?????. ??? ??? ?? ???? ?????.",
  },
  all: { en: "All", vi: "T?t c?", ko: "??" },
  product: { en: "Product", vi: "S?n ph?m", ko: "??" },
  document: { en: "Document", vi: "T�i li?u", ko: "??" },
  titleQuestion: {
    en: "Title / Question",
    vi: "Ti�u d? / C�u h?i",
    ko: "?? / ??",
  },
  tags: { en: "Tags", vi: "Th?", ko: "??" },
  noTrainingData: {
    en: "No training data yet",
    vi: "Chua c� d? li?u hu?n luy?n",
    ko: "?? ?? ???? ????",
  },
  untitled: { en: "(untitled)", vi: "(chua c� ti�u d?)", ko: "(?? ??)" },
  editEntry: { en: "Edit entry", vi: "Ch?nh s?a m?c", ko: "?? ??" },
  newTrainingEntry: {
    en: "New training entry",
    vi: "M?c hu?n luy?n m?i",
    ko: "? ?? ??",
  },
  qaPair: { en: "Q&A pair", vi: "C?p h?i d�p", ko: "Q&A ?" },
  productInfo: {
    en: "Product info",
    vi: "Th�ng tin s?n ph?m",
    ko: "?? ??",
  },
  documentFreeform: {
    en: "Document / freeform",
    vi: "T�i li?u / n?i dung t? do",
    ko: "?? / ?? ??",
  },
  tagsComma: {
    en: "Tags (comma separated)",
    vi: "Th? (ph�n t�ch b?ng d?u ph?y)",
    ko: "??(??? ??)",
  },
  chatbotTrainingDesc: {
    en: "Q&A pairs, product facts, and freeform docs the chatbot can use.",
    vi: "C�c c?p h?i d�p, th�ng tin s?n ph?m v� t�i li?u t? do m� chatbot c� th? s? d?ng.",
    ko: "??? ??? ? ?? Q&A, ?? ??, ?? ?? ??? ?????.",
  },
  trainingEntries: {
    en: "Training entries",
    vi: "M?c hu?n luy?n",
    ko: "?? ??",
  },
  documentLibrary: {
    en: "Document library",
    vi: "Thu vi?n t�i li?u",
    ko: "?? ?????",
  },
  documentLibraryDesc: {
    en: "Register manuals, policies, product sheets, and long documents. They are split into searchable chunks for Gippy AI.",
    vi: "�ang k� hu?ng d?n, ch�nh s�ch, b?ng th�ng tin s?n ph?m v� t�i li?u d�i. N?i dung s? du?c chia th�nh c�c do?n c� th? t�m ki?m cho Gippy AI.",
    ko: "???, ??, ?? ??, ? ??? ?????. Gippy AI? ??? ? ??? ??? ?????.",
  },
  newDocument: { en: "New document", vi: "T�i li?u m?i", ko: "? ??" },
  editDocument: {
    en: "Edit document",
    vi: "Ch?nh s?a t�i li?u",
    ko: "?? ??",
  },
  rawContent: {
    en: "Document content",
    vi: "N?i dung t�i li?u",
    ko: "?? ??",
  },
  rawContentHint: {
    en: "Paste text from PDF, Word, product sheets, manuals, or policy documents.",
    vi: "D�n van b?n t? PDF, Word, b?ng th�ng tin s?n ph?m, hu?ng d?n ho?c t�i li?u ch�nh s�ch.",
    ko: "PDF, Word, ?? ??, ???, ?? ??? ???? ??????.",
  },
  mixed: { en: "Mixed", vi: "H?n h?p", ko: "??" },
  brand: { en: "Brand", vi: "Thuong hi?u", ko: "???" },
  b2bCategory: { en: "B2B", vi: "B2B", ko: "B2B" },
  policy: { en: "Policy", vi: "Ch�nh s�ch", ko: "??" },
  manual: { en: "Manual", vi: "Hu?ng d?n", ko: "???" },
  other: { en: "Other", vi: "Kh�c", ko: "??" },
  chunks: { en: "Chunks", vi: "�o?n", ko: "??" },
  previewChunks: {
    en: "Preview chunks",
    vi: "Xem tru?c c�c do?n",
    ko: "?? ????",
  },
  processDocument: {
    en: "Process document",
    vi: "X? l� t�i li?u",
    ko: "?? ??",
  },
  processingComplete: {
    en: "Document processed",
    vi: "�� x? l� t�i li?u",
    ko: "?? ?? ??",
  },
  documentRequired: {
    en: "Title and content are required.",
    vi: "C?n nh?p ti�u d? v� n?i dung.",
    ko: "??? ??? ?????.",
  },
  archived: { en: "Archived", vi: "�� luu tr?", ko: "???" },
  failed: { en: "Failed", vi: "Th?t b?i", ko: "??" },
  sourceScope: { en: "Source scope", vi: "Ph?m vi ngu?n", ko: "?? ??" },
  chatUiModes: {
    en: "Customer chat UI modes",
    vi: "Ch? d? giao di?n chat kh�ch h�ng",
    ko: "?? ?? UI ??",
  },
  chatUiModesDesc: {
    en: "Manage both guided tree answers and natural-language AI answers from the same approved knowledge base.",
    vi: "Qu?n l� c? c�u tr? l?i d?ng c�y hu?ng d?n v� c�u tr? l?i AI ng�n ng? t? nhi�n t? c�ng m?t kho ki?n th?c d� duy?t.",
    ko: "??? ?? ??????? ??? ?? ??? ??? AI ??? ?? ?????.",
  },
  treeMode: {
    en: "Tree guide mode",
    vi: "Ch? d? hu?ng d?n d?ng c�y",
    ko: "?? ??? ??",
  },
  naturalMode: {
    en: "Natural AI chat mode",
    vi: "Ch? d? chat AI t? nhi�n",
    ko: "??? AI ?? ??",
  },
  treeModeDesc: {
    en: "Button and branch-based flows for fast product, B2B, brand, and contact guidance.",
    vi: "Lu?ng d?a tr�n n�t v� nh�nh d? hu?ng d?n nhanh v? s?n ph?m, B2B, thuong hi?u v� li�n h?.",
    ko: "??, B2B, ???, ??? ??? ??? ???? ??/?? ?? ?????.",
  },
  naturalModeDesc: {
    en: "Free-text questions answered only from approved Q&A, product facts, and document chunks.",
    vi: "C�u h?i t? do ch? du?c tr? l?i d?a tr�n Q&A, th�ng tin s?n ph?m v� do?n t�i li?u d� duy?t.",
    ko: "?? ?? ??? ??? Q&A, ?? ??, ?? ??? ???? ?????.",
  },
  sharedKnowledgeBase: {
    en: "Shared knowledge base",
    vi: "Kho ki?n th?c d�ng chung",
    ko: "?? ?????",
  },
  treeScenario: {
    en: "Tree scenario",
    vi: "K?ch b?n d?ng c�y",
    ko: "?? ????",
  },
  scenarioId: { en: "Scenario ID", vi: "ID k?ch b?n", ko: "???? ID" },
  parentId: { en: "Parent ID", vi: "ID m?c cha", ko: "?? ID" },
  buttonLabel: { en: "Button label", vi: "Nh�n n�t", ko: "?? ??" },
  answerMode: { en: "Answer mode", vi: "Ch? d? tr? l?i", ko: "?? ??" },
  new: { en: "New", vi: "M?i", ko: "??" },
  reviewing: { en: "Reviewing", vi: "�ang xem x�t", ko: "?? ?" },
  approved: { en: "Approved", vi: "�� duy?t", ko: "???" },
  rejected: { en: "Rejected", vi: "�� t? ch?i", ko: "???" },
  replied: { en: "Replied", vi: "�� tr? l?i", ko: "?? ??" },
  closed: { en: "Closed", vi: "�� d�ng", ko: "???" },
} satisfies Record<string, TriText>;

function tx(lang: AdminLang, key: keyof typeof ADMIN_I18N) {
  return ADMIN_I18N[key][lang] || ADMIN_I18N[key].en;
}

function statusText(lang: AdminLang, status?: string | null) {
  if (!status) return "-";
  const entry = ADMIN_I18N[status as keyof typeof ADMIN_I18N];
  if (!entry) return status;
  return entry[lang] || entry.en || status;
}

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
          <StatsTab lang={adminLang} />
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
              <ProductsAdminTab lang={adminLang} />
            </TabsContent>
            <TabsContent value="catalogs">
              <ProductCatalogsAdminTab lang={adminLang} />
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
              <DealersTab lang={adminLang} />
            </TabsContent>
            <TabsContent value="contacts">
              <ContactsTab lang={adminLang} />
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
              <HomeEditorTab lang={adminLang} />
            </TabsContent>
            <TabsContent value="events">
              <EventsTab lang={adminLang} />
            </TabsContent>
            <TabsContent value="popups">
              <PopupsTab lang={adminLang} />
            </TabsContent>
            <TabsContent value="faqs">
              <FaqsTab lang={adminLang} />
            </TabsContent>
            <TabsContent value="chatbot">
              <ChatbotTab lang={adminLang} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <SettingsTab lang={adminLang} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

/* ---------------- Stats ---------------- */

function StatsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [stats, setStats] = useState({
    dealers: 0,
    contacts: 0,
    faqs: 0,
    popups: 0,
    events: 0,
    training: 0,
    newDealers: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [d, c, f, p, e, t, nd] = await Promise.all([
      supabase.from("b2b_inquiries").select("*", { count: "exact", head: true }),
      supabase.from("chatbot_records").select("*", { count: "exact", head: true }),
      supabase.from("faqs").select("*", { count: "exact", head: true }),
      supabase.from("popups").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("chatbot_training").select("*", { count: "exact", head: true }),
      supabase
        .from("b2b_inquiries")
        .select("*", { count: "exact", head: true })
        .eq("status", "new"),
    ]);
    setStats({
      dealers: d.count ?? 0,
      contacts: c.count ?? 0,
      faqs: f.count ?? 0,
      popups: p.count ?? 0,
      events: e.count ?? 0,
      training: t.count ?? 0,
      newDealers: nd.count ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const cards = [
    {
      label: t("dealerApplications"),
      value: stats.dealers,
      accent: "text-gold",
    },
    {
      label: t("newUnhandled"),
      value: stats.newDealers,
      accent: "text-primary",
    },
    { label: t("generalInquiries"), value: stats.contacts },
    { label: t("publishedFaqs"), value: stats.faqs },
    { label: t("popups"), value: stats.popups },
    { label: t("events"), value: stats.events },
    { label: t("chatbotTraining"), value: stats.training },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">{t("overview")}</h2>
        <Button variant="outline" size="sm" onClick={load} className="rounded-full">
          <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className={`mt-2 font-display text-4xl ${c.accent ?? ""}`}>
              {loading ? "..." : c.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Content editor ---------------- */

function TextPair({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  multiline?: boolean;
}) {
  const Comp = multiline ? Textarea : Input;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <Label>{label} VI</Label>
        <Comp
          className="mt-1.5"
          value={value.vi}
          rows={multiline ? 3 : undefined}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange({ ...value, vi: e.target.value })
          }
        />
      </div>
      <div>
        <Label>{label} EN</Label>
        <Comp
          className="mt-1.5"
          value={value.en}
          rows={multiline ? 3 : undefined}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange({ ...value, en: e.target.value })
          }
        />
      </div>
    </div>
  );
}

function PageTextEditor({
  form,
  onChange,
  t,
}: {
  form: PageEditableContent;
  onChange: (next: PageEditableContent) => void;
  t: (key: keyof typeof ADMIN_I18N) => string;
}) {
  const patch = (next: Partial<PageEditableContent>) => onChange({ ...form, ...next });
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
      <h3 className="font-display text-xl">{t("content")}</h3>
      <TextPair label={t("kicker")} value={form.kicker} onChange={(v) => patch({ kicker: v })} />
      <TextPair
        label={t("title")}
        value={form.title}
        onChange={(v) => patch({ title: v })}
        multiline
      />
      <TextPair
        label={t("highlight")}
        value={form.highlight}
        onChange={(v) => patch({ highlight: v })}
        multiline
      />
      <TextPair
        label={t("description")}
        value={form.description}
        onChange={(v) => patch({ description: v })}
        multiline
      />
      <TextPair
        label={t("primaryCta")}
        value={form.primaryCta}
        onChange={(v) => patch({ primaryCta: v })}
      />
      <TextPair
        label={t("secondaryCta")}
        value={form.secondaryCta}
        onChange={(v) => patch({ secondaryCta: v })}
      />
    </section>
  );
}

function HomeEditorTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [selectedPage, setSelectedPage] = useState<"home" | PageContentKey>("home");
  const [form, setForm] = useState<HomeAdminContent>(DEFAULT_HOME_CONTENT);
  const [pageForm, setPageForm] = useState<PageEditableContent>(DEFAULT_PAGE_CONTENT.brand);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    if (selectedPage === "home") {
      const { data, error } = await supabase
        .from("home_content")
        .select("value")
        .eq("key", "home")
        .maybeSingle();
      if (error) toast.error(error.message);
      setForm(mergeHomeContent(data?.value));
    } else {
      const { data, error } = await supabase
        .from("home_content")
        .select("value")
        .eq("key", pageContentStorageKey(selectedPage))
        .maybeSingle();
      if (error) toast.error(error.message);
      setPageForm(mergePageContent(selectedPage, data?.value));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [selectedPage]);

  const patch = (next: Partial<HomeAdminContent>) => setForm((prev) => ({ ...prev, ...next }));
  const patchHero = (next: Partial<HomeAdminContent["hero"]>) =>
    patch({ hero: { ...form.hero, ...next } });
  const patchStats = (next: Partial<HomeAdminContent["stats"]>) =>
    patch({ stats: { ...form.stats, ...next } });
  const patchPartner = (next: Partial<HomeAdminContent["partnerHook"]>) =>
    patch({ partnerHook: { ...form.partnerHook, ...next } });
  const patchTrust = (next: Partial<HomeAdminContent["trust"]>) =>
    patch({ trust: { ...form.trust, ...next } });
  const patchProcess = (next: Partial<HomeAdminContent["process"]>) =>
    patch({ process: { ...form.process, ...next } });
  const patchImages = (next: Partial<HomeAdminContent["images"]>) =>
    patch({ images: { ...form.images, ...next } });
  const patchCta = (next: Partial<HomeAdminContent["cta"]>) =>
    patch({ cta: { ...form.cta, ...next } });

  const save = async () => {
    setSaving(true);
    const row =
      selectedPage === "home"
        ? ({ key: "home", value: form as Json } satisfies HomeContentInsert)
        : ({
            key: pageContentStorageKey(selectedPage),
            value: pageForm as Json,
          } satisfies HomeContentInsert);
    const { error } = await supabase.from("home_content").upsert(row);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
  };

  const resetDefaults = () => {
    if (!confirm(t("resetHomeConfirm"))) return;
    if (selectedPage === "home") setForm(DEFAULT_HOME_CONTENT);
    else setPageForm(DEFAULT_PAGE_CONTENT[selectedPage]);
  };

  if (loading)
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
        {t("loadingHomeEditor")}
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">{t("homeEditor")}</h2>
          <p className="text-sm text-muted-foreground">{t("homeEditorDesc")}</p>
          <div className="mt-4 max-w-xs">
            <Label>{t("pageToEdit")}</Label>
            <Select
              value={selectedPage}
              onValueChange={(v) => setSelectedPage(v as "home" | PageContentKey)}
            >
              <SelectTrigger className="mt-1.5 rounded-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_CONTENT_OPTIONS.map((page) => (
                  <SelectItem key={page.key} value={page.key}>
                    {page.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={load} className="rounded-full">
            <RefreshCw className="mr-1 h-4 w-4" /> {t("reload")}
          </Button>
          <Button variant="outline" onClick={resetDefaults} className="rounded-full">
            {t("reset")}
          </Button>
          <Button onClick={save} disabled={saving} className="rounded-full">
            {saving ? t("saving") : t("saveHome")}
          </Button>
        </div>
      </div>

      {selectedPage !== "home" ? (
        <PageTextEditor form={pageForm} onChange={setPageForm} t={t} />
      ) : (
        <>
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
            <h3 className="font-display text-xl">{t("heroSection")}</h3>
            <TextPair
              label={t("kicker")}
              value={form.hero.kicker}
              onChange={(v) => patchHero({ kicker: v })}
            />
            <TextPair
              label={t("title")}
              value={form.hero.title}
              onChange={(v) => patchHero({ title: v })}
              multiline
            />
            <TextPair
              label={t("subtitle")}
              value={form.hero.subtitle}
              onChange={(v) => patchHero({ subtitle: v })}
              multiline
            />
            <TextPair
              label={t("primaryCta")}
              value={form.hero.primaryCta}
              onChange={(v) => patchHero({ primaryCta: v })}
            />
            <TextPair
              label={t("secondaryCta")}
              value={form.hero.secondaryCta}
              onChange={(v) => patchHero({ secondaryCta: v })}
            />
            <div>
              <Label>{t("heroImageUrl")}</Label>
              <Input
                className="mt-1.5"
                placeholder="https://..."
                value={form.hero.imageUrl}
                onChange={(e) => patchHero({ imageUrl: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("defaultHeroImageHint")}</p>
            </div>
            <TextPair
              label={t("heroImageAlt")}
              value={form.hero.imageAlt}
              onChange={(v) => patchHero({ imageAlt: v })}
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
            <h3 className="font-display text-xl">{t("heroStats")}</h3>
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <Label>{t("masksValue")}</Label>
                <Input
                  className="mt-1.5"
                  value={form.stats.masksValue}
                  onChange={(e) => patchStats({ masksValue: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("countriesValue")}</Label>
                <Input
                  className="mt-1.5"
                  value={form.stats.countriesValue}
                  onChange={(e) => patchStats({ countriesValue: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("vietnamValue")}</Label>
                <Input
                  className="mt-1.5"
                  value={form.stats.vietnamValue}
                  onChange={(e) => patchStats({ vietnamValue: e.target.value })}
                />
              </div>
            </div>
            <TextPair
              label={t("masksLabel")}
              value={form.stats.masksLabel}
              onChange={(v) => patchStats({ masksLabel: v })}
            />
            <TextPair
              label={t("countriesLabel")}
              value={form.stats.countriesLabel}
              onChange={(v) => patchStats({ countriesLabel: v })}
            />
            <TextPair
              label={t("vietnamLabel")}
              value={form.stats.vietnamLabel}
              onChange={(v) => patchStats({ vietnamLabel: v })}
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
            <h3 className="font-display text-xl">{t("partnerHook")}</h3>
            <TextPair
              label={t("kicker")}
              value={form.partnerHook.kicker}
              onChange={(v) => patchPartner({ kicker: v })}
            />
            <TextPair
              label={t("title")}
              value={form.partnerHook.title}
              onChange={(v) => patchPartner({ title: v })}
              multiline
            />
            <TextPair
              label={t("highlight")}
              value={form.partnerHook.highlight}
              onChange={(v) => patchPartner({ highlight: v })}
            />
            <TextPair
              label={t("body")}
              value={form.partnerHook.body}
              onChange={(v) => patchPartner({ body: v })}
              multiline
            />
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
            <h3 className="font-display text-xl">{t("trustPillars")}</h3>
            <TextPair
              label={t("trustKicker")}
              value={form.trust.kicker}
              onChange={(v) => patchTrust({ kicker: v })}
            />
            <TextPair
              label={t("trustTitle")}
              value={form.trust.title}
              onChange={(v) => patchTrust({ title: v })}
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {form.pillars.map((pillar, i) => (
                <div key={pillar.num} className="space-y-3 rounded-xl border border-border/60 p-4">
                  <div className="grid grid-cols-[70px_1fr] gap-2">
                    <div>
                      <Label>{t("numberLabel")}</Label>
                      <Input
                        className="mt-1.5"
                        value={pillar.num}
                        onChange={(e) => {
                          const xs = [...form.pillars];
                          xs[i] = { ...pillar, num: e.target.value };
                          patch({ pillars: xs });
                        }}
                      />
                    </div>
                    <TextPair
                      label={t("smallLabel")}
                      value={pillar.eng}
                      onChange={(v) => {
                        const xs = [...form.pillars];
                        xs[i] = { ...pillar, eng: v };
                        patch({ pillars: xs });
                      }}
                    />
                  </div>
                  <TextPair
                    label={t("title")}
                    value={pillar.title}
                    onChange={(v) => {
                      const xs = [...form.pillars];
                      xs[i] = { ...pillar, title: v };
                      patch({ pillars: xs });
                    }}
                  />
                  <TextPair
                    label={t("text")}
                    value={pillar.text}
                    onChange={(v) => {
                      const xs = [...form.pillars];
                      xs[i] = { ...pillar, text: v };
                      patch({ pillars: xs });
                    }}
                    multiline
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:p-6">
            <h3 className="font-display text-xl">{t("processImagesCta")}</h3>
            <TextPair
              label={t("processKicker")}
              value={form.process.kicker}
              onChange={(v) => patchProcess({ kicker: v })}
            />
            <TextPair
              label={t("processTitle")}
              value={form.process.title}
              onChange={(v) => patchProcess({ title: v })}
              multiline
            />
            <TextPair
              label={t("processBody")}
              value={form.process.body}
              onChange={(v) => patchProcess({ body: v })}
              multiline
            />
            <TextPair
              label={t("imageKicker")}
              value={form.images.kicker}
              onChange={(v) => patchImages({ kicker: v })}
            />
            <TextPair
              label={t("imageTitle")}
              value={form.images.title}
              onChange={(v) => patchImages({ title: v })}
              multiline
            />
            <TextPair
              label={t("imageBody")}
              value={form.images.body}
              onChange={(v) => patchImages({ body: v })}
              multiline
            />
            <TextPair
              label={t("imageCta")}
              value={form.images.cta}
              onChange={(v) => patchImages({ cta: v })}
            />
            <div className="grid gap-4 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="space-y-3 rounded-xl border border-border/60 p-4">
                  <h4 className="font-semibold">
                    {t("imageSlot")} {index + 1}
                  </h4>
                  <div>
                    <Label>{t("imageUrl")}</Label>
                    <Input
                      className="mt-1.5"
                      placeholder="https://..."
                      value={form.images.urls[index] || ""}
                      onChange={(e) => {
                        const urls = [...form.images.urls];
                        urls[index] = e.target.value;
                        patchImages({ urls });
                      }}
                    />
                  </div>
                  <div>
                    <Label>{t("labelVi")}</Label>
                    <Input
                      className="mt-1.5"
                      value={form.images.labels.vi[index] || ""}
                      onChange={(e) => {
                        const labels = {
                          vi: [...form.images.labels.vi],
                          en: [...form.images.labels.en],
                        };
                        labels.vi[index] = e.target.value;
                        patchImages({ labels });
                      }}
                    />
                  </div>
                  <div>
                    <Label>{t("labelEn")}</Label>
                    <Input
                      className="mt-1.5"
                      value={form.images.labels.en[index] || ""}
                      onChange={(e) => {
                        const labels = {
                          vi: [...form.images.labels.vi],
                          en: [...form.images.labels.en],
                        };
                        labels.en[index] = e.target.value;
                        patchImages({ labels });
                      }}
                    />
                  </div>
                  <div>
                    <Label>{t("altVi")}</Label>
                    <Input
                      className="mt-1.5"
                      value={form.images.alts.vi[index] || ""}
                      onChange={(e) => {
                        const alts = {
                          vi: [...form.images.alts.vi],
                          en: [...form.images.alts.en],
                        };
                        alts.vi[index] = e.target.value;
                        patchImages({ alts });
                      }}
                    />
                  </div>
                  <div>
                    <Label>{t("altEn")}</Label>
                    <Input
                      className="mt-1.5"
                      value={form.images.alts.en[index] || ""}
                      onChange={(e) => {
                        const alts = {
                          vi: [...form.images.alts.vi],
                          en: [...form.images.alts.en],
                        };
                        alts.en[index] = e.target.value;
                        patchImages({ alts });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <TextPair
              label={t("ctaKicker")}
              value={form.cta.kicker}
              onChange={(v) => patchCta({ kicker: v })}
            />
            <TextPair
              label={t("ctaTitle")}
              value={form.cta.title}
              onChange={(v) => patchCta({ title: v })}
              multiline
            />
            <TextPair
              label={t("ctaHighlight")}
              value={form.cta.highlight}
              onChange={(v) => patchCta({ highlight: v })}
              multiline
            />
            <TextPair
              label={t("ctaBody")}
              value={form.cta.body}
              onChange={(v) => patchCta({ body: v })}
              multiline
            />
            <TextPair
              label={t("ctaButton")}
              value={form.cta.button}
              onChange={(v) => patchCta({ button: v })}
            />
          </section>
        </>
      )}
    </div>
  );
}

/* ---------------- Dealers (B2B inquiries) ---------------- */

const DEALER_STATUSES = ["new", "reviewing", "approved", "rejected"] as const;
const DEALER_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "secondary",
  reviewing: "outline",
  approved: "default",
  rejected: "destructive",
};

function DealersTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<B2BInquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<B2BInquiryRow | null>(null);
  const [page, setPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  const load = async () => {
    setLoading(true);
    const { from, to } = pageRange(page);
    const { data, error, count } = await supabase
      .from("b2b_inquiries")
      .select("*", { count: "estimated" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) toast.error(error.message);
    else {
      setRows(data ?? []);
      setTotalRows(count ?? data?.length ?? 0);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [page]);

  const updateApplication = async (id: string, patch: B2BInquiryUpdate) => {
    const { error } = await supabase.from("b2b_inquiries").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("updated"));
    setRows((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setSelected((x) => (x?.id === id ? { ...x, ...patch } : x));
  };

  const updateStatus = async (id: string, status: string) => {
    await updateApplication(id, { status });
  };

  const saveNote = async () => {
    if (!selected) return;
    await updateApplication(selected.id, {
      admin_note: selected.admin_note ?? "",
    });
  };

  const remove = async (id: string) => {
    if (!confirm(t("deleteApplicationConfirm"))) return;
    const { error } = await supabase.from("b2b_inquiries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
    setSelected(null);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">
          {t("dealerApplications")}{" "}
          <span className="text-sm text-muted-foreground">({rows.length})</span>
        </h2>
        <Button variant="outline" size="sm" onClick={load} className="rounded-full">
          <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("company")}</TableHead>
              <TableHead>{t("contact")}</TableHead>
              <TableHead>{t("city")}</TableHead>
              <TableHead>{t("volume")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {t("loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {t("noApplications")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((q) => (
              <TableRow key={q.id}>
                <TableCell>
                  <div className="font-medium">{q.company}</div>
                  <div className="text-xs text-muted-foreground">{q.position}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.email}</div>
                </TableCell>
                <TableCell className="text-sm">{q.city}</TableCell>
                <TableCell className="text-sm">{q.monthly_volume}</TableCell>
                <TableCell>
                  <Select value={q.status} onValueChange={(v) => updateStatus(q.id, v)}>
                    <SelectTrigger className="h-8 w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEALER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusText(lang, s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(q.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => setSelected(q)}>
                    {t("view")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        page={page}
        canNext={(page + 1) * ADMIN_PAGE_SIZE < totalRows}
        onPrevious={() => setPage((value) => Math.max(0, value - 1))}
        onNext={() => setPage((value) => value + 1)}
      />

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <Badge
                  variant={DEALER_STATUS_VARIANT[selected.status] ?? "outline"}
                  className="w-fit"
                >
                  {statusText(lang, selected.status)}
                </Badge>
                <DialogTitle className="font-display text-2xl">{selected.company}</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {t("submitted")} {new Date(selected.created_at).toLocaleString()}
                </p>
              </DialogHeader>
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <Field label={t("position")} value={selected.position} />
                <Field label={t("city")} value={selected.city} />
                <Field label={t("channel")} value={selected.channel} />
                <Field label={t("monthlyVolume")} value={selected.monthly_volume} />
                <Field label={t("brands")} value={selected.brands || "-"} />
                <Field label={t("contact")} value={selected.name} />
                <Field label={t("email")} value={selected.email} />
                <Field label={t("phone")} value={selected.phone} />
              </div>
              {selected.message && (
                <div className="rounded-xl bg-muted p-4 text-sm">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("message")}
                  </div>
                  {selected.message}
                </div>
              )}
              <div>
                <Label>{t("adminNote")}</Label>
                <Textarea
                  className="mt-1.5"
                  rows={4}
                  value={selected.admin_note ?? ""}
                  onChange={(e) => setSelected({ ...selected, admin_note: e.target.value })}
                  placeholder={t("adminNote")}
                />
              </div>
              <DialogFooter className="flex-wrap gap-2 sm:justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t("status")}
                  </Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => {
                      updateStatus(selected.id, v);
                      setSelected({ ...selected, status: v });
                    }}
                  >
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEALER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusText(lang, s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={saveNote}>
                    {t("saveNote")}
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={`mailto:${selected.email}`}>{t("emailReply")}</a>
                  </Button>
                  <Button variant="destructive" onClick={() => remove(selected.id)}>
                    <Trash2 className="mr-1 h-4 w-4" /> {t("delete")}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function PaginationControls({
  page,
  canNext,
  onPrevious,
  onNext,
}: {
  page: number;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <Button variant="outline" size="sm" onClick={onPrevious} disabled={page === 0}>
        Previous
      </Button>
      <span>Page {page + 1}</span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={!canNext}>
        Next
      </Button>
    </div>
  );
}

/* ---------------- Chatbot records ---------------- */

const CONTACT_STATUSES = ["new", "replied", "closed"] as const;

type ChatbotRecordRow = Database["public"]["Tables"]["chatbot_records"]["Row"];
type ChatbotRecordPatch = Database["public"]["Tables"]["chatbot_records"]["Update"];

type ContactSessionGroup = {
  sessionId: string;
  records: ChatbotRecordRow[];
  latest: ChatbotRecordRow;
  first: ChatbotRecordRow;
};

function ContactsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<ChatbotRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("chatbot_records")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(CHATBOT_RECORD_LIMIT);
    if (date) {
      const from = new Date(`${date}T00:00:00`);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      query = query.gte("created_at", from.toISOString()).lt("created_at", to.toISOString());
    }
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [date]);

  const sessionGroups = useMemo(() => {
    const map = new Map<string, ContactSessionGroup>();
    for (const row of rows) {
      const sessionId = row.session_id || `unknown-${row.id}`;
      const group = map.get(sessionId) ?? {
        sessionId,
        records: [] as ChatbotRecordRow[],
        latest: row,
        first: row,
      };
      group.records.push(row);
      if (new Date(row.created_at).getTime() > new Date(group.latest.created_at).getTime())
        group.latest = row;
      if (new Date(row.created_at).getTime() < new Date(group.first.created_at).getTime())
        group.first = row;
      map.set(sessionId, group);
    }
    return Array.from(map.values())
      .map((group) => ({
        ...group,
        records: [...group.records].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
      }))
      .sort(
        (a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime(),
      );
  }, [rows]);

  const selectedSession = selectedSessionId
    ? (sessionGroups.find((group) => group.sessionId === selectedSessionId) ?? null)
    : null;

  const updateRecord = async (id: string, patch: ChatbotRecordPatch) => {
    const { error } = await supabase.from("chatbot_records").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("updated"));
    setRows((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const remove = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    const { error } = await supabase.from("chatbot_records").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">
          {t("userSessions")}{" "}
          <span className="text-sm text-muted-foreground">
            ({sessionGroups.length} / {rows.length})
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-xs text-muted-foreground">{t("dateFilter")}</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 w-[160px]"
          />
          {date && (
            <Button variant="ghost" size="sm" onClick={() => setDate("")}>
              {t("clearFilter")}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} className="rounded-full">
            <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
          </Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("sessionId")}</TableHead>
              <TableHead>{t("latestMessage")}</TableHead>
              <TableHead>{t("messageCount")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {t("loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && sessionGroups.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {t("noInquiries")}
                </TableCell>
              </TableRow>
            )}
            {sessionGroups.map((group) => (
              <TableRow key={group.sessionId}>
                <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                  {group.sessionId}
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="truncate text-sm font-medium">
                    {group.latest.customer_message}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {group.latest.chatbot_reply}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-semibold">{group.records.length}</TableCell>
                <TableCell>
                  <Badge variant="outline">{statusText(lang, group.latest.status)}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(group.latest.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedSessionId(group.sessionId)}
                  >
                    {t("view")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedSession} onOpenChange={(o) => !o && setSelectedSessionId(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle>{t("conversation")}</DialogTitle>
                <p className="break-all text-xs text-muted-foreground">
                  {t("sessionId")}: {selectedSession.sessionId} � {t("messageCount")}:{" "}
                  {selectedSession.records.length}
                </p>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                {selectedSession.records.map((record) => (
                  <div key={record.id} className="rounded-2xl border border-border/60 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{new Date(record.created_at).toLocaleString()}</span>
                      <Select
                        value={record.status}
                        onValueChange={(v) => updateRecord(record.id, { status: v })}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTACT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusText(lang, s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl bg-muted p-4">
                        <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                          {t("customer")}
                        </div>
                        {record.customer_message}
                      </div>
                      <div className="rounded-xl bg-card p-4 ring-1 ring-border/60">
                        <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                          {t("chatbotAnswer")}
                        </div>
                        {record.chatbot_reply}
                      </div>
                      <div>
                        <Label>{t("adminNote")}</Label>
                        <Textarea
                          className="mt-1.5"
                          rows={3}
                          value={record.admin_note ?? ""}
                          onChange={(e) =>
                            setRows((xs) =>
                              xs.map((x) =>
                                x.id === record.id ? { ...x, admin_note: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateRecord(record.id, {
                              admin_note: record.admin_note ?? "",
                            })
                          }
                        >
                          {t("saveNote")}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(record.id)}>
                          <Trash2 className="mr-1 h-4 w-4" /> {t("delete")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} /* ---------------- FAQs ---------------- */

type FAQ = {
  id?: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  published: boolean;
};
const emptyFaq: FAQ = {
  question: "",
  answer: "",
  category: "general",
  sort_order: 0,
  published: true,
};

type FaqLangFilter = "ko" | "en" | "vi";

const FAQ_LANG_OPTIONS: { value: FaqLangFilter; label: string }[] = [
  { value: "ko", label: "???" },
  { value: "en", label: "English" },
  { value: "vi", label: "Ti?ng Vi?t" },
];

const getFaqLang = (category?: string | null): FaqLangFilter => {
  if ((category ?? "").startsWith("EN | ")) return "en";
  if ((category ?? "").startsWith("VI | ")) return "vi";
  return "ko";
};

const stripFaqLangPrefix = (category?: string | null) =>
  (category ?? "").replace(/^(EN|VI) \| /, "");

function FaqsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<FaqRow[]>([]);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [open, setOpen] = useState(false);
  const [faqLang, setFaqLang] = useState<FaqLangFilter>("ko");

  const load = async () => {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("sort_order")
      .order("created_at");
    if (error) toast.error(error.message);
    else setRows(data ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.question.trim() || !editing.answer.trim())
      return toast.error(t("questionAnswerRequired"));
    const payload = { ...editing };
    const res = editing.id
      ? await supabase.from("faqs").update(payload).eq("id", editing.id)
      : await supabase.from("faqs").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("deleteFaqConfirm"))) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  const visibleRows = rows.filter((row) => getFaqLang(row.category) === faqLang);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-2xl">
            {t("faq")} ({visibleRows.length}/{rows.length})
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {FAQ_LANG_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={faqLang === option.value ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setFaqLang(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(emptyFaq);
            setOpen(true);
          }}
          className="rounded-full"
        >
          <Plus className="mr-1 h-4 w-4" /> {t("newFaq")}
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("question")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("order")}</TableHead>
              <TableHead>{t("published")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  {t("noFaqs")}
                </TableCell>
              </TableRow>
            )}
            {visibleRows.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="max-w-md">
                  <div className="font-medium">{f.question}</div>
                  <div className="truncate text-xs text-muted-foreground">{f.answer}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{stripFaqLangPrefix(f.category)}</Badge>
                </TableCell>
                <TableCell className="text-sm">{f.sort_order}</TableCell>
                <TableCell>
                  {f.published ? (
                    <Badge>{t("live")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("draft")}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(f);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(f.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editFaq") : t("newFaq")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>{t("question")}</Label>
                <Input
                  className="mt-1.5"
                  value={editing.question}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("answer")}</Label>
                <Textarea
                  className="mt-1.5"
                  rows={5}
                  value={editing.answer}
                  onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("category")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.category}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("sortOrder")}</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        sort_order: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <Label>{t("published")}</Label>
                <Switch
                  checked={editing.published}
                  onCheckedChange={(v) => setEditing({ ...editing, published: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={save}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Popups ---------------- */

type Popup = {
  id?: string;
  title: string;
  content: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
};
const emptyPopup: Popup = {
  title: "",
  content: "",
  image_url: "",
  cta_label: "",
  cta_url: "",
  active: false,
  priority: 0,
  starts_at: null,
  ends_at: null,
};

// Convert ISO string <-> <input type="datetime-local"> value (local time)
const isoToLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const localInputToIso = (v: string) => (v ? new Date(v).toISOString() : null);

const popupSchedulingState = (p: {
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}) => {
  if (!p.active) return { label: "Off", variant: "secondary" as const };
  const now = Date.now();
  if (p.starts_at && new Date(p.starts_at).getTime() > now)
    return { label: "Scheduled", variant: "outline" as const };
  if (p.ends_at && new Date(p.ends_at).getTime() < now)
    return { label: "Expired", variant: "secondary" as const };
  return { label: "Live", variant: "default" as const };
};

function PopupsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const popupStateLabel = (label: string) =>
    label === "Off"
      ? t("off")
      : label === "Scheduled"
        ? t("scheduled")
        : label === "Expired"
          ? t("expired")
          : t("live");
  const [rows, setRows] = useState<PopupRow[]>([]);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("popups")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error(t("titleRequired"));
    const res = editing.id
      ? await supabase.from("popups").update(editing).eq("id", editing.id)
      : await supabase.from("popups").insert(editing);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("deletePopupConfirm"))) return;
    const { error } = await supabase.from("popups").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("popups").update({ active }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.map((x) => (x.id === id ? { ...x, active } : x)));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">
          {t("popups")} ({rows.length})
        </h2>
        <Button
          onClick={() => {
            setEditing(emptyPopup);
            setOpen(true);
          }}
          className="rounded-full"
        >
          <Plus className="mr-1 h-4 w-4" /> {t("newPopup")}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
            {t("noPopups")}
          </div>
        )}
        {rows.map((p) => {
          const state = popupSchedulingState(p);
          return (
            <div key={p.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt=""
                  className="mb-3 aspect-video w-full rounded-lg object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-lg">{p.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {t("priority")} {p.priority ?? 0}
                  </div>
                </div>
                <Switch checked={p.active} onCheckedChange={(v) => toggle(p.id, v)} />
              </div>
              {p.content && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
              )}
              {(p.starts_at || p.ends_at) && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {p.starts_at ? new Date(p.starts_at).toLocaleString() : "-"} -
                  {p.ends_at ? new Date(p.ends_at).toLocaleString() : "-"}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <Badge variant={state.variant}>{popupStateLabel(state.label)}</Badge>
                <div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editPopup") : t("newPopup")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>{t("title")}</Label>
                <Input
                  className="mt-1.5"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("content")}</Label>
                <Textarea
                  className="mt-1.5"
                  rows={3}
                  value={editing.content ?? ""}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("imageUrl")}</Label>
                <Input
                  className="mt-1.5"
                  value={editing.image_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("ctaLabel")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.cta_label ?? ""}
                    onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("ctaUrl")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.cta_url ?? ""}
                    onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("startsAt")}</Label>
                  <Input
                    className="mt-1.5"
                    type="datetime-local"
                    value={isoToLocalInput(editing.starts_at)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        starts_at: localInputToIso(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("endsAt")}</Label>
                  <Input
                    className="mt-1.5"
                    type="datetime-local"
                    value={isoToLocalInput(editing.ends_at)}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        ends_at: localInputToIso(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>
                  {t("priority")}{" "}
                  <span className="text-xs text-muted-foreground">({t("higherShowsFirst")})</span>
                </Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={editing.priority ?? 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      priority: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <Label>{t("active")}</Label>
                <Switch
                  checked={editing.active}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={save}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Events ---------------- */

type EventItem = {
  id?: string;
  title_vi: string;
  title_en: string;
  summary_vi: string | null;
  summary_en: string | null;
  body_vi: string | null;
  body_en: string | null;
  media_url: string | null;
  media_type: string;
  cta_label_vi: string | null;
  cta_label_en: string | null;
  cta_url: string | null;
  event_date: string | null;
  sort_order: number;
  featured: boolean;
  published: boolean;
  post_type: "event" | "new_product";
};

const emptyEvent: EventItem = {
  title_vi: "",
  title_en: "",
  summary_vi: "",
  summary_en: "",
  body_vi: "",
  body_en: "",
  media_url: "",
  media_type: "image",
  cta_label_vi: "",
  cta_label_en: "",
  cta_url: "",
  event_date: "",
  sort_order: 0,
  featured: false,
  published: false,
  post_type: "event",
};

function EventsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  const load = async () => {
    setLoading(true);
    const { from, to } = pageRange(page);
    const { data, error, count } = await supabase
      .from("events")
      .select("*", { count: "estimated" })
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: false })
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) toast.error(error.message);
    else {
      setRows(data ?? []);
      setTotalRows(count ?? data?.length ?? 0);
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, [page]);

  const save = async () => {
    if (!editing) return;
    if (!editing.title_vi.trim() || !editing.title_en.trim()) {
      toast.error(t("titleViEnRequired"));
      return;
    }
    const payload = {
      ...editing,
      summary_vi: editing.summary_vi || null,
      summary_en: editing.summary_en || null,
      body_vi: editing.body_vi || null,
      body_en: editing.body_en || null,
      media_url: editing.media_url || null,
      cta_label_vi: editing.cta_label_vi || null,
      cta_label_en: editing.cta_label_en || null,
      cta_url: editing.cta_url || null,
      event_date: editing.event_date || null,
      sort_order: Number(editing.sort_order) || 0,
      post_type: editing.post_type || "event",
    };
    const res = editing.id
      ? await supabase.from("events").update(payload).eq("id", editing.id)
      : await supabase.from("events").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("deleteEventConfirm"))) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  const togglePublished = async (id: string, published: boolean) => {
    const { error } = await supabase.from("events").update({ published }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.map((x) => (x.id === id ? { ...x, published } : x)));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">
            {t("events")} ({rows.length})
          </h2>
          <p className="text-sm text-muted-foreground">{t("eventPageDesc")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="rounded-full">
            <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
          </Button>
          <Button
            onClick={() => {
              setEditing({ ...emptyEvent });
              setOpen(true);
            }}
            className="rounded-full"
          >
            <Plus className="mr-1 h-4 w-4" /> {t("newEvent")}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("title")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("media")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("featured")}</TableHead>
              <TableHead>{t("published")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {t("loading")}
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {t("noEvents")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="max-w-md">
                  <div className="font-medium">{r.title_en}</div>
                  <div className="text-xs text-muted-foreground">{r.title_vi}</div>
                </TableCell>
                <TableCell>
                  {r.post_type === "new_product" ? (
                    <Badge className="gap-1">
                      <PackageOpen className="h-3 w-3" /> {t("newProduct")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t("event")}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{r.media_type}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.event_date ? new Date(r.event_date).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell>
                  {r.featured ? (
                    <Badge>{t("featured")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("normal")}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Switch checked={r.published} onCheckedChange={(v) => togglePublished(r.id, v)} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing({
                        ...r,
                        post_type: r.post_type === "new_product" ? "new_product" : "event",
                      });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editEvent") : t("newEvent")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr]">
                <div>
                  <Label>{t("contentType")}</Label>
                  <Select
                    value={editing.post_type}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        post_type: v as "event" | "new_product",
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">{t("event")}</SelectItem>
                      <SelectItem value="new_product">{t("newProductSpotlight")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("titleVi")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.title_vi}
                    onChange={(e) => setEditing({ ...editing, title_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("titleEn")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.title_en}
                    onChange={(e) => setEditing({ ...editing, title_en: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("summary")} VI</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={3}
                    value={editing.summary_vi ?? ""}
                    onChange={(e) => setEditing({ ...editing, summary_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("summary")} EN</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={3}
                    value={editing.summary_en ?? ""}
                    onChange={(e) => setEditing({ ...editing, summary_en: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>{t("body")} VI</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={6}
                    value={editing.body_vi ?? ""}
                    onChange={(e) => setEditing({ ...editing, body_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("body")} EN</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={6}
                    value={editing.body_en ?? ""}
                    onChange={(e) => setEditing({ ...editing, body_en: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                <div>
                  <Label>{t("mediaType")}</Label>
                  <Select
                    value={editing.media_type}
                    onValueChange={(v) => setEditing({ ...editing, media_type: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">{t("imageUrlOption")}</SelectItem>
                      <SelectItem value="video">{t("videoUrl")}</SelectItem>
                      <SelectItem value="embed">{t("embedUrl")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("mediaUrl")}</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="https://..."
                    value={editing.media_url ?? ""}
                    onChange={(e) => setEditing({ ...editing, media_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>{t("eventDate")}</Label>
                  <Input
                    type="date"
                    className="mt-1.5"
                    value={editing.event_date ?? ""}
                    onChange={(e) => setEditing({ ...editing, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("sortOrder")}</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={editing.sort_order}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        sort_order: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 pt-7">
                  <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <Label>{t("featured")}</Label>
                    <Switch
                      checked={editing.featured}
                      onCheckedChange={(v) => setEditing({ ...editing, featured: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <Label>{t("published")}</Label>
                    <Switch
                      checked={editing.published}
                      onCheckedChange={(v) => setEditing({ ...editing, published: v })}
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>{t("ctaVi")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.cta_label_vi ?? ""}
                    onChange={(e) => setEditing({ ...editing, cta_label_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("ctaEn")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.cta_label_en ?? ""}
                    onChange={(e) => setEditing({ ...editing, cta_label_en: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("ctaUrl")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.cta_url ?? ""}
                    onChange={(e) => setEditing({ ...editing, cta_url: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={save}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Site settings (Contact info) ---------------- */

const CONTACT_FIELDS: {
  key: string;
  labelKey: keyof typeof ADMIN_I18N;
  multiline?: boolean;
}[] = [
  { key: "legal_name", labelKey: "legalNameEn" },
  { key: "legal_name_vi", labelKey: "legalNameVi" },
  { key: "tax_code", labelKey: "taxCode" },
  { key: "representative", labelKey: "representative" },
  { key: "address", labelKey: "address", multiline: true },
  { key: "phone", labelKey: "phone" },
  { key: "email", labelKey: "email" },
  { key: "zalo_phone", labelKey: "zaloPhone" },
  { key: "whatsapp_phone", labelKey: "whatsappPhone" },
];

function SettingsTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "contact")
      .maybeSingle();
    if (error && error.code !== "PGRST116") toast.error(error.message);
    setValues((data?.value as SiteSettingsValue | null) ?? {});
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "contact", value: values });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
  };

  if (loading) return <div className="text-sm text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl">{t("siteInformation")}</h2>
        <Button onClick={save} disabled={saving} className="rounded-full">
          {saving ? t("saving") : t("saveChanges")}
        </Button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{t("settingsDesc")}</p>
      <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        {CONTACT_FIELDS.map((f) => (
          <div key={f.key}>
            <Label>{t(f.labelKey)}</Label>
            {f.multiline ? (
              <Textarea
                className="mt-1.5"
                rows={2}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            ) : (
              <Input
                className="mt-1.5"
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Chatbot training ---------------- */

type Train = {
  id?: string;
  kind: string;
  title: string | null;
  question: string | null;
  answer: string | null;
  content: string | null;
  tags: string[];
  enabled: boolean;
};
const emptyTrain: Train = {
  kind: "qa",
  title: "",
  question: "",
  answer: "",
  content: "",
  tags: [],
  enabled: true,
};

type ChatbotDocument = {
  id?: string;
  title: string;
  description: string | null;
  raw_content: string | null;
  language: string;
  category: string;
  source_type: string;
  file_url: string | null;
  status: string;
  enabled: boolean;
  version: number;
  tags: string[];
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ChatbotChunkRow = {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  metadata: Json;
  created_at: string;
};

type ChatbotTreeNode = {
  id?: string;
  scenario_key: string;
  parent_id: string | null;
  sort_order: number;
  label_ko: string | null;
  label_en: string | null;
  label_vi: string | null;
  answer_ko: string | null;
  answer_en: string | null;
  answer_vi: string | null;
  action_type: string;
  linked_training_id: string | null;
  linked_document_id: string | null;
  enabled: boolean;
  metadata?: Json;
  created_at?: string;
  updated_at?: string;
};

const emptyTreeNode: ChatbotTreeNode = {
  scenario_key: "default",
  parent_id: null,
  sort_order: 0,
  label_ko: "",
  label_en: "",
  label_vi: "",
  answer_ko: "",
  answer_en: "",
  answer_vi: "",
  action_type: "answer",
  linked_training_id: null,
  linked_document_id: null,
  enabled: true,
  metadata: {},
};

const emptyDocument: ChatbotDocument = {
  title: "",
  description: "",
  raw_content: "",
  language: "mixed",
  category: "manual",
  source_type: "pasted_text",
  file_url: "",
  status: "active",
  enabled: true,
  version: 1,
  tags: [],
};

function ChatbotTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<Train[]>([]);
  const [docs, setDocs] = useState<ChatbotDocument[]>([]);
  const [treeNodes, setTreeNodes] = useState<ChatbotTreeNode[]>([]);
  const [chunks, setChunks] = useState<Record<string, ChatbotChunkRow[]>>({});
  const [editing, setEditing] = useState<Train | null>(null);
  const [docEditing, setDocEditing] = useState<ChatbotDocument | null>(null);
  const [treeEditing, setTreeEditing] = useState<ChatbotTreeNode | null>(null);
  const [open, setOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ChatbotDocument | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [docFilter, setDocFilter] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    const [
      { data: training, error: trainingError },
      { data: documents, error: docsError },
      { data: tree, error: treeError },
    ] = await Promise.all([
      supabase
        .from("chatbot_training")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(CHATBOT_ADMIN_LIMIT),
      supabase
        .from("chatbot_documents")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(CHATBOT_ADMIN_LIMIT),
      supabase
        .from("chatbot_tree_nodes")
        .select("*")
        .order("scenario_key", { ascending: true })
        .order("sort_order", { ascending: true })
        .limit(CHATBOT_ADMIN_LIMIT),
    ]);
    if (trainingError) toast.error(trainingError.message);
    else setRows((training ?? []).map((row) => ({ ...row, tags: row.tags ?? [] })));
    if (docsError) toast.error(docsError.message);
    else setDocs((documents ?? []) as ChatbotDocument[]);
    if (treeError) toast.error(treeError.message);
    else setTreeNodes((tree ?? []) as ChatbotTreeNode[]);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.kind === filter)),
    [rows, filter],
  );

  const filteredDocs = useMemo(
    () =>
      docFilter === "all"
        ? docs
        : docs.filter((doc) => doc.category === docFilter || doc.status === docFilter),
    [docs, docFilter],
  );

  const save = async () => {
    if (!editing) return;
    if (editing.kind === "qa" && (!editing.question?.trim() || !editing.answer?.trim()))
      return toast.error(t("questionAnswerRequired"));
    if (editing.kind !== "qa" && !editing.title?.trim()) return toast.error(t("titleRequired"));
    const payload = { ...editing, tags: editing.tags ?? [] };
    const res = editing.id
      ? await supabase.from("chatbot_training").update(payload).eq("id", editing.id)
      : await supabase.from("chatbot_training").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("deleteEntryConfirm"))) return;
    const { error } = await supabase.from("chatbot_training").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((xs) => xs.filter((x) => x.id !== id));
  };

  const loadChunks = async (documentId: string) => {
    const { data, error } = await supabase
      .from("chatbot_document_chunks")
      .select("*")
      .eq("document_id", documentId)
      .order("chunk_index", { ascending: true })
      .limit(CHATBOT_RECORD_LIMIT);
    if (error) return toast.error(error.message);
    setChunks((prev) => ({
      ...prev,
      [documentId]: (data ?? []) as ChatbotChunkRow[],
    }));
  };

  const processDocument = async (doc: ChatbotDocument) => {
    if (!doc.id) return;
    if (!doc.title.trim() || !doc.raw_content?.trim()) return toast.error(t("documentRequired"));
    setProcessingId(doc.id);
    const now = new Date().toISOString();
    const job = await supabase
      .from("chatbot_training_jobs")
      .insert({ document_id: doc.id, status: "running", started_at: now })
      .select("id")
      .single();
    const jobId = job.data?.id;
    try {
      await waitForBrowser();
      const newChunks = chunkText(doc.raw_content, {
        maxChars: 1100,
        overlapChars: 160,
      }).map((chunk, index) => ({
        document_id: doc.id!,
        chunk_index: index,
        content: chunk.content,
        content_hash: chunk.content_hash,
        language: doc.language || "mixed",
        token_count: chunk.token_count,
        metadata: {
          ...(chunk.metadata ?? {}),
          title: doc.title,
          category: doc.category,
          tags: doc.tags ?? [],
        },
      }));
      const del = await supabase.from("chatbot_document_chunks").delete().eq("document_id", doc.id);
      if (del.error) throw del.error;
      for (let index = 0; index < newChunks.length; index += CHATBOT_CHUNK_BATCH_SIZE) {
        const batch = newChunks.slice(index, index + CHATBOT_CHUNK_BATCH_SIZE);
        if (batch.length) {
          const ins = await supabase.from("chatbot_document_chunks").insert(batch);
          if (ins.error) throw ins.error;
        }
        await waitForBrowser();
      }
      if (jobId) {
        await supabase
          .from("chatbot_training_jobs")
          .update({
            status: "completed",
            finished_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
      toast.success(t("processingComplete"));
      await loadChunks(doc.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (jobId) {
        await supabase
          .from("chatbot_training_jobs")
          .update({
            status: "failed",
            error_message: message,
            finished_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
      toast.error(message);
    } finally {
      setProcessingId(null);
      load();
    }
  };

  const saveDocument = async () => {
    if (!docEditing) return;
    if (!docEditing.title.trim() || !docEditing.raw_content?.trim())
      return toast.error(t("documentRequired"));
    const payload = {
      title: docEditing.title,
      description: docEditing.description || null,
      raw_content: docEditing.raw_content || null,
      language: docEditing.language || "mixed",
      category: docEditing.category || "other",
      source_type: docEditing.source_type || "pasted_text",
      file_url: docEditing.file_url || null,
      status: docEditing.status || "active",
      enabled: docEditing.enabled,
      version: docEditing.version || 1,
      tags: docEditing.tags ?? [],
    };
    const res = docEditing.id
      ? await supabase
          .from("chatbot_documents")
          .update(payload)
          .eq("id", docEditing.id)
          .select("*")
          .single()
      : await supabase.from("chatbot_documents").insert(payload).select("*").single();
    if (res.error) return toast.error(res.error.message);
    const savedDoc = res.data as ChatbotDocument;
    toast.success(t("saved"));
    setDocOpen(false);
    setDocEditing(null);
    await load();
    await processDocument(savedDoc);
  };

  const removeDocument = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    const { error } = await supabase.from("chatbot_documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setDocs((xs) => xs.filter((x) => x.id !== id));
    setChunks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveTreeNode = async () => {
    if (!treeEditing) return;
    if (!treeEditing.scenario_key.trim()) return toast.error(t("scenarioId"));
    if (
      !treeEditing.label_en?.trim() &&
      !treeEditing.label_vi?.trim() &&
      !treeEditing.label_ko?.trim()
    )
      return toast.error(t("buttonLabel"));
    const payload = {
      scenario_key: treeEditing.scenario_key || "default",
      parent_id: treeEditing.parent_id || null,
      sort_order: Number(treeEditing.sort_order) || 0,
      label_ko: treeEditing.label_ko || null,
      label_en: treeEditing.label_en || null,
      label_vi: treeEditing.label_vi || null,
      answer_ko: treeEditing.answer_ko || null,
      answer_en: treeEditing.answer_en || null,
      answer_vi: treeEditing.answer_vi || null,
      action_type: treeEditing.action_type || "answer",
      linked_training_id: treeEditing.linked_training_id || null,
      linked_document_id: treeEditing.linked_document_id || null,
      enabled: treeEditing.enabled,
      metadata: treeEditing.metadata ?? {},
    };
    const res = treeEditing.id
      ? await supabase.from("chatbot_tree_nodes").update(payload).eq("id", treeEditing.id)
      : await supabase.from("chatbot_tree_nodes").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("saved"));
    setTreeOpen(false);
    setTreeEditing(null);
    load();
  };

  const removeTreeNode = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    const { error } = await supabase.from("chatbot_tree_nodes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setTreeNodes((xs) => xs.filter((x) => x.id !== id));
  };

  const openPreview = async (doc: ChatbotDocument) => {
    if (!doc.id) return;
    setPreviewDoc(doc);
    if (!chunks[doc.id]) await loadChunks(doc.id);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">{t("chatbotTraining")}</h2>
            <p className="text-sm text-muted-foreground">{t("chatbotTrainingDesc")}</p>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-bold text-foreground">{rows.length}</div>
              {t("trainingEntries")}
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-bold text-foreground">{docs.length}</div>
              {t("documentLibrary")}
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-bold text-foreground">{treeNodes.length}</div>
              {t("treeScenario")}
            </div>
            <div className="rounded-xl bg-muted/60 p-3">
              <div className="font-bold text-foreground">
                {Object.values(chunks).reduce((sum, xs) => sum + xs.length, 0)}
              </div>
              {t("chunks")}
            </div>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 p-4">
            <div className="font-semibold">{t("qaPair")}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Frequently asked questions and exact approved answers.
            </p>
            <Button
              className="mt-3 h-8 rounded-full"
              variant="outline"
              onClick={() => {
                setEditing({ ...emptyTrain, kind: "qa" });
                setOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> {t("newTrainingEntry")}
            </Button>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <div className="font-semibold">{t("productInfo")}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Product facts, benefits, target skin concerns, and recommendation notes.
            </p>
            <Button
              className="mt-3 h-8 rounded-full"
              variant="outline"
              onClick={() => {
                setEditing({ ...emptyTrain, kind: "product" });
                setOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> {t("productInfo")}
            </Button>
          </div>
          <div className="rounded-xl border border-border/60 p-4">
            <div className="font-semibold">{t("documentLibrary")}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t("documentLibraryDesc")}</p>
            <Button
              className="mt-3 h-8 rounded-full"
              variant="outline"
              onClick={() => {
                setDocEditing({ ...emptyDocument });
                setDocOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> {t("newDocument")}
            </Button>
          </div>

          <div className="rounded-xl border border-border/60 p-4">
            <div className="font-semibold">{t("treeMode")}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t("treeModeDesc")}</p>
            <Button
              className="mt-3 h-8 rounded-full"
              variant="outline"
              onClick={() => {
                setTreeEditing({ ...emptyTreeNode });
                setTreeOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> {t("treeScenario")}
            </Button>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl">{t("documentLibrary")}</h3>
            <p className="text-sm text-muted-foreground">{t("documentLibraryDesc")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={docFilter} onValueChange={setDocFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="brand">{t("brand")}</SelectItem>
                <SelectItem value="product">{t("product")}</SelectItem>
                <SelectItem value="b2b">{t("b2bCategory")}</SelectItem>
                <SelectItem value="policy">{t("policy")}</SelectItem>
                <SelectItem value="manual">{t("manual")}</SelectItem>
                <SelectItem value="active">{t("active")}</SelectItem>
                <SelectItem value="draft">{t("draft")}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={load} variant="outline" className="rounded-full">
              <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
            </Button>
            <Button
              onClick={() => {
                setDocEditing({ ...emptyDocument });
                setDocOpen(true);
              }}
              className="rounded-full"
            >
              <Plus className="mr-1 h-4 w-4" /> {t("newDocument")}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("title")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead>{t("language")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("tags")}</TableHead>
                <TableHead>{t("chunks")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    {t("noTrainingData")}
                  </TableCell>
                </TableRow>
              )}
              {filteredDocs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="max-w-sm">
                    <div className="font-medium">{doc.title || t("untitled")}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {doc.description || doc.raw_content}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{statusText(lang, doc.category)}</Badge>
                  </TableCell>
                  <TableCell className="text-xs uppercase">{doc.language}</TableCell>
                  <TableCell>
                    {doc.enabled && doc.status === "active" ? (
                      <Badge>{t("active")}</Badge>
                    ) : (
                      <Badge variant="secondary">{statusText(lang, doc.status)}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                    {(doc.tags ?? []).join(", ") || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {doc.id && chunks[doc.id] ? chunks[doc.id].length : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openPreview(doc)}>
                      {t("previewChunks")}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={processingId === doc.id}
                      onClick={() => processDocument(doc)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setDocEditing({ ...doc, tags: doc.tags ?? [] });
                        setDocOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => doc.id && removeDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl">{t("treeScenario")}</h3>
            <p className="text-sm text-muted-foreground">{t("chatUiModesDesc")}</p>
          </div>
          <Button
            onClick={() => {
              setTreeEditing({ ...emptyTreeNode });
              setTreeOpen(true);
            }}
            className="rounded-full"
          >
            <Plus className="mr-1 h-4 w-4" /> {t("treeScenario")}
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("scenarioId")}</TableHead>
                <TableHead>{t("parentId")}</TableHead>
                <TableHead>{t("buttonLabel")}</TableHead>
                <TableHead>{t("answerMode")}</TableHead>
                <TableHead>{t("enabled")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treeNodes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t("noTrainingData")}
                  </TableCell>
                </TableRow>
              )}
              {treeNodes.map((node) => (
                <TableRow key={node.id}>
                  <TableCell>
                    <Badge variant="outline">{node.scenario_key}</Badge>
                    <div className="text-xs text-muted-foreground">#{node.sort_order}</div>
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                    {node.parent_id || "root"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {node.label_en || node.label_vi || node.label_ko || t("untitled")}
                    </div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">
                      {node.answer_en || node.answer_vi || node.answer_ko}
                    </div>
                  </TableCell>
                  <TableCell>{node.action_type}</TableCell>
                  <TableCell>
                    {node.enabled ? (
                      <Badge>{t("on")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("off")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setTreeEditing({ ...node });
                        setTreeOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => node.id && removeTreeNode(node.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl">{t("trainingEntries")}</h3>
            <p className="text-sm text-muted-foreground">
              Q&A, product snippets, and short freeform notes remain compatible with the existing
              chatbot_training table.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all")}</SelectItem>
                <SelectItem value="qa">{t("qa")}</SelectItem>
                <SelectItem value="product">{t("product")}</SelectItem>
                <SelectItem value="doc">{t("document")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setEditing(emptyTrain);
                setOpen(true);
              }}
              className="rounded-full"
            >
              <Plus className="mr-1 h-4 w-4" /> {t("newTrainingEntry")}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("titleQuestion")}</TableHead>
                <TableHead>{t("tags")}</TableHead>
                <TableHead>{t("enabled")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    {t("noTrainingData")}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant="outline">{r.kind}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="font-medium">{r.title || r.question || t("untitled")}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.answer || r.content}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(r.tags ?? []).join(", ") || "-"}
                  </TableCell>
                  <TableCell>
                    {r.enabled ? (
                      <Badge>{t("on")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("off")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing({ ...r, tags: r.tags ?? [] });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => r.id && remove(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editEntry") : t("newTrainingEntry")}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>{t("type")}</Label>
                <Select
                  value={editing.kind}
                  onValueChange={(v) => setEditing({ ...editing, kind: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qa">{t("qaPair")}</SelectItem>
                    <SelectItem value="product">{t("productInfo")}</SelectItem>
                    <SelectItem value="doc">{t("documentFreeform")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editing.kind === "qa" ? (
                <>
                  <div>
                    <Label>{t("question")}</Label>
                    <Input
                      className="mt-1.5"
                      value={editing.question ?? ""}
                      onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("answer")}</Label>
                    <Textarea
                      className="mt-1.5"
                      rows={4}
                      value={editing.answer ?? ""}
                      onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>{t("title")}</Label>
                    <Input
                      className="mt-1.5"
                      value={editing.title ?? ""}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t("content")}</Label>
                    <Textarea
                      className="mt-1.5"
                      rows={6}
                      value={editing.content ?? ""}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div>
                <Label>{t("tagsComma")}</Label>
                <Input
                  className="mt-1.5"
                  value={(editing.tags ?? []).join(", ")}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      tags: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <Label>{t("enabled")}</Label>
                <Switch
                  checked={editing.enabled}
                  onCheckedChange={(v) => setEditing({ ...editing, enabled: v })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={save}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{docEditing?.id ? t("editDocument") : t("newDocument")}</DialogTitle>
          </DialogHeader>
          {docEditing && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t("title")}</Label>
                  <Input
                    className="mt-1.5"
                    value={docEditing.title}
                    onChange={(e) => setDocEditing({ ...docEditing, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("sourceScope")}</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="PDF URL or internal source note"
                    value={docEditing.file_url ?? ""}
                    onChange={(e) => setDocEditing({ ...docEditing, file_url: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t("description")}</Label>
                <Input
                  className="mt-1.5"
                  value={docEditing.description ?? ""}
                  onChange={(e) =>
                    setDocEditing({
                      ...docEditing,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>{t("category")}</Label>
                  <Select
                    value={docEditing.category}
                    onValueChange={(v) => setDocEditing({ ...docEditing, category: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand">{t("brand")}</SelectItem>
                      <SelectItem value="product">{t("product")}</SelectItem>
                      <SelectItem value="b2b">{t("b2bCategory")}</SelectItem>
                      <SelectItem value="policy">{t("policy")}</SelectItem>
                      <SelectItem value="manual">{t("manual")}</SelectItem>
                      <SelectItem value="other">{t("other")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("language")}</Label>
                  <Select
                    value={docEditing.language}
                    onValueChange={(v) => setDocEditing({ ...docEditing, language: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">{t("mixed")}</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="vi">Ti?ng Vi?t</SelectItem>
                      <SelectItem value="ko">???</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("status")}</Label>
                  <Select
                    value={docEditing.status}
                    onValueChange={(v) => setDocEditing({ ...docEditing, status: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("active")}</SelectItem>
                      <SelectItem value="draft">{t("draft")}</SelectItem>
                      <SelectItem value="archived">{t("archived")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Version</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    min={1}
                    value={docEditing.version}
                    onChange={(e) =>
                      setDocEditing({
                        ...docEditing,
                        version: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>{t("tagsComma")}</Label>
                <Input
                  className="mt-1.5"
                  value={(docEditing.tags ?? []).join(", ")}
                  onChange={(e) =>
                    setDocEditing({
                      ...docEditing,
                      tags: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div>
                <Label>{t("rawContent")}</Label>
                <Textarea
                  className="mt-1.5 font-mono text-xs"
                  rows={14}
                  placeholder={t("rawContentHint")}
                  value={docEditing.raw_content ?? ""}
                  onChange={(e) =>
                    setDocEditing({
                      ...docEditing,
                      raw_content: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <Label>{t("enabled")}</Label>
                  <p className="text-xs text-muted-foreground">
                    Only enabled + active documents are used in chatbot retrieval.
                  </p>
                </div>
                <Switch
                  checked={docEditing.enabled}
                  onCheckedChange={(v) => setDocEditing({ ...docEditing, enabled: v })}
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                Preview: {chunkText(docEditing.raw_content ?? "").length} {t("chunks")}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={saveDocument}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={treeOpen} onOpenChange={setTreeOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("treeScenario")}</DialogTitle>
          </DialogHeader>
          {treeEditing && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>{t("scenarioId")}</Label>
                  <Input
                    className="mt-1.5"
                    value={treeEditing.scenario_key}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        scenario_key: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("parentId")}</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="root"
                    value={treeEditing.parent_id ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        parent_id: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("sortOrder")}</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={treeEditing.sort_order}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        sort_order: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>{t("buttonLabel")} EN</Label>
                  <Input
                    className="mt-1.5"
                    value={treeEditing.label_en ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        label_en: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("buttonLabel")} VI</Label>
                  <Input
                    className="mt-1.5"
                    value={treeEditing.label_vi ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        label_vi: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("buttonLabel")} KO</Label>
                  <Input
                    className="mt-1.5"
                    value={treeEditing.label_ko ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        label_ko: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>{t("answer")} EN</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={5}
                    value={treeEditing.answer_en ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        answer_en: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("answer")} VI</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={5}
                    value={treeEditing.answer_vi ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        answer_vi: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>{t("answer")} KO</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={5}
                    value={treeEditing.answer_ko ?? ""}
                    onChange={(e) =>
                      setTreeEditing({
                        ...treeEditing,
                        answer_ko: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>{t("answerMode")}</Label>
                  <Select
                    value={treeEditing.action_type}
                    onValueChange={(v) => setTreeEditing({ ...treeEditing, action_type: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="answer">Answer</SelectItem>
                      <SelectItem value="children">Show children</SelectItem>
                      <SelectItem value="document">Linked document</SelectItem>
                      <SelectItem value="contact">Contact CTA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("document")}</Label>
                  <Select
                    value={treeEditing.linked_document_id ?? "none"}
                    onValueChange={(v) =>
                      setTreeEditing({
                        ...treeEditing,
                        linked_document_id: v === "none" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {docs.map(
                        (doc) =>
                          doc.id && (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.title}
                            </SelectItem>
                          ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <Label>{t("enabled")}</Label>
                  <Switch
                    checked={treeEditing.enabled}
                    onCheckedChange={(v) => setTreeEditing({ ...treeEditing, enabled: v })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTreeOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={saveTreeNode}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewDoc} onOpenChange={(v) => !v && setPreviewDoc(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("previewChunks")} - {previewDoc?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {previewDoc?.id && (chunks[previewDoc.id] ?? []).length === 0 && (
              <div className="rounded-xl bg-muted p-6 text-center text-muted-foreground">
                No chunks yet. Click process document.
              </div>
            )}
            {previewDoc?.id &&
              (chunks[previewDoc.id] ?? []).map((chunk) => (
                <div key={chunk.id} className="rounded-xl border border-border/60 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline">#{chunk.chunk_index + 1}</Badge>
                    <span>{chunk.token_count} tokens</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{chunk.content}</div>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>
              {t("close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Products ---------------- */

function emptyCatalog(rows: CatalogProduct[]): ProductCatalog {
  const now = new Date().toISOString();
  return {
    id: createCatalogId(),
    title: "GPCLUB Vietnam Product Catalog",
    subtitle: "Curated K-Beauty portfolio for B2B partners",
    description: "A printable catalog generated from products registered in Product Management.",
    template: "premium",
    product_ids: [],
    is_representative: false,
    created_at: now,
    updated_at: now,
  };
}

function ProductCatalogsAdminTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<ProductCatalog[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCatalog | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    const [catalogResult, productResult] = await Promise.allSettled([
      fetchProductCatalogs(),
      supabase
        .from("admin_products")
        .select("*")
        .order("sort_order", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    if (catalogResult.status === "rejected") toast.error(String(catalogResult.reason));
    else setRows(catalogResult.value);
    if (productResult.status === "rejected") toast.error(String(productResult.reason));
    else if (productResult.value.error) toast.error(productResult.value.error.message);
    else setProducts((productResult.value.data || []) as CatalogProduct[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const selectedProductMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const brands = useMemo(
    () => [
      "All",
      ...Array.from(new Set(products.map((product) => product.brand_name).filter(Boolean))),
    ],
    [products],
  );
  const productTypes = useMemo(
    () => [
      "All",
      ...Array.from(new Set(products.map((product) => product.product_type).filter(Boolean))),
    ],
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = normalizedSearchText(productSearch);
    return products.filter((product) => {
      const brandMatch = brandFilter === "All" || product.brand_name === brandFilter;
      const typeMatch = typeFilter === "All" || product.product_type === typeFilter;
      const searchMatch =
        !query ||
        normalizedSearchText(
          [
            product.brand_name,
            product.product_name,
            product.product_type,
            product.short_intro,
          ].join(" "),
        ).includes(query);
      return brandMatch && typeMatch && searchMatch;
    });
  }, [brandFilter, productSearch, productTypes, products, typeFilter]);

  const startNew = () => {
    setProductSearch("");
    setBrandFilter("All");
    setTypeFilter("All");
    setEditing(emptyCatalog(products));
    setOpen(true);
  };

  const toggleProduct = (productId: string, checked: boolean) => {
    if (!editing) return;
    const productIds = checked
      ? Array.from(new Set([...editing.product_ids, productId]))
      : editing.product_ids.filter((id) => id !== productId);
    setEditing({ ...editing, product_ids: productIds });
  };

  const setSelectedProducts = (productIds: string[]) => {
    if (!editing) return;
    setEditing({ ...editing, product_ids: Array.from(new Set(productIds)) });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error(t("catalogTitle"));
      return;
    }
    if (editing.product_ids.length === 0) {
      toast.error(t("selectedProducts"));
      return;
    }
    const payload: ProductCatalog = {
      ...editing,
      title: editing.title.trim(),
      subtitle: editing.subtitle.trim(),
      description: editing.description.trim(),
      product_ids: editing.product_ids,
      is_representative: editing.is_representative,
      updated_at: new Date().toISOString(),
    };
    const nextRows = rows.some((row) => row.id === payload.id)
      ? rows.map((row) => (row.id === payload.id ? payload : row))
      : [payload, ...rows];
    try {
      await saveProductCatalogs(
        payload.is_representative
          ? nextRows.map((row) => ({
              ...row,
              is_representative: row.id === payload.id,
            }))
          : nextRows,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      return;
    }
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    await load();
  };

  const setRepresentative = async (row: ProductCatalog) => {
    try {
      await saveProductCatalogs(
        rows.map((item) => ({
          ...item,
          is_representative: item.id === row.id,
        })),
      );
      toast.success(t("representativeCatalog"));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const remove = async (row: ProductCatalog) => {
    if (!confirm(t("deleteCatalogConfirm"))) return;
    try {
      await saveProductCatalogs(rows.filter((item) => item.id !== row.id));
      toast.success(t("delete"));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const openCatalog = (id: string) =>
    window.open(`/catalog/${id}`, "_blank", "noopener,noreferrer");

  const templateLabel = (template: ProductCatalog["template"]) => {
    if (template === "compact") return t("compactTemplate");
    if (template === "lineup") return t("lineupTemplate");
    return t("premiumTemplate");
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black">{t("productCatalogs")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate printable PDF catalogs from registered Product Management items.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
          </Button>
          <Button onClick={startNew}>
            <Plus className="mr-1 h-4 w-4" /> {t("newCatalog")}
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noCatalogs")}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("catalogTitle")}</TableHead>
                <TableHead>{t("catalogTemplate")}</TableHead>
                <TableHead>{t("selectedProducts")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("edit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-semibold">{row.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{row.subtitle}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{templateLabel(row.template)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{row.product_ids.length} products</div>
                    <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {row.product_ids
                        .map((id) => selectedProductMap.get(id)?.product_name)
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.is_representative ? (
                      <Badge className="gap-1 bg-primary text-primary-foreground">
                        <Star className="h-3 w-3" /> {t("representativeCatalog")}
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setRepresentative(row)}>
                        <Star className="mr-1 h-3.5 w-3.5" /> {t("setRepresentative")}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openCatalog(row.id)}
                      title={t("preview")}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openCatalog(row.id)}
                      title={t("downloadPdf")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(row);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(row)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("catalogManagement") : t("newCatalog")}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>{t("catalogTitle")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("catalogSubtitle")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.subtitle}
                    onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t("catalogDescription")}</Label>
                <Textarea
                  className="mt-1.5"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("catalogTemplate")}</Label>
                <Select
                  value={editing.template}
                  onValueChange={(value) =>
                    setEditing({
                      ...editing,
                      template: value as ProductCatalog["template"],
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">{t("premiumTemplate")}</SelectItem>
                    <SelectItem value="compact">{t("compactTemplate")}</SelectItem>
                    <SelectItem value="lineup">{t("lineupTemplate")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                <div>
                  <Label>{t("representativeCatalog")}</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Main hero catalog download button will use this catalog.
                  </p>
                </div>
                <Switch
                  checked={editing.is_representative}
                  onCheckedChange={(v) => setEditing({ ...editing, is_representative: v })}
                />
              </div>
              <div className="rounded-2xl border border-border p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Label>{t("selectedProducts")}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Filter products, then bulk-select the current result.
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {editing.product_ids.length} / {products.length}
                  </Badge>
                </div>
                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={t("searchProducts")}
                  />
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand === "All" ? t("allBrands") : brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === "All" ? t("allTypes") : type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProducts(products.map((product) => product.id))}
                  >
                    {t("selectAll")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setSelectedProducts(filteredProducts.map((product) => product.id))
                    }
                  >
                    {t("selectFiltered")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProducts([])}
                  >
                    {t("clearSelected")}
                  </Button>
                  <Badge variant="outline" className="px-3">
                    {filteredProducts.length} shown
                  </Badge>
                </div>
                <div className="grid max-h-[460px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                  {filteredProducts.map((product) => {
                    const image = getCoverImage(product);
                    return (
                      <label
                        key={product.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3 transition hover:bg-muted/40"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-primary"
                          checked={editing.product_ids.includes(product.id)}
                          onChange={(e) => toggleProduct(product.id, e.target.checked)}
                        />
                        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {image ? (
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-bold uppercase tracking-[0.18em] text-primary">
                            {product.brand_name}
                          </span>
                          <span className="mt-1 block font-semibold">{product.product_name}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {product.product_type}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={save}>{t("save")}</Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Tag-style editor for string[] fields (skin_types / concerns) on a product. */
function ProductTagField({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div className="rounded-2xl border border-border p-4">
      <Label>{label}</Label>
      <div className="mt-1.5 flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1">
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="ml-0.5 rounded-full hover:bg-foreground/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function emptyProduct(): CatalogProduct {
  return {
    id: "",
    brand_name: "",
    product_name: "",
    product_type: "Sheet Mask",
    short_intro: "",
    detail_html: "<p>Product details</p>",
    media: [],
    conditions: [],
    cover_image_url: "",
    sort_order: 0,
    published: true,
    is_new: false,
    is_popular: false,
    is_featured: false,
    skin_types: [],
    concerns: [],
  };
}

function ProductsAdminTab({ lang }: { lang: AdminLang }) {
  const t = (key: keyof typeof ADMIN_I18N) => tx(lang, key);
  const [rows, setRows] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const detailEditorRef = useRef<ProductDetailEditorHandle>(null);

  const load = async () => {
    setLoading(true);
    const { from, to } = pageRange(page);
    const trimmedSearch = search.trim();
    let query = supabase
      .from("admin_products")
      .select("*", { count: "estimated" })
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (brandFilter !== "All") {
      query = query.eq("brand_name", canonicalBrandName(brandFilter));
    }
    if (trimmedSearch) {
      query = query.ilike("product_name", `%${trimmedSearch}%`);
    }
    const { data, error, count } = await query;
    if (error) toast.error(error.message);
    else {
      setRows((data || []) as CatalogProduct[]);
      setTotalRows(count ?? data?.length ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [page, search, brandFilter]);

  useEffect(() => {
    setPage(0);
  }, [search, brandFilter]);

  const startNew = () => {
    setEditing(emptyProduct());
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const detailHtml = detailEditorRef.current?.commit() ?? editing.detail_html;
    const payload = {
      brand_name: canonicalBrandName(editing.brand_name),
      product_name: editing.product_name,
      product_type: editing.product_type,
      short_intro: editing.short_intro,
      detail_html: sanitizeProductDetailHtml(detailHtml),
      media: editing.media,
      conditions: editing.conditions,
      cover_image_url: editing.cover_image_url || null,
      sort_order: Number(editing.sort_order) || 0,
      published: editing.published,
      is_new: editing.is_new,
      is_popular: editing.is_popular,
      is_featured: editing.is_featured,
      skin_types: editing.skin_types ?? [],
      concerns: editing.concerns ?? [],
    };
    const result = editing.id
      ? await supabase.from("admin_products").update(payload).eq("id", editing.id)
      : await supabase.from("admin_products").insert(payload);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success(t("saved"));
    setOpen(false);
    setEditing(null);
    await load();
  };

  const remove = async (row: CatalogProduct) => {
    if (!confirm(t("deleteProductConfirm"))) return;
    const { error } = await supabase.from("admin_products").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success(t("delete"));
      await load();
    }
  };

  const brands = useMemo(
    () => [
      "All",
      "JMsolution",
      "Jmella",
      ...Array.from(new Set(rows.map((row) => row.brand_name).filter(Boolean))),
    ],
    [rows],
  );

  const productTypes = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((row) => row.product_type).filter(Boolean)))],
    [rows],
  );

  const quickUpdate = async (row: CatalogProduct, patch: Partial<CatalogProduct>) => {
    const normalizedPatch = patch.brand_name
      ? { ...patch, brand_name: canonicalBrandName(patch.brand_name) }
      : patch;
    setRows((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, ...normalizedPatch } : item)),
    );
    const { error } = await supabase
      .from("admin_products")
      .update(normalizedPatch)
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      await load();
    } else {
      toast.success(t("updated"));
    }
  };

  const addMedia = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      media: [...editing.media, { type: "image", url: "", alt: "" }],
    });
  };

  const addCondition = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      conditions: [...editing.conditions, { label: "Price", value: "", visible: true }],
    });
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-black">{t("products")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin-created products appear on the home page, product list, and detail pages.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="mr-1 h-4 w-4" /> {t("refresh")}
          </Button>
          <Button onClick={startNew}>
            <Plus className="mr-1 h-4 w-4" /> {t("newProduct")}
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 md:grid-cols-[1fr_180px_140px]">
        <Input
          placeholder="Search product name, brand, type"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand === "All" ? "All brands" : brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center justify-center rounded-md border bg-card px-3 text-sm font-bold">
          {rows.length} / {totalRows}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noProducts")}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">{t("published")}</TableHead>
                <TableHead>{t("brandName")}</TableHead>
                <TableHead className="min-w-[300px]">{t("productName")}</TableHead>
                <TableHead className="min-w-[180px]">{t("productType")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("edit")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Switch
                      checked={row.published}
                      onCheckedChange={(v) => void quickUpdate(row, { published: v })}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{row.brand_name}</TableCell>
                  <TableCell>
                    <Input
                      value={row.product_name}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, product_name: e.target.value } : item,
                          ),
                        )
                      }
                      onBlur={(e) => {
                        if (e.target.value !== row.product_name)
                          void quickUpdate(row, {
                            product_name: e.target.value,
                          });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      list="admin-product-type-options"
                      value={row.product_type}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, product_type: e.target.value } : item,
                          ),
                        )
                      }
                      onBlur={(e) => {
                        if (e.target.value !== row.product_type)
                          void quickUpdate(row, {
                            product_type: e.target.value,
                          });
                      }}
                    />
                    <datalist id="admin-product-type-options">
                      {productTypes.map((type) => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.published ? (
                        <Badge>{t("live")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("draft")}</Badge>
                      )}
                      {row.is_featured ? (
                        <Badge variant="outline">{t("featuredProduct")}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(row);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(row)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PaginationControls
        page={page}
        canNext={(page + 1) * ADMIN_PAGE_SIZE < totalRows}
        onPrevious={() => setPage((value) => Math.max(0, value - 1))}
        onNext={() => setPage((value) => value + 1)}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editProduct") : t("newProduct")}</DialogTitle>
            <DialogDescription>
              Use this form to manage product content, media, publishing state, and the sanitized
              rich detail section shown on public product pages.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label>{t("brandName")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.brand_name}
                    onChange={(e) => setEditing({ ...editing, brand_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("productName")}</Label>
                  <Input
                    className="mt-1.5"
                    value={editing.product_name}
                    onChange={(e) => setEditing({ ...editing, product_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("productType")}</Label>
                  <Input
                    className="mt-1.5"
                    list="product-type-options"
                    value={editing.product_type}
                    onChange={(e) => setEditing({ ...editing, product_type: e.target.value })}
                  />
                  <datalist id="product-type-options">
                    <option value="Sheet Mask" />
                    <option value="Skincare" />
                    <option value="Body Care" />
                    <option value="Hair Care" />
                    <option value="Makeup" />
                    <option value="Fragrance" />
                  </datalist>
                </div>
                <div>
                  <Label>{t("order")}</Label>
                  <Input
                    className="mt-1.5"
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        sort_order: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>{t("shortIntro")}</Label>
                <Input
                  className="mt-1.5"
                  value={editing.short_intro}
                  onChange={(e) => setEditing({ ...editing, short_intro: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("coverImage")}</Label>
                <Input
                  className="mt-1.5"
                  value={editing.cover_image_url || ""}
                  onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })}
                />
              </div>

              <div className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-4">
                <div className="flex items-center justify-between">
                  <Label>{t("published")}</Label>
                  <Switch
                    checked={editing.published}
                    onCheckedChange={(v) => setEditing({ ...editing, published: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t("newProduct")}</Label>
                  <Switch
                    checked={editing.is_new}
                    onCheckedChange={(v) => setEditing({ ...editing, is_new: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t("popularProduct")}</Label>
                  <Switch
                    checked={editing.is_popular}
                    onCheckedChange={(v) => setEditing({ ...editing, is_popular: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{t("featuredProduct")}</Label>
                  <Switch
                    checked={editing.is_featured}
                    onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })}
                  />
                </div>
              </div>

              {/* Skin types & concerns — power Gippy AI recommendations.
                  Tag-style editor: type a value, press Add, remove via the X. */}
              <div className="grid gap-4 md:grid-cols-2">
                <ProductTagField
                  label="Skin types"
                  placeholder="e.g. Dry, Oily, Combination, Sensitive, All"
                  values={editing.skin_types ?? []}
                  onChange={(next) => setEditing({ ...editing, skin_types: next })}
                />
                <ProductTagField
                  label="Concerns"
                  placeholder="e.g. Hydration, Brightening, Anti-aging, Pores, Fragrance, Body care"
                  values={editing.concerns ?? []}
                  onChange={(next) => setEditing({ ...editing, concerns: next })}
                />
              </div>

              <div>
                <Label id="product-detail-editor-label" className="mb-2 block">
                  {t("detailEditor")}
                </Label>
                <ProductDetailEditor
                  ref={detailEditorRef}
                  labelId="product-detail-editor-label"
                  value={editing.detail_html || ""}
                  onChange={(detail_html) => setEditing({ ...editing, detail_html })}
                />
              </div>

              <div className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label>{t("mediaUrls")}</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addMedia}>
                    <Plus className="mr-1 h-3 w-3" />
                    {t("addMedia")}
                  </Button>
                </div>
                <div className="space-y-2">
                  {editing.media.map((m, idx) => (
                    <div key={idx} className="grid gap-2 md:grid-cols-[120px_1fr_1fr_40px]">
                      <Select
                        value={m.type}
                        onValueChange={(v) => {
                          const media = [...editing.media];
                          media[idx] = {
                            ...m,
                            type: v as ProductMedia["type"],
                          };
                          setEditing({ ...editing, media });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="URL"
                        value={m.url}
                        onChange={(e) => {
                          const media = [...editing.media];
                          media[idx] = { ...m, url: e.target.value };
                          setEditing({ ...editing, media });
                        }}
                      />
                      <Input
                        placeholder="Alt / memo"
                        value={m.alt || ""}
                        onChange={(e) => {
                          const media = [...editing.media];
                          media[idx] = { ...m, alt: e.target.value };
                          setEditing({ ...editing, media });
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            media: editing.media.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label>{t("conditions")}</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addCondition}>
                    <Plus className="mr-1 h-3 w-3" />
                    {t("addCondition")}
                  </Button>
                </div>
                <div className="space-y-2">
                  {editing.conditions.map((c, idx) => (
                    <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_110px_40px]">
                      <Input
                        placeholder="Label"
                        value={c.label}
                        onChange={(e) => {
                          const conditions = [...editing.conditions];
                          conditions[idx] = { ...c, label: e.target.value };
                          setEditing({ ...editing, conditions });
                        }}
                      />
                      <Input
                        placeholder="Value"
                        value={c.value}
                        onChange={(e) => {
                          const conditions = [...editing.conditions];
                          conditions[idx] = { ...c, value: e.target.value };
                          setEditing({ ...editing, conditions });
                        }}
                      />
                      <div className="flex items-center justify-between rounded-md border px-3">
                        <Label>{t("showCondition")}</Label>
                        <Switch
                          checked={c.visible}
                          onCheckedChange={(v) => {
                            const conditions = [...editing.conditions];
                            conditions[idx] = { ...c, visible: v };
                            setEditing({ ...editing, conditions });
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            conditions: editing.conditions.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={save}>{t("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
