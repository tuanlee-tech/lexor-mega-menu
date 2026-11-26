import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  allowedActionOrigins: [
    "*.trycloudflare.com",
    "*.onrender.com",
    "admin.shopify.com",
    "*.myshopify.com",
  ],
} satisfies Config;
