import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "en" | "vi";

const STORAGE_KEY = "lexor_mega_menu_locale";

export const dictionary = {
  en: {
    // Common
    appName: "Lexor Mega Menu",
    appTagline: "Visual mega menu & mobile drawer builder powered by Shopify Metafields",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    edit: "Edit",
    duplicate: "Duplicate",
    search: "Search",
    loading: "Loading...",
    unsavedChanges: "Unsaved changes",
    saved: "All changes saved",
    desktop: "Desktop",
    mobile: "Mobile",
    bothDevices: "Desktop & Mobile",
    desktopOnly: "Desktop only",
    mobileOnly: "Mobile drawer only",

    // Status badges
    statusPublished: "Published",
    statusDraft: "Draft",
    badgeDefault: "Active Default",
    badgeScheduled: "Scheduled",

    // Dashboard
    dashboardCreateBtn: "Create Menu",
    dashboardDemoBtn: "Load Lexor Template",
    dashboardImportNavBtn: "Import from Navigation",
    dashboardImportJsonBtn: "Import JSON",
    dashboardThemeEditorBtn: "Theme App Embed",
    dashboardGuideTitle: "Quick setup — Zero theme code edits required",
    dashboardGuideStep1: "Create a menu, load the Lexor template, or import your existing Shopify Main Menu.",
    dashboardGuideStep2: "Customize columns, products, images, and preview Desktop & Mobile in real time, then click Publish.",
    dashboardGuideStep3: "Open Online Store → Themes → Customize → App embeds and toggle Lexor Mega Menu ON.",
    dashboardEmptyTitle: "Build your first Mega Menu",
    dashboardEmptyDesc: "Start with our pre-built Lexor 3-column layout, import your existing Shopify Navigation menu, or transfer a menu via JSON.",
    dashboardTabsCount: "top-level tabs",
    dashboardUpdated: "Updated",
    dashboardPublishDefault: "Set as Live Default",
    dashboardUnpublish: "Unpublish",
    dashboardExportJson: "Export JSON",
    dashboardCopyPresetId: "Copy Preset ID",
    dashboardCopyPresetIdToast: "Copied Preset ID! Paste it into Theme Editor (clone theme) → App embeds → Lexor Mega Menu → Override Menu Preset ID to test without affecting live.",
    dashboardDeleteTitle: "Delete menu preset?",
    dashboardDeleteDesc: "This permanently removes the menu preset. If it is currently published, your storefront will fall back to the default theme menu.",
    dashboardDeleteConfirm: "Delete menu",

    // Create Modal
    createModalTitle: "Create new menu",
    createModalConfirm: "Create & Open Editor",
    createModalNameLabel: "Menu name",
    createModalNamePlaceholder: "e.g. Default Storefront Menu, Black Friday 2026",

    // Import Navigation Modal
    importNavTitle: "Import from Shopify Navigation",
    importNavConfirm: "Import Menu",
    importNavLoading: "Loading Shopify navigation menus...",
    importNavDesc: "Automatically converts legacy [collection-parent], [collection-grid], [product], [collection], [page], and [button] patterns into visual cards and resolves product/file images.",
    importNavSelectLabel: "Source Shopify menu",
    importNavNameLabel: "New preset name",

    // Import JSON Modal
    importJsonTitle: "Import menu from JSON",
    importJsonConfirm: "Import JSON",
    importJsonDesc: "Paste the JSON exported from another store (e.g., staging/dev store) to replicate the complete menu structure and styling here.",
    importJsonLabel: "Menu JSON",

    // Editor Page
    editorBack: "All Menus",
    editorSaveDraft: "Save Draft",
    editorPublishNow: "Save & Publish",
    editorPublishScheduled: "Save & Schedule",
    editorStyleBtn: "Appearance & CSS",
    editorMobileBtn: "Mobile Drawer",
    editorPresetInfo: "Menu Settings",
    editorPresetName: "Menu name",
    editorPresetSchedule: "Schedule this menu preset to activate automatically during a date range",
    editorScheduleStart: "Start date & time",
    editorScheduleEnd: "End date & time",
    editorHeaderTabs: "Header Navigation",
    editorHeaderTabsHint: "Drag to reorder tabs. Click a tab to configure its layout.",
    editorAddTab: "Add Tab",

    // Tab Config
    tabConfigTitle: "Tab Configuration",
    tabDeleteBtn: "Delete Tab",
    tabLabel: "Display label",
    tabType: "Menu type",
    tabTypeMega: "Mega Menu (Multi-column grid & visual cards)",
    tabTypeSimple: "Direct Link (No dropdown)",
    tabTypeDropdown: "Standard Dropdown (Text links)",
    tabUrl: "Destination URL",
    tabHighlight: "Highlight text color",
    tabHighlightPlaceholder: "Default (#FFFFFF)",
    tabVisibility: "Device visibility",
    tabEnableBadge: "Show promotional badge (NEW / HOT / SALE)",
    tabEnableSchedule: "Schedule tab visibility",
    badgeText: "Badge text",
    badgeBg: "Background",
    badgeColor: "Text color",
    dropdownHeading: "Dropdown Links",
    dropdownAddLink: "Add Link",
    dropdownTitleLabel: "Link title",

    // Columns Editor
    columnsTitle: "Mega Menu Columns",
    columnsAdd: "Add Column",
    columnLabel: "Column",
    columnCollapse: "Collapse",
    columnExpand: "Expand",
    columnFlexRatio: "Width ratio",
    columnDesktopCols: "Desktop grid",
    columnMobileCols: "Mobile grid",
    columnAlign: "Alignment",
    alignCenter: "Center",
    alignLeft: "Left",
    alignRight: "Right",
    columnShowHeading: "Show column heading",
    columnHeadingPlaceholder: "e.g. Pedicure Collection",
    columnColsUnit: "cols",
    columnItemsUnit: "items",
    addProduct: "Product",
    addCollection: "Collection",
    addPage: "Page / Card",
    addButton: "CTA Button",
    addTextLink: "Text Link",

    // Item Modal
    itemModalTitle: "Configure Menu Item",
    itemModalSave: "Apply Item",
    itemTypeLabel: "Item type",
    itemTypeProduct: "Product Card",
    itemTypeCollection: "Collection Card",
    itemTypePage: "Page / Feature Card",
    itemTypeButton: "CTA Button (e.g. Shop All)",
    itemTypeText: "Plain Text Link",
    itemPickProduct: "Select Product from Shopify",
    itemPickCollection: "Select Collection from Shopify",
    itemPickPage: "Browse Shopify Pages",
    itemSelectPagePlaceholder: "— Quick-fill from Shopify Pages —",
    itemTitleLabel: "Display title",
    itemButtonTextLabel: "Button label",
    itemUrlLabel: "Link URL",
    itemSubLinkLabel: "Secondary action link (optional, e.g. Order / Learn more)",
    itemImageLabel: "Card image",
    itemPickFile: "Choose / Upload from Shopify Files",
    itemRemoveImage: "Remove image",
    itemButtonColorLabel: "Button background color (blank = Lexor gradient)",
    itemEnableSchedule: "Schedule item visibility",

    // File Picker Modal
    filePickerTitle: "Shopify Files Media Library",
    filePickerDropHint: "Drop an image here or click to upload directly to Shopify Files",
    filePickerUploading: "Uploading to Shopify Files...",
    filePickerSearchPlaceholder: "Search by filename or alt text...",
    filePickerLoadMore: "Load more images",

    // Mobile Settings Modal
    mobileModalTitle: "Mobile Drawer Utility Settings",
    mobileModalSave: "Save Settings",
    mobileShowAccount: "Show Account / Log In link at bottom of drawer",
    mobileShowPhone: "Show click-to-call button in mobile drawer",
    mobilePhoneDisplay: "Phone number display",
    mobilePhoneHref: "Call link (tel:...)",
    mobilePhoneBg: "Button background color",

    // Style Settings Modal
    styleModalTitle: "Appearance & Custom CSS",
    styleModalSave: "Apply Appearance",
    styleModalReset: "Reset to Lexor Defaults",
    styleModalBanner: "Keep 'Inherit Theme CSS' OFF on stock Dawn themes for the built-in Lexor design. On customized production themes, toggle it ON to reuse your theme's existing classes (.collection-parent__container, .collection-grid, etc.) and add Custom CSS overrides without re-deploying.",
    styleInheritLabel: "Inherit production theme CSS classes",
    styleTokensHeading: "Design Tokens (CSS Variables)",
    styleFontFamily: "Font family",
    styleImageSize: "Desktop card image size (px)",
    styleDropdownBg: "Dropdown background",
    styleTabHoverBg: "Active / Hover tab bg",
    styleDividerColor: "Column divider color",
    styleHeadingColor: "Column heading color",
    styleItemTitleColor: "Item title color",
    styleItemLinkColor: "Action link color",
    styleCustomCssLabel: "Custom CSS (applied live on Publish — no re-deploy needed)",

    // Live Preview
    previewTitle: "Live Preview",
    previewSubtitle: "Interactive storefront simulation — click tabs or mobile items to test.",
    previewScheduleToggle: "Simulate active schedules (current time)",
    previewNoColumns: "No columns configured yet. Add a column on the left to build this mega menu.",
    previewSimpleLinkNote: "Direct link to",
    previewSimpleLinkHint: "(no dropdown). Click a Mega Menu tab to preview its grid.",
    previewNoDropdown: "No dropdown links configured yet.",
  },
  vi: {
    // Common
    appName: "Lexor Mega Menu",
    appTagline: "Trình dựng Mega Menu & Mobile Drawer trực quan — lưu trữ chuẩn Shopify Metafields",
    save: "Lưu",
    cancel: "Huỷ",
    close: "Đóng",
    delete: "Xoá",
    edit: "Chỉnh sửa",
    duplicate: "Nhân bản",
    search: "Tìm kiếm",
    loading: "Đang tải...",
    unsavedChanges: "Chưa lưu thay đổi",
    saved: "Đã lưu",
    desktop: "Desktop",
    mobile: "Mobile",
    bothDevices: "Desktop & Mobile",
    desktopOnly: "Chỉ Desktop",
    mobileOnly: "Chỉ Mobile Drawer",

    // Status badges
    statusPublished: "Đang chạy",
    statusDraft: "Bản nháp",
    badgeDefault: "Mặc định",
    badgeScheduled: "Hẹn giờ",

    // Dashboard
    dashboardCreateBtn: "Tạo Menu mới",
    dashboardDemoBtn: "Dùng mẫu Lexor",
    dashboardImportNavBtn: "Import từ Navigation",
    dashboardImportJsonBtn: "Import JSON",
    dashboardThemeEditorBtn: "Bật App Embed",
    dashboardGuideTitle: "Hướng dẫn kích hoạt nhanh — Không cần sửa code theme",
    dashboardGuideStep1: "Tạo mới, dùng mẫu Lexor hoặc bấm Import từ Navigation để chuyển tự động Main menu hiện tại sang giao diện trực quan.",
    dashboardGuideStep2: "Tuỳ chỉnh cột, sản phẩm, hình ảnh, xem trước Desktop & Mobile rồi bấm Lưu & Publish.",
    dashboardGuideStep3: "Vào Online Store → Themes → Customize → App embeds và bật công tắc Lexor Mega Menu.",
    dashboardEmptyTitle: "Bắt đầu tạo Mega Menu đầu tiên",
    dashboardEmptyDesc: "Khởi tạo nhanh từ bố cục 3 cột chuẩn Lexor, import trực tiếp từ Shopify Main Menu hoặc chuyển cấu hình từ store khác bằng JSON.",
    dashboardTabsCount: "tab cấp 1",
    dashboardUpdated: "Cập nhật",
    dashboardPublishDefault: "Đặt làm Menu chính",
    dashboardUnpublish: "Gỡ Publish",
    dashboardExportJson: "Export JSON",
    dashboardCopyPresetId: "Copy Preset ID",
    dashboardCopyPresetIdToast: "Đã copy Preset ID! Dán vào Theme Editor (theme clone) → App embeds → Lexor Mega Menu → Override Menu Preset ID để test riêng không ảnh hưởng web live.",
    dashboardDeleteTitle: "Xoá bộ menu này?",
    dashboardDeleteDesc: "Thao tác này sẽ xoá vĩnh viễn bộ menu. Nếu bộ menu đang được Publish, storefront sẽ tự quay về menu mặc định của theme.",
    dashboardDeleteConfirm: "Xoá vĩnh viễn",

    // Create Modal
    createModalTitle: "Tạo bộ Menu mới",
    createModalConfirm: "Tạo & Mở trình chỉnh sửa",
    createModalNameLabel: "Tên bộ Menu",
    createModalNamePlaceholder: "VD: Main Menu, Black Friday 2026...",

    // Import Navigation Modal
    importNavTitle: "Import từ Shopify Navigation",
    importNavConfirm: "Import ngay",
    importNavLoading: "Đang tải danh sách Shopify Menus...",
    importNavDesc: "Tự động phân tích toàn bộ thẻ [collection-parent], [collection-grid], [product], [collection], [page], [button] thành giao diện kéo-thả và lấy sẵn ảnh từ Shopify Files / Products.",
    importNavSelectLabel: "Chọn Shopify Menu nguồn",
    importNavNameLabel: "Đặt tên bộ Menu mới",

    // Import JSON Modal
    importJsonTitle: "Import bộ Menu từ JSON",
    importJsonConfirm: "Import JSON",
    importJsonDesc: "Dán nội dung file JSON đã Export từ dev store hoặc store khác để đồng bộ nguyên vẹn cấu trúc và giao diện sang store này.",
    importJsonLabel: "Nội dung JSON",

    // Editor Page
    editorBack: "Danh sách Menu",
    editorSaveDraft: "Lưu nháp",
    editorPublishNow: "Lưu & Publish",
    editorPublishScheduled: "Lưu & Hẹn giờ",
    editorStyleBtn: "Giao diện & CSS",
    editorMobileBtn: "Mobile Drawer",
    editorPresetInfo: "Cấu hình bộ Menu",
    editorPresetName: "Tên bộ Menu",
    editorPresetSchedule: "Tự động kích hoạt bộ Menu này theo khoảng thời gian (Seasonal Schedule)",
    editorScheduleStart: "Bắt đầu từ",
    editorScheduleEnd: "Kết thúc lúc",
    editorHeaderTabs: "Thanh điều hướng (Header)",
    editorHeaderTabsHint: "Kéo thả để đổi thứ tự tab. Bấm vào từng tab để chỉnh bố cục bên dưới.",
    editorAddTab: "Thêm Tab",

    // Tab Config
    tabConfigTitle: "Cấu hình Tab",
    tabDeleteBtn: "Xoá Tab",
    tabLabel: "Tên hiển thị trên Header",
    tabType: "Loại hiển thị",
    tabTypeMega: "Mega Menu (Lưới nhiều cột & card ảnh)",
    tabTypeSimple: "Link trực tiếp (Không xổ menu)",
    tabTypeDropdown: "Dropdown tiêu chuẩn (Danh sách chữ)",
    tabUrl: "Đường dẫn (URL)",
    tabHighlight: "Màu chữ nổi bật",
    tabHighlightPlaceholder: "Mặc định (#FFFFFF)",
    tabVisibility: "Hiển thị theo thiết bị",
    tabEnableBadge: "Gắn nhãn nổi bật (NEW / HOT / SALE)",
    tabEnableSchedule: "Hẹn giờ hiển thị Tab",
    badgeText: "Chữ trên nhãn",
    badgeBg: "Màu nền",
    badgeColor: "Màu chữ",
    dropdownHeading: "Danh sách liên kết Dropdown",
    dropdownAddLink: "Thêm liên kết",
    dropdownTitleLabel: "Tiêu đề liên kết",

    // Columns Editor
    columnsTitle: "Các cột Mega Menu",
    columnsAdd: "Thêm cột",
    columnLabel: "Cột",
    columnCollapse: "Thu gọn",
    columnExpand: "Mở rộng",
    columnFlexRatio: "Tỷ lệ rộng",
    columnDesktopCols: "Lưới Desktop",
    columnMobileCols: "Lưới Mobile",
    columnAlign: "Căn lề",
    alignCenter: "Giữa",
    alignLeft: "Trái",
    alignRight: "Phải",
    columnShowHeading: "Hiển thị tiêu đề cột",
    columnHeadingPlaceholder: "VD: Pedicure Collection",
    columnColsUnit: "cột",
    columnItemsUnit: "mục",
    addProduct: "Sản phẩm",
    addCollection: "Bộ sưu tập",
    addPage: "Trang / Banner",
    addButton: "Nút CTA",
    addTextLink: "Link chữ",

    // Item Modal
    itemModalTitle: "Cấu hình mục trong cột",
    itemModalSave: "Áp dụng",
    itemTypeLabel: "Loại mục",
    itemTypeProduct: "Product Card (Sản phẩm)",
    itemTypeCollection: "Collection Card (Bộ sưu tập)",
    itemTypePage: "Page / Feature Card (Trang tĩnh)",
    itemTypeButton: "Nút CTA (VD: Shop All)",
    itemTypeText: "Text Link thuần (không ảnh)",
    itemPickProduct: "Chọn Product từ Shopify",
    itemPickCollection: "Chọn Collection từ Shopify",
    itemPickPage: "Chọn từ Shopify Pages",
    itemSelectPagePlaceholder: "— Chọn nhanh 1 Page có sẵn —",
    itemTitleLabel: "Tiêu đề hiển thị",
    itemButtonTextLabel: "Chữ trên nút CTA",
    itemUrlLabel: "Đường dẫn (URL)",
    itemSubLinkLabel: "Text link phụ bên dưới (tuỳ chọn, VD: Order / Learn more)",
    itemImageLabel: "Hình ảnh hiển thị",
    itemPickFile: "Chọn / Tải ảnh từ Shopify Files",
    itemRemoveImage: "Xoá ảnh",
    itemButtonColorLabel: "Màu nền nút (để trống = gradient đỏ Lexor)",
    itemEnableSchedule: "Hẹn giờ bật/tắt mục này",

    // File Picker Modal
    filePickerTitle: "Thư viện ảnh Shopify Files",
    filePickerDropHint: "Kéo thả ảnh vào đây hoặc bấm để tải trực tiếp lên Shopify Files",
    filePickerUploading: "Đang tải ảnh lên Shopify Files...",
    filePickerSearchPlaceholder: "Tìm theo tên file hoặc mô tả alt...",
    filePickerLoadMore: "Tải thêm ảnh",

    // Mobile Settings Modal
    mobileModalTitle: "Cài đặt chân Mobile Drawer",
    mobileModalSave: "Lưu cài đặt",
    mobileShowAccount: "Hiển thị mục LOG IN / Tài khoản ở cuối Mobile Drawer",
    mobileShowPhone: "Hiển thị nút gọi Hotline trên Mobile Drawer",
    mobilePhoneDisplay: "Số điện thoại hiển thị",
    mobilePhoneHref: "Liên kết gọi (tel:...)",
    mobilePhoneBg: "Màu nền nút Hotline",

    // Style Settings Modal
    styleModalTitle: "Giao diện & Custom CSS",
    styleModalSave: "Áp dụng giao diện",
    styleModalReset: "Khôi phục mặc định Lexor",
    styleModalBanner: "Trên dev store (Dawn thuần), giữ tắt 'Kế thừa CSS của Theme' để dùng bộ giao diện chuẩn Lexor. Trên web production (đã custom nhiều CSS), hãy bật tuỳ chọn này để kế thừa class cũ (.collection-parent__container, .collection-grid...) và dán thêm Custom CSS mà không cần re-deploy.",
    styleInheritLabel: "Kế thừa class CSS custom của Theme production",
    styleTokensHeading: "Tuỳ chỉnh nhanh (CSS Variables)",
    styleFontFamily: "Font chữ",
    styleImageSize: "Kích thước ảnh Card Desktop (px)",
    styleDropdownBg: "Màu nền Dropdown",
    styleTabHoverBg: "Màu nền Tab khi hover",
    styleDividerColor: "Màu đường kẻ chia cột",
    styleHeadingColor: "Màu tiêu đề cột",
    styleItemTitleColor: "Màu tên sản phẩm/mục",
    styleItemLinkColor: "Màu link phụ (Order)",
    styleCustomCssLabel: "Custom CSS (áp dụng trực tiếp khi Publish — không cần re-deploy)",

    // Live Preview
    previewTitle: "Xem trước trực tiếp",
    previewSubtitle: "Mô phỏng storefront realtime — bấm vào từng tab hoặc mục trên Mobile để kiểm tra.",
    previewScheduleToggle: "Áp dụng bộ lọc lịch hẹn giờ theo thời điểm hiện tại",
    previewNoColumns: "Chưa có cột nào cho tab này. Hãy bấm Thêm cột ở khung bên trái.",
    previewSimpleLinkNote: "Liên kết trực tiếp tới",
    previewSimpleLinkHint: "(không có menu xổ xuống). Bấm vào một tab Mega Menu để xem lưới.",
    previewNoDropdown: "Chưa có liên kết nào trong dropdown này.",
  },
} as const;

export type TranslationKey = keyof typeof dictionary.en;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => dictionary.en[key],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "vi" || saved === "en") {
        setLocaleState(saved);
      } else if (navigator.language?.toLowerCase().startsWith("vi")) {
        setLocaleState("vi");
      }
    } catch {
      // ignore storage errors in restricted iframes
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const t = (key: TranslationKey) => dictionary[locale][key] || dictionary.en[key];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
