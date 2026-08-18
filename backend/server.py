from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import hashlib
import hmac
import logging
import os
import re
import secrets
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import bcrypt
import httpx
import jwt
import requests
from fastapi import APIRouter, Depends, FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.responses import PlainTextResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

import seed_data

logger = logging.getLogger("brazatech")
logging.basicConfig(level=logging.INFO)

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

JWT_ALG = "HS256"
DEMO_MODE = os.environ.get("DEMO_MODE", "true").lower() == "true"
APP_URL = os.environ.get("PUBLIC_APP_URL", "").rstrip("/")
MP_TOKEN = os.environ.get("MP_ACCESS_TOKEN", "")
MP_SECRET = os.environ.get("MP_WEBHOOK_SECRET", "")
MP_API = "https://api.mercadopago.com"

app = FastAPI(title="BRAZA TECH API")
api = APIRouter(prefix="/api")


# ----------------------------- helpers -----------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except ValueError:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALG)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALG)


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


def public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "phone": user.get("phone", ""),
        "role": user.get("role", "customer"),
        "created_at": user.get("created_at"),
    }


async def get_token(request: Request) -> Optional[str]:
    token = request.cookies.get("access_token")
    if not token:
        header = request.headers.get("Authorization", "")
        if header.startswith("Bearer "):
            token = header[7:]
    return token or None


async def get_current_user(request: Request) -> Dict[str, Any]:
    token = await get_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    return user


async def optional_user(request: Request) -> Optional[Dict[str, Any]]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return user


def slugify(value: str) -> str:
    value = value.lower().strip()
    replacements = {"á": "a", "à": "a", "ã": "a", "â": "a", "é": "e", "ê": "e", "í": "i", "ó": "o", "õ": "o", "ô": "o", "ú": "u", "ç": "c"}
    for k, v in replacements.items():
        value = value.replace(k, v)
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def compute_discount(product: Dict[str, Any]) -> Dict[str, Any]:
    price = product.get("price")
    previous = product.get("previous_price")
    product["discount_percent"] = 0
    if price and previous and previous > price:
        product["discount_percent"] = round(((previous - price) / previous) * 100)
    return product


# ----------------------------- models -----------------------------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    phone: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=6, max_length=100)


class CartItemIn(BaseModel):
    product_id: str
    quantity: int = Field(gt=0, le=50)


class QuoteIn(BaseModel):
    items: List[CartItemIn] = []
    coupon_code: Optional[str] = None
    cep: Optional[str] = None


class AddressIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    cpf: str
    cep: str
    state: str
    city: str
    street: str
    number: str
    complement: str = ""
    district: str


class OrderIn(BaseModel):
    items: List[CartItemIn] = Field(min_length=1)
    coupon_code: Optional[str] = None
    payment_method: str = "pix"
    customer: AddressIn


class ReviewIn(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=1000)


class SupportIn(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    subject: str
    message: str = Field(min_length=5)


# ----------------------------- auth routes -----------------------------
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado")
    user = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "email": email,
        "phone": payload.phone,
        "password_hash": hash_password(payload.password),
        "role": "customer",
        "created_at": now_iso(),
    }
    await db.users.insert_one(dict(user))
    access = create_access_token(user["id"], email, "customer")
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"user": public_user(user), "access_token": access}


@api.post("/auth/login")
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower()
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    ip = forwarded or (request.client.host if request.client else "unknown")
    ident = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": ident})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = datetime.fromisoformat(attempt["last"]) + timedelta(minutes=15)
        if datetime.now(timezone.utc) < locked_until:
            raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em 15 minutos.")
        await db.login_attempts.delete_one({"identifier": ident})

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        await db.login_attempts.update_one(
            {"identifier": ident}, {"$inc": {"count": 1}, "$set": {"last": now_iso()}}, upsert=True
        )
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")

    await db.login_attempts.delete_one({"identifier": ident})
    access = create_access_token(user["id"], email, user.get("role", "customer"))
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"user": public_user(user), "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: Dict[str, Any] = Depends(get_current_user)):
    return public_user(user)


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Sem refresh token")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALG])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Refresh token inválido")
    user = await db.users.find_one({"id": payload.get("sub")})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    access = create_access_token(user["id"], user["email"], user.get("role", "customer"))
    set_auth_cookies(response, access, token)
    return {"access_token": access, "user": public_user(user)}


