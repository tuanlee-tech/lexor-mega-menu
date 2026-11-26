import fs from "node:fs";
import path from "node:path";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { loadStorefrontThemes } from "../lib/shopify-themes.server";
import {
  getCachedStorefrontPreview,
  setCachedStorefrontPreview,
} from "../lib/storefront-preview-cache.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const themeNumericId = url.searchParams.get("themeId") || "";
  const forceRefresh = url.searchParams.get("refresh") === "1";

  const cacheKey = `${session.shop}:${themeNumericId || "default"}`;
  if (!forceRefresh) {
    const hit = getCachedStorefrontPreview(cacheKey);
    if (hit) {
      return new Response(
        JSON.stringify({
          ok: true,
          html: hit.html,
          storefrontUrl: hit.storefrontUrl,
          cached: true,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const ctx = await loadStorefrontThemes(admin, session.shop);
  const baseOrigin = ctx.storefrontUrl.replace(/\/$/, "");
  const targetUrl = themeNumericId
    ? `${baseOrigin}/?_ab=0&_fd=0&_sc=1&preview_theme_id=${encodeURIComponent(themeNumericId)}`
    : `${baseOrigin}/?_ab=0&_fd=0&_sc=1`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    const finalUrl = res.url || baseOrigin;
    if (finalUrl.includes("/password")) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Storefront is currently password-protected.",
          storefrontUrl: baseOrigin,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    let html = await res.text();

    const cssPath = path.resolve(
      process.cwd(),
      "extensions/lexor-mega-menu-embed/assets/lexor-mega-menu.css"
    );
    const jsPath = path.resolve(
      process.cwd(),
      "extensions/lexor-mega-menu-embed/assets/lexor-mega-menu.js"
    );
    const lmmCss = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";
    const lmmJs = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, "utf8") : "";

    // Strip third-party chat/analytics/exit-interstitial scripts for fast, distraction-free rendering
    html = html
      .replace(
        /<script[^>]*data-source-attribution="shopify\.exit_interstitial"[^>]*>[\s\S]*?<\/script>/gi,
        ""
      )
      .replace(/<script[^>]*googletagmanager[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<script[^>]*salesiq[^>]*>[\s\S]*?<\/script>/gi, "");

    html = html.replace(
      /<script[^>]*id="lexor-mega-menu-config"[^>]*>[\s\S]*?<\/script>/gi,
      ""
    );

    const previewInjection = `
      <base href="${baseOrigin}/" />
      <style>
        #shopify-pc__banner, .zsiq_floatmain, #PBarNextFrameWrapper, .preview-bar-iframe, [id*="zsiq"] { display: none !important; }
        a[href] { cursor: pointer; }
        ${lmmCss}
      </style>
      <script id="lexor-mega-menu-config" type="application/json" data-mode="override" data-files-base-url="${baseOrigin}/cdn/shop/files/">null</script>
      <script>
        document.addEventListener("click", function(e) {
          var a = e.target.closest && e.target.closest("a[href]");
          if (a) e.preventDefault();
        }, true);
        ${lmmJs}
        window.parent.postMessage({ type: "LMM_IFRAME_READY" }, "*");
      </script>
    `;

    if (html.includes("</head>")) {
      html = html.replace("</head>", `${previewInjection}</head>`);
    } else {
      html = previewInjection + html;
    }

    setCachedStorefrontPreview(cacheKey, {
      html,
      storefrontUrl: baseOrigin,
      cachedAt: Date.now(),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        html,
        storefrontUrl: baseOrigin,
        cached: false,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : "Failed to load storefront HTML",
        storefrontUrl: baseOrigin,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};
