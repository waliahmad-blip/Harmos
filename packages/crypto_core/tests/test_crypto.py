# -*- coding: utf-8 -*-
"""Unit tests for Harmos Crypto Core"""
import sys
import os
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
from packages.crypto_core import (
    MerkleTree,
    verify_merkle_proof,
    generate_code_manifest,
    PQCSigner,
    ExecutionReceipt,
    ConclaveVerdict
)


class TestHarmosCryptoCore(unittest.TestCase):

    def test_merkle_tree_proofs(self):
        tree = MerkleTree()
        data_items = ["tx_01", "tx_02", "tx_03", "tx_04"]
        hashes = [tree.add_leaf(item) for item in data_items]

        self.assertIsNotNone(tree.root)
        self.assertEqual(len(tree.leaves), 4)

        # Verify inclusion proof for leaf 2 ("tx_03")
        proof = tree.get_proof(2)
        is_valid = verify_merkle_proof(hashes[2], proof, tree.root)
        self.assertTrue(is_valid)

    def test_code_manifest(self):
        manifest = generate_code_manifest(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
        self.assertIn("root_manifest_hash", manifest)
        self.assertGreater(len(manifest["root_manifest_hash"]), 0)
        self.assertGreaterEqual(manifest["files_analyzed_count"], 3)

    def test_pqc_signer_and_receipt(self):
        signer = PQCSigner()
        verdict = ConclaveVerdict(
            status="APPROVED",
            confidence_score=95,
            red_team_risk=5,
            compliance_risk=0,
            reality_check_status="VERIFIED",
            reasoning="All checks passed."
        )

        receipt = ExecutionReceipt.create_and_sign(
            receipt_id="rcpt_test_001",
            agent_id="agent_alpha",
            action={"tool": "issue_refund", "amount": 25.0},
            verdict=verdict,
            manifest_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            merkle_root="7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
            signer=signer
        )

        self.assertEqual(receipt.conclave_verdict["status"], "APPROVED")
        self.assertTrue(receipt.cryptographic_attestation["signature"].startswith("04mldsa_"))
        
        # Test signature verification via instance
        digest = receipt.compute_canonical_digest()
        sig = receipt.cryptographic_attestation["signature"]
        pub = receipt.cryptographic_attestation["public_key"]
        self.assertTrue(signer.verify_signature(digest, sig, pub))

        # Test zero-trust static verification (requires NO private key or signer instance)
        self.assertTrue(PQCSigner.verify_signature_static(digest, sig, pub))

        # Test verification fails if payload or signature is tampered
        self.assertFalse(PQCSigner.verify_signature_static(digest + "tamper", sig, pub))
        self.assertFalse(PQCSigner.verify_signature_static(digest, sig[:-4] + "ffff", pub))

        # Test ExecutionReceipt.verify_integrity without passing a signer
        integrity = receipt.verify_integrity()
        self.assertTrue(integrity["valid"])
        self.assertTrue(integrity["signature_valid"])


if __name__ == "__main__":
    unittest.main()
