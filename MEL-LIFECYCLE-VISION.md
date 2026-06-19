# HubForge OS - The Complete MEL Lifecycle Platform

## The vision: one workspace for the entire program cycle

An NGO program officer should be able to open HubForge OS and move through 
the ENTIRE program lifecycle without switching tools:

```
Needs Analysis → Design → Data Collection → Analysis → Learning → Next Cycle
     ↓              ↓           ↓              ↓          ↓
  Research      ToC, LFA    Kobo/Forms     Dashboards   Document
  Evidence      Indicators   CommCare       Reports      Lessons
  Situation     Frameworks   Tally          Visualize    Share
```

Today HubForge does step 2 (Design - ToC, LFA, Strategy). The vision is 
to connect ALL steps into one visual pipeline where the user can see 
how each block feeds the next.

## The 7 blocks of the MEL lifecycle

### Block 1: SITUATION ANALYSIS
**What the user does:** Research the context before designing anything.

**What HubForge provides:**
- Web search for demographic data (already built)
- Evidence library search (academic papers, evaluations, reports)
- Stakeholder mapping (who's who in the target area)
- Problem tree analysis (root causes, not symptoms)
- SWOT analysis (strengths, weaknesses, opportunities, threats)
- Context analysis (political, economic, social, environmental)

**Output:** Situation Analysis Report (feeds into Design)

**UI:** User types "We want to work on literacy in Marsabit, Kenya"
→ HubForge searches for: Marsabit demographics, previous literacy programs, 
government policies, ASER data, stakeholder map
→ Produces: A structured situation analysis with citations

### Block 2: PROGRAM DESIGN
**What the user does:** Design the program based on the situation analysis.

**What HubForge provides (already built, needs enhancement):**
- Theory of Change (visual diagram, editable)
- Logical Framework (table, editable)
- Indicator framework (output/outcome/impact indicators with definitions)
- Budget allocation (cost per activity, per beneficiary)
- Risk register (risk x likelihood x impact x mitigation)
- Implementation timeline (Gantt chart)
- Stakeholder engagement plan

**Output:** Program Design Package (feeds into Data Collection)

**New additions needed:**
- **Indicator Reference Sheet** for each indicator:
  - Name, definition, numerator, denominator
  - Data source, collection method, frequency
  - Disaggregation (sex, age, location)
  - Baseline value, target value
  - Responsible person
- **Budget template** with donor-specific categories

### Block 3: DATA COLLECTION TOOLS
**What the user does:** Build the tools to collect monitoring data.

**What HubForge provides:**
- Auto-generate survey questions from indicators
- Export to multiple platforms:
  - **Google Forms** (via Google Forms API)
  - **KoboToolbox** (via Kobo API - XLSForm export)
  - **Tally** (via Tally API)
  - **CommCare** (via CommCare API - Excel form export)
  - **SurveyCTO** (XLSForm export)
  - **ODK** (XLSForm export)
- Question bank (validated questions from previous programs)
- Data collection plan (who collects what, when, how)

**Output:** Ready-to-deploy data collection forms + plan

**How it works:**
1. User has indicators from Block 2 (e.g. "% of children reading at grade level")
2. HubForge generates survey questions for each indicator
3. User reviews/edits questions
4. User clicks "Deploy to Kobo" → XLSForm generated and uploaded
5. User clicks "Deploy to Google Forms" → form created via API
6. Enumerators collect data in the field

### Block 4: DATA ANALYSIS
**What the user does:** Analyze collected data against indicators.

**What HubForge provides:**
- Import data from collection tools (CSV/Excel upload, API sync)
- Auto-analysis: compare actual vs target for each indicator
- Disaggregation analysis (by sex, age, location)
- Trend analysis (baseline → midline → endline)
- Statistical analysis (significance tests, effect sizes)
- Visualization (charts, graphs, maps)
- Dashboard builder (drag-and-drop widgets)
- Auto-generated reports (quarterly, annual, donor reports)

**Output:** Dashboards + Reports (feeds into Learning)

**Integrations:**
- DHIS2 (health data)
- Power BI (dashboards)
- Tableau (visualization)
- Google Data Studio
- Excel/CSV (manual upload)

### Block 5: MONITORING
**What the user does:** Track program progress in real-time.

**What HubForge provides:**
- Activity tracker (are we doing what we planned?)
- Output tracking (how many boreholes built? how many teachers trained?)
- Budget tracker (actual vs planned spending)
- Risk tracker (are risks materializing? are mitigations working?)
- Attendance/coverage tracker
- Alert system (flag when indicators fall below threshold)
- Field visit reports (template + submission)

**Output:** Real-time monitoring dashboard

### Block 6: EVALUATION
**What the user does:** Assess impact and attribution.

**What HubForge provides:**
- Evaluation design (RCT, quasi-experimental, contribution analysis)
- Baseline/endline comparison
- Counterfactual analysis
- Outcome harvesting (unexpected results)
- Most Significant Change stories
- Evaluation report template (donor-specific)
- Evaluation questions linked to indicators
- Sampling design (sample size calculator)
- Data quality assessment

**Output:** Evaluation Report

### Block 7: LEARNING & DOCUMENTATION
**What the user does:** Document what worked, what didn't, and why.

**What HubForge provides:**
- Learning log (positive lessons, negative lessons, surprises)
- Lesson templates (what happened, why, what to do differently)
- Knowledge repository (searchable by sector, geography, donor)
- Share lessons with team
- Feed lessons into next program design (Block 1 of next cycle)
- Annual learning report
- Best practice library

**Output:** Institutional Memory (feeds back into Block 1 for next cycle)

## THE VISUAL PIPELINE BUILDER

The UI should show the entire lifecycle as a **visual pipeline** where 
the user can see how each block connects:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  1.SITUATION │─────│  2. DESIGN   │─────│  3. DATA     │
│  ANALYSIS    │     │  ToC, LFA,   │     │  COLLECTION  │
│  Research    │     │  Indicators  │     │  Kobo/Forms  │
│  Evidence    │     │  Budget      │     │  CommCare    │
│  Stakeholders│     │  Risks       │     │  Tally       │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
┌──────────────┐     ┌──────────────┐          │
│  7. LEARNING │◄────│  6.EVALUATION│◄─────────┘
│  Lessons     │     │  Impact      │
│  Best        │     │  Attribution │     ┌──────────────┐
│  practices   │     │  Reports     │◄────│  5. MONITOR  │
│  Feed back   │     └──────────────┘     │  Track       │
└──────┬───────┘                          │  Alert       │
       │                                  └──────────────┘
       │ feeds next cycle                          ▲
       ▼                                           │
┌──────────────┐                                  │
│  1.SITUATION │──────────────────────────────────┘
│  (next cycle)│
└──────────────┘
```

### How the user interacts with the pipeline

1. **Visual overview:** User sees all 7 blocks as cards. Each card shows:
   - Status (not started / in progress / complete)
   - Last updated date
   - Key output (e.g. "3 indicators defined", "2 forms deployed")
   - Click to open that block's workspace

2. **Connections visible:** Arrows show how data flows between blocks:
   - Situation Analysis → feeds → Design (context informs strategy)
   - Design → feeds → Data Collection (indicators become survey questions)
   - Data Collection → feeds → Analysis (collected data is analyzed)
   - Analysis → feeds → Monitoring (real-time tracking)
   - Monitoring → feeds → Evaluation (performance data for evaluation)
   - Evaluation → feeds → Learning (lessons documented)
   - Learning → feeds back → Situation Analysis (next cycle starts smarter)

3. **Block workspace:** Clicking a block opens its workspace:
   - Tools specific to that block
   - Input from previous block (auto-loaded)
   - Output to next block (auto-prepared)
   - Status and progress

4. **Custom pipelines:** Users can create custom workflows:
   - Skip blocks they don't need (e.g. skip evaluation for a pilot)
   - Add custom blocks (e.g. "Donor proposal writing")
   - Reorder blocks (e.g. do monitoring before full design)
   - Save as template for future programs

## HOW DATA FLOWS BETWEEN BLOCKS

```
Block 1 (Situation) outputs:
  → demographics, evidence, stakeholder map
  → feeds into Block 2 as: context for design

Block 2 (Design) outputs:
  → ToC, LFA, indicators, budget, risks
  → feeds into Block 3 as: indicators become survey questions
  → feeds into Block 5 as: targets for monitoring

Block 3 (Data Collection) outputs:
  → deployed forms on Kobo/Google Forms/Tally
  → feeds into Block 4 as: raw data for analysis
  → feeds into Block 5 as: real-time data for monitoring

Block 4 (Analysis) outputs:
  → analyzed data, charts, dashboards
  → feeds into Block 6 as: results for evaluation

Block 5 (Monitoring) outputs:
  → progress tracker, alerts, field reports
  → feeds into Block 6 as: monitoring data for evaluation

Block 6 (Evaluation) outputs:
  → evaluation report, impact assessment
  → feeds into Block 7 as: findings for learning

Block 7 (Learning) outputs:
  → lessons learned, best practices
  → feeds into Block 1 (next cycle) as: institutional memory
```

## WHAT TO BUILD NOW vs LATER

### Build now (Phase 1 - 2 weeks)
1. **Visual pipeline overview** - the 7-block dashboard
2. **Block 1: Situation Analysis** - enhance web search + add stakeholder mapping
3. **Block 2: Program Design** - already built, add indicator reference sheets
4. **Block 7: Learning Log** - simple positive/negative lesson logger

### Build next (Phase 2 - 1 month)
5. **Block 3: Data Collection** - generate survey questions from indicators + XLSForm export
6. **Block 5: Monitoring** - activity/output tracker with alerts
7. **Block connections** - auto-flow data between blocks

### Build later (Phase 3 - 3 months)
8. **Block 4: Data Analysis** - import data, auto-analysis, dashboards
9. **Block 6: Evaluation** - evaluation design, baseline/endline comparison
10. **Integrations** - Kobo API, Google Forms API, DHIS2, CommCare
11. **Custom pipeline builder** - drag-and-drop workflow designer

## THE UI: HOW IT SHOULD LOOK

### Main dashboard (program workspace)

```
┌─────────────────────────────────────────────────────────┐
│  REAP - Turkana Literacy Program          [Settings]    │
│  Status: Active · Donor: USAID · Budget: $50K           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│  │ 1.SIT   │───▶│ 2.DESIGN│───▶│ 3.DATA  │           │
│  │ ✓ Done  │    │ ✓ Done  │    │ ⏳ Active│           │
│  │ 3 sources│   │ 5 indic.│    │ 2 forms  │           │
│  └─────────┘    └─────────┘    └─────────┘           │
│                                       │                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│  │ 7.LEARN │◀───│ 6.EVAL  │◀───│ 4.ANALYZ│           │
│  │ ○ Not   │    │ ○ Not   │    │ ○ Not   │           │
│  │ started │    │ started │    │ started │           │
│  └─────────┘    └─────────┘    └─────────┘           │
│         │                      ▲                       │
│         │   ┌─────────┐        │                       │
│         └──▶│ 5.MONITOR│───────┘                       │
│             │ ⏳ Active │                                │
│             │ 4 alerts  │                               │
│             └─────────┘                                │
│                                                         │
│  [Open Situation] [Open Design] [Open Data Collection] │
└─────────────────────────────────────────────────────────┘
```

### Inside a block (e.g. Block 2: Design)

```
┌─────────────────────────────────────────────────────────┐
│  ◀ Back to Pipeline    Block 2: Program Design    [⚙]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tabs: [ToC] [Logframe] [Indicators] [Budget] [Risks]  │
│                                                         │
│  ┌─ Indicators ─────────────────────────────────────┐   │
│  │                                                  │   │
│  │  Indicator 1: Reading fluency                   │   │
│  │  Definition: Words per minute, grade 2 text     │   │
│  │  Numerator: Children reading ≥40 wpm            │   │
│  │  Denominator: Total children assessed           │   │
│  │  Baseline: 15% | Target: 45%                   │   │
│  │  Frequency: Quarterly | Source: EGRA assessment │   │
│  │  Disaggregation: Sex, age, school              │   │
│  │                                                  │   │
│  │  [Generate Survey Questions] [Deploy to Kobo]   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Input from: Block 1 (Situation Analysis) ✓            │
│  Output to: Block 3 (Data Collection) →                │
└─────────────────────────────────────────────────────────┘
```

### Inside Block 3 (Data Collection)

```
┌─────────────────────────────────────────────────────────┐
│  ◀ Back to Pipeline    Block 3: Data Collection        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Indicators from Block 2:                               │
│  ✓ Reading fluency (EGRA)                              │
│  ✓ School attendance (register)                        │
│  ✓ Teacher attendance (register)                       │
│                                                         │
│  Generated Questions (auto from indicators):            │
│  ┌────────────────────────────────────────────────┐     │
│  │ Q1: What is the child's name?                 │     │
│  │ Q2: What is the child's age?                  │     │
│  │ Q3: What is the child's sex?                  │     │
│  │ Q4: [Reading passage - grade 2 text]          │     │
│  │ Q5: Time to read passage (seconds)            │     │
│  │ Q6: Errors during reading                     │     │
│  │ ...                                           │     │
│  └────────────────────────────────────────────────┘     │
│                                                         │
│  Deploy to:                                             │
│  [Kobo] [Google Forms] [Tally] [CommCare] [Export XLS] │
│                                                         │
│  Data Collection Plan:                                  │
│  - Baseline: Month 1 (all 20 schools)                  │
│  - Midline: Month 12 (sample 10 schools)               │
│  - Endline: Month 24 (all 20 schools)                  │
│                                                         │
│  Input from: Block 2 (Indicators) ✓                    │
│  Output to: Block 4 (Analysis) →                       │
└─────────────────────────────────────────────────────────┘
```

## THE KEY INNOVATION: AUTO-FLOW BETWEEN BLOCKS

The killer feature is that data **automatically flows** between blocks:

1. User does Situation Analysis → demographics, evidence saved
2. User designs ToC → indicators auto-suggested from the situation analysis
3. User finalizes indicators → survey questions auto-generated
4. User deploys to Kobo → data collection starts
5. Data comes in from Kobo → auto-imported to Analysis block
6. Analysis shows results → auto-populates Monitoring dashboard
7. Monitoring shows trends → auto-flags for Evaluation
8. Evaluation finds lessons → auto-saved to Learning log
9. Next program starts → Learning log auto-loaded into Situation Analysis

**The user never manually transfers data between tools.** Everything flows.

## ARCHITECTURE FOR CONNECTING BLOCKS

Each block has:
- **Input schema:** what it expects from the previous block
- **Output schema:** what it produces for the next block
- **Tools:** the specific tools within that block
- **Integrations:** external tools it connects to

```
Block interface:
{
  id: string
  title: string
  status: 'not_started' | 'in_progress' | 'complete'
  input: any          // data from previous block
  output: any         // data for next block
  tools: Tool[]       // tools within this block
  integrations: Integration[]  // external connections
}
```

The pipeline stores the output of each block and makes it available 
as input to the next. When a block is updated, downstream blocks 
are notified (with a "data has been updated" indicator).

## WHAT MAKES THIS DIFFERENT FROM EXISTING TOOLS

| Tool | What it does | What's missing |
|------|-------------|----------------|
| **KoboToolbox** | Data collection | No design, no analysis, no learning |
| **DHIS2** | Health data management | No program design, no learning |
| **PowerBI** | Dashboards | No design, no collection, no learning |
| **LogAlto** | M&E management | Expensive, complex, no AI, no design |
| **ActivityInfo** | M&E database | No AI, no design, no collection |
| **HubForge OS** | **ALL of it, connected, with AI** | Still being built |

HubForge OS is the only tool that connects the ENTIRE lifecycle with AI 
assistance at every step. The user doesn't switch between 5 tools - 
they stay in one workspace.
