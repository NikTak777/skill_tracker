from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Task, User
from .permissions import IsManager, IsTaskManager, IsTaskParticipant
from .pydantic_schemas import (
    TaskCreateSchema,
    TaskUpdateSchema,
    UserRegisterSchema,
    validate_request,
)
from .serializers import (
    TaskCreateSerializer,
    TaskReadSerializer,
    TaskUpdateSerializer,
    UserReadSerializer,
    UserWriteSerializer,
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