from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import Optional, List, Annotated, Dict, Any
import os
import random
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from pathlib import Path
import base64
import httpx
import asyncio
import resend
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

# ─── Resend Email ─────────────────────────────────────────────────────────────
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

async def send_email(to: str, subject: str, html: str):
    if not RESEND_API_KEY:
        logger.info(f"[EMAIL SKIPPED - no RESEND_API_KEY] To: {to}, Subject: {subject}")
        return
    try:
        resend.api_key = RESEND_API_KEY
        # Use account owner email as sender until custom domain is verified
        sender = SENDER_EMAIL if SENDER_EMAIL != "onboarding@resend.dev" else "onboarding@resend.dev"
        params = {"from": sender, "to": [to], "subject": subject, "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to}: {subject}")
    except Exception as e:
        logger.warning(f"Email send failed (non-critical): {e}")

def _email_header() -> str:
    return """
    <div style="background:#0a0a0a;padding:24px 32px;border-radius:12px 12px 0 0;">
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.5px;font-family:'Helvetica Neue',Arial,sans-serif;">InkBook</h1>
      <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:4px 0 0;font-family:'Helvetica Neue',Arial,sans-serif;letter-spacing:0.08em;text-transform:uppercase;">Tattoo Booking Platform</p>
    </div>"""

def _email_footer(extra: str = "") -> str:
    return f"""
    <div style="background:#f4f4f4;padding:20px 32px;border-radius:0 0 12px 12px;border-top:1px solid #e5e5e5;">
      {f'<p style="font-size:12px;color:#888;margin:0 0 8px;font-family:Helvetica Neue,Arial,sans-serif;">{extra}</p>' if extra else ''}
      <p style="font-size:11px;color:#bbb;margin:0;font-family:Helvetica Neue,Arial,sans-serif;">
        © 2026 InkBook · Deutschland ·
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
    type_label = "Beratungsgespräch" if booking.get("booking_type") == "consultation" else "Tattoo-Session"
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
            Den Status deiner Buchung findest du jederzeit in deinem <strong style="color:#111;">InkBook Dashboard</strong>.
          </p>
        </div>
      </div>
      {_email_footer("Fragen? Nutze unseren Support-Chat auf inkbook.de")}
    </div>"""

