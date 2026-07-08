import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCachedPublicData,
  readPublicDataCache,
  withPublicDataTimeout,
} from "@/lib/public-data-timeout";

export type SiteLang = "vi" | "en";
export type PageContentKey = "brand" | "products" | "gippy-ai" | "events" | "b2b" | "contact";
export type PageLocalizedText = Record<SiteLang, string>;

export type PageHeroImage = {
  url: string;
  alt: PageLocalizedText;
};

export type PageImageAsset = {
  url: string;
  alt: PageLocalizedText;
};

export type BrandSectionContent = {
  positioning: {
    kicker: string;
    title: PageLocalizedText;
    highlight: PageLocalizedText;
    body: PageLocalizedText[];
  };
  coreValues: Array<{
    id: string;
    label: string;
    text: PageLocalizedText;
  }>;
  brands: Array<{
    id: string;
    name: string;
    category: string;
    headline: PageLocalizedText;
    quote: PageLocalizedText;
    body: PageLocalizedText;
  }>;
  advisor: {
    kicker: string;
    title: PageLocalizedText;
    body: PageLocalizedText;
    image: PageImageAsset;
  };
  imageSlots: Array<{
    id: string;
    label: PageLocalizedText;
    image: PageImageAsset;
  }>;
};

export type B2BSectionContent = {
  why: {
    kicker: PageLocalizedText;
    title: PageLocalizedText;
    cards: Array<{
      id: string;
      num: string;
      hook: PageLocalizedText;
      title: string;
      copy: PageLocalizedText;
    }>;
  };
  values: {
    kicker: PageLocalizedText;
    title: PageLocalizedText;
    cards: Array<{
      id: string;
      num: string;
      eyebrow: string;
      title: PageLocalizedText;
      sub: PageLocalizedText;
      copy: PageLocalizedText;
    }>;
  };
  brands: {
    kicker: PageLocalizedText;
    title: PageLocalizedText;
    items: Array<{
      id: string;
      name: string;
      copy: PageLocalizedText;
    }>;
  };
  process: {
    kicker: PageLocalizedText;
    title: PageLocalizedText;
    description: PageLocalizedText;
    steps: PageLocalizedText[];
  };
  imageSpaces: {
    kicker: PageLocalizedText;
    title: PageLocalizedText;
    description: PageLocalizedText;
    slots: PageLocalizedText[];
  };
  contact: {
    kicker: PageLocalizedText;
    title: PageLocalizedText;
    description: PageLocalizedText;
  };
};

export type GippyAiSectionContent = {
  guide: {
    kicker: string;
    title: PageLocalizedText;
    description: PageLocalizedText;
    askLabel: PageLocalizedText;
  };
  suggestions: Array<{
    id: string;
    icon: "sparkle" | "package" | "briefcase" | "message";
    title: PageLocalizedText;
    sub: PageLocalizedText;
    prompt: PageLocalizedText;
  }>;
  quickActions: Array<{
    id: string;
    icon: "message" | "search" | "briefcase";
    label: PageLocalizedText;
    body: PageLocalizedText;
    prompt: PageLocalizedText;
    kind: "gippy" | "products" | "b2b";
  }>;
  statChips: Array<{
    id: string;
    top: string;
    bottom: PageLocalizedText;
  }>;
};

export type PageSections = {
  brand?: BrandSectionContent;
  b2b?: B2BSectionContent;
  gippyAi?: GippyAiSectionContent;
};

export type PageEditableContent = {
  kicker: PageLocalizedText;
  title: PageLocalizedText;
  highlight: PageLocalizedText;
  description: PageLocalizedText;
  primaryCta: PageLocalizedText;
  secondaryCta: PageLocalizedText;
  heroImage: PageHeroImage;
  sections: PageSections;
};

const text = (vi: string, en: string): PageLocalizedText => ({ vi, en });
const emptyHeroImage = (): PageHeroImage => ({ url: "", alt: text("", "") });
const emptyImageAsset = (): PageImageAsset => ({ url: "", alt: text("", "") });

