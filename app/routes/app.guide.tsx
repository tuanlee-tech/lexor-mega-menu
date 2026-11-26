import { useNavigate } from "react-router";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  InlineGrid,
  InlineStack,
  Layout,
  List,
  Page,
  Text,
} from "@shopify/polaris";
import { useI18n } from "../lib/i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

const guideContent = {
  en: {
    pageTitle: "User Guide",
    pageSubtitle: "Setup, configuration, and troubleshooting reference",
    backToMenus: "Mega Menus",

    quickStartTitle: "1. Quick Start",
    steps: [
      {
        num: "Step 1",
        title: "Create or Import a Menu",
        desc: "Open Mega Menus and select Create Menu, or select Import from Navigation to convert an existing Shopify navigation menu.",
      },
      {
        num: "Step 2",
        title: "Arrange Tabs, Columns & Items",
        desc: "Drag tabs, columns, or items to reorder. Click any item to link a Product, Collection, Page, or select an image from Shopify Files.",
      },
      {
        num: "Step 3",
        title: "Review Live Preview",
        desc: "Use the Live Preview pane to inspect Desktop and Mobile layouts and verify links, badges, and active schedules.",
      },
      {
        num: "Step 4",
        title: "Publish & Enable App Embed",
        desc: "Click Save & Publish. In Online Store → Themes → Customize → App embeds, enable Lexor Mega Menu and save.",
      },
    ],

    editingTitle: "2. Configuration Reference",
    tasks: [
      {
        badge: "Items & Media",
        title: "Adding products, collections, and images",
        items: [
          "Select a header tab, then choose a column in the Mega Menu Columns section.",
          "Click + Product, + Collection, + Page / Card, + CTA Button, or + Text Link to add an item, or click the edit icon on an existing item.",
          "Use Select Product / Collection from Shopify to populate the title, URL, and default image automatically.",
          "Use Choose / Upload from Shopify Files to pick an existing asset or upload a new image.",
        ],
      },
      {
        badge: "Highlights & Badges",
        title: "Styling promotional tabs and badges",
        items: [
          "Select a tab and set Highlight text color using the color picker or a hex code.",
          "Enable Show promotional badge to display a custom label (e.g., NEW, HOT, SALE) with configurable background and text colors.",
        ],
      },
      {
        badge: "Grid Layout",
        title: "Column widths and responsive grids",
        items: [
          "Width ratio sets the relative width of each column on desktop (e.g., 1.8 for the primary grid, 1.0 for secondary columns).",
          "Desktop grid supports 1 to 6 items per row.",
          "Mobile grid supports 1 to 3 items per row. In a 2-column mobile grid with an odd number of items, the last item spans across both columns.",
        ],
      },
      {
        badge: "Mobile & Scheduling",
        title: "Mobile drawer utilities and scheduled presets",
        items: [
          "Open Mobile Drawer in the editor to configure the phone number button, button color, and Account / Log In link visibility.",
          "To schedule a seasonal menu, duplicate a preset, enable Schedule this menu preset, set the start and end timestamps, and click Save & Schedule.",
        ],
      },
    ],

    cloneTitle: "3. Testing on an Unpublished (Clone) Theme",
    cloneIntro:
      "Each Shopify theme stores its own App Embed settings. Use Override Menu Preset ID to test a draft or alternate menu on a cloned theme without affecting the active storefront:",
    cloneSteps: [
      "Create or edit a menu preset and click Save Draft.",
      "Click Copy Preset ID on that preset.",
      "Open Online Store → Themes → Customize on the unpublished/clone theme, go to App embeds → Lexor Mega Menu, enable the embed, and paste the ID into Override Menu Preset ID. Click Save.",
      "Preview the clone theme. Once verified, return to the app and click Save & Publish. Ensure Override Menu Preset ID remains blank on the active live theme.",
    ],

    faqTitle: "4. Troubleshooting",
    faqs: [
      {
        q: "Changes are published, but the storefront still shows the previous menu",
        a: "Verify three items: (1) Online Store → Themes → Customize → App embeds → Lexor Mega Menu is enabled and saved; (2) Override Menu Preset ID on the live theme is empty; (3) perform a hard refresh (Ctrl+F5 / Cmd+Shift+R).",
      },
      {
        q: "How to revert immediately to the theme's original menu",
        a: "Open Online Store → Themes → Customize → App embeds, disable Lexor Mega Menu, and click Save.",
      },
      {
        q: "How to transfer a menu between stores",
        a: "Click Export JSON on the source store to download the preset file. On the target store, click Import JSON and paste the contents.",
      },
      {
        q: "How to match custom theme typography, colors, or spacing",
        a: "Open Appearance & CSS in the editor to adjust design tokens, enable Inherit production theme CSS classes, or add Custom CSS overrides.",
      },
    ],
  },
  vi: {
    pageTitle: "Hướng dẫn sử dụng",
    pageSubtitle: "Tài liệu thiết lập, cấu hình và xử lý sự cố",
    backToMenus: "Danh sách Menu",

    quickStartTitle: "1. Quy trình thiết lập",
    steps: [
      {
        num: "Bước 1",
        title: "Tạo mới hoặc Import Menu",
        desc: "Trong mục Mega Menus, chọn Tạo Menu mới hoặc Import từ Navigation để chuyển đổi cấu trúc menu hiện có của Shopify.",
      },
      {
        num: "Bước 2",
        title: "Sắp xếp Tab, Cột và Mục con",
        desc: "Kéo thả để đổi thứ tự tab, cột hoặc mục con. Bấm vào từng mục để liên kết Product, Collection, Page hoặc chọn ảnh từ Shopify Files.",
      },
      {
        num: "Bước 3",
        title: "Kiểm tra trên Live Preview",
        desc: "Chuyển đổi giữa chế độ Desktop và Mobile ở khung Xem trước để kiểm tra bố cục, liên kết, nhãn và lịch hẹn giờ.",
      },
      {
        num: "Bước 4",
        title: "Publish và bật App Embed",
        desc: "Bấm Lưu & Publish. Sau đó vào Online Store → Themes → Customize → App embeds, bật Lexor Mega Menu và bấm Save.",
      },
    ],

    editingTitle: "2. Hướng dẫn cấu hình chi tiết",
    tasks: [
      {
        badge: "Mục con & Hình ảnh",
        title: "Thêm sản phẩm, bộ sưu tập và hình ảnh",
        items: [
          "Chọn một tab trên thanh điều hướng, sau đó chọn cột cần chỉnh sửa.",
          "Bấm + Sản phẩm, + Bộ sưu tập, + Trang / Banner, + Nút CTA hoặc + Link chữ để thêm mới, hoặc bấm biểu tượng chỉnh sửa trên mục có sẵn.",
          "Dùng nút Chọn Product / Collection từ Shopify để tự động lấy tiêu đề, đường dẫn và ảnh mặc định.",
          "Dùng nút Chọn / Tải ảnh từ Shopify Files để chọn ảnh có sẵn hoặc tải trực tiếp ảnh mới từ máy tính.",
        ],
      },
      {
        badge: "Màu nổi bật & Nhãn",
        title: "Định dạng tab khuyến mãi và gắn nhãn",
        items: [
          "Chọn tab cần định dạng, chỉnh Màu chữ nổi bật bằng ô chọn màu hoặc nhập mã Hex.",
          "Bật Gắn nhãn nổi bật để hiển thị thẻ (VD: NEW, HOT, SALE) kèm tuỳ chọn màu nền và màu chữ.",
        ],
      },
      {
        badge: "Bố cục lưới",
        title: "Tỷ lệ cột và số mục trên mỗi hàng",
        items: [
          "Tỷ lệ rộng quy định độ rộng tương đối giữa các cột trên Desktop (VD: 1.8 cho cột chính, 1.0 cho các cột phụ).",
          "Lưới Desktop hỗ trợ từ 1 đến 6 mục trên mỗi hàng.",
          "Lưới Mobile hỗ trợ từ 1 đến 3 mục trên mỗi hàng. Với lưới 2 cột có tổng số mục lẻ, mục cuối cùng sẽ tự động chiếm toàn bộ chiều ngang 2 cột.",
        ],
      },
      {
        badge: "Mobile & Hẹn giờ",
        title: "Cài đặt Mobile Drawer và hẹn giờ kích hoạt",
        items: [
          "Mở mục Mobile Drawer trong trang chỉnh sửa để thay đổi số điện thoại Hotline, màu nút gọi hoặc bật/tắt liên kết Đăng nhập.",
          "Để hẹn giờ bộ menu theo sự kiện: nhân bản bộ menu, bật Tự động kích hoạt theo khoảng thời gian, chọn thời điểm bắt đầu/kết thúc và bấm Lưu & Hẹn giờ.",
        ],
      },
    ],

    cloneTitle: "3. Kiểm thử trên Theme Clone (Chưa Active)",
    cloneIntro:
      "Mỗi theme trên Shopify lưu cấu hình App Embed độc lập. Sử dụng trường Override Menu Preset ID để kiểm thử bộ menu nháp trên theme clone mà không ảnh hưởng tới theme đang chạy:",
    cloneSteps: [
      "Tạo hoặc chỉnh sửa bộ menu và bấm Lưu nháp (chưa cần Publish).",
      "Bấm Copy Preset ID của bộ menu vừa lưu.",
      "Vào Online Store → Themes → Customize trên theme clone, mở App embeds → Lexor Mega Menu, bật công tắc và dán mã vào ô Override Menu Preset ID, sau đó bấm Save.",
      "Xem trước trên theme clone. Khi hoàn tất kiểm thử, quay lại app bấm Lưu & Publish. Đảm bảo ô Override Menu Preset ID trên theme chính đang để trống.",
    ],

    faqTitle: "4. Xử lý sự cố thường gặp",
    faqs: [
      {
        q: "Đã bấm Publish nhưng giao diện ngoài trang web chưa cập nhật",
        a: "Kiểm tra 3 điều kiện: (1) Online Store → Themes → Customize → App embeds → Lexor Mega Menu đã được bật và lưu; (2) ô Override Menu Preset ID trên theme chính đang để trống; (3) tải lại trang bằng Ctrl+F5 hoặc Cmd+Shift+R.",
      },
      {
        q: "Cách quay lại menu mặc định của theme",
        a: "Vào Online Store → Themes → Customize → App embeds, tắt Lexor Mega Menu và bấm Save.",
      },
      {
        q: "Cách chuyển cấu hình menu giữa các store",
        a: "Bấm Export JSON tại store nguồn để tải file cấu hình. Tại store đích, bấm Import JSON và dán nội dung file.",
      },
      {
        q: "Cách đồng bộ font chữ, màu sắc hoặc khoảng cách theo theme hiện tại",
        a: "Mở Giao diện & CSS trong trang chỉnh sửa để thay đổi các thông số hiển thị, bật Kế thừa class CSS custom của Theme production hoặc thêm Custom CSS.",
      },
    ],
  },
} as const;

