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
        var titleStyle = tab.highlightColor
          ? ' style="color:' + escapeHtml(tab.highlightColor) + ' !important"'
          : "";
        var badgeHtml = renderBadgeHtml(tab.badge);

        if (tab.type === "simple_link") {
          return (
            '<li><a href="' +
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
                  ? '<h3 class="lmm-col-heading' + (inherit ? " mega-menu-heading" : "") + '">' + escapeHtml(col.heading) + "</h3>"
                  : "";

              var gridClass = isTextOnly
                ? "lmm-grid lmm-grid--text-only" + (inherit ? " collection-grid" : "")
                : "lmm-grid lmm-grid-cols-" + Math.max(1, Math.min(6, col.desktopCols || 1)) + (inherit ? " collection-grid grid-cols-" + Math.max(1, Math.min(6, col.desktopCols || 1)) : "");

              var divider =
                cIdx < cols.length - 1 ? '<li class="lmm-layout-divider' + (inherit ? " layout-divider" : "") + '"></li>' : "";

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
          '"><div class="header__menu-item list-menu__item link focus-inset"' +
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

  function mountMobileDrawer(drawerEl, menu, meta) {
    var tabs = (menu.items || []).filter(function (t) {
      return t.visibility !== "desktop" && isScheduleActive(t.schedule);
    });

    var panel = document.createElement("div");
    panel.className = "lmm-drawer-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    document.body.appendChild(panel);

    function renderRoot() {
      var listHtml = tabs
        .map(function (tab) {
          var colorStyle = tab.highlightColor
            ? ' style="color:' + escapeHtml(tab.highlightColor) + '"'
            : "";
          var badgeHtml = renderBadgeHtml(tab.badge);
          if (tab.type === "simple_link") {
            return (
              '<li><a href="' +
              escapeHtml(tab.url || "/") +
              '" class="lmm-drawer-root-item"' +
              colorStyle +
              "><span>" +
              escapeHtml(tab.title) +
              badgeHtml +
              "</span></a></li>"
            );
          }
          return (
            '<li><button type="button" class="lmm-drawer-root-item" data-open-tab="' +
            escapeHtml(tab.id) +
            '"' +
            colorStyle +
            "><span>" +
            escapeHtml(tab.title) +
            badgeHtml +
            '</span><svg width="8" height="14" viewBox="0 0 9 16" fill="none"><path d="M1 1L8 8L1 15" stroke="#333" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></li>'
          );
        })
        .join("");

      var ms = menu.mobileSettings || {};
      var accountHtml =
        ms.showAccountLink !== false && meta.customerAccountsEnabled
          ? '<a class="lmm-drawer-account" href="' +
            escapeHtml(meta.accountUrl) +
            '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 9c2.67 0 8 1.33 8 4v3H4v-3c0-2.67 5.33-4 8-4Z" stroke="currentColor" stroke-width="1.6"/></svg><span>' +
            (meta.customerLoggedIn ? "Account" : "Log in") +
            "</span></a>"
          : "";

      var phoneSvg =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z"/></svg>';
      var closeSvg =
        '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M1 1L17 17M17 1L1 17" stroke="#333333" stroke-width="1.8" stroke-linecap="round"/></svg>';

      var phoneHtml =
        ms.showPhoneButton !== false && ms.phoneDisplay
          ? '<a class="lmm-drawer-phone-btn" href="' +
            escapeHtml(ms.phoneHref || "tel:" + ms.phoneDisplay.replace(/\D/g, "")) +
            '" style="background:' +
            escapeHtml(ms.phoneBgColor || "#8C1B11") +
            '">' +
            phoneSvg +
            "<span>" +
            escapeHtml(ms.phoneDisplay) +
            "</span></a>"
          : "";

      panel.innerHTML =
        '<div class="lmm-drawer-topbar lmm-drawer-topbar--root">' +
        '<button type="button" class="lmm-drawer-icon-btn" data-close-drawer aria-label="Close">' +
        closeSvg +
        "</button>" +
        "</div>" +
        '<ul class="lmm-drawer-root-list">' +
        listHtml +
        "</ul>" +
        '<div class="lmm-drawer-sep"></div>' +
        accountHtml +
        phoneHtml;
    }

    function renderSubmenu(tab) {
      var bodyHtml = "";
      if (tab.type === "mega_menu") {
        var cols = (tab.columns || []).filter(function (c) {
          return c.visibility !== "desktop";
        });
        bodyHtml = cols
          .map(function (col, cIdx) {
            var items = (col.items || []).filter(function (it) {
              return it.visibility !== "desktop" && isScheduleActive(it.schedule);
            });
            var nonButtons = items.filter(function (x) {
              return x.type !== "button";
            });
            var mCols = Math.max(1, Math.min(3, col.mobileCols || 2));
            var itemsHtml = items
              .map(function (it) {
                if (it.type === "button") {
                  var btnStyle = it.buttonBgColor
                    ? ' style="background:' + escapeHtml(it.buttonBgColor) + '"'
                    : "";
                  return (
                    '<div class="lmm-drawer-item lmm-drawer-item--full"><a href="' +
                    escapeHtml(it.url || "#") +
                    '" class="lmm-btn-viewall"' +
                    btnStyle +
                    "><span>" +
                    escapeHtml(it.btnText || it.title || "Shop All") +
                    "</span></a></div>"
                  );
                }
                var isOddLast =
                  mCols === 2 &&
                  nonButtons.length % 2 === 1 &&
                  nonButtons[nonButtons.length - 1] === it;
                var spanClass = isOddLast ? " lmm-drawer-item--span-2" : "";

                if (it.type === "text_link") {
                  return (
                    '<div class="lmm-drawer-item' +
                    spanClass +
                    '"><a href="' +
                    escapeHtml(it.url || "#") +
                    '" class="lmm-drawer-item__title">' +
                    escapeHtml(it.title) +
                    renderBadgeHtml(it.badge) +
                    "</a></div>"
                  );
                }

                var imgUrl = resolveImgUrl(it, meta.filesBaseUrl, 400);
                var imgTag = imgUrl
                  ? '<div class="lmm-drawer-item__img"><img src="' +
                    escapeHtml(imgUrl) +
                    '" alt="' +
                    escapeHtml(it.title) +
                    '" width="128" height="128" /></div>'
                  : "";
                var subBtn = it.btnText
                  ? '<a href="' +
                    escapeHtml(it.url || "#") +
                    '" class="lmm-drawer-item__btn">' +
                    escapeHtml(it.btnText) +
                    "</a>"
                  : "";

                return (
                  '<div class="lmm-drawer-item' +
                  spanClass +
                  '"><a href="' +
                  escapeHtml(it.url || "#") +
                  '" style="text-decoration:none;text-align:center">' +
                  imgTag +
                  '<div class="lmm-drawer-item__title">' +
                  escapeHtml(it.title) +
                  renderBadgeHtml(it.badge) +
                  "</div></a>" +
                  subBtn +
                  "</div>"
                );
              })
              .join("");

            var headingHtml =
              col.showHeading && col.heading
                ? '<h3 class="lmm-drawer-title">' + escapeHtml(col.heading) + "</h3>"
                : "";
            var divHtml =
              cIdx < cols.length - 1 ? '<div class="lmm-drawer-divider"></div>' : "";

            return (
              headingHtml +
              '<div class="lmm-drawer-grid lmm-drawer-grid--cols-' +
              mCols +
              '">' +
              itemsHtml +
              "</div>" +
              divHtml
            );
          })
          .join("");
      } else {
        bodyHtml = (tab.dropdownLinks || [])
          .map(function (dd) {
            var kids = (dd.children || [])
              .map(function (ch) {
                return (
                  '<div style="padding:6px 0 6px 14px"><a href="' +
                  escapeHtml(ch.url || "#") +
                  '" style="color:#444;text-decoration:none">' +
                  escapeHtml(ch.title) +
                  "</a></div>"
                );
              })
              .join("");
            return (
              '<div style="margin-bottom:14px"><a href="' +
              escapeHtml(dd.url || "#") +
              '" class="lmm-drawer-item__title">' +
              escapeHtml(dd.title) +
              "</a>" +
              kids +
              "</div>"
            );
          })
          .join("");
      }

      panel.innerHTML =
        '<div class="lmm-drawer-topbar">' +
        '<button type="button" class="lmm-drawer-icon-btn" data-back-root aria-label="Back"><svg width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M8 1L1 8L8 15" stroke="#333333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
        '<button type="button" class="lmm-drawer-icon-btn" data-close-drawer aria-label="Close"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M1 1L17 17M17 1L1 17" stroke="#333333" stroke-width="1.8" stroke-linecap="round"/></svg></button>' +
        "</div>" +
        '<div class="lmm-drawer-title">' +
        escapeHtml(tab.title) +
        "</div>" +
        bodyHtml;
    }

    function openDrawer() {
      renderRoot();
      panel.classList.add("is-open");
      document.documentElement.style.overflow = "hidden";
    }

    function closeDrawer() {
      panel.classList.remove("is-open");
      document.documentElement.style.overflow = "";
    }

    panel.addEventListener("click", function (e) {
      var target = e.target.closest("[data-close-drawer], [data-back-root], [data-open-tab]");
      if (!target) return;
      if (target.hasAttribute("data-close-drawer")) {
        closeDrawer();
      } else if (target.hasAttribute("data-back-root")) {
        renderRoot();
      } else if (target.hasAttribute("data-open-tab")) {
        var id = target.getAttribute("data-open-tab");
        var found = tabs.find(function (t) {
          return t.id === id;
        });
        if (found) renderSubmenu(found);
      }
    });

    // Intercept hamburger click on existing header-drawer
    var toggle =
      drawerEl.querySelector("#Details-menu-drawer-toggle") ||
      drawerEl.querySelector("summary") ||
      drawerEl;
    toggle.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        openDrawer();
      },
      true
    );
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

        // Hover interaction with 120ms grace timer (same UX as Lexor's header-mega-menu.liquid)
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

    // 2. Mount Mobile Drawer
    var drawerTarget = document.querySelector(drawerSelector);
    if (drawerTarget) {
      mountMobileDrawer(drawerTarget, activeMenu, {
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
