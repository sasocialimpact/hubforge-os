// HubForge OS - Social Impact Pack Knowledge Base
// Encodes the 8-layer Knowledge Graph for the Social Impact domain.

export interface Framework {
  name: string
  layer: 2 // Framework Knowledge
  description: string
  whenToUse: string
  keyElements: string[]
  template?: string
}

export interface DecisionRule {
  name: string
  layer: 4 // Decision Rules
  check: string
  passCondition: string
  failAction: string
}

export interface ReasoningPattern {
  name: string
  layer: 7 // Reasoning Patterns
  description: string
}

export interface ImprovementHeuristic {
  name: string
  layer: 8 // Improvement Heuristics
  description: string
}

export interface EvaluationCriterion {
  criterion: string
  weight: number
  description: string
  scoringGuide: string
}

export interface ProceduralStep {
  step: string
  description: string
}

export interface EvidenceSource {
  title: string
  type: string
  summary: string
  sourceUrl?: string
}

export interface HistoricalCase {
  problem: string
  context: string
  outcome: string
  lesson: string
}

export interface DomainPack {
  id: string
  name: string
  domain: string
  version: string
  description: string
  supports: string[]
  // Layer 1 - Domain Knowledge
  domainKnowledge: string[]
  // Layer 2 - Framework Knowledge
  frameworks: Framework[]
  // Layer 3 - Procedural Knowledge
  procedures: { name: string; steps: ProceduralStep[] }[]
  // Layer 4 - Decision Rules
  decisionRules: DecisionRule[]
  // Layer 5 - Evidence Libraries
  evidence: EvidenceSource[]
  // Layer 6 - Historical Memory
  historicalMemory: HistoricalCase[]
  // Layer 7 - Reasoning Patterns
  reasoningPatterns: ReasoningPattern[]
  // Layer 8 - Improvement Heuristics
  improvementHeuristics: ImprovementHeuristic[]
  // Evaluation rubric (used by Evaluation Engine)
  evaluationCriteria: EvaluationCriterion[]
}

