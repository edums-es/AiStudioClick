"""Auth router — JWT login/register/logout/me com rate limiting e cookies seguros."""
import os
import logging
from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel, EmailStr, field_validator
from bson import ObjectId
from datetime import datetime, timezone

from slowapi import Limiter
from slowapi.util import get_remote_address

from core.database import get_db
from core.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, get_current_user,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Rate limiter — partilhado com server.py via `from routers.auth import limiter`
limiter = Limiter(key_func=get_remote_address)

# Produção usa cookies secure=True; desenvolvimento usa False (HTTP local)
_IS_PRODUCTION = os.environ.get("ENVIRONMENT", "development") == "production"


class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Senha deve ter no mínimo 8 caracteres")
        return v


class LoginInput(BaseModel):
    email: EmailStr
    password: str


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        "access_token", access_token,
        httponly=True, secure=_IS_PRODUCTION,
        samesite="lax", max_age=86400, path="/"
    )
    response.set_cookie(
        "refresh_token", refresh_token,
        httponly=True, secure=_IS_PRODUCTION,
        samesite="lax", max_age=604800, path="/"
    )


@router.post("/register")
@limiter.limit("5/minute")
async def register(request: Request, data: RegisterInput, response: Response):
    db = get_db()
    email = data.email.lower()

    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    tenant_doc = {
        "name": f"Workspace de {data.name}",
        "slug": email.split("@")[0].lower().replace(".", "-"),
        "plan": "trial",
        "settings": {"timezone": "America/Sao_Paulo", "language": "pt-BR"},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    tenant_result = await db.tenants.insert_one(tenant_doc)
    tenant_id = str(tenant_result.inserted_id)

    user_doc = {
        "name": data.name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "owner",
        "tenant_id": tenant_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    user_result = await db.users.insert_one(user_doc)
    user_id = str(user_result.inserted_id)

    await db.tenants.update_one(
        {"_id": tenant_result.inserted_id}, {"$set": {"owner_id": user_id}}
    )
    await db.memberships.insert_one({
        "user_id": user_id, "tenant_id": tenant_id, "role": "owner",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    access_token = create_access_token(user_id, email, tenant_id)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)

    return {
        "id": user_id, "name": data.name, "email": email,
        "role": "owner", "tenant_id": tenant_id, "token": access_token,
    }


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, data: LoginInput, response: Response):
    db = get_db()
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")

    user_id = str(user["_id"])
    tenant_id = user.get("tenant_id", "")
    access_token = create_access_token(user_id, email, tenant_id)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)

    return {
        "id": user_id, "name": user.get("name", ""), "email": email,
        "role": user.get("role", "member"), "tenant_id": tenant_id, "token": access_token,
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logout realizado com sucesso"}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return user
