
import yaml, pathlib
from typing import Dict

class CostModel:
    """Loads price sheet and exposes fee helpers."""

    def __init__(self, yaml_path: str | pathlib.Path):
        with open(yaml_path, "r") as f:
            cfg = yaml.safe_load(f)
        self.lease_fee   : Dict[str, float] = cfg["lease_fee"]
        self.exec_fee    : Dict[str, float] = cfg["exec_fee"]
        self.trigger_fee : float            = cfg["trigger_fee"]
        self.acq_cost    : float            = cfg["acq_cost"]
        self.transfer_fee: Dict[str, float] = cfg["transfer_fee"]

    # ---------- granular fee look-ups ----------
    def lease(self, block_type: str, hours: int = 24, n_blocks: int = 1) -> float:
        return self.lease_fee[block_type] * hours * n_blocks

    def exec(self, block_type: str, n_jobs: int) -> float:
        return self.exec_fee[block_type] * n_jobs

    def trigger(self, n_jobs: int) -> float:
        return self.trigger_fee * n_jobs

    def acquisition(self, n_blocks: int) -> float:
        return self.acq_cost * n_blocks

    def transfer(self, new_type: str, n_blocks: int) -> float:
        return self.transfer_fee[new_type] * n_blocks
