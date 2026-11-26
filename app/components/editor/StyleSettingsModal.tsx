import { useEffect, useState } from "react";
import {
  Banner,
  BlockStack,
  Checkbox,
  Divider,
  FormLayout,
  Modal,
  Text,
  TextField,
} from "@shopify/polaris";
import type { MenuStyleSettings } from "../../types/menu";
import { createDefaultStyleSettings } from "../../lib/menu-utils";
import { useI18n } from "../../lib/i18n";
import { ColorField } from "../ColorField";

interface StyleSettingsModalProps {
  open: boolean;
  settings?: MenuStyleSettings;
  onClose: () => void;
  onSave: (updated: MenuStyleSettings) => void;
}

export function StyleSettingsModal({
  open,
  settings,
  onClose,
  onSave,
}: StyleSettingsModalProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<MenuStyleSettings>(
    () => settings || createDefaultStyleSettings()
  );

  useEffect(() => {
    setDraft(
      settings
        ? { ...createDefaultStyleSettings(), ...settings }
        : createDefaultStyleSettings()
    );
  }, [settings, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("styleModalTitle")}
      size="large"
      primaryAction={{
        content: t("styleModalSave"),
        onAction: () => {
          onSave(draft);
          onClose();
        },
      }}
      secondaryActions={[
        {
          content: t("styleModalReset"),
          onAction: () => setDraft(createDefaultStyleSettings()),
        },
        { content: t("cancel"), onAction: onClose },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Banner tone="info">
            <p>{t("styleModalBanner")}</p>
          </Banner>

          <FormLayout>
            <Checkbox
              label={t("styleInheritLabel")}
              checked={draft.inheritThemeCss}
              onChange={(checked) =>
                setDraft({ ...draft, inheritThemeCss: checked })
              }
            />

            <Divider />

            <Text as="h3" variant="headingSm">
              {t("styleTokensHeading")}
            </Text>

            <FormLayout.Group>
              <TextField
                label={t("styleFontFamily")}
                value={draft.fontFamily}
                onChange={(v) => setDraft({ ...draft, fontFamily: v })}
                placeholder="'Gotham', sans-serif"
                autoComplete="off"
              />
              <TextField
                label={t("styleImageSize")}
                type="number"
                min={64}
                max={240}
                value={String(draft.imageSizePx)}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    imageSizePx: Math.max(64, Math.min(240, Number(v) || 128)),
                  })
                }
                autoComplete="off"
              />
            </FormLayout.Group>

            <FormLayout.Group condensed>
              <ColorField
                label={t("styleDropdownBg")}
                value={draft.dropdownBgColor}
                onChange={(v) => setDraft({ ...draft, dropdownBgColor: v })}
                defaultSwatch="#FFFFFF"
              />
              <ColorField
                label={t("styleTabHoverBg")}
                value={draft.tabHoverBgColor}
                onChange={(v) => setDraft({ ...draft, tabHoverBgColor: v })}
                defaultSwatch="#333333"
              />
              <ColorField
                label={t("styleDividerColor")}
                value={draft.dividerColor}
                onChange={(v) => setDraft({ ...draft, dividerColor: v })}
                defaultSwatch="#C6C6C6"
              />
            </FormLayout.Group>

            <FormLayout.Group condensed>
              <ColorField
                label={t("styleHeadingColor")}
                value={draft.headingColor}
                onChange={(v) => setDraft({ ...draft, headingColor: v })}
                defaultSwatch="#8C1B11"
              />
              <ColorField
                label={t("styleItemTitleColor")}
                value={draft.itemTitleColor}
                onChange={(v) => setDraft({ ...draft, itemTitleColor: v })}
                defaultSwatch="#333333"
              />
              <ColorField
                label={t("styleItemLinkColor")}
                value={draft.itemLinkColor}
                onChange={(v) => setDraft({ ...draft, itemLinkColor: v })}
                defaultSwatch="#4B4B4B"
              />
            </FormLayout.Group>

            <Divider />

            <TextField
              label={t("styleCustomCssLabel")}
              value={draft.customCss}
              onChange={(v) => setDraft({ ...draft, customCss: v })}
              multiline={8}
              monospaced
              placeholder={`/* Custom CSS overrides */\n.lmm-desktop-nav .mega-menu__content {\n  padding: 40px 24px;\n}`}
              autoComplete="off"
            />
          </FormLayout>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
