# -*- coding: utf-8 -*-
"""
Harmos Software Code Manifest Generator (MLTA Layer 2)
Computes a deterministic cryptographic fingerprint of gateway code, policies, and system prompts.
USPTO Patent #63/915,788
"""
import os
import hashlib
from typing import Dict, List


def hash_file_content(file_path: str) -> str:
    """Computes SHA-256 hash of a single file's content in binary mode."""
    h = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()


def generate_code_manifest(root_dir: str, target_extensions: List[str] = None) -> Dict[str, any]:
    """
    Recursively scans directory for specified file types, computes individual hashes,
    and returns a combined deterministic SHA-256 root manifest hash.
    """
    if target_extensions is None:
        target_extensions = [".py", ".json", ".sql"]

    file_hashes = {}
    
    if os.path.exists(root_dir):
        for root, _, files in sorted(os.walk(root_dir)):
            for file in sorted(files):
                if any(file.endswith(ext) for ext in target_extensions):
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, root_dir).replace("\\", "/")
                    file_hashes[rel_path] = hash_file_content(full_path)

    # Deterministically aggregate all file hashes
    hasher = hashlib.sha256()
    for path, f_hash in sorted(file_hashes.items()):
        hasher.update(f"{path}:{f_hash}\n".encode("utf-8"))

    root_manifest_hash = hasher.hexdigest()

    return {
        "manifest_version": "1.0",
        "root_manifest_hash": root_manifest_hash,
        "files_analyzed_count": len(file_hashes),
        "file_details": file_hashes
    }