const DEFAULT_BRAND_SECTIONS: BrandSectionContent = {
  positioning: {
    kicker: "GPVN POSITIONING",
    title: text("Không chỉ phân phối.", "Not only distribution."),
    highlight: text("GPVN là cầu nối chiến lược.", "GPVN is a strategic bridge."),
    body: [
      text(
        "GPVN kết nối DNA đột phá của tập đoàn mẹ với nhu cầu thực tế của người tiêu dùng Việt Nam thông qua JMsolution và Jmella.",
        "GPVN connects the parent company's innovation DNA with the needs of Vietnamese partner channels through JMsolution and Jmella.",
      ),
      text(
        "Triết lý của GPVN là biến chăm sóc da và tóc thành hành trình nâng niu, bồi đắp giá trị bản thân mỗi ngày.",
        "GPVN turns skin and hair care into a daily journey of cherishing and building personal value.",
      ),
    ],
  },
  coreValues: [
    {
      id: "passion",
      label: "PASSION",
      text: text(
        "Sự nhiệt huyết, chủ động đón đầu các làn sóng xu hướng làm đẹp tại Việt Nam.",
        "We move first with Vietnam's beauty trends and bring the right solutions to partner channels before demand peaks.",
      ),
    },
    {
      id: "innovation",
      label: "INNOVATION",
      text: text(
        "Đổi mới không ngừng để thích ứng với khí hậu, môi trường và đặc tính làn da của người Việt.",
        "We continuously adapt formulas and experiences to Vietnam's climate, environment, and skin needs.",
      ),
    },
    {
      id: "expertise",
      label: "EXPERTISE",
      text: text(
        "Xây dựng niềm tin bằng sự chuyên nghiệp, minh bạch và kiến thức chuyên sâu về da và tóc.",
        "We build trust through transparent expertise in skincare, haircare, and product education.",
      ),
    },
  ],
  brands: [
    {
      id: "jmsolution",
      name: "JMsolution",
      category: "Skin Science",
      headline: text(
        "Giải pháp khoa học đột phá cho làn da tỏa sáng",
        "Breakthrough skin science for visible radiance",
      ),
      quote: text(
        "Chuyên gia chăm sóc da chuyên sâu - Dẫn dắt xu hướng K-Beauty toàn cầu.",
        "A professional skincare expert leading global K-Beauty trends.",
      ),
      body: text(
        "JMsolution kết hợp công nghệ da liễu hiện đại với các thành phần hoạt tính được chọn lọc trên toàn thế giới.",
        "JMsolution combines advanced dermatological technology with selected active ingredients from around the world.",
      ),
    },
    {
      id: "jmella",
      name: "Jmella",
      category: "Perfume Body & Hair",
      headline: text(
        "Liệu pháp hương thơm nâng niu làn da và mái tóc",
        "Fragrance therapy for skin, hair, and everyday confidence",
      ),
      quote: text(
        "Nghệ thuật ướp hương cơ thể - Chạm vào cảm xúc, nuông chiều bản thân.",
        "The art of body fragrance - emotional, sensorial, and self-loving.",
      ),
      body: text(
        "Jmella kết hợp công nghệ chăm sóc da/tóc với nghệ thuật chế tác hương thơm cao cấp từ Pháp.",
        "Jmella bridges advanced skin and haircare technology with premium French fragrance artistry.",
      ),
    },
  ],
  advisor: {
    kicker: "GIPPY AI ADVISOR",
    title: text("Cố vấn thương hiệu luôn sẵn sàng.", "A brand advisor always ready."),
    body: text(
      "Gippy hỗ trợ đối tác hiểu danh mục, câu chuyện thương hiệu và hướng triển khai phù hợp.",
      "Gippy helps partners understand the portfolio, brand story, and right activation path.",
    ),
    image: emptyImageAsset(),
  },
  imageSlots: [
    {
      id: "campaign",
      label: text("Brand campaign / KV image", "Brand campaign / KV image"),
      image: emptyImageAsset(),
    },
    {
      id: "retail",
      label: text("Retail shelf or partner store image", "Retail shelf or partner store image"),
      image: emptyImageAsset(),
    },
    {
      id: "texture",
      label: text("Product texture / usage cut", "Product texture / usage cut"),
      image: emptyImageAsset(),
    },
  ],
};

