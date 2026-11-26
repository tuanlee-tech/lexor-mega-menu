import { useCallback, useEffect, useRef, useState } from "react";
import { Banner, Spinner, Text } from "@shopify/polaris";
import type { MenuPreset } from "../../types/menu";

interface RealStorefrontPreviewProps {
  preset: MenuPreset;
  activeTabId: string | null;
  themeNumericId: string;
  themeLabel: string;
  storefrontUrl: string;
  saveVersion: number;
}

// Persistent in-memory + sessionStorage cache so opening/switching editors does not re-fetch
const clientHtmlCache = new Map<string, string>();
const SESSION_CACHE_PREFIX = "lmm_preview_html_v1:";

function readCachedHtml(key: string): string | null {
  if (clientHtmlCache.has(key)) return clientHtmlCache.get(key) || null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_PREFIX + key);
    if (raw) {
      clientHtmlCache.set(key, raw);
      return raw;
    }
  } catch {
    // ignore storage quota errors
  }
  return null;
}

function writeCachedHtml(key: string, html: string) {
  clientHtmlCache.set(key, html);
  try {
    window.sessionStorage.setItem(SESSION_CACHE_PREFIX + key, html);
  } catch {
    // ignore if HTML exceeds sessionStorage quota
  }
}

function clearCachedHtml(key: string) {
  clientHtmlCache.delete(key);
  try {
    window.sessionStorage.removeItem(SESSION_CACHE_PREFIX + key);
  } catch {
    // ignore
  }
}

export function clearAllClientPreviewCache() {
  clientHtmlCache.clear();
  try {
    for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(SESSION_CACHE_PREFIX)) {
        window.sessionStorage.removeItem(k);
      }
    }
  } catch {
    // ignore
  }
}

