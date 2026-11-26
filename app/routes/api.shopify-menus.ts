import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { listShopifyNavMenus } from "../lib/import-navigation.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const menus = await listShopifyNavMenus(admin);
  return new Response(JSON.stringify({ menus }), {
    headers: { "Content-Type": "application/json" },
  });
};
