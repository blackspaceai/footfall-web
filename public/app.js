/* Footfall marketing site interactions.
   Hero: the doorway scene — WhatsApp inquiries drop through the Footfall
   door and come out as booking tickets. Plus the lost-rupees counter and
   CTA wiring. No dependencies. */

(function () {
  "use strict";

  var WA_NUMBER = "919888800001"; // TODO: replace with the real Footfall WhatsApp number

  var T = function (n) { return document.querySelector('[data-dc-tpl="' + n + '"]'); };

  /* ---------- lost-rupees counter (cost section) ---------- */

  var lost = 0;
  var counterEl = T(128) && T(128).querySelector(".sc-interp");
  setInterval(function () {
    lost += Math.floor(90 + Math.random() * 480);
    if (counterEl) counterEl.textContent = "₹" + lost.toLocaleString("en-IN");
  }, 900);
  if (counterEl) counterEl.textContent = "₹0";

  /* ---------- CTAs ---------- */
  /* Every "start free" CTA is a real <a href="/join"> now — let the browser
     navigate natively. The hero input is a shortcut into the same form: it
     carries the typed business name over as a query param so /join prefills it. */

  var input = T(281);
  function goJoin() {
    var name = input ? input.value.trim() : "";
    window.location.href = "/join" + (name ? "?business=" + encodeURIComponent(name) : "");
  }
  var sendBtn = T(282);
  if (sendBtn) {
    sendBtn.style.cursor = "pointer";
    sendBtn.addEventListener("click", goJoin);
  }
  if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter") goJoin(); });

  var waLinks = Array.prototype.filter.call(document.querySelectorAll("a"), function (a) {
    return a.textContent.trim() === "WhatsApp us";
  });
  waLinks.forEach(function (a) {
    a.href = "https://wa.me/" + WA_NUMBER;
    a.target = "_blank";
    a.rel = "noopener";
  });
})();