const DEFAULT_B2B_SECTIONS: B2BSectionContent = {
  why: {
    kicker: text("Vì sao chọn GPCLUB Vietnam", "Why choose GPCLUB Vietnam"),
    title: text(
      "Đối tác cần nhiều hơn sản phẩm. Họ cần câu chuyện có thể bán được.",
      "Partners need more than products. They need a sellable story.",
    ),
    cards: [
      {
        id: "portfolio",
        num: "01",
        hook: text(
          "Danh mục có lực bán thật: JMsolution + Jmella.",
          "A sales-ready portfolio: JMsolution + Jmella.",
        ),
        title: "Strategic Brand Portfolio",
        copy: text(
          "JMsolution và Jmella giúp đối tác bao phủ skincare, hair care và body care bằng một danh mục dễ truyền thông, dễ bán và dễ mở rộng.",
          "JMsolution and Jmella help partners cover skincare, hair care, and body care with one marketable, sellable, scalable portfolio.",
        ),
      },
      {
        id: "localized",
        num: "02",
        hook: text(
          "Khoa học Hàn Quốc. Cảm xúc Pháp. Phù hợp Việt Nam.",
          "Korean science. French emotion. Fit for Vietnam.",
        ),
        title: "Localized Beauty Solution",
        copy: text(
          "GPVN định vị giải pháp theo khí hậu, làn da, thói quen mua sắm và xu hướng làm đẹp của người Việt.",
          "GPVN positions solutions around Vietnam's climate, skin needs, shopping behavior, and beauty trends.",
        ),
      },
      {
        id: "enablement",
        num: "03",
        hook: text(
          "Bạn bán hàng. GPVN hỗ trợ tăng tốc chuyển đổi.",
          "You sell. GPVN helps accelerate conversion.",
        ),
        title: "Marketing & Sales Enablement",
        copy: text(
          "Đối tác được hỗ trợ nội dung bản địa hóa, đào tạo sản phẩm, tài sản thương hiệu và định hướng campaign.",
          "Partners receive localized content, product training, brand assets, sales messaging, and campaign direction.",
        ),
      },
    ],
  },
  values: {
    kicker: text("Giá trị đối tác", "Partner value"),
    title: text("Bạn nhận được gì khi trở thành đối tác.", "What you receive as a partner."),
    cards: [
      {
        id: "growth",
        num: "01",
        eyebrow: "Market-Ready Growth",
        title: text(
          "Danh mục làm đẹp được thiết kế để chuyển đổi.",
          "A beauty portfolio built to convert.",
        ),
        sub: text(
          "Từ bằng chứng toàn cầu đến nhu cầu địa phương",
          "From global proof to local demand",
        ),
        copy: text(
          "Danh mục có sẵn câu chuyện tăng trưởng và lý do mua rõ ràng.",
          "A portfolio with built-in growth stories and clear reasons to buy.",
        ),
      },
      {
        id: "trust",
        num: "02",
        eyebrow: "Trust & Authenticity",
        title: text(
          "Chính hãng, minh bạch và an toàn cho đối tác.",
          "Official, transparent, and partner-safe.",
        ),
        sub: text("Nền tảng B2B chuyên nghiệp", "Professional B2B foundation"),
        copy: text(
          "GPVN xây dựng niềm tin bằng sự minh bạch và định vị chính hãng.",
          "GPVN builds trust through transparency and official brand positioning.",
        ),
      },
      {
        id: "ai",
        num: "03",
        eyebrow: "AI-Powered Consultation",
        title: text(
          "Cỗ máy giáo dục sản phẩm thông minh hơn.",
          "A smarter product education engine.",
        ),
        sub: text("Cố vấn sản phẩm 24/7", "24/7 partner product advisor"),
        copy: text(
          "Gippy hỗ trợ giải thích sản phẩm, thành phần, công dụng và câu chuyện bán hàng.",
          "Gippy helps explain products, ingredients, benefits, and sales stories faster.",
        ),
      },
      {
        id: "oem",
        num: "04",
        eyebrow: "OEM / ODM Potential",
        title: text(
          "Từ ý tưởng đến kệ hàng với kinh nghiệm GPCLUB.",
          "From concept to shelf with GPCLUB know-how.",
        ),
        sub: text(
          "Cho nhà bán lẻ và đối tác doanh nghiệp",
          "For retailers and enterprise partners",
        ),
        copy: text(
          "GPCLUB có thể đồng hành cùng đối tác phát triển nhãn riêng hoặc dòng độc quyền.",
          "GPCLUB can support partners developing private labels or exclusive product lines.",
        ),
      },
    ],
  },
  brands: {
    kicker: text("Thương hiệu đối tác có thể bán", "Brands partners can sell"),
    title: text(
      "Danh mục được thiết kế cho nhu cầu người tiêu dùng và câu chuyện bán lẻ.",
      "A portfolio designed for consumer needs and retail storytelling.",
    ),
    items: [
      {
        id: "jmsolution",
        name: "JMsolution",
        copy: text(
          "Giải pháp chăm sóc da chuyên sâu với nền tảng JOR R&D.",
          "Advanced skincare powered by JOR R&D and global proof.",
        ),
      },
      {
        id: "jmella",
        name: "Jmella",
        copy: text(
          "Chăm sóc tóc và cơ thể kết hợp nghệ thuật hương thơm Pháp.",
          "Hair and body care blended with French fragrance artistry.",
        ),
      },
    ],
  },
  process: {
    kicker: text("Quy trình ra mắt", "Launch process"),
    title: text(
      "Từ liên hệ đầu tiên đến hỗ trợ bán hàng thực tế.",
      "From first contact to real sell-through support.",
    ),
    description: text(
      "Chúng tôi cùng đối tác xác định kênh, danh mục, thông điệp và kế hoạch triển khai phù hợp.",
      "We define channel, portfolio, messaging, and activation plans with each partner.",
    ),
    steps: [
      text("Đánh giá mức độ phù hợp kinh doanh", "Business fit review"),
      text("Đề xuất danh mục và kênh bán", "Portfolio & channel proposal"),
      text("Đào tạo, tài sản thương hiệu và kế hoạch ra mắt", "Training, assets & launch plan"),
      text("Triển khai chiến dịch và hỗ trợ bán hàng", "Campaign execution & sell-through support"),
    ],
  },
  imageSpaces: {
    kicker: text("Không gian hình ảnh", "Image spaces"),
    title: text(
      "Không gian hình ảnh giúp tăng sức thuyết phục B2B.",
      "Image spaces that make B2B selling more persuasive.",
    ),
    description: text(
      "Các khung ảnh cân bằng cho hình ảnh kệ bán hàng, chiến dịch và đào tạo sản phẩm.",
      "Balanced image frames for retail, campaign, and product training visuals.",
    ),
    slots: [
      text("Hình ảnh cửa hàng / kệ đối tác", "Partner store / shelf image"),
      text("Visual chiến dịch / nội dung KOL", "Campaign visual / KOL content"),
      text("Đào tạo hoặc demo sản phẩm", "Training or product demo image"),
    ],
  },
  contact: {
    kicker: text("Liên hệ hợp tác", "Partnership contact"),
    title: text(
      "Bắt đầu trao đổi với GPCLUB Vietnam.",
      "Start the conversation with GPCLUB Vietnam.",
    ),
    description: text(
      "Chia sẻ nhu cầu để đội ngũ tư vấn đề xuất hướng hợp tác phù hợp.",
      "Share your needs so our team can suggest the right partnership path.",
    ),
  },
};

