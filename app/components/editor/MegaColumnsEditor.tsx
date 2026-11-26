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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  FormLayout,
  InlineStack,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  DeleteIcon,
  DragHandleIcon,
  EditIcon,
  PlusIcon,
} from "@shopify/polaris-icons";
import type {
  DeviceVisibility,
  MegaColumn,
  MegaItem,
  MegaItemType,
} from "../../types/menu";
import { createDefaultColumn, createDefaultMegaItem } from "../../lib/menu-utils";
import { useI18n } from "../../lib/i18n";
import { ItemEditorModal } from "./ItemEditorModal";

interface MegaColumnsEditorProps {
  columns: MegaColumn[];
  onChange: (columns: MegaColumn[]) => void;
}

function SortableItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: MegaItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Box
        padding="200"
        borderWidth="025"
        borderColor="border"
        borderRadius="200"
        background="bg-surface"
      >
        <InlineStack align="space-between" blockAlign="center" gap="200" wrap={false}>
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            <div
              {...attributes}
              {...listeners}
              style={{ cursor: "grab", display: "flex", alignItems: "center" }}
            >
              <DragHandleIcon width={18} height={18} />
            </div>

            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                style={{
                  width: "36px",
                  height: "36px",
                  objectFit: "contain",
                  borderRadius: "4px",
                  border: "1px solid #E1E3E5",
                  background: "#FFF",
                }}
              />
            ) : (
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "4px",
                  background: item.type === "button" ? "#8C1B11" : "#F3F4F6",
                  color: item.type === "button" ? "#FFF" : "#6B7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                {item.type === "button"
                  ? "CTA"
                  : item.type === "text_link"
                    ? "TXT"
                    : "IMG"}
              </div>
            )}

            <BlockStack gap="050">
              <InlineStack gap="100" blockAlign="center" wrap>
                <Text as="span" variant="bodySm" fontWeight="semibold">
                  {item.title || "(Untitled)"}
                </Text>
                <Badge size="small">{item.type}</Badge>
                {item.visibility !== "all" && (
                  <Badge size="small" tone="info">
                    {item.visibility}
                  </Badge>
                )}
                {item.schedule?.enabled && (
                  <Badge size="small" tone="attention">
                    {t("badgeScheduled")}
                  </Badge>
                )}
              </InlineStack>
              <Text as="span" variant="bodyXs" tone="subdued">
                {item.url || "/"}
                {item.btnText ? ` • "${item.btnText}"` : ""}
              </Text>
            </BlockStack>
          </InlineStack>

          <InlineStack gap="100" wrap={false}>
            <Button
              size="slim"
              icon={EditIcon}
              onClick={onEdit}
              accessibilityLabel={t("edit")}
            />
            <Button
              size="slim"
              tone="critical"
              icon={DeleteIcon}
              onClick={onDelete}
              accessibilityLabel={t("delete")}
            />
          </InlineStack>
        </InlineStack>
      </Box>
    </div>
  );
}

