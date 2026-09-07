# -*- coding: utf-8 -*-
"""
Harmos Digital Execution Receipt (MLTA Layer 1)
Immutable, tamper-evident digital receipt schema and validation logic.
USPTO Patent #63/915,788
"""
import json
import hashlib
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict
from .signer import PQCSigner


@dataclass
class ConclaveVerdict:
    status: str  # 'APPROVED', 'PAUSED', 'HALTED'
    confidence_score: int  # 0 to 100
    red_team_risk: int  # 0 to 100
    compliance_risk: int  # 0 to 100
    reality_check_status: str  # 'VERIFIED', 'UNRESOLVED', 'FAILED'
    reasoning: str


@dataclass
class ExecutionReceipt:
    harmos_receipt_version: str
    receipt_id: str
    timestamp: str
    agent_id: str
    action: Dict[str, Any]
    conclave_verdict: Dict[str, Any]
    nonce: str
    cryptographic_attestation: Dict[str, str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    def compute_canonical_digest(self) -> str:
        """Computes deterministic SHA-256 hash of all receipt contents excluding attestation signature."""
        data_to_hash = {
            "version": self.harmos_receipt_version,
            "receipt_id": self.receipt_id,
            "timestamp": self.timestamp,
            "agent_id": self.agent_id,
            "action": self.action,
            "verdict": self.conclave_verdict,
            "nonce": self.nonce,
            "manifest_hash": self.cryptographic_attestation.get("code_manifest_hash", ""),
            "merkle_root": self.cryptographic_attestation.get("merkle_root", "")
        }
        canonical_str = json.dumps(data_to_hash, sort_keys=True)
        return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExecutionReceipt":
        return cls(
            harmos_receipt_version=data.get("harmos_receipt_version", "1.0"),
            receipt_id=data["receipt_id"],
            timestamp=data["timestamp"],
            agent_id=data["agent_id"],
            action=data["action"],
            conclave_verdict=data["conclave_verdict"],
            nonce=data["nonce"],
            cryptographic_attestation=data["cryptographic_attestation"]
        )

    def verify_integrity(self, signer: Optional[PQCSigner] = None, expected_manifest_hash: Optional[str] = None) -> Dict[str, Any]:
        """
        Validates internal digest, signature authenticity, and code manifest match.
        """
        digest = self.compute_canonical_digest()
        attestation = self.cryptographic_attestation
        sig = attestation.get("signature", "")
        pub_key = attestation.get("public_key", "")
        
        sig_valid = False
        if signer:
            sig_valid = signer.verify_signature(digest, sig, pub_key)
        else:
            sig_valid = PQCSigner.verify_signature_static(digest, sig, pub_key)

        manifest_valid = True
        if expected_manifest_hash:
            manifest_valid = (attestation.get("code_manifest_hash") == expected_manifest_hash)

        return {
            "valid": sig_valid and manifest_valid,
            "canonical_digest": digest,
            "signature_valid": sig_valid,
            "manifest_valid": manifest_valid,
            "receipt_id": self.receipt_id,
            "verdict": self.conclave_verdict.get("status")
        }

    @classmethod
    def create_and_sign(
        cls,
        receipt_id: str,
        agent_id: str,
        action: Dict[str, Any],
        verdict: ConclaveVerdict,
        manifest_hash: str,
        merkle_root: str,
        signer: PQCSigner
    ) -> "ExecutionReceipt":
        nonce = hashlib.sha256(f"{receipt_id}:{time.time_ns()}".encode("utf-8")).hexdigest()[:16]
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        # Provisional receipt structure
        receipt = cls(
            harmos_receipt_version="1.0",
            receipt_id=receipt_id,
            timestamp=timestamp,
            agent_id=agent_id,
            action=action,
            conclave_verdict=asdict(verdict),
            nonce=nonce,
            cryptographic_attestation={
                "pqc_algorithm": signer.algorithm,
                "code_manifest_hash": manifest_hash,
                "merkle_root": merkle_root,
                "public_key": signer.public_key_hex,
                "signature": ""
            }
        )

        # Compute digest and sign
        digest = receipt.compute_canonical_digest()
        sig_data = signer.sign_payload(digest)
        receipt.cryptographic_attestation["signature"] = sig_data["signature"]

        return receipt
