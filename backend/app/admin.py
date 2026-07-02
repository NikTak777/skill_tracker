from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, Skill, Task, Progress, Comment


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "is_staff")
    list_filter = ("role", "is_staff")
    fieldsets = UserAdmin.fieldsets + (
        ("Role", {"fields": ("role",)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Role", {"fields": ("role",)}),
    )


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "skill", "manager", "employee", "status", "due_date")
    list_filter = ("status", "skill")
    search_fields = ("title",)


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ("task", "employee", "percent", "created_at")
    list_filter = ("employee",)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("task", "author", "created_at")
    search_fields = ("text",)