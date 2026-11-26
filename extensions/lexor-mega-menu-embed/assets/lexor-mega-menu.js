(function () {
  function isScheduleActive(schedule) {
    if (!schedule || !schedule.enabled) return true;
    var now = Date.now();
    if (schedule.startAt) {
      var s = Date.parse(schedule.startAt);
      if (!isNaN(s) && now < s) return false;
    }
    if (schedule.endAt) {
      var e = Date.parse(schedule.endAt);
      if (!isNaN(e) && now > e) return false;
    }
    return true;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toHandle(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function renderBadgeHtml(badge) {
    if (!badge || !badge.text) return "";
    return (
      '<span class="lmm-badge" style="background:' +
      escapeHtml(badge.bgColor || "#8C1B11") +
      ";color:" +
      escapeHtml(badge.textColor || "#FFFFFF") +
      '">' +
      escapeHtml(badge.text) +
      "</span>"
    );
  }

  function resolveImgUrl(item, filesBaseUrl, width) {
    if (item.imageUrl) {
      var sep = item.imageUrl.indexOf("?") === -1 ? "?" : "&";
      return item.imageUrl + sep + "width=" + width;
    }
    if (item.imageFilename && filesBaseUrl) {
      return filesBaseUrl + encodeURIComponent(item.imageFilename) + "?width=" + width;
    }
    return "";
  }

  function pickActiveMenu(config) {
    if (!config) return null;
    if (Array.isArray(config.scheduledMenus)) {
      for (var i = 0; i < config.scheduledMenus.length; i++) {
        var m = config.scheduledMenus[i];
        if (m && m.status === "PUBLISHED" && isScheduleActive(m.schedule)) {
          return m;
        }
      }
    }
    return config.defaultMenu || null;
  }

  function buildDesktopHtml(menu, filesBaseUrl) {
    var inherit = Boolean(menu.styleSettings && menu.styleSettings.inheritThemeCss);
    var tabs = (menu.items || []).filter(function (t) {
      return t.visibility !== "mobile" && isScheduleActive(t.schedule);
    });

    var itemsHtml = tabs
      .map(function (tab, idx) {
        var handle = toHandle(tab.title);
        var titleStyle = tab.highlightColor
          ? ' style="color:' + escapeHtml(tab.highlightColor) + '"'
          : "";
        var badgeHtml = renderBadgeHtml(tab.badge);

        if (tab.type === "simple_link") {
          return (
            '<li><a id="HeaderMenu-' +
            escapeHtml(handle) +
            '" href="' +
            escapeHtml(tab.url || "/") +
            '" class="header__menu-item list-menu__item link link--text focus-inset"' +
            titleStyle +
            "><span>" +
            escapeHtml(tab.title) +
            badgeHtml +
            "</span></a></li>"
          );
        }

        var contentHtml = "";
        if (tab.type === "mega_menu") {
          var cols = (tab.columns || []).filter(function (c) {
            return c.visibility !== "mobile";
          });
          var colsHtml = cols
            .map(function (col, cIdx) {
              var visibleItems = (col.items || []).filter(function (it) {
                return it.visibility !== "mobile" && isScheduleActive(it.schedule);
              });
              var isTextOnly =
                visibleItems.length > 0 &&
                visibleItems.every(function (x) {
                  return x.type === "text_link";
                });
              var alignClass =
                col.align === "left"
                  ? " lmm-align-left"
                  : col.align === "right"
                    ? " lmm-align-right"
                    : "";

              var cardsHtml = visibleItems
                .map(function (it) {
                  if (it.type === "button") {
                    var isCustomColor =
                      it.buttonBgColor &&
                      it.buttonBgColor.toLowerCase() !== "#8c1b11";
                    var btnStyle = isCustomColor
                      ? ' style="background:' + escapeHtml(it.buttonBgColor) + '"'
                      : "";
                    return (
                      '<div class="lmm-card lmm-card--button"><a href="' +
                      escapeHtml(it.url || "#") +
                      '" class="lmm-btn-viewall"' +
                      btnStyle +
                      "><span>" +
                      escapeHtml(it.btnText || it.title || "Shop All") +
                      "</span></a></div>"
                    );
                  }
                  if (it.type === "text_link") {
                    return (
                      '<div class="lmm-card"><a href="' +
                      escapeHtml(it.url || "#") +
                      '"><span class="lmm-card__title--base">' +
                      escapeHtml(it.title) +
                      renderBadgeHtml(it.badge) +
                      "</span></a></div>"
                    );
                  }
                  var imgUrl = resolveImgUrl(
                    it,
                    filesBaseUrl,
                    it.type === "page" ? 320 : 200
                  );
                  var imgTag = imgUrl
                    ? '<img src="' +
                      escapeHtml(imgUrl) +
                      '" alt="' +
                      escapeHtml(it.title) +
                      '" loading="lazy" />'
                    : "";
                  var subBtn = it.btnText
                    ? '<a href="' +
                      escapeHtml(it.url || "#") +
                      '" class="lmm-card__btn-link">' +
                      escapeHtml(it.btnText) +
                      "</a>"
                    : "";
                  return (
                    '<div class="lmm-card lmm-card--' +
                    escapeHtml(it.type) +
                    '"><a href="' +
                    escapeHtml(it.url || "#") +
                    '"><div class="lmm-card__img-wrap">' +
                    imgTag +
                    '</div><span class="lmm-card__title">' +
                    escapeHtml(it.title) +
                    renderBadgeHtml(it.badge) +
                    "</span></a>" +
                    subBtn +
                    "</div>"
                  );
                })
                .join("");

              var headingHtml =
                col.showHeading && col.heading
                  ? '<h3 class="lmm-col-heading' +
                    (inherit ? " mega-menu-heading" : "") +
                    '">' +
                    escapeHtml(col.heading) +
                    "</h3>"
                  : "";

              var gridClass = isTextOnly
                ? "lmm-grid lmm-grid--text-only" + (inherit ? " collection-grid" : "")
                : "lmm-grid lmm-grid-cols-" +
                  Math.max(1, Math.min(6, col.desktopCols || 1)) +
                  (inherit
                    ? " collection-grid grid-cols-" +
                      Math.max(1, Math.min(6, col.desktopCols || 1))
                    : "");

              var divider =
                cIdx < cols.length - 1
                  ? '<li class="lmm-layout-divider' +
                    (inherit ? " layout-divider" : "") +
                    '"></li>'
                  : "";

              var flexStyle =
                cols.length >= 3
                  ? ' style="flex:' + (col.flexRatio || 1) + ' 1 0"'
                  : ' style="flex:0 1 auto"';

              return (
                '<li class="lmm-col-item' +
                (inherit ? " mega-menu__item" : "") +
                alignClass +
                '"' +
                flexStyle +
                ">" +
                headingHtml +
                '<div class="' +
                gridClass +
                '">' +
                cardsHtml +
                "</div></li>" +
                divider
              );
            })
            .join("");

          contentHtml =
            '<ul class="lmm-parent-container lmm-parent-container--cols-' +
            cols.length +
            (inherit ? " mega-menu__list page-width collection-parent__container" : "") +
            '" role="list">' +
            colsHtml +
            "</ul>";
        } else {
          var ddHtml = (tab.dropdownLinks || [])
            .map(function (dd) {
              var kids = (dd.children || [])
                .map(function (ch) {
                  return (
                    '<li><a href="' +
                    escapeHtml(ch.url || "#") +
                    '">' +
                    escapeHtml(ch.title) +
                    "</a></li>"
                  );
                })
                .join("");
              return (
                '<li><a href="' +
                escapeHtml(dd.url || "#") +
                '" style="font-weight:600;text-transform:uppercase">' +
                escapeHtml(dd.title) +
                renderBadgeHtml(dd.badge) +
                "</a>" +
                (kids ? '<ul class="list-unstyled" role="list">' + kids + "</ul>" : "") +
                "</li>"
              );
            })
            .join("");
          contentHtml = '<ul class="lmm-dropdown-list" role="list">' + ddHtml + "</ul>";
        }

        return (
          '<li><div class="mega-menu" data-lmm-tab="' +
          idx +
          '"><div id="HeaderMenu-' +
          escapeHtml(handle) +
          '" class="header__menu-item list-menu__item link focus-inset"' +
          titleStyle +
          "><span>" +
          escapeHtml(tab.title) +
          badgeHtml +
          '</span></div><div class="mega-menu__content" tabindex="-1">' +
          contentHtml +
          "</div></div></li>"
        );
      })
      .join("");

    return (
      '<nav class="header__inline-menu lmm-desktop-nav"><ul class="list-menu list-menu--inline" role="list">' +
      itemsHtml +
      "</ul></nav>"
    );
  }

  /**
   * Hydrate the theme's native <header-drawer> directly using the exact
   * DOM classes, SVGs, and <details> structure of header-drawer.liquid & drawer-grid-column.liquid.
   * This preserves 100% of Dawn's native animations, icons, sticky buttons, and CSS!
   */
  function hydrateNativeMobileDrawer(drawerEl, menu, meta) {
    var ul = drawerEl.querySelector("ul.menu-drawer__menu");
    if (!ul) return;

    // Exact SVGs from lexor.com's header-drawer.liquid (reused from DOM if present, with byte-exact fallbacks)
    var existingCloseSvg =
      (drawerEl.querySelector(".replace-close-btn") &&
        drawerEl.querySelector(".replace-close-btn").innerHTML.trim()) ||
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M6.575 7.975L1.675 12.875C1.49167 13.0583 1.25833 13.15 0.975 13.15C0.691667 13.15 0.458333 13.0583 0.275 12.875C0.0916663 12.6917 0 12.4583 0 12.175C0 11.8917 0.0916663 11.6583 0.275 11.475L5.175 6.575L0.275 1.675C0.0916663 1.49167 0 1.25833 0 0.975C0 0.691667 0.0916663 0.458333 0.275 0.275C0.458333 0.0916663 0.691667 0 0.975 0C1.25833 0 1.49167 0.0916663 1.675 0.275L6.575 5.175L11.475 0.275C11.6583 0.0916663 11.8917 0 12.175 0C12.4583 0 12.6917 0.0916663 12.875 0.275C13.0583 0.458333 13.15 0.691667 13.15 0.975C13.15 1.25833 13.0583 1.49167 12.875 1.675L7.975 6.575L12.875 11.475C13.0583 11.6583 13.15 11.8917 13.15 12.175C13.15 12.4583 13.0583 12.6917 12.875 12.875C12.6917 13.0583 12.4583 13.15 12.175 13.15C11.8917 13.15 11.6583 13.0583 11.475 12.875L6.575 7.975Z" fill="#333333"/></svg>';

    var rightArrowSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M0.75 10.75L5.75 5.75L0.75 0.75" stroke="#333333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var caretSvg =
      '<svg aria-hidden="true" focusable="false" class="icon icon-caret" viewBox="0 0 10 6"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.354.646a.5.5 0 00-.708 0L5 4.293 1.354.646a.5.5 0 00-.708.708l4 4a.5.5 0 00.708 0l4-4a.5.5 0 000-.708z" fill="currentColor"/></svg>';

    var backSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M8 1L1 8L8 15" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var tabs = (menu.items || []).filter(function (t) {
      return t.visibility !== "desktop" && isScheduleActive(t.schedule);
    });

    var listHtml = tabs
      .map(function (tab, idx) {
        var handle = toHandle(tab.title);
        var colorStyle = tab.highlightColor
          ? ' style="color:' + escapeHtml(tab.highlightColor) + '"'
          : "";
        var badgeHtml = renderBadgeHtml(tab.badge);

        if (tab.type === "simple_link") {
          return (
            '<li><a id="HeaderDrawer-' +
            escapeHtml(handle) +
            '" href="' +
            escapeHtml(tab.url || "/") +
            '" class="menu-drawer__menu-item list-menu__item link link--text focus-inset"' +
            colorStyle +
            ">" +
            escapeHtml(tab.title) +
            badgeHtml +
            "</a></li>"
          );
        }

        var innerContentHtml = "";
        if (tab.type === "mega_menu") {
          var cols = (tab.columns || []).filter(function (c) {
            return c.visibility !== "desktop";
          });
          var colsHtml = cols
            .map(function (col, cIdx) {
              var items = (col.items || []).filter(function (it) {
                return it.visibility !== "desktop" && isScheduleActive(it.schedule);
              });
              // Match drawer-grid-column.liquid exact column logic:
              // >2 desktop cols => grid-cols-2; <=2 desktop cols => grid-cols-1 (where odd last item span-2 creates implicit 2-col for 3 items!)
              var dCols = col.desktopCols || 1;
              var mCols =
                col.mobileCols && col.mobileCols !== 1
                  ? Math.min(3, col.mobileCols)
                  : dCols > 2
                    ? 2
                    : 1;
              var imgW = mCols === 1 ? 640 : 540;
              var align = col.align || "center";
              var posClass = cIdx === 0 ? "left" : "right";

              var headingHtml =
                col.showHeading && col.heading
                  ? '<h3 class="drawer-heading-menu">' + escapeHtml(col.heading) + "</h3>"
                  : "";

              var itemsHtml = items
                .map(function (it) {
                  if (it.type === "button") {
                    var isCustomColor =
                      it.buttonBgColor &&
                      it.buttonBgColor.toLowerCase() !== "#8c1b11";
                    var btnStyle = isCustomColor
                      ? ' style="background:' + escapeHtml(it.buttonBgColor) + '"'
                      : "";
                    return (
                      '<div class="drawer-grid__item"><a href="' +
                      escapeHtml(it.url || "#") +
                      '" class="btn btn-viewall drawer-btn-viewall"' +
                      btnStyle +
                      "><span>" +
                      escapeHtml(it.btnText || it.title || "Shop Now") +
                      "</span></a></div>"
                    );
                  }

                  if (it.type === "text_link") {
                    return (
                      '<div class="drawer-grid__item"><a href="' +
                      escapeHtml(it.url || "#") +
                      '" class="drawer-item-link"><span class="item-title">' +
                      escapeHtml(it.title) +
                      renderBadgeHtml(it.badge) +
                      "</span></a></div>"
                    );
                  }

                  var imgUrl = resolveImgUrl(it, meta.filesBaseUrl, imgW);
                  var imgTag = imgUrl
                    ? '<img src="' +
                      escapeHtml(imgUrl) +
                      '" alt="' +
                      escapeHtml(it.title) +
                      '" width="' +
                      imgW +
                      '" height="540" loading="lazy">'
                    : "";
                  var subBtn = it.btnText
                    ? '<a href="' +
                      escapeHtml(it.url || "#") +
                      '" class="drawer-grid__btn">' +
                      escapeHtml(it.btnText) +
                      "</a>"
                    : "";

                  return (
                    '<div class="drawer-grid__item"><a href="' +
                    escapeHtml(it.url || "#") +
                    '" class="drawer-item-link"><div class="img-container">' +
                    imgTag +
                    '</div><span class="item-title">' +
                    escapeHtml(it.title) +
                    renderBadgeHtml(it.badge) +
                    "</span></a>" +
                    subBtn +
                    "</div>"
                  );
                })
                .join("");

              var dividerHtml =
                cIdx < cols.length - 1 ? '<div class="drawer-divider"></div>' : "";

              return (
                '<div class="drawer-column drawer-column--' +
                posClass +
                '"><div class="drawer-grid-wrapper text-align-' +
                escapeHtml(align) +
                '">' +
                headingHtml +
                '<div class="drawer-collection-grid grid-cols-' +
                mCols +
                " drawer_grid-cols-" +
                mCols +
                '">' +
                itemsHtml +
                "</div></div></div>" +
                dividerHtml
              );
            })
            .join("");

          innerContentHtml =
            '<div class="drawer-collection-parent drawer-collection-parent--cols-' +
            cols.length +
            '">' +
            colsHtml +
            "</div>";
        } else {
          var ddItems = (tab.dropdownLinks || [])
            .map(function (dd) {
              return (
                '<li><a href="' +
                escapeHtml(dd.url || "#") +
                '" class="menu-drawer__menu-item link link--text list-menu__item focus-inset">' +
                escapeHtml(dd.title) +
                renderBadgeHtml(dd.badge) +
                "</a></li>"
              );
            })
            .join("");
          innerContentHtml =
            '<ul class="menu-drawer__menu list-menu" role="list" tabindex="-1">' +
            ddItems +
            "</ul>";
        }

        return (
          '<li><details id="Details-menu-drawer-menu-item-' +
          (idx + 1) +
          '"><summary id="HeaderDrawer-' +
          escapeHtml(handle) +
          '" class="menu-drawer__menu-item list-menu__item link link--text focus-inset"' +
          colorStyle +
          ">" +
          escapeHtml(tab.title) +
          badgeHtml +
          rightArrowSvg +
          caretSvg +
          '</summary><div id="link-' +
          escapeHtml(handle) +
          '" class="menu-drawer__submenu has-submenu gradient motion-reduce" tabindex="-1"><div class="menu-drawer__inner-submenu"><div class="menu-drawer-buttons"><button type="button" aria-expanded="true" class="button-back">' +
          backSvg +
          '</button><button type="button" class="button-times" data-lmm-close-all>' +
          existingCloseSvg +
          '</button></div><div class="title-menu">' +
          escapeHtml(tab.title) +
          "</div>" +
          innerContentHtml +
          "</div></div></details></li>"
        );
      })
      .join("");

    ul.innerHTML = listHtml;

    // Bind Dawn's native MenuDrawer event handlers to our newly injected <summary> & <button> nodes
    if (typeof drawerEl.onSummaryClick === "function") {
      ul.querySelectorAll("summary").forEach(function (s) {
        s.addEventListener("click", drawerEl.onSummaryClick.bind(drawerEl));
      });
    }
    if (typeof drawerEl.onCloseButtonClick === "function") {
      ul.querySelectorAll("button.button-back").forEach(function (b) {
        b.addEventListener("click", drawerEl.onCloseButtonClick.bind(drawerEl));
      });
    }
    ul.querySelectorAll("[data-lmm-close-all]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var toggle = document.getElementById("Details-menu-drawer-toggle");
        if (toggle) toggle.click();
      });
    });

    // Update utility links (Account & Phone) inside existing .menu-drawer__utility-links
    var ms = menu.mobileSettings || {};
    var accountEl = drawerEl.querySelector(".menu-drawer__account");
    if (accountEl) {
      accountEl.style.display = ms.showAccountLink === false ? "none" : "";
    }
    var phoneWrap = drawerEl.querySelector(".company-contact-info");
    var phoneLink = drawerEl.querySelector(".company-contact-info .company-phone");
    if (phoneWrap && phoneLink) {
      if (ms.showPhoneButton === false) {
        phoneWrap.style.display = "none";
      } else {
        phoneWrap.style.display = "";
        if (ms.phoneDisplay) {
          var svgEl = phoneLink.querySelector("svg");
          var svgHtml = svgEl ? svgEl.outerHTML : "";
          phoneLink.innerHTML = svgHtml + " " + escapeHtml(ms.phoneDisplay);
        }
        if (ms.phoneHref) {
          phoneLink.setAttribute("href", ms.phoneHref);
        }
        if (ms.phoneBgColor && ms.phoneBgColor.toLowerCase() !== "#8c1b11") {
          phoneLink.style.background = ms.phoneBgColor;
        }
      }
    }
  }

  function applyStyleSettings(menu) {
    var s = menu && menu.styleSettings;
    if (!s) return;
    var existing = document.getElementById("lmm-dynamic-style");
    if (existing) existing.remove();
    var cssVars =
      ":root{" +
      (s.fontFamily ? "--lmm-font-family:" + s.fontFamily + ";" : "") +
      (s.dropdownBgColor ? "--lmm-dropdown-bg:" + s.dropdownBgColor + ";" : "") +
      (s.tabHoverBgColor ? "--lmm-tab-hover-bg:" + s.tabHoverBgColor + ";" : "") +
      (s.headingColor ? "--lmm-heading-color:" + s.headingColor + ";" : "") +
      (s.itemTitleColor ? "--lmm-item-title-color:" + s.itemTitleColor + ";" : "") +
      (s.itemLinkColor ? "--lmm-item-link-color:" + s.itemLinkColor + ";" : "") +
      (s.dividerColor ? "--lmm-divider-color:" + s.dividerColor + ";" : "") +
      (s.imageSizePx ? "--lmm-img-size:" + s.imageSizePx + "px;" : "") +
      "}";
    var styleTag = document.createElement("style");
    styleTag.id = "lmm-dynamic-style";
    styleTag.textContent = cssVars + "\n" + (s.customCss || "");
    document.head.appendChild(styleTag);
  }

  function init() {
    var configEl = document.getElementById("lexor-mega-menu-config");
    if (!configEl) return;

    var config;
    try {
      config = JSON.parse(configEl.textContent || "null");
    } catch (e) {
      return;
    }

    var mode = configEl.dataset.mode || "active";
    var activeMenu = mode === "override" ? config : pickActiveMenu(config);
    if (!activeMenu) return;

    applyStyleSettings(activeMenu);

    var desktopSelector = configEl.dataset.desktopSelector || ".header__inline-menu";
    var drawerSelector = configEl.dataset.drawerSelector || "header-drawer";
    var filesBaseUrl = configEl.dataset.filesBaseUrl || "";

    // 1. Replace Desktop Inline Menu
    var desktopTarget = document.querySelector(desktopSelector);
    if (desktopTarget) {
      var wrapper = document.createElement("div");
      wrapper.innerHTML = buildDesktopHtml(activeMenu, filesBaseUrl);
      var newNav = wrapper.firstElementChild;
      if (newNav) {
        desktopTarget.replaceWith(newNav);

        var menus = newNav.querySelectorAll(".mega-menu");
        menus.forEach(function (menuEl) {
          var timer;
          menuEl.addEventListener("mouseenter", function () {
            clearTimeout(timer);
            menus.forEach(function (other) {
              if (other !== menuEl) other.classList.remove("is-open");
            });
            menuEl.classList.add("is-open");
          });
          menuEl.addEventListener("mouseleave", function () {
            timer = setTimeout(function () {
              menuEl.classList.remove("is-open");
            }, 120);
          });
        });
      }
    }

    // 2. Hydrate Native <header-drawer>
    var drawerTarget = document.querySelector(drawerSelector);
    if (drawerTarget) {
      hydrateNativeMobileDrawer(drawerTarget, activeMenu, {
        filesBaseUrl: filesBaseUrl,
        customerLoggedIn: configEl.dataset.customerLoggedIn === "true",
        customerAccountsEnabled: configEl.dataset.customerAccountsEnabled === "true",
        accountUrl: configEl.dataset.accountUrl || "/account/login",
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
