// HubForge OS - Healthcare Domain Pack
// Encodes the 8-layer Knowledge Graph for the Healthcare domain.

import type { DomainPack } from './knowledge'

export const healthcarePack: DomainPack = {
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

  // Layer 1 - Domain Knowledge
  domainKnowledge: [
    'Health systems strengthening requires simultaneous investment across all six WHO building blocks; strengthening one block (e.g., medicines) without the others (e.g., workforce to prescribe them) produces limited gains.',
    'Primary healthcare is the most cost-effective platform for delivering essential health services. The Astana Declaration (2018) reaffirmed PHC as the cornerstone of universal health coverage.',
    'Community health workers (CHWs) are the backbone of last-mile health delivery. WHO recommends CHW-to-population ratios of 1:500-1,000, with adequate training, supervision, supplies, and remuneration.',
    'Maternal and child health programs must address the "three delays" framework: delay in deciding to seek care, delay in reaching care, and delay in receiving adequate care at the facility.',
    'Disease surveillance systems require timely, complete, and accurate data. Integrated Disease Surveillance and Response (IDSR) is the WHO-recommended strategy for Africa.',
    'Immunization programs depend on cold chain integrity, community demand generation, and microplanning for reaching zero-dose children. The Reaching Every District (RED) strategy is the standard approach.',
    'Health workforce shortages are most acute in sub-Saharan Africa and South Asia. Task-shifting (e.g., nurses performing procedures traditionally done by doctors) is an evidence-based strategy to address gaps.',
    'Essential medicines access requires functional supply chains, rational selection (WHO Essential Medicines List), affordable pricing, and appropriate prescribing. Stockouts at the last mile remain a persistent challenge.',
    'Health financing in LMICs typically combines tax revenue, donor funding, social health insurance, community-based health insurance, and out-of-pocket payments. WHO recommends countries aim for <20% out-of-pocket expenditure.',
    'Digital health (mHealth) can improve health worker performance, patient adherence, and data quality, but requires investment in infrastructure, training, interoperability, and data governance. WHO published guidelines on digital health interventions in 2019.',
    'One Health recognizes that human health, animal health, and environmental health are interconnected. Zoonotic diseases (e.g., Ebola, avian influenza, COVID-19) account for 75% of emerging infectious diseases.',
    'Quality of care is as important as access. The Lancet Global Health Commission (2018) estimated that 8.6 million deaths per year in LMICs are attributable to poor-quality care, more than from lack of access.',
  ],

  // Layer 2 - Framework Knowledge
  frameworks: [
    {
      name: 'WHO Health System Building Blocks',
      layer: 2,
      description:
        'The WHO framework identifies six essential building blocks of a health system: service delivery, health workforce, health information systems, access to essential medicines, health financing, and leadership/governance. Strengthening requires investment across all blocks simultaneously.',
      whenToUse:
        'Use when designing or evaluating a health system strengthening program, assessing system readiness, or identifying bottlenecks in health service delivery.',
      keyElements: [
        'Service delivery (access, quality, safety, coverage)',
        'Health workforce (availability, competence, distribution, retention)',
        'Health information systems (data collection, analysis, use, DHIS2)',
        'Access to essential medicines (selection, procurement, distribution, rational use)',
        'Health financing (revenue collection, pooling, purchasing, financial protection)',
        'Leadership and governance (policy, regulation, accountability, coordination)',
      ],
      template: `## WHO Health System Building Blocks Analysis

### 1. Service Delivery
- Current coverage levels:
- Quality gaps:
- Access barriers (geographic, financial, cultural):

### 2. Health Workforce
- Current staffing levels vs. WHO minimum:
- Training and competency gaps:
- Distribution challenges (urban/rural):
- Retention and motivation:

### 3. Health Information Systems
- Current HMIS/DHIS2 status:
- Data quality and completeness:
- Data use for decision-making:

### 4. Access to Essential Medicines
- Essential medicines availability:
- Supply chain functionality:
- Cold chain status (for vaccines):
- Rational prescribing practices:

### 5. Health Financing
- Current health expenditure (% GDP):
- Out-of-pocket share:
- Insurance coverage:
- Donor dependency:

### 6. Leadership & Governance
- Policy environment:
- Regulatory capacity:
- Coordination mechanisms:
- Community accountability:

### Cross-cutting Assessment
- Which building blocks are strongest?
- Which are the binding constraints?
- Proposed investment priorities:`,
    },
    {
      name: 'RE-AIM Framework',
      layer: 2,
      description:
        'RE-AIM evaluates health interventions across five dimensions: Reach (proportion of target population), Effectiveness (impact on outcomes), Adoption (uptake by settings/providers), Implementation (fidelity, consistency, cost), and Maintenance (sustainability over time). Originally designed for health promotion, it is widely used in implementation science.',
      whenToUse:
        'Use when planning or evaluating a health intervention to ensure comprehensive assessment beyond just effectiveness. Especially useful for translating evidence-based interventions into real-world practice.',
      keyElements: [
        'Reach (% of target population participating, representativeness)',
        'Effectiveness (impact on health outcomes, quality of life, adverse effects)',
        'Adoption (% of settings/providers that adopt, representativeness)',
        'Implementation (fidelity to protocol, cost, adaptations made)',
        'Maintenance (sustainability at individual and organizational levels)',
      ],
      template: `## RE-AIM Assessment

### Reach
- Target population:
- Expected participation rate:
- Strategies to reach marginalized groups:
- Barriers to participation:

### Effectiveness
- Primary health outcomes:
- Secondary outcomes:
- Expected effect size (based on evidence):
- Potential adverse effects:

### Adoption
- Target settings (facilities, communities):
- Provider buy-in strategy:
- Training and support for adopters:
- Barriers to adoption:

### Implementation
- Core intervention components (non-negotiable):
- Adaptable components (can be contextualized):
- Cost per beneficiary:
- Quality assurance plan:

### Maintenance
- Sustainability plan (post-funding):
- Government ownership pathway:
- Institutionalization strategy:
- Long-term outcome monitoring:`,
    },
    {
      name: 'Donabedian Model (Structure-Process-Outcome)',
      layer: 2,
      description:
        'The Donabedian model assesses healthcare quality through three dimensions: Structure (resources, organization, infrastructure), Process (clinical and non-clinical activities), and Outcome (health status, patient satisfaction, cost). Quality improvement requires understanding how structural inputs enable processes that produce outcomes.',
      whenToUse:
        'Use when designing quality improvement programs, evaluating health facility performance, or developing quality indicators for health services.',
      keyElements: [
        'Structure (infrastructure, equipment, staffing, guidelines, financing)',
        'Process (clinical care, patient-provider interaction, referrals, documentation)',
        'Outcome (mortality, morbidity, patient satisfaction, functional status)',
        'Linkages between structure, process, and outcome',
        'Quality indicators at each level',
      ],
      template: `## Donabedian Quality Assessment

### Structure
- Infrastructure and equipment:
- Staffing levels and qualifications:
- Clinical guidelines available:
- Drugs and supplies:
- Financing and budget:

### Process
- Clinical protocols followed:
- Patient-provider interactions:
- Referral processes:
- Documentation and record-keeping:
- Waiting times and patient flow:

### Outcome
- Clinical outcomes (mortality, morbidity):
- Patient satisfaction:
- Readmission rates:
- Cost-effectiveness:
- Equity in outcomes:

### Quality Improvement Plan
- Priority gaps identified:
- Interventions to address gaps:
- Indicators to track improvement:
- Timeline and responsibilities:`,
    },
    {
      name: 'PRECEDE-PROCEED Model',
      layer: 2,
      description:
        'A comprehensive planning model for health behavior change programs. PRECEDE (Predisposing, Reinforcing, and Enabling Constructs in Educational Diagnosis and Evaluation) guides needs assessment and program planning. PROCEED (Policy, Regulatory, and Organizational Constructs in Educational and Environmental Development) guides implementation and evaluation.',
      whenToUse:
        'Use when designing health promotion or behavior change programs, particularly those requiring community engagement and multi-level interventions (individual, organizational, policy).',
      keyElements: [
        'Social assessment (community needs and quality of life)',
        'Epidemiological assessment (health problems and determinants)',
        'Behavioral and environmental assessment (modifiable risk factors)',
        'Educational and ecological assessment (predisposing, reinforcing, enabling factors)',
        'Administrative and policy assessment (resources and organizational capacity)',
        'Implementation',
        'Process, impact, and outcome evaluation',
      ],
      template: `## PRECEDE-PROCEED Planning

### PRECEDE Phase
#### Social Assessment
- Community health priorities:
- Quality of life concerns:
- Community assets and strengths:

#### Epidemiological Assessment
- Health problem and burden (prevalence, mortality, DALYs):
- Key determinants:
- Affected populations:

#### Behavioral & Environmental Assessment
- Target behaviors to change:
- Environmental factors to modify:
- Behavioral risk factors:

#### Educational & Ecological Assessment
- Predisposing factors (knowledge, attitudes, beliefs):
- Enabling factors (skills, resources, access):
- Reinforcing factors (social support, incentives, feedback):

### PROCEED Phase
#### Implementation Plan
- Intervention strategies:
- Resources needed:
- Timeline:
- Partnerships:

#### Evaluation Plan
- Process indicators:
- Impact indicators:
- Outcome indicators:`,
    },
    {
      name: 'Continuous Quality Improvement (CQI / PDSA)',
      layer: 2,
      description:
        'Plan-Do-Study-Act (PDSA) cycles applied to healthcare settings. CQI is a systematic, data-driven approach to improving health service delivery through iterative testing of small changes. Widely used by organizations like IHI (Institute for Healthcare Improvement) and adapted for LMIC health facilities through programs like Project ECHO and MESH-QI.',
      whenToUse:
        'Use when improving quality of care at health facilities, designing quality improvement collaboratives, or establishing routine quality monitoring systems.',
      keyElements: [
        'Plan (identify problem, develop change idea, define measures)',
        'Do (implement change on small scale, collect data)',
        'Study (analyze data, compare to predictions, summarize learning)',
        'Act (adopt, adapt, or abandon the change; plan next cycle)',
        'Driver diagrams (primary and secondary drivers of improvement)',
        'Run charts and control charts for tracking progress',
      ],
      template: `## CQI / PDSA Cycle

### Problem Statement
- What are we trying to improve?
- Current performance (baseline data):
- Target performance:

### PDSA Cycle 1
#### Plan
- Change idea:
- Prediction:
- Data to collect:
- Who, what, when, where:

#### Do
- Implementation notes:
- Data collected:
- Observations:

#### Study
- Results vs. prediction:
- What did we learn?

#### Act
- Adopt / Adapt / Abandon:
- Next cycle plan:

### Driver Diagram
- Aim:
- Primary drivers:
- Secondary drivers:
- Change ideas:`,
    },
    {
      name: 'One Health Framework',
      layer: 2,
      description:
        'One Health is an integrated approach recognizing that human health, animal health, and environmental health are interconnected. It is essential for addressing zoonotic diseases, antimicrobial resistance, food safety, and environmental health threats. The approach requires multisectoral collaboration across human health, veterinary, and environmental agencies.',
      whenToUse:
        'Use when designing programs that address zoonotic disease risks, antimicrobial resistance, food safety, or environmental health threats requiring cross-sector collaboration.',
      keyElements: [
        'Human health sector (surveillance, clinical care, public health response)',
        'Animal health sector (veterinary services, livestock health, wildlife monitoring)',
        'Environmental health (water, sanitation, ecosystem health, climate)',
        'Multisectoral coordination (joint surveillance, shared laboratories, coordinated response)',
        'Antimicrobial resistance (stewardship in human and animal health)',
        'Community engagement (awareness, behavior change, reporting)',
      ],
      template: `## One Health Assessment

### Human Health
- Disease burden (zoonotic diseases, AMR):
- Surveillance capacity:
- Clinical management capacity:
- Public health response readiness:

### Animal Health
- Livestock disease burden:
- Wildlife-human interface risks:
- Veterinary service capacity:
- Animal surveillance systems:

### Environmental Health
- Water and sanitation status:
- Ecosystem health threats:
- Climate-related health risks:
- Environmental surveillance:

### Multisectoral Coordination
- Existing coordination mechanisms:
- Joint surveillance systems:
- Shared laboratory capacity:
- Coordinated response protocols:

### Program Design
- Priority interventions:
- Cross-sector activities:
- Community engagement plan:
- Monitoring and evaluation:`,
    },
  ],

  // Layer 3 - Procedural Knowledge
  procedures: [
    {
      name: 'Health Program Design Process',
      steps: [
        {
          step: 'Situational Analysis & Needs Assessment',
          description:
            'Analyze the health situation using epidemiological data (GBD, DHS/MICS, HMIS), identify priority health problems, map existing services and gaps using WHO building blocks, and conduct community consultations to understand demand-side barriers.',
        },
        {
          step: 'Stakeholder Mapping & Engagement',
          description:
            'Map all stakeholders: Ministry of Health (national and subnational), health facilities, community health workers, community leaders, beneficiaries, donors, other NGOs. Conduct stakeholder consultations to ensure alignment and avoid duplication.',
        },
        {
          step: 'Evidence Review & Intervention Selection',
          description:
            'Review evidence base for candidate interventions (Cochrane reviews, DCP3, WHO guidelines). Select interventions based on effectiveness, cost-effectiveness (cost per DALY averted), feasibility in context, and equity impact.',
        },
        {
          step: 'Theory of Change & Logical Framework',
          description:
            'Develop a theory of change showing the causal pathway from inputs to impact. Translate into a logframe with SMART indicators, means of verification, and explicit assumptions. Include referral pathway design.',
        },
        {
          step: 'Implementation Planning',
          description:
            'Develop detailed implementation plan: staffing and recruitment, training curriculum, supply chain and procurement, supervision system, referral protocols, community engagement strategy, and phased rollout timeline.',
        },
        {
          step: 'M&E Framework & Data Systems',
          description:
            'Design M&E framework with indicators aligned to DHIS2/national HMIS. Plan for baseline data collection, routine monitoring (monthly/quarterly), midterm review, and endline evaluation. Specify data collection tools, data flow, and data quality assurance.',
        },
        {
          step: 'Budgeting & Financing',
          description:
            'Develop detailed budget including personnel, training, supplies, transport, M&E, and overhead. Identify financing sources and sustainability pathway (government co-financing, insurance integration, phased handover).',
        },
        {
          step: 'Scale-up & Sustainability Planning',
          description:
            'Design scale-up pathway: pilot → evidence → advocacy → national adoption. Plan for government ownership, policy integration, health workforce institutionalization, and long-term financing.',
        },
      ],
    },
    {
      name: 'Health Impact Evaluation Process',
      steps: [
        {
          step: 'Evaluation Design & Protocol',
          description:
            'Select appropriate evaluation design: RCT, quasi-experimental (DiD, RDD, PSM), or mixed methods. Develop evaluation protocol including research questions, primary and secondary outcomes, sample size calculation, and ethical considerations (IRB approval).',
        },
        {
          step: 'Baseline Data Collection',
          description:
            'Conduct baseline survey in treatment and comparison areas. Collect data on health outcomes, service utilization, knowledge/attitudes/practices, and socioeconomic status. Ensure comparability of groups at baseline.',
        },
        {
          step: 'Intervention Implementation & Process Monitoring',
          description:
            'Implement the health intervention while monitoring fidelity, dose, reach, and quality. Document adaptations made during implementation. Collect routine monitoring data throughout the intervention period.',
        },
        {
          step: 'Endline Data Collection',
          description:
            'Conduct endline survey using same instruments and sampling approach as baseline. Collect qualitative data (in-depth interviews, focus groups) to understand mechanisms of change and contextual factors.',
        },
        {
          step: 'Data Analysis & Impact Estimation',
          description:
            'Analyze data using pre-specified analysis plan. Estimate impact using difference-in-differences, intent-to-treat, or other appropriate methods. Conduct subgroup analyses (gender, wealth, geography). Calculate cost-effectiveness (cost per DALY averted, ICER).',
        },
        {
          step: 'Dissemination & Policy Translation',
          description:
            'Produce evaluation report with clear findings and policy recommendations. Disseminate through peer-reviewed publications, policy briefs, stakeholder workshops, and WHO/government channels. Feed findings into program adaptation and scale-up decisions.',
        },
      ],
    },
  ],

  // Layer 4 - Decision Rules
  decisionRules: [
    {
      name: 'Clinical Evidence Check',
      layer: 4,
      check: 'Do all proposed health interventions cite clinical evidence (RCTs, systematic reviews, WHO guidelines, DCP3)?',
      passCondition:
        'Every clinical intervention references at least one high-quality evidence source (Cochrane review, WHO guideline, or RCT published in a peer-reviewed journal).',
      failAction:
        'Flag unsupported interventions. Suggest relevant WHO guidelines or Cochrane reviews. If no evidence exists, recommend the intervention be framed as a pilot with built-in evaluation.',
    },
    {
      name: 'Equity & Access Check',
      layer: 4,
      check: 'Does the program explicitly address health equity dimensions: gender, poverty/wealth quintile, geographic access, disability, age, and ethnicity?',
      passCondition:
        'Program includes equity analysis, disaggregated targets (by sex, wealth, geography), and specific strategies to reach the most marginalized populations (e.g., fee waivers, mobile clinics, sign language interpreters).',
      failAction:
        'Add equity analysis. Disaggregate indicators by sex, wealth quintile, and urban/rural. Add strategies to reach populations identified as underserved in DHS/MICS data.',
    },
    {
      name: 'Health Workforce Feasibility',
      layer: 4,
      check: 'Are proposed staffing ratios realistic for the context? Does the plan account for recruitment, training, supervision, retention, and WHO minimum density thresholds?',
      passCondition:
        'Staffing plan references WHO minimum thresholds (4.45 doctors, nurses, and midwives per 1,000 population for SDG target). CHW ratios are within 1:500-1,000 households. Plan includes training duration, supervision frequency, and retention strategy.',
      failAction:
        'Revise staffing to realistic levels. If workforce gaps are severe, incorporate task-shifting strategy. Add supervision plan (at least monthly supportive supervision). Include retention measures (stipend, career pathway, recognition).',
    },
    {
      name: 'Supply Chain Viability',
      layer: 4,
      check: 'Do proposed medicines, vaccines, and medical supplies have a reliable procurement pathway, including cold chain for vaccines and temperature-sensitive items?',
      passCondition:
        'Procurement plan identifies specific supply sources (national medical stores, UNICEF Supply Division, Global Drug Facility). Cold chain assessment completed for vaccines. Buffer stock policy defined (minimum 3 months). Last-mile distribution plan included.',
      failAction:
        'Map the complete supply chain from manufacturer to point of care. Conduct cold chain assessment. Identify backup suppliers. Add buffer stock and stockout monitoring. Include supply chain costs in budget.',
    },
    {
      name: 'Referral Pathway Completeness',
      layer: 4,
      check: 'Is there a clear referral chain from community level to primary care to secondary/tertiary care, with defined referral criteria, transport, communication, and counter-referral?',
      passCondition:
        'Referral pathway maps all levels (community → health post → health center → district hospital → referral hospital). Each level has defined referral criteria, communication protocol, transport arrangement, and counter-referral mechanism.',
      failAction:
        'Map the referral pathway for the target area. Identify gaps (missing levels, no transport, non-functional facilities). Add referral criteria, communication protocol (phone/radio), emergency transport plan, and counter-referral system.',
    },
    {
      name: 'Data & Surveillance Integration',
      layer: 4,
      check: 'Does the M&E plan integrate with the national Health Management Information System (HMIS/DHIS2) and contribute to disease surveillance?',
      passCondition:
        'M&E indicators are aligned with national HMIS indicators. Data collection tools are compatible with DHIS2. Plan includes data quality assurance (DQA), routine data review meetings, and use of data for decision-making at facility and district levels.',
      failAction:
        'Align indicators with DHIS2 standard indicator set. Plan for interoperability between project data systems and national HMIS. Add data quality assurance protocols. Include capacity building for data use at all levels.',
    },
    {
      name: 'Community Engagement & Trust',
      layer: 4,
      check: 'Does the program include meaningful community engagement, community health workers, trust-building mechanisms, and demand generation activities?',
      passCondition:
        'Program includes: community health workers or volunteers from the target community; community health committees or governance structures; health education and demand generation; feedback mechanisms for community voice; strategies to address cultural and social barriers to care-seeking.',
      failAction:
        'Add community engagement strategy. Identify and train community health workers from target communities. Establish community health committees. Design health education sessions addressing local barriers. Create feedback mechanisms (suggestion boxes, community scorecards, toll-free hotlines).',
    },
  ],

  // Layer 5 - Evidence Libraries
  evidence: [
    {
      title: 'WHO Global Health Observatory (GHO)',
      type: 'database',
      summary:
        'Comprehensive repository of global health statistics covering 1,000+ indicators across all WHO member states. Essential for baseline data on mortality, morbidity, service coverage, health workforce, and health financing. Updated annually.',
      sourceUrl: 'https://www.who.int/data/gho',
    },
    {
      title: 'Lancet Commissions on Global Health',
      type: 'commission-report',
      summary:
        'Series of landmark reports including the Lancet Commission on High Quality Health Systems (2018), which found 8.6M annual deaths from poor-quality care in LMICs, and the Lancet Commission on the Future of Health in sub-Saharan Africa (2017). Provide evidence-based recommendations for health system reform.',
      sourceUrl: 'https://www.thelancet.com/commissions',
    },
    {
      title: 'Demographic and Health Surveys (DHS) / MICS',
      type: 'survey-methodology',
      summary:
        'Nationally representative household surveys conducted in 90+ LMICs. DHS (USAID-funded) and MICS (UNICEF-funded) provide comparable data on maternal/child health, nutrition, family planning, HIV/AIDS, malaria, and health service utilization. Gold standard for population-level health data in LMICs.',
      sourceUrl: 'https://dhsprogram.com/',
    },
    {
      title: 'Cochrane Systematic Reviews (Public Health)',
      type: 'systematic-review',
      summary:
        'Gold-standard systematic reviews and meta-analyses of health interventions. The Cochrane Public Health Group covers interventions addressing social determinants, health promotion, and population health. Essential for evidence-based intervention selection.',
      sourceUrl: 'https://www.cochranelibrary.com/',
    },
    {
      title: 'UNICEF State of the World\'s Children',
      type: 'annual-report',
      summary:
        'Annual flagship report on child well-being globally. Provides data on child survival, nutrition, immunization, education, and protection. Includes country-specific statistical tables and thematic analysis of emerging issues in child health.',
      sourceUrl: 'https://www.unicef.org/reports/state-worlds-children',
    },
    {
      title: 'Global Burden of Disease Study (IHME)',
      type: 'database',
      summary:
        'Comprehensive assessment of mortality and disability from 369 diseases and injuries in 204 countries (1990-present). Provides DALYs, YLLs, YLDs by cause, age, sex, and country. Essential for priority-setting and cost-effectiveness analysis.',
      sourceUrl: 'https://www.healthdata.org/research-analysis/gbd',
    },
    {
      title: 'WHO Model List of Essential Medicines',
      type: 'guideline',
      summary:
        'Updated biennially, the list identifies minimum medicines needed for a basic health system. Guides national medicine selection, procurement, and supply. The 2023 list includes 502 medicines. Complementary list for children covers pediatric formulations.',
      sourceUrl: 'https://www.who.int/groups/expert-committee-on-selection-and-use-of-essential-medicines',
    },
    {
      title: 'WHO Guideline on Health Policy and System Support to Optimize CHW Programmes',
      type: 'guideline',
      summary:
        'WHO 2018 guideline providing evidence-based recommendations on CHW selection, training, certification, supervision, remuneration, career advancement, and community embeddedness. Foundational reference for any CHW program design.',
      sourceUrl: 'https://www.who.int/publications/i/item/9789241550369',
    },
    {
      title: 'WHO Guideline: Recommendations on Digital Interventions for Health System Strengthening',
      type: 'guideline',
      summary:
        'WHO 2019 guideline covering 10 digital health interventions including birth/death notification, stock management, client health records, telemedicine, and health worker decision support. Provides evidence ratings and implementation considerations.',
      sourceUrl: 'https://www.who.int/publications/i/item/9789241550505',
    },
    {
      title: 'Primary Health Care Performance Initiative (PHCPI)',
      type: 'framework',
      summary:
        'Joint initiative of WHO, World Bank, and Gates Foundation providing a conceptual framework, vital signs profile, and improvement strategies for primary healthcare. Covers PHC inputs, service delivery, outputs, and outcomes with country-comparable indicators.',
      sourceUrl: 'https://phcpi.org/',
    },
    {
      title: 'Disease Control Priorities, 3rd Edition (DCP3)',
      type: 'reference-volume',
      summary:
        'Nine-volume series identifying the most cost-effective health interventions for LMICs. Defines essential universal health coverage packages (EUHC) costing $76-$271 per capita. Provides cost-effectiveness data ($/DALY averted) for hundreds of interventions across disease areas.',
      sourceUrl: 'https://dcp-3.org/',
    },
  ],

  // Layer 6 - Historical Memory
  historicalMemory: [
    {
      problem: 'How to achieve rapid maternal mortality reduction in a low-income, post-genocide country with devastated health infrastructure.',
      context:
        'Rwanda deployed 45,000 community health workers (3 per village: 1 focused on maternal/child health, 1 on community-based health insurance, 1 on social affairs) with performance-based financing, strong government coordination, and mandatory community-based health insurance (Mutuelles de Sante reaching 91% coverage).',
      outcome:
        'Maternal mortality fell from 1,071 per 100,000 live births (2000) to 210 (2017). Under-5 mortality dropped from 196 to 50 per 1,000. Rwanda achieved MDG targets ahead of schedule and is now a global model for community health.',
      lesson:
        'Political will, community ownership, performance-based incentives, and universal health insurance coverage can produce dramatic health gains even in the poorest settings. The community health worker model works best when embedded in a strong health system with clear supervision and accountability.',
    },
    {
      problem: 'How to deliver TB treatment in communities where patients cannot regularly visit health facilities.',
      context:
        'BRAC in Bangladesh trained community health volunteers (Shasthya Shebikas) to identify TB suspects, collect sputum, deliver DOTS (Directly Observed Treatment, Short-course), and follow up on treatment adherence. Volunteers were primarily women who earned small commissions from health product sales.',
      outcome:
        'BRAC\'s TB program achieved treatment success rates above 92%, exceeding the WHO target of 85%. The program served over 90 million people and contributed significantly to Bangladesh\'s national TB control. The model demonstrated that community-based DOTS was feasible and effective at scale.',
      lesson:
        'Community-based treatment delivery by trained volunteers can achieve clinical outcomes comparable to or better than facility-based care, especially when the alternative is patients not completing treatment. Financial sustainability through health product sales helps retain volunteers.',
    },
    {
      problem: 'How to extend primary healthcare to rural populations in a country with severe health workforce shortages.',
      context:
        'Ethiopia deployed 38,000 Health Extension Workers (HEWs) — two per kebele (village) — through the Health Extension Programme (HEP) starting in 2003. HEWs are salaried government employees with 1 year of training who deliver 16 packages of preventive and promotive care from health posts.',
      outcome:
        'Contraceptive prevalence rose from 15% (2005) to 41% (2019). Under-5 mortality fell from 166 to 55 per 1,000. Immunization coverage more than doubled. The program reached 85% of the rural population. However, curative care quality and HEW motivation remain challenges.',
      lesson:
        'Government-salaried, well-trained community health workers can dramatically expand coverage of preventive services. But the model struggles with curative care quality and worker motivation if career pathways and supervision are inadequate. Integration with facility-based services is essential.',
    },
    {
      problem: 'How to achieve universal health coverage in a large, diverse middle-income country with massive uninsured population.',
      context:
        'India launched Ayushman Bharat in 2018 with two components: Health and Wellness Centres (HWCs) converting 150,000 sub-centres into comprehensive primary care centres, and Pradhan Mantri Jan Arogya Yojana (PM-JAY) providing Rs. 500,000 ($6,000) annual health insurance to 500 million people in the poorest 40% of households.',
      outcome:
        'By 2023, PM-JAY had authorized over 50 million hospital admissions worth $7+ billion. Over 150,000 HWCs operationalized. Hospital utilization increased among poorest quintiles. However, challenges remain in provider quality, fraud prevention, and out-of-pocket spending on outpatient care.',
      lesson:
        'Large-scale government health insurance can rapidly reduce financial barriers to hospital care. But insurance alone is insufficient — concurrent investment in primary care, provider quality, and outpatient coverage is needed to truly reduce out-of-pocket expenditure and improve health outcomes.',
    },
    {
      problem: 'How to achieve and sustain universal health coverage in a middle-income country.',
      context:
        'Thailand introduced the Universal Coverage Scheme (UCS) in 2002, providing comprehensive coverage to 47 million previously uninsured citizens (75% of population) through a tax-financed capitation model. The "30 Baht Scheme" charged a flat copayment (later abolished) and used a closed-end budget with capitation payment to contracted providers.',
      outcome:
        'Out-of-pocket health spending fell from 33% to 11% of total health expenditure. Catastrophic health spending dropped from 6.8% to 2.8% of households. Infant mortality continued declining. The program cost only 3.1% of government budget. Thailand is now a WHO reference case for UHC.',
      lesson:
        'Tax-financed universal coverage is achievable in middle-income countries at modest cost. Key success factors: strong primary care gatekeeping, capitation-based provider payment, autonomous purchasing agency (NHSO), and civil society advocacy. Political commitment during a window of opportunity was crucial.',
    },
    {
      problem: 'How to rebuild health services and remove financial barriers after a devastating disease outbreak.',
      context:
        'Sierra Leone launched the Free Healthcare Initiative (FHCI) in 2010, removing user fees for pregnant women, lactating mothers, and children under 5. After the 2014-2015 Ebola outbreak killed 221 health workers and devastated the health system, the country rebuilt with increased investment in surveillance, community health workers, and facility readiness.',
      outcome:
        'Post-FHCI, facility deliveries increased by 45% and child health consultations increased by 60%. Post-Ebola, the country established one of Africa\'s strongest disease surveillance systems. However, drug stockouts, health worker shortages, and quality gaps persist. The Ebola experience catalyzed health system investments that might not have occurred otherwise.',
      lesson:
        'Removing user fees rapidly increases utilization but must be accompanied by supply-side investment (drugs, staff, equipment) to maintain quality. Crisis can be a catalyst for health system strengthening if recovery investments address underlying structural weaknesses rather than just restoring the pre-crisis status quo.',
    },
    {
      problem: 'How to reduce HIV incidence among adolescent girls and young women in high-burden settings.',
      context:
        'The DREAMS (Determined, Resilient, Empowered, AIDS-free, Mentored, Safe) Partnership, launched in 2014 by PEPFAR, Bill & Melinda Gates Foundation, and Girl Effect, delivered a multi-layered package in 10 sub-Saharan African countries: HIV testing, PrEP, condom promotion, school-based interventions, economic strengthening, violence prevention, and community mobilization targeting 15-24 year old females in high-burden districts.',
      outcome:
        'In Malawi, DREAMS districts showed 25-40% greater decline in new HIV diagnoses among 15-24 year old females compared to non-DREAMS districts. Across countries, DREAMS districts consistently outperformed comparison areas. The layered approach addressing structural drivers (poverty, violence, education) alongside biomedical interventions proved more effective than single-intervention approaches.',
      lesson:
        'HIV prevention for adolescent girls requires addressing structural drivers (poverty, gender-based violence, school dropout) alongside biomedical interventions (testing, PrEP, treatment). Multi-sectoral, layered packages targeting the same population are more effective than single interventions. Saturation within geographic areas matters more than thin coverage across wide areas.',
    },
    {
      problem: 'How to use mobile technology to improve health financing and access in a low-resource setting.',
      context:
        'M-TIBA, launched in 2014 in Kenya by PharmAccess, Safaricom, and CarePay, created a mobile health wallet allowing users to save, receive, and spend funds exclusively on healthcare at connected clinics. The platform linked to M-PESA mobile money, enabled targeted health subsidies to reach individuals directly, and generated real-time data on health-seeking behavior and costs.',
      outcome:
        'By 2020, M-TIBA had connected 4.8 million users and 900+ healthcare providers. The platform demonstrated that digital health financing can reduce financial barriers, improve targeting of subsidies, and generate data for evidence-based health financing policy. Average out-of-pocket costs per visit decreased for connected users.',
      lesson:
        'Mobile health financing platforms can leapfrog traditional insurance infrastructure in settings with high mobile money penetration. Success requires partnerships between tech companies, health organizations, and providers. Data generated by digital platforms can inform health financing policy. However, sustainability depends on reaching scale and reducing transaction costs.',
    },
  ],

  // Layer 7 - Reasoning Patterns
  reasoningPatterns: [
    {
      name: 'Epidemiological Reasoning',
      layer: 7,
      description:
        'Reason from disease burden data to intervention selection to expected outcome. Start with the problem (what is the leading cause of mortality/morbidity?), identify modifiable risk factors, select evidence-based interventions that address those factors, and project expected impact using effect sizes from trials. Use DALYs, NNT (number needed to treat), and attributable fraction to quantify expected benefit.',
    },
    {
      name: 'Health Systems Thinking',
      layer: 7,
      description:
        'Reason about health interventions as operating within an interconnected system. A change in one building block affects others (e.g., training more nurses without increasing drug supplies creates frustrated workers and dissatisfied patients). Identify bottleneck building blocks that constrain the entire system. Consider both supply-side (services, workforce, supplies) and demand-side (awareness, access, affordability, acceptability) factors.',
    },
    {
      name: 'Cost-Effectiveness Reasoning',
      layer: 7,
      description:
        'Compare interventions by their cost per unit of health gain (cost per DALY averted, cost per life-year saved, ICER). Use DCP3 benchmarks: interventions costing <$100/DALY averted are "very cost-effective" in low-income settings. Consider opportunity costs — resources spent on one intervention cannot be spent on another. Apply the concept of the "best buys" (WHO) for maximum health impact per dollar.',
    },
    {
      name: 'Equity-Focused Reasoning',
      layer: 7,
      description:
        'Prioritize the most-marginalized-first. Use disaggregated data (DHS wealth quintiles, urban/rural, gender) to identify who is being left behind. Apply progressive universalism — reaching the poorest first while building toward universal coverage. Consider intersecting disadvantages (e.g., a poor, rural, adolescent girl faces compounding barriers). Evaluate whether an intervention narrows or widens health inequities.',
    },
    {
      name: 'Implementation Science Reasoning',
      layer: 7,
      description:
        'Bridge the evidence-practice gap by reasoning about how interventions work in real-world conditions vs. controlled trials. Consider fidelity vs. adaptation tension (core components must be maintained while adapting to context). Use implementation outcomes (acceptability, adoption, appropriateness, feasibility, fidelity, cost, penetration, sustainability) alongside effectiveness outcomes. Apply the RE-AIM framework to assess real-world impact.',
    },
    {
      name: 'Behavioral Health Reasoning',
      layer: 7,
      description:
        'Reason through the knowledge-attitude-practice (KAP) chain to design behavior change interventions. Lack of knowledge does not always explain poor health behaviors — attitudes (perceived susceptibility, severity, benefits, barriers) and social norms may be more important. Consider the Health Belief Model, Social Cognitive Theory, and stages of change. Design interventions that address the binding behavioral constraint, not just information gaps.',
    },
  ],

  // Layer 8 - Improvement Heuristics
  improvementHeuristics: [
    {
      name: 'Specify Measurable Health Indicators',
      layer: 8,
      description:
        'Replace vague health outcomes with measurable indicators tied to global standards. Example: change "improve health" to "reduce under-5 mortality from 80 to 40 per 1,000 live births by 2027" or "increase DPT3 coverage from 65% to 90% in target district by 2026." Use WHO/SDG indicator definitions.',
    },
    {
      name: 'Add Clinical Evidence Citations',
      layer: 8,
      description:
        'For every clinical intervention proposed, add a citation to WHO guidelines, Cochrane reviews, or published RCTs. If no evidence exists for the proposed intervention, flag it as unproven and recommend framing as a pilot with built-in evaluation. Reference DCP3 for cost-effectiveness data.',
    },
    {
      name: 'Strengthen Referral Pathways',
      layer: 8,
      description:
        'Ensure the program describes a complete referral chain: community health worker → health post → health center → district hospital → referral hospital. For each level, specify referral criteria, communication method, transport arrangement, and counter-referral mechanism. Map the nearest functional facility for each level.',
    },
    {
      name: 'Address Health Workforce Gaps',
      layer: 8,
      description:
        'Verify that proposed CHW-to-population ratios are within WHO-recommended ranges (1:500-1,000 households). Include training duration (initial and refresher), supervision plan (monthly supportive supervision), retention strategy (stipend, career pathway), and task descriptions. If health worker density is below WHO thresholds, add task-shifting strategy.',
    },
    {
      name: 'Add Supply Chain and Cold Chain Considerations',
      layer: 8,
      description:
        'For any program involving medicines, vaccines, or medical supplies, add supply chain analysis: procurement source, distribution pathway, storage requirements (cold chain for vaccines), buffer stock policy (minimum 3 months), stockout monitoring, and last-mile delivery plan. Include cold chain equipment assessment for immunization programs.',
    },
    {
      name: 'Include Demand-Side Barriers',
      layer: 8,
      description:
        'Address why people do not use available health services. Include analysis of demand-side barriers: financial (user fees, transport costs, lost wages), geographic (distance, travel time, terrain), cultural (traditional healers, gender norms, birth practices), and informational (health literacy, awareness of services). Design interventions to address binding demand-side constraints.',
    },
    {
      name: 'Integrate with National Health Information Systems',
      layer: 8,
      description:
        'Ensure program data flows into the national HMIS (typically DHIS2 in LMICs). Align indicators with national indicator definitions. Plan for interoperability between project tools (mobile apps, paper registers) and DHIS2. Include data quality assurance and capacity building for data use at facility and district levels.',
    },
    {
      name: 'Add Sustainability and Government Ownership Plan',
      layer: 8,
      description:
        'Include explicit pathway from donor-funded project to government-owned program. Address: government co-financing commitment, integration into government health plans and budgets, health workforce absorption (CHWs onto government payroll), policy advocacy, and phased transition timeline. Reference insurance integration where applicable.',
    },
    {
      name: 'Include Community Engagement and Accountability',
      layer: 8,
      description:
        'Add community engagement mechanisms: community health committees, community scorecards, participatory planning, feedback mechanisms (suggestion boxes, toll-free hotlines), and social accountability tools (citizen report cards, public expenditure tracking). Ensure community voice in program design, implementation, and evaluation.',
    },
  ],

  // Evaluation Criteria
  evaluationCriteria: [
    {
      criterion: 'Clinical Evidence Base',
      weight: 0.20,
      description: 'Proposed health interventions are supported by clinical evidence from RCTs, systematic reviews, WHO guidelines, or DCP3.',
      scoringGuide:
        '0-25: No evidence cited; interventions are unproven or contraindicated. 26-50: Some evidence referenced but not for the specific context or population; evidence quality is low. 51-75: Interventions are supported by WHO guidelines or moderate-quality evidence; some gaps in evidence for specific components. 76-100: All interventions cite high-quality evidence (Cochrane reviews, WHO strong recommendations, well-designed RCTs); cost-effectiveness data included.',
    },
    {
      criterion: 'Health Equity & Access',
      weight: 0.20,
      description: 'Program explicitly addresses health equity dimensions including gender, poverty, geographic access, disability, and other forms of marginalization.',
      scoringGuide:
        '0-25: No equity analysis; program likely benefits the already-advantaged. 26-50: Equity mentioned but not operationalized; no disaggregated targets. 51-75: Equity analysis included with some disaggregated targets; strategies to reach underserved but not comprehensive. 76-100: Thorough equity analysis with disaggregated indicators; explicit strategies for the most marginalized; progressive universalism approach; gender and disability analysis integrated.',
    },
    {
      criterion: 'Health System Integration',
      weight: 0.15,
      description: 'Program works within and strengthens the existing health system rather than creating parallel structures.',
      scoringGuide:
        '0-25: Creates parallel system; no linkage to government health services. 26-50: Some coordination with government but operates independently; limited system strengthening. 51-75: Aligned with government health plans; uses existing facilities and staff; some capacity building. 76-100: Fully integrated into government health system; strengthens building blocks; government co-leads implementation; clear institutionalization pathway.',
    },
    {
      criterion: 'Measurability & Data Quality',
      weight: 0.20,
      description: 'SMART indicators defined, DHIS2-compatible, with baseline data, data quality assurance, and plan for data use.',
      scoringGuide:
        '0-25: No indicators defined; no baseline; no M&E plan. 26-50: Some indicators but not SMART; no baseline data; M&E plan vague. 51-75: SMART indicators defined; baseline planned; M&E framework exists but data quality and use plans are weak. 76-100: Comprehensive M&E framework with SMART indicators aligned to DHIS2; baseline data collected; data quality assurance plan; regular data review and use for decision-making.',
    },
    {
      criterion: 'Sustainability & Scale',
      weight: 0.15,
      description: 'Clear pathway from pilot to scale with government ownership, financing sustainability, and policy integration.',
      scoringGuide:
        '0-25: No sustainability plan; fully donor-dependent with no exit strategy. 26-50: Sustainability mentioned but no concrete plan; government engagement is superficial. 51-75: Government co-financing commitment; some integration into health plans; phased transition planned. 76-100: Government co-leads with clear budget line; policy integration achieved; workforce absorbed into government system; financing pathway beyond donor funding.',
    },
    {
      criterion: 'Community Engagement',
      weight: 0.10,
      description: 'Meaningful community participation in design, implementation, and monitoring with accountability mechanisms.',
      scoringGuide:
        '0-25: No community engagement; top-down design. 26-50: Community consulted but not actively participating; no feedback mechanisms. 51-75: Community health workers and committees involved; some feedback mechanisms; community voice in implementation. 76-100: Community co-designs program; active health committees; social accountability tools; regular community feedback loops; community ownership of monitoring.',
    },
  ],
}

// Canonical example problem for the Healthcare pack
export const HEALTHCARE_CANONICAL_EXAMPLE =
  'Design a maternal and newborn health program to reduce maternal mortality in a rural district of sub-Saharan Africa with limited health facility access.'
