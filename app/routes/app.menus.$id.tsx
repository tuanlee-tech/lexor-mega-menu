import { useEffect, useMemo, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Badge, InlineStack, Page } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { loadAllPresets, saveAllPresets } from "../lib/shopify-menu-storage.server";
import { loadStorefrontThemes } from "../lib/shopify-themes.server";
import { useI18n } from "../lib/i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import type { MenuPreset } from "../types/menu";
import { MenuEditorWorkspace } from "../components/editor/MenuEditorWorkspace";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const [presets, themeCtx] = await Promise.all([
    loadAllPresets(admin),
    loadStorefrontThemes(admin, session.shop),
  ]);
  const preset = presets.find((p) => p.id === params.id);
  if (!preset) {
    throw new Response("Menu preset not found", { status: 404 });
  }
  return {
    preset,
    themes: themeCtx.themes,
    storefrontUrl: themeCtx.storefrontUrl,
    missingThemesScope: Boolean(themeCtx.missingThemesScope),
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") || "save_draft");
  const rawPreset = String(formData.get("preset") || "");

  if (!rawPreset) {
    return { ok: false, error: "Missing menu payload" };
  }

  let incoming: MenuPreset;
  try {
    incoming = JSON.parse(rawPreset) as MenuPreset;
  } catch {
    return { ok: false, error: "Invalid menu JSON" };
  }

  const presets = await loadAllPresets(admin);
  const now = new Date().toISOString();

  const updatedPreset: MenuPreset = {
    ...incoming,
    id: params.id || incoming.id,
    updatedAt: now,
    status: intent === "publish" ? "PUBLISHED" : incoming.status,
    isDefault:
      intent === "publish" && !incoming.schedule?.enabled
        ? true
        : incoming.isDefault,
  };

  const claimedThemes = new Set(updatedPreset.assignedThemeIds || []);

  const nextPresets = presets.map((p) => {
    if (p.id === updatedPreset.id) return updatedPreset;
    const cleanedAssigned = (p.assignedThemeIds || []).filter(
      (tid) => !claimedThemes.has(tid)
    );
    return {
      ...p,
      assignedThemeIds: cleanedAssigned,
      isDefault:
        intent === "publish" && updatedPreset.isDefault ? false : p.isDefault,
    };
  });

  const result = await saveAllPresets(admin, nextPresets);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return {
    ok: true,
    preset: updatedPreset,
    published: intent === "publish",
  };
};

export default function MenuPresetEditorPage() {
  const {
    preset: initialPreset,
    themes,
    storefrontUrl,
    missingThemesScope,
  } = useLoaderData<typeof loader>();
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() =>
    JSON.stringify(initialPreset)
  );
  const [preset, setPreset] = useState<MenuPreset>(initialPreset);
  const { t, locale } = useI18n();
  const fetcher = useFetcher<{
    ok?: boolean;
    published?: boolean;
    error?: string;
    preset?: MenuPreset;
  }>();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  useEffect(() => {
    setPreset(initialPreset);
    setSavedSnapshot(JSON.stringify(initialPreset));
  }, [initialPreset]);

  useEffect(() => {
    if (fetcher.data?.ok && fetcher.data.preset) {
      setPreset(fetcher.data.preset);
      setSavedSnapshot(JSON.stringify(fetcher.data.preset));
      shopify.toast.show(
        fetcher.data.published
          ? locale === "vi"
            ? "Đã lưu & Publish lên Storefront!"
            : "Saved & published to storefront!"
          : locale === "vi"
            ? "Đã lưu bản nháp!"
            : "Draft saved!"
      );
    } else if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify, locale]);

  const isDirty = useMemo(
    () => JSON.stringify(preset) !== savedSnapshot,
    [preset, savedSnapshot]
  );

  const isSaving = fetcher.state !== "idle";

  const handleSave = (intent: "save_draft" | "publish") => {
    fetcher.submit(
      { intent, preset: JSON.stringify(preset) },
      { method: "post" }
    );
  };

  return (
    <Page
      fullWidth
      backAction={{ content: t("editorBack"), onAction: () => navigate("/app") }}
      title={preset.name || t("appName")}
      titleMetadata={
        <InlineStack gap="200" blockAlign="center">
          <Badge tone={preset.status === "PUBLISHED" ? "success" : "info"}>
            {preset.status === "PUBLISHED"
              ? t("statusPublished")
              : t("statusDraft")}
          </Badge>
          {isDirty && (
            <Badge tone="warning">{t("unsavedChanges")}</Badge>
          )}
          <LanguageSwitcher />
        </InlineStack>
      }
      primaryAction={{
        content: preset.schedule?.enabled
          ? t("editorPublishScheduled")
          : t("editorPublishNow"),
        loading: isSaving,
        onAction: () => handleSave("publish"),
      }}
      secondaryActions={[
        {
          content: t("dashboardCopyPresetId"),
          onAction: () => {
            navigator.clipboard?.writeText(preset.id);
            shopify.toast.show(t("dashboardCopyPresetIdToast"));
          },
        },
        {
          content: t("editorSaveDraft"),
          loading: isSaving,
          onAction: () => handleSave("save_draft"),
        },
      ]}
    >
      <MenuEditorWorkspace
        preset={preset}
        onChange={setPreset}
        themes={themes}
        storefrontUrl={storefrontUrl}
        missingThemesScope={missingThemesScope}
      />
    </Page>
  );
}
