import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  DEFAULT_HOME_CONTENT,
  mergeHomeContent,
  type HomeAdminContent,
  type LocalizedText,
} from "@/lib/home-content";
import {
  DEFAULT_PAGE_CONTENT,
  PAGE_CONTENT_OPTIONS,
  mergePageContent,
  pageContentStorageKey,
  type PageContentKey,
  type PageEditableContent,
} from "@/lib/page-content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LogOut,
  RefreshCw,
  Plus,
  Trash2,
  Pencil,
  BarChart3,
  Users,
  HelpCircle,
  Megaphone,
  Settings,
  Bot,
  Inbox,
  CalendarDays,
  Home,
  PackageOpen,
  FileText,
  Download,
  Star,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { chunkText } from "@/lib/chatbot-training";
import {
  canonicalBrandName,
  getCoverImage,
  normalizeBrandText,
  normalizedSearchText,
  type CatalogProduct,
  type ProductCondition,
  type ProductMedia,
} from "@/lib/catalog-products";
import {
  createCatalogId,
  fetchProductCatalogs,
  saveProductCatalogs,
  type ProductCatalog,
} from "@/lib/product-catalogs";

type AdminLang = "en" | "vi" | "ko";

type TriText = Record<AdminLang, string>;

const ADMIN_LANG_OPTIONS: { value: AdminLang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tieng Viet" },
  { value: "ko", label: "Korean" },
];

