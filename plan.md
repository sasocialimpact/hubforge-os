# HubForge OS — Project Plan

> **Open Source Decision Intelligence Infrastructure for Complex Systems**
> *Build, Learn, Reason, Improve.*

---

## 0. Document Purpose & Sources

This `plan.md` consolidates the full HubForge OS vision, manifesto, architecture, knowledge
graph, and domain-pack design into a single executable project plan. It is the canonical
document engineers, contributors, and advisors should read before writing any code or
designing any module.

It synthesizes the following source documents:

| # | Source Document | Role in this plan |
|---|---|---|
| 1 | `HubForge OS.pdf` | Master overview, core thesis, principles, current stage |
| 2 | `HubForge OS Vision.pdf` | 10-year vision and mission framing |
| 3 | `HubForge OS Manifesto.pdf` | Problem statement and moral case |
| 4 | `HubForge OS Architecture.pdf` | System architecture, loop controller, memory model |
| 5 | `HubForge OS Knowledge Graph.pdf` | 8-layer knowledge ontology |
| 6 | `HubForge OS Domain Packs.pdf` | Domain Pack anatomy and the initial eight packs |

When this plan and a source document disagree, the source document wins on philosophy;
this plan wins on sequencing, scope, and engineering trade-offs.

---

## 1. Executive Summary

HubForge OS is an open-source **operating system for expert reasoning systems**. Where a
traditional OS manages computation, HubForge OS manages **structured reasoning**: it retrieves
knowledge, generates drafts, critiques its own logic, improves outputs, evaluates quality,
stores what it learned, and repeats until a confidence threshold is met.

Conventional AI systems follow a single-shot pattern — `Problem → Generate → Deliver` — which
produces shallow, one-pass intelligence. HubForge OS follows a recursive pattern —
`Problem → Retrieve → Generate → Critique → Improve → Evaluate → Store → Repeat` — which
mirrors how real human experts reason and produces outputs that compound in quality over time.

The system is organized as **two layers**:

1. **Core Intelligence Engine** — universal infrastructure (Supervisor, Reasoning, Retrieval,
   Rule, Critique, Evaluation, Memory, and Loop Controller engines) that never changes
   between domains.
2. **Domain Intelligence Packs** — specialized knowledge modules (Social Impact, Healthcare,
   Education, Climate, Public Policy, Research, Legal, Enterprise) that encode the expertise
   of a field.

The core thesis is simple: **the engine never changes; only the knowledge changes.** This
separation is what allows HubForge OS to scale from a single climate-adaptation prototype
into universal decision-intelligence infrastructure over a ten-year horizon.

This plan defines the architecture, the phased roadmap, the team and governance model, the
success metrics, and the risks that must be actively managed to reach the 10-year vision of
making world-class decision intelligence universally accessible.

---

## 2. Vision, Mission, and Manifesto

### 2.1 The Long-Term Vision

HubForge OS exists to become **foundational infrastructure for expert reasoning systems** —
the equivalent of an operating system, but for *thinking*. Just as Linux manages compute and
storage for applications, HubForge OS manages knowledge retrieval, critique, and recursive
improvement for decision-making systems.

Within ten years, the project should enable a world where:

- A **hospital** can deploy clinical reasoning systems.
- A **research institute** can deploy autonomous literature-synthesis systems.
- A **government** can deploy policy simulation systems.
- A **university** can deploy research-design systems.
- A **nonprofit** can deploy evaluation and learning systems.
- A **legal organization** can deploy case-reasoning systems.
- A **company** can deploy strategic-decision systems.

In every case, the underlying reasoning engine remains identical. Only the knowledge domain
changes. That is the leverage the architecture is designed to deliver.

### 2.2 The Mission

> *Build open-source infrastructure that enables the creation of self-improving expert
> reasoning systems. Make world-class decision intelligence universally accessible. Create
> systems that help humanity solve increasingly complex problems through better reasoning.*

### 2.3 The Manifesto (Why This Project Must Exist)

Humanity faces compounding complexity — climate change, public-health crises, economic
inequality, institutional failure, fragile governance, scientific uncertainty, and education
systems under pressure. The complexity of the world is increasing faster than our collective
ability to reason about it.

Current decision tooling is fundamentally primitive. Organizations rely on fragmented
expertise: consultants, reports, dashboards, and disconnected institutional memory. Human
expertise exists, but it does not scale. Current AI systems are no better in the dimension
that matters — they generate once and stop. They do not reason deeply, critique themselves,
improve their own thinking, or preserve institutional learning. That is probabilistic
generation, not intelligence.

