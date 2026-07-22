/* Footfall marketing site interactions.
   Hero: the doorway scene — WhatsApp inquiries drop through the Footfall
   door and come out as booking tickets. Plus the lost-rupees counter and
   CTA wiring. No dependencies. */

(function () {
  "use strict";

  var WA_NUMBER = "919888800001"; // TODO: replace with the real Footfall WhatsApp number

  var T = function (n) { return document.querySelector('[data-dc-tpl="' + n + '"]'); };

  /* ---------- 24x7 booking clock ---------- */

  var NIGHT = [0, 1, 2, 11];  // marker indexes that land after closing
  var TOTAL = 12;
  var countEl = document.getElementById("fc-count");
  var nightEl = document.getElementById("fc-night");

  function setLit(i, on) {
    var m = document.getElementById("fc-m" + i);
    var l = document.getElementById("fc-l" + i);
    if (m) m.classList.toggle("lit", on);
    if (l) l.classList.toggle("lit", on);
  }

  if (countEl) {
    var order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0]; // chronological from 12:15 AM
    var pos2 = 0, litCount = 0, nightCount = 0;
    var clockStep = function () {
      if (pos2 < order.length) {
        var i = order[pos2];
        setLit(i, true);
        litCount += 1;
        if (NIGHT.indexOf(i) !== -1) nightCount += 1;
        countEl.textContent = String(litCount);
        nightEl.textContent = "\ud83c\udf19 " + nightCount + " while you slept";
        pos2 += 1;
        setTimeout(clockStep, 1100);
      } else {
        setTimeout(function () {
          for (var j = 0; j < TOTAL; j++) setLit(j, false);
          litCount = 0; nightCount = 0; pos2 = 0;
          countEl.textContent = "0";
          nightEl.textContent = "\ud83c\udf19 0 while you slept";
          setTimeout(clockStep, 900);
        }, 5200);
      }
    };
    setTimeout(clockStep, 700);
  }

  /* ---------- lost-rupees counter (cost section) ---------- */

  var lost = 0;
  var counterEl = T(128) && T(128).querySelector(".sc-interp");
  setInterval(function () {
    lost += Math.floor(90 + Math.random() * 480);
    if (counterEl) counterEl.textContent = "₹" + lost.toLocaleString("en-IN");
  }, 900);
  if (counterEl) counterEl.textContent = "₹0";

  /* ---------- CTAs ---------- */

  var input = T(281);
  function goStart() {
    var bar = document.getElementById("start");
    if (bar) bar.scrollIntoView({ behavior: "smooth", block: "end" });
    if (input) setTimeout(function () { input.focus(); }, 450);
  }
  var ctaTexts = ["Step in", "Connect my number →", "Start 14-day free trial",
    "Start free — no card", "Start free — connect my number"];
  Array.prototype.forEach.call(document.querySelectorAll("div,a"), function (el) {
    if (el.children.length === 0 && ctaTexts.indexOf(el.textContent.trim()) !== -1) {
      el.style.cursor = "pointer";
      el.addEventListener("click", function (e) {
        if (el.tagName === "A") e.preventDefault();
        goStart();
      });
    }
  });

  function send() {
    if (!input) return;
    var name = input.value.trim();
    if (!name) { input.focus(); return; }
    var row = input.parentElement;
    row.innerHTML = '<div style="flex:1;text-align:center;color:#7df2a8;font-size:15px;font-weight:700;padding:14px 0;">' +
      "Thanks! Opening WhatsApp to set up “" + name.replace(/[<>&]/g, "") + "”…</div>";
    window.open("https://wa.me/" + WA_NUMBER + "?text=" +
      encodeURIComponent("Hi Footfall! I want to set up my business: " + name), "_blank");
  }
  var sendBtn = T(282);
  if (sendBtn) sendBtn.addEventListener("click", send);
  if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

  var waLinks = Array.prototype.filter.call(document.querySelectorAll("a"), function (a) {
    return a.textContent.trim() === "WhatsApp us";
  });
  waLinks.forEach(function (a) {
    a.href = "https://wa.me/" + WA_NUMBER;
    a.target = "_blank";
    a.rel = "noopener";
  });
})();
