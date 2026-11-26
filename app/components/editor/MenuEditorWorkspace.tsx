import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Badge,
  BlockStack,
  Button,
  Card,
  Checkbox,
  FormLayout,
  InlineStack,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  DragHandleIcon,
  MobileIcon,
  PaintBrushFlatIcon,
  PlusIcon,
} from "@shopify/polaris-icons";
import type { MenuPreset, TopLevelItem } from "../../types/menu";
import { createDefaultTopLevelItem } from "../../lib/menu-utils";
import { useI18n } from "../../lib/i18n";
import { LivePreviewPane } from "../preview/LivePreviewPane";
import { TabConfigPanel } from "./TabConfigPanel";
import { MobileSettingsModal } from "./MobileSettingsModal";
import { StyleSettingsModal } from "./StyleSettingsModal";

interface MenuEditorWorkspaceProps {
  preset: MenuPreset;
  onChange: (updated: MenuPreset) => void;
}

function SortableTabChip({
  tab,
  selected,
  onSelect,
  onDelete,
  deleteLabel,
}: {
  tab: TopLevelItem;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: tab.id,
  });
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 12px",
        borderRadius: "8px",
        border: selected ? "2px solid #111827" : "1px solid #D1D5DB",
        background: selected ? "#111827" : "#FFFFFF",
        color: selected ? "#FFFFFF" : "#111827",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 600,
        boxShadow: selected ? "0 2px 6px rgba(0,0,0,0.12)" : "none",
      }}
      onClick={onSelect}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", display: "inline-flex", opacity: 0.7 }}
        onClick={(e) => e.stopPropagation()}
      >
        <DragHandleIcon width={14} height={14} />
      </span>
      {tab.highlightColor && (
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: tab.highlightColor,
            display: "inline-block",
          }}
        />
      )}
      <span>{tab.title || "(Untitled)"}</span>
      <button
        type="button"
        title={deleteLabel}
        aria-label={deleteLabel}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          position: "absolute",
          top: "-7px",
          right: "-7px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          border: "1.5px solid #FFFFFF",
          background: "#DC2626",
          color: "#FFFFFF",
          fontSize: "11px",
          fontWeight: 700,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          opacity: hovered ? 1 : 0,
          pointerEvents: hovered ? "auto" : "none",
          transition: "opacity 0.15s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        ×
      </button>
    </div>
  );
}

