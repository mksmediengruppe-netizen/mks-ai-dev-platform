# M11 Roadmap
## MKS IT Dev Platform — Milestone 11: Intelligence & Self-Improvement

**Date:** 09.03.2026  
**Based on:** M10 Acceptance Report, Production Observations, Platform Gaps Analysis  
**Target delivery:** Q2 2026  

---

## Overview

Milestone 11 (M11) builds on the autonomous operations foundation of M10 and focuses on **Intelligence & Self-Improvement**: making the platform smarter, more self-aware, and capable of improving its own performance over time. The key themes are advanced AI reasoning, self-healing infrastructure, multi-agent coordination, and production-grade observability.

M10 established that the platform can operate autonomously. M11 makes it operate *intelligently* — learning from patterns, self-diagnosing failures, and coordinating multiple AI agents on complex tasks.

---

## Strategic Goals for M11

The three strategic goals of M11 are:

**Goal 1 — Conversational Intelligence Upgrade.** The chat system must move beyond keyword-based intent classification to a fully LLM-driven intent understanding pipeline. Every message should be processed through a structured reasoning chain before routing, eliminating the class of bugs where keyword overlap causes misclassification.

**Goal 2 — Multi-Agent Task Orchestration.** Complex tasks (e.g., "build a full CRM with auth, DB, and API") should be automatically decomposed into sub-tasks and assigned to specialized agents (DB Designer, App Builder, Doc Builder, RBAC Builder) that work in parallel and coordinate their outputs.

**Goal 3 — Self-Healing & Observability.** The platform should detect its own failures, generate incident reports, and attempt automatic recovery. Operators should have real-time visibility into all system health indicators through a unified observability dashboard.

---

## Feature Roadmap

### M11.1 — LLM-Native Intent Classification

**Priority:** Critical  
**Effort:** 2 weeks  

Replace the current keyword-based `interpret_message` function with a fully LLM-driven classification pipeline. The new pipeline will use a structured prompt that receives the full message, conversation history, and user context, and returns a structured JSON intent object with confidence scores.

The current system has a fundamental architectural flaw: it uses string matching (`help_words`, `blacksart_words`, etc.) which is fragile and requires manual maintenance. An LLM-based classifier will handle all edge cases naturally and can be improved by adding examples rather than editing code.

| Sub-feature | Description |
|-------------|-------------|
| Intent classifier v2 | GPT-4.1-mini based, returns structured JSON with intent, entities, confidence |
| Conversation context injection | Last 5 messages included in classification prompt |
| Fallback chain | If LLM unavailable, fall back to keyword classifier |
| Intent logging | All classified intents logged for analysis |
| A/B testing framework | Compare v1 vs v2 classifier accuracy |

---

### M11.2 — Multi-Agent Task Orchestration

**Priority:** High  
**Effort:** 3 weeks  

Implement a task decomposition and multi-agent coordination layer. When a complex task is received (e.g., "create a full-stack SaaS app"), the orchestrator decomposes it into sub-tasks, assigns each to the appropriate specialist agent, and coordinates their outputs into a unified result.

This addresses the current limitation where all tasks are handled by a single agent sequentially. Parallel agent execution will reduce task completion time by 60–80% for complex tasks.

| Sub-feature | Description |
|-------------|-------------|
| Task decomposer | LLM-based decomposition into typed sub-tasks |
| Agent registry | Catalog of available agents with capabilities and load |
| Parallel execution engine | Run independent sub-tasks concurrently |
| Result aggregator | Merge sub-task outputs into coherent response |
| Dependency graph | Track sub-task dependencies and execution order |
| Human-in-the-loop gates | Pause for approval at configurable checkpoints |

---

### M11.3 — Self-Healing Infrastructure

**Priority:** High  
**Effort:** 2 weeks  

The platform should detect its own failures and attempt automatic recovery. This includes container health monitoring, automatic restart on failure, incident creation, and escalation to operators when auto-recovery fails.

| Sub-feature | Description |
|-------------|-------------|
| Health watchdog | Background process that monitors all services every 30s |
| Auto-recovery rules | Configurable rules for common failure patterns |
| Incident auto-creation | Failed health checks create incidents automatically |
| Recovery playbooks | Predefined recovery steps for known failure modes |
| Escalation ladder | Auto-escalate to operator if recovery fails 3 times |

---

### M11.4 — Advanced Memory & Learning

**Priority:** High  
**Effort:** 2 weeks  

Upgrade the memory system from simple key-value storage to a vector-based semantic memory that can retrieve relevant past context, learn from successful task completions, and avoid repeating mistakes.

| Sub-feature | Description |
|-------------|-------------|
| Vector memory store | pgvector-based semantic search over past conversations |
| Success pattern extraction | Automatically identify and store successful task patterns |
| Failure post-mortem | Analyze failed tasks and store lessons learned |
| Cross-project knowledge | Share learnings across projects (with permission) |
| Memory decay | Old, unused memories fade; recent ones are reinforced |

---

### M11.5 — Unified Observability Dashboard

