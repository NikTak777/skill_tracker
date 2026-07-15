import django_filters

from .models import Task


class TaskFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Task.Status.choices)

    class Meta:
        model = Task
        fields = ["status"]