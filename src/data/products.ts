import jmellaImage from "@/assets/brand-jmella.jpg";
import jmsolutionImage from "@/assets/brand-jmsolution.jpg";
import heroImage from "@/assets/hero-kbeauty.jpg";

export type SkinType = "Dry" | "Oily" | "Combination" | "Sensitive" | "All";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  tagline: string;
  image: string;
  concerns: string[];
  skinTypes: SkinType[];
};

export const products: Product[] = [
  {
    id: "jmsolution-water-luminous-mask",
    name: "Water Luminous Mask",
    brand: "JMsolution",
    category: "Sheet Mask",
    tagline: "Hydrating care for dull and dry-looking skin.",
    image: jmsolutionImage,
    concerns: ["Hydration", "Brightening"],
    skinTypes: ["Dry", "Combination", "Sensitive"],
  },
  {
    id: "jmsolution-collagen-care",
    name: "Collagen Firming Care",
    brand: "JMsolution",
    category: "Skin Care",
    tagline: "Firming routine support for anti-aging partner channels.",
    image: jmsolutionImage,
    concerns: ["Anti-aging", "Hydration"],
    skinTypes: ["Dry", "Combination", "All"],
  },
  {
    id: "jmella-perfume-body-care",
    name: "Perfume Body Care Collection",
    brand: "Jmella",
    category: "Body Care",
    tagline: "French-inspired daily fragrance care for body routines.",
    image: jmellaImage,
    concerns: ["Fragrance", "Body care", "Hydration"],
    skinTypes: ["All"],
  },
  {
    id: "jmella-hair-fragrance-care",
    name: "Hair Fragrance Care",
    brand: "Jmella",
    category: "Hair Care",
    tagline: "Scented hair care for daily retail and reseller demand.",
    image: jmellaImage,
    concerns: ["Fragrance", "Body care"],
    skinTypes: ["All"],
  },
  {
    id: "gpclub-b2b-curation",
    name: "GPCLUB B2B Partner Curation",
    brand: "GPCLUB",
    category: "B2B Set",
    tagline: "A balanced K-beauty starter lineup for wholesale partners.",
    image: heroImage,
    concerns: ["Hydration", "Brightening", "Pores", "Body care"],
    skinTypes: ["All"],
  },
];
