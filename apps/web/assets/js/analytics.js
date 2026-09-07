(function (w, d) {
  "use strict";
  var cfg = w.HARMOS || {}; if (!cfg.gaId) return;
  var s = d.createElement("script"); s.async = 1; s.src = "https://www.googletagmanager.com/gtag/js?id=" + cfg.gaId; d.head.appendChild(s);
  w.dataLayer = w.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  w.gtag = gtag; gtag("js", new Date()); gtag("config", cfg.gaId, { anonymize_ip: true });
})(window, document);