const ADMIN_I18N = {
  loading: { en: "Loading...", vi: "Đang tải...", ko: "불러오는 중..." },
  save: { en: "Save", vi: "Lưu", ko: "저장" },
  saved: { en: "Saved", vi: "Đã lưu", ko: "저장됨" },
  updated: { en: "Updated", vi: "Đã cập nhật", ko: "업데이트됨" },
  refresh: { en: "Refresh", vi: "Làm mới", ko: "새로고침" },
  reload: { en: "Reload", vi: "Tải lại", ko: "다시 불러오기" },
  cancel: { en: "Cancel", vi: "Hủy", ko: "취소" },
  close: { en: "Close", vi: "Đóng", ko: "닫기" },
  delete: { en: "Delete", vi: "Xóa", ko: "삭제" },
  view: { en: "View", vi: "Xem", ko: "보기" },
  edit: { en: "Edit", vi: "Chỉnh sửa", ko: "수정" },
  signOut: { en: "Sign out", vi: "Đăng xuất", ko: "로그아웃" },
  admin: { en: "Admin", vi: "Quản trị", ko: "관리자" },
  controlCenter: {
    en: "GPCLUB Control Center",
    vi: "Trung tâm quản trị GPCLUB",
    ko: "GPCLUB 관리 센터",
  },
  language: { en: "Language", vi: "Ngôn ngữ", ko: "언어" },
  accessDenied: { en: "Access denied", vi: "Từ chối truy cập", ko: "접근 권한 없음" },
  accessDeniedDesc: {
    en: "Your account doesn't have admin privileges. Contact a workspace owner to request access.",
    vi: "Tài khoản của bạn không có quyền quản trị. Vui lòng liên hệ chủ sở hữu không gian làm việc để yêu cầu quyền truy cập.",
    ko: "이 계정에는 관리자 권한이 없습니다. 접근 권한은 워크스페이스 소유자에게 요청하세요.",
  },
  overview: { en: "Overview", vi: "Tổng quan", ko: "개요" },
  dashboard: { en: "Dashboard", vi: "Bảng điều khiển", ko: "대시보드" },
  productManagement: { en: "Product Management", vi: "Quản lý sản phẩm", ko: "상품관리" },
  customerManagement: { en: "Customers / Inquiries", vi: "Khách hàng / Liên hệ", ko: "고객/문의" },
  contentManagement: { en: "Content Management", vi: "Quản lý nội dung", ko: "콘텐츠관리" },
  settings: { en: "Settings", vi: "Cài đặt", ko: "설정" },
  home: { en: "Content Edit", vi: "Chỉnh sửa nội dung", ko: "콘텐츠수정" },
  dealers: { en: "B2B Applications", vi: "Đơn đăng ký B2B", ko: "B2B 신청" },
  contacts: { en: "Chatbot Records", vi: "Bản ghi chatbot", ko: "챗봇 기록" },
  faq: { en: "FAQ", vi: "Câu hỏi thường gặp", ko: "FAQ" },
  popups: { en: "Popups", vi: "Popup", ko: "팝업" },
  events: { en: "Events", vi: "Sự kiện", ko: "이벤트" },
  products: { en: "Products", vi: "Products", ko: "제품" },
  catalogManagement: { en: "Catalog Management", vi: "Quản lý catalog", ko: "카탈로그 관리" },
  productCatalogs: { en: "Product Catalogs", vi: "Catalog sản phẩm", ko: "상품 카탈로그" },
  newCatalog: { en: "New catalog", vi: "Tạo catalog", ko: "카탈로그 신규생성" },
  representativeCatalog: { en: "Representative", vi: "Catalog đại diện", ko: "대표카탈로그" },
  setRepresentative: { en: "Set representative", vi: "Chọn đại diện", ko: "대표로 선택" },
  downloadPdf: { en: "Download PDF", vi: "Tải PDF", ko: "PDF 다운로드" },
  preview: { en: "Preview", vi: "Xem trước", ko: "미리보기" },
  catalogTitle: { en: "Catalog title", vi: "Tên catalog", ko: "카탈로그명" },
  catalogSubtitle: { en: "Subtitle", vi: "Phụ đề", ko: "부제목" },
  catalogDescription: { en: "Description", vi: "Mô tả", ko: "설명" },
  catalogTemplate: { en: "Catalog template", vi: "Mẫu catalog", ko: "카탈로그 템플릿" },
  selectedProducts: { en: "Selected products", vi: "Sản phẩm đã chọn", ko: "선택 상품" },
  searchProducts: { en: "Search products", vi: "Tìm sản phẩm", ko: "상품 검색" },
  allBrands: { en: "All brands", vi: "Tất cả thương hiệu", ko: "전체 브랜드" },
  allTypes: { en: "All types", vi: "Tất cả loại", ko: "전체 유형" },
  selectAll: { en: "Select all", vi: "Chọn tất cả", ko: "전체선택" },
  selectFiltered: { en: "Select filtered", vi: "Chọn kết quả lọc", ko: "현재 필터 전체선택" },
  clearSelected: { en: "Clear selected", vi: "Bỏ chọn", ko: "선택해제" },
  premiumTemplate: { en: "Premium visual", vi: "Hình ảnh cao cấp", ko: "프리미엄 비주얼" },
  compactTemplate: { en: "Compact bulk list", vi: "Danh sách gọn", ko: "대량상품 압축형" },
  lineupTemplate: { en: "Lineup grid", vi: "Lưới sản phẩm", ko: "라인업 그리드" },
  noCatalogs: { en: "No catalogs yet", vi: "Chưa có catalog", ko: "아직 카탈로그가 없습니다" },
  deleteCatalogConfirm: { en: "Delete this catalog?", vi: "Xóa catalog này?", ko: "이 카탈로그를 삭제할까요?" },
  siteInfo: { en: "Site Info", vi: "Thông tin trang web", ko: "사이트 정보" },
  chatbot: { en: "Chatbot Training", vi: "Huấn luyện chatbot", ko: "챗봇 학습" },
  dealerApplications: { en: "B2B applications", vi: "Đơn đăng ký B2B", ko: "B2B 신청" },
  newUnhandled: { en: "New (unhandled)", vi: "Mới (chưa xử lý)", ko: "신규(미처리)" },
  generalInquiries: { en: "Chatbot records", vi: "Bản ghi chatbot", ko: "챗봇 기록" },
  publishedFaqs: { en: "Published FAQs", vi: "FAQ đã xuất bản", ko: "게시된 FAQ" },
  chatbotTraining: { en: "Chatbot training", vi: "Huấn luyện chatbot", ko: "챗봇 학습" },
  company: { en: "Company", vi: "Công ty", ko: "회사" },
  contact: { en: "Contact", vi: "Liên hệ", ko: "연락처" },
  city: { en: "City", vi: "Thành phố", ko: "도시" },
  volume: { en: "Volume", vi: "Sản lượng", ko: "수량" },
  status: { en: "Status", vi: "Trạng thái", ko: "상태" },
  date: { en: "Date", vi: "Ngày", ko: "날짜" },
  name: { en: "Name", vi: "Tên", ko: "이름" },
  email: { en: "Email", vi: "Email", ko: "이메일" },
  subject: { en: "Subject", vi: "Chủ đề", ko: "제목" },
  message: { en: "Message", vi: "Tin nhắn", ko: "메시지" },
  adminNote: { en: "Admin note", vi: "Ghi chú quản trị", ko: "관리자 메모" },
  saveNote: { en: "Save note", vi: "Lưu ghi chú", ko: "메모 저장" },
  conversation: { en: "Conversation", vi: "Cuộc hội thoại", ko: "대화" },
  customer: { en: "Customer", vi: "Khách hàng", ko: "고객" },
  chatbotAnswer: { en: "Chatbot answer", vi: "Câu trả lời chatbot", ko: "챗봇 답변" },
  dateFilter: { en: "Date filter", vi: "Bộ lọc ngày", ko: "날짜 필터" },
  clearFilter: { en: "Clear filter", vi: "Xóa bộ lọc", ko: "필터 지우기" },
  userSessions: { en: "User sessions", vi: "Phiên người dùng", ko: "사용자별 대화" },
  sessionId: { en: "Session ID", vi: "ID phiên", ko: "사용자 세션" },
  messageCount: { en: "Messages", vi: "Tin nhắn", ko: "대화 수" },
  latestMessage: { en: "Latest message", vi: "Tin nhắn mới nhất", ko: "최근 메시지" },
  question: { en: "Question", vi: "Câu hỏi", ko: "질문" },
  answer: { en: "Answer", vi: "Câu trả lời", ko: "답변" },
  category: { en: "Category", vi: "Danh mục", ko: "카테고리" },
  order: { en: "Order", vi: "Thứ tự", ko: "순서" },
  published: { en: "Published", vi: "Đã xuất bản", ko: "게시됨" },
  title: { en: "Title", vi: "Tiêu đề", ko: "제목" },
  content: { en: "Content", vi: "Nội dung", ko: "콘텐츠" },
  description: { en: "Description", vi: "Mô tả", ko: "설명" },
  imageUrl: { en: "Image URL", vi: "URL hình ảnh", ko: "이미지 URL" },
  ctaLabel: { en: "CTA label", vi: "Nhãn CTA", ko: "CTA 라벨" },
  ctaUrl: { en: "CTA URL", vi: "URL CTA", ko: "CTA URL" },
  active: { en: "Active", vi: "Đang hoạt động", ko: "활성" },
  newFaq: { en: "New FAQ", vi: "FAQ mới", ko: "새 FAQ" },
  editFaq: { en: "Edit FAQ", vi: "Chỉnh sửa FAQ", ko: "FAQ 수정" },
  newPopup: { en: "New popup", vi: "Popup mới", ko: "새 팝업" },
  editPopup: { en: "Edit popup", vi: "Chỉnh sửa popup", ko: "팝업 수정" },
  newEvent: { en: "New event", vi: "Sự kiện mới", ko: "새 이벤트" },
  editEvent: { en: "Edit event", vi: "Chỉnh sửa sự kiện", ko: "이벤트 수정" },
  noApplications: {
    en: "No applications yet",
    vi: "Chưa có đơn đăng ký",
    ko: "아직 신청이 없습니다",
  },
  noInquiries: {
    en: "No chatbot records yet",
    vi: "Chưa có bản ghi chatbot",
    ko: "아직 챗봇 기록이 없습니다",
  },
  noFaqs: { en: "No FAQs yet", vi: "Chưa có FAQ", ko: "아직 FAQ가 없습니다" },
  noPopups: { en: "No popups yet", vi: "Chưa có popup", ko: "아직 팝업이 없습니다" },
  noEvents: { en: "No events yet", vi: "Chưa có sự kiện", ko: "아직 이벤트가 없습니다" },
  live: { en: "Live", vi: "Đang hiển thị", ko: "라이브" },
  draft: { en: "Draft", vi: "Bản nháp", ko: "초안" },
  off: { en: "Off", vi: "Tắt", ko: "꺼짐" },
  scheduled: { en: "Scheduled", vi: "Đã lên lịch", ko: "예약됨" },
  expired: { en: "Expired", vi: "Đã hết hạn", ko: "만료됨" },
  featured: { en: "Featured", vi: "Nổi bật", ko: "추천" },
  normal: { en: "Normal", vi: "Bình thường", ko: "일반" },
  event: { en: "Event", vi: "Sự kiện", ko: "이벤트" },
  newProduct: { en: "New product", vi: "Sản phẩm mới", ko: "신제품" },
  editProduct: { en: "Edit product", vi: "Chỉnh sửa sản phẩm", ko: "제품 수정" },
  productName: { en: "Product name", vi: "Tên sản phẩm", ko: "제품명" },
  brandName: { en: "Brand name", vi: "Tên thương hiệu", ko: "브랜드명" },
  productType: { en: "Product type", vi: "Loại sản phẩm", ko: "제품유형" },
  shortIntro: { en: "Short intro", vi: "Giới thiệu ngắn", ko: "한줄 소개" },
  detailEditor: {
    en: "Detail editor (HTML)",
    vi: "Trình chỉnh sửa chi tiết (HTML)",
    ko: "상세설명 에디터(HTML)",
  },
  coverImage: { en: "Cover image URL", vi: "URL ảnh đại diện", ko: "대표 이미지 URL" },
  mediaUrls: { en: "Photos / Videos", vi: "Ảnh / Video", ko: "사진 / 동영상" },
  conditions: { en: "Conditions / prices", vi: "Điều kiện / giá", ko: "조건 / 가격" },
  showCondition: { en: "Show", vi: "Hiển thị", ko: "노출" },
  popularProduct: { en: "Popular product", vi: "Sản phẩm phổ biến", ko: "인기제품" },
  featuredProduct: { en: "Featured highlight", vi: "Nổi bật", ko: "강조" },
  addMedia: { en: "Add media", vi: "Thêm media", ko: "미디어 추가" },
  addCondition: { en: "Add condition", vi: "Thêm điều kiện", ko: "조건 추가" },
  noProducts: { en: "No products yet", vi: "Chưa có sản phẩm", ko: "아직 제품이 없습니다" },
  deleteProductConfirm: {
    en: "Delete this product?",
    vi: "Xóa sản phẩm này?",
    ko: "이 제품을 삭제할까요?",
  },
  media: { en: "Media", vi: "Phương tiện", ko: "미디어" },
  type: { en: "Type", vi: "Loại", ko: "유형" },
  siteInformation: { en: "Site information", vi: "Thông tin trang web", ko: "사이트 정보" },
  saveChanges: { en: "Save changes", vi: "Lưu thay đổi", ko: "변경사항 저장" },
  saving: { en: "Saving...", vi: "Đang lưu...", ko: "저장 중..." },
  enabled: { en: "Enabled", vi: "Đã bật", ko: "활성화" },
  on: { en: "On", vi: "Bật", ko: "켜짐" },
  reset: { en: "Reset", vi: "Đặt lại", ko: "초기화" },
  resetHomeConfirm: {
    en: "Reset selected page content to code defaults?",
    vi: "Đặt lại nội dung trang đã chọn về mặc định trong mã?",
    ko: "선택한 페이지 콘텐츠를 코드 기본값으로 초기화할까요?",
  },
  homeEditor: { en: "Content editor", vi: "Trình chỉnh sửa nội dung", ko: "콘텐츠수정" },
  homeEditorDesc: {
    en: "Choose a public site menu and edit the VI/EN text applied to that page. HOME includes the full homepage sections.",
    vi: "Chọn menu trên trang công khai và chỉnh sửa nội dung VI/EN áp dụng cho trang đó. HOME bao gồm toàn bộ các khu vực trang chủ.",
    ko: "사용자 사이트 메뉴를 선택해 해당 페이지의 VI/EN 문구를 수정합니다. HOME은 홈페이지 전체 섹션을 포함합니다.",
  },
  pageToEdit: { en: "Page to edit", vi: "Trang cần chỉnh sửa", ko: "수정할 페이지" },
  saveHome: { en: "Save content", vi: "Lưu nội dung", ko: "콘텐츠 저장" },
  loadingHomeEditor: {
    en: "Loading home editor...",
    vi: "Đang tải trình chỉnh sửa trang chủ...",
    ko: "홈페이지 편집기를 불러오는 중...",
  },
  defaultHeroImageHint: {
    en: "Leave blank to use the default Gippy image.",
    vi: "Để trống để dùng hình Gippy mặc định.",
    ko: "비워두면 기본 Gippy 이미지를 사용합니다.",
  },
  heroSection: { en: "Hero", vi: "Khu vực hero", ko: "히어로 영역" },
  heroStats: { en: "Hero stats", vi: "Chỉ số hero", ko: "히어로 지표" },
  partnerHook: { en: "Partner hook", vi: "Thông điệp thu hút đối tác", ko: "파트너 유도 문구" },
  trustPillars: { en: "Trust & pillars", vi: "Niềm tin & trụ cột", ko: "신뢰 요소" },
  processImagesCta: {
    en: "Process / Images / CTA",
    vi: "Quy trình / Hình ảnh / CTA",
    ko: "프로세스 / 이미지 / CTA",
  },
  kicker: { en: "Kicker", vi: "Dòng nhấn", ko: "강조 문구" },
  subtitle: { en: "Subtitle", vi: "Phụ đề", ko: "부제목" },
  primaryCta: { en: "Primary CTA", vi: "CTA chính", ko: "주요 CTA" },
  secondaryCta: { en: "Secondary CTA", vi: "CTA phụ", ko: "보조 CTA" },
  heroImageUrl: { en: "Hero image URL", vi: "URL hình hero", ko: "히어로 이미지 URL" },
  heroImageAlt: { en: "Hero image alt", vi: "Alt hình hero", ko: "히어로 이미지 대체 텍스트" },
  masksValue: { en: "Masks value", vi: "Giá trị mặt nạ", ko: "마스크 수치" },
  countriesValue: { en: "Countries value", vi: "Giá trị quốc gia", ko: "국가 수치" },
  vietnamValue: { en: "Vietnam value", vi: "Giá trị Việt Nam", ko: "베트남 수치" },
  masksLabel: { en: "Masks label", vi: "Nhãn mặt nạ", ko: "마스크 라벨" },
  countriesLabel: { en: "Countries label", vi: "Nhãn quốc gia", ko: "국가 라벨" },
  vietnamLabel: { en: "Vietnam label", vi: "Nhãn Việt Nam", ko: "베트남 라벨" },
  highlight: { en: "Highlight", vi: "Điểm nhấn", ko: "하이라이트" },
  trustKicker: { en: "Trust kicker", vi: "Dòng nhấn niềm tin", ko: "신뢰 강조 문구" },
  trustTitle: { en: "Trust title", vi: "Tiêu đề niềm tin", ko: "신뢰 제목" },
  smallLabel: { en: "Small", vi: "Nhãn nhỏ", ko: "소형 라벨" },
  text: { en: "Text", vi: "Văn bản", ko: "텍스트" },
  processKicker: { en: "Process kicker", vi: "Dòng nhấn quy trình", ko: "프로세스 강조 문구" },
  processTitle: { en: "Process title", vi: "Tiêu đề quy trình", ko: "프로세스 제목" },
  processBody: { en: "Process body", vi: "Nội dung quy trình", ko: "프로세스 본문" },
  imageKicker: { en: "Image kicker", vi: "Dòng nhấn hình ảnh", ko: "이미지 강조 문구" },
  imageTitle: { en: "Image title", vi: "Tiêu đề hình ảnh", ko: "이미지 제목" },
  imageBody: { en: "Image body", vi: "Nội dung hình ảnh", ko: "이미지 본문" },
  imageCta: { en: "Image CTA", vi: "CTA hình ảnh", ko: "이미지 CTA" },
  imageSlot: { en: "Image slot", vi: "Vị trí hình ảnh", ko: "이미지 슬롯" },
  labelVi: { en: "Label VI", vi: "Nhãn VI", ko: "VI 라벨" },
  labelEn: { en: "Label EN", vi: "Nhãn EN", ko: "EN 라벨" },
  altVi: { en: "Alt VI", vi: "Alt VI", ko: "VI 대체 텍스트" },
  altEn: { en: "Alt EN", vi: "Alt EN", ko: "EN 대체 텍스트" },
  ctaKicker: { en: "CTA kicker", vi: "Dòng nhấn CTA", ko: "CTA 강조 문구" },
  ctaTitle: { en: "CTA title", vi: "Tiêu đề CTA", ko: "CTA 제목" },
  ctaHighlight: { en: "CTA highlight", vi: "Điểm nhấn CTA", ko: "CTA 하이라이트" },
  ctaBody: { en: "CTA body", vi: "Nội dung CTA", ko: "CTA 본문" },
  ctaButton: { en: "CTA button", vi: "Nút CTA", ko: "CTA 버튼" },
  numberLabel: { en: "No.", vi: "STT", ko: "번호" },
  titleVi: { en: "Title VI", vi: "Tiêu đề VI", ko: "VI 제목" },
  titleEn: { en: "Title EN", vi: "Tiêu đề EN", ko: "EN 제목" },
  ctaVi: { en: "CTA VI", vi: "CTA VI", ko: "VI CTA" },
  ctaEn: { en: "CTA EN", vi: "CTA EN", ko: "EN CTA" },
  qa: { en: "Q&A", vi: "Q&A", ko: "Q&A" },
  legalNameEn: { en: "Legal name (EN)", vi: "Tên pháp lý (EN)", ko: "법인명(EN)" },
  legalNameVi: { en: "Legal name (VI)", vi: "Tên pháp lý (VI)", ko: "법인명(VI)" },
  taxCode: { en: "Tax code", vi: "Mã số thuế", ko: "세금 코드" },
  representative: { en: "Representative", vi: "Người đại diện", ko: "대표자" },
  address: { en: "Address", vi: "Địa chỉ", ko: "주소" },
  zaloPhone: {
    en: "Zalo phone (digits only)",
    vi: "Số Zalo (chỉ nhập số)",
    ko: "Zalo 전화번호(숫자만)",
  },
  whatsappPhone: {
    en: "WhatsApp phone (digits only)",
    vi: "Số WhatsApp (chỉ nhập số)",
    ko: "WhatsApp 전화번호(숫자만)",
  },
  deleteApplicationConfirm: {
    en: "Delete this application?",
    vi: "Xóa đơn đăng ký này?",
    ko: "이 신청을 삭제할까요?",
  },
  deleteConfirm: { en: "Delete?", vi: "Xóa?", ko: "삭제할까요?" },
  deleteFaqConfirm: { en: "Delete FAQ?", vi: "Xóa FAQ?", ko: "FAQ를 삭제할까요?" },
  deletePopupConfirm: { en: "Delete popup?", vi: "Xóa popup?", ko: "팝업을 삭제할까요?" },
  deleteEventConfirm: {
    en: "Delete this event?",
    vi: "Xóa sự kiện này?",
    ko: "이 이벤트를 삭제할까요?",
  },
  deleteEntryConfirm: { en: "Delete entry?", vi: "Xóa mục này?", ko: "항목을 삭제할까요?" },
  questionAnswerRequired: {
    en: "Question and answer required",
    vi: "Cần nhập câu hỏi và câu trả lời",
    ko: "질문과 답변이 필요합니다",
  },
  titleRequired: { en: "Title required", vi: "Cần nhập tiêu đề", ko: "제목이 필요합니다" },
  titleViEnRequired: {
    en: "Title VI/EN is required",
    vi: "Cần nhập tiêu đề VI/EN",
    ko: "VI/EN 제목이 필요합니다",
  },
  submitted: { en: "Submitted", vi: "Đã gửi", ko: "제출됨" },
  position: { en: "Position", vi: "Chức vụ", ko: "직책" },
  channel: { en: "Channel", vi: "Kênh", ko: "채널" },
  monthlyVolume: { en: "Monthly volume", vi: "Sản lượng hằng tháng", ko: "월간 수량" },
  brands: { en: "Brands", vi: "Thương hiệu", ko: "브랜드" },
  phone: { en: "Phone", vi: "Điện thoại", ko: "전화번호" },
  emailReply: { en: "Email reply", vi: "Trả lời qua email", ko: "이메일 답장" },
  sortOrder: { en: "Sort order", vi: "Thứ tự sắp xếp", ko: "정렬 순서" },
  priority: { en: "Priority", vi: "Độ ưu tiên", ko: "우선순위" },
  higherShowsFirst: {
    en: "higher shows first",
    vi: "số cao hơn hiển thị trước",
    ko: "숫자가 높을수록 먼저 표시",
  },
  startsAt: { en: "Starts at", vi: "Bắt đầu lúc", ko: "시작 시간" },
  endsAt: { en: "Ends at", vi: "Kết thúc lúc", ko: "종료 시간" },
  eventPageDesc: {
    en: "Create photo, video, embed and text event posts for the public Event page.",
    vi: "Tạo bài viết sự kiện dạng ảnh, video, nhúng và văn bản cho trang Sự kiện công khai.",
    ko: "공개 이벤트 페이지에 표시할 사진, 동영상, 임베드, 텍스트 게시물을 만듭니다.",
  },
  contentType: { en: "Content type", vi: "Loại nội dung", ko: "콘텐츠 유형" },
  newProductSpotlight: {
    en: "New product spotlight",
    vi: "Điểm nhấn sản phẩm mới",
    ko: "신제품 소개",
  },
  summary: { en: "Summary", vi: "Tóm tắt", ko: "요약" },
  body: { en: "Body", vi: "Nội dung", ko: "본문" },
  mediaType: { en: "Media type", vi: "Loại phương tiện", ko: "미디어 유형" },
  imageUrlOption: { en: "Image URL", vi: "URL hình ảnh", ko: "이미지 URL" },
  videoUrl: { en: "Video URL", vi: "URL video", ko: "동영상 URL" },
  embedUrl: { en: "Embed URL", vi: "URL nhúng", ko: "임베드 URL" },
  mediaUrl: { en: "Media URL", vi: "URL phương tiện", ko: "미디어 URL" },
  eventDate: { en: "Event date", vi: "Ngày sự kiện", ko: "이벤트 날짜" },
  settingsDesc: {
    en: "Override the default contact info shown across the site. Empty fields fall back to built-in defaults.",
    vi: "Ghi đè thông tin liên hệ mặc định hiển thị trên toàn trang. Các trường để trống sẽ dùng giá trị mặc định có sẵn.",
    ko: "사이트 전체에 표시되는 기본 연락처 정보를 덮어씁니다. 비워둔 항목은 내장 기본값을 사용합니다.",
  },
  all: { en: "All", vi: "Tất cả", ko: "전체" },
  product: { en: "Product", vi: "Sản phẩm", ko: "제품" },
  document: { en: "Document", vi: "Tài liệu", ko: "문서" },
  titleQuestion: { en: "Title / Question", vi: "Tiêu đề / Câu hỏi", ko: "제목 / 질문" },
  tags: { en: "Tags", vi: "Thẻ", ko: "태그" },
  noTrainingData: {
    en: "No training data yet",
    vi: "Chưa có dữ liệu huấn luyện",
    ko: "아직 학습 데이터가 없습니다",
  },
  untitled: { en: "(untitled)", vi: "(chưa có tiêu đề)", ko: "(제목 없음)" },
  editEntry: { en: "Edit entry", vi: "Chỉnh sửa mục", ko: "항목 수정" },
  newTrainingEntry: { en: "New training entry", vi: "Mục huấn luyện mới", ko: "새 학습 항목" },
  qaPair: { en: "Q&A pair", vi: "Cặp hỏi đáp", ko: "Q&A 쌍" },
  productInfo: { en: "Product info", vi: "Thông tin sản phẩm", ko: "제품 정보" },
  documentFreeform: {
    en: "Document / freeform",
    vi: "Tài liệu / nội dung tự do",
    ko: "문서 / 자유 형식",
  },
  tagsComma: {
    en: "Tags (comma separated)",
    vi: "Thẻ (phân tách bằng dấu phẩy)",
    ko: "태그(쉼표로 구분)",
  },
  chatbotTrainingDesc: {
    en: "Q&A pairs, product facts, and freeform docs the chatbot can use.",
    vi: "Các cặp hỏi đáp, thông tin sản phẩm và tài liệu tự do mà chatbot có thể sử dụng.",
    ko: "챗봇이 사용할 수 있는 Q&A, 제품 정보, 자유 형식 문서를 관리합니다.",
  },
  trainingEntries: { en: "Training entries", vi: "Mục huấn luyện", ko: "학습 항목" },
  documentLibrary: { en: "Document library", vi: "Thư viện tài liệu", ko: "문서 라이브러리" },
  documentLibraryDesc: {
    en: "Register manuals, policies, product sheets, and long documents. They are split into searchable chunks for Gippy AI.",
    vi: "Đăng ký hướng dẫn, chính sách, bảng thông tin sản phẩm và tài liệu dài. Nội dung sẽ được chia thành các đoạn có thể tìm kiếm cho Gippy AI.",
    ko: "매뉴얼, 정책, 제품 자료, 긴 문서를 등록합니다. Gippy AI가 검색할 수 있도록 청크로 분할됩니다.",
  },
  newDocument: { en: "New document", vi: "Tài liệu mới", ko: "새 문서" },
  editDocument: { en: "Edit document", vi: "Chỉnh sửa tài liệu", ko: "문서 수정" },
  rawContent: { en: "Document content", vi: "Nội dung tài liệu", ko: "문서 내용" },
  rawContentHint: {
    en: "Paste text from PDF, Word, product sheets, manuals, or policy documents.",
    vi: "Dán văn bản từ PDF, Word, bảng thông tin sản phẩm, hướng dẫn hoặc tài liệu chính sách.",
    ko: "PDF, Word, 제품 자료, 매뉴얼, 정책 문서의 텍스트를 붙여넣으세요.",
  },
  mixed: { en: "Mixed", vi: "Hỗn hợp", ko: "혼합" },
  brand: { en: "Brand", vi: "Thương hiệu", ko: "브랜드" },
  b2bCategory: { en: "B2B", vi: "B2B", ko: "B2B" },
  policy: { en: "Policy", vi: "Chính sách", ko: "정책" },
  manual: { en: "Manual", vi: "Hướng dẫn", ko: "매뉴얼" },
  other: { en: "Other", vi: "Khác", ko: "기타" },
  chunks: { en: "Chunks", vi: "Đoạn", ko: "청크" },
  previewChunks: { en: "Preview chunks", vi: "Xem trước các đoạn", ko: "청크 미리보기" },
  processDocument: { en: "Process document", vi: "Xử lý tài liệu", ko: "문서 처리" },
  processingComplete: { en: "Document processed", vi: "Đã xử lý tài liệu", ko: "문서 처리 완료" },
  documentRequired: {
    en: "Title and content are required.",
    vi: "Cần nhập tiêu đề và nội dung.",
    ko: "제목과 내용이 필요합니다.",
  },
  archived: { en: "Archived", vi: "Đã lưu trữ", ko: "보관됨" },
  failed: { en: "Failed", vi: "Thất bại", ko: "실패" },
  sourceScope: { en: "Source scope", vi: "Phạm vi nguồn", ko: "소스 범위" },
  chatUiModes: {
    en: "Customer chat UI modes",
    vi: "Chế độ giao diện chat khách hàng",
    ko: "고객 채팅 UI 모드",
  },
  chatUiModesDesc: {
    en: "Manage both guided tree answers and natural-language AI answers from the same approved knowledge base.",
    vi: "Quản lý cả câu trả lời dạng cây hướng dẫn và câu trả lời AI ngôn ngữ tự nhiên từ cùng một kho kiến thức đã duyệt.",
    ko: "승인된 동일 지식베이스에서 트리형 안내 답변과 자연어 AI 답변을 함께 관리합니다.",
  },
  treeMode: { en: "Tree guide mode", vi: "Chế độ hướng dẫn dạng cây", ko: "트리 가이드 모드" },
  naturalMode: {
    en: "Natural AI chat mode",
    vi: "Chế độ chat AI tự nhiên",
    ko: "자연어 AI 채팅 모드",
  },
  treeModeDesc: {
    en: "Button and branch-based flows for fast product, B2B, brand, and contact guidance.",
    vi: "Luồng dựa trên nút và nhánh để hướng dẫn nhanh về sản phẩm, B2B, thương hiệu và liên hệ.",
    ko: "제품, B2B, 브랜드, 연락처 안내를 빠르게 제공하는 버튼/분기 기반 흐름입니다.",
  },
  naturalModeDesc: {
    en: "Free-text questions answered only from approved Q&A, product facts, and document chunks.",
    vi: "Câu hỏi tự do chỉ được trả lời dựa trên Q&A, thông tin sản phẩm và đoạn tài liệu đã duyệt.",
    ko: "자유 입력 질문은 승인된 Q&A, 제품 정보, 문서 청크만 기반으로 답변합니다.",
  },
  sharedKnowledgeBase: {
    en: "Shared knowledge base",
    vi: "Kho kiến thức dùng chung",
    ko: "공유 지식베이스",
  },
  treeScenario: { en: "Tree scenario", vi: "Kịch bản dạng cây", ko: "트리 시나리오" },
  scenarioId: { en: "Scenario ID", vi: "ID kịch bản", ko: "시나리오 ID" },
  parentId: { en: "Parent ID", vi: "ID mục cha", ko: "상위 ID" },
  buttonLabel: { en: "Button label", vi: "Nhãn nút", ko: "버튼 라벨" },
  answerMode: { en: "Answer mode", vi: "Chế độ trả lời", ko: "답변 모드" },
  new: { en: "New", vi: "Mới", ko: "신규" },
  reviewing: { en: "Reviewing", vi: "Đang xem xét", ko: "검토 중" },
  approved: { en: "Approved", vi: "Đã duyệt", ko: "승인됨" },
  rejected: { en: "Rejected", vi: "Đã từ chối", ko: "거절됨" },
  replied: { en: "Replied", vi: "Đã trả lời", ko: "답변 완료" },
  closed: { en: "Closed", vi: "Đã đóng", ko: "종료됨" },
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

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · GPCLUB Vietnam" }] }),
  component: AdminPage,
});

