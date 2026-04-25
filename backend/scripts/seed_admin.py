"""
scripts/seed_admin.py
---------------------
Run once to create the default admin user in MongoDB.

Usage (from the backend/ directory):
    python scripts/seed_admin.py

Credentials seeded:
    Email   : admin@syn3rgy.com
    Password: Admin@123
    Role    : admin
"""

import sys
import os

# Make sure app/ is importable when running from backend/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import bcrypt
from app.db.mongo import users

ADMIN_EMAIL    = "admin@syn3rgy.com"
ADMIN_PASSWORD = "Admin@123"
ADMIN_NAME     = "Syn3rgy Admin"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def seed():
    existing = users.find_one({"email": ADMIN_EMAIL})
    if existing:
        print(f"[seed_admin] Admin user '{ADMIN_EMAIL}' already exists — skipping.")
        return

    users.insert_one({
        "name":     ADMIN_NAME,
        "email":    ADMIN_EMAIL,
        "password": hash_password(ADMIN_PASSWORD),
        "role":     "admin",
    })
    print(f"[seed_admin] ✅ Admin user created:")
    print(f"             Email   : {ADMIN_EMAIL}")
    print(f"             Password: {ADMIN_PASSWORD}")


if __name__ == "__main__":
    seed()