HubForge OS is the response. It treats expert reasoning as **infrastructure** — open,
accessible, transparent, community-governed, and continuously improving. The future does not
belong to systems that generate faster; it belongs to systems that reason better.

---

## 3. Problem Statement

### 3.1 The Structural Problem

Modern organizations repeatedly face complex decisions and repeatedly lose the knowledge
needed to make them well. Expertise remains fragmented across people, documents, and tools.
When experts leave, their reasoning leaves with them. When decisions are repeated, prior
lessons are unavailable. Existing software helps organizations **collect and visualize**
information; it rarely helps them **reason better**.

### 3.2 The AI Gap

Most AI systems today follow the shallow pattern:

```
Problem  →  Generate Response  →  Deliver Output
```

This produces answers, not expertise. It cannot self-correct, cannot improve, and cannot
remember. It treats every problem as if it had never been seen before.

### 3.3 What HubForge OS Solves

HubForge OS replaces the single-shot pattern with a recursive loop:

```
Problem  →  Retrieve Knowledge  →  Generate Draft
        →  Critique Logic       →  Improve Output
        →  Evaluate Quality     →  Store Learning
        →  Repeat Until Threshold Reached
```

This loop solves four concrete problems simultaneously:

1. **Shallow intelligence** → recursive refinement produces expert-grade outputs.
2. **Lost institutional memory** → every reasoning trace is stored and reusable.
3. **Knowledge fragmentation** → structured knowledge graphs unify what experts know.
4. **Cost of expertise** → open infrastructure makes expert reasoning universally accessible.

---

## 4. Core Thesis: Recursive Reasoning vs. Single Generation

The single most important design decision in HubForge OS is the rejection of single-shot
generation. Every output must earn trust by passing through recursive improvement.

### 4.1 The Anti-Pattern (What We Reject)

```
Input  →  Generate Output  →  Stop
```

This pattern is fast, cheap, and shallow. It cannot detect its own errors, cannot improve,
and cannot learn. It is the dominant pattern in current AI systems, and it is the reason
current AI systems cannot serve as infrastructure for serious decision-making.

### 4.2 The HubForge Pattern (What We Build)

```
Input
 → Understand Problem
 → Retrieve Knowledge
 → Generate Draft
 → Critique Logic
 → Improve Output
 → Evaluate Quality
 → Store Learning
 → Repeat Until Confidence Threshold
 → Deliver Output
```

### 4.3 Why This Works

This mirrors how real experts reason. Real experts do not generate once. They retrieve
evidence. They test assumptions. They critique weak reasoning. They refine ideas repeatedly.
They learn from prior experience. They improve over time. HubForge OS encodes this behavior
as infrastructure, so every organization — not just the ones that can afford senior experts —
gets the benefit of disciplined, iterative reasoning.

### 4.4 The Compounding Effect

Because every reasoning trace is stored, the system improves over time. The thousandth
climate-adaptation strategy is informed by the nine hundred and ninety-nine that came before
it. This is what we mean by **compounding intelligence**: the system gets measurably better
the more it is used.

---

## 5. System Architecture

### 5.1 Two-Layer Architecture

HubForge OS is intentionally split into two layers that evolve on different clocks.

```
┌─────────────────────────────────────────────────────────┐
│  Layer 2 — Domain Intelligence Packs                    │
│  (Social Impact, Healthcare, Education, Climate,        │
│   Public Policy, Research, Legal, Enterprise, …)        │
└─────────────────────────────────────────────────────────┘
                       ▲   ▼  (knowledge interface)
┌─────────────────────────────────────────────────────────┐
│  Layer 1 — Core Intelligence Engine                     │
│  (universal, never changes between domains)             │
└─────────────────────────────────────────────────────────┘
```

- **Layer 1 is universal.** It contains no domain knowledge. It defines *how* to reason,
  not *what* to reason about.
- **Layer 2 is specialized.** Each Domain Pack encodes the *what* — frameworks, rules,
  evidence, memory — for one field.

This separation is the architectural lever. It is what allows a single engine to power a
hospital diagnostic system, a government policy simulator, and a nonprofit evaluation tool
without forking the codebase.

### 5.2 Core Intelligence Engine — Eight Sub-Engines

The Core Engine is composed of eight cooperating engines. Each has a single, well-bounded
responsibility.

