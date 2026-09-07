# -*- coding: utf-8 -*-
"""Section 3: The 5-Agent Verification Pipeline (Conclave Mechanics)"""

SEC3_CONCLAVE = """---

## 3. THE 5-AGENT VERIFICATION PIPELINE (DEEP-DIVE MECHANICS)

The operational heart of Harmos is the **5-Agent Verification Conclave**. Rather than trusting a single LLM to execute and self-evaluate its own actions, Harmos enforces a strict separation of operational concerns across five specialized roles:

```
                     ┌────────────────────────────────────────┐
                     │             1. THE WORKER              │
                     │  Drafts & proposes tool execution      │
                     │  (e.g., database query, payment, API)  │
                     └───────────────────┬────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────┐               ┌─────────────────┐              ┌───────────────────┐
│  2. RED TEAM  │               │  3. COMPLIANCE  │              │ 4. REALITY CHECK  │
│  Probes for   │               │  Enforces caps, │              │ Queries database: │
│  injections,  │               │  whitelists, &  │              │ do accounts, IDs, │
│  exploits, &  │               │  rate limits.   │              │ & files exist?    │
│  backdoors.   │               │                 │              │                   │
└───────┬───────┘               └────────┬────────┘              └─────────┬─────────┘
        │                                │                                 │
        └────────────────────────────────┼─────────────────────────────────┘
                                         ▼
                     ┌────────────────────────────────────────┐
                     │             5. THE ARBITER             │
                     │  Synthesizes reports, calculates       │
                     │  Harmos Verification Score (Hvs), &    │
                     │  renders final verdict:                │
                     │  [APPROVE]  /  [PAUSE]  /  [HALT]      │
                     └───────────────────┬────────────────────┘
                                         │
                                         ▼
                     ┌────────────────────────────────────────┐
                     │        IMMUTABLE DIGITAL RECEIPT       │
                     │  Signed with NIST ML-DSA & saved to DB │
                     └────────────────────────────────────────┘
```

### 3.1 Agent Specifications & Responsibilities

#### Agent 1: The Worker Agent (The Task Proposer)
- **Primary Function:** Ingests the initial operational objective, decomposes the goal into an execution plan, and structures the proposed tool-calling payload.
- **Cognitive Profile:** Task optimization, parameter structuring, and API schema compliance.
- **Proposed Payload Output:** Standardized JSON structure:
  ```json
  {
    "tool_name": "transfer_corporate_funds",
    "target_endpoint": "https://api.treasury.corp/v1/wires",
    "arguments": {
      "beneficiary_id": "VEND-88412",
      "amount": 14500.00,
      "currency": "USD",
      "invoice_ref": "INV-2026-0901"
    },
    "reasoning_summary": "Fulfilling approved vendor invoice INV-2026-0901."
  }
  ```

#### Agent 2: The Red Team Agent (The Adversarial Auditor)
- **Primary Function:** Acts as an aggressive offensive security researcher operating under zero-trust assumptions. It inspects user prompts, third-party documents, and tool arguments to detect:
  - Direct and indirect prompt injection attempts.
  - Hidden jailbreak delimiters (`SYSTEM OVERRIDE`, `IGNORE ALL INSTRUCTIONS`).
  - Privilege escalation attempts (e.g., parameter tampering like `role: "superuser"`).
  - Data exfiltration payloads concealed within memo or comment fields.
- **Output:** `exploit_detected` (boolean), `threat_vector` (string), `risk_score` (0–100), `detailed_vulnerability_log`.

#### Agent 3: The Compliance Agent (The Policy & Invariant Enforcer)
- **Primary Function:** Enforces deterministic mathematical constraints and corporate policies:
  - Hard single-transaction spending caps (e.g., `amount <= $1,000.00`).
  - Destination account, domain, and IP address whitelists.
  - Approved API endpoint and tool registries.
  - Rolling velocity limits (e.g., maximum 10 actions or $5,000 total volume per rolling hour).
- **Output:** `policy_passed` (boolean), `rule_violations` (array of strings), `budget_impact_usd`.

#### Agent 4: The Reality Checker (The Ground-Truth Resolver)
- **Primary Function:** Eliminates hallucinations by verifying that entities mentioned in the tool payload actually exist in the production database:
  - Does `customer_id` exist in the CRM database?
  - Does the paying account possess sufficient cleared balance to settle the wire?
  - Does the target cloud resource or file path physically exist on the infrastructure?
- **Output:** `entities_verified` (boolean), `unresolved_identifiers` (array of strings), `ground_truth_status`.

#### Agent 5: The Arbiter Agent (The Final Adjudicator)
- **Primary Function:** Ingests the evaluations from the Red Team, Compliance Agent, and Reality Checker. It executes a deterministic scoring formula:
  `Harmos Verification Score (Hvs) = 100 - (0.40 * RedRisk + 0.40 * ComplianceRisk + 0.20 * RealityRisk)`
- **Decision Matrix:**
  - **APPROVED (`Hvs >= 90`):** Action is signed with post-quantum cryptography, stored in the Merkle flight recorder, and released to the target API.
  - **PAUSED (`70 <= Hvs < 90`):** Execution is temporarily held in an escrow buffer; a push alert is dispatched to the dashboard for 1-click human confirmation.
  - **HALTED (`Hvs < 70`):** Execution is terminated immediately, an immutable security incident receipt is written to the audit log, and the agent's session is locked.
"""