def booking_confirmation_studio_html(booking: dict) -> str:
    """Email to studio owner when a new booking arrives."""
    type_label = "Beratungsgespräch" if booking.get("booking_type") == "consultation" else "Tattoo-Session"
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

        {'<div style="margin-top:28px;text-align:center;"><a href="#" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:13px;font-weight:700;">Neuen Termin buchen</a></div>' if not is_confirmed else ''}
      </div>
      {_email_footer("Fragen? Nutze unseren Support-Chat auf inkbook.de")}
    </div>"""

# ─── Database ────────────────────────────────────────────────────────────────
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="InkBook API")
api_router = APIRouter(prefix="/api")

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), "https://artist-connect-82.preview.emergentagent.com"],
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

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

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
        # Ensure id is always available in returned user dict
        if not user.get("id") and not user.get("user_id"):
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
    banner_image: Optional[str] = None
    logo_image: Optional[str] = None

class SlotCreate(BaseModel):
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    slot_type: str = "tattoo"  # consultation | tattoo | full_day
    duration_minutes: int = 60
    notes: str = ""

class BookingCreate(BaseModel):
    studio_id: str
    slot_id: str
    booking_type: str = "tattoo"  # consultation | tattoo
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
    plan: str  # "basic" | "pro"
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
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": email,
        "password_hash": hash_password(data.password),
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
    if not user or not verify_password(data.password, user.get("password_hash", "")):
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
    limit: int = 20
):
    query: Dict[str, Any] = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if style:
        query["styles"] = {"$in": [style]}
    if price_range:
        query["price_range"] = price_range
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}}
        ]
    
    studios = await db.studios.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    if min_rating:
        studios = [s for s in studios if s.get("avg_rating", 0) >= min_rating]
    
    return studios

@api_router.get("/studios/{studio_id}")
async def get_studio(studio_id: str):
    studio = await db.studios.find_one({"studio_id": studio_id}, {"_id": 0})
    if not studio:
        raise HTTPException(status_code=404, detail="Studio not found")
    return studio

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

# ─── Slots / Availability ─────────────────────────────────────────────────────
@api_router.get("/studios/{studio_id}/slots")
async def get_slots(studio_id: str, date: Optional[str] = None, slot_type: Optional[str] = None):
    query: Dict[str, Any] = {"studio_id": studio_id, "is_booked": False}
    if date:
        query["date"] = date
    if slot_type and slot_type != "full_day":
        # Show matching type AND full_day slots (full_day fits any booking)
        query["slot_type"] = {"$in": [slot_type, "full_day"]}
    slots = await db.slots.find(query, {"_id": 0}).to_list(200)
    return slots

@api_router.get("/studios/{studio_id}/available-dates")
async def get_available_dates(studio_id: str, year: int, month: int):
    """Returns dates within a given month that have at least one free slot."""
    import calendar as cal_mod
    first_day = f"{year}-{month:02d}-01"
    last_day_num = cal_mod.monthrange(year, month)[1]
    last_day = f"{year}-{month:02d}-{last_day_num:02d}"
    today_iso = datetime.now(timezone.utc).date().isoformat()
    from_date = max(first_day, today_iso)
    pipeline = [
        {"$match": {"studio_id": studio_id, "is_booked": False, "date": {"$gte": from_date, "$lte": last_day}}},
        {"$group": {"_id": "$date"}},
        {"$sort": {"_id": 1}}
    ]
    result = await db.slots.aggregate(pipeline).to_list(100)
    return {"available_dates": [r["_id"] for r in result]}

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

# ─── Bookings ─────────────────────────────────────────────────────────────────
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
        "deposit_amount": 50.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bookings.insert_one(booking_doc)
    await db.slots.update_one({"slot_id": data.slot_id}, {"$set": {"is_booked": True, "booking_id": booking_doc["booking_id"]}})
    
    # Send confirmation email to customer (fire & forget)
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
    if booking.get("user_id") != user_id and (not studio or studio.get("owner_id") != user_id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_fields = {"status": status}
    if status == "cancelled":
        # Determine who cancelled: studio owner or customer
        is_studio_cancel = studio and studio.get("owner_id") == user_id
        update_fields["cancelled_by"] = "studio" if is_studio_cancel else "customer"
    await db.bookings.update_one({"booking_id": booking_id}, {"$set": update_fields})
    if status == "cancelled":
        await db.slots.update_one({"slot_id": booking.get("slot_id")}, {"$set": {"is_booked": False}})

    # Send status update email + push notification to customer
    user_email = booking.get("user_email", "")
    customer_id = booking.get("user_id", "")
    studio_name = booking.get("studio_name", "")

    if user_email and status in ["confirmed", "cancelled"]:
        asyncio.create_task(send_email(
            to=user_email,
            subject=f"Termin {'bestätigt' if status == 'confirmed' else 'abgesagt'} – {studio_name}",
            html=booking_status_html(booking, status)
        ))

    if customer_id and status in ["confirmed", "cancelled"]:
        push_title = f"Termin {'bestätigt' if status == 'confirmed' else 'storniert'} – {studio_name}"
        push_body = f"{booking.get('date', '')} um {booking.get('start_time', '')} {'wurde bestätigt ✓' if status == 'confirmed' else 'wurde leider storniert'}"
        asyncio.create_task(send_push_notification(
            user_id=customer_id, title=push_title, body=push_body, url="/dashboard"
        ))

    # Also push to studio owner if customer cancels
    if studio and status == "cancelled" and booking.get("user_id") == user_id:
        asyncio.create_task(send_push_notification(
            user_id=studio.get("owner_id", ""),
            title=f"Buchung storniert",
            body=f"{booking.get('user_name','Kunde')} hat den Termin am {booking.get('date','')} storniert",
            url="/studio-dashboard"
        ))

    return {"message": "Booking updated"}

# ─── Messages / Chat ──────────────────────────────────────────────────────────
@api_router.post("/messages/unread-count")
async def get_unread_count_post(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    count = await db.messages.count_documents({"recipient_id": user_id, "read": False})
    return {"count": count}

@api_router.get("/messages/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    count = await db.messages.count_documents({"recipient_id": user_id, "read": False})
    return {"count": count}

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
        # Handle InkBook broadcast conversations
        if other_id == "inkbook_system" or conv.get("is_broadcast_conv"):
            enriched.append({**conv, "other_name": "InkBook News", "other_role": "system",
                              "other_user_id": "inkbook_system", "last_sender_name": "InkBook",
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
        enriched.append({**conv, "other_name": other_name, "other_role": other_role, "other_user_id": other_id,
                          "last_sender_name": other_name})  # keep compat
    return enriched

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    # Handle InkBook broadcast messages
    if other_user_id == "inkbook_system":
        messages = await db.messages.find(
            {"sender_id": "inkbook_system", "recipient_id": user_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(500)
        return messages
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": user_id, "recipient_id": other_user_id},
            {"sender_id": other_user_id, "recipient_id": user_id}
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
        "read": False
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
        "status": "pending",
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

# ─── Payments (Stripe) ────────────────────────────────────────────────────────
@api_router.post("/payments/create-session")
async def create_payment_session(data: PaymentCreateRequest, request: Request, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"booking_id": data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    user_id = current_user.get("id") or current_user.get("user_id")
    if booking.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    api_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
    origin = data.origin_url
    success_url = f"{origin}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/dashboard?payment=cancelled"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{str(request.base_url)}api/webhook/stripe")
    
    checkout_req = CheckoutSessionRequest(
        amount=float(booking.get("deposit_amount", 50.0)),
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"booking_id": data.booking_id, "user_id": user_id}
    )
    session = await stripe_checkout.create_checkout_session(checkout_req)
    
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "booking_id": data.booking_id,
        "user_id": user_id,
        "session_id": session.session_id,
        "amount": float(booking.get("deposit_amount", 50.0)),
        "currency": "eur",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    api_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=f"{str(request.base_url)}api/webhook/stripe")
    status = await stripe_checkout.get_checkout_status(session_id)
    
    if status.payment_status == "paid":
        txn = await db.payment_transactions.find_one({"session_id": session_id})
        if txn and txn.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
            if txn.get("booking_id"):
                await db.bookings.update_one(
                    {"booking_id": txn["booking_id"]},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
    
    return {"status": status.status, "payment_status": status.payment_status}

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    api_key = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, request.headers.get("Stripe-Signature", ""))
        if webhook_response.payment_status == "paid":
            booking_id = webhook_response.metadata.get("booking_id")
            if booking_id:
                await db.bookings.update_one(
                    {"booking_id": booking_id},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
    except Exception as e:
        logger.error(f"Webhook error: {e}")
    return {"received": True}

# ─── Subscriptions ────────────────────────────────────────────────────────────
SUBSCRIPTION_PLANS = {
    "basic": {"name": "Basic", "price": 29.0, "currency": "eur", "features": ["50 Buchungen/Monat", "1 Artist-Profil", "Basis-Analytics", "E-Mail-Support"]},
    "pro":   {"name": "Pro",   "price": 79.0, "currency": "eur", "features": ["Unbegrenzte Buchungen", "5 Artist-Profile", "Premium-Analytics", "Priority-Listing", "Priority-Support", "Benutzerdefinierte Profilseite"]}
}

@api_router.get("/subscriptions/plans")
async def get_plans():
    return SUBSCRIPTION_PLANS

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
            "all_bookings": all_studio_bookings
        }
    else:
        bookings = await db.bookings.find({"user_id": user_id}, {"_id": 0}).to_list(200)
        upcoming = [b for b in bookings if b.get("status") in ["pending", "confirmed"]]
        return {
            "total_bookings": len(bookings),
            "upcoming_bookings": upcoming[:5],
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
        "Du bist der freundliche Support-Assistent von InkBook, der führenden Tattoo-Buchungsplattform in Deutschland. "
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

@api_router.get("/support/admin-id")
async def get_support_admin_id():
    admin = await db.users.find_one({"role": "admin"})
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
        <h1 style="font-size:22px;font-weight:bold;margin:0;letter-spacing:-0.5px;">InkBook</h1>
      </div>
      <h2 style="font-size:18px;font-weight:600;margin-bottom:12px;">Newsletter bestätigt</h2>
      <p style="color:#555;line-height:1.6;margin-bottom:16px;">
        Danke für deine Anmeldung! Du erhältst ab sofort Neuigkeiten, neue Studios und exklusive Angebote direkt in deinen Posteingang.
      </p>
      <div style="border-top:1px solid #eee;padding-top:16px;margin-top:24px;">
        <p style="font-size:12px;color:#aaa;">Du kannst dich jederzeit wieder abmelden. · InkBook, Deutschland</p>
      </div>
    </div>"""

    await send_email(req.email, "Willkommen beim InkBook Newsletter!", html)
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
          {_email_footer("Du erhältst diese E-Mail weil du den InkBook Newsletter abonniert hast.")}</div>"""
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
    await db.reports.insert_one(doc)
    doc.pop("_id", None)
    return doc

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

@api_router.post("/admin/broadcast")
async def admin_broadcast(data: BroadcastRequest, current_user: dict = Depends(require_admin)):
    query: dict = {}
    if data.target == "customers":
        query = {"role": "customer"}
    elif data.target == "studio_owners":
        query = {"role": "studio_owner"}
    users = await db.users.find(query, {"_id": 1, "user_id": 1}).to_list(10000)
    sent = 0
    now = datetime.now(timezone.utc).isoformat()
    # Create broadcast message entries in messages collection
    for u in users:
        uid = u.get("user_id") or (str(u["_id"]) if u.get("_id") else None)
        if uid:
            # Push notification
            asyncio.create_task(send_push_notification(user_id=uid, title=data.title, body=data.message, url="/messages"))
            # Create message in messages collection (read-only system message)
            msg_doc = {
                "message_id": f"msg_{uuid.uuid4().hex[:12]}",
                "sender_id": "inkbook_system",
                "sender_name": "InkBook",
                "recipient_id": uid,
                "content": f"**{data.title}**\n\n{data.message}",
                "image_url": "",
                "slot_offer": None,
                "is_broadcast": True,
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
    return {"sent": sent}

# ─── Admin: All Bookings, Revenue, Subscriptions ─────────────────────────────

@api_router.get("/admin/bookings/all")
async def admin_all_bookings(current_user: dict = Depends(require_admin)):
    return await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.get("/admin/revenue")
async def admin_revenue(current_user: dict = Depends(require_admin)):
    txns = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(10000)
    monthly: dict = {}
    for txn in txns:
        try:
            date = datetime.fromisoformat(txn["created_at"].replace("Z", "+00:00"))
            key = date.strftime("%Y-%m")
            monthly[key] = round(monthly.get(key, 0) + float(txn.get("amount", 0)), 2)
        except Exception:
            pass
    subs = await db.subscriptions.find({}, {"_id": 0, "plan": 1, "status": 1}).to_list(1000)
    plan_prices = {"basic": 29.0, "pro": 79.0}
    mrr = sum(plan_prices.get(s.get("plan", ""), 0) for s in subs if s.get("status") == "active")
    return {
        "monthly_breakdown": [{"month": k, "amount": v} for k, v in sorted(monthly.items())[-6:]],
        "mrr": round(mrr, 2),
        "active_subscriptions": sum(1 for s in subs if s.get("status") == "active"),
        "total_from_payments": round(sum(float(t.get("amount", 0)) for t in txns), 2),
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
    bookings = await db.bookings.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(20)
    studio = await db.studios.find_one({"owner_id": user_id}, {"_id": 0, "name": 1, "studio_id": 1})
    return {"user": user, "bookings": bookings, "studio": studio}

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
    return {"new_users_today": new_users_today, "new_users_week": new_users_week,
            "new_bookings_week": new_bookings_week, "newsletter_subscribers": newsletter_count,
            "open_reports": open_reports, "top_studios": top_studios}





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
    # Send email to user
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
          <p style="font-size:13px;color:#888;">Falls du weitere Fragen hast, antworte auf diese E-Mail oder erstelle ein neues Ticket über den Support-Chat auf InkBook.</p>
          </div>{_email_footer("Du erhältst diese E-Mail als Antwort auf dein Support-Ticket.")}</div>"""
        asyncio.create_task(send_email(user_email, f"[{ticket_num}] Antwort: {subject_str}", html))
    return {"replied": True, "ticket_number": ticket_num}

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
           "from_name": "InkBook Support", "created_at": now}
    await db.direct_support_chats.update_one(
        {"chat_id": chat_id},
        {"$push": {"messages": msg}, "$set": {"updated_at": now, "status": "in_progress"}}
    )
    return {"replied": True, "msg": msg}

@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.studios.create_index("studio_id", unique=True)
    await db.bookings.create_index("booking_id", unique=True)
    await db.slots.create_index("slot_id", unique=True)
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@inkbook.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "InkBook Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "auth_provider": "email"
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
    
    await seed_demo_data()
    logger.info("InkBook API started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

app.include_router(api_router)
