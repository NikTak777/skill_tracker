from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import User


class IsManager(BasePermission):
    """Только пользователь с ролью manager."""

    message = "Доступно только руководителю."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.MANAGER
        )


class IsEmployee(BasePermission):
    """Только пользователь с ролью employee."""

    message = "Доступно только сотруднику."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.EMPLOYEE
        )


class IsTaskManager(BasePermission):
    """Пользователь является manager этой задачи."""

    message = "Вы не являетесь руководителем этой задачи."

    def has_object_permission(self, request, view, obj):
        return obj.manager == request.user


class IsTaskParticipant(BasePermission):
    """Пользователь является manager или employee этой задачи."""

    message = "У вас нет доступа к этой задаче."

    def has_object_permission(self, request, view, obj):
        user = request.user
        return obj.manager == user or obj.employee == user


class IsTaskManagerOrReadOnly(BasePermission):
    """Чтение - участник задачи; запись - только manager задачи."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return obj.manager == request.user or obj.employee == request.user
        return obj.manager == request.user