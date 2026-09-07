(function () {
  "use strict";
  var slot = document.getElementById("apply-slot"); if (!slot) return;
  var cfg = window.HARMOS || {}, fs = cfg.formspree || "";
  slot.innerHTML =
    '<div class="panel" style="max-width:560px;margin:0 auto;padding:80px 22px 40px">' +
    '<p class="k">APPLY // HUMAN UPLINK</p><h2>Leave a signal.</h2>' +
    '<form id="applyForm" style="display:grid;gap:12px;margin-top:28px">' +
    '<input name="name" placeholder="Name" required style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:13px 15px;color:#e8f0ff;font-family:var(--body)">' +
    '<input name="email" type="email" placeholder="Email" required style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:13px 15px;color:#e8f0ff;font-family:var(--body)">' +
    '<textarea name="message" rows="4" placeholder="What are you verifying?" required style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:13px 15px;color:#e8f0ff;font-family:var(--body)"></textarea>' +
    '<button class="btn btn-a" type="submit" style="justify-self:start;border:none">Transmit →</button></form>' +
    '<p id="applyOut" style="font-family:var(--mono);font-size:11px;letter-spacing:.25em;color:var(--sig);margin-top:18px;text-transform:uppercase"></p></div>';
  var f = document.getElementById("applyForm"), out = document.getElementById("applyOut");
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!fs) { out.textContent = "SET FORMSPREE ID IN assets/js/site-config.js"; return; }
    var btn = f.querySelector("button"); btn.disabled = true; out.textContent = "transmitting…";
    fetch("https://formspree.io/f/" + fs, { method: "POST", body: new FormData(f), headers: { Accept: "application/json" } })
      .then(function (r) {
        if (r.ok) { out.textContent = "signal sealed — reply within 24h"; try { Nucleus.audio.lock(); } catch (x) {} f.reset(); btn.disabled = false; }
        else { out.textContent = "rejected (" + r.status + ") — email founders@harmos.app"; btn.disabled = false; }
      })
      .catch(function () { out.textContent = "offline — email founders@harmos.app"; btn.disabled = false; });
  });
})();
