/* Vertical landing pages for SEO — one per business type Footfall serves.
   Each page targets "<vertical> AI" / "AI receptionist for <vertical>" /
   "WhatsApp booking for <vertical>" style queries with real, specific copy
   (thin doorway pages get ignored; every field below is vertical-specific). */

export type Vertical = {
  slug: string;
  name: string; // plural, e.g. "Salons"
  singular: string;
  title: string; // <title>
  description: string; // meta description
  keywords: string[];
  h1: string;
  intro: string;
  pains: { title: string; body: string }[];
  chat: { from: "customer" | "footfall"; text: string }[];
  faqs: { q: string; a: string }[];
};

export const VERTICALS: Vertical[] = [
  {
    slug: "salons",
    name: "Salons",
    singular: "salon",
    title: "Salon AI — WhatsApp AI receptionist & booking agent for salons | Footfall",
    description:
      "Footfall is the salon AI that answers every WhatsApp message, books appointments into your stylists' calendars, sends reminders and chases no-shows — 24×7, in English, Hindi and Hinglish. 14 days free.",
    keywords: [
      "salon ai",
      "ai for salon",
      "salon booking ai",
      "whatsapp booking for salon",
      "salon appointment software india",
      "salon whatsapp chatbot",
      "ai receptionist for salon",
      "salon booking app",
    ],
    h1: "The AI receptionist your salon's WhatsApp deserves",
    intro:
      "Half your bookings arrive on WhatsApp — while your stylists' hands are in foils, after closing, or mid-blow-dry. Footfall answers every message in seconds, offers real slots from each stylist's calendar, books the appointment, and reminds the customer so they actually turn up.",
    pains: [
      {
        title: "Messages at midnight",
        body: "Customers text \"Kal 11 baje haircut milega?\" at 11:58 PM. Footfall replies in seconds with real availability and books it — you find the confirmed appointment in the morning.",
      },
      {
        title: "Per-stylist calendars",
        body: "Regulars want their stylist. Footfall knows Sakshi's Tuesday is full but Monu is free at 11:30, and offers exactly that — no double-booking, no \"anyone free?\" confusion.",
      },
      {
        title: "No-shows eat your day",
        body: "Automatic reminders before the slot, and a polite win-back message when someone doesn't show — so an empty chair turns back into revenue.",
      },
      {
        title: "Rebooking on autopilot",
        body: "Haircut every 4 weeks? Footfall nudges the customer when they're due, with a one-tap slot. Your busiest month becomes every month.",
      },
    ],
    chat: [
      { from: "customer", text: "Hi, bridal glow facial kitne ka hai?" },
      { from: "footfall", text: "Namaste! Bridal glow facial is ₹5,000 (90 min). Kal 3 pm ya Saturday 11 am free hai — book kar doon?" },
      { from: "customer", text: "Saturday 11 with Sakshi" },
      { from: "footfall", text: "Done ✅ Saturday 11:00 am, Bridal glow facial with Sakshi. Reminder aayega. See you!" },
    ],
    faqs: [
      {
        q: "Does the salon AI work on my existing WhatsApp number?",
        a: "Yes. Footfall connects to your current WhatsApp Business number, so customers keep messaging the number they already have saved.",
      },
      {
        q: "Can it handle Hindi and Hinglish?",
        a: "Fluently. Footfall replies in English, Hindi or Hinglish — matching whatever language the customer writes in.",
      },
      {
        q: "What if I want to reply myself?",
        a: "Open the conversation in the Footfall app and tap \"take over\" — the AI pauses instantly and hands the chat to you, then resumes when you're done.",
      },
      {
        q: "How long does setup take?",
        a: "We set it up for you in about a day: services, prices, staff and hours. Nothing to install for your customers.",
      },
    ],
  },
  {
    slug: "spas",
    name: "Spas",
    singular: "spa",
    title: "Spa AI — WhatsApp booking agent for spas & wellness centres | Footfall",
    description:
      "Footfall is the spa AI that turns WhatsApp inquiries into confirmed appointments — therapies, packages, couples slots — with reminders and no-show recovery built in. 24×7, multilingual. 14 days free.",
    keywords: [
      "spa ai",
      "ai for spa",
      "spa booking software india",
      "whatsapp booking for spa",
      "wellness centre booking app",
      "spa appointment whatsapp",
      "ai receptionist for spa",
    ],
    h1: "Your spa's front desk, awake 24×7 on WhatsApp",
    intro:
      "Spa customers plan relaxation on impulse — Sunday morning, late Friday night, lunch break. Footfall catches that impulse the second it lands in WhatsApp: it explains therapies and packages, offers real slots, books the right room and therapist, and reminds them before they arrive.",
    pains: [
      {
        title: "Long menus, short attention",
        body: "Swedish vs deep-tissue vs aroma? Footfall answers menu questions instantly with your prices and durations, then guides the customer straight to a bookable slot.",
      },
      {
        title: "Rooms and therapists",
        body: "Couples massage needs two therapists and the big room. Footfall books against real availability so you never promise capacity you don't have.",
      },
      {
        title: "Quiet weekday afternoons",
        body: "Broadcast a weekday offer to your whole customer list with one tap — Footfall handles every \"is 3 pm free?\" reply that comes back.",
      },
      {
        title: "High-value no-shows",
        body: "A missed 90-minute package is real money. Reminders before, win-back after — automatically.",
      },
    ],
    chat: [
      { from: "customer", text: "Do you have couples massage today evening?" },
      { from: "footfall", text: "Yes! Couples aroma massage (60 min, ₹4,500) — 6:30 pm or 8:00 pm today. Which works?" },
      { from: "customer", text: "8 pm" },
      { from: "footfall", text: "Booked ✅ Today 8:00 pm, couples aroma massage. We'll send a reminder an hour before. Relax, we've got it." },
    ],
    faqs: [
      {
        q: "Can it sell packages and memberships?",
        a: "Footfall answers questions about any service or package on your menu with your real prices, and books sessions against availability. Membership billing stays with you.",
      },
      {
        q: "Does it handle rescheduling?",
        a: "Yes — customers reschedule or cancel in the same chat, and the slot opens up for your waitlist automatically.",
      },
      {
        q: "Which languages does it speak?",
        a: "English, Hindi and Hinglish out of the box — it mirrors the customer's language.",
      },
      {
        q: "What does it cost?",
        a: "₹1,499/month after a 14-day free trial. One saved booking typically covers the month.",
      },
    ],
  },
  {
    slug: "clinics",
    name: "Clinics",
    singular: "clinic",
    title: "Clinic AI — WhatsApp appointment booking for clinics | Footfall",
    description:
      "Footfall is the clinic AI receptionist on WhatsApp: books patient appointments into each doctor's schedule, answers timing and fee questions, sends reminders and recovers missed visits. 24×7. 14 days free.",
    keywords: [
      "clinic ai",
      "ai for clinic",
      "clinic appointment booking whatsapp",
      "clinic booking software india",
      "patient appointment whatsapp",
      "ai receptionist for clinic",
      "opd appointment booking app",
    ],
    h1: "Every patient message answered. Every appointment booked.",
    intro:
      "Your front desk juggles a ringing phone, a full waiting room and a WhatsApp inbox that never stops. Footfall takes the inbox: it answers timings, fees and availability instantly, books patients into the right doctor's schedule, and sends reminders that cut missed appointments.",
    pains: [
      {
        title: "The phone never stops",
        body: "Every \"aaj doctor hain?\" answered instantly on WhatsApp — without pulling your receptionist off the front desk.",
      },
      {
        title: "Per-doctor schedules",
        body: "Dr. Mehta sits Mon/Wed/Fri, Dr. Rao evenings only. Footfall offers each doctor's real slots and never overbooks a session.",
      },
      {
        title: "Missed appointments",
        body: "Reminders the evening before and 2 hours before. If a patient still misses, a follow-up helps them rebook — recovering lost consultations.",
      },
      {
        title: "After-hours demand",
        body: "Patients decide to see a doctor at night. Footfall books them in at 11 pm so your 9 am isn't spent returning calls.",
      },
    ],
    chat: [
      { from: "customer", text: "Dr. Mehta ka appointment chahiye kal" },
      { from: "footfall", text: "Dr. Mehta is available tomorrow 10:30 am, 11:15 am or 6:00 pm (consultation ₹500). Kaunsa slot book karun?" },
      { from: "customer", text: "11:15" },
      { from: "footfall", text: "Booked ✅ Tomorrow 11:15 am with Dr. Mehta. Please arrive 10 minutes early. Reminder will come before the visit." },
    ],
    faqs: [
      {
        q: "Is patient data safe?",
        a: "Conversations and bookings live in your own secured account, with access controlled by your login. Footfall never sells or shares data.",
      },
      {
        q: "Can it triage emergencies?",
        a: "Footfall books routine appointments. Messages that need a human — emergencies, medical questions — are handed to your staff immediately with an alert.",
      },
      {
        q: "Does it work for multiple doctors?",
        a: "Yes — each doctor gets their own schedule and consultation windows, and patients are booked to the right one.",
      },
      {
        q: "Can my receptionist still step in?",
        a: "Anytime. One tap pauses the AI on that conversation and your staff replies from the same number.",
      },
    ],
  },
  {
    slug: "doctors",
    name: "Doctors",
    singular: "doctor's practice",
    title: "Doctor AI — WhatsApp appointment assistant for doctors | Footfall",
    description:
      "Footfall is the doctor AI that manages your appointment book on WhatsApp: patients book, reschedule and get reminders automatically, while you see a clean day sheet. 24×7, English + Hindi. 14 days free.",
    keywords: [
      "doctor ai",
      "ai for doctors",
      "doctor appointment whatsapp",
      "doctor appointment booking app india",
      "ai assistant for doctors",
      "whatsapp bot for doctors",
      "online doctor appointment system",
    ],
    h1: "Your practice, minus the appointment phone calls",
    intro:
      "You went to medical school to see patients, not to manage a booking diary. Footfall runs your appointment book on the number patients already message: it fills your OPD sessions, spaces slots the way you want, reminds patients, and hands you a clean day sheet every morning.",
    pains: [
      {
        title: "Solo practice, full inbox",
        body: "No receptionist? Footfall is one — answering every appointment request while you're in consultation.",
      },
      {
        title: "Your rules, your slots",
        body: "15-minute consults, a lunch block, Thursdays off — Footfall offers only the slots you'd offer yourself.",
      },
      {
        title: "Patients who forget",
        body: "Automatic reminders cut no-shows, and missed patients get a gentle rebooking nudge — not silence.",
      },
      {
        title: "The morning digest",
        body: "Wake up to a WhatsApp summary of today's list: who's coming, when, and for what.",
      },
    ],
    chat: [
      { from: "customer", text: "Doctor available today?" },
      { from: "footfall", text: "Yes — Dr. Sharma has 5:30 pm and 6:15 pm open today (consultation ₹400). Shall I book one for you?" },
      { from: "customer", text: "6:15 please, for my father" },
      { from: "footfall", text: "Booked ✅ Today 6:15 pm. Please bring any previous reports. A reminder will arrive at 4:15 pm." },
    ],
    faqs: [
      {
        q: "I practice alone — is this overkill?",
        a: "It's built for exactly that. Footfall is the receptionist a solo practice can't hire: ₹1,499/month, working 24×7.",
      },
      {
        q: "Can patients cancel or reschedule?",
        a: "Yes, in the same chat — and the freed slot is offered to your waitlist automatically.",
      },
      {
        q: "What about medical questions?",
        a: "Footfall doesn't give medical advice. Anything beyond scheduling is handed to you with an alert, so patients are never left with an AI answer they shouldn't get.",
      },
      {
        q: "Does it speak Hindi?",
        a: "English, Hindi and Hinglish — it matches the patient's language automatically.",
      },
    ],
  },
  {
    slug: "dentists",
    name: "Dentists",
    singular: "dental clinic",
    title: "Dentist AI — WhatsApp booking for dental clinics | Footfall",
    description:
      "Footfall is the dental clinic AI on WhatsApp: books cleanings, RCT sittings and consultations into chair-time, answers fee questions, reminds patients and recovers no-shows. 14 days free.",
    keywords: [
      "dentist ai",
      "dental ai",
      "ai for dental clinic",
      "dental appointment whatsapp",
      "dental clinic booking software india",
      "ai receptionist for dentist",
    ],
    h1: "Fill your chair time, not your phone time",
    intro:
      "Dentistry runs on chair-time — and every unanswered WhatsApp is an empty chair. Footfall answers instantly, books the right length slot for the right procedure, handles multi-sitting treatments like RCTs, and reminds patients so your schedule holds.",
    pains: [
      {
        title: "Procedures need different slots",
        body: "A cleaning is 30 minutes; an RCT sitting is 60. Footfall books the correct duration for each service so your day actually fits.",
      },
      {
        title: "Multi-visit treatments",
        body: "After each sitting, Footfall books the next one before the patient forgets — keeping treatment plans on track.",
      },
      {
        title: "Fee questions all day",
        body: "\"Scaling kitne ka hai?\" answered instantly with your real prices — no receptionist interrupted mid-procedure.",
      },
      {
        title: "The anxious no-show",
        body: "Dental no-shows are often nerves. A friendly reminder plus an easy reschedule keeps patients engaged instead of vanishing.",
      },
    ],
    chat: [
      { from: "customer", text: "Tooth pain, can I come today?" },
      { from: "footfall", text: "Sorry to hear that! Dr. Kapoor can see you today at 4:30 pm or 7:00 pm (consultation ₹300). Which one shall I book?" },
      { from: "customer", text: "4:30" },
      { from: "footfall", text: "Booked ✅ Today 4:30 pm with Dr. Kapoor. If the pain worsens before then, reply here and we'll inform the doctor." },
    ],
    faqs: [
      {
        q: "Can it book different durations per procedure?",
        a: "Yes — every service has its own duration and price, and Footfall books exactly that much chair-time.",
      },
      {
        q: "Can it handle two dentists and a hygienist?",
        a: "Each practitioner gets their own calendar and working hours; patients land with the right person.",
      },
      {
        q: "What about emergencies?",
        a: "Urgent messages are flagged to your team immediately — the AI books what it can and escalates what it shouldn't handle.",
      },
      {
        q: "How fast is setup?",
        a: "About a day, done for you — services, fees, practitioners and hours.",
      },
    ],
  },
  {
    slug: "hospitals",
    name: "Hospitals",
    singular: "hospital",
    title: "Hospital AI — WhatsApp appointment desk for hospitals | Footfall",
    description:
      "Footfall is the hospital AI that runs OPD appointment booking on WhatsApp: multi-department, multi-doctor scheduling with reminders, waitlists and staff hand-off. 24×7, multilingual. 14 days free.",
    keywords: [
      "hospital ai",
      "ai for hospitals",
      "hospital appointment booking whatsapp",
      "opd booking software india",
      "hospital whatsapp chatbot",
      "ai receptionist for hospital",
    ],
    h1: "An OPD appointment desk that never has a queue",
    intro:
      "Your OPD desk fields hundreds of calls a day that are really one question: \"when can the doctor see me?\" Footfall answers it on WhatsApp — across departments and doctors — books the visit, reminds the patient, and hands anything sensitive straight to your staff.",
    pains: [
      {
        title: "Many doctors, many schedules",
        body: "Each consultant's OPD days and timings live in one system. Patients are booked to the right doctor's real availability — no calls, no queue at the desk.",
      },
      {
        title: "Missed OPD visits",
        body: "Reminders before every appointment and rebooking nudges after misses keep your OPD utilisation high.",
      },
      {
        title: "Staff stay in control",
        body: "Your front office sees every conversation and can take over any chat instantly — the AI pauses and resumes around them.",
      },
      {
        title: "Language mix",
        body: "Patients write in Hindi, English or Hinglish. Footfall answers in kind, so no one is turned away by language.",
      },
    ],
    chat: [
      { from: "customer", text: "Ortho doctor kab milenge?" },
      { from: "footfall", text: "Orthopaedics OPD: Dr. Singh — Mon/Wed/Fri 10 am–1 pm. Is Wednesday 10:30 am theek rahega? (Consultation ₹600)" },
      { from: "customer", text: "Haan theek hai" },
      { from: "footfall", text: "Booked ✅ Wednesday 10:30 am, Orthopaedics, Dr. Singh. Please carry previous X-rays if any. Reminder aayega." },
    ],
    faqs: [
      {
        q: "Can it handle multiple departments?",
        a: "Yes — departments, consultants, OPD days and fees are all modelled, and patients are routed to the right schedule.",
      },
      {
        q: "Does it replace our front office?",
        a: "It removes the repetitive appointment traffic. Your staff see everything and take over any conversation with one tap.",
      },
      {
        q: "Is it compliant with patient privacy?",
        a: "Data stays in your secured account with role-based access. Footfall never shares or sells patient information.",
      },
      {
        q: "Can we broadcast health camps or offers?",
        a: "Yes — opt-in WhatsApp broadcasts with images go to your patient list, and STOP opt-outs are handled automatically.",
      },
    ],
  },
  {
    slug: "gyms",
    name: "Gyms",
    singular: "gym",
    title: "Gym AI — WhatsApp assistant for gyms & fitness studios | Footfall",
    description:
      "Footfall is the gym AI on WhatsApp: books trial sessions and PT slots, answers membership questions instantly, reminds members and wins back the ones who drift. 24×7. 14 days free.",
    keywords: [
      "gym ai",
      "ai for gym",
      "gym membership whatsapp bot",
      "fitness studio booking app india",
      "personal training booking whatsapp",
      "ai receptionist for gym",
    ],
    h1: "Turn every \"fees kitni hai?\" into a walk-in",
    intro:
      "Every gym's WhatsApp is a stream of \"fees?\", \"timings?\", \"trial hai?\" — and every slow reply is a member joining the gym next door. Footfall answers in seconds, books trial sessions and PT slots, and keeps your floor full with reminders and win-backs.",
    pains: [
      {
        title: "The fees question, 50× a day",
        body: "Membership plans, PT rates, timings — answered instantly and consistently, with a trial booking offered in the same breath.",
      },
      {
        title: "Trials that convert",
        body: "A fast reply + a booked trial slot is the highest-converting sales motion a gym has. Footfall does it 24×7.",
      },
      {
        title: "PT scheduling",
        body: "Each trainer's sessions live on their own calendar — members book, reschedule and get reminded without you playing coordinator.",
      },
      {
        title: "Winning back ghosts",
        body: "Broadcast offers to lapsed members and let Footfall handle every reply that comes back.",
      },
    ],
    chat: [
      { from: "customer", text: "Monthly fees kitni hai? Trial milega?" },
      { from: "footfall", text: "Monthly ₹1,800 · Quarterly ₹4,500 · Yearly ₹15,000. Free trial session milta hai — kal 7 am ya 6 pm free hai. Book karun?" },
      { from: "customer", text: "Kal 6 pm" },
      { from: "footfall", text: "Done ✅ Trial session tomorrow 6:00 pm. Carry sports shoes & a towel. See you on the floor 💪" },
    ],
    faqs: [
      {
        q: "Can it book personal training?",
        a: "Yes — each trainer has their own calendar, and members book PT sessions against real availability.",
      },
      {
        q: "Does it manage memberships?",
        a: "It answers plan and pricing questions and books sessions. Billing and access control stay with your existing system.",
      },
      {
        q: "Can I send offers to all members?",
        a: "One tap sends an opt-in WhatsApp broadcast (image included) to your whole list — Footfall handles the replies.",
      },
      {
        q: "What does it cost?",
        a: "₹1,499/month after 14 days free — less than one monthly membership.",
      },
    ],
  },
  {
    slug: "physiotherapy",
    name: "Physiotherapy",
    singular: "physiotherapy practice",
    title: "Physiotherapy AI — WhatsApp booking for physio clinics | Footfall",
    description:
      "Footfall is the physiotherapy clinic AI on WhatsApp: books assessment and therapy sessions, keeps multi-week treatment plans on schedule with reminders, and recovers missed sessions. 14 days free.",
    keywords: [
      "physiotherapy ai",
      "physio clinic booking whatsapp",
      "ai for physiotherapist",
      "physiotherapy appointment app india",
      "rehab clinic booking software",
    ],
    h1: "Keep every treatment plan on schedule",
    intro:
      "Physio outcomes depend on patients showing up — session after session, week after week. Footfall books the full journey on WhatsApp: the first assessment, the recurring sessions, the reminders that keep adherence high, and the nudge when someone falls off the plan.",
    pains: [
      {
        title: "Recurring sessions",
        body: "Tue/Thu 6 pm for six weeks — booked in one conversation, reminded every time, rescheduled painlessly when life happens.",
      },
      {
        title: "Adherence is the outcome",
        body: "Missed sessions stall recovery. Reminders and same-chat rescheduling keep patients on plan — and your outcomes strong.",
      },
      {
        title: "Assessment vs therapy slots",
        body: "First visits need longer. Footfall books the right duration for the right visit type automatically.",
      },
      {
        title: "Therapist-wise calendars",
        body: "Patients stay with their therapist across the plan; each therapist's day stays conflict-free.",
      },
    ],
    chat: [
      { from: "customer", text: "Back pain — physio session book karna hai" },
      { from: "footfall", text: "Sure. First visit is a 45-min assessment (₹700). Tomorrow 11 am or 5:30 pm available — which works?" },
      { from: "customer", text: "5:30" },
      { from: "footfall", text: "Booked ✅ Tomorrow 5:30 pm, assessment with Dr. Iyer. Wear comfortable clothing. Reminder will come 2 hours before." },
    ],
    faqs: [
      {
        q: "Can it schedule a whole treatment plan?",
        a: "Yes — recurring sessions are booked and reminded automatically, and missed ones trigger a rebooking nudge.",
      },
      {
        q: "Different durations for assessment vs follow-up?",
        a: "Each visit type has its own duration and price; the calendar always fits.",
      },
      {
        q: "Can patients reschedule?",
        a: "In the same chat, instantly — the freed slot goes to your waitlist.",
      },
      {
        q: "How do I take over a conversation?",
        a: "One tap in the Footfall app pauses the AI on that chat; you reply from the same number.",
      },
    ],
  },
  {
    slug: "yoga-studios",
    name: "Yoga studios",
    singular: "yoga studio",
    title: "Yoga studio AI — WhatsApp booking for yoga & pilates | Footfall",
    description:
      "Footfall is the yoga studio AI on WhatsApp: fills class slots and trials, answers schedule questions instantly, reminds students and keeps your batches full. 24×7. 14 days free.",
    keywords: [
      "yoga studio ai",
      "yoga class booking whatsapp",
      "ai for yoga studio",
      "yoga studio software india",
      "pilates studio booking app",
    ],
    h1: "Full batches, calm mornings",
    intro:
      "Your students message about batch timings while you're mid-asana. Footfall answers instantly — schedules, fees, trial classes — books students into batches with real capacity, and reminds them so your 6 am batch is actually full at 6 am.",
    pains: [
      {
        title: "Batch timing questions",
        body: "\"Morning batch kab hai?\" answered instantly with your live schedule — and a trial class booked in the same conversation.",
      },
      {
        title: "Capacity-aware booking",
        body: "Twelve mats means twelve students. Footfall fills to capacity and waitlists the rest — no overcrowded classes.",
      },
      {
        title: "Trial-to-member",
        body: "Fast replies convert curiosity into a trial, and a reminder makes sure they actually come — the moment that makes a member.",
      },
      {
        title: "Workshops & retreats",
        body: "Broadcast your next workshop to every student with one tap; Footfall handles the flood of \"am I in?\" replies.",
      },
    ],
    chat: [
      { from: "customer", text: "Morning yoga batch timing?" },
      { from: "footfall", text: "Morning batches: 6 am & 7:30 am (Mon–Sat), ₹2,000/month. Free trial class available — tomorrow 7:30 am book kar doon?" },
      { from: "customer", text: "Yes please" },
      { from: "footfall", text: "Booked ✅ Trial class tomorrow 7:30 am with Anjali. Carry a mat & water. Namaste 🙏" },
    ],
    faqs: [
      {
        q: "Can it cap class sizes?",
        a: "Yes — every batch has a capacity, and Footfall waitlists students once it's full.",
      },
      {
        q: "Does it handle monthly memberships?",
        a: "It answers plan questions and books classes and trials; payments stay with your current setup.",
      },
      {
        q: "Can I announce workshops?",
        a: "Broadcast to your whole student list (with an image) in one tap — replies are handled automatically.",
      },
      {
        q: "What languages does it support?",
        a: "English, Hindi and Hinglish, matched to the student.",
      },
    ],
  },
  {
    slug: "beauty-parlours",
    name: "Beauty parlours",
    singular: "beauty parlour",
    title: "Beauty parlour AI — WhatsApp booking for parlours | Footfall",
    description:
      "Footfall is the beauty parlour AI on WhatsApp: books facials, waxing, mehendi and bridal packages into your team's day, answers price questions instantly, and chases no-shows. 14 days free.",
    keywords: [
      "beauty parlour ai",
      "parlour booking app india",
      "beauty parlour whatsapp booking",
      "ai for beauty parlour",
      "bridal booking software",
      "mehendi booking whatsapp",
    ],
    h1: "Your parlour's WhatsApp, answered while your hands are busy",
    intro:
      "Threading a brow, mid-facial, mehendi cone in hand — you can't reply, but customers can't wait. Footfall answers every price and timing question instantly, books services into your team's real day, and fills your bridal season without a single missed message.",
    pains: [
      {
        title: "Price lists on demand",
        body: "Waxing, facial, mehendi, bridal — every \"kitne ka?\" answered with your exact menu, instantly.",
      },
      {
        title: "Bridal season chaos",
        body: "Long bridal packages block the right staff for the right hours — no double-booked Sundays in wedding season.",
      },
      {
        title: "Walk-in + WhatsApp balance",
        body: "The calendar sees both, so WhatsApp bookings never collide with the customer already in the chair.",
      },
      {
        title: "Festival broadcasts",
        body: "Diwali offer? One tap sends it (image and all) to every customer — and Footfall books everyone who replies.",
      },
    ],
    chat: [
      { from: "customer", text: "Karwa chauth mehendi booking chal rahi hai?" },
      { from: "footfall", text: "Haan! Mehendi (both hands) ₹1,500 — us din 11 am, 2 pm ya 4:30 pm slots hain. Kaunsa book karun?" },
      { from: "customer", text: "2 pm" },
      { from: "footfall", text: "Done ✅ Karwa chauth, 2:00 pm mehendi with Pooja. Reminder aayega ek din pehle. 🌸" },
    ],
    faqs: [
      {
        q: "Can it handle bridal packages?",
        a: "Yes — packages with long durations and specific staff are booked correctly, and deposits/notes are captured in the booking.",
      },
      {
        q: "Hindi mein chalega?",
        a: "Bilkul — Footfall replies in Hindi, English or Hinglish, whichever the customer uses.",
      },
      {
        q: "What about my regulars?",
        a: "Footfall remembers each customer's history and preferences, and nudges them when they're due for their usual service.",
      },
      {
        q: "How do offers work?",
        a: "Opt-in WhatsApp broadcasts with images go to your whole list; STOP opt-outs are automatic.",
      },
    ],
  },
  {
    slug: "tattoo-studios",
    name: "Tattoo studios",
    singular: "tattoo studio",
    title: "Tattoo studio AI — WhatsApp booking & consults | Footfall",
    description:
      "Footfall is the tattoo studio AI on WhatsApp: books consults and sessions, answers pricing questions, manages artist calendars and deposits notes — while you keep the machine running. 14 days free.",
    keywords: [
      "tattoo studio ai",
      "tattoo booking whatsapp",
      "tattoo appointment app india",
      "ai for tattoo studio",
      "tattoo artist booking software",
    ],
    h1: "Book sessions while the machine is buzzing",
    intro:
      "You can't answer DMs mid-session, and \"how much for a half sleeve?\" deserves better than a next-day reply. Footfall handles first contact: pricing guidance, consult bookings, session scheduling per artist, and reminders that keep clients from ghosting a four-hour slot.",
    pains: [
      {
        title: "Consult first, ink second",
        body: "Footfall books a consult for custom work and a session for flash — each with the right duration and artist.",
      },
      {
        title: "Four-hour no-shows hurt",
        body: "Long sessions are expensive to lose. Reminders (and your deposit policy, stated up front) protect the day.",
      },
      {
        title: "Artist-specific books",
        body: "Clients want a specific artist's style. Each artist's calendar and days are modelled — bookings land with the right person.",
      },
      {
        title: "Aftercare questions",
        body: "Standard aftercare answered instantly; anything unusual is flagged to the artist immediately.",
      },
    ],
    chat: [
      { from: "customer", text: "Half sleeve ka approx price?" },
      { from: "footfall", text: "Custom half sleeves start around ₹15,000 depending on design (final quote after a free 20-min consult). Consult slots: Sat 1 pm or Sun 3 pm — book one?" },
      { from: "customer", text: "Sunday 3" },
      { from: "footfall", text: "Booked ✅ Sunday 3:00 pm consult with Arjun. Bring reference images if you have them. 🖤" },
    ],
    faqs: [
      {
        q: "Can it quote tattoo prices?",
        a: "It shares your starting prices and ranges, and books a consult for the final quote — exactly how studios already work.",
      },
      {
        q: "Deposits?",
        a: "Footfall states your deposit policy up front and records it against the booking; collection stays with your payment setup.",
      },
      {
        q: "Multiple artists?",
        a: "Each artist has their own calendar, working days and session lengths.",
      },
      {
        q: "Can I take over a conversation?",
        a: "One tap — the AI pauses on that chat and you talk to the client directly.",
      },
    ],
  },
  {
    slug: "barbershops",
    name: "Barbershops",
    singular: "barbershop",
    title: "Barbershop AI — WhatsApp booking for barbers | Footfall",
    description:
      "Footfall is the barbershop AI on WhatsApp: books cuts and shaves into each barber's chair, kills the waiting crowd, reminds customers and fills quiet hours. 24×7. 14 days free.",
    keywords: [
      "barbershop ai",
      "barber booking app india",
      "barber shop whatsapp booking",
      "ai for barbershop",
      "mens salon booking app",
    ],
    h1: "No more \"kitna time lagega?\" — just booked chairs",
    intro:
      "The waiting bench is where customers change their minds. Footfall replaces it with booked slots: customers pick a time and a barber on WhatsApp, get reminded, and walk in when their chair is actually free. Your day flows; nobody walks out.",
    pains: [
      {
        title: "The waiting-bench problem",
        body: "Booked slots instead of a queue — customers show up on time, to a free chair, in a better mood.",
      },
      {
        title: "Regulars and their barber",
        body: "\"Sameer bhai se hi\" — Footfall knows, and books exactly that chair.",
      },
      {
        title: "Dead Tuesday afternoons",
        body: "Broadcast a weekday offer to every customer with one tap; Footfall books the replies straight into the quiet hours.",
      },
      {
        title: "Speed matters",
        body: "A haircut is a 20-minute decision. The instant reply wins the customer — every single time.",
      },
    ],
    chat: [
      { from: "customer", text: "Haircut + beard, abhi slot hai?" },
      { from: "footfall", text: "Haan! Haircut + beard (₹350, 40 min) — 5:20 pm with Sameer ya 5:40 pm with Raju. Kaunsa?" },
      { from: "customer", text: "Sameer 5:20" },
      { from: "footfall", text: "Done ✅ 5:20 pm, haircut + beard with Sameer. Seedha aa jao — chair ready milegi. ✂️" },
    ],
    faqs: [
      {
        q: "My customers just walk in — will this work?",
        a: "Walk-ins still work; you add them in one tap. WhatsApp bookings fill the gaps around them, so the day stays smooth.",
      },
      {
        q: "Per-barber booking?",
        a: "Yes — each barber has a chair calendar, and regulars get their guy every time.",
      },
      {
        q: "Is it hard to set up?",
        a: "We do it for you in a day: services, prices, barbers, hours. Nothing changes for your customers.",
      },
      {
        q: "Cost?",
        a: "₹1,499/month after 14 days free — about ten haircuts.",
      },
    ],
  },
];

export const getVertical = (slug: string) => VERTICALS.find((v) => v.slug === slug);