export const socialImpactPack: DomainPack = {
  id: 'social-impact',
  name: 'Social Impact Pack',
  domain: 'Social Impact',
  version: '0.1.0',
  description:
    'Domain intelligence for program design, monitoring, evaluation, research design, learning systems, and institutional memory in social-impact organizations (nonprofits, NGOs, foundations, development agencies).',
  supports: [
    'Program design',
    'Monitoring systems',
    'Evaluation frameworks',
    'Research design',
    'Learning systems',
    'Institutional memory',
  ],
  domainKnowledge: [
    'Theory of Change methodology',
    'Logical Framework Analysis (Logframe)',
    'Outcome Mapping',
    'Most Significant Change technique',
    'Participatory rural appraisal',
    'Beneficiary segmentation',
    'Counterfactual impact estimation',
    'Cost-effectiveness analysis',
    'Contribution analysis',
    'Realist evaluation',
  ],
  frameworks: [
    {
      name: 'Theory of Change',
      layer: 2,
      description:
        'A causal map linking inputs to activities to outputs to outcomes to impact, made explicit alongside the assumptions and external factors that must hold for the chain to work. The de facto standard for funder proposals (USAID, FCDO, Gates Foundation, UN agencies) and the foundation of any credible logframe or results framework.',
      whenToUse:
        'Program design, strategy development, evaluation planning, funder proposals, and any context where you must justify why an intervention will produce the desired impact.',
      keyElements: [
        'Target population and stakeholder map',
        'Inputs (resources: staff, budget, materials, partnerships)',
        'Activities (what is done, by whom, with what cadence)',
        'Outputs (countable products/services, e.g. 1,200 farmers trained)',
        'Outcomes (short/medium-term behaviour or status change)',
        'Impact (long-term societal change)',
        'Assumptions (must hold for the chain to work)',
        'External factors (outside the control of the program)',
      ],
      template:
        'CONTEXT: [problem, population, geography, time horizon]. INPUTS: [staff, budget, materials, partnerships with USD and headcount]. ACTIVITIES: [numbered list of what will be done, by whom, with what cadence]. OUTPUTS: [countable products/services, e.g. 1,200 farmers trained, 60 savings groups formed]. OUTCOMES (short-term 0-12mo): [behaviour/knowledge/status change with target %]. OUTCOMES (medium-term 1-3yr): [adoption/retention/income change with target %]. IMPACT (long-term 3-7yr): [societal change, e.g. 30% reduction in stunting in target woredas]. ASSUMPTIONS (must hold): [at least 3 testable assumptions, e.g. input markets remain functional]. EXTERNAL FACTORS: [risks outside program control, e.g. drought, currency shock]. QUALITY MARKERS: every arrow is causal not correlational; every outcome has an indicator, baseline, and target; every assumption has a monitoring question; the chain is reviewed annually and updated.',
    },
    {
      name: 'Logical Framework Analysis (Logframe)',
      layer: 2,
      description:
        'A 4x4 matrix linking goal, purpose, outputs, and activities to objectively verifiable indicators, means of verification, and assumptions. Required in some form by USAID, FCDO, EU, GIZ, World Bank, and most bilateral donors.',
      whenToUse:
        'Proposal writing, donor reporting, and any context requiring structured accountability across the results chain.',
      keyElements: [
        'Goal (impact-level)',
        'Purpose (outcome-level)',
        'Outputs',
        'Activities',
        'Objectively Verifiable Indicators (OVIs) - one per result, SMART per USAID ADS 201.3.5',
        'Means of Verification (MoVs) - data source, frequency, responsible party',
        'Assumptions (per level) - explicit, with risk rating',
        'Baselines and targets (per OVI, with disaggregation by sex and age at minimum)',
      ],
      template:
        '4x4 matrix with rows = Goal / Purpose / Outputs / Activities and columns = Narrative Summary | Objectively Verifiable Indicators (OVIs) | Means of Verification (MoVs) | Assumptions. Example Goal row: Reduced stunting among under-5s in Woreda X by 20% by 2027 | U5 stunting prevalence (DHS-style anthropometric survey) | Baseline 2024, Midline 2026, Endline 2027 household survey | National nutrition policy stable; no major food-price shock. Example Purpose row: Improved IYCF practices among 5,000 caregivers | % of children 6-23mo receiving minimum acceptable diet (WHO) | Bi-annual KAP survey | Community health volunteers remain active. Each OVI must be SMART per USAID ADS 201.3.5; each MoV must specify source, frequency, and responsible party; assumptions are stated at every level and link to the next level up via IF [output delivered] AND [assumption holds] THEN [purpose achieved]. QUALITY MARKERS: every indicator has a baseline; every baseline was measured before activities began; every assumption has a risk rating (high/medium/low).',
    },
    {
      name: 'Outcome Mapping',
      layer: 2,
      description:
        'Focuses on changes in the behaviour of boundary partners (the people, groups, or organisations the program works with directly) rather than on broad impact. Developed by IDRC; useful for advocacy, policy influence, and complex multi-actor programs.',
      whenToUse:
        'Complex programs where change is non-linear, partners are many, and attribution to impact is contested.',
      keyElements: [
        'Boundary partners (3-7 groups the program works with directly)',
        'Outcome challenges (desired behaviour changes per partner)',
        'Progress markers: expect-to-see (early), like-to-see (mid), love-to-see (transformative)',
        'Strategy maps (causal, persuasive, supportive activities per partner)',
        'Organisational practices (8-10 things the program itself must do to stay adaptive)',
      ],
      template:
        'VISION: [the large-scale social/system change sought, broad and aspirational]. MISSION: [the contribution of the program to that vision - what the program will do]. BOUNDARY PARTNERS: [list 3-7 groups the program works directly with - e.g. community health volunteers, woreda health office, mothers groups]. For each boundary partner write: OUTCOME CHALLENGE: [current behaviour vs desired behaviour - what needs to change in how they act]. PROGRESS MARKERS: Expect-to-see (within 6-12 months, e.g. CHVs attend monthly refresher training); Like-to-see (by year 2, e.g. CHVs proactively refer suspected pneumonia cases); Love-to-see (transformative, e.g. CHVs organise peer-led supervision without external prompting). STRATEGY MAP: [causal, persuasive, supportive activities mapped to each marker]. ORGANISATIONAL PRACTICES: [8-10 things the program itself must do to stay adaptive - e.g. quarterly reflection sessions]. QUALITY MARKERS: progress markers are observable behaviours not outputs; the love-to-see markers describe genuine transformation not just compliance.',
    },
    {
      name: 'Most Significant Change (MSC)',
      layer: 2,
      description:
        'A participatory, story-based technique where field staff and beneficiaries select the most significant change stories, which are then vetted by panels. Developed by Rick Davies and Jess Dart; useful for programs where unexpected outcomes matter.',
      whenToUse:
        'Programs where unexpected outcomes are likely, where beneficiary voice matters, and where quantitative indicators miss the story.',
      keyElements: [
        'Domains of change (3-5 themes used to organise stories)',
        'Story collection from field using a standard prompt',
        'Panel-based story selection with documented rationale',
        'Verification (fact-check with storyteller + triangulate with monitoring data)',
        'Feedback to field staff and beneficiaries',
        'Meta-analysis across stories and selections',
      ],
      template:
        '1. DOMAINS OF CHANGE: define 3-5 domains to organise stories (e.g. household income, agency of women, service access). 2. STORY COLLECTION: field staff collect stories using the prompt In your view, what was the most significant change that resulted from the program in the last period? Each story records who, what changed, when, and why it matters (in the words of the storyteller). 3. STORY SELECTION PANELS: at each organisational level (field then district then national) panels read stories, select the most significant per domain, and document WHY that story was selected (this is the evaluative content). 4. VERIFICATION: selected stories are fact-checked with the storyteller and where possible triangulated with monitoring data. 5. FEEDBACK: selected stories and selection rationale are fed back to field staff and beneficiaries. 6. META-ANALYSIS: at end of cycle, analyse patterns across stories and selections; report on the type and frequency of change the program is enabling, including unexpected change. QUALITY MARKER: the selection rationale of the panel, not the story itself, is the primary evaluative content.',
    },
    {
      name: 'Impact Evaluation Methods',
      layer: 2,
      description:
        'Counterfactual methods for estimating net impact: randomised controlled trials (RCTs), regression discontinuity designs (RDD), difference-in-differences (DiD), propensity-score matching (PSM), instrumental variables (IV), and synthetic control. The reference handbook is the World Bank Impact Evaluation in Practice (2nd ed.) and the J-PAL Evaluation Toolkit.',
      whenToUse:
        'When attribution is required and a credible counterfactual can be constructed.',
      keyElements: [
        'Evaluation question and estimand (ATE, ATT, LATE, ITT)',
        'Identification strategy (RCT, RDD, DiD, PSM, IV, synthetic control)',
        'Power calculation with minimum detectable effect size (MDES) at 80% power and 5% significance',
        'Unit of assignment (individual/household/cluster), stratification, treatment:control ratio',
        'Attrition buffer (>=10%) and attrition analysis plan',
        'Pre-registered analysis plan (AEA RCT Registry or OSF)',
        'Pre-specified subgroups and multiple-comparison adjustment (FDR or Bonferroni)',
        'Intention-to-treat vs treatment-on-treated specification',
        'IRB approval, informed consent, and a plan for harm if found',
      ],
      template:
        '1. EVALUATION QUESTION: state the causal question (e.g. what is the effect of the cash transfer on child labour hours). 2. ESTIMAND: define precisely what is being estimated (ATE, ATT, LATE, ITT) and on whom (target population). 3. IDENTIFICATION STRATEGY: choose ONE of RCT, RDD, DiD, PSM, IV, synthetic control; justify why it credibly establishes the counterfactual in this context. 4. SAMPLE: power calculation for the minimum detectable effect size (MDES) at 80% power and 5% significance; specify clusters, intra-cluster correlation (ICC), and attrition buffer (>=10%). 5. RANDOMISATION/ASSIGNMENT: unit of assignment (individual/household/cluster), stratification variables, ratio of treatment:control. 6. DATA: baseline, midline, endline; specify instruments, frequency, and who collects. 7. ANALYSIS PLAN (pre-registered): specify primary outcome, pre-specified sub-groups, multiple-comparison adjustment (FDR or Bonferroni), and intention-to-treat vs treatment-on-treated. 8. ETHICAL SAFEGUARDS: IRB approval, informed consent, data security, and a plan for what to do if the intervention is found to cause harm. 9. ATTRITION AND SPILLOVERS: how they will be measured and addressed in analysis. QUALITY MARKER: a pre-analysis plan registered on the AEA RCT Registry or OSF before endline data collection begins.',
    },
    {
      name: 'Survey Design',
      layer: 2,
      description:
        'Principles for designing valid, reliable, and ethical survey instruments including sampling, question wording, mode effects, enumerator protocols, and data-quality controls. Aligned with the DHS and MICS survey standards and the World Bank Living Standards Measurement Study (LSMS) playbook.',
      whenToUse:
        'When primary data collection is required for baseline, midline, or endline measurement.',
      keyElements: [
        'Sampling frame and design (SRS, stratified, cluster, multi-stage)',
        'Sample size for the smallest subgroup of interest at 80% power and 5% significance, with design effect (DEFF ~2 for typical cluster surveys)',
        'Question wording (single-barreled, neutral, culturally appropriate, back-translated)',
        'Mode (face-to-face CAPI, phone CATI, web, paper) with explicit language(s) and device',
        'Cognitive testing (think-aloud with 15-20 respondents) and instrument revision',
        'Enumerator protocol: >=3 days training, scripted consent, daily debrief, 10% back-checks',
        'Data quality: range checks, paradata (duration, GPS), 100% spot-check of outliers within 48 hours',
        'Ethics: IRB approval, informed consent, anonymisation, secure storage, referral protocol',
      ],
      template:
        '1. SAMPLING FRAME: define the target population, the sampling frame, and the design (SRS, stratified, cluster, or multi-stage). Compute sample size for the smallest subgroup of interest at 80% power and 5% significance, with design effect (DEFF ~2 for typical cluster surveys). 2. INSTRUMENT DESIGN: each question maps to a specific indicator in the M&E plan; questions are single-barreled, neutral, and culturally appropriate; translations are back-translated; skip patterns are explicit. 3. COGNITIVE TESTING: pilot 15-20 respondents with think-aloud protocol; revise items with >15% non-response or comprehension errors. 4. MODE: face-to-face (CAPI), phone (CATI), or self-administered (web/paper). Specify language(s) and device. 5. ENUMERATOR PROTOCOL: training >=3 days, scripted introduction and consent, daily debrief, and 10% back-checks by supervisors. 6. DATA QUALITY: range checks, paradata (duration, GPS), and 100% spot-check of outliers within 48 hours. 7. ETHICS: IRB approval, informed consent (oral or written), data anonymisation, secure storage, and a referral protocol for respondents in distress. QUALITY MARKER: the questionnaire, codebook, and de-identified microdata are deposited in a public archive (e.g. dataverse, IPUMS) within 24 months of collection.',
    },
    {
      name: 'OECD-DAC Evaluation Criteria (2019)',
      layer: 2,
      description:
        'The six OECD-DAC criteria - revised in 2019 - that bilateral and multilateral donors use to evaluate development and humanitarian interventions. The 2019 revision added Coherence as a stand-alone criterion and redefined each criterion with explicit definitions and a typology of evaluation questions.',
      whenToUse:
        'Evaluation design, donor reporting, and proposal review - most OECD donors and the major multilateral banks (World Bank, ADB, AfDB) require evaluations to address these criteria explicitly.',
      keyElements: [
        'RELEVANCE - Is the intervention doing the right thing? Extent to which objectives and design respond to the needs of beneficiaries, global, country, and partner policies and priorities.',
        'COHERENCE - How well does the intervention fit? Compatibility with other interventions in a country, sector, or institution: internal coherence (same actor) and external coherence (other actors).',
        'EFFECTIVENESS - Is it achieving its objectives? Extent to which the intervention achieved, or is expected to achieve, its objectives and results, including any differential results across groups.',
        'EFFICIENCY - Are resources being used economically? Extent to which the intervention delivers results in an economic and timely way, considering value-for-money.',
        'IMPACT - What difference does it make? Significant positive or negative, intended or unintended, higher-level effects.',
        'SUSTAINABILITY - Will benefits last? Extent to which the net benefits of the intervention continue, or are likely to continue, after the intervention ends.',
      ],
      template:
        'For each of the six criteria, an evaluation must answer: RELEVANCE - To what extent were the objectives and design of the intervention responsive to the needs of beneficiaries, the government, and the donor? Was the needs assessment rigorous and up to date? COHERENCE - How compatible was the intervention with (a) national policy, (b) other interventions by the same donor or agency, (c) other interventions by other actors? Were there duplications, gaps, or contradictions? EFFECTIVENESS - To what extent were the objectives achieved or likely to be achieved? Were there differential effects by sex, age, disability, geography, or socio-economic status? EFFICIENCY - Were outputs delivered economically relative to alternatives? What was the cost per outcome (e.g. cost per child learning gain, cost per DALY averted)? Was delivery timely? IMPACT - What higher-level effects occurred (intended and unintended, positive and negative)? What is the evidence that the intervention caused them (counterfactual)? SUSTAINABILITY - To what extent will net benefits continue after funding ends? What are the financial, institutional, environmental, and socio-cultural dimensions of sustainability? Each criterion finding must be supported by evidence with an explicit confidence rating (high, medium, or low).',
    },
    {
      name: 'Results-Based Management (RBM)',
      layer: 2,
      description:
        'The management strategy used by UN agencies (UNDP, UNICEF, UNFPA), the Global Fund, and Gavi, focused on achieving measurable results. Built on an explicit results chain and a theory of change that is monitored and used for adaptive management.',
      whenToUse:
        'Multi-year program design for UN agencies, the Global Fund, Gavi, and most bilateral donors that require a results chain and a performance-monitoring framework linked to budget and decision-making.',
      keyElements: [
        'RESULTS CHAIN: inputs to activities to outputs to outcomes to impact, with each link measurable',
        'STRATEGIC PLAN with a results matrix (outcome and output indicators, baselines, targets, means of verification)',
        'PERFORMANCE MONITORING FRAMEWORK (PMF) - one indicator per result, with baseline, target, frequency, and responsible party',
        'RISKS AND ASSUMPTIONS registered and reviewed at least annually',
        'ADAPTIVE MANAGEMENT - mid-cycle reviews that use monitoring data to adjust the program',
        'COUNTRY PROGRAMME DOCUMENT (CPD) or equivalent - the formal donor-facing results framework',
        'INDEPENDENT EVALUATION at mid-term and end-of-cycle',
      ],
      template:
        'A complete RBM framework contains: 1. RESULTS CHAIN TABLE: rows = impact, outcome(s), output(s), activities; columns = result statement, indicator(s), baseline, milestone(s), target, means of verification, frequency, responsible party, risks/assumptions. 2. INDICATORS: each indicator is SMART per USAID ADS 201.3.5, has a disaggregation plan (at minimum sex and age), and a defined data source. 3. BASELINE: a documented baseline study (or proxy with rationale) for every indicator before activities begin. 4. TARGETS: targets are derived from baseline plus intended effect size, with explicit reference to the evidence base that supports the effect size. 5. RISKS AND ASSUMPTIONS: a live register reviewed quarterly; the program response to a breached assumption is pre-specified. 6. ADAPTIVE MANAGEMENT: a calendar of decision points (at least semi-annual) where monitoring data is reviewed and course corrections are documented. 7. EVALUATION: independent mid-term and end-line evaluations against the OECD-DAC criteria. QUALITY MARKER: every output indicator has a budget line and a responsible party in the work plan; every outcome indicator has a counterfactual plan (even if informal).',
    },
  ],
  procedures: [
    {
      name: 'Program Design Process',
      steps: [
        { step: 'Problem analysis', description: 'Define the problem, its causes, and its consequences for the target population.' },
        { step: 'Stakeholder mapping', description: 'Identify primary beneficiaries, implementers, influencers, and gatekeepers.' },
        { step: 'Theory of Change', description: 'Build the causal chain from inputs to impact, with explicit assumptions.' },
        { step: 'Logframe', description: 'Translate the ToC into a logframe with indicators and means of verification.' },
        { step: 'Indicator design', description: 'Define SMART indicators with baseline and target values.' },
        { step: 'M&E plan', description: 'Specify data collection, frequency, responsibility, and reporting.' },
        { step: 'Risk and assumptions', description: 'Identify risks, mitigation, and assumptions that must hold.' },
        { step: 'Budget and timeline', description: 'Cost the activities and sequence them on a timeline.' },
      ],
    },
    {
      name: 'Evaluation Process',
      steps: [
        { step: 'Evaluation questions', description: 'Articulate the questions the evaluation must answer.' },
        { step: 'Evaluation design', description: 'Choose method (experimental, quasi-experimental, contribution, realist).' },
        { step: 'Indicator selection', description: 'Map indicators to evaluation questions.' },
        { step: 'Data collection', description: 'Collect baseline, midline, endline data per the M&E plan.' },
        { step: 'Analysis', description: 'Estimate effects; analyse contribution; triangulate.' },
        { step: 'Synthesis', description: 'Answer evaluation questions with confidence levels.' },
        { step: 'Use and learning', description: 'Translate findings into decisions and store institutional memory.' },
      ],
    },
  ],
  decisionRules: [
    {
      name: 'SMART Goal Validation',
      layer: 4,
      check:
        'Every stated goal and indicator must be SMART - Specific, Measurable, Achievable, Relevant, Time-bound - and follow USAID ADS 201.3.5 indicator standards: each indicator has a clear definition, unit of measurement, disaggregation (at least sex and age), data source, frequency of collection, baseline, and target.',
      passCondition:
        'Every goal contains a measurable target with a specific magnitude (% or absolute number) and a deadline (year or quarter); every indicator has a definition, unit, disaggregation, baseline, target, and means of verification aligned with USAID ADS 201.3.5.',
      failAction:
        'Reject goal; require explicit magnitude, deadline, and indicator definition per USAID ADS 201.3.5.',
    },
    {
      name: 'Stakeholder Coverage',
      layer: 4,
      check: 'The strategy must explicitly address primary beneficiaries, implementers, and influencers.',
      passCondition: 'All three stakeholder categories are named and addressed.',
      failAction: 'Flag missing stakeholder category and require addition.',
    },
    {
      name: 'Assumption Explicitness',
      layer: 4,
      check: 'Key assumptions underpinning the theory of change must be stated.',
      passCondition: 'At least three assumptions are listed and tested for plausibility.',
      failAction: 'Flag missing assumptions; require explicit enumeration.',
    },
    {
      name: 'Evidence Citation',
      layer: 4,
      check:
        'Every empirical claim about effectiveness, prevalence, or causation must be backed by a rigorous source: a peer-reviewed publication, a registered RCT (AEA RCT Registry or OSF), a systematic review (Cochrane, Campbell, 3ie), a recognised institutional evidence review (J-PAL, IPA, WHO, World Bank IEG), or official statistics (DHS, MICS, national census). Anecdotes, blog posts, and unattributed statistics do not qualify.',
      passCondition:
        'Each empirical claim is paired with a named rigorous source that is citable (author, year, title, or URL).',
      failAction:
        'Flag unsupported claims; require replacement with a peer-reviewed or rigorous evaluation source, or removal of the claim.',
    },
    {
      name: 'Risk Identification',
      layer: 4,
      check: 'The strategy must identify at least three material risks and propose mitigations.',
      passCondition: 'At least 3 risks with mitigations listed.',
      failAction: 'Flag missing risk analysis; require completion.',
    },
    {
      name: 'Cost-Effectiveness Check',
      layer: 4,
      check:
        'The strategy must justify the chosen approach on cost-effectiveness grounds - i.e. the expected cost per unit of outcome (e.g. cost per child with learning gain, cost per DALY averted, cost per household lifted above the poverty line) is reasonable relative to known alternatives or to a cash benchmark. Where a cost-effectiveness estimate is not possible, the strategy must at minimum present the cost per beneficiary and a rationale for why this approach is preferred to alternatives.',
      passCondition:
        'Cost per outcome or per beneficiary is stated and compared to at least one alternative or benchmark (e.g. GiveDirectly cash benchmark, DCP3 cost-effectiveness thresholds, J-PAL cost-effectiveness tables).',
      failAction:
        'Flag missing cost-effectiveness analysis; require cost per beneficiary plus a comparison to at least one alternative or benchmark.',
    },
    {
      name: 'Sustainability & Exit Strategy',
      layer: 4,
      check:
        'The strategy must describe how benefits will be sustained after external funding ends and must include an explicit exit or handover plan covering financial, institutional, technical, and social sustainability. WHO/UNICEF and OECD-DAC require this for funding decisions.',
      passCondition:
        'The proposal names who will own, fund, and operate the intervention after donor exit; identifies capacity gaps and a plan to close them; and specifies an exit timeline with milestones.',
      failAction:
        'Flag missing sustainability plan; require explicit ownership, financing, and capacity-transition plan covering the post-funding period.',
    },
  ],
  evidence: [
    {
      title: 'OECD-DAC Criteria for Evaluating Development Assistance (2019 revision)',
      type: 'Institutional Framework',
      summary:
        'Six criteria used by OECD bilateral and multilateral donors to evaluate development interventions: relevance, coherence, effectiveness, efficiency, impact, sustainability. The 2019 revision added coherence as a stand-alone criterion (split out from relevance), redefined each criterion with explicit definitions, and introduced a typology of evaluation questions per criterion. Most donor evaluations (USAID, FCDO, EU, GIZ, World Bank, ADB, AfDB) must address all six explicitly. Each finding must carry an explicit confidence rating (high, medium, low) supported by evidence.',
      sourceUrl: 'https://www.oecd.org/en/topics/sub-issues/evaluation-criteria.html',
    },
    {
      title: 'Better Evaluation Rainbow Framework',
      type: 'Methodology Framework',
      summary:
        'Comprehensive framework organising evaluation tasks across seven clusters: manage an evaluation; define what is to be evaluated; frame the boundaries; describe (activities, results, context); understand causes; synthesise evidence from across evaluations; report and support use. Useful as a checklist for evaluation design - it surfaces tasks the OECD-DAC criteria do not address (e.g. framing the evaluation, synthesising across multiple studies). Maintained by the BetterEvaluation.org community of practice.',
      sourceUrl: 'https://www.betterevaluation.org/frameworks-tools/rainbow-framework',
    },
    {
      title: 'FSG - Creating a Theory of Change: A Practical Tool for Leading Change',
      type: 'Practitioner Guide',
      summary:
        'Step-by-step guidance on building theories of change, including the common pitfalls: uncritical assumptions, missing links between activities and outcomes, vague outcomes that cannot be measured, and confusion between activities and outcomes. Recommends starting from the desired long-term impact and working backwards (backcasting) to identify the necessary preconditions, then forwards to test the causal logic.',
      sourceUrl: 'https://www.fsg.org/publications/creating-theory-change',
    },
    {
      title: 'World Bank - Impact Evaluation in Practice (2nd ed.)',
      type: 'Methodology Handbook',
      summary:
        'The standard reference on counterfactual impact evaluation methods, authored by Gertler, Martinez, Premand, Rawlings, and Vermeersch. Covers randomised controlled trials, regression discontinuity designs, difference-in-differences, propensity-score matching, and instrumental variables in programmatic language. Each method is illustrated with case studies from World Bank operations. Includes practical guidance on power calculations, attrition, pre-analysis plans, and ethical safeguards. Available open-access.',
      sourceUrl: 'https://www.worldbank.org/en/programs/sief-trust-fund/publication/impact-evaluation-in-practice',
    },
    {
      title: 'CGAP - Financial Diaries of Smallholder Households',
      type: 'Empirical Study',
      summary:
        'Multi-year financial-diaries study tracking income, expense, and shock-coping patterns of smallholder households in Mozambique, Tanzania, and Pakistan. Documents the volatility and irregularity of smallholder income, the central role of informal financial instruments, and the persistent gap between smallholder cash needs and available formal financial products. Useful baseline for climate-adaptation, livelihoods, and financial-inclusion program design in rural sub-Saharan Africa and South Asia.',
      sourceUrl: 'https://www.cgap.org/research/publication/financial-diaries-smallholder-households',
    },
    {
      title: 'J-PAL Policy Insight: Cash Transfers',
      type: 'Systematic Evidence Review',
      summary:
        'Synthesis by the Abdul Latif Jameel Poverty Action Lab (J-PAL) of dozens of randomised evaluations of unconditional and conditional cash transfer programs. Key findings: cash transfers increase consumption, food security, and assets; improve schooling, health, and psychological well-being; show no systematic evidence of increased spending on alcohol or tobacco; do not typically discourage work; effects on income often persist and grow after the transfer ends. Cost-effectiveness is competitive with in-kind transfer programs. Haushofer and Shapiro (2016, Econometrica) on GiveDirectly in Kenya and Baird and colleagues on girls schooling in Malawi and Ghana are widely cited primary studies.',
      sourceUrl: 'https://www.povertyactionlab.org/policy-insight/cash-transfers',
    },
    {
      title: '3ie Evidence Gap Maps (Education, Health, Climate Adaptation)',
      type: 'Evidence Synthesis',
      summary:
        'The International Initiative for Impact Evaluation (3ie) produces interactive evidence gap maps that systematically map available rigorous impact evaluations against intervention-outcome relationships. As of 2024, gap maps cover education (strong evidence on school feeding, conditional cash transfers, and structured pedagogy; weak evidence on teacher accountability in low-income contexts), health (strong evidence on community health worker interventions, mHealth for behaviour change, and user-fee removal; gaps in mental health and NCDs), and climate adaptation (limited rigorous evidence overall, with concentrated evidence on disaster-risk financing and index-based insurance; major gaps on resilience outcomes). Each map is updated periodically and includes study quality ratings.',
      sourceUrl: 'https://www.3ieimpact.org/evidence-hub/evidence-gap-maps',
    },
    {
      title: 'WHO - Guideline on Health Policy and System Support for Community Health Worker Programmes (2018)',
      type: 'Program Guidance',
      summary:
        'WHO guideline specifying that community health worker programs require a paid, trained, supervised, and resupplied workforce integrated into the national health system with a functioning referral system. Companion guidance on integrated community case management (iCCM) of childhood illness recommends CHWs assess, classify, and treat pneumonia, malaria, and diarrhea in children under five in underserved areas. Implementation research in Ethiopia, Malawi, and Nigeria finds iCCM can reduce under-five mortality by 10-15% when paired with consistent supervision and resupply. The guideline identifies 17 health system functions that must be in place for CHW programs to perform.',
      sourceUrl: 'https://www.who.int/publications/i/item/9789241513966',
    },
    {
      title: 'Sphere Handbook: Humanitarian Charter and Minimum Standards (2018)',
      type: 'Minimum Standards Handbook',
      summary:
        'The Sphere Handbook sets minimum standards for humanitarian response across four technical chapters: WASH, Food Security and Nutrition, Shelter and Settlement, and Health. Specific standards include: minimum 15 litres of water per person per day; maximum 500 persons per water tap; 50 persons per latrine; 2,100 kcal per person per day of food; floor area of 3.5 sqm per person in shelters; under-5 mortality rate below 2 per 10,000 per day in emergencies. Standards are evidence-based, updated through multi-agency review, and used by UNHCR, OCHA, IFRC, and most major NGOs as the benchmark for proposal design and reporting in humanitarian contexts.',
      sourceUrl: 'https://handbook.spherestandards.org/',
    },
    {
      title: 'GiveDirectly - Long-Term Effects of Unconditional Cash Transfers (Kenya RCT)',
      type: 'Randomised Controlled Trial',
      summary:
        'Haushofer and Shapiro (2016, Econometrica; 2018, Journal of Public Economics) randomised unconditional cash transfers of approximately USD 1,000 to roughly 500 households in western Kenya via M-Pesa, with a 3-year follow-up. Findings: USD 1,000 transfers increased assets by approximately USD 270 and monthly consumption by approximately USD 8 seven months later; food security and psychological well-being improved; no effect on fertility, crime, or spending on alcohol or tobacco. The 3-year follow-up found treatment households had approximately USD 1,200 more in assets and approximately USD 20 higher monthly consumption relative to controls - effects grew rather than faded. A larger follow-up (Egger et al. 2022) randomised USD 1,000 per household across 10,500 households in 651 villages and confirmed positive consumption, asset, and well-being effects with no negative spillovers on non-recipients. GiveWell rates GiveDirectly as one of the most cost-effective charities operating at scale, with cost-per-dollar-transferred of approximately 0.10.',
      sourceUrl: 'https://www.givedirectly.org/research-at-givedirectly/',
    },
    {
      title: 'J-PAL Policy Insight: Teaching at the Right Level (TaRL)',
      type: 'Programmatic Evidence Synthesis',
      summary:
        'Synthesis of multiple randomised evaluations by Banerjee, Banerji, Duflo, Glennerster, and Khemani (2007, 2010, 2016, 2017) of Teaching at the Right Level, developed by Pratham in India. TaRL groups children by current learning level rather than grade and uses targeted, activity-based instruction for part of the school day. Findings: TaRL consistently improves basic reading and arithmetic within a single program cycle (typically 50-60 days), with effect sizes of 0.2-0.4 standard deviations on test scores; results have been replicated at scale with tens of millions of children in India. Cost per child is approximately USD 5-15. The model works when grouping is by level not grade, instructors use structured materials, and there is regular measurement and feedback. African adaptations in Cote d Ivoire and Zambia show similar patterns.',
      sourceUrl: 'https://www.povertyactionlab.org/policy-insight/teaching-right-level',
    },
  ],
  historicalMemory: [
    {
      problem: 'Design a farmer livelihoods program in sub-Saharan Africa',
      context: 'Smallholder farmers facing climate variability, weak extension services, and thin input markets.',
      outcome:
        'Programs that combined drought-tolerant seed distribution with village savings groups and weather-indexed insurance outperformed seed-only programs on income, food security, and resilience to shock.',
      lesson:
        'Layered interventions addressing production, finance, and risk jointly outperform single-input programs. Assume standalone input distribution is insufficient.',
    },
    {
      problem: 'Design a girls education program in South Asia',
      context: 'Low female secondary completion; early marriage; safety concerns.',
      outcome:
        'Cash transfers conditioned on attendance plus community gender-norms dialogue raised completion rates more than cash alone. Baird and colleagues (World Bank Economic Review 2011) found CCTs for girls in Malawi raised enrolment by approximately 6 percentage points and reduced dropout and marriage rates.',
      lesson:
        'Supply-side and demand-side barriers must be addressed together; financial incentives alone rarely shift deeply held social norms.',
    },
    {
      problem: 'Design a healthcare access program for rural populations',
      context: 'Long travel times to clinics; staff shortages; low trust.',
      outcome:
        'Community health worker programs with regular supervision and resupply outperformed facility-only models. WHO iCCM implementation research in Ethiopia, Malawi, and Nigeria found supervised CHW programs reduced under-five mortality by approximately 10-15%.',
      lesson:
        'Last-mile delivery requires a supervised, resupplied workforce; CHWs without support degrade quickly.',
    },
    {
      problem: 'Lift the ultra poor out of extreme poverty in Bangladesh (BRAC Targeting the Ultra Poor graduation approach)',
      context: 'Bangladesh in the early 2000s. Approximately 10% of rural households were too asset-poor, food-insecure, and socially isolated to benefit from microcredit. They had no productive assets and typically worked as day labourers.',
      outcome:
        'BRAC designed the Targeting the Ultra Poor program - a sequenced 24-month intervention with six components: asset transfer (typically livestock), consumption stipend, savings, skills training, healthcare, and weekly mentorship visits. A 7-year follow-up RCT (Banerjee et al. 2015, Science) across six countries (Bangladesh, India, Pakistan, Ethiopia, Ghana, Peru, Honduras) found per-capita consumption increased by approximately 10% in 5 of 6 sites, with Bangladesh showing approximately 37% at the 7-year follow-up (Bandiera et al. 2017, Econometrica). Asset holdings, food security, time spent working, and physical health improved. By year 3-7 the benefits exceeded the cost in most sites. The graduation model has been replicated by approximately 100 organisations in approximately 50 countries.',
      lesson:
        'A sequenced, multi-component big push can durably move the ultra poor out of extreme poverty, but only when the asset transfer is paired with consumption support, mentoring, and healthcare. The graduation model as a whole - not any single component - is what works.',
    },
    {
      problem: 'Improve foundational literacy and numeracy at scale in India (Pratham Teaching at the Right Level)',
      context: 'India, 2005 to present. The ASER survey consistently shows more than 50% of Grade 5 children cannot read a Grade 2 text. Despite near-universal enrolment, learning levels were flat or declining. Existing remedial approaches were small-scale.',
      outcome:
        'Pratham developed Teaching at the Right Level: for part of the school day, children are regrouped by current learning level (not grade) and taught foundational skills using level-appropriate activities. Multiple RCTs with J-PAL found TaRL improves reading and math by approximately 0.2-0.4 standard deviations in a single cycle. Pratham has reached tens of millions of children; the model has been embedded in Indian state partnerships and adapted in Cote d Ivoire, Zambia, Nigeria, and Kenya. The key to scaling was partnership with state governments to embed the method in the regular school day rather than running it as a parallel program.',
      lesson:
        'Foundational learning can be improved quickly and cheaply when instruction is targeted to the current level of the child - but scaling requires government partnership to embed the method in the regular school system, not a parallel delivery channel.',
    },
    {
      problem: 'Test whether unconditional cash transfers reduce poverty in Kenya without the harms critics predicted (GiveDirectly)',
      context: 'Western Kenya, 2010s. High mobile-phone penetration enabled M-Pesa-based transfer at near-zero delivery cost. Critics argued unconditional cash would be misspent on alcohol and tobacco and would create dependency.',
      outcome:
        'A series of RCTs (Haushofer and Shapiro 2016, 2018; Egger et al. 2022 on a USD 1,000-per-household transfer to approximately 10,500 households across 651 villages - the largest cash-transfer RCT to date) found increased consumption and assets; improved food security, psychological well-being, and child nutrition; no evidence of increased spending on alcohol or tobacco; no negative effects on inflation, crime, or fertility; positive spillovers on non-recipient households in treatment villages via informal transfers and local markets. Cost-per-dollar-delivered is approximately USD 0.10-0.15. GiveWell estimates GiveDirectly cost-effectiveness at roughly 1 cash-equivalent unit per dollar, making it a benchmark for cost-effective giving.',
      lesson:
        'Unconditional cash transfers to poor households are effective, with the predicted harms not materialising at scale. They are also a useful benchmark for cost-effectiveness comparisons - any program claiming to beat cash should be compared against the cash benchmark in the same population.',
    },
    {
      problem: 'Provide healthcare to remote rural communities in Liberia (Last Mile Health community health worker model)',
      context: 'Liberia, post-conflict and post-Ebola. Remote counties had under-five mortality above 150 per 1,000. The formal health system could not reach remote communities; existing CHW programs were unsupervised and ran out of supplies.',
      outcome:
        'Last Mile Health partnered with the Liberian Ministry of Health to deploy, train, supervise, and pay community health workers in remote villages (more than 5 hours from a clinic). CHWs provide iCCM (malaria, pneumonia, diarrhea), maternal-health referrals, and family planning. Coverage reached more than 1.2 million people in remote Liberia. Internal evaluations show CHWs treated more than 300,000 cases of childhood illness that would otherwise have gone untreated. The model informed the 2015 Liberian National Community Health Assistant Program. Last Mile Health estimates cost-per-child-treated is a fraction of facility-based care. The model was central to the Liberia Ebola response and recovery.',
      lesson:
        'A paid, trained, supervised, and resupplied CHW workforce can deliver essential primary healthcare at scale in remote areas - but only when supervision, resupply, and payment are designed-in. Unsalaried CHW programs degrade quickly when external support ends.',
    },
    {
      problem: 'Extend financial services to the unbanked in Kenya (M-Pesa mobile money)',
      context: 'Kenya, 2007 to present. In 2007 fewer than 30% of adults had a bank account and rural cash transfer was costly and risky. Safaricom launched M-Pesa as an SMS-based mobile-money wallet requiring only a basic phone and an agent for cash-in and cash-out.',
      outcome:
        'M-Pesa grew from approximately 0 to 25 million users in Kenya by 2019 (more than 80% of adults). The Suri and Jack (2016, Science) evaluation found M-Pesa lifted approximately 194,000 households (approximately 2% of Kenyan households) out of extreme poverty between 2008 and 2014; effects were larger for female-headed households, who moved out of agriculture and into business. Per-capita consumption in M-Pesa-served areas rose relative to non-served areas. Cost-per-user is low; the platform catalysed savings, remittances, pay-as-you-go solar (M-KOPA), and digital lending. Replicated with varying success in Tanzania, Uganda, Ghana, and beyond.',
      lesson:
        'A simple, low-infrastructure digital payment system can reach the unbanked at national scale and lift measurable numbers of households out of poverty - but success depended on agent density, interoperability, and a regulator willing to permit a non-bank to handle retail money. Replication in other markets has been uneven where these conditions are absent.',
    },
  ],
  reasoningPatterns: [
    { name: 'Root Cause Analysis', layer: 7, description: 'Identify the underlying causes of an observed problem, not just its symptoms.' },
    { name: 'Counterfactual Reasoning', layer: 7, description: 'Reason about what would have happened absent the intervention.' },
    { name: 'Tradeoff Analysis', layer: 7, description: 'Make explicit the tradeoffs between competing objectives (e.g., coverage vs depth).' },
    { name: 'Risk Modelling', layer: 7, description: 'Enumerate failure modes, their likelihood, and their mitigation.' },
    { name: 'Comparative Analysis', layer: 7, description: 'Compare candidate approaches against criteria to surface the best option.' },
    { name: 'Contribution Analysis', layer: 7, description: 'Build a plausible causal story attributing observed change to the intervention.' },
  ],
  improvementHeuristics: [
    { name: 'Find weak assumptions', layer: 8, description: 'Identify assumptions that, if false, would break the causal chain.' },
    { name: 'Detect missing evidence', layer: 8, description: 'Flag empirical claims that are not supported by a cited source.' },
    { name: 'Replace vague outputs with measurable targets', layer: 8, description: 'Convert "improve livelihoods" into "raise median income by X% by year Y" with a baseline and a target.' },
    { name: 'Strengthen causal logic', layer: 8, description: 'Make every link in the theory of change explicit and testable; replace correlational arrows with causal arrows.' },
    { name: 'Detect logical inconsistency', layer: 8, description: 'Find places where one claim contradicts another in the same document.' },
    { name: 'Reduce uncertainty', layer: 8, description: 'Where uncertainty is high, propose data collection (baseline, formative, midline) to resolve it before scaling.' },
    { name: 'Check for sustainability and exit strategy', layer: 8, description: 'Ask who will own, fund, and operate the intervention after donor funding ends; flag programs that collapse when external support is withdrawn. Use the OECD-DAC sustainability dimensions (financial, institutional, environmental, socio-cultural).' },
    { name: 'Check for cost-effectiveness', layer: 8, description: 'Compute the cost per beneficiary and the cost per unit of outcome; compare to at least one alternative or benchmark (e.g. the GiveDirectly cash benchmark, DCP3 cost-per-DALY thresholds, J-PAL cost-effectiveness tables). Flag programs that cannot beat cash.' },
    { name: 'Check for adaptive management', layer: 8, description: 'Verify the proposal has a calendar of decision points (at least semi-annual) where monitoring data is reviewed and the program can be adapted. Flag programs with a static design and no feedback loop.' },
  ],
  evaluationCriteria: [
    {
      criterion: 'Relevance',
      weight: 0.15,
      description: 'Is the intervention doing the right thing? Extent to which the objectives and design respond to the needs of beneficiaries, the government, and the donor, and continue to do so if circumstances change.',
      scoringGuide:
        '90+: rigorous up-to-date needs assessment with beneficiary segmentation; explicit alignment with national and donor policy; responsiveness to changing context documented. 70-89: needs assessment present but with gaps; alignment stated but not argued. 50-69: needs assessment weak or outdated; alignment asserted without evidence. <50: no needs assessment; intervention does not respond to documented needs.',
    },
    {
      criterion: 'Coherence',
      weight: 0.1,
      description: 'How well does the intervention fit? Compatibility with other interventions in the country, sector, or institution: internal coherence (same actor) and external coherence (other actors).',
      scoringGuide:
        '90+: explicit mapping of complementarities, gaps, and contradictions with at least 2 other interventions (one same-actor, one other-actor). 70-89: some mapping but with gaps. 50-69: assertions of coherence without analysis. <50: no consideration of other interventions; risk of duplication or contradiction.',
    },
    {
      criterion: 'Effectiveness',
      weight: 0.2,
      description: 'Is it achieving its objectives? Extent to which the intervention achieved, or is expected to achieve, its objectives and results, including any differential results across groups (sex, age, disability, geography, socio-economic status).',
      scoringGuide:
        '90+: clear objectives with measurable targets; achievement backed by monitoring or evaluation data with a counterfactual; differential effects by sex/age/disability/geography reported. 70-89: objectives measurable; achievement evidenced but without counterfactual. 50-69: objectives vague or achievement asserted without data. <50: no measurable objectives or no evidence of achievement.',
    },
    {
      criterion: 'Efficiency',
      weight: 0.15,
      description: 'Are resources being used economically? Extent to which the intervention delivers results in an economic and timely way, considering value-for-money; cost per outcome relative to alternatives.',
      scoringGuide:
        '90+: cost per beneficiary and per outcome stated; compared to at least one alternative or benchmark (e.g. GiveDirectly cash benchmark, DCP3 cost-per-DALY thresholds, J-PAL cost-effectiveness tables); delivery on-time and on-budget. 70-89: cost per beneficiary stated; no comparison to alternatives. 50-69: budget presented but no unit-cost analysis. <50: no cost analysis; budget implausible or disproportionate to expected outcomes.',
    },
    {
      criterion: 'Impact',
      weight: 0.15,
      description: 'What difference does it make? Significant positive or negative, intended or unintended, higher-level effects; evidence of causal attribution.',
      scoringGuide:
        '90+: higher-level effects stated with magnitude and counterfactual evidence; unintended effects (positive and negative) actively monitored. 70-89: higher-level effects stated but without counterfactual. 50-69: impact asserted without magnitude or attribution logic. <50: no impact statement; no attribution logic.',
    },
    {
      criterion: 'Sustainability',
      weight: 0.15,
      description: 'Will benefits last? Extent to which net benefits continue after the intervention ends, across financial, institutional, environmental, and socio-cultural dimensions.',
      scoringGuide:
        '90+: explicit exit/handover plan naming the future owner, funder, and operator; capacity-gap analysis; sustainability across all four dimensions; realistic timeline with milestones. 70-89: exit plan present but partial (e.g. names owner but not funder). 50-69: sustainability asserted without a plan. <50: no consideration of post-funding period; program collapses when external support ends.',
    },
    {
      criterion: 'Evidence Quality',
      weight: 0.1,
      description: 'Are claims supported by evidence? Empirical claims are backed by rigorous sources (peer-reviewed, registered RCT, systematic review, recognised institutional review, official statistics).',
      scoringGuide:
        '90+: every empirical claim backed by a rigorous citable source; confidence ratings (high/medium/low) explicit per claim. 70-89: most claims cited; sources mostly rigorous. 50-69: some claims cited; sources uneven quality (mix of peer-reviewed and grey literature). <50: largely unsupported; anecdotes, blog posts, and unattributed statistics.',
    },
  ],
}
