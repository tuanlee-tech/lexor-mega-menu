import type { MegaColumn, MegaItem, MenuPreset, TopLevelItem } from "../../types/menu";
import { isScheduleActive } from "../../lib/menu-utils";
import { useI18n } from "../../lib/i18n";

interface DesktopMegaPreviewProps {
  preset: MenuPreset;
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  enforceSchedule: boolean;
}

function renderBadge(badge?: { text: string; bgColor: string; textColor: string } | null) {
  if (!badge || !badge.text.trim()) return null;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 5px",
        borderRadius: "3px",
        backgroundColor: badge.bgColor || "#8C1B11",
        color: badge.textColor || "#FFFFFF",
        marginLeft: "6px",
        verticalAlign: "middle",
        lineHeight: 1.1,
      }}
    >
      {badge.text}
    </span>
  );
}

function renderDesktopItem(item: MegaItem) {
  if (item.type === "button") {
    return (
      <div
        key={item.id}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gridColumn: "1 / -1",
          marginTop: "6px",
        }}
      >
        <span
          style={{
            background: item.buttonBgColor
              ? item.buttonBgColor
              : "linear-gradient(180deg, #8C1B11 0%, #6D0F07 100%)",
            color: "#FFFFFF",
            padding: "9px 16px",
            textTransform: "uppercase",
            lineHeight: "1em",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.06em",
          }}
        >
          {item.btnText || item.title || "Shop Now"}
        </span>
      </div>
    );
  }

  if (item.type === "text_link") {
    return (
      <div key={item.id} style={{ padding: "3px 0" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 400,
            textTransform: "uppercase",
            color: "#4B4B4B",
            letterSpacing: "0.05em",
          }}
        >
          {item.title}
        </span>
        {renderBadge(item.badge)}
      </div>
    );
  }

  const isPage = item.type === "page";
  return (
    <div
      key={item.id}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width: isPage ? "100%" : "84px",
          maxWidth: isPage ? "170px" : "84px",
          height: isPage ? "92px" : "84px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "6px",
          overflow: "hidden",
          background: item.imageUrl ? "transparent" : "#F4F5F7",
          border: item.imageUrl ? "none" : "1px dashed #D1D5DB",
          position: "relative",
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: isPage ? "cover" : "contain",
              borderRadius: "4px",
            }}
          />
        ) : (
          <span style={{ fontSize: "10px", color: "#9CA3AF" }}>
            {item.imageFilename ? item.imageFilename.slice(0, 14) : "No image"}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          color: "#333333",
          marginTop: "10px",
          letterSpacing: "0.05em",
          lineHeight: 1.2,
          maxWidth: "120px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={item.title}
      >
        {item.title}
        {renderBadge(item.badge)}
      </div>
      {item.btnText && (
        <span
          style={{
            fontSize: "9px",
            color: "#4B4B4B",
            marginTop: "4px",
            textDecoration: "underline",
            letterSpacing: "0.04em",
          }}
        >
          {item.btnText}
        </span>
      )}
    </div>
  );
}

