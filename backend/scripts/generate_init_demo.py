from __future__ import annotations

import base64
import hashlib
import random
from datetime import date, timedelta
from pathlib import Path


def make_password(password: str, *, salt: str, iterations: int = 1_000_000) -> str:
    """PBKDF2-хеш в формате Django (pbkdf2_sha256)."""
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return f"pbkdf2_sha256${iterations}${salt}${base64.b64encode(digest).decode('ascii')}"

OUTPUT = Path(__file__).resolve().parent / "init_demo.sql"
SEED = 20260713
random.seed(SEED)

ADMIN_PASSWORD = "admin123"
USER_PASSWORD = "password123"

SKILLS = [
    ("Python", "Backend-разработка на Python для внутренних сервисов"),
    ("Django / DRF", "REST API и серверная логика на Django"),
    ("PostgreSQL", "Проектирование и оптимизация SQL-запросов"),
    ("React", "Разработка пользовательских интерфейсов"),
    ("Docker", "Контейнеризация и локальная разработка"),
    ("Kubernetes", "Оркестрация и деплой в кластер"),
    ("Linux", "Администрирование серверов и bash-скрипты"),
    ("Git / GitLab CI", "Версионирование и CI/CD пайплайны"),
    ("REST / микросервисы", "Проектирование API и интеграций"),
    ("Тестирование", "Unit, integration и регрессионное тестирование"),
    ("Agile / Scrum", "Работа в спринтах и оценка задач"),
    ("Сетевая инфраструктура", "TCP/IP, VPN, маршрутизация, DNS"),
    ("Информационная безопасность", "Базовые практики ИБ и аудит доступа"),
    ("Анализ требований", "Сбор и формализация требований от заказчика"),
    ("Техническая документация", "Confluence, API docs, runbook"),
    ("1С / ERP", "Интеграции с учётными системами"),
    ("Observability", "Логирование, метрики, алертинг (Prometheus/Grafana)"),
    ("Коммуникация с заказчиком", "Работа с внутренними и внешними стейкхолдерами"),
]

MANAGERS = [
    ("manager_ivan", "Ivan", "Petrov", "ivan.petrov@rostelecom.demo"),
    ("manager_olga", "Olga", "Sokolova", "olga.sokolova@rostelecom.demo"),
    ("manager_dmitry", "Dmitry", "Volkov", "dmitry.volkov@rostelecom.demo"),
    ("manager_elena", "Elena", "Morozova", "elena.morozova@rostelecom.demo"),
    ("manager_sergey", "Sergey", "Kuznetsov", "sergey.kuznetsov@rostelecom.demo"),
]

EMPLOYEE_FIRST_NAMES = [
    "Anna", "Maria", "Alexey", "Nikita", "Pavel", "Irina", "Oleg", "Tatyana",
    "Roman", "Victoria", "Artem", "Daria", "Maxim", "Yulia", "Konstantin",
    "Polina", "Andrey", "Svetlana", "Denis", "Ekaterina", "Vladimir", "Alina",
    "Igor", "Natalia", "Anton", "Kristina", "Mikhail", "Veronika", "Timur",
    "Olga", "Ruslan", "Marina", "Georgy", "Lidia", "Stanislav", "Valeria",
    "Boris", "Galina", "Fedor", "Zoya", "Yaroslav", "Inna", "Grigoriy",
    "Lyudmila", "Evgeniy", "Tamara", "Vadim", "Raisa", "Leonid", "Nina",
]

EMPLOYEE_LAST_NAMES = [
    "Smirnov", "Ivanov", "Kuznetsov", "Popov", "Sokolov", "Lebedev", "Kozlov",
    "Novikov", "Morozov", "Volkov", "Alekseev", "Pavlov", "Semenov", "Egorov",
    "Stepanov", "Nikolaev", "Orlov", "Andreev", "Makarov", "Nikitin", "Zakharov",
    "Soloviev", "Borisov", "Yakovlev", "Grigoriev", "Romanov", "Vorobyov",
    "Sergeev", "Karpov", "Belov", "Komarov", "Medvedev", "Antonov", "Tarasov",
    "Gusev", "Kiselev", "Ilyin", "Maksimov", "Polyakov", "Rogov", "Markov",
    "Fedorov", "Vasiliev", "Ponomarev", "Golubev", "Vinogradov", "Bogdanov",
    "Vorontsov", "Frolov", "Mikhailov",
]

