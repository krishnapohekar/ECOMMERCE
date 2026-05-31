/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header, Footer } from "@/components/site/Chrome";
import { formatDateIST, formatDateTimeIST, formatPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import {
  listMyOrders,
  listProducts,
  listCategories,
  adminUpdateOrderStatus,
  adminUpdateProduct,
  adminRemoveProduct,
  adminAddProduct,
} from "@/lib/shop.functions";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  FileText,
  DollarSign,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

type ActiveTab = "overview" | "orders" | "inventory";
type InventorySortKey = "category" | "name" | "price" | "stock";
type SortDirection = "asc" | "desc";

const statusLabels: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

type CategoryNode = {
  name: string;
  children?: CategoryNode[];
};

const extractedCategoryTree: CategoryNode[] = [
  {
    name: "Women Fashion",
    children: [
      {
        name: "Ethnic Wear",
        children: [
          {
            name: "Sarees",
            children: [
              { name: "Silk Sarees" },
              { name: "Cotton Sarees" },
              { name: "Chiffon Sarees" },
              { name: "Georgette Sarees" },
            ],
          },
          {
            name: "Kurtis",
            children: [
              { name: "Anarkali Kurtis" },
              { name: "Straight Kurtis" },
              { name: "A-Line Kurtis" },
              { name: "Printed Kurtis" },
            ],
          },
          {
            name: "Kurta Sets",
            children: [
              { name: "Kurta Palazzo Sets" },
              { name: "Kurta Pant Sets" },
              { name: "Kurta Dupatta Sets" },
            ],
          },
          {
            name: "Lehengas",
            children: [
              { name: "Bridal Lehengas" },
              { name: "Party Wear Lehengas" },
              { name: "Lehenga Cholis" },
            ],
          },
        ],
      },
      {
        name: "Western Wear",
        children: [
          {
            name: "Tops",
            children: [
              { name: "Casual Tops" },
              { name: "Crop Tops" },
              { name: "Shirts" },
              { name: "Tunics" },
            ],
          },
          {
            name: "Dresses",
            children: [
              { name: "Maxi Dresses" },
              { name: "Midi Dresses" },
              { name: "Bodycon Dresses" },
              { name: "Gowns" },
            ],
          },
          {
            name: "Bottomwear",
            children: [
              { name: "Jeans" },
              { name: "Trousers" },
              { name: "Skirts" },
              { name: "Shorts" },
            ],
          },
        ],
      },
      {
        name: "Jewellery & Accessories",
        children: [
          {
            name: "Jewellery",
            children: [
              { name: "Earrings" },
              { name: "Necklaces" },
              { name: "Bangles" },
              { name: "Rings" },
            ],
          },
          {
            name: "Bags",
            children: [
              { name: "Handbags" },
              { name: "Sling Bags" },
              { name: "Wallets" },
              { name: "Clutches" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Men Fashion",
    children: [
      {
        name: "Mens Clothing",
        children: [
          {
            name: "Top Wear",
            children: [
              { name: "T-Shirts" },
              { name: "Casual Shirts" },
              { name: "Formal Shirts" },
              { name: "Kurtas" },
            ],
          },
          {
            name: "Bottom Wear",
            children: [
              { name: "Jeans" },
              { name: "Trousers" },
              { name: "Shorts" },
              { name: "Track Pants" },
            ],
          },
          {
            name: "Inner & Sleep Wear",
            children: [
              { name: "Vests" },
              { name: "Boxers" },
              { name: "Briefs" },
              { name: "Night Suits" },
            ],
          },
        ],
      },
      {
        name: "Top Wear",
        children: [
          {
            name: "Shirts",
            children: [
              { name: "Casual Shirts" },
              { name: "Formal Shirts" },
              { name: "Printed Shirts" },
            ],
          },
          {
            name: "T-Shirts",
            children: [
              { name: "Round Neck T-Shirts" },
              { name: "Polo T-Shirts" },
              { name: "Graphic T-Shirts" },
            ],
          },
          {
            name: "Kurtas",
            children: [
              { name: "Cotton Kurtas" },
              { name: "Festive Kurtas" },
              { name: "Kurta Sets" },
            ],
          },
        ],
      },
      {
        name: "Bottom Wear",
        children: [
          {
            name: "Jeans",
            children: [
              { name: "Slim Fit Jeans" },
              { name: "Regular Fit Jeans" },
              { name: "Denim Joggers" },
            ],
          },
          {
            name: "Trousers",
            children: [
              { name: "Formal Trousers" },
              { name: "Casual Trousers" },
              { name: "Chinos" },
            ],
          },
          {
            name: "Shorts",
            children: [
              { name: "Cotton Shorts" },
              { name: "Denim Shorts" },
              { name: "Sports Shorts" },
            ],
          },
        ],
      },
      {
        name: "Footwear",
        children: [
          {
            name: "Flipflops & Slippers",
            children: [{ name: "Sliders" }, { name: "Clogs" }],
          },
          {
            name: "Shoes",
            children: [
              { name: "Casual Shoes" },
              { name: "Formal Shoes" },
              { name: "Sports Shoes" },
            ],
          },
          {
            name: "Sandals & Floaters",
            children: [{ name: "Sandals" }, { name: "Floaters" }, { name: "Flip Flops" }],
          },
          {
            name: "Ethnic Footwear",
            children: [{ name: "Mojaris" }, { name: "Kolhapuris" }, { name: "Juttis" }],
          },
          {
            name: "Shoe Accessories",
            children: [{ name: "Socks" }, { name: "Insoles" }, { name: "Shoe Care" }],
          },
        ],
      },
      {
        name: "Accessories",
        children: [
          { name: "Wallets", children: [{ name: "Leather Wallets" }, { name: "Card Holders" }] },
          { name: "Belts", children: [{ name: "Formal Belts" }, { name: "Casual Belts" }] },
          { name: "Watches", children: [{ name: "Analog Watches" }, { name: "Smart Watches" }] },
        ],
      },
    ],
  },
  {
    name: "Home & Living",
    children: [
      {
        name: "Home Furnishing",
        children: [
          {
            name: "Bedsheets",
            children: [
              { name: "Double Bedsheets" },
              { name: "Single Bedsheets" },
              { name: "Fitted Bedsheets" },
            ],
          },
          {
            name: "Curtains",
            children: [
              { name: "Door Curtains" },
              { name: "Window Curtains" },
              { name: "Sheer Curtains" },
            ],
          },
          {
            name: "Cushions & Covers",
            children: [
              { name: "Cushion Covers" },
              { name: "Pillow Covers" },
              { name: "Diwan Sets" },
            ],
          },
        ],
      },
      {
        name: "Kitchen & Dining",
        children: [
          {
            name: "Cookware",
            children: [{ name: "Pans" }, { name: "Kadhai" }, { name: "Pressure Cookers" }],
          },
          {
            name: "Dinnerware",
            children: [
              { name: "Dinner Sets" },
              { name: "Plates" },
              { name: "Bowls" },
              { name: "Mugs" },
            ],
          },
          {
            name: "Storage",
            children: [{ name: "Containers" }, { name: "Jars" }, { name: "Lunch Boxes" }],
          },
        ],
      },
      {
        name: "Decor",
        children: [
          {
            name: "Wall Decor",
            children: [{ name: "Wall Stickers" }, { name: "Paintings" }, { name: "Clocks" }],
          },
          {
            name: "Lighting",
            children: [{ name: "Lamps" }, { name: "String Lights" }, { name: "Lanterns" }],
          },
          {
            name: "Plants & Planters",
            children: [{ name: "Artificial Plants" }, { name: "Planters" }, { name: "Vases" }],
          },
        ],
      },
    ],
  },
  {
    name: "Kids & Toys",
    children: [
      {
        name: "Kids Clothing",
        children: [
          {
            name: "Boys Clothing",
            children: [
              { name: "T-Shirts" },
              { name: "Shirts" },
              { name: "Jeans" },
              { name: "Ethnic Sets" },
            ],
          },
          {
            name: "Girls Clothing",
            children: [
              { name: "Frocks" },
              { name: "Tops" },
              { name: "Lehenga Cholis" },
              { name: "Leggings" },
            ],
          },
          {
            name: "Baby Clothing",
            children: [{ name: "Rompers" }, { name: "Bodysuits" }, { name: "Sweaters" }],
          },
        ],
      },
      {
        name: "Toys",
        children: [
          {
            name: "Learning Toys",
            children: [{ name: "Puzzles" }, { name: "Flash Cards" }, { name: "Activity Kits" }],
          },
          {
            name: "Soft Toys",
            children: [
              { name: "Teddy Bears" },
              { name: "Plush Animals" },
              { name: "Character Toys" },
            ],
          },
          {
            name: "Outdoor Toys",
            children: [{ name: "Ride Ons" }, { name: "Sports Toys" }, { name: "Water Toys" }],
          },
        ],
      },
      {
        name: "Baby Care",
        children: [
          {
            name: "Feeding",
            children: [{ name: "Bottles" }, { name: "Sippers" }, { name: "Bibs" }],
          },
          {
            name: "Diapering",
            children: [{ name: "Diapers" }, { name: "Wipes" }, { name: "Changing Mats" }],
          },
        ],
      },
    ],
  },
  {
    name: "Personal Care & Wellness",
    children: [
      {
        name: "Beauty & Grooming",
        children: [
          {
            name: "Skin Care",
            children: [
              { name: "Face Wash" },
              { name: "Moisturizers" },
              { name: "Sunscreen" },
              { name: "Serums" },
            ],
          },
          {
            name: "Hair Care",
            children: [
              { name: "Shampoo" },
              { name: "Conditioner" },
              { name: "Hair Oil" },
              { name: "Hair Color" },
            ],
          },
          {
            name: "Makeup",
            children: [
              { name: "Lipstick" },
              { name: "Foundation" },
              { name: "Kajal" },
              { name: "Nail Polish" },
            ],
          },
        ],
      },
      {
        name: "Wellness",
        children: [
          {
            name: "Health Supplements",
            children: [
              { name: "Vitamins" },
              { name: "Protein" },
              { name: "Ayurvedic Supplements" },
            ],
          },
          {
            name: "Personal Hygiene",
            children: [{ name: "Sanitary Pads" }, { name: "Hand Wash" }, { name: "Body Wash" }],
          },
          {
            name: "Fitness",
            children: [{ name: "Yoga Mats" }, { name: "Resistance Bands" }, { name: "Massagers" }],
          },
        ],
      },
    ],
  },
  {
    name: "Mobiles & Tablets",
    children: [
      {
        name: "Mobiles",
        children: [
          {
            name: "Smartphones",
            children: [
              { name: "Android Phones" },
              { name: "Feature Phones" },
              { name: "Refurbished Phones" },
            ],
          },
          {
            name: "Mobile Accessories",
            children: [
              { name: "Cases & Covers" },
              { name: "Screen Guards" },
              { name: "Chargers" },
              { name: "Data Cables" },
            ],
          },
        ],
      },
      {
        name: "Tablets",
        children: [
          {
            name: "Tablets",
            children: [
              { name: "Android Tablets" },
              { name: "Kids Tablets" },
              { name: "Tablet Accessories" },
            ],
          },
          {
            name: "Power & Audio",
            children: [
              { name: "Power Banks" },
              { name: "Earphones" },
              { name: "Bluetooth Speakers" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Consumer Electronics",
    children: [
      {
        name: "Appliances",
        children: [
          {
            name: "Kitchen Appliances",
            children: [
              { name: "Mixer Grinders" },
              { name: "Electric Kettles" },
              { name: "Induction Cooktops" },
            ],
          },
          {
            name: "Home Appliances",
            children: [{ name: "Irons" }, { name: "Fans" }, { name: "Vacuum Cleaners" }],
          },
          {
            name: "Personal Appliances",
            children: [{ name: "Trimmers" }, { name: "Hair Dryers" }, { name: "Straighteners" }],
          },
        ],
      },
      {
        name: "Electronics Accessories",
        children: [
          {
            name: "Audio",
            children: [{ name: "Headphones" }, { name: "Neckbands" }, { name: "Speakers" }],
          },
          {
            name: "Computer Accessories",
            children: [{ name: "Keyboards" }, { name: "Mouse" }, { name: "USB Hubs" }],
          },
          {
            name: "Cameras & Security",
            children: [
              { name: "CCTV Cameras" },
              { name: "Action Cameras" },
              { name: "Smart Doorbells" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Office Supplies & Stationery",
    children: [
      {
        name: "Paper Products",
        children: [
          {
            name: "Notebooks",
            children: [{ name: "A5 Notebooks" }, { name: "Registers" }, { name: "Diaries" }],
          },
          {
            name: "Files & Folders",
            children: [{ name: "Document Files" }, { name: "Folders" }, { name: "Clipboards" }],
          },
        ],
      },
      {
        name: "Writing Instruments",
        children: [
          {
            name: "Pens",
            children: [{ name: "Ball Pens" }, { name: "Gel Pens" }, { name: "Metal Pens" }],
          },
          {
            name: "Pencils",
            children: [
              { name: "Wooden Pencils" },
              { name: "Mechanical Pencils" },
              { name: "Color Pencils" },
            ],
          },
        ],
      },
    ],
  },
];

const emptyNewProduct = {
  name: "",
  slug: "",
  short_description: "",
  description: "",
  sku: "",
  price: 0,
  compare_at_price: 0,
  discount_percent: 0,
  shipping_cost: 0,
  stock: 0,
  category_id: "",
  brand: "Sheetal",
  is_featured: false,
  image_url: "",
};

type NewProductDraft = typeof emptyNewProduct;
type CatalogDetails = Record<string, string>;

type CatalogSchema = {
  title: string;
  requiredFields: string[];
  sections: Array<{ title?: string; fields: string[] }>;
};

const complianceFields = [
  "countryOfOrigin",
  "manufacturerName",
  "manufacturerAddress",
  "manufacturerPincode",
  "packerName",
  "packerAddress",
  "packerPincode",
  "importerName",
  "importerAddress",
  "importerPincode",
];

const defaultRequiredFields = [
  "netWeight",
  "productName",
  "genericName",
  "compare_at_price",
  "price",
  "sku",
  "stock",
  "netQuantity",
  ...complianceFields,
];

const catalogFieldLabels: Record<string, string> = {
  netWeight: "Net Weight (gms)",
  styleCode: "Style code/Product ID",
  productName: "Product Name",
  size: "Size",
  color: "Color",
  fabric: "Fabric",
  fitShape: "Fit/Shape",
  genericName: "Generic Name",
  netQuantity: "Net Quantity (N)",
  neck: "Neck",
  occasion: "Occasion",
  pattern: "Pattern",
  printOrPatternType: "Print Or Pattern Type",
  sleeveLength: "Sleeve Length",
  bottomType: "Bottom Type",
  waistSize: "Waist Size",
  rise: "Rise",
  closure: "Closure",
  border: "Border",
  blouse: "Blouse",
  dupatta: "Dupatta",
  work: "Work",
  material: "Material",
  soleMaterial: "Sole Material",
  upperMaterial: "Upper Material",
  toeShape: "Toe Shape",
  strapMaterial: "Strap Material",
  dialShape: "Dial Shape",
  displayType: "Display Type",
  warranty: "Warranty",
  compartments: "Compartments",
  dimensions: "Dimensions",
  capacity: "Capacity",
  threadCount: "Thread Count",
  fillMaterial: "Fill Material",
  powerSource: "Power Source",
  plantType: "Plant Type",
  frameMaterial: "Frame Material",
  cookwareCompatibility: "Cookware Compatibility",
  ageGroup: "Age Group",
  batteryRequired: "Battery Required",
  skillSet: "Skill Set",
  productForm: "Product Form",
  skinType: "Skin Type",
  hairType: "Hair Type",
  ingredients: "Ingredients",
  expiry: "Expiry/Shelf Life",
  modelName: "Model Name",
  ram: "RAM",
  storage: "Storage",
  compatibleDevices: "Compatible Devices",
  connectorType: "Connector Type",
  power: "Power",
  pages: "Pages",
  ruling: "Ruling",
  inkColor: "Ink Color",
  packOf: "Pack Of",
  countryOfOrigin: "COUNTRY OF ORIGIN",
  manufacturerName: "Manufacturer Name",
  manufacturerAddress: "Manufacturer Address",
  manufacturerPincode: "Manufacturer Pincode",
  packerName: "Packer Name",
  packerAddress: "Packer Address",
  packerPincode: "Packer Pincode",
  importerName: "Importer Name",
  importerAddress: "Importer Address",
  importerPincode: "Importer Pincode",
  brand: "Brand",
  sku: "SKU",
  price: "Unit Price",
  compare_at_price: "MRP",
  discount_percent: "Discount",
  shipping_cost: "Shipping Cost",
  stock: "Stock Count",
  character: "Character",
  hemline: "Hemline",
  length: "Length",
  numberOfPockets: "Number of Pockets",
  sleeveStyling: "Sleeve Styling",
  style: "Style",
  description: "Description",
};

const selectOptions: Record<string, string[]> = {
  size: ["S", "M", "L", "XL", "XXL", "Free Size"],
  color: ["Black", "White", "Blue", "Green", "Grey", "Maroon", "Red", "Yellow"],
  fabric: ["Cotton", "Cotton Blend", "Polyester", "Lycra", "Modal", "Knitted"],
  fitShape: ["Regular Fit", "Slim Fit", "Oversized", "Relaxed Fit", "Muscle Fit"],
  genericName: ["T-shirt", "Polo T-shirt", "Men Top Wear", "Casual T-shirt"],
  netQuantity: ["1", "2", "3", "4", "5"],
  neck: ["Round Neck", "Polo Neck", "V Neck", "Henley Neck", "Hooded"],
  occasion: ["Casual", "Sports", "Party", "Daily Wear", "Festive"],
  pattern: ["Solid", "Printed", "Striped", "Colorblocked", "Typography"],
  printOrPatternType: ["Solid", "Graphic Print", "Typography", "Striped", "Self Design"],
  sleeveLength: ["Half Sleeve", "Full Sleeve", "Sleeveless", "Three-Quarter Sleeve"],
  bottomType: ["Jeans", "Trousers", "Shorts", "Track Pants", "Leggings", "Skirt"],
  waistSize: ["26", "28", "30", "32", "34", "36", "38", "40", "Free Size"],
  rise: ["Low Rise", "Mid Rise", "High Rise"],
  closure: ["Button", "Drawstring", "Elastic", "Hook", "Lace-Up", "Slip-On", "Zip"],
  border: ["No Border", "Printed Border", "Woven Border", "Zari Border", "Lace Border"],
  blouse: ["With Blouse", "Without Blouse", "Unstitched Blouse"],
  dupatta: ["With Dupatta", "Without Dupatta"],
  work: ["Printed", "Embroidered", "Sequinned", "Zari", "Solid", "Self Design"],
  material: [
    "Cotton",
    "Polyester",
    "Plastic",
    "Stainless Steel",
    "Wood",
    "Glass",
    "Leather",
    "Faux Leather",
    "Rubber",
    "Metal",
    "Paper",
    "Silicone",
  ],
  soleMaterial: ["Rubber", "EVA", "PU", "TPR", "PVC"],
  upperMaterial: ["Canvas", "Synthetic", "Leather", "Mesh", "Textile", "Rubber"],
  toeShape: ["Round Toe", "Open Toe", "Pointed Toe", "Square Toe"],
  strapMaterial: ["Leather", "Stainless Steel", "Silicone", "PU", "Fabric"],
  dialShape: ["Round", "Square", "Rectangle", "Oval"],
  displayType: ["Analog", "Digital", "Analog-Digital", "Smart"],
  warranty: ["No Warranty", "3 Months", "6 Months", "1 Year", "2 Years"],
  powerSource: ["Battery", "Electric", "USB", "Solar", "Not Applicable"],
  plantType: ["Artificial Plant", "Flower", "Grass", "Bonsai", "Succulent"],
  cookwareCompatibility: ["Gas", "Induction", "Microwave", "Oven", "Dishwasher Safe"],
  ageGroup: ["0-6 Months", "6-12 Months", "1-2 Years", "2-5 Years", "5-8 Years", "8+ Years"],
  batteryRequired: ["Yes", "No"],
  skillSet: ["Motor Skills", "Learning", "Creativity", "Memory", "Problem Solving"],
  productForm: ["Cream", "Gel", "Liquid", "Oil", "Powder", "Tablet", "Spray"],
  skinType: ["All Skin Types", "Dry", "Oily", "Sensitive", "Combination"],
  hairType: ["All Hair Types", "Dry", "Oily", "Curly", "Straight", "Damaged"],
  ram: ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB"],
  storage: ["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB"],
  connectorType: ["USB", "USB-C", "Micro USB", "Lightning", "Bluetooth", "3.5mm"],
  ruling: ["Plain", "Ruled", "Dotted", "Grid", "Single Line"],
  inkColor: ["Blue", "Black", "Red", "Green", "Multicolor"],
  packOf: ["1", "2", "3", "4", "5", "6", "10", "12"],
  brand: ["Sheetal", "Unbranded"],
  character: ["None", "Graphic", "Logo", "Text"],
  hemline: ["Straight", "Curved", "High-Low"],
  length: ["Regular", "Longline", "Crop"],
  numberOfPockets: ["0", "1", "2"],
  sleeveStyling: ["Regular Sleeves", "Raglan Sleeves", "Cuffed Sleeves"],
  style: ["Casual", "Basic", "Streetwear", "Sports"],
};

const initialCatalogDetails = Object.keys(catalogFieldLabels).reduce<CatalogDetails>(
  (details, key) => ({ ...details, [key]: key === "brand" ? "Sheetal" : "" }),
  {},
);

const createSchema = (
  title: string,
  sections: CatalogSchema["sections"],
  requiredFields: string[] = [],
): CatalogSchema => ({
  title,
  sections: [
    {
      title: "Product, Size and Inventory",
      fields: [
        "netWeight",
        "styleCode",
        "productName",
        "genericName",
        "compare_at_price",
        "discount_percent",
        "price",
        "shipping_cost",
        "sku",
        "stock",
        "netQuantity",
      ],
    },
    ...sections,
    { title: "Compliance Details", fields: complianceFields },
    {
      title: "Other Attributes",
      fields: ["brand", "description"],
    },
  ],
  requiredFields: [...new Set([...defaultRequiredFields, ...requiredFields])],
});

const catalogSchemas = {
  clothingTopWear: createSchema(
    "Clothing Top Wear Details",
    [
      {
        title: "Product Details",
        fields: [
          "size",
          "color",
          "fabric",
          "fitShape",
          "neck",
          "occasion",
          "pattern",
          "printOrPatternType",
          "sleeveLength",
        ],
      },
      {
        title: "Other Attributes",
        fields: ["character", "hemline", "length", "numberOfPockets", "sleeveStyling", "style"],
      },
    ],
    ["size", "color", "fabric", "fitShape", "neck", "occasion", "pattern", "sleeveLength"],
  ),
  clothingBottomWear: createSchema(
    "Clothing Bottom Wear Details",
    [
      {
        title: "Product Details",
        fields: [
          "bottomType",
          "waistSize",
          "size",
          "color",
          "fabric",
          "fitShape",
          "rise",
          "closure",
          "pattern",
          "occasion",
          "length",
          "numberOfPockets",
        ],
      },
    ],
    ["bottomType", "waistSize", "color", "fabric", "fitShape", "closure"],
  ),
  ethnicWear: createSchema(
    "Ethnic Wear Details",
    [
      {
        title: "Product Details",
        fields: [
          "size",
          "color",
          "fabric",
          "occasion",
          "pattern",
          "printOrPatternType",
          "work",
          "border",
          "blouse",
          "dupatta",
          "sleeveLength",
          "neck",
        ],
      },
    ],
    ["color", "fabric", "occasion", "pattern"],
  ),
  footwear: createSchema(
    "Footwear Details",
    [
      {
        title: "Product Details",
        fields: [
          "size",
          "color",
          "upperMaterial",
          "soleMaterial",
          "closure",
          "toeShape",
          "occasion",
          "pattern",
        ],
      },
    ],
    ["size", "color", "upperMaterial", "soleMaterial"],
  ),
  fashionAccessories: createSchema(
    "Fashion Accessory Details",
    [
      {
        title: "Product Details",
        fields: [
          "color",
          "material",
          "closure",
          "compartments",
          "dimensions",
          "capacity",
          "strapMaterial",
          "dialShape",
          "displayType",
          "warranty",
        ],
      },
    ],
    ["color", "material"],
  ),
  homeFurnishing: createSchema(
    "Home Furnishing Details",
    [
      {
        title: "Product Details",
        fields: [
          "color",
          "fabric",
          "material",
          "pattern",
          "dimensions",
          "threadCount",
          "fillMaterial",
          "packOf",
        ],
      },
    ],
    ["color", "material", "dimensions"],
  ),
  kitchenDining: createSchema(
    "Kitchen & Dining Details",
    [
      {
        title: "Product Details",
        fields: [
          "material",
          "color",
          "capacity",
          "dimensions",
          "cookwareCompatibility",
          "closure",
          "packOf",
        ],
      },
    ],
    ["material", "capacity", "packOf"],
  ),
  decorLighting: createSchema(
    "Decor & Lighting Details",
    [
      {
        title: "Product Details",
        fields: [
          "material",
          "color",
          "dimensions",
          "pattern",
          "frameMaterial",
          "powerSource",
          "plantType",
          "packOf",
        ],
      },
    ],
    ["material", "color", "dimensions"],
  ),
  kidsClothing: createSchema(
    "Kids Clothing Details",
    [
      {
        title: "Product Details",
        fields: [
          "ageGroup",
          "size",
          "color",
          "fabric",
          "fitShape",
          "neck",
          "sleeveLength",
          "pattern",
          "occasion",
        ],
      },
    ],
    ["ageGroup", "size", "color", "fabric"],
  ),
  toys: createSchema(
    "Toy Details",
    [
      {
        title: "Product Details",
        fields: [
          "ageGroup",
          "material",
          "color",
          "batteryRequired",
          "skillSet",
          "dimensions",
          "packOf",
        ],
      },
    ],
    ["ageGroup", "material", "batteryRequired"],
  ),
  personalCare: createSchema(
    "Personal Care Details",
    [
      {
        title: "Product Details",
        fields: [
          "productForm",
          "skinType",
          "hairType",
          "ingredients",
          "capacity",
          "expiry",
          "packOf",
        ],
      },
    ],
    ["productForm", "capacity", "expiry"],
  ),
  mobilesTablets: createSchema(
    "Mobile & Tablet Details",
    [
      {
        title: "Product Details",
        fields: ["modelName", "ram", "storage", "color", "displayType", "warranty"],
      },
    ],
    ["modelName", "ram", "storage", "color", "warranty"],
  ),
  electronics: createSchema(
    "Electronics Details",
    [
      {
        title: "Product Details",
        fields: [
          "modelName",
          "material",
          "color",
          "capacity",
          "power",
          "connectorType",
          "compatibleDevices",
          "warranty",
        ],
      },
    ],
    ["modelName", "power", "warranty"],
  ),
  stationery: createSchema(
    "Stationery Details",
    [
      {
        title: "Product Details",
        fields: ["material", "color", "pages", "ruling", "inkColor", "dimensions", "packOf"],
      },
    ],
    ["material", "packOf"],
  ),
  default: createSchema(
    "Product Details",
    [
      {
        title: "Product Details",
        fields: ["color", "material", "capacity", "dimensions", "pattern", "packOf"],
      },
    ],
    ["material"],
  ),
} satisfies Record<string, CatalogSchema>;

const getCatalogSchema = (path: string[]) => {
  const normalizedPath = path.join(" / ").toLowerCase();
  const [department = "", section = "", group = ""] = path.map((item) => item.toLowerCase());

  if (department.includes("men fashion") || department.includes("women fashion")) {
    if (
      normalizedPath.includes("footwear") ||
      normalizedPath.includes("shoe") ||
      normalizedPath.includes("slipper") ||
      normalizedPath.includes("sandal") ||
      normalizedPath.includes("flip")
    ) {
      return catalogSchemas.footwear;
    }
    if (
      normalizedPath.includes("jewellery") ||
      normalizedPath.includes("accessories") ||
      normalizedPath.includes("bag") ||
      normalizedPath.includes("wallet") ||
      normalizedPath.includes("belt") ||
      normalizedPath.includes("watch")
    ) {
      return catalogSchemas.fashionAccessories;
    }
    if (
      normalizedPath.includes("bottom") ||
      normalizedPath.includes("jeans") ||
      normalizedPath.includes("trouser") ||
      normalizedPath.includes("shorts") ||
      normalizedPath.includes("track pants") ||
      normalizedPath.includes("skirt")
    ) {
      return catalogSchemas.clothingBottomWear;
    }
    if (
      normalizedPath.includes("saree") ||
      normalizedPath.includes("kurti") ||
      normalizedPath.includes("kurta") ||
      normalizedPath.includes("lehenga") ||
      normalizedPath.includes("ethnic")
    ) {
      return catalogSchemas.ethnicWear;
    }
    return catalogSchemas.clothingTopWear;
  }

  if (department.includes("home") || department.includes("kitchen")) {
    if (section.includes("furnishing")) return catalogSchemas.homeFurnishing;
    if (section.includes("kitchen") || section.includes("dining"))
      return catalogSchemas.kitchenDining;
    if (section.includes("decor") || group.includes("lighting") || group.includes("plants")) {
      return catalogSchemas.decorLighting;
    }
    return catalogSchemas.homeFurnishing;
  }

  if (department.includes("kids")) {
    if (section.includes("clothing")) return catalogSchemas.kidsClothing;
    if (section.includes("toys")) return catalogSchemas.toys;
    return catalogSchemas.personalCare;
  }

  if (department.includes("personal care") || department.includes("wellness")) {
    return catalogSchemas.personalCare;
  }

  if (department.includes("mobile") || department.includes("tablet")) {
    if (section.includes("mobile") || section.includes("tablet"))
      return catalogSchemas.mobilesTablets;
    return catalogSchemas.electronics;
  }

  if (department.includes("consumer electronics")) return catalogSchemas.electronics;
  if (department.includes("office") || department.includes("stationery"))
    return catalogSchemas.stationery;

  return catalogSchemas.default;
};

const getGenericNameOptions = (path: string[]) => {
  const normalizedPath = path.join(" / ").toLowerCase();
  const leaf = path.at(-1)?.toLowerCase() ?? "";

  if (normalizedPath.includes("saree")) return ["Saree", "Silk Saree", "Cotton Saree"];
  if (normalizedPath.includes("kurti")) return ["Kurti", "Printed Kurti", "A-Line Kurti"];
  if (normalizedPath.includes("kurta")) return ["Kurta", "Kurta Set", "Ethnic Kurta"];
  if (normalizedPath.includes("lehenga")) return ["Lehenga", "Lehenga Choli", "Party Lehenga"];
  if (normalizedPath.includes("shirt")) return ["Shirt", "Casual Shirt", "Formal Shirt"];
  if (normalizedPath.includes("t-shirt") || normalizedPath.includes("tshirt")) {
    return ["T-shirt", "Polo T-shirt", "Graphic T-shirt", "Casual T-shirt"];
  }
  if (normalizedPath.includes("vest")) return ["Vest", "Men's Vest"];
  if (normalizedPath.includes("boxer")) return ["Boxer", "Men's Boxer"];
  if (normalizedPath.includes("brief")) return ["Brief", "Men's Brief"];
  if (normalizedPath.includes("night suit")) return ["Night Suit", "Sleepwear Set"];
  if (normalizedPath.includes("jeans")) return ["Jeans", "Denim Jeans", "Slim Fit Jeans"];
  if (normalizedPath.includes("trouser")) return ["Trousers", "Formal Trousers", "Casual Trousers"];
  if (normalizedPath.includes("shorts")) return ["Shorts", "Cotton Shorts", "Sports Shorts"];
  if (normalizedPath.includes("track pants")) return ["Track Pants", "Joggers"];
  if (normalizedPath.includes("skirt")) return ["Skirt", "Women's Skirt"];
  if (normalizedPath.includes("dress")) return ["Dress", "Maxi Dress", "Midi Dress"];
  if (normalizedPath.includes("top")) return ["Top", "Casual Top", "Crop Top", "Tunic"];
  if (normalizedPath.includes("earring")) return ["Earrings", "Fashion Earrings"];
  if (normalizedPath.includes("necklace")) return ["Necklace", "Jewellery Necklace"];
  if (normalizedPath.includes("bangle")) return ["Bangles", "Bracelet"];
  if (normalizedPath.includes("ring")) return ["Ring", "Fashion Ring"];
  if (normalizedPath.includes("handbag")) return ["Handbag", "Women's Handbag"];
  if (normalizedPath.includes("sling bag")) return ["Sling Bag", "Crossbody Bag"];
  if (normalizedPath.includes("wallet")) return ["Wallet", "Card Wallet"];
  if (normalizedPath.includes("clutch")) return ["Clutch", "Party Clutch"];
  if (normalizedPath.includes("belt")) return ["Belt", "Formal Belt", "Casual Belt"];
  if (normalizedPath.includes("watch")) return ["Watch", "Analog Watch", "Smart Watch"];
  if (normalizedPath.includes("shoe"))
    return ["Shoes", "Casual Shoes", "Formal Shoes", "Sports Shoes"];
  if (normalizedPath.includes("slipper") || normalizedPath.includes("flip")) {
    return ["Slippers", "Flip Flops", "Slides"];
  }
  if (normalizedPath.includes("sandal") || normalizedPath.includes("floater")) {
    return ["Sandals", "Floaters"];
  }
  if (
    normalizedPath.includes("mojari") ||
    normalizedPath.includes("kolhapuri") ||
    normalizedPath.includes("jutti")
  ) {
    return ["Ethnic Footwear", "Mojari", "Jutti"];
  }
  if (normalizedPath.includes("sock")) return ["Socks", "Shoe Socks"];
  if (normalizedPath.includes("insole")) return ["Insoles", "Shoe Insoles"];
  if (normalizedPath.includes("shoe care")) return ["Shoe Care", "Shoe Care Kit"];
  if (normalizedPath.includes("bedsheet"))
    return ["Bedsheet", "Double Bedsheet", "Single Bedsheet"];
  if (normalizedPath.includes("curtain")) return ["Curtain", "Door Curtain", "Window Curtain"];
  if (normalizedPath.includes("cushion")) return ["Cushion Cover", "Cushion"];
  if (normalizedPath.includes("pillow")) return ["Pillow Cover", "Pillow"];
  if (normalizedPath.includes("diwan")) return ["Diwan Set", "Diwan Cover Set"];
  if (normalizedPath.includes("pan")) return ["Pan", "Cookware Pan"];
  if (normalizedPath.includes("kadhai")) return ["Kadhai", "Cookware Kadhai"];
  if (normalizedPath.includes("pressure cooker")) return ["Pressure Cooker", "Cooker"];
  if (normalizedPath.includes("dinner set")) return ["Dinner Set", "Dinnerware Set"];
  if (normalizedPath.includes("plate")) return ["Plate", "Dinner Plate"];
  if (normalizedPath.includes("bowl")) return ["Bowl", "Serving Bowl"];
  if (normalizedPath.includes("mug")) return ["Mug", "Coffee Mug"];
  if (normalizedPath.includes("container")) return ["Container", "Storage Container"];
  if (normalizedPath.includes("jar")) return ["Jar", "Storage Jar"];
  if (normalizedPath.includes("lunch box")) return ["Lunch Box", "Tiffin Box"];
  if (normalizedPath.includes("wall sticker")) return ["Wall Sticker", "Wall Decal"];
  if (normalizedPath.includes("painting")) return ["Painting", "Wall Painting"];
  if (normalizedPath.includes("clock")) return ["Clock", "Wall Clock"];
  if (normalizedPath.includes("lamp")) return ["Lamp", "Table Lamp"];
  if (normalizedPath.includes("string light")) return ["String Lights", "Decorative Lights"];
  if (normalizedPath.includes("lantern")) return ["Lantern", "Decorative Lantern"];
  if (normalizedPath.includes("artificial plant")) return ["Artificial Plant", "Artificial Flower"];
  if (normalizedPath.includes("planter")) return ["Planter", "Plant Pot"];
  if (normalizedPath.includes("vase")) return ["Vase", "Flower Vase"];
  if (normalizedPath.includes("frock")) return ["Frock", "Girls Frock"];
  if (normalizedPath.includes("legging")) return ["Leggings", "Kids Leggings"];
  if (normalizedPath.includes("ethnic set")) return ["Ethnic Set", "Kids Ethnic Set"];
  if (normalizedPath.includes("romper")) return ["Romper", "Baby Romper"];
  if (normalizedPath.includes("bodysuit")) return ["Bodysuit", "Baby Bodysuit"];
  if (normalizedPath.includes("sweater")) return ["Sweater", "Kids Sweater"];
  if (normalizedPath.includes("puzzle")) return ["Puzzle", "Learning Puzzle"];
  if (normalizedPath.includes("flash card")) return ["Flash Cards", "Learning Cards"];
  if (normalizedPath.includes("activity kit")) return ["Activity Kit", "Learning Kit"];
  if (normalizedPath.includes("teddy")) return ["Teddy Bear", "Soft Toy"];
  if (normalizedPath.includes("plush")) return ["Plush Toy", "Soft Toy"];
  if (normalizedPath.includes("character toy")) return ["Character Toy", "Soft Toy"];
  if (normalizedPath.includes("ride on")) return ["Ride On Toy", "Outdoor Toy"];
  if (normalizedPath.includes("sports toy")) return ["Sports Toy", "Outdoor Toy"];
  if (normalizedPath.includes("water toy")) return ["Water Toy", "Outdoor Toy"];
  if (normalizedPath.includes("bottle")) return ["Feeding Bottle", "Baby Bottle"];
  if (normalizedPath.includes("sipper")) return ["Sipper", "Baby Sipper"];
  if (normalizedPath.includes("bib")) return ["Bib", "Baby Bib"];
  if (normalizedPath.includes("diaper")) return ["Diaper", "Baby Diaper"];
  if (normalizedPath.includes("wipe")) return ["Wipes", "Baby Wipes"];
  if (normalizedPath.includes("changing mat")) return ["Changing Mat", "Baby Changing Mat"];
  if (normalizedPath.includes("face wash")) return ["Face Wash", "Skin Cleanser"];
  if (normalizedPath.includes("moisturizer")) return ["Moisturizer", "Face Cream"];
  if (normalizedPath.includes("sunscreen")) return ["Sunscreen", "Sun Protection"];
  if (normalizedPath.includes("serum")) return ["Serum", "Face Serum"];
  if (normalizedPath.includes("shampoo")) return ["Shampoo", "Hair Shampoo"];
  if (normalizedPath.includes("conditioner")) return ["Conditioner", "Hair Conditioner"];
  if (normalizedPath.includes("hair oil")) return ["Hair Oil", "Hair Care Oil"];
  if (normalizedPath.includes("hair color")) return ["Hair Color", "Hair Dye"];
  if (normalizedPath.includes("lipstick")) return ["Lipstick", "Lip Color"];
  if (normalizedPath.includes("foundation")) return ["Foundation", "Face Foundation"];
  if (normalizedPath.includes("kajal")) return ["Kajal", "Eye Kajal"];
  if (normalizedPath.includes("nail polish")) return ["Nail Polish", "Nail Paint"];
  if (normalizedPath.includes("vitamin")) return ["Vitamins", "Health Supplement"];
  if (normalizedPath.includes("protein")) return ["Protein", "Protein Supplement"];
  if (normalizedPath.includes("ayurvedic")) return ["Ayurvedic Supplement", "Health Supplement"];
  if (normalizedPath.includes("sanitary")) return ["Sanitary Pads", "Personal Hygiene Product"];
  if (normalizedPath.includes("hand wash")) return ["Hand Wash", "Hand Cleanser"];
  if (normalizedPath.includes("body wash")) return ["Body Wash", "Shower Gel"];
  if (normalizedPath.includes("yoga mat")) return ["Yoga Mat", "Fitness Mat"];
  if (normalizedPath.includes("resistance band")) return ["Resistance Band", "Fitness Band"];
  if (normalizedPath.includes("massager")) return ["Massager", "Body Massager"];
  if (normalizedPath.includes("smartphone")) return ["Smartphone", "Mobile Phone"];
  if (normalizedPath.includes("feature phone")) return ["Feature Phone", "Mobile Phone"];
  if (normalizedPath.includes("refurbished phone")) return ["Refurbished Phone", "Mobile Phone"];
  if (normalizedPath.includes("case") || normalizedPath.includes("cover"))
    return ["Case Cover", "Mobile Cover"];
  if (normalizedPath.includes("screen guard")) return ["Screen Guard", "Screen Protector"];
  if (normalizedPath.includes("charger")) return ["Charger", "Mobile Charger"];
  if (normalizedPath.includes("data cable")) return ["Data Cable", "Charging Cable"];
  if (normalizedPath.includes("tablet")) return ["Tablet", "Android Tablet"];
  if (normalizedPath.includes("power bank")) return ["Power Bank", "Portable Charger"];
  if (normalizedPath.includes("earphone")) return ["Earphones", "Wired Earphones"];
  if (normalizedPath.includes("bluetooth speaker"))
    return ["Bluetooth Speaker", "Wireless Speaker"];
  if (normalizedPath.includes("mixer grinder")) return ["Mixer Grinder", "Kitchen Appliance"];
  if (normalizedPath.includes("electric kettle")) return ["Electric Kettle", "Kettle"];
  if (normalizedPath.includes("induction cooktop")) return ["Induction Cooktop", "Cooktop"];
  if (normalizedPath.includes("iron")) return ["Iron", "Clothes Iron"];
  if (normalizedPath.includes("fan")) return ["Fan", "Home Fan"];
  if (normalizedPath.includes("vacuum cleaner")) return ["Vacuum Cleaner", "Home Cleaner"];
  if (normalizedPath.includes("trimmer")) return ["Trimmer", "Grooming Trimmer"];
  if (normalizedPath.includes("hair dryer")) return ["Hair Dryer", "Dryer"];
  if (normalizedPath.includes("straightener")) return ["Hair Straightener", "Straightener"];
  if (normalizedPath.includes("headphone")) return ["Headphones", "Audio Headphones"];
  if (normalizedPath.includes("neckband")) return ["Neckband", "Bluetooth Neckband"];
  if (normalizedPath.includes("speaker")) return ["Speaker", "Audio Speaker"];
  if (normalizedPath.includes("keyboard")) return ["Keyboard", "Computer Keyboard"];
  if (normalizedPath.includes("mouse")) return ["Mouse", "Computer Mouse"];
  if (normalizedPath.includes("usb hub")) return ["USB Hub", "Computer Accessory"];
  if (normalizedPath.includes("cctv")) return ["CCTV Camera", "Security Camera"];
  if (normalizedPath.includes("action camera")) return ["Action Camera", "Camera"];
  if (normalizedPath.includes("doorbell")) return ["Smart Doorbell", "Doorbell Camera"];
  if (normalizedPath.includes("notebook")) return ["Notebook", "Writing Notebook"];
  if (normalizedPath.includes("register")) return ["Register", "Writing Register"];
  if (normalizedPath.includes("diary")) return ["Diary", "Personal Diary"];
  if (normalizedPath.includes("document file")) return ["Document File", "File Folder"];
  if (leaf.includes("folder")) return ["Folder", "File Folder"];
  if (normalizedPath.includes("clipboard")) return ["Clipboard", "Writing Clipboard"];
  if (normalizedPath.includes("ball pen")) return ["Ball Pen", "Pen"];
  if (normalizedPath.includes("gel pen")) return ["Gel Pen", "Pen"];
  if (normalizedPath.includes("metal pen")) return ["Metal Pen", "Pen"];
  if (normalizedPath.includes("wooden pencil")) return ["Wooden Pencil", "Pencil"];
  if (normalizedPath.includes("mechanical pencil")) return ["Mechanical Pencil", "Pencil"];
  if (normalizedPath.includes("color pencil")) return ["Color Pencil", "Pencil Set"];

  return [path.at(-1) ?? "Product", catalogFieldLabels.genericName];
};

const formatCatalogDetails = (details?: CatalogDetails) => {
  if (!details) return "";
  return Object.entries(catalogFieldLabels)
    .map(([key, label]) => {
      const value = details[key]?.trim();
      return value ? `${label}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n");
};

const formatProductPricingDetails = (product: NewProductDraft) =>
  [
    product.compare_at_price > 0 ? `MRP: ${formatPrice(product.compare_at_price)}` : "",
    product.discount_percent > 0 ? `Discount: ${product.discount_percent}%` : "",
    product.shipping_cost > 0 ? `Shipping Cost: ${formatPrice(product.shipping_cost)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

const collectLeafPaths = (nodes: CategoryNode[], parent: string[] = []): string[][] =>
  nodes.flatMap((node) => {
    const path = [...parent, node.name];
    if (!node.children?.length) return [path];
    return collectLeafPaths(node.children, path);
  });

const categorySlugFromPath = (path: string[]) =>
  path
    .join("-")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const findMeeshoCategoryId = (path: string[], categories: any[] | undefined) => {
  const slug = categorySlugFromPath(path);
  return categories?.find((cat: any) => cat.slug === slug)?.id ?? "";
};

function CategoryColumnPicker({
  categories,
  selectedPath,
  onSelectPath,
  storeCategoryId,
}: {
  categories: any[] | undefined;
  selectedPath: string[];
  onSelectPath: (path: string[]) => void;
  storeCategoryId: string;
}) {
  const [activePath, setActivePath] = useState<string[]>(selectedPath);
  const [query, setQuery] = useState("");

  const columns = useMemo(() => {
    const nextColumns: CategoryNode[][] = [extractedCategoryTree];
    let nodes = extractedCategoryTree;

    activePath.forEach((name) => {
      const selected = nodes.find((node) => node.name === name);
      if (selected?.children?.length) {
        nextColumns.push(selected.children);
        nodes = selected.children;
      }
    });

    return nextColumns.slice(0, 4);
  }, [activePath]);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return collectLeafPaths(extractedCategoryTree)
      .filter((path) => path.join(" ").toLowerCase().includes(needle))
      .slice(0, 8);
  }, [query]);

  const handleNodeClick = (node: CategoryNode, columnIndex: number) => {
    const nextPath = [...activePath.slice(0, columnIndex), node.name];
    setActivePath(nextPath);
    if (!node.children?.length) onSelectPath(nextPath);
  };

  return (
    <div className="sm:col-span-2 border border-border bg-[#eef1f7]">
      <div className="border-b border-border bg-background p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Extracted Category Path
            </span>
            <div className="mt-1 text-sm font-medium">
              {selectedPath.length ? selectedPath.join(" / ") : "Select the product category"}
            </div>
          </div>
          <div className="block md:w-80">
            <span className="mb-1 block text-[10px] uppercase tracking-widest text-muted-foreground">
              Database Category
            </span>
            <div
              className={`border px-3 py-2 text-xs ${
                storeCategoryId
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-300 bg-amber-50 text-amber-800"
              }`}
            >
              {storeCategoryId
                ? "Mapped to selected Meesho category"
                : "Select a final leaf category to map"}
            </div>
          </div>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Meesho category"
            className="w-full border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ink"
          />
        </label>

        {searchResults.length > 0 && (
          <div className="grid gap-2 md:grid-cols-2">
            {searchResults.map((path) => (
              <button
                key={path.join("/")}
                type="button"
                onClick={() => {
                  setActivePath(path);
                  onSelectPath(path);
                  setQuery("");
                }}
                className="border border-border bg-background px-3 py-2 text-left text-xs hover:border-ink"
              >
                {path.join(" / ")}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[46rem] grid-cols-4 gap-3">
            {columns.map((nodes, columnIndex) => (
              <div key={columnIndex} className="h-[34rem] min-w-0 bg-background shadow-sm">
                <div className="border-b border-border px-3 py-3 text-xs font-medium text-ink">
                  {columnIndex === 0
                    ? "Your Categories"
                    : columnIndex === 1
                      ? activePath[0] || "Section"
                      : columnIndex === 2
                        ? activePath[1] || "Type"
                        : activePath[2] || "Sub-Type"}
                </div>
                <div className="h-[27rem] overflow-y-auto p-2">
                  {nodes.map((node) => {
                    const isActive = activePath[columnIndex] === node.name;
                    const isLeafSelected =
                      selectedPath.join("/") ===
                      [...activePath.slice(0, columnIndex), node.name].join("/");
                    return (
                      <button
                        key={node.name}
                        type="button"
                        onClick={() => handleNodeClick(node, columnIndex)}
                        className={`mb-1 flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs leading-tight transition-all ${
                          isActive || isLeafSelected
                            ? "bg-[#4427c7] text-white"
                            : "bg-background text-ink hover:bg-[#ebe7ff]"
                        }`}
                      >
                        <span className="min-w-0 break-words">{node.name}</span>
                        {node.children?.length ? (
                          <ChevronDown className="h-3 w-3 -rotate-90" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {columnIndex === 0 && (
                  <div className="border-t border-border px-3 py-3 text-[10px]">
                    <div className="text-muted-foreground">Can't find the category?</div>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.querySelector<HTMLInputElement>(
                          "input[placeholder='Search Meesho category']",
                        );
                        input?.focus();
                      }}
                      className="mt-1 font-semibold text-[#4427c7]"
                    >
                      Search Category
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background shadow-sm xl:min-h-[34rem]">
          <div className="bg-[#dde3ed] px-4 py-3 text-center text-[10px] text-ink">
            {selectedPath.length ? selectedPath.join(" / ") : "Choose a category path"}
          </div>
          <div className="p-5 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center border border-dashed border-border bg-muted/20 text-[10px] text-muted-foreground">
              Front Image
            </div>
            <p className="mx-auto mt-4 max-w-48 text-xs font-semibold text-ink">
              Please provide only front image for each product
            </p>
          </div>
          <div className="border-t border-border p-4 text-xs">
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-800">
              Follow guidelines to reduce quality check failure
            </div>
            <div className="mt-4 font-semibold">General Guidelines</div>
            <ol className="mt-2 space-y-2 text-[11px] text-muted-foreground">
              <li>1. You can add minimum 1 and maximum 9 products to create a catalog.</li>
              <li>2. Upload products from the same selected category.</li>
            </ol>
            <div className="mt-4 font-semibold">Image Guidelines</div>
            <ol className="mt-2 space-y-2 text-[11px] text-muted-foreground">
              <li>1. Images with text or watermark are not acceptable.</li>
              <li>2. Product image should not have any text.</li>
              <li>3. Upload solo product image without props.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatalogInput({
  id,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  optionsOverride,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  optionsOverride?: string[];
}) {
  const options = optionsOverride ?? selectOptions[id];
  const label = catalogFieldLabels[id] ?? id;

  return (
    <label className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-start gap-3 text-xs">
      <span className="pt-2 text-right leading-4 text-ink">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full border border-[#aeb6c2] bg-background px-3 text-xs text-ink outline-none focus:border-[#4427c7]"
          required={required}
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : id === "description" ? (
        <div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={1400}
            rows={5}
            placeholder={placeholder ?? "Enter Description"}
            className="w-full resize-none border border-[#aeb6c2] bg-background px-3 py-2 text-xs text-ink outline-none focus:border-[#4427c7]"
          />
          <div className="mt-1 text-right text-[9px] text-muted-foreground">
            {value.length}/1400
          </div>
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? `Enter ${label}`}
          className="h-9 w-full border border-[#aeb6c2] bg-background px-3 text-xs text-ink outline-none focus:border-[#4427c7]"
          required={required}
        />
      )}
    </label>
  );
}

function CatalogAddWizard({
  categories,
  newProduct,
  setNewProduct,
  selectedCategoryPath,
  setSelectedCategoryPath,
  onClose,
  onSubmit,
}: {
  categories: any[] | undefined;
  newProduct: NewProductDraft;
  setNewProduct: (product: NewProductDraft) => void;
  selectedCategoryPath: string[];
  setSelectedCategoryPath: (path: string[]) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent, details?: CatalogDetails) => void;
}) {
  const [step, setStep] = useState<"media" | "details">("media");
  const [catalogDetails, setCatalogDetails] = useState<CatalogDetails>(initialCatalogDetails);
  const [sameAsManufacturer, setSameAsManufacturer] = useState(false);
  const catalogSchema = getCatalogSchema(selectedCategoryPath);
  const imagePreview = newProduct.image_url;

  const updateCatalogDetail = (key: string, value: string) => {
    setCatalogDetails((current) => {
      const next = { ...current, [key]: value };
      if (sameAsManufacturer) {
        if (key === "manufacturerName") next.packerName = value;
        if (key === "manufacturerAddress") next.packerAddress = value;
        if (key === "manufacturerPincode") next.packerPincode = value;
      }
      if (key === "productName") setNewProduct({ ...newProduct, name: value });
      if (key === "brand") setNewProduct({ ...newProduct, brand: value || "Sheetal" });
      return next;
    });
  };

  const productFieldIds = [
    "sku",
    "price",
    "compare_at_price",
    "discount_percent",
    "shipping_cost",
    "stock",
  ];

  const updateProductField = (key: string, value: string) => {
    if (key === "sku") {
      setNewProduct({ ...newProduct, sku: value });
      return;
    }

    if (key === "stock") {
      setNewProduct({ ...newProduct, stock: parseInt(value, 10) || 0 });
      return;
    }

    const numericValue = parseFloat(value) || 0;

    if (key === "compare_at_price") {
      const discountedPrice =
        newProduct.discount_percent > 0
          ? numericValue - numericValue * (newProduct.discount_percent / 100)
          : numericValue;
      setNewProduct({
        ...newProduct,
        compare_at_price: numericValue,
        price: Number(discountedPrice.toFixed(2)) || 0,
      });
      return;
    }

    if (key === "discount_percent") {
      const cappedDiscount = Math.min(Math.max(numericValue, 0), 100);
      const discountedPrice =
        newProduct.compare_at_price > 0
          ? newProduct.compare_at_price - newProduct.compare_at_price * (cappedDiscount / 100)
          : newProduct.price;
      setNewProduct({
        ...newProduct,
        discount_percent: cappedDiscount,
        price: Number(discountedPrice.toFixed(2)) || 0,
      });
      return;
    }

    if (key === "shipping_cost") {
      setNewProduct({ ...newProduct, shipping_cost: numericValue });
      return;
    }

    if (key === "price") {
      setNewProduct({ ...newProduct, price: numericValue });
    }
  };

  const getProductFieldValue = (key: string) => {
    if (key === "sku") return newProduct.sku;
    const value = newProduct[key as keyof NewProductDraft];
    return typeof value === "number" && value > 0 ? String(value) : "";
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setNewProduct({ ...newProduct, image_url: result });
    };
    reader.readAsDataURL(file);
  };

  const canGoNext = selectedCategoryPath.length > 0 && !!newProduct.category_id && !!imagePreview;

  return (
    <div className="w-[min(96vw,92rem)] border border-ink bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Add Single Catalog
          </div>
          <h3 className="font-display text-2xl">
            {step === "media" ? "Product Type & Image" : "Product, Size and Inventory"}
          </h3>
        </div>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-ink">
          <X className="h-5 w-5" />
        </button>
      </div>

      {step === "media" ? (
        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5">
            <CategoryColumnPicker
              categories={categories}
              selectedPath={selectedCategoryPath}
              onSelectPath={(path) => {
                setSelectedCategoryPath(path);
                setNewProduct({
                  ...newProduct,
                  category_id: findMeeshoCategoryId(path, categories),
                });
              }}
              storeCategoryId={newProduct.category_id}
            />

            <div className="border border-border bg-muted/10 p-4">
              <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Product Image
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 border border-border bg-background p-4 text-sm transition-all hover:border-ink">
                  <Upload className="h-5 w-5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </label>
                <label className="relative block">
                  <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={newProduct.image_url.startsWith("data:") ? "" : newProduct.image_url}
                    onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                    placeholder="Paste image link"
                    className="h-full min-h-14 w-full border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-ink"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="border border-border px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:border-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep("details")}
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="border border-border bg-background">
            <div className="border-b border-border bg-[#dde3ed] px-4 py-3 text-center text-xs font-medium">
              {selectedCategoryPath.length
                ? selectedCategoryPath.join(" / ")
                : "Choose a final product category"}
            </div>
            <div className="p-5">
              <div className="flex aspect-[4/5] items-center justify-center border border-dashed border-border bg-muted/20">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center text-xs text-muted-foreground">
                    <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                    Front Image
                  </div>
                )}
              </div>
              <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-800">
                Follow image guidelines to reduce quality check failure.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(event) => onSubmit(event, catalogDetails)}
          className="space-y-5 p-5 text-xs"
        >
          <div className="border-b border-border pb-2 font-medium text-[#7f1d1d]">
            {selectedCategoryPath.join(" / ")}
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {catalogSchema.title}
          </div>

          {catalogSchema.sections.map((section, sectionIndex) => (
            <div key={`${section.title ?? "section"}-${sectionIndex}`} className="space-y-3">
              {section.title && (
                <div className="border-b border-border pb-2 pt-2 font-medium">{section.title}</div>
              )}
              <div className="grid gap-x-10 gap-y-3 lg:grid-cols-2">
                {section.fields.map((id) => (
                  <Fragment key={id}>
                    <CatalogInput
                      id={id}
                      type={
                        id === "netWeight" || (productFieldIds.includes(id) && id !== "sku")
                          ? "number"
                          : "text"
                      }
                      value={
                        id === "productName"
                          ? newProduct.name || catalogDetails.productName
                          : productFieldIds.includes(id)
                            ? getProductFieldValue(id)
                            : id === "brand"
                              ? newProduct.brand
                              : catalogDetails[id]
                      }
                      onChange={(value) =>
                        productFieldIds.includes(id)
                          ? updateProductField(id, value)
                          : updateCatalogDetail(id, value)
                      }
                      required={catalogSchema.requiredFields.includes(id)}
                      optionsOverride={
                        id === "genericName"
                          ? getGenericNameOptions(selectedCategoryPath)
                          : undefined
                      }
                      placeholder={
                        id === "styleCode"
                          ? "Enter Style code/Product ID (optional)"
                          : id === "discount_percent"
                            ? "Enter Discount %"
                            : `Enter ${catalogFieldLabels[id] ?? id}`
                      }
                    />
                    {id === "packerName" && (
                      <label className="lg:col-start-1 lg:ml-[10.25rem] flex items-center gap-2 text-[11px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={sameAsManufacturer}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSameAsManufacturer(checked);
                            if (checked) {
                              setCatalogDetails((current) => ({
                                ...current,
                                packerName: current.manufacturerName,
                                packerAddress: current.manufacturerAddress,
                                packerPincode: current.manufacturerPincode,
                              }));
                            }
                          }}
                          className="h-4 w-4 accent-ink"
                        />
                        Same as Manufacturer Details
                      </label>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep("media")}
              className="inline-flex items-center justify-center gap-2 border border-border px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:border-ink"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="border border-border px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:border-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-widest text-primary-foreground hover:opacity-90"
              >
                Save Product
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Queries
  const fetchOrders = useServerFn(listMyOrders);
  const fetchProducts = useServerFn(listProducts);
  const fetchCategories = useServerFn(listCategories);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
    enabled: !!user,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products", {}],
    queryFn: () => fetchProducts({ data: {} }),
    enabled: !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
    enabled: !!user,
  });

  // Server functions
  const updateStatus = useServerFn(adminUpdateOrderStatus);
  const editProduct = useServerFn(adminUpdateProduct);
  const removeProduct = useServerFn(adminRemoveProduct);
  const addProduct = useServerFn(adminAddProduct);

  // Component State
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Inline editing product ID
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    price: 0,
    stock: 0,
    brand: "Sheetal",
    is_featured: false,
    image_url: "",
  });

  // Add Product Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState(emptyNewProduct);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<string[]>([]);
  const [inventorySortKey, setInventorySortKey] = useState<InventorySortKey>("category");
  const [inventorySortDirection, setInventorySortDirection] = useState<SortDirection>("asc");
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("all");
  const [inventoryCategorySearch, setInventoryCategorySearch] = useState("");
  const [inventoryCategoryDropdownOpen, setInventoryCategoryDropdownOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Analytics Calculations
  const analytics = useMemo(() => {
    if (!orders || !products) return { revenue: 0, ordersCount: 0, lowStock: 0, avgValue: 0 };

    const completedRevenue = orders
      .filter((o: any) => ["paid", "shipped", "delivered"].includes(o.status))
      .reduce((sum: number, o: any) => sum + Number(o.total), 0);

    const lowStockCount = products.filter((p: any) => p.stock < 10).length;

    const avgVal = orders.length > 0 ? completedRevenue / orders.length : 0;

    return {
      revenue: completedRevenue,
      ordersCount: orders.length,
      lowStock: lowStockCount,
      avgValue: avgVal,
    };
  }, [orders, products]);

  const inventoryGroups = useMemo(() => {
    if (!products?.length) return [];

    const filteredProducts =
      inventoryCategoryFilter === "all"
        ? products
        : products.filter((product: any) =>
            inventoryCategoryFilter === "uncategorized"
              ? !product.category_id
              : product.category_id === inventoryCategoryFilter,
          );

    const sorted = [...filteredProducts].sort((a: any, b: any) => {
      const categoryA = a.categories;
      const categoryB = b.categories;
      const orderA = Number(categoryA?.sort_order ?? 999);
      const orderB = Number(categoryB?.sort_order ?? 999);
      const categoryNameA = String(categoryA?.name ?? "Uncategorized");
      const categoryNameB = String(categoryB?.name ?? "Uncategorized");
      const direction = inventorySortDirection === "asc" ? 1 : -1;

      if (inventorySortKey === "category") {
        if (orderA !== orderB) return (orderA - orderB) * direction;

        const categoryCompare = categoryNameA.localeCompare(categoryNameB) * direction;
        if (categoryCompare !== 0) return categoryCompare;

        return String(a.name ?? "").localeCompare(String(b.name ?? ""));
      }

      if (orderA !== orderB) return orderA - orderB;

      const categoryCompare = categoryNameA.localeCompare(categoryNameB);
      if (categoryCompare !== 0) return categoryCompare;

      if (inventorySortKey === "price") {
        return (Number(a.price ?? 0) - Number(b.price ?? 0)) * direction;
      }

      if (inventorySortKey === "stock") {
        return (Number(a.stock ?? 0) - Number(b.stock ?? 0)) * direction;
      }

      return String(a.name ?? "").localeCompare(String(b.name ?? "")) * direction;
    });

    return sorted.reduce(
      (groups: Array<{ id: string; name: string; products: any[] }>, product: any) => {
        const category = product.categories;
        const categoryId = category?.id ?? "uncategorized";
        const categoryName = category?.description || category?.name || "Uncategorized";
        const existing = groups.find((group) => group.id === categoryId);

        if (existing) {
          existing.products.push(product);
        } else {
          groups.push({ id: categoryId, name: categoryName, products: [product] });
        }

        return groups;
      },
      [],
    );
  }, [inventoryCategoryFilter, inventorySortDirection, inventorySortKey, products]);

  const inventoryCategoryOptions = useMemo(() => {
    const categoryOptions =
      categories?.map((cat: any) => ({
        id: cat.id,
        label: cat.description || cat.name,
        searchText: `${cat.description || ""} ${cat.name || ""}`.toLowerCase(),
      })) ?? [];

    return [
      { id: "all", label: "All Categories", searchText: "all categories" },
      ...categoryOptions,
      { id: "uncategorized", label: "Uncategorized", searchText: "uncategorized" },
    ];
  }, [categories]);

  const selectedInventoryCategory =
    inventoryCategoryOptions.find((option) => option.id === inventoryCategoryFilter)?.label ??
    "All Categories";

  const filteredInventoryCategoryOptions = useMemo(() => {
    const query = inventoryCategorySearch.trim().toLowerCase();
    if (!query) return inventoryCategoryOptions.slice(0, 40);

    return inventoryCategoryOptions
      .filter((option) => option.searchText.includes(query))
      .slice(0, 40);
  }, [inventoryCategoryOptions, inventoryCategorySearch]);

  // Edit product handler
  const handleEditClick = (p: any) => {
    setEditingProductId(p.id);
    setEditForm({
      name: p.name,
      sku: p.sku ?? `SH-${p.id}`,
      price: Number(p.price),
      stock: p.stock,
      brand: p.brand ?? "Sheetal",
      is_featured: !!p.is_featured,
      image_url: Array.isArray(p.images) && typeof p.images[0] === "string" ? p.images[0] : "",
    });
  };

  const handleEditSave = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      await editProduct({ data: { id, ...editForm } });
      toast.success("Product updated successfully");
      setEditingProductId(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    }
  };

  const handleRemoveProduct = async (id: string, name: string) => {
    const ok = window.confirm(`Remove "${name}" from the catalog?`);
    if (!ok) return;

    try {
      await removeProduct({ data: { id } });
      toast.success("Product removed from catalog");
      if (editingProductId === id) setEditingProductId(null);
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to remove product");
    }
  };

  // Add Product Submit
  const handleAddProductSubmit = async (e: React.FormEvent, catalogDetails?: CatalogDetails) => {
    e.preventDefault();
    if (!newProduct.category_id) {
      toast.error(
        selectedCategoryPath.length
          ? "Selected Meesho category is not in the database yet"
          : "Please select a final category",
      );
      return;
    }
    try {
      // Auto-generate slug from name if empty
      const slug =
        newProduct.slug.trim() || newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const formattedCatalogDetails = formatCatalogDetails(catalogDetails);
      const formattedPricingDetails = formatProductPricingDetails(newProduct);
      const selectedSchema = getCatalogSchema(selectedCategoryPath);
      const shortDescription =
        newProduct.short_description.trim() ||
        [
          selectedSchema.title,
          catalogDetails?.fabric,
          catalogDetails?.material,
          catalogDetails?.fitShape,
          catalogDetails?.color,
          catalogDetails?.neck,
          catalogDetails?.sleeveLength,
          catalogDetails?.capacity,
          catalogDetails?.warranty,
        ]
          .filter(Boolean)
          .join(" | ") ||
        selectedCategoryPath.at(-1) ||
        "Catalog product";
      const description =
        newProduct.description.trim() ||
        [catalogDetails?.description, formattedPricingDetails, formattedCatalogDetails]
          .filter(Boolean)
          .join("\n\n");
      const {
        discount_percent: _discountPercent,
        shipping_cost: _shippingCost,
        ...productData
      } = newProduct;

      await addProduct({
        data: {
          ...productData,
          slug,
          short_description: shortDescription,
          description,
          brand: newProduct.brand || catalogDetails?.brand || "Sheetal",
          image_url: newProduct.image_url || undefined,
        },
      });
      toast.success("Product added to master catalog");
      setShowAddForm(false);
      setNewProduct(emptyNewProduct);
      setSelectedCategoryPath([]);
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to add product");
    }
  };

  // Status Change Handler
  const handleStatusChange = async (orderId: string, nextStatus: string) => {
    try {
      await updateStatus({ data: { id: orderId, status: nextStatus } });
      toast.success(`Order status updated to ${statusLabels[nextStatus] ?? nextStatus}`);
      qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  if (ordersLoading || productsLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Header />
        <div className="flex flex-1 items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-ink" />
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Loading admin dashboard...
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-muted/5">
      <Header />
      <div className="mx-auto max-w-7xl w-full px-6 py-12 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Console</div>
            <h1 className="font-display text-5xl mt-1">Admin Dashboard</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
                activeTab === "overview"
                  ? "bg-ink text-primary-foreground border-ink"
                  : "border-border hover:border-ink"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
                activeTab === "orders"
                  ? "bg-ink text-primary-foreground border-ink"
                  : "border-border hover:border-ink"
              }`}
            >
              Orders ({orders?.length ?? 0})
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
                activeTab === "inventory"
                  ? "bg-ink text-primary-foreground border-ink"
                  : "border-border hover:border-ink"
              }`}
            >
              Inventory ({products?.length ?? 0})
            </button>
          </div>
        </div>

        {/* Tab 1: Overview Panel */}
        {activeTab === "overview" && (
          <div className="mt-10 space-y-10">
            {/* Metric widgets */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-border bg-background p-6 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-xs uppercase tracking-widest font-medium">Revenue</span>
                  <DollarSign className="h-4 w-4" />
                </div>
                <div className="font-display text-3xl font-semibold">
                  {formatPrice(analytics.revenue)}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  From paid, shipped, and delivered orders
                </p>
              </div>

              <div className="border border-border bg-background p-6 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-xs uppercase tracking-widest font-medium">Orders</span>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="font-display text-3xl font-semibold">{analytics.ordersCount}</div>
                <p className="text-[10px] text-muted-foreground">Total order transaction volume</p>
              </div>

              <div className="border border-border bg-background p-6 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-xs uppercase tracking-widest font-medium">
                    Avg Order Value
                  </span>
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="font-display text-3xl font-semibold">
                  {formatPrice(analytics.avgValue)}
                </div>
                <p className="text-[10px] text-muted-foreground">Average transaction ticket size</p>
              </div>

              <div className="border border-border bg-background p-6 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span className="text-xs uppercase tracking-widest font-medium">
                    Low Stock Alerts
                  </span>
                  <AlertTriangle
                    className={`h-4 w-4 ${analytics.lowStock > 0 ? "text-amber-600" : ""}`}
                  />
                </div>
                <div
                  className={`font-display text-3xl font-semibold ${analytics.lowStock > 0 ? "text-amber-600" : ""}`}
                >
                  {analytics.lowStock}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Products with stock under 10 pieces
                </p>
              </div>
            </div>

            {/* Quick Summary Panels */}
            <div className="grid gap-8 md:grid-cols-2">
              <div className="border border-border bg-background p-6">
                <h3 className="font-display text-xl mb-4">Recent Transactions</h3>
                <div className="divide-y divide-border text-sm">
                  {orders?.slice(0, 5).map((o: any) => (
                    <div key={o.id} className="py-3 flex justify-between items-center">
                      <div>
                        <div className="font-mono font-medium">{o.order_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateIST(o.created_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase font-medium">{o.status}</span>
                        <span className="font-medium font-mono">{formatPrice(o.total)}</span>
                      </div>
                    </div>
                  ))}
                  {(!orders || orders.length === 0) && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No recent transactions logs.
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-border bg-background p-6">
                <h3 className="font-display text-xl mb-4">Low Stock Warning items</h3>
                <div className="divide-y divide-border text-sm">
                  {products
                    ?.filter((p: any) => p.stock < 10)
                    .slice(0, 5)
                    .map((p: any) => (
                      <div key={p.id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-muted overflow-hidden">
                            {p.images?.[0] && (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {p.sku}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-amber-600 uppercase">
                            {p.stock} left
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {formatPrice(p.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  {products?.filter((p: any) => p.stock < 10).length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      All inventory products healthy!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Orders Panel */}
        {activeTab === "orders" && (
          <div className="mt-10">
            <div className="border border-border bg-background overflow-hidden">
              <div className="p-4 border-b border-border font-display text-xl bg-muted/10">
                Orders Registry
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="p-4">Order Ref</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {orders?.map((o: any) => {
                      const isExpanded = expandedOrderId === o.id;
                      const addr = o.shipping_address as any;
                      return (
                        <>
                          <tr key={o.id} className="hover:bg-muted/10 transition-colors">
                            <td className="p-4 font-mono font-medium">{o.order_number}</td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {formatDateTimeIST(o.created_at)}
                            </td>
                            <td className="p-4 font-medium">{addr?.full_name || "N/A"}</td>
                            <td className="p-4 font-mono font-medium">{formatPrice(o.total)}</td>
                            <td className="p-4 text-xs uppercase font-semibold text-muted-foreground">
                              {o.payment_type === "cod" ? "COD" : "Online"}
                            </td>
                            <td className="p-4">
                              <select
                                value={o.status}
                                onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                className={`text-xs border outline-none px-2 py-1 uppercase font-semibold ${
                                  o.status === "paid"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : o.status === "shipped"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : o.status === "delivered"
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : o.status === "cancelled"
                                          ? "bg-red-50 text-red-700 border-red-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-ink inline-flex items-center gap-1 border border-border px-2.5 py-1.5 hover:border-ink transition-all"
                              >
                                <span>Details</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Rows details */}
                          {isExpanded && (
                            <tr className="bg-muted/10">
                              <td colSpan={7} className="p-6">
                                <div className="grid gap-6 md:grid-cols-2 text-xs">
                                  <div className="space-y-2">
                                    <div className="uppercase tracking-widest text-muted-foreground font-semibold text-[10px]">
                                      Shipping Information
                                    </div>
                                    {addr ? (
                                      <div className="space-y-1 text-muted-foreground">
                                        <div className="font-semibold text-ink">
                                          {addr.full_name}
                                        </div>
                                        <div>
                                          {addr.line1}
                                          {addr.line2 ? `, ${addr.line2}` : ""}
                                        </div>
                                        <div>
                                          {addr.city}, {addr.state} {addr.postal_code}
                                        </div>
                                        <div>{addr.country}</div>
                                        {addr.phone && (
                                          <div className="pt-1 font-mono">{addr.phone}</div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground italic">
                                        No shipping details provided.
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <div className="uppercase tracking-widest text-muted-foreground font-semibold text-[10px]">
                                      Billing Summary
                                    </div>
                                    <div className="space-y-1.5 text-muted-foreground">
                                      <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-mono">{formatPrice(o.subtotal)}</span>
                                      </div>
                                      {o.discount > 0 && (
                                        <div className="flex justify-between">
                                          <span>Discount:</span>
                                          <span className="font-mono">
                                            -{formatPrice(o.discount)}
                                          </span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span>Shipping:</span>
                                        <span className="font-mono">{formatPrice(o.shipping)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span className="font-mono">{formatPrice(o.tax)}</span>
                                      </div>
                                      <div className="border-t border-border/60 pt-1.5 flex justify-between font-semibold text-ink">
                                        <span>Total:</span>
                                        <span className="font-mono">{formatPrice(o.total)}</span>
                                      </div>
                                    </div>
                                    {o.payment_reference && (
                                      <div className="pt-2 font-mono text-[9px] text-muted-foreground flex justify-between">
                                        <span>Gateway Ref ID:</span>
                                        <span>{o.payment_reference}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                    {(!orders || orders.length === 0) && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No orders in register yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Inventory Panel */}
        {activeTab === "inventory" && (
          <div className="mt-10 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-2xl">Inventory Catalog</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-ink px-4 py-2.5 text-xs uppercase tracking-widest text-primary-foreground flex items-center gap-1.5 font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Inline editing overlay/dialog for Add Product */}
            {showAddForm && (
              <CatalogAddWizard
                categories={categories}
                newProduct={newProduct}
                setNewProduct={setNewProduct}
                selectedCategoryPath={selectedCategoryPath}
                setSelectedCategoryPath={setSelectedCategoryPath}
                onClose={() => setShowAddForm(false)}
                onSubmit={handleAddProductSubmit}
              />
            )}

            {/* Inventory Listing */}
            <div className="border border-border bg-background overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-border bg-muted/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-display text-xl font-semibold">Product Catalog</div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex min-w-[280px] items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Category
                    </span>
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={inventoryCategorySearch}
                        onChange={(e) => {
                          setInventoryCategorySearch(e.target.value);
                          setInventoryCategoryDropdownOpen(true);
                        }}
                        onFocus={() => setInventoryCategoryDropdownOpen(true)}
                        onBlur={() =>
                          window.setTimeout(() => setInventoryCategoryDropdownOpen(false), 120)
                        }
                        placeholder={selectedInventoryCategory}
                        className="h-8 w-full border border-border bg-background pl-9 pr-8 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground outline-none transition-all hover:border-ink focus:border-ink"
                      />
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      {inventoryCategoryDropdownOpen && (
                        <div className="absolute left-0 top-full z-30 mt-1 max-h-72 w-full overflow-auto border border-border bg-background shadow-lg">
                          {filteredInventoryCategoryOptions.length ? (
                            filteredInventoryCategoryOptions.map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setInventoryCategoryFilter(option.id);
                                  setInventoryCategorySearch("");
                                  setInventoryCategoryDropdownOpen(false);
                                }}
                                className={`block w-full px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-widest transition-colors ${
                                  inventoryCategoryFilter === option.id
                                    ? "bg-ink text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-ink"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              No category found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Sort
                    </span>
                    {[
                      { key: "category", label: "Category" },
                      { key: "name", label: "Name" },
                      { key: "price", label: "Price" },
                      { key: "stock", label: "Stock" },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setInventorySortKey(option.key as InventorySortKey)}
                        className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest transition-all ${
                          inventorySortKey === option.key
                            ? "border-ink bg-ink text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-ink hover:text-ink"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setInventorySortDirection((current) => (current === "asc" ? "desc" : "asc"))
                      }
                      className="inline-flex items-center gap-1 border border-border bg-background px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-all hover:border-ink hover:text-ink"
                      title="Toggle sort direction"
                    >
                      <ArrowUpDown className="h-3 w-3" />
                      {inventorySortDirection === "asc" ? "Asc" : "Desc"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="p-4">Product Info</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Brand</th>
                      <th className="p-4">Featured</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {inventoryGroups.map((group) => (
                      <Fragment key={group.id}>
                        <tr className="bg-muted/20">
                          <td
                            colSpan={8}
                            className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                          >
                            {group.name} ({group.products.length})
                          </td>
                        </tr>
                        {group.products.map((p: any) => {
                          const isEditing = editingProductId === p.id;
                          return (
                            <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-9 bg-muted overflow-hidden">
                                    {(isEditing ? editForm.image_url : p.images?.[0]) && (
                                      <img
                                        src={isEditing ? editForm.image_url : p.images[0]}
                                        alt={p.name}
                                        className="h-full w-full object-cover"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    {isEditing ? (
                                      <input
                                        value={editForm.name}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, name: e.target.value })
                                        }
                                        className="border border-border px-2 py-1 text-sm bg-background w-48 font-medium"
                                      />
                                    ) : (
                                      <div className="font-semibold">{p.name}</div>
                                    )}
                                    <div className="text-[10px] text-muted-foreground uppercase">
                                      {p.slug}
                                    </div>
                                    {isEditing && (
                                      <input
                                        value={editForm.image_url}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, image_url: e.target.value })
                                        }
                                        placeholder="Image URL"
                                        className="mt-2 w-64 border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ink"
                                      />
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="border border-border bg-muted/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                  {p.categories?.description ||
                                    p.categories?.name ||
                                    "Uncategorized"}
                                </span>
                              </td>
                              <td className="p-4 font-mono">
                                {isEditing ? (
                                  <input
                                    value={editForm.sku}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, sku: e.target.value })
                                    }
                                    className="border border-border px-2 py-1 text-sm bg-background font-mono w-24"
                                  />
                                ) : (
                                  (p.sku ?? `SH-${p.id}`)
                                )}
                              </td>
                              <td className="p-4 font-mono">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.price || ""}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        price: parseFloat(e.target.value) || 0,
                                      })
                                    }
                                    className="border border-border px-2 py-1 text-sm bg-background font-mono w-20"
                                  />
                                ) : (
                                  formatPrice(p.price)
                                )}
                              </td>
                              <td className="p-4">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editForm.stock ?? ""}
                                    onChange={(e) =>
                                      setEditForm({
                                        ...editForm,
                                        stock: parseInt(e.target.value, 10) ?? 0,
                                      })
                                    }
                                    className="border border-border px-2 py-1 text-sm bg-background font-mono w-16"
                                  />
                                ) : (
                                  <span
                                    className={`font-mono font-medium ${p.stock < 10 ? "text-amber-600 font-bold" : ""}`}
                                  >
                                    {p.stock} {p.stock < 10 && " (low)"}
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                {isEditing ? (
                                  <input
                                    value={editForm.brand}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, brand: e.target.value })
                                    }
                                    className="border border-border px-2 py-1 text-sm bg-background w-20"
                                  />
                                ) : (
                                  p.brand || "Sheetal"
                                )}
                              </td>
                              <td className="p-4">
                                {isEditing ? (
                                  <input
                                    type="checkbox"
                                    checked={editForm.is_featured}
                                    onChange={(e) =>
                                      setEditForm({ ...editForm, is_featured: e.target.checked })
                                    }
                                    className="h-4 w-4 accent-ink"
                                  />
                                ) : p.is_featured ? (
                                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5">
                                    YES
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No</span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                {isEditing ? (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={(e) => handleEditSave(e, p.id)}
                                      className="border border-ink bg-ink text-primary-foreground p-1.5 rounded transition-opacity hover:opacity-90"
                                      title="Save"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingProductId(null)}
                                      className="border border-border p-1.5 rounded hover:border-ink transition-all"
                                      title="Cancel"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleEditClick(p)}
                                      className="text-xs uppercase tracking-widest text-muted-foreground hover:text-ink inline-flex items-center gap-1 border border-border px-2.5 py-1.5 hover:border-ink transition-all"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleRemoveProduct(p.id, p.name)}
                                      className="text-xs uppercase tracking-widest text-red-700 hover:text-red-800 inline-flex items-center gap-1 border border-red-200 px-2.5 py-1.5 hover:border-red-500 transition-all"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Remove</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                    {inventoryGroups.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          No products in catalog yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