function SortableColumnCard({
  col,
  index,
  onUpdate,
  onDelete,
  onEditItem,
  onAddItem,
}: {
  col: MegaColumn;
  index: number;
  onUpdate: (updated: MegaColumn) => void;
  onDelete: () => void;
  onEditItem: (item: MegaItem) => void;
  onAddItem: (type: MegaItemType) => void;
}) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: col.id,
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [expanded, setExpanded] = useState(true);

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = col.items.findIndex((i) => i.id === active.id);
    const newIdx = col.items.findIndex((i) => i.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      onUpdate({ ...col, items: arrayMove(col.items, oldIdx, newIdx) });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Card>
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="center" wrap>
            <InlineStack gap="200" blockAlign="center" wrap>
              <div
                {...attributes}
                {...listeners}
                style={{ cursor: "grab", display: "flex", alignItems: "center" }}
              >
                <DragHandleIcon width={20} height={20} />
              </div>
              <Text as="h3" variant="headingSm">
                {t("columnLabel")} {index + 1}
                {col.showHeading && col.heading ? ` — ${col.heading}` : ""}
              </Text>
              <Badge tone="info">{`${col.desktopCols} ${t("columnColsUnit")} PC`}</Badge>
              <Badge>{`${col.mobileCols} ${t("columnColsUnit")} Mobile`}</Badge>
              <Badge>{`${col.items.length} ${t("columnItemsUnit")}`}</Badge>
            </InlineStack>

            <InlineStack gap="200">
              <Button size="slim" onClick={() => setExpanded((e) => !e)}>
                {expanded ? t("columnCollapse") : t("columnExpand")}
              </Button>
              <Button
                size="slim"
                tone="critical"
                icon={DeleteIcon}
                onClick={onDelete}
                accessibilityLabel={t("delete")}
              />
            </InlineStack>
          </InlineStack>

          {expanded && (
            <BlockStack gap="300">
              <FormLayout>
                <FormLayout.Group condensed>
                  <TextField
                    label={t("columnFlexRatio")}
                    type="number"
                    step={0.1}
                    min={0.5}
                    max={4}
                    value={String(col.flexRatio)}
                    onChange={(v) =>
                      onUpdate({ ...col, flexRatio: Math.max(0.5, Number(v) || 1) })
                    }
                    autoComplete="off"
                  />
                  <Select
                    label={t("columnDesktopCols")}
                    options={["1", "2", "3", "4", "5", "6"].map((n) => ({
                      label: `${n} ${t("columnColsUnit")}`,
                      value: n,
                    }))}
                    value={String(col.desktopCols)}
                    onChange={(v) => onUpdate({ ...col, desktopCols: Number(v) })}
                  />
                  <Select
                    label={t("columnMobileCols")}
                    options={["1", "2", "3"].map((n) => ({
                      label: `${n} ${t("columnColsUnit")}`,
                      value: n,
                    }))}
                    value={String(col.mobileCols)}
                    onChange={(v) => onUpdate({ ...col, mobileCols: Number(v) })}
                  />
                  <Select
                    label={t("columnAlign")}
                    options={[
                      { label: t("alignCenter"), value: "center" },
                      { label: t("alignLeft"), value: "left" },
                      { label: t("alignRight"), value: "right" },
                    ]}
                    value={col.align}
                    onChange={(v) =>
                      onUpdate({ ...col, align: v as MegaColumn["align"] })
                    }
                  />
                </FormLayout.Group>

                <FormLayout.Group condensed>
                  <Checkbox
                    label={t("columnShowHeading")}
                    checked={col.showHeading}
                    onChange={(checked) =>
                      onUpdate({ ...col, showHeading: checked })
                    }
                  />
                  {col.showHeading && (
                    <TextField
                      label={t("columnShowHeading")}
                      labelHidden
                      placeholder={t("columnHeadingPlaceholder")}
                      value={col.heading}
                      onChange={(v) => onUpdate({ ...col, heading: v })}
                      autoComplete="off"
                    />
                  )}
                  <Select
                    label={t("tabVisibility")}
                    options={[
                      { label: t("bothDevices"), value: "all" },
                      { label: t("desktopOnly"), value: "desktop" },
                      { label: t("mobileOnly"), value: "mobile" },
                    ]}
                    value={col.visibility}
                    onChange={(v) =>
                      onUpdate({ ...col, visibility: v as DeviceVisibility })
                    }
                  />
                </FormLayout.Group>
              </FormLayout>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleItemDragEnd}
              >
                <SortableContext
                  items={col.items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <BlockStack gap="200">
                    {col.items.map((item) => (
                      <SortableItemRow
                        key={item.id}
                        item={item}
                        onEdit={() => onEditItem(item)}
                        onDelete={() =>
                          onUpdate({
                            ...col,
                            items: col.items.filter((x) => x.id !== item.id),
                          })
                        }
                      />
                    ))}
                  </BlockStack>
                </SortableContext>
              </DndContext>

              <InlineStack gap="200" wrap>
                <Button size="slim" icon={PlusIcon} onClick={() => onAddItem("product")}>
                  {t("addProduct")}
                </Button>
                <Button size="slim" icon={PlusIcon} onClick={() => onAddItem("collection")}>
                  {t("addCollection")}
                </Button>
                <Button size="slim" icon={PlusIcon} onClick={() => onAddItem("page")}>
                  {t("addPage")}
                </Button>
                <Button size="slim" icon={PlusIcon} onClick={() => onAddItem("button")}>
                  {t("addButton")}
                </Button>
                <Button size="slim" icon={PlusIcon} onClick={() => onAddItem("text_link")}>
                  {t("addTextLink")}
                </Button>
              </InlineStack>
            </BlockStack>
          )}
        </BlockStack>
      </Card>
    </div>
  );
}

export function MegaColumnsEditor({
  columns,
  onChange,
}: MegaColumnsEditorProps) {
  const { t } = useI18n();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const [editing, setEditing] = useState<{ colId: string; item: MegaItem } | null>(
    null
  );

  const handleColDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = columns.findIndex((c) => c.id === active.id);
    const newIdx = columns.findIndex((c) => c.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      onChange(arrayMove(columns, oldIdx, newIdx));
    }
  };

  const handleSaveItem = (updatedItem: MegaItem) => {
    if (!editing) return;
    onChange(
      columns.map((c) => {
        if (c.id !== editing.colId) return c;
        const exists = c.items.some((i) => i.id === updatedItem.id);
        return {
          ...c,
          items: exists
            ? c.items.map((i) => (i.id === updatedItem.id ? updatedItem : i))
            : [...c.items, updatedItem],
        };
      })
    );
  };

  return (
    <BlockStack gap="300">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="h3" variant="headingMd">
          {t("columnsTitle")} ({columns.length})
        </Text>
        <Button
          variant="primary"
          size="slim"
          icon={PlusIcon}
          onClick={() => onChange([...columns, createDefaultColumn(columns.length)])}
        >
          {t("columnsAdd")}
        </Button>
      </InlineStack>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleColDragEnd}
      >
        <SortableContext
          items={columns.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <BlockStack gap="300">
            {columns.map((col, idx) => (
              <SortableColumnCard
                key={col.id}
                col={col}
                index={idx}
                onUpdate={(updated) =>
                  onChange(columns.map((c) => (c.id === updated.id ? updated : c)))
                }
                onDelete={() => onChange(columns.filter((c) => c.id !== col.id))}
                onEditItem={(item) => setEditing({ colId: col.id, item })}
                onAddItem={(type) => {
                  const newItem = createDefaultMegaItem(type);
                  setEditing({ colId: col.id, item: newItem });
                }}
              />
            ))}
          </BlockStack>
        </SortableContext>
      </DndContext>

      <ItemEditorModal
        open={Boolean(editing)}
        item={editing?.item || null}
        onClose={() => setEditing(null)}
        onSave={handleSaveItem}
      />
    </BlockStack>
  );
}
