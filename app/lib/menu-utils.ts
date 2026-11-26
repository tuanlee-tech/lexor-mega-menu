import type {
  MegaColumn,
  MegaItem,
  MegaItemType,
  MenuPreset,
  MenuStyleSettings,
  MobileDrawerSettings,
  ScheduleConfig,
  TopLevelItem,
} from "../types/menu";

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function createDefaultStyleSettings(): MenuStyleSettings {
  return {
    inheritThemeCss: false,
    fontFamily: "'Gotham', sans-serif",
    dropdownBgColor: "#FFFFFF",
    tabHoverBgColor: "#333333",
    headingColor: "#8C1B11",
    itemTitleColor: "#333333",
    itemLinkColor: "#4B4B4B",
    dividerColor: "#C6C6C6",
    imageSizePx: 128,
    customCss: "",
  };
}

export function createDefaultMobileSettings(): MobileDrawerSettings {
  return {
    showAccountLink: true,
    showPhoneButton: true,
    phoneDisplay: "(866) 733-4772",
    phoneHref: "tel:8667334772",
    phoneBgColor: "#8C1B11",
  };
}

export function createDefaultMegaItem(type: MegaItemType = "product"): MegaItem {
  const defaults: Record<MegaItemType, Partial<MegaItem>> = {
    product: { title: "New Product", url: "/products", btnText: "Order" },
    collection: { title: "New Collection", url: "/collections", btnText: "Order" },
    page: { title: "Featured Page", url: "/pages", btnText: "Learn more" },
    button: { title: "Shop All", url: "/collections/all", btnText: "Shop All", buttonBgColor: "#8C1B11" },
    text_link: { title: "Text Link", url: "/" },
  };
  const d = defaults[type];
  return {
    id: uid("item"),
    type,
    title: d.title || "Item",
    url: d.url || "/",
    btnText: d.btnText || "",
    buttonBgColor: d.buttonBgColor,
    visibility: "all",
    schedule: { enabled: false },
    badge: null,
  };
}

export function createDefaultColumn(index = 0): MegaColumn {
  return {
    id: uid("col"),
    heading: `Column ${index + 1}`,
    showHeading: false,
    flexRatio: index === 0 ? 1.8 : 1,
    desktopCols: index === 0 ? 4 : 2,
    mobileCols: index === 0 ? 2 : 2,
    align: "center",
    visibility: "all",
    items: [],
  };
}

export function createDefaultTopLevelItem(
  type: TopLevelItem["type"] = "mega_menu"
): TopLevelItem {
  return {
    id: uid("tab"),
    type,
    title: type === "simple_link" ? "PROMOTION" : "NEW MENU",
    url: type === "simple_link" ? "/collections/all" : "#",
    visibility: "all",
    schedule: { enabled: false },
    badge: null,
    columns: type === "mega_menu" ? [createDefaultColumn(0)] : [],
    dropdownLinks: [],
  };
}

export function createBlankPreset(name = "Main Menu"): MenuPreset {
  const now = new Date().toISOString();
  return {
    id: uid("menu"),
    name,
    status: "DRAFT",
    isDefault: false,
    schedule: { enabled: false },
    items: [
      {
        ...createDefaultTopLevelItem("simple_link"),
        title: "BLACK FRIDAY DEAL",
        url: "/collections/sale",
        highlightColor: "#D93829",
      },
      {
        ...createDefaultTopLevelItem("mega_menu"),
        title: "PEDICURE CHAIRS",
        columns: [
          {
            ...createDefaultColumn(0),
            flexRatio: 1.8,
            desktopCols: 4,
            mobileCols: 2,
            items: [
              createDefaultMegaItem("product"),
              createDefaultMegaItem("button"),
            ],
          },
          {
            ...createDefaultColumn(1),
            flexRatio: 1,
            desktopCols: 2,
            mobileCols: 2,
            items: [createDefaultMegaItem("collection")],
          },
        ],
      },
    ],
    mobileSettings: createDefaultMobileSettings(),
    createdAt: now,
    updatedAt: now,
  };
}