function AdminPage() {
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
    { label: t("dealerApplications"), value: stats.dealers, accent: "text-gold" },
    { label: t("newUnhandled"), value: stats.newDealers, accent: "text-primary" },
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
          onChange={(e: any) => onChange({ ...value, vi: e.target.value })}
        />
      </div>
      <div>
        <Label>{label} EN</Label>
        <Comp
          className="mt-1.5"
          value={value.en}
          rows={multiline ? 3 : undefined}
          onChange={(e: any) => onChange({ ...value, en: e.target.value })}
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
        ? { key: "home", value: form as any }
        : { key: pageContentStorageKey(selectedPage), value: pageForm as any };
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
                        const alts = { vi: [...form.images.alts.vi], en: [...form.images.alts.en] };
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
                        const alts = { vi: [...form.images.alts.vi], en: [...form.images.alts.en] };
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
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("b2b_inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const updateApplication = async (id: string, patch: Record<string, unknown>) => {
    const { error } = await supabase
      .from("b2b_inquiries")
      .update(patch as any)
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("updated"));
    setRows((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    setSelected((x: any | null) => (x?.id === id ? { ...x, ...patch } : x));
  };

  const updateStatus = async (id: string, status: string) => {
    await updateApplication(id, { status });
  };

  const saveNote = async () => {
    if (!selected) return;
    await updateApplication(selected.id, { admin_note: selected.admin_note ?? "" });
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
      .order("created_at", { ascending: false });
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
                  {t("sessionId")}: {selectedSession.sessionId} · {t("messageCount")}:{" "}
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
                            updateRecord(record.id, { admin_note: record.admin_note ?? "" })
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
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
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
  const [rows, setRows] = useState<any[]>([]);
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
                      setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })
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
  const [rows, setRows] = useState<any[]>([]);
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
                      setEditing({ ...editing, starts_at: localInputToIso(e.target.value) })
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
                      setEditing({ ...editing, ends_at: localInputToIso(e.target.value) })
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
                    setEditing({ ...editing, priority: Number(e.target.value) || 0 })
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
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: false })
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

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
                      setEditing({ ...r });
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
                      setEditing({ ...editing, post_type: v as "event" | "new_product" })
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
                      setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })
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

