if (
  typeof location !== "undefined" &&
  (location.protocol === "chrome-extension:" ||
    location.protocol === "edge-extension:")
)
  throw new Error("mend-tools: skip extension page");
function G() {
  var e;
  try {
    return !!((e = chrome == null ? void 0 : chrome.runtime) != null && e.id);
  } catch {
    return !1;
  }
}
function $e(e, o) {
  if (!G()) {
    (L == null || L("扩展已重新加载，请刷新页面后重试。", "error"),
      Y == null || Y(!1));
    return;
  }
  try {
    chrome.runtime.sendMessage(e, o);
  } catch {
    (L == null || L("扩展调用失败，请刷新页面后重试。", "error"),
      Y == null || Y(!1));
  }
}
function ze(e) {
  return e.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function Ne(e) {
  var o;
  if (!e) return null;
  const l = e.querySelector(
    '[contenteditable="true"]:not([contenteditable="false"])',
  );
  return l &&
    !((o = l.closest) != null && o.call(l, "div.item-content.placeholder"))
    ? l
    : null;
}
const Xe = [
    "正立面",
    "左立面",
    "右立面",
    "室内照片",
    "室内平面尺寸图与门头内面尺寸图",
  ],
  We = ["门店尺寸CAD源文件", "门店内部视频"],
  __mkExcludedSiteDownloadLabels = [
    "设计信息沟通确认表",
    "方案图",
    "方案图设计",
  ],
  te = new WeakSet(),
  __mkClickedDownloadItems = new WeakSet(),
  __mkClickedDownloadKeys = new Set(),
  __mkClickedDialogDownloadActions = new WeakSet(),
  __mkQueuedDialogClosers = new WeakSet();
let Me = !1,
  Ae = null;
function __mkSiteDebug(...e) {
  try {
    console.debug("[MK-tool]", ...e);
  } catch {}
}
function __mkLooksLikeKnownFileName(e, o = null) {
  const l =
    o === "cadFiles"
      ? /\.(?:dwg|dxf|dwt|dws|zip|rar|7z|pdf)(?:\b|$)/i
      : o === "internalVideos"
        ? /\.(?:mp4|mov|avi|wmv|mkv|m4v|webm|flv)(?:\b|$)/i
        : /\.(?:dwg|dxf|dwt|dws|zip|rar|7z|pdf|jpg|jpeg|png|gif|bmp|webp|mp4|mov|avi|wmv|mkv|m4v|webm|flv|mp3|wav|aac|doc|docx|xls|xlsx|ppt|pptx|txt|csv)(?:\b|$)/i;
  return l.test(String(e || "").trim());
}
function __mkIsVisibleElement(e) {
  if (!(e instanceof HTMLElement)) return !1;
  try {
    const o = getComputedStyle(e);
    if (
      o.display === "none" ||
      o.visibility === "hidden" ||
      o.opacity === "0"
    )
      return !1;
    const l = e.getBoundingClientRect();
    return l.width > 0 && l.height > 0;
  } catch {
    return !0;
  }
}
function __mkQueueDialogClose(e, o = 1200) {
  e instanceof HTMLElement &&
    !__mkQueuedDialogClosers.has(e) &&
    (__mkQueuedDialogClosers.add(e),
    setTimeout(() => {
      try {
        __mkQueuedDialogClosers.delete(e);
        if (!__mkIsVisibleElement(e)) return;
        const l = e.querySelector(".el-dialog__headerbtn");
        l && l.click();
      } catch {}
    }, Math.max(0, Number(o) || 0)));
}
function __mkTryHandleVisibleDialog(e) {
  if (!(e instanceof HTMLElement) || !__mkIsVisibleElement(e)) return !1;
  const o = Array.from(
    e.querySelectorAll(
      "a[href],button,span,i,[role='button'],.el-button,.el-link,[class*='download'],[class*='icon-download'],[title*='下载'],[aria-label*='下载']",
    ),
  ).filter((l) => __mkIsVisibleElement(l));
  for (const l of o) {
    if (
      __mkClickedDialogDownloadActions.has(l) ||
      !__mkShouldClickDownloadAction(l)
    )
      continue;
    return (
      __mkSiteDebug("弹窗内触发下载", {
        text: (l.textContent || "").trim(),
        className:
          typeof l.className == "string"
            ? l.className
            : l.className && typeof l.className.baseVal == "string"
              ? l.className.baseVal
              : "",
      }),
      __mkClickedDialogDownloadActions.add(l),
      __mkDispatchDownloadClick(l),
      __mkQueueDialogClose(e, 1400),
      !0
    );
  }
  return !1;
}
function Be() {
  Ae ||
    !document.body ||
    ((Ae = new MutationObserver(() => {
      Me &&
        document.querySelectorAll(".el-dialog__wrapper").forEach((e) => {
          if (!__mkIsVisibleElement(e)) return;
          if (__mkTryHandleVisibleDialog(e)) return;
          const o = e.querySelector(".el-dialog__headerbtn");
          o && o.click();
        });
    })),
    Ae.observe(document.body, {
      childList: !0,
      subtree: !0,
      attributes: !0,
      attributeFilter: ["style", "class"],
    }));
}
function pe(e) {
  try {
    return (new URL(e, location.href), !0);
  } catch {
    return !1;
  }
}
function __mkNormalizeHref(e) {
  try {
    return new URL(e, location.href).toString();
  } catch {
    return "";
  }
}
function __mkCanDirectDownloadHref(e) {
  const o = String(e || "").trim();
  if (!o || o === "#" || /^#/i.test(o)) return !1;
  if (/^(?:javascript|about):/i.test(o)) return !1;
  if (/^void\s*\(/i.test(o)) return !1;
  try {
    const l = new URL(o, location.href);
    return l.protocol === "http:" || l.protocol === "https:";
  } catch {
    return !1;
  }
}
function __mkNormalizeText(e) {
  return String(e || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
function __mkGetDirectActionText(e) {
  if (!(e instanceof HTMLElement)) return "";
  const o = [];
  Array.from(e.childNodes).forEach((l) => {
    l.nodeType === Node.TEXT_NODE && o.push(l.textContent || "");
  });
  return __mkNormalizeText(
    [
      o.join(" "),
      e.getAttribute && e.getAttribute("title"),
      e.getAttribute && e.getAttribute("aria-label"),
    ]
      .filter(Boolean)
      .join(" "),
  );
}
function __mkFindPreferredDownloadTrigger(e) {
  if (!(e instanceof HTMLElement)) return null;
  const o = Array.from(
    e.querySelectorAll(
      "a,button,span,i,[role='button'],.preview,.el-upload-list__item-name,.el-link,.el-button,[class*='download'],[class*='preview'],[class*='icon-download'],[class*='xiazai'],[title*='下载'],[aria-label*='下载']",
    ),
  );
  let l = null,
    t = -1 / 0;
  o.forEach((a) => {
    if (!(a instanceof HTMLElement) || !__mkShouldClickDownloadAction(a)) return;
    const r = __mkGetDirectActionText(a),
      n = __mkGetDownloadActionText(a);
    let s = 0;
    /^(下载|download|立即下载|点击下载)$/.test(r)
      ? (s += 120)
      : /^(下载|download|立即下载|点击下载)$/.test(n) && (s += 80);
    (r.includes("下载") || r.includes("download")) && (s += 40);
    (n.includes("下载") || n.includes("download")) && (s += 20);
    (r.includes("预览") || n.includes("预览")) &&
      !(r.includes("下载") || n.includes("下载")) &&
      (s -= 120);
    a.matches(
      ".preview,.el-link,.el-button,[class*='download'],[class*='icon-download']",
    ) && (s += 20);
    (a.tagName === "A" ||
      a.tagName === "BUTTON" ||
      a.getAttribute("role") === "button") &&
      (s += 10);
    a.children.length === 0 && (s += 10);
    s > t && ((t = s), (l = a));
  });
  return l;
}
function __mkCreateSiteDownloadStats() {
  return { cadFiles: 0, internalVideos: 0, siteImages: 0 };
}
function __mkBumpSiteDownloadStat(e, o) {
  e &&
    o &&
    Object.prototype.hasOwnProperty.call(e, o) &&
    (e[o] = Number(e[o] || 0) + 1);
}
function __mkGetSiteDownloadType(e) {
  const o = String(e || "").replace(/\s+/g, "").replace(/[：:]/g, "").trim();
  return o.startsWith("门店尺寸CAD源文件")
    ? "cadFiles"
    : o.startsWith("门店内部视频")
      ? "internalVideos"
      : null;
}
function __mkAddTrackedResource(e, o, l, t = null) {
  l && pe(l) && !e.has(l) && (e.add(l), t && __mkBumpSiteDownloadStat(o, t));
}
function __mkAddTrackedResourceFromElement(e, o, l, t = null, a = null) {
  if (a && __mkShouldExcludeSiteDownloadElement(a)) {
    __mkSiteDebug("跳过排除区块直链资源", {
      sectionLabel: __mkGetScopedSectionLabel(a),
      url: l,
    });
    return;
  }
  __mkAddTrackedResource(e, o, l, t);
}
function __mkIsDirectDownloadAnchor(e) {
  if (!(e instanceof HTMLAnchorElement)) return !1;
  const o = e.getAttribute("href") || e.href || "";
  if (!__mkCanDirectDownloadHref(o)) return !1;
  const l = __mkNormalizeHref(o);
  if (!l) return !1;
  const t = __mkNormalizeText(
      [
        e.textContent || "",
        e.getAttribute && e.getAttribute("title"),
        e.getAttribute && e.getAttribute("download"),
      ]
        .filter(Boolean)
        .join(" "),
    ),
    a = l.toLowerCase();
  return (
    e.hasAttribute("download") ||
    t.includes("下载") ||
    t.includes("download") ||
    /[?&](?:filename|fileName|attname|download)=/.test(a) ||
    /(?:download|attachment|export)(?:[/?#]|$)/.test(a) ||
    /\.(?:dwg|dxf|dwt|dws|zip|rar|7z|pdf|jpg|jpeg|png|gif|bmp|webp|mp4|mov|avi|wmv|mkv|mp3|wav|aac|doc|docx|xls|xlsx|ppt|pptx|txt|csv)(?:[?#]|$)/.test(
      a,
    ) ||
    __mkLooksLikeKnownFileName(t)
  );
}
function __mkGetDirectDownloadLink(e) {
  const o = __mkGetDownloadItemContainer(e) || e;
  if (!o) return "";
  for (const l of Array.from(o.querySelectorAll("a[href]"))) {
    if (!__mkIsDirectDownloadAnchor(l)) continue;
    const t = __mkNormalizeHref(l.href || l.getAttribute("href") || "");
    if (t) return t;
  }
  return "";
}
function __mkDispatchDownloadClick(e) {
  e.scrollIntoView({ behavior: "auto", block: "center" });
  const o = { bubbles: !0, cancelable: !0, view: window };
  (e.dispatchEvent(new MouseEvent("mousedown", o)),
    e.dispatchEvent(new MouseEvent("mouseup", o)),
    e.click());
}
function __mkGetDownloadItemContainer(e) {
  return (
    (e &&
      (e.closest(
        ".atta-item, .el-upload-list__item, .upload-item-wrapper, .fx-file-item, li, tr",
      ) ||
        e.parentElement)) ||
    null
  );
}
function __mkGetDownloadItemScopeKey(e) {
  if (!(e instanceof HTMLElement)) return "";
  const o = e.closest(".form-item,.fx-form-data-widget,.el-form-item");
  if (!(o instanceof HTMLElement)) return "";
  const l = o.querySelector(
    ".item-label span,.item-label,.widget-label,.el-form-item__label,[class*='label'],[class*='title']",
  );
  return __mkNormalizeText((l && l.textContent) || "");
}
function __mkGetDownloadItemIndexKey(e) {
  if (!(e instanceof HTMLElement) || !(e.parentElement instanceof HTMLElement))
    return "";
  const o = Array.from(e.parentElement.children).filter(
    (l) =>
      l instanceof HTMLElement &&
      l.matches(
        ".atta-item,.el-upload-list__item,.upload-item-wrapper,.fx-file-item,li,tr",
      ),
  );
  const l = o.indexOf(e);
  return l >= 0 ? String(l) : "";
}
function __mkHasDirectDownloadLink(e) {
  return !!__mkGetDirectDownloadLink(e);
}
function __mkMarkDownloadItem(e) {
  const o = __mkGetDownloadItemContainer(e) || e;
  if (!o || __mkClickedDownloadItems.has(o)) return !1;
  const l = __mkGetDirectDownloadLink(o),
    n = __mkGetDownloadItemScopeKey(o),
    s = __mkGetDownloadItemIndexKey(o),
    t =
      o.querySelector(
        ".el-upload-list__item-name,.atta-name,.file-name,.name,[title]",
      ) || o,
    a = __mkNormalizeText(
      (t.getAttribute && t.getAttribute("title")) || t.textContent || "",
    ),
    r = l
      ? `href:${n}|${s}|${l}`
      : a && a !== "下载" && a !== "download" && a.length > 2
        ? `text:${n}|${s}|${a}`
        : `${n}|${s}`;
  return (
    !!(!r || !__mkClickedDownloadKeys.has(r)) &&
    (__mkClickedDownloadItems.add(o), r && __mkClickedDownloadKeys.add(r), !0)
  );
}
function __mkQueueDownloadClick(e, o, l = 400) {
  const t = Math.max(0, (o || 1) - 1) * l;
  setTimeout(() => {
    try {
      __mkDispatchDownloadClick(e);
    } catch {}
  }, t);
}
function __mkGetDownloadActionText(e) {
  if (!(e instanceof HTMLElement)) return "";
  const o = [],
    l = e.getAttribute && e.getAttribute("title"),
    t = e.getAttribute && e.getAttribute("aria-label"),
    a = e.textContent || "";
  return (
    l && o.push(l),
    t && o.push(t),
    a && o.push(a),
    __mkNormalizeText(o.join(" "))
  );
}
function __mkShouldClickDownloadAction(e) {
  if (!(e instanceof HTMLElement)) return !1;
  const o = __mkGetDownloadActionText(e),
    n = __mkGetDirectActionText(e),
    l =
      typeof e.className == "string"
        ? e.className
        : e.className && typeof e.className.baseVal == "string"
          ? e.className.baseVal
          : "",
    t = __mkNormalizeText(
      [
        l,
        e.getAttribute && e.getAttribute("data-action"),
        e.getAttribute && e.getAttribute("data-type"),
        e.getAttribute && e.getAttribute("icon"),
      ]
        .filter(Boolean)
        .join(" "),
    );
  if (
    e.tagName === "SPAN" &&
    e.children.length > 0 &&
    !n &&
    !l.trim() &&
    !e.getAttribute("role") &&
    !e.getAttribute("title") &&
    !e.getAttribute("aria-label")
  )
    return !1;
  if (/^(下载|download|立即下载|点击下载)$/.test(o)) return !0;
  const a =
    o.includes("下载") ||
    o.includes("download") ||
    t.includes("下载") ||
    t.includes("download") ||
    t.includes("xiazai");
  const r =
    e.tagName === "A" ||
    e.tagName === "BUTTON" ||
    e.getAttribute("role") === "button" ||
    e.matches(
      ".preview,.el-upload-list__item-name,.el-link,.el-button,[class*='download'],[class*='preview']",
    );
  if (!!r && a) return !0;
  return (
    !!__mkGetDownloadItemContainer(e) &&
    e.matches(
      ".el-upload-list__item-name,.atta-name,.file-name,.name,.upload-file-info,.info-size,.preview,.el-link",
    ) &&
    __mkLooksLikeKnownFileName(o)
  );
}
function __mkQueueSectionDownloadActions(e, o, l = 400, t = null, a = null) {
  if (!(e instanceof HTMLElement)) return o;
  const r = new Set();
  return (
    e
      .querySelectorAll(
        "a,button,span,i,[role='button'],.preview,.el-upload-list__item-name,.el-link,.el-button,[class*='download'],[class*='preview'],[class*='icon-download'],[class*='xiazai'],[title*='下载'],[aria-label*='下载']",
      )
      .forEach((n) => {
        const i = __mkFindPreferredDownloadTrigger(
          __mkGetDownloadItemContainer(n) || n,
        );
        if (!(i instanceof HTMLElement)) return;
        const s = __mkGetDownloadItemContainer(i) || i;
        if (__mkShouldExcludeSiteDownloadElement(i)) {
          __mkSiteDebug("跳过排除区块下载按钮", {
            sectionLabel: __mkGetScopedSectionLabel(i),
            text: (i.textContent || "").trim(),
          });
          return;
        }
        if (
          r.has(s) ||
          te.has(i) ||
          !__mkShouldClickDownloadAction(i) ||
          __mkHasDirectDownloadLink(i) ||
          !__mkMarkDownloadItem(i)
        )
          return;
        (t === "cadFiles" || t === "internalVideos") &&
          __mkSiteDebug("队列点击下载按钮", {
            section: t,
            text: (i.textContent || "").trim(),
            className:
              typeof i.className == "string"
                ? i.className
                : i.className && typeof i.className.baseVal == "string"
                  ? i.className.baseVal
                  : "",
            itemText: (s.textContent || "").replace(/\s+/g, " ").trim(),
          });
        (r.add(s),
          te.add(i),
          (o += 1),
          t && a && __mkBumpSiteDownloadStat(a, t),
          __mkQueueDownloadClick(i, o, l));
      }),
    o
  );
}
function __mkQueueSectionFileItemClicks(
  e,
  o,
  l,
  t = 400,
  a = null,
  r = null,
) {
  if (!(e instanceof HTMLElement)) return l;
  const n = new Set();
  return (
    e
      .querySelectorAll(
        ".upload-item-wrapper,.el-upload-list__item,.atta-item,.fx-file-item,li,tr",
      )
      .forEach((s) => {
        const i = __mkGetDownloadItemContainer(s) || s;
        if (
          !i ||
          n.has(i) ||
          __mkClickedDownloadItems.has(i) ||
          __mkShouldExcludeSiteDownloadElement(i)
        ) {
          i &&
            __mkShouldExcludeSiteDownloadElement(i) &&
            __mkSiteDebug("跳过排除区块附件项", {
              sectionLabel: __mkGetScopedSectionLabel(i),
              itemText: (i.textContent || "").replace(/\s+/g, " ").trim(),
            });
          return;
        }
        const h =
            i.querySelector(
              ".el-upload-list__item-name,.atta-name,.file-name,.name,.upload-file-info,.info-size,[title]",
            ) || i,
          E = __mkNormalizeText(
            [
              (h.getAttribute && h.getAttribute("title")) || "",
              h.textContent || "",
              i.textContent || "",
            ].join(" "),
          );
        if (!__mkLooksLikeKnownFileName(E, a)) return;
        const w = __mkGetDirectDownloadLink(i);
        if (w) {
          (a === "cadFiles" || a === "internalVideos") &&
            __mkSiteDebug("识别到直链资源", {
              section: a,
              url: w,
              itemText: (i.textContent || "").replace(/\s+/g, " ").trim(),
            });
          (__mkAddTrackedResourceFromElement(o, r, w, a, i),
            __mkMarkDownloadItem(i),
            n.add(i));
          return;
        }
        const y = __mkFindPreferredDownloadTrigger(i);
        if (!y || te.has(y) || !__mkMarkDownloadItem(y)) return;
        (a === "cadFiles" || a === "internalVideos") &&
          __mkSiteDebug("按文件项补点下载", {
            section: a,
            triggerText: (y.textContent || "").trim(),
            itemText: (i.textContent || "").replace(/\s+/g, " ").trim(),
          });
        (n.add(i),
          te.add(y),
          (l += 1),
          a && r && __mkBumpSiteDownloadStat(r, a),
          __mkQueueDownloadClick(y, l, t));
      }),
    l
  );
}
function __mkNormalizeSectionLabel(e) {
  return String(e || "")
    .replace(/\s+/g, "")
    .replace(/[：:]/g, "")
    .trim();
}
function __mkMatchesExcludedSiteDownloadLabel(e) {
  const o = __mkNormalizeSectionLabel(e);
  return (
    !!o &&
    __mkExcludedSiteDownloadLabels.some((l) => {
      const t = __mkNormalizeSectionLabel(l);
      return o === t || o.startsWith(t) || o.includes(t);
    })
  );
}
function __mkGetScopedSectionLabel(e) {
  if (!(e instanceof Element)) return "";
  const o = [
    [".form-item", ".item-label span,.item-label"],
    [".fx-form-data-widget", ".widget-label"],
    [".el-form-item", ".el-form-item__label"],
    [".top-bar", ".title"],
    [
      "[class*='section'],[class*='card'],[class*='panel'],.top-bar-wrapper,.el-card,.x-card,.el-collapse-item",
      ".top-bar .title,.widget-label,.item-label,.el-form-item__label,.title,[class*='title'],[class*='label']",
    ],
  ];
  for (const [l, t] of o) {
    const a = e.closest(l);
    if (!(a instanceof HTMLElement)) continue;
    const r = a.querySelector(t),
      n = __mkNormalizeSectionLabel((r && r.textContent) || "");
    if (n) return n;
  }
  return "";
}
function __mkShouldExcludeSiteDownloadElement(e) {
  return __mkMatchesExcludedSiteDownloadLabel(__mkGetScopedSectionLabel(e));
}
function __mkIsSectionLabelMatch(e, o) {
  const l = __mkNormalizeSectionLabel(e),
    t = __mkNormalizeSectionLabel(o);
  return !!(l && t) && (l === t || l.startsWith(t) || l.includes(t));
}
function __mkCollectSectionFallbackByLabel(e, o, l, t, a, r = 500) {
  if (!e) return l;
  const n = __mkNormalizeSectionLabel(e);
  if (!n) return l;
  const s = new Set(),
    i = [
      ".top-bar",
      ".top-bar .title",
      ".title",
      ".widget-label",
      ".item-label",
      ".el-form-item__label",
      ".tab-header-item",
      "[class*='title']",
      "[class*='label']",
    ],
    h = [
      "[class*='section']",
      "[class*='card']",
      "[class*='panel']",
      ".top-bar-wrapper",
      ".fx-form-data-widget",
      ".form-item",
      ".el-card",
      ".x-card",
      ".el-collapse-item",
    ],
    E = (w) => {
      if (!(w instanceof HTMLElement)) return;
      const y = __mkNormalizeSectionLabel(w.textContent || "");
      if (!__mkIsSectionLabelMatch(y, n)) return;
      s.add(w);
      w.parentElement && s.add(w.parentElement);
      w.nextElementSibling instanceof HTMLElement && s.add(w.nextElementSibling);
      w.parentElement &&
        w.parentElement.nextElementSibling instanceof HTMLElement &&
        s.add(w.parentElement.nextElementSibling);
      h.forEach((x) => {
        const c = w.closest(x);
        c && s.add(c);
      });
    };
  i.forEach((w) => {
    document.querySelectorAll(w).forEach(E);
  });
  if (s.size === 0) {
    Array.from(document.querySelectorAll("*")).forEach((w) => {
      if (!(w instanceof HTMLElement)) return;
      const y = __mkNormalizeSectionLabel(w.textContent || "");
      if (!y || y.length > n.length + 30 || !__mkIsSectionLabelMatch(y, n))
        return;
      E(w);
    });
  }
  return (
    s.forEach((w) => {
      w.querySelectorAll("a[href]").forEach((y) => {
        if (!__mkIsDirectDownloadAnchor(y)) return;
        const x = __mkNormalizeHref(y.href || y.getAttribute("href") || "");
        __mkAddTrackedResourceFromElement(o, t, x, a, y);
      }),
        (l = __mkQueueSectionDownloadActions(w, l, r, a, t)),
        (l = __mkQueueSectionFileItemClicks(w, o, l, r, a, t));
    }),
    l
  );
}
async function Ue(e) {
  var o;
  const l = new Set(),
    siteDownloadStats = __mkCreateSiteDownloadStats(),
    t = (e == null ? void 0 : e.fileSectionLabelsOnly) ?? We;
  __mkSiteDebug("开始收集资源", {
    labels: Array.isArray(t) ? t : [],
    siteOnly:
      !((o = e == null ? void 0 : e.fileSectionLabelsOnly) != null && o.length),
  });
  if (
    !((o = e == null ? void 0 : e.fileSectionLabelsOnly) != null && o.length)
  ) {
    const i = [
        "正立面",
        "左立面",
        "右立面",
        "室内照片",
        "室内平面尺寸图与门头内面尺寸图",
        "室内平面尺寸图与门头立面尺寸图",
      ],
      h = document.querySelectorAll(".fx-form-data-widget");
    (h.length > 0 &&
      h.forEach((E) => {
        const w = E.querySelector(".widget-label"),
          y = ((w == null ? void 0 : w.textContent) || "")
            .replace(/\s+/g, "")
            .replace(/[：:]/g, "")
            .trim();
        i.some((x) => y === x || y.startsWith(x)) &&
          E.querySelectorAll(".fx-form-image img[src]").forEach((x) => {
            const c = x.currentSrc || x.src;
            __mkAddTrackedResourceFromElement(
              l,
              siteDownloadStats,
              c,
              "siteImages",
              x,
            );
          });
      }),
      document.querySelectorAll(".form-item").forEach((E) => {
        const w = E.querySelector(".item-label span, .item-label"),
          y = ((w == null ? void 0 : w.textContent) || "")
            .replace(/\s+/g, "")
            .replace(/[：:]/g, "")
            .trim();
        i.some((x) => y === x || y.startsWith(x)) &&
          E.querySelectorAll(".img-list img[src], .el-image img[src]").forEach(
            (x) => {
              const c = x.currentSrc || x.src;
              __mkAddTrackedResourceFromElement(
                l,
                siteDownloadStats,
                c,
                "siteImages",
                x,
              );
            },
          );
      }),
      Xe.forEach((E) => {
        Array.from(document.querySelectorAll("*")).forEach((w) => {
          var y;
          if (
            !(w.textContent || "")
              .replace(/\s+/g, "")
              .replace(/[：:]/g, "")
              .startsWith(E)
          )
            return;
          const x = [];
          (w.nextElementSibling instanceof HTMLElement &&
            x.push(w.nextElementSibling),
            ((y = w.parentElement) == null
              ? void 0
              : y.nextElementSibling) instanceof HTMLElement &&
              x.push(w.parentElement.nextElementSibling),
            x.forEach((c) => {
              c.querySelectorAll("img[src]").forEach((g) => {
                const _ = g.currentSrc || g.src;
                __mkAddTrackedResourceFromElement(
                  l,
                  siteDownloadStats,
                  _,
                  "siteImages",
                  g,
                );
              });
            }));
        });
      }));
  }
  let a = 0;
  const u =
      (e == null ? void 0 : e.fileSectionLabelsOnly) &&
      e.fileSectionLabelsOnly.length > 0 &&
      e.fileSectionLabelsOnly.includes("效果图") &&
      e.fileSectionLabelsOnly.includes("施工图"),
    n = new Set(t),
    s = (i) =>
      n.has(i) ||
      Array.from(n).some((h) => i.startsWith(h) && i.length <= h.length + 20);
  let r = Array.from(document.querySelectorAll(".fx-form-data-widget")).filter(
    (i) => {
      const h = i.querySelector(".widget-label"),
        E = ((h == null ? void 0 : h.textContent) || "")
          .replace(/\s+/g, "")
          .replace(/[：:]/g, "")
          .trim();
      return s(E);
    },
  );
  if (u && r.length > 0) {
    const i = (h) => {
      var E;
      return (
        ((E = h.querySelector(".widget-label")) == null
          ? void 0
          : E.textContent) || ""
      )
        .replace(/\s+/g, "")
        .replace(/[：:]/g, "")
        .trim();
    };
    r = [...r].sort((h, E) => {
      const w = i(h),
        y = i(E),
        x = { 效果图: 0, 施工图: 1 },
        c = x[w] ?? 2,
        g = x[y] ?? 2;
      return c - g;
    });
  }
  if (r.length > 0)
    for (let i = 0; i < r.length; i++) {
      const h = r[i];
      i > 0 && (await new Promise((T) => setTimeout(T, u ? 900 : 150)));
      const E = h.querySelector(".widget-label"),
        w = ((E == null ? void 0 : E.textContent) || "")
          .replace(/\s+/g, "")
          .replace(/[：:]/g, "")
          .trim(),
        y = __mkGetSiteDownloadType(w);
      if (!s(w)) continue;
      h.querySelectorAll("a[href]").forEach((T) => {
        if (!__mkIsDirectDownloadAnchor(T)) return;
        const v = __mkNormalizeHref(T.href || T.getAttribute("href") || "");
        __mkAddTrackedResourceFromElement(l, siteDownloadStats, v, y, T);
      });
      const x = [
          ".upload-btn-download",
          ".icon-download",
          ".info-size",
          ".upload-file-info",
          ".fx-file-item",
          ".upload-item-wrapper",
        ],
        c = Array.from(h.querySelectorAll(".upload-item-wrapper")),
        g = w === "施工图",
        _ = g ? 2200 : y === "cadFiles" ? 900 : 400,
        N = g ? 600 : y === "cadFiles" ? 700 : 400,
        T = (v) => {
          v.scrollIntoView({ behavior: "auto", block: "center" });
          const P = { bubbles: !0, cancelable: !0, view: window };
          (v.dispatchEvent(new MouseEvent("mousedown", P)),
            v.dispatchEvent(new MouseEvent("mouseup", P)),
            v.click());
        };
      for (let v = 0; v < c.length; v++) {
        const P = c[v];
        v > 0 && (await new Promise(($) => setTimeout($, _)));
        let z = null;
        for (const $ of x) {
          const Q = P.querySelector($);
          if (Q && !te.has(Q)) {
            z = Q;
            break;
          }
        }
        z &&
          !__mkHasDirectDownloadLink(z) &&
          __mkMarkDownloadItem(z) &&
          (te.add(z),
          (a += 1),
          y && __mkBumpSiteDownloadStat(siteDownloadStats, y),
          T(z),
          await new Promise(($) => setTimeout($, N)));
      }
      a = __mkQueueSectionFileItemClicks(
        h,
        l,
        a,
        y === "cadFiles" ? 900 : 500,
        y,
        siteDownloadStats,
      );
    }
  if (u) {
    const i = (h) =>
      n.has(h) ||
      Array.from(n).some((E) => h.startsWith(E) && h.length <= E.length + 20);
    document.querySelectorAll(".form-item").forEach((h) => {
      const E = h.querySelector(".item-label"),
        w = ((E == null ? void 0 : E.textContent) || "")
          .replace(/\s+/g, "")
          .replace(/[：:]/g, "")
          .trim();
      if (!i(w)) return;
      const y = h.querySelector(".item-value");
      y &&
        (y.querySelectorAll("a[href]").forEach((x) => {
          if (!__mkIsDirectDownloadAnchor(x)) return;
          const c = __mkNormalizeHref(x.href || x.getAttribute("href") || "");
          __mkAddTrackedResourceFromElement(l, siteDownloadStats, c, w, x);
        }),
        y.querySelectorAll(".atta-list .atta-item .preview").forEach((x) => {
          const c = (x.textContent || "").trim();
          (!c.includes("下载") && !c.toLowerCase().includes("download")) ||
            te.has(x) ||
            __mkHasDirectDownloadLink(x) ||
            !__mkMarkDownloadItem(x) ||
            (te.add(x), (a += 1), __mkQueueDownloadClick(x, a));
        }),
        y.querySelectorAll(".el-upload-list__item-name").forEach((x) => {
          const c = (x.textContent || "").trim();
          (!c.includes("下载") && !c.toLowerCase().includes("download")) ||
            te.has(x) ||
            __mkHasDirectDownloadLink(x) ||
            !__mkMarkDownloadItem(x) ||
            (te.add(x), (a += 1), __mkQueueDownloadClick(x, a));
        }));
    });
  } else {
    document.querySelectorAll(".form-item").forEach((i) => {
      const h = i.querySelector(".item-label span, .item-label"),
        E = ((h == null ? void 0 : h.textContent) || "")
          .replace(/\s+/g, "")
          .replace(/[：:]/g, "")
          .trim(),
        w = __mkGetSiteDownloadType(E);
      if (!s(E)) return;
      (w === "cadFiles" || w === "internalVideos") &&
        __mkSiteDebug("命中 form-item 区块", {
          sectionLabel: E,
          section: w,
          itemText: (i.textContent || "").replace(/\s+/g, " ").trim(),
        });
      const y = i.querySelector(".item-value");
      y &&
        (y.querySelectorAll("a[href]").forEach((x) => {
          if (!__mkIsDirectDownloadAnchor(x)) return;
          const c = __mkNormalizeHref(x.href || x.getAttribute("href") || "");
          __mkAddTrackedResourceFromElement(l, siteDownloadStats, c, w, x);
        }),
        (a = __mkQueueSectionDownloadActions(
          y,
          a,
          w === "cadFiles" ? 900 : 500,
          w,
          siteDownloadStats,
        )),
        (a = __mkQueueSectionFileItemClicks(
          y,
          l,
          a,
          w === "cadFiles" ? 900 : 500,
          w,
          siteDownloadStats,
        )));
    });
    t.forEach((i) => {
      const h = __mkGetSiteDownloadType(i);
      Array.from(document.querySelectorAll("*")).forEach((E) => {
        var w;
        const y = (E.textContent || "")
          .replace(/\s+/g, "")
          .replace(/[：:]/g, "");
        if (!y.startsWith(i) || y.length > i.length + 20) return;
        const x = [];
        (E.nextElementSibling instanceof HTMLElement &&
          x.push(E.nextElementSibling),
          E.parentElement instanceof HTMLElement && x.push(E.parentElement),
          ((w = E.parentElement) == null
            ? void 0
            : w.nextElementSibling) instanceof HTMLElement &&
            x.push(E.parentElement.nextElementSibling),
          x.forEach((c) => {
            (c.querySelectorAll("a[href]").forEach((g) => {
              if (!__mkIsDirectDownloadAnchor(g)) return;
              const _ = __mkNormalizeHref(
                g.href || g.getAttribute("href") || "",
              );
              __mkAddTrackedResourceFromElement(
                l,
                siteDownloadStats,
                _,
                h,
                g,
              );
            }),
              (a = __mkQueueSectionDownloadActions(
                c,
                a,
                h === "cadFiles" ? 900 : 400,
                h,
                siteDownloadStats,
              )),
              (a = __mkQueueSectionFileItemClicks(
                c,
                l,
                a,
                h === "cadFiles" ? 900 : 500,
                h,
                siteDownloadStats,
              )));
          }));
      });
    });
  }
  !u &&
    n.has("门店尺寸CAD源文件") &&
    siteDownloadStats.cadFiles === 0 &&
    (a = __mkCollectSectionFallbackByLabel(
      "门店尺寸CAD源文件",
      l,
      a,
      siteDownloadStats,
      "cadFiles",
      900,
    ));
  !u &&
    n.has("门店内部视频") &&
    siteDownloadStats.internalVideos === 0 &&
    (a = __mkCollectSectionFallbackByLabel(
      "门店内部视频",
      l,
      a,
      siteDownloadStats,
      "internalVideos",
      500,
    ));
  const d = Array.from(l);
  __mkSiteDebug("资源收集完成", {
    resourceCount: d.length,
    downloadClicks: a,
    siteDownloadStats,
  });
  return { resources: d, downloadClicks: a, siteDownloadStats };
}
const ue = [
  "门店编码",
  "上匠门店简称",
  "加盟商名称",
  "加盟商联系方式",
  "预估流水",
  "外卖占比",
  "外卖流水",
  "完整地址",
  "项目类型",
  "省份",
  "拓展顾问",
  "接案时间",
  "店宽",
  "装修面积",
  "完成时间",
  "状态",
];
function hasSectionDownloadableFiles(sectionName) {
  const bars = document.querySelectorAll(".top-bar");
  for (const bar of bars) {
    const titleEl = bar.querySelector(".title");
    const title = ((titleEl == null ? void 0 : titleEl.textContent) || "")
      .replace(/\s+/g, "")
      .trim();
    if (!title || !title.includes(sectionName)) continue;
    const container =
      bar.closest(
        "[class*='section'],[class*='card'],[class*='panel'],.top-bar-wrapper",
      ) || bar.parentElement;
    const scope = container || document;
    const hasLink = scope.querySelectorAll("a[href]").length > 0;
    let hasFile = !1;
    scope.querySelectorAll("a[href]").forEach((a) => {
      const t = (a.textContent || "").trim(),
        h = a.href || a.getAttribute("href") || "";
      if (
        (t.includes("下载") || t.toLowerCase().includes("download")) &&
        h &&
        pe(h)
      )
        hasFile = !0;
    });
    if (hasFile) return !0;
    if (
      scope.querySelectorAll(
        ".upload-item-wrapper, .upload-btn-download, .icon-download, .fx-form-data-widget, .form-item .item-value a[href]",
      ).length > 0
    )
      return !0;
    if (scope.querySelectorAll("img[src]").length > 0) return !0;
  }
  return !1;
}
function computeStatus() {
  if (hasSectionDownloadableFiles("三图确认")) return "三图通过";
  if (hasSectionDownloadableFiles("水路图设计")) return "效果图进行中";
  if (hasSectionDownloadableFiles("方案图设计")) return "水路图进行中";
  return "对接中";
}
async function Ve() {
  const e = ["勘场任务", "三图确认", "水路图设计", "方案图设计"],
    o = document.querySelectorAll(".top-bar");
  for (const l of o) {
    const t = l.querySelector(".title"),
      a = ((t == null ? void 0 : t.textContent) || "")
        .replace(/\s+/g, "")
        .trim();
    if (!e.some((s) => a.includes(s))) continue;
    const u = l.querySelector(".show-btn");
    if (!u) continue;
    const n = u.querySelector("span");
    n &&
      n.textContent.trim() === "展开" &&
      (u.click(), await new Promise((s) => setTimeout(s, 180)));
  }
  await new Promise((l) => setTimeout(l, 200));
}
function k(e) {
  return (e || "").replace(/\s+/g, " ").trim();
}
function isFieldEmpty(v) {
  const s = (v || "").trim();
  if (!s) return true;
  if (s === "需要自己填写") return true;
  if (/^0+(\.0*)?\s*(米|平米|㎡|m²|m|平方米|万|元|万元)?%?$/i.test(s))
    return true;
  if (/^[-—－\-]+$/.test(s)) return true;
  if (/请选择/.test(s)) return true;
  if (/^请\s*(选择|填写|输入)/.test(s)) return true;
  if (ue.includes(s) || ue.includes(s.replace(/[：:]\s*$/, "").trim()))
    return true;
  const w = [
    "无",
    "暂无",
    "待填",
    "待填写",
    "请选择",
    "请填写",
    "请选择人员",
    "未填写",
    "未找到",
    "空",
    "无数据",
    "未选择",
    "待补充",
    "待完善",
    "暂无数据",
    "暂无信息",
    "N/A",
    "n/a",
    "NA",
    "--",
    "—",
    "－",
    "待定",
    "未分配",
    "未设置",
  ];
  if (w.includes(s)) return true;
  if (/^[\s\-—－_]*$/.test(s)) return true;
  return false;
}
function ne(e) {
  const o = k(e);
  if (!o) return "";
  const l = /(?:^|\s)(?!https?:)([\u4e00-\u9fa5A-Za-z0-9]{2,20})\s*[：:]/g.exec(
    o,
  );
  if (!l) return o;
  const t = l.index;
  return t <= 0 ? o : o.slice(0, t).trim();
}
function Pe(e, o) {
  const l = k(e);
  if (!l) return !0;
  const t =
    {
      门店编码: 40,
      上匠门店简称: 60,
      接案时间: 40,
      省份: 10,
      加盟商名称: 80,
      加盟商联系方式: 40,
      项目类型: 40,
      拓展顾问: 40,
      预估流水: 40,
      外卖占比: 20,
      外卖流水: 40,
      完整地址: 200,
      店宽: 20,
      装修面积: 20,
      完成时间: 20,
    }[o] ?? 80;
  if (l.length > t) return !0;
  for (const a of ue) if (a !== o && l.includes(a)) return !0;
  return !1;
}
function se(e, o) {
  var l, t, a;
  const u = k(o);
  if (!u) return "";
  if (e === "拓展顾问") return u.replace(/\s*\([^)]*\)/g, "").trim() || u;
  if (e === "店宽") return u.replace(/[^\d.]/g, "") || "";
  if (e === "完成时间") {
    const n = (u.match(/(\d{4}-\d{1,2}-\d{1,2})/) || [])[1];
    return n
      ? n.replace(
          /(\d{4})-(\d{1,2})-(\d{1,2})/,
          (s, r, i, h) =>
            `${r}-${String(parseInt(i, 10)).padStart(2, "0")}-${String(parseInt(h, 10)).padStart(2, "0")}`,
        )
      : "";
  }
  if (e === "外卖占比") {
    const n = parseFloat(u.replace(/[^\d.]/g, ""));
    if (!isNaN(n) && n > 100 && n < 1e4)
      return (n / 100).toFixed(2).replace(/\.?0+$/, "");
  }
  if (e === "加盟商联系方式") {
    const n = (l = u.match(/1\d{10}/)) == null ? void 0 : l[0];
    if (n) return n;
    const s = (t = u.match(/0\d{2,3}-?\d{7,8}/)) == null ? void 0 : t[0];
    return (
      s ||
      ((a = u.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)) == null
        ? void 0
        : a[0]) ||
      u.split(/[\s，,;；/|]+/)[0] ||
      u
    );
  }
  return u;
}
function Ye() {
  const e = {};
  let pageUrl = typeof window !== "undefined" ? window.location.href : "";
  try {
    const u = new URL(pageUrl);
    (u.searchParams.delete("activeTab"), (pageUrl = u.toString()));
  } catch {
    pageUrl = pageUrl
      .replace(/\?activeTab=detail$/i, "")
      .replace(/&activeTab=detail($|&)/gi, "$1");
  }
  e.链接 = pageUrl;
  ue.forEach((n) => {
    e[n] = "";
  });
  const oMap = {
    门店编码: "门店编码",
    上匠门店简称: "上匠门店简称",
    完整地址: "完整地址",
    联系方式: "加盟商联系方式",
    户主名称: "加盟商名称",
    加盟商名称: "加盟商名称",
    建档档期: "接案时间",
    合同类型: "项目类型",
  };
  const o = document.querySelectorAll(".fx-form-data-widget");
  o.length > 0 &&
    o.forEach((n) => {
      const s = n.querySelector(".widget-label"),
        r = ((s == null ? void 0 : s.textContent) || "")
          .replace(/\s+/g, "")
          .replace(/[：:]/g, "")
          .trim(),
        d = n.querySelector(".widget-data"),
        i =
          (d == null ? void 0 : d.querySelector("span[title]")) ||
          (d == null
            ? void 0
            : d.querySelector(".fx-form-content-disabled span[title]")) ||
          (d == null
            ? void 0
            : d.querySelector(".fx-form-content-disabled span")) ||
          (d == null ? void 0 : d.querySelector(".fx-form-content-view")),
        h = i ? (i.getAttribute("title") || i.textContent || "").trim() : "";
      if (h) {
        const x = oMap[r] ?? (ue.includes(r) ? r : null);
        x && (e[x] = se(x, h));
      }
    });
  const l = document.querySelectorAll(".form-item");
  l.length > 0 &&
    l.forEach((n) => {
      const s = n.querySelector(".item-label span, .item-label"),
        r = ((s == null ? void 0 : s.textContent) || "")
          .replace(/\s+/g, "")
          .replace(/[：:]/g, "")
          .trim();
      if (!r) return;
      if (r === "合同类型" && !e.项目类型) {
        const h = n.querySelector(".item-value");
        if (h) {
          let E = k(h.textContent || "");
          E &&
            !/^(--|预览|下载)\s*$/i.test(E) &&
            (e.项目类型 = se("项目类型", ne(E)));
        }
        return;
      }
      if (!ue.includes(r)) return;
      const d = n.querySelector(".item-value");
      if (!d) return;
      let i = "";
      (d.querySelector("a[href]"),
        (i = k(d.textContent || "")),
        i && !/^(--|预览|下载)\s*$/i.test(i) && (e[r] = se(r, ne(i))));
    });
  const t = document.querySelectorAll(".el-form-item");
  t.length > 0 &&
    t.forEach((n) => {
      const s = n.querySelector(".el-form-item__label"),
        r = ((s == null ? void 0 : s.textContent) || "")
          .replace(/\s+/g, "")
          .replace(/[：:]/g, "")
          .trim();
      if (!r) return;
      if (r === "合同类型" && !e.项目类型) {
        const w = n.querySelector(".el-form-item__content");
        if (w) {
          const y =
              w.querySelector("input.el-input__inner") ||
              w.querySelector("input[type='text']") ||
              w.querySelector(".el-input-number input"),
            x = w.querySelector("textarea"),
            c =
              ((y == null ? void 0 : y.value) != null &&
                String(y.value).trim()) ||
              ((x == null ? void 0 : x.value) != null &&
                String(x.value).trim()) ||
              "";
          c && (e.项目类型 = se("项目类型", c));
        }
        return;
      }
      if (!ue.includes(r)) return;
      const d = n.querySelector(".el-form-item__content");
      if (!d) return;
      const i =
          d.querySelector("input.el-input__inner") ||
          d.querySelector("input[type='text']") ||
          d.querySelector(".el-input-number input"),
        h = d.querySelector("textarea"),
        E =
          ((i == null ? void 0 : i.value) != null && String(i.value).trim()) ||
          ((h == null ? void 0 : h.value) != null && String(h.value).trim()) ||
          "";
      E && (e[r] = se(r, E));
    });
  const _t = Array.from(document.querySelectorAll("*")),
    _p = _t.filter((n) => {
      var s, r;
      return (
        ((s = n.textContent) == null ? void 0 : s.trim()) === "建档分配" ||
        (n.childNodes.length <= 2 &&
          ((r = n.textContent) == null ? void 0 : r.replace(/\s+/g, "")) ===
            "建档分配")
      );
    });
  if (_p.length === 0) {
    const _o = _t.filter((n) => {
      var s;
      const r =
        ((s = n.textContent) == null ? void 0 : s.replace(/\s+/g, "")) || "";
      return r.includes("建档分配") && r.length < 50;
    });
    _p.push(..._o);
  }
  for (const n of _p) {
    const _w =
        n.closest(
          "li, [class*='item'], [class*='step'], [class*='progress'], [class*='timeline']",
        ) || n.parentElement,
      _C =
        _w && (s = _w.textContent) != null && s.includes("建档分配")
          ? _w
          : n.parentElement;
    if (!_C) continue;
    const _S = n.nextElementSibling;
    if (_S) {
      const _k = (
        ((_s = _S.textContent) == null ? void 0 : _s.trim()) || ""
      ).match(/\d{4}-\d{2}-\d{2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/);
      if (_k) {
        e.接案时间 = _k[0];
        break;
      }
    }
    for (const _m of Array.from(_C.children)) {
      const _x = (
        ((_f = _m.textContent) == null ? void 0 : _f.trim()) || ""
      ).match(/^(\d{4}-\d{2}-\d{2})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/);
      if (_x) {
        e.接案时间 = _x[1];
        break;
      }
    }
    if (e.接案时间) break;
    const _l = (_C.textContent || "").match(
      /(\d{4}-\d{2}-\d{2})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/,
    );
    if (_l) {
      e.接案时间 = _l[1];
      break;
    }
  }
  const _3t = Array.from(document.querySelectorAll("*")),
    _3p = _3t.filter((n) => {
      var s, r;
      return (
        ((s = n.textContent) == null ? void 0 : s.trim()) === "三图确认" ||
        (n.childNodes.length <= 2 &&
          ((r = n.textContent) == null ? void 0 : r.replace(/\s+/g, "")) ===
            "三图确认")
      );
    });
  if (_3p.length === 0) {
    const _3o = _3t.filter((n) => {
      var s;
      const r =
        ((s = n.textContent) == null ? void 0 : s.replace(/\s+/g, "")) || "";
      return r.includes("三图确认") && r.length < 50;
    });
    _3p.push(..._3o);
  }
  for (const n of _3p) {
    const _3w =
        n.closest(
          "li, [class*='item'], [class*='step'], [class*='progress'], [class*='timeline']",
        ) || n.parentElement,
      _3C =
        _3w && (s = _3w.textContent) != null && s.includes("三图确认")
          ? _3w
          : n.parentElement;
    if (!_3C) continue;
    const _3S = n.nextElementSibling;
    if (_3S) {
      const _3k = (
        ((_s = _3S.textContent) == null ? void 0 : _s.trim()) || ""
      ).match(/(\d{4}-\d{1,2}-\d{1,2})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/);
      if (_3k) {
        e.完成时间 = se("完成时间", _3k[0] || _3k[1] || "");
        break;
      }
    }
    for (const _3m of Array.from(_3C.children)) {
      const _3x = (
        ((_f = _3m.textContent) == null ? void 0 : _f.trim()) || ""
      ).match(/^(\d{4}-\d{1,2}-\d{1,2})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/);
      if (_3x) {
        e.完成时间 = se("完成时间", _3x[1] || _3x[0] || "");
        break;
      }
    }
    if (e.完成时间) break;
    const _3l = (_3C.textContent || "").match(
      /(\d{4}-\d{1,2}-\d{1,2})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?/,
    );
    if (_3l) {
      e.完成时间 = se("完成时间", _3l[1] || _3l[0] || "");
      break;
    }
  }
  ue.forEach((n) => {
    var s;
    if (e[n]) return;
    const r = Array.from(document.querySelectorAll("*")),
      d = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const i of r) {
      const h = (i.textContent || "").trim(),
        E = (h.split(/[：:]/)[0] || "").replace(/\s+/g, "").trim();
      if (E !== n && !(n === "项目类型" && E === "合同类型")) continue;
      if (!new RegExp(`^${d}[：:：\\s]*`, "i").test(h)) {
        const c = new RegExp(`${d}[：:：\\s]+(.+)$`, "i"),
          g = h.match(c);
        if (g && g[1]) {
          const _ = ne(g[1]);
          if (!Pe(_, n)) {
            e[n] = se(n, _);
            break;
          }
          break;
        }
        continue;
      }
      let y = "";
      const x = h.match(new RegExp(`${d}[：:：\\s]+(.+)$`, "i"));
      if ((x && x[1] && (y = ne(x[1])), !y)) {
        const c = i.closest(".el-descriptions-item__label");
        if (c) {
          const g = c.closest(".el-descriptions-item"),
            _ =
              g == null
                ? void 0
                : g.querySelector(".el-descriptions-item__content"),
            N = k((_ == null ? void 0 : _.textContent) || "");
          N && (y = N);
        }
      }
      if (!y) {
        const c = i.closest(".el-form-item");
        if (c) {
          const g = c.querySelector(".el-form-item__content"),
            _ =
              (g == null
                ? void 0
                : g.querySelector(
                    "input.el-input__inner, input[type='text'], input:not([type])",
                  )) || null,
            N = (g == null ? void 0 : g.querySelector("textarea")) || null,
            T =
              ((_ == null ? void 0 : _.value) && k(_.value)) ||
              ((N == null ? void 0 : N.value) && k(N.value)) ||
              k((g == null ? void 0 : g.textContent) || "");
          T && (y = ne(T));
        }
      }
      if (!y && i.tagName === "DT") {
        const c = i.nextElementSibling;
        c && c.tagName === "DD" && (y = k(c.textContent || ""));
      }
      if (!y && i.nextElementSibling) {
        const c = k(i.nextElementSibling.textContent || "");
        c && (y = ne(c));
      }
      if (!y && (s = i.parentElement) != null && s.nextElementSibling) {
        const c = k(i.parentElement.nextElementSibling.textContent || "");
        c && (y = ne(c));
      }
      if (!y && i.parentElement) {
        const c = i.parentElement;
        if (c.tagName === "TD" || c.tagName === "TH") {
          const g = c.nextElementSibling;
          if (g) {
            const _ = k(g.textContent || "");
            _ && (y = ne(_));
          }
        }
      }
      if (!y && i.parentElement) {
        const c = Array.from(i.parentElement.children),
          g = c.indexOf(i);
        if (g >= 0 && g < c.length - 1) {
          const _ = c[g + 1],
            N = k(_.textContent || "");
          N && N !== k(h) && (y = ne(N));
        }
      }
      if (y) {
        const c = k(ne(y));
        Pe(c, n) || (e[n] = se(n, c));
        break;
      }
    }
  });
  const a = (e.完整地址 || "").trim(),
    u =
      /[省市区县路街号巷村乡镇道]/.test(a) ||
      (a.length >= 12 && !/待办|执行人|请输入|请选择/.test(a));
  (function () {
    const r = parseFloat(String(e.预估流水 || "").replace(/[^\d.]/g, "")),
      n = parseFloat(String(e.外卖占比 || "").replace(/[^\d.]/g, ""));
    if (!Number.isNaN(r) && !Number.isNaN(n)) {
      let l = n;
      (l > 100 && l < 1e4 && (l /= 100),
        (e.外卖流水 = String(Math.round((r * l) / 100))));
    } else e.外卖流水 = "";
  })();
  e.状态 = computeStatus();
  return ((!a || !u) && (e.完整地址 = "需要自己填写"), e);
}
chrome.runtime.onMessage.addListener((e, o, l) => {
  try {
    if (!G()) return !1;
  } catch {
    return !1;
  }
  try {
    if ((e == null ? void 0 : e.type) === "COLLECT_RESOURCES")
      return (
        (async () => {
          var t, a;
          ((Me = !0),
            Be(),
            setTimeout(() => {
              Me = !1;
            }, 1e4));
          const u =
            e != null && e.fileSectionLabels
              ? { fileSectionLabelsOnly: e.fileSectionLabels }
              : void 0;
          if (
            (t = u == null ? void 0 : u.fileSectionLabelsOnly) != null &&
            t.includes("效果图") &&
            (a = u == null ? void 0 : u.fileSectionLabelsOnly) != null &&
            a.includes("施工图") &&
            document.querySelector(".fx-form-data-widget") &&
            document.querySelector(".x-tab")
          ) {
            const s = Array.from(
              document.querySelectorAll(".tab-header-item"),
            ).find((r) => (r.textContent || "").includes("上匠相关"));
            s &&
              !s.classList.contains("tab-header-active") &&
              (s.click(), await new Promise((r) => setTimeout(r, 700)));
          }
          const n = await Ue(u);
          try {
            typeof n == "object" && "downloadClicks" in n
              ? l({
                  resources: n.resources,
                  downloadClicks: n.downloadClicks,
                  siteDownloadStats: n.siteDownloadStats,
                })
              : l({ resources: n });
          } catch {}
        })(),
        !0
      );
    if ((e == null ? void 0 : e.type) === "EXTRACT_FIELDS")
      return (
        (async () => {
          await Ve();
          const t = Ye();
          try {
            l({ ok: !0, fields: t });
          } catch {}
        })(),
        !0
      );
    if ((e == null ? void 0 : e.type) === "FILL_FORM") {
      const t = (e == null ? void 0 : e.fields) || {},
        a = !!(e != null && e.submitAfter);
      return (
        tt(t, a).then((u) => {
          try {
            l(u);
          } catch {}
        }),
        !0
      );
    } else if ((e == null ? void 0 : e.type) === "TOGGLE_OVERLAY") {
      var _t = Date.now();
      if (_t - (window.__lastOverlayToggle || 0) >= 350) {
        window.__lastOverlayToggle = _t;
        Je();
      }
    } else if (
      (e == null ? void 0 : e.type) === "THREE_ACTUAL_DOWNLOAD_COUNT"
    ) {
      const t = e == null ? void 0 : e.count;
      typeof t == "number" &&
        (L == null ||
          L(
            t >= 4
              ? `已下载 ${t} 个文件，下载成功。`
              : `已下载 ${t} 个文件到「三图资料」文件夹。`,
          ));
    } else if ((e == null ? void 0 : e.type) === "SITE_ACTUAL_DOWNLOAD_STATS") {
      const t = e == null ? void 0 : e.stats;
      t && typeof t == "object" && (L == null || L(formatSiteDownloadSummary(t)));
    }
    return !1;
  } catch {
    return !1;
  }
});
const Ze = "__img_file_extractor_overlay__";
let Te = !1,
  U = null,
  ye = null,
  je = 0,
  Z = null,
  xe = null,
  he = null,
  I = null,
  oe = null,
  W = null,
  J = null,
  qe = null,
  syncBtn = null,
  openFormBtn = null;
const Ee = "seq_rule_mode";
let K = "month",
  ve = null;
function Se() {
  const e = new Date();
  return `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}`;
}
function Ce(e) {
  const o = e.trim(),
    l = o.match(/^(\d{4})-(\d{1,2})$/);
  return l ? `${l[1]}-${String(parseInt(l[2], 10)).padStart(2, "0")}` : o;
}
function MeStoreEntry(e, o) {
  const l = de(e),
    t = o || {};
  if (!l) return null;
  if (Object.prototype.hasOwnProperty.call(t, l)) return [l, t[l]];
  return (
    Object.entries(t).find(
      ([a]) => a.includes("|") && a.slice(0, a.indexOf("|")) === l,
    ) || null
  );
}
const ke = "copy_default_files_on_extract";
let Re = !1;
function Oe(e) {
  var o;
  if (
    !G() ||
    !((o = chrome == null ? void 0 : chrome.storage) != null && o.local)
  )
    return void (e == null ? void 0 : e());
  try {
    chrome.storage.local.get(
      ["store_code_to_seq", "store_code_to_month"],
      (l) => {
        try {
          if (!G()) return;
          ((J = (l == null ? void 0 : l.store_code_to_seq) || {}),
            (qe = (l == null ? void 0 : l.store_code_to_month) || {}),
            e == null || e());
        } catch {
          e == null || e();
        }
      },
    );
  } catch {
    e == null || e();
  }
}
function Ie(e, o, l = K) {
  let t = Object.entries(e);
  if (l === "month" && o && Object.keys(o).length > 0) {
    const s = Se();
    t = t.filter(([r]) => Ce(o[r] || "") === s);
  }
  const a = t
      .map(([, s]) => parseInt(String(s).trim(), 10))
      .filter((s) => !isNaN(s) && s > 0),
    u = a.length ? Math.max(...a) : 0,
    n = l === "month" ? 2 : 3;
  return String(u + 1).padStart(n, "0");
}
function He(e) {
  if (!/^\d+$/.test(String(e || "").trim())) return (e || "").trim();
  const o = parseInt(String(e).trim(), 10);
  return K === "month"
    ? String(o).padStart(2, "0")
    : String(o).padStart(3, "0");
}
function Ge() {
  var e;
  if ((U && document.body.contains(U)) || !document.body) return;
  ((U = document.createElement("div")),
    (U.id = Ze),
    (U.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "display:none",
      "align-items:center",
      "justify-content:center",
      "background:rgba(0,0,0,0.35)",
      "backdrop-filter:saturate(180%) blur(6px)",
    ].join(";")),
    U.addEventListener("mousedown", (v) => {
      v.target === U
        ? (ye = { x: v.clientX, y: v.clientY, t: Date.now() })
        : (ye = null);
    }),
    (Z = document.createElement("div")),
    (Z.style.cssText = [
      "width:min(420px, calc(100vw - 24px))",
      "max-height:min(800px, 85vh)",
      "min-height:420px",
      "height:min(720px,82vh)",
      "background:#fff",
      "border-radius:12px",
      "box-shadow:0 24px 64px rgba(0,0,0,0.2)",
      "padding:16px",
      "font-family:system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      "overflow:hidden",
      "display:flex",
      "flex-direction:column",
      "transition:box-shadow 0.2s",
    ].join(";")),
    Z.addEventListener("mousedown", () => {
      je = Date.now();
    }));
  const o = document.createElement("div");
  o.style.cssText =
    "display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;flex-shrink:0;";
  const l = document.createElement("div");
  ((l.textContent = "MK-tool"),
    (l.style.cssText = "font-size:16px;font-weight:700;color:#111827;"));
  const t = document.createElement("button");
  ((t.type = "button"),
    (t.textContent = "×"),
    t.setAttribute("aria-label", "关闭"),
    (t.style.cssText =
      "width:32px;height:32px;border:none;border-radius:8px;background:#f3f4f6;color:#111827;font-size:20px;cursor:pointer;line-height:32px;transition:background 0.15s;"),
    t.addEventListener("mouseenter", () => {
      t.style.background = "#e5e7eb";
    }),
    t.addEventListener("mouseleave", () => {
      t.style.background = "#f3f4f6";
    }),
    t.addEventListener("click", () => we()),
    o.appendChild(l),
    o.appendChild(t));
  const a = document.createElement("div");
  ((a.style.cssText =
    "font-size:12px;color:#6b7280;line-height:1.4;margin-bottom:12px;flex-shrink:0;"),
    (a.innerHTML =
      "MK-tool：一键提取图片/文件、三图资料下载、提取字段、钉钉表单同步"));
  const u = document.createElement("div");
  u.style.cssText =
    "display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;flex-shrink:0;";
  const n = document.createElement("label");
  ((n.textContent = "序号"),
    (n.style.cssText =
      "font-size:13px;font-weight:600;color:#374151;white-space:nowrap;"),
    (I = document.createElement("input")),
    (I.type = "text"),
    (I.value = K === "month" ? "01" : "001"),
    (I.placeholder = K === "month" ? "01（按月）" : "001（按门店数）"),
    (I.style.cssText =
      "flex:1;min-width:120px;height:32px;box-sizing:border-box;padding:6px 10px;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;"),
    (I.autocomplete = "off"),
    u.appendChild(n),
    u.appendChild(I));
  const s = document.createElement("button");
  ((s.type = "button"),
    (s.title = "切换序号规则：按月(2位) / 按门店数(3位)"),
    (s.style.cssText =
      "padding:6px 10px;min-width:64px;height:32px;box-sizing:border-box;font-size:12px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;color:#6b7280;cursor:pointer;white-space:nowrap;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background 0.15s, border-color 0.15s;"),
    s.addEventListener("mouseenter", () => {
      ((s.style.background = "#f3f4f6"), (s.style.borderColor = "#9e9e9e"));
    }),
    s.addEventListener("mouseleave", () => {
      ((s.style.background = "#f9fafb"), (s.style.borderColor = "#d1d5db"));
    }),
    (ve = () => {
      var v;
      if (((s.textContent = K === "month" ? "按月" : "按门店"), I)) {
        I.placeholder = K === "month" ? "01（按月）" : "001（按门店数）";
        const P = (v = I.value) == null ? void 0 : v.trim();
        P && /^\d+$/.test(P) && (I.value = He(P));
      }
    }),
    s.addEventListener("click", () => {
      var v;
      K = K === "month" ? "store" : "month";
      try {
        G() &&
          (v = chrome == null ? void 0 : chrome.storage) != null &&
          v.local &&
          chrome.storage.local.set({ [Ee]: K }, () => {});
      } catch {}
      (ve(),
        Oe(() => {
          if (I && W != null && (W.门店编码 || "").trim()) {
            const P = de((W.门店编码 || "").trim()),
              $ = MeStoreEntry(P, J || {}),
              z = $ ? String($[1]).trim() : null;
            I.value = z ? He(z) : Ie(J || {}, qe);
          }
        }));
    }),
    ve(),
    u.appendChild(s));
  const r = document.createElement("div");
  r.style.cssText = "display:flex;flex-direction:column;gap:8px;flex-shrink:0;";
  const d = (v, P) => {
      const $ = document.createElement("button");
      return (
        ($.type = "button"),
        ($.textContent = v),
        ($.style.cssText = [
          "width:100%",
          "padding:10px 12px",
          "border-radius:10px",
          "border:none",
          `background:${P}`,
          "color:#fff",
          "font-weight:700",
          "cursor:pointer",
          "transition:transform 0.12s, box-shadow 0.12s, opacity 0.12s",
        ].join(";")),
        $.addEventListener("mouseenter", () => {
          (($.style.transform = "translateY(-1px)"),
            ($.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"));
        }),
        $.addEventListener("mouseleave", () => {
          (($.style.transform = ""), ($.style.boxShadow = ""));
        }),
        $
      );
    },
    i = d("一键提取并下载", "#483D8B"),
    h = d("三图资料下载", "linear-gradient(135deg,#dc2626,#b91c1c)");
  (i.addEventListener("click", () => Fe("START_EXTRACT")),
    h.addEventListener("click", () => Fe("START_EXTRACT_THREE")),
    r.appendChild(i),
    r.appendChild(h),
    (xe = document.createElement("div")),
    (xe.style.cssText =
      "margin-top:10px;font-size:12px;color:#111827;min-height:16px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-shrink:0;"),
    (he = document.createElement("div")),
    (he.style.cssText = "flex:1;min-height:16px;white-space:pre-line;line-height:1.5;"));
  const E = document.createElement("div");
  E.style.cssText = "flex:0 0 auto;display:flex;align-items:center;gap:8px;";
  const w = document.createElement("span");
  ((w.textContent = "配置默认文件"),
    (w.style.cssText = "font-size:12px;color:#374151;white-space:nowrap;"));
  const y = document.createElement("div");
  (y.setAttribute("role", "button"),
    y.setAttribute("tabindex", "0"),
    (y.style.cssText =
      "width:40px;height:22px;border-radius:11px;background:#d1d5db;cursor:pointer;position:relative;transition:background 0.2s;flex-shrink:0;"));
  const x = document.createElement("div");
  ((x.style.cssText =
    "width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.25);position:absolute;top:2px;left:2px;transition:transform 0.2s;"),
    y.appendChild(x));
  const c = (v) => {
      ((Re = v),
        (y.style.background = v ? "#059669" : "#d1d5db"),
        (x.style.transform = v ? "translateX(18px)" : "translateX(0)"));
    },
    g = () => {
      var v;
      const P = !Re;
      c(P);
      try {
        G() &&
          (v = chrome == null ? void 0 : chrome.storage) != null &&
          v.local &&
          chrome.storage.local.set({ [ke]: P }, () => {});
      } catch {}
    };
  (y.addEventListener("click", g),
    y.addEventListener("keydown", (v) => {
      (v.key === "Enter" || v.key === " ") && (v.preventDefault(), g());
    }),
    c(!1));
  try {
    G() &&
      (e = chrome == null ? void 0 : chrome.storage) != null &&
      e.local &&
      chrome.storage.local.get([ke], (v) => {
        try {
          c(!!(v != null && v[ke]));
        } catch {}
      });
  } catch {}
  const createOverlayIconButton = (v, P, $) => {
      const z = document.createElement("button"),
        Q = document.createElement("span");
      return (
        (z.type = "button"),
        (z.title = v),
        z.setAttribute("aria-label", v),
        (z.style.cssText = P),
        (Q.style.cssText =
          "display:flex;align-items:center;justify-content:center;width:22px;height:22px;transform-origin:center;transition:transform 0.2s ease;"),
        (Q.innerHTML = $),
        z.appendChild(Q),
        (z._iconWrap = Q),
        z
      );
    },
    attachPressRotate = (v, P = 45) => {
      const $ = () => {
          const z = v._iconWrap;
          z && (z.style.transform = `rotate(${P}deg) scale(1.08)`);
        },
        z = () => {
          const Q = v._iconWrap;
          Q && (Q.style.transform = "rotate(0deg) scale(1)");
        },
        Q = () => {
          const ee = v._iconWrap;
          ee && (ee.style.transform = `rotate(${P}deg) scale(1.16)`);
        },
        ee = (u) => {
          (u.key === "Enter" || u.key === " ") && Q();
        },
        u = (n) => {
          (n.key === "Enter" || n.key === " ") && $();
        };
      (v.addEventListener("pointerenter", $),
        v.addEventListener("pointerleave", z),
        v.addEventListener("pointerdown", Q),
        v.addEventListener("pointerup", $),
        v.addEventListener("pointercancel", z),
        v.addEventListener("blur", z),
        v.addEventListener("keydown", ee),
        v.addEventListener("keyup", u));
    };
  ((syncBtn = createOverlayIconButton(
    "同步表单",
    "flex:0 0 auto;width:44px;height:44px;padding:0;border-radius:999px;border:none;background:transparent;color:#2563eb;cursor:pointer;display:none;align-items:center;justify-content:center;transition:transform 0.18s ease,color 0.16s ease;touch-action:manipulation;",
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;"><circle cx="10" cy="10" r="5.8"></circle></svg>',
  )),
    syncBtn.addEventListener("pointerenter", () => {
      ((syncBtn.style.transform = "scale(1.14)"),
        (syncBtn.style.background = "transparent"),
        (syncBtn.style.boxShadow = "none"),
        (syncBtn.style.color = "#1d4ed8"));
    }),
    syncBtn.addEventListener("pointerleave", () => {
      ((syncBtn.style.transform = "scale(1)"),
        (syncBtn.style.background = "transparent"),
        (syncBtn.style.boxShadow = "none"),
        (syncBtn.style.color = "#2563eb"));
    }),
    syncBtn.addEventListener("pointerdown", () => {
      ((syncBtn.style.transform = "scale(1.24)"),
        (syncBtn.style.background = "transparent"),
        (syncBtn.style.boxShadow = "none"),
        (syncBtn.style.color = "#1e40af"));
    }),
    syncBtn.addEventListener("pointerup", () => {
      ((syncBtn.style.transform = "scale(1.14)"),
        (syncBtn.style.background = "transparent"),
        (syncBtn.style.boxShadow = "none"),
        (syncBtn.style.color = "#1d4ed8"));
    }),
    syncBtn.addEventListener("pointercancel", () => {
      ((syncBtn.style.transform = "scale(1)"),
        (syncBtn.style.background = "transparent"),
        (syncBtn.style.boxShadow = "none"),
        (syncBtn.style.color = "#2563eb"));
    }),
    syncBtn.addEventListener("blur", () => {
      ((syncBtn.style.transform = "scale(1)"),
        (syncBtn.style.background = "transparent"),
        (syncBtn.style.boxShadow = "none"),
        (syncBtn.style.color = "#2563eb"));
    }),
    syncBtn.addEventListener("click", () => {
      if (!W || !Object.values(W).some((v) => v)) {
        L("字段信息未就绪，请稍候或刷新页面后重试。", "error");
        return;
      }
      if (!G()) {
        L("扩展已重新加载，请刷新页面后重试。", "error");
        return;
      }
      (L("正在打开表单并同步字段…"),
        Y(!0),
        $e({ type: "SYNC_FORM", fields: W }, (u) => {
          Y(!1);
          if (chrome.runtime.lastError) {
            L("同步失败，请重试或查看后台日志。", "error");
            return;
          }
          if (!u || !u.ok) {
            L(
              (u == null ? void 0 : u.error) ||
                "同步失败，请确认已在设置页填写表单地址。",
              "error",
            );
            return;
          }
          const n = u.filledCount ?? 0,
            t = u.submitted
              ? " 已自动尝试提交表单，如有必填未匹配请手动检查。"
              : " 请检查表单内容后手动提交。";
          L(`已在表单中填充 ${n} 个字段。${t}`);
        }));
    }),
    (openFormBtn = createOverlayIconButton(
      "打开表单",
      "flex:0 0 auto;width:44px;height:44px;padding:0;border-radius:999px;border:none;background:transparent;color:#2563eb;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:transform 0.18s ease,color 0.16s ease;touch-action:manipulation;",
      '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;"><path d="M5 5l10 10"></path><path d="M15 5L5 15"></path></svg>',
    )),
    openFormBtn.addEventListener("pointerenter", () => {
      ((openFormBtn.style.background = "transparent"),
        (openFormBtn.style.boxShadow = "none"),
        (openFormBtn.style.color = "#1d4ed8"));
    }),
    openFormBtn.addEventListener("pointerleave", () => {
      ((openFormBtn.style.background = "transparent"),
        (openFormBtn.style.boxShadow = "none"),
        (openFormBtn.style.color = "#2563eb"));
    }),
    openFormBtn.addEventListener("pointerdown", () => {
      ((openFormBtn.style.background = "transparent"),
        (openFormBtn.style.boxShadow = "none"),
        (openFormBtn.style.color = "#1e40af"));
    }),
    openFormBtn.addEventListener("pointerup", () => {
      ((openFormBtn.style.background = "transparent"),
        (openFormBtn.style.boxShadow = "none"),
        (openFormBtn.style.color = "#1d4ed8"));
    }),
    openFormBtn.addEventListener("pointercancel", () => {
      ((openFormBtn.style.background = "transparent"),
        (openFormBtn.style.boxShadow = "none"),
        (openFormBtn.style.color = "#2563eb"));
    }),
    openFormBtn.addEventListener("blur", () => {
      ((openFormBtn.style.background = "transparent"),
        (openFormBtn.style.boxShadow = "none"),
        (openFormBtn.style.color = "#2563eb"));
    }),
    attachPressRotate(openFormBtn),
    openFormBtn.addEventListener("click", () => {
      $e({ type: "OPEN_FORM_TAB" }, (u) => {
        (u && u.ok) ||
          L(
            (u == null ? void 0 : u.error) || "请先在设置页填写钉钉表格地址。",
            "error",
          );
      });
    }));
  (E.appendChild(w),
    E.appendChild(y),
    xe.appendChild(he),
    xe.appendChild(E),
    (oe = document.createElement("div")),
    (oe.style.cssText =
      "margin-top:10px;padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow-y:scroll;overflow-x:hidden;font-size:12px;display:none;flex-shrink:0;flex:1;min-height:0;max-height:520px;"));
  const _ = document.createElement("div");
  _.style.cssText =
    "margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0;";
  const N = document.createElement("button");
  ((N.type = "button"),
    (N.textContent = "设置"),
    (N.title = "打开浏览器扩展设置"),
    (N.style.cssText =
      "padding:6px 10px;font-size:12px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;cursor:pointer;transition:background 0.15s, border-color 0.15s;"),
    N.addEventListener("mouseenter", () => {
      ((N.style.background = "#f9fafb"), (N.style.borderColor = "#d1d5db"));
    }),
    N.addEventListener("mouseleave", () => {
      ((N.style.background = "#fff"), (N.style.borderColor = "#e5e7eb"));
    }),
    N.addEventListener("click", () => {
      if (!G()) {
        L == null || L("扩展已重新加载，请刷新页面后重试。", "error");
        return;
      }
      try {
        chrome.runtime.sendMessage({ type: "OPEN_OPTIONS_PAGE" });
      } catch {
        L == null || L("扩展调用失败，请刷新页面后重试。", "error");
      }
    }));
  const btnWrap = document.createElement("div");
  btnWrap.style.cssText =
    "display:flex;flex-direction:row;gap:3px;align-items:center;flex:0 0 auto;";
  (btnWrap.appendChild(syncBtn), btnWrap.appendChild(openFormBtn));
  (_.appendChild(N),
    _.appendChild(btnWrap),
    Z.appendChild(o),
    Z.appendChild(a),
    Z.appendChild(u),
    Z.appendChild(r),
    Z.appendChild(xe),
    Z.appendChild(oe),
    Z.appendChild(_),
    U.addEventListener("click", (v) => {
      var P, $, z;
      if (v.target !== U) return;
      const Q = (P = window.getSelection) == null ? void 0 : P.call(window);
      if (
        (z =
          ($ = Q == null ? void 0 : Q.toString) == null ? void 0 : $.call(Q)) !=
          null &&
        z.trim()
      ) {
        ye = null;
        return;
      }
      const V = ye;
      if (((ye = null), V)) {
        const le = v.clientX - V.x,
          fe = v.clientY - V.y,
          re = Date.now() - V.t;
        if (le * le + fe * fe > 64 || re > 300) return;
      } else if (Date.now() - je < 1e3) return;
      we();
    }),
    U.appendChild(Z),
    document.body.appendChild(U),
    window.addEventListener("keydown", (v) => {
      Te && v.key === "Escape" && we();
    }));
}
function Ke() {
  var e;
  if ((Ge(), !!U)) {
    ((Te = !0), (U.style.display = "flex"));
    const o = () => {
      Qe();
    };
    try {
      if (
        G() &&
        (e = chrome == null ? void 0 : chrome.storage) != null &&
        e.local
      ) {
        chrome.storage.local.get([Ee], (l) => {
          try {
            const t = l == null ? void 0 : l[Ee];
            ((t === "month" || t === "store") && (K = t), ve == null || ve());
          } catch {}
          o();
        });
        return;
      }
    } catch {}
    o();
  }
}
function we() {
  U && ((Te = !1), (U.style.display = "none"));
}
function Je() {
  Te ? we() : Ke();
}
function L(e, o = "normal") {
  he &&
    ((he.textContent = e),
    (he.style.color = o === "error" ? "#b91c1c" : "#111827"));
}
function formatSiteDownloadSummary(e) {
  const o = (e && typeof e == "object" ? e : {}) || {},
    l = Math.max(0, Number(o.cadFiles) || 0),
    t = Math.max(0, Number(o.internalVideos) || 0),
    a = Math.max(0, Number(o.siteImages) || 0);
  return `CAD源文件已下载${l}个文件\n内部视频已下载${t}个文件\n现场图片已下载${a}个文件`;
}
function be(e) {
  var o;
  if (!oe) return;
  const l = !e || !(e.门店编码 || "").trim();
  if (
    ((W = l ? null : e),
    syncBtn && (syncBtn.style.display = l ? "none" : "inline-flex"),
    l)
  ) {
    ((oe.style.display = "block"),
      (oe.innerHTML = ""),
      ue.forEach((t, a) => {
        const u = document.createElement("div");
        u.style.cssText =
          a === 0
            ? "padding:8px 0;padding-top:0;border-top:none;"
            : "padding:8px 0;border-top:1px solid #e5e7eb;";
        const n = document.createElement("div");
        ((n.textContent = `${t}：`),
          (n.style.cssText =
            "font-weight:700;color:#4b5563;margin-bottom:4px;font-size:12px;"));
        const s = document.createElement("div");
        ((s.textContent = "未找到"),
          (s.style.cssText =
            "color:#9e9e9e;word-break:break-word;line-height:1.5;"),
          u.appendChild(n),
          u.appendChild(s),
          oe.appendChild(u));
      }));
    return;
  }
  if (I && e) {
    const t = de((e.门店编码 || "").trim()),
      a = de(e.上匠门店简称 || ""),
      u = () => {
        if (!t || !I) return;
        const d = MeStoreEntry(t, J || {}),
          i = d ? String(d[1]).trim() : null;
        i
          ? (I.value = /^\d+$/.test(i) ? He(i) : i)
          : (I.value = Ie(J || {}, qe));
      };
    (u(), t && !(J != null && J[t]) && Oe(u));
    const n = K === "month" ? "01" : "001",
      s = ((o = I.value) == null ? void 0 : o.trim()) || n,
      r = t || a ? `${s}--${t}${a}` : s;
    I.placeholder = r
      ? `如 ${n} → ${r}`
      : `${n}（与门店编码、上匠门店简称绑定）`;
  }
  (syncBtn && (syncBtn.style.display = "inline-flex"),
    (oe.style.display = "block"),
    (oe.innerHTML = ""),
    ue.forEach((t, a) => {
      const u = e[t],
        empty = isFieldEmpty(u),
        n = document.createElement("div");
      n.style.cssText =
        a === 0
          ? "padding:8px 0;padding-top:0;border-top:none;"
          : "padding:8px 0;border-top:1px solid #e5e7eb;";
      const s = document.createElement("div");
      ((s.textContent = `${t}：`),
        (s.style.cssText =
          "font-weight:700;color:#4b5563;margin-bottom:4px;font-size:12px;"));
      const r = document.createElement("div");
      ((r.textContent = empty ? "未找到" : u),
        (r.style.cssText = `color:${empty ? "#9e9e9e" : "#111827"};word-break:break-word;line-height:1.5;`),
        n.appendChild(s),
        n.appendChild(r),
        oe.appendChild(n));
    }));
}
function Y(e) {
  Z && (Z.style.opacity = e ? "0.94" : "1");
}
const _e = "store_code_to_short_name";
function De(e, o, l, t, a = K) {
  var u;
  if (
    !e ||
    !G() ||
    !((u = chrome == null ? void 0 : chrome.storage) != null && u.local)
  )
    return void (t == null ? void 0 : t());
  const n = de(e);
  try {
    chrome.storage.local.get(
      ["store_code_to_seq", _e, "store_code_to_month"],
      (s) => {
        const r = { ...((s == null ? void 0 : s.store_code_to_seq) || {}) },
          d = { ...((s == null ? void 0 : s[_e]) || {}) },
          i = { ...((s == null ? void 0 : s.store_code_to_month) || {}) },
          h = /^\d+$/.test(String(o).trim())
            ? a === "month"
              ? String(parseInt(o, 10)).padStart(2, "0")
              : String(parseInt(o, 10)).padStart(3, "0")
            : String(o).trim(),
          E = MeStoreEntry(n, r),
          w = E
            ? /^\d+$/.test(String(E[1]).trim())
              ? a === "month"
                ? String(parseInt(E[1], 10)).padStart(2, "0")
                : String(parseInt(E[1], 10)).padStart(3, "0")
              : String(E[1]).trim()
            : h;
        if (E) {
          try {
            chrome.storage.local.set({ folder_seq: w }, () => {
              try {
                ((J = r), (qe = i), t == null || t(w));
              } catch {
                t == null || t(w);
              }
            });
          } catch {
            t == null || t(w);
          }
          return;
        }
        ((r[n] = h), (i[n] = Se()), l != null && l.trim() && (d[n] = l.trim()));
        try {
          chrome.storage.local.set(
            {
              store_code_to_seq: r,
              [_e]: d,
              store_code_to_month: i,
              folder_seq: h,
            },
            () => {
              try {
                ((J = r), (qe = i), t == null || t(h));
              } catch {
                t == null || t(h);
              }
            },
          );
        } catch {
          t == null || t(h);
        }
      },
    );
  } catch {
    t == null || t();
  }
}
function Fe(e) {
  if (!G()) {
    L("扩展已重新加载，请刷新页面后重试。", "error");
    return;
  }
  const o = (t) => {
      const a = de(t);
      if (!a) {
        L("序号无效。", "error");
        return;
      }
      (L(
        e === "START_EXTRACT"
          ? "正在提取当前页面的图片和文件…"
          : "正在收集效果图和施工图资料…",
      ),
        Y(!0),
        $e(
          {
            type:
              e === "START_EXTRACT" ? "START_EXTRACT" : "START_EXTRACT_THREE",
            seq: a,
            copyDefaultFiles: e === "START_EXTRACT" ? Re : !1,
            fields: W || void 0,
          },
          (u) => {
            if (chrome.runtime.lastError) {
              (L("调用失败，请重试或查看后台日志。", "error"), Y(!1));
              return;
            }
            if (!u) {
              (L("无响应，请确认已在网页标签页中使用。", "error"), Y(!1));
              return;
            }
            if (!u.ok) {
              (L(u.error || "操作失败。", "error"), Y(!1));
              return;
            }
            const n =
              u.folderUsed || (e === "START_EXTRACT" ? "现场资料" : "三图资料");
            if (e === "START_EXTRACT") {
              u.total
                ? L("正在下载文件…")
                : L(`未在当前页面找到可下载文件。`);
              Y(!1);
              return;
            }
            (u.byClick && u.total
              ? L("")
              : u.total
                ? L(`已找到 ${u.total} 个文件，开始下载到「${n}」文件夹。`)
                : L("未在效果图或施工图区域找到可下载文件。"),
            Y(!1));
          },
        ));
    },
    l = (t, a) => {
      var u;
      try {
        if (
          !G() ||
          !((u = chrome == null ? void 0 : chrome.storage) != null && u.local)
        ) {
          L("扩展已重新加载，请刷新页面后重试。", "error");
          return;
        }
        chrome.storage.local.get(
          ["store_code_to_seq", "store_code_to_month", "folder_seq", Ee],
          (n) => {
            var s, r, d, i, h, E, w;
            const y = (n == null ? void 0 : n.store_code_to_seq) || {},
              x = (n == null ? void 0 : n.store_code_to_month) || {},
              c = (n == null ? void 0 : n[Ee]) === "store" ? "store" : "month",
              g = de(t),
              F = g ? MeStoreEntry(g, y) : null,
              _ = F ? String(F[1]).trim() : "",
              q = _ || null,
              N =
                (s = I == null ? void 0 : I.value) == null ? void 0 : s.trim(),
              T = parseInt(Ie(y, x, c), 10),
              v =
                parseInt(
                  String((n == null ? void 0 : n.folder_seq) || "").trim(),
                  10,
                ) || 0,
              P = c === "month" ? 2 : 3,
              $ = String(Math.max(T, v + 1)).padStart(P, "0"),
              z = N ? de(N) : "";
            if (z) {
              const f = Se(),
                m = parseInt(z, 10),
                C = g
                  ? (r = Object.entries(y).find(([b, M]) => {
                      if (b === g) return !1;
                      const A = parseInt(String(M).trim(), 10);
                      if (isNaN(m) || isNaN(A) || m !== A) return !1;
                      if (c === "store") return !0;
                      const B = (x[b] || "").trim();
                      return B ? Ce(B) === f : !1;
                    })) == null
                    ? void 0
                    : r[0]
                  : null;
              if (C) {
                L(
                  `序号 ${z} 已分配给当月门店 ${C}，请打开设置页调整后再操作。`,
                  "error",
                );
                try {
                  (i =
                    (d = chrome.runtime) == null
                      ? void 0
                      : d.openOptionsPage) == null || i.call(d);
                } catch {}
                return;
              }
              (I && (I.value = z), g ? De(g, z, a, (m) => o(m || z), c) : o(z));
              return;
            }
            if (q) {
              (I && (I.value = q), o(q));
              return;
            }
            !N && I && (I.value = $);
            const Q = N || window.prompt("请输入序号（将用于文件夹命名）", $);
            if (!Q || !de(Q)) {
              L("已取消：未输入有效序号。", "error");
              return;
            }
            const V = de(Q),
              le = parseInt(V, 10),
              fe = Se(),
              re = g
                ? (h = Object.entries(y).find(([f, m]) => {
                    if (f === g) return !1;
                    const C = parseInt(String(m).trim(), 10);
                    if (isNaN(le) || isNaN(C) || le !== C) return !1;
                    if (c === "store") return !0;
                    const b = (x[f] || "").trim();
                    return b ? Ce(b) === fe : !1;
                  })) == null
                  ? void 0
                  : h[0]
                : null;
            if (re) {
              L(
                `序号 ${V} 已分配给当月门店 ${re}，请打开设置页调整后再操作。`,
                "error",
              );
              try {
                (w =
                  (E = chrome.runtime) == null ? void 0 : E.openOptionsPage) ==
                  null || w.call(E);
              } catch {}
              return;
            }
            (I && !N && (I.value = V),
              g ? De(g, V, a, (m) => o(m || V), c) : o(V));
          },
        );
      } catch {
        L("扩展已重新加载，请刷新页面后重试。", "error");
      }
    };
  W != null && (W.门店编码 || "").trim()
    ? l((W.门店编码 || "").trim(), W.上匠门店简称)
    : (L("正在获取门店编码…"),
      $e({ type: "EXTRACT_FIELDS" }, (t) => {
        const a = t == null ? void 0 : t.fields;
        t != null && t.ok && a != null
          ? ((W = a), be(a))
          : ((W = null), be(null));
        const u = (a == null ? void 0 : a.门店编码) || "",
          n = a == null ? void 0 : a.上匠门店简称;
        u ? l(u, n) : l("", void 0);
      }));
}
function Qe() {
  if (!G()) {
    L("扩展已重新加载，请刷新页面后重试。", "error");
    return;
  }
  (W && typeof W == "object" && Object.values(W).some((o) => o)
    ? L("正在提取页面字段信息…")
    : (L("正在提取页面字段信息…"), Y(!0), be(null)),
    $e({ type: "EXTRACT_FIELDS" }, (o) => {
      var s, r;
      var l, t;
      if (chrome.runtime.lastError) {
        (L("调用失败，请重试或查看后台日志。", "error"), Y(!1));
        return;
      }
      if (!o) {
        (L("无响应，请确认已在网页标签页中使用。", "error"), Y(!1));
        return;
      }
      if (!o.ok || !o.fields) {
        ((W = null), be(null), L(o.error || "提取失败。", "error"), Y(!1));
        try {
          (r = (s = chrome.storage) == null ? void 0 : s.local) == null ||
            r.set({ extractedFields: null }, () => {});
        } catch {}
        return;
      }
      const a = o.fields,
        u = ue.filter((t) => !isFieldEmpty(a[t])).length,
        n = !(a.门店编码 || "").trim();
      (L(n ? "未找到字段信息。" : `已提取 ${u} 个字段信息。`), be(a), Y(!1));
      try {
        (t = (l = chrome.storage) == null ? void 0 : l.local) == null ||
          t.set({ extractedFields: a }, () => {});
      } catch {}
    }));
}
function de(e) {
  return k(e)
    .replace(/[\\/:*?"<>|]+/g, "")
    .trim();
}
function et(e, o = document) {
  var l;
  if (e.tagName === "LABEL") {
    const r = e.htmlFor;
    if (r) {
      const i = o.getElementById(r);
      if (i) return i;
    }
    const d = e.querySelector("input, textarea, select");
    if (d) return d;
  }
  const t = e.closest(".el-form-item");
  if (t) {
    const r = t.querySelector(".el-form-item__content") || t,
      d =
        r.querySelector("input.el-input__inner") ||
        r.querySelector("input[type='text']") ||
        r.querySelector("input:not([type])"),
      i = r.querySelector("textarea"),
      h = r.querySelector("select");
    return d || i || h;
  }
  const a = e.closest(".flat-form-editor-item, [class*='form-editor-item']"),
    u = e.closest(
      ".flat-form-editor-item, .fr-content, [class*='form-editor-item'], [class*='form-editor']",
    );
  if (u) {
    const r = a && u.contains(a) ? a : u,
      d = r.querySelector(
        '[contenteditable="true"]:not([contenteditable="false"])',
      );
    if (
      d &&
      !((l = d.closest) != null && l.call(d, "div.item-content.placeholder"))
    )
      return d;
    const i = new Set(r.querySelectorAll("input[placeholder*='搜索']")),
      h = r.querySelectorAll(
        "input:not([placeholder*='搜索']):not([type='radio']):not([type='checkbox']), textarea",
      ),
      E = Array.from(h).find((w) => !i.has(w));
    if (E) return E;
  }
  const n = e.parentElement,
    s = [];
  (e.nextElementSibling instanceof HTMLElement && s.push(e.nextElementSibling),
    e.previousElementSibling instanceof HTMLElement &&
      s.push(e.previousElementSibling),
    (n == null ? void 0 : n.nextElementSibling) instanceof HTMLElement &&
      s.push(n.nextElementSibling),
    (n == null ? void 0 : n.previousElementSibling) instanceof HTMLElement &&
      s.push(n.previousElementSibling));
  for (const r of s) {
    const d =
      (r instanceof HTMLInputElement ||
      r instanceof HTMLTextAreaElement ||
      r instanceof HTMLSelectElement
        ? r
        : null) || r.querySelector("input, textarea, select");
    if (d) return d;
  }
  return null;
}
async function tt(e, o) {
  if (!Object.entries(e).length)
    return { ok: !1, filledCount: 0, error: "没有可同步的字段。" };
  const l = [document];
  try {
    document.querySelectorAll("iframe").forEach((n) => {
      try {
        const s = n.contentDocument;
        s && s.body && l.push(s);
      } catch {}
    });
  } catch {}
  let t = 0,
    a = !1;
  const u = async () => {
    for (const n of l) {
      const s = await ot(n, e, o, new Set());
      if (((t += s.filledCount), s.submitted && (a = !0), t > 0)) return;
    }
  };
  return (
    await u(),
    t === 0 && (await new Promise((n) => setTimeout(n, 300)), await u()),
    t === 0
      ? {
          ok: !1,
          filledCount: 0,
          submitted: a,
          error: "未能匹配到可填写的表单字段，请检查表单结构。",
        }
      : { ok: !0, filledCount: t, submitted: a }
  );
}
function nt(e, o) {
  const l = Object.getOwnPropertyDescriptor(
    e instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype,
    "value",
  );
  (l != null && l.set ? l.set.call(e, o) : (e.value = o),
    e.dispatchEvent(new Event("input", { bubbles: !0 })),
    e.dispatchEvent(new Event("change", { bubbles: !0 })));
}
async function me(e, o, d = 4) {
  (e.focus(),
    nt(e, o),
    e.click(),
    await new Promise((l) => setTimeout(l, d)),
    e.dispatchEvent(new Event("blur", { bubbles: !0 })));
}
function ge(e, o) {
  if (e !== "预估流水" && e !== "外卖占比" && e !== "外卖流水") return o;
  const l = (o || "").replace(/%/g, "").replace(/\s/g, "").trim(),
    t = parseFloat(l);
  return Number.isNaN(t) || l === "" ? "0" : String(t);
}
const ae = [
    "链接",
    "门店编码",
    "上匠门店简称",
    "加盟商名称",
    "加盟商联系方式",
    "预估流水",
    "外卖占比",
    "外卖流水",
    "完整地址",
    "项目类型",
    "省份",
    "拓展顾问",
    "接案时间",
    "店宽",
    "装修面积",
    "完成时间",
    "状态",
  ],
  Le = {
    链接: "01",
    门店编码: "02",
    上匠门店简称: "03",
    加盟商名称: "04",
    加盟商联系方式: "05",
    预估流水: "06",
    外卖占比: "07",
    外卖流水: "071",
    完整地址: "08",
    项目类型: "09",
    省份: "10",
    拓展顾问: "11",
    接案时间: "12",
    店宽: "13",
    装修面积: "14",
    完成时间: "15",
    状态: "16",
  };
async function ot(e, o, l, t) {
  var a, u, n;
  const s = Object.entries(o).sort(([f], [m]) => {
    const C = Le[f] ?? "99",
      b = Le[m] ?? "99";
    return C.localeCompare(b);
  });
  let r = 0;
  const d = [],
    i = e,
    h = [],
    E = new Set(),
    w = (f) => {
      E.has(f) || (E.add(f), h.push(f));
    },
    y = new Set([
      "radio",
      "checkbox",
      "hidden",
      "submit",
      "button",
      "image",
      "reset",
    ]),
    x = (f) => {
      (f
        .querySelectorAll(
          'input[type="text"], input[type="url"], input[type="email"], input[type="tel"], input:not([type]), input[type="number"], textarea',
        )
        .forEach((m) => {
          var C;
          ((C = m.placeholder) != null && C.includes("搜索")) || w(m);
        }),
        f
          .querySelectorAll('[contenteditable="true"], [role="textbox"]')
          .forEach((m) => {
            var C;
            ((C = m.closest) != null &&
              C.call(m, "div.item-content.placeholder")) ||
              w(m);
          }),
        h.length === 0 &&
          f.querySelectorAll("input, textarea").forEach((m) => {
            var C;
            const b = m;
            (b.tagName === "INPUT" && y.has(b.type)) ||
              ((C = b.placeholder) != null && C.includes("搜索")) ||
              w(m);
          }),
        h.length === 0 &&
          f.querySelectorAll("input, textarea").forEach((m) => {
            const C = m;
            /请输入|请填写|请选择/i.test(C.placeholder || "") && w(m);
          }),
        f.querySelectorAll("*").forEach((m) => {
          m.shadowRoot && x(m.shadowRoot);
        }));
    };
  x(i);
  const c = ae.map((f) => {
    const m = k(o[f] || "");
    return ge(f, m);
  });
  let g = 0;
  const _ = (f) => {
      var m;
      if (!(f instanceof HTMLElement)) return !0;
      try {
        const C = (
          ((m = f.ownerDocument) == null ? void 0 : m.defaultView) || window
        ).getComputedStyle(f);
        if (
          C.display === "none" ||
          C.visibility === "hidden" ||
          C.opacity === "0"
        )
          return !1;
        const b = f.getBoundingClientRect();
        return b.width > 0 && b.height > 0;
      } catch {
        return !0;
      }
    },
    N = h.filter(_);
  let T = N.length > 0 ? N : h;
  T = [...T].sort((f, m) => {
    const C = f.getBoundingClientRect(),
      b = m.getBoundingClientRect(),
      M = C.top - b.top;
    return Math.abs(M) > 5 ? M : C.left - b.left;
  });
  const v = ae
      .map((f) => {
        const m = o[f] ? k(o[f]) : "",
          C = ge(f, m);
        return C
          ? `${f}：
${C}`
          : "";
      })
      .filter(Boolean).join(`

`),
    P = async () => {
      var f, m;
      const C = i.querySelectorAll('[data-id^="table-form-item-"]');
      if (C.length < 2) return 0;
      for (const b of C) {
        const M = b.querySelector(".fr-label-title"),
          A = (
            (M == null ? void 0 : M.getAttribute("title")) ||
            ((f = M == null ? void 0 : M.textContent) == null
              ? void 0
              : f.trim()) ||
            ""
          ).replace(/\s+/g, ""),
          B = b.querySelector(".fr-content");
        let p =
          B == null
            ? void 0
            : B.querySelector("textarea, input:not([type='hidden'])");
        if (!p) {
          const H =
            B == null
              ? void 0
              : B.querySelector(
                  '[contenteditable="true"]:not([contenteditable="false"])',
                );
          H &&
            !(
              (m = H.closest) != null &&
              m.call(H, "div.item-content.placeholder")
            ) &&
            (p = H);
        }
        if (!p || t.has(p)) continue;
        let j = "";
        if (A === "输入") j = v;
        else {
          const H = ae.find((ee) => {
            const S = ee.replace(/\s+/g, "");
            return (
              A === S ||
              A.endsWith(S) ||
              A.replace(/^\d+/, "") === S ||
              (A === "合同类型" && ee === "项目类型") ||
              (A === "合同类型" && ee === "项目类型")
            );
          });
          H && (j = c[ae.indexOf(H)] ?? ge(H, k(o[H] || "")));
        }
        j &&
          (p instanceof HTMLInputElement || p instanceof HTMLTextAreaElement
            ? await me(p, j, A === "输入" ? 0 : 4)
            : p.isContentEditable &&
              (p.focus(),
              (p.textContent = j),
              p.dispatchEvent(new Event("input", { bubbles: !0 })),
              p.click(),
              await new Promise((H) => setTimeout(H, A === "输入" ? 0 : 4)),
              p.dispatchEvent(new Event("blur", { bubbles: !0 }))),
          t.add(p),
          d.push({ control: p, expected: j, label: A || "全部字段" }));
      }
      return d.length;
    };
  if (T.length === 1) {
    if (v) {
      const f = T[0];
      (f instanceof HTMLInputElement || f instanceof HTMLTextAreaElement
        ? (await me(f, v),
          t.add(f),
          d.push({ control: f, expected: v, label: "全部字段" }))
        : f &&
          f.isContentEditable &&
          ((f.textContent = v),
          f.dispatchEvent(new Event("input", { bubbles: !0 })),
          f.dispatchEvent(new Event("change", { bubbles: !0 })),
          t.add(f),
          d.push({ control: f, expected: v, label: "全部字段" })),
        (g = 1));
    }
  } else {
    let f = await P();
    if (f === 0) {
      const m = T.length >= 7,
        C = m ? 6 : Math.min(T.length, c.length);
      for (let b = 0; b < C; b++) {
        const M = c[b],
          A = T[b];
        M &&
          (A instanceof HTMLInputElement || A instanceof HTMLTextAreaElement
            ? (await me(A, M),
              t.add(A),
              d.push({ control: A, expected: M, label: ae[b] }))
            : A &&
              A.isContentEditable &&
              ((A.textContent = M),
              A.dispatchEvent(new Event("input", { bubbles: !0 })),
              A.dispatchEvent(new Event("change", { bubbles: !0 })),
              t.add(A),
              d.push({ control: A, expected: M, label: ae[b] })));
      }
      if (m && v && T.length > 6) {
        const b = T[6];
        b instanceof HTMLInputElement || b instanceof HTMLTextAreaElement
          ? (await me(b, v),
            t.add(b),
            d.push({ control: b, expected: v, label: "全部字段" }))
          : b &&
            b.isContentEditable &&
            ((b.textContent = v),
            b.dispatchEvent(new Event("input", { bubbles: !0 })),
            b.dispatchEvent(new Event("change", { bubbles: !0 })),
            t.add(b),
            d.push({ control: b, expected: v, label: "全部字段" }));
      }
      g = d.length;
    } else g = f;
  }
  if ((g > 0 && (r = g), r === 0)) {
    const f = Array.from(e.querySelectorAll("*"));
    for (const [m, C] of s) {
      let b = k(C);
      if (m === "预估流水" || m === "外卖占比" || m === "外卖流水")
        b = ge(m, b);
      else if (!b) continue;
      const M = m.replace(/\s+/g, ""),
        A = M.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        B = new RegExp(A, "i");
      let p = null;
      const j = Le[m],
        H = [];
      for (const S of f) {
        const q = k(S.textContent || "")
          .replace(/[：:]/g, "")
          .replace(/\s+/g, "");
        if (!q || q.length > 80 || !B.test(q)) continue;
        let R = q.length;
        (j && q.includes(j) && (R -= 100),
          q.match(/\d{2}/) && (R -= 50),
          j && q.startsWith("请") && !q.includes(j) && (R += 500),
          H.push({ el: S, compact: q, score: R }));
      }
      H.sort((S, q) => S.score - q.score);
      for (const { el: S } of H) if (((p = et(S, i)), p && !t.has(p))) break;
      const ee = ze(M);
      if (!p) {
        const S = i.querySelector(
          `input[name*="${ee}"], textarea[name*="${ee}"], select[name*="${ee}"]`,
        );
        S && !t.has(S) && (p = S);
      }
      if (!p) {
        const S = i.querySelector(
          `input[placeholder*="${ee}"], textarea[placeholder*="${ee}"]`,
        );
        S && !t.has(S) && (p = S);
      }
      if (!p) {
        const S = i.querySelector(
          `[contenteditable="true"][data-placeholder*="${ee}"]`,
        );
        S && !t.has(S) && (p = S);
      }
      if (!p && m === "拓展顾问" && b) {
        let S = null;
        for (const { el: q } of H) {
          if (!((a = q.textContent) != null && a.includes("拓展顾问")))
            continue;
          const R =
              q.closest(
                ".flat-form-editor-item, .fr-content, [class*='form-editor']",
              ) || q.parentElement,
            F =
              R == null
                ? void 0
                : R.querySelector("div.item-content.placeholder");
          if (
            F &&
            k(F.textContent || "")
              .replace(/\s+/g, "")
              .includes("请选择人员")
          ) {
            S = F;
            break;
          }
        }
        if (
          (S ||
            (S =
              Array.from(
                i.querySelectorAll("div.item-content.placeholder"),
              ).find((q) =>
                k(q.textContent || "")
                  .replace(/\s+/g, "")
                  .includes("请选择人员"),
              ) || null),
          S && !t.has(S))
        ) {
          (S.click(), await new Promise((O) => setTimeout(O, 150)));
          const q = i.querySelector('input[placeholder="搜索人员"]');
          q &&
            (q.focus(),
            (q.value = b),
            q.dispatchEvent(new Event("keydown", { bubbles: !0 })),
            q.dispatchEvent(new Event("input", { bubbles: !0 })),
            q.dispatchEvent(new Event("keyup", { bubbles: !0 })),
            q.dispatchEvent(new Event("change", { bubbles: !0 })),
            await new Promise((O) => setTimeout(O, 180)));
          const R = b.toLowerCase(),
            F = [
              "[role='option']",
              ".option-text",
              "div.item-content:not(.placeholder)",
              "[class*='option']",
              "[class*='item-content']:not(.placeholder)",
            ];
          let D = [];
          for (const O of F)
            if (
              ((D = Array.from(i.querySelectorAll(O)).filter((X) => {
                var ie;
                return (
                  X !== S &&
                  X !== q &&
                  !(
                    (ie = X.closest) != null &&
                    ie.call(X, "div.item-content.placeholder")
                  ) &&
                  (() => {
                    const ce = k(X.textContent || "").toLowerCase();
                    return (
                      ce &&
                      (ce === R ||
                        ce.includes(R) ||
                        (ce.startsWith(R) && ce.length < 80))
                    );
                  })()
                );
              })),
              D.length > 0)
            )
              break;
          if (D.length > 0) {
            (D[0].scrollIntoView({ block: "nearest" }),
              await new Promise((O) => setTimeout(O, 20)),
              D[0].click(),
              await new Promise((O) => setTimeout(O, 35)),
              i.body.click(),
              t.add(S),
              (r += 1));
            continue;
          }
        }
      }
      if (!p && j) {
        const S = i.querySelector("form, [class*='form']") || i,
          q = Array.from(
            S.querySelectorAll(
              'textarea[placeholder="请输入内容"], input[placeholder="请输入内容"]',
            ),
          ).filter((O) => !t.has(O)),
          R = Array.from(
            S.querySelectorAll(
              'input[placeholder="请输入数字"], textarea[placeholder="请输入数字"]',
            ),
          ).filter((O) => !t.has(O)),
          F = M.slice(0, 2),
          D = (O) => {
            for (const X of O) {
              const ie = X.closest(
                  ".flat-form-editor-item, .fr-content, [class*='form-editor']",
                ),
                ce = ((ie == null ? void 0 : ie.textContent) || "").replace(
                  /\s+/g,
                  "",
                );
              if (ce.includes(F) || ce.includes(M)) return X;
            }
            return null;
          };
        p = D(q) || D(R);
      }
      if (!p && m === "项目类型" && b) {
        const S = b.toLowerCase();
        for (const { el: q } of H) {
          if (!((u = q.textContent) != null && u.includes("项目类型")))
            continue;
          const R = q.closest(
            ".flat-form-editor-item, .fr-content, [class*='form-editor']",
          );
          if (!R) continue;
          const F = R.querySelectorAll(".option-text");
          for (const D of F) {
            const O = k(D.textContent || "").toLowerCase();
            if (O !== S && !O.includes(S)) continue;
            const X =
              D.closest("[role='radio'], [role='option'], label") ||
              D.parentElement ||
              D;
            if (X && !t.has(X)) {
              (X.click(), t.add(X), (r += 1));
              break;
            }
          }
          if (r > 0) break;
        }
        if (r > 0) continue;
      }
      if (!p) {
        const S = i.querySelectorAll(".option-text"),
          q = b.toLowerCase();
        for (const R of S) {
          const F = k(R.textContent || "").toLowerCase();
          if (F !== q && !F.includes(q)) continue;
          const D =
              R.closest(
                ".flat-form-editor-item, .fr-content, [class*='form-editor']",
              ) || R.parentElement,
            O = D == null ? void 0 : D.querySelector("input[type='radio']");
          if (O && !t.has(O)) {
            p = O;
            break;
          }
        }
        if (!p)
          for (const R of f) {
            const F = k(R.textContent || "")
              .replace(/[：:]/g, "")
              .replace(/\s+/g, "");
            if (!F || !B.test(F)) continue;
            const D = (
              R.closest("div, fieldset, form") || i.body
            ).querySelectorAll("input[type='radio']");
            for (const O of D) {
              if (t.has(O)) continue;
              const X =
                  O.closest("label") || i.querySelector(`label[for="${O.id}"]`),
                ie = k(
                  (
                    (X == null ? void 0 : X.textContent) ||
                    O.value ||
                    ""
                  ).toLowerCase(),
                );
              if (ie === q || ie.includes(q) || O.value.toLowerCase() === q) {
                p = O;
                break;
              }
            }
            if (p) break;
          }
      }
      if (p) {
        if ((t.add(p), p instanceof HTMLSelectElement)) {
          let S = !1;
          const q = b.toLowerCase();
          for (const R of Array.from(p.options))
            if (
              k(R.textContent || "").toLowerCase() === q ||
              R.value.toLowerCase() === q
            ) {
              ((p.value = R.value), (S = !0));
              break;
            }
          if (!S)
            for (const R of Array.from(p.options)) {
              const F = k(R.textContent || "").toLowerCase();
              if (q && F.includes(q)) {
                ((p.value = R.value), (S = !0));
                break;
              }
            }
          (p.dispatchEvent(new Event("change", { bubbles: !0 })),
            d.push({ control: p, expected: b, label: m }));
        } else if (p instanceof HTMLInputElement && p.type === "radio")
          ((p.checked = !0),
            p.click(),
            d.push({ control: p, expected: b, label: m }));
        else if (
          p.isContentEditable ||
          ((n = p.getAttribute) == null
            ? void 0
            : n.call(p, "contenteditable")) === "true"
        ) {
          const S = p;
          ((S.textContent = ""),
            (S.textContent = b),
            (S.innerText = b),
            S.dispatchEvent(new Event("input", { bubbles: !0 })),
            S.dispatchEvent(new Event("change", { bubbles: !0 })),
            d.push({ control: p, expected: b, label: m }));
        } else (await me(p, b), d.push({ control: p, expected: b, label: m }));
        r += 1;
      }
    }
  }
  const $ = (f) => {
      if (f instanceof HTMLSelectElement) {
        const m = f.options[f.selectedIndex];
        return k(
          (m == null ? void 0 : m.textContent) ||
            (m == null ? void 0 : m.value) ||
            "",
        );
      }
      return f instanceof HTMLInputElement && f.type === "radio"
        ? f.checked
          ? k(f.value || "")
          : ""
        : f.isContentEditable
          ? k(f.textContent || "")
          : k(f.value || "");
    },
    z = async () => {
      var f;
      const m = i.querySelectorAll('[data-id^="table-form-item-"]');
      let C = 0;
      for (const b of m) {
        const M = b.querySelector(".fr-label-title"),
          A = ((M == null ? void 0 : M.getAttribute("title")) || "").replace(
            /\s+/g,
            "",
          ),
          B = b.querySelector(".fr-content");
        let p =
          B == null
            ? void 0
            : B.querySelector("textarea, input:not([type='hidden'])");
        if (!p) {
          const H =
            B == null
              ? void 0
              : B.querySelector(
                  '[contenteditable="true"]:not([contenteditable="false"])',
                );
          H &&
            !(
              (f = H.closest) != null &&
              f.call(H, "div.item-content.placeholder")
            ) &&
            (p = H);
        }
        if (!p || $(p).trim()) continue;
        let j = "";
        if (A === "输入") j = v;
        else {
          const H = ae.find((ee) => {
            const S = ee.replace(/\s+/g, "");
            return (
              A === S ||
              A.endsWith(S) ||
              A.replace(/^\d+/, "") === S ||
              (A === "合同类型" && ee === "项目类型") ||
              (A === "合同类型" && ee === "项目类型")
            );
          });
          H && (j = c[ae.indexOf(H)] ?? ge(H, k(o[H] || "")));
        }
        j &&
          (p instanceof HTMLInputElement || p instanceof HTMLTextAreaElement
            ? await me(p, j, A === "输入" ? 0 : 4)
            : p.isContentEditable &&
              (p.focus(),
              (p.textContent = j),
              p.dispatchEvent(new Event("input", { bubbles: !0 })),
              p.click(),
              await new Promise((H) => setTimeout(H, A === "输入" ? 0 : 4)),
              p.dispatchEvent(new Event("blur", { bubbles: !0 }))),
          (C += 1));
      }
      return C;
    };
  let Q = 0;
  for (;;) {
    const f = i.querySelectorAll('[data-id^="table-form-item-"]'),
      m = [];
    for (const C of f) {
      const b = C.querySelector(".fr-content"),
        M =
          b == null
            ? void 0
            : b.querySelector("textarea, input:not([type='hidden'])");
      if (M && !$(M).trim()) m.push(M);
      else {
        const A = Ne(b);
        A && !$(A).trim() && m.push(A);
      }
    }
    if (m.length === 0 || Q >= 1) break;
    (await z(), (Q += 1));
  }
  const V =
    i.querySelectorAll('[data-id^="table-form-item-"]').length > 0 &&
    Array.from(i.querySelectorAll('[data-id^="table-form-item-"]')).some(
      (f) => {
        const m = f.querySelector(".fr-content"),
          C = Ne(m);
        return C && !$(C).trim();
      },
    );
  const inputEntry = d.find(
    (x) => x.label === "输入" || (x.label === "全部字段" && x.expected === v),
  );
  let fe = !0;
  if (inputEntry) {
    const b = $(inputEntry.control),
      M = inputEntry.expected.toLowerCase().replace(/\s+/g, ""),
      A = b.toLowerCase().replace(/\s+/g, "");
    fe = !!A && (A === M || A.includes(M) || M.includes(A));
  }
  let re = !1;
  if (l && fe) {
    const f =
      i.querySelector("button[type='submit']") ||
      i.querySelector("input[type='submit']") ||
      (Array.from(
        i.querySelectorAll("button, [role='button'], input[type='button']"),
      ).find((m) => {
        const C = k(m.textContent || "");
        return /提交表单|提交|保存|下一步/i.test(C);
      }) ??
        null);
    f && (await new Promise((m) => setTimeout(m, 1200)), f.click(), (re = !0));
  }
  return r
    ? !fe && l
      ? {
          ok: !0,
          filledCount: r,
          submitted: !1,
          error:
            "填写后校验未通过（06输入未正确填写），请检查表单内容后手动提交。",
        }
      : V && l
        ? {
            ok: !0,
            filledCount: r,
            submitted: !1,
            error: "存在未填写的必填项，请补全后手动提交。",
          }
        : { ok: !0, filledCount: r, submitted: re }
    : {
        ok: !1,
        filledCount: r,
        submitted: re,
        error: "未能匹配到可填写的表单字段，请检查表单结构。",
      };
}
try {
  Oe();
} catch {}
