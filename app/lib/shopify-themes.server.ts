import type { ShopifyThemeSummary } from "../types/menu";

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> }
  ) => Promise<Response>;
};

export interface StorefrontThemeContext {
  storefrontUrl: string;
  myshopifyDomain: string;
  themes: ShopifyThemeSummary[];
  missingThemesScope?: boolean;
}

export async function loadStorefrontThemes(
  admin: AdminGraphql,
  fallbackShopDomain: string
): Promise<StorefrontThemeContext> {
  let storefrontUrl = `https://${fallbackShopDomain}`;
  let myshopifyDomain = fallbackShopDomain;

  try {
    const shopRes = await admin.graphql(`
      query GetShopDomains {
        shop {
          myshopifyDomain
          primaryDomain {
            url
          }
        }
      }
    `);
    const shopJson = await shopRes.json();
    if (shopJson?.data?.shop?.primaryDomain?.url) {
      storefrontUrl = shopJson.data.shop.primaryDomain.url;
    }
    if (shopJson?.data?.shop?.myshopifyDomain) {
      myshopifyDomain = shopJson.data.shop.myshopifyDomain;
    }
  } catch {
    // keep fallback
  }

  try {
    const res = await admin.graphql(`
      query GetShopThemes {
        themes(first: 25) {
          nodes {
            id
            name
            role
          }
        }
      }
    `);
    const json = await res.json();
    const nodes = json?.data?.themes?.nodes || [];
    const themes: ShopifyThemeSummary[] = nodes
      .map((t: { id: string; name: string; role: string }) => ({
        id: t.id,
        numericId: String(t.id).split("/").pop() || t.id,
        name: t.name,
        role: t.role,
      }))
      .sort((a: ShopifyThemeSummary, b: ShopifyThemeSummary) => {
        if (a.role === "MAIN" && b.role !== "MAIN") return -1;
        if (b.role === "MAIN" && a.role !== "MAIN") return 1;
        return a.name.localeCompare(b.name);
      });

    return { storefrontUrl, myshopifyDomain, themes };
  } catch {
    return {
      storefrontUrl,
      myshopifyDomain,
      themes: [],
      missingThemesScope: true,
    };
  }
}