export function createLexorDemoPreset(name = "Lexor Demo Menu"): MenuPreset {
  const now = new Date().toISOString();
  return {
    id: uid("menu"),
    name,
    status: "DRAFT",
    isDefault: false,
    schedule: { enabled: false },
    items: [
      {
        ...createDefaultTopLevelItem("simple_link"),
        title: "BLACK FRIDAY DEAL",
        url: "/collections/black-friday",
        highlightColor: "#D93829",
      },
      {
        ...createDefaultTopLevelItem("mega_menu"),
        title: "PEDICURE CHAIRS",
        columns: [
          {
            ...createDefaultColumn(0),
            heading: "Pedicure Chairs",
            showHeading: false,
            flexRatio: 1.8,
            desktopCols: 4,
            mobileCols: 2,
            items: [
              { ...createDefaultMegaItem("product"), title: "Privé Lounge", url: "/products/prive-lounge", btnText: "Order" },
              { ...createDefaultMegaItem("product"), title: "Mystique", url: "/products/mystique", btnText: "Order" },
              { ...createDefaultMegaItem("product"), title: "Elite", url: "/products/elite", btnText: "Order" },
              { ...createDefaultMegaItem("product"), title: "Liberté", url: "/products/liberte", btnText: "Order" },
              { ...createDefaultMegaItem("product"), title: "Luminous", url: "/products/luminous", btnText: "Order" },
              { ...createDefaultMegaItem("product"), title: "Infinity", url: "/products/infinity", btnText: "Order" },
              { ...createDefaultMegaItem("button"), title: "Shop All", btnText: "Shop All", url: "/collections/pedicure-chairs", buttonBgColor: "#8C1B11" },
            ],
          },
          {
            ...createDefaultColumn(1),
            heading: "Parts & Accessories",
            showHeading: false,
            flexRatio: 1,
            desktopCols: 2,
            mobileCols: 2,
            items: [
              { ...createDefaultMegaItem("collection"), title: "Spa Jets", url: "/collections/spa-jets", btnText: "Order" },
              { ...createDefaultMegaItem("collection"), title: "Parts", url: "/collections/parts", btnText: "Order" },
              { ...createDefaultMegaItem("collection"), title: "Accessories", url: "/collections/accessories", btnText: "Order" },
            ],
          },
          {
            ...createDefaultColumn(2),
            heading: "Special Features",
            showHeading: false,
            flexRatio: 1,
            desktopCols: 1,
            mobileCols: 1,
            items: [
              { ...createDefaultMegaItem("page"), title: "Special Features", url: "/pages/special-features", btnText: "Learn more" },
            ],
          },
        ],
      },
      {
        ...createDefaultTopLevelItem("mega_menu"),
        title: "SALON FURNITURE",
        columns: [
          {
            ...createDefaultColumn(0),
            flexRatio: 1.5,
            desktopCols: 3,
            mobileCols: 2,
            items: [
              { ...createDefaultMegaItem("collection"), title: "Manicure Tables", url: "/collections/manicure-tables", btnText: "Order" },
              { ...createDefaultMegaItem("collection"), title: "Reception Desks", url: "/collections/reception-desks", btnText: "Order" },
              { ...createDefaultMegaItem("collection"), title: "Stools & Carts", url: "/collections/stools-carts", btnText: "Order" },
            ],
          },
        ],
      },
      {
        ...createDefaultTopLevelItem("dropdown"),
        title: "PROMOTIONS & FINANCE",
        dropdownLinks: [
          { id: uid("dd"), title: "Product Promotions", url: "/pages/promotions", children: [] },
          { id: uid("dd"), title: "Financing", url: "/pages/financing", children: [] },
        ],
      },
      {
        ...createDefaultTopLevelItem("simple_link"),
        title: "ABOUT US",
        url: "/pages/about-us",
      },
      {
        ...createDefaultTopLevelItem("dropdown"),
        title: "DISCOVER",
        dropdownLinks: [
          { id: uid("dd"), title: "Showrooms", url: "/pages/showrooms", children: [] },
          { id: uid("dd"), title: "Lexor Blog", url: "/blogs/news", children: [] },
        ],
      },
    ],
    mobileSettings: createDefaultMobileSettings(),
    createdAt: now,
    updatedAt: now,
  };
}

export function isScheduleActive(
  schedule?: ScheduleConfig,
  now: Date = new Date()
): boolean {
  if (!schedule || !schedule.enabled) return true;
  const t = now.getTime();
  if (schedule.startAt) {
    const s = Date.parse(schedule.startAt);
    if (!Number.isNaN(s) && t < s) return false;
  }
  if (schedule.endAt) {
    const e = Date.parse(schedule.endAt);
    if (!Number.isNaN(e) && t > e) return false;
  }
  return true;
}
