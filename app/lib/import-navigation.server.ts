import type {
  DropdownLink,
  MegaColumn,
  MegaItem,
  MegaItemType,
  MenuPreset,
  TopLevelItem,
} from "../types/menu";
import { createDefaultMobileSettings, uid } from "./menu-utils";

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> }
  ) => Promise<Response>;
};

interface ShopifyMenuItemNode {
  id: string;
  title: string;
  url: string;
  resourceId?: string | null;
  type: string;
  items?: ShopifyMenuItemNode[];
}

export interface ShopifyNavMenuSummary {
  id: string;
  handle: string;
  title: string;
  itemCount: number;
}

export async function listShopifyNavMenus(
  admin: AdminGraphql
): Promise<ShopifyNavMenuSummary[]> {
  const res = await admin.graphql(`
    query ListShopifyMenus {
      menus(first: 25) {
        nodes {
          id
          handle
          title
          items {
            id
          }
        }
      }
    }
  `);
  const json = await res.json();
  const nodes = json?.data?.menus?.nodes || [];
  return nodes.map((m: { id: string; handle: string; title: string; items?: unknown[] }) => ({
    id: m.id,
    handle: m.handle,
    title: m.title,
    itemCount: m.items?.length || 0,
  }));
}

function parsePattern(raw: string): {
  isPattern: boolean;
  tag: string;
  attrs: Record<string, string>;
} {
  const trimmed = (raw || "").trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return { isPattern: false, tag: "", attrs: {} };
  }
  const inner = trimmed.slice(1, -1).trim();
  const parts = inner.split("|");
  const tag = (parts[0] || "").trim().toLowerCase();
  const attrs: Record<string, string> = {};
  for (let i = 1; i < parts.length; i++) {
    const colonIdx = parts[i].indexOf(":");
    if (colonIdx !== -1) {
      const k = parts[i].slice(0, colonIdx).trim().toLowerCase();
      const v = parts[i].slice(colonIdx + 1).trim();
      attrs[k] = v;
    }
  }
  return { isPattern: true, tag, attrs };
}

/**
 * Resolve Shopify Files CDN URLs for a list of filenames imported from `[...|image:filename.webp]`.
 */
async function resolveFileUrls(
  admin: AdminGraphql,
  filenames: string[]
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(filenames.filter(Boolean)));
  const map: Record<string, string> = {};
  if (unique.length === 0) return map;

  // Batch in groups of 10 using OR filename queries
  const chunkSize = 10;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const searchQuery = chunk.map((f) => `filename:"${f.replace(/"/g, "")}"`).join(" OR ");
    try {
      const res = await admin.graphql(
        `
        query ResolveImportedFiles($query: String!) {
          files(first: 50, query: $query) {
            nodes {
              ... on MediaImage {
                image { url }
              }
              ... on GenericFile {
                url
              }
            }
          }
        }
      `,
        { variables: { query: searchQuery } }
      );
      const json = await res.json();
      const nodes = json?.data?.files?.nodes || [];
      for (const node of nodes) {
        const url: string | undefined = node?.image?.url || node?.url;
        if (!url) continue;
        const cleanUrlPath = url.split("?")[0];
        const basename = cleanUrlPath.split("/").pop() || "";
        for (const f of chunk) {
          if (basename.toLowerCase() === f.toLowerCase() || cleanUrlPath.endsWith(`/${f}`)) {
            map[f] = url;
          }
        }
      }
    } catch {
      // Fallback: imageFilename stays on MegaItem so Liquid `file_url` still works
    }
  }

  return map;
}

/**
 * Resolve default product/collection images when no custom `image:` was specified.
 */
async function resolveResourceMeta(
  admin: AdminGraphql,
  resourceIds: string[]
): Promise<Record<string, { title?: string; imageUrl?: string }>> {
  const validIds = Array.from(
    new Set(
      resourceIds.filter(
        (id) =>
          id.startsWith("gid://shopify/Product/") ||
          id.startsWith("gid://shopify/Collection/")
      )
    )
  );
  const map: Record<string, { title?: string; imageUrl?: string }> = {};
  if (validIds.length === 0) return map;

  try {
    const res = await admin.graphql(
      `
      query ResolveResourceMeta($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Product {
            id
            title
            featuredImage { url }
          }
          ... on Collection {
            id
            title
            image { url }
          }
        }
      }
    `,
      { variables: { ids: validIds.slice(0, 100) } }
    );
    const json = await res.json();
    const nodes = json?.data?.nodes || [];
    for (const node of nodes) {
      if (!node?.id) continue;
      map[node.id] = {
        title: node.title || undefined,
        imageUrl: node?.featuredImage?.url || node?.image?.url || undefined,
      };
    }
  } catch {
    // Non-fatal
  }
  return map;
}

