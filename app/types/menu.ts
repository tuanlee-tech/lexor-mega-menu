export type DeviceVisibility = "all" | "desktop" | "mobile";

export interface ScheduleConfig {
  enabled: boolean;
  startAt?: string; // ISO or YYYY-MM-DDTHH:mm
  endAt?: string;
}

export interface BadgeConfig {
  text: string;
  bgColor: string;
  textColor: string;
}

export type MegaItemType =
  | "product"
  | "collection"
  | "page"
  | "button"
  | "text_link";

export interface MegaItem {
  id: string;
  type: MegaItemType;
  title: string;
  url: string;
  resourceId?: string;
  resourceHandle?: string;
  imageUrl?: string;
  imageFilename?: string; // fallback for Shopify file_url if imported from legacy pattern
  btnText?: string;
  buttonBgColor?: string;
  badge?: BadgeConfig | null;
  visibility: DeviceVisibility;
  schedule?: ScheduleConfig;
}

export interface MegaColumn {
  id: string;
  heading: string;
  showHeading: boolean;
  flexRatio: number;
  desktopCols: number;
  mobileCols: number;
  align: "left" | "center" | "right";
  visibility: DeviceVisibility;
  items: MegaItem[];
}

export interface DropdownChildLink {
  id: string;
  title: string;
  url: string;
}

export interface DropdownLink {
  id: string;
  title: string;
  url: string;
  badge?: BadgeConfig | null;
  children: DropdownChildLink[];
}

export type TopLevelItemType = "simple_link" | "mega_menu" | "dropdown";

export interface TopLevelItem {
  id: string;
  type: TopLevelItemType;
  title: string;
  url: string;
  highlightColor?: string;
  badge?: BadgeConfig | null;
  visibility: DeviceVisibility;
  schedule?: ScheduleConfig;
  columns: MegaColumn[];
  dropdownLinks: DropdownLink[];
}

export interface MobileDrawerSettings {
  showAccountLink: boolean;
  showPhoneButton: boolean;
  phoneDisplay: string;
  phoneHref: string;
  phoneBgColor: string;
}

export interface MenuStyleSettings {
  inheritThemeCss: boolean;
  fontFamily: string;
  dropdownBgColor: string;
  tabHoverBgColor: string;
  headingColor: string;
  itemTitleColor: string;
  itemLinkColor: string;
  dividerColor: string;
  imageSizePx: number;
  customCss: string;
}

export interface MenuPreset {
  id: string;
  name: string;
  status: "DRAFT" | "PUBLISHED";
  isDefault: boolean;
  schedule?: ScheduleConfig;
  items: TopLevelItem[];
  mobileSettings: MobileDrawerSettings;
  styleSettings?: MenuStyleSettings;
  createdAt: string;
  updatedAt: string;
}

export interface StorefrontActiveConfig {
  version: 1;
  updatedAt: string;
  defaultMenu: MenuPreset | null;
  scheduledMenus: MenuPreset[];
}