| Engine | Responsibility |
|---|---|
| **Supervisor Engine** | Orchestrates the entire reasoning loop; decomposes problems into sub-tasks; routes work to the right engines. |
| **Reasoning Engine** | Generates drafts, hypotheses, and candidate solutions using LLMs and structured prompts. |
| **Retrieval Engine** | Pulls relevant knowledge from the Knowledge Graph (frameworks, rules, evidence, memory) before generation. |
| **Rule Engine** | Applies deterministic, no-AI rules first (validation gates, schema checks, hard constraints). |
| **Critique Engine** | Inspects generated drafts for weak assumptions, missing evidence, logical inconsistency, and vague outputs. |
| **Evaluation Engine** | Scores output quality on a defined rubric; produces the `quality_score` that gates the loop. |
| **Memory Engine** | Stores reasoning traces, prior solutions, failed attempts, and institutional knowledge for reuse. |
| **Loop Controller** | Decides whether to iterate again, escalate to a more expensive model, or deliver the output. Enforces `MAX_ITERATIONS` bounds. |

### 5.3 Core System Flow

```
            User Problem
                 │
                 ▼
       ┌──────────────────┐
       │ Supervisor Engine│  ── task decomposition
       └──────────────────┘
                 │
                 ▼
       ┌──────────────────┐
       │ Knowledge        │  ── retrieve from Knowledge Graph
       │ Retrieval        │
       └──────────────────┘
                 │
                 ▼
       ┌──────────────────┐
       │ Draft Generation │  ── Reasoning Engine
       └──────────────────┘
                 │
                 ▼
       ┌──────────────────┐
       │ Critique Analysis│  ── Critique Engine
       └──────────────────┘
                 │
                 ▼
       ┌──────────────────┐
       │ Improvement Layer│  ── Reasoning + Critique feedback
       └──────────────────┘
                 │
                 ▼
       ┌──────────────────┐
       │ Evaluation Layer │  ── quality_score
       └──────────────────┘
                 │
                 ▼
       ┌──────────────────┐
       │ Memory Storage   │  ── persist trace
       └──────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Threshold      │── no ──▶ loop again
        │ reached?       │
        └────────────────┘
                 │ yes
                 ▼
          Deliver Output
```

### 5.4 Computational Hierarchy (Cost Discipline)

A core architectural principle is that **expensive reasoning must be minimized whenever
possible.** The system always tries the cheapest competent step first and only escalates
when the cheaper layer cannot resolve the task.

```
Rule Engine          (deterministic, cheapest)
        ▼
Retrieval Engine     (vector + graph lookup)
        ▼
Lightweight Models   (small, fast LLMs)
        ▼
Advanced Reasoning   (large/expensive models, last resort)
```

This hierarchy is not an optimization — it is a design constraint. It keeps the system
affordable for nonprofits and public-sector users, and it keeps response latency
acceptable for interactive workflows.

### 5.5 Recursive Improvement Logic

Every reasoning process follows a bounded loop. Boundedness is mandatory: an unbounded
self-critique loop can spiral, hallucinate, or burn compute. The reference logic is:

```pseudo
MAX_ITERATIONS = 4
threshold      = domain-defined confidence score

while quality_score < threshold and iterations < MAX_ITERATIONS:
    draft     = Reasoning.generate(problem, retrieved_knowledge, prior_critique)
    critique  = Critique.analyze(draft)
    improved  = Reasoning.improve(draft, critique)
    quality   = Evaluation.score(improved)
    Memory.store(problem, draft, critique, improved, quality)
    iterations += 1

if quality_score >= threshold:
    deliver(improved)
else:
    escalate_or_flag_for_human_review(improved)
```

Two escape hatches are mandatory:

1. **`MAX_ITERATIONS` cap** — prevents runaway loops.
2. **Human escalation** — if the threshold is not reached within the cap, the system flags
   the output for human review rather than silently delivering a low-confidence answer.

### 5.6 Memory Architecture

Memory is not a log — it is the substrate of compounding intelligence. The Memory Engine
stores:

- Previous solutions (successful patterns to retrieve and adapt).
- Failed reasoning attempts (anti-patterns to avoid repeating).
- Successful patterns (templates that can be re-applied).
- Historical decisions (the institutional record).
- Institutional knowledge (the unwritten rules of the organization).
- Domain knowledge (the structured expert canon).

Memory allows continuous improvement. Without it, HubForge OS would be a clever generator;
with it, the system becomes a learning organization.

---

## 6. Knowledge Graph — Eight-Layer Ontology

HubForge OS cannot reason effectively without organized expert knowledge. Knowledge must be
machine-readable. The Knowledge Graph organizes all knowledge into **eight major layers**,
each with a distinct role in the reasoning loop.

