from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator
from pydantic_core import PydanticCustomError

from app.schemas.user import MeOut
from app.utils.validators import normalize_username, validate_password_strength


class RegisterIn(BaseModel):
    username: str
    email: EmailStr
    password: str
    password_confirm: str
    # Interface language at sign-up, stored as the account's initial preference.
    language: Literal["ar", "en"] = "ar"

    _username = field_validator("username")(normalize_username)
    _strength = field_validator("password")(validate_password_strength)

    @field_validator("email")
    @classmethod
    def _lower(cls, value: str) -> str:
        return value.lower()

    @field_validator("password_confirm")
    @classmethod
    def _matches(cls, value: str, info) -> str:
        if value != info.data.get("password"):
            raise PydanticCustomError("passwords_mismatch", "Passwords do not match")
        return value


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False

    @field_validator("email")
    @classmethod
    def _lower(cls, value: str) -> str:
        return value.lower()


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: MeOut


class FieldAvailability(BaseModel):
    available: bool
    code: str | None = None
    detail: str | None = None


class AvailabilityOut(BaseModel):
    username: FieldAvailability | None = None
    email: FieldAvailability | None = None


class ForgotPasswordIn(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def _lower(cls, value: str) -> str:
        return value.lower()


class ResetPasswordIn(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    password: str
    password_confirm: str

    _strength = field_validator("password")(validate_password_strength)

    @field_validator("password_confirm")
    @classmethod
    def _matches(cls, value: str, info) -> str:
        if value != info.data.get("password"):
            raise PydanticCustomError("passwords_mismatch", "Passwords do not match")
        return value