export function RealStorefrontPreview({
  preset,
  activeTabId,
  themeNumericId,
  themeLabel,
  storefrontUrl,
  saveVersion,
}: RealStorefrontPreviewProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const desktopIframeRef = useRef<HTMLIFrameElement | null>(null);
  const mobileIframeRef = useRef<HTMLIFrameElement | null>(null);

  const cacheKey = themeNumericId || "default";
  const [html, setHtml] = useState<string | null>(() => readCachedHtml(cacheKey));
  const [loading, setLoading] = useState<boolean>(() => !readCachedHtml(cacheKey));
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [desktopScale, setDesktopScale] = useState(0.45);
  const [manualReloadTick, setManualReloadTick] = useState(0);
  const [mobileState, setMobileState] = useState<"corner" | "expanded" | "minimized">("corner");

  const prevSaveVersionRef = useRef<number>(saveVersion);
  const prevManualTickRef = useRef<number>(manualReloadTick);

  // Responsive scale for 1440px Desktop Browser Mockup
  useEffect(() => {
    const updateScale = () => {
      if (!stageRef.current) return;
      const innerWidth = Math.max(360, stageRef.current.clientWidth);
      setDesktopScale(Math.min(1, innerWidth / 1440));
    };
    updateScale();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateScale)
        : null;
    if (ro && stageRef.current) ro.observe(stageRef.current);
    window.addEventListener("resize", updateScale);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [html]);

  // Fetch storefront HTML ONLY on initial cache miss, Save/Publish action, or manual address-bar reload
  useEffect(() => {
    let cancelled = false;
    const isSaveRefresh = prevSaveVersionRef.current !== saveVersion;
    const isManualRefresh = prevManualTickRef.current !== manualReloadTick;
    prevSaveVersionRef.current = saveVersion;
    prevManualTickRef.current = manualReloadTick;

    const forceRefresh = isSaveRefresh || isManualRefresh;

    if (forceRefresh) {
      clearCachedHtml(cacheKey);
    } else {
      const cached = readCachedHtml(cacheKey);
      if (cached) {
        setHtml(cached);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }
    }

    if (!html) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    const qs = new URLSearchParams();
    if (themeNumericId) qs.set("themeId", themeNumericId);
    if (forceRefresh) qs.set("refresh", "1");

    fetch(`/api/storefront-preview?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.ok) {
          setError(data.error || "Unable to load storefront HTML");
        } else {
          writeCachedHtml(cacheKey, data.html);
          setHtml(data.html);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Network error");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, themeNumericId, saveVersion, manualReloadTick]);

  const syncDesktopIframe = useCallback(() => {
    desktopIframeRef.current?.contentWindow?.postMessage(
      {
        type: "LMM_LIVE_PREVIEW_UPDATE",
        menu: preset,
        openTabId: activeTabId,
        device: "desktop",
      },
      "*"
    );
  }, [preset, activeTabId]);

  const syncMobileIframe = useCallback(() => {
    mobileIframeRef.current?.contentWindow?.postMessage(
      {
        type: "LMM_LIVE_PREVIEW_UPDATE",
        menu: preset,
        openTabId: activeTabId,
        device: "mobile",
      },
      "*"
    );
  }, [preset, activeTabId]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.data?.type === "LMM_IFRAME_READY") {
        syncDesktopIframe();
        syncMobileIframe();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [syncDesktopIframe, syncMobileIframe]);

  useEffect(() => {
    syncDesktopIframe();
    syncMobileIframe();
  }, [syncDesktopIframe, syncMobileIframe]);

  if (loading && !html) {
    return (
      <div
        style={{
          padding: "64px 16px",
          textAlign: "center",
          border: "1px solid #1E293B",
          borderRadius: "16px",
          background: "radial-gradient(circle at 50% 0%, #1E293B 0%, #0F172A 100%)",
          color: "#E2E8F0",
        }}
      >
        <Spinner />
        <div style={{ marginTop: "12px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Loading live storefront...
          </Text>
        </div>
      </div>
    );
  }

  if (error && !html) {
    return (
      <Banner tone="warning">
        <p>{error}</p>
      </Banner>
    );
  }

  if (!html) return null;

  const cleanHost = storefrontUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Ensure desktop frame always renders tall enough (~460px+ scaled) so mega menu + hero show clearly
  const desktopViewportH = Math.max(960, Math.round(460 / Math.max(0.25, desktopScale)));
  const scaledDesktopH = Math.round(desktopViewportH * desktopScale);

  // Mobile iPhone Titanium overlay dimensions (light corner overlay by default, expandable on click)
  const mobileScale = mobileState === "expanded" ? 0.6 : 0.39;
  const mobileNativeW = 390;
  const mobileNativeH = 800;
  const mobileFrameW = Math.round(mobileNativeW * mobileScale);
  const mobileFrameH = Math.round(mobileNativeH * mobileScale);

  const stageMinHeight =
    mobileState === "expanded"
      ? Math.max(scaledDesktopH + 62, mobileFrameH + 64)
      : scaledDesktopH + 62;

  return (
    <div
      style={{
        position: "relative",
        minHeight: `${stageMinHeight}px`,
        padding: "14px 14px 18px",
        borderRadius: "16px",
        background:
          "radial-gradient(120% 90% at 15% 0%, #1E293B 0%, #0F172A 58%, #090D16 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.1), 0 12px 30px rgba(15,23,42,0.22)",
        transition: "min-height 0.24s ease",
      }}
    >
      {/* ==================== DESKTOP macOS BROWSER MOCKUP (BACKGROUND) ==================== */}
      <div
        style={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.14)",
          background: "#18181B",
          boxShadow:
            "0 18px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.4)",
        }}
      >
        {/* macOS Safari/Arc-style Chrome Bar */}
        <div
          style={{
            height: "34px",
            background: "linear-gradient(180deg, #2A2A2E 0%, #1E1E22 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: "10px",
          }}
        >
          {/* Traffic Lights */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#FF5F56",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
              }}
            />
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#FFBD2E",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
              }}
            />
            <span
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#27C93F",
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
              }}
            />
          </div>

          {/* Nav chevrons */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              color: "#71717A",
              fontSize: "11px",
              userSelect: "none",
            }}
          >
            <span>‹</span>
            <span>›</span>
          </div>

          {/* Address Bar */}
          <div
            style={{
              flex: 1,
              maxWidth: "380px",
              margin: "0 auto",
              height: "22px",
              borderRadius: "6px",
              background: "rgba(9,9,11,0.55)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#D4D4D8",
              fontSize: "10.5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 7px 0 9px",
              gap: "6px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: refreshing ? "#FBBF24" : "#34D399",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 500 }}>{cleanHost}</span>
              {themeLabel && (
                <span
                  style={{
                    color: "#A1A1AA",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  — {themeLabel}
                </span>
              )}
            </div>

            <button
              type="button"
              title="Reload storefront HTML cache"
              onClick={() => setManualReloadTick((t) => t + 1)}
              style={{
                background: "transparent",
                border: "none",
                color: "#A1A1AA",
                fontSize: "11px",
                cursor: "pointer",
                padding: "0 2px",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {refreshing ? "…" : "↻"}
            </button>
          </div>

          <div
            style={{
              fontSize: "9.5px",
              color: "#71717A",
              fontWeight: 600,
              letterSpacing: "0.03em",
              userSelect: "none",
            }}
          >
            1440px
          </div>
        </div>

        {/* Scaled 1440px Real Storefront Viewport */}
        <div
          ref={stageRef}
          style={{
            width: "100%",
            height: `${scaledDesktopH}px`,
            overflow: "hidden",
            background: "#FFFFFF",
            position: "relative",
          }}
        >
          <iframe
            ref={desktopIframeRef}
            title="Desktop Storefront Live Preview"
            srcDoc={html}
            onLoad={() => {
              syncDesktopIframe();
              setTimeout(syncDesktopIframe, 250);
            }}
            style={{
              width: "1440px",
              height: `${desktopViewportH}px`,
              border: "none",
              transform: `scale(${desktopScale})`,
              transformOrigin: "top left",
              background: "#FFFFFF",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* ==================== FLOATING iPHONE TITANIUM MOCKUP (FRONT CORNER OVERLAY) ==================== */}
      {mobileState === "minimized" ? (
        <button
          type="button"
          onClick={() => setMobileState("corner")}
          style={{
            position: "absolute",
            right: "22px",
            bottom: "24px",
            zIndex: 25,
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(10px)",
            color: "#F8FAFC",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: "999px",
            padding: "7px 14px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>📱</span>
          <span>Mobile Drawer</span>
        </button>
      ) : (
        <div
          style={{
            position: "absolute",
            right: "18px",
            bottom: "14px",
            zIndex: 25,
            padding: "2px",
            borderRadius: mobileState === "expanded" ? "34px" : "26px",
            background:
              "linear-gradient(145deg, #94A3B8 0%, #475569 28%, #1E293B 65%, #64748B 100%)",
            boxShadow:
              "-12px 20px 44px rgba(0,0,0,0.6), 0 4px 14px rgba(0,0,0,0.4)",
            transition: "all 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Side Titanium Hardware Buttons (Left Volume + Right Power) */}
          <span
            style={{
              position: "absolute",
              left: "-2.5px",
              top: "22%",
              width: "2.5px",
              height: "22px",
              borderRadius: "2px 0 0 2px",
              background: "#64748B",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "-2.5px",
              top: "32%",
              width: "2.5px",
              height: "22px",
              borderRadius: "2px 0 0 2px",
              background: "#64748B",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: "-2.5px",
              top: "26%",
              width: "2.5px",
              height: "30px",
              borderRadius: "0 2px 2px 0",
              background: "#64748B",
              pointerEvents: "none",
            }}
          />

          {/* Floating Glass Toolbar Above iPhone Bezel */}
          <div
            style={{
              position: "absolute",
              top: "-28px",
              right: "2px",
              zIndex: 30,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "2px 4px 2px 8px",
              borderRadius: "999px",
              background: "rgba(15, 23, 42, 0.86)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
            }}
          >
            <span
              style={{
                color: "#E2E8F0",
                fontSize: "9.5px",
                fontWeight: 600,
                letterSpacing: "0.02em",
                userSelect: "none",
              }}
            >
              390px
            </span>
            <button
              type="button"
              title={mobileState === "expanded" ? "Compact corner size" : "Zoom Mobile frame"}
              onClick={() =>
                setMobileState((s) => (s === "expanded" ? "corner" : "expanded"))
              }
              style={{
                width: "19px",
                height: "19px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.14)",
                color: "#FFFFFF",
                fontSize: "10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              {mobileState === "expanded" ? "↙" : "⤢"}
            </button>
            <button
              type="button"
              title="Minimize Mobile overlay"
              onClick={() => setMobileState("minimized")}
              style={{
                width: "19px",
                height: "19px",
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.14)",
                color: "#FFFFFF",
                fontSize: "11px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
              }}
            >
              –
            </button>
          </div>

          {/* Inner Black Display Bezel */}
          <div
            style={{
              padding: mobileState === "expanded" ? "7px" : "5px",
              borderRadius: mobileState === "expanded" ? "32px" : "24px",
              background: "#09090B",
            }}
          >
            {/* iPhone OLED Screen */}
            <div
              style={{
                width: `${mobileFrameW}px`,
                height: `${mobileFrameH}px`,
                borderRadius: mobileState === "expanded" ? "25px" : "19px",
                overflow: "hidden",
                background: "#FFFFFF",
                position: "relative",
                transition: "width 0.24s cubic-bezier(0.16, 1, 0.3, 1), height 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {/* Dynamic Island */}
              <div
                style={{
                  position: "absolute",
                  top: mobileState === "expanded" ? "6px" : "4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: mobileState === "expanded" ? "62px" : "42px",
                  height: mobileState === "expanded" ? "14px" : "9px",
                  borderRadius: "999px",
                  background: "#09090B",
                  boxShadow: "0 0 0 0.5px rgba(255,255,255,0.12)",
                  zIndex: 10,
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: mobileState === "expanded" ? "4px" : "3px",
                }}
              >
                <span
                  style={{
                    width: mobileState === "expanded" ? "5px" : "3.5px",
                    height: mobileState === "expanded" ? "5px" : "3.5px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #1E3A8A 0%, #0F172A 80%)",
                  }}
                />
              </div>

              <iframe
                ref={mobileIframeRef}
                title="Mobile Storefront Live Preview"
                srcDoc={html}
                onLoad={() => {
                  syncMobileIframe();
                  setTimeout(syncMobileIframe, 300);
                }}
                style={{
                  width: `${mobileNativeW}px`,
                  height: `${mobileNativeH}px`,
                  border: "none",
                  transform: `scale(${mobileScale})`,
                  transformOrigin: "top left",
                  background: "#FFFFFF",
                  display: "block",
                }}
              />

              {/* iOS Home Indicator */}
              <div
                style={{
                  position: "absolute",
                  bottom: "4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "35%",
                  height: "3px",
                  borderRadius: "999px",
                  background: "rgba(9,9,11,0.32)",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
