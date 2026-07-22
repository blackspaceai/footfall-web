/* Footfall marketing site interactions.
   Hero: the doorway scene — WhatsApp inquiries drop through the Footfall
   door and come out as booking tickets. Plus the lost-rupees counter and
   CTA wiring. No dependencies. */

(function () {
  "use strict";

  var WA_NUMBER = "919888800001"; // TODO: replace with the real Footfall WhatsApp number

  var T = function (n) { return document.querySelector('[data-dc-tpl="' + n + '"]'); };

  /* ---------- live mini-dashboard ---------- */

  var PLAN = [
    { c: 0, top: 2,  h: 11, b: "Bridal Makeup", s: "11:00 · ₹4,500", amt: 4500,
      n: "💬 Priya: “Bridal makeup Saturday?” → booked in 31s" },
    { c: 1, top: 8,  h: 8,  b: "Haircut", s: "11:30 · ₹300", amt: 300,
      n: "💬 Rahul: “Haircut abhi possible?” → 11:30 with Monu" },
    { c: 2, top: 16, h: 10, b: "Facial", s: "12:15 · ₹1,800", amt: 1800,
      n: "💬 Meera: “Facial ka rate?” → quoted & booked" },
    { c: 0, top: 26, h: 8,  b: "Eyebrows", s: "1:00 · ₹50", amt: 50,
      n: "💬 Ananya: “Eyebrows walk-in?” → slot held" },
    { c: 1, top: 30, h: 12, b: "Hair colour", s: "1:30 · ₹1,200", amt: 1200, rec: true,
      n: "↻ No-show yesterday → reminder answered → rebooked" },
    { c: 2, top: 38, h: 9,  b: "Head massage", s: "2:30 · ₹400", amt: 400,
      n: "💬 Uncle ji (missed call) → agent texted first → booked" },
    { c: 0, top: 46, h: 12, b: "Keratin", s: "3:00 · ₹5,500", amt: 5500,
      n: "💬 “Keratin kitne ka?” at 1:12 AM → answered in 28s" },
    { c: 1, top: 52, h: 8,  b: "Beard trim", s: "4:00 · ₹150", amt: 150,
      n: "💬 “Beard trim + haircut combo?” → upsold politely" },
    { c: 2, top: 58, h: 10, b: "Facial", s: "4:30 · ₹1,800", amt: 1800, rec: true,
      n: "↻ Recovered: cancelled Tue → offered Thu → confirmed" },
    { c: 0, top: 68, h: 10, b: "Bridal trial", s: "5:30 · ₹2,000", amt: 2000,
      n: "💬 “Trial before wedding?” → 5:30 with Sakshu" },
    { c: 2, top: 74, h: 9,  b: "Haircut", s: "6:15 · ₹300", amt: 300,
      n: "💬 “Aaj evening free ho?” → 6:15 confirmed" },
    { c: 1, top: 78, h: 11, b: "Party makeup", s: "7:00 · ₹2,500", amt: 2500,
      n: "💬 “Party makeup tonight?!” → squeezed in at 7" },
  ];

  var tracks = [document.getElementById("fd-c0"), document.getElementById("fd-c1"),
                document.getElementById("fd-c2")];
  var revEl = document.getElementById("fd-rev");
  var recEl = document.getElementById("fd-rec");
  var notifEl = document.getElementById("fd-notif-msg");
  var rev = 0, recs = 0, step = 0;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function notify(text) {
    if (!notifEl) return;
    notifEl.classList.remove("in");
    void notifEl.offsetWidth; // restart animation
    notifEl.textContent = text;
    notifEl.classList.add("in");
  }

  function placeBlock(item) {
    var track = tracks[item.c];
    if (!track) return;
    var el = document.createElement("div");
    el.className = "fd-block" + (item.rec ? " rec" : "");
    el.style.top = item.top + "%";
    el.style.height = item.h + "%";
    el.innerHTML = "<b>" + esc(item.b) + "</b><span>" + esc(item.s) + "</span>";
    track.appendChild(el);
    rev += item.amt;
    if (revEl) revEl.textContent = "₹" + rev.toLocaleString("en-IN");
    if (item.rec) {
      recs += 1;
      if (recEl) recEl.textContent = String(recs);
    }
  }

  function resetDay() {
    tracks.forEach(function (track) {
      if (!track) return;
      Array.prototype.forEach.call(track.querySelectorAll(".fd-block"), function (b) {
        b.classList.add("fadeout");
      });
      setTimeout(function () { track.innerHTML = ""; }, 650);
    });
    rev = 0; recs = 0;
    if (revEl) revEl.textContent = "₹0";
    if (recEl) recEl.textContent = "0";
    notify("🌅 A new day at the salon — the agent is listening…");
  }

  function tick() {
    if (step < PLAN.length) {
      var item = PLAN[step];
      notify(item.n);
      placeBlock(item);
      step += 1;
      setTimeout(tick, 2600);
    } else {
      step = 0;
      setTimeout(function () { resetDay(); setTimeout(tick, 1600); }, 3800);
    }
  }

  if (tracks[0]) setTimeout(tick, 900);

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