const DEFAULT_GIPPY_AI_SECTIONS: GippyAiSectionContent = {
  guide: {
    kicker: "Gippy Quick Guide",
    title: text("Chọn chủ đề tư vấn", "Choose your consultation topic"),
    description: text(
      "Chọn chủ đề để Gippy mở cuộc trò chuyện đúng mục đích, hoặc đi thẳng đến sản phẩm và biểu mẫu B2B.",
      "Choose a topic to open the right Gippy conversation, or go directly to products and the B2B inquiry flow.",
    ),
    askLabel: text("Hỏi Gippy", "Ask Gippy"),
  },
  suggestions: [
    {
      id: "lineup",
      icon: "sparkle",
      title: text("Danh mục bán lẻ", "Reseller Lineup"),
      sub: text("Gợi ý danh mục theo kênh bán", "Lineup guidance by sales channel"),
      prompt: text(
        "Hãy gợi ý danh mục sản phẩm GPCLUB phù hợp cho kênh bán của tôi.",
        "Please recommend a GPCLUB product lineup for my sales channel.",
      ),
    },
    {
      id: "sales-story",
      icon: "package",
      title: text("Câu chuyện bán hàng", "Sales Story"),
      sub: text(
        "Thông điệp bán hàng và điểm mạnh sản phẩm",
        "Sales messages and product strengths",
      ),
      prompt: text(
        "Hãy giúp tôi tạo câu chuyện bán hàng cho JMsolution, Jmella hoặc Trois Touch.",
        "Help me build a sales story for JMsolution, Jmella or Trois Touch.",
      ),
    },
    {
      id: "b2b",
      icon: "briefcase",
      title: text("Hợp tác B2B", "B2B Partnership"),
      sub: text(
        "Kết nối đại lý, phân phối và bán sỉ",
        "Dealer, distribution and wholesale inquiry connection",
      ),
      prompt: text(
        "Tôi muốn hỏi về hợp tác B2B, đại lý hoặc phân phối với GPCLUB.",
        "I want to ask about GPCLUB B2B, dealer or distribution partnership.",
      ),
    },
    {
      id: "support",
      icon: "message",
      title: text("Hỗ trợ đối tác", "Partner Support"),
      sub: text(
        "Báo giá, tài liệu sản phẩm và hỗ trợ hợp tác",
        "Quote, product material and partnership support routing",
      ),
      prompt: text(
        "Tôi cần báo giá, tài liệu sản phẩm hoặc thông tin hỗ trợ đối tác.",
        "I need pricing, product materials or partner support information.",
      ),
    },
  ],
  quickActions: [
    {
      id: "gippy",
      icon: "message",
      label: text("Mở Gippy AI", "Open Gippy AI"),
      body: text(
        "Bắt đầu hỏi về sản phẩm, cách bán hoặc hợp tác.",
        "Ask about products, selling angles, or partnership flow.",
      ),
      prompt: text(
        "Tôi muốn hỏi Gippy về sản phẩm, cách bán hoặc hướng hợp tác với GPCLUB.",
        "I want to ask Gippy about GPCLUB products, selling angles, or partnership options.",
      ),
      kind: "gippy",
    },
    {
      id: "products",
      icon: "search",
      label: text("Xem sản phẩm", "Browse products"),
      body: text("Mở danh mục sản phẩm hiện tại.", "Open the current GPCLUB product catalog."),
      prompt: text("", ""),
      kind: "products",
    },
    {
      id: "b2b",
      icon: "briefcase",
      label: text("Yêu cầu B2B", "B2B inquiry"),
      body: text(
        "Gửi yêu cầu hợp tác khi đã sẵn sàng trao đổi.",
        "Send a partnership inquiry when you are ready to talk to the team.",
      ),
      prompt: text("", ""),
      kind: "b2b",
    },
  ],
  statChips: [
    {
      id: "product",
      top: "Product",
      bottom: text("Gợi ý sản phẩm", "Partner catalog"),
    },
    {
      id: "sales",
      top: "Sales",
      bottom: text("Câu chuyện bán hàng", "Sales story"),
    },
    { id: "b2b", top: "B2B", bottom: text("Yêu cầu đối tác", "B2B inquiry") },
  ],
};

