# Lexor Mega Menu — Hướng dẫn Cài đặt & Deploy 100% Free-Tier / Shopify Native

## Kiến trúc 0đ / tháng (100% Free-Tier & Shopify Native)

- **Dữ liệu Menu (Draft, Published, Presets, Schedule)**: Lưu 100% trong **Shopify Shop Metafields** (`lexor_mega_menu.presets` và `lexor_mega_menu.active_config`). **Không cần thuê Postgres / Cloudflare D1 / Firebase.**
- **Storefront (Desktop Mega Menu + Mobile Drawer)**: Chạy qua **Shopify Theme App Extension (App Embed)** đọc trực tiếp từ Shop Metafield trên Shopify CDN — **0ms latency, 100% uptime kể cả khi server Render Free Tier đang ngủ**.
- **Admin UI (trình kéo-thả chỉnh sửa menu)**: Host trên **Render.com Free Tier** (chỉ cần chạy khi bạn mở Shopify Admin để sửa menu).

---

## Bước 1: Tạo App trên Shopify Partners & Chạy thử Local

```bash
cd /home/vcc/tuanlee/docs/lexor-mega-menu
npm install
npm run setup
npm run dev
```

Khi chạy `npm run dev` lần đầu:
1. Shopify CLI hỏi tạo app mới hay link app cũ → chọn **Create this project as a new app on Shopify** (tên: `Lexor Mega Menu`).
2. Chọn store phát triển (hoặc store `shoplexor` nếu bạn dùng Custom App / Partners).
3. CLI sẽ tự điền `client_id` vào `shopify.app.toml` và mở link preview.

---

## Bước 2: Deploy Admin UI lên Render.com (Free Tier)

1. Push thư mục `/home/vcc/tuanlee/docs/lexor-mega-menu` lên một repo GitHub (private hoặc public đều được).
2. Vào [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service** → chọn repo `lexor-mega-menu`.
3. Cấu hình:
   - **Runtime**: `Docker` (Render sẽ tự đọc file `Dockerfile` có sẵn)
   - **Instance Type**: **Free** (\$0/month)
   - **Health Check Path**: `/health`
4. Vào mục **Environment Variables** trên Render, thêm 5 biến sau (lấy `Client ID` và `Client Secret` từ Shopify Partners → App `Lexor Mega Menu` → Settings):

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `SHOPIFY_API_KEY` | `<Client ID từ Shopify Partners>` |
| `SHOPIFY_API_SECRET` | `<Client Secret từ Shopify Partners>` |
| `SHOPIFY_APP_URL` | `https://<ten-app-cua-ban>.onrender.com` |
| `SCOPES` | `read_online_store_navigation,read_products,read_content,read_files,write_files` |

5. Bấm **Create Web Service** và chờ Render build xong (khi mở `https://<ten-app-cua-ban>.onrender.com/health` thấy chữ `ok` là thành công).

---

## Bước 3: Cập nhật URL Production & Deploy Theme App Extension lên Shopify

1. Mở file `shopify.app.toml`, thay `https://lexor-mega-menu.onrender.com` bằng đúng URL Render thật của bạn (ở cả `application_url` và `redirect_urls`).
2. Chạy lệnh đẩy cấu hình + **Theme App Extension (`lexor-mega-menu-embed`)** lên Shopify:

```bash
cd /home/vcc/tuanlee/docs/lexor-mega-menu
npm run deploy
```

> Lệnh này sẽ đẩy extension lên Shopify CDN và phát hành version mới cho app.

---

## Bước 4: Cài đặt & Import Menu hiện tại trong 1 phút

1. Cài app **Lexor Mega Menu** vào store `shoplexor`.
2. Mở app **Lexor Mega Menu** trong Shopify Admin → bấm **Import từ Shopify Navigation** → chọn **Main menu** → bấm **Import ngay**.
   - Toàn bộ pattern `[collection-parent|...]`, `[collection-grid|...]`, `[product|...]`, `[collection|...]`, `[page|...]`, `[button|...]` sẽ được chuyển tự động thành giao diện kéo-thả kèm ảnh!
3. Kiểm tra lại trên khung **Live Preview (Desktop & Mobile)**, chỉnh sửa nếu cần rồi bấm **Lưu & Publish ngay**.
4. Vào **Online Store → Themes → Customize → App embeds (biểu tượng 4 ô vuông bên trái)** → bật công tắc **Lexor Mega Menu** → bấm **Save**.
5. Xong! Storefront giờ đã chạy hoàn toàn bằng Mega Menu mới (nếu tắt công tắc App Embed, theme tự fallback về menu cũ an toàn).

---

## Bước 5 (Tuỳ chọn): Giữ Admin UI không bị ngủ đông trên Render Free Tier

Storefront **không bao giờ bị ảnh hưởng** khi Render ngủ, nhưng nếu bạn muốn mở Admin UI lúc nào cũng nhanh (không chờ 20–30s wake-up):
1. Tạo tài khoản miễn phí tại [cron-job.org](https://cron-job.org).
2. Tạo 1 cron job gọi `GET https://<ten-app-cua-ban>.onrender.com/health` mỗi **14 phút**.
