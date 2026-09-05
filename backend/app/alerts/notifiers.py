"""
Delivery-channel adapters. Each function performs the actual send when the
relevant provider credentials are configured, otherwise logs and no-ops so
local development / demos work without third-party accounts.
"""
from __future__ import annotations

import logging
import smtplib
from email.mime.text import MIMEText

from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger("thermora.notifiers")


def send_sms(phone_number: str, message: str) -> None:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.info("[SMS:dry-run] to=%s message=%s", phone_number, message)
        return
    from twilio.rest import Client  # imported lazily; optional dependency

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(body=message, from_=settings.TWILIO_FROM_NUMBER, to=phone_number)


def send_email(to_email: str, subject: str, body: str) -> None:
    if not settings.SMTP_HOST:
        logger.info("[EMAIL:dry-run] to=%s subject=%s body=%s", to_email, subject, body)
        return
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)


def send_push(user_id: str, title: str, body: str) -> None:
    if not settings.FCM_SERVER_KEY:
        logger.info("[PUSH:dry-run] user=%s title=%s body=%s", user_id, title, body)
        return
    import httpx

    httpx.post(
        "https://fcm.googleapis.com/fcm/send",
        headers={
            "Authorization": f"key={settings.FCM_SERVER_KEY}",
            "Content-Type": "application/json",
        },
        json={"to": user_id, "notification": {"title": title, "body": body}},
        timeout=10.0,
    )