| Layer | Name | Purpose | Example Contents |
|---|---|---|---|
| 1 | **Domain Knowledge** | Specialized domain expertise — the "what" of a field | Social impact, healthcare, education, climate, law, policy, research, enterprise |
| 2 | **Framework Knowledge** | Structured frameworks experts reuse repeatedly | Theory of Change, Logframes, Diagnostic Protocols, Experimental Design, Policy Simulation Models, Case Reasoning Structures |
| 3 | **Procedural Knowledge** | Process knowledge — ordered steps that become machine-executable | Research process: Question → Literature Review → Hypothesis → Method → Sampling → Collection → Analysis → Interpretation → Publication |
| 4 | **Decision Rules** | Deterministic rules that require no AI | SMART goal validation; sample-size flags; incomplete symptom clusters; low-evidence-confidence verification |
| 5 | **Evidence Libraries** | Source evidence the system can cite | Research papers, policy reports, institutional frameworks, government guidelines, historical cases, structured databases |
| 6 | **Historical Memory** | Prior reasoning outcomes | Previous decisions, successful solutions, failed solutions, institutional knowledge, repeated reasoning patterns |
| 7 | **Reasoning Patterns** | Expert reasoning templates | Diagnosis, hypothesis testing, comparative analysis, failure analysis, root cause, counterfactual, risk modeling, tradeoff analysis |
| 8 | **Improvement Heuristics** | Methods for raising reasoning quality | Find weak assumptions, detect logical inconsistency, detect missing evidence, replace vague outputs, strengthen measurable targets, reduce uncertainty, improve causal logic |

### 6.1 How the Layers Map to the Engines

- **Retrieval Engine** reads Layers 1, 2, 3, 5, 7 to assemble context before generation.
- **Rule Engine** executes Layer 4 (deterministic, no AI).
- **Critique Engine** applies Layer 8 heuristics to a draft.
- **Evaluation Engine** uses Layer 2 frameworks as scoring rubrics.
- **Memory Engine** writes to and reads from Layer 6.

This mapping is what makes the architecture composable: each engine has a well-defined
contract with the Knowledge Graph, and Domain Packs plug in by populating layers 1–8 for
their field.

### 6.2 Core Principle

> *Knowledge must become infrastructure. Expertise should be structured, reusable, and
> machine-readable. This becomes the intelligence foundation of HubForge OS.*

---

## 7. Domain Packs

### 7.1 Anatomy of a Domain Pack

Every Domain Pack is a self-contained module that adapts the universal Core Engine to one
knowledge environment. A Pack always contains:

- Specialized knowledge ontology (Layer 1 contents for the field)
- Framework libraries (Layer 2 contents)
- Decision rules (Layer 4 contents)
- Evidence databases (Layer 5 contents)
- Evaluation criteria (rubrics the Evaluation Engine uses)
- Prompt systems (domain-tuned prompts for the Reasoning Engine)
- Domain memory structures (Layer 6 schemas, seeded with canonical cases)

A Pack must **never** require changes to the Core Engine. If a Pack needs a new Core
capability, that is a Core Engine change request, not a Pack change.

### 7.2 The Initial Eight Domain Packs

| Pack | Supports | Knowledge Frameworks (examples) |
|---|---|---|
| **Social Impact Pack** | Program design, monitoring, evaluation, research design, learning systems, institutional memory | Theory of Change, Logical Framework Analysis, Outcome Mapping, Survey Design, Impact Evaluation Methods |
| **Healthcare Pack** | Clinical reasoning, diagnostic support, treatment planning, patient risk modeling, medical decision systems | Clinical protocols, treatment pathways, symptom reasoning trees, medical evidence libraries |
| **Education Pack** | Curriculum design, learning-outcome measurement, student assessment, learning analytics, education planning | Learning taxonomies, assessment systems, curriculum frameworks, instructional design systems |
| **Research Systems Pack** | Literature synthesis, hypothesis generation, experimental design, statistical reasoning, methodological critique | Experimental methods, research methodology, statistical frameworks, sampling systems |
| **Public Policy Pack** | Policy simulation, regulatory reasoning, governance design, public-sector strategy, institutional reform | Policy frameworks, regulatory systems, governance models, economic modeling |
| **Climate Intelligence Pack** | Climate adaptation planning, vulnerability assessment, resilience strategy, resource allocation, environmental decisions | Climate science frameworks, resilience indicators, adaptation planning systems |
| **Legal Systems Pack** | Case analysis, legal research, compliance reasoning, regulatory interpretation, contract review | Case law structures, legal precedent systems, compliance frameworks |
| **Enterprise Systems Pack** | Strategic planning, operational decisions, risk management, organizational intelligence, business optimization | Strategy frameworks, business process systems, operational analytics |

