# HubForge OS - Product Gap Analysis
# From the perspective of: NGO Program Officer + Systems Thinker + Product Designer

## Executive Summary

HubForge OS today is a **single-shot strategy generator**. An NGO program officer 
needs a **workspace** that manages multiple programs, reuses organizational 
context, adapts to their skill level, and improves over time. The gap between 
"generates a good strategy" and "an NGO uses it daily" is about 15 features, 
organized below by priority.

---

## 1. ORGANIZATION CONTEXT LAYER (CRITICAL - missing entirely)

### The problem
Every time an NGO user types a problem, they re-enter context that never changes:
- "We are an NGO called X working in Y country since Z"
- "Our mission is..."
- "Our donors are USAID, FCDO, and the Gates Foundation"
- "We work in 3 districts of northern Kenya"
- "Our team has 15 staff, 3 M&E officers"
- "Our last program showed X results"

This is **organizational identity** - it should be set once and auto-included.

### What to build

**Organization Profile (set once, used everywhere):**

```
Organization Setup (one-time, 5 minutes):
  - Organization name: "Rural Education Action Program (REAP)"
  - Type: NGO / INGO / CBO / Foundation / Government / Social Enterprise
  - Registration country: Kenya
  - Operating countries: Kenya, Uganda, Tanzania
  - Operating geographies: Northern Kenya (Marsabit, Turkana, Samburu)
  - Sectors: Education, Livelihoods, WASH
  - Mission statement: "To improve access to quality education for 
    marginalized children in arid and semi-arid lands"
  - Team size: 15
  - M&E capacity: 3 dedicated M&E officers
  - Annual budget range: $500K - $2M
  - Key donors: USAID, FCDO, Conrad N. Hilton Foundation
  - Reporting frameworks used: USAID ADS, FCDO AMR, Logframe
  - Languages of operation: English, Swahili, local languages
  - Past program results: [upload or paste 2-3 key outcomes]
```

**How it works in the reasoning loop:**
- When the user types "Design a literacy program in Marsabit", the system 
  already knows: this is REAP, working in Marsabit since 2015, with 3 M&E 
  officers, reporting to USAID
- The Supervisor Engine receives org context automatically
- The Web Search Engine targets the right geography
- The Reasoning Engine aligns to the right donor framework
- The Evaluation Engine checks against org-specific standards

**Data model:**
```
organization_profile (stored in Supabase, linked to user)
  - id, name, type, countries, geographies, sectors
  - mission, team_size, me_capacity, budget_range
  - donors, reporting_frameworks, languages
  - past_results (JSON array of {program, outcome, year})
  - created_at, updated_at
```

**UI:**
- First-run onboarding: after profile setup, "Tell us about your organization"
- Settings > Organization: edit anytime
- Badge in header: "REAP" (click to view/edit org profile)
- When generating: "Using REAP organization context" indicator

---

## 2. PROGRAM WORKSPACES (CRITICAL - missing entirely)

### The problem
An NGO program officer manages 3-5 programs simultaneously:
- A $50K pilot in Turkana
- A $2M USAID program across 3 counties
- A $200K foundation grant in Marsabit
- An emergency response in Samburu

Today, HubForge treats every problem as independent. There's no way to:
- Save a program and come back to it
- See all programs in one dashboard
- Copy a program's strategy as a starting point for another
- Track which programs are draft vs. submitted vs. funded

### What to build

**Program Dashboard (the home page for NGO users):**

```
My Programs
+----------------------------------------------+
| [New Program]                                 |
|                                               |
| Active (3)                                    |
| +------------------+ +------------------+    |
| | Turkana Literacy | | Marsabit WASH    |    |
| | Draft - Score 82 | | Submitted - 91   |    |
| | USAID - $50K     | | FCDO - $200K     |    |
| | Updated 2h ago   | | Updated 3d ago   |    |
| +------------------+ +------------------+    |
|                                               |
| Funded (1)                                    |
| +------------------+                          |
| | Samburu Emergency|                          |
| | Funded - 87     |                          |
| | ECHO - $500K    |                          |
| | Updated 1w ago  |                          |
| +------------------+                          |
+----------------------------------------------+
```

**Each program workspace contains:**
- Problem statement (editable)
- Strategy document (versioned)
- Theory of Change (editable)
- Logframe (editable)
- Evaluation plan
- Budget allocation
- Risk register
- Timeline/Gantt
- Feedback history (all iterations)
- Status: Draft / In Review / Submitted / Funded / Active / Closed
- Tags: donor name, geography, sector, year
- Linked programs (same geography, same donor, same sector)

