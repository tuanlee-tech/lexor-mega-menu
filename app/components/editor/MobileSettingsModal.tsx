import { useEffect, useState } from "react";
import { Checkbox, FormLayout, Modal, TextField } from "@shopify/polaris";
import type { MobileDrawerSettings } from "../../types/menu";
import { useI18n } from "../../lib/i18n";
import { ColorField } from "../ColorField";

interface MobileSettingsModalProps {
  open: boolean;
  settings: MobileDrawerSettings;
  onClose: () => void;
  onSave: (updated: MobileDrawerSettings) => void;
}

export function MobileSettingsModal({
  open,
  settings,
  onClose,
  onSave,
}: MobileSettingsModalProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<MobileDrawerSettings>(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("mobileModalTitle")}
      primaryAction={{
        content: t("mobileModalSave"),
        onAction: () => {
          onSave(draft);
          onClose();
        },
      }}
      secondaryActions={[{ content: t("cancel"), onAction: onClose }]}
    >
      <Modal.Section>
        <FormLayout>
          <Checkbox
            label={t("mobileShowAccount")}
            checked={draft.showAccountLink}
            onChange={(checked) =>
              setDraft({ ...draft, showAccountLink: checked })
            }
          />
          <Checkbox
            label={t("mobileShowPhone")}
            checked={draft.showPhoneButton}
            onChange={(checked) =>
              setDraft({ ...draft, showPhoneButton: checked })
            }
          />
          {draft.showPhoneButton && (
            <>
              <FormLayout.Group>
                <TextField
                  label={t("mobilePhoneDisplay")}
                  value={draft.phoneDisplay}
                  onChange={(val) => setDraft({ ...draft, phoneDisplay: val })}
                  placeholder="(866) 733-4772"
                  autoComplete="off"
                />
                <TextField
                  label={t("mobilePhoneHref")}
                  value={draft.phoneHref}
                  onChange={(val) => setDraft({ ...draft, phoneHref: val })}
                  placeholder="tel:8667334772"
                  autoComplete="off"
                />
              </FormLayout.Group>
              <ColorField
                label={t("mobilePhoneBg")}
                value={draft.phoneBgColor}
                onChange={(val) => setDraft({ ...draft, phoneBgColor: val })}
                placeholder="#8C1B11"
                defaultSwatch="#8C1B11"
              />
            </>
          )}
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
}