TASK_TEMPLATES = [
    ("Настроить CI/CD для сервиса {service}", "Развернуть пайплайн сборки и деплоя в GitLab CI для {service}."),
    ("Пройти модуль по {skill}", "Изучить материалы внутреннего портала обучения по теме {skill}."),
    ("Code review: {service}", "Провести ревью MR по {service} и оформить замечания в GitLab."),
    ("Написать unit-тесты для {service}", "Покрыть ключевые сценарии модульными тестами."),
    ("Подготовить документацию: {service}", "Обновить Confluence-страницу с описанием API и сценариев."),
    ("Исправить инцидент в {service}", "Разобрать тикет из очереди поддержки и устранить root cause."),
    ("Оптимизировать SQL-запросы {service}", "Проанализировать slow query log и предложить индексы."),
    ("Интеграция {service} с биллингом", "Реализовать обмен данными с смежной системой."),
    ("Пилот Kubernetes для {service}", "Подготовить Helm chart и задеплоить в тестовый namespace."),
    ("Аудит доступа к {service}", "Проверить роли и права в соответствии с политикой ИБ."),
]

SERVICES = [
    "CRM Portal", "Billing API", "Subscriber Gateway", "OSS Monitor",
    "Network Inventory", "SkillTracker", "Document Flow", "Auth Service",
    "Notification Hub", "Report Engine",
]

STATUSES = ["todo", "in_progress", "done"]
STATUS_WEIGHTS = [0.25, 0.35, 0.40]

COMMENT_TEMPLATES_MANAGER = [
    "Хороший прогресс, продолжай в том же темпе.",
    "Обрати внимание на сроки — нужен промежуточный статус к пятнице.",
    "После завершения подготовь краткий отчёт для команды.",
    "Есть замечания по качеству — давай обсудим на 1:1.",
    "Отлично, можно переходить к следующему этапу.",
]

COMMENT_TEMPLATES_EMPLOYEE = [
    "Начал работу, уточняю требования у аналитика.",
    "Столкнулся с блокером по доступам, завёл заявку в Service Desk.",
    "Основная часть готова, осталось покрыть тестами.",
    "Задача выполнена, прошу проверить результат.",
    "Нужна консультация по архитектурному решению.",
]

PROGRESS_NOTES = [
    "Изучил документацию и настроил окружение.",
    "Реализовал основной функционал.",
    "Провёл тестирование на dev-стенде.",
    "Исправил замечания после ревью.",
    "Подготовил инструкцию для смежной команды.",
]


