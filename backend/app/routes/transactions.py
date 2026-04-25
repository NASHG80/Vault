from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import List
from app.db.mongo import transactions
from app.schemas.transaction import TransactionRefCreate, TransactionRefResponse
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/record", response_model=TransactionRefResponse)
def record_transaction(data: TransactionRefCreate, current_user: dict = Depends(get_current_user)):
    """
    Store an off-chain transaction reference.
    The frontend has already encrypted the data and uploaded it to IPFS.
    We only store the CID (hash), never the actual transaction content.
    """
    doc = {
        "worker_id": current_user["user_id"],
        "cid": data.cid,
        "wallet_address": data.wallet_address,
        "tx_type": data.tx_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = transactions.insert_one(doc)

    return TransactionRefResponse(
        id=str(result.inserted_id),
        worker_id=doc["worker_id"],
        cid=doc["cid"],
        wallet_address=doc["wallet_address"],
        tx_type=doc["tx_type"],
        created_at=doc["created_at"],
    )


@router.get("/my", response_model=List[TransactionRefResponse])
def get_my_transactions(current_user: dict = Depends(get_current_user)):
    """
    Get all transaction references for the current user.
    Returns CIDs that the frontend will fetch from IPFS and decrypt locally.
    """
    docs = list(
        transactions.find({"worker_id": current_user["user_id"]}).sort("created_at", -1)
    )
    return [
        TransactionRefResponse(
            id=str(d["_id"]),
            worker_id=d["worker_id"],
            cid=d["cid"],
            wallet_address=d["wallet_address"],
            tx_type=d["tx_type"],
            created_at=d["created_at"],
        )
        for d in docs
    ]
