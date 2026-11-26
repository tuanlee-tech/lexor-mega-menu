import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Badge,
  Banner,
  BlockStack,
  Button,
  Card,
  EmptyState,
  InlineStack,
  Modal,
  Page,
  ResourceItem,
  ResourceList,
  Select,
  Spinner,
  Text,
  TextField,
} from "@shopify/polaris";
import { ClipboardIcon, ExportIcon, ImportIcon, PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { loadAllPresets, saveAllPresets } from "../lib/shopify-menu-storage.server";
import { loadStorefrontThemes } from "../lib/shopify-themes.server";
import {
  importFromShopifyMenu,
  type ShopifyNavMenuSummary,
} from "../lib/import-navigation.server";
import { createBlankPreset, createLexorDemoPreset, uid } from "../lib/menu-utils";
import { useI18n } from "../lib/i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import type { MenuPreset } from "../types/menu";
import { invalidateStorefrontPreviewCache } from "../lib/storefront-preview-cache.server";
import { clearAllClientPreviewCache } from "../components/preview/RealStorefrontPreview";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const [presets, themeCtx] = await Promise.all([
    loadAllPresets(admin),
    loadStorefrontThemes(admin, session.shop),
  ]);
  return { presets, shop: session.shop, themes: themeCtx.themes };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "");
  const presets = await loadAllPresets(admin);

  if (intent === "create") {
    const name = String(formData.get("name") || "Main Menu").trim() || "Main Menu";
    const created = createBlankPreset(name);
    if (presets.length === 0) created.isDefault = true;
    const result = await saveAllPresets(admin, [created, ...presets]);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, redirectTo: `/app/menus/${created.id}` };
  }

  if (intent === "create_demo") {
    const created = createLexorDemoPreset("Lexor Mega Menu");
    if (presets.length === 0) created.isDefault = true;
    const result = await saveAllPresets(admin, [created, ...presets]);
    if (!result.ok) return { ok: false, error: result.error };
    return { ok: true, redirectTo: `/app/menus/${created.id}` };
  }

  if (intent === "import_json") {
    const raw = String(formData.get("json") || "").trim();
    if (!raw) return { ok: false, error: "Please paste valid menu JSON." };
    try {
      const parsed = JSON.parse(raw) as Partial<MenuPreset>;
      if (!Array.isArray(parsed.items)) {
        return { ok: false, error: "Invalid MenuPreset JSON (missing items array)." };
      }
      const now = new Date().toISOString();
      const imported: MenuPreset = {
        ...createBlankPreset(parsed.name || "Imported JSON Menu"),
        ...parsed,
        id: uid("menu"),
        status: "DRAFT",
        isDefault: presets.length === 0,
        createdAt: now,
        updatedAt: now,
      };
      const result = await saveAllPresets(admin, [imported, ...presets]);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, redirectTo: `/app/menus/${imported.id}` };
    } catch {
      return { ok: false, error: "Invalid JSON syntax." };
    }
  }

  if (intent === "import") {
    const menuId = String(formData.get("menuId") || "");
    const presetName = String(formData.get("presetName") || "").trim();
    if (!menuId) return { ok: false, error: "Please select a source menu." };
    try {
      const imported = await importFromShopifyMenu(admin, menuId, presetName || undefined);
      if (presets.length === 0) imported.isDefault = true;
      const result = await saveAllPresets(admin, [imported, ...presets]);
      if (!result.ok) return { ok: false, error: result.error };
      return { ok: true, redirectTo: `/app/menus/${imported.id}` };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Import failed",
      };
    }
  }

  if (intent === "duplicate") {
    const id = String(formData.get("id") || "");
    const source = presets.find((p) => p.id === id);
    if (!source) return { ok: false, error: "Menu not found" };
    const now = new Date().toISOString();
    const copy: MenuPreset = {
      ...JSON.parse(JSON.stringify(source)),
      id: uid("menu"),
      name: `${source.name} (Copy)`,
      status: "DRAFT",
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };
    const result = await saveAllPresets(admin, [copy, ...presets]);
    return result.ok
      ? { ok: true, message: "Menu duplicated" }
      : { ok: false, error: result.error };
  }

  if (intent === "publish_default") {
    const id = String(formData.get("id") || "");
    const next = presets.map((p) =>
      p.id === id
        ? {
            ...p,
            status: "PUBLISHED" as const,
            isDefault: true,
            updatedAt: new Date().toISOString(),
          }
        : { ...p, isDefault: false }
    );
    const result = await saveAllPresets(admin, next);
    if (result.ok) invalidateStorefrontPreviewCache(session.shop);
    return result.ok
      ? { ok: true, message: "Published as active storefront menu" }
      : { ok: false, error: result.error };
  }

  if (intent === "unpublish") {
    const id = String(formData.get("id") || "");
    const next = presets.map((p) =>
      p.id === id
        ? {
            ...p,
            status: "DRAFT" as const,
            isDefault: false,
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    const result = await saveAllPresets(admin, next);
    if (result.ok) invalidateStorefrontPreviewCache(session.shop);
    return result.ok
      ? { ok: true, message: "Moved back to Draft" }
      : { ok: false, error: result.error };
  }

  if (intent === "delete") {
    const id = String(formData.get("id") || "");
    const next = presets.filter((p) => p.id !== id);
    const result = await saveAllPresets(admin, next);
    if (result.ok) invalidateStorefrontPreviewCache(session.shop);
    return result.ok
      ? { ok: true, message: "Menu deleted" }
      : { ok: false, error: result.error };
  }

  return { ok: false, error: "Invalid intent" };
};

export default function MegaMenuDashboard() {
  const { presets, shop, themes } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const fetcher = useFetcher<{
    ok?: boolean;
    message?: string;
    error?: string;
    redirectTo?: string;
  }>();
  const shopify = useAppBridge();

  const [showGuide, setShowGuide] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("Main Menu");

  const [importOpen, setImportOpen] = useState(false);
  const [navMenus, setNavMenus] = useState<ShopifyNavMenuSummary[]>([]);
  const [loadingNavMenus, setLoadingNavMenus] = useState(false);
  const [selectedNavMenuId, setSelectedNavMenuId] = useState("");
  const [importPresetName, setImportPresetName] = useState("");

  const [jsonImportOpen, setJsonImportOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<MenuPreset | null>(null);

  const submitIndex = (data: Record<string, string>) => {
    fetcher.submit(data, { method: "post", action: "/app?index" });
  };

  useEffect(() => {
    if (fetcher.data?.redirectTo) {
      navigate(fetcher.data.redirectTo);
      return;
    }
    if (fetcher.data?.message) {
      clearAllClientPreviewCache();
      shopify.toast.show(fetcher.data.message);
    } else if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify, navigate]);

  const handleExportJson = (preset: MenuPreset) => {
    const blob = new Blob([JSON.stringify(preset, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${preset.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "mega-menu"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    shopify.toast.show(locale === "vi" ? "Đã tải xuống file JSON" : "Exported menu JSON");
  };

  const openImportModal = async () => {
    setImportOpen(true);
    setLoadingNavMenus(true);
    try {
      const res = await fetch("/api/shopify-menus");
      const json = await res.json();
      const list = (json.menus || []) as ShopifyNavMenuSummary[];
      setNavMenus(list);
      const main = list.find((m) => m.handle === "main-menu") || list[0];
      if (main) {
        setSelectedNavMenuId(main.id);
        setImportPresetName(`${main.title} (Imported)`);
      }
    } finally {
      setLoadingNavMenus(false);
    }
  };

  const themeEditorUrl = `https://${shop}/admin/themes/current/editor?context=apps`;

  return (
    <Page
      title={t("appName")}
      subtitle={t("appTagline")}
      titleMetadata={<LanguageSwitcher />}
      primaryAction={{
        content: t("dashboardCreateBtn"),
        icon: PlusIcon,
        onAction: () => setCreateOpen(true),
      }}
      secondaryActions={[
        {
          content: t("dashboardDemoBtn"),
          onAction: () => submitIndex({ intent: "create_demo" }),
        },
        {
          content: t("dashboardImportNavBtn"),
          icon: ImportIcon,
          onAction: openImportModal,
        },
        {
          content: t("dashboardImportJsonBtn"),
          onAction: () => setJsonImportOpen(true),
        },
        {
          content: t("dashboardThemeEditorBtn"),
          url: themeEditorUrl,
          external: true,
        },
      ]}
    >
      <BlockStack gap="400">
        {showGuide && (
          <Banner
            title={t("dashboardGuideTitle")}
            tone="info"
            onDismiss={() => setShowGuide(false)}
          >
            <BlockStack gap="100">
              <Text as="p" variant="bodySm">
                1. {t("dashboardGuideStep1")}
              </Text>
              <Text as="p" variant="bodySm">
                2. {t("dashboardGuideStep2")}
              </Text>
              <Text as="p" variant="bodySm">
                3. {t("dashboardGuideStep3")}
              </Text>
            </BlockStack>
          </Banner>
        )}

        <Card padding="0">
          {presets.length === 0 ? (
            <EmptyState
              heading={t("dashboardEmptyTitle")}
              action={{
                content: t("dashboardDemoBtn"),
                onAction: () => submitIndex({ intent: "create_demo" }),
              }}
              secondaryAction={{
                content: t("dashboardImportNavBtn"),
                onAction: openImportModal,
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>{t("dashboardEmptyDesc")}</p>
            </EmptyState>
          ) : (
            <ResourceList
              resourceName={{ singular: "menu", plural: "menus" }}
              items={presets}
              renderItem={(preset) => {
                const { id, name, status, isDefault, items, schedule, updatedAt } = preset;
                return (
                  <ResourceItem
                    id={id}
                    onClick={() => navigate(`/app/menus/${id}`)}
                    accessibilityLabel={`${t("edit")} ${name}`}
                  >
                    <InlineStack align="space-between" blockAlign="center" gap="300" wrap>
                      <BlockStack gap="100">
                        <InlineStack gap="200" blockAlign="center" wrap>
                          <Text variant="headingSm" as="h3">
                            {name}
                          </Text>
                          <Badge tone={status === "PUBLISHED" ? "success" : "info"}>
                            {status === "PUBLISHED"
                              ? t("statusPublished")
                              : t("statusDraft")}
                          </Badge>
                          {isDefault && (
                            <Badge tone="attention">{t("badgeDefault")}</Badge>
                          )}
                          {(preset.assignedThemeIds || []).map((tid) => {
                            const th = themes.find((x) => x.numericId === tid);
                            return (
                              <Badge
                                key={tid}
                                tone={th?.role === "MAIN" ? "success" : "info"}
                              >
                                {th ? `Theme: ${th.name}` : `Theme #${tid}`}
                              </Badge>
                            );
                          })}
                          {schedule?.enabled && (
                            <Badge tone="warning">
                              {`${t("badgeScheduled")} (${schedule.startAt || "..."} → ${schedule.endAt || "..."})`}
                            </Badge>
                          )}
                        </InlineStack>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {items.length} {t("dashboardTabsCount")} • {t("dashboardUpdated")}:{" "}
                          {new Date(updatedAt).toLocaleString(
                            locale === "vi" ? "vi-VN" : "en-US"
                          )}
                        </Text>
                      </BlockStack>

                      <div onClick={(e) => e.stopPropagation()}>
                        <InlineStack gap="200" wrap>
                          <Button
                            size="slim"
                            onClick={() => navigate(`/app/menus/${id}`)}
                          >
                            {t("edit")}
                          </Button>
                          {!(status === "PUBLISHED" && isDefault) ? (
                            <Button
                              size="slim"
                              variant="primary"
                              onClick={() =>
                                submitIndex({ intent: "publish_default", id })
                              }
                            >
                              {t("dashboardPublishDefault")}
                            </Button>
                          ) : (
                            <Button
                              size="slim"
                              onClick={() =>
                                submitIndex({ intent: "unpublish", id })
                              }
                            >
                              {t("dashboardUnpublish")}
                            </Button>
                          )}
                          <Button
                            size="slim"
                            icon={ClipboardIcon}
                            onClick={() => {
                              navigator.clipboard?.writeText(id);
                              shopify.toast.show(t("dashboardCopyPresetIdToast"));
                            }}
                          >
                            {t("dashboardCopyPresetId")}
                          </Button>
                          <Button
                            size="slim"
                            icon={ExportIcon}
                            onClick={() => handleExportJson(preset)}
                          >
                            {t("dashboardExportJson")}
                          </Button>
                          <Button
                            size="slim"
                            onClick={() =>
                              submitIndex({ intent: "duplicate", id })
                            }
                          >
                            {t("duplicate")}
                          </Button>
                          <Button
                            size="slim"
                            tone="critical"
                            onClick={() => setDeleteTarget(preset)}
                          >
                            {t("delete")}
                          </Button>
                        </InlineStack>
                      </div>
                    </InlineStack>
                  </ResourceItem>
                );
              }}
            />
          )}
        </Card>
      </BlockStack>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("createModalTitle")}
        primaryAction={{
          content: t("createModalConfirm"),
          loading: fetcher.state !== "idle",
          onAction: () => {
            submitIndex({ intent: "create", name: newName });
            setCreateOpen(false);
          },
        }}
        secondaryActions={[{ content: t("cancel"), onAction: () => setCreateOpen(false) }]}
      >
        <Modal.Section>
          <TextField
            label={t("createModalNameLabel")}
            value={newName}
            onChange={setNewName}
            placeholder={t("createModalNamePlaceholder")}
            autoComplete="off"
          />
        </Modal.Section>
      </Modal>

      {/* Import Navigation Modal */}
      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title={t("importNavTitle")}
        primaryAction={{
          content: t("importNavConfirm"),
          loading: fetcher.state !== "idle",
          disabled: !selectedNavMenuId || loadingNavMenus,
          onAction: () => {
            submitIndex({
              intent: "import",
              menuId: selectedNavMenuId,
              presetName: importPresetName,
            });
            setImportOpen(false);
          },
        }}
        secondaryActions={[{ content: t("cancel"), onAction: () => setImportOpen(false) }]}
      >
        <Modal.Section>
          {loadingNavMenus ? (
            <div style={{ padding: "24px", textAlign: "center" }}>
              <Spinner />
              <Text as="p" variant="bodySm">
                {t("importNavLoading")}
              </Text>
            </div>
          ) : (
            <BlockStack gap="300">
              <Text as="p" variant="bodySm" tone="subdued">
                {t("importNavDesc")}
              </Text>
              <Select
                label={t("importNavSelectLabel")}
                options={navMenus.map((m) => ({
                  label: `${m.title} (${m.handle} — ${m.itemCount} items)`,
                  value: m.id,
                }))}
                value={selectedNavMenuId}
                onChange={(val) => {
                  setSelectedNavMenuId(val);
                  const found = navMenus.find((m) => m.id === val);
                  if (found) setImportPresetName(`${found.title} (Imported)`);
                }}
              />
              <TextField
                label={t("importNavNameLabel")}
                value={importPresetName}
                onChange={setImportPresetName}
                autoComplete="off"
              />
            </BlockStack>
          )}
        </Modal.Section>
      </Modal>

      {/* Import JSON Modal */}
      <Modal
        open={jsonImportOpen}
        onClose={() => setJsonImportOpen(false)}
        title={t("importJsonTitle")}
        primaryAction={{
          content: t("importJsonConfirm"),
          loading: fetcher.state !== "idle",
          disabled: !jsonInput.trim(),
          onAction: () => {
            submitIndex({ intent: "import_json", json: jsonInput });
            setJsonImportOpen(false);
            setJsonInput("");
          },
        }}
        secondaryActions={[{ content: t("cancel"), onAction: () => setJsonImportOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodySm" tone="subdued">
              {t("importJsonDesc")}
            </Text>
            <TextField
              label={t("importJsonLabel")}
              value={jsonInput}
              onChange={setJsonInput}
              multiline={8}
              monospaced
              placeholder='{"name": "Main Menu", "items": [...]}'
              autoComplete="off"
            />
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={t("dashboardDeleteTitle")}
        primaryAction={{
          content: t("dashboardDeleteConfirm"),
          destructive: true,
          onAction: () => {
            if (deleteTarget) {
              submitIndex({ intent: "delete", id: deleteTarget.id });
            }
            setDeleteTarget(null);
          },
        }}
        secondaryActions={[
          { content: t("cancel"), onAction: () => setDeleteTarget(null) },
        ]}
      >
        <Modal.Section>
          <Text as="p" variant="bodyMd">
            {deleteTarget?.name}: {t("dashboardDeleteDesc")}
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
