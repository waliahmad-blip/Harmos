# -*- coding: utf-8 -*-
"""
Harmos 5-Agent Conclave: Agent 2 - Red Team (MLTA Layer 3)
Adversarial auditor scanning for prompt injections, jailbreaks, destructive commands,
obfuscations (Base64, URL encoding, Unicode homoglyphs), and evasions.
USPTO Patent #63/915,788
"""
import re
import base64
import urllib.parse
import unicodedata
from typing import Dict, Any, Tuple, List


class RedTeamAgent:
    """Agent 2: Adversarial Security & Injection Auditor."""

    INJECTION_PATTERNS = [
        (r"ignore\s+(all\s+)?(previous|prior)\s+instructions", 80, "Direct prompt injection attempt"),
        (r"system\s*override", 80, "System override assertion"),
        (r"bypass\s+(security|auth|checks)", 80, "Security bypass request"),
        (r"drop\s+(table|database|column)", 85, "Destructive SQL operation"),
        (r"alter\s+table.*drop\s+column", 85, "Schema truncation / column drop"),
        (r"delete\s+from\b", 75, "Bulk SQL deletion"),
        (r"<script.*?>", 75, "Cross-site scripting attempt"),
        (r"role\s*:\s*admin|sudo\b", 60, "Privilege escalation phrase"),
        (r"skip_snapshot\s*:\s*true", 75, "Snapshot bypass on production deletion"),
        (r"bypass_checks\s*:\s*true", 75, "CI/CD check bypass attempt"),
        (r"dan\s*mode|developer\s*mode\s*enabled|jailbreak", 80, "Jailbreak persona adoption"),
        (r"reveal\s+(the\s+)?(system|internal)\s+prompt|repeat\s+the\s+words\s+above", 60, "System prompt extraction probe"),
        (r"169\.254\.169\.254|metadata\.google\.internal", 85, "Cloud instance metadata SSRF probe"),
        (r"webhook\.site|burpcollaborator|ngrok\.io|interact\.sh", 80, "Out-of-band exfiltration endpoint"),
        (r"\b(eval|exec|os\.system|subprocess\.Popen)\s*\(", 85, "Arbitrary code execution primitive")
    ]

    def __init__(self):
        self.agent_role = "Red Team (Adversarial Auditor)"

    @staticmethod
    def normalize_text(text: str) -> str:
        """
        De-obfuscates text by applying Unicode NFKC normalization, URL unquoting,
        and stripping zero-width non-printable characters.
        """
        if not text:
            return ""
        # 1. URL unquote (multiple passes for double-encoding)
        unquoted = urllib.parse.unquote(urllib.parse.unquote(text))
        # 2. Unicode normalization (NFKC decomposes homoglyphs & fullwidth)
        normalized = unicodedata.normalize("NFKC", unquoted)
        # 3. Strip zero-width and invisible formatting characters
        cleaned = re.sub(r"[\u200B-\u200D\uFEFF\u00A0\u2060]", " ", normalized)
        return cleaned

    @staticmethod
    def extract_and_decode_base64(text: str) -> List[str]:
        """Scans for potential Base64 strings and attempts safe decoding."""
        decoded_tokens = []
        candidates = re.findall(r"[A-Za-z0-9+/]{12,}={0,2}", text)
        for cand in candidates:
            try:
                pad_needed = (-len(cand)) % 4
                padded = cand + ("=" * pad_needed)
                decoded_bytes = base64.b64decode(padded)
                decoded_str = decoded_bytes.decode("utf-8", errors="ignore")
                if len(decoded_str) >= 4 and any(c.isalpha() for c in decoded_str):
                    decoded_tokens.append(decoded_str)
            except Exception:
                continue
        return decoded_tokens

    def audit(
        self,
        raw_prompt: str,
        parameters: Dict[str, Any],
        tool_name: str
    ) -> Tuple[int, Dict[str, Any]]:
        """
        De-obfuscates and scans raw prompts and serialized parameters for adversarial vectors.
        Returns risk score (0-100) and detailed audit trace.
        """
        risk_score = 0
        findings: List[str] = []

        # 1. Normalize input stream
        raw_combined = f"{raw_prompt} {str(parameters)} {tool_name}"
        normalized_text = self.normalize_text(raw_combined).lower()

        # 2. Base64 payload inspection
        decoded_payloads = self.extract_and_decode_base64(raw_combined)
        search_corpora = [normalized_text]
        for dec in decoded_payloads:
            search_corpora.append(self.normalize_text(dec).lower())

        # 3. Scan regex patterns across raw, normalized, and decoded payloads
        for pattern, weight, desc in self.INJECTION_PATTERNS:
            for corpus in search_corpora:
                if re.search(pattern, corpus, re.IGNORECASE):
                    risk_score += weight
                    matched_in_b64 = " (inside Base64 payload)" if corpus != normalized_text else ""
                    findings.append(f"{desc} [pattern: '{pattern}']{matched_in_b64}")
                    break

        # 4. Spaced/leetspeak obfuscation check (e.g. "s y s t e m   o v e r r i d e")
        condensed = re.sub(r"[\s\._\-]+", "", normalized_text)
        if "systemoverride" in condensed or "ignoreallprevious" in condensed or "bypasssecurity" in condensed:
            if not any("Direct prompt injection" in f or "System override" in f for f in findings):
                risk_score += 80
                findings.append("Evasion: Character-spaced adversarial phrase detected.")

        # 5. Dangerous production target heuristics
        if "delete" in tool_name.lower() and "prod" in normalized_text:
            risk_score += 40
            findings.append("Production deletion action targeting critical infrastructure.")

        risk_score = min(100, max(0, risk_score))
        status = "ALERT" if risk_score >= 40 else "CLEAR"

        trace = {
            "agent_role": self.agent_role,
            "status": status,
            "risk_score": risk_score,
            "findings": findings
        }
        return risk_score, trace