**Data model:**
```
programs (stored in Supabase)
  - id, org_id, name, status
  - problem, strategy, toc, logframe, evaluation_plan
  - budget, timeline, risks
  - donor, geography, sector, budget_range
  - created_at, updated_at, submitted_at
  - feedback_history (JSON array)
  - linked_program_ids (array)
```

**UI flow:**
1. Dashboard shows all programs (card grid, filterable by status/donor/sector)
2. Click a program -> opens the workspace (strategy, ToC, logframe tabs)
3. "New Program" -> choose: blank / copy from existing / from template
4. "Duplicate" -> copies strategy as starting point for a new program
5. All changes auto-save (no save button - like Google Docs)

---

## 3. CONTEXT REUSE ACROSS PROGRAMS (HIGH - missing entirely)

### The problem
An NGO working in Marsabit runs 5 programs over 3 years. Each time they 
design a new program, they re-research the same context:
- Marsabit demographics (poverty rate, literacy rate, school enrollment)
- Previous programs in Marsabit (what worked, what failed)
- Local government structure (county government, Ministry of Education)
- Cultural context (pastoralist communities, seasonal migration)
- Infrastructure (road access, connectivity, school density)

This is **geographic context** that should be saved once and reused.

### What to build

**Context Blocks (saveable, reusable knowledge):**

```
Context Blocks:
  +----------------------------------------------+
  | Geography: Marsabit County, Kenya             |
  | Saved: demographic data, government structure,|
  | previous programs, cultural context           |
  | Used in: 3 programs                           |
  | Last updated: 2 weeks ago                     |
  | [Edit] [Use in new program]                   |
  +----------------------------------------------+
  
  +----------------------------------------------+
  | Donor: USAID                                  |
  | Saved: reporting requirements, indicator      |
  | framework, logframe template, past proposals  |
  | Used in: 4 programs                           |
  | [Edit] [Use in new program]                   |
  +----------------------------------------------+
  
  +----------------------------------------------+
  | Sector: Foundation Literacy                   |
  | Saved: NIPUN Bharat guidelines, ASER data,    |
  | TaRL evidence, FLN best practices             |
  | Used in: 2 programs                           |
  | [Edit] [Use in new program]                   |
  +----------------------------------------------+
```

**Types of context blocks:**
1. **Geography blocks** - country/district demographics, infrastructure, governance
2. **Donor blocks** - reporting requirements, templates, indicator frameworks
3. **Sector blocks** - best practices, evidence, standards
4. **Organization blocks** - past results, team capacity, partnerships
5. **Stakeholder blocks** - government partners, community structures, local NGOs

**How it works:**
- When generating a strategy, the system auto-loads matching context blocks
- User sees: "Using context: Marsabit geography + USAID donor + Education sector"
- User can add/remove blocks for this specific program
- New research from Web Search is saved to the geography block automatically
- Next program in Marsabit starts with all this context pre-loaded

**UI:**
- Sidebar or tab: "Context Blocks"
- Each block is a card with: name, type, last updated, "used in X programs"
- Drag blocks into a program workspace
- "Save as context block" button on any research output

---

## 4. SKILL-ADAPTIVE INTERFACE (HIGH - missing entirely)

### The problem
HubForge OS assumes all users have the same expertise level. In reality:

| User type | What they need |
|-----------|---------------|
| Program officer (no M&E background) | Plain language, guided wizard, explanations of jargon |
| M&E specialist | Advanced options, indicator customization, evaluation design control |
| Country director | Executive summary view, high-level dashboard, approval workflow |
| Finance manager | Budget breakdown, cost per beneficiary, value for money analysis |
| Field coordinator | Implementation timeline, resource allocation, risk mitigation |
| Consultant | Multiple programs, client management, template library |

### What to build

**Role-based interface (set during onboarding, adjustable in settings):**

```
Onboarding: "What's your role?"
  - Program Officer (guided mode, plain language)
  - M&E Specialist (advanced mode, full control)
  - Director (executive mode, summary view)
  - Consultant (multi-client mode)
  - Other (custom)

Each role sees:
  - Different default outputs (officer: strategy + ToC; M&E: logframe + eval plan)
  - Different level of detail (officer: simple; M&E: detailed indicators)
  - Different UI complexity (officer: wizard; M&E: dashboard with all controls)
  - Different explanations (officer: "What is a logframe?"; M&E: skip)
```

**Adaptive complexity:**
- First-time user: full wizard, explanations, "What does this mean?" tooltips
- After 3 uses: simplified wizard, skip explanations
- After 10 uses: dashboard mode, keyboard shortcuts, bulk actions
- M&E specialist: always show advanced options (indicator definitions, 
  sampling design, evaluation methodology selector)

---

## 5. FEEDBACK LOOPS (HIGH - partially built, needs depth)

