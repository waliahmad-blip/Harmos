# -*- coding: utf-8 -*-
"""
Harmos Sovereign Verification Gateway (FastAPI)
MLTA Layer 1-3 Ingestion Proxy, Conclave Evaluator, and Receipt Server.
USPTO Patent #63/915,788
"""
import sys
import os
import json
import time
import uuid
from contextlib import asynccontextmanager
from typing import Dict, Any, Optional, List

# Add project root to path for package imports
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

WEB_DIR = os.path.join(ROOT_DIR, "apps", "web")

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from packages.crypto_core import ExecutionReceipt
from apps.gateway.database import (
    initialize_database,
    query_receipts,
    get_receipt_by_id,
    query_pending_escrow,
    resolve_escrow_action,
    get_db_connection
)
from apps.gateway.conclave import (
    evaluate_conclave,
    rehydrate_merkle_tree,
    GATEWAY_MANIFEST,
    GLOBAL_MERKLE_TREE,
    GATEWAY_SIGNER
)

HARMOS_REQUIRE_AUTH = os.environ.get("HARMOS_REQUIRE_AUTH", "false").lower() in ("true", "1", "yes")
HARMOS_API_KEY = os.environ.get("HARMOS_API_KEY", "harmos_sec_key_sample_9901")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema and seed data
    initialize_database()
    # Rehydrate append-only Merkle ledger across restarts
    rehydrate_merkle_tree()
    yield


app = FastAPI(
    title="Harmos AI Sovereign Verification Gateway",
    description="Zero-Trust Execution, Verification, and Tamper-Evident Receipts for AI Agents (USPTO #63/915,788)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def telemetry_and_security_middleware(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-ID", f"trc_{uuid.uuid4().hex[:12]}")
    start_time = time.perf_counter()

    # Optional Authentication Guard for production zero-trust enforcement
    if HARMOS_REQUIRE_AUTH:
        path = request.url.path
        exempt_paths = [
            "/", "/api", "/api/info", "/healthz", "/v1/manifest",
            "/docs", "/openapi.json", "/cockpit", "/hud",
            "/index.html", "/style.css", "/app.js", "/favicon.ico"
        ]
        if path not in exempt_paths and not path.startswith("/assets"):
            client_key = request.headers.get("X-Harmos-API-Key") or request.headers.get("Authorization", "").replace("Bearer ", "").strip()
            if client_key != HARMOS_API_KEY:
                return JSONResponse(
                    status_code=401,
                    content={"error": "Unauthorized", "detail": "Valid X-Harmos-API-Key required."},
                    headers={"X-Trace-ID": trace_id}
                )

    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    response.headers["X-Trace-ID"] = trace_id
    response.headers["X-Response-Time-MS"] = f"{duration_ms:.2f}"
    return response


class EvaluateRequest(BaseModel):
    agent_id: str = Field(..., example="agent_customer_support_01")
    tool_name: str = Field(..., example="issue_refund")
    parameters: Dict[str, Any] = Field(default_factory=dict, example={"order_id": "8812", "amount": 24.00})
    raw_prompt: Optional[str] = Field(default="", example="User requested refund for damaged mug.")


class VerifyReceiptRequest(BaseModel):
    receipt: Dict[str, Any]


class ResolveEscrowRequest(BaseModel):
    approved: bool
    resolved_by: str = "human_operator"
    notes: Optional[str] = ""


def get_system_metadata():
    return {
        "system": "Harmos AI Sovereign Verification Gateway",
        "version": "EXEC-2026-V1.0",
        "patent": "USPTO Application #63/915,788",
        "inventor": "Wali Ahmad",
        "status": "OPERATIONAL",
        "manifest_hash": GATEWAY_MANIFEST["root_manifest_hash"],
        "merkle_root": GLOBAL_MERKLE_TREE.root
    }


@app.get("/api")
@app.get("/api/info")
def get_api_metadata():
    return get_system_metadata()


@app.get("/cockpit")
@app.get("/hud")
def get_cockpit_view():
    index_file = os.path.join(WEB_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file, media_type="text/html")
    return get_system_metadata()


@app.get("/")
def get_root(request: Request):
    accept = request.headers.get("accept", "")
    # When visited in a web browser, serve the Sovereign HUD Cockpit directly
    if "text/html" in accept:
        index_file = os.path.join(WEB_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file, media_type="text/html")
    # Non-browser client / API tests fallback
    return get_system_metadata()


