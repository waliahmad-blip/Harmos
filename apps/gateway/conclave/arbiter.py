# -*- coding: utf-8 -*-
"""
Harmos 5-Agent Conclave: Agent 5 - The Arbiter (MLTA Layer 3)
Adjudicates the conclave consensus using deterministic scoring and assigns final verdict.
USPTO Patent #63/915,788
"""
from typing import Dict, Any, List
from packages.crypto_core import ConclaveVerdict


class ArbiterAgent:
    """Agent 5: The Conclave Arbiter & Final Adjudicator."""

    def __init__(self):
        self.agent_role = "The Arbiter (Consensus Adjudicator)"

    def adjudicate(
        self,
        red_risk: int,
        compliance_risk: int,
        reality_risk: int,
        reality_status: str,
        red_notes: List[str],
        compliance_notes: List[str],
        reality_notes: List[str]
    ) -> ConclaveVerdict:
        """
        Applies deterministic mathematical scoring formula from USPTO Patent #63/915,788:
        H_vs = max(0, min(100, round(100 - (0.40 * Red + 0.40 * Comp + 0.20 * Real))))
        Capping at 50 if reality ground truth resolution fails.
        """
        raw_score = 100.0 - (0.40 * red_risk + 0.40 * compliance_risk + 0.20 * reality_risk)
        h_vs = int(round(raw_score))

        # Enforce reality ceiling
        if reality_status == "FAILED":
            h_vs = min(h_vs, 50)

        h_vs = max(0, min(100, h_vs))

        # Determine verdict status
        if h_vs >= 90:
            status = "APPROVED"
            reasoning = "All safety invariant and reality ground-truth verifications satisfied."
        elif h_vs >= 70:
            status = "PAUSED"
            all_reasons = compliance_notes + red_notes + reality_notes
            reasoning = f"Moderate policy limit reached ({'; '.join(all_reasons)}). Held in escrow buffer pending human authorization."
        else:
            status = "HALTED"
            all_reasons = red_notes + compliance_notes + reality_notes
            reasoning = f"Critical risk detected ({'; '.join(all_reasons)}). Execution halted."

        return ConclaveVerdict(
            status=status,
            confidence_score=h_vs,
            red_team_risk=red_risk,
            compliance_risk=compliance_risk,
            reality_check_status=reality_status,
            reasoning=reasoning
        )