export const PAGE_CONTENT_OPTIONS: {
  key: "home" | PageContentKey;
  label: string;
}[] = [
  { key: "home", label: "HOME" },
  { key: "brand", label: "BRAND" },
  { key: "products", label: "Products" },
  { key: "gippy-ai", label: "GIPPY AI" },
  { key: "events", label: "EVENT" },
  { key: "b2b", label: "B2B" },
  { key: "contact", label: "CONTACT" },
];

export const DEFAULT_PAGE_CONTENT: Record<PageContentKey, PageEditableContent> = {
  brand: {
    kicker: text("GPCLUB VIETNAM", "GPCLUB VIETNAM"),
    title: text("Kiến tạo vẻ đẹp vượt trội từ", "Building partner growth through"),
    highlight: text("sự cải tiến không ngừng.", "proven K-Beauty brands."),
    description: text(
      "GPCLUB là doanh nghiệp mỹ phẩm toàn cầu mang trọn giá trị lành mạnh cho vẻ đẹp. Từ nền tảng phân phối năm 2003 đến thương hiệu chiến lược JMsolution năm 2016, GPCLUB đã phát triển thành hệ sinh thái làm đẹp toàn diện: skincare, makeup, hair & body và fragrance.",
      "GPCLUB is a global beauty company with a proven K-Beauty portfolio. GPCLUB Vietnam connects that brand power with resellers, retail chains, distributors, and OEM/ODM partners ready to grow in Vietnam.",
    ),
    primaryCta: text("Trở thành đối tác", "Become a Partner"),
    secondaryCta: text("Xem sản phẩm", "View Products"),
    heroImage: emptyHeroImage(),
    sections: { brand: DEFAULT_BRAND_SECTIONS },
  },
  products: {
    kicker: text("SẢN PHẨM", "Products"),
    title: text("Sản phẩm,", "Products,"),
    highlight: text("sẵn sàng bán.", "ready to sell."),
    description: text(
      "JMsolution, Jmella và Trois Touch - được tuyển chọn cho kênh đối tác tại Việt Nam. Để nhận bảng giá bán sỉ,",
      "JMsolution, Jmella, and Trois Touch - curated for Vietnam partner channels. For wholesale pricing,",
    ),
    primaryCta: text("gửi yêu cầu B2B", "start a B2B inquiry"),
    secondaryCta: text("Brochure", "Brochure"),
    heroImage: emptyHeroImage(),
    sections: {},
  },
  "gippy-ai": {
    kicker: text("GIPPY PARTNER AI", "GIPPY PARTNER AI"),
    title: text("Tư vấn đối tác K-Beauty", "K-Beauty partner sourcing, made"),
    highlight: text("dễ triển khai.", "business-ready."),
    description: text(
      "Danh mục sản phẩm, câu chuyện bán hàng và yêu cầu B2B — Gippy giúp đối tác chọn đúng hướng trao đổi.",
      "Product lineup, sales story and B2B inquiry — choose the right partner topic with Gippy.",
    ),
    primaryCta: text("Liên hệ GPCLUB", "Contact GPCLUB"),
    secondaryCta: text("Xem chủ đề", "View topics"),
    heroImage: emptyHeroImage(),
    sections: { gippyAi: DEFAULT_GIPPY_AI_SECTIONS },
  },
  events: {
    kicker: text("GPCLUB EVENT", "GPCLUB EVENT"),
    title: text("Tin tức, sự kiện và", "Events, campaigns and"),
    highlight: text("khoảnh khắc thương hiệu.", "brand moments."),
    description: text(
      "Theo dõi các chương trình ra mắt, hình ảnh sự kiện, video chiến dịch và hoạt động đối tác của GPCLUB Vietnam.",
      "Explore launch programs, event galleries, campaign videos and partner activities from GPCLUB Vietnam.",
    ),
    primaryCta: text("", ""),
    secondaryCta: text("", ""),
    heroImage: emptyHeroImage(),
    sections: {},
  },
  b2b: {
    kicker: text("B2B PARTNERSHIP", "B2B PARTNERSHIP"),
    title: text("Đưa K-Beauty có sức bán thật vào", "Bring proven K-Beauty into"),
    highlight: text("kênh tăng trưởng của bạn.", "your growth channel."),
    description: text(
      "Trở thành đối tác của GPCLUB Vietnam để khai thác danh mục JMsolution và Jmella — hai thương hiệu kết hợp khoa học chăm sóc da Hàn Quốc, hương thơm Pháp và chiến lược bản địa hóa cho thị trường Việt Nam.",
      "Become a GPCLUB Vietnam partner and unlock JMsolution and Jmella — brands combining Korean skincare science, French fragrance, and localization for Vietnam.",
    ),
    primaryCta: text("Gửi yêu cầu hợp tác", "Start partnership inquiry"),
    secondaryCta: text("", ""),
    heroImage: emptyHeroImage(),
    sections: { b2b: DEFAULT_B2B_SECTIONS },
  },
  contact: {
    kicker: text("CONTACT US", "CONTACT US"),
    title: text("Cùng xây dựng", "Let's build Vietnam's"),
    highlight: text(
      "câu chuyện thành công làm đẹp tiếp theo tại Việt Nam.",
      "next beauty success story.",
    ),
    description: text(
      "Nhà phân phối, nhà bán lẻ và đối tác OEM/ODM — hãy chia sẻ nhu cầu của bạn. Tư vấn viên chuyên trách sẽ phản hồi trong 24 giờ với đề xuất phù hợp.",
      "Distributors, retailers, and OEM/ODM partners — tell us about your business. A dedicated consultant will reply within 24 hours with a tailored proposal.",
    ),
    primaryCta: text("", ""),
    secondaryCta: text("", ""),
    heroImage: emptyHeroImage(),
    sections: {},
  },
};

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function mergeLocalized(base: PageLocalizedText, extra: unknown): PageLocalizedText {
  const src = isObj(extra) ? extra : {};
  return {
    vi: typeof src.vi === "string" ? src.vi : base.vi,
    en: typeof src.en === "string" ? src.en : base.en,
  };
}

