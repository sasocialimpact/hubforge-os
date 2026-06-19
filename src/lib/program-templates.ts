// Instant Templates - pre-computed program structures that generate in <2 seconds
// Instead of running the full 9-engine loop (2-3 min), templates provide
// a 90% complete draft instantly. User customizes from there.

import type { ToCData, LogframeData } from './types'

export interface ProgramTemplate {
  id: string
  name: string
  category: string
  description: string
  icon: string
  problem: string
  toc: ToCData
  logframe: LogframeData
  budget: { category: string; percentage: number; description: string }[]
  risks: { risk: string; likelihood: string; impact: string; mitigation: string }[]
  estimatedDuration: string
  typicalBudget: string
}

export const PROGRAM_TEMPLATES: ProgramTemplate[] = [
  {
    id: 'fln',
    name: 'Foundation Literacy & Numeracy',
    category: 'Education',
    description: 'FLN program for early grade learners based on TaRL and structured pedagogy approaches.',
    icon: 'BookOpen',
    problem: 'Design a foundation literacy and numeracy program for [NUMBER] children in [GRADES] in [NUMBER] schools in [LOCATION]. Budget [BUDGET] over [DURATION].',
    estimatedDuration: '2-3 years',
    typicalBudget: '$50K - $500K',
    toc: {
      targetPopulation: 'Children in grades 1-3 in target schools',
      inputs: [
        'Trained facilitators/teachers (1 per 30 children)',
        'TaRL learning materials (level-appropriate)',
        'Assessment tools and tracking sheets',
        'Teacher training curriculum',
        'Community engagement materials',
        'Monitoring and evaluation framework',
      ],
      activities: [
        'Conduct baseline assessment of all learners',
        'Group children by learning level (not grade)',
        'Deliver TaRL instruction 2 hours/day, 5 days/week',
        'Conduct monthly progress assessments',
        'Train teachers on TaRL methodology (5-day initial + quarterly refresh)',
        'Engage parents through monthly meetings',
        'Conduct endline assessment and disseminate results',
      ],
      outputs: [
        '[NUMBER] children assessed at baseline',
        '[NUMBER] children receiving TaRL instruction',
        '[NUMBER] teachers trained in TaRL',
        'Monthly progress reports produced',
        '[NUMBER] parent meetings conducted',
      ],
      outcomes: [
        'X% of children can read a grade-level text (from Y% at baseline)',
        'X% of children can do basic operations (from Y% at baseline)',
        'Reduction in learning level gap between boys and girls',
        'Teachers regularly using level-based grouping',
      ],
      impact: 'Improved foundational learning outcomes for [NUMBER] children, contributing to long-term educational attainment and life opportunities',
      assumptions: [
        'Teachers attend training and implement TaRL with fidelity',
        'Schools allocate time for TaRL instruction',
        'Children attend school regularly (min 80% attendance)',
        'Learning materials are available and maintained',
        'Education department supports the approach',
      ],
      externalFactors: [
        'School closures (weather, conflict, pandemic)',
        'Teacher transfers or attrition',
        'Changes in government education policy',
        'Community migration patterns',
      ],
    },
    logframe: {
      goal: {
        level: 'Goal',
        description: 'Improved foundational learning outcomes for children in target schools',
        ovi: '% of grade 3 children reading with comprehension; % performing grade-level math',
        mov: 'ASER-style assessment; school records; endline evaluation',
        assumptions: 'Program approach is sustained beyond project period',
      },
      purpose: {
        level: 'Purpose',
        description: 'Children in grades 1-3 demonstrate improved reading and numeracy skills',
        ovi: 'X% improvement in reading fluency; X% improvement in math operations',
        mov: 'Baseline and endline assessments using EGRA/EGMA tools',
        assumptions: 'Learning gains are attributable to TaRL instruction',
      },
      outputs: [
        {
          level: 'Output',
          description: 'Children receive TaRL instruction',
          ovi: '[NUMBER] children; 2 hours/day; 5 days/week',
          mov: 'Attendance registers; classroom observation; facilitator reports',
          assumptions: 'Children attend regularly and participate actively',
        },
        {
          level: 'Output',
          description: 'Teachers trained in TaRL methodology',
          ovi: '[NUMBER] teachers; 5-day training + quarterly refresh',
          mov: 'Training records; pre/post tests; classroom observation',
          assumptions: 'Teachers apply training in classrooms',
        },
        {
          level: 'Output',
          description: 'Learning materials distributed',
          ovi: '[NUMBER] sets of materials; 1 per child',
          mov: 'Distribution records; inventory checks',
          assumptions: 'Materials are used and not lost',
        },
      ],
      activities: [
        { level: 'Activity', description: 'Baseline assessment', ovi: 'Assessment conducted in month 1', mov: 'Assessment report', assumptions: 'Schools accessible for assessment' },
        { level: 'Activity', description: 'Teacher training', ovi: '5-day training for [NUMBER] teachers', mov: 'Training report; attendance', assumptions: 'Teachers released for training' },
        { level: 'Activity', description: 'TaRL instruction', ovi: 'Daily instruction for [DURATION]', mov: 'Attendance; observation', assumptions: 'School schedule accommodates TaRL' },
        { level: 'Activity', description: 'Monthly assessments', ovi: 'Monthly progress tracking', mov: 'Progress reports', assumptions: 'Facilitators conduct assessments' },
        { level: 'Activity', description: 'Parent engagement', ovi: 'Monthly meetings in each school', mov: 'Meeting records', assumptions: 'Parents attend meetings' },
      ],
    },
    budget: [
      { category: 'Personnel (facilitators, coordinator)', percentage: 35, description: 'Salaries for facilitators and program coordinator' },
      { category: 'Training', percentage: 15, description: 'Teacher training, refreshers, coaching' },
      { category: 'Materials', percentage: 15, description: 'TaRL learning materials, assessment tools' },
      { category: 'Monitoring & Evaluation', percentage: 15, description: 'Baseline, monthly, endline assessments' },
      { category: 'Community Engagement', percentage: 10, description: 'Parent meetings, community events' },
      { category: 'Administration & Overhead', percentage: 10, description: 'Office, transport, communications' },
    ],
    risks: [
      { risk: 'Teacher attrition/transfer', likelihood: 'High', impact: 'High', mitigation: 'Train extra teachers; build refresher into budget' },
      { risk: 'Low attendance', likelihood: 'Medium', impact: 'High', mitigation: 'Community engagement; attendance incentives' },
      { risk: 'Materials lost/damaged', likelihood: 'Medium', impact: 'Medium', mitigation: 'Buffer stock; regular inventory' },
      { risk: 'School closures', likelihood: 'Low', impact: 'High', mitigation: 'Flexible calendar; catch-up sessions' },
    ],
  },
  {
    id: 'school-feeding',
    name: 'School Feeding Program',
    category: 'Education',
    description: 'School meals program procuring locally from smallholder farmers, based on WFP model.',
    icon: 'Utensils',
    problem: 'Design a school feeding program for [NUMBER] students in [NUMBER] schools in [LOCATION]. Budget [BUDGET] over [DURATION]. Procure locally from farmers.',
    estimatedDuration: '2 years',
    typicalBudget: '$100K - $1M',
    toc: {
      targetPopulation: 'Students in target schools; local smallholder farmers',
      inputs: ['Funding for meals', 'Kitchen equipment', 'Cook training', 'Farmer procurement contracts', 'Monitoring system', 'Nutrition standards'],
      activities: ['Establish kitchen facilities', 'Procure food from local farmers', 'Train cooks on meal preparation', 'Serve daily meals', 'Monitor attendance and learning', 'Build government capacity for handover'],
      outputs: ['[NUMBER] schools with functioning kitchens', 'Daily meals served to [NUMBER] students', '[NUMBER] farmer groups contracted', 'Quarterly monitoring reports'],
      outcomes: ['X% increase in school attendance', 'X% improvement in learning outcomes', 'X% increase in farmer income', 'Government capacity to manage program'],
      impact: 'Improved educational attainment through better nutrition, with sustainable school meals managed by county government',
      assumptions: ['Food supply is reliable', 'Cooks are available and trained', 'Schools have kitchen infrastructure', 'Government commits to takeover'],
      externalFactors: ['Food price volatility', 'Drought affecting supply', 'Government policy changes', 'Population migration'],
    },
    logframe: {
      goal: { level: 'Goal', description: 'Improved educational outcomes and local economic development through school feeding', ovi: 'Attendance rates; learning outcomes; farmer income', mov: 'School records; assessments; farmer surveys', assumptions: 'Program is sustained after handover' },
      purpose: { level: 'Purpose', description: 'Students receive nutritious daily meals and farmers have reliable market access', ovi: 'X% attendance increase; X% farmer income increase', mov: 'Attendance registers; farmer income surveys', assumptions: 'Meals contribute to attendance and learning' },
      outputs: [
        { level: 'Output', description: 'Daily meals served', ovi: '[NUMBER] students; 1 meal/day; 200 school days/year', mov: 'Meal logs; attendance', assumptions: 'Food supply and cooks available' },
        { level: 'Output', description: 'Farmer procurement network', ovi: '[NUMBER] farmer groups contracted', mov: 'Procurement records', assumptions: 'Farmers can meet quality and quantity' },
        { level: 'Output', description: 'Kitchen facilities established', ovi: '[NUMBER] schools with functioning kitchens', mov: 'Infrastructure assessment', assumptions: 'Schools have space and utilities' },
      ],
      activities: [
        { level: 'Activity', description: 'Kitchen assessment and upgrades', ovi: 'Baseline in month 1; upgrades by month 3', mov: 'Assessment report', assumptions: 'Schools cooperate' },
        { level: 'Activity', description: 'Farmer procurement contracts', ovi: 'Contracts signed by month 2', mov: 'Contract records', assumptions: 'Farmers willing to participate' },
        { level: 'Activity', description: 'Cook training', ovi: '3-day training for [NUMBER] cooks', mov: 'Training records', assumptions: 'Cooks available' },
        { level: 'Activity', description: 'Meal service', ovi: 'Daily for [DURATION]', mov: 'Daily logs', assumptions: 'Supply chain reliable' },
      ],
    },
    budget: [
      { category: 'Food procurement', percentage: 45, description: 'Purchase from local farmers' },
      { category: 'Kitchen equipment', percentage: 15, description: 'Stoves, utensils, storage' },
      { category: 'Personnel (cooks, coordinator)', percentage: 20, description: 'Cook stipends, program staff' },
      { category: 'Monitoring & Evaluation', percentage: 10, description: 'Attendance, learning, farmer surveys' },
      { category: 'Training', percentage: 5, description: 'Cook training, farmer capacity' },
      { category: 'Administration', percentage: 5, description: 'Transport, communications' },
    ],
    risks: [
      { risk: 'Food supply disruption', likelihood: 'Medium', impact: 'High', mitigation: 'Multiple supplier contracts; buffer stock' },
      { risk: 'Food price increase', likelihood: 'High', impact: 'Medium', mitigation: 'Forward contracts; budget contingency' },
      { risk: 'Kitchen infrastructure inadequate', likelihood: 'Medium', impact: 'Medium', mitigation: 'Baseline assessment; upgrade budget' },
      { risk: 'Government handover delayed', likelihood: 'Medium', impact: 'High', mitigation: 'Capacity building; phased transition' },
    ],
  },
  {
    id: 'water-point',
    name: 'Water Point Rehabilitation',
    category: 'WASH',
    description: 'Rehabilitate boreholes, train water committees, establish maintenance funds.',
    icon: 'Droplet',
    problem: 'Rehabilitate water points for [NUMBER] households in [LOCATION]. Budget [BUDGET] over [DURATION]. Include water committee training and maintenance fund.',
    estimatedDuration: '6-12 months',
    typicalBudget: '$10K - $100K',
    toc: {
      targetPopulation: '[NUMBER] households in target community',
      inputs: ['Funding for rehabilitation', 'Technical expertise (driller, hydrogeologist)', 'Training materials', 'Community labor', 'Maintenance fund seed capital'],
      activities: ['Conduct technical assessment', 'Rehabilitate borehole/water point', 'Train water committee (7-10 members)', 'Establish maintenance fund', 'Conduct hygiene education', 'Hand over to community'],
      outputs: ['[NUMBER] water points rehabilitated', 'Water committee trained and functional', 'Maintenance fund with 3 months capital', 'Hygiene education sessions conducted'],
      outcomes: ['Reduced distance to water source', 'Water committee managing maintenance', 'X% of households contributing to fund', 'Reduced water collection time'],
      impact: 'Improved health outcomes, increased economic productivity, enhanced community resilience',
      assumptions: ['Technical assessment confirms viability', 'Community participates actively', 'Local authority provides permits', 'Women represented on committee'],
      externalFactors: ['Groundwater availability', 'Weather conditions', 'Community cohesion', 'Equipment availability'],
    },
    logframe: {
      goal: { level: 'Goal', description: 'Sustainable access to clean water for target community', ovi: 'X% reduction in waterborne diseases; X hours saved per household', mov: 'Health clinic records; household surveys', assumptions: 'Water quality maintained long-term' },
      purpose: { level: 'Purpose', description: 'Community has functional, managed water point', ovi: 'Water point functional X% of time; X% household contribution', mov: 'Functionality checks; fund records', assumptions: 'Committee manages effectively' },
      outputs: [
        { level: 'Output', description: 'Water point rehabilitated', ovi: '[NUMBER] points; min X L/day', mov: 'Technical verification; flow tests', assumptions: 'Technical assessment accurate' },
        { level: 'Output', description: 'Water committee trained', ovi: '7-10 members; 40% women', mov: 'Training records; committee bylaws', assumptions: 'Community selects committed members' },
        { level: 'Output', description: 'Maintenance fund established', ovi: '3 months operating capital', mov: 'Fund records; bank statement', assumptions: 'Households contribute regularly' },
      ],
      activities: [
        { level: 'Activity', description: 'Technical assessment', ovi: 'Completed in week 1-2', mov: 'Assessment report', assumptions: 'Site accessible' },
        { level: 'Activity', description: 'Rehabilitation work', ovi: 'Completed in weeks 3-8', mov: 'Completion report', assumptions: 'Parts and labor available' },
        { level: 'Activity', description: 'Committee training', ovi: '3-day training', mov: 'Training report', assumptions: 'Members available' },
        { level: 'Activity', description: 'Hygiene education', ovi: 'X sessions in community', mov: 'Session records', assumptions: 'Community attends' },
      ],
    },
    budget: [
      { category: 'Rehabilitation (drilling, parts, labor)', percentage: 50, description: 'Technical work' },
      { category: 'Hand pump and installation', percentage: 20, description: 'Pump and infrastructure' },
      { category: 'Training and materials', percentage: 10, description: 'Committee training, hygiene education' },
      { category: 'Maintenance fund seed', percentage: 10, description: 'Initial 3-month capital' },
      { category: 'Monitoring & Evaluation', percentage: 5, description: 'Water quality, functionality checks' },
      { category: 'Contingency', percentage: 5, description: 'Unexpected costs' },
    ],
    risks: [
      { risk: 'Dry hole / low yield', likelihood: 'Medium', impact: 'High', mitigation: 'Thorough geological survey before drilling' },
      { risk: 'Pump breakdown', likelihood: 'High', impact: 'Medium', mitigation: 'Train community in basic maintenance; spare parts' },
      { risk: 'Low fund contribution', likelihood: 'Medium', impact: 'High', mitigation: 'Strong fee system; community ownership' },
      { risk: 'Water quality issues', likelihood: 'Low', impact: 'High', mitigation: 'Pre and post water quality testing' },
    ],
  },
  {
    id: 'climate-smart-ag',
    name: 'Climate-Smart Agriculture',
    category: 'Livelihoods',
    description: 'Layered intervention: drought-tolerant seed + conservation agriculture + VSLAs + insurance.',
    icon: 'Sprout',
    problem: 'Design a climate-smart agriculture program for [NUMBER] farmers in [LOCATION]. Budget [BUDGET] over [DURATION]. Include seed, training, savings groups, and weather insurance.',
    estimatedDuration: '3 years',
    typicalBudget: '$200K - $2M',
    toc: {
      targetPopulation: '[NUMBER] smallholder farmers in drought-prone areas',
      inputs: ['Drought-tolerant seed', 'Conservation agriculture training', 'VSLA facilitator training', 'Weather-indexed insurance', 'Extension support', 'M&E system'],
      activities: ['Distribute drought-tolerant seed', 'Train farmers on conservation agriculture', 'Establish VSLAs', 'Facilitate weather insurance enrollment', 'Provide extension support', 'Monitor crop yields and income'],
      outputs: ['[NUMBER] farmers using drought-tolerant seed', '[NUMBER] farmers trained in CA', '[NUMBER] VSLAs established', '[NUMBER] farmers insured'],
      outcomes: ['X% increase in crop yields', 'X% increase in farmer income', 'X% of farmers with savings', 'Reduced crop failure impact'],
      impact: 'Reduced rural poverty and increased resilience to climate shocks',
      assumptions: ['Seed is appropriate for local conditions', 'Farmers adopt CA practices', 'VSLAs are self-sustaining', 'Insurance pays out reliably'],
      externalFactors: ['Rainfall variability', 'Market prices', 'Pest outbreaks', 'Government seed policy'],
    },
    logframe: {
      goal: { level: 'Goal', description: 'Improved livelihoods and climate resilience for smallholder farmers', ovi: 'X% income increase; X% yield increase', mov: 'Household surveys; crop cuts', assumptions: 'Layered approach is more effective than single inputs' },
      purpose: { level: 'Purpose', description: 'Farmers adopt climate-smart practices and improve productivity', ovi: 'X% using CA; X% yield increase; X% income increase', mov: 'Annual surveys; yield measurement', assumptions: 'Adoption leads to productivity gains' },
      outputs: [
        { level: 'Output', description: 'Seed distributed', ovi: '[NUMBER] farmers; X kg each', mov: 'Distribution records', assumptions: 'Seed quality is good' },
        { level: 'Output', description: 'Farmers trained', ovi: '[NUMBER] trained; 3-day training', mov: 'Training records', assumptions: 'Farmers attend and apply' },
        { level: 'Output', description: 'VSLAs established', ovi: '[NUMBER] groups; 15-25 members each', mov: 'Group records; savings data', assumptions: 'Groups manage funds well' },
        { level: 'Output', description: 'Farmers insured', ovi: '[NUMBER] enrolled in weather insurance', mov: 'Insurance records', assumptions: 'Insurance product is trusted' },
      ],
      activities: [
        { level: 'Activity', description: 'Seed distribution', ovi: 'Before planting season', mov: 'Distribution logs', assumptions: 'Seed available on time' },
        { level: 'Activity', description: 'CA training', ovi: '3-day training per season', mov: 'Training reports', assumptions: 'Farmers attend' },
        { level: 'Activity', description: 'VSLA establishment', ovi: 'Groups formed in year 1', mov: 'Group registration', assumptions: 'Farmers willing to save' },
        { level: 'Activity', description: 'Insurance enrollment', ovi: 'Annual enrollment', mov: 'Insurance records', assumptions: 'Premium is affordable' },
      ],
    },
    budget: [
      { category: 'Seed and inputs', percentage: 25, description: 'Drought-tolerant seed distribution' },
      { category: 'Training', percentage: 20, description: 'CA training, VSLA facilitator training' },
      { category: 'VSLA support', percentage: 15, description: 'Group establishment, supervision' },
      { category: 'Insurance premium subsidy', percentage: 15, description: 'Co-funding insurance premiums' },
      { category: 'Extension support', percentage: 10, description: 'Field officers, demonstrations' },
      { category: 'M&E', percentage: 10, description: 'Surveys, yield measurement' },
      { category: 'Administration', percentage: 5, description: 'Office, transport' },
    ],
    risks: [
      { risk: 'Drought despite tolerant seed', likelihood: 'Medium', impact: 'High', mitigation: 'Insurance covers extreme drought' },
      { risk: 'Low CA adoption', likelihood: 'Medium', impact: 'Medium', mitigation: 'Demonstration plots; peer learning' },
      { risk: 'VSLA mismanagement', likelihood: 'Low', impact: 'Medium', mitigation: 'Training; regular audits' },
      { risk: 'Insurance basis risk', likelihood: 'Medium', impact: 'Medium', mitigation: 'Choose index carefully; educate farmers' },
    ],
  },
  {
    id: 'maternal-health',
    name: 'Maternal & Child Health',
    category: 'Health',
    description: 'Community health worker program for maternal health, based on WHO CHW model.',
    icon: 'Heart',
    problem: 'Design a maternal and child health program for [NUMBER] women and children in [LOCATION]. Budget [BUDGET] over [DURATION]. Use community health workers.',
    estimatedDuration: '3 years',
    typicalBudget: '$100K - $1M',
    toc: {
      targetPopulation: 'Pregnant women and children under 5 in target area',
      inputs: ['CHW training curriculum', 'Medical supplies (malaria nets, supplements)', 'Mobile health tools', 'Supervision system', 'Referral transport', 'M&E framework'],
      activities: ['Train CHWs (2 weeks initial + monthly refresh)', 'Conduct household visits (monthly per HH)', 'Distribute malaria nets and supplements', 'Refer high-risk pregnancies', 'Conduct health education sessions', 'Track pregnancies and outcomes'],
      outputs: ['[NUMBER] CHWs trained and deployed', '[NUMBER] households visited monthly', '[NUMBER] nets distributed', '[NUMBER] referrals made'],
      outcomes: ['X% of women receiving 4+ ANC visits', 'X% reduction in maternal complications', 'X% of children fully immunized', 'X% reduction in child illness'],
      impact: 'Reduced maternal and child mortality, improved health outcomes',
      assumptions: ['CHWs are retained and motivated', 'Referral facilities are functional', 'Supplies are available', 'Community trusts CHWs'],
      externalFactors: ['Health system capacity', 'Supply chain for commodities', 'Cultural barriers to care', 'Distance to facilities'],
    },
    logframe: {
      goal: { level: 'Goal', description: 'Reduced maternal and child mortality in target area', ovi: 'Maternal mortality ratio; under-5 mortality rate', mov: 'HMIS data; vital registration; surveys', assumptions: 'CHW model contributes to mortality reduction' },
      purpose: { level: 'Purpose', description: 'Women and children access timely health care and information', ovi: 'X% 4+ ANC; X% immunization; X% facility delivery', mov: 'CHW records; HMIS; household surveys', assumptions: 'CHW visits lead to behavior change' },
      outputs: [
        { level: 'Output', description: 'CHWs trained and deployed', ovi: '[NUMBER] CHWs; 1 per 100-200 households', mov: 'Training records; deployment map', assumptions: 'CHWs remain in position' },
        { level: 'Output', description: 'Households visited', ovi: 'Monthly visits to [NUMBER] households', mov: 'Visit logs; mobile data', assumptions: 'Households accept visits' },
        { level: 'Output', description: 'Commodities distributed', ovi: '[NUMBER] nets; supplements to [NUMBER] women', mov: 'Distribution records', assumptions: 'Supply chain reliable' },
      ],
      activities: [
        { level: 'Activity', description: 'CHW training', ovi: '2-week initial + monthly refresh', mov: 'Training records; competency tests', assumptions: 'Trainees are literate and committed' },
        { level: 'Activity', description: 'Household visits', ovi: 'Monthly per household', mov: 'Mobile app records', assumptions: 'CHWs have time and transport' },
        { level: 'Activity', description: 'Health education', ovi: 'Monthly community sessions', mov: 'Session records', assumptions: 'Community attends' },
        { level: 'Activity', description: 'Referral system', ovi: 'High-risk cases referred within 24h', mov: 'Referral logs; facility confirmation', assumptions: 'Facilities accept referrals' },
      ],
    },
    budget: [
      { category: 'CHW stipends', percentage: 30, description: 'Monthly stipends for community health workers' },
      { category: 'Training', percentage: 20, description: 'Initial + refresher training' },
      { category: 'Medical supplies', percentage: 20, description: 'Nets, supplements, basic supplies' },
      { category: 'Supervision', percentage: 10, description: 'Supervisors, transport for monitoring' },
      { category: 'Mobile health tools', percentage: 10, description: 'Phones, data, app maintenance' },
      { category: 'M&E', percentage: 10, description: 'Surveys, HMIS data collection' },
    ],
    risks: [
      { risk: 'CHW attrition', likelihood: 'High', impact: 'High', mitigation: 'Adequate stipend; career pathway; train replacements' },
      { risk: 'Supply stockouts', likelihood: 'Medium', impact: 'High', mitigation: 'Buffer stock; multiple suppliers' },
      { risk: 'Referral facility unavailable', likelihood: 'Medium', impact: 'High', mitigation: 'Map functional facilities; transport plan' },
      { risk: 'Cultural resistance', likelihood: 'Medium', impact: 'Medium', mitigation: 'Community engagement; male involvement' },
    ],
  },
]

export function getTemplateById(id: string): ProgramTemplate | undefined {
  return PROGRAM_TEMPLATES.find((t) => t.id === id)
}