**Priority:** Medium  
**Effort:** 1.5 weeks  

Build a real-time observability dashboard in the frontend that shows system health, agent activity, task throughput, error rates, and LLM usage metrics in a single view.

| Sub-feature | Description |
|-------------|-------------|
| Real-time metrics panel | Live charts for task throughput, error rate, latency |
| Agent activity feed | What each agent is doing right now |
| LLM usage tracker | Token consumption, cost estimation, rate limit status |
| Anomaly detection | Highlight unusual patterns automatically |
| Alert configuration | Set thresholds and notification rules |

---

### M11.6 — Product Templates Marketplace

**Priority:** Medium  
**Effort:** 1 week  

Complete the product templates system (partially broken in M10 — `product_templates` table lacks project scoping). Add a marketplace UI where users can browse, install, and customize templates.

| Sub-feature | Description |
|-------------|-------------|
| Project-scoped templates | Add `project_id` to `product_templates` table |
| Template marketplace UI | Browse and install templates from the frontend |
| Template versioning | Track template versions and changes |
| Custom template creation | Users can create and share their own templates |

---

### M11.7 — Streaming Responses

**Priority:** Medium  
**Effort:** 1.5 weeks  

Replace the current request-response model for LLM calls with Server-Sent Events (SSE) streaming. Users will see the AI response appear word-by-word instead of waiting for the full response, dramatically improving perceived performance.

| Sub-feature | Description |
|-------------|-------------|
| SSE endpoint for messages | `POST /conversations/{id}/messages/stream` |
| Frontend streaming renderer | Incremental Markdown rendering as tokens arrive |
| Streaming for all LLM calls | Apply to chat, analysis, code generation |
| Partial result caching | Cache partial results for retry on disconnect |

---

### M11.8 — Enhanced Site Operations

**Priority:** Medium  
**Effort:** 1.5 weeks  

Expand the site operations capabilities introduced in M5/M10. Add real-time site performance analysis (Lighthouse integration), automated change deployment via SSH, and visual regression testing.

| Sub-feature | Description |
|-------------|-------------|
| Lighthouse integration | Performance, accessibility, SEO scores via API |
| SSH change deployment | Apply site changes directly via SSH from the platform |
| Visual regression | Before/after screenshots for every site change |
| Rollback mechanism | One-click rollback for deployed site changes |
| Multi-site management | Manage multiple client sites from one dashboard |

---

## Technical Debt to Address in M11

Based on M10 observations, the following technical debt items should be resolved in M11:

| Item | Impact | Effort |
|------|--------|--------|
| `product_templates` table lacks `project_id` | Medium | Low |
| `task_throughput` metric always empty | Low | Low |
| LLM rate limiting causes 5–15s response times | High | Medium |
| No request queuing for LLM calls | High | Medium |
| `discuss` mode system prompt still references M4 version | Low | Low |
| Chat API version still reports `0.4.0` / `M4` in health endpoint | Low | Low |
| No database connection pooling configuration | Medium | Low |

---

## M11 Timeline

| Week | Focus |
|------|-------|
| Week 1 | M11.1 LLM Intent Classifier + M11.7 Streaming Responses |
| Week 2 | M11.2 Multi-Agent Orchestration (core) |
| Week 3 | M11.2 Multi-Agent Orchestration (parallel execution) + M11.3 Self-Healing |
| Week 4 | M11.4 Advanced Memory + M11.5 Observability Dashboard |
| Week 5 | M11.6 Product Templates + M11.8 Site Operations |
| Week 6 | Integration testing, regression, documentation, acceptance |

**Estimated total effort:** 6 weeks  
**Target completion:** End of Q2 2026  

---

## Success Metrics for M11

M11 will be considered successful when the following metrics are achieved:

| Metric | Target |
|--------|--------|
| Intent classification accuracy | ≥ 95% on 100-message test set |
| Complex task completion time | ≤ 50% of M10 time (parallel agents) |
| Auto-recovery success rate | ≥ 80% of incidents resolved without operator |
| LLM response time (P95) | ≤ 5s (with streaming, perceived time ≤ 1s) |
| Regression test pass rate | 100% (maintained from M10) |
| Memory retrieval relevance | ≥ 80% relevant results in top-3 |

---

## Dependencies and Risks

**Dependency 1 — pgvector extension.** M11.4 (vector memory) requires the `pgvector` PostgreSQL extension. This needs to be installed on the production database before M11.4 development begins.

**Dependency 2 — OpenAI rate limits.** M11.1 and M11.2 significantly increase LLM API usage. A rate limit increase request should be submitted to OpenAI before M11 begins.

**Risk 1 — Multi-agent coordination complexity.** Parallel agent execution introduces race conditions and complex state management. Mitigation: implement a strict task state machine with database-backed state persistence.

**Risk 2 — Streaming SSE compatibility.** The current Nginx reverse proxy configuration may need adjustment to support SSE (disable buffering). This should be tested in staging before production deployment.

---

*M11 Roadmap — MKS IT Dev Platform | 09.03.2026*
