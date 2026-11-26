import {
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  FormLayout,
  InlineStack,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import type {
  DeviceVisibility,
  TopLevelItem,
  TopLevelItemType,
} from "../../types/menu";
import { createDefaultColumn, uid } from "../../lib/menu-utils";
import { useI18n } from "../../lib/i18n";
import { ColorField } from "../ColorField";
import { MegaColumnsEditor } from "./MegaColumnsEditor";

interface TabConfigPanelProps {
  tab: TopLevelItem;
  onChange: (updated: TopLevelItem) => void;
  onDelete: () => void;
}

export function TabConfigPanel({ tab, onChange, onDelete }: TabConfigPanelProps) {
  const { t } = useI18n();

  return (
    <BlockStack gap="400">
      <Card>
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h2" variant="headingMd">
              {t("tabConfigTitle")}: {tab.title || "(Untitled)"}
            </Text>
            <Button tone="critical" size="slim" icon={DeleteIcon} onClick={onDelete}>
              {t("tabDeleteBtn")}
            </Button>
          </InlineStack>

          <FormLayout>
            <FormLayout.Group>
              <TextField
                label={t("tabLabel")}
                value={tab.title}
                onChange={(v) => onChange({ ...tab, title: v })}
                autoComplete="off"
              />
              <Select
                label={t("tabType")}
                options={[
                  { label: t("tabTypeMega"), value: "mega_menu" },
                  { label: t("tabTypeSimple"), value: "simple_link" },
                  { label: t("tabTypeDropdown"), value: "dropdown" },
                ]}
                value={tab.type}
                onChange={(v) => {
                  const nextType = v as TopLevelItemType;
                  onChange({
                    ...tab,
                    type: nextType,
                    columns:
                      nextType === "mega_menu" && tab.columns.length === 0
                        ? [createDefaultColumn(0)]
                        : tab.columns,
                  });
                }}
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <TextField
                label={t("tabUrl")}
                value={tab.url}
                onChange={(v) => onChange({ ...tab, url: v })}
                placeholder="/collections/..."
                autoComplete="off"
              />
              <ColorField
                label={t("tabHighlight")}
                value={tab.highlightColor || ""}
                onChange={(v) =>
                  onChange({ ...tab, highlightColor: v || undefined })
                }
                placeholder={t("tabHighlightPlaceholder")}
                defaultSwatch="#D93829"
              />
            </FormLayout.Group>

            <FormLayout.Group>
              <Select
                label={t("tabVisibility")}
                options={[
                  { label: t("bothDevices"), value: "all" },
                  { label: t("desktopOnly"), value: "desktop" },
                  { label: t("mobileOnly"), value: "mobile" },
                ]}
                value={tab.visibility}
                onChange={(v) =>
                  onChange({ ...tab, visibility: v as DeviceVisibility })
                }
              />
            </FormLayout.Group>

            <InlineStack gap="400" wrap>
              <Checkbox
                label={t("tabEnableBadge")}
                checked={Boolean(tab.badge)}
                onChange={(checked) =>
                  onChange({
                    ...tab,
                    badge: checked
                      ? { text: "SALE", bgColor: "#D93829", textColor: "#FFFFFF" }
                      : null,
                  })
                }
              />
              <Checkbox
                label={t("tabEnableSchedule")}
                checked={Boolean(tab.schedule?.enabled)}
                onChange={(checked) =>
                  onChange({
                    ...tab,
                    schedule: {
                      enabled: checked,
                      startAt: tab.schedule?.startAt || "",
                      endAt: tab.schedule?.endAt || "",
                    },
                  })
                }
              />
            </InlineStack>

            {tab.badge && (
              <FormLayout.Group condensed>
                <TextField
                  label={t("badgeText")}
                  value={tab.badge.text}
                  onChange={(v) =>
                    onChange({ ...tab, badge: { ...tab.badge!, text: v } })
                  }
                  autoComplete="off"
                />
                <ColorField
                  label={t("badgeBg")}
                  value={tab.badge.bgColor}
                  onChange={(v) =>
                    onChange({ ...tab, badge: { ...tab.badge!, bgColor: v } })
                  }
                  defaultSwatch="#D93829"
                />
                <ColorField
                  label={t("badgeColor")}
                  value={tab.badge.textColor}
                  onChange={(v) =>
                    onChange({ ...tab, badge: { ...tab.badge!, textColor: v } })
                  }
                  defaultSwatch="#FFFFFF"
                />
              </FormLayout.Group>
            )}

            {tab.schedule?.enabled && (
              <FormLayout.Group>
                <TextField
                  label={t("editorScheduleStart")}
                  type="datetime-local"
                  value={tab.schedule.startAt || ""}
                  onChange={(v) =>
                    onChange({
                      ...tab,
                      schedule: { ...tab.schedule!, startAt: v },
                    })
                  }
                  autoComplete="off"
                />
                <TextField
                  label={t("editorScheduleEnd")}
                  type="datetime-local"
                  value={tab.schedule.endAt || ""}
                  onChange={(v) =>
                    onChange({
                      ...tab,
                      schedule: { ...tab.schedule!, endAt: v },
                    })
                  }
                  autoComplete="off"
                />
              </FormLayout.Group>
            )}
          </FormLayout>
        </BlockStack>
      </Card>

      {tab.type === "mega_menu" && (
        <MegaColumnsEditor
          columns={tab.columns}
          onChange={(cols) => onChange({ ...tab, columns: cols })}
        />
      )}

      {tab.type === "dropdown" && (
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h3" variant="headingMd">
                {t("dropdownHeading")}
              </Text>
              <Button
                size="slim"
                icon={PlusIcon}
                onClick={() =>
                  onChange({
                    ...tab,
                    dropdownLinks: [
                      ...tab.dropdownLinks,
                      { id: uid("dd"), title: "New Link", url: "/", children: [] },
                    ],
                  })
                }
              >
                {t("dropdownAddLink")}
              </Button>
            </InlineStack>

            {tab.dropdownLinks.map((dd, idx) => (
              <BlockStack key={dd.id} gap="200">
                {idx > 0 && <Divider />}
                <FormLayout.Group condensed>
                  <TextField
                    label={t("dropdownTitleLabel")}
                    value={dd.title}
                    onChange={(v) =>
                      onChange({
                        ...tab,
                        dropdownLinks: tab.dropdownLinks.map((x) =>
                          x.id === dd.id ? { ...x, title: v } : x
                        ),
                      })
                    }
                    autoComplete="off"
                  />
                  <TextField
                    label="URL"
                    value={dd.url}
                    onChange={(v) =>
                      onChange({
                        ...tab,
                        dropdownLinks: tab.dropdownLinks.map((x) =>
                          x.id === dd.id ? { ...x, url: v } : x
                        ),
                      })
                    }
                    autoComplete="off"
                  />
                  <div style={{ paddingTop: "24px" }}>
                    <Button
                      tone="critical"
                      size="slim"
                      icon={DeleteIcon}
                      onClick={() =>
                        onChange({
                          ...tab,
                          dropdownLinks: tab.dropdownLinks.filter(
                            (x) => x.id !== dd.id
                          ),
                        })
                      }
                      accessibilityLabel={t("delete")}
                    />
                  </div>
                </FormLayout.Group>
              </BlockStack>
            ))}
          </BlockStack>
        </Card>
      )}
    </BlockStack>
  );
}
