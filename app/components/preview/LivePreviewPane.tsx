import { useState } from "react";
import {
  Badge,
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  InlineStack,
  Select,
  Text,
} from "@shopify/polaris";
import { DesktopIcon, ExternalIcon, MobileIcon } from "@shopify/polaris-icons";
import type { MenuPreset, ShopifyThemeSummary } from "../../types/menu";
import { useI18n } from "../../lib/i18n";
import { DesktopMegaPreview } from "./DesktopMegaPreview";
import { MobileDrawerPreview } from "./MobileDrawerPreview";
import { RealStorefrontPreview } from "./RealStorefrontPreview";

interface LivePreviewPaneProps {
  preset: MenuPreset;
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  themes: ShopifyThemeSummary[];
  storefrontUrl: string;
}

export function LivePreviewPane({
  preset,
  activeTabId,
  onSelectTab,
  themes,
  storefrontUrl,
}: LivePreviewPaneProps) {
  const { t } = useI18n();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [mode, setMode] = useState<"real" | "mock">("real");
  const [enforceSchedule, setEnforceSchedule] = useState(false);

  const defaultThemeId =
    preset.assignedThemeIds?.[0] ||
    themes.find((th) => th.role === "MAIN")?.numericId ||
    themes[0]?.numericId ||
    "";

  const [selectedThemeId, setSelectedThemeId] = useState<string>(defaultThemeId);

  const currentThemeId = selectedThemeId || defaultThemeId;
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

          <InlineStack gap="200" wrap>
            <ButtonGroup variant="segmented">
              <Button
                size="slim"
                pressed={mode === "real"}
                onClick={() => setMode("real")}
              >
                {t("previewModeReal")}
              </Button>
              <Button
                size="slim"
                pressed={mode === "mock"}
                onClick={() => setMode("mock")}
              >
                {t("previewModeMock")}
              </Button>
            </ButtonGroup>

            <ButtonGroup variant="segmented">
              <Button
                size="slim"
                pressed={device === "desktop"}
                onClick={() => setDevice("desktop")}
                icon={DesktopIcon}
              >
                {t("desktop")}
              </Button>
              <Button
                size="slim"
                pressed={device === "mobile"}
                onClick={() => setDevice("mobile")}
                icon={MobileIcon}
              >
                {t("mobile")}
              </Button>
            </ButtonGroup>
          </InlineStack>
        </InlineStack>

        {themes.length > 0 && (
          <InlineStack gap="200" blockAlign="end" wrap>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <Select
                label={t("previewThemeSelect")}
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
            </div>
            <Button
              url={externalPreviewUrl}
              external
              icon={ExternalIcon}
            >
              {t("previewOpenExternal")}
            </Button>
          </InlineStack>
        )}

        {mode === "mock" && (
          <Checkbox
            label={t("previewScheduleToggle")}
            checked={enforceSchedule}
            onChange={setEnforceSchedule}
          />
        )}

        {mode === "real" ? (
          <RealStorefrontPreview
            preset={preset}
            device={device}
            activeTabId={activeTabId}
            themeNumericId={currentThemeId}
            onFallbackToWireframe={() => setMode("mock")}
          />
        ) : device === "desktop" ? (
          <DesktopMegaPreview
            preset={preset}
            activeTabId={activeTabId}
            onSelectTab={onSelectTab}
            enforceSchedule={enforceSchedule}
          />
        ) : (
          <MobileDrawerPreview
            preset={preset}
            enforceSchedule={enforceSchedule}
          />
        )}
      </BlockStack>
    </Card>
  );
}