@api.post("/auth/forgot-password")
async def forgot_password(payload: ForgotIn):
    user = await db.users.find_one({"email": payload.email.lower()})
    if user:
        token = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one(
            {
                "token": token,
                "user_id": user["id"],
                "used": False,
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            }
        )
        logger.info("Link de recuperação: %s/reset-senha?token=%s", APP_URL, token)
    return {"message": "Se o e-mail existir, enviaremos as instruções de recuperação."}


@api.post("/auth/reset-password")
async def reset_password(payload: ResetIn):
    record = await db.password_reset_tokens.find_one({"token": payload.token, "used": False})
    if not record:
        raise HTTPException(status_code=400, detail="Token inválido ou já utilizado")
    await db.users.update_one({"id": record["user_id"]}, {"$set": {"password_hash": hash_password(payload.password)}})
    await db.password_reset_tokens.update_one({"token": payload.token}, {"$set": {"used": True}})
    return {"ok": True}


# ----------------------------- catalog -----------------------------
@api.get("/categories")
async def list_categories():
    cats = await db.categories.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    for cat in cats:
        cat["product_count"] = await db.products.count_documents({"category": cat["slug"], "status": "active"})
    total = await db.products.count_documents({"status": "active"})
    return {"categories": cats, "total_products": total}


@api.get("/products")
async def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    in_stock: Optional[bool] = None,
    on_offer: Optional[bool] = None,
    featured: Optional[bool] = None,
    sort: str = "relevance",
    page: int = 1,
    limit: int = 24,
):
    query: Dict[str, Any] = {"status": "active"}
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [
            {"name": rx}, {"brand": rx}, {"model": rx}, {"sku": rx},
            {"category": rx}, {"keywords": rx}, {"short_description": rx},
        ]
    if category and category != "todos":
        query["category"] = category
    if brand:
        query["brand"] = brand
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    if in_stock:
        query["stock"] = {"$gt": 0}
    if on_offer:
        query["is_offer"] = True
    if featured:
        query["is_featured"] = True

    sorts = {
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "newest": [("created_at", -1)],
        "discount": [("discount_percent", -1)],
        "relevance": [("is_featured", -1), ("created_at", -1)],
    }
    limit = max(1, min(limit, 60))
    skip = (max(page, 1) - 1) * limit
    total = await db.products.count_documents(query)
    items = await db.products.find(query, {"_id": 0}).sort(sorts.get(sort, sorts["relevance"])).skip(skip).limit(limit).to_list(limit)
    brands = await db.products.distinct("brand", {"status": "active"})
    return {"items": [compute_discount(i) for i in items], "total": total, "page": page, "limit": limit, "brands": sorted([b for b in brands if b])}


@api.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    compute_discount(product)
    product["price_history"] = await db.price_history.find({"product_id": product["id"]}, {"_id": 0}).sort("date", 1).to_list(50)
    product["reviews"] = await db.reviews.find({"product_id": product["id"], "status": "approved"}, {"_id": 0}).sort("created_at", -1).to_list(50)
    related = await db.products.find(
        {"category": product["category"], "id": {"$ne": product["id"]}, "status": "active"}, {"_id": 0}
    ).limit(4).to_list(4)
    product["related"] = [compute_discount(r) for r in related]
    return product


@api.get("/search/suggestions")
async def suggestions(q: str = ""):
    if len(q.strip()) < 2:
        return {"products": [], "categories": []}
    rx = {"$regex": re.escape(q.strip()), "$options": "i"}
    products = await db.products.find(
        {"status": "active", "$or": [{"name": rx}, {"brand": rx}, {"keywords": rx}]},
        {"_id": 0, "name": 1, "slug": 1, "price": 1, "image": 1, "category": 1},
    ).limit(6).to_list(6)
    cats = await db.categories.find({"name": rx}, {"_id": 0, "name": 1, "slug": 1}).limit(4).to_list(4)
    return {"products": products, "categories": cats}


@api.get("/banners")
async def banners():
    return await db.banners.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(20)


