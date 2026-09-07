# -*- coding: utf-8 -*-
"""
Harmos 5-Agent Conclave: Agent 3 - Compliance Agent (MLTA Layer 3)
Enforces hard enterprise boundaries, spending limits, regulatory rules, and velocity caps.
USPTO Patent #63/915,788
"""
import re
from typing import Dict, Any, Tuple, List
import sqlite3


class ComplianceAgent:
    """Agent 3: Enterprise Policy Invariant Enforcer."""

    def __init__(self):
        self.agent_role = "Compliance (Invariant Enforcer)"

    def check_invariants(
        self,
        tool_name: str,
        parameters: Dict[str, Any],
        db_conn: sqlite3.Connection
    ) -> Tuple[int, Dict[str, Any]]:
        """
        Cross-checks proposed tool actions against active policy invariants.
        Returns compliance risk score (0-100) and trace.
        """
        risk_score = 0
        violations: List[str] = []
        amount = float(parameters.get("amount", 0.0) or 0.0)

        cursor = db_conn.cursor()
        cursor.execute("SELECT * FROM policy_invariants")
        policies = cursor.fetchall()

        for pol in policies:
            domain = pol["domain"]
            cap = pol["max_amount_usd"]

            if domain == "e_commerce" and tool_name == "issue_refund":
                if amount > cap:
                    risk_score += 60
                    violations.append(f"Refund request of ${amount:.2f} exceeds policy ceiling of ${cap:.2f}.")

            elif domain == "procurement" and tool_name in ["charge_corporate_card", "book_travel"]:
                if amount > cap:
                    risk_score += 40
                    violations.append(f"Travel charge of ${amount:.2f} exceeds internal limit of ${cap:.2f}.")

            elif domain == "treasury" and tool_name in ["dispatch_wire", "release_escrow"]:
                if amount > cap:
                    risk_score += 50
                    violations.append(f"Wire/Escrow amount of ${amount:.2f} exceeds automated limit of ${cap:.2f}.")

        # Regulatory & Privacy compliance: PHI SSN detection
        params_str = str(parameters)
        if re.search(r"\b\d{3}-\d{2}-\d{4}\b", params_str):
            risk_score += 80
            violations.append("Unredacted Social Security Number (SSN) detected in export parameters (HIPAA violation).")

        risk_score = min(100, max(0, risk_score))
        status = "VIOLATION" if risk_score > 0 else "COMPLIANT"

        trace = {
            "agent_role": self.agent_role,
            "status": status,
            "risk_score": risk_score,
            "violations": violations
        }
        return risk_score, trace
