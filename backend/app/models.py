from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        MANAGER = "manager", "Manager"
        EMPLOYEE = "employee", "Employee"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPLOYEE,
    )

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.username


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Task(models.Model):
    class Status(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        DONE = "done", "Done"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    skill = models.ForeignKey(Skill, on_delete=models.PROTECT, related_name="tasks")
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_tasks",
        limit_choices_to={"role": User.Role.MANAGER},
    )
    employee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="assigned_tasks",
        limit_choices_to={"role": User.Role.EMPLOYEE},
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Progress(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="progress_entries")
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="progress_updates")
    percent = models.PositiveSmallIntegerField(default=0)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Progress entries"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.task.title} - {self.percent}%"


class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author.username} on {self.task.title}"