function renderColumn(col: MegaColumn, enforceSchedule: boolean) {
  const visibleItems = col.items.filter(
    (it) =>
      it.visibility !== "mobile" &&
      (!enforceSchedule || isScheduleActive(it.schedule))
  );

  const isTextOnly =
    visibleItems.length > 0 && visibleItems.every((i) => i.type === "text_link");

  const alignStyle =
    col.align === "left"
      ? "left"
      : col.align === "right"
        ? "right"
        : "center";

  return (
    <div
      style={{
        flex: `${col.flexRatio || 1} 1 0`,
        minWidth: 0,
        textAlign: alignStyle,
      }}
    >
      {col.showHeading && col.heading && (
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "#8C1B11",
            marginBottom: "14px",
            textAlign: alignStyle,
          }}
        >
          {col.heading}
        </div>
      )}
      <div
        style={
          isTextOnly
            ? {
                display: "grid",
                gridAutoFlow: "column",
                gridTemplateRows: "repeat(3, auto)",
                columnGap: "36px",
                rowGap: "6px",
                justifyContent:
                  col.align === "left"
                    ? "start"
                    : col.align === "right"
                      ? "end"
                      : "center",
              }
            : {
                display: "grid",
                gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, col.desktopCols || 1))}, minmax(0, 1fr))`,
                columnGap: "16px",
                rowGap: "16px",
                alignItems: "start",
              }
        }
      >
        {visibleItems.map(renderDesktopItem)}
      </div>
    </div>
  );
}

export function DesktopMegaPreview({
  preset,
  activeTabId,
  onSelectTab,
  enforceSchedule,
}: DesktopMegaPreviewProps) {
  const { t } = useI18n();
  const s = preset.styleSettings;
  const visibleTabs = preset.items.filter(
    (t) =>
      t.visibility !== "mobile" &&
      (!enforceSchedule || isScheduleActive(t.schedule))
  );

  const activeTab: TopLevelItem | undefined =
    visibleTabs.find((t) => t.id === activeTabId) ||
    visibleTabs.find((t) => t.type !== "simple_link") ||
    visibleTabs[0];

  const visibleColumns =
    activeTab?.type === "mega_menu"
      ? activeTab.columns.filter((c) => c.visibility !== "mobile")
      : [];

  return (
    <div
      style={{
        border: "1px solid #E1E3E5",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#FFFFFF",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }}
    >
      {/* Top Announcement Bar */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #ECECEC",
          padding: "5px 12px",
          fontSize: "10px",
          fontWeight: 600,
          textAlign: "center",
          color: "#111111",
          letterSpacing: "0.04em",
        }}
      >
        FREE SHIPPING FOR ALL ORDERS ABOVE $5000
      </div>

      {/* Black Header Bar */}
      <div
        style={{
          background: "#0B0B0B",
          color: "#FFFFFF",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "15px",
            letterSpacing: "0.06em",
            fontFamily: "Georgia, serif",
          }}
        >
          Lexor
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
            justifyContent: "center",
            flex: 1,
          }}
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab?.id === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                style={{
                  background: isActive ? (s?.tabHoverBgColor || "#333333") : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 10px",
                  color: tab.highlightColor || "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {tab.title}
                {renderBadge(tab.badge)}
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: "11px", opacity: 0.7, display: "flex", gap: "8px" }}>
          <span>🔍</span>
          <span>♡</span>
          <span>👤</span>
          <span>🛒</span>
        </div>
      </div>

      {/* Mega Menu / Dropdown Panel */}
      {activeTab && activeTab.type === "mega_menu" && (
        <div
          style={{
            padding: "24px 20px",
            background: s?.dropdownBgColor || "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
            minHeight: "220px",
          }}
        >
          {visibleColumns.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 16px",
                color: "#6D7175",
                fontSize: "13px",
              }}
            >
              {t("previewNoColumns")}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              {visibleColumns.map((col, idx) => (
                <div
                  key={col.id}
                  style={{
                    display: "contents",
                  }}
                >
                  {renderColumn(col, enforceSchedule)}
                  {idx < visibleColumns.length - 1 && (
                    <div
                      style={{
                        width: "1px",
                        background: "#C6C6C6",
                        margin: "0 8px",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab && activeTab.type === "dropdown" && (
        <div
          style={{
            padding: "20px 24px",
            background: "#FFFFFF",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            gap: "32px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {activeTab.dropdownLinks.length === 0 ? (
            <span style={{ color: "#6D7175", fontSize: "13px" }}>
              {t("previewNoDropdown")}
            </span>
          ) : (
            activeTab.dropdownLinks.map((dd) => (
              <div key={dd.id} style={{ minWidth: "120px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#222",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  {dd.title}
                  {renderBadge(dd.badge)}
                </div>
                {dd.children.map((ch) => (
                  <div
                    key={ch.id}
                    style={{
                      fontSize: "12px",
                      color: "#555",
                      padding: "3px 0",
                    }}
                  >
                    {ch.title}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab && activeTab.type === "simple_link" && (
        <div
          style={{
            padding: "28px 20px",
            textAlign: "center",
            color: "#6D7175",
            fontSize: "12px",
            background: "#F9FAFB",
          }}
        >
          <strong>{activeTab.title}</strong> — {t("previewSimpleLinkNote")}{" "}
          <code>{activeTab.url || "/"}</code> {t("previewSimpleLinkHint")}
        </div>
      )}
    </div>
  );
}