@api.get("/testimonials")
async def testimonials():
    return await db.testimonials.find({"active": True}, {"_id": 0}).sort("created_at", -1).to_list(20)


@api.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"id": "site"}, {"_id": 0})
    return settings or {}


# ----------------------------- favorites -----------------------------
@api.get("/favorites")
async def get_favorites(user: Dict[str, Any] = Depends(get_current_user)):
    favs = await db.favorites.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    ids = [f["product_id"] for f in favs]
    products = await db.products.find({"id": {"$in": ids}}, {"_id": 0}).to_list(200)
    return [compute_discount(p) for p in products]


@api.post("/favorites/{product_id}")
async def add_favorite(product_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    await db.favorites.update_one(
        {"user_id": user["id"], "product_id": product_id},
        {"$set": {"user_id": user["id"], "product_id": product_id, "created_at": now_iso()}},
        upsert=True,
    )
    return {"ok": True}


@api.delete("/favorites/{product_id}")
async def remove_favorite(product_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    await db.favorites.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"ok": True}


# ----------------------------- pricing / cart -----------------------------
async def price_cart(items: List[CartItemIn], coupon_code: Optional[str], cep: Optional[str]) -> Dict[str, Any]:
    settings = await db.settings.find_one({"id": "site"}, {"_id": 0}) or {}
    resolved: List[Dict[str, Any]] = []
    subtotal = 0.0
    for item in items:
        product = await db.products.find_one({"id": item.product_id, "status": "active"}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail="Produto indisponível no carrinho")
        if product.get("product_type") == "affiliate":
            raise HTTPException(status_code=400, detail=f"{product['name']} é um produto de parceiro e deve ser comprado no fornecedor.")
        if product.get("stock", 0) < item.quantity:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {product['name']}")
        line = round(float(product["price"]) * item.quantity, 2)
        subtotal += line
        resolved.append(
            {
                "product_id": product["id"],
                "name": product["name"],
                "slug": product["slug"],
                "image": product.get("image"),
                "unit_price": float(product["price"]),
                "quantity": item.quantity,
                "line_total": line,
            }
        )

    subtotal = round(subtotal, 2)
    discount = 0.0
    coupon = None
    coupon_error = None
    if coupon_code:
        coupon = await db.coupons.find_one({"code": coupon_code.upper().strip(), "active": True}, {"_id": 0})
        if not coupon:
            coupon_error = "Cupom inválido ou inativo"
        elif coupon.get("valid_until") and coupon["valid_until"] < now_iso():
            coupon_error = "Cupom expirado"
        elif coupon.get("usage_limit") and coupon.get("used_count", 0) >= coupon["usage_limit"]:
            coupon_error = "Cupom esgotado"
        elif subtotal < float(coupon.get("min_value", 0)):
            coupon_error = f"Cupom válido para compras acima de R$ {float(coupon.get('min_value', 0)):.2f}"
        else:
            if coupon["type"] == "percent":
                discount = round(subtotal * float(coupon["value"]) / 100, 2)
            else:
                discount = min(round(float(coupon["value"]), 2), subtotal)
        if coupon_error:
            coupon = None

    free_from = float(settings.get("free_shipping_min", 299))
    flat = float(settings.get("shipping_flat", 29.9))
    shipping = 0.0 if (subtotal - discount) >= free_from or not resolved else flat
    if cep and len(re.sub(r"\D", "", cep)) == 8 and shipping > 0:
        region = re.sub(r"\D", "", cep)[0]
        shipping = round(flat + (0 if region in "01234" else 9.9), 2)
    total = round(max(subtotal - discount + shipping, 0), 2)
    return {
        "items": resolved,
        "subtotal": subtotal,
        "discount": round(discount, 2),
        "shipping": round(shipping, 2),
        "total": total,
        "coupon": coupon["code"] if coupon else None,
        "coupon_error": coupon_error,
        "free_shipping_min": free_from,
    }


@api.post("/cart/quote")
async def cart_quote(payload: QuoteIn):
    return await price_cart(payload.items, payload.coupon_code, payload.cep)


# ----------------------------- orders -----------------------------
@api.post("/orders")
async def create_order(payload: OrderIn, user: Optional[Dict[str, Any]] = Depends(optional_user)):
    quote = await price_cart(payload.items, payload.coupon_code, payload.customer.cep)
    if quote["coupon_error"]:
        raise HTTPException(status_code=400, detail=quote["coupon_error"])
    if payload.payment_method not in ("pix", "card"):
        raise HTTPException(status_code=400, detail="Forma de pagamento inválida")

    number = f"BT{datetime.now(timezone.utc).strftime('%y%m%d')}{secrets.randbits(16) % 9000 + 1000}"
    order = {
        "id": str(uuid.uuid4()),
        "number": number,
        "user_id": user["id"] if user else None,
        "customer": payload.customer.model_dump(),
        "items": quote["items"],
        "subtotal": quote["subtotal"],
        "discount": quote["discount"],
        "shipping": quote["shipping"],
        "total": quote["total"],
        "coupon": quote["coupon"],
        "payment_method": payload.payment_method,
        "status": "pending_payment",
        "payment_id": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.orders.insert_one(dict(order))
    if quote["coupon"]:
        await db.coupons.update_one({"code": quote["coupon"]}, {"$inc": {"used_count": 1}})
        await db.coupon_usages.insert_one({"code": quote["coupon"], "order_id": order["id"], "created_at": now_iso()})
    order.pop("_id", None)
    return order


@api.get("/orders/mine")
async def my_orders(user: Dict[str, Any] = Depends(get_current_user)):
    return await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api.get("/orders/{number}")
async def get_order(number: str):
    order = await db.orders.find_one({"number": number}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return order


# ----------------------------- reviews / support -----------------------------
@api.post("/reviews")
async def create_review(payload: ReviewIn, user: Dict[str, Any] = Depends(get_current_user)):
    product = await db.products.find_one({"id": payload.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    purchased = await db.orders.count_documents(
        {"user_id": user["id"], "status": {"$in": ["paid", "shipped", "delivered", "processing"]}, "items.product_id": payload.product_id}
    )
    review = {
        "id": str(uuid.uuid4()),
        "product_id": payload.product_id,
        "product_name": product["name"],
        "user_id": user["id"],
        "customer_name": user.get("name", ""),
        "rating": payload.rating,
        "comment": payload.comment,
        "verified_purchase": purchased > 0,
        "status": "pending",
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(dict(review))
    return {"message": "Avaliação enviada e aguardando moderação.", "review": review}


@api.post("/support")
async def create_support(payload: SupportIn):
    message = {"id": str(uuid.uuid4()), **payload.model_dump(), "status": "open", "created_at": now_iso()}
    await db.support_messages.insert_one(dict(message))
    return {"message": "Mensagem recebida! Nossa equipe responderá em breve."}


# ----------------------------- admin -----------------------------
@api.get("/admin/dashboard")
async def dashboard(_: Dict[str, Any] = Depends(require_admin)):
    paid_states = ["paid", "processing", "shipped", "delivered"]
    orders = await db.orders.find({}, {"_id": 0}).to_list(2000)
    paid = [o for o in orders if o["status"] in paid_states]
    revenue = round(sum(o["total"] for o in paid), 2)
    products_count = await db.products.count_documents({})
    customers_count = await db.users.count_documents({"role": "customer"})
    avg_ticket = round(revenue / len(paid), 2) if paid else 0
    low_stock = await db.products.find(
        {"$expr": {"$lte": ["$stock", "$min_stock"]}, "product_type": "own_store"}, {"_id": 0, "name": 1, "stock": 1, "min_stock": 1, "slug": 1}
    ).limit(10).to_list(10)
    pending = [o for o in orders if o["status"] in ("pending", "pending_payment")]

    sold: Dict[str, Dict[str, Any]] = {}
    for order in paid:
        for item in order["items"]:
            entry = sold.setdefault(item["product_id"], {"name": item["name"], "quantity": 0, "revenue": 0.0})
            entry["quantity"] += item["quantity"]
            entry["revenue"] = round(entry["revenue"] + item["line_total"], 2)
    top = sorted(sold.values(), key=lambda x: x["quantity"], reverse=True)[:5]

    series: Dict[str, float] = {}
    for order in paid:
        day = order["created_at"][:10]
        series[day] = round(series.get(day, 0) + order["total"], 2)
    revenue_series = [{"date": d, "revenue": v} for d, v in sorted(series.items())][-14:]

    return {
        "revenue": revenue,
        "orders_count": len(orders),
        "products_count": products_count,
        "customers_count": customers_count,
        "avg_ticket": avg_ticket,
        "top_products": top,
        "low_stock": low_stock,
        "pending_orders": pending[:10],
        "revenue_series": revenue_series,
        "demo_mode": DEMO_MODE,
    }


@api.get("/admin/products")
async def admin_products(_: Dict[str, Any] = Depends(require_admin)):
    items = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [compute_discount(i) for i in items]


@api.post("/admin/products")
async def admin_create_product(payload: Dict[str, Any], _: Dict[str, Any] = Depends(require_admin)):
    product = seed_data.normalize_product(payload)
    product["id"] = str(uuid.uuid4())
    product["slug"] = slugify(payload.get("slug") or payload.get("name", "produto"))
    if await db.products.find_one({"slug": product["slug"]}):
        product["slug"] = f"{product['slug']}-{secrets.token_hex(2)}"
    product["created_at"] = now_iso()
    product["updated_at"] = now_iso()
    await db.products.insert_one(dict(product))
    return compute_discount(product)


@api.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, payload: Dict[str, Any], _: Dict[str, Any] = Depends(require_admin)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    updates = seed_data.normalize_product({**existing, **payload})
    updates["id"] = product_id
    updates["slug"] = slugify(payload.get("slug") or existing["slug"])
    updates["created_at"] = existing.get("created_at", now_iso())
    updates["updated_at"] = now_iso()
    if float(updates["price"]) != float(existing.get("price", 0)):
        await db.price_history.insert_one(
            {"product_id": product_id, "price": float(updates["price"]), "date": now_iso()[:10], "created_at": now_iso()}
        )
    await db.products.replace_one({"id": product_id}, dict(updates))
    return compute_discount(updates)


@api.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, _: Dict[str, Any] = Depends(require_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return {"ok": True}


@api.put("/admin/products/{product_id}/stock")
async def admin_update_stock(product_id: str, payload: Dict[str, Any], _: Dict[str, Any] = Depends(require_admin)):
    stock = max(int(payload.get("stock", 0)), 0)
    min_stock = max(int(payload.get("min_stock", 3)), 0)
    result = await db.products.update_one({"id": product_id}, {"$set": {"stock": stock, "min_stock": min_stock, "updated_at": now_iso()}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return {"ok": True, "stock": stock, "min_stock": min_stock}


@api.get("/admin/inventory")
async def admin_inventory(_: Dict[str, Any] = Depends(require_admin)):
    items = await db.products.find({}, {"_id": 0, "id": 1, "name": 1, "sku": 1, "stock": 1, "min_stock": 1, "product_type": 1}).to_list(500)
    for item in items:
        if item.get("product_type") == "affiliate":
            item["stock_status"] = "Parceiro"
        elif item.get("stock", 0) <= 0:
            item["stock_status"] = "Esgotado"
        elif item.get("stock", 0) <= item.get("min_stock", 3):
            item["stock_status"] = "Estoque baixo"
        else:
            item["stock_status"] = "Disponível"
    return items


@api.get("/admin/orders")
async def admin_orders(_: Dict[str, Any] = Depends(require_admin)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.put("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, payload: Dict[str, Any], _: Dict[str, Any] = Depends(require_admin)):
    valid = ["pending", "pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]
    status = payload.get("status")
    if status not in valid:
        raise HTTPException(status_code=400, detail="Status inválido")
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if status == "paid" and order["status"] != "paid":
        await decrement_stock(order)
    await db.orders.update_one({"id": order_id}, {"$set": {"status": status, "updated_at": now_iso()}})
    return {"ok": True, "status": status}


@api.get("/admin/customers")
async def admin_customers(_: Dict[str, Any] = Depends(require_admin)):
    users = await db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).to_list(500)
    for user in users:
        orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0, "total": 1, "status": 1}).to_list(200)
        user["orders_count"] = len(orders)
        user["total_spent"] = round(sum(o["total"] for o in orders if o["status"] in ("paid", "processing", "shipped", "delivered")), 2)
    return users


@api.get("/admin/reviews")
async def admin_reviews(_: Dict[str, Any] = Depends(require_admin)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.put("/admin/reviews/{review_id}")
async def admin_update_review(review_id: str, payload: Dict[str, Any], _: Dict[str, Any] = Depends(require_admin)):
    status = payload.get("status")
    if status not in ("pending", "approved", "rejected"):
        raise HTTPException(status_code=400, detail="Status inválido")
    await db.reviews.update_one({"id": review_id}, {"$set": {"status": status}})
    review = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    if review:
        await recalc_rating(review["product_id"])
    return {"ok": True}


@api.delete("/admin/reviews/{review_id}")
async def admin_delete_review(review_id: str, _: Dict[str, Any] = Depends(require_admin)):
    await db.reviews.delete_one({"id": review_id})
    return {"ok": True}


async def recalc_rating(product_id: str) -> None:
    reviews = await db.reviews.find({"product_id": product_id, "status": "approved"}, {"_id": 0, "rating": 1}).to_list(500)
    if reviews:
        rating = round(sum(r["rating"] for r in reviews) / len(reviews), 1)
    else:
        rating = None
    await db.products.update_one({"id": product_id}, {"$set": {"rating": rating, "reviews_count": len(reviews)}})


async def decrement_stock(order: Dict[str, Any]) -> None:
    for item in order["items"]:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0, "stock": 1})
        if product:
            new_stock = max(int(product.get("stock", 0)) - item["quantity"], 0)
            await db.products.update_one({"id": item["product_id"]}, {"$set": {"stock": new_stock, "updated_at": now_iso()}})


def crud_routes(name: str, collection: str, defaults: Dict[str, Any]):
    @api.get(f"/admin/{name}", name=f"list_{name}")
    async def _list(_: Dict[str, Any] = Depends(require_admin)):
        return await db[collection].find({}, {"_id": 0}).to_list(500)

    @api.post(f"/admin/{name}", name=f"create_{name}")
    async def _create(payload: Dict[str, Any], _: Dict[str, Any] = Depends(require_admin)):
        doc = {**defaults, **payload, "id": str(uuid.uuid4()), "created_at": now_iso()}
        if collection == "coupons":
            doc["code"] = str(doc.get("code", "")).upper().strip()
            if not doc["code"]:
                raise HTTPException(status_code=400, detail="Código do cupom obrigatório")
            if await db.coupons.find_one({"code": doc["code"]}):
                raise HTTPException(status_code=400, detail="Cupom já existe")
        if collection == "categories":
            doc["slug"] = slugify(doc.get("slug") or doc.get("name", ""))
        await db[collection].insert_one(dict(doc))
        return doc

    @api.put(f"/admin/{name}/{{item_id}}", name=f"update_{name}")
    async def _update(item_id: str, payload: Dict[str, Any], _: Dict[str, Any] = Depends(require_admin)):
        payload.pop("id", None)
        payload.pop("_id", None)
        result = await db[collection].update_one({"id": item_id}, {"$set": {**payload, "updated_at": now_iso()}})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Registro não encontrado")
        return await db[collection].find_one({"id": item_id}, {"_id": 0})

    @api.delete(f"/admin/{name}/{{item_id}}", name=f"delete_{name}")
    async def _delete(item_id: str, _: Dict[str, Any] = Depends(require_admin)):
        result = await db[collection].delete_one({"id": item_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Registro não encontrado")
        return {"ok": True}


crud_routes("coupons", "coupons", {"type": "percent", "value": 0, "min_value": 0, "usage_limit": 0, "used_count": 0, "active": True, "valid_until": None})
crud_routes("categories", "categories", {"icon": "Cpu", "order": 99})
crud_routes("banners", "banners", {"active": True, "order": 1, "link": "/produtos"})
crud_routes("testimonials", "testimonials", {"active": True, "rating": 5, "city": "", "photo": ""})


@api.get("/admin/support")
async def admin_support(_: Dict[str, Any] = Depends(require_admin)):
    return await db.support_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.put("/admin/support/{message_id}")
async def admin_support_update(message_id: str, payload: Dict[str, Any], _: Dict[str, Any] = Depends(require_admin)):
    await db.support_messages.update_one({"id": message_id}, {"$set": {"status": payload.get("status", "open")}})
    return {"ok": True}


@api.put("/admin/settings")
async def admin_settings(payload: Dict[str, Any], _: Dict[str, Any] = Depends(require_admin)):
    payload.pop("_id", None)
    payload["id"] = "site"
    await db.settings.update_one({"id": "site"}, {"$set": payload}, upsert=True)
    return await db.settings.find_one({"id": "site"}, {"_id": 0})


# ----------------------------- mercado pago -----------------------------
@api.get("/payments/config")
async def payments_config():
    return {"provider": "mercadopago", "configured": bool(MP_TOKEN)}


@api.post("/payments/mercadopago/preference")
async def create_preference(payload: Dict[str, Any], _: Optional[Dict[str, Any]] = Depends(optional_user)):
    order = await db.orders.find_one({"number": payload.get("order_number")}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if not MP_TOKEN:
        raise HTTPException(status_code=503, detail="Mercado Pago ainda não configurado. Informe o Access Token no servidor.")
    preference = {
        "items": [
            {"title": i["name"], "quantity": i["quantity"], "unit_price": round(i["unit_price"], 2), "currency_id": "BRL"}
            for i in order["items"]
        ],
        "external_reference": order["id"],
        "back_urls": {
            "success": f"{APP_URL}/pedido/{order['number']}",
            "failure": f"{APP_URL}/pedido/{order['number']}",
            "pending": f"{APP_URL}/pedido/{order['number']}",
        },
        "auto_return": "approved",
        "notification_url": f"{APP_URL}/api/payments/mercadopago/webhook",
    }
    async with httpx.AsyncClient(timeout=20) as http:
        response = await http.post(
            f"{MP_API}/checkout/preferences",
            json=preference,
            headers={"Authorization": f"Bearer {MP_TOKEN}", "Content-Type": "application/json"},
        )
    if response.is_error:
        logger.error("Mercado Pago error: %s", response.text)
        raise HTTPException(status_code=502, detail="Erro ao criar preferência no Mercado Pago")
    data = response.json()
    await db.orders.update_one({"id": order["id"]}, {"$set": {"preference_id": data["id"], "updated_at": now_iso()}})
    return {"preference_id": data["id"], "init_point": data.get("init_point")}


def verify_mp_signature(signature: Optional[str], request_id: Optional[str], data_id: Optional[str]) -> bool:
    if not MP_SECRET or not signature or not data_id:
        return False
    parts = {}
    for chunk in signature.split(","):
        key, sep, value = chunk.strip().partition("=")
        if sep:
            parts[key] = value
    ts, received = parts.get("ts"), parts.get("v1")
    if not ts or not received:
        return False
    manifest = f"id:{data_id.lower()};"
    if request_id:
        manifest += f"request-id:{request_id};"
    manifest += f"ts:{ts};"
    expected = hmac.new(MP_SECRET.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received):
        return False
    try:
        stamp = int(ts)
        if stamp > 10_000_000_000:
            stamp //= 1000
        return abs(int(time.time()) - stamp) <= 300
    except ValueError:
        return False


@api.post("/payments/mercadopago/webhook")
async def mp_webhook(request: Request):
    body = await request.json()
    query_id = request.query_params.get("data.id") or request.query_params.get("id")
    body_id = str(body.get("data", {}).get("id", query_id or ""))
    if not verify_mp_signature(request.headers.get("x-signature"), request.headers.get("x-request-id"), query_id or body_id):
        raise HTTPException(status_code=401, detail="Assinatura inválida")
    if body.get("type") == "payment" and body_id:
        async with httpx.AsyncClient(timeout=20) as http:
            response = await http.get(f"{MP_API}/v1/payments/{body_id}", headers={"Authorization": f"Bearer {MP_TOKEN}"})
        if response.is_error:
            return {"received": True}
        payment = response.json()
        order = await db.orders.find_one({"id": payment.get("external_reference")}, {"_id": 0})
        if order:
            mapping = {"approved": "paid", "pending": "pending_payment", "in_process": "pending_payment", "rejected": "cancelled", "cancelled": "cancelled", "refunded": "refunded"}
            status = mapping.get(payment.get("status"), "pending_payment")
            if status == "paid" and order["status"] != "paid":
                await decrement_stock(order)
            await db.orders.update_one(
                {"id": order["id"]},
                {"$set": {"status": status, "payment_id": str(body_id), "payment_status_detail": payment.get("status_detail"), "updated_at": now_iso()}},
            )
    return {"received": True}


# ----------------------------- uploads (object storage) -----------------------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
APP_NAME = "brazatech"
ALLOWED_IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    response = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")}, timeout=30)
    response.raise_for_status()
    storage_key = response.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> Dict[str, Any]:
    def send(key: str):
        return requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )

    response = send(init_storage())
    if response.status_code == 404:
        response = send(init_storage(force=True))
    response.raise_for_status()
    return response.json()


def get_object(path: str):
    def fetch(key: str):
        return requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)

    response = fetch(init_storage())
    if response.status_code == 404:
        response = fetch(init_storage(force=True))
    response.raise_for_status()
    return response.content, response.headers.get("Content-Type", "application/octet-stream")


@api.post("/admin/uploads")
async def upload_images(files: List[UploadFile] = File(...), admin: Dict[str, Any] = Depends(require_admin)):
    urls = []
    for upload in files:
        content_type = upload.content_type or ""
        if content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Formato inválido. Envie imagens JPG, PNG, WEBP ou GIF.")
        data = await upload.read()
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=400, detail=f"{upload.filename} excede o limite de 8 MB.")
        path = f"{APP_NAME}/uploads/{admin['id']}/{uuid.uuid4()}.{ALLOWED_IMAGE_TYPES[content_type]}"
        try:
            result = put_object(path, data, content_type)
        except requests.RequestException as exc:
            logger.error("Falha no upload: %s", exc)
            raise HTTPException(status_code=502, detail="Falha ao enviar a imagem para o armazenamento.")
        await db.files.insert_one(
            {
                "id": str(uuid.uuid4()),
                "storage_path": result["path"],
                "original_filename": upload.filename,
                "content_type": content_type,
                "size": result.get("size", len(data)),
                "is_deleted": False,
                "uploaded_by": admin["id"],
                "created_at": now_iso(),
            }
        )
        urls.append(f"{APP_URL}/api/files/{result['path']}")
    return {"urls": urls}


@api.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    try:
        data, content_type = get_object(path)
    except requests.RequestException:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return Response(
        content=data,
        media_type=record.get("content_type", content_type),
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


# ----------------------------- seo -----------------------------
@app.get("/api/sitemap.xml")
async def sitemap():
    products = await db.products.find({"status": "active"}, {"_id": 0, "slug": 1}).to_list(1000)
    cats = await db.categories.find({}, {"_id": 0, "slug": 1}).to_list(100)
    urls = ["/", "/produtos", "/ofertas", "/categorias", "/sobre", "/sac", "/faq"]
    urls += [f"/categoria/{c['slug']}" for c in cats]
    urls += [f"/produto/{p['slug']}" for p in products]
    body = "".join(f"<url><loc>{APP_URL}{u}</loc></url>" for u in urls)
    return PlainTextResponse(
        f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>',
        media_type="application/xml",
    )


@api.get("/")
async def root():
    return {"app": "BRAZA TECH", "slogan": "Tecnologia que conecta. Confiança que entrega.", "demo_mode": DEMO_MODE}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Object storage inicializado")
    except Exception as exc:  # noqa: BLE001
        logger.error("Falha ao inicializar object storage: %s", exc)
    await db.files.create_index("storage_path")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id")
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("id")
    await db.orders.create_index("number", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)

    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one(
            {"id": str(uuid.uuid4()), "name": "Administrador", "email": admin_email, "phone": "",
             "password_hash": hash_password(admin_password), "role": "admin", "created_at": now_iso()}
        )
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    test_email = "cliente@brazatech.com.br"
    if not await db.users.find_one({"email": test_email}):
        await db.users.insert_one(
            {"id": str(uuid.uuid4()), "name": "Cliente Teste", "email": test_email, "phone": "(67) 99873-7690",
             "password_hash": hash_password("Cliente@2026"), "role": "customer", "created_at": now_iso()}
        )

    await seed_data.seed(db, DEMO_MODE)


@app.on_event("shutdown")
async def shutdown():
    client.close()
