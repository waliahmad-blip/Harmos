# -*- coding: utf-8 -*-
"""
Harmos Merkle Flight Recorder (MLTA Layer 1)
Append-only Merkle tree for immutable transaction provenance.
USPTO Patent #63/915,788
"""
import hashlib
from typing import List, Tuple, Optional


def sha256_hash(data: str) -> str:
    """Returns hexadecimal SHA-256 hash of input string."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def combine_hashes(left: str, right: str) -> str:
    """Combines two hashes deterministically using SHA-256."""
    return hashlib.sha256((left + right).encode("utf-8")).hexdigest()


class MerkleTree:
    """Append-only Merkle Tree for verifiable transaction flight recording."""

    def __init__(self):
        self.leaves: List[str] = []
        self._tree_levels: List[List[str]] = []
        self._root: Optional[str] = None

    def add_leaf(self, data: str) -> str:
        """Hashes data and appends as a new leaf, updating tree root."""
        leaf_hash = sha256_hash(data)
        self.leaves.append(leaf_hash)
        self._rebuild_tree()
        return leaf_hash

    def _rebuild_tree(self):
        """Reconstructs Merkle tree levels from bottom up."""
        if not self.leaves:
            self._root = None
            self._tree_levels = []
            return

        current_level = self.leaves[:]
        self._tree_levels = [current_level]

        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                # If odd count, duplicate rightmost leaf
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                next_level.append(combine_hashes(left, right))
            current_level = next_level
            self._tree_levels.append(current_level)

        self._root = self._tree_levels[-1][0]

    @property
    def root(self) -> str:
        """Returns the current Merkle root hash."""
        if self._root is None:
            return sha256_hash("")
        return self._root

    def get_proof(self, leaf_index: int) -> List[Tuple[str, str]]:
        """
        Generates an inclusion proof for the leaf at leaf_index.
        Returns list of tuples: (sibling_hash, 'left' | 'right').
        """
        if leaf_index < 0 or leaf_index >= len(self.leaves):
            raise IndexError("Leaf index out of bounds")

        proof = []
        index = leaf_index

        for level in self._tree_levels[:-1]:
            is_right_child = (index % 2 == 1)
            sibling_index = index - 1 if is_right_child else index + 1

            if sibling_index < len(level):
                sibling_hash = level[sibling_index]
            else:
                sibling_hash = level[index]

            direction = "left" if is_right_child else "right"
            proof.append((sibling_hash, direction))
            index //= 2

        return proof


def verify_merkle_proof(leaf_hash: str, proof: List[Tuple[str, str]], expected_root: str) -> bool:
    """Verifies a Merkle inclusion proof against an expected root hash."""
    current = leaf_hash
    for sibling, direction in proof:
        if direction == "left":
            current = combine_hashes(sibling, current)
        else:
            current = combine_hashes(current, sibling)
    return current == expected_root
