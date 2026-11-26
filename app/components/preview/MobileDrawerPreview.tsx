import { useState } from "react";
import type { MegaColumn, MegaItem, MenuPreset, TopLevelItem } from "../../types/menu";
import { isScheduleActive } from "../../lib/menu-utils";

interface MobileDrawerPreviewProps {
  preset: MenuPreset;
  enforceSchedule: boolean;
}

function renderMobileItem(item: MegaItem, isOddLast: boolean) {
  if (item.type === "button") {
    return (
      <div
        key={item.id}
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "center",
          marginTop: "6px",
        }}
      >
        <span
          style={{
            background: item.buttonBgColor
              ? item.buttonBgColor
              : "linear-gradient(180deg, #8C1B11 0%, #6D0F07 100%)",
            color: "#FFFFFF",
            padding: "10px 20px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {item.btnText || item.title || "Shop All"}
        </span>
      </div>
    );
  }

  if (item.type === "text_link") {
    return (
      <div
        key={item.id}
        style={{
          gridColumn: isOddLast ? "span 2" : undefined,
          textAlign: "center",
          padding: "6px 0",
          fontSize: "13px",
          fontWeight: 500,
          textTransform: "uppercase",
          color: "#333",
        }}
      >
        {item.title}
      </div>
    );
  }

  return (
    <div
      key={item.id}
      style={{
        gridColumn: isOddLast ? "span 2" : undefined,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "115px",
          height: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "10px",
          borderRadius: "4px",
          background: item.imageUrl ? "transparent" : "#F4F5F7",
          border: item.imageUrl ? "none" : "1px dashed #D1D5DB",
          overflow: "hidden",
        }}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "4px",
            }}
          />
        ) : (
          <span style={{ fontSize: "10px", color: "#9CA3AF" }}>No image</span>
        )}
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          color: "#333333",
          letterSpacing: "0.05em",
        }}
      >
        {item.title}
      </div>
      {item.btnText && (
        <span
          style={{
            fontSize: "11px",
            color: "#4B4B4B",
            textDecoration: "underline",
            marginTop: "4px",
          }}
        >
          {item.btnText}
        </span>
      )}
    </div>
  );
}

export function MobileDrawerPreview({
  preset,
  enforceSchedule,
}: MobileDrawerPreviewProps) {
  const [openTabId, setOpenTabId] = useState<string | null>(null);

  const visibleTabs = preset.items.filter(
    (t) =>
      t.visibility !== "desktop" &&
      (!enforceSchedule || isScheduleActive(t.schedule))
  );

  const openTab: TopLevelItem | undefined = visibleTabs.find(
    (t) => t.id === openTabId
  );

  return (
    <div
      style={{
        width: "340px",
        maxWidth: "100%",
        margin: "0 auto",
        border: "8px solid #1F2937",
        borderRadius: "24px",
        overflow: "hidden",
        background: "#FFFFFF",
        boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
      }}
    >
      {/* Announcement */}
      <div
        style={{
          padding: "8px 12px",
          fontSize: "10px",
          fontWeight: 600,
          textAlign: "center",
          borderBottom: "1px solid #F1F1F1",
        }}
      >
        FREE SHIPPING For ALL Orders Above $5000
      </div>

      {/* Drawer Content */}
      <div style={{ minHeight: "480px", maxHeight: "540px", overflowY: "auto", padding: "16px 20px" }}>
        {!openTab ? (
          <>
            <div style={{ textAlign: "right", fontSize: "18px", color: "#333", marginBottom: "20px" }}>
              ✕
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {visibleTabs.map((tab) => {
                const hasSub = tab.type !== "simple_link";
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => hasSub && setOpenTabId(tab.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "4px 0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: hasSub ? "pointer" : "default",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: tab.highlightColor || "#222222",
                      }}
                    >
                      {tab.title}
                      {tab.badge?.text && (
                        <span
                          style={{
                            marginLeft: "8px",
                            fontSize: "9px",
                            padding: "2px 5px",
                            borderRadius: "3px",
                            background: tab.badge.bgColor || "#8C1B11",
                            color: tab.badge.textColor || "#FFF",
                          }}
                        >
                          {tab.badge.text}
                        </span>
                      )}
                    </span>
                    {hasSub && <span style={{ fontSize: "14px", color: "#555" }}>›</span>}
                  </button>
                );
              })}
            </div>

            <div style={{ height: "1px", background: "#E5E5E5", margin: "24px 0" }} />

            {preset.mobileSettings.showAccountLink && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  fontWeight: 500,
                  letterSpacing: "0.06em",
                  color: "#222",
                  marginBottom: "18px",
                }}
              >
                <span>👤</span>
                <span>LOG IN</span>
              </div>
            )}

            {preset.mobileSettings.showPhoneButton && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: preset.mobileSettings.phoneBgColor || "#8C1B11",
                  color: "#FFFFFF",
                  padding: "9px 16px",
                  borderRadius: "2px",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                }}
              >
                <span>📞</span>
                <span>{preset.mobileSettings.phoneDisplay || "(866) 733-4772"}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenTabId(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  padding: "4px 8px 4px 0",
                }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setOpenTabId(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                textAlign: "center",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#8C1B11",
                marginBottom: "18px",
              }}
            >
              {openTab.title}
            </div>

            {openTab.type === "mega_menu" &&
              openTab.columns
                .filter((c) => c.visibility !== "desktop")
                .map((col: MegaColumn, colIdx: number, arr: MegaColumn[]) => {
                  const colItems = col.items.filter(
                    (it) =>
                      it.visibility !== "desktop" &&
                      (!enforceSchedule || isScheduleActive(it.schedule))
                  );
                  const nonButtonItems = colItems.filter((i) => i.type !== "button");
                  const mCols = Math.max(1, Math.min(3, col.mobileCols || 2));
                  return (
                    <div key={col.id}>
                      {col.showHeading && col.heading && (
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "#8C1B11",
                            textTransform: "uppercase",
                            marginBottom: "16px",
                          }}
                        >
                          {col.heading}
                        </div>
                      )}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${mCols}, minmax(0, 1fr))`,
                          rowGap: "24px",
                          columnGap: "14px",
                          alignItems: "end",
                        }}
                      >
                        {colItems.map((item) => {
                          const isOddLast =
                            mCols === 2 &&
                            item.type !== "button" &&
                            nonButtonItems.length % 2 === 1 &&
                            nonButtonItems[nonButtonItems.length - 1]?.id === item.id;
                          return renderMobileItem(item, isOddLast);
                        })}
                      </div>
                      {colIdx < arr.length - 1 && (
                        <div
                          style={{
                            height: "1px",
                            width: "90%",
                            background: "#E5E5E5",
                            margin: "28px auto",
                          }}
                        />
                      )}
                    </div>
                  );
                })}

            {openTab.type === "dropdown" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {openTab.dropdownLinks.map((dd) => (
                  <div key={dd.id}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#222" }}>
                      {dd.title}
                    </div>
                    {dd.children.map((ch) => (
                      <div
                        key={ch.id}
                        style={{
                          fontSize: "12px",
                          color: "#555",
                          paddingLeft: "12px",
                          marginTop: "6px",
                        }}
                      >
                        {ch.title}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
