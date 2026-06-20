// Frontend-facing Education Pack metadata.
// Mirrors the education-pack.ts for display purposes.

import type { PackMeta } from './social-impact-pack'

export const educationPackMeta: PackMeta = {
  id: 'education',
  name: 'Education Pack',
  domain: 'Education',
  version: '0.1.0',
  description:
    'Domain intelligence for education program design, learning assessment, ' +
    'teacher professional development, inclusive education, and education system ' +
    'strengthening. Built on evidence from Pratham, BRAC, Room to Read, CAMFED, ' +
    'J-PAL, UNESCO, and the global education community.',
  supports: [
    'Foundational literacy and numeracy program design',
    'Early grade reading and math assessment (EGRA/EGMA)',
    'Teacher professional development and coaching',
    'Girls\' education and gender-responsive programming',
    'Inclusive education for children with disabilities',
    'Education in emergencies and accelerated education',
    'School governance and community accountability',
    'EdTech and digital learning program design',
    'Education financing and cost-effectiveness analysis',
    'Education system strengthening and policy alignment',
  ],
  layers: {
    frameworks: 6,
    decisionRules: 7,
    evidence: 12,
    historicalMemory: 8,
    reasoningPatterns: 6,
    improvementHeuristics: 9,
  },
  frameworkNames: [
    'Foundational Literacy & Numeracy (FLN) Framework',
    'EGRA/EGMA Assessment Framework',
    'Gender-Responsive Education Framework',
    'Inclusive Education Framework',
    'Whole School Development Model',
    'Social-Emotional Learning (SEL) Framework',
  ],
  ruleNames: [
    'Learning Outcome Measurement',
    'Teacher-Student Ratio Feasibility',
    'Inclusion & Equity Check',
    'Curriculum & Pedagogy Alignment',
    'Community & Parental Engagement',
    'Assessment & Data Use',
    'Sustainability & System Integration',
  ],
  evaluationCriteria: [
    {
      criterion: 'Learning Outcomes Focus',
      weight: 0.25,
      description:
        'The program measures and targets actual learning gains — not just access, enrollment, or attendance.',
    },
    {
      criterion: 'Equity & Inclusion',
      weight: 0.20,
      description:
        'The program addresses barriers faced by marginalized groups: gender, disability, poverty, language, ethnicity, and displacement.',
    },
    {
      criterion: 'Pedagogy & Curriculum Quality',
      weight: 0.20,
      description:
        'The program uses evidence-based teaching approaches aligned with national curriculum.',
    },
    {
      criterion: 'Teacher & School Capacity',
      weight: 0.15,
      description:
        'The program provides realistic teacher development and school-level support.',
    },
    {
      criterion: 'Data & Evidence Use',
      weight: 0.10,
      description:
        'The program has a clear assessment strategy and plan for using data to improve implementation.',
    },
    {
      criterion: 'Sustainability & System Integration',
      weight: 0.10,
      description:
        'The program integrates with the government education system and plans for sustainability.',
    },
  ],
}

export const EDUCATION_EXAMPLE_PROBLEMS = [
  {
    label: 'Foundational literacy (canonical)',
    problem:
      'Design a 3-year program to ensure 80% of grade 3 students in a rural district of East Africa ' +
      'can read with comprehension and perform basic arithmetic, in a context where current reading ' +
      'benchmarks are met by only 15% of students.',
  },
  {
    label: 'Girls\' secondary education',
    problem:
      'Design a girls\' secondary education program in rural South Asia where only 35% of girls ' +
      'complete secondary school, with early marriage, safety concerns, and economic barriers as ' +
      'primary drivers of dropout.',
  },
  {
    label: 'Teacher professional development at scale',
    problem:
      'Design a national teacher professional development program for 50,000 primary school teachers ' +
      'to improve literacy instruction, in a country where most teachers received pre-service training ' +
      '10+ years ago and have never received in-service coaching.',
  },
  {
    label: 'Education in emergencies',
    problem:
      'Design an accelerated education program for 10,000 out-of-school refugee children aged 8-14 ' +
      'in a protracted displacement context, where children have missed 2-5 years of schooling and ' +
      'speak a different language from the host country curriculum.',
  },
]
