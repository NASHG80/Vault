from pymongo import MongoClient
import motor.motor_asyncio
from app.config import MONGO_URI, MONGO_DB_NAME

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]

# Collections
users = db["users"]
workers = db["workers"]
hirers = db["hirers"]
lenders = db["lenders"]
job_requests = db["job_requests"]
transactions = db["transactions"]
certificates = db["certificates"]
loans = db["loans"]

# Async Client (Motor) for new OTP functionality and auth
async_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
async_db = async_client[MONGO_DB_NAME]

async_users = async_db["users"]
otp_verifications = async_db["otp_verifications"]
async_certificates = async_db["certificates"]

async def setup_indexes():
    """Create TTL index on createdAt field (600 seconds or 10 mins)."""
    await otp_verifications.create_index("createdAt", expireAfterSeconds=600)