# -*- coding: utf-8 -*-
"""
Harmos 5-Agent Conclave Pipeline Orchestrator (MLTA Layer 3)
Coordinates all 5 conclave agents, Merkle ledger logging, and post-quantum receipt issuance.
USPTO Patent #63/915,788
"""
import os
import uuid
from typing import Dict, Any, Tuple

from packages.crypto_core import (
    MerkleTree,
    generate_code_manifest,
    PQCSigner,
    ExecutionReceipt,
    ConclaveVerdict
)
from apps.gateway.database import (
    get_db_connection,
    insert_receipt,
    insert_escrow_action,
    get_all_merkle_leaf_hashes
)
from .worker import WorkerAgent
from .red_team import RedTeamAgent
from .compliance import ComplianceAgent
from .reality import RealityCheckerAgent
from .arbiter import ArbiterAgent

# Global state
GLOBAL_MERKLE_TREE = MerkleTree()

# Deterministic key derivation using master seed (persisted across restarts)
SIGNER_SEED = os.environ.get("HARMOS_SIGNER_SEED", "harmos_sovereign_master_seed_uspto_63_915_788")
GATEWAY_SIGNER = PQCSigner(private_seed=SIGNER_SEED)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
GATEWAY_MANIFEST = generate_code_manifest(PROJECT_ROOT)

WORKER = WorkerAgent()
RED_TEAM = RedTeamAgent()
COMPLIANCE = ComplianceAgent()
REALITY = RealityCheckerAgent()
ARBITER = ArbiterAgent()


def rehydrate_merkle_tree():
    """Reconstructs the append-only Merkle ledger from persistent SQLite records upon startup."""
    leaf_hashes = get_all_merkle_leaf_hashes()
    if leaf_hashes:
        GLOBAL_MERKLE_TREE.leaves = list(leaf_hashes)
        GLOBAL_MERKLE_TREE._rebuild_tree()


def run_conclave(
    agent_id: str,
    tool_name: str,
    parameters: Dict[str, Any],
    raw_prompt: str = ""
) -> Tuple[ExecutionReceipt, Dict[str, Any]]:
    """
    Executes full 5-agent conclave arbitration pipeline.
    """
    conn = get_db_connection()

    # 1. Worker Agent
    sanitized_params, worker_trace = WORKER.evaluate(agent_id, tool_name, parameters, raw_prompt)

    # 2. Red Team Agent
    red_risk, red_trace = RED_TEAM.audit(raw_prompt, sanitized_params, tool_name)

    # 3. Compliance Agent
    compliance_risk, compliance_trace = COMPLIANCE.check_invariants(tool_name, sanitized_params, conn)

    # 4. Reality Checker Agent
    reality_risk, reality_status, reality_trace = REALITY.resolve(tool_name, sanitized_params, conn)

    # 5. Arbiter Agent
    verdict = ARBITER.adjudicate(
        red_risk=red_risk,
        compliance_risk=compliance_risk,
        reality_risk=reality_risk,
        reality_status=reality_status,
        red_notes=red_trace["findings"],
        compliance_notes=compliance_trace["violations"],
        reality_notes=reality_trace["findings"]
    )

    # Cryptographic Attestation & Merkle Flight Recording
    receipt_id = f"rcpt_{uuid.uuid4().hex[:12]}"
    action_dict = {"tool": tool_name, "parameters": sanitized_params}

    merkle_leaf_data = f"{receipt_id}:{agent_id}:{tool_name}:{verdict.status}:{verdict.confidence_score}"
    leaf_hash = GLOBAL_MERKLE_TREE.add_leaf(merkle_leaf_data)

    receipt = ExecutionReceipt.create_and_sign(
        receipt_id=receipt_id,
        agent_id=agent_id,
        action=action_dict,
        verdict=verdict,
        manifest_hash=GATEWAY_MANIFEST["root_manifest_hash"],
        merkle_root=GLOBAL_MERKLE_TREE.root,
        signer=GATEWAY_SIGNER
    )

    insert_receipt(receipt.to_dict(), receipt.to_json(), leaf_hash)

    # If action is PAUSED, automatically route to HITL Escrow Buffer
    if verdict.status == "PAUSED":
        escrow_id = f"esc_{uuid.uuid4().hex[:10]}"
        insert_escrow_action(
            escrow_id=escrow_id,
            receipt_id=receipt_id,
            agent_id=agent_id,
            tool_name=tool_name,
            parameters=sanitized_params,
            confidence_score=verdict.confidence_score,
            reasoning=verdict.reasoning
        )

    conn.close()

    full_trace = {
        "worker": worker_trace,
        "red_team": red_trace,
        "compliance": compliance_trace,
        "reality_checker": reality_trace,
        "arbiter": {
            "score": verdict.confidence_score,
            "verdict": verdict.status,
            "reasoning": verdict.reasoning
        }
    }

    return receipt, full_trace
