from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import Optional, List, Annotated, Dict, Any
import os
import random
import logging
import uuid
import secrets
import bcrypt
import jwt
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
import base64
import httpx
import asyncio
try:
    import resend
except ImportError:
    resend = None
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
except ImportError:
    LlmChat = None
    UserMessage = None
    ImageContent = None
    StripeCheckout = None
    CheckoutSessionRequest = None


# ─── Gmail SMTP Email ─────────────────────────────────────────────────────────
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

async def send_email(to: str, subject: str, html: str):
    # ── 1. Try Resend (preferred — reliable delivery) ──────────────────────────
    resend_api_key = os.environ.get("RESEND_API_KEY", "")
    if resend_api_key and resend:
        try:
            resend.api_key = resend_api_key
            def _send_resend():
                resend.Emails.send({
                    "from": "StudioOS <noreply@studioos.de>",
                    "to": [to],
                    "subject": subject,
                    "html": html,
                })
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, _send_resend)
            logger.info(f"Email sent via Resend to {to}: {subject}")
            return
        except Exception as e:
            logger.warning(f"Resend failed, falling back to Gmail: {e}")

    # ── 2. Gmail SMTP fallback ─────────────────────────────────────────────────
    gmail_user = os.environ.get("GMAIL_USER", "")
    gmail_pass = os.environ.get("GMAIL_APP_PASSWORD", "")
    if not gmail_user or not gmail_pass:
        logger.info("Email skipped — no email provider configured")
        return

    def _send_gmail():
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"StudioOS <{gmail_user}>"
        msg["To"] = to
        msg.attach(MIMEText(html, "html", "utf-8"))
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls()
            server.login(gmail_user, gmail_pass)
            server.sendmail(gmail_user, to, msg.as_string())

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _send_gmail)
        logger.info(f"Email sent via Gmail to {to}: {subject}")
    except Exception as e:
        logger.warning(f"Email send failed (non-critical): {e}")

def _email_header() -> str:
    return """
    <div style="background:#0a0a0a;padding:24px 32px;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">StudioOS</h1>
      <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:4px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;letter-spacing:0.08em;text-transform:uppercase;">Tattoo Booking Platform</p>
    </div>"""

def _email_footer(extra: str = "") -> str:
    return f"""
    <div style="background:#f4f4f4;padding:20px 32px;border-radius:0 0 12px 12px;border-top:1px solid #e5e5e5;">
      {f'<p style="font-size:12px;color:#888;margin:0 0 8px;font-family:Helvetica Neue,Arial,sans-serif;">{extra}</p>' if extra else ''}
      <p style="font-size:11px;color:#bbb;margin:0;font-family:Helvetica Neue,Arial,sans-serif;">
        © 2026 StudioOS · Deutschland ·
        <a href="#" style="color:#bbb;text-decoration:underline;">Datenschutz</a> ·
        <a href="#" style="color:#bbb;text-decoration:underline;">Impressum</a>
      </p>
    </div>"""

def _detail_row(label: str, value: str, highlight: bool = False) -> str:
    bg = "#f9f9f9" if not highlight else "#0a0a0a"
    color = "#111" if not highlight else "#fff"
    return f"""<tr>
      <td style="padding:11px 16px;font-size:12px;color:#888;font-family:Helvetica Neue,Arial,sans-serif;border-bottom:1px solid #f0f0f0;width:38%;">{label}</td>
      <td style="padding:11px 16px;font-size:13px;color:{color};font-weight:600;font-family:Helvetica Neue,Arial,sans-serif;border-bottom:1px solid #f0f0f0;background:{bg};">{value}</td>
    </tr>"""

def booking_confirmation_html(booking: dict, lang: str = "de") -> str:
    type_label = "Videoberatungsgespräch" if booking.get("booking_type") == "video_consultation" else ("Beratungsgespräch" if booking.get("booking_type") == "consultation" else "Tattoo-Session")
    artist_row = _detail_row("Artist", booking["artist_name"]) if booking.get("artist_name") else ""
    notes_row = _detail_row("Notiz", booking["notes"]) if booking.get("notes") else ""
    deposit = booking.get("deposit_amount", 0)
    deposit_row = _detail_row("Anzahlung", f"€ {deposit:.2f}") if deposit else ""

    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
      {_email_header()}
      <div style="padding:32px 32px 24px;">
        <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 14px;margin-bottom:20px;">
          <span style="font-size:12px;font-weight:700;color:#16a34a;letter-spacing:0.05em;text-transform:uppercase;">Buchung eingegangen</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#111;letter-spacing:-0.4px;">Buchungsbestätigung</h2>
        <p style="font-size:14px;color:#666;margin:0 0 28px;line-height:1.5;">
          Dein Termin bei <strong style="color:#111;">{booking.get('studio_name', '')}</strong> wurde erfolgreich eingereicht.
          Du erhältst eine weitere Benachrichtigung sobald das Studio bestätigt.
        </p>

        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;">
          {_detail_row("Studio", booking.get('studio_name', ''), highlight=True)}
          {_detail_row("Datum", booking.get('date', ''))}
          {_detail_row("Zeit", f"{booking.get('start_time', '')} – {booking.get('end_time', '')}")}
          {_detail_row("Art", type_label)}
          {artist_row}
          {deposit_row}
          {notes_row}
          {_detail_row("Buchungs-ID", booking.get('booking_id', ''))}
        </table>

        <div style="margin-top:28px;padding:16px 20px;background:#fafafa;border-radius:8px;border-left:3px solid #0a0a0a;">
          <p style="font-size:12px;color:#666;margin:0;line-height:1.6;">
            Deine Buchung ist eingegangen und wartet auf die Bestätigung des Studios.
            Den Status deiner Buchung findest du jederzeit in deinem <strong style="color:#111;">StudioOS Dashboard</strong>.
          </p>
        </div>
      </div>
      {_email_footer("Fragen? Nutze unseren Support-Chat auf inkbook.de")}
    </div>"""

def booking_confirmation_studio_html(booking: dict) -> str:
    """Email to studio owner when a new booking arrives."""
    type_label = "Videoberatungsgespräch" if booking.get("booking_type") == "video_consultation" else ("Beratungsgespräch" if booking.get("booking_type") == "consultation" else "Tattoo-Session")
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
      {_email_header()}
      <div style="padding:32px 32px 24px;">
        <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:6px 14px;margin-bottom:20px;">
          <span style="font-size:12px;font-weight:700;color:#2563eb;letter-spacing:0.05em;text-transform:uppercase;">Neue Buchungsanfrage</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#111;letter-spacing:-0.4px;">Neue Anfrage eingegangen</h2>
        <p style="font-size:14px;color:#666;margin:0 0 28px;line-height:1.5;">
          <strong style="color:#111;">{booking.get('user_name', 'Ein Kunde')}</strong> hat soeben eine Buchung für dein Studio eingereicht.
          Bitte bestätige oder lehne die Anfrage im Dashboard ab.
        </p>

        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;">
          {_detail_row("Kunde", booking.get('user_name', ''), highlight=True)}
          {_detail_row("Datum", booking.get('date', ''))}
          {_detail_row("Zeit", f"{booking.get('start_time', '')} – {booking.get('end_time', '')}")}
          {_detail_row("Art", type_label)}
          {_detail_row("Buchungs-ID", booking.get('booking_id', ''))}
        </table>

        <div style="margin-top:28px;text-align:center;">
          <a href="#" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:0.03em;">
            Jetzt im Dashboard verwalten
          </a>
        </div>
      </div>
      {_email_footer()}
    </div>"""

def booking_status_html(booking: dict, status: str) -> str:
    is_confirmed = status == "confirmed"
    badge_bg = "#f0fdf4" if is_confirmed else "#fef2f2"
    badge_border = "#bbf7d0" if is_confirmed else "#fecaca"
    badge_color = "#16a34a" if is_confirmed else "#dc2626"
    badge_text = "Bestätigt" if is_confirmed else "Abgesagt"
    headline = "Dein Termin wurde bestätigt!" if is_confirmed else "Dein Termin wurde abgesagt"
    subtext = (
        "Dein Termin ist jetzt offiziell bestätigt. Wir sehen uns bald!"
        if is_confirmed else
        "Leider musste dein Termin abgesagt werden. Gerne kannst du einen neuen Termin buchen."
    )

    deposit_required = booking.get("deposit_required", False)
    deposit_amount = booking.get("deposit_amount", 0)
    deposit_block = ""
    if is_confirmed and deposit_required and deposit_amount:
        deposit_block = f"""
        <div style="margin-top:20px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e;">Anzahlung erforderlich</p>
          <p style="margin:0;font-size:13px;color:#78350f;line-height:1.5;">
            Bitte zahle die Anzahlung von <strong>€ {float(deposit_amount):.2f}</strong> über dein StudioOS-Dashboard,
            um deinen Termin zu sichern. Dein Platz ist bis zur Zahlung reserviert.
          </p>
        </div>"""

    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
      {_email_header()}
      <div style="padding:32px 32px 24px;">
        <div style="display:inline-block;background:{badge_bg};border:1px solid {badge_border};border-radius:6px;padding:6px 14px;margin-bottom:20px;">
          <span style="font-size:12px;font-weight:700;color:{badge_color};letter-spacing:0.05em;text-transform:uppercase;">{badge_text}</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#111;letter-spacing:-0.4px;">{headline}</h2>
        <p style="font-size:14px;color:#666;margin:0 0 28px;line-height:1.5;">{subtext}</p>

        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;">
          {_detail_row("Studio", booking.get('studio_name', ''), highlight=True)}
          {_detail_row("Datum", booking.get('date', ''))}
          {_detail_row("Zeit", f"{booking.get('start_time', '')} – {booking.get('end_time', '')}")}
          {_detail_row("Buchungs-ID", booking.get('booking_id', ''))}
        </table>

        {deposit_block}

        {'<div style="margin-top:28px;text-align:center;"><a href="#" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:13px;font-weight:700;">Neuen Termin buchen</a></div>' if not is_confirmed else ''}
      </div>
      {_email_footer("Fragen? Nutze unseren Support-Chat auf inkbook.de")}
    </div>"""

def payment_confirmed_html(booking: dict) -> str:
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
      {_email_header()}
      <div style="padding:32px 32px 24px;">
        <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 14px;margin-bottom:20px;">
          <span style="font-size:12px;font-weight:700;color:#16a34a;letter-spacing:0.05em;text-transform:uppercase;">Anzahlung erhalten</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#111;letter-spacing:-0.4px;">Dein Termin ist final gesichert!</h2>
        <p style="font-size:14px;color:#666;margin:0 0 28px;line-height:1.5;">
          Deine Anzahlung ist bei uns eingegangen — dein Termin ist damit vollständig abgewickelt und fix reserviert. Wir freuen uns auf dich!
        </p>
        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;">
          {_detail_row("Studio", booking.get('studio_name', ''), highlight=True)}
          {_detail_row("Datum", booking.get('date', ''))}
          {_detail_row("Zeit", f"{booking.get('start_time', '')} – {booking.get('end_time', '')}")}
          {_detail_row("Anzahlung", f"€ {float(booking.get('deposit_amount', 0)):.2f} ✓")}
          {_detail_row("Buchungs-ID", booking.get('booking_id', ''))}
        </table>
      </div>
      {_email_footer("Fragen? Nutze unseren Support-Chat auf inkbook.de")}
    </div>"""

def guest_offer_email_html(
    guest_name: str, studio_name: str, date_fmt: str, offer_time: str,
    offer_duration_min: int, offer_total_price: float, offer_deposit_amount: float,
    offer_notes: str, tattoo_desc: str, activate_url: str,
    offer_deadline_label: str = "24 Stunden"
) -> str:
    notes_block = f"""
      <div style="background:#fafafa;border-left:3px solid #d1d5db;padding:14px 18px;border-radius:6px;margin-top:16px;">
        <p style="font-size:12px;color:#888;margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;text-transform:uppercase;letter-spacing:0.06em;">Notiz vom Studio</p>
        <p style="font-size:14px;color:#444;margin:0;font-family:'Helvetica Neue',Arial,sans-serif;line-height:1.6;">"{offer_notes}"</p>
      </div>""" if offer_notes else ""
    desc_block = f"""
      <div style="background:#fafafa;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <p style="font-size:11px;color:#999;margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;text-transform:uppercase;letter-spacing:0.08em;">Deine Anfrage</p>
        <p style="font-size:14px;color:#555;margin:0;font-family:'Helvetica Neue',Arial,sans-serif;line-height:1.5;">{tattoo_desc}</p>
      </div>""" if tattoo_desc else ""
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
      {_email_header()}
      <div style="padding:32px 32px 24px;">
        <div style="display:inline-block;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:6px;padding:6px 14px;margin-bottom:20px;">
          <span style="font-size:12px;font-weight:700;color:#6d28d9;letter-spacing:0.05em;text-transform:uppercase;">Neues Angebot</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 8px;color:#111;letter-spacing:-0.4px;">Hallo {guest_name}!</h2>
        <p style="font-size:15px;color:#444;margin:0 0 20px;line-height:1.6;">
          <strong style="color:#111;">{studio_name}</strong> hat deine Tattoo-Anfrage geprüft und dir ein Angebot erstellt.
        </p>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
          <p style="font-size:13px;font-weight:700;color:#c2410c;margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;">⏳ Du hast {offer_deadline_label} Zeit zum Annehmen</p>
          <p style="font-size:13px;color:#9a3412;margin:0;font-family:'Helvetica Neue',Arial,sans-serif;line-height:1.5;">Nimm das Angebot innerhalb von {offer_deadline_label} an – danach verfällt es automatisch und du musst erneut anfragen.</p>
        </div>
        {desc_block}
        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;margin-bottom:8px;">
          {_detail_row("Studio", studio_name, highlight=True)}
          {_detail_row("Termin", f"{date_fmt} um {offer_time} Uhr")}
          {_detail_row("Dauer", f"{offer_duration_min} Minuten")}
          {_detail_row("Gesamtpreis", f"€ {offer_total_price:.0f}")}
          {_detail_row("Anzahlung", f"€ {offer_deposit_amount:.0f} (zur Buchungssicherung)")}
        </table>
        {notes_block}
        <p style="font-size:14px;color:#666;margin:24px 0 8px;line-height:1.6;">
          Um das Angebot anzunehmen und die Anzahlung zu leisten, erstelle einfach dein StudioOS-Konto. Das dauert nur 30 Sekunden.
        </p>
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="{activate_url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:-0.2px;">Passwort vergeben &amp; Angebot ansehen →</a>
        </div>
      </div>
      {_email_footer(f"Du erhältst diese E-Mail weil du eine Anfrage bei {studio_name} auf StudioOS gestellt hast.")}
    </div>"""

def customer_free_cancellation_refund_html(booking: dict) -> str:
    """Email to customer: studio has processed their deposit refund (free-window cancellation)."""
    deposit = float(booking.get("offer_deposit_amount") or booking.get("deposit_amount") or 0)
    deposit_str = f"€ {deposit:.2f}"
    date_raw = booking.get("offer_date") or booking.get("date", "")
    try:
        date_fmt = datetime.strptime(date_raw, "%Y-%m-%d").strftime("%d.%m.%Y")
    except Exception:
        date_fmt = date_raw
    time_str = booking.get("offer_time") or booking.get("start_time", "")
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
      {_email_header()}
      <div style="padding:32px 32px 24px;">
        <div style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:6px 14px;margin-bottom:20px;">
          <span style="font-size:12px;font-weight:700;color:#15803d;letter-spacing:0.05em;text-transform:uppercase;">Rückerstattung eingeleitet</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 8px;color:#111;letter-spacing:-0.4px;">Deine Anzahlung wird zurückgebucht</h2>
        <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6;">
          Du hast deinen Termin innerhalb der kostenlosen Stornierungsfrist abgesagt. Das Studio <strong style="color:#111;">{booking.get('studio_name', '')}</strong> hat die Rückerstattung deiner Anzahlung veranlasst.
        </p>
        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;margin-bottom:24px;">
          {_detail_row("Studio", booking.get('studio_name', ''), highlight=True)}
          {_detail_row("Termin", f"{date_fmt}{(' um ' + time_str + ' Uhr') if time_str else ''}")}
          {_detail_row("Rückerstattung", deposit_str)}
          {_detail_row("Buchungs-ID", booking.get('booking_id', ''))}
        </table>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
          <p style="font-size:13px;font-weight:700;color:#15803d;margin:0 0 6px;">💳 Rückerstattung läuft automatisch</p>
          <p style="font-size:13px;color:#166534;margin:0;line-height:1.6;">
            Der Betrag von <strong>{deposit_str}</strong> wird auf deine ursprüngliche Zahlungsmethode zurückgebucht.
            Die Gutschrift erscheint in der Regel innerhalb von <strong>5–10 Werktagen</strong> auf deinem Kontoauszug.
          </p>
        </div>
      </div>
      {_email_footer(f"Du erhältst diese E-Mail weil du eine Buchung bei {booking.get('studio_name', '')} auf StudioOS hattest.")}
    </div>"""

def studio_cancelled_refund_html(booking: dict) -> str:
    deposit = float(booking.get("offer_deposit_amount") or booking.get("deposit_amount") or 0)
    deposit_str = f"€ {deposit:.2f}"
    date_raw = booking.get("offer_date") or booking.get("date", "")
    try:
        date_fmt = datetime.strptime(date_raw, "%Y-%m-%d").strftime("%d.%m.%Y")
    except Exception:
        date_fmt = date_raw
    time_str = booking.get("offer_time") or booking.get("start_time", "")
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
      {_email_header()}
      <div style="padding:32px 32px 24px;">
        <div style="display:inline-block;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:6px 14px;margin-bottom:20px;">
          <span style="font-size:12px;font-weight:700;color:#dc2626;letter-spacing:0.05em;text-transform:uppercase;">Termin storniert</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 8px;color:#111;letter-spacing:-0.4px;">Dein Termin wurde storniert</h2>
        <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.6;">
          Das Studio <strong style="color:#111;">{booking.get('studio_name', '')}</strong> hat deinen Termin leider storniert.
          Da du bereits eine Anzahlung geleistet hast, wird der Betrag automatisch zurückgebucht.
        </p>
        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;margin-bottom:24px;">
          {_detail_row("Studio", booking.get('studio_name', ''), highlight=True)}
          {_detail_row("Termin", f"{date_fmt}{(' um ' + time_str + ' Uhr') if time_str else ''}")}
          {_detail_row("Rückerstattung", deposit_str)}
          {_detail_row("Buchungs-ID", booking.get('booking_id', ''))}
        </table>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
          <p style="font-size:13px;font-weight:700;color:#15803d;margin:0 0 6px;">💳 Rückerstattung läuft automatisch</p>
          <p style="font-size:13px;color:#166534;margin:0;line-height:1.6;">
            Der Betrag von <strong>{deposit_str}</strong> wird von Stripe auf deine ursprüngliche Zahlungsmethode zurückgebucht.
            Du musst nichts weiter tun. Die Gutschrift erscheint in der Regel innerhalb von <strong>5–10 Werktagen</strong> auf deinem Kontoauszug,
            je nach Bank auch früher.
          </p>
        </div>
        <p style="font-size:13px;color:#888;line-height:1.6;margin:0;">
          Du kannst jederzeit ein neues Angebot bei einem anderen Studio auf StudioOS anfragen.
        </p>
      </div>
      {_email_footer(f"Du erhältst diese E-Mail weil du eine Buchung bei {booking.get('studio_name', '')} auf StudioOS hattest.")}
    </div>"""

def deposit_deadline_cancelled_html(booking: dict) -> str:
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
      {_email_header()}
      <div style="padding:32px 32px 24px;">
        <div style="display:inline-block;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:6px 14px;margin-bottom:20px;">
          <span style="font-size:12px;font-weight:700;color:#dc2626;letter-spacing:0.05em;text-transform:uppercase;">Termin storniert</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 6px;color:#111;letter-spacing:-0.4px;">Dein Termin wurde automatisch storniert</h2>
        <p style="font-size:14px;color:#666;margin:0 0 28px;line-height:1.5;">
          Leider wurde dein Termin storniert, da die Anzahlungsfrist abgelaufen ist. Buche gerne einen neuen Termin.
        </p>
        <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;">
          {_detail_row("Studio", booking.get('studio_name', ''), highlight=True)}
          {_detail_row("Datum", booking.get('date', ''))}
          {_detail_row("Zeit", f"{booking.get('start_time', '')} – {booking.get('end_time', '')}")}
          {_detail_row("Grund", "Anzahlungsfrist nicht eingehalten")}
        </table>
        <div style="margin-top:28px;text-align:center;">
          <a href="#" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:13px;font-weight:700;">Neuen Termin buchen</a>
        </div>
      </div>
      {_email_footer("Fragen? Nutze unseren Support-Chat auf inkbook.de")}
    </div>"""

# ─── Database ────────────────────────────────────────────────────────────────
from memdb import db

app = FastAPI(title="StudioOS API")
api_router = APIRouter(prefix="/api")

# ─── CORS ─────────────────────────────────────────────────────────────────────
_replit_domain = os.environ.get("REPLIT_DEV_DOMAIN", "")
_default_origins = "http://localhost:3000,http://localhost:5000"
if _replit_domain:
    _default_origins += f",https://{_replit_domain}"

def _get_frontend_url() -> str:
    explicit = os.environ.get("FRONTEND_URL", "")
    if explicit:
        return explicit.rstrip("/")
    domain = os.environ.get("REPLIT_DEV_DOMAIN", "")
    if domain:
        return f"https://{domain}"
    return "http://localhost:5000"
_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", os.environ.get("FRONTEND_URL", _default_origins)).split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── PyObjectId ───────────────────────────────────────────────────────────────
def coerce_objectid(v):
    if isinstance(v, ObjectId):
        return str(v)
    return v

PyObjectId = Annotated[str, BeforeValidator(coerce_objectid)]

# ─── Auth helpers ─────────────────────────────────────────────────────────────
JWT_ALGORITHM = "HS256"

_DEFAULT_JWT_SECRET = "inkbook-dev-secret-key-change-in-production"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", _DEFAULT_JWT_SECRET)

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        # Try JWT auth users first
        user = await db.users.find_one({"_id": ObjectId(user_id)}, {"_id": 0, "password_hash": 0})
        if not user:
            # Try Google auth users
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        # Always expose the canonical id (JWT sub = ObjectId string) as "id"
        user["id"] = user_id
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_optional(request: Request):
    try:
        return await get_current_user(request)
    except:
        return None

# ─── Pydantic Models ──────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "customer"  # customer | studio_owner

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class StudioCreate(BaseModel):
    name: str
    description: str
    address: str
    city: str
    country: str = "DE"
    phone: str = ""
    email: str = ""
    website: str = ""
    styles: List[str] = []
    price_range: str = "medium"  # budget | medium | premium | luxury
    images: List[str] = []

class StudioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    styles: Optional[List[str]] = None
    price_range: Optional[str] = None
    images: Optional[List[str]] = None
    deposit_required: Optional[bool] = None
    deposit_amount: Optional[float] = None
    deposit_deadline_hours: Optional[int] = None
    cancellation_hours: Optional[int] = None
    banner_image: Optional[str] = None
    logo_image: Optional[str] = None
    video_consultation_enabled: Optional[bool] = None
    bank_holder: Optional[str] = None
    bank_iban: Optional[str] = None
    bank_bic: Optional[str] = None

class SlotCreate(BaseModel):
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    slot_type: str = "tattoo"  # consultation | tattoo | video_consultation | full_day

class GuestInquiryCreate(BaseModel):
    studio_id: str
    name: str
    email: EmailStr
    tattoo_description: str
    size: Optional[str] = None
    body_part: Optional[str] = None
    reference_images: Optional[List[str]] = []
    wished_date_from: Optional[str] = None   # ISO date "2026-07-01"
    wished_date_to: Optional[str] = None     # ISO date "2026-07-15"
    wished_time: Optional[str] = None        # e.g. "Vormittags" or "10:00"

class CalendarBlockCreate(BaseModel):
    date: str           # ISO date "2026-06-18"
    block_type: str = "busy"   # busy | vacation | limited | private
    note: str = ""
    artist_id: Optional[str] = None  # None = studio-wide block; set = per-artist block
    custom_capacity: Optional[int] = None  # per-day capacity override (None = use studio default)

class ActivateAccountRequest(BaseModel):
    email: EmailStr
    ghost_token: str
    password: str

class BookingCreate(BaseModel):
    studio_id: str
    slot_id: str
    booking_type: str = "tattoo"  # consultation | tattoo | video_consultation
    notes: str = ""
    reference_images: List[str] = []

class ReviewCreate(BaseModel):
    studio_id: str
    rating: int  # 1-5
    comment: str = ""
    booking_id: Optional[str] = None

class MessageCreate(BaseModel):
    recipient_id: str
    content: str
    image_url: Optional[str] = ""
    slot_offer: Optional[Dict[str, Any]] = None

class AIStyleRequest(BaseModel):
    image_base64: Optional[str] = None
    description: str = ""
    language: str = "de"

class PaymentCreateRequest(BaseModel):
    booking_id: str
    origin_url: str

class SubscriptionCheckoutRequest(BaseModel):
    plan: str  # "starter" | "pro" | "full_studio"
    origin_url: str

class ArtistCreate(BaseModel):
    name: str
    bio: str = ""
    styles: List[str] = []
    experience_years: int = 0
    instagram: str = ""
    portfolio_images: List[str] = []
    profile_image: Optional[str] = None
    banner_image: Optional[str] = None

class ArtistUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    styles: Optional[List[str]] = None
    experience_years: Optional[int] = None
    instagram: Optional[str] = None
    portfolio_images: Optional[List[str]] = None
    profile_image: Optional[str] = None
    banner_image: Optional[str] = None

class BookingReschedule(BaseModel):
    new_slot_id: str

class BookingCapacityCreate(BaseModel):
    studio_id: str
    date: str                        # ISO date e.g. "2026-06-15"
    size_category: str               # mini | small | medium | large | xl
    body_part: str = ""              # Körperstelle
    booking_type: str = "tattoo"
    notes: str = ""
    reference_images: List[str] = []
    preferred_time_from: str = ""   # e.g. "09:00"
    preferred_time_to: str = ""     # e.g. "14:00"
    artist_id: Optional[str] = None  # optional preferred artist
    artist_name: str = ""            # display name of the artist

class BookingOffer(BaseModel):
    offer_date: str                  # ISO date "2026-06-18"
    offer_time: str                  # "13:00"
    offer_duration_min: int = 120
    offer_total_price: float
    offer_deposit_amount: float
    offer_notes: str = ""

class InquiryOffer(BaseModel):
    offer_date: str
    offer_time: str
    offer_duration_min: int = 120
    offer_total_price: float
    offer_deposit_amount: float
    offer_notes: str = ""

# Active statuses (used for filtering)
_ACTIVE_STATUSES = [
    "pending_studio_review", "under_review", "offer_sent",
    "waiting_for_deposit", "deposit_pending", "confirmed",
    "pending",  # backward compat
]

class PushSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]

class AdminStudioUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