### 7.3 Future Expansion

Any field requiring expert reasoning can become a Domain Pack. Candidate future packs
identified in the source documents:

- Agriculture
- Cybersecurity
- Defense Strategy
- Energy Systems
- Manufacturing
- Supply Chain Systems
- Urban Planning

### 7.4 Design Rule (Non-Negotiable)

> *The Core Engine never changes. Only knowledge changes. This allows HubForge OS to become
> universal decision intelligence infrastructure.*

---

## 8. Design Principles

HubForge OS follows six principles. Every architectural and product decision must be
defensible against these principles.

1. **Open Infrastructure** — Decision intelligence should remain public infrastructure.
   No proprietary lock-in on the core engine or the knowledge representation.
2. **Evidence First** — Systems must retrieve evidence before generating new reasoning.
   Generation without retrieval is an anti-pattern.
3. **Computational Efficiency** — Expensive reasoning must be minimized whenever possible.
   The cost hierarchy (Rule → Retrieval → Lightweight → Advanced) is mandatory.
4. **Transparency** — Users should understand how reasoning decisions were made. Every
   output ships with its reasoning trace, critique history, and evidence citations.
5. **Continuous Learning** — Systems must preserve institutional memory and improve over
   time. Memory is a first-class subsystem, not an afterthought.
6. **Community Driven Development** — Knowledge systems improve through collective
   contribution. Packs are community-owned; the Core Engine is community-governed.

---

## 9. Development Roadmap (Phased)

The current stage, per the source documents, is **early architecture design**: building the
knowledge ontology, core reasoning architecture, agent runtime system, first prototype, and
Domain Pack system. The roadmap below sequences this work into deliverable phases.

### Phase 0 — Foundation (Weeks 0–4)

**Goal:** Establish the repo, governance, and contracts before any engine code is written.

- Public repository, `Apache-2.0` license, `CONTRIBUTING.md`, governance charter.
- Define the **Core Engine ↔ Domain Pack interface contract** (the schema every Pack must
  implement). This is the single most important Phase 0 artifact.
- Define the **Knowledge Graph schema** for layers 1–8 (entity types, relations, required
  fields per layer).
- Choose the reference runtime and observability stack (see §10).
- Publish an architecture decision record (ADR) for every non-trivial choice.

**Exit criteria:** A contributor can write a Pack against the published interface contract
without asking the core team any questions.

### Phase 1 — Core Engine MVP (Weeks 4–12)

**Goal:** A minimal end-to-end loop running on a toy domain, with no Domain Pack yet.

- Implement the **Supervisor Engine** (task decomposition + orchestration).
- Implement the **Retrieval Engine** (vector + graph retrieval over a stub Knowledge Graph).
- Implement the **Reasoning Engine** (LLM-backed draft generation behind a provider
  abstraction so models can be swapped).
- Implement the **Loop Controller** with `MAX_ITERATIONS` and human-escalation escape hatches.
- Implement the **Memory Engine** (append-only reasoning traces; retrieval by similarity).
- Leave **Rule**, **Critique**, and **Evaluation** engines as stubs with clear interfaces.

**Exit criteria:** Given a toy problem, the system runs the full loop end-to-end, persists a
trace to Memory, and either delivers an output or escalates. No real domain knowledge yet.

### Phase 2 — Knowledge Graph v1 (Weeks 8–16, overlapping Phase 1)

**Goal:** The 8-layer ontology is real, queryable, and populated with seed data.

- Implement storage for all 8 layers (graph DB for relations, vector store for evidence,
  relational store for rules and procedural knowledge).
- Build importers for common evidence formats (PDFs, citations, structured datasets).
- Seed Layer 7 (Reasoning Patterns) with the canonical 9 patterns: diagnosis, hypothesis
  testing, comparative analysis, failure analysis, root cause, counterfactual, risk modeling,
  tradeoff analysis.
- Seed Layer 8 (Improvement Heuristics) with the canonical 7 heuristics.
- Publish a Pack-authoring toolkit: validators, seeders, and a CLI to scaffold a new Pack.

**Exit criteria:** A Pack author can populate all 8 layers for a new domain using the
toolkit, and the Core Engine can retrieve from every layer.

