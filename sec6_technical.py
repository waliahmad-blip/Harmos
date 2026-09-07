# -*- coding: utf-8 -*-
"""Section 6: Technical Architecture, Ingestion Gateway & Database Schemas"""

SEC6_TECHNICAL = """---

## 6. TECHNICAL ARCHITECTURE, INGESTION GATEWAY & DATABASE SCHEMAS

### 6.1 The Reverse Proxy Gateway Architecture
Harmos is designed for zero-friction enterprise adoption. Rather than requiring developers to rewrite their agent loops, developers simply point their existing SDKs (OpenAI, Anthropic, LangChain) to the Harmos gateway URL:

```
[Agent Application]
       │
       ▼ (Standard HTTPS POST / Tool Call)
https://gateway.harmos.ai/v1/proxy/openai/v1/chat/completions
       │
       ▼
[HARMOS INGESTION GATEWAY (<15ms FastPath)]
  ├── 1. Invariant & Spending Cap Evaluation
  ├── 2. 5-Agent Conclave Arbitration
  ├── 3. Reality Ground-Truth Cross-Check
  ├── 4. SQLite Persistence & Merkle Tree Insertion
  └── 5. NIST FIPS 204 ML-DSA-65 Lattice Signing
       │
       ▼ (If Approved)
[Target Execution API (e.g., Stripe, AWS, Datadog, Internal SQL)]
```

### 6.2 SQLite Persistence Schema
Receipts, policies, and audit events are stored locally in an append-only, high-performance SQLite database (`harmos.db`):

```sql
-- 1. Immutable Execution Receipts Table
CREATE TABLE execution_receipts (
    receipt_id TEXT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    agent_identifier TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    arguments_json TEXT NOT NULL,
    verdict TEXT CHECK(verdict IN ('APPROVED', 'PAUSED', 'HALTED')),
    confidence_score INTEGER NOT NULL,
    red_team_score INTEGER NOT NULL,
    compliance_score INTEGER NOT NULL,
    reality_check_score INTEGER NOT NULL,
    nonce TEXT UNIQUE NOT NULL,
    code_manifest_hash TEXT NOT NULL,
    merkle_leaf_hash TEXT NOT NULL,
    pqc_signature_hex TEXT NOT NULL
);

-- 2. Declarative Policy Invariants Table
CREATE TABLE policy_invariants (
    policy_id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    max_amount_usd REAL,
    allowed_endpoints TEXT,
    rate_limit_per_minute INTEGER DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 6.3 The Cryptographic Digital Execution Receipt Schema
Every verified execution produces a standardized, tamper-evident JSON receipt signed with NIST FIPS 204 ML-DSA-65:

```json
{
  "harmos_receipt_version": "1.0",
  "receipt_id": "rcpt_9821a7f04b2c",
  "timestamp": "2026-09-07T18:45:12Z",
  "agent_id": "agent_procurement_prod_04",
  "action": {
    "tool": "issue_refund",
    "parameters": { "order_id": "8812", "amount": 24.00 }
  },
  "conclave_verdict": {
    "status": "APPROVED",
    "confidence_score": 98,
    "red_team_risk": 2,
    "compliance_risk": 0,
    "reality_check_status": "VERIFIED"
  },
  "cryptographic_attestation": {
    "pqc_algorithm": "NIST FIPS 204 (ML-DSA-65 / Crystals-Dilithium)",
    "code_manifest_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "merkle_root": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "pqc_signature": "04dsa_8f9a2b...c31e9a"
  }
}
```
"""
