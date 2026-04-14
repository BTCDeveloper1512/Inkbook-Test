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

def booking_confirmation_html(booking: dict, lang: str = "de") -> str:
    type_label = "Beratungsgespräch" if booking.get("booking_type") == "consultation" else "Tattoo-Session"
    if lang == "en":
        type_label = "Consultation" if booking.get("booking_type") == "consultation" else "Tattoo Session"
        subject_line = f"Booking Confirmation – {booking.get('studio_name', '')}"
        greeting = f"Your appointment at <strong>{booking.get('studio_name', '')}</strong> has been booked."
        details = "Appointment Details"
        footer = "See you soon! Your InkBook Team"
    else:
        subject_line = f"Buchungsbestätigung – {booking.get('studio_name', '')}"
        greeting = f"Dein Termin bei <strong>{booking.get('studio_name', '')}</strong> wurde gebucht."
        details = "Termindetails"
        footer = "Wir freuen uns auf dich! Dein InkBook Team"

    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff;">
      <div style="border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="font-size:24px;font-weight:bold;margin:0;letter-spacing:-0.5px;">InkBook</h1>
      </div>
      <h2 style="font-size:20px;font-weight:bold;margin-bottom:8px;">{subject_line}</h2>
      <p style="color:#555;font-size:14px;margin-bottom:24px;">{greeting}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:12px;background:#f9f9f9;border:1px solid #eee;font-size:13px;font-weight:600;width:40%;">{details}</td><td style="padding:12px;background:#f9f9f9;border:1px solid #eee;font-size:13px;"></td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #eee;font-size:13px;color:#777;">Studio</td><td style="padding:10px 12px;border:1px solid #eee;font-size:13px;font-weight:600;">{booking.get('studio_name', '')}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #eee;font-size:13px;color:#777;">Datum</td><td style="padding:10px 12px;border:1px solid #eee;font-size:13px;">{booking.get('date', '')}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #eee;font-size:13px;color:#777;">Zeit</td><td style="padding:10px 12px;border:1px solid #eee;font-size:13px;">{booking.get('start_time', '')} – {booking.get('end_time', '')}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #eee;font-size:13px;color:#777;">Art</td><td style="padding:10px 12px;border:1px solid #eee;font-size:13px;">{type_label}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #eee;font-size:13px;color:#777;">Buchungs-ID</td><td style="padding:10px 12px;border:1px solid #eee;font-size:13px;font-family:monospace;">{booking.get('booking_id', '')}</td></tr>
      </table>
      <div style="background:#000;color:#fff;padding:16px 20px;font-size:13px;">{footer}</div>
    </div>
    """

def booking_status_html(booking: dict, status: str) -> str:
    status_de = {"confirmed": "Bestätigt ✓", "cancelled": "Abgesagt"}.get(status, status)
    color = "#16a34a" if status == "confirmed" else "#dc2626"
    return f"""
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff;">
      <div style="border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="font-size:24px;font-weight:bold;margin:0;">InkBook</h1>
      </div>
      <div style="border-left:4px solid {color};padding-left:16px;margin-bottom:24px;">
        <h2 style="font-size:18px;font-weight:bold;color:{color};margin:0 0 4px 0;">Dein Termin wurde {status_de}</h2>
        <p style="color:#555;font-size:14px;margin:0;">Studio: <strong>{booking.get('studio_name', '')}</strong> | {booking.get('date', '')} um {booking.get('start_time', '')}</p>
      </div>
      <p style="font-size:13px;color:#777;">Buchungs-ID: {booking.get('booking_id', '')}</p>
      <div style="background:#000;color:#fff;padding:16px 20px;font-size:13px;margin-top:24px;">Dein InkBook Team</div>
    </div>
    """

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

class MessageCreate(BaseModel):
    recipient_id: str
    content: str
    image_url: str = ""

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

class ArtistUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    styles: Optional[List[str]] = None
    experience_years: Optional[int] = None
    instagram: Optional[str] = None
    portfolio_images: Optional[List[str]] = None

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
    existing = await db.reviews.find_one({"studio_id": studio_id, "user_id": user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already reviewed this studio")
    
    review_doc = {
        "review_id": f"rev_{uuid.uuid4().hex[:12]}",
        "studio_id": studio_id,
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
    
    # Send confirmation email (fire & forget)
    user_email = current_user.get("email", "")
    if user_email:
        asyncio.create_task(send_email(
            to=user_email,
            subject=f"Buchungsbestätigung – {studio.get('name', '')}",
            html=booking_confirmation_html(booking_doc)
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
    
    await db.bookings.update_one({"booking_id": booking_id}, {"$set": {"status": status}})
    if status == "cancelled":
        await db.slots.update_one({"slot_id": booking.get("slot_id")}, {"$set": {"is_booked": False}})
    
    # Send status update email
    user_email = booking.get("user_email", "")
    if user_email and status in ["confirmed", "cancelled"]:
        asyncio.create_task(send_email(
            to=user_email,
            subject=f"Termin {'bestätigt' if status == 'confirmed' else 'abgesagt'} – {booking.get('studio_name', '')}",
            html=booking_status_html(booking, status)
        ))
    
    return {"message": "Booking updated"}

# ─── Messages / Chat ──────────────────────────────────────────────────────────
@api_router.get("/messages")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    convs = await db.conversations.find(
        {"participants": user_id}, {"_id": 0}
    ).to_list(100)
    
    # Enrich with other participant's name
    enriched = []
    for conv in convs:
        other_id = next((p for p in conv.get("participants", []) if p != user_id), None)
        other_name = "Nutzer"
        if other_id:
            other_user = await db.users.find_one({"$or": [
                {"_id": ObjectId(other_id)} if len(other_id) == 24 else {"user_id": other_id},
                {"user_id": other_id}
            ]}, {"name": 1, "_id": 0})
            if other_user:
                other_name = other_user.get("name", "Nutzer")
        enriched.append({**conv, "last_sender_name": other_name, "other_user_id": other_id})
    return enriched

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": user_id, "recipient_id": other_user_id},
            {"sender_id": other_user_id, "recipient_id": user_id}
        ]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return messages

@api_router.post("/messages")
async def send_message(data: MessageCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id") or current_user.get("user_id")
    msg_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "sender_id": user_id,
        "sender_name": current_user.get("name", ""),
        "recipient_id": data.recipient_id,
        "content": data.content,
        "image_url": data.image_url,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False
    }
    await db.messages.insert_one(msg_doc)
    
    participants = sorted([user_id, data.recipient_id])
    conv_id = f"conv_{'_'.join(participants)}"
    await db.conversations.update_one(
        {"conv_id": conv_id},
        {"$set": {
            "conv_id": conv_id,
            "participants": participants,
            "last_message": data.content,
            "last_message_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    msg_doc.pop("_id", None)
    return msg_doc

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
        
        return {
            "has_studio": True,
            "studio": studio,
            "total_bookings": total_bookings,
            "pending_bookings": pending,
            "confirmed_bookings": confirmed,
            "revenue": revenue,
            "upcoming_bookings": upcoming
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
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return users

@api_router.delete("/admin/studios/{studio_id}")
async def admin_delete_studio(studio_id: str, current_user: dict = Depends(require_admin)):
    await db.studios.delete_one({"studio_id": studio_id})
    await db.slots.delete_many({"studio_id": studio_id})
    return {"message": "Studio deleted"}

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
