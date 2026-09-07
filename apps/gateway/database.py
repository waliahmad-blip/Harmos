# -*- coding: utf-8 -*-
"""
Harmos Gateway Persistence Engine (SQLite)
Schema for execution receipts, policy invariants, and mock ERP reality database.
USPTO Patent #63/915,788
"""
import sqlite3
import os
import json
import time
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "harmos.db")


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=15.0)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database():
    """Initializes tables and seeds default policy invariants and ERP records."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Execution Receipts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS execution_receipts (
        receipt_id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        arguments_json TEXT NOT NULL,
        verdict TEXT NOT NULL,
        confidence_score INTEGER NOT NULL,
        red_team_risk INTEGER NOT NULL,
        compliance_risk INTEGER NOT NULL,
        reality_check_status TEXT NOT NULL,
        nonce TEXT UNIQUE NOT NULL,
        code_manifest_hash TEXT NOT NULL,
        merkle_leaf_hash TEXT NOT NULL,
        pqc_signature_hex TEXT NOT NULL,
        full_receipt_json TEXT NOT NULL
    );
    """)

    # 2. Policy Invariants
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS policy_invariants (
        policy_id TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        rule_name TEXT NOT NULL,
        max_amount_usd REAL,
        allowed_endpoints TEXT,
        rate_limit_per_minute INTEGER DEFAULT 30
    );
    """)

    # 3. Human-In-The-Loop (HITL) Escrow Buffer for PAUSED Actions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS escrow_actions (
        escrow_id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        confidence_score INTEGER NOT NULL,
        reasoning TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
        resolved_at TEXT,
        resolved_by TEXT,
        resolution_notes TEXT,
        FOREIGN KEY(receipt_id) REFERENCES execution_receipts(receipt_id)
    );
    """)

    # 3. Mock ERP Database for Reality Ground-Truth Checking
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mock_erp_orders (
        order_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        item_description TEXT NOT NULL,
        amount_usd REAL NOT NULL,
        status TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mock_erp_vendors (
        vendor_id TEXT PRIMARY KEY,
        vendor_name TEXT NOT NULL,
        authorized_iban TEXT NOT NULL,
        is_active INTEGER DEFAULT 1
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mock_accounts (
        account_id TEXT PRIMARY KEY,
        account_name TEXT NOT NULL,
        balance_usd REAL NOT NULL
    );
    """)

    # Seed initial test data if empty
    cursor.execute("SELECT COUNT(*) FROM policy_invariants")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO policy_invariants (policy_id, domain, rule_name, max_amount_usd, allowed_endpoints)
        VALUES 
            ('pol_refund_default', 'e_commerce', 'Max refund cannot exceed order total', 500.0, 'https://api.stripe.com/v1/refunds'),
            ('pol_travel_default', 'procurement', 'Single travel booking cap', 600.0, 'https://api.travel.corp/v1/bookings'),
            ('pol_wire_default', 'treasury', 'Max automated wire cap', 5000.0, 'https://api.treasury.corp/v1/wires')
        """)

    cursor.execute("SELECT COUNT(*) FROM mock_erp_orders")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO mock_erp_orders (order_id, customer_id, item_description, amount_usd, status)
        VALUES 
            ('8812', 'CUST_4491', 'Ceramic Pour-Over Coffee Dripper', 24.00, 'DELIVERED'),
            ('9940', 'CUST_1022', 'Ergonomic Standing Desk Frame', 420.00, 'SHIPPED')
        """)

    cursor.execute("SELECT COUNT(*) FROM mock_erp_vendors")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO mock_erp_vendors (vendor_id, vendor_name, authorized_iban, is_active)
        VALUES 
            ('VEND_ACME', 'Acme Corp Industrial', 'US88ACME00192837465', 1),
            ('VEND-88412', 'Global Cloud Services Ltd', 'GB44GCS99018273645', 1)
        """)

    cursor.execute("SELECT COUNT(*) FROM mock_accounts")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO mock_accounts (account_id, account_name, balance_usd)
        VALUES 
            ('ACC_MAIN_TREASURY', 'Corporate Treasury Operating Account', 85000.00),
            ('ACC_PETTY_CASH', 'Discretionary Agent Expense Buffer', 2000.00)
        """)

    conn.commit()
    conn.close()


def insert_receipt(receipt_dict: Dict[str, Any], full_json: str, leaf_hash: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO execution_receipts (
        receipt_id, timestamp, agent_id, tool_name, arguments_json,
        verdict, confidence_score, red_team_risk, compliance_risk,
        reality_check_status, nonce, code_manifest_hash, merkle_leaf_hash,
        pqc_signature_hex, full_receipt_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        receipt_dict["receipt_id"],
        receipt_dict["timestamp"],
        receipt_dict["agent_id"],
        receipt_dict["action"]["tool"],
        json.dumps(receipt_dict["action"].get("parameters", {})),
        receipt_dict["conclave_verdict"]["status"],
        receipt_dict["conclave_verdict"]["confidence_score"],
        receipt_dict["conclave_verdict"]["red_team_risk"],
        receipt_dict["conclave_verdict"]["compliance_risk"],
        receipt_dict["conclave_verdict"]["reality_check_status"],
        receipt_dict["nonce"],
        receipt_dict["cryptographic_attestation"]["code_manifest_hash"],
        leaf_hash,
        receipt_dict["cryptographic_attestation"]["signature"],
        full_json
    ))
    conn.commit()
    conn.close()


def query_receipts(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM execution_receipts ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    results = [dict(row) for row in rows]
    conn.close()
    return results


def get_receipt_by_id(receipt_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM execution_receipts WHERE receipt_id = ?", (receipt_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def insert_escrow_action(
    escrow_id: str,
    receipt_id: str,
    agent_id: str,
    tool_name: str,
    parameters: Dict[str, Any],
    confidence_score: int,
    reasoning: str
):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO escrow_actions (
        escrow_id, receipt_id, created_at, agent_id, tool_name,
        parameters_json, confidence_score, reasoning, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    """, (
        escrow_id,
        receipt_id,
        time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        agent_id,
        tool_name,
        json.dumps(parameters),
        confidence_score,
        reasoning
    ))
    conn.commit()
    conn.close()


def query_pending_escrow(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM escrow_actions WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    results = [dict(row) for row in rows]
    conn.close()
    return results


def resolve_escrow_action(
    escrow_id: str,
    approved: bool,
    resolved_by: str = "human_operator",
    notes: str = ""
) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    new_status = "APPROVED" if approved else "REJECTED"
    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    cursor.execute("""
    UPDATE escrow_actions
    SET status = ?, resolved_at = ?, resolved_by = ?, resolution_notes = ?
    WHERE escrow_id = ?
    """, (new_status, now_str, resolved_by, notes, escrow_id))
    
    conn.commit()
    cursor.execute("SELECT * FROM escrow_actions WHERE escrow_id = ?", (escrow_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_merkle_leaf_hashes() -> List[str]:
    """Retrieves all merkle leaf hashes in chronological order for tree rehydration."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT merkle_leaf_hash FROM execution_receipts ORDER BY rowid ASC")
    rows = cursor.fetchall()
    conn.close()
    return [row["merkle_leaf_hash"] for row in rows]


