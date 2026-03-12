import os
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, MimeType
from config import (
    SENDGRID_API_KEY, FROM_EMAIL, TO_EMAIL,
    NEWSLETTER_NAME, TIMEZONE,
)
import pytz


def _render_template(context: dict) -> str:
    """Render the Jinja2 HTML email template."""
    template_dir = os.path.join(os.path.dirname(__file__), "templates")
    env = Environment(
        loader=FileSystemLoader(template_dir),
        autoescape=select_autoescape(["html"]),
    )
    template = env.get_template("newsletter.html")
    return template.render(**context)


def build_context(weather, finance, jobs, fashion, culture, custom_feeds, calendar):
    """Assemble the template context dict."""
    tz = pytz.timezone(TIMEZONE)
    now = datetime.now(tz)
    session = "Morning Brief" if now.hour < 13 else "Evening Brief"

    return {
        "newsletter_name": NEWSLETTER_NAME,
        "generated_at": now.strftime(f"%A, %-d %B %Y — {session} (%H:%M %Z)"),
        "weather": weather,
        "finance": finance,
        "jobs": jobs,
        "fashion": fashion,
        "culture": culture,
        "custom_feeds": custom_feeds,
        "calendar": calendar,
    }


def send_newsletter(weather, finance, jobs, fashion, culture, custom_feeds, calendar):
    """Fetch, render, and send the newsletter email via SendGrid."""
    if not SENDGRID_API_KEY:
        raise ValueError("SENDGRID_API_KEY is not set in your .env file.")
    if not FROM_EMAIL or not TO_EMAIL:
        raise ValueError("FROM_EMAIL and TO_EMAIL must be set in your .env file.")

    context = build_context(weather, finance, jobs, fashion, culture, custom_feeds, calendar)
    html_content = _render_template(context)

    tz = pytz.timezone(TIMEZONE)
    now = datetime.now(tz)
    session = "Morning Brief" if now.hour < 13 else "Evening Brief"
    subject = f"{NEWSLETTER_NAME} — {session} · {now.strftime('%-d %b %Y')}"

    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=TO_EMAIL,
        subject=subject,
        html_content=html_content,
    )

    sg = SendGridAPIClient(SENDGRID_API_KEY)
    response = sg.send(message)
    print(f"[email] Sent '{subject}' → status {response.status_code}")
    return response.status_code