function mergeHeroImage(base: PageHeroImage, extra: unknown): PageHeroImage {
  const src = isObj(extra) ? extra : {};
  return {
    url: typeof src.url === "string" ? src.url : base.url,
    alt: mergeLocalized(base.alt, src.alt),
  };
}

function mergeImageAsset(base: PageImageAsset, extra: unknown): PageImageAsset {
  const src = isObj(extra) ? extra : {};
  return {
    url: typeof src.url === "string" ? src.url : base.url,
    alt: mergeLocalized(base.alt, src.alt),
  };
}

function mergeLocalizedList(base: PageLocalizedText[], extra: unknown): PageLocalizedText[] {
  const src = Array.isArray(extra) ? extra : [];
  return base.map((item, index) => mergeLocalized(item, src[index]));
}

function mergeBrandSections(base: BrandSectionContent, extra: unknown): BrandSectionContent {
  const src = isObj(extra) ? extra : {};
  const positioning = isObj(src.positioning) ? src.positioning : {};
  const advisor = isObj(src.advisor) ? src.advisor : {};
  const coreValues = Array.isArray(src.coreValues) ? src.coreValues : [];
  const brands = Array.isArray(src.brands) ? src.brands : [];
  const imageSlots = Array.isArray(src.imageSlots) ? src.imageSlots : [];

  return {
    positioning: {
      kicker: typeof positioning.kicker === "string" ? positioning.kicker : base.positioning.kicker,
      title: mergeLocalized(base.positioning.title, positioning.title),
      highlight: mergeLocalized(base.positioning.highlight, positioning.highlight),
      body: mergeLocalizedList(base.positioning.body, positioning.body),
    },
    coreValues: base.coreValues.map((item, index) => {
      const next = isObj(coreValues[index]) ? coreValues[index] : {};
      return {
        ...item,
        label: typeof next.label === "string" ? next.label : item.label,
        text: mergeLocalized(item.text, next.text),
      };
    }),
    brands: base.brands.map((item, index) => {
      const next = isObj(brands[index]) ? brands[index] : {};
      return {
        ...item,
        name: typeof next.name === "string" ? next.name : item.name,
        category: typeof next.category === "string" ? next.category : item.category,
        headline: mergeLocalized(item.headline, next.headline),
        quote: mergeLocalized(item.quote, next.quote),
        body: mergeLocalized(item.body, next.body),
      };
    }),
    advisor: {
      kicker: typeof advisor.kicker === "string" ? advisor.kicker : base.advisor.kicker,
      title: mergeLocalized(base.advisor.title, advisor.title),
      body: mergeLocalized(base.advisor.body, advisor.body),
      image: mergeImageAsset(base.advisor.image, advisor.image),
    },
    imageSlots: base.imageSlots.map((item, index) => {
      const next = isObj(imageSlots[index]) ? imageSlots[index] : {};
      return {
        ...item,
        label: mergeLocalized(item.label, next.label),
        image: mergeImageAsset(item.image, next.image),
      };
    }),
  };
}

