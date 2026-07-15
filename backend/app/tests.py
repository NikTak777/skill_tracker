from django.test import TestCase

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Comment, Progress, Skill, Task, User


class APIBaseTestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.manager = User.objects.create_user(
            username="manager_test",
            password="password123",
            role=User.Role.MANAGER,
            email="manager@test.local",
        )
        cls.other_manager = User.objects.create_user(
            username="manager_other",
            password="password123",
            role=User.Role.MANAGER,
        )
        cls.employee = User.objects.create_user(
            username="employee_test",
            password="password123",
            role=User.Role.EMPLOYEE,
            email="employee@test.local",
        )
        cls.other_employee = User.objects.create_user(
            username="employee_other",
            password="password123",
            role=User.Role.EMPLOYEE,
        )
        cls.skill = Skill.objects.create(
            name="Python",
            description="Backend",
        )
        cls.task = Task.objects.create(
            title="Изучить DRF",
            description="Тесты API",
            skill=cls.skill,
            manager=cls.manager,
            employee=cls.employee,
            status=Task.Status.TODO,
        )

    def auth(self, user):
        token = RefreshToken.for_user(user).access_token
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def clear_auth(self):
        self.client.credentials()


class AuthAPITests(APIBaseTestCase):
    def test_register(self):
        self.clear_auth()
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "new_user",
                "password": "password123",
                "role": "employee",
                "email": "new@example.com",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["username"], "new_user")
        self.assertEqual(response.data["role"], "employee")
        self.assertTrue(User.objects.filter(username="new_user").exists())

    def test_token(self):
        self.clear_auth()
        response = self.client.post(
            "/api/auth/token/",
            {"username": "employee_test", "password": "password123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_me(self):
        self.auth(self.employee)
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "employee_test")
        self.assertEqual(response.data["role"], "employee")

    def test_me_unauthorized(self):
        self.clear_auth()
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TaskAPITests(APIBaseTestCase):
    def test_create_task_as_manager(self):
        self.auth(self.manager)
        response = self.client.post(
            "/api/tasks/",
            {
                "title": "Новая задача",
                "description": "Описание",
                "skill": self.skill.id,
                "employee": self.employee.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Новая задача")
        self.assertTrue(Task.objects.filter(title="Новая задача", manager=self.manager).exists())

    def test_create_task_as_employee_forbidden(self):
        self.auth(self.employee)
        response = self.client.post(
            "/api/tasks/",
            {
                "title": "Чужая попытка",
                "skill": self.skill.id,
                "employee": self.employee.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_tasks_manager_sees_own(self):
        self.auth(self.manager)
        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data if isinstance(response.data, list) else response.data.get("results", [])
        ids = [item["id"] for item in data]
        self.assertIn(self.task.id, ids)

    def test_list_tasks_employee_sees_assigned(self):
        self.auth(self.employee)
        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data if isinstance(response.data, list) else response.data.get("results", [])
        ids = [item["id"] for item in data]
        self.assertIn(self.task.id, ids)

    def test_patch_task_as_employee(self):
        self.auth(self.employee)
        response = self.client.patch(
            f"/api/tasks/{self.task.id}/",
            {"status": "in_progress"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "in_progress")

    def test_delete_task_as_manager(self):
        task = Task.objects.create(
            title="Удалить меня",
            skill=self.skill,
            manager=self.manager,
            employee=self.employee,
        )
        self.auth(self.manager)
        response = self.client.delete(f"/api/tasks/{task.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task.id).exists())

    def test_delete_task_as_employee_forbidden(self):
        self.auth(self.employee)
        response = self.client.delete(f"/api/tasks/{self.task.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_other_employee_cannot_patch_foreign_task(self):
        self.auth(self.other_employee)
        response = self.client.patch(
            f"/api/tasks/{self.task.id}/",
            {"status": "done"},
            format="json",
        )
        self.assertIn(
            response.status_code,
            (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND),
        )


class ProgressAPITests(APIBaseTestCase):
    def test_create_progress_as_employee(self):
        self.auth(self.employee)
        response = self.client.post(
            "/api/progress/",
            {"task": self.task.id, "percent": 40, "note": "Начал"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["percent"], 40)

    def test_create_progress_as_manager_forbidden(self):
        self.auth(self.manager)
        response = self.client.post(
            "/api/progress/",
            {"task": self.task.id, "percent": 10, "note": "Нет"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_progress_for_foreign_task_forbidden(self):
        self.auth(self.other_employee)
        response = self.client.post(
            "/api/progress/",
            {"task": self.task.id, "percent": 10, "note": "Чужое"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_progress_filter_by_task(self):
        Progress.objects.create(
            task=self.task,
            employee=self.employee,
            percent=25,
            note="Первый шаг",
        )
        other_task = Task.objects.create(
            title="Другая",
            skill=self.skill,
            manager=self.manager,
            employee=self.employee,
        )
        Progress.objects.create(
            task=other_task,
            employee=self.employee,
            percent=99,
            note="Не должна попасть в фильтр",
        )

        self.auth(self.employee)
        response = self.client.get(f"/api/progress/?task={self.task.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["percent"], 25)


class CommentAPITests(APIBaseTestCase):
    def test_create_comment(self):
        self.auth(self.manager)
        response = self.client.post(
            "/api/comments/",
            {"task": self.task.id, "text": "Хороший старт"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["text"], "Хороший старт")

    def test_list_comments(self):
        Comment.objects.create(
            task=self.task,
            author=self.manager,
            text="Комментарий",
        )
        self.auth(self.employee)
        response = self.client.get(f"/api/comments/?task={self.task.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)


class SkillAPITests(APIBaseTestCase):
    def test_list_skills_with_jwt(self):
        self.auth(self.employee)
        response = self.client.get("/api/skills/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item["name"] for item in response.data]
        self.assertIn("Python", names)

    def test_list_skills_without_jwt(self):
        self.clear_auth()
        response = self.client.get("/api/skills/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)