# ─── Auth Endpoints ───────────────────────────────────────────────────────────
@api_router.post("/auth/register")
async def register(data: UserRegister, response: JSONResponse = None):
    from fastapi.responses import JSONResponse as JR
    import dns.resolver
    email = data.email.lower()
    # Validate that the email domain has MX records (rejects non-existent domains)
    domain = email.split("@")[-1]
    try:
        await asyncio.to_thread(dns.resolver.resolve, domain, "MX")
    except Exception:
        raise HTTPException(status_code=400, detail="E-Mail-Adresse ungültig oder Domain existiert nicht")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": email,
        "password_hash": await asyncio.to_thread(hash_password, data.password),
        "name": data.name,
        "role": data.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "avatar": "",
        "auth_provider": "email"
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    resp = JR(content={
        "id": user_id,
        "email": email,
        "name": data.name,
        "role": data.role,
        "avatar": ""
    })
    resp.set_cookie("access_token", access_token, httponly=True, samesite="lax", max_age=86400, path="/")
    resp.set_cookie("refresh_token", refresh_token, httponly=True, samesite="lax", max_age=604800, path="/")
    return resp

@api_router.post("/auth/login")
async def login(data: UserLogin):
    from fastapi.responses import JSONResponse as JR
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not await asyncio.to_thread(verify_password, data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    resp = JR(content={
        "id": user_id,
        "email": email,
        "name": user.get("name", ""),
        "role": user.get("role", "customer"),
        "avatar": user.get("avatar", "")
    })
    resp.set_cookie("access_token", access_token, httponly=True, samesite="lax", max_age=86400, path="/")
    resp.set_cookie("refresh_token", refresh_token, httponly=True, samesite="lax", max_age=604800, path="/")
    return resp

@api_router.post("/auth/logout")
async def logout():
    from fastapi.responses import JSONResponse as JR
    resp = JR(content={"message": "Logged out"})
    resp.delete_cookie("access_token", path="/")
    resp.delete_cookie("refresh_token", path="/")
    return resp

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.get("/favorites")
async def get_favorites(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"favorites": []}
    return {"favorites": user.get("favorite_studios", [])}

@api_router.get("/favorites/studios")
async def get_favorite_studios(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return []
    fav_ids = user.get("favorite_studios", [])
    studios = []
    for sid in fav_ids:
        s = await db.studios.find_one({"studio_id": sid})
        if s:
            s.pop("_id", None)
            studios.append(s)
    return studios

@api_router.post("/favorites/{studio_id}")
async def add_favorite(studio_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    favs = user.get("favorite_studios", [])
    if studio_id not in favs:
        favs.append(studio_id)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"favorite_studios": favs}})
    return {"status": "added"}

@api_router.delete("/favorites/{studio_id}")
async def remove_favorite(studio_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    favs = [f for f in user.get("favorite_studios", []) if f != studio_id]
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"favorite_studios": favs}})
    return {"status": "removed"}

@api_router.post("/auth/activate")
async def activate_account(data: ActivateAccountRequest):
    from fastapi.responses import JSONResponse as JR
    email = data.email.lower()
    user = await db.users.find_one({"email": email, "is_ghost": True})
    if not user:
        raise HTTPException(status_code=404, detail="Kein Ghost-Account für diese E-Mail gefunden.")
    if data.ghost_token and user.get("ghost_token") and user.get("ghost_token") != data.ghost_token:
        raise HTTPException(status_code=400, detail="Ungültiger Aktivierungstoken.")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Passwort muss mindestens 8 Zeichen haben.")
    pw_hash = await asyncio.to_thread(hash_password, data.password)
    await db.users.update_one(
        {"email": email},
        {"$set": {"password_hash": pw_hash, "is_active": True, "is_ghost": False}}
    )
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    resp = JR(content={
        "id": user_id, "email": email,
        "name": user.get("name", ""), "role": user.get("role", "customer"), "avatar": user.get("avatar", "")
    })
    resp.set_cookie("access_token", access_token, httponly=True, samesite="lax", max_age=86400, path="/")
    resp.set_cookie("refresh_token", refresh_token, httponly=True, samesite="lax", max_age=604800, path="/")
    return resp

@api_router.post("/auth/resend-activation")
async def resend_activation_email(data: dict):
    email = (data.get("email") or "").lower().strip()
    if not email:
        raise HTTPException(status_code=400, detail="E-Mail fehlt.")
    user = await db.users.find_one({"email": email, "is_ghost": True})
    if not user:
        return {"ok": True}
    ghost_token = user.get("ghost_token", "")
    guest_name = user.get("name", "Gast")
    frontend_url = _get_frontend_url()
    activate_url = f"{frontend_url}/activate?email={email}&token={ghost_token}"
    html = f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
      {_email_header()}
      <div style="padding:32px 32px 24px;">
        <h2 style="font-size:22px;font-weight:700;margin:0 0 10px;color:#111;letter-spacing:-0.4px;">Hallo {guest_name}!</h2>
        <p style="font-size:14px;color:#666;margin:0 0 28px;line-height:1.6;">
          Hier ist dein neuer Aktivierungs-Link für dein StudioOS-Konto. Klicke unten, um dein Passwort festzulegen und dein Konto zu aktivieren.
        </p>
        <a href="{activate_url}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:-0.2px;">
          Konto aktivieren →
        </a>
        <p style="font-size:12px;color:#aaa;margin:24px 0 0;line-height:1.6;">
          Oder kopiere diesen Link in deinen Browser:<br/>
          <a href="{activate_url}" style="color:#666;word-break:break-all;">{activate_url}</a>
        </p>
      </div>
      {_email_footer("Du erhältst diese E-Mail, weil du eine Anfrage über StudioOS gestellt hast.")}
    </div>"""
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"activation_email_sent": True}}
    )
    asyncio.create_task(send_email(email, "Dein StudioOS Aktivierungs-Link", html))
    return {"ok": True, "activate_url": activate_url}

@api_router.post("/inquiries")
async def create_guest_inquiry(data: GuestInquiryCreate):
    import secrets as secrets_mod
    email = data.email.lower().strip()

    studio = await db.studios.find_one({"studio_id": data.studio_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio nicht gefunden.")

    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        user_id = str(existing_user["_id"])
        user_name = existing_user.get("name", data.name)
        ghost_token = existing_user.get("ghost_token", "")
    else:
        ghost_token = secrets_mod.token_urlsafe(32)
        user_doc = {
            "email": email,
            "name": data.name,
            "password_hash": None,
            "role": "customer",
            "is_ghost": True,
            "is_active": False,
            "ghost_token": ghost_token,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "avatar": "",
            "auth_provider": "email",
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        user_name = data.name

    inquiry_id = f"inq_{uuid.uuid4().hex[:12]}"
    inquiry = {
        "inquiry_id": inquiry_id,
        "user_id": user_id,
        "user_name": user_name,
        "user_email": email,
        "studio_id": data.studio_id,
        "studio_name": studio.get("name", ""),
        "tattoo_description": data.tattoo_description,
        "size": data.size,
        "body_part": data.body_part,
        "reference_images": data.reference_images or [],
        "wished_date_from": data.wished_date_from,
        "wished_date_to": data.wished_date_to,
        "wished_time": data.wished_time,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.inquiries.insert_one(inquiry)
    return {"inquiry_id": inquiry_id, "status": "sent"}

@api_router.get("/studios/{studio_id}/inquiries")
async def get_studio_inquiries(studio_id: str, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio nicht gefunden.")
    owner_id = current_user.get("id") or current_user.get("user_id")
    if studio.get("owner_id") != owner_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Nicht berechtigt.")
    items = await db.inquiries.find({"studio_id": studio_id}).sort("created_at", -1).to_list(200)
    return items

@api_router.delete("/inquiries/{inquiry_id}")
async def delete_inquiry(inquiry_id: str, body: dict = None, current_user: dict = Depends(get_current_user)):
    if body is None:
        body = {}
    inquiry = await db.inquiries.find_one({"inquiry_id": inquiry_id})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Anfrage nicht gefunden.")
    studio = await db.studios.find_one({"studio_id": inquiry.get("studio_id")})
    owner_id = current_user.get("id") or current_user.get("user_id")
    if not studio or (studio.get("owner_id") != owner_id and current_user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Nicht berechtigt.")

    reason = body.get("reason", "").strip()
    guest_email = inquiry.get("user_email", "")
    guest_name = inquiry.get("user_name", "Gast")
    studio_name = studio.get("name", "Das Studio")
    frontend_url = _get_frontend_url()

    await db.inquiries.delete_one({"inquiry_id": inquiry_id})

    if guest_email:
        reason_block = f"""
          <div style="background:#fafafa;border-left:3px solid #d1d5db;padding:14px 18px;border-radius:6px;margin:20px 0;">
            <p style="font-size:12px;color:#888;margin:0 0 4px;font-family:'Helvetica Neue',Arial,sans-serif;text-transform:uppercase;letter-spacing:0.06em;">Grund</p>
            <p style="font-size:14px;color:#444;margin:0;font-family:'Helvetica Neue',Arial,sans-serif;line-height:1.6;">"{reason}"</p>
          </div>""" if reason else ""
        html = f"""
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
          {_email_header()}
          <div style="padding:32px 32px 24px;">
            <div style="display:inline-block;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:6px 14px;margin-bottom:20px;">
              <span style="font-size:12px;font-weight:700;color:#991b1b;letter-spacing:0.05em;text-transform:uppercase;">Anfrage abgelehnt</span>
            </div>
            <h2 style="font-size:22px;font-weight:700;margin:0 0 10px;color:#111;letter-spacing:-0.4px;">Hallo {guest_name},</h2>
            <p style="font-size:15px;color:#444;margin:0 0 8px;line-height:1.6;">
              leider kann <strong style="color:#111;">{studio_name}</strong> deine Tattoo-Anfrage derzeit nicht annehmen.
            </p>
            {reason_block}
            <p style="font-size:14px;color:#666;margin:16px 0 28px;line-height:1.6;">
              Schau dir gerne andere Studios auf StudioOS an — vielleicht ist das Richtige dabei.
            </p>
            <a href="{frontend_url}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:-0.2px;">
              Andere Studios entdecken →
            </a>
          </div>
          {_email_footer("Du erhältst diese E-Mail, weil du eine Anfrage über StudioOS gestellt hast.")}
        </div>"""
        asyncio.create_task(send_email(guest_email, f"Deine Anfrage bei {studio_name}", html))

    return {"deleted": True, "inquiry_id": inquiry_id}

@api_router.patch("/inquiries/{inquiry_id}/status")
async def update_inquiry_status(inquiry_id: str, body: dict, current_user: dict = Depends(get_current_user)):
    inquiry = await db.inquiries.find_one({"inquiry_id": inquiry_id})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Anfrage nicht gefunden.")
    studio = await db.studios.find_one({"studio_id": inquiry.get("studio_id")})
    owner_id = current_user.get("id") or current_user.get("user_id")
    if not studio or (studio.get("owner_id") != owner_id and current_user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Nicht berechtigt.")
    updates = {}
    if "status" in body:
        updates["status"] = body["status"]
    if "hidden" in body:
        updates["hidden"] = bool(body["hidden"])
    if updates:
        await db.inquiries.update_one({"inquiry_id": inquiry_id}, {"$set": updates})
    result = {"inquiry_id": inquiry_id}
    result.update(updates)
    return result

@api_router.post("/inquiries/{inquiry_id}/offer")
async def create_inquiry_offer(inquiry_id: str, offer: InquiryOffer, current_user: dict = Depends(get_current_user)):
    """Studio creates an offer for a guest inquiry → creates a booking + sends activation email to guest."""
    inquiry = await db.inquiries.find_one({"inquiry_id": inquiry_id})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Anfrage nicht gefunden")

    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"studio_id": inquiry.get("studio_id")})
    if not studio or studio.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")

    if inquiry.get("status") == "offer_sent":
        raise HTTPException(status_code=400, detail="Für diese Anfrage wurde bereits ein Angebot gesendet")

    # Resolve ghost account for this inquiry
    guest_user_id = inquiry.get("user_id", "")
    ghost_user = None
    if guest_user_id:
        try:
            ghost_user = await db.users.find_one({"_id": ObjectId(guest_user_id)})
        except Exception:
            ghost_user = await db.users.find_one({"user_id": guest_user_id})

    ghost_token = ghost_user.get("ghost_token", "") if ghost_user else ""
    guest_email = inquiry.get("user_email", "")
    guest_name = inquiry.get("user_name", "Gast")
    studio_name = studio.get("name", "Studio")
    studio_owner_id = studio.get("owner_id", "")

    platform_fee_pct = 5.0
    platform_fee_amount = round(offer.offer_deposit_amount * platform_fee_pct / 100, 2)

    # Dynamic deadline based on appointment date
    offer_deadline_dt, offer_deadline_min, offer_deadline_label = _calc_offer_deadline(offer.offer_date)
    offer_deadline_at = offer_deadline_dt.isoformat()

    # Create a proper booking from the inquiry so the full offer→deposit→confirm flow works
    booking_doc = {
        "booking_id": f"book_{uuid.uuid4().hex[:12]}",
        "user_id": guest_user_id,
        "user_name": guest_name,
        "user_email": guest_email,
        "studio_id": inquiry.get("studio_id", ""),
        "studio_name": studio_name,
        "slot_id": None,
        "date": offer.offer_date,
        "start_time": offer.offer_time,
        "end_time": None,
        "booking_type": "tattoo",
        "size_category": inquiry.get("size", ""),
        "body_part": inquiry.get("body_part", ""),
        "notes": inquiry.get("tattoo_description", ""),
        "reference_images": inquiry.get("reference_images", []),
        "status": "offer_sent",
        "payment_status": "unpaid",
        "deposit_required": True,
        "deposit_amount": offer.offer_deposit_amount,
        "offer_date": offer.offer_date,
        "offer_time": offer.offer_time,
        "offer_duration_min": offer.offer_duration_min,
        "offer_total_price": offer.offer_total_price,
        "offer_deposit_amount": offer.offer_deposit_amount,
        "offer_notes": offer.offer_notes,
        "platform_fee_pct": platform_fee_pct,
        "platform_fee_amount": platform_fee_amount,
        "offer_created_at": datetime.now(timezone.utc).isoformat(),
        "deposit_deadline_at": offer_deadline_at,
        "offer_deadline_label": offer_deadline_label,
        "inquiry_id": inquiry_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookings.insert_one(booking_doc)

    # Mark inquiry as offer_sent and link to the new booking
    await db.inquiries.update_one(
        {"inquiry_id": inquiry_id},
        {"$set": {"status": "offer_sent", "booking_id": booking_doc["booking_id"]}}
    )

    # Send branded offer + activation email to guest
    if guest_email:
        try:
            date_fmt = datetime.strptime(offer.offer_date, "%Y-%m-%d").strftime("%d.%m.%Y")
        except Exception:
            date_fmt = offer.offer_date
        frontend_url = _get_frontend_url()
        activate_url = (
            f"{frontend_url}/activate?email={guest_email}&token={ghost_token}"
            if ghost_token else f"{frontend_url}/login"
        )
        html = guest_offer_email_html(
            guest_name=guest_name,
            studio_name=studio_name,
            date_fmt=date_fmt,
            offer_time=offer.offer_time,
            offer_duration_min=offer.offer_duration_min,
            offer_total_price=offer.offer_total_price,
            offer_deposit_amount=offer.offer_deposit_amount,
            offer_notes=offer.offer_notes,
            tattoo_desc=inquiry.get("tattoo_description", ""),
            activate_url=activate_url,
            offer_deadline_label=offer_deadline_label,
        )
        asyncio.create_task(send_email(
            to=guest_email,
            subject=f"⏳ Dein Tattoo-Angebot von {studio_name} – {offer_deadline_label} zum Annehmen",
            html=html,
        ))

    # Also mark ghost user's activation_email_sent so we don't re-send the generic activation
    if ghost_user:
        try:
            await db.users.update_one(
                {"_id": ObjectId(guest_user_id)},
                {"$set": {"activation_email_sent": True}}
            )
        except Exception:
            pass

    booking_doc.pop("_id", None)
    return {"message": "Angebot an Gast gesendet", "booking_id": booking_doc["booking_id"]}

# ── User Profile ─────────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@api_router.put("/users/me")
async def update_profile(data: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name darf nicht leer sein")
    user_id = current_user["id"]
    await db.users.update_one({"_id": user_id}, {"$set": {"name": name}})
    return {**current_user, "name": name}

@api_router.put("/users/me/password")
async def change_password(data: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Benutzer nicht gefunden")
    if not user.get("password_hash"):
        raise HTTPException(status_code=400, detail="Passwort-Änderung nicht möglich (Social Login)")
    ok = await asyncio.to_thread(verify_password, data.current_password, user["password_hash"])
    if not ok:
        raise HTTPException(status_code=400, detail="Aktuelles Passwort ist falsch")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Neues Passwort muss mindestens 8 Zeichen haben")
    new_hash = await asyncio.to_thread(hash_password, data.new_password)
    await db.users.update_one({"_id": user_id}, {"$set": {"password_hash": new_hash}})
    return {"message": "Passwort erfolgreich geändert"}

@api_router.delete("/users/me")
async def delete_account(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    await db.bookings.delete_many({"user_id": user_id})
    await db.users.delete_one({"_id": user_id})
    from fastapi.responses import JSONResponse as JR
    resp = JR(content={"message": "Konto erfolgreich gelöscht"})
    resp.delete_cookie("access_token", path="/")
    resp.delete_cookie("refresh_token", path="/")
    return resp

# ── Password Reset ──────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    email = data.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 1, "name": 1})
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "Falls diese E-Mail existiert, wurde ein Reset-Link gesendet."}

    # Invalidate old tokens for this user
    await db.password_reset_tokens.delete_many({"user_id": str(user["_id"])})

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": str(user["_id"]),
        "email": email,
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.now(timezone.utc),
    })

    frontend_url = _get_frontend_url()
    reset_link = f"{frontend_url}/reset-password?token={token}"
    name = user.get("name", "")

    html = f"""
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:40px 32px;background:#ffffff;border-radius:16px;">
      <div style="margin-bottom:32px;">
        <span style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0a0a0a;letter-spacing:-0.5px;">StudioOS</span>
      </div>
      <h2 style="font-size:20px;font-weight:600;color:#0a0a0a;margin:0 0 12px;">Passwort zurücksetzen</h2>
      <p style="font-size:15px;color:#52525b;line-height:1.6;margin:0 0 28px;">
        Hallo{' ' + name if name else ''},<br><br>
        du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button, um ein neues Passwort zu vergeben.
      </p>
      <a href="{reset_link}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:14px;font-weight:600;letter-spacing:0.01em;">
        Passwort zurücksetzen
      </a>
      <p style="font-size:13px;color:#a1a1aa;margin-top:28px;line-height:1.5;">
        Dieser Link ist <strong>1 Stunde</strong> gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
      </p>
      <hr style="border:none;border-top:1px solid #f4f4f5;margin:28px 0;" />
      <p style="font-size:12px;color:#d4d4d8;margin:0;">StudioOS · Tattoo Booking Platform</p>
    </div>
    """
    asyncio.create_task(send_email(email, "Dein StudioOS Passwort zurücksetzen", html))
    # Always log the link so it works even when email delivery is restricted
    logger.info(f"[PASSWORD RESET] Link for {email}: {reset_link}")
    return {"message": "Falls diese E-Mail existiert, wurde ein Reset-Link gesendet.", "reset_url": reset_link}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    record = await db.password_reset_tokens.find_one({"token": data.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Ungültiger oder bereits verwendeter Link.")

    if datetime.now(timezone.utc) > record["expires_at"].replace(tzinfo=timezone.utc) if record["expires_at"].tzinfo is None else datetime.now(timezone.utc) > record["expires_at"]:
        raise HTTPException(status_code=400, detail="Dieser Link ist abgelaufen. Bitte fordere einen neuen an.")

    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": ObjectId(record["user_id"])},
        {"$set": {"password_hash": new_hash}}
    )
    await db.password_reset_tokens.update_one({"token": data.token}, {"$set": {"used": True}})
    return {"message": "Passwort erfolgreich geändert. Du kannst dich jetzt anmelden."}

# Google OAuth (Emergent-managed)
class GoogleSessionRequest(BaseModel):
    session_id: str

@api_router.post("/auth/google/session")
async def google_session(data: GoogleSessionRequest):
    from fastapi.responses import JSONResponse as JR
    async with httpx.AsyncClient() as client_http:
        r = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id}
        )
        if r.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session")
        session_data = r.json()
    
    email = session_data["email"].lower()
    existing = await db.users.find_one({"email": email})
    
    if existing:
        user_id = str(existing["_id"])
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": session_data.get("name", ""), "avatar": session_data.get("picture", ""), "auth_provider": "google"}}
        )
        role = existing.get("role", "customer")
        name = session_data.get("name", existing.get("name", ""))
    else:
        user_doc = {
            "email": email,
            "name": session_data.get("name", ""),
            "avatar": session_data.get("picture", ""),
            "role": "customer",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "auth_provider": "google"
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        role = "customer"
        name = session_data.get("name", "")
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    resp = JR(content={
        "id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "avatar": session_data.get("picture", "")
    })
    resp.set_cookie("access_token", access_token, httponly=True, samesite="lax", max_age=86400, path="/")
    resp.set_cookie("refresh_token", refresh_token, httponly=True, samesite="lax", max_age=604800, path="/")
    return resp

# ─── Studios ──────────────────────────────────────────────────────────────────
@api_router.get("/studios")
async def list_studios(
    city: Optional[str] = None,
    style: Optional[str] = None,
    price_range: Optional[str] = None,
    min_rating: Optional[float] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200
):
    query: Dict[str, Any] = {"is_active": {"$ne": False}}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if style:
        query["styles"] = {"$elemMatch": {"$regex": f"^{style}$", "$options": "i"}}
    if price_range:
        query["price_range"] = price_range
    if min_rating:
        query["avg_rating"] = {"$gte": min_rating}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}}
        ]

    studios = await db.studios.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return studios

@api_router.get("/studios/{studio_id}")
async def get_studio(studio_id: str, request: Request = None):
    studio = await db.studios.find_one({"studio_id": studio_id}, {"_id": 0})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    # Record page view asynchronously (fire-and-forget)
    async def _record_view():
        try:
            await db.studio_page_views.insert_one({
                "studio_id": studio_id,
                "viewed_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception:
            pass
    asyncio.create_task(_record_view())
    return studio


@api_router.get("/studios/{studio_id}/analytics")
async def get_studio_analytics(studio_id: str, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio nicht gefunden")
    owner_id = current_user.get("id") or current_user.get("user_id")
    if studio.get("owner_id") != owner_id and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Nicht berechtigt")

    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()

    page_views = await db.studio_page_views.count_documents({
        "studio_id": studio_id,
        "viewed_at": {"$gte": thirty_days_ago},
    })
    inquiries_received = await db.inquiries.count_documents({
        "studio_id": studio_id,
        "created_at": {"$gte": thirty_days_ago},
    })
    bookings_confirmed = await db.bookings.count_documents({
        "studio_id": studio_id,
        "status": {"$in": ["confirmed", "completed"]},
        "created_at": {"$gte": thirty_days_ago},
    })

    view_to_inquiry = round(inquiries_received / page_views * 100, 1) if page_views > 0 else 0
    inquiry_to_booking = round(bookings_confirmed / inquiries_received * 100, 1) if inquiries_received > 0 else 0

    return {
        "page_views": page_views,
        "inquiries_received": inquiries_received,
        "bookings_confirmed": bookings_confirmed,
        "view_to_inquiry_pct": view_to_inquiry,
        "inquiry_to_booking_pct": inquiry_to_booking,
    }

@api_router.post("/studios")
async def create_studio(data: StudioCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["studio_owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only studio owners can create studios")
    
    existing = await db.studios.find_one({"owner_id": current_user.get("id") or current_user.get("user_id")})
    if existing:
        raise HTTPException(status_code=400, detail="You already have a studio")
    
    studio_id = f"studio_{uuid.uuid4().hex[:12]}"
    owner_id = current_user.get("id") or current_user.get("user_id")
    studio_doc = {
        "studio_id": studio_id,
        "owner_id": owner_id,
        "owner_name": current_user.get("name", ""),
        **data.model_dump(),
        "avg_rating": 0.0,
        "review_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_verified": False,
        "is_active": True
    }
    await db.studios.insert_one(studio_doc)
    studio_doc.pop("_id", None)
    return studio_doc

@api_router.put("/studios/{studio_id}")
async def update_studio(studio_id: str, data: StudioUpdate, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    owner_id = current_user.get("id") or current_user.get("user_id")
    if not studio or (studio.get("owner_id") != owner_id and current_user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.studios.update_one({"studio_id": studio_id}, {"$set": update_data})
    return {"message": "Studio updated"}

@api_router.get("/studios/{studio_id}/reviews")
async def get_studio_reviews(studio_id: str):
    reviews = await db.reviews.find({"studio_id": studio_id}, {"_id": 0}).to_list(100)
    return reviews

@api_router.post("/studios/{studio_id}/reviews")
async def create_review(studio_id: str, data: ReviewCreate, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    user_id = current_user.get("id") or current_user.get("user_id")

    # Check if booking_id is already reviewed
    booking_id = getattr(data, "booking_id", None)
    if booking_id:
        existing = await db.reviews.find_one({"booking_id": booking_id})
        if existing:
            raise HTTPException(status_code=400, detail="Already reviewed this booking")
    else:
        existing = await db.reviews.find_one({"studio_id": studio_id, "user_id": user_id})
        if existing:
            raise HTTPException(status_code=400, detail="Already reviewed this studio")

    review_doc = {
        "review_id": f"rev_{uuid.uuid4().hex[:12]}",
        "studio_id": studio_id,
        "booking_id": booking_id,
        "user_id": user_id,
        "user_name": current_user.get("name", "Anonymous"),
        "rating": data.rating,
        "comment": data.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)

    all_reviews = await db.reviews.find({"studio_id": studio_id}).to_list(1000)
    avg = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await db.studios.update_one({"studio_id": studio_id}, {"$set": {"avg_rating": round(avg, 1), "review_count": len(all_reviews)}})

    review_doc.pop("_id", None)
    return review_doc

@api_router.get("/reviews/my-reviewed-bookings")
async def get_my_reviewed_bookings(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    reviews = await db.reviews.find({"user_id": user_id, "booking_id": {"$exists": True, "$ne": None}}, {"_id": 0, "booking_id": 1}).to_list(1000)
    return [r["booking_id"] for r in reviews if r.get("booking_id")]

# ─── Slots / Availability ─────────────────────────────────────────────────────
@api_router.get("/studios/{studio_id}/slots")
async def get_slots(studio_id: str, date: Optional[str] = None, slot_type: Optional[str] = None):
    query: Dict[str, Any] = {"studio_id": studio_id, "is_booked": False}
    if date:
        query["date"] = date
    if slot_type and slot_type != "full_day":
        if slot_type == "video_consultation":
            # Video consultations are flexible – any open slot works
            pass
        else:
            query["slot_type"] = {"$in": [slot_type, "full_day"]}
    slots = await db.slots.find(query, {"_id": 0}).to_list(200)
    return slots

@api_router.get("/studios/{studio_id}/available-dates")
async def get_available_dates(studio_id: str, year: int, month: int, slot_type: Optional[str] = None):
    """Returns dates within a given month that have at least one free slot matching the type."""
    import calendar as cal_mod
    first_day = f"{year}-{month:02d}-01"
    last_day_num = cal_mod.monthrange(year, month)[1]
    last_day = f"{year}-{month:02d}-{last_day_num:02d}"
    today_iso = datetime.now(timezone.utc).date().isoformat()
    from_date = max(first_day, today_iso)
    match_filter: Dict[str, Any] = {
        "studio_id": studio_id, "is_booked": False,
        "date": {"$gte": from_date, "$lte": last_day}
    }
    if slot_type and slot_type != "full_day":
        if slot_type == "video_consultation":
            # Video consultations can use any available slot
            pass
        else:
            match_filter["slot_type"] = {"$in": [slot_type, "full_day"]}
    pipeline = [
        {"$match": match_filter},
        {"$group": {"_id": "$date"}},
        {"$sort": {"_id": 1}}
    ]
    result = await db.slots.aggregate(pipeline).to_list(100)
    return {"available_dates": [r["_id"] for r in result]}

# ─── Booking system-message helper ───────────────────────────────────────────
async def _post_system_message(customer_id: str, studio_owner_id: str, text: str, triggered_by_id: str = None):
    """Inserts an automated StudioOS system message in the customer↔studio conversation.
    triggered_by_id: the user_id of whoever triggered the action (determines left/right alignment in chat)."""
    if not customer_id or not studio_owner_id:
        return
    participants = sorted([customer_id, studio_owner_id])
    conv_id = f"conv_{'_'.join(participants)}"
    msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "sender_id": "inkbook_system",
        "sender_name": "StudioOS",
        "recipient_id": customer_id,
        "content": text,
        "image_url": None,
        "slot_offer": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False,
        "is_system": True,
        "conv_id": conv_id,
        "triggered_by_id": triggered_by_id,
    }
    await db.messages.insert_one(msg_doc)

    # Find existing conversation by participants (handles old docs where conv_id may be None)
    all_user_convs = await db.conversations.find({"participants": participants[0]}).to_list(200)
    existing_conv = next(
        (c for c in all_user_convs if set(c.get("participants", [])) == set(participants)),
        None
    )
    filter_dict = {"_id": existing_conv["_id"]} if existing_conv else {"conv_id": conv_id}
    await db.conversations.update_one(
        filter_dict,
        {"$set": {
            "conv_id": conv_id,
            "participants": participants,
            "last_message": text,
            "last_message_at": datetime.now(timezone.utc).isoformat(),
            "last_sender_id": "inkbook_system",
        },
        "$unset": {"deleted_by": ""}},
        upsert=True
    )

# ─── Capacity Calendar ────────────────────────────────────────────────────────
_SIZE_CAPACITY: Dict[str, int] = {"mini": 1, "small": 2, "medium": 3, "large": 5, "xl": 8}
_DAY_CAPACITY = 8

@api_router.get("/studios/{studio_id}/capacity-calendar")
async def get_capacity_calendar(studio_id: str, year: int, month: int, artist_id: Optional[str] = None):
    """Returns per-day capacity status for a studio in a given month, merging manual blocks.
    If artist_id is provided, filters by that artist's bookings and blocks (plus studio-wide blocks)."""
    import calendar as cal_mod
    first_day = f"{year}-{month:02d}-01"
    last_day_num = cal_mod.monthrange(year, month)[1]
    last_day = f"{year}-{month:02d}-{last_day_num:02d}"
    today_iso = datetime.now(timezone.utc).date().isoformat()
    from_date = max(first_day, today_iso)

    # Use studio's custom day_capacity if set
    studio_doc = await db.studios.find_one({"studio_id": studio_id}, {"slots_visible_until": 1, "day_capacity": 1})
    studio_day_cap: int = int(studio_doc.get("day_capacity") or _DAY_CAPACITY) if studio_doc else _DAY_CAPACITY

    booking_query: Dict[str, Any] = {
        "studio_id": studio_id,
        "date": {"$gte": from_date, "$lte": last_day},
        "status": {"$in": _ACTIVE_STATUSES},
        "capacity_cost": {"$exists": True}
    }
    if artist_id:
        booking_query["artist_id"] = artist_id

    bookings = await db.bookings.find(booking_query).to_list(500)

    used_by_date: Dict[str, int] = {}
    for b in bookings:
        d = b.get("date", "")
        used_by_date[d] = used_by_date.get(d, 0) + int(b.get("capacity_cost", 0))

    # Load manual calendar blocks for this month.
    # When artist_id is given: merge studio-wide blocks (artist_id=null) with artist-specific ones.
    # Artist-specific blocks take priority over studio-wide blocks.
    if artist_id:
        all_blocks_list = await db.calendar_blocks.find({
            "studio_id": studio_id,
            "date": {"$gte": first_day, "$lte": last_day},
            "$or": [{"artist_id": artist_id}, {"artist_id": None}, {"artist_id": {"$exists": False}}]
        }).to_list(200)
        manual_blocks: Dict[str, dict] = {}
        for b in all_blocks_list:
            if not b.get("artist_id"):
                manual_blocks[b["date"]] = {"block_type": b["block_type"], "note": b.get("note", ""), "custom_capacity": b.get("custom_capacity")}
        for b in all_blocks_list:
            if b.get("artist_id") == artist_id:
                manual_blocks[b["date"]] = {"block_type": b["block_type"], "note": b.get("note", ""), "custom_capacity": b.get("custom_capacity")}
    else:
        manual_blocks_list = await db.calendar_blocks.find({
            "studio_id": studio_id,
            "date": {"$gte": first_day, "$lte": last_day},
            "$or": [{"artist_id": None}, {"artist_id": {"$exists": False}}]
        }).to_list(100)
        manual_blocks = {b["date"]: {"block_type": b["block_type"], "note": b.get("note", ""), "custom_capacity": b.get("custom_capacity")} for b in manual_blocks_list}

    from datetime import date as date_type
    from_obj = datetime.strptime(from_date, "%Y-%m-%d").date()
    last_obj = datetime.strptime(last_day, "%Y-%m-%d").date()

    result: Dict[str, Any] = {}
    current = from_obj
    while current <= last_obj:
        iso = current.isoformat()
        used = used_by_date.get(iso, 0)
        if iso in manual_blocks:
            blk = manual_blocks[iso]
            btype = blk["block_type"]
            note = blk["note"]
            # Per-day capacity override (from block's custom_capacity, else studio default)
            effective_cap = int(blk["custom_capacity"]) if blk.get("custom_capacity") else studio_day_cap
            if btype in ("busy", "private", "full"):
                status = "full"
                remaining = 0
            elif btype == "vacation":
                status = "vacation"
                remaining = 0
            elif btype == "small_only":
                status = "small_only"
                remaining = max(0, min(2, effective_cap) - used)
            elif btype == "available":
                status = "available"
                remaining = max(0, effective_cap - used)
            else:  # "limited"
                status = "limited"
                remaining = max(0, min(4, effective_cap) - used)
            result[iso] = {"used": used, "remaining": remaining, "status": status, "block_type": btype, "note": note, "effective_cap": effective_cap, "custom_capacity": blk.get("custom_capacity")}
        else:
            effective_cap = studio_day_cap
            remaining = effective_cap - used
            if remaining <= 0:
                status = "full"
            elif remaining <= 2:
                status = "small_only"
            elif remaining <= 4:
                status = "limited"
            else:
                status = "available"
            result[iso] = {"used": used, "remaining": remaining, "status": status, "note": "", "effective_cap": effective_cap}
        current += timedelta(days=1)

    slots_visible_until = studio_doc.get("slots_visible_until") if studio_doc else None
    return {"dates": result, "day_capacity": studio_day_cap, "size_capacity": _SIZE_CAPACITY, "slots_visible_until": slots_visible_until}

