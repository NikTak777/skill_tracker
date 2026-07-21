from rest_framework import serializers

from .models import User, Skill, Task, Progress, Comment, Notification


# Для пользователя
class UserReadSerializer(serializers.ModelSerializer):
    """Для чтения: списки, профиль, вложения в Task/Comment."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "first_name", "last_name"]


class UserWriteSerializer(serializers.ModelSerializer):
    """Для создания/регистрации пользователя."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "role", "first_name", "last_name"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


# Для навыка
class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name", "description"]


# Для задачи
class TaskReadSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)
    manager = UserReadSerializer(read_only=True)
    employee = UserReadSerializer(read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "skill",
            "manager",
            "employee",
            "status",
            "due_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["title", "description", "skill", "employee", "due_date"]

    def validate_employee(self, employee):
        if employee.role != User.Role.EMPLOYEE:
            raise serializers.ValidationError("Назначить задачу можно только сотруднику.")
        return employee
        
    def create(self, validated_data):
        request = self.context["request"]
        validated_data["manager"] = request.user
        return super().create(validated_data)


class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["title", "description", "status", "due_date"]


# Для прогресса
class ProgressReadSerializer(serializers.ModelSerializer):
    task = serializers.StringRelatedField()
    employee = UserReadSerializer(read_only=True)

    class Meta:
        model = Progress
        fields = ["id", "task", "employee", "percent", "note", "created_at"]
        read_only_fields = ["created_at"]


class ProgressCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Progress
        fields = ["task", "percent", "note"]

    def validate_percent(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Прогресс должен быть от 0 до 100.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError("Требуется авторизованный пользователь.")
        validated_data["employee"] = request.user
        return super().create(validated_data)


# Для комментария
class CommentReadSerializer(serializers.ModelSerializer):
    author = UserReadSerializer(read_only=True)
    task = serializers.StringRelatedField()

    class Meta:
        model = Comment
        fields = ["id", "task", "author", "text", "created_at"]
        read_only_fields = ["created_at"]


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ["task", "text"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError("Требуется авторизованный пользователь.")
        validated_data["author"] = request.user
        return super().create(validated_data)


class NotificationReadSerializer(serializers.ModelSerializer):
    author = UserReadSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "is_read",
            "created_at",
            "author",
            "recipient",
        ]
        read_only_fields = fields