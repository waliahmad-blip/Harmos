# -*- coding: utf-8 -*-
"""
Harmos 5-Agent Conclave: Agent 1 - The Worker (MLTA Layer 3)
Receives intercepted intent, normalizes parameters, and formats tool call execution payload.
USPTO Patent #63/915,788
"""
from typing import Dict, Any, Tuple


class WorkerAgent:
    """Agent 1: Worker Proposer and Parameter Normalizer."""

    def __init__(self):
        self.agent_role = "Worker (Payload Proposer)"

    def evaluate(
        self,
        agent_id: str,
        tool_name: str,
        parameters: Dict[str, Any],
        raw_prompt: str = ""
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Normalizes and sanitizes tool parameters and returns standardized payload and trace.
        """
        sanitized_params = dict(parameters)
        
        # Ensure numerical casting if passed as string
        if "amount" in sanitized_params:
            try:
                sanitized_params["amount"] = float(sanitized_params["amount"])
            except (ValueError, TypeError):
                sanitized_params["amount"] = 0.0

        trace = {
            "agent_role": self.agent_role,
            "status": "PROPOSED",
            "agent_id": agent_id,
            "tool_name": tool_name,
            "parameters": sanitized_params,
            "raw_prompt_length": len(raw_prompt)
        }
        return sanitized_params, trace
