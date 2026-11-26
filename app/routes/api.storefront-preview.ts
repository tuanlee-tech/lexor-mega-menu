import fs from "node:fs";
import path from "node:path";
import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { loadStorefrontThemes } from "../lib/shopify-themes.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const themeNumericId = url.searchParams.get("themeId") || "";

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
          passwordProtected: true,
          storefrontUrl: baseOrigin,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    let html = await res.text();

    // Read our exact storefront extension CSS & JS
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

    // Strip Shopify exit-interstitial & third-party chat/analytics scripts for fast, clean preview
    html = html
      .replace(
        /<script[^>]*data-source-attribution="shopify\.exit_interstitial"[^>]*>[\s\S]*?<\/script>/gi,
        ""
      )
      .replace(/<script[^>]*googletagmanager[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<script[^>]*salesiq[^>]*>[\s\S]*?<\/script>/gi, "");

    // Remove any existing lexor-mega-menu-config from the fetched page so our live preview drives it cleanly
    html = html.replace(
      /<script[^>]*id="lexor-mega-menu-config"[^>]*>[\s\S]*?<\/script>/gi,
      ""
    );

    const previewInjection = `
      <base href="${baseOrigin}/" />
      <style>
        #shopify-pc__banner, .zsiq_floatmain, #PBarNextFrameWrapper, .preview-bar-iframe { display: none !important; }
        /* Prevent accidental navigation away inside preview iframe */
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

    return new Response(
      JSON.stringify({
        ok: true,
        html,
        storefrontUrl: baseOrigin,
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