### Phase 3 — Critique, Evaluation, and Rule Engines (Weeks 12–20)

**Goal:** The engines that make reasoning *recursive* (not just generated) are real.

- Implement the **Rule Engine** (deterministic gates; cheapest layer of the cost hierarchy).
- Implement the **Critique Engine** using Layer 8 heuristics as its checklist.
- Implement the **Evaluation Engine** using Layer 2 frameworks as scoring rubrics; produce
  the `quality_score` that gates the loop.
- Wire the cost hierarchy (§5.4) into the Supervisor so cheap layers run first.

**Exit criteria:** On the toy domain, increasing `MAX_ITERATIONS` measurably raises the
delivered `quality_score`. The system demonstrably self-improves within a single run.

### Phase 4 — First Real Domain Pack: Social Impact (Weeks 16–24)

**Goal:** Prove the architecture on a real field. Social Impact is the first Pack because
its frameworks (Theory of Change, Logframes) are well-documented and its evaluation criteria
are concrete.

- Populate all 8 layers for the Social Impact Pack.
- Build the canonical example workflow end-to-end: *"Design a climate adaptation strategy
  for smallholder farmers"* (the example cited in the source documents).
- Publish the Pack as the reference implementation that all future Packs imitate.

**Exit criteria:** A nonprofit user can submit a real program-design problem and receive an
expert-grade, traceable, cited output that survives human review by a domain expert.

### Phase 5 — Multi-Domain Expansion (Weeks 24–48)

**Goal:** Deliver the next three Packs and harden the Core Engine against real-world load.

- Healthcare Pack (clinical reasoning, diagnostic support).
- Research Systems Pack (literature synthesis, experimental design).
- Climate Intelligence Pack (adaptation planning, vulnerability assessment).
- For each Pack, repeat the Phase 4 validation: a real user, a real problem, human review.

**Exit criteria:** Four Packs are in production. The Core Engine has not been forked for any
of them. Any divergence from the interface contract is treated as a bug.

### Phase 6 — Community & Ecosystem (Weeks 48–72)

**Goal:** Make HubForge OS a community-owned project, not a single-team product.

- Public Pack registry; community-contributed Packs for Agriculture, Cybersecurity, Urban
  Planning, etc.
- Governance body with seats for domain experts, not just engineers.
- Documentation, tutorials, and a "build your first Pack" path that a non-engineer domain
  expert can complete in a weekend.
- Reference deployments for low-resource settings (offline-capable, lightweight models).

**Exit criteria:** A Pack has been authored and merged by a contributor outside the founding
team without core-team hand-holding.

### Phase 7 — Toward the 10-Year Vision (Year 2 onward)

**Goal:** Universal decision-intelligence infrastructure.

- Long-tail Packs: Legal, Enterprise, Public Policy, Education, Defense, Energy,
  Manufacturing, Supply Chain.
- Cross-Pack reasoning (e.g., climate + agriculture + policy problems that span domains).
- Federated memory: organizations share anonymized reasoning patterns without sharing
  sensitive data.
- Certified-Pack program: Packs vetted by domain-expert boards.
- Multilingual knowledge and reasoning.

**Exit criteria (10-year horizon):** Organizations no longer depend exclusively on human
consultants for complex reasoning tasks; knowledge is machine-readable infrastructure; expert
reasoning is universal public infrastructure.

---

## 10. Technical Stack Proposal

The source documents are deliberately stack-agnostic. The following is a *proposal* aligned
with the project's open-infrastructure and computational-efficiency principles; final choices
are ADRs owned by the core team.

| Concern | Proposed choice | Rationale |
|---|---|---|
| Language (core) | Python + TypeScript | Python for ML/reasoning; TS for the web/control plane |
| Reasoning providers | Provider-agnostic abstraction over OpenAI-compatible, Anthropic-compatible, and open-weight local models | Open Infrastructure principle; avoids lock-in; enables offline/low-resource deployments |
| Knowledge Graph store | Hybrid: graph DB (e.g., Neo4j or Apache AGE) for relations + vector store (e.g., Qdrant or pgvector) for evidence + relational DB for rules/procedural | Each layer has different access patterns; one store cannot serve all eight layers well |
| Memory store | Append-only event log + vector index over traces | Continuous Learning principle; traces must be immutable and retrievable |
| Agent runtime | Custom Supervisor-driven runtime (not a generic agent framework) | The Supervisor's task-decomposition and cost-hierarchy logic is domain-specific and should not be delegated to a generic framework |
| Observability | OpenTelemetry traces spanning every engine + every loop iteration | Transparency principle; every output must ship with a reconstructable reasoning trace |
| Packaging | PyPI for the Core Engine; Pack registry for Domain Packs | Clear separation between universal infrastructure and specialized knowledge |
| License | Apache 2.0 (as stated in the source documents) | Permissive; compatible with institutional adoption |

