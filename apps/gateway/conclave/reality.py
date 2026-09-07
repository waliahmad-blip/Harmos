# -*- coding: utf-8 -*-
"""
Harmos 5-Agent Conclave: Agent 4 - Reality Checker (MLTA Layer 3)
Ground-truth database resolver that eliminates hallucinations by verifying against live records.
USPTO Patent #63/915,788
"""
from typing import Dict, Any, Tuple, List
import sqlite3


class RealityCheckerAgent:
    """Agent 4: Live Enterprise Reality Ground-Truth Resolver."""

    def __init__(self):
        self.agent_role = "Reality Checker (Ground-Truth Resolver)"

    def resolve(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        db_conn: sqlite3.Connection
    ) -> Tuple[int, str, Dict[str, Any]]:
        """
        Cross-references tool parameters against database records.
        Returns: (risk_score: int, status: str, trace: dict)
        Status can be 'VERIFIED', 'UNRESOLVED', or 'FAILED'.
        """
        risk_score = 0
        status = "VERIFIED"
        findings: List[str] = []
        cursor = db_conn.cursor()

        amount = float(parameters.get("amount", 0.0) or 0.0)

        # 1. E-Commerce Refunds Reality Check
        if tool_name == "issue_refund":
            order_id = str(parameters.get("order_id", "")).strip()
            cursor.execute("SELECT * FROM mock_erp_orders WHERE order_id = ?", (order_id,))
            order = cursor.fetchone()
            if not order:
                risk_score = 80
                status = "FAILED"
                findings.append(f"Entity Hallucination: Order #{order_id} does not exist in ERP database.")
            else:
                original_price = float(order["amount_usd"])
                if amount > original_price:
                    risk_score = 90
                    status = "FAILED"
                    findings.append(
                        f"Financial Invariant Breach: Requested refund ${amount:.2f} exceeds original order purchase total ${original_price:.2f}."
                    )
                else:
                    findings.append(f"Verified against Order #{order_id} (Paid: ${original_price:.2f}, Status: {order['status']}).")

        # 2. Treasury Wire / AP Reality Check
        elif tool_name in ["dispatch_wire", "charge_corporate_card"]:
            vendor_id = str(parameters.get("vendor_id", "")).strip()
            iban = str(parameters.get("iban", "")).strip()

            if vendor_id:
                cursor.execute("SELECT * FROM mock_erp_vendors WHERE vendor_id = ?", (vendor_id,))
                vendor = cursor.fetchone()
                if not vendor:
                    risk_score = 75
                    status = "FAILED"
                    findings.append(f"Unknown Vendor: Vendor ID '{vendor_id}' is not in authorized vendor registry.")
                else:
                    if iban and vendor["authorized_iban"] != iban:
                        risk_score = 95
                        status = "FAILED"
                        findings.append(
                            f"Fraud / Diversion Flag: Submitted IBAN '{iban}' does not match authorized IBAN '{vendor['authorized_iban']}' on file for {vendor['vendor_name']}."
                        )
                    else:
                        findings.append(f"Authorized vendor verified: {vendor['vendor_name']}.")

        trace = {
            "agent_role": self.agent_role,
            "status": status,
            "risk_score": risk_score,
            "findings": findings
        }
        return risk_score, status, trace