### UI Feedback (what users see)

**What's missing:**

| Feature | Why it matters |
|---------|---------------|
| **Streaming output** | User stares at spinner for 2-3 min. Should see text appearing in real-time (like ChatGPT). |
| **Progress timeline** | General mode shows one spinner. Should show: "Researching (3/9)" with expandable detail. |
| **Confidence indicators** | "This claim has high evidence" vs "This is an assumption" - color-coded in the strategy. |
| **Source citations** | Click a [Source: X] link to see the original web page. Currently just text. |
| **Comparison view** | After feedback, show diff: "What changed (v1 -> v2)" highlighted in green/red. |
| **Quality breakdown** | The 6-criterion score should be visible as a radar chart, not just numbers. |
| **Loading skeleton** | Show greyed-out structure of the strategy while generating, not just a spinner. |
| **Toast notifications** | "Strategy saved", "Exported to Word", "Feedback applied" - subtle confirmations. |
| **Undo/redo** | If they edit the ToC and make it worse, they need undo. |
| **Keyboard shortcuts** | Cmd+Enter to submit, Cmd+E to export, Cmd+K to search programs. |

### Process Feedback (how the system improves)

**What's missing:**

| Feature | Why it matters |
|---------|---------------|
| **Thumbs up/down on sections** | User rates each section of the strategy. System learns what's good. |
| "This section is wrong" button | User flags specific paragraphs. System stores for improvement. |
| **Correction memory** | If user always changes "beneficiaries" to "program participants", system learns. |
| **A/B testing of prompts** | System tries different reasoning approaches and learns which scores higher. |
| **Community knowledge** | Anonymous usage data: "Programs in Kenya typically include X" - fed back into knowledge pack. |
| **Expert review queue** | M&E experts review and rate outputs. High-rated patterns are promoted. |

---

## 6. COLLABORATION (MEDIUM - missing entirely)

### The problem
A strategy is never written by one person. The workflow is:
1. Program officer drafts
2. M&E specialist reviews indicators
3. Country director approves
4. Finance reviews budget
5. Donor liaison formats for submission

Today, HubForge is single-user. No sharing, no review, no approval.

### What to build

**Sharing and review:**
- "Share with colleague" - sends a link (view or edit)
- Comments: highlight text -> add comment -> colleague replies
- Approval workflow: "Submit for review" -> reviewer approves/rejects with notes
- Version history: see all versions, diff between versions, restore old version

**Multi-user org accounts:**
- Organization admin invites team members
- Role-based permissions: admin / editor / reviewer / viewer
- Shared program library (all org programs visible to team)
- Shared context blocks (org-level geography, donor, sector blocks)

---

## 7. DOMAIN-SPECIFIC INTELLIGENCE (MEDIUM - partially built)

### What's built
- Social Impact Pack with 6 frameworks, 5 evidence sources, 3 historical cases
- Web search for demographics, previous programs, evidence

### What's missing

**Donor-specific alignment:**
```
Donor Template Packs:
  - USAID: ADS 201, standard indicators, logframe format, budget categories
  - FCDO: AMR format, value for money framework, theory of change template
  - Global Fund: modular framework, principal recipient reporting
  - EU: logical framework matrix format, intervention logic
  - Gates Foundation: strategy sheet format, milestone tracking
  - World Bank: results framework, implementation completion report
```

**Country-specific packs:**
```
Country Packs:
  - India: NIPUN Bharat, NEP 2020, ASER data, Samagra Shiksha
  - Kenya: CBC curriculum, KICD guidelines, KNBS data
  - Bangladesh: NPFE, NPEP, BBS data
  - Ethiopia: GES, ESS, CSA data
```

**Sector-specific deep knowledge:**
```
Sector Deep Dives:
  - Education: FLN pedagogy, TaRL, structured pedagogy, teacher training models
  - Health: HMIS, CHW models, immunization supply chain
  - WASH: JMP data, CLTS, water point mapping
  - Agriculture: CSA, extension models, market systems
  - Livelihoods: graduation approach, VSLA, skills training
```

---

## 8. TEMPLATES AND REUSE (MEDIUM - missing entirely)

### The problem
NGOs don't start from scratch. They adapt successful past programs. A 
literacy program in Turkana is 70% the same as one in Marsabit - different 
demographics, same intervention model.

### What to build

**Template Library:**
```
Templates:
  - Foundation Literacy Program (FLN) - based on TaRL
  - School Feeding Program - based on WFP model
  - Climate-Smart Agriculture - based on FAO framework
  - Maternal Health Program - based on WHO guidelines
  - Women's Economic Empowerment - based on Graduation Approach
  - Water Point Rehabilitation - based on WaterAid model

Each template includes:
  - Pre-filled ToC (editable)
  - Pre-filled logframe with standard indicators
  - Budget template (line items, unit costs)
  - Risk register template
  - M&E plan template
  - "What to customize" checklist
```