**Non-goal:** HubForge OS is not a chatbot, not a single AI model, and not a wrapper around
one vendor's API. Any technical choice that pushes the project toward any of these is rejected
by design.

---

## 11. Team & Roles

The source documents name the expertise the project needs. Mapped to roles:

| Role | Why it exists | Source callout |
|---|---|---|
| **Core Engine engineers** | Build the 8 sub-engines and the loop controller | "AI engineering" |
| **Knowledge systems designers** | Design and maintain the 8-layer Knowledge Graph | "Knowledge systems design" |
| **Research methodologists** | Ensure Layer 2 frameworks and Layer 7 reasoning patterns are epistemically sound | "Research methodology" |
| **Open-source infrastructure engineers** | CI/CD, packaging, registry, governance tooling | "Open source infrastructure" |
| **Domain experts (per Pack)** | Author and validate Domain Packs | "Domain experts" |
| **Decision-science researchers** | Define evaluation rubrics, critique heuristics, and quality thresholds | "Decision science researchers" |

A Pack is never shipped without sign-off from at least one domain expert for that field. This
is a quality gate, not a courtesy.

---

## 12. Contribution & Governance Model

The source documents state the project is **actively seeking contributors** and is
**community driven**. The governance model should reflect that.

- **Apache-2.0 license**, with a Contributor License Agreement that protects the project's
  ability to remain open infrastructure.
- **Two-layer governance:** a Core Engine team (stewards the universal layer) and a Pack
  Council (stewards Domain Packs, with one seat per Pack, held by a domain expert).
- **ADRs for every non-trivial decision.** No change to the Core Engine ↔ Pack interface
  contract lands without a public ADR and a comment period.
- **Pack ownership is transferable.** A Pack is governed by its maintainers, not by the
  Core team. This protects domain autonomy.
- **Certified-Pack program (Phase 6+).** Packs reviewed by a domain-expert board earn a
  "certified" badge. Uncertified Packs remain usable but are clearly labeled.

---

## 13. Success Metrics & KPIs

Metrics must measure the project's *mission*, not its activity. Activity metrics (stars,
commits) are reported but never used as success criteria.

### 13.1 Mission Metrics

| Metric | Target by end of Phase 5 | Target by Year 3 |
|---|---|---|
| Domain Packs in production | 4 | 10+ |
| Packs authored by non-founding contributors | 1 | 5+ |
| Organizations running HubForge OS in a real decision workflow | 3 | 25+ |
| Outputs that survive blind human expert review | ≥ 70% | ≥ 85% |
| Measurable quality lift per loop iteration (avg `quality_score` delta) | > 0 | > 0 and increasing |

### 13.2 Architecture Health Metrics

| Metric | Target |
|---|---|
| Core Engine forks to support a new Pack | 0 (non-negotiable) |
| Interface-contract violations per Pack | 0 |
| Share of reasoning served by the cheapest competent layer (Rule/Retrieval) | ≥ 60% |
| Average `MAX_ITERATIONS` actually consumed before threshold | < 3 (efficiency) |
| Reasoning traces fully reconstructable from Memory | 100% |

### 13.3 Community Health Metrics

| Metric | Target by Year 2 |
|---|---|
| Active Pack maintainers | ≥ 15 |
| Domains represented in governance | ≥ 6 |
| Documentation completeness for Pack authoring | A non-engineer domain expert can ship a Pack from docs alone |

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Recursive loop runaway** — self-critique spirals or burns compute | High | Hard `MAX_ITERATIONS` cap + mandatory human-escalation escape hatch (§5.5) |
| **Cost explosion** — Advanced Reasoning layer fires too often | High | Cost hierarchy (§5.4) is a design constraint, not an optimization; budget per query enforced by the Loop Controller |
| **Knowledge Graph becomes a dumping ground** — Packs ship unstructured noise | High | Pack-authoring toolkit includes validators per layer; certification program (Phase 6+) gates "certified" status |
| **Core Engine drift** — Pack-specific logic leaks into the Core | Critical | Interface contract (Phase 0) + ADRs + CI tests that reject Core changes introducing Pack-specific assumptions |
| **Single-vendor model lock-in** | High | Provider abstraction (§10); at least one open-weight local model path maintained continuously |
| **Memory pollution** — bad prior traces degrade future reasoning | High | Memory is retrieval-ranked, not blindly trusted; failed traces are tagged as anti-patterns (Layer 6) and used by the Critique Engine, not by the Reasoning Engine |
| **Domain-expert scarcity** — Packs ship without real expert review | High | Pack sign-off gate (§11); no Pack reaches "certified" without a domain-expert board |
| **Open-source sustainability** — project stalls when founders move on | Medium | Governance body with Pack Council seats (§12); funded maintainer roles pursued from Year 2 |
| **Misuse** — reasoning infrastructure used to manufacture authoritative-sounding misinformation | Medium | Transparency principle: every output ships with a full trace; certified Packs only; clear labeling of uncertified outputs |

