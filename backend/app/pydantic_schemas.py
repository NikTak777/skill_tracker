from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ValidationError
from rest_framework import status
from rest_framework.response import Response


def validate_request(schema_class: type[BaseModel], data: dict) -> Response | None:
    """Проверяет JSON через Pydantic. При ошибке возвращает Response 400."""
    try:
        schema_class.model_validate(data)
        return None
    except ValidationError as exc:
        return Response({"errors": exc.errors()}, status=status.HTTP_400_BAD_REQUEST)


class UserRegisterSchema(BaseModel):
    username: str = Field(min_length=3, max_length=150)
    email: EmailStr | None = None
    password: str = Field(min_length=8)
    first_name: str = ""
    last_name: str = ""


class TaskCreateSchema(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    skill: int = Field(gt=0)
    employee: int = Field(gt=0)
    due_date: date | None = None


class TaskUpdateSchema(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: Literal["todo", "in_progress", "done"] | None = None
    due_date: date | None = None


class ProgressCreateSchema(BaseModel):
    task: int = Field(gt=0)
    percent: int = Field(ge=0, le=100)
    note: str = ""


class CommentCreateSchema(BaseModel):
    task: int = Field(gt=0)
    text: str = Field(min_length=1)

class SkillCreateSchema(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = ""