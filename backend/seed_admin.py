"""
Run this once to create an admin account in MongoDB.
Usage: python seed_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(override=True)

import bcrypt
from pymongo import MongoClient
from app.config import MONGO_URI, MONGO_DB_NAME

# ── Config — change these ──────────────────────────────────────────────
ADMIN_EMAIL    = "admin@gigtrust.com"
ADMIN_NAME     = "GigTrust Admin"
ADMIN_PASSWORD = "Admin@123"          # change after first login
# ──────────────────────────────────────────────────────────────────────

client = MongoClient(MONGO_URI)
db     = client[MONGO_DB_NAME]
users  = db["users"]

# Check if already exists
existing = users.find_one({"email": ADMIN_EMAIL})
if existing:
    print(f"[seed_admin] Admin already exists: {ADMIN_EMAIL}")
    sys.exit(0)

hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()

result = users.insert_one({
    "name":     ADMIN_NAME,
    "email":    ADMIN_EMAIL,
    "password": hashed,
    "role":     "admin",
})

print(f"[seed_admin] ✅ Admin created!")
print(f"  Email   : {ADMIN_EMAIL}")
print(f"  Password: {ADMIN_PASSWORD}")
print(f"  MongoDB ID: {result.inserted_id}")
