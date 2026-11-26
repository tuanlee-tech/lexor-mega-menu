import { useCallback, useEffect, useRef, useState } from "react";
import { Banner, Spinner, Text } from "@shopify/polaris";
import type { MenuPreset } from "../../types/menu";

interface RealStorefrontPreviewProps {
  preset: MenuPreset;
  device: "desktop" | "mobile";
  activeTabId: string | null;
  themeNumericId: string;
  onFallbackToWireframe: () => void;
}

export function RealStorefrontPreview({
  preset,
  device,
  activeTabId,
  themeNumericId,
  onFallbackToWireframe,
}: RealStorefrontPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [scale, setScale] = useState(0.5);

  // Measure container width to scale 1440px Desktop viewport cleanly
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || 640;
      setScale(Math.min(1, w / 1440));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [device]);

  // Fetch real storefront HTML when theme changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setIframeReady(false);

    fetch(
      `/api/storefront-preview?themeId=${encodeURIComponent(themeNumericId)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.ok) {
          if (data.passwordProtected) {
            onFallbackToWireframe();
            return;
          }
          setError(data.error || "Unable to load storefront HTML");
        } else {
          setHtml(data.html);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Network error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [themeNumericId, onFallbackToWireframe]);

  const pushMenuToIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      {
        type: "LMM_LIVE_PREVIEW_UPDATE",
        menu: preset,
        openTabId: activeTabId,
        device,
      },
      "*"
    );
  }, [preset, activeTabId, device]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.data?.type === "LMM_IFRAME_READY") {
        setIframeReady(true);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (iframeReady) {
      pushMenuToIframe();
    }
  }, [iframeReady, pushMenuToIframe]);

  if (loading) {
    return (
      <div
        style={{
          padding: "48px 16px",
          textAlign: "center",
          border: "1px solid #E1E3E5",
          borderRadius: "8px",
          background: "#F9FAFB",
        }}
      >
        <Spinner />
        <div style={{ marginTop: "10px" }}>
          <Text as="p" variant="bodySm" tone="subdued">
            Loading live storefront HTML & theme assets...
          </Text>
        </div>
      </div>
    );
  }

  if (error || !html) {
    return (
      <Banner tone="warning">
        <p>{error || "Storefront preview unavailable."}</p>
      </Banner>
    );
  }

  if (device === "mobile") {
    return (
      <div
        style={{
          width: "390px",
          maxWidth: "100%",
          height: "740px",
          margin: "0 auto",
          border: "8px solid #1F2937",
          borderRadius: "24px",
          overflow: "hidden",
          background: "#FFFFFF",
          boxShadow: "0 12px 28px rgba(0,0,0,0.14)",
        }}
      >
        <iframe
          ref={iframeRef}
          title="Mobile Real Storefront Preview"
          srcDoc={html}
          onLoad={() => {
            setIframeReady(true);
            setTimeout(pushMenuToIframe, 250);
          }}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            background: "#FFF",
          }}
        />
      </div>
    );
  }

  const desktopHeight = 760;
  const scaledHeight = Math.round(desktopHeight * scale);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: `${scaledHeight}px`,
        border: "1px solid #E1E3E5",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#0B0B0B",
        position: "relative",
      }}
    >
      <iframe
        ref={iframeRef}
        title="Desktop Real Storefront Preview"
        srcDoc={html}
        onLoad={() => {
          setIframeReady(true);
          setTimeout(pushMenuToIframe, 200);
        }}
        style={{
          width: "1440px",
          height: `${desktopHeight}px`,
          border: "none",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: "#FFF",
        }}
      />
    </div>
  );
}
