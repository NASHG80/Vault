"""
services/groq_service.py
Groq LLM integration for the WhatsApp chatbot.
Uses the Groq REST API (no SDK required — just httpx).
"""

import httpx
from app.config import GROQ_API_KEY

SYSTEM_PROMPT = (
    "You are GigTrust assistant — a friendly, concise helper for gig workers. "
    "You help them understand their data, trust score, job opportunities, loan eligibility, "
    "and platform policies.\n\n"
    "Rules:\n"
    "- Keep responses SHORT (under 200 words). Workers read on mobile.\n"
    "- Use simple language. Avoid jargon.\n"
    "- Use emojis sparingly for friendliness (1-2 max).\n"
    "- If you don't know something specific to the user, say so honestly.\n"
    "- Never make up financial numbers.\n"
    "- Format lists with bullet points using •\n"
)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"


async def ask_groq(user_message: str, user_context: dict | None = None) -> str:
    """
    Send a message to Groq LLM with optional user context.
    Returns the assistant's reply text.
    """
    if not GROQ_API_KEY:
        return (
            "🤖 AI assistant is not configured yet. "
            "Please contact the GigTrust team for help!"
        )

    # Build context block
    context_block = ""
    if user_context:
        parts = []
        if user_context.get("name"):
            parts.append(f"Worker Name: {user_context['name']}")
        if user_context.get("trust_score") is not None:
            parts.append(f"Trust Score: {user_context['trust_score']}/99")
        if user_context.get("kyc_status"):
            parts.append(f"KYC Status: {user_context['kyc_status']}")
        if user_context.get("jobs_completed") is not None:
            parts.append(f"Jobs Completed: {user_context['jobs_completed']}")
        if user_context.get("last_transaction"):
            parts.append(f"Last Transaction: {user_context['last_transaction']}")
        if user_context.get("loan_status"):
            parts.append(f"Active Loan Status: {user_context['loan_status']}")
        if parts:
            context_block = (
                "\n\nCurrent user context (use this to personalize your response):\n"
                + "\n".join(parts)
            )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + context_block},
        {"role": "user",   "content": user_message},
    ]

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MODEL,
                    "messages": messages,
                    "temperature": 0.6,
                    "max_tokens": 400,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    except httpx.HTTPStatusError as e:
        print(f"[Groq] HTTP error: {e.response.status_code} — {e.response.text}")
        return "⚠️ Sorry, I'm having trouble connecting right now. Please try again in a minute!"
    except Exception as e:
        print(f"[Groq] Unexpected error: {e}")
        return "⚠️ Something went wrong. Please try again later or type *help* for available commands."
