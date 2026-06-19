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
        'A causal map linking inputs → activities → outputs → outcomes → impact, made explicit alongside the assumptions and external factors that must hold for the chain to work.',
      whenToUse:
        'Program design, strategy development, evaluation planning, funder proposals, and any context where you must justify why an intervention will produce the desired impact.',
      keyElements: [
        'Target population and stakeholder map',
        'Inputs (resources)',
        'Activities (what is done)',
        'Outputs (what is produced)',
        'Outcomes (short/medium-term changes)',
        'Impact (long-term societal change)',
        'Assumptions (must hold for the chain to work)',
        'External factors (outside the program’s control)',
      ],
      template:
        'IF we deliver [inputs] through [activities] producing [outputs], THEN [outcomes] will occur, leading to [impact], PROVIDED THAT [assumptions] hold and [external factors] are favourable.',
    },
    {
      name: 'Logical Framework Analysis (Logframe)',
      layer: 2,
      description:
        'A 4×4 matrix linking goal, purpose, outputs, and activities to objectively verifiable indicators, means of verification, and assumptions.',
      whenToUse:
        'Proposal writing, donor reporting, and any context requiring structured accountability across the results chain.',
      keyElements: [
        'Goal (impact-level)',
        'Purpose (outcome-level)',
        'Outputs',
        'Activities',
        'Objectively Verifiable Indicators (OVIs)',
        'Means of Verification (MoVs)',
        'Assumptions (per level)',
      ],
      template:
        'For each results level (Goal / Purpose / Outputs / Activities), state: the result, the OVI that measures it, the MoV (data source), and the assumption that must hold for the next level up to occur.',
    },
    {
      name: 'Outcome Mapping',
      layer: 2,
      description:
        'Focuses on changes in the behaviour of boundary partners (the people, groups, or organisations the program works with directly) rather than on broad impact.',
      whenToUse:
        'Complex programs where change is non-linear, partners are many, and attribution to impact is contested.',
      keyElements: [
        'Boundary partners',
        'Outcome challenges (desired behaviour changes)',
        'Progress markers (expect-to-see, like-to-see, love-to-see)',
        'Strategy maps',
        'Organisational practices',
      ],
    },
    {
      name: 'Most Significant Change (MSC)',
      layer: 2,
      description:
        'A participatory, story-based technique where field staff and beneficiaries select the most significant change stories, which are then vetted by panels.',
      whenToUse:
        'Programs where unexpected outcomes are likely, where beneficiary voice matters, and where quantitative indicators miss the story.',
      keyElements: [
        'Story collection from field',
        'Domain of change definition',
        'Panel-based story selection',
        'Verification',
        'Feedback to field',
      ],
    },
    {
      name: 'Impact Evaluation Methods',
      layer: 2,
      description:
        'Counterfactual methods (RCTs, quasi-experimental, difference-in-differences, regression discontinuity) for estimating net impact.',
      whenToUse:
        'When attribution is required and a credible counterfactual can be constructed.',
      keyElements: [
        'Treatment and comparison groups',
        'Pre/post measurement',
        'Matching or randomisation',
        'Attrition handling',
        'Heterogeneous treatment effects',
      ],
    },
    {
      name: 'Survey Design',
      layer: 2,
      description:
        'Principles for designing valid, reliable, and ethical survey instruments including sampling, question wording, and mode effects.',
      whenToUse:
        'When primary data collection is required for baseline, midline, or endline measurement.',
      keyElements: [
        'Sampling frame and sample size (power calculation)',
        'Question wording (neutral, single-barreled, culturally appropriate)',
        'Mode (face-to-face, phone, online)',
        'Pilot and cognitive testing',
        'Ethical safeguards (consent, anonymity)',
      ],
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
      check: 'Every stated goal must be Specific, Measurable, Achievable, Relevant, and Time-bound.',
      passCondition: 'Goal contains a measurable target and a time horizon.',
      failAction: 'Reject goal; require explicit measurable target and deadline.',
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
      check: 'Factual claims about effectiveness, prevalence, or causation must cite an evidence source.',
      passCondition: 'Each empirical claim is paired with a named source.',
      failAction: 'Flag unsupported claims; require citation or removal.',
    },
    {
      name: 'Risk Identification',
      layer: 4,
      check: 'The strategy must identify at least three material risks and propose mitigations.',
      passCondition: '≥3 risks with mitigations listed.',
      failAction: 'Flag missing risk analysis; require completion.',
    },
  ],
  evidence: [
    {
      title: 'OECD-DAC Criteria for Evaluating Development Assistance',
      type: 'Institutional Framework',
      summary:
        'Six criteria - relevance, coherence, effectiveness, efficiency, impact, sustainability - used to evaluate development interventions.',
    },
    {
      title: 'Better Evaluation Rainbow Framework',
      type: 'Methodology Framework',
      summary:
        'Comprehensive framework organising evaluation tasks: manage, define, frame, describe, understand causes, synthesise, report and support use.',
    },
    {
      title: 'Innosight Institute - Theory of Change Field Guide',
      type: 'Practitioner Guide',
      summary:
        'Step-by-step guidance on building theories of change, including common pitfalls (uncritical assumptions, missing links, vague outcomes).',
    },
    {
      title: 'World Bank IEG Impact Evaluation Handbook',
      type: 'Methodology Handbook',
      summary:
        'Reference on counterfactual impact evaluation methods including RCTs, difference-in-differences, regression discontinuity, and matching.',
    },
    {
      title: 'CGAP - Financial Diaries of Smallholder Households',
      type: 'Empirical Study',
      summary:
        'Documents the income, expense, and shock-coping patterns of smallholder households; useful baseline for climate-adaptation program design.',
    },
  ],
  historicalMemory: [
    {
      problem: 'Design a farmer livelihoods program in sub-Saharan Africa',
      context: 'Smallholder farmers facing climate variability, weak extension services, and thin input markets.',
      outcome:
        'Program that combined drought-tolerant seed distribution with village savings groups and weather-indexed insurance outperformed seed-only programs.',
      lesson:
        'Layered interventions addressing production, finance, and risk jointly outperform single-input programs. Assume standalone input distribution is insufficient.',
    },
    {
      problem: 'Design a girls’ education program in South Asia',
      context: 'Low female secondary completion; early marriage; safety concerns.',
      outcome:
        'Cash transfers conditioned on attendance plus community gender-norms dialogue raised completion more than cash alone.',
      lesson:
        'Supply-side and demand-side barriers must be addressed together; financial incentives alone rarely shift deeply held social norms.',
    },
    {
      problem: 'Design a healthcare access program for rural populations',
      context: 'Long travel times to clinics; staff shortages; low trust.',
      outcome:
        'Community health worker programs with regular supervision and resupply outperformed facility-only models.',
      lesson:
        'Last-mile delivery requires a supervised, resupplied workforce; CHWs without support degrade quickly.',
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
    { name: 'Replace vague outputs with measurable targets', layer: 8, description: 'Convert “improve livelihoods” into “raise median income by X% by year Y”.' },
    { name: 'Strengthen causal logic', layer: 8, description: 'Make every link in the theory of change explicit and testable.' },
    { name: 'Detect logical inconsistency', layer: 8, description: 'Find places where one claim contradicts another in the same document.' },
    { name: 'Reduce uncertainty', layer: 8, description: 'Where uncertainty is high, propose data collection to resolve it.' },
  ],
  evaluationCriteria: [
    {
      criterion: 'Evidence Base',
      weight: 0.2,
      description: 'Claims are supported by cited evidence and prior cases.',
      scoringGuide:
        '90+: every claim cited; 70-89: most claims cited; 50-69: some cited; <50: largely unsupported.',
    },
    {
      criterion: 'Measurability (SMART)',
      weight: 0.2,
      description: 'Targets are Specific, Measurable, Achievable, Relevant, Time-bound.',
      scoringGuide:
        '90+: all targets SMART; 70-89: most SMART; 50-69: many vague; <50: mostly vague.',
    },
    {
      criterion: 'Feasibility',
      weight: 0.2,
      description: 'Strategy is implementable with realistic resources, capacity, and timeline.',
      scoringGuide:
        '90+: clearly feasible; 70-89: feasible with effort; 50-69: stretches capacity; <50: unrealistic.',
    },
    {
      criterion: 'Stakeholder Coverage',
      weight: 0.15,
      description: 'Primary beneficiaries, implementers, and influencers are addressed.',
      scoringGuide:
        '90+: all three named with strategies; 70-89: two of three; 50-69: one of three; <50: none.',
    },
    {
      criterion: 'Causal Logic (Theory of Change)',
      weight: 0.15,
      description: 'Inputs → activities → outputs → outcomes → impact chain is explicit and testable.',
      scoringGuide:
        '90+: full chain with assumptions; 70-89: chain present; 50-69: partial; <50: missing.',
    },
    {
      criterion: 'Risk & Assumption Awareness',
      weight: 0.1,
      description: 'Material risks and key assumptions are identified with mitigations.',
      scoringGuide:
        '90+: ≥3 risks + ≥3 assumptions; 70-89: some; 50-69: minimal; <50: none.',
    },
  ],
}
