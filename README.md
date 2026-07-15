# SkillTracker v0.1.0

Веб-приложение для автоматизации развития профессиональных навыков сотрудников.

Руководитель ставит персональные задачи развития, следит за прогрессом и оставляет обратную связь.  
Сотрудник видит назначенные задачи, отмечает прогресс и пишет комментарии.

---

## Стек

| Часть | Технологии |
|-------|------------|
| Backend | Django, Django REST Framework, SimpleJWT, Pydantic, Poetry |
| Frontend | React, Vite, React Router, Axios |
| БД | PostgreSQL 16 |
| Инфра | Docker Compose |

---

## Запуск проекта

Проект рассчитан на запуск через Docker Compose: backend, frontend и PostgreSQL поднимаются вместе.

Зависимости backend устанавливаются **внутри контейнера** через Poetry (`pyproject.toml` / `poetry.lock`). Отдельно ставить Poetry и Python на машину не нужно.

### Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (или Docker Engine + Compose)
- Git

### Последовательность шагов

```bash
git clone https://github.com/NikTak777/skill_tracker.git
cd skill_tracker
docker compose up --build
```

После старта:

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |

Миграции выполняются автоматически при старте backend-контейнера.

Остановка:

```bash
docker compose down
```

Сброс данных БД (удалит volume PostgreSQL):

```bash
docker compose down -v
```

---

## Демо-данные

После первого `docker compose up` и успешного `migrate` можно загрузить демо-набор из `backend/scripts/init_demo.sql`.

### Windows (PowerShell) — безопасный способ по кодировке

```powershell
docker compose cp backend/scripts/init_demo.sql db:/tmp/init_demo.sql
docker compose exec db psql -U postgres -d skill_tracker -f /tmp/init_demo.sql
```

> Не используйте `Get-Content ... | docker compose exec ...` без `-Encoding UTF8`: на Windows кириллица в текстах задач может превратиться в `???`.

### Linux / macOS

```bash
docker compose exec -T db psql -U postgres -d skill_tracker < backend/scripts/init_demo.sql
```

### Что загружается

| Сущность | Количество |
|----------|------------|
| Admin (суперпользователь) | 1 |
| Руководители | 5 |
| Сотрудники | 50 |
| Навыки | 18 |
| Задачи | ~300+ |
| Прогресс и комментарии | да |

---

## Учётные записи демо

| Логин | Пароль | Роль |
|-------|--------|------|
| `admin` | `admin123` | суперпользователь / Django Admin |
| `manager_ivan` | `password123` | руководитель |
| `manager_olga` | `password123` | руководитель |
| `manager_dmitry` | `password123` | руководитель |
| `manager_elena` | `password123` | руководитель |
| `manager_sergey` | `password123` | руководитель |
| `employee_01` … `employee_50` | `password123` | сотрудники |

---

## Роли

| Роль | Возможности |
|------|-------------|
| **manager** | Создавать сотрудников и навыки, ставить задачи, смотреть прогресс команды, комментировать |
| **employee** | Видеть свои задачи, менять статус, добавлять прогресс (%), писать комментарии |

---

## Структура репозитория

```text
skill_tracker/
├── backend/                 # Django + DRF
│   ├── app/                 # модели, API, права, фильтры, тесты
│   │   └── tests.py         # DRF-тесты API
│   ├── project/             # settings, urls
│   ├── scripts/
│   │   ├── init_demo.sql    # демо-данные
│   │   └── generate_init_demo.py
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── poetry.lock
├── frontend/                # React + Vite
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docs/
│   └── API.md               # документация API
├── docker-compose.yml
└── README.md
```

---

## Документация API

Полное описание эндпоинтов, примеров запросов/ответов и прав доступа:

- [docs/API.md](docs/API.md)

Основные разделы API:

- Auth — регистрация, JWT, текущий пользователь
- Employees — список и создание сотрудников (manager)
- Tasks — CRUD, фильтр `?status=`, пагинация для `done`
- Progress / Comments — прогресс и обратная связь
- Skills — список и создание навыков

Базовый URL API: `http://localhost:8000/api/`

---

## Тесты API (backend)

Автоматические DRF-тесты проверяют ключевые сценарии API: auth, tasks, progress, comments, skills и права доступа (403).  
Контейнеры должны быть подняты (`docker compose up -d` или уже работающий стек).

```bash
docker compose exec backend python manage.py test app
```

Успешный прогон выглядит так:

```text
Ran ... tests in ...s
OK
```

---

## Полезные команды

```bash
# Логи всех сервисов
docker compose logs -f

# Только backend
docker compose logs -f backend

# Migrate вручную в контейнере
docker compose exec backend python manage.py migrate

# Прогон API-тестов
docker compose exec backend python manage.py test app

# Django shell
docker compose exec backend python manage.py shell
```