def sql_str(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> None:
    admin_hash = make_password(ADMIN_PASSWORD, salt="adminsalt12")
    user_hash = make_password(USER_PASSWORD, salt="usersalt1234")

    lines: list[str] = [
        "-- SkillTracker: демо-данные для PostgreSQL",
        "-- Запускать ПОСЛЕ: python manage.py migrate",
        "--",
        "-- Учётные записи:",
        "--   admin / admin123          (Django Admin, суперпользователь)",
        "--   manager_* / password123   (5 руководителей)",
        "--   employee_01..50 / password123",
        "--",
        f"-- Сгенерировано: generate_init_demo.py (seed={SEED})",
        "",
        "BEGIN;",
        "",
        "TRUNCATE TABLE app_comment, app_progress, app_task, app_skill RESTART IDENTITY CASCADE;",
        "DELETE FROM app_user WHERE username LIKE 'manager_%' OR username LIKE 'employee_%' OR username = 'admin';",
        "",
        "-- Навыки",
        "INSERT INTO app_skill (id, name, description) VALUES",
    ]

    skill_rows = []
    for idx, (name, desc) in enumerate(SKILLS, start=1):
        skill_rows.append(f"({idx}, {sql_str(name)}, {sql_str(desc)})")
    lines.append(",\n".join(skill_rows) + ";")
    lines.append("")

    lines.append("-- Пользователи")
    user_inserts = []

    user_inserts.append(
        f"(1, {sql_str(admin_hash)}, NULL, TRUE, 'admin', 'System', 'Admin', "
        f"'admin@rostelecom.demo', TRUE, TRUE, NOW(), 'manager')"
    )

    manager_ids = list(range(2, 2 + len(MANAGERS)))
    for user_id, (username, first, last, email) in zip(manager_ids, MANAGERS):
        user_inserts.append(
            f"({user_id}, {sql_str(user_hash)}, NULL, FALSE, {sql_str(username)}, "
            f"{sql_str(first)}, {sql_str(last)}, {sql_str(email)}, FALSE, TRUE, NOW(), 'manager')"
        )

    employee_ids = list(range(7, 57))
    for idx, user_id in enumerate(employee_ids):
        first = EMPLOYEE_FIRST_NAMES[idx]
        last = EMPLOYEE_LAST_NAMES[idx]
        username = f"employee_{idx + 1:02d}"
        email = f"{username}@rostelecom.demo"
        user_inserts.append(
            f"({user_id}, {sql_str(user_hash)}, NULL, FALSE, {sql_str(username)}, "
            f"{sql_str(first)}, {sql_str(last)}, {sql_str(email)}, FALSE, TRUE, NOW(), 'employee')"
        )

    lines.append(
        "INSERT INTO app_user (id, password, last_login, is_superuser, username, "
        "first_name, last_name, email, is_staff, is_active, date_joined, role) VALUES"
    )
    lines.append(",\n".join(user_inserts) + ";")
    lines.append("")

    task_id = 0
    progress_id = 0
    comment_id = 0
    task_rows: list[str] = []
    progress_rows: list[str] = []
    comment_rows: list[str] = []

    base_date = date(2026, 6, 1)

    for emp_idx, employee_id in enumerate(employee_ids):
        task_count = random.randint(3, 9)
        for _ in range(task_count):
            task_id += 1
            manager_id = random.choice(manager_ids)
            skill_id = random.randint(1, len(SKILLS))
            skill_name = SKILLS[skill_id - 1][0]
            service = random.choice(SERVICES)
            template_title, template_desc = random.choice(TASK_TEMPLATES)
            title = template_title.format(service=service, skill=skill_name)[:200]
            description = template_desc.format(service=service, skill=skill_name)
            status = random.choices(STATUSES, weights=STATUS_WEIGHTS, k=1)[0]
            due_offset = random.randint(14, 120)
            due_date = base_date + timedelta(days=due_offset + emp_idx)
            created_offset = random.randint(0, 29)
            created_at = f"2026-06-{created_offset + 1:02d} 10:00:00+00"
            updated_day = min(created_offset + 5, 28)
            updated_at = f"2026-07-{updated_day:02d} 14:00:00+00"

            task_rows.append(
                f"({task_id}, {sql_str(title)}, {sql_str(description)}, {sql_str(status)}, "
                f"{sql_str(str(due_date))}, {sql_str(created_at)}, {sql_str(updated_at)}, "
                f"{employee_id}, {manager_id}, {skill_id})"
            )

            if status in ("in_progress", "done"):
                progress_id += 1
                if status == "done":
                    percent = random.randint(85, 100)
                else:
                    percent = random.randint(15, 75)
                note = random.choice(PROGRESS_NOTES)
                progress_rows.append(
                    f"({progress_id}, {percent}, {sql_str(note)}, "
                    f"{sql_str(created_at)}, {employee_id}, {task_id})"
                )

            if random.random() < 0.55:
                comment_id += 1
                author_id = manager_id if random.random() < 0.5 else employee_id
                pool = (
                    COMMENT_TEMPLATES_MANAGER
                    if author_id in manager_ids
                    else COMMENT_TEMPLATES_EMPLOYEE
                )
                comment_rows.append(
                    f"({comment_id}, {sql_str(random.choice(pool))}, "
                    f"{sql_str(updated_at)}, {author_id}, {task_id})"
                )

    lines.append(f"-- Задачи ({task_id} шт.)")
    lines.append(
        "INSERT INTO app_task (id, title, description, status, due_date, created_at, updated_at, "
        "employee_id, manager_id, skill_id) VALUES"
    )
    lines.append(",\n".join(task_rows) + ";")
    lines.append("")

    if progress_rows:
        lines.append(f"-- Прогресс ({len(progress_rows)} записей)")
        lines.append(
            "INSERT INTO app_progress (id, percent, note, created_at, employee_id, task_id) VALUES"
        )
        lines.append(",\n".join(progress_rows) + ";")
        lines.append("")

    if comment_rows:
        lines.append(f"-- Комментарии ({len(comment_rows)} шт.)")
        lines.append(
            "INSERT INTO app_comment (id, text, created_at, author_id, task_id) VALUES"
        )
        lines.append(",\n".join(comment_rows) + ";")
        lines.append("")

    lines.extend([
        "SELECT setval(pg_get_serial_sequence('app_user', 'id'), COALESCE((SELECT MAX(id) FROM app_user), 1));",
        "SELECT setval(pg_get_serial_sequence('app_skill', 'id'), COALESCE((SELECT MAX(id) FROM app_skill), 1));",
        "SELECT setval(pg_get_serial_sequence('app_task', 'id'), COALESCE((SELECT MAX(id) FROM app_task), 1));",
        "SELECT setval(pg_get_serial_sequence('app_progress', 'id'), COALESCE((SELECT MAX(id) FROM app_progress), 1));",
        "SELECT setval(pg_get_serial_sequence('app_comment', 'id'), COALESCE((SELECT MAX(id) FROM app_comment), 1));",
        "",
        "COMMIT;",
        "",
    ])

    OUTPUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Written: {OUTPUT}")
    print(f"Users: 1 admin + {len(MANAGERS)} managers + {len(employee_ids)} employees")
    print(f"Skills: {len(SKILLS)}")
    print(f"Tasks: {task_id}")
    print(f"Progress entries: {len(progress_rows)}")
    print(f"Comments: {len(comment_rows)}")


if __name__ == "__main__":
    main()
