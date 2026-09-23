# backend/auth/email.py
import resend

from ..core.config import settings


def _configure_resend() -> None:
    if not settings.RESEND_API_KEY:
        raise RuntimeError(
            "RESEND_API_KEY is not set. Configure it in .env or environment."
        )
    resend.api_key = settings.RESEND_API_KEY


def send_otp_email(to_email: str, otp: str) -> None:
    _configure_resend()

    minutes = settings.OTP_EXPIRE_MINUTES

    text = (
        f"Your Qrypta verification code is: {otp}\n\n"
        f"This code expires in {minutes} minutes.\n\n"
        "If you didn't request this, you can safely ignore this email."
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your Qrypta verification code</title>
  </head>
  <body style="font-family:Arial,Helvetica,sans-serif;color:#111;">
    <p>Your Qrypta verification code is:</p>
    <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0;">{otp}</p>
    <p>This code expires in {minutes} minutes.</p>
    <p style="color:#666;font-size:13px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </body>
</html>"""

    params: resend.Emails.SendParams = {
        "from": settings.RESEND_FROM,          # e.g. "Qrypta <no-reply@yourdomain.com>"
        "to": [to_email],
        "reply_to": "support@yourdomain.com",  # a real, monitored inbox
        "subject": f"{otp} is your Qrypta verification code",
        "html": html,
        "text": text,
    }

    try:
        resend.Emails.send(params)
    except Exception as exc:
        print(f"[Qrypta] Failed to send OTP email: {exc}")
        raise RuntimeError("Failed to send verification email.") from exc
    """
    Send the OTP email via Resend using the configured sender domain.
    """
    _configure_resend()

    params: resend.Emails.SendParams = {
        "from": settings.RESEND_FROM,
        "to": [to_email],
        "subject": "Your Qrypta verification code",
        "html": (
            f"<p>Your Qrypta verification code is:</p>"
            f"<h2 style='letter-spacing:6px'>{otp}</h2>"
            f"<p>This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.</p>"
            f"<p>If you did not request this, ignore this email.</p>"
        ),
    }

    try:
        resend.Emails.send(params)
    except Exception as exc:
        print(f"[Qrypta] Failed to send OTP email: {exc}")
        raise RuntimeError("Failed to send verification email.") from exc