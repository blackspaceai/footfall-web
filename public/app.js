/* Footfall marketing site interactions.
   Ported from the original design component; hooks onto the exported DOM
   via its stable data-dc-tpl attributes. No dependencies. */

(function () {
  "use strict";

  var WA_NUMBER = "919888800001"; // TODO: replace with the real Footfall WhatsApp number

  var T = function (n) { return document.querySelector('[data-dc-tpl="' + n + '"]'); };

  var DATA = {
    salon: { bizName: "Glow Salon & Spa",
      messages: [
        { customer: true, text: "Hi, any bridal makeup slots this Saturday?" },
        { agent: true, text: "Yes! 10:30 AM and 2:00 PM open with Priya. Bridal makeup is ₹4,500. Want me to hold one?" },
        { customer: true, text: "2 PM works" }],
      confirm: "Sat, 2:00 PM · Bridal Makeup · Priya · ₹4,500", confirmSub: "Reminder goes out Friday 6 PM." },
    clinic: { bizName: "Smile Dental Care",
      messages: [
        { customer: true, text: "How much for teeth cleaning? Can I come tomorrow?" },
        { agent: true, text: "Scaling & polishing is ₹1,200. Dr. Mehta has 11 AM or 4:30 PM free tomorrow — which works?" },
        { customer: true, text: "11 am" }],
      confirm: "Tue 11:00 AM · Cleaning · Dr. Mehta · ₹1,200", confirmSub: "Reminder goes out tonight 8 PM." },
    gym: { bizName: "FitZone Gym",
      messages: [
        { customer: true, text: "What are your monthly plans? Do you have Zumba?" },
        { agent: true, text: "Zumba is Mon/Wed/Fri 7 PM. Monthly ₹1,800, or ₹1,500/mo with the 3-month pack. Want a free trial class this week?" },
        { customer: true, text: "Trial on Wednesday!" }],
      confirm: "Wed 7:00 PM · Zumba trial class", confirmSub: "Carry water & a towel. See you!" },
    tuition: { bizName: "Bright Minds Coaching",
      messages: [
        { customer: true, text: "Weekend batch for Class 10 maths?" },
        { agent: true, text: "Yes — Sat/Sun 9 AM with Anita ma’am, ₹2,500/month. Want a free demo class this Saturday?" },
        { customer: true, text: "Demo please" }],
      confirm: "Sat 9:00 AM · Demo class · Anita ma’am", confirmSub: "Bring last year’s maths notebook." },
    tattoo: { bizName: "Inkline Tattoo Studio",
      messages: [
        { customer: true, text: "How much for a small wrist tattoo?" },
        { agent: true, text: "Simple linework starts at ₹2,000, ~45 min. Arjun is free Friday 4 PM or Saturday noon — which works?" },
        { customer: true, text: "Friday 4 pm" }],
      confirm: "Fri 4:00 PM · Wrist linework · Arjun · ₹2,000", confirmSub: "Design consult 15 min before, free." },
    carcare: { bizName: "AutoShine Detailing",
      messages: [
        { customer: true, text: "Wash + polish price for a Swift?" },
        { agent: true, text: "Hatchback wash + polish is ₹1,400, takes ~2 hrs. Tomorrow 10 AM or 3 PM open — book one?" },
        { customer: true, text: "10 AM" }],
      confirm: "Tomorrow 10:00 AM · Wash + Polish · ₹1,400", confirmSub: "Drop the keys, we’ll WhatsApp when done." },
    petcare: { bizName: "Furry Tales Pet Spa",
      messages: [
        { customer: true, text: "Grooming for a golden retriever?" },
        { agent: true, text: "Full grooming for large breeds is ₹1,800, ~90 min. Thursday 11 AM is free — book it?" },
        { customer: true, text: "Yes please!" }],
      confirm: "Thu 11:00 AM · Full grooming · ₹1,800", confirmSub: "Vaccination card at first visit, please." },
    studio: { bizName: "Lenscraft Studio",
      messages: [
        { customer: true, text: "Do you do maternity shoots? Charges?" },
        { agent: true, text: "2-hr studio shoot with 15 edited photos, ₹6,500. This weekend: Sat 10 AM or Sun 4 PM?" },
        { customer: true, text: "Sunday 4 pm" }],
      confirm: "Sun 4:00 PM · Maternity shoot · ₹6,500", confirmSub: "Outfit tips coming in a follow-up message." }
  };
  var TIMES = { salon: "11:47 PM", clinic: "11:58 PM", gym: "6:03 AM", tuition: "9:21 PM",
    tattoo: "1:12 AM", carcare: "8:14 AM", petcare: "7:45 PM", studio: "10:30 PM" };
  var KEYS = Object.keys(DATA);

  /* ---------- phone demo ---------- */

  var chat = T(61);
  var fixedNodes = chat ? Array.prototype.slice.call(chat.children, 0, 2) : []; // TODAY + lock notice

  // The phone's status-bar clock is the one sc-interp span whose text is a time.
  var statusClock = Array.prototype.find.call(
    document.querySelectorAll("header .sc-interp"),
    function (el) { return /^\d{1,2}:\d{2} (AM|PM)$/.test(el.textContent.trim()); }
  );

  function bubble(msg, time) {
    var el = document.createElement("div");
    if (msg.customer) {
      el.setAttribute("style", "align-self:flex-start;max-width:85%;background:#fff;border-radius:10px 10px 10px 3px;padding:7px 10px 5px;font-size:12.5px;line-height:1.4;color:#111b21;box-shadow:rgba(0,0,0,.1) 0 1px 1px;animation:.3s ease-out bkPop;");
      el.innerHTML = '<span></span><span style="float:right;margin:7px 0 0 8px;font-size:9.5px;color:#a0a8a0;">' + time + "</span>";
    } else {
      el.setAttribute("style", "align-self:flex-end;max-width:88%;background:#d9fdd3;border-radius:10px 10px 3px;padding:7px 10px 5px;font-size:12.5px;line-height:1.4;color:#111b21;box-shadow:rgba(0,0,0,.1) 0 1px 1px;animation:.3s ease-out bkPop;");
      el.innerHTML = '<span></span><span style="display:inline-flex;align-items:center;gap:3px;float:right;margin:7px 0 0 8px;font-size:9.5px;color:#7d8a7c;">' + time + ' <span style="color:#53bdeb;font-size:10px;letter-spacing:-2px;">✓✓</span></span>';
    }
    el.firstChild.textContent = msg.text;
    return el;
  }

  function typingBubble() {
    var el = document.createElement("div");
    el.setAttribute("style", "align-self:flex-end;background:#d9fdd3;border-radius:10px 10px 3px;padding:11px 14px;box-shadow:rgba(0,0,0,.1) 0 1px 1px;display:flex;gap:4px;animation:.3s ease-out bkPop;");
    for (var i = 0; i < 3; i++) {
      var dot = document.createElement("span");
      dot.setAttribute("style", "width:6px;height:6px;border-radius:50%;background:#7d8a7c;animation:bkDot 1.2s " + (i * 0.18) + "s infinite;");
      el.appendChild(dot);
    }
    return el;
  }

  function confirmCard(d) {
    var el = document.createElement("div");
    el.setAttribute("style", "align-self:center;max-width:88%;background:#fdf6e3;border:1px solid #f0d9a0;border-radius:12px;padding:10px 16px;text-align:center;box-shadow:rgba(0,0,0,.1) 0 1px 2px;animation:.3s ease-out bkPop;");
    el.innerHTML = '<div style="font-size:10px;font-weight:800;letter-spacing:.14em;color:#17a566;">✓ BOOKED</div>' +
      '<div style="margin-top:4px;font-size:12px;font-weight:700;color:#3d3520;"></div>' +
      '<div style="margin-top:2px;font-size:10.5px;color:#8a7a4e;"></div>';
    el.children[1].textContent = d.confirm;
    el.children[2].textContent = d.confirmSub;
    return el;
  }

  function render(vertical, step, typing) {
    var d = DATA[vertical];
    var time = TIMES[vertical];
    var avatar = T(49), name = T(51), status = T(52);
    if (avatar) avatar.querySelector(".sc-interp").textContent = d.bizName[0];
    if (name) name.querySelector(".sc-interp").textContent = d.bizName;
    if (status) status.querySelector(".sc-interp").textContent = typing ? "typing…" : "online";
    if (statusClock) statusClock.textContent = time;
    if (!chat) return;
    chat.innerHTML = "";
    fixedNodes.forEach(function (n) { chat.appendChild(n); });
    var count = step >= 3 ? 3 : step >= 2 ? 2 : step >= 1 ? 1 : 0;
    d.messages.slice(0, count).forEach(function (m) { chat.appendChild(bubble(m, time)); });
    if (typing) chat.appendChild(typingBubble());
    if (step >= 4) chat.appendChild(confirmCard(d));
  }

  var current = 0, timers = [];
  function startDemo() {
    timers.forEach(clearTimeout);
    timers = [];
    var v = KEYS[current];
    render(v, 0, false);
    [[700, 1, false], [1500, 1, true], [3100, 2, false], [4500, 3, false], [5200, 3, true], [6500, 4, false]]
      .forEach(function (s) {
        timers.push(setTimeout(function () { render(v, s[1], s[2]); }, s[0]));
      });
    timers.push(setTimeout(function () {
      current = (current + 1) % KEYS.length;
      startDemo();
    }, 11000));
  }

  /* ---------- lost-rupees counter ---------- */

  var lost = 0;
  var counterEl = T(128) && T(128).querySelector(".sc-interp");
  setInterval(function () {
    lost += Math.floor(90 + Math.random() * 480);
    if (counterEl) counterEl.textContent = "₹" + lost.toLocaleString("en-IN");
  }, 900);
  if (counterEl) counterEl.textContent = "₹0";

  /* ---------- hero tilt ---------- */

  var scene = document.querySelector("header");
  var phone = T(47);
  while (phone && phone.parentElement && phone.parentElement !== scene) {
    var st = phone.getAttribute("style") || "";
    if (/border-radius:\s*(2[8-9]|3[0-9]|4[0-9])px/.test(st)) break;
    phone = phone.parentElement;
  }
  var raf = 0;
  function tilt(nx, ny) {
    if (phone) phone.style.transform = "rotateY(" + nx * 10 + "deg) rotateX(" + -ny * 8 + "deg)";
  }
  if (scene) {
    scene.addEventListener("mousemove", function (e) {
      var r = scene.getBoundingClientRect();
      var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      var ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () { tilt(nx, ny); });
    });
    scene.addEventListener("mouseleave", function () { tilt(0, 0); });
  }

  /* ---------- CTAs ---------- */

  var input = T(281);
  function goStart() {
    var bar = document.getElementById("start");
    if (bar) bar.scrollIntoView({ behavior: "smooth", block: "end" });
    if (input) setTimeout(function () { input.focus(); }, 450);
  }
  var ctaTexts = ["Step in", "Connect my number →", "Start 14-day free trial",
    "Start free — no card", "Start free — connect my number"];
  Array.prototype.forEach.call(document.querySelectorAll("div"), function (el) {
    if (el.children.length === 0 && ctaTexts.indexOf(el.textContent.trim()) !== -1) {
      el.style.cursor = "pointer";
      el.addEventListener("click", goStart);
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

  startDemo();
})();
