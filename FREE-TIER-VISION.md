# HubForge OS - What to build for users with NO money, NO tech, NO M&E expertise

## The constraint reset

- No voice (needs expensive models, bandwidth)
- No expensive AI (users can't afford OpenAI/Claude)
- No laptops required (many only have phones)
- No training (users don't know what a logframe is)
- No consultants ($2000 is a month's salary)
- No software licenses (everything free)
- No complex setup (no API keys for non-technical users)

## What users DO have

- A basic Android phone (or shared laptop)
- Intermittent 2G/3G internet
- WhatsApp (everyone has it)
- A phone camera
- Their brain and experience
- The free Z.ai shared AI (or free Groq tier)

## The 5 things to build that need ZERO money and ZERO tech skills

### 1. SMART TEMPLATES (free, instant, offline)

**The problem:** Users don't know where to start. A blank screen is terrifying.

**The solution:** Pre-built program templates that are 90% complete.
User picks "Literacy Program" → gets:
- Full ToC with standard TaRL approach (pre-filled, editable)
- Logframe with 5 standard FLN indicators (EGRA-aligned)
- Budget template with percentage allocations
- Risk register with common risks pre-listed
- Data collection plan (baseline/midline/endline)

No AI call needed. No internet needed. Instant.
User just changes "[LOCATION]", "[NUMBER]", "[BUDGET]".

**Cost: $0** (no LLM call - templates are static JSON)
**Tech: zero** (just click and edit)
**M&E knowledge: zero** (the template IS the expertise)

### 2. PLAIN LANGUAGE INTERFACE (free, uses shared Z.ai)

**The problem:** Users don't know M&E jargon. "Logframe" means nothing.

**The solution:** HubForge speaks human, not M&E.

Instead of: "Define your Objectively Verifiable Indicators"
Say: "How will you know if this program is working? What number will you check?"

Instead of: "Theory of Change"
Say: "If we do X, then Y will happen, leading to Z. Fill in X, Y, Z."

Instead of: "Baseline and target values"
Say: "Where are things now? (e.g. 15% of kids can read) Where do you want to be? (e.g. 45%)"

The AI translates between plain language and proper M&E terminology.
The user sees plain language. The output (export) is proper M&E format.

**Cost: $0** (uses shared Z.ai free tier)
**Tech: zero** (just type in your own words)
**M&E knowledge: zero** (HubForge translates)

### 3. WHATSAPP UPDATES (free, uses what they already have)

**The problem:** Monitoring data never gets collected because field 
workers won't use complex apps.

**The solution:** Field workers send WhatsApp messages.
HubForge parses them into structured data.

```
Field worker WhatsApp: "Trained 12 teachers today at 
St. Mary's School. 2 absent due to illness. Distributed 
50 textbooks."

HubForge parses →
  Activity: Teacher training
  Location: St. Mary's School
  Date: [auto from message timestamp]
  Output: 12 teachers trained, 50 textbooks distributed
  Issue: 2 absent (illness) → logged in risk register
  Indicator update: "Teachers trained" = 12 (cumulative: 47/60)
```

This uses the **free WhatsApp Business API** (1,000 conversations/month free).
Or even simpler: users forward messages to a HubForge WhatsApp number.

**Cost: $0** (WhatsApp Business API free tier, shared Z.ai for parsing)
**Tech: zero** (they already use WhatsApp)
**M&E knowledge: zero** (just report what happened)

### 4. ONE-CLICK DONOR REPORTS (free, auto-generated)

**The problem:** Donor reporting is the #1 time sink. NGOs spend 
2-3 weeks per quarter writing reports.

**The solution:** HubForge auto-generates donor reports from 
the data it already has.

User clicks "Generate Q3 Report for USAID" →
HubForge assembles:
- Executive summary (from program description + progress data)
- Results table (indicators: baseline, target, actual, % complete)
- Activities this quarter (from WhatsApp updates / monitoring data)
- Challenges (from risk register)
- Photos (from field submissions, if any)
- Budget summary (from budget tracker)
- Next quarter plan (from implementation timeline)

All in USAID's format. User reviews, edits, downloads as Word/PDF.

**Cost: $0** (uses shared Z.ai to write the narrative)
**Tech: zero** (one click)
**M&E knowledge: zero** (HubForge knows the format)

### 5. LESSONS LOG (free, dead simple)

**The problem:** NGOs repeat mistakes because lessons are never documented.

**The solution:** A simple log. Two boxes:

```
┌──────────────────────────────────┐
│  What worked well this month?    │
│  ┌──────────────────────────────┐│
│  │ (type here)                  ││
│  └──────────────────────────────┘│
│                                  │
│  What didn't work?               │
│  ┌──────────────────────────────┐│
│  │ (type here)                  ││
│  └──────────────────────────────┘│
│                                  │
│  [Save lesson]                   │
└──────────────────────────────────┘
```

That's it. Two text boxes. No categories, no tags, no complexity.
The AI auto-categorizes and tags the lesson.

When the user designs their next program, HubForge surfaces:
"Last time you ran a literacy program, you noted: 'Teacher 
attrition was 40% - train extra teachers.' Want me to add 
this to the risk register?"

**Cost: $0** (no LLM needed for logging - just localStorage)
**Tech: zero** (type in two boxes)
**M&E knowledge: zero** (just answer two questions)

## HOW THESE 5 CONNECT (the pipeline)

```
Template (free, instant)
    ↓ user fills in blanks
Plain Language Design (free Z.ai)
    ↓ generates ToC, Logframe, Indicators
WhatsApp Monitoring (free WhatsApp)
    ↓ field workers report what happened
One-Click Reports (free Z.ai)
    ↓ auto-generates donor reports
Lessons Log (free, localStorage)
    ↓ feeds back into next program
```

Total cost for the user: **$0**
Total tech skills needed: **can use WhatsApp and type in a text box**
Total M&E knowledge needed: **zero** (HubForge is the expert)

## WHAT NOT TO BUILD (saves money and complexity)

| Feature | Why not |
|---------|---------|
| Voice input | Needs expensive models, bandwidth, doesn't work in noisy fields |
| Real-time dashboards | Needs constant internet, expensive hosting |
| Kobo/CommCare integrations | Complex APIs, each needs separate setup |
| Predictive analytics | Needs large datasets that small NGOs don't have |
| Custom pipeline builder | Too complex for non-technical users |
| Multi-language UI | Expensive to translate, English + plain language is enough for v1 |
| Mobile app (native) | PWA works on all phones, no app store needed |

## THE FREE TIER ECONOMICS

| What | Cost | Who pays |
|------|------|----------|
| Z.ai shared AI | Free | HubForge (shared key) |
| Groq free tier | Free (6,000 req/day) | User's own key (free) |
| WhatsApp Business API | Free (1,000 conversations/month) | HubForge |
| Vercel hosting | Free (100GB bandwidth) | HubForge |
| Supabase database | Free (500MB, 50k users) | HubForge |
| PWA (offline) | Free | Browser handles it |
| Templates | Free | Static JSON, no compute |

**A small NGO can run their entire MEL on HubForge for $0/month.**

When they grow (need more AI calls, more WhatsApp conversations), 
they get a free Z.ai key (also $0) or a free Groq key ($0).

Only when they need heavy usage (100+ programs, frequent AI calls) 
would they need a paid provider ($5-20/month for OpenAI).

## WHAT TO BUILD THIS WEEK

### Day 1-2: Smart Templates
- Wire the 5 existing templates into the dashboard
- User picks template → 90% complete draft appears instantly
- User edits placeholders ([NUMBER], [LOCATION])
- No AI call needed - instant

### Day 3-4: Plain Language Mode
- Add a "plain language" toggle to General Mode
- When on: prompts use plain English instead of M&E jargon
- "How will you know if this is working?" instead of "Define indicators"
- The AI still produces proper M&E output (ToC, Logframe) - 
  the user just doesn't see the jargon

### Day 5: Lessons Log
- Simple component: two text boxes (what worked / what didn't)
- Save to localStorage
- When designing next program, surface relevant past lessons
- No AI needed for logging

### Day 6-7: One-Click Reports
- Report template (executive summary + results table + activities + challenges)
- Pull data from program (draft, evaluation, feedback history)
- Generate narrative with shared Z.ai
- Export as Word/PDF
- One button: "Generate Report"

### Day 8-10: WhatsApp Integration (Phase 2)
- WhatsApp Business API setup
- Parse incoming messages into structured data
- Update monitoring dashboard
- This is the most complex piece - needs a mini-service

## THE PITCH (for users with no money)

"HubForge OS is free. Forever. No subscriptions, no per-user fees, 
no hidden costs. You get:
- Program templates (instant start)
- Strategy design (AI-powered, plain language)
- Monitoring (via WhatsApp - no new app to learn)
- Donor reports (one click, auto-generated)
- Lessons log (never repeat a mistake)

No tech skills needed. No M&E training needed. No money needed.
Just describe what you're doing, and HubForge handles the rest."