function mergeB2BSections(base: B2BSectionContent, extra: unknown): B2BSectionContent {
  const src = isObj(extra) ? extra : {};
  const why = isObj(src.why) ? src.why : {};
  const values = isObj(src.values) ? src.values : {};
  const brands = isObj(src.brands) ? src.brands : {};
  const process = isObj(src.process) ? src.process : {};
  const imageSpaces = isObj(src.imageSpaces) ? src.imageSpaces : {};
  const contact = isObj(src.contact) ? src.contact : {};
  const whyCards = Array.isArray(why.cards) ? why.cards : [];
  const valueCards = Array.isArray(values.cards) ? values.cards : [];
  const brandItems = Array.isArray(brands.items) ? brands.items : [];

  return {
    why: {
      kicker: mergeLocalized(base.why.kicker, why.kicker),
      title: mergeLocalized(base.why.title, why.title),
      cards: base.why.cards.map((item, index) => {
        const next = isObj(whyCards[index]) ? whyCards[index] : {};
        return {
          ...item,
          num: typeof next.num === "string" ? next.num : item.num,
          hook: mergeLocalized(item.hook, next.hook),
          title: typeof next.title === "string" ? next.title : item.title,
          copy: mergeLocalized(item.copy, next.copy),
        };
      }),
    },
    values: {
      kicker: mergeLocalized(base.values.kicker, values.kicker),
      title: mergeLocalized(base.values.title, values.title),
      cards: base.values.cards.map((item, index) => {
        const next = isObj(valueCards[index]) ? valueCards[index] : {};
        return {
          ...item,
          num: typeof next.num === "string" ? next.num : item.num,
          eyebrow: typeof next.eyebrow === "string" ? next.eyebrow : item.eyebrow,
          title: mergeLocalized(item.title, next.title),
          sub: mergeLocalized(item.sub, next.sub),
          copy: mergeLocalized(item.copy, next.copy),
        };
      }),
    },
    brands: {
      kicker: mergeLocalized(base.brands.kicker, brands.kicker),
      title: mergeLocalized(base.brands.title, brands.title),
      items: base.brands.items.map((item, index) => {
        const next = isObj(brandItems[index]) ? brandItems[index] : {};
        return {
          ...item,
          name: typeof next.name === "string" ? next.name : item.name,
          copy: mergeLocalized(item.copy, next.copy),
        };
      }),
    },
    process: {
      kicker: mergeLocalized(base.process.kicker, process.kicker),
      title: mergeLocalized(base.process.title, process.title),
      description: mergeLocalized(base.process.description, process.description),
      steps: mergeLocalizedList(base.process.steps, process.steps),
    },
    imageSpaces: {
      kicker: mergeLocalized(base.imageSpaces.kicker, imageSpaces.kicker),
      title: mergeLocalized(base.imageSpaces.title, imageSpaces.title),
      description: mergeLocalized(base.imageSpaces.description, imageSpaces.description),
      slots: mergeLocalizedList(base.imageSpaces.slots, imageSpaces.slots),
    },
    contact: {
      kicker: mergeLocalized(base.contact.kicker, contact.kicker),
      title: mergeLocalized(base.contact.title, contact.title),
      description: mergeLocalized(base.contact.description, contact.description),
    },
  };
}

