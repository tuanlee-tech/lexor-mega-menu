import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  BlockStack,
  Button,
  Checkbox,
  Divider,
  FormLayout,
  InlineStack,
  Modal,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import type { DeviceVisibility, MegaItem, MegaItemType } from "../../types/menu";
import { useI18n } from "../../lib/i18n";
import { ColorField } from "../ColorField";
import { ShopifyFilePickerModal } from "./ShopifyFilePickerModal";

interface ItemEditorModalProps {
  open: boolean;
  item: MegaItem | null;
  onClose: () => void;
  onSave: (updated: MegaItem) => void;
}

export function ItemEditorModal({
  open,
  item,
  onClose,
  onSave,
}: ItemEditorModalProps) {
  const shopify = useAppBridge();
  const { t } = useI18n();
  const [draft, setDraft] = useState<MegaItem | null>(item);
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [pages, setPages] = useState<{ id: string; title: string; url: string }[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  useEffect(() => {
    setDraft(item ? { ...item } : null);
  }, [item, open]);

  if (!draft) return null;

  const pickShopifyResource = async (type: "product" | "collection") => {
    try {
      const selected = await shopify.resourcePicker({
        type,
        multiple: false,
      });
      if (!selected || selected.length === 0) return;
      const res = selected[0] as {
        id: string;
        title: string;
        handle: string;
        images?: { originalSrc?: string }[];
        image?: { originalSrc?: string };
      };
      const imgUrl =
        type === "product"
          ? res.images?.[0]?.originalSrc
          : res.image?.originalSrc;
      const pathPrefix = type === "product" ? "/products/" : "/collections/";
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              resourceId: res.id,
              resourceHandle: res.handle,
              title: res.title,
              url: `${pathPrefix}${res.handle}`,
              imageUrl: prev.imageUrl || imgUrl,
            }
          : prev
      );
    } catch (e) {
      console.error("Resource picker error:", e);
    }
  };

  const loadPages = async () => {
    setLoadingPages(true);
    try {
      const res = await fetch("/api/shopify-pages");
      const json = await res.json();
      setPages(json.pages || []);
    } finally {
      setLoadingPages(false);
    }
  };

  const hasBadge = Boolean(draft.badge);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={t("itemModalTitle")}
        primaryAction={{
          content: t("itemModalSave"),
          onAction: () => {
            onSave(draft);
            onClose();
          },
        }}
        secondaryActions={[{ content: t("cancel"), onAction: onClose }]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <FormLayout>
              <Select
                label={t("itemTypeLabel")}
                options={[
                  { label: t("itemTypeProduct"), value: "product" },
                  { label: t("itemTypeCollection"), value: "collection" },
                  { label: t("itemTypePage"), value: "page" },
                  { label: t("itemTypeButton"), value: "button" },
                  { label: t("itemTypeText"), value: "text_link" },
                ]}
                value={draft.type}
                onChange={(val) =>
                  setDraft({ ...draft, type: val as MegaItemType })
                }
              />

              {draft.type === "product" && (
                <InlineStack gap="200" blockAlign="center">
                  <Button onClick={() => pickShopifyResource("product")}>
                    {t("itemPickProduct")}
                  </Button>
                  {draft.resourceHandle && (
                    <Text as="span" variant="bodySm" tone="subdued">
                      Handle: {draft.resourceHandle}
                    </Text>
                  )}
                </InlineStack>
              )}

              {draft.type === "collection" && (
                <InlineStack gap="200" blockAlign="center">
                  <Button onClick={() => pickShopifyResource("collection")}>
                    {t("itemPickCollection")}
                  </Button>
                  {draft.resourceHandle && (
                    <Text as="span" variant="bodySm" tone="subdued">
                      Handle: {draft.resourceHandle}
                    </Text>
                  )}
                </InlineStack>
              )}

              {draft.type === "page" && (
                <BlockStack gap="200">
                  <InlineStack gap="200">
                    <Button onClick={loadPages} loading={loadingPages}>
                      {t("itemPickPage")}
                    </Button>
                  </InlineStack>
                  {pages.length > 0 && (
                    <Select
                      label={t("itemPickPage")}
                      labelHidden
                      options={[
                        { label: t("itemSelectPagePlaceholder"), value: "" },
                        ...pages.map((p) => ({
                          label: `${p.title} (${p.url})`,
                          value: p.url,
                        })),
                      ]}
                      value=""
                      onChange={(val) => {
                        const found = pages.find((p) => p.url === val);
                        if (found) {
                          setDraft({
                            ...draft,
                            title: found.title,
                            url: found.url,
                            resourceId: found.id,
                          });
                        }
                      }}
                    />
                  )}
                </BlockStack>
              )}

              <FormLayout.Group>
                <TextField
                  label={
                    draft.type === "button"
                      ? t("itemButtonTextLabel")
                      : t("itemTitleLabel")
                  }
                  value={draft.title}
                  onChange={(val) =>
                    setDraft({
                      ...draft,
                      title: val,
                      btnText: draft.type === "button" ? val : draft.btnText,
                    })
                  }
                  autoComplete="off"
                />
                <TextField
                  label={t("itemUrlLabel")}
                  value={draft.url}
                  onChange={(val) => setDraft({ ...draft, url: val })}
                  placeholder="/products/..."
                  autoComplete="off"
                />
              </FormLayout.Group>

              {draft.type !== "button" && draft.type !== "text_link" && (
                <>
                  <TextField
                    label={t("itemSubLinkLabel")}
                    value={draft.btnText || ""}
                    onChange={(val) => setDraft({ ...draft, btnText: val })}
                    autoComplete="off"
                  />

                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      {t("itemImageLabel")}
                    </Text>
                    <InlineStack gap="300" blockAlign="center">
                      {draft.imageUrl ? (
                        <img
                          src={draft.imageUrl}
                          alt={draft.title}
                          style={{
                            width: "64px",
                            height: "64px",
                            objectFit: "contain",
                            border: "1px solid #E1E3E5",
                            borderRadius: "6px",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "64px",
                            height: "64px",
                            border: "1px dashed #C9CCCF",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            color: "#8C9196",
                          }}
                        >
                          No img
                        </div>
                      )}
                      <BlockStack gap="100">
                        <InlineStack gap="200">
                          <Button onClick={() => setFilePickerOpen(true)}>
                            {t("itemPickFile")}
                          </Button>
                          {draft.imageUrl && (
                            <Button
                              tone="critical"
                              variant="plain"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  imageUrl: undefined,
                                  imageFilename: undefined,
                                })
                              }
                            >
                              {t("itemRemoveImage")}
                            </Button>
                          )}
                        </InlineStack>
                        {draft.imageFilename && (
                          <Text as="span" variant="bodySm" tone="subdued">
                            {draft.imageFilename}
                          </Text>
                        )}
                      </BlockStack>
                    </InlineStack>
                  </BlockStack>
                </>
              )}

              {draft.type === "button" && (
                <ColorField
                  label={t("itemButtonColorLabel")}
                  value={draft.buttonBgColor || ""}
                  onChange={(val) => setDraft({ ...draft, buttonBgColor: val })}
                  placeholder="#8C1B11"
                  defaultSwatch="#8C1B11"
                />
              )}

              <Divider />

              <Select
                label={t("tabVisibility")}
                options={[
                  { label: t("bothDevices"), value: "all" },
                  { label: t("desktopOnly"), value: "desktop" },
                  { label: t("mobileOnly"), value: "mobile" },
                ]}
                value={draft.visibility}
                onChange={(val) =>
                  setDraft({ ...draft, visibility: val as DeviceVisibility })
                }
              />

              <Checkbox
                label={t("tabEnableBadge")}
                checked={hasBadge}
                onChange={(checked) =>
                  setDraft({
                    ...draft,
                    badge: checked
                      ? { text: "NEW", bgColor: "#8C1B11", textColor: "#FFFFFF" }
                      : null,
                  })
                }
              />

              {draft.badge && (
                <FormLayout.Group condensed>
                  <TextField
                    label={t("badgeText")}
                    value={draft.badge.text}
                    onChange={(val) =>
                      setDraft({
                        ...draft,
                        badge: { ...draft.badge!, text: val },
                      })
                    }
                    autoComplete="off"
                  />
                  <ColorField
                    label={t("badgeBg")}
                    value={draft.badge.bgColor}
                    onChange={(val) =>
                      setDraft({
                        ...draft,
                        badge: { ...draft.badge!, bgColor: val },
                      })
                    }
                    defaultSwatch="#8C1B11"
                  />
                  <ColorField
                    label={t("badgeColor")}
                    value={draft.badge.textColor}
                    onChange={(val) =>
                      setDraft({
                        ...draft,
                        badge: { ...draft.badge!, textColor: val },
                      })
                    }
                    defaultSwatch="#FFFFFF"
                  />
                </FormLayout.Group>
              )}

              <Checkbox
                label={t("itemEnableSchedule")}
                checked={Boolean(draft.schedule?.enabled)}
                onChange={(checked) =>
                  setDraft({
                    ...draft,
                    schedule: {
                      enabled: checked,
                      startAt: draft.schedule?.startAt || "",
                      endAt: draft.schedule?.endAt || "",
                    },
                  })
                }
              />

              {draft.schedule?.enabled && (
                <FormLayout.Group>
                  <TextField
                    label={t("editorScheduleStart")}
                    type="datetime-local"
                    value={draft.schedule.startAt || ""}
                    onChange={(val) =>
                      setDraft({
                        ...draft,
                        schedule: { ...draft.schedule!, startAt: val },
                      })
                    }
                    autoComplete="off"
                  />
                  <TextField
                    label={t("editorScheduleEnd")}
                    type="datetime-local"
                    value={draft.schedule.endAt || ""}
                    onChange={(val) =>
                      setDraft({
                        ...draft,
                        schedule: { ...draft.schedule!, endAt: val },
                      })
                    }
                    autoComplete="off"
                  />
                </FormLayout.Group>
              )}
            </FormLayout>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <ShopifyFilePickerModal
        open={filePickerOpen}
        onClose={() => setFilePickerOpen(false)}
        onSelect={({ url, filename }) =>
          setDraft((prev) =>
            prev ? { ...prev, imageUrl: url, imageFilename: filename } : prev
          )
        }
      />
    </>
  );
}