---

## 15. Milestones & Timeline (Summary)

| Milestone | Target | Phase |
|---|---|---|
| Repo, license, governance, interface contract published | Week 4 | Phase 0 |
| Core Engine MVP runs end-to-end on a toy domain | Week 12 | Phase 1 |
| Knowledge Graph v1 queryable across all 8 layers | Week 16 | Phase 2 |
| Critique + Evaluation + Rule engines make the loop self-improving | Week 20 | Phase 3 |
| First real Pack (Social Impact) passes expert review | Week 24 | Phase 4 |
| Four Packs in production | Week 48 | Phase 5 |
| Community Pack registry live; first external-contributor Pack merged | Week 72 | Phase 6 |
| Cross-Pack reasoning; certified-Pack program | Year 2+ | Phase 7 |
| Universal decision-intelligence infrastructure | Year 10 | Vision |

---

## 16. Open Questions

These are intentionally unresolved. Each should become an ADR before the relevant phase
begins.

1. **Quality threshold calibration.** How is the `quality_score` threshold defined per Pack,
   and who owns it — the Pack maintainer, a domain board, or the Core team?
2. **Memory sharing vs. privacy.** When multiple organizations use the same Pack, what is
   shared into Layer 6 (Historical Memory) and what stays organization-local? Federated
   memory (Phase 7) needs a concrete design.
3. **Model governance.** Which open-weight models are "blessed" for the Lightweight tier,
   and how often is that list refreshed?
4. **Pack compatibility versioning.** When the Core Engine ↔ Pack interface evolves, how are
   existing Packs migrated without breaking production deployments?
5. **Evaluation ground truth.** For domains without established benchmarks (e.g., social
   impact program design), how is the Evaluation Engine's rubric validated?
6. **Offline / low-resource deployment.** What is the minimal deployment surface area for a
   nonprofit with no GPU and intermittent connectivity?

---

## 17. Appendix

### 17.1 Glossary

- **Core Engine** — the universal Layer 1; the eight sub-engines plus the Loop Controller.
- **Domain Pack** — a Layer 2 module that adapts the Core Engine to one field.
- **Knowledge Graph** — the 8-layer machine-readable knowledge substrate.
- **Reasoning trace** — the immutable record of every step a run took (retrieval, draft,
  critique, improvement, evaluation, memory write).
- **Quality score** — the Evaluation Engine's rubric score that gates the recursive loop.
- **Cost hierarchy** — the Rule → Retrieval → Lightweight → Advanced escalation order.
- **Compounding intelligence** — the property that the system measurably improves the more it
  is used, because traces are stored and retrieved.

### 17.2 The Canonical Example (from the source documents)

> *User input: "Design a climate adaptation strategy for smallholder farmers."*
>
> System process:
> Understand problem → Retrieve climate frameworks → Generate strategy →
> Critique assumptions → Improve design → Evaluate feasibility → Store learning → Repeat →
> Deliver expert-grade output.

This example is the project's integration test. By Phase 4, the Social Impact Pack (with
Climate Intelligence Pack collaboration) must execute this flow end-to-end and survive human
expert review.

### 17.3 Source-Document Principles (verbatim)

> **Open Infrastructure** — Decision intelligence should remain public infrastructure.
> **Evidence First** — Systems must retrieve evidence before generating new reasoning.
> **Computational Efficiency** — Expensive reasoning should be minimized whenever possible.
> **Transparency** — Users should understand how reasoning decisions were made.
> **Continuous Learning** — Systems must preserve institutional memory and improve over time.
> **Community Driven Development** — Knowledge systems improve through collective contribution.

### 17.4 License

Apache 2.0 — as stated in the source documents.

---

*Build systems that think better.*
