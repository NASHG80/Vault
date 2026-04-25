import os
from dotenv import load_dotenv

load_dotenv(override=True)

# MongoDB
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "gigtrust")

# JWT
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRY_MINUTES = int(os.getenv("JWT_EXPIRY_MINUTES", "1440"))

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
DIDIT_WORKFLOW_URL = os.getenv("DIDIT_WORKFLOW_URL", "")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Twilio (OTP SMS)
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_NUMBER      = os.getenv("TWILIO_NUMBER", "+19893345322")

# Email (fastapi-mail)
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
MAIL_FROM = os.getenv("MAIL_FROM", os.getenv("MAIL_USERNAME", ""))
MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")

# Groq LLM
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Twilio WhatsApp (uses the same account SID / auth token as SMS)
TWILIO_WHATSAPP_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER", f"whatsapp:{TWILIO_NUMBER}")
