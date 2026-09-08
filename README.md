<div align="center">

# ⚡ HARMOS AI
### Sovereign Runtime Verification Firewall & Post-Quantum Execution Gateway for Autonomous AI Systems

[![USPTO Patent Pending](https://img.shields.io/badge/USPTO%20Patent-63%2F915%2C788-blue.svg?style=for-the-badge&logo=shield&color=00e5ff)](https://patents.google.com/)
[![Python 3.12](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776ab.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI Runtime](https://img.shields.io/badge/Gateway-FastAPI%20%7C%20Uvicorn-009688.svg?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PQC Post-Quantum](https://img.shields.io/badge/PQC-NIST%20FIPS%20204%20%2F%20ML--DSA--65-7928ca.svg?style=for-the-badge&logo=quantum&logoColor=white)](#-cryptographic-architecture--receipt-engine)
[![Audit Defense](https://img.shields.io/badge/Integrity-Append--Only%20Merkle%20Ledger-00ff88.svg?style=for-the-badge&logo=git&logoColor=white)](#-cryptographic-architecture--receipt-engine)
[![Responsive Cockpit HUD](https://img.shields.io/badge/Cockpit%20HUD-Mobile%20%7C%20Tablet%20%7C%20Desktop-ff007f.svg?style=for-the-badge&logo=html5&logoColor=white)](#-sovereign-cockpit-hud-responsive-interface)

<p align="center">
  <b>Harmos intercepts autonomous AI agent tool calls before execution, subjects them to a 5-Agent Sovereign Deliberation Conclave, validates invariants against live database ground truth, and issues zero-trust, post-quantum cryptographic receipts.</b>
</p>

[Quickstart](#-quickstart--1-click-launch) • [Architecture](#-monorepo-architecture) • [Conclave Protocol](#-the-5-agent-sovereign-conclave) • [Cryptographic Verifier](#-cryptographic-architecture--receipt-engine) • [API Reference](#-api-specification) • [Patent](#-uspto-patent-grounding)

---

</div>

## 📌 Executive Overview

Autonomous AI agents (powered by LangChain, LangGraph, CrewAI, AutoGen, or OpenAI Swarm) are inherently **probabilistic and non-deterministic**. When deployed in enterprise environments, an unconstrained agent can execute irreversible actions: initiating unauthorized wire transfers, dropping database tables, exfiltrating credentials via indirect prompt injection, or violating compliance regulations.

**Harmos AI** solves this critical enterprise trust gap. Positioned as an inline, sub-15ms reverse-proxy gateway, Harmos enforces a **Multi-Layered Trust Architecture (MLTA)**:

```
[Agent Framework] (LangGraph / CrewAI / AutoGen / Swarm)
       │
       ▼ (Proposes Tool Call via HTTPS POST)
┌────────────────────────────────────────────────────────────────────────┐
│                   HARMOS SOVEREIGN VERIFICATION GATEWAY                │
│                                                                        │
│   [1. Worker]    ──► [2. Red Team] ──► [3. Compliance]                 │
│   (Normalizer)      (Injection Audit)   (Invariant Check)              │
│                            │                                           │
│                            ▼                                           │
│   [4. Reality Checker] ────────────────► [5. The Arbiter]              │
│   (Live ERP Ground-Truth)                (Mathematical Consensus)      │
│                                                   │                    │
│                                    ┌──────────────┴──────────────┐     │
│                                    ▼                             ▼     │
│                              [APPROVED]                  [PAUSED / HALTED]
│                       (NIST PQC Lattice Signed)         (Escrow HITL / Abort)
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼ (Execution Permitted)
[Enterprise Target] (Stripe, AWS CLI, Database SQL, Treasury Rails)
```

---

## 🏛️ The 5-Agent Sovereign Conclave

Every intercepted tool execution payload is independently analyzed by five specialized sovereign modules before state mutation can occur:

```
  ┌───────────────────────────────────────────────────────────────────────────┐
  │                        THE CONCLAVE PIPELINE                              │
  └───────────────────────────────────────────────────────────────────────────┘
   1. WORKER AGENT       Normalizes arguments, sanitizes Unicode, decodes
                         nested Base64, and extracts parameter semantics.
            │
            ▼
   2. RED TEAM AGENT     Audits for prompt injections, SSRF probes, jailbreaks,
                         unauthorized bash commands, and adversarial escapes.
            │
            ▼
   3. COMPLIANCE AGENT   Validates enterprise spending caps, transaction velocity,
                         domain-specific regulatory bounds, and IBAN whitelists.
            │
            ▼
   4. REALITY CHECKER    Queries live relational state (ERP, orders, balances)
                         to confirm facts: Does order exist? Does balance cover it?
            │
            ▼
   5. THE ARBITER        Computes the weighted consensus equation, adjudicates
                         verdict, pins the software manifest, and signs the receipt.
```

### 🧮 Mathematical Adjudication Equation

The Arbiter synthesizes the five deliberation outputs into a unified sovereign confidence score ($S_{\\text{final}} \\in [0, 100]$):

$$S_{\\text{final}} = 0.35 \\cdot C_{\\text{base}} + 0.35 \\cdot (100 - R_{\\text{red}}) + 0.15 \\cdot (100 - R_{\\text{comp}}) + 0.15 \\cdot R_{\\text{real}}$$

Where:
- $C_{\\text{base}}$: Base proposal confidence from the Worker ($[0, 100]$).
- $R_{\\text{red}}$: Adversarial risk evaluated by the Red Team ($0 = \\text{clean}, 100 = \\text{malicious}$).
- $R_{\\text{comp}}$: Invariant violation risk calculated by Compliance ($0 = \\text{compliant}, 100 = \\text{breach}$).
- $R_{\\text{real}}$: Empirical ground-truth verification score from the Reality Checker ($100 = \\text{verified}, 0 = \\text{refuted}$).

### ⚖️ Sovereign Verdict State Machine

| Score Range | Verdict | Action Taken |
| :--- | :--- | :--- |
| **$S_{\\text{final}} \\ge 70$** | `APPROVED` | PQC-signed execution receipt minted; tool call released to target infrastructure. |
| **$40 \\le S_{\\text{final}} < 70$** | `PAUSED` | Execution frozen; payload placed in **Human-In-The-Loop (HITL) Escrow Buffer** awaiting human sign-off. |
| **$S_{\\text{final}} < 40$** | `HALTED` | Execution immediately blocked; cryptographic incident logged to Merkle Flight Recorder. |

---

## 🔐 Cryptographic Architecture & Receipt Engine

Harmos eliminates blind trust. Every verified action generates an immutable `.harmos` execution receipt containing:

```json
{
  "receipt_id": "rcpt_6a7f82b1c09e4d5a",
  "timestamp": "2026-09-08T03:30:15.124Z",
  "agent_id": "agent-finance-treasury-01",
  "tool_name": "execute_wire_transfer",
  "arguments_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "verdict": "APPROVED",
  "confidence_score": 94,
  "nonce": "a5c2f9d1e4b83742",
  "code_manifest_hash": "c9284fae7102b415a7b8e19c3d4f5601289abcde76543210fedcba9876543210",
  "merkle_leaf_hash": "5d41402abc4b2a76b9719d911017c592",
  "pqc_signature_hex": "30450221008e92...f7a2022026c4...b9"
}
```

### Core Cryptographic Invariants

1. **Post-Quantum Lattice Signatures:** Dual-scheme architecture supporting **NIST FIPS 204 ML-DSA-65** lattice signatures and high-speed **Ed25519-SHA3** fallback envelopes.
2. **Deterministic Code Manifest:** Every receipt pins the exact SHA-256 tree hash of the gateway codebase. If a single line of backend logic is tampered with, all subsequent receipts fail verification.
3. **Append-Only Merkle Tree:** All execution receipts are hashed as Merkle leaves. Any third party can independently verify inclusion proofs in $O(\\log N)$ time.
4. **Adversarial Tamper Playground:** The Cockpit includes an interactive cryptographic audit sandbox to simulate parameter manipulation, nonce replay attacks, signature bit-flips, and manifest spoofing.

---

## 🖥️ Sovereign Cockpit HUD (Responsive Interface)

The Harmos Command Cockpit (`apps/web`) is a dependency-free, zero-build HTML5/CSS3/Vanilla JS interface engineered with obsidian cybernetic aesthetics and full mobile/tablet responsiveness:

```
┌────────────────────────────────────────────────────────────────────────┐
│  ⚡ HARMOS // SOVEREIGN AGENT VERIFICATION COCKPIT    [USPTO 63/915,788]│
│  [● LIVE GATEWAY] [🛡️ 5-AGENT CONCLAVE] [AUDIO: ON] [GUIDED TOUR]       │
├────────────────────────────────────────────────────────────────────────┤
│  [ ⚡ Cockpit ]  [ 📜 Flight Recorder ]  [ 🛡️ Verifier ]  [ ⏸️ Escrow ] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │ WORKER   │──►│ RED TEAM │──►│COMPLIANCE│──►│ REALITY  │──►│ ARBITER  │ │
│  │  95% OK  │   │  0% RISK │   │  0% RISK │   │ 100% OK  │   │ 94/100   │ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                                                        │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │ ACTION DISPATCHER (10 PRESETS)│  │ CRYPTOGRAPHIC RECEIPT AUDIT    │ │
│  │ Target: Stripe / Travel / SQL │  │ PQC Signature Verified: VALID  │ │
│  │ [DISPATCH FOR CONCLAVE AUDIT] │  │ Merkle Leaf: 5d41402abc4b...   │ │
│  └───────────────────────────────┘  └────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Operational Panels

- **⚡ Conclave Cockpit:** Live 5-node circuit visualizer with dynamic SVG laser conduits, canvas-based audio synthesis, 10 enterprise presets, and 1-click execution dispatch.
- **📜 Flight Recorder:** Real-time append-only Merkle receipt ledger with status filtering (`APPROVED`, `PAUSED`, `HALTED`), live auto-refresh polling, and instant CSV export.
- **🛡️ Cryptographic Verifier:** Standalone zero-trust receipt inspector. Paste any `.harmos` receipt JSON to verify signature, manifest hash, and Merkle leaf without needing server state.
- **🧪 Tamper Playground:** Interactive audit lab demonstrating mathematical failure upon altering payloads, nonces, signatures, or manifest hashes.
- **⏸️ HITL Escrow Buffer:** Human-in-the-Loop approval queue for paused actions requiring multi-signature authorization or human override.
- **📖 Mission Manual:** Built-in technical documentation, patent architecture disclosure, threat taxonomy, and integration guides.

### Mobile & Tablet Adaptive Engineering

- **Fluid Breakpoints:** Tested and styled across $\\le 380\\text{px}$, $\\le 640\\text{px}$, and $\\le 900\\text{px}$ viewports.
- **Vertical Pipeline Stacking:** The 5-agent horizontal circuit gracefully transitions to an interactive vertical stacked pipeline on smartphones.
- **Touch Ergonomics:** Disabled 3D pointer-tilt physics on touchscreens to ensure smooth 60fps momentum scrolling without gesture conflicts.
- **Native Horizontal Tab Bars:** Navigation tabs, flight recorder filter pills, and manual chapters feature frictionless horizontal swipe gestures.

---

## 📂 Monorepo Architecture

```
Harmos/
├── apps/
│   ├── gateway/                  # FastAPI Ingestion Proxy (<15ms latency)
│   │   ├── conclave/             # Modular 5-Agent Conclave Package
│   │   │   ├── worker.py         # Agent 1: Proposer & Normalizer
│   │   │   ├── red_team.py       # Agent 2: Adversarial & Injection Auditor
│   │   │   ├── compliance.py     # Agent 3: Invariant & Spending Cap Enforcer
│   │   │   ├── reality.py        # Agent 4: Live Relational Ground-Truth Resolver
│   │   │   ├── arbiter.py        # Agent 5: Mathematical Adjudicator & Verdict
│   │   │   └── pipeline.py       # Pipeline Orchestration & Ledger Logging
│   │   ├── database.py           # SQLite persistence (WAL mode, receipts, escrow, ERP mock)
│   │   ├── main.py               # ASGI reverse-proxy middleware & REST endpoints
│   │   └── tests/test_gateway.py # End-to-end integration tests (15 test suites)
│   └── web/                      # Sovereign Command Cockpit (Obsidian Theme)
│       ├── index.html            # 5-Tab Responsive Cockpit HUD
│       ├── app.js                # HUD controller, audio engine, gateway connector
│       ├── style.css             # Cybernetic glassmorphic styles with responsive media queries
│       └── assets/               # Three.js libraries, GLSL shaders, and brand assets
├── packages/
│   └── crypto_core/              # Post-Quantum Cryptography & Merkle Ledger
│       ├── merkle.py             # Append-only Merkle tree & inclusion proofs
│       ├── manifest.py           # Deterministic SHA-256 software code manifest
│       ├── signer.py             # NIST FIPS 204 ML-DSA-65 & Ed25519-SHA3 signatures
│       ├── receipt.py            # Digital receipt schema & standalone integrity verifier
│       └── tests/test_crypto.py  # Cryptographic test suites (Merkle, Manifest, Signer)
├── .github/
│   └── workflows/ci.yml          # GitHub Actions automated CI matrix
├── Dockerfile                    # Unprivileged Python 3.12 production container
├── docker-compose.yml            # Multi-service gateway + HUD container configuration
├── launch.bat                    # 1-Click Windows execution launcher
├── launch.ps1                    # 1-Click PowerShell execution launcher
├── requirements.txt              # Production dependency specifications
├── .env.example                  # Environment configuration template
└── README.md                     # Master technical specification
```

---

## 🚀 Quickstart & 1-Click Launch

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- Git

### 1. Clone & Install

```bash
git clone https://github.com/waliahmad-blip/Harmos.git
cd Harmos

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\\venv\\Scripts\\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Verification Tests

```bash
# Run all gateway and conclave integration tests
python -m unittest discover -s apps/gateway/tests

# Run all cryptographic and Merkle ledger tests
python -m unittest discover -s packages/crypto_core/tests
```
*(All 18 test suites pass in $<0.4$ seconds)*

### 3. Launch with 1 Click

#### On Windows:
Double-click `launch.bat` or run:
```powershell
.\\launch.ps1
```

#### On Linux / macOS / Manual:
```bash
python -m apps.gateway.main
```

### 4. Access the Cockpit HUD
Open your browser to:
```
http://127.0.0.1:8002
```
- The FastAPI gateway automatically hosts the backend REST API and statically serves the Command Cockpit HUD from the root URL.
- Live API documentation is available at `http://127.0.0.1:8002/docs`.

### 5. Running via Docker

```bash
docker compose up --build
```

---

## 📡 API Specification

The Harmos Gateway exposes high-throughput, low-latency REST endpoints:

### Core Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/verify` | Intercept and verify an agent action through the 5-Agent Conclave. |
| `GET` | `/api/receipts` | Retrieve append-only execution receipt ledger (supports pagination). |
| `GET` | `/api/escrow` | List all actions paused in the Human-in-the-Loop review queue. |
| `POST` | `/api/escrow/{id}/resolve` | Resolve an escrowed action (`APPROVED` or `REJECTED`). |
| `GET` | `/api/stats` | Gateway performance metrics (approval rates, latency, Conclave status). |
| `GET` | `/api/manifest` | Retrieve deterministic SHA-256 software code manifest hash. |
| `GET` | `/healthz` | Kubernetes liveness and readiness probe with database health check. |

### Example Verification Request

```bash
curl -X POST http://127.0.0.1:8002/api/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "agent-finance-01",
    "tool_name": "process_refund",
    "parameters": {
      "order_id": "8812",
      "amount": 24.00,
      "reason": "Customer received defective item"
    }
  }'
```

### Example Verification Response

```json
{
  "receipt_id": "rcpt_9f14b628d01a4e7c",
  "verdict": "APPROVED",
  "confidence_score": 96,
  "deliberation": {
    "worker": { "confidence": 95, "sanitized_params": { "order_id": "8812", "amount": 24.0 } },
    "red_team": { "risk_score": 0, "findings": [] },
    "compliance": { "risk_score": 0, "violations": [] },
    "reality": { "ground_truth_score": 100, "verified_facts": { "order_exists": true, "max_refundable": 24.0 } },
    "arbiter": { "final_score": 96, "decision": "APPROVED" }
  },
  "receipt": {
    "receipt_id": "rcpt_9f14b628d01a4e7c",
    "nonce": "7c12f49b81a02d4e",
    "code_manifest_hash": "a4b2c1d3e5f6...",
    "merkle_leaf_hash": "1e2f3a4b5c6d...",
    "pqc_signature_hex": "3045022100a1...20c3"
  }
}
```

---

## 🛡️ Enterprise Hardening & Defensive Invariants

| Security Dimension | Implementation & Hardening | Invariant Guarantee |
| :--- | :--- | :--- |
| **PQC Resistance** | Dual Ed25519-SHA3 + NIST FIPS 204 ML-DSA-65 envelope | Safe against quantum Grover and Shor algorithmic attacks. |
| **Merkle Persistence** | SQLite WAL mode with automatic startup leaf rehydration | Append-only ledger audit trail survives process crashes and restarts. |
| **Prompt Injection Defense** | Unicode NFKC normalization, recursive Base64 unpacking, and semantic token boundary checks | Thwarts indirect injection, character-smuggling, and adversarial jailbreaks. |
| **Zero Blind Trust** | Deterministic SHA-256 codebase tree manifest | Receipts are tied to the exact source code version; tampering invalidates all proofs. |
| **Stateful Ground Truth** | Relational reality checking against ERP tables before release | Prevents over-refunds, hallucinated vendor IDs, and negative balance executions. |
| **Escrow Circuit Breaker** | Indeterminate actions ($40 \\le S < 70$) quarantined in escrow | Zero automated damage on edge cases; requires human cryptographic sign-off. |

---

## 📜 USPTO Patent Grounding

This technology is grounded in proprietary sovereign architecture and protected under filings with the United States Patent and Trademark Office:

- **USPTO Patent Application Number:** `63/915,788`
- **Filing Date:** 2026
- **Title of Invention:** *System and Method for a Verifiable, Sovereign Artificial Intelligence Ecosystem with a Multi-Layered Trust Architecture and Deep Behavioral Alignment*
- **Inventor & Principal Architect:** Mian Ahmad Umair Wali Ullah (Wali Ahmad)
- **Filing Confirmation Number:** `5773`
- **Patent Center Electronic Reference:** `73142303`

*All implementation rights, architectural formulations, and algorithmic trade secrets are reserved under applicable international and United States patent conventions.*

---

## 👨‍💻 Author & Principal Architect

**Wali Ahmad**  
Founder & Principal Sovereign Architect  
GitHub: [@waliahmad-blip](https://github.com/waliahmad-blip)  
Repository: [waliahmad-blip/Harmos](https://github.com/waliahmad-blip/Harmos)

---

<div align="center">
  <sub>Harmos AI • Autonomous Agent Verification Cockpit • September 2026</sub>
</div>
