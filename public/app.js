/* Footfall marketing site interactions.
   Hero: the doorway scene — WhatsApp inquiries drop through the Footfall
   door and come out as booking tickets. Plus the lost-rupees counter and
   CTA wiring. No dependencies. */

(function () {
  "use strict";

  var WA_NUMBER = "919888800001"; // TODO: replace with the real Footfall WhatsApp number

  var T = function (n) { return document.querySelector('[data-dc-tpl="' + n + '"]'); };

  /* ---------- doorway scene ---------- */

  var FLOW = [
    { msg: "Any bridal makeup slots this Saturday?", time: "11:47 PM",
      k: "✓ BOOKED", t: "Bridal Makeup — Sat 2:00 PM", s: "Glow Salon · Priya · ₹4,500", amt: 4500 },
    { msg: "Root canal cost? urgent 🥲", time: "11:58 PM",
      k: "✓ BOOKED", t: "Root canal consult — Tue 11 AM", s: "Smile Dental · Dr. Mehta · ₹1,200", amt: 1200 },
    { msg: "Do you have Zumba? Monthly plans?", time: "6:03 AM",
      k: "✓ BOOKED", t: "Zumba trial — Wed 7:00 PM", s: "FitZone · then ₹1,500/mo", amt: 1500 },
    { msg: "(missed call — no answer)", time: "1:15 PM", rec: true,
      k: "↻ RECOVERED", t: "Facial — rebooked Thu 5 PM", s: "agent texted first · ₹1,800", amt: 1800 },
    { msg: "Weekend batch for Class 10 maths?", time: "9:21 PM",
      k: "✓ BOOKED", t: "Demo class — Sat 9:00 AM", s: "Bright Minds · Anita ma'am", amt: 2500 },
    { msg: "How much for a small wrist tattoo?", time: "1:12 AM",
      k: "✓ BOOKED", t: "Wrist linework — Fri 4:00 PM", s: "Inkline · Arjun · ₹2,000", amt: 2000 },
    { msg: "Wash + polish price for a Swift?", time: "8:14 AM",
      k: "✓ BOOKED", t: "Wash + polish — tomorrow 10 AM", s: "AutoShine · ₹1,400", amt: 1400 },
    { msg: "no-show yesterday 😕", time: "10:05 AM", rec: true,
      k: "↻ RECOVERED", t: "Haircut — rebooked today 6 PM", s: "reminder answered · ₹300", amt: 300 },
    { msg: "Grooming for a golden retriever?", time: "7:45 PM",
      k: "✓ BOOKED", t: "Full grooming — Thu 11:00 AM", s: "Furry Tales · ₹1,800", amt: 1800 },
    { msg: "Maternity shoot charges?", time: "10:30 PM",
      k: "✓ BOOKED", t: "Studio shoot — Sun 4:00 PM", s: "Lenscraft · 15 edits · ₹6,500", amt: 6500 },
  ];

  var lane = document.getElementById("df-lane");
  var stack = document.getElementById("df-stack");
  var glow = document.getElementById("df-glow");
  var countEl = document.getElementById("df-count");
  var booked = 0;
  var idx = 0;

  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function dropBubble(item) {
    var el = document.createElement("div");
    el.className = "df-bubble";
    var offset = Math.round((Math.random() - 0.5) * 120);
    el.style.marginLeft = offset + "px";
    el.innerHTML = esc(item.msg) + "<small>" + esc(item.time) + "</small>";
    lane.appendChild(el);
    el.addEventListener("animationend", function () { el.remove(); });
    setTimeout(function () { el.remove(); }, 2700); // fallback: throttled/hidden tabs
    while (lane.children.length > 3) lane.firstChild.remove();
  }

  function emitTicket(item) {
    if (glow) {
      glow.classList.add("flash");
      setTimeout(function () { glow.classList.remove("flash"); }, 320);
    }
    var el = document.createElement("div");
    el.className = "df-ticket" + (item.rec ? " rec" : "");
    el.innerHTML =
      '<div class="k">' + esc(item.k) + "</div>" +
      '<div class="t">' + esc(item.t) + "</div>" +
      '<div class="s">' + esc(item.s) + "</div>";
    stack.insertBefore(el, stack.firstChild);
    var kids = stack.children;
    for (var i = 0; i < kids.length; i++) {
      kids[i].classList.toggle("old", i > 0);
    }
    if (stack.children.length > 3) {
      var last = stack.children[stack.children.length - 1];
      last.classList.add("fade");
      setTimeout(function () { last.remove(); }, 350);
    }
    booked += item.amt;
    if (countEl) countEl.textContent = "₹" + booked.toLocaleString("en-IN");
  }

  function cycle() {
    var item = FLOW[idx % FLOW.length];
    idx += 1;
    dropBubble(item);
    setTimeout(function () { emitTicket(item); }, 2150);
    setTimeout(cycle, 3400);
  }

  if (lane && stack) {
    emitTicket(FLOW[FLOW.length - 1]);
    setTimeout(cycle, 600);
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
