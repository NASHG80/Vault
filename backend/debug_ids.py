"""Quick test: simulate exactly what happens when a job request triggers send_job_alert."""
from app.services.notification_service import send_job_alert

# Simulate the exact job_request doc from DB
job_doc = {
    "worker_id": "69e405f7c8839b0f6675cab3",
    "hirer_id": "69e3b24d0b944a5f9fd04c63",
    "job_title": "Test WhatsApp Alert",
    "location": "Mumbai",
    "reward": "500 INR",
    "duration": "2 hours",
    "skills": ["delivery"],
    "message": "Need urgent help",
}

print("Calling send_job_alert...")
result = send_job_alert("69e405f7c8839b0f6675cab3", job_doc)
print(f"Result: {result}")
