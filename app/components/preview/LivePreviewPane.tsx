import { useState } from "react";
import {
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  Checkbox,
  InlineStack,
  Text,
} from "@shopify/polaris";
import { DesktopIcon, MobileIcon } from "@shopify/polaris-icons";
import type { MenuPreset } from "../../types/menu";
import { useI18n } from "../../lib/i18n";
import { DesktopMegaPreview } from "./DesktopMegaPreview";
import { MobileDrawerPreview } from "./MobileDrawerPreview";

interface LivePreviewPaneProps {
  preset: MenuPreset;
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
}

export function LivePreviewPane({
  preset,
  activeTabId,
  onSelectTab,
}: LivePreviewPaneProps) {
  const { t } = useI18n();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [enforceSchedule, setEnforceSchedule] = useState(false);

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center" wrap>
          <BlockStack gap="100">
            <Text variant="headingMd" as="h2">
              {t("previewTitle")}
            </Text>
            <Text variant="bodySm" tone="subdued" as="p">
              {t("previewSubtitle")}
            </Text>
          </BlockStack>
          <ButtonGroup variant="segmented">
            <Button
              pressed={device === "desktop"}
              onClick={() => setDevice("desktop")}
              icon={DesktopIcon}
            >
              {t("desktop")}
            </Button>
            <Button
              pressed={device === "mobile"}
              onClick={() => setDevice("mobile")}
              icon={MobileIcon}
            >
              {t("mobile")}
            </Button>
          </ButtonGroup>
        </InlineStack>

        <Checkbox
          label={t("previewScheduleToggle")}
          checked={enforceSchedule}
          onChange={setEnforceSchedule}
        />

        {device === "desktop" ? (
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
