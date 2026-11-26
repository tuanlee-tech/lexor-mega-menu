import { useState } from "react";
import {
  Badge,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Select,
  Text,
} from "@shopify/polaris";
import { ExternalIcon } from "@shopify/polaris-icons";
import type { MenuPreset, ShopifyThemeSummary } from "../../types/menu";
import { useI18n } from "../../lib/i18n";
import { RealStorefrontPreview } from "./RealStorefrontPreview";

interface LivePreviewPaneProps {
  preset: MenuPreset;
  activeTabId: string | null;
  themes: ShopifyThemeSummary[];
  storefrontUrl: string;
  saveVersion: number;
}

export function LivePreviewPane({
  preset,
  activeTabId,
  themes,
  storefrontUrl,
  saveVersion,
}: LivePreviewPaneProps) {
  const { t } = useI18n();

  const defaultThemeId =
    preset.assignedThemeIds?.[0] ||
    themes.find((th) => th.role === "MAIN")?.numericId ||
    themes[0]?.numericId ||
    "";

  const [selectedThemeId, setSelectedThemeId] = useState<string>(defaultThemeId);

  const currentThemeId = selectedThemeId || defaultThemeId;
  const currentTheme = themes.find((th) => th.numericId === currentThemeId);
  const currentThemeLabel = currentTheme ? currentTheme.name : "";
  const isCurrentThemeAssigned = Boolean(
    currentThemeId && preset.assignedThemeIds?.includes(currentThemeId)
  );

  const externalPreviewUrl = currentThemeId
    ? `${storefrontUrl.replace(/\/$/, "")}/?preview_theme_id=${encodeURIComponent(currentThemeId)}`
    : storefrontUrl;

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center" gap="200" wrap>
          <BlockStack gap="050">
            <InlineStack gap="200" blockAlign="center">
              <Text variant="headingMd" as="h2">
                {t("previewTitle")}
              </Text>
              {isCurrentThemeAssigned && (
                <Badge tone="success">{t("previewAssignedBadge")}</Badge>
              )}
            </InlineStack>
            <Text variant="bodySm" tone="subdued" as="p">
              {t("previewSubtitle")}
            </Text>
          </BlockStack>

          <Button
            size="slim"
            url={externalPreviewUrl}
            external
            icon={ExternalIcon}
          >
            {t("previewOpenExternal")}
          </Button>
        </InlineStack>

        {themes.length > 0 && (
          <Select
            label={t("previewThemeSelect")}
            labelInline
            options={themes.map((th) => {
              const roleLabel =
                th.role === "MAIN" ? t("themeRoleLive") : t("themeRoleDraft");
              const assignedMark = preset.assignedThemeIds?.includes(th.numericId)
                ? ` ★ ${t("previewAssignedBadge")}`
                : "";
              return {
                label: `${th.name} [${roleLabel}]${assignedMark}`,
                value: th.numericId,
              };
            })}
            value={currentThemeId}
            onChange={setSelectedThemeId}
          />
        )}

        <RealStorefrontPreview
          preset={preset}
          activeTabId={activeTabId}
          themeNumericId={currentThemeId}
          themeLabel={currentThemeLabel}
          storefrontUrl={storefrontUrl}
          saveVersion={saveVersion}
        />
      </BlockStack>
    </Card>
  );
}