@api_router.put("/studios/my/day-capacity")
async def set_day_capacity(data: dict, current_user: dict = Depends(get_current_user)):
    """Set studio's global daily capacity in points."""
    owner_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"owner_id": owner_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    cap = data.get("day_capacity")
    if cap is None or int(cap) < 1 or int(cap) > 200:
        raise HTTPException(status_code=400, detail="Ungültige Kapazität (1–200 Punkte)")
    await db.studios.update_one({"owner_id": owner_id}, {"$set": {"day_capacity": int(cap)}})
    return {"day_capacity": int(cap)}

@api_router.put("/studios/my/visibility-cutoff")
async def set_visibility_cutoff(data: dict, current_user: dict = Depends(get_current_user)):
    owner_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"owner_id": owner_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    cutoff = data.get("slots_visible_until")
    await db.studios.update_one({"studio_id": studio["studio_id"]}, {"$set": {"slots_visible_until": cutoff}})
    return {"slots_visible_until": cutoff}

@api_router.post("/studios/{studio_id}/slots")
async def create_slot(studio_id: str, data: SlotCreate, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    owner_id = current_user.get("id") or current_user.get("user_id")
    if not studio or (studio.get("owner_id") != owner_id and current_user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    slot_doc = {
        "slot_id": f"slot_{uuid.uuid4().hex[:12]}",
        "studio_id": studio_id,
        **data.model_dump(),
        "is_booked": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.slots.insert_one(slot_doc)
    slot_doc.pop("_id", None)
    return slot_doc

@api_router.delete("/studios/{studio_id}/slots/{slot_id}")
async def delete_slot(studio_id: str, slot_id: str, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    owner_id = current_user.get("id") or current_user.get("user_id")
    if not studio or studio.get("owner_id") != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.slots.delete_one({"slot_id": slot_id, "studio_id": studio_id})
    return {"message": "Slot deleted"}

# ─── Calendar Blocks (manual studio blocking) ─────────────────────────────────
_BLOCK_TYPE_LABELS = {
    "busy":       "Belegt",
    "vacation":   "Urlaub",
    "limited":    "Begrenzt",
    "private":    "Privat",
    "full":       "Ausgebucht",
    "small_only": "Nur klein",
    "available":  "Verfügbar",
}

@api_router.get("/studios/{studio_id}/calendar-blocks")
async def get_calendar_blocks(studio_id: str, artist_id: Optional[str] = None):
    query: Dict[str, Any] = {"studio_id": studio_id}
    if artist_id:
        query["artist_id"] = artist_id
    else:
        query["$or"] = [{"artist_id": None}, {"artist_id": {"$exists": False}}]
    blocks = await db.calendar_blocks.find(query).sort("date", 1).to_list(500)
    for b in blocks:
        b.pop("_id", None)
    return blocks

@api_router.post("/studios/{studio_id}/calendar-blocks")
async def create_calendar_block(studio_id: str, data: CalendarBlockCreate, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    owner_id = current_user.get("id") or current_user.get("user_id")
    if not studio or studio.get("owner_id") != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if data.block_type not in _BLOCK_TYPE_LABELS:
        raise HTTPException(status_code=400, detail="Ungültiger Blocktyp")
    # Remove any existing block for this date + artist combination
    del_query: Dict[str, Any] = {"studio_id": studio_id, "date": data.date}
    if data.artist_id:
        del_query["artist_id"] = data.artist_id
    else:
        del_query["$or"] = [{"artist_id": None}, {"artist_id": {"$exists": False}}]
    await db.calendar_blocks.delete_many(del_query)
    block_doc = {
        "block_id": f"blk_{uuid.uuid4().hex[:12]}",
        "studio_id": studio_id,
        "date": data.date,
        "block_type": data.block_type,
        "note": data.note,
        "artist_id": data.artist_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if data.custom_capacity is not None and data.custom_capacity > 0:
        block_doc["custom_capacity"] = int(data.custom_capacity)
    await db.calendar_blocks.insert_one(block_doc)
    block_doc.pop("_id", None)
    return block_doc

@api_router.delete("/studios/{studio_id}/calendar-blocks/{block_id}")
async def delete_calendar_block(studio_id: str, block_id: str, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    owner_id = current_user.get("id") or current_user.get("user_id")
    if not studio or studio.get("owner_id") != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.calendar_blocks.delete_one({"block_id": block_id, "studio_id": studio_id})
    return {"message": "Block gelöscht"}

# ─── Bookings ─────────────────────────────────────────────────────────────────
@api_router.post("/bookings/capacity")
async def create_capacity_booking(data: BookingCapacityCreate, current_user: dict = Depends(get_current_user)):
    """Creates a booking without a specific slot — studio confirms the time later."""
    if data.size_category not in _SIZE_CAPACITY:
        raise HTTPException(status_code=400, detail="Ungültige Tattoo-Größe")
    studio = await db.studios.find_one({"studio_id": data.studio_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")

    capacity_cost = _SIZE_CAPACITY[data.size_category]

    # Use studio's custom day_capacity if set
    studio_day_cap: int = int(studio.get("day_capacity") or _DAY_CAPACITY)

    # Check capacity for the requested day — per-artist if artist_id provided
    booking_filter: Dict[str, Any] = {
        "studio_id": data.studio_id,
        "date": data.date,
        "status": {"$in": _ACTIVE_STATUSES},
        "capacity_cost": {"$exists": True}
    }
    if data.artist_id:
        booking_filter["artist_id"] = data.artist_id
    existing = await db.bookings.find(booking_filter).to_list(100)
    used = sum(int(b.get("capacity_cost", 0)) for b in existing)
    remaining = studio_day_cap - used

    # Apply manual calendar block cap — artist-specific block takes priority over studio-wide
    if data.artist_id:
        manual_block = await db.calendar_blocks.find_one({
            "studio_id": data.studio_id, "date": data.date, "artist_id": data.artist_id
        })
        if not manual_block:
            manual_block = await db.calendar_blocks.find_one({
                "studio_id": data.studio_id, "date": data.date,
                "$or": [{"artist_id": None}, {"artist_id": {"$exists": False}}]
            })
    else:
        manual_block = await db.calendar_blocks.find_one({
            "studio_id": data.studio_id, "date": data.date,
            "$or": [{"artist_id": None}, {"artist_id": {"$exists": False}}]
        })
    if manual_block:
        btype = manual_block.get("block_type", "")
        effective_cap = int(manual_block.get("custom_capacity") or studio_day_cap)
        remaining = effective_cap - used
        if btype in ("busy", "private", "full"):
            raise HTTPException(status_code=400, detail="Dieser Tag ist vollständig blockiert.")
        elif btype == "vacation":
            raise HTTPException(status_code=400, detail="Das Studio ist an diesem Tag im Urlaub.")
        elif btype == "small_only":
            remaining = max(0, min(2, effective_cap) - used)
        elif btype == "limited":
            remaining = max(0, min(4, effective_cap) - used)
        # "available" → use effective_cap

    if capacity_cost > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Nicht genug Kapazität. Noch {remaining} von {studio_day_cap} Punkten frei, dein Tattoo benötigt {capacity_cost}."
        )

    user_id = current_user.get("id") or current_user.get("user_id")
    booking_doc = {
        "booking_id": f"book_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "user_name": current_user.get("name", ""),
        "user_email": current_user.get("email", ""),
        "studio_id": data.studio_id,
        "studio_name": studio.get("name", ""),
        "slot_id": None,
        "date": data.date,
        "start_time": None,
        "end_time": None,
        "booking_type": data.booking_type,
        "size_category": data.size_category,
        "body_part": data.body_part,
        "capacity_cost": capacity_cost,
        "notes": data.notes,
        "reference_images": data.reference_images,
        "preferred_time_from": data.preferred_time_from,
        "preferred_time_to": data.preferred_time_to,
        "artist_id": data.artist_id,
        "artist_name": data.artist_name,
        "status": "pending_studio_review",
        "payment_status": "unpaid",
        "deposit_required": studio.get("deposit_required", False),
        "deposit_amount": studio.get("deposit_amount", 50.0),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)

    owner_id = studio.get("owner_id", "")
    time_hint = ""
    if data.preferred_time_from and data.preferred_time_to:
        time_hint = f" · Wunschzeit: {data.preferred_time_from}–{data.preferred_time_to} Uhr"
    elif data.preferred_time_from:
        time_hint = f" · Ab {data.preferred_time_from} Uhr"
    # Auto-create conversation thread with system message
    asyncio.create_task(_post_system_message(
        customer_id=user_id,
        studio_owner_id=owner_id,
        text=f"📩 Anfrage gesendet: {data.size_category.capitalize()}-Tattoo am {data.date}{time_hint}. Das Studio meldet sich in Kürze mit einem Angebot.",
        triggered_by_id=user_id
    ))

    studio_owner = await db.users.find_one({"user_id": owner_id})
    if studio_owner and studio_owner.get("email"):
        asyncio.create_task(send_email(
            to=studio_owner["email"],
            subject=f"Neue Buchungsanfrage – {current_user.get('name','Kunde')} · {data.date}",
            html=booking_confirmation_studio_html(booking_doc)
        ))
    asyncio.create_task(send_push_notification(
        user_id=owner_id,
        title="Neue Buchungsanfrage",
        body=f"{current_user.get('name','Kunde')} hat eine Anfrage für den {data.date} gestellt",
        url="/studio-dashboard"
    ))
    booking_doc.pop("_id", None)
    return booking_doc

@api_router.post("/bookings")
async def create_booking(data: BookingCreate, current_user: dict = Depends(get_current_user)):
    slot = await db.slots.find_one({"slot_id": data.slot_id, "studio_id": data.studio_id})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.get("is_booked"):
        raise HTTPException(status_code=400, detail="Slot already booked")
    
    studio = await db.studios.find_one({"studio_id": data.studio_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    
    user_id = current_user.get("id") or current_user.get("user_id")
    booking_doc = {
        "booking_id": f"book_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "user_name": current_user.get("name", ""),
        "user_email": current_user.get("email", ""),
        "studio_id": data.studio_id,
        "studio_name": studio.get("name", ""),
        "slot_id": data.slot_id,
        "date": slot.get("date"),
        "start_time": slot.get("start_time"),
        "end_time": slot.get("end_time"),
        "booking_type": data.booking_type,
        "notes": data.notes,
        "reference_images": data.reference_images,
        "status": "pending",
        "payment_status": "unpaid",
        "deposit_required": studio.get("deposit_required", False),
        "deposit_amount": studio.get("deposit_amount", 50.0),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)
    await db.slots.update_one({"slot_id": data.slot_id}, {"$set": {"is_booked": True, "booking_id": booking_doc["booking_id"]}})
    
    # Notify studio owner by email
    studio_owner = await db.users.find_one({"user_id": studio.get("owner_id", "")})
    if studio_owner and studio_owner.get("email"):
        asyncio.create_task(send_email(
            to=studio_owner["email"],
            subject=f"Neue Buchungsanfrage – {current_user.get('name','Kunde')} · {slot.get('date','')}",
            html=booking_confirmation_studio_html(booking_doc)
        ))

    # Push notification to studio owner: new booking
    asyncio.create_task(send_push_notification(
        user_id=studio.get("owner_id", ""),
        title="Neue Buchungsanfrage",
        body=f"{current_user.get('name','Kunde')} hat einen Termin am {slot.get('date','')} gebucht",
        url="/studio-dashboard"
    ))
    
    booking_doc.pop("_id", None)
    return booking_doc

@api_router.get("/bookings")
async def get_bookings(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    role = current_user.get("role")
    
    if role == "studio_owner":
        studio = await db.studios.find_one({"owner_id": user_id})
        if studio:
            bookings = await db.bookings.find({"studio_id": studio["studio_id"]}, {"_id": 0}).to_list(200)
        else:
            bookings = []
    else:
        bookings = await db.bookings.find({"user_id": user_id}, {"_id": 0}).to_list(200)
        studio_ids = list({b["studio_id"] for b in bookings if b.get("studio_id")})
        if studio_ids:
            studios_data = await db.studios.find(
                {"studio_id": {"$in": studio_ids}},
                {"_id": 0, "studio_id": 1, "cancellation_hours": 1}
            ).to_list(100)
            studios_map = {s["studio_id"]: s for s in studios_data}
            for b in bookings:
                sid = b.get("studio_id")
                if sid and sid in studios_map:
                    ch = studios_map[sid].get("cancellation_hours")
                    if ch is not None:
                        b["studio_cancellation_hours"] = ch
    
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")})
    if booking.get("user_id") != user_id and (not studio or studio.get("owner_id") != user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    return booking

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, status: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")})
    is_studio_owner = bool(studio and studio.get("owner_id") == user_id)
    is_customer = booking.get("user_id") == user_id
    if not is_studio_owner and not is_customer:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Resolve directional cancellation aliases
    effective_status = status
    if status == "cancelled":
        effective_status = "studio_cancelled" if is_studio_owner else "customer_cancelled"

    update_fields = {"status": effective_status}
    is_cancellation = effective_status in ["cancelled", "customer_cancelled", "studio_cancelled"]
    if is_cancellation:
        update_fields["cancelled_by"] = "studio" if is_studio_owner else "customer"
        update_fields["cancelled_at"] = datetime.now(timezone.utc).isoformat()
        await db.slots.update_one({"slot_id": booking.get("slot_id")}, {"$set": {"is_booked": False}})
        # Customer cancels within free window with paid deposit → flag for refund
        if effective_status == "customer_cancelled" and booking.get("payment_status") == "paid" and studio:
            cancel_hours = studio.get("cancellation_hours")
            if cancel_hours:
                apt_date = booking.get("date", "")
                apt_time_str = booking.get("start_time", "12:00") or "12:00"
                try:
                    apt_dt = datetime.strptime(f"{apt_date} {apt_time_str}", "%Y-%m-%d %H:%M").replace(tzinfo=timezone.utc)
                    cutoff = apt_dt - timedelta(hours=cancel_hours)
                    if datetime.now(timezone.utc) < cutoff:
                        update_fields["refund_pending"] = True
                except Exception:
                    pass
    if effective_status == "confirmed" and booking.get("deposit_required") and studio:
        deadline_hours = studio.get("deposit_deadline_hours") or 0
        if deadline_hours > 0:
            deadline_at = (datetime.now(timezone.utc) + timedelta(hours=deadline_hours)).isoformat()
            update_fields["deposit_deadline_at"] = deadline_at

    await db.bookings.update_one({"booking_id": booking_id}, {"$set": update_fields})

    customer_id = booking.get("user_id", "")
    user_email = booking.get("user_email", "")
    studio_name = booking.get("studio_name", "")
    owner_id = studio.get("owner_id", "") if studio else ""

    if user_email and (effective_status == "confirmed" or is_cancellation):
        asyncio.create_task(send_email(
            to=user_email,
            subject=f"Termin {'bestätigt' if effective_status == 'confirmed' else 'abgesagt'} – {studio_name}",
            html=booking_status_html(booking, "confirmed" if effective_status == "confirmed" else "cancelled")
        ))

    if customer_id and (effective_status == "confirmed" or is_cancellation):
        push_title = f"Termin {'bestätigt' if effective_status == 'confirmed' else 'storniert'} – {studio_name}"
        push_body = f"{booking.get('date', '')} {'bestätigt ✓' if effective_status == 'confirmed' else 'wurde leider storniert'}"
        asyncio.create_task(send_push_notification(user_id=customer_id, title=push_title, body=push_body, url="/dashboard"))

    # Push studio owner when customer cancels
    if owner_id and effective_status == "customer_cancelled":
        asyncio.create_task(send_push_notification(
            user_id=owner_id,
            title="Buchung storniert",
            body=f"{booking.get('user_name','Kunde')} hat den Termin am {booking.get('date','')} storniert",
            url="/studio-dashboard"
        ))

    # Push studio owner about pending refund
    if owner_id and update_fields.get("refund_pending"):
        deposit = float(booking.get("offer_deposit_amount") or booking.get("deposit_amount") or 0)
        asyncio.create_task(send_push_notification(
            user_id=owner_id,
            title="⚠️ Rückzahlung ausstehend",
            body=f"Anzahlung €{deposit:.0f} an {booking.get('user_name','Kunden')} zurückzahlen.",
            url="/studio-dashboard"
        ))

    # System chat message for cancellations
    if customer_id and owner_id and is_cancellation:
        msg = "❌ Termin wurde vom Studio storniert." if effective_status == "studio_cancelled" else "❌ Termin wurde storniert."
        cancel_triggered_by = owner_id if effective_status == "studio_cancelled" else customer_id
        asyncio.create_task(_post_system_message(customer_id=customer_id, studio_owner_id=owner_id, text=msg, triggered_by_id=cancel_triggered_by))

    return {"message": "Booking updated"}


# ─── Invoice Helpers ──────────────────────────────────────────────────────────

def _fmt_eur(amount: float) -> str:
    return f"{amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def _invoice_html(inv_num: str, now_fmt: str, studio_name: str, user_name: str,
                  type_label: str, bdate_fmt: str, btime: str,
                  pay_type_label: str, pay_label: str, amount: float) -> str:
    amt = f"&#8364;&#8201;{_fmt_eur(amount)}"
    time_part = f"&middot; {btime}" if btime else ""
    return f"""<div style="font-family:system-ui,-apple-system,sans-serif;max-width:620px;margin:0 auto;color:#18181b;">
  <div style="background:#18181b;padding:28px 32px;border-radius:16px 16px 0 0;">
    <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">StudioOS &#9998;</p>
    <p style="color:#a1a1aa;font-size:13px;margin:6px 0 0;">Tattoo Studio Booking</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
      <div>
        <p style="font-size:22px;font-weight:700;margin:0 0 4px;">Rechnung</p>
        <p style="color:#71717a;font-size:14px;margin:0;">Nr.&nbsp;{inv_num}</p>
      </div>
      <div style="text-align:right;">
        <p style="font-size:12px;color:#a1a1aa;margin:0;">Erstellt am</p>
        <p style="font-size:14px;font-weight:600;margin:4px 0 0;">{now_fmt}</p>
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:#f4f4f5;border-radius:12px;padding:16px;">
        <p style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;">Studio</p>
        <p style="font-size:15px;font-weight:600;margin:0;">{studio_name}</p>
      </div>
      <div style="flex:1;background:#f4f4f5;border-radius:12px;padding:16px;">
        <p style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;">Kunde</p>
        <p style="font-size:15px;font-weight:600;margin:0;">{user_name}</p>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px;">
      <thead>
        <tr style="background:#f4f4f5;">
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Leistung</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Termin</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Typ</th>
          <th style="padding:10px 14px;text-align:right;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Betrag</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:14px 14px;">{type_label}</td>
          <td style="padding:14px 14px;">{bdate_fmt} {time_part}</td>
          <td style="padding:14px 14px;">{pay_type_label}</td>
          <td style="padding:14px 14px;text-align:right;font-weight:700;">{amt}</td>
        </tr>
      </tbody>
    </table>
    <div style="background:#18181b;border-radius:12px;padding:16px 20px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <p style="color:#a1a1aa;font-size:12px;margin:0;">Zahlungsart</p>
        <p style="color:#fff;font-size:13px;font-weight:600;margin:4px 0 0;">{pay_label}</p>
      </div>
      <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">{amt}</p>
    </div>
    <p style="color:#71717a;font-size:13px;margin:0 0 6px;">Vielen Dank f&#252;r deinen Besuch bei {studio_name}!&nbsp;&#128420;</p>
    <p style="color:#a1a1aa;font-size:11px;margin:0;">Diese Rechnung wurde automatisch von StudioOS erstellt und best&#228;tigt den Zahlungseingang.</p>
  </div>
</div>"""


async def _next_invoice_number(studio_id: str) -> str:
    count = await db.invoices.count_documents({"studio_id": studio_id})
    year = datetime.now(timezone.utc).year
    return f"INK-{year}-{str(count + 1).zfill(4)}"


async def _create_invoice(booking: dict, studio: dict, amount: float, payment_method: str, payment_type: str) -> dict:
    """Create invoice record in DB and email it to the customer."""
    inv_num = await _next_invoice_number(studio.get("studio_id", ""))
    now_iso = datetime.now(timezone.utc).isoformat()
    now_fmt = datetime.now(timezone.utc).strftime("%d.%m.%Y")
    bdate = booking.get("offer_date") or booking.get("date", "")
    try:
        bdate_fmt = datetime.strptime(bdate, "%Y-%m-%d").strftime("%d.%m.%Y")
    except Exception:
        bdate_fmt = bdate
    btime = booking.get("offer_time") or booking.get("start_time", "")
    btype = booking.get("booking_type", "tattoo")
    type_label = {"tattoo": "Tattoo-Sitzung", "consultation": "Beratung", "full_day": "Ganztag",
                  "video_consultation": "Videoberatung"}.get(btype, "Tattoo-Sitzung")
    pay_label = {"stripe": "Stripe (Karte)", "cash": "Barzahlung"}.get(payment_method, payment_method)
    pay_type_label = {"deposit": "Anzahlung", "final": "Abschlusszahlung", "cash": "Barzahlung"}.get(payment_type, "Zahlung")
    studio_name = studio.get("name", "Studio")
    user_name = booking.get("user_name", "")
    user_email = booking.get("user_email", "")

    doc = {
        "invoice_id":     f"inv_{uuid.uuid4().hex[:12]}",
        "invoice_number": inv_num,
        "booking_id":     booking.get("booking_id"),
        "studio_id":      studio.get("studio_id"),
        "studio_name":    studio_name,
        "user_id":        booking.get("user_id"),
        "user_name":      user_name,
        "user_email":     user_email,
        "amount":         amount,
        "payment_method": payment_method,
        "payment_type":   payment_type,
        "booking_date":   bdate,
        "booking_time":   btime,
        "booking_type":   btype,
        "created_at":     now_iso,
    }
    await db.invoices.insert_one(doc)

    if user_email:
        html = _invoice_html(inv_num, now_fmt, studio_name, user_name, type_label,
                             bdate_fmt, btime, pay_type_label, pay_label, amount)
        asyncio.create_task(send_email(user_email, f"Rechnung {inv_num} \u00b7 {studio_name}", html))

    return doc


# ─── Booking Complete / Invoice ────────────────────────────────────────────────

@api_router.put("/bookings/{booking_id}/complete")
async def complete_booking(booking_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    data = await request.json()
    revenue = float(data.get("revenue", 0) or 0)
    payment_method = data.get("payment_method", "cash")
    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")})
    user_id = current_user.get("id") or current_user.get("user_id")
    if not studio or studio.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": "completed", "revenue": revenue, "completed_at": now_iso, "payment_method": payment_method}}
    )
    if revenue > 0:
        asyncio.create_task(_create_invoice(booking, studio, revenue, payment_method, "cash"))
    return {"success": True}


@api_router.get("/studios/my/invoices")
async def get_my_invoices(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"owner_id": user_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio nicht gefunden")
    invoices = await db.invoices.find(
        {"studio_id": studio["studio_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    return {"invoices": invoices}


@api_router.post("/bookings/{booking_id}/send-final-payment")
async def send_final_payment_link(booking_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    """Studio creates a Stripe Checkout Session and emails the payment link to the customer."""
    data = await request.json()
    amount = float(data.get("amount", 0) or 0)
    if amount < 0.50:
        raise HTTPException(status_code=400, detail="Betrag muss mindestens € 0,50 sein")

    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")

    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")})
    if not studio or studio.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")

    customer_email = booking.get("user_email", "")
    studio_name = studio.get("name", "Studio")
    amount_cents = int(round(amount * 100))
    frontend_origin = data.get("origin_url", "").rstrip("/") or str(request.base_url).rstrip("/")
    session_id = f"fin_{uuid.uuid4().hex[:16]}"

    import stripe as stripe_lib
    stripe_lib.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
    connect_account_id = studio.get("stripe_connect_account_id")
    connect_status = studio.get("stripe_connect_status")
    use_connect = bool(connect_account_id and connect_status == "complete")
    platform_fee_cents = int(round(amount_cents * 0.05))

    checkout_kwargs = dict(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "product_data": {"name": f"Tattoo-Zahlung \u2013 {studio_name}"},
                "unit_amount": amount_cents,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"{frontend_origin}/dashboard?payment=final_success&session_id={session_id}",
        cancel_url=f"{frontend_origin}/dashboard",
        metadata={
            "session_id": session_id,
            "booking_id": booking_id,
            "payment_type": "final",
        },
    )
    if customer_email:
        checkout_kwargs["customer_email"] = customer_email
    if use_connect:
        checkout_kwargs["payment_intent_data"] = {
            "transfer_data": {"destination": connect_account_id},
            "application_fee_amount": platform_fee_cents,
        }

    try:
        session = await asyncio.to_thread(stripe_lib.checkout.Session.create, **checkout_kwargs)
        checkout_url = session.url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe-Fehler: {str(e)}")

    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "booking_id": booking_id,
        "user_id": booking.get("user_id"),
        "session_id": session_id,
        "stripe_session_id": session.id,
        "studio_id": booking.get("studio_id"),
        "amount": amount,
        "payment_status": "pending",
        "payment_type": "final",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    if customer_email:
        booking_date = booking.get("offer_date") or booking.get("date") or ""
        date_str = ""
        if booking_date:
            try:
                date_str = datetime.strptime(booking_date, "%Y-%m-%d").strftime("%d.%m.%Y")
            except Exception:
                date_str = booking_date
        date_text = f" für dein Tattoo am {date_str}" if date_str else ""
        html = f"""<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#18181b;">
  <div style="background:#18181b;padding:24px 32px;border-radius:16px 16px 0 0;">
    <p style="color:#fff;font-size:22px;font-weight:700;margin:0;">StudioOS &#9998;</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;">
    <p style="font-size:18px;font-weight:600;margin:0 0 8px;">Zahlungslink f&#252;r dein Tattoo &#128179;</p>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px;">{studio_name} hat einen Zahlungslink{date_text} erstellt. Klicke unten um sicher per Karte zu bezahlen.</p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="{checkout_url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:100px;font-size:15px;font-weight:600;">
        Jetzt bezahlen &mdash; &euro;&thinsp;{amount:.2f}
      </a>
    </div>
    <p style="color:#a1a1aa;font-size:12px;margin:0;">Dieser Link ist 24&thinsp;Stunden g&#252;ltig. Bei Fragen melde dich direkt bei {studio_name}.</p>
  </div>
</div>"""
        asyncio.create_task(send_email(customer_email, f"&#128179; Zahlungslink \u2013 {studio_name}", html))

    return {"success": True, "email_sent_to": customer_email, "checkout_url": checkout_url}


@api_router.post("/bookings/{booking_id}/check-final-payment")
async def check_final_payment(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Studio polls Stripe to check if the customer has paid the final payment link."""
    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")

    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")})
    if not studio or studio.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")

    # Find the most recent pending final payment transaction
    all_txns = await db.payment_transactions.find(
        {"booking_id": booking_id, "payment_type": "final"}
    ).to_list(50)
    pending_txn = next((t for t in reversed(all_txns) if t.get("payment_status") != "paid"), None)

    if not pending_txn:
        already_paid = next((t for t in all_txns if t.get("payment_status") == "paid"), None)
        if already_paid:
            return {"status": "already_paid", "amount": already_paid.get("amount", 0)}
        return {"status": "no_pending_payment"}

    cs_id = pending_txn.get("stripe_session_id")
    if not cs_id:
        return {"status": "no_stripe_session"}

    import stripe as stripe_lib
    stripe_lib.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

    try:
        cs = await asyncio.to_thread(stripe_lib.checkout.Session.retrieve, cs_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe-Fehler: {str(e)}")

    if cs.payment_status != "paid":
        return {"status": "pending"}

    # Payment confirmed — complete booking
    now_iso = datetime.now(timezone.utc).isoformat()
    revenue_amount = pending_txn.get("amount", 0)

    await db.payment_transactions.update_one(
        {"session_id": pending_txn["session_id"]},
        {"$set": {"payment_status": "paid", "paid_at": now_iso}}
    )
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": "completed", "revenue": revenue_amount, "completed_at": now_iso, "payment_method": "stripe"}}
    )
    asyncio.create_task(_create_invoice(booking, studio, revenue_amount, "stripe", "final"))

    # Notify studio owner via push + chat message
    owner_id = studio.get("owner_id", "")
    customer_id = booking.get("user_id", "")
    bdate = booking.get("offer_date") or booking.get("date", "")
    btime = booking.get("offer_time") or booking.get("start_time", "")
    try:
        date_fmt = datetime.strptime(bdate, "%Y-%m-%d").strftime("%d.%m.%Y")
    except Exception:
        date_fmt = bdate
    if customer_id and owner_id:
        asyncio.create_task(_post_system_message(
            customer_id=customer_id, studio_owner_id=owner_id,
            text=f"💳 Zahlung erhalten – Termin am {date_fmt} um {btime} Uhr ist abgeschlossen ✓",
            triggered_by_id=customer_id
        ))

    return {"status": "paid", "amount": revenue_amount}


# ─── Booking Offer / Accept / No-Show ────────────────────────────────────────

def _calc_offer_deadline(offer_date_str: str) -> tuple:
    """
    Returns (deadline_datetime, minutes_int, human_label) based on how far away the appointment is:
      < 24 h  → 30 Minuten
      1–7 d   → 2 Stunden
      > 7 d   → 24 Stunden
    """
    now = datetime.now(timezone.utc)
    try:
        appt_dt = datetime.strptime(offer_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except Exception:
        appt_dt = now + timedelta(days=8)
    diff_hours = max(0, (appt_dt - now).total_seconds() / 3600)
    if diff_hours < 24:
        minutes, label = 30, "30 Minuten"
    elif diff_hours < 24 * 7:
        minutes, label = 120, "2 Stunden"
    else:
        minutes, label = 1440, "24 Stunden"
    return now + timedelta(minutes=minutes), minutes, label


@api_router.post("/bookings/{booking_id}/offer")
async def create_booking_offer(booking_id: str, offer: BookingOffer, current_user: dict = Depends(get_current_user)):
    """Studio creates a date/price offer for a customer booking request."""
    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")

    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")})
    if not studio or studio.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")

    if booking.get("status") not in ["pending_studio_review", "under_review", "pending"]:
        raise HTTPException(status_code=400, detail="Angebot kann nur für neue Anfragen erstellt werden")

    platform_fee_pct = 5.0
    platform_fee_amount = round(offer.offer_deposit_amount * platform_fee_pct / 100, 2)

    # Dynamic deadline based on how far away the appointment is
    offer_deadline_dt, offer_deadline_min, offer_deadline_label = _calc_offer_deadline(offer.offer_date)
    offer_deadline_at = offer_deadline_dt.isoformat()

    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": "offer_sent",
            "offer_date": offer.offer_date,
            "offer_time": offer.offer_time,
            "offer_duration_min": offer.offer_duration_min,
            "offer_total_price": offer.offer_total_price,
            "offer_deposit_amount": offer.offer_deposit_amount,
            "offer_notes": offer.offer_notes,
            "platform_fee_pct": platform_fee_pct,
            "platform_fee_amount": platform_fee_amount,
            "offer_created_at": datetime.now(timezone.utc).isoformat(),
            "deposit_deadline_at": offer_deadline_at,
            "offer_deadline_label": offer_deadline_label,
            "deposit_required": True,
        }}
    )

    customer_id = booking.get("user_id", "")
    owner_id = studio.get("owner_id", "")
    try:
        date_fmt = datetime.strptime(offer.offer_date, "%Y-%m-%d").strftime("%d.%m.%Y")
    except Exception:
        date_fmt = offer.offer_date

    deposit_str = f"€{offer.offer_deposit_amount:.0f}" if offer.offer_deposit_amount else ""
    asyncio.create_task(_post_system_message(
        customer_id=customer_id,
        studio_owner_id=owner_id,
        text=f"📋 Neues Angebot: {date_fmt} um {offer.offer_time} Uhr · {offer.offer_duration_min} Min. · €{offer.offer_total_price:.0f} Gesamtpreis{(' · ' + deposit_str + ' Anzahlung') if deposit_str else ''} – bitte bis {offer_deadline_label} annehmen.",
        triggered_by_id=owner_id
    ))
    asyncio.create_task(send_push_notification(
        user_id=customer_id,
        title=f"⏳ Neues Angebot – {studio.get('name', '')} ({offer_deadline_label} Zeit)",
        body=f"{date_fmt} um {offer.offer_time} Uhr · {deposit_str} Anzahlung – jetzt annehmen!",
        url="/dashboard"
    ))

    # Send email to customer with offer details + deadline
    user_email = booking.get("user_email", "")
    if user_email:
        asyncio.create_task(send_email(
            to=user_email,
            subject=f"⏳ Neues Angebot von {studio.get('name', '')} – {offer_deadline_label} Zeit zum Annehmen",
            html=f"""
            <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
              {_email_header()}
              <div style="padding:32px 32px 24px;">
                <div style="display:inline-block;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:6px;padding:6px 14px;margin-bottom:20px;">
                  <span style="font-size:12px;font-weight:700;color:#6d28d9;letter-spacing:0.05em;text-transform:uppercase;">Neues Angebot</span>
                </div>
                <h2 style="font-size:22px;font-weight:700;margin:0 0 8px;color:#111;letter-spacing:-0.4px;">Du hast ein Angebot erhalten!</h2>
                <p style="font-size:15px;color:#444;margin:0 0 20px;line-height:1.6;">
                  <strong style="color:#111;">{studio.get('name', '')}</strong> hat dir ein Angebot für deinen Tattoo-Termin erstellt.
                </p>
                <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                  <p style="font-size:13px;font-weight:700;color:#c2410c;margin:0 0 4px;">⏳ Du hast {offer_deadline_label} Zeit</p>
                  <p style="font-size:13px;color:#9a3412;margin:0;">Nimm das Angebot innerhalb von {offer_deadline_label} in deinem Dashboard an – danach verfällt es automatisch.</p>
                </div>
                <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;margin-bottom:24px;">
                  {_detail_row("Studio", studio.get('name', ''), highlight=True)}
                  {_detail_row("Datum", date_fmt)}
                  {_detail_row("Uhrzeit", f"{offer.offer_time} Uhr")}
                  {_detail_row("Dauer", f"{offer.offer_duration_min} Minuten")}
                  {_detail_row("Gesamtpreis", f"€ {offer.offer_total_price:.0f}")}
                  {_detail_row("Anzahlung", deposit_str)}
                </table>
                {f'<div style="background:#fafafa;border-left:3px solid #d1d5db;padding:14px 18px;border-radius:6px;margin-bottom:24px;"><p style="font-size:12px;color:#888;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.06em;">Notiz vom Studio</p><p style="font-size:14px;color:#444;margin:0;line-height:1.6;">"{offer.offer_notes}"</p></div>' if offer.offer_notes else ""}
                <a href="{_get_frontend_url()}/dashboard" style="display:block;text-align:center;background:#111;color:#fff;padding:14px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:-0.2px;">
                  Jetzt Angebot annehmen →
                </a>
              </div>
              {_email_footer()}
            </div>"""
        ))

    return {"message": "Angebot erstellt", "status": "offer_sent"}


@api_router.post("/bookings/{booking_id}/accept-offer")
async def accept_booking_offer(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Customer accepts the studio's offer → waiting_for_deposit."""
    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")

    user_id = current_user.get("id") or current_user.get("user_id")
    if booking.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")

    if booking.get("status") != "offer_sent":
        raise HTTPException(status_code=400, detail="Kein offenes Angebot vorhanden")

    deposit_amount = float(booking.get("offer_deposit_amount", booking.get("deposit_amount", 50.0)) or 0)
    is_free = deposit_amount == 0

    new_status = "confirmed" if is_free else "waiting_for_deposit"
    update_fields = {
        "status": new_status,
        "offer_accepted_at": datetime.now(timezone.utc).isoformat(),
        "deposit_required": not is_free,
        "deposit_amount": deposit_amount,
        "date": booking.get("offer_date", booking.get("date", "")),
        "start_time": booking.get("offer_time", booking.get("start_time", "")),
    }
    if is_free:
        update_fields["payment_status"] = "free"
        update_fields["confirmed_at"] = datetime.now(timezone.utc).isoformat()

    await db.bookings.update_one({"booking_id": booking_id}, {"$set": update_fields})

    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")})
    owner_id = studio.get("owner_id", "") if studio else ""

    if is_free:
        sys_text = "✅ Angebot angenommen – Termin bestätigt (keine Anzahlung erforderlich)."
        asyncio.create_task(send_push_notification(
            user_id=owner_id,
            title="Termin bestätigt",
            body=f"{booking.get('user_name','Kunde')} hat das kostenlose Angebot angenommen",
            url="/studio-dashboard"
        ))
        asyncio.create_task(_post_system_message(
            customer_id=user_id,
            studio_owner_id=owner_id,
            text=sys_text,
            triggered_by_id=user_id
        ))
    else:
        deposit_amt = float(booking.get("offer_deposit_amount") or booking.get("deposit_amount") or 0)
        deposit_str = f"€{deposit_amt:.0f}" if deposit_amt > 0 else ""
        # Deadline was already set when offer was created; status updated above
        sys_text = f"✅ Angebot angenommen – bitte jetzt die Anzahlung ({deposit_str}) bezahlen, um den Termin zu sichern."
        asyncio.create_task(send_push_notification(
            user_id=owner_id,
            title="Angebot angenommen – Anzahlung läuft",
            body=f"{booking.get('user_name','Kunde')} hat dein Angebot angenommen. Anzahlung ({deposit_str}) läuft in 15 Min. ab.",
            url="/studio-dashboard"
        ))
        asyncio.create_task(_post_system_message(
            customer_id=user_id,
            studio_owner_id=owner_id,
            text=sys_text,
            triggered_by_id=user_id
        ))

    return {"message": "Angebot angenommen", "status": new_status, "is_free": is_free}


@api_router.post("/bookings/{booking_id}/cancel-with-refund")
async def cancel_booking_with_refund(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Studio cancels a paid booking and issues a Stripe refund automatically."""
    import stripe as stripe_lib
    stripe_lib.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")

    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")})
    if not studio or studio.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")

    if booking.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Keine bezahlte Anzahlung vorhanden")

    # Find the paid transaction for this booking
    txn = await db.payment_transactions.find_one({"booking_id": booking_id, "payment_status": "paid"})
    refund_id = None

    if txn and txn.get("stripe_payment_intent_id"):
        pi_id = txn["stripe_payment_intent_id"]
        try:
            refund = await asyncio.to_thread(stripe_lib.Refund.create, payment_intent=pi_id)
            refund_id = refund["id"]
            await db.payment_transactions.update_one(
                {"booking_id": booking_id, "payment_status": "paid"},
                {"$set": {
                    "refund_id": refund_id,
                    "refund_status": "refunded",
                    "refunded_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Rückerstattung fehlgeschlagen: {str(e)}")

    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "status": "studio_cancelled",
            "cancelled_by": "studio",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "refund_id": refund_id,
            "refund_status": "refunded" if refund_id else "manual",
            "payment_status": "refunded",
        }}
    )

    customer_id = booking.get("user_id", "")
    owner_id = studio.get("owner_id", "")
    deposit = float(booking.get("offer_deposit_amount") or booking.get("deposit_amount") or 0)
    deposit_str = f"€{deposit:.0f}" if deposit > 0 else ""

    if customer_id and owner_id:
        asyncio.create_task(_post_system_message(
            customer_id=customer_id,
            studio_owner_id=owner_id,
            text=f"❌ Termin wurde vom Studio storniert. Die Anzahlung ({deposit_str}) wird automatisch zurückerstattet.",
            triggered_by_id=owner_id
        ))

    user_email = booking.get("user_email", "")
    if user_email:
        asyncio.create_task(send_email(
            to=user_email,
            subject=f"Dein Termin wurde storniert – Anzahlung ({deposit_str}) wird zurückgebucht",
            html=studio_cancelled_refund_html(booking)
        ))

    if customer_id:
        asyncio.create_task(send_push_notification(
            user_id=customer_id,
            title="Termin storniert – Rückerstattung läuft",
            body=f"Dein Termin wurde storniert. Die Anzahlung wird zurückgebucht.",
            url="/dashboard"
        ))

    return {"message": "Storniert und Rückerstattung eingeleitet", "refund_id": refund_id}


@api_router.get("/studios/my/pending-refunds")
async def get_pending_refunds(current_user: dict = Depends(get_current_user)):
    """Returns bookings with a pending deposit refund for the studio owner."""
    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"owner_id": user_id})
    if not studio:
        return {"count": 0, "bookings": []}
    bookings = await db.bookings.find(
        {"studio_id": studio["studio_id"], "refund_pending": True},
        {"_id": 0}
    ).to_list(50)
    return {"count": len(bookings), "bookings": bookings}


@api_router.post("/bookings/{booking_id}/refund-deposit")
async def refund_deposit(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Studio refunds a deposit for a customer-cancelled booking within the free window."""
    import stripe as stripe_lib
    stripe_lib.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")

    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")})
    if not studio or studio.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")

    if not booking.get("refund_pending"):
        raise HTTPException(status_code=400, detail="Keine ausstehende Rückzahlung für diese Buchung")

    txn = await db.payment_transactions.find_one({"booking_id": booking_id, "payment_status": "paid"})
    refund_id = None

    if txn and txn.get("stripe_payment_intent_id"):
        pi_id = txn["stripe_payment_intent_id"]
        try:
            refund = await asyncio.to_thread(stripe_lib.Refund.create, payment_intent=pi_id)
            refund_id = refund["id"]
            await db.payment_transactions.update_one(
                {"booking_id": booking_id, "payment_status": "paid"},
                {"$set": {"refund_id": refund_id, "refund_status": "refunded",
                          "refunded_at": datetime.now(timezone.utc).isoformat()}}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Rückerstattung fehlgeschlagen: {str(e)}")

    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {
            "refund_pending": False,
            "refund_id": refund_id,
            "refund_status": "refunded" if refund_id else "manual",
            "payment_status": "refunded",
        }}
    )

    customer_id = booking.get("user_id", "")
    owner_id = studio.get("owner_id", "")
    deposit = float(booking.get("offer_deposit_amount") or booking.get("deposit_amount") or 0)
    deposit_str = f"€{deposit:.0f}" if deposit > 0 else ""

    user_email = booking.get("user_email", "")
    if user_email:
        asyncio.create_task(send_email(
            to=user_email,
            subject=f"Anzahlung wird zurückgebucht – {booking.get('studio_name', 'StudioOS')}",
            html=customer_free_cancellation_refund_html(booking)
        ))

    if customer_id and owner_id:
        asyncio.create_task(_post_system_message(
            customer_id=customer_id,
            studio_owner_id=owner_id,
            text=f"💚 Anzahlung ({deposit_str}) wird zurückerstattet – kein weiteres Handeln erforderlich.",
            triggered_by_id=owner_id
        ))

    if customer_id:
        asyncio.create_task(send_push_notification(
            user_id=customer_id,
            title="Anzahlung wird zurückgebucht",
            body=f"Das Studio hat deine Anzahlung von {deposit_str} zurückgebucht.",
            url="/dashboard"
        ))

    return {"message": "Rückerstattung eingeleitet", "refund_id": refund_id}


@api_router.post("/bookings/{booking_id}/no-show")
async def mark_no_show(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Studio marks a confirmed booking as no-show. Deposit is forfeited."""
    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")

    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")})
    if not studio or studio.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")

    if booking.get("status") != "confirmed":
        raise HTTPException(status_code=400, detail="Nur bestätigte Buchungen können als No-Show markiert werden")

    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"status": "no_show", "no_show_at": datetime.now(timezone.utc).isoformat()}}
    )

    customer_id = booking.get("user_id", "")
    owner_id = studio.get("owner_id", "")
    asyncio.create_task(_post_system_message(
        customer_id=customer_id,
        studio_owner_id=owner_id,
        text="⚠️ Termin verpasst: Kunde ist nicht erschienen. Die Anzahlung wurde einbehalten.",
        triggered_by_id=owner_id
    ))

    return {"message": "No-Show markiert", "status": "no_show"}

# ─── Messages / Chat ──────────────────────────────────────────────────────────
@api_router.post("/messages/unread-count")
async def get_unread_count_post(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    count = await db.messages.count_documents({
        "recipient_id": user_id, "read": False,
        "is_broadcast": {"$ne": True},
    })
    return {"count": count, "unread_count": count}

@api_router.get("/messages/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    count = await db.messages.count_documents({
        "recipient_id": user_id, "read": False,
        "is_broadcast": {"$ne": True},
    })
    return {"count": count, "unread_count": count}

@api_router.post("/messages/{other_user_id}/mark-read")
async def mark_messages_read(other_user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    await db.messages.update_many(
        {"sender_id": other_user_id, "recipient_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

@api_router.post("/messages/{recipient_id}/typing")
async def set_typing(recipient_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    await db.typing_states.update_one(
        {"sender_id": user_id, "recipient_id": recipient_id},
        {"$set": {"sender_id": user_id, "recipient_id": recipient_id, "ts": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"ok": True}

@api_router.get("/messages/{other_user_id}/typing-status")
async def get_typing_status(other_user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    state = await db.typing_states.find_one(
        {"sender_id": other_user_id, "recipient_id": user_id}, {"_id": 0}
    )
    if not state:
        return {"is_typing": False}
    ts = datetime.fromisoformat(state["ts"].replace("Z", "+00:00"))
    age = (datetime.now(timezone.utc) - ts).total_seconds()
    return {"is_typing": age < 4}

@api_router.get("/messages")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    convs = await db.conversations.find(
        {"participants": user_id, f"deleted_by.{user_id}": {"$exists": False}},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)

    enriched = []
    for conv in convs:
        participants = conv.get("participants", [])
        other_id = next((p for p in participants if p != user_id), None)
        # Handle StudioOS broadcast conversations
        if other_id == "inkbook_system" or conv.get("is_broadcast_conv"):
            enriched.append({**conv, "other_name": "StudioOS News", "other_role": "system",
                              "other_user_id": "inkbook_system", "last_sender_name": "StudioOS",
                              "is_broadcast_conv": True})
            continue
        other_name = "Unbekannt"
        other_role = "customer"
        if other_id:
            try:
                other_user = await db.users.find_one(
                    {"_id": ObjectId(other_id)}, {"name": 1, "role": 1, "_id": 0}
                )
            except Exception:
                other_user = await db.users.find_one({"user_id": other_id}, {"name": 1, "role": 1, "_id": 0})
            if other_user:
                other_role = other_user.get("role", "customer")
                # For studio owners show the studio name, not their personal name
                if other_role == "studio_owner":
                    studio = await db.studios.find_one({"owner_id": other_id}, {"name": 1, "_id": 0})
                    other_name = studio.get("name") if studio else other_user.get("name", "Studio")
                else:
                    other_name = other_user.get("name", "Nutzer")
        unread = await db.messages.count_documents({
            "sender_id": other_id, "recipient_id": user_id,
            "read": False, "is_broadcast": {"$ne": True}, "is_system": {"$ne": True}
        })
        enriched.append({**conv, "other_name": other_name, "other_role": other_role, "other_user_id": other_id,
                          "last_sender_name": other_name, "unread_count": unread})  # keep compat
    return enriched

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    # Handle StudioOS broadcast messages
    if other_user_id == "inkbook_system":
        messages = await db.messages.find(
            {"sender_id": "inkbook_system", "recipient_id": user_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(500)
        return messages
    conv_id = f"conv_{'_'.join(sorted([user_id, other_user_id]))}"
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": user_id, "recipient_id": other_user_id},
            {"sender_id": other_user_id, "recipient_id": user_id},
            {"is_system": True, "conv_id": conv_id}
        ]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    # Mark incoming messages as read automatically
    await db.messages.update_many(
        {"sender_id": other_user_id, "recipient_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return messages

@api_router.post("/messages")
async def send_message(data: MessageCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    sender_name = current_user.get("name", "")

    msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "sender_id": user_id,
        "sender_name": sender_name,
        "recipient_id": data.recipient_id,
        "content": data.content,
        "image_url": data.image_url,
        "slot_offer": data.slot_offer if data.slot_offer else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False
    }
    await db.messages.insert_one(msg_doc)

    participants = sorted([user_id, data.recipient_id])
    conv_id = f"conv_{'_'.join(participants)}"
    last_msg_preview = data.content if data.content else ("Terminvorschlag" if data.slot_offer else "📷 Bild")
    await db.conversations.update_one(
        {"conv_id": conv_id},
        {"$set": {
            "conv_id": conv_id,
            "participants": participants,
            "last_message": last_msg_preview,
            "last_message_at": datetime.now(timezone.utc).isoformat(),
            "last_sender_id": user_id
        },
        "$unset": {"deleted_by": ""}},  # restore visibility for both parties
        upsert=True
    )

    # Push notification to recipient
    preview = (data.content[:60] + "...") if data.content and len(data.content) > 60 else (data.content or "📷 Bild")
    asyncio.create_task(send_push_notification(
        user_id=data.recipient_id,
        title=f"Neue Nachricht von {sender_name}",
        body=preview,
        url="/messages"
    ))

    # Auto-mark inquiry as contacted + send activation email when studio first messages a ghost user
    try:
        recipient_user = await db.users.find_one(
            {"$or": [{"user_id": data.recipient_id}, {"_id": data.recipient_id}]}
        )
        if recipient_user and recipient_user.get("is_ghost"):
            sender_studio = await db.studios.find_one({"owner_id": user_id})
            if sender_studio:
                await db.inquiries.update_many(
                    {"user_id": data.recipient_id, "studio_id": sender_studio["studio_id"], "status": "pending"},
                    {"$set": {"status": "contacted"}}
                )
                # Send activation email once — tracked via flag, not message count
                if not recipient_user.get("activation_email_sent"):
                    ghost_token = recipient_user.get("ghost_token", "")
                    guest_email = recipient_user.get("email", "")
                    guest_name = recipient_user.get("name", "Gast")
                    studio_name = sender_studio.get("name", "Das Studio")
                    frontend_url = _get_frontend_url()
                    activate_url = f"{frontend_url}/activate?email={guest_email}&token={ghost_token}"
                    html = f"""
                    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
                      {_email_header()}
                      <div style="padding:32px 32px 24px;">
                        <div style="display:inline-block;background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:6px 14px;margin-bottom:20px;">
                          <span style="font-size:12px;font-weight:700;color:#92400e;letter-spacing:0.05em;text-transform:uppercase;">Antwort erhalten</span>
                        </div>
                        <h2 style="font-size:22px;font-weight:700;margin:0 0 10px;color:#111;letter-spacing:-0.4px;">Hallo {guest_name}!</h2>
                        <p style="font-size:15px;color:#444;margin:0 0 8px;line-height:1.6;">
                          <strong style="color:#111;">{studio_name}</strong> hat auf deine Tattoo-Anfrage geantwortet.
                        </p>
                        <p style="font-size:14px;color:#666;margin:0 0 28px;line-height:1.6;">
                          Aktiviere jetzt dein kostenloses StudioOS-Konto, um die Nachricht zu lesen, direkt mit dem Studio zu chatten und deinen Termin zu bestätigen.
                        </p>
                        <a href="{activate_url}" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:-0.2px;">
                          Konto aktivieren &amp; Nachricht lesen →
                        </a>
                        <p style="font-size:12px;color:#aaa;margin:24px 0 0;line-height:1.6;">
                          Oder kopiere diesen Link in deinen Browser:<br/>
                          <a href="{activate_url}" style="color:#666;word-break:break-all;">{activate_url}</a>
                        </p>
                      </div>
                      {_email_footer("Du erhältst diese E-Mail, weil du eine Anfrage über StudioOS gestellt hast.")}
                    </div>"""
                    await db.users.update_one(
                        {"_id": recipient_user["_id"]},
                        {"$set": {"activation_email_sent": True}}
                    )
                    asyncio.create_task(send_email(guest_email, f"{studio_name} hat auf deine Anfrage geantwortet 💬", html))
    except Exception as e:
        logger.warning(f"Ghost user inquiry hook failed (non-critical): {e}")

    msg_doc.pop("_id", None)
    return msg_doc

# ─── Delete conversation ───────────────────────────────────────────────────────
@api_router.delete("/conversations/{other_user_id}")
async def delete_conversation(other_user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    user_name = current_user.get("name", "Unbekannt")

    participants = sorted([user_id, other_user_id])
    conv_id = f"conv_{'_'.join(participants)}"

    # Add system message so the other party sees what happened
    system_msg = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "sender_id": user_id,
        "recipient_id": other_user_id,
        "sender_name": user_name,
        "content": f"{user_name} hat die Unterhaltung gelöscht und beendet.",
        "image_url": "",
        "is_system": True,
        "slot_offer": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": True
    }
    await db.messages.insert_one(system_msg)

    # Mark conversation as deleted by this user
    await db.conversations.update_one(
        {"conv_id": conv_id},
        {"$set": {
            f"deleted_by.{user_id}": datetime.now(timezone.utc).isoformat(),
            "last_message": f"{user_name} hat die Unterhaltung gelöscht und beendet.",
            "last_message_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    system_msg.pop("_id", None)
    return {"success": True}

# ─── Book slot from chat ───────────────────────────────────────────────────────
@api_router.post("/messages/{message_id}/book-slot")
async def book_slot_from_chat(message_id: str, current_user: dict = Depends(get_current_user)):
    msg = await db.messages.find_one({"message_id": message_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Nachricht nicht gefunden")
    slot_offer = msg.get("slot_offer")
    if not slot_offer:
        raise HTTPException(status_code=400, detail="Kein Terminvorschlag in dieser Nachricht")
    if slot_offer.get("status") == "booked":
        raise HTTPException(status_code=400, detail="Dieser Termin wurde bereits gebucht")

    slot_id = slot_offer.get("slot_id")
    studio_id = slot_offer.get("studio_id")

    slot = await db.slots.find_one({"slot_id": slot_id})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot nicht gefunden")
    if slot.get("is_booked"):
        raise HTTPException(status_code=400, detail="Slot wurde bereits gebucht")

    studio = await db.studios.find_one({"studio_id": studio_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio nicht gefunden")

    user_id = current_user.get("id") or current_user.get("user_id")
    booking_type = slot_offer.get("slot_type", "tattoo")

    booking_doc = {
        "booking_id": f"book_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "user_name": current_user.get("name", ""),
        "user_email": current_user.get("email", ""),
        "studio_id": studio_id,
        "studio_name": studio.get("name", ""),
        "slot_id": slot_id,
        "date": slot.get("date"),
        "start_time": slot.get("start_time"),
        "end_time": slot.get("end_time"),
        "booking_type": booking_type,
        "notes": "Via Chat gebucht",
        "reference_images": [],
        "status": "confirmed",
        "payment_status": "unpaid",
        "deposit_amount": studio.get("deposit_amount", 50.0),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)
    await db.slots.update_one({"slot_id": slot_id}, {"$set": {"is_booked": True, "booking_id": booking_doc["booking_id"]}})

    # Update message slot_offer status
    await db.messages.update_one(
        {"message_id": message_id},
        {"$set": {
            "slot_offer.status": "booked",
            "slot_offer.booked_by": user_id,
            "slot_offer.booked_by_name": current_user.get("name", "Kunde")
        }}
    )

    # Email confirmation to customer
    user_email = current_user.get("email", "")
    if user_email:
        asyncio.create_task(send_email(
            to=user_email,
            subject=f"Buchungsbestätigung – {studio.get('name', '')}",
            html=booking_confirmation_html(booking_doc)
        ))

    # Notify studio owner by email
    studio_owner = await db.users.find_one({"user_id": studio.get("owner_id", "")})
    if studio_owner and studio_owner.get("email"):
        asyncio.create_task(send_email(
            to=studio_owner["email"],
            subject=f"Neue Buchung via Chat – {current_user.get('name','Kunde')} · {slot.get('date','')}",
            html=booking_confirmation_studio_html(booking_doc)
        ))

    # Push notification to studio owner
    asyncio.create_task(send_push_notification(
        user_id=studio.get("owner_id", ""),
        title="Neue Buchung via Chat",
        body=f"{current_user.get('name','Kunde')} hat den Terminvorschlag am {slot.get('date','')} gebucht",
        url="/studio-dashboard"
    ))

    booking_doc.pop("_id", None)
    return booking_doc

# ─── Payments (Stripe) ───────────────────────────────────────────────────────
def get_stripe_client():
    import stripe as stripe_lib
    sk = os.environ.get("STRIPE_SECRET_KEY", "")
    if not sk:
        raise HTTPException(status_code=500, detail="Stripe nicht konfiguriert")
    stripe_lib.api_key = sk
    return stripe_lib

# ─── Stripe Connect ───────────────────────────────────────────────────────────

@api_router.post("/stripe/connect/create")
async def create_connect_account(request: Request, current_user: dict = Depends(get_current_user)):
    """Create a Stripe Connect Express account for a studio and return the onboarding URL."""
    owner_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"owner_id": owner_id}, {"_id": 0})
    if not studio:
        raise HTTPException(status_code=404, detail="Kein Studio gefunden")

    stripe = get_stripe_client()
    import stripe as stripe_lib
    stripe_lib.api_key = os.environ.get("STRIPE_SECRET_KEY", "")

    frontend_url = _get_frontend_url()
    return_url = f"{frontend_url}/studio-dashboard?stripe=done"
    refresh_url = f"{frontend_url}/studio-dashboard?stripe=setup"

    # If already has a connect account, just create a new onboarding link
    existing_account_id = studio.get("stripe_connect_account_id")
    if existing_account_id:
        account_valid = False
        try:
            account = await asyncio.to_thread(stripe_lib.Account.retrieve, existing_account_id)
            account_valid = True
            # If already fully onboarded, return status
            if account.get("details_submitted") and account.get("charges_enabled"):
                await db.studios.update_one(
                    {"studio_id": studio["studio_id"]},
                    {"$set": {"stripe_connect_status": "complete"}}
                )
                return {"status": "complete", "account_id": existing_account_id, "onboarding_url": None}
        except Exception:
            # Account not accessible with current key (e.g. live account ID used with test key)
            # Clear the stored account ID so a new one gets created below
            await db.studios.update_one(
                {"studio_id": studio["studio_id"]},
                {"$unset": {"stripe_connect_account_id": "", "stripe_connect_status": ""}}
            )
            existing_account_id = None

        if account_valid and existing_account_id:
            # Create a fresh account link for pending onboarding
            try:
                account_link = await asyncio.to_thread(
                    stripe_lib.AccountLink.create,
                    account=existing_account_id,
                    refresh_url=refresh_url,
                    return_url=return_url,
                    type="account_onboarding",
                )
                return {"status": "pending", "account_id": existing_account_id, "onboarding_url": account_link["url"]}
            except Exception as link_err:
                # Account link failed — clear and create fresh
                await db.studios.update_one(
                    {"studio_id": studio["studio_id"]},
                    {"$unset": {"stripe_connect_account_id": "", "stripe_connect_status": ""}}
                )

    # Create a fresh Express account
    studio_email = studio.get("email") or current_user.get("email", "")
    try:
        account = await asyncio.to_thread(
            stripe_lib.Account.create,
            controller={
                "losses": {"payments": "application"},
                "fees": {"payer": "application"},
                "stripe_dashboard": {"type": "express"},
                "requirement_collection": "stripe",
            },
            country="DE",
            email=studio_email if studio_email else None,
            capabilities={"transfers": {"requested": True}, "card_payments": {"requested": True}},
            metadata={"studio_id": studio["studio_id"], "owner_id": owner_id},
        )
    except Exception as stripe_err:
        err_msg = str(stripe_err)
        if "signed up for Connect" in err_msg:
            sk = os.environ.get("STRIPE_SECRET_KEY", "")
            mode = "test" if sk.startswith("sk_test_") else "live"
            raise HTTPException(status_code=402, detail=f"STRIPE_CONNECT_NOT_ENABLED:{mode}")
        raise HTTPException(status_code=500, detail=f"Stripe-Fehler: {err_msg}")

    account_id = account["id"]

    # Persist account id on studio
    await db.studios.update_one(
        {"studio_id": studio["studio_id"]},
        {"$set": {"stripe_connect_account_id": account_id, "stripe_connect_status": "pending"}}
    )

    account_link = await asyncio.to_thread(
        stripe_lib.AccountLink.create,
        account=account_id,
        refresh_url=refresh_url,
        return_url=return_url,
        type="account_onboarding",
    )
    return {"status": "pending", "account_id": account_id, "onboarding_url": account_link["url"]}


@api_router.get("/stripe/connect/status")
async def get_connect_status(current_user: dict = Depends(get_current_user)):
    """Return the Stripe Connect status for the studio owned by the current user."""
    owner_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"owner_id": owner_id}, {"_id": 0, "stripe_connect_account_id": 1, "stripe_connect_status": 1})
    if not studio:
        raise HTTPException(status_code=404, detail="Kein Studio gefunden")

    account_id = studio.get("stripe_connect_account_id")
    if not account_id:
        return {"status": "not_connected", "account_id": None}

    import stripe as stripe_lib
    stripe_lib.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
    try:
        account = await asyncio.to_thread(stripe_lib.Account.retrieve, account_id)
        details_submitted = account.get("details_submitted", False)
        charges_enabled = account.get("charges_enabled", False)
        payouts_enabled = account.get("payouts_enabled", False)
        status = "complete" if (details_submitted and charges_enabled) else "pending"
        await db.studios.update_one(
            {"stripe_connect_account_id": account_id},
            {"$set": {"stripe_connect_status": status}}
        )
        return {
            "status": status,
            "account_id": account_id,
            "details_submitted": details_submitted,
            "charges_enabled": charges_enabled,
            "payouts_enabled": payouts_enabled,
        }
    except Exception:
        stored_status = studio.get("stripe_connect_status", "pending")
        if stored_status == "complete":
            # Previously verified as complete — trust stored status (e.g. live account checked with test key)
            return {"status": "complete", "account_id": account_id}
        # Account unreachable and never completed — clear it so a fresh one can be created
        await db.studios.update_one(
            {"owner_id": owner_id},
            {"$unset": {"stripe_connect_account_id": "", "stripe_connect_status": ""}}
        )
        return {"status": "not_connected", "account_id": None}


@api_router.get("/stripe/connect/return")
async def connect_return(request: Request):
    """Redirect target after Stripe Connect onboarding completes."""
    return JSONResponse({"message": "Onboarding abgeschlossen. Du kannst dieses Fenster schließen."})


@api_router.get("/stripe/connect/refresh")
async def connect_refresh(request: Request):
    """Redirect target when onboarding link expires — tell frontend to start again."""
    return JSONResponse({"message": "Der Link ist abgelaufen. Bitte starte das Onboarding erneut."})


@api_router.post("/stripe/connect/webhook")
async def stripe_connect_webhook(request: Request):
    """Handle Stripe Connect account.updated webhooks to sync status."""
    import stripe as stripe_lib
    stripe_lib.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
    payload = await request.body()
    try:
        event = stripe_lib.Event.construct_from(json.loads(payload), stripe_lib.api_key)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

    if event["type"] == "account.updated":
        account = event["data"]["object"]
        account_id = account["id"]
        details_submitted = account.get("details_submitted", False)
        charges_enabled = account.get("charges_enabled", False)
        status = "complete" if (details_submitted and charges_enabled) else "pending"
        await db.studios.update_one(
            {"stripe_connect_account_id": account_id},
            {"$set": {"stripe_connect_status": status}}
        )
    return {"received": True}

@api_router.post("/payments/create-session")
async def create_payment_session(data: PaymentCreateRequest, request: Request, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"booking_id": data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    user_id = current_user.get("id") or current_user.get("user_id")
    if booking.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    studio = await db.studios.find_one({"studio_id": booking.get("studio_id")}, {"_id": 0, "name": 1, "bank_holder": 1, "bank_iban": 1, "bank_bic": 1, "deposit_amount": 1, "stripe_connect_account_id": 1, "stripe_connect_status": 1})
    studio_name = studio.get("name", "Studio") if studio else "Studio"
    bank_holder = studio.get("bank_holder", "") if studio else ""
    bank_iban = studio.get("bank_iban", "") if studio else ""
    bank_bic = studio.get("bank_bic", "") if studio else ""

    # Prefer offer_deposit_amount (set after customer accepts offer), fall back to studio setting
    offer_deposit = booking.get("offer_deposit_amount")
    if offer_deposit and float(offer_deposit) > 0:
        raw_amount = float(offer_deposit)
    elif studio:
        raw_amount = studio.get("deposit_amount", 0.50)
    else:
        raw_amount = 0.50
    amount = max(float(raw_amount), 0.50)
    amount_cents = int(round(amount * 100))

    session_id = f"pay_{uuid.uuid4().hex[:16]}"

    # Build PaymentIntent kwargs — route to studio's Connect account if available
    customer_email = current_user.get("email", "")
    stripe = get_stripe_client()
    connect_account_id = studio.get("stripe_connect_account_id") if studio else None
    connect_status = studio.get("stripe_connect_status") if studio else None
    pi_kwargs = dict(
        amount=amount_cents,
        currency="eur",
        automatic_payment_methods={"enabled": True},
        receipt_email=customer_email if customer_email else None,
        metadata={
            "session_id": session_id,
            "booking_id": data.booking_id,
            "user_id": user_id,
            "studio_name": studio_name,
        },
        description=f"Anzahlung – {studio_name}",
    )
    platform_fee_percent = 5.0
    platform_fee_amount_cents = int(round(amount_cents * platform_fee_percent / 100))

    use_connect = connect_account_id and connect_status == "complete"
    if use_connect:
        pi_kwargs["transfer_data"] = {"destination": connect_account_id}
        pi_kwargs["application_fee_amount"] = platform_fee_amount_cents
    else:
        pi_kwargs["metadata"]["platform_fee_amount_cents"] = platform_fee_amount_cents
        pi_kwargs["metadata"]["platform_fee_percent"] = platform_fee_percent

    # Create real Stripe PaymentIntent — with Connect fallback if destination is invalid
    try:
        intent = await asyncio.to_thread(
            stripe.PaymentIntent.create,
            **pi_kwargs,
        )
    except Exception as pi_err:
        err_str = str(pi_err)
        # If the Connect destination account is invalid, retry without it
        if use_connect and ("No such destination" in err_str or "no such destination" in err_str.lower() or "No such account" in err_str):
            # Mark studio connect as pending so it doesn't keep failing
            await db.studios.update_one(
                {"studio_id": booking.get("studio_id")},
                {"$set": {"stripe_connect_status": "pending"}}
            )
            pi_kwargs.pop("transfer_data", None)
            pi_kwargs.pop("application_fee_amount", None)
            pi_kwargs["metadata"]["platform_fee_amount_cents"] = platform_fee_amount_cents
            pi_kwargs["metadata"]["platform_fee_percent"] = platform_fee_percent
            intent = await asyncio.to_thread(
                stripe.PaymentIntent.create,
                **pi_kwargs,
            )
        else:
            raise HTTPException(status_code=500, detail=f"Stripe-Fehler: {err_str}")

    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "booking_id": data.booking_id,
        "user_id": user_id,
        "session_id": session_id,
        "stripe_payment_intent_id": intent["id"],
        "amount": amount,
        "currency": "eur",
        "payment_status": "pending",
        "studio_name": studio_name,
        "platform_fee_amount": platform_fee_amount_cents,
        "platform_fee_percent": platform_fee_percent,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {
        "session_id": session_id,
        "client_secret": intent["client_secret"],
        "amount": amount,
        "currency": "eur",
        "studio_name": studio_name,
        "booking_date": booking.get("date", ""),
        "booking_time": booking.get("start_time", ""),
        "bank_holder": bank_holder,
        "bank_iban": bank_iban,
        "bank_bic": bank_bic
    }

@api_router.post("/payments/confirm/{session_id}")
async def confirm_payment(session_id: str, current_user: dict = Depends(get_current_user)):
    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if not txn:
        raise HTTPException(status_code=404, detail="Zahlung nicht gefunden")

    user_id = current_user.get("id") or current_user.get("user_id")
    if txn.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Nicht autorisiert")

    if txn.get("payment_status") == "paid":
        return {"payment_status": "paid"}

    is_final = txn.get("payment_type") == "final"

    # Verify with Stripe — PaymentIntent (deposits) or Checkout Session (final payments)
    stripe_lib_local = get_stripe_client()
    pi_id = txn.get("stripe_payment_intent_id")
    cs_id = txn.get("stripe_session_id")
    if pi_id:
        intent = await asyncio.to_thread(stripe_lib_local.PaymentIntent.retrieve, pi_id)
        if intent["status"] != "succeeded":
            raise HTTPException(status_code=400, detail="Zahlung noch nicht abgeschlossen")
    elif cs_id:
        cs = await asyncio.to_thread(stripe_lib_local.checkout.Session.retrieve, cs_id)
        if cs["payment_status"] != "paid":
            raise HTTPException(status_code=400, detail="Zahlung noch nicht abgeschlossen")

    now_iso = datetime.now(timezone.utc).isoformat()
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": "paid", "paid_at": now_iso}}
    )

    if txn.get("booking_id"):
        booking_id_ref = txn["booking_id"]
        if is_final:
            # Final payment → mark booking completed with revenue
            revenue_amount = txn.get("amount", 0)
            await db.bookings.update_one(
                {"booking_id": booking_id_ref},
                {"$set": {"status": "completed", "revenue": revenue_amount, "completed_at": now_iso, "payment_method": "stripe"}}
            )
        else:
            await db.bookings.update_one(
                {"booking_id": booking_id_ref},
                {"$set": {"payment_status": "paid", "status": "confirmed", "deposit_deadline_at": None}}
            )

        booking = await db.bookings.find_one({"booking_id": booking_id_ref})
        studio_obj = await db.studios.find_one({"studio_id": booking.get("studio_id")}) if booking else None
        owner_id = studio_obj.get("owner_id", "") if studio_obj else ""
        customer_id = booking.get("user_id", "") if booking else ""

        if booking:
            user_email = booking.get("user_email", "")
            bdate = booking.get("offer_date") or booking.get("date", "")
            btime = booking.get("offer_time") or booking.get("start_time", "")
            try:
                date_fmt = datetime.strptime(bdate, "%Y-%m-%d").strftime("%d.%m.%Y")
            except Exception:
                date_fmt = bdate

            if is_final:
                if user_email:
                    asyncio.create_task(send_email(
                        to=user_email,
                        subject=f"Zahlung erhalten – Danke! · {booking.get('studio_name', '')}",
                        html=f"""<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#18181b;">
  <div style="background:#18181b;padding:24px 32px;border-radius:16px 16px 0 0;"><p style="color:#fff;font-size:22px;font-weight:700;margin:0;">StudioOS &#9998;</p></div>
  <div style="background:#fff;padding:32px;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 16px 16px;">
    <p style="font-size:18px;font-weight:600;margin:0 0 8px;">Zahlung erhalten &#10003;</p>
    <p style="color:#71717a;font-size:14px;margin:0 0 16px;">Deine Zahlung f&#252;r den Termin am {date_fmt} bei {booking.get('studio_name','')} ist eingegangen. Vielen Dank!</p>
  </div>
</div>"""
                    ))
                if customer_id and owner_id:
                    asyncio.create_task(_post_system_message(
                        customer_id=customer_id, studio_owner_id=owner_id,
                        text=f"💳 Zahlung erhalten – Termin am {date_fmt} um {btime} Uhr ist abgeschlossen ✓",
                        triggered_by_id=customer_id
                    ))
                if studio_obj and owner_id:
                    asyncio.create_task(send_push_notification(
                        user_id=owner_id,
                        title="Zahlung erhalten",
                        body=f"{booking.get('user_name','Kunde')} hat die Abschlusszahlung bezahlt",
                        url="/studio-dashboard"
                    ))
            else:
                if user_email:
                    asyncio.create_task(send_email(
                        to=user_email,
                        subject=f"Dein Termin ist final gesichert – {booking.get('studio_name', '')}",
                        html=payment_confirmed_html(booking)
                    ))
                if customer_id and owner_id:
                    asyncio.create_task(_post_system_message(
                        customer_id=customer_id, studio_owner_id=owner_id,
                        text=f"💳 Anzahlung erhalten – Termin am {date_fmt} um {btime} Uhr ist jetzt bestätigt ✓",
                        triggered_by_id=customer_id
                    ))
                if studio_obj and owner_id:
                    asyncio.create_task(send_push_notification(
                        user_id=owner_id,
                        title="Anzahlung erhalten",
                        body=f"{booking.get('user_name','Kunde')} hat die Anzahlung bezahlt",
                        url="/studio-dashboard"
                    ))
                if studio_obj and booking:
                    asyncio.create_task(_create_invoice(booking, studio_obj, txn.get("amount", 0), "stripe", "deposit"))
        if is_final and booking and studio_obj:
            asyncio.create_task(_create_invoice(booking, studio_obj, txn.get("amount", 0), "stripe", "final"))

    return {"payment_status": "paid"}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    txn = await db.payment_transactions.find_one({"session_id": session_id})
    if not txn:
        raise HTTPException(status_code=404, detail="Zahlung nicht gefunden")
    return {"status": "complete" if txn.get("payment_status") == "paid" else "open",
            "payment_status": txn.get("payment_status", "pending")}

# ─── Subscriptions ────────────────────────────────────────────────────────────
SUBSCRIPTION_PLANS = {
    "free": {
        "name": "Kostenlos", "price": 0.0, "currency": "eur", "price_id": None,
        "artists_limit": 1, "slots_per_month": 5, "portfolio_images": 5,
        "features": ["basic_profile", "contact_form"],
        "branding": True, "chat": False, "deposit": False,
        "video_consultation": False, "newsletter": False, "analytics": False,
        "priority_search": False,
        "feature_labels": ["1 Artist", "5 Slots / Monat", "5 Portfolio-Bilder", "Basis-Profil", "Kontaktformular", "StudioOS-Branding sichtbar"]
    },
    "starter": {
        "name": "Starter", "price": 19.99, "currency": "eur", "price_id": "price_starter_dummy_01",
        "artists_limit": 2, "slots_per_month": 20, "portfolio_images": 20,
        "features": ["basic_profile", "contact_form", "chat", "email_notifications", "basic_stats", "reviews"],
        "branding": False, "chat": True, "deposit": False,
        "video_consultation": False, "newsletter": False, "analytics": True,
        "priority_search": False,
        "feature_labels": ["2 Artists", "20 Slots / Monat", "20 Portfolio-Bilder", "Chat-Terminbestätigung", "E-Mail-Benachrichtigungen", "Basis-Statistiken", "Kunden-Bewertungen", "Kein StudioOS-Branding"]
    },
    "pro": {
        "name": "Pro", "price": 49.99, "currency": "eur", "price_id": "price_pro_dummy_01",
        "artists_limit": 4, "slots_per_month": -1, "portfolio_images": 100,
        "features": ["basic_profile", "contact_form", "chat", "email_notifications", "advanced_stats", "reviews", "deposit", "calendar_sync", "custom_colors", "cancellation_management"],
        "branding": False, "chat": True, "deposit": True,
        "video_consultation": False, "newsletter": False, "analytics": True,
        "priority_search": True,
        "feature_labels": ["4 Artists", "Unlimited Slots", "100 Portfolio-Bilder", "Anzahlungsfunktion", "Erweiterte Statistiken", "Kalender-Sync", "Priorität in der Suche", "Storno-Management"]
    },
    "full_studio": {
        "name": "Full Studio", "price": 149.99, "currency": "eur", "price_id": "price_full_studio_dummy_01",
        "artists_limit": -1, "slots_per_month": -1, "portfolio_images": -1,
        "features": ["basic_profile", "contact_form", "chat", "email_notifications", "advanced_stats", "reviews", "deposit", "calendar_sync", "custom_colors", "cancellation_management", "video_consultation", "newsletter", "admin_support", "featured_banner", "sms_reminders", "performance_report"],
        "branding": False, "chat": True, "deposit": True,
        "video_consultation": True, "newsletter": True, "analytics": True,
        "priority_search": True,
        "feature_labels": ["Unlimited Artists", "Unlimited Slots", "Unlimited Portfolio-Bilder", "Videoberatung", "Newsletter-Kampagnen", "Dedicated Admin Support", "Hervorgehobenes Profil", "SMS-Erinnerungen", "Monatlicher Performance-Report"]
    }
}

def get_plan_limits(plan_name: str) -> dict:
    """Returns the plan limits dict. Defaults to 'free' if unknown."""
    return SUBSCRIPTION_PLANS.get(plan_name, SUBSCRIPTION_PLANS["free"])

async def get_studio_plan(studio_id: str) -> str:
    """Returns the active plan name for a studio (defaults to 'free')."""
    sub = await db.subscriptions.find_one({"studio_id": studio_id}, {"_id": 0, "plan": 1, "status": 1})
    if sub and sub.get("status") == "active":
        plan = sub.get("plan", "free")
        if plan in SUBSCRIPTION_PLANS:
            return plan
    return "free"


@api_router.get("/subscriptions/plans")
async def get_plans():
    return SUBSCRIPTION_PLANS

@api_router.get("/subscriptions/usage")
async def get_subscription_usage(current_user: dict = Depends(get_current_user)):
    """Returns current month's usage for a studio owner."""
    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"owner_id": user_id}, {"_id": 0, "studio_id": 1})
    if not studio:
        return {"has_studio": False}
    studio_id = studio["studio_id"]
    plan_name = await get_studio_plan(studio_id)
    limits = get_plan_limits(plan_name)
    # Count slots this month
    now = datetime.now(timezone.utc)
    month_start = f"{now.year}-{now.month:02d}-01"
    slots_used = await db.slots.count_documents({"studio_id": studio_id, "created_at": {"$gte": month_start}})
    # Count artists
    artists_count = await db.artists.count_documents({"studio_id": studio_id})
    # Count portfolio images
    studio_doc = await db.studios.find_one({"studio_id": studio_id}, {"_id": 0, "portfolio_images": 1})
    portfolio_count = len(studio_doc.get("portfolio_images", []) or [])
    return {
        "has_studio": True,
        "studio_id": studio_id,
        "plan": plan_name,
        "limits": limits,
        "usage": {
            "slots_this_month": slots_used,
            "artists": artists_count,
            "portfolio_images": portfolio_count
        }
    }

@api_router.get("/subscriptions/status")
async def get_subscription_status(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"owner_id": user_id}, {"_id": 0})
    if not studio:
        return {"has_studio": False, "subscription": None}
    sub = await db.subscriptions.find_one({"studio_id": studio["studio_id"]}, {"_id": 0})
    if not sub:
        return {"has_studio": True, "studio_id": studio["studio_id"], "subscription": None}
    # Check if expired
    if sub.get("expires_at"):
        expires = datetime.fromisoformat(sub["expires_at"])
        if expires < datetime.now(timezone.utc):
            sub["status"] = "expired"
            await db.subscriptions.update_one({"studio_id": studio["studio_id"]}, {"$set": {"status": "expired"}})
    return {"has_studio": True, "studio_id": studio["studio_id"], "subscription": sub}

@api_router.post("/subscriptions/checkout")
async def create_subscription_checkout(data: SubscriptionCheckoutRequest, request: Request, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["studio_owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only studio owners can subscribe")
    plan = SUBSCRIPTION_PLANS.get(data.plan)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"owner_id": user_id})
    studio_id = studio["studio_id"] if studio else f"pending_{user_id}"
    api_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
    origin = data.origin_url
    success_url = f"{origin}/studio-dashboard?sub=success&session_id={{CHECKOUT_SESSION_ID}}&plan={data.plan}"
    cancel_url = f"{origin}/subscription?sub=cancelled"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{str(request.base_url)}api/webhook/stripe")
    checkout_req = CheckoutSessionRequest(
        amount=float(plan["price"]),
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"type": "subscription", "plan": data.plan, "studio_id": studio_id, "user_id": user_id}
    )
    session = await stripe_checkout.create_checkout_session(checkout_req)
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "type": "subscription",
        "studio_id": studio_id,
        "user_id": user_id,
        "plan": data.plan,
        "session_id": session.session_id,
        "amount": float(plan["price"]),
        "currency": plan["currency"],
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/subscriptions/verify/{session_id}")
async def verify_subscription(session_id: str, plan: str, request: Request, current_user: dict = Depends(get_current_user)):
    api_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{str(request.base_url)}api/webhook/stripe")
    status = await stripe_checkout.get_checkout_status(session_id)
    if status.payment_status == "paid":
        txn = await db.payment_transactions.find_one({"session_id": session_id})
        if txn and txn.get("payment_status") != "paid":
            await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {"payment_status": "paid"}})
            studio_id = txn.get("studio_id", status.metadata.get("studio_id", ""))
            plan_name = txn.get("plan", plan)
            expires_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            await db.subscriptions.update_one(
                {"studio_id": studio_id},
                {"$set": {"studio_id": studio_id, "plan": plan_name, "status": "active", "started_at": datetime.now(timezone.utc).isoformat(), "expires_at": expires_at, "session_id": session_id}},
                upsert=True
            )
            # Mark studio as verified for active subscribers
            await db.studios.update_one({"studio_id": studio_id}, {"$set": {"is_verified": True, "subscription_plan": plan_name}})
            return {"status": "active", "plan": plan_name, "expires_at": expires_at}
    return {"status": status.status, "payment_status": status.payment_status}

@api_router.post("/subscriptions/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    studio = await db.studios.find_one({"owner_id": user_id})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    await db.subscriptions.update_one({"studio_id": studio["studio_id"]}, {"$set": {"status": "cancelled"}})
    return {"message": "Subscription cancelled"}

# ─── Artists ──────────────────────────────────────────────────────────────────
@api_router.get("/studios/{studio_id}/artists")
async def get_artists(studio_id: str):
    artists = await db.artists.find({"studio_id": studio_id}, {"_id": 0}).to_list(50)
    return artists

@api_router.post("/studios/{studio_id}/artists")
async def create_artist(studio_id: str, data: ArtistCreate, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    owner_id = current_user.get("id") or current_user.get("user_id")
    if not studio or (studio.get("owner_id") != owner_id and current_user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    artist_doc = {
        "artist_id": f"artist_{uuid.uuid4().hex[:12]}",
        "studio_id": studio_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.artists.insert_one(artist_doc)
    artist_doc.pop("_id", None)
    return artist_doc

@api_router.put("/studios/{studio_id}/artists/{artist_id}")
async def update_artist(studio_id: str, artist_id: str, data: ArtistUpdate, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    owner_id = current_user.get("id") or current_user.get("user_id")
    if not studio or (studio.get("owner_id") != owner_id and current_user.get("role") != "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.artists.update_one({"artist_id": artist_id, "studio_id": studio_id}, {"$set": update_data})
    return {"message": "Artist updated"}

@api_router.delete("/studios/{studio_id}/artists/{artist_id}")
async def delete_artist(studio_id: str, artist_id: str, current_user: dict = Depends(get_current_user)):
    studio = await db.studios.find_one({"studio_id": studio_id})
    owner_id = current_user.get("id") or current_user.get("user_id")
    if not studio or studio.get("owner_id") != owner_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.artists.delete_one({"artist_id": artist_id, "studio_id": studio_id})
    return {"message": "Artist deleted"}

# ─── Booking Reschedule ───────────────────────────────────────────────────────
@api_router.put("/bookings/{booking_id}/reschedule")
async def reschedule_booking(booking_id: str, data: BookingReschedule, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    user_id = current_user.get("id") or current_user.get("user_id")
    if booking.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if booking.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot reschedule a cancelled booking")
    new_slot = await db.slots.find_one({"slot_id": data.new_slot_id, "studio_id": booking["studio_id"]})
    if not new_slot:
        raise HTTPException(status_code=404, detail="New slot not found")
    if new_slot.get("is_booked"):
        raise HTTPException(status_code=400, detail="This slot is already booked")
    # Free old slot
    await db.slots.update_one({"slot_id": booking["slot_id"]}, {"$set": {"is_booked": False, "booking_id": None}})
    # Book new slot
    await db.slots.update_one({"slot_id": data.new_slot_id}, {"$set": {"is_booked": True, "booking_id": booking_id}})
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$set": {"slot_id": data.new_slot_id, "date": new_slot["date"], "start_time": new_slot["start_time"], "end_time": new_slot["end_time"], "status": "pending", "rescheduled_at": datetime.now(timezone.utc).isoformat()}}
    )
    # Email notification
    user_email = booking.get("user_email", "")
    if user_email:
        asyncio.create_task(send_email(
            to=user_email,
            subject=f"Termin umgebucht – {booking.get('studio_name', '')}",
            html=f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                <h2 style="font-weight:bold;">Termin erfolgreich umgebucht</h2>
                <p>Dein Termin bei <strong>{booking.get('studio_name','')}</strong> wurde umgebucht auf:</p>
                <p><strong>{new_slot['date']}</strong> um <strong>{new_slot['start_time']} – {new_slot['end_time']}</strong></p>
                <p style="color:#555;font-size:13px;">Buchungs-ID: {booking_id}</p>
            </div>"""
        ))
    updated = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    return updated
@api_router.post("/ai/style-advisor")
async def ai_style_advisor(data: AIStyleRequest, current_user: dict = Depends(get_current_user)):
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    
    if data.language == "de":
        system_msg = """Du bist ein erfahrener Tattoo-Künstler und Stilberater mit über 15 Jahren Erfahrung. 
        Analysiere Bilder und Beschreibungen und gib detaillierte Empfehlungen für Tattoo-Stile.
        Antworte auf Deutsch. Strukturiere deine Antwort in: 
        1. Empfohlene Stile (mit Erklärung)
        2. Passende Künstler/Studios für diesen Stil
        3. Wichtige Hinweise für das Gespräch mit dem Künstler
        4. Pflege-Tipps für den gewählten Stil"""
    else:
        system_msg = """You are an experienced tattoo artist and style consultant with 15+ years of experience.
        Analyze images and descriptions and provide detailed tattoo style recommendations.
        Structure your response in:
        1. Recommended Styles (with explanation)
        2. Suitable artists/studios for this style
        3. Important notes for the conversation with the artist
        4. Care tips for the chosen style"""
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"style_{uuid.uuid4().hex[:8]}",
        system_message=system_msg
    ).with_model("openai", "gpt-4o")
    
    user_text = data.description if data.description else (
        "Analysiere bitte dieses Bild und empfehle passende Tattoo-Stile." if data.language == "de"
        else "Please analyze this image and recommend suitable tattoo styles."
    )
    
    if data.image_base64:
        image_content = ImageContent(image_base64=data.image_base64)
        user_message = UserMessage(text=user_text, file_contents=[image_content])
    else:
        user_message = UserMessage(text=user_text)
    
    response = await chat.send_message(user_message)
    
    await db.ai_consultations.insert_one({
        "consultation_id": f"ai_{uuid.uuid4().hex[:12]}",
        "user_id": current_user.get("id") or current_user.get("user_id"),
        "description": data.description,
        "response": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"recommendation": response}

# ─── Upload Image ──────────────────────────────────────────────────────────────
@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    content = await file.read()
    b64 = base64.b64encode(content).decode("utf-8")
    mime = file.content_type or "image/jpeg"
    data_url = f"data:{mime};base64,{b64}"
    return {"url": data_url, "base64": b64, "mime_type": mime}

@api_router.post("/inquiries/upload-image")
async def upload_inquiry_image(file: UploadFile = File(...)):
    """Guest-accessible image upload for inquiry reference photos — no auth required."""
    content = await file.read()
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Datei zu groß (max. 8 MB).")
    b64 = base64.b64encode(content).decode("utf-8")
    mime = file.content_type or "image/jpeg"
    data_url = f"data:{mime};base64,{b64}"
    return {"url": data_url}

# ─── Studio Dashboard Stats ───────────────────────────────────────────────────
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    role = current_user.get("role")
    
    if role == "studio_owner":
        studio = await db.studios.find_one({"owner_id": user_id}, {"_id": 0})
        if not studio:
            return {"has_studio": False}
        
        studio_id = studio["studio_id"]
        total_bookings = await db.bookings.count_documents({"studio_id": studio_id})
        pending = await db.bookings.count_documents({"studio_id": studio_id, "status": "pending"})
        confirmed = await db.bookings.count_documents({"studio_id": studio_id, "status": "confirmed"})
        revenue_docs = await db.payment_transactions.find({"payment_status": "paid"}).to_list(1000)
        
        # Filter by studio bookings
        studio_bookings = await db.bookings.find({"studio_id": studio_id, "payment_status": "paid"}, {"booking_id": 1, "_id": 0}).to_list(1000)
        studio_booking_ids = {b["booking_id"] for b in studio_bookings}
        revenue = sum(t.get("amount", 0) for t in revenue_docs if t.get("booking_id") in studio_booking_ids)

        # Deposit stats – all paid transactions linked to this studio's bookings
        all_studio_booking_ids_for_deposits = {
            b["booking_id"] for b in await db.bookings.find(
                {"studio_id": studio_id}, {"booking_id": 1, "_id": 0}
            ).to_list(5000)
        }
        deposit_txns = [t for t in revenue_docs if t.get("booking_id") in all_studio_booking_ids_for_deposits and t.get("payment_type") != "final"]
        deposit_count = len(deposit_txns)
        deposit_total = sum(t.get("amount", 0) for t in deposit_txns)
        now_iso = datetime.now(timezone.utc)
        month_prefix = f"{now_iso.year}-{str(now_iso.month).zfill(2)}"
        deposit_month = sum(
            t.get("amount", 0) for t in deposit_txns
            if (t.get("paid_at") or t.get("created_at", "")).startswith(month_prefix)
        )

        # Cash revenue breakdown (bookings completed via cash payment)
        cash_bookings_all = await db.bookings.find(
            {"studio_id": studio_id, "status": "completed", "payment_method": "cash"},
            {"_id": 0}
        ).to_list(500)
        cash_revenue_month = sum(
            b.get("revenue", 0) for b in cash_bookings_all
            if (b.get("completed_at") or "").startswith(month_prefix)
        )
        cash_revenue_total = sum(b.get("revenue", 0) for b in cash_bookings_all)

        # Stripe final payment breakdown
        stripe_final_txns = [
            t for t in revenue_docs
            if t.get("booking_id") in all_studio_booking_ids_for_deposits and t.get("payment_type") == "final"
        ]
        stripe_final_month = sum(
            t.get("amount", 0) for t in stripe_final_txns
            if (t.get("paid_at") or t.get("created_at", "")).startswith(month_prefix)
        )
        stripe_final_total = sum(t.get("amount", 0) for t in stripe_final_txns)
        stripe_revenue_month = deposit_month + stripe_final_month
        stripe_revenue_total = deposit_total + stripe_final_total

        upcoming = await db.bookings.find(
            {"studio_id": studio_id, "status": {"$in": ["pending", "confirmed"]}},
            {"_id": 0}
        ).sort("date", 1).limit(5).to_list(5)

        all_studio_bookings = await db.bookings.find(
            {"studio_id": studio_id},
            {"_id": 0}
        ).sort([("date", -1), ("start_time", -1)]).to_list(500)

        return {
            "has_studio": True,
            "studio": studio,
            "total_bookings": total_bookings,
            "pending_bookings": pending,
            "confirmed_bookings": confirmed,
            "revenue": revenue,
            "upcoming_bookings": upcoming,
            "all_bookings": all_studio_bookings,
            "deposit_count": deposit_count,
            "deposit_total": deposit_total,
            "deposit_month": deposit_month,
            "cash_revenue_month": cash_revenue_month,
            "cash_revenue_total": cash_revenue_total,
            "stripe_revenue_month": stripe_revenue_month,
            "stripe_revenue_total": stripe_revenue_total,
        }
    else:
        # Support both old UUID-based user_id and new ObjectId-string user_id
        alt_user_id = current_user.get("user_id")
        if alt_user_id and alt_user_id != user_id:
            bookings_query = {"$or": [{"user_id": user_id}, {"user_id": alt_user_id}]}
        else:
            bookings_query = {"user_id": user_id}

        bookings = await db.bookings.find(
            bookings_query, {"_id": 0}
        ).sort([("date", 1), ("start_time", 1)]).to_list(500)
        upcoming_list = [b for b in bookings if b.get("status") in ["pending", "confirmed"]]
        return {
            "total_bookings": len(bookings),
            "upcoming_bookings": upcoming_list,
            "all_bookings": bookings
        }

# ─── Seed Data ────────────────────────────────────────────────────────────────
async def seed_demo_data():
    # Check if seeding is disabled
    config = await db.config.find_one({"key": "seed_disabled"})
    if config:
        return
    count = await db.studios.count_documents({})
    if count > 0:
        return
    
    studios_data = [
        {
            "studio_id": "studio_demo001",
            "owner_id": "demo_owner_1",
            "owner_name": "Max Müller",
            "name": "Black Needle Studio",
            "description": "Spezialisiert auf Fine-Line und Blackwork Tattoos im Herzen von Berlin. Unser Team aus erfahrenen Künstlern bringt deine Ideen mit präzisen Linien zum Leben.",
            "address": "Mitte, Unter den Linden 15",
            "city": "Berlin",
            "country": "DE",
            "phone": "+49 30 12345678",
            "email": "info@blackneedle.de",
            "website": "www.blackneedle.de",
            "styles": ["Fine Line", "Blackwork", "Minimalist", "Geometric"],
            "price_range": "premium",
            "images": [
                "https://images.unsplash.com/photo-1753259789341-808371092e19?w=800&q=80",
                "https://images.unsplash.com/photo-1646582679733-df910660e97f?w=400&q=80"
            ],
            "avg_rating": 4.8,
            "review_count": 124,
            "is_verified": True,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "studio_id": "studio_demo002",
            "owner_id": "demo_owner_2",
            "owner_name": "Sophie Schneider",
            "name": "Ink & Soul Hamburg",
            "description": "Traditional und Neo-Traditional Tattoos mit Soul. Wir leben für die klassische Tattoo-Kunst und verleihen ihr modernen Touch.",
            "address": "Altona, Große Bergstraße 44",
            "city": "Hamburg",
            "country": "DE",
            "phone": "+49 40 98765432",
            "email": "hello@inkandsoul.de",
            "website": "www.inkandsoul.de",
            "styles": ["Traditional", "Neo-Traditional", "Japanese", "Color"],
            "price_range": "medium",
            "images": [
                "https://images.unsplash.com/photo-1753259669126-660f46975072?w=800&q=80",
                "https://images.unsplash.com/photo-1547754145-ef9ff306e3f3?w=400&q=80"
            ],
            "avg_rating": 4.6,
            "review_count": 89,
            "is_verified": True,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "studio_id": "studio_demo003",
            "owner_id": "demo_owner_3",
            "owner_name": "Jonas Weber",
            "name": "Realismus Atelier München",
            "description": "Realistisch wie ein Foto auf der Haut. Unser Atelier ist bekannt für fotorealistische Portraits und hyperdetaillierte Tattoos.",
            "address": "Schwabing, Leopoldstraße 88",
            "city": "München",
            "country": "DE",
            "phone": "+49 89 55544433",
            "email": "kontakt@realismusatelier.de",
            "website": "www.realismusatelier.de",
            "styles": ["Realism", "Portrait", "Black & Grey", "Watercolor"],
            "price_range": "luxury",
            "images": [
                "https://static.prod-images.emergentagent.com/jobs/fb00eb6e-6246-4f6c-a06b-60ac2c5daad3/images/cf804c7f5972bdc1c3d43b1412ac2a5ede08617136c3cb6cc4242e80caad2940.png",
                "https://images.unsplash.com/photo-1646582679733-df910660e97f?w=400&q=80"
            ],
            "avg_rating": 4.9,
            "review_count": 67,
            "is_verified": True,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "studio_id": "studio_demo004",
            "owner_id": "demo_owner_4",
            "owner_name": "Lena Fischer",
            "name": "Ink Rebels Köln",
            "description": "Alternative und Underground Tattoo-Kunst. Wir sind für alle da, die etwas Einzigartiges suchen – von Tribal bis Surrealism.",
            "address": "Ehrenfeld, Venloer Straße 120",
            "city": "Köln",
            "country": "DE",
            "phone": "+49 221 33344455",
            "email": "rebels@inkrebels.de",
            "website": "www.inkrebels.de",
            "styles": ["Tribal", "Surrealism", "Abstract", "Illustrative"],
            "price_range": "medium",
            "images": [
                "https://images.unsplash.com/photo-1547754145-ef9ff306e3f3?w=800&q=80"
            ],
            "avg_rating": 4.5,
            "review_count": 45,
            "is_verified": False,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for studio in studios_data:
        await db.studios.insert_one(studio)
    
    # Seed slots for demo studios
    from datetime import date, timedelta as td
    today = date.today()
    slot_types = [
        {"slot_type": "consultation", "duration_minutes": 30, "start_time": "10:00", "end_time": "10:30"},
        {"slot_type": "tattoo", "duration_minutes": 120, "start_time": "11:00", "end_time": "13:00"},
        {"slot_type": "tattoo", "duration_minutes": 180, "start_time": "14:00", "end_time": "17:00"},
        {"slot_type": "consultation", "duration_minutes": 30, "start_time": "09:00", "end_time": "09:30"},
    ]
    
    for studio in studios_data[:2]:
        for day_offset in range(1, 15):
            slot_date = (today + td(days=day_offset)).isoformat()
            for slot_tmpl in slot_types[:2]:
                slot = {
                    "slot_id": f"slot_{uuid.uuid4().hex[:12]}",
                    "studio_id": studio["studio_id"],
                    "date": slot_date,
                    **slot_tmpl,
                    "is_booked": False,
                    "notes": "",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.slots.insert_one(slot)
    
    logger.info("Demo data seeded successfully")

# ─── Push Notifications ──────────────────────────────────────────────────────
@api_router.post("/notifications/subscribe")
async def subscribe_push(data: PushSubscription, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    subscription_info = {"endpoint": data.endpoint, "keys": data.keys}
    await db.users.update_one(
        {"$or": [{"_id": ObjectId(user_id)} if len(user_id) == 24 else {"user_id": user_id}]},
        {"$addToSet": {"push_subscriptions": subscription_info}}
    )
    return {"message": "Subscribed successfully"}

@api_router.delete("/notifications/unsubscribe")
async def unsubscribe_push(data: PushSubscription, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    await db.users.update_one(
        {"$or": [{"_id": ObjectId(user_id)} if len(user_id) == 24 else {"user_id": user_id}]},
        {"$pull": {"push_subscriptions": {"endpoint": data.endpoint}}}
    )
    return {"message": "Unsubscribed"}

@api_router.get("/notifications/vapid-public-key")
async def get_vapid_public_key():
    return {"public_key": os.environ.get("VAPID_PUBLIC_KEY", "")}

async def send_push_notification(user_id: str, title: str, body: str, url: str = "/"):
    try:
        from pywebpush import webpush, WebPushException
        import json as json_lib
        vapid_private = os.environ.get("VAPID_PRIVATE_KEY", "")
        vapid_email = os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:admin@inkbook.com")
        if not vapid_private:
            return
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            user = await db.users.find_one({"user_id": user_id})
        if not user or not user.get("push_subscriptions"):
            return
        payload = json_lib.dumps({"title": title, "body": body, "url": url})
        for sub in user["push_subscriptions"]:
            try:
                await asyncio.to_thread(
                    webpush,
                    subscription_info=sub,
                    data=payload,
                    vapid_private_key=vapid_private,
                    vapid_claims={"sub": vapid_email}
                )
            except WebPushException as e:
                logger.warning(f"Push failed: {e}")
    except Exception as e:
        logger.warning(f"Push notification error: {e}")

# ─── Admin Panel Endpoints ────────────────────────────────────────────────────
async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

class ConsentData(BaseModel):
    analytics: bool
    marketing: bool
    timestamp: str

@api_router.post("/consent")
async def save_consent(data: ConsentData, request: Request):
    import hashlib
    ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:16]
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "consent_id": f"cns_{uuid.uuid4().hex[:10]}",
        "ip_hash": ip_hash,
        "analytics": data.analytics,
        "marketing": data.marketing,
        "timestamp": data.timestamp or now,
        "saved_at": now,
    }
    token = request.cookies.get("access_token")
    if token:
        try:
            payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub") or payload.get("user_id")
            if user_id:
                doc["user_id"] = user_id
        except Exception:
            pass
    await db.consent_records.insert_one(doc)
    return {"ok": True}

@api_router.get("/admin/stats")
async def admin_stats(current_user: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_studios = await db.studios.count_documents({})
    active_studios = await db.studios.count_documents({"is_active": True})
    total_bookings = await db.bookings.count_documents({})
    confirmed_bookings = await db.bookings.count_documents({"status": "confirmed"})
    pending_bookings = await db.bookings.count_documents({"status": "pending"})
    total_revenue_cursor = db.payment_transactions.aggregate([
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ])
    revenue_result = await total_revenue_cursor.to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    active_subscriptions = await db.subscriptions.count_documents({"status": "active"})
    customers = await db.users.count_documents({"role": "customer"})
    studio_owners = await db.users.count_documents({"role": "studio_owner"})
    recent_bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    return {
        "total_users": total_users,
        "customers": customers,
        "studio_owners": studio_owners,
        "total_studios": total_studios,
        "active_studios": active_studios,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "pending_bookings": pending_bookings,
        "total_revenue": round(total_revenue, 2),
        "active_subscriptions": active_subscriptions,
        "recent_bookings": recent_bookings
    }

@api_router.get("/admin/studios")
async def admin_list_studios(current_user: dict = Depends(require_admin)):
    studios = await db.studios.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    result = []
    for s in studios:
        sub = await db.subscriptions.find_one({"studio_id": s["studio_id"]}, {"_id": 0})
        booking_count = await db.bookings.count_documents({"studio_id": s["studio_id"]})
        result.append({**s, "subscription": sub, "booking_count": booking_count})
    return result

@api_router.patch("/admin/studios/{studio_id}")
async def admin_update_studio(studio_id: str, data: AdminStudioUpdate, current_user: dict = Depends(require_admin)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.studios.update_one({"studio_id": studio_id}, {"$set": update})
    return {"message": "Studio updated"}

@api_router.get("/admin/users")
async def admin_list_users(current_user: dict = Depends(require_admin)):
    users = await db.users.find({}, {"password_hash": 0}).sort("created_at", -1).to_list(500)
    result = []
    for u in users:
        obj_id = str(u.pop("_id", ""))
        u["user_id"] = u.get("user_id") or obj_id
        result.append(u)
    return result

@api_router.delete("/admin/studios/{studio_id}")
async def admin_delete_studio(studio_id: str, current_user: dict = Depends(require_admin)):
    await db.studios.delete_one({"studio_id": studio_id})
    await db.slots.delete_many({"studio_id": studio_id})
    return {"message": "Studio deleted"}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    from bson import ObjectId
    # Find user by user_id field OR by MongoDB _id
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except Exception:
            pass
    if not user:
        raise HTTPException(status_code=404, detail="Nutzer nicht gefunden")
    if user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admin-Konten können nicht gelöscht werden")

    # Resolve the actual user_id used in other collections
    resolved_id = user.get("user_id") or str(user.get("_id", ""))

    # If studio owner: clean up their studio data
    if user.get("role") == "studio_owner":
        studio = await db.studios.find_one({"owner_id": resolved_id})
        if studio:
            studio_id_val = studio.get("studio_id")
            await db.artists.delete_many({"studio_id": studio_id_val})
            await db.slots.delete_many({"studio_id": studio_id_val})
            await db.studios.delete_one({"studio_id": studio_id_val})

    # Cancel active bookings
    await db.bookings.update_many(
        {"user_id": resolved_id, "status": {"$in": ["pending", "confirmed"]}},
        {"$set": {"status": "cancelled", "cancelled_by": "admin"}}
    )

    # Delete user – match by _id for safety
    await db.users.delete_one({"_id": user["_id"]})

    return {"message": "Nutzer erfolgreich gelöscht"}

# ─── Support Chat ──────────────────────────────────────────────────────────────

class SupportChatRequest(BaseModel):
    session_id: str
    message: str

@api_router.post("/support/chat")
async def support_chat(req: SupportChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Nachricht darf nicht leer sein")

    emergent_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not emergent_key:
        raise HTTPException(status_code=500, detail="LLM nicht konfiguriert")

    # Load existing chat history from DB
    history_doc = await db.support_chats.find_one({"session_id": req.session_id}, {"_id": 0})
    messages_history = history_doc.get("messages", []) if history_doc else []

    # Build conversation context for the model
    system_msg = (
        "Du bist der freundliche Support-Assistent von StudioOS, der führenden Tattoo-Buchungsplattform in Deutschland. "
        "Du hilfst Kunden und Studios bei Fragen zu: Buchungen, Terminen, Studios, Artists, Preisen, Konten, Zahlungen, "
        "technischen Problemen und der allgemeinen App-Nutzung. "
        "Antworte immer auf Deutsch. Sei hilfsbereit, freundlich und präzise. "
        "Halte deine Antworten kurz und klar (maximal 3–4 Sätze). "
        "Wenn du eine Frage nicht beantworten kannst, empfiehl dem Nutzer den menschlichen Kundendienst."
    )

    # Reconstruct context from history (last 10 messages)
    context_parts = []
    for msg in messages_history[-10:]:
        role_label = "Nutzer" if msg["role"] == "user" else "Assistent"
        context_parts.append(f"{role_label}: {msg['content']}")

    if context_parts:
        full_message = "\n".join(context_parts) + f"\nNutzer: {req.message}"
    else:
        full_message = req.message

    try:
        chat = LlmChat(
            api_key=emergent_key,
            session_id=req.session_id + "_support",
            system_message=system_msg,
        ).with_model("anthropic", "claude-haiku-4-5-20251001")

        response = await chat.send_message(UserMessage(text=full_message))

        # Save to DB
        now = datetime.now(timezone.utc).isoformat()
        new_messages = messages_history + [
            {"role": "user", "content": req.message, "timestamp": now},
            {"role": "assistant", "content": response, "timestamp": now},
        ]
        await db.support_chats.update_one(
            {"session_id": req.session_id},
            {"$set": {"session_id": req.session_id, "messages": new_messages, "updated_at": now}},
            upsert=True,
        )
        return {"response": response, "session_id": req.session_id}
    except Exception as e:
        logger.error(f"Support chat error: {e}")
        raise HTTPException(status_code=500, detail="KI-Antwort konnte nicht generiert werden")


# ─── AI Booking Agent ──────────────────────────────────────────────────────────

AGENT_SYSTEM_PROMPT = """Du bist "Ink", der intelligente KI-Buchungsassistent von StudioOS – Deutschlands führender Plattform für Tattoo-Studio-Buchungen.

## Deine Fähigkeiten – Tools
Wenn du eine Aktion ausführen willst, antworte mit EXAKT dieser Syntax (NUR die TOOL-Zeile, kein weiterer Text):
TOOL: tool_name | {"param": "wert"}

Verfügbare Tools:
- TOOL: search_studios | {"city": "Stadtname", "limit": 3}
  Nutze dies wenn jemand Studios in einer Stadt oder Region sucht.

- TOOL: get_slots | {"studio_id": "ID", "studio_name": "Studioname"}
  Freie Termine eines Studios abrufen. studio_id wenn bekannt, sonst studio_name.

- TOOL: create_booking | {"studio_id": "ID", "slot_id": "ID", "booking_type": "tattoo", "notes": ""}
  Termin buchen. Buchungstypen: tattoo | consultation | video_consultation

- TOOL: get_studio_info | {"studio_id_or_name": "Name oder ID"}
  Detailinfos eines Studios abrufen.

## REGELN
1. Tool aufrufen -> NUR die TOOL: Zeile schreiben, KEIN Text davor/danach
2. Normale Antwort -> kein TOOL: Präfix
3. IMMER auf Deutsch antworten, freundlich und persönlich (max. 3-4 Sätze)
4. Buchungen ohne Login -> sage dem Nutzer er soll sich zuerst anmelden
5. Buchungstyp nicht angegeben -> frage danach bevor du buchst

## StudioOS Plattform-Wissen
- Buchungstypen: tattoo (Tätowierung vor Ort), consultation (Beratung vor Ort), video_consultation (Remote Video-Call)
- Kunden: kostenlos, Studios suchen/buchen/bewerten, Live-Chat mit Studios, Video-Konsultationen
- Studios: monatliches Abo, Kalender verwalten, Buchungen annehmen/ablehnen
- Buchungen erscheinen sofort in BEIDEN Dashboards (Kunde + Studio)
- Alle Buchungen starten als "Ausstehend" -> Studio muss bestätigen
"""

class AIChatAgentRequest(BaseModel):
    session_id: str
    message: str

async def _execute_agent_tool(tool_name: str, params: dict, current_user=None) -> dict:
    try:
        if tool_name == "search_studios":
            city = params.get("city", "")
            limit = min(int(params.get("limit", 3)), 6)
            query = {"$or": [
                {"city": {"$regex": city, "$options": "i"}},
                {"address": {"$regex": city, "$options": "i"}},
                {"name": {"$regex": city, "$options": "i"}},
                {"description": {"$regex": city, "$options": "i"}},
            ]}
            studios = await db.studios.find(
                query,
                {"_id": 0, "studio_id": 1, "name": 1, "city": 1, "address": 1,
                 "avg_rating": 1, "booking_types": 1, "price_from": 1,
                 "avatar_url": 1, "cover_url": 1, "styles": 1, "description": 1}
            ).limit(limit).to_list(limit)
            return {"tool": "search_studios", "studios": studios, "city": city, "count": len(studios)}

        elif tool_name == "get_slots":
            studio_id = params.get("studio_id", "")
            studio_name_hint = params.get("studio_name", "")
            if not studio_id and studio_name_hint:
                doc = await db.studios.find_one(
                    {"name": {"$regex": studio_name_hint, "$options": "i"}},
                    {"_id": 0, "studio_id": 1, "name": 1}
                )
                if doc:
                    studio_id = doc["studio_id"]
                    studio_name_hint = doc["name"]
            if not studio_id:
                return {"tool": "get_slots", "error": "Studio nicht gefunden", "slots": []}
            today = datetime.now(timezone.utc).date().isoformat()
            future_date = (datetime.now(timezone.utc).date() + timedelta(days=30)).isoformat()
            slots = await db.slots.find(
                {"studio_id": studio_id, "is_booked": False,
                 "date": {"$gte": today, "$lte": future_date}},
                {"_id": 0}
            ).sort("date", 1).limit(8).to_list(8)
            if not studio_name_hint:
                s = await db.studios.find_one({"studio_id": studio_id}, {"_id": 0, "name": 1})
                studio_name_hint = s["name"] if s else "Unbekannt"
            return {"tool": "get_slots", "slots": slots, "studio_id": studio_id, "studio_name": studio_name_hint}

        elif tool_name == "create_booking":
            if not current_user:
                return {"tool": "create_booking", "error": "not_authenticated"}
            studio_id = params.get("studio_id", "")
            slot_id = params.get("slot_id", "")
            booking_type = params.get("booking_type", "tattoo")
            notes = params.get("notes", "")
            slot = await db.slots.find_one(
                {"slot_id": slot_id, "studio_id": studio_id, "is_booked": False}, {"_id": 0}
            )
            if not slot:
                return {"tool": "create_booking", "error": "slot_not_available"}
            studio = await db.studios.find_one({"studio_id": studio_id}, {"_id": 0, "name": 1, "owner_id": 1})
            if not studio:
                return {"tool": "create_booking", "error": "studio_not_found"}
            user_id = current_user.get("id") or current_user.get("user_id")
            booking_doc = {
                "booking_id": f"book_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "user_name": current_user.get("name", ""),
                "user_email": current_user.get("email", ""),
                "studio_id": studio_id,
                "studio_name": studio.get("name", ""),
                "slot_id": slot_id,
                "date": slot.get("date"),
                "start_time": slot.get("start_time"),
                "end_time": slot.get("end_time"),
                "booking_type": booking_type,
                "notes": notes,
                "reference_images": [],
                "status": "pending",
                "payment_status": "unpaid",
                "deposit_amount": 50.0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "source": "ai_chat",
            }
            await db.bookings.insert_one(booking_doc)
            await db.slots.update_one({"slot_id": slot_id}, {"$set": {"is_booked": True, "booking_id": booking_doc["booking_id"]}})
            booking_doc.pop("_id", None)
            if booking_doc["user_email"]:
                asyncio.create_task(send_email(
                    to=booking_doc["user_email"],
                    subject=f"Buchungsbestätigung – {studio.get('name', '')}",
                    html=booking_confirmation_html(booking_doc)
                ))
            owner = await db.users.find_one({"user_id": studio.get("owner_id", "")})
            if owner and owner.get("email"):
                asyncio.create_task(send_email(
                    to=owner["email"],
                    subject=f"Neue Buchung via KI-Assistent – {booking_doc['user_name']} · {slot.get('date','')}",
                    html=booking_confirmation_studio_html(booking_doc)
                ))
            asyncio.create_task(send_push_notification(
                user_id=studio.get("owner_id", ""),
                title="Neue Buchung via KI-Assistent",
                body=f"{booking_doc['user_name']} hat {slot.get('date','')} gebucht",
                url="/studio-dashboard"
            ))
            return {"tool": "create_booking", "success": True, "booking": booking_doc}

        elif tool_name == "get_studio_info":
            name_or_id = params.get("studio_id_or_name", "")
            studio = await db.studios.find_one(
                {"$or": [{"studio_id": name_or_id}, {"name": {"$regex": name_or_id, "$options": "i"}}]},
                {"_id": 0}
            )
            if not studio:
                return {"tool": "get_studio_info", "error": "Studio nicht gefunden"}
            return {"tool": "get_studio_info", "studio": studio}

        return {"tool": tool_name, "error": f"Unbekanntes Tool: {tool_name}"}
    except Exception as e:
        logger.error(f"Agent tool error [{tool_name}]: {e}")
        return {"tool": tool_name, "error": str(e)}


@api_router.post("/chat/agent")
async def ai_chat_agent(
    req: AIChatAgentRequest,
    current_user=Depends(get_current_user_optional)
):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Nachricht darf nicht leer sein")

    emergent_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not LlmChat or not emergent_key:
        raise HTTPException(status_code=500, detail="KI nicht konfiguriert")

    hist_doc = await db.ai_agent_chats.find_one({"session_id": req.session_id}, {"_id": 0})
    history = hist_doc.get("messages", []) if hist_doc else []

    ctx_lines = []
    for m in history[-12:]:
        label = "Nutzer" if m["role"] == "user" else "Ink"
        ctx_lines.append(f"{label}: {m['content']}")

    user_ctx = ""
    if current_user:
        user_ctx = f"\n\nEINGELOGGTER NUTZER: {current_user.get('name','?')} (Rolle: {current_user.get('role','customer')})"

    system = AGENT_SYSTEM_PROMPT + user_ctx
    full_msg = ("\n".join(ctx_lines) + f"\nNutzer: {req.message}") if ctx_lines else req.message

    tool_result_data = None
    final_text = ""
    import time as _time

    try:
        chat1 = LlmChat(
            api_key=emergent_key,
            session_id=f"agent_{req.session_id}_{int(_time.time()*1000)}",
            system_message=system,
        ).with_model("anthropic", "claude-haiku-4-5-20251001")
        r1 = (await chat1.send_message(UserMessage(text=full_msg))).strip()

        # Extract TOOL: line even if Claude added extra text before it
        tool_line_match = None
        for _line in r1.split("\n"):
            stripped = _line.strip()
            if stripped.startswith("TOOL:"):
                tool_line_match = stripped
                break

        if tool_line_match:
            try:
                line = tool_line_match[5:].strip()
                pipe = line.index("|")
                tool_name = line[:pipe].strip()
                params = json.loads(line[pipe + 1:].strip())
                tool_result = await _execute_agent_tool(tool_name, params, current_user)
                tool_result_data = tool_result

                if tool_result.get("error") == "not_authenticated":
                    final_text = "Um einen Termin zu buchen, musst du dich zuerst anmelden. Bitte melde dich an oder registriere dich kostenlos – es dauert nur eine Minute!"
                    tool_result_data = {"tool": "create_booking", "error": "not_authenticated"}
                else:
                    summary_json = json.dumps(tool_result, ensure_ascii=False, default=str)
                    follow_up = (
                        f"Tool-Ergebnis ({tool_name}):\n{summary_json}\n\n"
                        "Formuliere jetzt eine kurze, freundliche deutsche Antwort (max. 2 Sätze). "
                        "Die UI-Karten werden automatisch angezeigt, liste Details NICHT auf."
                    )
                    chat2 = LlmChat(
                        api_key=emergent_key,
                        session_id=f"agent_{req.session_id}_r2_{int(_time.time()*1000)}",
                        system_message=system,
                    ).with_model("anthropic", "claude-haiku-4-5-20251001")
                    final_text = (await chat2.send_message(UserMessage(text=follow_up))).strip()
            except Exception as pe:
                logger.warning(f"Tool parse error: {pe} | {tool_line_match}")
                final_text = r1
        else:
            final_text = r1

        now_iso = datetime.now(timezone.utc).isoformat()
        new_history = history + [
            {"role": "user", "content": req.message, "timestamp": now_iso},
            {"role": "assistant", "content": final_text, "timestamp": now_iso},
        ]
        await db.ai_agent_chats.update_one(
            {"session_id": req.session_id},
            {"$set": {"session_id": req.session_id, "messages": new_history, "updated_at": now_iso}},
            upsert=True,
        )
        return {"response": final_text, "session_id": req.session_id, "tool_result": tool_result_data}

    except Exception as e:
        logger.error(f"AI agent error: {e}")
        raise HTTPException(status_code=500, detail="KI-Antwort nicht verfügbar")


@api_router.get("/support/admin-id")
async def get_support_admin_id():
    if not admin:
        raise HTTPException(status_code=404, detail="Kein Admin gefunden")
    # Try user_id first, fall back to str(_id)
    admin_id = admin.get("user_id") or str(admin.get("_id", ""))
    admin_name = admin.get("name", "Support")
    return {"admin_id": admin_id, "admin_name": admin_name}

# ─── Newsletter ─────────────────────────────────────────────────────────────────

class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr

@api_router.post("/newsletter/subscribe")
async def newsletter_subscribe(req: NewsletterSubscribeRequest):
    existing = await db.newsletter_subscribers.find_one({"email": req.email})
    if existing:
        return {"status": "already_subscribed", "message": "Diese E-Mail ist bereits angemeldet."}

    now = datetime.now(timezone.utc).isoformat()
    await db.newsletter_subscribers.insert_one({
        "email": req.email,
        "subscribed_at": now,
        "active": True,
    })

    html = f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      <div style="border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="font-size:22px;font-weight:bold;margin:0;letter-spacing:-0.5px;">StudioOS</h1>
      </div>
      <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;">Newsletter bestätigt</h2>
      <p style="color:#555;line-height:1.6;margin-bottom:16px;">
        Danke für deine Anmeldung! Du erhältst ab sofort Neuigkeiten, neue Studios und exklusive Angebote direkt in deinen Posteingang.
      </p>
      <div style="border-top:1px solid #eee;padding-top:16px;margin-top:24px;">
        <p style="font-size:12px;color:#aaa;">Du kannst dich jederzeit wieder abmelden. · StudioOS, Deutschland</p>
      </div>
    </div>"""

    await send_email(req.email, "Willkommen beim StudioOS Newsletter!", html)
    return {"status": "success", "message": "Erfolgreich angemeldet! Bitte prüfe dein Postfach."}

@api_router.get("/newsletter/subscribers")
async def get_newsletter_subscribers(request: Request):
    current = await get_current_user(request)
    if current.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Nur Admins")
    subs = await db.newsletter_subscribers.find({"active": True}, {"_id": 0, "email": 1, "subscribed_at": 1}).to_list(1000)
    return {"subscribers": subs, "total": len(subs)}

# ─── FAQ ─────────────────────────────────────────────────────────────────────

class FAQItemCreate(BaseModel):
    category: str
    question: str
    answer: str
    order: int = 0
    target_role: str = "all"  # "all" | "customer" | "studio_owner"

@api_router.get("/faq/public")
async def get_faq_public(role: Optional[str] = None):
    query: dict = {}
    if role and role in ("customer", "studio_owner"):
        query = {"target_role": {"$in": [role, "all"]}}
    items = await db.faqs.find(query, {"_id": 0}).sort("order", 1).to_list(200)
    return items

@api_router.post("/admin/faq")
async def create_faq_item(data: FAQItemCreate, current_user: dict = Depends(require_admin)):
    doc = {"faq_id": f"faq_{uuid.uuid4().hex[:10]}", "category": data.category, "question": data.question,
           "answer": data.answer, "order": data.order, "target_role": data.target_role,
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.faqs.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/admin/faq/{faq_id}")
async def update_faq_item(faq_id: str, data: FAQItemCreate, current_user: dict = Depends(require_admin)):
    await db.faqs.update_one({"faq_id": faq_id}, {"$set": {**data.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"updated": True}

@api_router.delete("/admin/faq/{faq_id}")
async def delete_faq_item(faq_id: str, current_user: dict = Depends(require_admin)):
    await db.faqs.delete_one({"faq_id": faq_id})
    return {"deleted": True}

# ─── Announcements ───────────────────────────────────────────────────────────

class AnnouncementCreate(BaseModel):
    text: str
    type: str = "info"
    link: Optional[str] = None
    link_label: Optional[str] = None

@api_router.get("/announcements/active")
async def get_active_announcement():
    ann = await db.announcements.find_one({"active": True}, {"_id": 0})
    return ann or {}

@api_router.get("/admin/announcements")
async def get_all_announcements(current_user: dict = Depends(require_admin)):
    return await db.announcements.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)

@api_router.post("/admin/announcements")
async def create_announcement(data: AnnouncementCreate, current_user: dict = Depends(require_admin)):
    await db.announcements.update_many({}, {"$set": {"active": False}})
    doc = {"announcement_id": f"ann_{uuid.uuid4().hex[:10]}", "text": data.text, "type": data.type,
           "link": data.link, "link_label": data.link_label, "active": True, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.announcements.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.patch("/admin/announcements/{ann_id}/toggle")
async def toggle_announcement(ann_id: str, current_user: dict = Depends(require_admin)):
    ann = await db.announcements.find_one({"announcement_id": ann_id})
    if not ann:
        raise HTTPException(status_code=404, detail="Not found")
    new_active = not ann.get("active", False)
    if new_active:
        await db.announcements.update_many({}, {"$set": {"active": False}})
    await db.announcements.update_one({"announcement_id": ann_id}, {"$set": {"active": new_active}})
    return {"active": new_active}

@api_router.delete("/admin/announcements/{ann_id}")
async def delete_announcement(ann_id: str, current_user: dict = Depends(require_admin)):
    await db.announcements.delete_one({"announcement_id": ann_id})
    return {"deleted": True}

# ─── Reviews (Admin) ─────────────────────────────────────────────────────────

@api_router.get("/admin/reviews")
async def admin_get_all_reviews(current_user: dict = Depends(require_admin)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, current_user: dict = Depends(require_admin)):
    review = await db.reviews.find_one({"review_id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review nicht gefunden")
    await db.reviews.delete_one({"review_id": review_id})
    studio_id = review.get("studio_id")
    if studio_id:
        remaining = await db.reviews.find({"studio_id": studio_id}).to_list(1000)
        if remaining:
            avg = sum(r["rating"] for r in remaining) / len(remaining)
            await db.studios.update_one({"studio_id": studio_id}, {"$set": {"avg_rating": round(avg, 1), "review_count": len(remaining)}})
        else:
            await db.studios.update_one({"studio_id": studio_id}, {"$set": {"avg_rating": 0, "review_count": 0}})
    return {"deleted": True}

# ─── Newsletter (Admin send) ─────────────────────────────────────────────────

class NewsletterSendRequest(BaseModel):
    subject: str
    content: str
    preview_email: Optional[str] = None

@api_router.post("/admin/newsletter/send")
async def admin_send_newsletter(data: NewsletterSendRequest, current_user: dict = Depends(require_admin)):
    def nl_html(subject, content):
        return f"""<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
          {_email_header()}<div style="padding:32px;"><h2 style="font-size:20px;font-weight:700;margin:0 0 16px;color:#111;">{subject}</h2>
          <div style="font-size:14px;color:#555;line-height:1.7;">{content.replace(chr(10), '<br>')}</div></div>
          {_email_footer("Du erhältst diese E-Mail weil du den StudioOS Newsletter abonniert hast.")}</div>"""
    if data.preview_email:
        await send_email(data.preview_email, f"[Vorschau] {data.subject}", nl_html(data.subject, data.content))
        return {"status": "preview_sent", "sent": 0}
    subs = await db.newsletter_subscribers.find({"active": True}, {"_id": 0, "email": 1}).to_list(10000)
    for sub in subs:
        asyncio.create_task(send_email(sub["email"], data.subject, nl_html(data.subject, data.content)))
    return {"status": "sent", "sent": len(subs)}

# ─── Reports (User & Admin) ──────────────────────────────────────────────────

class ReportCreate(BaseModel):
    target_type: str
    target_id: str
    reason: str

@api_router.post("/reports")
async def submit_report(data: ReportCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    doc = {"report_id": f"rep_{uuid.uuid4().hex[:10]}", "reporter_id": user_id, "reporter_name": current_user.get("name", ""),
           "target_type": data.target_type, "target_id": data.target_id, "reason": data.reason,
           "status": "open", "created_at": datetime.now(timezone.utc).isoformat()}
    # Store review context so admin can read it without extra lookup
    if data.target_type == "review":
        review = await db.reviews.find_one({"review_id": data.target_id}, {"_id": 0})
        if review:
            doc["target_preview"] = {
                "rating": review.get("rating"),
                "comment": review.get("comment", ""),
                "user_name": review.get("user_name", ""),
                "studio_id": review.get("studio_id", ""),
            }
    await db.reports.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/admin/reports/{report_id}/delete-review")
async def admin_delete_review_from_report(report_id: str, current_user: dict = Depends(require_admin)):
    """Delete both the report and the associated review, recalculate studio avg_rating."""
    report = await db.reports.find_one({"report_id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Meldung nicht gefunden")
    review_id = report.get("target_id")
    review = await db.reviews.find_one({"review_id": review_id}) if review_id else None
    if review:
        studio_id = review.get("studio_id")
        await db.reviews.delete_one({"review_id": review_id})
        if studio_id:
            remaining = await db.reviews.find({"studio_id": studio_id}).to_list(1000)
            if remaining:
                avg = sum(r["rating"] for r in remaining) / len(remaining)
                await db.studios.update_one({"studio_id": studio_id}, {"$set": {"avg_rating": round(avg, 1), "review_count": len(remaining)}})
            else:
                await db.studios.update_one({"studio_id": studio_id}, {"$set": {"avg_rating": 0, "review_count": 0}})
    await db.reports.delete_one({"report_id": report_id})
    return {"deleted": True}

@api_router.get("/admin/reports")
async def admin_get_reports(current_user: dict = Depends(require_admin)):
    return await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)

@api_router.patch("/admin/reports/{report_id}/status")
async def admin_update_report(report_id: str, request: Request, current_user: dict = Depends(require_admin)):
    body = await request.json()
    await db.reports.update_one({"report_id": report_id}, {"$set": {"status": body.get("status", "dismissed")}})
    return {"updated": True}

@api_router.delete("/admin/reports/{report_id}")
async def admin_delete_report(report_id: str, current_user: dict = Depends(require_admin)):
    await db.reports.delete_one({"report_id": report_id})
    return {"deleted": True}

# ─── Broadcast ────────────────────────────────────────────────────────────────

class BroadcastRequest(BaseModel):
    title: str
    message: str
    target: str = "all"
    rating_enabled: bool = True

class BroadcastRateRequest(BaseModel):
    rating: str  # "star" or "x"

@api_router.post("/admin/broadcast")
async def admin_broadcast(data: BroadcastRequest, current_user: dict = Depends(require_admin)):
    broadcast_id = f"bc_{uuid.uuid4().hex[:12]}"
    query: dict = {}
    if data.target == "customers":
        query = {"role": "customer"}
    elif data.target == "studio_owners":
        query = {"role": "studio_owner"}
    users = await db.users.find(query, {"_id": 1, "user_id": 1}).to_list(10000)
    sent = 0
    now = datetime.now(timezone.utc).isoformat()
    # Store broadcast campaign metadata
    await db.broadcasts.insert_one({
        "broadcast_id": broadcast_id,
        "title": data.title,
        "message": data.message,
        "target": data.target,
        "rating_enabled": data.rating_enabled,
        "created_at": now
    })
    # Create broadcast message entries in messages collection
    for u in users:
        uid = str(u["_id"]) if u.get("_id") else u.get("user_id")
        if uid:
            # Push notification
            asyncio.create_task(send_push_notification(user_id=uid, title=data.title, body=data.message, url="/messages"))
            # Create message in messages collection (read-only system message)
            msg_doc = {
                "message_id": f"msg_{uuid.uuid4().hex[:12]}",
                "sender_id": "inkbook_system",
                "sender_name": "StudioOS",
                "recipient_id": uid,
                "content": f"**{data.title}**\n\n{data.message}",
                "image_url": "",
                "slot_offer": None,
                "is_broadcast": True,
                "broadcast_id": broadcast_id,
                "rating_enabled": data.rating_enabled,
                "created_at": now,
                "read": False
            }
            await db.messages.insert_one(msg_doc)
            # Update conversation entry
            conv_id = f"conv_inkbook_{uid}"
            await db.conversations.update_one(
                {"conv_id": conv_id},
                {"$set": {
                    "conv_id": conv_id,
                    "participants": ["inkbook_system", uid],
                    "is_broadcast_conv": True,
                    "last_message": data.title,
                    "last_message_at": now,
                    "last_sender_id": "inkbook_system"
                }},
                upsert=True
            )
            sent += 1
    return {"sent": sent, "broadcast_id": broadcast_id}

@api_router.post("/broadcast/{broadcast_id}/rate")
async def rate_broadcast(broadcast_id: str, data: BroadcastRateRequest, current_user: dict = Depends(get_current_user)):
    if data.rating not in ("star", "x"):
        raise HTTPException(status_code=400, detail="Rating must be 'star' or 'x'")
    uid = current_user.get("user_id")
    now = datetime.now(timezone.utc).isoformat()
    await db.broadcast_ratings.update_one(
        {"broadcast_id": broadcast_id, "user_id": uid},
        {"$set": {"broadcast_id": broadcast_id, "user_id": uid, "rating": data.rating, "updated_at": now}},
        upsert=True
    )
    return {"ok": True}

@api_router.get("/broadcast/my-ratings")
async def get_my_broadcast_ratings(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("user_id")
    ratings = await db.broadcast_ratings.find({"user_id": uid}, {"_id": 0}).to_list(1000)
    return {r["broadcast_id"]: r["rating"] for r in ratings}

@api_router.get("/admin/broadcast/ratings")
async def admin_broadcast_ratings(current_user: dict = Depends(require_admin)):
    broadcasts = await db.broadcasts.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    result = []
    for bc in broadcasts:
        bid = bc["broadcast_id"]
        stars = await db.broadcast_ratings.count_documents({"broadcast_id": bid, "rating": "star"})
        xs = await db.broadcast_ratings.count_documents({"broadcast_id": bid, "rating": "x"})
        result.append({**bc, "stars": stars, "xs": xs, "total": stars + xs})
    return result

# ─── Online Presence ──────────────────────────────────────────────────────────

@api_router.post("/presence/ping")
async def presence_ping(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("id")
    try:
        await db.users.update_one({"_id": ObjectId(uid)}, {"$set": {"last_seen": datetime.now(timezone.utc).isoformat()}})
    except Exception:
        pass
    return {"ok": True}

@api_router.get("/presence")
async def get_presence_batch(user_ids: str, current_user: dict = Depends(get_current_user)):
    ids = [i.strip() for i in user_ids.split(",") if i.strip()][:20]
    result = {}
    now = datetime.now(timezone.utc)
    for uid in ids:
        try:
            user = await db.users.find_one({"_id": ObjectId(uid)}, {"_id": 0, "last_seen": 1})
            if user and user.get("last_seen"):
                ls_dt = datetime.fromisoformat(user["last_seen"].replace("Z", "+00:00"))
                result[uid] = {"online": (now - ls_dt).total_seconds() < 120, "last_seen": user["last_seen"]}
            else:
                result[uid] = {"online": False, "last_seen": None}
        except Exception:
            result[uid] = {"online": False, "last_seen": None}
    return result

@api_router.get("/presence/{user_id}")
async def get_presence(user_id: str, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)}, {"_id": 0, "last_seen": 1})
    except Exception:
        user = None
    if not user or not user.get("last_seen"):
        return {"online": False, "last_seen": None}
    try:
        ls_dt = datetime.fromisoformat(user["last_seen"].replace("Z", "+00:00"))
        return {"online": (now - ls_dt).total_seconds() < 120, "last_seen": user["last_seen"]}
    except Exception:
        return {"online": False, "last_seen": None}

# ─── Admin: All Bookings, Revenue, Subscriptions ─────────────────────────────

@api_router.get("/admin/bookings/all")
async def admin_all_bookings(current_user: dict = Depends(require_admin)):
    return await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.get("/admin/revenue")
async def admin_revenue(current_user: dict = Depends(require_admin)):
    txns = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(10000)
    monthly: dict = {}
    monthly_fees: dict = {}
    for txn in txns:
        try:
            date = datetime.fromisoformat(txn["created_at"].replace("Z", "+00:00"))
            key = date.strftime("%Y-%m")
            monthly[key] = round(monthly.get(key, 0) + float(txn.get("amount", 0)), 2)
            fee_cents = float(txn.get("platform_fee_amount", 0))
            monthly_fees[key] = round(monthly_fees.get(key, 0) + fee_cents / 100, 2)
        except Exception:
            pass
    subs = await db.subscriptions.find({}, {"_id": 0, "plan": 1, "status": 1}).to_list(1000)
    plan_prices = {"free": 0.0, "starter": 19.99, "pro": 49.99, "full_studio": 149.99, "basic": 29.0}
    mrr = sum(plan_prices.get(s.get("plan", ""), 0) for s in subs if s.get("status") == "active")
    total_platform_fees = round(sum(float(t.get("platform_fee_amount", 0)) / 100 for t in txns), 2)
    recent_txns = sorted(txns, key=lambda t: t.get("created_at", ""), reverse=True)[:50]
    transactions = [
        {
            "transaction_id": t.get("transaction_id", ""),
            "studio_name": t.get("studio_name", "—"),
            "amount": float(t.get("amount", 0)),
            "platform_fee_amount": round(float(t.get("platform_fee_amount", 0)) / 100, 2),
            "platform_fee_percent": float(t.get("platform_fee_percent", 0)),
            "created_at": t.get("created_at", ""),
        }
        for t in recent_txns
    ]
    breakdown = sorted(monthly.items())[-6:]
    return {
        "monthly_breakdown": [
            {"month": k, "amount": v, "platform_fee": round(monthly_fees.get(k, 0), 2)}
            for k, v in breakdown
        ],
        "mrr": round(mrr, 2),
        "active_subscriptions": sum(1 for s in subs if s.get("status") == "active"),
        "total_from_payments": round(sum(float(t.get("amount", 0)) for t in txns), 2),
        "total_platform_fees": total_platform_fees,
        "transactions": transactions,
    }

@api_router.get("/admin/subscriptions")
async def admin_all_subscriptions(current_user: dict = Depends(require_admin)):
    subs = await db.subscriptions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    result = []
    for sub in subs:
        studio = await db.studios.find_one({"studio_id": sub.get("studio_id")}, {"_id": 0, "name": 1, "city": 1})
        sub["studio_name"] = studio.get("name", "—") if studio else "—"
        sub["studio_city"] = studio.get("city", "") if studio else ""
        result.append(sub)
    return result

@api_router.get("/admin/users/{user_id}/details")
async def admin_user_details(user_id: str, current_user: dict = Depends(require_admin)):
    from bson import ObjectId
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        try:
            u2 = await db.users.find_one({"_id": ObjectId(user_id)}, {"password_hash": 0})
            if u2:
                u2["user_id"] = str(u2.pop("_id", ""))
                user = u2
        except Exception:
            pass
    if not user:
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    bookings = await db.bookings.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    studio = await db.studios.find_one({"owner_id": user_id}, {"_id": 0, "name": 1, "studio_id": 1, "city": 1})
    reviews = await db.reviews.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
    for r in reviews:
        s = await db.studios.find_one({"studio_id": r.get("studio_id")}, {"_id": 0, "name": 1})
        r["studio_name"] = s.get("name", "—") if s else "—"
    return {"user": user, "bookings": bookings, "studio": studio, "reviews": reviews}

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

@api_router.patch("/admin/users/{user_id}")
async def admin_update_user(user_id: str, data: AdminUserUpdate, current_user: dict = Depends(require_admin)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.users.update_one({"user_id": user_id}, {"$set": update})
    return {"message": "User updated"}

class AdminBookingUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

@api_router.patch("/admin/bookings/{booking_id}")
async def admin_update_booking(booking_id: str, data: AdminBookingUpdate, current_user: dict = Depends(require_admin)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    await db.bookings.update_one({"booking_id": booking_id}, {"$set": update})
    return {"message": "Booking updated"}

@api_router.get("/admin/studios/{studio_id}/details")
async def admin_studio_details(studio_id: str, current_user: dict = Depends(require_admin)):
    studio = await db.studios.find_one({"studio_id": studio_id}, {"_id": 0})
    if not studio:
        raise HTTPException(status_code=404, detail="Nicht gefunden")
    owner = None
    if studio.get("owner_id"):
        owner = await db.users.find_one({"user_id": studio["owner_id"]}, {"_id": 0, "password_hash": 0, "name": 1, "email": 1, "user_id": 1})
    bookings = await db.bookings.find({"studio_id": studio_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    reviews = await db.reviews.find({"studio_id": studio_id}, {"_id": 0}).sort("created_at", -1).to_list(30)
    for r in reviews:
        u = await db.users.find_one({"user_id": r.get("user_id")}, {"_id": 0, "name": 1})
        r["user_name"] = u.get("name", "Anonym") if u else "Anonym"
    artists = await db.artists.find({"studio_id": studio_id}, {"_id": 0}).to_list(20)
    sub = await db.subscriptions.find_one({"studio_id": studio_id}, {"_id": 0})
    return {"studio": studio, "owner": owner, "bookings": bookings, "reviews": reviews, "artists": artists, "subscription": sub}

@api_router.get("/admin/support-tickets")
async def admin_support_tickets(current_user: dict = Depends(require_admin)):
    return await db.support_chats.find({}, {"_id": 0}).sort("updated_at", -1).to_list(200)

@api_router.get("/admin/stats/enhanced")
async def admin_stats_enhanced(current_user: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    week_start = (now - timedelta(days=7)).isoformat()
    new_users_today = await db.users.count_documents({"created_at": {"$gte": today_start}})
    new_users_week = await db.users.count_documents({"created_at": {"$gte": week_start}})
    new_bookings_week = await db.bookings.count_documents({"created_at": {"$gte": week_start}})
    newsletter_count = await db.newsletter_subscribers.count_documents({"active": True})
    open_reports = await db.reports.count_documents({"status": "open"})
    pipeline = [{"$group": {"_id": "$studio_id", "count": {"$sum": 1}}}, {"$sort": {"count": -1}}, {"$limit": 5}]
    top_raw = await db.bookings.aggregate(pipeline).to_list(5)
    top_studios = []
    for ts in top_raw:
        s = await db.studios.find_one({"studio_id": ts["_id"]}, {"_id": 0, "name": 1, "city": 1, "avg_rating": 1})
        if s:
            top_studios.append({**s, "booking_count": ts["count"], "studio_id": ts["_id"]})
    total_consent = await db.consent_records.count_documents({})
    analytics_optin = await db.consent_records.count_documents({"analytics": True})
    analytics_consent_rate = round(analytics_optin / total_consent * 100, 1) if total_consent > 0 else 0
    return {"new_users_today": new_users_today, "new_users_week": new_users_week,
            "new_bookings_week": new_bookings_week, "newsletter_subscribers": newsletter_count,
            "open_reports": open_reports, "top_studios": top_studios,
            "analytics_consent_rate": analytics_consent_rate}


@api_router.get("/admin/business-metrics")
async def admin_business_metrics(current_user: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    one_day_ago = (now - timedelta(days=1)).isoformat()

    # GMV: total paid transactions
    gmv_cursor = db.payment_transactions.aggregate([
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ])
    gmv_result = await gmv_cursor.to_list(1)
    gmv = round(gmv_result[0]["total"] if gmv_result else 0, 2)

    # Booking counts (for informational fields)
    total_bookings = await db.bookings.count_documents({})
    confirmed_bookings = await db.bookings.count_documents({"status": {"$in": ["confirmed", "completed"]}})

    # Conversion rate: confirmed inquiries / all inquiries (inquiry-based definition)
    total_inquiries = await db.inquiries.count_documents({})
    confirmed_inquiries = await db.inquiries.count_documents({"status": {"$in": ["confirmed", "completed", "offer_accepted"]}})
    conversion_rate = round((confirmed_inquiries / total_inquiries * 100), 1) if total_inquiries > 0 else 0

    # Average booking value (from paid transactions)
    paid_count_cursor = db.payment_transactions.aggregate([
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "count": {"$sum": 1}}}
    ])
    paid_count_result = await paid_count_cursor.to_list(1)
    paid_count = paid_count_result[0]["count"] if paid_count_result else 0
    avg_booking_value = round(gmv / paid_count, 2) if paid_count > 0 else 0

    # DAU/MAU: users active in last 1 / 30 days (based on last_seen or created_at)
    dau = await db.users.count_documents({"$or": [
        {"last_seen": {"$gte": one_day_ago}},
        {"last_login": {"$gte": one_day_ago}},
    ]})
    mau = await db.users.count_documents({"$or": [
        {"last_seen": {"$gte": thirty_days_ago}},
        {"last_login": {"$gte": thirty_days_ago}},
    ]})

    # Consent opt-in rates
    total_consent = await db.consent_records.count_documents({})
    analytics_optin = await db.consent_records.count_documents({"analytics": True})
    marketing_optin = await db.consent_records.count_documents({"marketing": True})
    analytics_rate = round(analytics_optin / total_consent * 100, 1) if total_consent > 0 else 0
    marketing_rate = round(marketing_optin / total_consent * 100, 1) if total_consent > 0 else 0

    # Studios with no booking in last 30 days (churn risk)
    all_studios = await db.studios.find({"is_active": True}, {"_id": 0, "studio_id": 1, "name": 1, "city": 1}).to_list(500)
    churn_risk_studios = []
    for s in all_studios:
        recent_booking = await db.bookings.find_one({
            "studio_id": s["studio_id"],
            "created_at": {"$gte": thirty_days_ago}
        })
        if not recent_booking:
            churn_risk_studios.append({"studio_id": s["studio_id"], "name": s.get("name", ""), "city": s.get("city", "")})

    # Top 5 studios by revenue (paid transactions), then annotate with booking count
    revenue_pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": "$studio_id", "revenue": {"$sum": "$amount"}}},
        {"$sort": {"revenue": -1}},
        {"$limit": 5}
    ]
    top_raw = await db.payment_transactions.aggregate(revenue_pipeline).to_list(5)
    top_studios_by_revenue = []
    for ts in top_raw:
        s = await db.studios.find_one({"studio_id": ts["_id"]}, {"_id": 0, "name": 1, "city": 1, "avg_rating": 1})
        booking_count = await db.bookings.count_documents({"studio_id": ts["_id"]})
        if s:
            top_studios_by_revenue.append({
                **s,
                "studio_id": ts["_id"],
                "booking_count": booking_count,
                "revenue": round(ts["revenue"], 2),
            })
    # If no payment_transactions, fall back to booking count ranking
    if not top_studios_by_revenue:
        fallback_pipeline = [
            {"$group": {"_id": "$studio_id", "booking_count": {"$sum": 1}}},
            {"$sort": {"booking_count": -1}},
            {"$limit": 5}
        ]
        fallback_raw = await db.bookings.aggregate(fallback_pipeline).to_list(5)
        for ts in fallback_raw:
            s = await db.studios.find_one({"studio_id": ts["_id"]}, {"_id": 0, "name": 1, "city": 1, "avg_rating": 1})
            if s:
                top_studios_by_revenue.append({
                    **s,
                    "studio_id": ts["_id"],
                    "booking_count": ts["booking_count"],
                    "revenue": 0,
                })

    return {
        "gmv": gmv,
        "avg_booking_value": avg_booking_value,
        "total_bookings": total_bookings,
        "confirmed_bookings": confirmed_bookings,
        "conversion_rate": conversion_rate,
        "dau": dau,
        "mau": mau,
        "consent_total": total_consent,
        "analytics_optin_rate": analytics_rate,
        "marketing_optin_rate": marketing_rate,
        "churn_risk_studios": churn_risk_studios[:10],
        "top_studios_by_revenue": top_studios_by_revenue,
    }



# ─── Support Tickets ──────────────────────────────────────────────────────────

class TicketCreate(BaseModel):
    subject: str
    description: str

class TicketReply(BaseModel):
    message: str

@api_router.post("/support/tickets")
async def create_support_ticket(data: TicketCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    ticket_number = f"IB-{random.randint(1000, 9999)}"
    # Ensure uniqueness
    while await db.support_tickets.find_one({"ticket_number": ticket_number}):
        ticket_number = f"IB-{random.randint(1000, 9999)}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "ticket_id": f"tkt_{uuid.uuid4().hex[:10]}",
        "ticket_number": ticket_number,
        "user_id": user_id,
        "user_email": current_user.get("email", ""),
        "user_name": current_user.get("name", ""),
        "subject": data.subject,
        "description": data.description,
        "status": "open",
        "replies": [],
        "created_at": now,
        "updated_at": now
    }
    await db.support_tickets.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/support/my-tickets")
async def get_my_tickets(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    tickets = await db.support_tickets.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return tickets

@api_router.get("/support/tickets/{ticket_id}")
async def get_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    role = current_user.get("role", "")
    ticket = await db.support_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    if ticket["user_id"] != user_id and role != "admin":
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    return ticket

@api_router.post("/admin/support-tickets/{ticket_id}/reply")
async def admin_reply_ticket(ticket_id: str, data: TicketReply, current_user: dict = Depends(require_admin)):
    ticket = await db.support_tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    now = datetime.now(timezone.utc).isoformat()
    reply_doc = {"reply_id": f"rep_{uuid.uuid4().hex[:8]}", "message": data.message,
                 "from": "admin", "created_at": now}
    await db.support_tickets.update_one(
        {"ticket_id": ticket_id},
        {"$push": {"replies": reply_doc}, "$set": {"status": "answered", "updated_at": now}}
    )
    # Send email to user - tell them to reply IN the ticket chat
    user_email = ticket.get("user_email", "")
    ticket_num = ticket.get("ticket_number", ticket_id)
    subject_str = ticket.get("subject", "Dein Support-Ticket")
    if user_email:
        html = f"""<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
          {_email_header()}<div style="padding:32px;">
          <p style="font-size:12px;color:#888;margin-bottom:8px;">Ticket {ticket_num}</p>
          <h2 style="font-size:18px;font-weight:700;margin:0 0 16px;color:#111;">Antwort auf dein Support-Ticket</h2>
          <p style="font-size:14px;color:#555;margin-bottom:8px;"><strong>Deine Anfrage:</strong> {subject_str}</p>
          <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="font-size:14px;color:#333;line-height:1.7;margin:0;">{data.message.replace(chr(10),'<br>')}</p>
          </div>
          <p style="font-size:13px;color:#888;">Möchtest du antworten? Öffne den <strong>Support-Chat</strong> auf StudioOS und wähle dein Ticket aus, um direkt zu antworten.</p>
          </div>{_email_footer("Du erhältst diese E-Mail als Antwort auf dein Support-Ticket.")}</div>"""
        asyncio.create_task(send_email(user_email, f"[{ticket_num}] Antwort: {subject_str}", html))
    return {"replied": True, "ticket_number": ticket_num}

@api_router.post("/support/tickets/{ticket_id}/user-reply")
async def user_reply_ticket(ticket_id: str, data: TicketReply, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    ticket = await db.support_tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    if ticket["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Kein Zugriff")
    if ticket.get("status") == "closed":
        raise HTTPException(status_code=400, detail="Ticket ist geschlossen")
    now = datetime.now(timezone.utc).isoformat()
    reply_doc = {"reply_id": f"rep_{uuid.uuid4().hex[:8]}", "message": data.message,
                 "from": "user", "from_name": current_user.get("name", ""), "created_at": now}
    await db.support_tickets.update_one(
        {"ticket_id": ticket_id},
        {"$push": {"replies": reply_doc}, "$set": {"status": "open", "updated_at": now}}
    )
    return {"replied": True}

@api_router.patch("/admin/support-tickets/{ticket_id}/close")
async def admin_close_ticket(ticket_id: str, current_user: dict = Depends(require_admin)):
    ticket = await db.support_tickets.find_one({"ticket_id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")
    now = datetime.now(timezone.utc).isoformat()
    await db.support_tickets.update_one(
        {"ticket_id": ticket_id},
        {"$set": {"status": "closed", "updated_at": now}}
    )
    return {"closed": True}

@api_router.get("/admin/support-tickets-new")
async def admin_get_support_tickets(current_user: dict = Depends(require_admin)):
    tickets = await db.support_tickets.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return tickets

# ─── Direct Support Chat (Pro) ────────────────────────────────────────────────

@api_router.get("/support/direct")
async def get_direct_chat(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    # Check Pro subscription for studio_owners
    if current_user.get("role") == "studio_owner":
        studio = await db.studios.find_one({"owner_id": user_id})
        if studio:
            sub = await db.subscriptions.find_one({"studio_id": studio["studio_id"]})
            if not sub or sub.get("plan") != "pro" or sub.get("status") != "active":
                raise HTTPException(status_code=403, detail="Pro-Abonnement erforderlich")
        else:
            raise HTTPException(status_code=403, detail="Pro-Abonnement erforderlich")
    chat = await db.direct_support_chats.find_one({"user_id": user_id}, {"_id": 0})
    if not chat:
        now = datetime.now(timezone.utc).isoformat()
        chat = {"chat_id": f"dsc_{uuid.uuid4().hex[:10]}", "user_id": user_id,
                "user_email": current_user.get("email", ""), "user_name": current_user.get("name", ""),
                "messages": [], "status": "open", "created_at": now, "updated_at": now}
        await db.direct_support_chats.insert_one(chat)
        chat.pop("_id", None)
    return chat

@api_router.post("/support/direct/messages")
async def send_direct_message(request: Request, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    body = await request.json()
    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Nachricht darf nicht leer sein")
    now = datetime.now(timezone.utc).isoformat()
    msg = {"msg_id": f"dm_{uuid.uuid4().hex[:8]}", "content": content, "from": "user",
           "from_name": current_user.get("name", ""), "created_at": now}
    result = await db.direct_support_chats.update_one(
        {"user_id": user_id},
        {"$push": {"messages": msg}, "$set": {"updated_at": now, "status": "open"}},
        upsert=False
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chat nicht gefunden. Zuerst /support/direct aufrufen.")
    return {"sent": True, "msg": msg}

@api_router.get("/admin/direct-chats")
async def admin_get_direct_chats(current_user: dict = Depends(require_admin)):
    chats = await db.direct_support_chats.find({}, {"_id": 0}).sort("updated_at", -1).to_list(200)
    return chats

@api_router.post("/admin/direct-chats/{chat_id}/reply")
async def admin_reply_direct_chat(chat_id: str, data: TicketReply, current_user: dict = Depends(require_admin)):
    chat = await db.direct_support_chats.find_one({"chat_id": chat_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat nicht gefunden")
    now = datetime.now(timezone.utc).isoformat()
    msg = {"msg_id": f"dm_{uuid.uuid4().hex[:8]}", "content": data.message, "from": "admin",
           "from_name": "StudioOS Support", "created_at": now}
    await db.direct_support_chats.update_one(
        {"chat_id": chat_id},
        {"$push": {"messages": msg}, "$set": {"updated_at": now, "status": "in_progress"}}
    )
    return {"replied": True, "msg": msg}


# ─── Video Call ────────────────────────────────────────────────────────────────

@api_router.post("/bookings/{booking_id}/video-join")
async def video_join(booking_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    role = current_user.get("role", "customer")
    booking = await db.bookings.find_one({"booking_id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")
    if booking.get("booking_type") != "video_consultation":
        raise HTTPException(status_code=400, detail="Keine Video-Buchung")
    participant = "studio" if role == "studio_owner" else "customer"
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$addToSet": {"video_participants": participant}}
    )
    return {"joined": True, "participant": participant, "room_id": f"inkbook-{booking_id}"}

@api_router.get("/bookings/{booking_id}/video-status")
async def video_status(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0, "video_participants": 1, "booking_type": 1})
    if not booking:
        raise HTTPException(status_code=404, detail="Buchung nicht gefunden")
    return {"participants": booking.get("video_participants", []), "booking_type": booking.get("booking_type")}

@api_router.post("/bookings/{booking_id}/video-leave")
async def video_leave(booking_id: str, current_user: dict = Depends(get_current_user)):
    role = current_user.get("role", "customer")
    participant = "studio" if role == "studio_owner" else "customer"
    await db.bookings.update_one(
        {"booking_id": booking_id},
        {"$pull": {"video_participants": participant}}
    )
    return {"left": True}

async def _init_db():
    await db.users.create_index("email", unique=True)
    await db.studios.create_index("studio_id", unique=True)
    await db.bookings.create_index("booking_id", unique=True)
    await db.slots.create_index("slot_id", unique=True)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@inkbook.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        pw_hash = await asyncio.to_thread(hash_password, admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": pw_hash,
            "name": "StudioOS Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "auth_provider": "email"
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not await asyncio.to_thread(verify_password, admin_password, existing.get("password_hash", "")):
        pw_hash = await asyncio.to_thread(hash_password, admin_password)
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": pw_hash}})

    await seed_demo_data()
    logger.info("StudioOS API started")

async def _check_deposit_deadlines():
    await asyncio.sleep(30)  # Let DB init first
    while True:
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            expired = await db.bookings.find({
                "status": {"$in": ["confirmed", "offer_sent", "waiting_for_deposit"]},
                "deposit_deadline_at": {"$ne": None, "$lt": now_iso},
                "payment_status": {"$nin": ["paid", "refunded", "free"]}
            }, {"_id": 0}).to_list(None)
            for booking in expired:
                await db.bookings.update_one(
                    {"booking_id": booking["booking_id"]},
                    {"$set": {
                        "status": "cancelled",
                        "cancelled_by": "system",
                        "cancellation_reason": "Anzahlungsfrist nicht eingehalten",
                        "cancelled_at": now_iso,
                        "deposit_deadline_at": None,
                    }}
                )
                if booking.get("slot_id"):
                    await db.slots.update_one(
                        {"slot_id": booking["slot_id"]},
                        {"$set": {"is_booked": False, "booking_id": None}}
                    )
                user_email = booking.get("user_email", "")
                if user_email:
                    asyncio.create_task(send_email(
                        to=user_email,
                        subject=f"Termin automatisch storniert – {booking.get('studio_name', '')}",
                        html=deposit_deadline_cancelled_html(booking)
                    ))
                logger.info(f"[DEPOSIT DEADLINE] Auto-cancelled booking {booking['booking_id']}")
        except Exception as e:
            logger.error(f"[DEPOSIT DEADLINE] Error: {e}")
        await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(_init_db())
    asyncio.create_task(_check_deposit_deadlines())

@app.on_event("shutdown")
async def shutdown_db_client():
    pass

app.include_router(api_router)