export async function importFromShopifyMenu(
  admin: AdminGraphql,
  menuId: string,
  presetName?: string
): Promise<MenuPreset> {
  const res = await admin.graphql(
    `
    query GetShopifyMenuForImport($id: ID!) {
      menu(id: $id) {
        id
        title
        handle
        items {
          id
          title
          url
          resourceId
          type
          items {
            id
            title
            url
            resourceId
            type
            items {
              id
              title
              url
              resourceId
              type
            }
          }
        }
      }
    }
  `,
    { variables: { id: menuId } }
  );

  const json = await res.json();
  const menu = json?.data?.menu;
  if (!menu) {
    throw new Error("Shopify menu not found.");
  }

  const rawItems: ShopifyMenuItemNode[] = menu.items || [];
  const filenamesToResolve: string[] = [];
  const resourceIdsToResolve: string[] = [];

  // First pass: collect filenames & resource IDs
  for (const top of rawItems) {
    for (const col of top.items || []) {
      for (const leaf of col.items || []) {
        const parsed = parsePattern(leaf.title);
        if (parsed.isPattern && parsed.attrs.image) {
          filenamesToResolve.push(parsed.attrs.image);
        }
        if (leaf.resourceId) {
          resourceIdsToResolve.push(leaf.resourceId);
        }
      }
    }
  }

  const [fileUrlMap, resourceMetaMap] = await Promise.all([
    resolveFileUrls(admin, filenamesToResolve),
    resolveResourceMeta(admin, resourceIdsToResolve),
  ]);

  const topLevelItems: TopLevelItem[] = rawItems.map((top) => {
    const parsedTop = parsePattern(top.title);
    const hasChildren = (top.items?.length || 0) > 0;

    if (hasChildren && parsedTop.isPattern && parsedTop.tag === "collection-parent") {
      const columns: MegaColumn[] = (top.items || []).map((colNode, colIdx) => {
        const parsedCol = parsePattern(colNode.title);
        const pos = parsedCol.attrs.pos || "";
        const desktopCols = Math.max(1, Math.min(6, Number(parsedCol.attrs.col) || 1));
        const mobileCols = desktopCols >= 2 ? 2 : 1;
        const alignRaw = parsedCol.attrs.align || "center";
        const align =
          alignRaw === "left" || alignRaw === "right" ? alignRaw : "center";
        const rawHeading = parsedCol.attrs.title || "";
        const showHeading = Boolean(rawHeading && rawHeading !== "false");

        const items: MegaItem[] = (colNode.items || []).map((leaf) => {
          const parsedLeaf = parsePattern(leaf.title);
          if (parsedLeaf.isPattern) {
            const validTypes: MegaItemType[] = [
              "product",
              "collection",
              "page",
              "button",
            ];
            const itemType: MegaItemType = validTypes.includes(
              parsedLeaf.tag as MegaItemType
            )
              ? (parsedLeaf.tag as MegaItemType)
              : "text_link";

            const imgFile = parsedLeaf.attrs.image || "";
            const resMeta = leaf.resourceId ? resourceMetaMap[leaf.resourceId] : undefined;
            const resolvedImg =
              (imgFile && fileUrlMap[imgFile]) ||
              resMeta?.imageUrl ||
              undefined;
            const fallbackHandleTitle = (leaf.url || "")
              .split("/")
              .filter(Boolean)
              .pop()
              ?.replace(/-/g, " ");

            return {
              id: uid("item"),
              type: itemType,
              title:
                parsedLeaf.attrs.title ||
                (itemType === "button" ? parsedLeaf.attrs.btn : undefined) ||
                resMeta?.title ||
                fallbackHandleTitle ||
                leaf.title,
              url: leaf.url || "#",
              resourceId: leaf.resourceId || undefined,
              imageUrl: resolvedImg,
              imageFilename: imgFile || undefined,
              btnText: parsedLeaf.attrs.btn || "",
              buttonBgColor: undefined,
              visibility: "all",
              schedule: { enabled: false },
              badge: null,
            };
          }

          return {
            id: uid("item"),
            type: "text_link",
            title: leaf.title,
            url: leaf.url || "#",
            resourceId: leaf.resourceId || undefined,
            visibility: "all",
            schedule: { enabled: false },
            badge: null,
          };
        });

        return {
          id: uid("col"),
          heading: showHeading ? rawHeading : `Column ${colIdx + 1}`,
          showHeading,
          flexRatio: pos === "left" ? 1.8 : 1,
          desktopCols,
          mobileCols,
          align,
          visibility: "all",
          items,
        };
      });

      return {
        id: uid("tab"),
        type: "mega_menu",
        title: parsedTop.attrs.title || top.title,
        url: top.url || "#",
        visibility: "all",
        schedule: { enabled: false },
        badge: null,
        columns,
        dropdownLinks: [],
      };
    }

    if (hasChildren) {
      const dropdownLinks: DropdownLink[] = (top.items || []).map((child) => ({
        id: uid("dd"),
        title: child.title,
        url: child.url || "#",
        badge: null,
        children: (child.items || []).map((grand) => ({
          id: uid("ddc"),
          title: grand.title,
          url: grand.url || "#",
        })),
      }));

      return {
        id: uid("tab"),
        type: "dropdown",
        title: top.title,
        url: top.url || "#",
        visibility: "all",
        schedule: { enabled: false },
        badge: null,
        columns: [],
        dropdownLinks,
      };
    }

    const isPromo = /black\s*friday|sale|deal/i.test(top.title);
    return {
      id: uid("tab"),
      type: "simple_link",
      title: top.title,
      url: top.url || "#",
      highlightColor: isPromo ? "#D93829" : undefined,
      visibility: "all",
      schedule: { enabled: false },
      badge: null,
      columns: [],
      dropdownLinks: [],
    };
  });

  const now = new Date().toISOString();
  return {
    id: uid("menu"),
    name: presetName || `${menu.title} (Imported)`,
    status: "DRAFT",
    isDefault: false,
    schedule: { enabled: false },
    items: topLevelItems,
    mobileSettings: createDefaultMobileSettings(),
    createdAt: now,
    updatedAt: now,
  };
}
