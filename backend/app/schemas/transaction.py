from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TransactionRefCreate(BaseModel):
    """Sent by frontend after uploading encrypted data to IPFS."""
    cid: str                   # IPFS Content Identifier
    wallet_address: str        # MetaMask address that encrypted the data
    tx_type: str = "internal"  # internal | external


class TransactionRefResponse(BaseModel):
    """Returned to frontend — reference to an off-chain transaction."""
    id: str
    worker_id: str
    cid: str
    wallet_address: str
    tx_type: str
    created_at: str