@app.get("/healthz")
def get_healthz():
    db_ok = False
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        db_ok = False

    is_healthy = db_ok and (GATEWAY_MANIFEST.get("root_manifest_hash") is not None)
    return {
        "status": "HEALTHY" if is_healthy else "DEGRADED",
        "database_connected": db_ok,
        "merkle_total_leaves": len(GLOBAL_MERKLE_TREE.leaves),
        "merkle_root": GLOBAL_MERKLE_TREE.root,
        "manifest_hash": GATEWAY_MANIFEST.get("root_manifest_hash"),
        "signer_public_key": GATEWAY_SIGNER.public_key_hex,
        "auth_enforced": HARMOS_REQUIRE_AUTH,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


@app.post("/v1/conclave/evaluate")
def post_evaluate(req: EvaluateRequest):
    try:
        receipt, trace = evaluate_conclave(
            agent_id=req.agent_id,
            tool_name=req.tool_name,
            parameters=req.parameters,
            raw_prompt=req.raw_prompt or ""
        )
        return {
            "success": True,
            "receipt": receipt.to_dict(),
            "trace": trace
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/receipts/verify")
def post_verify_receipt(req: VerifyReceiptRequest):
    try:
        rcpt = ExecutionReceipt.from_dict(req.receipt)
        verification = rcpt.verify_integrity(
            signer=GATEWAY_SIGNER,
            expected_manifest_hash=GATEWAY_MANIFEST.get("root_manifest_hash")
        )
        return {
            "verified": verification["valid"],
            "details": verification
        }
    except Exception as e:
        return {
            "verified": False,
            "error": str(e)
        }


@app.get("/v1/receipts")
def get_all_receipts(limit: int = 50, verdict: Optional[str] = None):
    results = query_receipts(limit)
    if verdict:
        results = [r for r in results if r["verdict"].upper() == verdict.upper()]
    return {
        "count": len(results),
        "receipts": results
    }


@app.get("/v1/receipts/{receipt_id}")
def get_single_receipt(receipt_id: str):
    rcpt = get_receipt_by_id(receipt_id)
    if not rcpt:
        raise HTTPException(status_code=404, detail=f"Receipt '{receipt_id}' not found.")
    return rcpt


@app.get("/v1/escrow/pending")
def get_escrow_pending(limit: int = 50):
    actions = query_pending_escrow(limit)
    return {
        "count": len(actions),
        "pending_actions": actions
    }


@app.post("/v1/escrow/{escrow_id}/resolve")
def post_resolve_escrow(escrow_id: str, req: ResolveEscrowRequest):
    updated = resolve_escrow_action(
        escrow_id=escrow_id,
        approved=req.approved,
        resolved_by=req.resolved_by,
        notes=req.notes or ""
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Escrow action '{escrow_id}' not found.")
    return {
        "success": True,
        "action": updated
    }


@app.get("/v1/policies")
def get_policies():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM policy_invariants")
    policies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {
        "count": len(policies),
        "policies": policies
    }


@app.get("/v1/manifest")
def get_manifest():
    return GATEWAY_MANIFEST


@app.get("/v1/merkle/status")
def get_merkle_status():
    return {
        "total_leaves": len(GLOBAL_MERKLE_TREE.leaves),
        "merkle_root": GLOBAL_MERKLE_TREE.root
    }


# ---------------------------------------------------------
# Static Frontend Cockpit Mounting & Assets
# ---------------------------------------------------------
@app.get("/index.html")
def get_index_page():
    index_file = os.path.join(WEB_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file, media_type="text/html")
    raise HTTPException(status_code=404, detail="index.html not found")


@app.get("/style.css")
def get_style_css():
    style_path = os.path.join(WEB_DIR, "style.css")
    if os.path.exists(style_path):
        return FileResponse(style_path, media_type="text/css")
    raise HTTPException(status_code=404, detail="style.css not found")


@app.get("/app.js")
def get_app_js():
    js_path = os.path.join(WEB_DIR, "app.js")
    if os.path.exists(js_path):
        return FileResponse(js_path, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="app.js not found")


@app.get("/favicon.ico")
def get_favicon():
    icon_path = os.path.join(WEB_DIR, "assets", "img", "icon-48.png")
    if os.path.exists(icon_path):
        return FileResponse(icon_path, media_type="image/png")
    raise HTTPException(status_code=404, detail="favicon not found")


assets_dir = os.path.join(WEB_DIR, "assets")
if os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("HARMOS_PORT", 8001))
    host = os.environ.get("HARMOS_HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)