export function MenuEditorWorkspace({
  preset,
  onChange,
}: MenuEditorWorkspaceProps) {
  const { t } = useI18n();
  const [selectedTabId, setSelectedTabId] = useState<string | null>(
    preset.items[0]?.id || null
  );
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [styleSettingsOpen, setStyleSettingsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const selectedTab =
    preset.items.find((tItem) => tItem.id === selectedTabId) ||
    preset.items[0] ||
    null;

  const handleTabDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = preset.items.findIndex((item) => item.id === active.id);
    const newIdx = preset.items.findIndex((item) => item.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      onChange({ ...preset, items: arrayMove(preset.items, oldIdx, newIdx) });
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(420px, 1.05fr) minmax(420px, 0.95fr)",
        gap: "16px",
        alignItems: "start",
      }}
    >
      {/* LEFT PANE: Visual Builder */}
      <BlockStack gap="400">
        {/* Preset Settings */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center" wrap>
              <InlineStack gap="200" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  {t("editorPresetInfo")}
                </Text>
                {preset.isDefault && (
                  <Badge tone="attention">{t("badgeDefault")}</Badge>
                )}
              </InlineStack>
              <InlineStack gap="200">
                <Button
                  size="slim"
                  icon={PaintBrushFlatIcon}
                  onClick={() => setStyleSettingsOpen(true)}
                >
                  {t("editorStyleBtn")}
                </Button>
                <Button
                  size="slim"
                  icon={MobileIcon}
                  onClick={() => setMobileSettingsOpen(true)}
                >
                  {t("editorMobileBtn")}
                </Button>
              </InlineStack>
            </InlineStack>

            <FormLayout>
              <TextField
                label={t("editorPresetName")}
                value={preset.name}
                onChange={(v) => onChange({ ...preset, name: v })}
                autoComplete="off"
              />
              <Checkbox
                label={t("editorPresetSchedule")}
                checked={Boolean(preset.schedule?.enabled)}
                onChange={(checked) =>
                  onChange({
                    ...preset,
                    schedule: {
                      enabled: checked,
                      startAt: preset.schedule?.startAt || "",
                      endAt: preset.schedule?.endAt || "",
                    },
                  })
                }
              />
              {preset.schedule?.enabled && (
                <FormLayout.Group>
                  <TextField
                    label={t("editorScheduleStart")}
                    type="datetime-local"
                    value={preset.schedule.startAt || ""}
                    onChange={(v) =>
                      onChange({
                        ...preset,
                        schedule: { ...preset.schedule!, startAt: v },
                      })
                    }
                    autoComplete="off"
                  />
                  <TextField
                    label={t("editorScheduleEnd")}
                    type="datetime-local"
                    value={preset.schedule.endAt || ""}
                    onChange={(v) =>
                      onChange({
                        ...preset,
                        schedule: { ...preset.schedule!, endAt: v },
                      })
                    }
                    autoComplete="off"
                  />
                </FormLayout.Group>
              )}
            </FormLayout>
          </BlockStack>
        </Card>

        {/* Top-level Tabs Bar (Sortable) */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center" wrap>
              <BlockStack gap="050">
                <Text as="h2" variant="headingMd">
                  {t("editorHeaderTabs")} ({preset.items.length})
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {t("editorHeaderTabsHint")}
                </Text>
              </BlockStack>
              <Button
                size="slim"
                variant="primary"
                icon={PlusIcon}
                onClick={() => {
                  const newTab = createDefaultTopLevelItem("mega_menu");
                  onChange({ ...preset, items: [...preset.items, newTab] });
                  setSelectedTabId(newTab.id);
                }}
              >
                {t("editorAddTab")}
              </Button>
            </InlineStack>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTabDragEnd}
            >
              <SortableContext
                items={preset.items.map((item) => item.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", paddingTop: "4px" }}>
                  {preset.items.map((tab) => (
                    <SortableTabChip
                      key={tab.id}
                      tab={tab}
                      selected={selectedTab?.id === tab.id}
                      onSelect={() => setSelectedTabId(tab.id)}
                      deleteLabel={t("tabDeleteBtn")}
                      onDelete={() => {
                        const remaining = preset.items.filter(
                          (item) => item.id !== tab.id
                        );
                        onChange({ ...preset, items: remaining });
                        if (selectedTab?.id === tab.id) {
                          setSelectedTabId(remaining[0]?.id || null);
                        }
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </BlockStack>
        </Card>

        {/* Selected Tab Config */}
        {selectedTab && (
          <TabConfigPanel
            tab={selectedTab}
            onChange={(updatedTab) =>
              onChange({
                ...preset,
                items: preset.items.map((item) =>
                  item.id === updatedTab.id ? updatedTab : item
                ),
              })
            }
            onDelete={() => {
              const remaining = preset.items.filter(
                (item) => item.id !== selectedTab.id
              );
              onChange({ ...preset, items: remaining });
              setSelectedTabId(remaining[0]?.id || null);
            }}
          />
        )}
      </BlockStack>

      {/* RIGHT PANE: Sticky Live Preview */}
      <div style={{ position: "sticky", top: "16px" }}>
        <LivePreviewPane
          preset={preset}
          activeTabId={selectedTab?.id || null}
          onSelectTab={(tabId) => setSelectedTabId(tabId)}
        />
      </div>

      <MobileSettingsModal
        open={mobileSettingsOpen}
        settings={preset.mobileSettings}
        onClose={() => setMobileSettingsOpen(false)}
        onSave={(mobileSettings) => onChange({ ...preset, mobileSettings })}
      />

      <StyleSettingsModal
        open={styleSettingsOpen}
        settings={preset.styleSettings}
        onClose={() => setStyleSettingsOpen(false)}
        onSave={(styleSettings) => onChange({ ...preset, styleSettings })}
      />
    </div>
  );
}
