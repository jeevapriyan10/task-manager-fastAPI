from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# ── User ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "password": "secret123",
            }
        }
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    username: str
    created_at: datetime


# ── Token ─────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str


# ── Task ──────────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime
    owner_id: int


# ── Pagination ────────────────────────────────────────────────────────────────

class PaginatedTasks(BaseModel):
    items: list[TaskOut]
    total: int
    page: int
    size: int
    pages: int
