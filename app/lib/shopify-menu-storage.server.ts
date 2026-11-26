import type { MenuPreset, StorefrontActiveConfig } from "../types/menu";

const NAMESPACE = "lexor_mega_menu";
const PRESETS_KEY = "presets";
const ACTIVE_KEY = "active_config";

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> }
  ) => Promise<Response>;
};

async function graphqlWithRetry(
  admin: AdminGraphql,
  query: string,
  options?: { variables?: Record<string, unknown> },
  retries = 2
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await admin.graphql(query, options);
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isNetworkError =
        /fetch failed|ECONNRESET|ETIMEDOUT|UND_ERR|no response available/i.test(msg);
      if (!isNetworkError || attempt === retries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function getShopId(admin: AdminGraphql): Promise<string> {
  const res = await graphqlWithRetry(
    admin,
    `
    query GetShopId {
      shop { id }
    }
  `
  );
  const json = await res.json();
  return json.data.shop.id as string;
}

export async function loadAllPresets(admin: AdminGraphql): Promise<MenuPreset[]> {
  const res = await graphqlWithRetry(
    admin,
    `
    query LoadMegaMenuPresets {
      shop {
        metafield(namespace: "${NAMESPACE}", key: "${PRESETS_KEY}") {
          value
        }
      }
    }
  `
  );
  const json = await res.json();
  const raw = json?.data?.shop?.metafield?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MenuPreset[]) : [];
  } catch {
    return [];
  }
}

export async function saveAllPresets(
  admin: AdminGraphql,
  presets: MenuPreset[]
): Promise<{ ok: boolean; error?: string }> {
  const shopId = await getShopId(admin);

  const defaultMenu =
    presets.find((p) => p.status === "PUBLISHED" && p.isDefault) ||
    presets.find((p) => p.status === "PUBLISHED" && !p.schedule?.enabled) ||
    null;

  const scheduledMenus = presets.filter(
    (p) => p.status === "PUBLISHED" && p.schedule?.enabled
  );

  const activeConfig: StorefrontActiveConfig = {
    version: 1,
    updatedAt: new Date().toISOString(),
    defaultMenu,
    scheduledMenus,
  };

  const mutation = `
    mutation SaveMegaMenuMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          key
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  const res = await graphqlWithRetry(admin, mutation, {
    variables: {
      metafields: [
        {
          ownerId: shopId,
          namespace: NAMESPACE,
          key: PRESETS_KEY,
          type: "json",
          value: JSON.stringify(presets),
        },
        {
          ownerId: shopId,
          namespace: NAMESPACE,
          key: ACTIVE_KEY,
          type: "json",
          value: JSON.stringify(activeConfig),
        },
      ],
    },
  });

  const json = await res.json();
  const userErrors = json?.data?.metafieldsSet?.userErrors || [];
  if (userErrors.length > 0) {
    return {
      ok: false,
      error: userErrors.map((e: { message: string }) => e.message).join("; "),
    };
  }
  return { ok: true };
}
