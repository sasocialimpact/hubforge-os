// HubForge OS - Education Domain Pack
// Encodes expert-level education domain knowledge for program design,
// learning assessment, teacher development, and education system strengthening.

import type { DomainPack } from './knowledge'

export const educationPack: DomainPack = {
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

  /* ------------------------------------------------------------------ */
  /*  DOMAIN KNOWLEDGE (Layer 1 - Expert-Level Insights)                */
  /* ------------------------------------------------------------------ */
  domainKnowledge: [
    // 1. Foundational Literacy and Numeracy (FLN)
    'The global learning crisis is not primarily an access crisis but a learning crisis. ' +
    'While enrollment rates have risen dramatically (primary net enrollment reached 89% globally by 2019), ' +
    'learning outcomes remain catastrophically low. The World Bank\'s Learning Poverty metric (2019) found ' +
    'that 53% of children in low- and middle-income countries cannot read and understand a simple story by ' +
    'age 10. In Sub-Saharan Africa, this figure exceeds 86%. COVID-19 school closures (averaging 141 days ' +
    'of full closure globally) pushed learning poverty to an estimated 70% in LMICs. Foundational literacy ' +
    'and numeracy (FLN) — the ability to read with comprehension and perform basic arithmetic by the end of ' +
    'grade 3 — is the prerequisite for all subsequent learning. Without FLN, children sit in classrooms for ' +
    'years without learning, accumulating "schooling" but not "learning." The World Bank estimates that ' +
    'learning-adjusted years of schooling (LAYS) in LMICs average only 7.9 years vs. 11.2 actual years ' +
    'of schooling — a gap of 3.3 years of lost learning.',

    // 2. Teaching at the Right Level (TaRL)
    'Teaching at the Right Level (TaRL), pioneered by Pratham in India, is one of the most rigorously ' +
    'evaluated and cost-effective education interventions globally. The core insight is that age-grade ' +
    'progression systems force teachers to teach to the curriculum rather than to children\'s actual ' +
    'learning levels, leaving behind children who haven\'t mastered foundational skills. TaRL involves: ' +
    '(a) assessing children\'s actual reading and math levels using simple oral assessments; ' +
    '(b) grouping children by learning level rather than age or grade; ' +
    '(c) using targeted activities and simple teaching-learning materials appropriate to each level; ' +
    '(d) reassessing regularly and regrouping as children progress. Over 20 RCTs across India and Africa ' +
    'consistently show effect sizes of 0.6-0.7 standard deviations on reading and math — among the largest ' +
    'effects of any education intervention. Pratham has reached 60+ million children across India, and TaRL ' +
    'Africa has replicated the model in Botswana, Cote d\'Ivoire, Ghana, Kenya, Madagascar, Mozambique, ' +
    'Nigeria, Tanzania, Uganda, and Zambia. The marginal cost is approximately $10-15 per child per year, ' +
    'making it one of the most cost-effective education interventions per J-PAL\'s analysis.',

    // 3. Early Childhood Development (ECD)
    'The neuroscience of early childhood development establishes that 90% of brain development occurs by ' +
    'age 5, with the first 1,000 days (conception to age 2) being the most critical period for neural ' +
    'architecture. However, the window for foundational cognitive, language, and socio-emotional development ' +
    'extends through age 8 (the "first decade" framework). Nurturing care — responsive caregiving, ' +
    'nutrition, safety, early stimulation, and early learning — is the foundation for school readiness and ' +
    'lifelong learning. An estimated 250 million children under 5 in LMICs (43%) are at risk of not reaching ' +
    'their developmental potential due to poverty and stunting (Lancet, 2017). Pre-primary education access ' +
    'remains deeply inequitable: globally, only 54% of children attend organized pre-primary learning (2020), ' +
    'but in low-income countries, this drops to 24%. Children who attend quality pre-primary programs show ' +
    'higher school readiness scores, better grade 1 reading and math, lower repetition, and lower dropout. ' +
    'Jamaica\'s early stimulation trial (Grantham-McGregor) showed that children who received early ' +
    'stimulation earned 25% more as adults — a landmark RCT demonstrating lifelong returns to ECD.',

    // 4. Girls\' Education Barriers
    'Girls\' education barriers are multidimensional and vary by context but cluster into four categories: ' +
    '(a) Economic barriers — direct costs (fees, uniforms, materials), opportunity costs (girls\' domestic ' +
    'labor, caregiving for siblings), and perceived low returns to girls\' education in contexts where ' +
    'women\'s labor market participation is low; ' +
    '(b) Socio-cultural barriers — early/child marriage (12 million girls married before 18 each year), ' +
    'son preference, restrictive gender norms that limit girls\' mobility, and menstruation taboos; ' +
    '(c) School-related barriers — lack of female teachers (only 40% of primary teachers in Sub-Saharan ' +
    'Africa are female), absence of separate latrines with menstrual hygiene facilities, school-related ' +
    'gender-based violence (SRGBV), and gender-biased curriculum/teaching practices; ' +
    '(d) Safety barriers — distance to school (girls face greater risks during travel), conflict and ' +
    'insecurity, and harassment. Globally, 129 million girls are out of school (2022). The dropout cliff ' +
    'for girls occurs at the primary-to-secondary transition: while the gender gap in primary has narrowed ' +
    'significantly, secondary completion rates for girls in LMICs remain 15-20 percentage points below boys ' +
    'in many countries. Each additional year of secondary education for a girl is associated with 10-20% ' +
    'higher future earnings, delayed marriage by 1.5 years, and 5-10% lower fertility.',

    // 5. Teacher Professional Development
    'The evidence on teacher professional development (TPD) has shifted dramatically in the past decade. ' +
    'Traditional TPD — one-off cascade training workshops (national → regional → district → school) — has ' +
    'been shown to have minimal impact on teaching practice or student learning. A 2019 World Bank review ' +
    'of 100+ TPD programs found that the most effective approaches share five features: ' +
    '(a) Focus on subject-specific pedagogy (not generic teaching skills); ' +
    '(b) Provide structured lesson plans and teaching-learning materials (structured pedagogy); ' +
    '(c) Include ongoing coaching and mentoring (not one-off training); ' +
    '(d) Embed practice and feedback cycles (observe-practice-feedback); ' +
    '(e) Foster peer learning communities (Professional Learning Communities / PLCs). ' +
    'Structured pedagogy programs (which combine teacher guides, student materials, coaching, and assessment) ' +
    'show average effect sizes of 0.23 SD on learning outcomes — the largest average effect of any education ' +
    'system intervention category. Coaching alone adds approximately 0.15 SD above training-only programs. ' +
    'The teacher motivation challenge is equally critical: in many LMICs, 15-25% of teachers are absent on ' +
    'any given day, and among those present, only 50-75% are actively teaching ("time on task"). ' +
    'Interventions that combine structured pedagogy with accountability mechanisms (community monitoring, ' +
    'head teacher supervision) show the strongest results.',

    // 6. School Governance and Community Accountability
    'School Management Committees (SMCs), Parent-Teacher Associations (PTAs), and similar community-based ' +
    'governance structures are mandated in most countries but often exist only on paper. When they function ' +
    'well, these bodies improve accountability (monitoring teacher attendance, tracking school finances), ' +
    'resource mobilization (community contributions to school infrastructure), and demand for quality ' +
    '(parent engagement in children\'s learning). Evidence on their effectiveness is mixed: simply creating ' +
    'SMCs or providing generic training shows little impact. However, interventions that provide specific, ' +
    'actionable information to communities — such as school report cards showing learning outcomes, or ' +
    'score cards comparing their school to others — have shown significant effects. Uganda\'s community ' +
    'score card program increased test scores by 0.2 SD. Community-based monitoring works best when ' +
    'combined with specific tools (checklists, dashboards) and a clear mandate for action. The key ' +
    'design principle is: information alone is insufficient; communities need both information and agency ' +
    '(the power to act on what they learn).',

    // 7. EdTech and Digital Learning
    'The evidence on educational technology (EdTech) in LMICs is more nuanced than either techno-optimists ' +
    'or skeptics suggest. A 2020 World Bank meta-review of 80+ EdTech evaluations found that: ' +
    '(a) Technology-guided instruction (adaptive learning software, computer-assisted learning) shows ' +
    'positive effects (0.15-0.35 SD) when it supplements (not replaces) teacher instruction; ' +
    '(b) Hardware provision alone (laptops, tablets) without pedagogical integration shows zero or ' +
    'negative effects — the One Laptop Per Child (OLPC) program is the cautionary example; ' +
    '(c) SMS/phone-based nudges to parents (reminders, learning tips) show small but cost-effective ' +
    'impacts on parental engagement and learning (0.05-0.10 SD); ' +
    '(d) Teacher-facing technology (lesson plan apps, assessment dashboards) shows promise for improving ' +
    'teaching practice when combined with coaching; ' +
    '(e) The "digital divide" compounds existing inequalities — the poorest 20% have the least access to ' +
    'devices, connectivity, and digital literacy, meaning EdTech programs that assume device ownership ' +
    'exclude the most marginalized. The critical design principle is "pedagogy first, technology second": ' +
    'start with the learning objective and pedagogical approach, then select the technology that best ' +
    'supports it — not the reverse.',

    // 8. Inclusive Education
    'An estimated 240 million children worldwide have disabilities (UNICEF, 2021), and they are among ' +
    'the most excluded from education. In LMICs, children with disabilities are 49% more likely to have ' +
    'never attended school than their peers without disabilities. The exclusion is compounded for girls ' +
    'with disabilities, children with intellectual disabilities (vs. physical), and children in rural ' +
    'areas. UNESCO\'s inclusive education framework calls for transforming education systems — not just ' +
    'placing children with disabilities in mainstream classrooms — through: Universal Design for Learning ' +
    '(UDL, multiple means of representation, engagement, and expression), reasonable accommodations, ' +
    'assistive technology, teacher training on differentiated instruction, accessible infrastructure, and ' +
    'community-based rehabilitation. Language of instruction is another critical inclusion issue: ' +
    '40% of the global population does not have access to education in a language they speak or understand. ' +
    'Mother-tongue-based multilingual education (MTB-MLE) has been shown to improve learning outcomes, ' +
    'reduce dropout, and increase parental engagement. UNESCO recommends at least 6 years of mother-tongue ' +
    'instruction. Refugee and displaced children face additional barriers: 48% of refugee children are ' +
    'out of school, rising to 78% at secondary level (UNHCR, 2022).',

    // 9. School Feeding and Nutrition
    'The link between nutrition and learning is well-established: malnutrition (stunting, wasting, ' +
    'micronutrient deficiency) impairs cognitive development, reduces attention and concentration, and ' +
    'increases absenteeism due to illness. An estimated 149 million children under 5 are stunted globally ' +
    '(2020), with lifelong consequences for learning and earning. School feeding programs serve a dual ' +
    'purpose: (a) demand-side — incentivizing enrollment and attendance (particularly for the poorest ' +
    'families where the opportunity cost of schooling is high); (b) nutrition — addressing short-term ' +
    'hunger ("classroom hunger") and micronutrient deficiency. India\'s Mid-Day Meal Scheme, the world\'s ' +
    'largest school feeding program (120M+ children daily), has been shown to increase enrollment by ' +
    '12-14% and significantly reduce gender and caste gaps. School-based deworming, often combined with ' +
    'feeding, has been shown to reduce absenteeism by 25% in high-worm-burden settings (Miguel & Kremer, ' +
    '2004). The World Food Programme operates school feeding in 60+ countries, reaching 20M+ children. ' +
    'Cost-effectiveness varies: home-grown school feeding models that source food locally can cost as ' +
    'little as $30-50 per child per year while also supporting local agriculture.',

    // 10. Education Financing
    'Education financing in LMICs falls far short of what is needed to achieve SDG 4. UNESCO benchmarks ' +
    'recommend that governments allocate at least 4-6% of GDP and 15-20% of total public expenditure to ' +
    'education. As of 2020, only 41% of countries met the 4% GDP benchmark and only 32% met the 15% ' +
    'expenditure benchmark. The financing gap for achieving universal pre-primary through secondary ' +
    'education in LMICs was estimated at $148 billion per year (pre-COVID), rising to $200 billion post-COVID. ' +
    'Foreign aid to education has stagnated at approximately $16 billion per year, representing less than ' +
    '10% of total education spending in LMICs. Key financing issues include: (a) efficiency — high shares ' +
    'of education budgets go to teacher salaries (often 70-90%), leaving minimal resources for learning ' +
    'materials, training, and infrastructure; (b) equity — per-pupil spending is often regressive, with ' +
    'urban and higher-income schools receiving more; (c) household spending — families in LMICs bear ' +
    'significant out-of-pocket costs (fees, uniforms, materials, transport), making "free" education not ' +
    'truly free for the poorest; (d) cost-effectiveness — interventions vary by orders of magnitude in ' +
    'cost per learning-adjusted year of schooling gained, yet budget allocation rarely reflects this evidence.',

    // 11. Transition and Retention
    'Dropout is not a single event but a process, often preceded by chronic absenteeism, grade repetition, ' +
    'and disengagement. The sharpest dropout points occur at: (a) the primary-to-secondary transition ' +
    '(globally, primary completion is 87% but lower secondary completion drops to 73%); (b) early ' +
    'secondary (grades 7-9), particularly for girls; (c) the secondary-to-tertiary transition. ' +
    'In Sub-Saharan Africa, only 42% of students complete lower secondary school. Dropout drivers include ' +
    'economic factors (direct and opportunity costs increase at secondary), academic factors (children who ' +
    'lack foundational skills cannot keep up with secondary curriculum), safety factors (longer distances, ' +
    'harassment), and life events (early marriage, pregnancy, family illness). Interventions that reduce ' +
    'dropout include: conditional cash transfers (Mexico\'s Progresa/Oportunidades reduced dropout by 30%), ' +
    'merit scholarships (Kenya\'s Girls\' Scholarship Program), mentoring and psychosocial support, bridge ' +
    'programs for the primary-to-secondary transition, and school-based health services. The most effective ' +
    'retention strategies address the specific dropout driver in context rather than applying generic ' +
    'interventions. Re-entry policies for adolescent mothers are critical but remain absent or unenforced ' +
    'in many countries.',

    // 12. Assessment for Learning
    'Assessment systems in most LMICs are dominated by high-stakes summative examinations (national exams, ' +
    'school-leaving certificates) that sort and select students rather than inform instruction. These exams ' +
    'often test rote memorization rather than comprehension, application, or critical thinking, distorting ' +
    'teaching toward "teaching to the test." A paradigm shift toward assessment for learning (formative ' +
    'assessment) is critical. Citizen-led assessments (CLAs) — pioneered by ASER India in 2005 and now ' +
    'replicated in 14+ countries through the People\'s Action for Learning (PAL) Network — have ' +
    'revolutionized understanding of learning levels by testing children at home (not school) using simple, ' +
    'curriculum-independent tools. EGRA (Early Grade Reading Assessment) and EGMA (Early Grade Math ' +
    'Assessment), developed by RTI International and USAID, are standardized oral assessments of component ' +
    'reading and math skills used in 70+ countries and 120+ languages. These tools measure specific skills ' +
    '(letter identification, phonemic awareness, oral reading fluency, reading comprehension; number ' +
    'identification, quantity discrimination, addition, subtraction) rather than global achievement, ' +
    'enabling diagnostic use. The shift from "assessment of learning" to "assessment for learning" requires ' +
    'training teachers to use formative assessment data to adjust instruction — a major capacity gap in ' +
    'most LMICs.',

    // 13. Structured Pedagogy
    'Structured pedagogy — the provision of detailed lesson plans, student workbooks/readers, and ongoing ' +
    'teacher coaching as an integrated package — has emerged as the most consistently effective approach to ' +
    'improving learning outcomes at scale in LMICs. A 2023 meta-analysis by Piper et al. of 55 structured ' +
    'pedagogy programs across 28 countries found an average effect size of 0.23 SD on literacy and 0.18 SD ' +
    'on numeracy. Programs with coaching components showed 60% larger effects than those with training only. ' +
    'Kenya\'s Tusome program is the flagship example: implemented nationally in 23,000+ public primary ' +
    'schools, it tripled English reading benchmarks and doubled Kiswahili benchmarks at grade 2 between ' +
    '2015 and 2019. Critics argue that scripted lessons deskill teachers, but evidence suggests that in ' +
    'contexts where teachers have limited pre-service training and teach in a second language, structured ' +
    'lesson plans provide essential scaffolding. The key design choices are: degree of prescription ' +
    '(fully scripted vs. guided), language of instruction, coaching frequency and quality, and alignment ' +
    'with national curriculum and textbooks.',

    // 14. Education in Emergencies
    'An estimated 222 million crisis-affected children and adolescents are in need of educational support ' +
    '(UNICEF, 2022). Education in Emergencies (EiE) spans conflict, displacement, natural disasters, and ' +
    'health emergencies. The Inter-Agency Network for Education in Emergencies (INEE) Minimum Standards ' +
    'provide the normative framework, covering: community participation, coordination, analysis, access ' +
    'and learning environment, teaching and learning, teachers and education personnel, and education ' +
    'policy. Accelerated Education Programs (AEPs) compress multiple years of schooling into shorter ' +
    'programs for over-age children who have missed significant schooling. Key design principles include: ' +
    'psychosocial support and social-emotional learning (children affected by conflict/displacement ' +
    'experience trauma that impairs concentration, memory, and social functioning); language bridging ' +
    '(refugee children often need to learn in the host country\'s language); certification and ' +
    'accreditation (ensuring learning is recognized by formal systems); and protection (schools as safe ' +
    'spaces, not targets). Education Cannot Wait (ECW), the global fund for EiE established in 2016, ' +
    'has invested $1.1 billion to reach 9 million children in 44 countries.',
  ],

  /* ------------------------------------------------------------------ */
  /*  FRAMEWORKS (Layer 2)                                              */
  /* ------------------------------------------------------------------ */
  frameworks: [
    {
      name: 'Foundational Literacy & Numeracy (FLN) Framework',
      layer: 2,
      description:
        'Framework for designing programs that ensure all children acquire foundational reading and ' +
        'math skills by the end of grade 3. Integrates structured pedagogy, mother-tongue instruction, ' +
        'leveled reading materials, and numeracy progressions based on evidence from Pratham (TaRL), ' +
        'Tusome (Kenya), and Room to Read.',
      whenToUse:
        'Any program targeting reading and/or math outcomes for early grades (pre-primary through grade 3); ' +
        'any context where learning poverty data shows children completing primary without foundational skills; ' +
        'remediation programs for older children who missed foundational skills.',
      keyElements: [
        'Print awareness and concepts of print',
        'Phonological awareness and phonics (letter-sound relationships)',
        'Reading fluency (oral reading fluency benchmarks by grade)',
        'Reading comprehension (literal, inferential, evaluative)',
        'Vocabulary development (oral and written)',
        'Number sense (counting, quantity, one-to-one correspondence)',
        'Operations (addition, subtraction, multiplication, division progressions)',
        'Measurement and geometry fundamentals',
        'Problem-solving and mathematical reasoning',
        'Learning level assessment and grouping (TaRL methodology)',
        'Structured lesson plans with coaching',
        'Mother-tongue/first-language instruction policy',
        'Leveled reading materials and decodable readers',
        'Milestone markers (reading benchmarks: 45-60 wcpm by end of grade 2)',
      ],
      template:
        '## Foundational Literacy & Numeracy Program Design\n\n' +
        '### Current Learning Levels\n' +
        '- Baseline assessment tool: [EGRA/EGMA / ASER / other]\n' +
        '- % of target-grade students reading at benchmark: ___\n' +
        '- % performing basic arithmetic: ___\n' +
        '- Language of instruction vs. children\'s home language: ___\n\n' +
        '### Learning Targets (with timeline)\n' +
        '- Reading benchmark (wcpm by grade): ___\n' +
        '- Math benchmark (operations mastery by grade): ___\n' +
        '- Target effect size: ___\n\n' +
        '### Intervention Components\n' +
        '- [ ] Structured pedagogy (lesson plans, student materials)\n' +
        '- [ ] Teacher coaching (frequency, coach-to-teacher ratio)\n' +
        '- [ ] Learning level assessment and grouping\n' +
        '- [ ] Mother-tongue instruction\n' +
        '- [ ] Leveled reading materials / library\n' +
        '- [ ] Community/parent engagement for home reading\n' +
        '- [ ] Formative assessment and data use\n\n' +
        '### Assessment Plan\n' +
        '- Baseline: [tool, timing]\n' +
        '- Formative (ongoing): [frequency, method]\n' +
        '- Midline: [tool, timing]\n' +
        '- Endline: [tool, timing]\n',
    },
    {
      name: 'EGRA/EGMA Assessment Framework',
      layer: 2,
      description:
        'Framework for using Early Grade Reading Assessment (EGRA) and Early Grade Math Assessment (EGMA) ' +
        'as standardized oral assessments to measure component reading and math skills. Developed by RTI ' +
        'International with USAID support, used in 70+ countries and 120+ languages.',
      whenToUse:
        'Baseline and endline measurement of learning outcomes in early grades; learning outcome tracking ' +
        'for program M&E; system-level diagnostics to identify where the reading/math process breaks down; ' +
        'language-of-instruction policy decisions.',
      keyElements: [
        'Letter/grapheme identification (timed, 1 minute)',
        'Familiar word reading (timed, 1 minute)',
        'Invented/non-word reading (decoding skill)',
        'Oral reading fluency (connected text, correct words per minute)',
        'Reading comprehension (questions on the passage read)',
        'Listening comprehension (oral story + questions)',
        'Dictation (encoding/spelling)',
        'Number identification (timed)',
        'Quantity discrimination (which number is bigger)',
        'Missing number (number patterns)',
        'Addition (timed, level 1 and level 2)',
        'Subtraction (timed, level 1 and level 2)',
        'Word problems (oral)',
        'Administration standardization and inter-rater reliability',
        'Benchmarking (fluency rates that predict comprehension)',
        'Disaggregation (gender, urban/rural, language, wealth quintile)',
      ],
    },
    {
      name: 'Gender-Responsive Education Framework',
      layer: 2,
      description:
        'Framework for addressing barriers to girls\' (and boys\') education through integrated supply-side ' +
        'and demand-side interventions. Draws on evidence from CAMFED, UNGEI, GPE, and the Gender at the ' +
        'Centre Initiative.',
      whenToUse:
        'Any program where gender disparities exist in enrollment, attendance, completion, or learning ' +
        'outcomes; contexts with high rates of early/child marriage, school-related gender-based violence, ' +
        'or restrictive gender norms affecting education; programs targeting adolescent girls\' retention ' +
        'in secondary school.',
      keyElements: [
        'Gender analysis (disaggregated data on enrollment, attendance, completion, learning by gender)',
        'Barrier identification (economic, socio-cultural, school-related, safety — gender-specific)',
        'Supply-side interventions (female teachers, separate latrines, MHM facilities, safe infrastructure)',
        'Demand-side interventions (scholarships, conditional cash transfers, MHM kits, uniforms)',
        'Gender-sensitive pedagogy (teacher training on gender-equitable classroom practices)',
        'Safe learning environments (codes of conduct, reporting mechanisms for SRGBV)',
        'Community engagement (dialogues with parents, community leaders, religious leaders on girls\' education)',
        'Transition support (primary-to-secondary, mentoring, role models)',
        'Life skills and comprehensive sexuality education',
        'Adolescent girls\' empowerment (agency, voice, leadership)',
        'Re-entry policies for adolescent mothers',
        'Male engagement (engaging boys and men as allies)',
      ],
    },
    {
      name: 'Inclusive Education Framework',
      layer: 2,
      description:
        'UNESCO\'s framework for ensuring all learners — including children with disabilities, linguistic ' +
        'minorities, refugees, and other marginalized groups — access quality education. Based on the ' +
        'Convention on the Rights of Persons with Disabilities (CRPD) Article 24 and the Salamanca Statement.',
      whenToUse:
        'Programs serving diverse learners or aiming to reduce exclusion; contexts where children with ' +
        'disabilities, linguistic minorities, or displaced populations face barriers to education; ' +
        'system-level reforms moving from segregated/special education to inclusive models.',
      keyElements: [
        'Universal Design for Learning (UDL) — multiple means of representation, engagement, expression',
        'Reasonable accommodations (individualized supports without disproportionate burden)',
        'Assistive technology (screen readers, hearing aids, Braille, AAC devices)',
        'Teacher training on differentiated instruction and inclusive pedagogy',
        'Accessible infrastructure (ramps, accessible latrines, appropriate seating)',
        'Disability screening and early identification (school-based, community-based)',
        'Individualized Education Plans (IEPs) or equivalent',
        'Community-based rehabilitation and family support',
        'Mother-tongue-based multilingual education (MTB-MLE)',
        'Transition planning (early intervention → school → post-school)',
        'Data collection on children with disabilities (Washington Group questions)',
        'Anti-stigma and awareness campaigns',
        'Peer support and buddy systems',
      ],
    },
    {
      name: 'Whole School Development Model',
      layer: 2,
      description:
        'School-level improvement model that addresses leadership, pedagogy, community engagement, and ' +
        'infrastructure as interconnected components. Based on evidence from school effectiveness research ' +
        'and implementations by Save the Children, VVOB, and national programs in South Africa, India, ' +
        'and East Africa.',
      whenToUse:
        'School quality improvement programs; system strengthening at the school level; programs that want ' +
        'to move beyond single-intervention approaches to holistic school improvement; contexts where school ' +
        'leadership is a binding constraint.',
      keyElements: [
        'School improvement plans (data-driven, with clear targets and timelines)',
        'Instructional leadership (head teacher as pedagogical leader, not just administrator)',
        'Professional learning communities (PLCs) — peer observation, collaborative planning',
        'Data-driven decision making (school-level data dashboards, learning outcome tracking)',
        'Parent-Teacher Associations and School Management Committees (functional, trained, empowered)',
        'School-based management (decentralized budgets, school grants, accountability)',
        'Learning environment (classroom management, time on task, inclusive classroom practices)',
        'Teaching and learning materials (availability, use, relevance)',
        'School health and nutrition (WASH, feeding, health screening)',
        'Child safeguarding and protection (codes of conduct, reporting mechanisms)',
        'School-community partnerships (local resource mobilization, volunteer programs)',
      ],
    },
    {
      name: 'Social-Emotional Learning (SEL) Framework',
      layer: 2,
      description:
        'Framework based on CASEL\'s (Collaborative for Academic, Social, and Emotional Learning) model ' +
        'for developing five core competencies: self-awareness, self-management, social awareness, ' +
        'relationship skills, and responsible decision-making. Adapted for LMIC and crisis-affected ' +
        'contexts by IRC, UNICEF, and War Child.',
      whenToUse:
        'Programs addressing psychosocial wellbeing of children affected by conflict, displacement, or ' +
        'adversity; life skills education; violence prevention and peace education; any program where ' +
        'behavioral and emotional outcomes are as important as academic outcomes; integration with ' +
        'academic instruction to improve engagement and learning.',
      keyElements: [
        'Self-awareness (identifying emotions, self-confidence, self-efficacy, growth mindset)',
        'Self-management (impulse control, stress management, self-discipline, goal-setting)',
        'Social awareness (perspective-taking, empathy, appreciating diversity, respect)',
        'Relationship skills (communication, cooperation, conflict resolution, help-seeking)',
        'Responsible decision-making (analyzing situations, problem-solving, ethical reasoning)',
        'Explicit SEL instruction (dedicated lessons, structured curricula — e.g., IRC\'s Healing Classrooms)',
        'Integration across academic curriculum (SEL embedded in literacy, math, science)',
        'School climate and culture (safe, supportive, respectful learning environments)',
        'Family partnerships (parent workshops on positive discipline, communication)',
        'Community partnerships (referral pathways, child protection systems)',
        'Teacher well-being (teacher SEL, stress management, burnout prevention)',
        'Measurement (ISELA, Holistic Assessment of Learning, ASER\'s SEL module)',
      ],
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  PROCEDURES                                                        */
  /* ------------------------------------------------------------------ */
  procedures: [
    {
      name: 'Education Program Design Process',
      steps: [
        {
          step: 'Situational Analysis',
          description:
            'Collect and analyze education data: enrollment rates (NER, GER), completion rates, ' +
            'learning outcomes (EGRA/EGMA, national exam, ASER), teacher qualifications and deployment, ' +
            'school infrastructure, and education financing. Disaggregate all data by gender, location ' +
            '(urban/rural), wealth quintile, disability status, and ethnicity/language. Identify the ' +
            'specific education problem — is it access (children not in school), quality (children in ' +
            'school not learning), equity (some groups excluded), or a combination?',
        },
        {
          step: 'Barrier Analysis',
          description:
            'Identify barriers to education access, quality, and equity using a supply-demand framework. ' +
            'Supply-side: Are there enough schools, classrooms, teachers, and materials? Are teachers ' +
            'qualified and present? Is the curriculum relevant? Demand-side: Can families afford schooling? ' +
            'Is the school accessible (distance, safety)? Do parents value education? Are there gender-specific ' +
            'barriers (early marriage, menstruation, safety)? Are children with disabilities included? ' +
            'Prioritize barriers by severity and addressability.',
        },
        {
          step: 'Evidence Review',
          description:
            'Review the evidence on what works in this context. Consult J-PAL\'s education evidence, ' +
            'World Bank LEAP, UNESCO GEM Report, and context-specific evaluations. Identify proven ' +
            'interventions with strong evidence (RCTs, quasi-experimental designs) and assess their ' +
            'transferability to the target context. Calculate cost-effectiveness where possible using ' +
            'cost per learning-adjusted year of schooling (LAYS) or cost per SD gain.',
        },
        {
          step: 'Theory of Change Development',
          description:
            'Develop a Theory of Change that maps: inputs (funding, staff, materials) → activities ' +
            '(teacher training, coaching, community engagement) → outputs (teachers trained, schools ' +
            'supported, materials distributed) → outcomes (improved teaching practice, increased ' +
            'instructional time, parental engagement) → learning outcomes (reading at benchmark, ' +
            'math proficiency) → impact (reduced learning poverty, improved life outcomes). Articulate ' +
            'assumptions and risks at each step.',
        },
        {
          step: 'Intervention Design',
          description:
            'Design the specific intervention package: pedagogy approach (structured pedagogy, TaRL, ' +
            'activity-based learning), teacher support model (training + coaching + PLCs), materials ' +
            '(lesson plans, student books, decodable readers), assessment strategy (formative + summative), ' +
            'community engagement activities, inclusion provisions, and EdTech components if applicable. ' +
            'Specify the delivery model: government-led, NGO-implemented, or partnership.',
        },
        {
          step: 'M&E Framework',
          description:
            'Design the monitoring and evaluation framework. Define indicators at each ToC level. ' +
            'Select learning assessment tools (EGRA/EGMA, ASER, national exam, classroom-based assessment). ' +
            'Plan baseline, midline, and endline data collection. Design the data use plan: how will ' +
            'assessment data flow from classroom → school → district → national level? How will data ' +
            'inform instructional decisions? Include process monitoring (classroom observation, coaching ' +
            'logs, material distribution tracking).',
        },
        {
          step: 'Costing and Financing',
          description:
            'Develop a detailed budget with unit costs: cost per student, cost per teacher trained, ' +
            'cost per school supported. Benchmark against similar programs (global range: $30-150 per ' +
            'student per year for literacy programs). Identify funding sources: government co-financing ' +
            '(target 50%+ for sustainability), donor funding, community contributions. Plan for ' +
            'cost-efficiency: what can be integrated into existing government systems vs. what requires ' +
            'additional resources?',
        },
        {
          step: 'Implementation Planning',
          description:
            'Develop the implementation plan: phased rollout (pilot → adapt → scale), geographic ' +
            'targeting (neediest areas first), staffing and management structure, procurement timeline ' +
            'for materials, teacher training schedule, coaching deployment plan, community mobilization ' +
            'strategy, risk register with mitigation measures (teacher strikes, political changes, ' +
            'natural disasters, funding delays). Define the government partnership model and the path ' +
            'to government ownership/sustainability.',
        },
      ],
    },
    {
      name: 'Education Impact Evaluation Process',
      steps: [
        {
          step: 'Define Evaluation Questions',
          description:
            'Articulate the primary evaluation questions: Does the program improve learning outcomes? ' +
            'By how much (effect size)? For whom (heterogeneous effects by gender, poverty, baseline level)? ' +
            'Through what mechanisms (mediators: teaching practice, time on task, parental engagement)? ' +
            'At what cost (cost-effectiveness)? Secondary questions may address implementation fidelity, ' +
            'sustainability, and unintended consequences.',
        },
        {
          step: 'Counterfactual Design',
          description:
            'Select the evaluation design based on feasibility and rigor: randomized controlled trial ' +
            '(RCT — random assignment of schools/students to treatment and control); quasi-experimental ' +
            '(regression discontinuity, difference-in-differences, propensity score matching); pre-post ' +
            'with comparison group. Consider ethical issues (can you withhold the intervention from control ' +
            'schools?), government preferences, and phased rollout as a natural experiment.',
        },
        {
          step: 'Learning Assessment Selection',
          description:
            'Select learning assessment tools: EGRA/EGMA for early grades (component skills, oral, ' +
            'individually administered, 15-20 min per child); ASER for household-based community assessment; ' +
            'national exam scores for system-level tracking; classroom observation tools (Stallings, CLASS, ' +
            'TEACH) for teaching practice; SEL measurement tools (ISELA, MELQO) for non-cognitive outcomes. ' +
            'Ensure tools are validated in the local language and context.',
        },
        {
          step: 'Sampling and Power Calculation',
          description:
            'Determine the sample size needed to detect the minimum detectable effect size (MDES). ' +
            'Standard parameters: MDES of 0.20 SD, power of 0.80, significance level of 0.05, intra-class ' +
            'correlation (ICC) of 0.15-0.25 for school-level clustering. Typical sample: 60-120 schools, ' +
            '15-25 students per school. Account for attrition (10-20% in LMICs). Use stratified random ' +
            'sampling within the target population.',
        },
        {
          step: 'Data Collection',
          description:
            'Plan data collection waves: baseline (before intervention), midline (optional, for course ' +
            'correction), endline (12-24 months after implementation). Collect student-level learning data, ' +
            'student demographics (gender, age, socioeconomic status, disability, language), teacher data ' +
            '(qualifications, training, attendance), school data (infrastructure, resources, governance), ' +
            'and process data (implementation fidelity, coaching frequency, material availability). Train ' +
            'and calibrate enumerators for inter-rater reliability.',
        },
        {
          step: 'Analysis',
          description:
            'Primary analysis: intent-to-treat (ITT) effect using regression with school-level clustering. ' +
            'Report effect sizes in standard deviations and, where possible, in learning-equivalent units ' +
            '(additional months/years of learning). Heterogeneous effects: disaggregate by gender, baseline ' +
            'learning level (lowest-performing students), poverty quintile, disability status. Mediation ' +
            'analysis: which mechanisms drive the effect (teaching practice, time on task, materials use)? ' +
            'Cost-effectiveness: cost per SD gain, cost per LAYS.',
        },
        {
          step: 'Dissemination and Use',
          description:
            'Produce outputs for different audiences: peer-reviewed publication (academic rigor), policy ' +
            'brief (2-4 pages for Ministry of Education, donors, decision-makers), community feedback ' +
            '(accessible summary for participating communities and parents), practitioner guide (lessons ' +
            'for program adaptation and replication). Host a dissemination event with government, donors, ' +
            'and implementing partners. Ensure findings feed into the next program cycle (adaptive management).',
        },
      ],
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  DECISION RULES (Layer 4)                                          */
  /* ------------------------------------------------------------------ */
  decisionRules: [
    {
      name: 'Learning Outcome Measurement',
      layer: 4,
      check:
        'Does the program define and measure at least one learning outcome using a validated assessment ' +
        'tool (EGRA, EGMA, ASER, national exam, or equivalent)?',
      passCondition:
        'At least one learning outcome is specified with a measurable target (e.g., "80% of grade 3 students ' +
        'reading at 45 wcpm by endline") and a validated measurement tool is named.',
      failAction:
        'Flag that the program specifies inputs and activities but has no measurable learning outcome. ' +
        'Recommend: "Add a learning outcome target measured by [EGRA/EGMA/ASER/national exam] with a specific ' +
        'target and timeline. Programs without learning outcome measurement cannot demonstrate impact."',
    },
    {
      name: 'Teacher-Student Ratio Feasibility',
      layer: 4,
      check:
        'Does the program\'s staffing plan specify a teacher-student ratio, and is it feasible given the ' +
        'context (UNESCO benchmark: ≤40:1 for primary)?',
      passCondition:
        'Teacher-student ratio is stated and is ≤40:1 for primary, or a clear plan to achieve this ratio ' +
        'is described (e.g., double-shift teaching, community teaching assistants, multi-grade approaches).',
      failAction:
        'Flag unrealistic ratios or missing staffing data. Recommend: "Specify the teacher-student ratio ' +
        'and, if above 40:1, describe mitigation strategies (double-shift, teaching assistants, structured ' +
        'pedagogy with group work). Ratios above 60:1 are associated with significantly worse learning outcomes."',
    },
    {
      name: 'Inclusion & Equity Check',
      layer: 4,
      check:
        'Does the program explicitly address at least one equity dimension: gender, disability, poverty, ' +
        'ethnicity, language of instruction, or displacement status?',
      passCondition:
        'At least one marginalized group is identified with a targeted intervention (not just a general ' +
        'statement of inclusion). Data is disaggregated by the equity dimension(s) addressed.',
      failAction:
        'Flag that the program may exclude the most disadvantaged children. Recommend: "Identify the most ' +
        'marginalized groups in the target area and add at least one targeted intervention. Universal programs ' +
        'without equity provisions typically widen gaps between advantaged and disadvantaged learners."',
    },
    {
      name: 'Curriculum & Pedagogy Alignment',
      layer: 4,
      check:
        'Does the program\'s teaching approach align with national curriculum standards and use evidence-based ' +
        'pedagogy (structured pedagogy, TaRL, activity-based learning, or other approaches with RCT evidence)?',
      passCondition:
        'The program references national curriculum standards and specifies an evidence-based pedagogical ' +
        'approach with citations to supporting evidence.',
      failAction:
        'Flag misalignment or missing pedagogical approach. Recommend: "Align teaching content with national ' +
        'curriculum standards and specify the evidence-based pedagogical approach (structured pedagogy, TaRL, ' +
        'activity-based learning). Programs without a clear pedagogical model rely on individual teacher ' +
        'quality, which varies enormously and cannot be assumed."',
    },
    {
      name: 'Community & Parental Engagement',
      layer: 4,
      check:
        'Does the program include community and parental engagement activities beyond passive recipient roles?',
      passCondition:
        'Specific activities for parent/community engagement are described: SMC/PTA training, reading clubs, ' +
        'home-based learning support, community monitoring, parent information campaigns, or community dialogues.',
      failAction:
        'Flag top-down design without community voice. Recommend: "Add at least one community/parental ' +
        'engagement activity. Evidence shows that parental engagement (reading with children at home, ' +
        'monitoring attendance) and community accountability (SMC oversight of school quality) significantly ' +
        'enhance program impact."',
    },
    {
      name: 'Assessment & Data Use',
      layer: 4,
      check:
        'Does the program have a clear assessment strategy (formative + summative) and a data use plan?',
      passCondition:
        'The program describes baseline assessment, ongoing formative assessment, and endline measurement, ' +
        'with a clear plan for how assessment data will inform instruction and program management decisions.',
      failAction:
        'Flag missing assessment plan or no feedback loop. Recommend: "Add an assessment plan that includes: ' +
        '(a) baseline/endline using a validated tool, (b) ongoing formative assessment (classroom-based), ' +
        'and (c) a data use plan describing how teachers and managers will use data for decision-making. ' +
        'Programs that collect data but don\'t use it waste resources."',
    },
    {
      name: 'Sustainability & System Integration',
      layer: 4,
      check:
        'Does the program integrate with or strengthen the government education system, with a plan for ' +
        'sustainability beyond project funding?',
      passCondition:
        'The program references Ministry of Education partnership, government co-financing, alignment with ' +
        'the national education sector plan, capacity transfer to government staff, or a clear exit strategy ' +
        'naming the future institutional owner.',
      failAction:
        'Flag parallel systems that may collapse when funding ends. Recommend: "Add a sustainability plan ' +
        'that includes government co-design and co-financing, alignment with the national education sector ' +
        'plan, capacity transfer to government staff, and a phased exit strategy. Programs that operate ' +
        'outside the government system rarely survive beyond donor funding cycles."',
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  EVIDENCE SOURCES                                                  */
  /* ------------------------------------------------------------------ */
  evidence: [
    {
      title: 'UNESCO Global Education Monitoring (GEM) Report',
      type: 'Annual global monitoring report',
      summary:
        'Annual report monitoring progress toward SDG 4 (Quality Education). Provides comprehensive ' +
        'global education data on enrollment, completion, learning, equity, and financing. Each year ' +
        'features a thematic deep-dive (e.g., 2020: inclusion, 2023: technology). The GEM Report is the ' +
        'authoritative source for global education statistics and policy analysis.',
      sourceUrl: 'https://www.unesco.org/gem-report/',
    },
    {
      title: 'World Bank Learning Poverty Brief and LEAP Platform',
      type: 'Policy research and data platform',
      summary:
        'The World Bank\'s Learning Poverty metric (% of 10-year-olds who cannot read and understand a ' +
        'simple story) has become a key global indicator. The LEAP (Learning, Evidence, Analytics, Practice) ' +
        'platform aggregates education research, particularly on structured pedagogy, teacher coaching, and ' +
        'system-level reforms. Key publications include the World Development Report 2018 (Learning to ' +
        'Realize Education\'s Promise) and the GLAD database of learning assessments.',
      sourceUrl: 'https://www.worldbank.org/en/topic/education/brief/learning-poverty',
    },
    {
      title: 'ASER (Annual Status of Education Report) / PAL Network',
      type: 'Citizen-led household learning assessment',
      summary:
        'Pioneered by Pratham in India in 2005, ASER is a household-based learning assessment that tests ' +
        'children\'s reading and math levels using simple, curriculum-independent tools. Reaching 600,000+ ' +
        'children annually in India, the model has been replicated in 14+ countries through the PAL ' +
        '(People\'s Action for Learning) Network. ASER\'s key contribution is demonstrating the gap between ' +
        'enrollment (high) and learning (low), providing evidence that catalyzed India\'s focus on FLN.',
      sourceUrl: 'https://www.asercentre.org/',
    },
    {
      title: 'J-PAL Education Sector Evidence',
      type: 'Randomized evaluation evidence repository',
      summary:
        'J-PAL\'s education sector has synthesized evidence from 200+ RCTs across 50+ countries. Key ' +
        'findings include: information about returns to education increases schooling (but not learning); ' +
        'reducing costs (scholarships, free uniforms) increases enrollment; structured pedagogy and ' +
        'Teaching at the Right Level are the most cost-effective approaches to improving learning; ' +
        'technology alone does not improve learning; and teacher incentives tied to student performance ' +
        'show mixed results. J-PAL\'s cost-effectiveness comparisons are essential for program design.',
      sourceUrl: 'https://www.povertyactionlab.org/sector/education',
    },
    {
      title: 'Pratham / TaRL (Teaching at the Right Level) Evidence Base',
      type: 'Intervention evidence across multiple RCTs',
      summary:
        'Teaching at the Right Level has been evaluated through 20+ RCTs in India (Banerjee, Banerji, Berry, ' +
        'Duflo, et al.) and Africa, consistently showing effect sizes of 0.6-0.7 SD on reading and math. ' +
        'Key findings: volunteer-delivered models are as effective as teacher-delivered; summer camp formats ' +
        'work as well as in-school models; effects persist at least 1 year after intervention. TaRL Africa ' +
        'has replicated the model in 10+ countries with similar results.',
      sourceUrl: 'https://www.teachingattherightlevel.org/',
    },
    {
      title: 'GPE (Global Partnership for Education) Results Framework',
      type: 'Global education financing and system data',
      summary:
        'GPE is the largest global fund dedicated to education in developing countries, having disbursed ' +
        '$9+ billion since 2002. GPE\'s Results Framework tracks system-level indicators: domestic education ' +
        'financing, equity, learning outcomes, and system efficiency. GPE\'s sector planning process requires ' +
        'countries to develop evidence-based education sector plans (ESPs) as a condition for funding, ' +
        'providing a model for program-government alignment.',
      sourceUrl: 'https://www.globalpartnership.org/',
    },
    {
      title: 'UNICEF MICS Education Module',
      type: 'Standardized household survey',
      summary:
        'The Multiple Indicator Cluster Survey (MICS), conducted by UNICEF in 100+ countries, includes ' +
        'education modules measuring: school readiness, school attendance, out-of-school rates, grade ' +
        'completion, literacy and numeracy (foundational learning skills module added in MICS6). MICS ' +
        'data is disaggregated by gender, wealth quintile, urban/rural, and other equity dimensions, ' +
        'making it essential for equity-focused program design.',
      sourceUrl: 'https://mics.unicef.org/',
    },
    {
      title: 'RTI International EGRA/EGMA Toolkit',
      type: 'Assessment instruments and administration guides',
      summary:
        'RTI International developed EGRA (2006) and EGMA with USAID support. The toolkit includes: ' +
        'instrument templates for each subtask, adaptation and translation guidelines, administration ' +
        'manuals, training protocols for enumerators, data entry and analysis templates, and benchmarking ' +
        'guidance. EGRA/EGMA have been administered in 70+ countries and 120+ languages, providing ' +
        'comparable data on early grade learning outcomes across contexts.',
      sourceUrl: 'https://www.edu-links.org/resources/early-grade-reading-and-mathematics-assessments-toolkits',
    },
    {
      title: 'Campbell Systematic Reviews (Education)',
      type: 'Systematic reviews and meta-analyses',
      summary:
        'Campbell Collaboration\'s education coordinating group produces rigorous systematic reviews on ' +
        'education interventions in LMICs: structured pedagogy (Piper et al., 2023: average 0.23 SD), ' +
        'school feeding (Kristjansson et al.: enrollment +12%, attendance +10%), deworming (Taylor-Robinson ' +
        'et al.), and cash transfers for education (Baird et al.: conditional cash transfers more effective ' +
        'than unconditional for enrollment). These reviews are essential for evidence-based program design.',
      sourceUrl: 'https://www.campbellcollaboration.org/better-evidence/education.html',
    },
    {
      title: 'INEE Minimum Standards for Education in Emergencies',
      type: 'Normative standards and practice guidance',
      summary:
        'The Inter-Agency Network for Education in Emergencies (INEE) Minimum Standards are the global ' +
        'framework for education quality in crisis contexts. Covering foundational standards (community ' +
        'participation, coordination, analysis), access and learning environment, teaching and learning, ' +
        'teachers and education personnel, and education policy, they are used by UNICEF, UNHCR, Save the ' +
        'Children, NRC, IRC, and other humanitarian education actors. Complementary guidance covers ' +
        'accelerated education, psychosocial support, and inclusive education in emergencies.',
      sourceUrl: 'https://inee.org/minimum-standards',
    },
    {
      title: 'UNESCO Institute for Statistics (UIS)',
      type: 'Global education statistics database',
      summary:
        'UIS is the official source for cross-nationally comparable education statistics, providing data ' +
        'on: out-of-school children and adolescents (244 million globally, 2022), completion rates by level, ' +
        'learning proficiency (SDG 4.1.1), teacher qualifications, education expenditure, and literacy rates. ' +
        'UIS methodology underpins the SDG 4 monitoring framework and the GEM Report.',
      sourceUrl: 'https://uis.unesco.org/',
    },
    {
      title: 'RISE Programme (Research on Improving Systems of Education)',
      type: 'Multi-country education systems research',
      summary:
        'RISE (2015-2024) investigated why education systems in developing countries fail to deliver ' +
        'learning despite increased enrollment. Key findings: systems are often "incoherent" — with ' +
        'misalignment between what is taught, what is assessed, what teachers are trained to do, and what ' +
        'accountability mechanisms reward. The concept of "coherent systems for learning" (aligning curriculum, ' +
        'assessment, teacher support, and accountability around learning outcomes) has influenced World Bank ' +
        'and GPE strategy. Country studies in Ethiopia, India, Indonesia, Nigeria, Pakistan, Tanzania, and ' +
        'Vietnam provide context-specific insights on system-level constraints.',
      sourceUrl: 'https://riseprogramme.org/',
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  HISTORICAL MEMORY (Layer 5)                                       */
  /* ------------------------------------------------------------------ */
  historicalMemory: [
    {
      problem: '50% of grade 5 students in India could not read a grade 2 level text',
      context:
        'India\'s education system enrolled 200+ million children in primary school but learning levels ' +
        'were dismally low. ASER data (2005 onwards) revealed that half of grade 5 students could not read ' +
        'a simple paragraph. The age-grade system meant teachers taught the grade-level curriculum regardless ' +
        'of whether children had mastered foundational skills. Rote memorization dominated classroom practice.',
      outcome:
        'Pratham\'s Teaching at the Right Level (TaRL) approach — assessing children, grouping by learning ' +
        'level, and using targeted activities — was evaluated through 20+ RCTs showing consistent effect sizes ' +
        'of 0.6-0.7 SD. The model reached 60+ million children across India through government partnerships ' +
        '(including a national program) and was replicated in 10+ African countries through TaRL Africa with ' +
        'similar results. India\'s National Education Policy 2020 adopted FLN as a top priority, with the ' +
        'NIPUN Bharat mission targeting universal foundational literacy and numeracy by grade 3.',
      lesson:
        'Grouping children by learning level (not age) and using simple, targeted teaching-learning materials ' +
        'is more effective and cost-effective than expensive inputs like computers, textbooks, or infrastructure. ' +
        'Citizen-led assessment (ASER) was essential for creating the political will for change by making the ' +
        'learning crisis visible to policymakers and the public.',
    },
    {
      problem: 'Millions of children in Bangladesh excluded from formal schools, especially girls',
      context:
        'Post-independence Bangladesh in the 1980s had 70%+ adult illiteracy, limited school infrastructure ' +
        'in rural areas, and deep gender disparities — girls\' enrollment was significantly below boys\'. ' +
        'Formal schools were too few, too far, and too rigid in scheduling for the poorest families, who ' +
        'needed children (especially girls) for domestic labor and agriculture.',
      outcome:
        'BRAC\'s Non-Formal Primary Education (NFPE) program, launched in 1985, created one-room schools ' +
        'in communities, staffed by local women with secondary education who received ongoing training and ' +
        'supervision. Schools operated on flexible schedules adapted to community needs. The program served ' +
        '11+ million children since inception, with 95% completion rates and 70% female students. Most BRAC ' +
        'graduates successfully transitioned to government secondary schools. BRAC became the world\'s largest ' +
        'NGO in education, operating in 11 countries.',
      lesson:
        'Low-cost, community-based schools with local female teachers can reach children the formal system ' +
        'excludes. Flexibility in timing, location, and approach matters more than infrastructure quality. ' +
        'Hiring local women as teachers simultaneously expanded girls\' enrollment (female teacher as role model ' +
        'and safety factor) and women\'s employment. Scale is achievable through rigorous standardization of ' +
        'the model combined with decentralized management.',
    },
    {
      problem: 'Poor quality and high dropout in multi-grade rural schools in Colombia',
      context:
        'Rural Colombia in the 1970s-80s had schools with 1-2 teachers serving all grades simultaneously. ' +
        'Traditional teacher-centered pedagogy was impossible in multi-grade settings. Dropout rates were ' +
        'extremely high, and rural students scored far below urban peers on standardized tests.',
      outcome:
        'Escuela Nueva ("New School") redesigned multi-grade education around student-centered, self-paced ' +
        'learning guides, active and collaborative pedagogy, teacher training circles, and strong ' +
        'community-school connections. Students using Escuela Nueva outperformed urban peers on standardized ' +
        'tests in both academic achievement and democratic behaviors. The model was adopted as national ' +
        'policy in Colombia (reaching 20,000+ schools) and replicated in 16+ countries. UNESCO recognized ' +
        'it as one of the most successful education reforms in a developing country.',
      lesson:
        'Student-centered, self-paced learning guides and teacher training can transform even the most ' +
        'under-resourced multi-grade schools. The model works because it solves the core pedagogical ' +
        'challenge of multi-grade teaching: children at different levels working simultaneously with ' +
        'structured support. Democratic classroom governance (student government) builds both civic skills ' +
        'and self-regulation. Community engagement is integral, not an add-on.',
    },
    {
      problem: 'Girls dropping out of secondary school in Sub-Saharan Africa',
      context:
        'In Zimbabwe, Tanzania, Ghana, Malawi, and Zambia, girls\' secondary completion rates were below ' +
        '30% in target communities. Primary drivers of dropout included: inability to pay school fees and ' +
        'buy uniforms; early marriage; pregnancy; safety concerns (long distances, harassment); and absence ' +
        'of female role models who had completed secondary education.',
      outcome:
        'CAMFED\'s model combined financial support (fees, uniforms, supplies, sanitary materials) with a ' +
        'social support network: trained female mentors (Learner Guides) in schools, safe spaces, life skills ' +
        'training, and the CAMA (CAMFED Association) alumnae network where graduates became mentors, ' +
        'entrepreneurs, and community leaders. CAMFED has supported 6.8+ million children; girls\' completion ' +
        'rates doubled in target areas; and the CAMA network (200,000+ members) created a self-sustaining ' +
        'ecosystem of female mentorship. An RCT in Tanzania showed the Learner Guide program improved pass ' +
        'rates by 50% and reduced dropout by 50%.',
      lesson:
        'Combining financial support with a social support network addresses both economic and social barriers. ' +
        'The alumnae network is the sustainability mechanism: graduated girls become the next generation of ' +
        'mentors, creating a virtuous cycle. Programs that address only financial barriers miss the social and ' +
        'psychosocial dimensions of girls\' dropout.',
    },
    {
      problem: 'Children completing primary school without basic reading skills across Asia and Africa',
      context:
        'In 10 countries across Asia and Africa, children were enrolled in primary school but classrooms ' +
        'lacked books, libraries did not exist, local-language reading materials were unavailable, and ' +
        'reading instruction was limited to rote recitation of textbooks. There was no "reading culture" — ' +
        'children had no exposure to storybooks or reading for pleasure.',
      outcome:
        'Room to Read\'s Literacy Program created a reading ecosystem: (a) published 2,300+ original ' +
        'children\'s books in local languages; (b) established school libraries with trained librarians; ' +
        '(c) trained teachers in reading instruction (read-aloud, shared reading, independent reading); ' +
        '(d) engaged communities through reading festivals and take-home book programs. The program reached ' +
        '39+ million children. Rigorous evaluations showed students gaining 1.4 additional months of learning ' +
        'per year of program exposure. Reading materials in mother tongue were consistently identified as ' +
        'the most important component.',
      lesson:
        'A reading ecosystem — not any single intervention — is needed to build reading skills and a reading ' +
        'culture. Local-language children\'s books are the critical missing input in most LMICs. Publishing ' +
        'in mother tongue requires deliberate investment; the market will not produce these materials at the ' +
        'quality and quantity needed. Libraries without reading instruction (and vice versa) show weaker results ' +
        'than the combined package.',
    },
    {
      problem: 'Only 1 in 10 grade 2 students in Kenya met reading benchmarks',
      context:
        'Kenya\'s public primary schools (23,000+) faced low learning outcomes despite high enrollment. ' +
        'Teachers had limited pre-service training in reading instruction, lacked structured materials, and ' +
        'received no ongoing coaching. English and Kiswahili literacy were both targeted. USAID provided ' +
        'technical support, but the program was government-led through the Ministry of Education.',
      outcome:
        'Tusome ("Let\'s Read"), Kenya\'s national literacy program (2015-2019), provided: structured ' +
        'lesson plans and student readers in English and Kiswahili, ongoing coaching by trained Curriculum ' +
        'Support Officers, termly learning assessments, and headteacher engagement. By 2019, English reading ' +
        'benchmarks at grade 2 had tripled (12% → 36%) and Kiswahili benchmarks doubled (9% → 18%). ' +
        'The program reached 7+ million children and became a global reference for structured pedagogy at ' +
        'national scale.',
      lesson:
        'Structured pedagogy works at national scale when there is government ownership and political will. ' +
        'Coaching is the critical complement to materials — training alone is insufficient. Government ' +
        'co-financing and integration into existing supervision structures (Curriculum Support Officers) is ' +
        'essential for sustainability. The program demonstrated that you don\'t need to choose between ' +
        'quality and scale.',
    },
    {
      problem: 'Low enrollment and attendance among poor and lower-caste children in India, combined with child malnutrition',
      context:
        'India had the world\'s highest number of malnourished children, and enrollment/attendance among the ' +
        'poorest communities remained low despite fee abolition. The opportunity cost of sending children to ' +
        'school was significant for families living on $1-2/day. A 2001 Supreme Court order mandated ' +
        'cooked mid-day meals in all government primary schools, creating the world\'s largest school ' +
        'feeding program.',
      outcome:
        'India\'s Mid-Day Meal Scheme reached 120+ million children daily. Research showed enrollment ' +
        'increased by 12-14%, attendance improved significantly, classroom hunger was reduced, gender and ' +
        'caste gaps in enrollment narrowed, and protein-deficient populations showed nutritional gains. ' +
        'The program also generated employment for 2.6 million cooks (primarily women from disadvantaged ' +
        'communities). Implementation quality varied widely: some states achieved excellent quality and ' +
        'hygiene; others faced issues of food quality, caste-based discrimination in serving, and corruption.',
      lesson:
        'School feeding is a powerful demand-side intervention that addresses multiple barriers simultaneously: ' +
        'hunger, poverty, gender, and caste discrimination. Effectiveness depends on meal quality, hygiene ' +
        'standards, and community oversight. The program\'s impact on learning was primarily through the ' +
        'enrollment and attendance channels, not direct cognitive benefits — children who are present in ' +
        'school learn more than children who are absent. Scale and political sustainability are achievable ' +
        'when the program is framed as a legal right (court mandate) rather than a project.',
    },
    {
      problem: 'Girls excluded from education in remote and conflict-affected areas of Afghanistan',
      context:
        'Post-Taliban Afghanistan (2002 onwards) faced extreme gender disparities in education: girls\' ' +
        'enrollment was near zero in many rural and conflict-affected districts. Formal schools were distant ' +
        '(often 5+ km), staffed by male teachers, and located in areas where conservative communities ' +
        'would not send girls. Security was a major concern, with schools being targeted by armed groups.',
      outcome:
        'Community-Based Education (CBE) classes were established in homes, mosques, and community buildings ' +
        'within walking distance of children. Local women with at least basic education were hired as teachers ' +
        'with community approval. The program served 400,000+ students (60%+ girls) through organizations ' +
        'including BRAC Afghanistan, CRS, CARE, and IRC. Students performed comparably to formal school peers ' +
        'on standardized assessments. Community acceptance of girls\' education increased substantially in ' +
        'areas with CBE classes.',
      lesson:
        'In conflict and conservative settings, bringing education to the community — rather than requiring ' +
        'children (especially girls) to travel to distant schools — is the critical access strategy. ' +
        'Hiring local female teachers with community approval overcomes trust barriers. The CBE model ' +
        'demonstrates that communities that initially oppose girls\' education often become strong supporters ' +
        'once they see the benefits for their daughters. Formalization and government recognition of CBE ' +
        'remains a challenge — without accreditation, CBE students may face barriers to further education.',
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  REASONING PATTERNS (Layer 7)                                      */
  /* ------------------------------------------------------------------ */
  reasoningPatterns: [
    {
      name: 'Learning progression reasoning',
      layer: 7,
      description:
        'Map backward from desired learning outcomes to prerequisite skills, then design instruction that ' +
        'builds sequentially. For reading: print awareness → letter knowledge → phonemic awareness → phonics ' +
        '→ decoding → fluency → comprehension → independent reading. For math: number recognition → counting ' +
        '→ quantity → operations → problem-solving. Identify where in the progression children are getting ' +
        'stuck (the "binding constraint" in the learning chain) and target instruction there. A program ' +
        'teaching comprehension strategies to children who cannot yet decode is wasting resources.',
    },
    {
      name: 'Supply-demand barrier analysis',
      layer: 7,
      description:
        'Systematically distinguish supply-side barriers (insufficient schools, classrooms, teachers, ' +
        'materials, curriculum relevance) from demand-side barriers (cost, distance, cultural norms, ' +
        'perceived returns, opportunity cost, safety) and design interventions that address the binding ' +
        'constraint. A common error is addressing supply when the barrier is demand (e.g., building schools ' +
        'when families can\'t afford uniforms) or vice versa. For gender: supply-side includes female ' +
        'teachers, separate latrines, safety; demand-side includes scholarships, menstrual products, ' +
        'community norm change. The most effective programs address both.',
    },
    {
      name: 'System-level thinking',
      layer: 7,
      description:
        'Analyze education as a system where changes at one level affect other levels. Five interconnected ' +
        'subsystems must be aligned: (a) curriculum and standards (what students should learn); (b) teacher ' +
        'development (how teachers are prepared and supported); (c) assessment (how learning is measured and ' +
        'data used); (d) accountability (what actors are incentivized to do); (e) financing (how resources ' +
        'are allocated). "Incoherent" systems — where curriculum standards are high but teacher capacity is ' +
        'low, or assessment tests rote memorization while curriculum promotes critical thinking — cannot ' +
        'deliver learning at scale (RISE Programme insight).',
    },
    {
      name: 'Equity-focused reasoning',
      layer: 7,
      description:
        'Start from the most marginalized children — girls, children with disabilities, the poorest quintile, ' +
        'linguistic minorities, displaced/refugee children — and design outward. Universal programs that treat ' +
        'all children the same typically benefit the already-advantaged most, widening equity gaps. This means: ' +
        'disaggregate all data by equity dimensions; design targeted interventions for the most excluded; ' +
        'monitor whether the program is reaching its intended beneficiaries; and apply a "progressive ' +
        'universalism" approach (universal programs with additional intensity for the most disadvantaged).',
    },
    {
      name: 'Cost-effectiveness reasoning',
      layer: 7,
      description:
        'Compare interventions by cost per learning-adjusted year of schooling (LAYS) gained, or cost per ' +
        'standard deviation improvement in learning outcomes. Reference J-PAL\'s education evidence: the most ' +
        'cost-effective interventions include Teaching at the Right Level ($10-15/child, 0.6-0.7 SD), ' +
        'structured pedagogy ($5-15/student, 0.23 SD average), information about returns to education ' +
        '($1-5/child, 0.05-0.10 SD on enrollment), and deworming ($0.50-1/child, 0.25 SD on attendance). ' +
        'Less cost-effective approaches include hardware provision (computers/tablets at $100-300/child with ' +
        'no learning gains), small class sizes ($300-1000/child with modest effects), and one-off teacher ' +
        'training ($20-50/teacher with minimal impact on practice).',
    },
    {
      name: 'Implementation fidelity reasoning',
      layer: 7,
      description:
        'Analyze whether a proven intervention can be implemented with fidelity at scale in the target ' +
        'context. Key dimensions: teacher capacity (can teachers deliver the approach as designed?), ' +
        'supervision and coaching systems (who ensures quality implementation?), material supply chains ' +
        '(can materials reach every school on time?), monitoring systems (how is implementation tracked?), ' +
        'political and institutional support (is there Ministry of Education buy-in?), and adaptation vs. ' +
        'fidelity trade-offs (what can be adapted to context without losing the active ingredients?). ' +
        'The "voltage drop" — efficacy in trials exceeding effectiveness at scale — is the most common ' +
        'failure mode in education programs.',
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  IMPROVEMENT HEURISTICS (Layer 8)                                  */
  /* ------------------------------------------------------------------ */
  improvementHeuristics: [
    {
      name: 'Replace access metrics with learning outcome targets',
      layer: 8,
      description:
        'Replace enrollment- and attendance-focused targets with learning outcome targets. Instead of ' +
        '"increase enrollment by 20%," specify "80% of grade 3 students reading at benchmark (45+ wcpm) ' +
        'by 2027." Access without learning is an empty promise — the learning crisis is not solved by ' +
        'getting more children into schools where they do not learn.',
    },
    {
      name: 'Add mother-tongue instruction component',
      layer: 8,
      description:
        'For multilingual contexts, add a mother-tongue or first-language instruction component. Evidence ' +
        'shows that children learn to read faster and with better comprehension in their mother tongue. ' +
        'UNESCO recommends at least 6 years of mother-tongue instruction with gradual transition to the ' +
        'language of wider communication. Programs that jump directly to second-language instruction ' +
        '(often colonial languages) systematically disadvantage the most marginalized children.',
    },
    {
      name: 'Strengthen teacher support beyond one-off training',
      layer: 8,
      description:
        'Replace one-off cascade training with ongoing teacher support: structured lesson plans, regular ' +
        'coaching visits (minimum monthly), professional learning communities (PLCs) for peer support, ' +
        'and classroom observation with feedback. The evidence consistently shows that training without ' +
        'coaching has minimal impact on teaching practice or student learning. Coaching adds approximately ' +
        '0.15 SD above training-only programs.',
    },
    {
      name: 'Include disability and inclusion provisions',
      layer: 8,
      description:
        'Add disability screening and identification, reasonable accommodations, assistive devices where ' +
        'needed, teacher training on differentiated instruction, and accessible infrastructure. Children ' +
        'with disabilities are 49% more likely to never attend school. Programs that do not explicitly ' +
        'address inclusion will miss the most marginalized learners.',
    },
    {
      name: 'Add community and parental engagement activities',
      layer: 8,
      description:
        'Add specific community and parental engagement activities: home reading programs, parent ' +
        'reading clubs, School Management Committee training and empowerment, community monitoring of ' +
        'school quality, and parent information campaigns about learning levels. Evidence shows that ' +
        'parental engagement — particularly in early reading — significantly amplifies program impact.',
    },
    {
      name: 'Include formative assessment and data use plan',
      layer: 8,
      description:
        'Add a plan for how teachers will use formative assessment data to adjust instruction. Specify: ' +
        'what data is collected (classroom-based assessment, periodic quizzes, observation), how often, ' +
        'who analyzes it, and what decisions it informs (regrouping students, re-teaching concepts, ' +
        'identifying struggling learners for extra support). Data collection without data use is waste.',
    },
    {
      name: 'Add transition support for vulnerable learners',
      layer: 8,
      description:
        'Add support for critical transition points: pre-primary to primary (school readiness), primary ' +
        'to secondary (bridge programs, scholarships, mentoring), re-entry for dropouts (especially ' +
        'adolescent mothers), and school-to-work (vocational skills, career guidance). The primary-to-secondary ' +
        'transition is the sharpest dropout point globally and requires deliberate programming.',
    },
    {
      name: 'Align with government curriculum and sector plan',
      layer: 8,
      description:
        'Reference and align with the national curriculum standards and the national education sector plan ' +
        '(ESP). Programs that operate outside the government curriculum create parallel systems and confusion ' +
        'for teachers. Alignment also facilitates government co-financing and eventual ownership. If the ' +
        'national curriculum is outdated or misaligned with evidence, work with the Ministry to update it ' +
        'rather than ignoring it.',
    },
    {
      name: 'Add sustainability mechanism',
      layer: 8,
      description:
        'Include a concrete sustainability plan: government co-financing (target trajectory from 30% to ' +
        '80% over the project period), capacity transfer to government staff (not parallel project staff), ' +
        'policy integration (embed the approach in national teacher training, curriculum, or assessment ' +
        'systems), and an explicit exit strategy naming the institutional owner after project funding ends. ' +
        'Programs that do not plan for sustainability from Day 1 rarely survive beyond the donor funding cycle.',
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  EVALUATION CRITERIA                                               */
  /* ------------------------------------------------------------------ */
  evaluationCriteria: [
    {
      criterion: 'Learning Outcomes Focus',
      weight: 0.25,
      description:
        'The program measures and targets actual learning gains — not just access, enrollment, or attendance.',
      scoringGuide:
        '90-100: Validated learning assessment tool specified (EGRA/EGMA, ASER, national exam), clear targets ' +
        'with expected effect sizes, data disaggregated by gender/poverty/disability/language. ' +
        '70-89: Learning measurement plan present and targets set, but tools unspecified or effect sizes not estimated. ' +
        '50-69: Vague learning targets (e.g., "improve literacy") without validated tools or specific benchmarks. ' +
        'Below 50: No learning outcomes specified — only access/enrollment/attendance metrics.',
    },
    {
      criterion: 'Equity & Inclusion',
      weight: 0.20,
      description:
        'The program addresses barriers faced by marginalized groups: gender, disability, poverty, language, ' +
        'ethnicity, and displacement.',
      scoringGuide:
        '90-100: Explicit equity analysis conducted; targeted interventions for 2+ marginalized groups; ' +
        'monitoring disaggregated by equity dimensions; progressive universalism approach. ' +
        '70-89: One marginalized group targeted with specific, named interventions. ' +
        '50-69: Equity and inclusion mentioned in program narrative but no targeted interventions described. ' +
        'Below 50: No equity or inclusion consideration — program treats all children as homogeneous.',
    },
    {
      criterion: 'Pedagogy & Curriculum Quality',
      weight: 0.20,
      description:
        'The program uses evidence-based teaching approaches aligned with national curriculum.',
      scoringGuide:
        '90-100: Structured pedagogy with coaching specified; mother-tongue instruction addressed; aligned ' +
        'to national curriculum standards; formative assessment embedded in teaching cycle; evidence base cited. ' +
        '70-89: Evidence-based pedagogical approach stated with some curriculum alignment. ' +
        '50-69: Teaching approach mentioned but not evidence-based or not aligned with curriculum. ' +
        'Below 50: No pedagogical strategy specified — assumes teaching will happen without describing how.',
    },
    {
      criterion: 'Teacher & School Capacity',
      weight: 0.15,
      description:
        'The program provides realistic teacher development and school-level support.',
      scoringGuide:
        '90-100: Ongoing coaching/mentoring plan with frequency and coach-to-teacher ratios specified; ' +
        'teacher-student ratios stated and feasible; school improvement plans; instructional leadership ' +
        'development for head teachers; PLCs or peer learning mechanisms. ' +
        '70-89: Teacher training plan includes follow-up support (at least one coaching visit). ' +
        '50-69: One-off training workshop mentioned with no follow-up mechanism. ' +
        'Below 50: No teacher development plan — assumes current teacher capacity is sufficient.',
    },
    {
      criterion: 'Data & Evidence Use',
      weight: 0.10,
      description:
        'The program has a clear assessment strategy and plan for using data to improve implementation.',
      scoringGuide:
        '90-100: Baseline-midline-endline design with validated tools; formative assessment plan for ' +
        'classroom use; real-time data dashboard or feedback system; evidence of data use for course ' +
        'correction; evaluation design specified (RCT, quasi-experimental, or rigorous pre-post). ' +
        '70-89: Baseline and endline planned with some data use described. ' +
        '50-69: Data collection planned but no plan for how data will be used for decision-making. ' +
        'Below 50: No assessment strategy or data collection plan.',
    },
    {
      criterion: 'Sustainability & System Integration',
      weight: 0.10,
      description:
        'The program integrates with the government education system and plans for sustainability.',
      scoringGuide:
        '90-100: Ministry of Education co-design and co-implementation; government co-financing trajectory ' +
        'stated (with target %); alignment with national education sector plan; capacity transfer plan to ' +
        'government staff; explicit exit strategy naming institutional owner. ' +
        '70-89: Government partnership stated with some integration mechanisms. ' +
        '50-69: Government mentioned as stakeholder but no integration or sustainability plan. ' +
        'Below 50: Parallel system with no government engagement or sustainability plan — likely to collapse ' +
        'when project funding ends.',
    },
  ],
}