function mergeGippyAiSections(base: GippyAiSectionContent, extra: unknown): GippyAiSectionContent {
  const src = isObj(extra) ? extra : {};
  const guide = isObj(src.guide) ? src.guide : {};
  const suggestions = Array.isArray(src.suggestions) ? src.suggestions : [];
  const quickActions = Array.isArray(src.quickActions) ? src.quickActions : [];
  const statChips = Array.isArray(src.statChips) ? src.statChips : [];

  return {
    guide: {
      kicker: typeof guide.kicker === "string" ? guide.kicker : base.guide.kicker,
      title: mergeLocalized(base.guide.title, guide.title),
      description: mergeLocalized(base.guide.description, guide.description),
      askLabel: mergeLocalized(base.guide.askLabel, guide.askLabel),
    },
    suggestions: base.suggestions.map((item, index) => {
      const next = isObj(suggestions[index]) ? suggestions[index] : {};
      return {
        ...item,
        title: mergeLocalized(item.title, next.title),
        sub: mergeLocalized(item.sub, next.sub),
        prompt: mergeLocalized(item.prompt, next.prompt),
      };
    }),
    quickActions: base.quickActions.map((item, index) => {
      const next = isObj(quickActions[index]) ? quickActions[index] : {};
      return {
        ...item,
        label: mergeLocalized(item.label, next.label),
        body: mergeLocalized(item.body, next.body),
        prompt: mergeLocalized(item.prompt, next.prompt),
      };
    }),
    statChips: base.statChips.map((item, index) => {
      const next = isObj(statChips[index]) ? statChips[index] : {};
      return {
        ...item,
        top: typeof next.top === "string" ? next.top : item.top,
        bottom: mergeLocalized(item.bottom, next.bottom),
      };
    }),
  };
}

function mergePageSections(base: PageSections, extra: unknown): PageSections {
  const src = isObj(extra) ? extra : {};
  const sections: Record<string, unknown> = { ...src };

  if (base.brand) {
    sections.brand = mergeBrandSections(base.brand, src.brand);
  }
  if (base.b2b) {
    sections.b2b = mergeB2BSections(base.b2b, src.b2b);
  }
  if (base.gippyAi) {
    sections.gippyAi = mergeGippyAiSections(base.gippyAi, src.gippyAi);
  }

  return sections as PageSections;
}

export function mergePageContent(key: PageContentKey, value: unknown): PageEditableContent {
  const base = DEFAULT_PAGE_CONTENT[key];
  const src = isObj(value) ? value : {};
  return {
    kicker: mergeLocalized(base.kicker, src.kicker),
    title: mergeLocalized(base.title, src.title),
    highlight: mergeLocalized(base.highlight, src.highlight),
    description: mergeLocalized(base.description, src.description),
    primaryCta: mergeLocalized(base.primaryCta, src.primaryCta),
    secondaryCta: mergeLocalized(base.secondaryCta, src.secondaryCta),
    heroImage: mergeHeroImage(base.heroImage, src.heroImage),
    sections: mergePageSections(base.sections, src.sections),
  };
}

export const pageContentStorageKey = (key: PageContentKey) => `page:${key}`;

const pageContentCacheKey = (key: PageContentKey) => `page-content:${key}`;

async function fetchPageContent(key: PageContentKey) {
  return fetchCachedPublicData(pageContentCacheKey(key), async () => {
    const { data } = await withPublicDataTimeout(
      supabase
        .from("home_content")
        .select("value")
        .eq("key", pageContentStorageKey(key))
        .maybeSingle(),
      `page content ${key}`,
    );
    return mergePageContent(key, data?.value);
  });
}

export function usePageContent(key: PageContentKey) {
  const cachedContent = readPublicDataCache<PageEditableContent>(pageContentCacheKey(key));
  const [content, setContent] = useState<PageEditableContent>(
    () => cachedContent ?? DEFAULT_PAGE_CONTENT[key],
  );
  const [loading, setLoading] = useState(!cachedContent);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setContent(
      readPublicDataCache<PageEditableContent>(pageContentCacheKey(key)) ??
        DEFAULT_PAGE_CONTENT[key],
    );
    (async () => {
      try {
        const nextContent = await fetchPageContent(key);
        if (!cancelled) setContent(nextContent);
      } catch {
        if (!cancelled) setContent(DEFAULT_PAGE_CONTENT[key]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { content, loading };
}
