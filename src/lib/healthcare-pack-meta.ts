// Frontend-facing Healthcare Pack metadata.
// Mirrors the healthcare-pack.ts for display purposes.

import type { PackMeta } from './social-impact-pack'

export const healthcarePackMeta: PackMeta = {
  id: 'healthcare',
  name: 'Healthcare Pack',
  domain: 'Healthcare',
  version: '0.1.0',
  description:
    'Domain intelligence for health program design, health systems strengthening, community health, disease prevention, and health financing in low- and middle-income countries.',
  supports: [
    'Health program design',
    'Health systems strengthening',
    'Community health worker programs',
    'Immunization and disease prevention',
    'Maternal and child health',
    'Health financing and insurance',
    'Digital health / mHealth',
    'Health impact evaluation',
  ],
  layers: {
    frameworks: 6,
    decisionRules: 7,
    evidence: 11,
    historicalMemory: 8,
    reasoningPatterns: 6,
    improvementHeuristics: 9,
  },
  frameworkNames: [
    'WHO Health System Building Blocks',
    'RE-AIM Framework',
    'Donabedian Model (Structure-Process-Outcome)',
    'PRECEDE-PROCEED Model',
    'Continuous Quality Improvement (CQI / PDSA)',
    'One Health Framework',
  ],
  ruleNames: [
    'Clinical Evidence Check',
    'Equity & Access Check',
    'Health Workforce Feasibility',
    'Supply Chain Viability',
    'Referral Pathway Completeness',
    'Data & Surveillance Integration',
    'Community Engagement & Trust',
  ],
  evaluationCriteria: [
    { criterion: 'Clinical Evidence Base', weight: 0.20, description: 'Interventions supported by RCTs, systematic reviews, WHO guidelines.' },
    { criterion: 'Health Equity & Access', weight: 0.20, description: 'Addresses gender, poverty, geographic, disability barriers.' },
    { criterion: 'Health System Integration', weight: 0.15, description: 'Works within and strengthens existing health system.' },
    { criterion: 'Measurability & Data Quality', weight: 0.20, description: 'SMART indicators, DHIS2-compatible, baseline data.' },
    { criterion: 'Sustainability & Scale', weight: 0.15, description: 'Government ownership pathway, financing sustainability.' },
    { criterion: 'Community Engagement', weight: 0.10, description: 'Community participation, trust, accountability.' },
  ],
}

export const HEALTHCARE_CANONICAL_EXAMPLE =
  'Design a maternal and newborn health program to reduce maternal mortality in a rural district of sub-Saharan Africa with limited health facility access.'

export const HEALTHCARE_EXAMPLE_PROBLEMS: { label: string; problem: string }[] = [
  {
    label: 'Maternal health (canonical)',
    problem: HEALTHCARE_CANONICAL_EXAMPLE,
  },
  {
    label: 'Community health worker scale-up',
    problem:
      'Design a community health worker program to deploy 2,000 CHWs across 10 rural districts, providing integrated maternal/child health, malaria, and nutrition services to 1 million people with a $3M budget over 3 years.',
  },
  {
    label: 'Immunization coverage improvement',
    problem:
      'Design a program to identify and vaccinate zero-dose children in 5 underserved districts with DPT3 coverage below 50%, addressing supply chain gaps, community distrust, and nomadic populations.',
  },
  {
    label: 'Mental health integration',
    problem:
      'Design a program to integrate mental health services into primary healthcare in a low-income country where there are only 0.1 psychiatrists per 100,000 population, using task-shifting to trained primary care workers and community health workers.',
  },
]