const CONTACT_FIELDS: { key: string; labelKey: keyof typeof ADMIN_I18N; multiline?: boolean }[] = [
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
    setValues((data?.value as any) ?? {});
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
  metadata: any;
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
  metadata?: any;
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
  const [rows, setRows] = useState<any[]>([]);
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
      supabase.from("chatbot_training").select("*").order("created_at", { ascending: false }),
      supabase.from("chatbot_documents").select("*").order("updated_at", { ascending: false }),
      supabase
        .from("chatbot_tree_nodes")
        .select("*")
        .order("scenario_key", { ascending: true })
        .order("sort_order", { ascending: true }),
    ]);
    if (trainingError) toast.error(trainingError.message);
    else setRows(training ?? []);
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
      .order("chunk_index", { ascending: true });
    if (error) return toast.error(error.message);
    setChunks((prev) => ({ ...prev, [documentId]: (data ?? []) as ChatbotChunkRow[] }));
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
      const newChunks = chunkText(doc.raw_content, { maxChars: 1100, overlapChars: 160 }).map(
        (chunk, index) => ({
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
        }),
      );
      const del = await supabase.from("chatbot_document_chunks").delete().eq("document_id", doc.id);
      if (del.error) throw del.error;
      if (newChunks.length) {
        const ins = await supabase.from("chatbot_document_chunks").insert(newChunks);
        if (ins.error) throw ins.error;
      }
      if (jobId) {
        await supabase
          .from("chatbot_training_jobs")
          .update({ status: "completed", finished_at: new Date().toISOString() })
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
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
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
                  onChange={(e) => setDocEditing({ ...docEditing, description: e.target.value })}
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
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
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
                      setDocEditing({ ...docEditing, version: Number(e.target.value) || 1 })
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
                  onChange={(e) => setDocEditing({ ...docEditing, raw_content: e.target.value })}
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
                      setTreeEditing({ ...treeEditing, scenario_key: e.target.value })
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
                      setTreeEditing({ ...treeEditing, parent_id: e.target.value || null })
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
                      setTreeEditing({ ...treeEditing, sort_order: Number(e.target.value) || 0 })
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
                    onChange={(e) => setTreeEditing({ ...treeEditing, label_en: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("buttonLabel")} VI</Label>
                  <Input
                    className="mt-1.5"
                    value={treeEditing.label_vi ?? ""}
                    onChange={(e) => setTreeEditing({ ...treeEditing, label_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("buttonLabel")} KO</Label>
                  <Input
                    className="mt-1.5"
                    value={treeEditing.label_ko ?? ""}
                    onChange={(e) => setTreeEditing({ ...treeEditing, label_ko: e.target.value })}
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
                    onChange={(e) => setTreeEditing({ ...treeEditing, answer_en: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("answer")} VI</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={5}
                    value={treeEditing.answer_vi ?? ""}
                    onChange={(e) => setTreeEditing({ ...treeEditing, answer_vi: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t("answer")} KO</Label>
                  <Textarea
                    className="mt-1.5"
                    rows={5}
                    value={treeEditing.answer_ko ?? ""}
                    onChange={(e) => setTreeEditing({ ...treeEditing, answer_ko: e.target.value })}
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

  const brands = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.brand_name).filter(Boolean)))], [products]);
  const productTypes = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.product_type).filter(Boolean)))], [products]);
  const filteredProducts = useMemo(() => {
    const query = normalizedSearchText(productSearch);
    return products.filter((product) => {
      const brandMatch = brandFilter === "All" || product.brand_name === brandFilter;
      const typeMatch = typeFilter === "All" || product.product_type === typeFilter;
      const searchMatch = !query || normalizedSearchText([
        product.brand_name,
        product.product_name,
        product.product_type,
        product.short_intro,
      ].join(" ")).includes(query);
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
      await saveProductCatalogs(payload.is_representative
        ? nextRows.map((row) => ({ ...row, is_representative: row.id === payload.id }))
        : nextRows);
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
      await saveProductCatalogs(rows.map((item) => ({ ...item, is_representative: item.id === row.id })));
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

  const openCatalog = (id: string) => window.open(`/catalog/${id}`, "_blank", "noopener,noreferrer");

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
                    <Button variant="ghost" size="icon" onClick={() => openCatalog(row.id)} title={t("preview")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openCatalog(row.id)} title={t("downloadPdf")}>
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
                  <Input className="mt-1.5" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>
                <div>
                  <Label>{t("catalogSubtitle")}</Label>
                  <Input className="mt-1.5" value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>{t("catalogDescription")}</Label>
                <Textarea className="mt-1.5" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label>{t("catalogTemplate")}</Label>
                <Select value={editing.template} onValueChange={(value) => setEditing({ ...editing, template: value as ProductCatalog["template"] })}>
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
                  <p className="mt-1 text-xs text-muted-foreground">Main hero catalog download button will use this catalog.</p>
                </div>
                <Switch checked={editing.is_representative} onCheckedChange={(v) => setEditing({ ...editing, is_representative: v })} />
              </div>
              <div className="rounded-2xl border border-border p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Label>{t("selectedProducts")}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">Filter products, then bulk-select the current result.</p>
                  </div>
                  <Badge variant="secondary">{editing.product_ids.length} / {products.length}</Badge>
                </div>
                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
                  <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder={t("searchProducts")} />
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => <SelectItem key={brand} value={brand}>{brand === "All" ? t("allBrands") : brand}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => <SelectItem key={type} value={type}>{type === "All" ? t("allTypes") : type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedProducts(products.map((product) => product.id))}>{t("selectAll")}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedProducts(filteredProducts.map((product) => product.id))}>{t("selectFiltered")}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedProducts([])}>{t("clearSelected")}</Button>
                  <Badge variant="outline" className="px-3">{filteredProducts.length} shown</Badge>
                </div>
                <div className="grid max-h-[460px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                  {filteredProducts.map((product) => {
                    const image = getCoverImage(product);
                    return (
                    <label key={product.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 p-3 transition hover:bg-muted/40">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-primary"
                        checked={editing.product_ids.includes(product.id)}
                        onChange={(e) => toggleProduct(product.id, e.target.checked)}
                      />
                      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold uppercase tracking-[0.18em] text-primary">{product.brand_name}</span>
                        <span className="mt-1 block font-semibold">{product.product_name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{product.product_type}</span>
                      </span>
                    </label>
                  );})}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                <Button onClick={save}>{t("save")}</Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
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

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_products")
      .select("*")
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data || []) as CatalogProduct[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const startNew = () => {
    setEditing(emptyProduct());
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const payload = {
      brand_name: canonicalBrandName(editing.brand_name),
      product_name: editing.product_name,
      product_type: editing.product_type,
      short_intro: editing.short_intro,
      detail_html: editing.detail_html,
      media: editing.media,
      conditions: editing.conditions,
      cover_image_url: editing.cover_image_url || null,
      sort_order: Number(editing.sort_order) || 0,
      published: editing.published,
      is_new: editing.is_new,
      is_popular: editing.is_popular,
      is_featured: editing.is_featured,
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
    () => ["All", ...Array.from(new Set(rows.map((row) => row.brand_name).filter(Boolean)))],
    [rows],
  );
  const productTypes = useMemo(
    () => Array.from(new Set(rows.map((row) => row.product_type).filter(Boolean))).sort(),
    [rows],
  );
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (
        brandFilter !== "All" &&
        normalizeBrandText(row.brand_name) !== normalizeBrandText(brandFilter)
      )
        return false;
      if (!q) return true;
      return (
        normalizedSearchText(
          [row.brand_name, row.product_name, row.product_type, row.short_intro].join(" "),
        ).includes(q) ||
        normalizedSearchText(
          [row.brand_name, row.product_name, row.product_type, row.short_intro].join(" "),
        ).includes(normalizeBrandText(q))
      );
    });
  }, [rows, search, brandFilter]);

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
    setEditing({ ...editing, media: [...editing.media, { type: "image", url: "", alt: "" }] });
  };

  const addCondition = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      conditions: [...editing.conditions, { label: "Price", value: "", visible: true }],
    });
  };

  const wrapDetail = (before: string, after = "") => {
    if (!editing) return;
    setEditing({ ...editing, detail_html: `${editing.detail_html || ""}${before}${after}` });
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
          {filteredRows.length} / {rows.length}
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
              {filteredRows.map((row) => (
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
                          void quickUpdate(row, { product_name: e.target.value });
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
                          void quickUpdate(row, { product_type: e.target.value });
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? t("editProduct") : t("newProduct")}</DialogTitle>
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
                      setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })
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

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <Label>{t("detailEditor")}</Label>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => wrapDetail("<h2>Title</h2>")}
                    >
                      H2
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        wrapDetail('<p style="font-size:18px;color:#111827;">Text</p>')
                      }
                    >
                      Text
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => wrapDetail('<img src="IMAGE_URL" alt="Product image" />')}
                    >
                      Image
                    </Button>
                  </div>
                </div>
                <Textarea
                  className="min-h-[180px] font-mono text-xs"
                  value={editing.detail_html || ""}
                  onChange={(e) => setEditing({ ...editing, detail_html: e.target.value })}
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
                          media[idx] = { ...m, type: v as ProductMedia["type"] };
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