export default function UserGuidePage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const c = guideContent[locale];

  return (
    <Page
      title={c.pageTitle}
      subtitle={c.pageSubtitle}
      titleMetadata={<LanguageSwitcher />}
      backAction={{ content: c.backToMenus, onAction: () => navigate("/app") }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            {/* Section 1: Quick Start */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  {c.quickStartTitle}
                </Text>
                <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                  {c.steps.map((step) => (
                    <Box
                      key={step.num}
                      padding="400"
                      borderWidth="025"
                      borderColor="border"
                      borderRadius="300"
                      background="bg-surface-secondary"
                    >
                      <BlockStack gap="200">
                        <InlineStack gap="200" blockAlign="center">
                          <Badge tone="info">{step.num}</Badge>
                          <Text as="h3" variant="headingSm">
                            {step.title}
                          </Text>
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">
                          {step.desc}
                        </Text>
                      </BlockStack>
                    </Box>
                  ))}
                </InlineGrid>
              </BlockStack>
            </Card>

            {/* Section 2: Configuration Reference */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  {c.editingTitle}
                </Text>
                <BlockStack gap="400">
                  {c.tasks.map((task, idx) => (
                    <BlockStack key={task.title} gap="200">
                      {idx > 0 && <Divider />}
                      <InlineStack gap="200" blockAlign="center">
                        <Badge>{task.badge}</Badge>
                        <Text as="h3" variant="headingMd">
                          {task.title}
                        </Text>
                      </InlineStack>
                      <List type="bullet">
                        {task.items.map((item) => (
                          <List.Item key={item}>{item}</List.Item>
                        ))}
                      </List>
                    </BlockStack>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Section 3: Testing on Clone Theme */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingLg">
                  {c.cloneTitle}
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  {c.cloneIntro}
                </Text>
                <Box
                  padding="400"
                  borderRadius="300"
                  background="bg-surface-secondary"
                  borderWidth="025"
                  borderColor="border"
                >
                  <List type="number">
                    {c.cloneSteps.map((st) => (
                      <List.Item key={st}>{st}</List.Item>
                    ))}
                  </List>
                </Box>
              </BlockStack>
            </Card>

            {/* Section 4: Troubleshooting */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  {c.faqTitle}
                </Text>
                <BlockStack gap="300">
                  {c.faqs.map((faq, idx) => (
                    <BlockStack key={faq.q} gap="150">
                      {idx > 0 && <Divider />}
                      <Text as="h3" variant="headingSm">
                        {faq.q}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        {faq.a}
                      </Text>
                    </BlockStack>
                  ))}
                </BlockStack>
              </BlockStack>
            </Card>

            <InlineStack align="center">
              <Button variant="primary" onClick={() => navigate("/app")}>
                {c.backToMenus}
              </Button>
            </InlineStack>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
