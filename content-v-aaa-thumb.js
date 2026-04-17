// Optional helper injected by background.js.
// Keep this file side-effect free so missing-feature fallback injections do not fail.
(function(){
  if (typeof globalThis === "undefined") return;
  if (globalThis.__mkToolThumbHelperLoaded) return;
  globalThis.__mkToolThumbHelperLoaded = true;
})();
