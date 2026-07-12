from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied

from .models import Task, User, Progress, Comment, Skill
from .permissions import IsManager, IsTaskManager, IsTaskParticipant, IsEmployee
from .pydantic_schemas import (
    TaskCreateSchema,
    TaskUpdateSchema,
    UserRegisterSchema,
    validate_request,
    ProgressCreateSchema,
    CommentCreateSchema,
    SkillCreateSchema,
)
from .serializers import (
    TaskCreateSerializer,
    TaskReadSerializer,
    TaskUpdateSerializer,
    UserReadSerializer,
    UserWriteSerializer,
    ProgressCreateSerializer,
    ProgressReadSerializer,
    CommentCreateSerializer,
    CommentReadSerializer,
    SkillSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = UserWriteSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        error_response = validate_request(UserRegisterSchema, request.data)
        if error_response:
            return error_response

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserReadSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserReadSerializer(request.user).data)


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsManager()]
        if self.action == "destroy":
            return [permissions.IsAuthenticated(), IsManager(), IsTaskManager()]
        if self.action in ("update", "partial_update", "retrieve"):
            return [permissions.IsAuthenticated(), IsTaskParticipant()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.MANAGER:
            return Task.objects.filter(manager=user).select_related(
                "skill", "manager", "employee"
            )
        return Task.objects.filter(employee=user).select_related(
            "skill", "manager", "employee"
        )

    def get_serializer_class(self):
        if self.action == "create":
            return TaskCreateSerializer
        if self.action in ("update", "partial_update"):
            return TaskUpdateSerializer
        return TaskReadSerializer

    def create(self, request, *args, **kwargs):
        error_response = validate_request(TaskCreateSchema, request.data)
        if error_response:
            return error_response
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        error_response = validate_request(TaskUpdateSchema, request.data)
        if error_response:
            return error_response
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        error_response = validate_request(TaskUpdateSchema, request.data)
        if error_response:
            return error_response
        return super().partial_update(request, *args, **kwargs)


class ProgressViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated(), IsEmployee()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.MANAGER:
            qs = Progress.objects.filter(task__manager=user)
        else:
            qs = Progress.objects.filter(employee=user)

        qs = qs.select_related("task", "employee")

        task_id = self.request.query_params.get("task")
        if task_id is not None:
            qs = qs.filter(task_id=task_id)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return ProgressCreateSerializer
        return ProgressReadSerializer

    def create(self, request, *args, **kwargs):
        error_response = validate_request(ProgressCreateSchema, request.data)
        if error_response:
            return error_response

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task = serializer.validated_data["task"]
        if task.employee != request.user:
            raise PermissionDenied("Прогресс можно добавить только к своей задаче.")

        serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(
            ProgressReadSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class CommentViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.MANAGER:
            qs = Comment.objects.filter(task__manager=user)
        else:
            qs = Comment.objects.filter(task__employee=user)

        qs = qs.select_related("task", "author")

        task_id = self.request.query_params.get("task")
        if task_id is not None:
            qs = qs.filter(task_id=task_id)
        return qs

    def get_serializer_class(self):
        if self.action == "create":
            return CommentCreateSerializer
        return CommentReadSerializer

    def create(self, request, *args, **kwargs):
        error_response = validate_request(CommentCreateSchema, request.data)
        if error_response:
            return error_response

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task = serializer.validated_data["task"]
        user = request.user
        if task.manager != user and task.employee != user:
            raise PermissionDenied("Комментарий можно оставить только к доступной задаче.")

        serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(
            CommentReadSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )


class SkillViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Skill.objects.all().order_by("name")
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]


class EmployeeListView(generics.ListAPIView):
    serializer_class = UserReadSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]

    def get_queryset(self):
        return User.objects.filter(role=User.Role.EMPLOYEE).order_by("username")