**Program duplication:**
- "Copy from [existing program]" - duplicates strategy, ToC, logframe
- User edits the geography, beneficiaries, budget
- System auto-adjusts indicators and targets

---

## 9. SYSTEM-LEVEL DESIGN (HOW IT ALL FITS TOGETHER)

### The user journey (what it should be)

```
1. First visit
   -> Onboarding: profile + organization + role
   -> Organization context saved

2. Dashboard
   -> "My Programs" (empty on first visit)
   -> "New Program" button

3. New Program
   -> Choose: blank / from template / copy existing
   -> Select context blocks: geography + donor + sector
   -> Type problem statement
   -> System auto-includes org context + selected blocks
   -> Run reasoning loop (with progress timeline)

4. Review
   -> Strategy, ToC, Logframe tabs
   -> Edit any section
   -> Give feedback -> system revises
   -> Rate sections (thumbs up/down)

5. Collaborate
   -> Share with M&E specialist for review
   -> M&E specialist adds comments, adjusts indicators
   -> Director approves

6. Export
   -> Word/PDF for donor submission
   -> Excel for logframe upload to donor portal
   -> Copy text for online application forms

7. Learn
   -> Program results saved to org memory
   -> Context blocks updated with new research
   -> Next program in same geography starts smarter
```

### Information architecture

```
HubForge OS
|
|-- Dashboard (My Programs)
|   |-- Program Workspace
|   |   |-- Strategy (editable, versioned)
|   |   |-- Theory of Change (editable)
|   |   |-- Logframe (editable)
|   |   |-- Evaluation Plan
|   |   |-- Budget
|   |   |-- Timeline
|   |   |-- Risks
|   |   |-- Feedback History
|   |   |-- Comments & Reviews
|   |
|-- Context Blocks
|   |-- Geography blocks (country, district)
|   |-- Donor blocks (templates, requirements)
|   |-- Sector blocks (best practices, evidence)
|   |-- Organization blocks (past results, capacity)
|
|-- Templates
|   |-- By sector (FLN, WASH, Health, Livelihoods)
|   |-- By donor (USAID, FCDO, EU, Global Fund)
|   |-- By scale (pilot, district, national)
|
|-- Settings
|   |-- Organization Profile
|   |-- Team Members
|   |-- AI Provider
|   |-- Preferences (role, language, complexity)
|
|-- Admin (analytics, users, error monitoring)
```

---

## 10. PRIORITY MATRIX

| Feature | User impact | Effort | Priority |
|---------|------------|--------|----------|
| Organization context layer | HIGH - saves 10 min every use | 2 days | P0 - Build now |
| Program workspaces (save/resume) | HIGH - users can't work without it | 3 days | P0 - Build now |
| Context blocks (reuse) | HIGH - compounds value over time | 3 days | P0 - Build now |
| Streaming output | MEDIUM - reduces perceived wait | 2 days | P1 - Build next |
| Role-based interface | MEDIUM - different users need different views | 3 days | P1 - Build next |
| Templates library | MEDIUM - speeds up new programs | 2 days | P1 - Build next |
| Donor alignment packs | HIGH - without this, outputs are generic | 1 week/donor | P1 - Start with 1 |
| Collaboration (sharing) | MEDIUM - for teams | 1 week | P2 - After launch |
| Section-level feedback | MEDIUM - improves system over time | 2 days | P2 - After launch |
| Country packs | LOW - web search covers most of this | 1 week/country | P3 - Later |
| Version history | LOW - nice to have | 3 days | P3 - Later |
| Approval workflow | LOW - for large orgs only | 1 week | P3 - Later |

---

## WHAT TO BUILD IN THE NEXT 2 WEEKS (before launch)

### Week 1: Organization Context + Program Workspaces

1. **Organization Profile** - set once, auto-included in every generation
2. **Program Dashboard** - list of saved programs, status, quick actions
3. **Program Save/Resume** - auto-save, return to work anytime
4. **Program Duplication** - copy as starting point

### Week 2: Context Blocks + Templates + Streaming

5. **Context Blocks** - saveable geography/donor/sector knowledge
6. **Template Library** - 5 pre-built program templates
7. **Streaming Output** - text appears in real-time during generation
8. **Section Feedback** - thumbs up/down on each section

These 8 features transform HubForge from a "tool you use once" to a 
"workspace you use daily." Without them, users generate one strategy, 
export it, and never come back. With them, HubForge becomes the system 
of record for all their program design work.
