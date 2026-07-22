/* Footfall marketing site interactions.
   Hero: the doorway scene — WhatsApp inquiries drop through the Footfall
   door and come out as booking tickets. Plus the lost-rupees counter and
   CTA wiring. No dependencies. */

(function () {
  "use strict";

  var WA_NUMBER = "919888800001"; // TODO: replace with the real Footfall WhatsApp number

  var T = function (n) { return document.querySelector('[data-dc-tpl="' + n + '"]'); };

  /* ---------- hero example rotator (same layout, text swaps) ---------- */

  var EXAMPLES = [
    { m1: "Hi! Haircut available tomorrow evening?", t1: "9:14 PM",
      m2: "Yes! 6:00 PM is free with Ravi \u2014 Haircut is \u20b9300. Shall I book it?",
      t2: "Footfall AI \u00b7 replied in 28 seconds",
      m3: "Yes book it \ud83d\udc4d", t3: "9:15 PM",
      cb: "\u2713 Booking confirmed",
      cs: "Tomorrow \u00b7 6:00 PM \u00b7 Haircut with Ravi \u00b7 \u20b9300",
      ce: "Reminder goes out automatically. No-show? It rebooks them." },
    { m1: "Tooth pain \ud83d\ude16 any slot today?", t1: "8:40 AM",
      m2: "Dr. Mehta can see you at 4:30 PM today. Consultation is \u20b9500. Book it?",
      t2: "Footfall AI \u00b7 replied in 31 seconds",
      m3: "Yes please, coming", t3: "8:41 AM",
      cb: "\u2713 Appointment confirmed",
      cs: "Today \u00b7 4:30 PM \u00b7 Consultation \u00b7 Dr. Mehta \u00b7 \u20b9500",
      ce: "Patient gets directions + a reminder at 2:30 PM." },
    { m1: "Do you have Zumba? Timings?", t1: "6:03 AM",
      m2: "Yes! Mon/Wed/Fri 7 PM \u2014 and your first class is free. Try tomorrow?",
      t2: "Footfall AI \u00b7 replied in 25 seconds",
      m3: "Book my free trial \ud83d\udcaa", t3: "6:04 AM",
      cb: "\u2713 Trial booked",
      cs: "Tomorrow \u00b7 7:00 PM \u00b7 Zumba trial \u00b7 Free",
      ce: "Carry water and a towel \u2014 see you there!" },
  ];

  var wrap = document.getElementById("cc-wrap");
  var tabs = document.getElementById("cc-tabs");
  var head = document.querySelector(".cc-head");
  var avaEl = document.getElementById("cc-ava");
  var bizEl = document.getElementById("cc-biz");
  var IDENT = [
    { ava: "\u2702\ufe0f", biz: "Glow Salon & Spa" },
    { ava: "\ud83e\uddb7", biz: "Smile Dental Care" },
    { ava: "\ud83c\udfcb\ufe0f", biz: "FitZone Gym" },
  ];
  var exIdx = 0;
  var exTimer = null;

  function showExample(i) {
    exIdx = i;
    var ex = EXAMPLES[i];
    if (tabs) {
      Array.prototype.forEach.call(tabs.children, function (b, j) {
        b.classList.toggle("on", j === i);
      });
    }
    var msgs = wrap ? wrap.querySelectorAll(".cc-msg") : [];
    var card = wrap ? wrap.querySelector(".cc-card") : null;
    if (msgs.length >= 3 && card) {
      msgs[0].querySelector("p").textContent = ex.m1;
      msgs[0].querySelector("small").textContent = ex.t1;
      msgs[1].querySelector("p").textContent = ex.m2;
      msgs[1].querySelector("small").textContent = ex.t2;
      msgs[2].querySelector("p").textContent = ex.m3;
      msgs[2].querySelector("small").textContent = ex.t3;
      card.querySelector("b").textContent = ex.cb;
      card.querySelector("span").textContent = ex.cs;
      card.querySelector("em").textContent = ex.ce;
    }
    if (avaEl) avaEl.textContent = IDENT[i].ava;
    if (bizEl) bizEl.textContent = IDENT[i].biz;
    if (wrap) { wrap.style.opacity = "1"; wrap.classList.remove("swap"); }
    if (head) head.classList.remove("swap");
  }

  function armAuto() {
    if (exTimer) clearInterval(exTimer);
    exTimer = setInterval(function () {
      showExample((exIdx + 1) % EXAMPLES.length);
    }, 6000);
  }

  if (wrap && tabs) {
    Array.prototype.forEach.call(tabs.children, function (b, j) {
      b.addEventListener("click", function () {
        showExample(j);
        armAuto();
      });
    });
    armAuto();
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
