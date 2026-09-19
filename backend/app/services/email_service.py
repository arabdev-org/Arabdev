"""Outgoing email.

No mail provider is configured yet, so messages are logged (and kept in an in-memory
outbox outside production, which the tests read). Swap send() for an SMTP/API call later.
"""

import logging
from dataclasses import dataclass

from app.core.config import settings

logger = logging.getLogger("arabdev.email")


@dataclass
class OutgoingEmail:
    to: str
    subject: str
    body: str
    sender: str = settings.mail_from
    reply_to: str = settings.support_email


outbox: list[OutgoingEmail] = []


def send(message: OutgoingEmail) -> None:
    if settings.environment != "production":
        outbox.append(message)
        del outbox[:-50]
    logger.warning("EMAIL from=%s to=%s subject=%r\n%s", message.sender, message.to, message.subject, message.body)


def send_password_reset(email: str, token: str) -> None:
    link = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
    send(
        OutgoingEmail(
            to=email,
            subject="Reset your ArabDev password",
            body=(
                "Someone asked to reset the password for your ArabDev account.\n"
                f"Open this link within {settings.password_reset_expire_minutes} minutes to choose a new one:\n"
                f"{link}\n\nIf this wasn't you, you can ignore this email; your password has not changed.\n\n"
                f"Need help? Write to {settings.support_email}. ArabDev will never ask for your password."
            ),
        )
    )
