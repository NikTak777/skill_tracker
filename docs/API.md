# SkillTracker — документация API

REST API для управления задачами развития сотрудников.

**Базовый URL (локально):** `http://localhost:8000/api/`

**Формат данных:** JSON

**Аутентификация:** JWT (Bearer token), кроме эндпоинтов регистрации и получения токена.

---

## Общие сведения

### Заголовки

Для защищённых эндпоинтов:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Роли пользователей

| Роль | Значение | Описание |
|------|----------|----------|
| Руководитель | `manager` | Создаёт задачи, следит за прогрессом |
| Сотрудник | `employee` | Выполняет задачи, отмечает прогресс |

### Срок жизни токенов

| Токен | Время жизни |
|-------|-------------|
| `access` | 60 минут |
| `refresh` | 1 день |

---

## Коды ответов и ошибки

| Код | Когда возникает |
|-----|-----------------|
| `200 OK` | Успешное чтение или обновление |
| `201 Created` | Успешное создание ресурса |
| `204 No Content` | Успешное удаление |
| `400 Bad Request` | Ошибка валидации (Pydantic или DRF) |
| `401 Unauthorized` | Нет токена или токен недействителен |
| `403 Forbidden` | Нет прав на действие |
| `404 Not Found` | Ресурс не найден |

### 400 — ошибка валидации Pydantic

```json
{
  "errors": [
    {
      "type": "string_too_short",
      "loc": ["password"],
      "msg": "String should have at least 8 characters",
      "input": "123",
      "ctx": {"min_length": 8}
    }
  ]
}
```

### 400 — ошибка валидации DRF

```json
{
  "employee": ["Назначить задачу можно только сотруднику."]
}
```

### 401 — не авторизован

```json
{
  "detail": "Authentication credentials were not provided."
}
```

или

```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid"
}
```

### 403 — нет прав

```json
{
  "detail": "Доступно только руководителю."
}
```

### 404 — не найдено

```json
{
  "detail": "Not found."
}
```

---

## Auth

### Регистрация

Создаёт нового пользователя.

| | |
|---|---|
| **Метод** | `POST` |
| **URL** | `/api/auth/register/` |
| **Auth** | Не требуется |

**Body:**

```json
{
  "username": "anna_employee",
  "email": "anna@example.com",
  "password": "password123",
  "role": "employee",
  "first_name": "Anna",
  "last_name": "Petrova"
}
```

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `username` | string | да | 3–150 символов |
| `email` | string | нет | Валидный email |
| `password` | string | да | Минимум 8 символов |
| `role` | string | да | `manager` или `employee` |
| `first_name` | string | нет | Имя |
| `last_name` | string | нет | Фамилия |

**Ответ `201 Created`:**

```json
{
  "id": 2,
  "username": "anna_employee",
  "email": "anna@example.com",
  "role": "employee",
  "first_name": "Anna",
  "last_name": "Petrova"
}
```

---

### Получение JWT-токена (вход)

| | |
|---|---|
| **Метод** | `POST` |
| **URL** | `/api/auth/token/` |
| **Auth** | Не требуется |

**Body:**

```json
{
  "username": "anna_employee",
  "password": "password123"
}
```

**Ответ `200 OK`:**

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Обновление access-токена

| | |
|---|---|
| **Метод** | `POST` |
| **URL** | `/api/auth/token/refresh/` |
| **Auth** | Не требуется |

**Body:**

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Ответ `200 OK`:**

```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Текущий пользователь

| | |
|---|---|
| **Метод** | `GET` |
| **URL** | `/api/auth/me/` |
| **Auth** | Требуется |

**Ответ `200 OK`:**

```json
{
  "id": 1,
  "username": "ivan_manager",
  "email": "ivan@example.com",
  "role": "manager",
  "first_name": "Ivan",
  "last_name": "Sokolov"
}
```

---

### Список сотрудников

Возвращает пользователей с ролью `employee` для выбора при создании задачи.

| | |
|---|---|
| **Метод** | `GET` |
| **URL** | `/api/employees/` |
| **Auth** | Требуется |
| **Доступ** | Только `manager` |

**Ответ `200 OK`:**

```json
[
  {
    "id": 2,
    "username": "anna_employee",
    "email": "anna@example.com",
    "role": "employee",
    "first_name": "Anna",
    "last_name": "Petrova"
  }
]
```

---

## Tasks

Задачи развития, привязанные к навыку (`skill`), руководителю (`manager`) и сотруднику (`employee`).

**Статусы задачи:** `todo`, `in_progress`, `done`

### Список задач

| | |
|---|---|
| **Метод** | `GET` |
| **URL** | `/api/tasks/` |
| **Auth** | Требуется |

**Фильтрация по роли:**
- `manager` — задачи, которые он создал
- `employee` — задачи, назначенные ему

**Ответ `200 OK`:**

```json
[
  {
    "id": 1,
    "title": "Изучить Django REST Framework",
    "description": "Пройти основы ViewSet и serializers",
    "skill": {
      "id": 1,
      "name": "Python",
      "description": "Backend development"
    },
    "manager": {
      "id": 1,
      "username": "ivan_manager",
      "email": "ivan@example.com",
      "role": "manager",
      "first_name": "Ivan",
      "last_name": "Sokolov"
    },
    "employee": {
      "id": 2,
      "username": "anna_employee",
      "email": "anna@example.com",
      "role": "employee",
      "first_name": "Anna",
      "last_name": "Petrova"
    },
    "status": "in_progress",
    "due_date": "2026-07-15",
    "created_at": "2026-07-01T10:00:00Z",
    "updated_at": "2026-07-05T14:30:00Z"
  }
]
```

---

### Создание задачи

| | |
|---|---|
| **Метод** | `POST` |
| **URL** | `/api/tasks/` |
| **Auth** | Требуется |
| **Доступ** | Только `manager` |

**Body:**

```json
{
  "title": "Изучить Django REST Framework",
  "description": "Пройти основы ViewSet и serializers",
  "skill": 1,
  "employee": 2,
  "due_date": "2026-07-15"
}
```

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `title` | string | да | 1–200 символов |
| `description` | string | нет | Описание задачи |
| `skill` | integer | да | ID навыка |
| `employee` | integer | да | ID сотрудника (`role=employee`) |
| `due_date` | date | нет | Срок в формате `YYYY-MM-DD` |

Руководитель (`manager`) подставляется автоматически из токена.

**Ответ `201 Created`:** объект задачи (формат как в списке).

---

### Получение задачи

| | |
|---|---|
| **Метод** | `GET` |
| **URL** | `/api/tasks/{id}/` |
| **Auth** | Требуется |
| **Доступ** | Участник задачи (manager или employee) |

**Ответ `200 OK`:** объект задачи.

---

### Обновление задачи

| | |
|---|---|
| **Метод** | `PUT` / `PATCH` |
| **URL** | `/api/tasks/{id}/` |
| **Auth** | Требуется |
| **Доступ** | Участник задачи |

**Body (PATCH, все поля опциональны):**

```json
{
  "title": "Изучить DRF и JWT",
  "description": "Добавить авторизацию",
  "status": "done",
  "due_date": "2026-07-20"
}
```

| Поле | Тип | Значения |
|------|-----|----------|
| `status` | string | `todo`, `in_progress`, `done` |

**Ответ `200 OK`:** обновлённый объект задачи.

---

### Удаление задачи

| | |
|---|---|
| **Метод** | `DELETE` |
| **URL** | `/api/tasks/{id}/` |
| **Auth** | Требуется |
| **Доступ** | `manager`, создавший эту задачу |

**Ответ `204 No Content`**

---

## Progress

Записи прогресса по задаче (процент выполнения и заметка).

### Список записей прогресса

| | |
|---|---|
| **Метод** | `GET` |
| **URL** | `/api/progress/` |
| **Auth** | Требуется |

**Query-параметры:**

| Параметр | Описание |
|----------|----------|
| `task` | Фильтр по ID задачи, например `?task=1` |

**Фильтрация по роли:**
- `manager` — прогресс по своим задачам
- `employee` — свой прогресс

**Ответ `200 OK`:**

```json
[
  {
    "id": 1,
    "task": "Изучить Django REST Framework",
    "employee": {
      "id": 2,
      "username": "anna_employee",
      "email": "anna@example.com",
      "role": "employee",
      "first_name": "Anna",
      "last_name": "Petrova"
    },
    "percent": 40,
    "note": "Прочитал документацию DRF",
    "created_at": "2026-07-03T12:00:00Z"
  }
]
```

---

### Создание записи прогресса

| | |
|---|---|
| **Метод** | `POST` |
| **URL** | `/api/progress/` |
| **Auth** | Требуется |
| **Доступ** | Только `employee` |

**Body:**

```json
{
  "task": 1,
  "percent": 40,
  "note": "Прочитал документацию DRF"
}
```

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `task` | integer | да | ID задачи |
| `percent` | integer | да | 0–100 |
| `note` | string | нет | Заметка о прогрессе |

Сотрудник (`employee`) подставляется из токена. Прогресс можно добавить только к **своей** задаче.

**Ответ `201 Created`:** объект записи прогресса.

---

### Получение записи прогресса

| | |
|---|---|
| **Метод** | `GET` |
| **URL** | `/api/progress/{id}/` |
| **Auth** | Требуется |

**Ответ `200 OK`:** объект записи прогресса.

---

## Comments

Комментарии к задачам (обратная связь между руководителем и сотрудником).

### Список комментариев

| | |
|---|---|
| **Метод** | `GET` |
| **URL** | `/api/comments/` |
| **Auth** | Требуется |

**Query-параметры:**

| Параметр | Описание |
|----------|----------|
| `task` | Фильтр по ID задачи, например `?task=1` |

**Фильтрация по роли:**
- `manager` — комментарии к своим задачам
- `employee` — комментарии к назначенным задачам

**Ответ `200 OK`:**

```json
[
  {
    "id": 1,
    "task": "Изучить Django REST Framework",
    "author": {
      "id": 1,
      "username": "ivan_manager",
      "email": "ivan@example.com",
      "role": "manager",
      "first_name": "Ivan",
      "last_name": "Sokolov"
    },
    "text": "Хороший старт, продолжай",
    "created_at": "2026-07-04T09:00:00Z"
  }
]
```

---

### Создание комментария

| | |
|---|---|
| **Метод** | `POST` |
| **URL** | `/api/comments/` |
| **Auth** | Требуется |
| **Доступ** | Участник задачи (manager или employee) |

**Body:**

```json
{
  "task": 1,
  "text": "Хороший старт, продолжай"
}
```

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `task` | integer | да | ID задачи |
| `text` | string | да | Минимум 1 символ |

Автор (`author`) подставляется из токена.

**Ответ `201 Created`:** объект комментария.

---

### Получение комментария

| | |
|---|---|
| **Метод** | `GET` |
| **URL** | `/api/comments/{id}/` |
| **Auth** | Требуется |

**Ответ `200 OK`:** объект комментария.

---

## Skills

Справочник навыков (компетенций). Используется при создании задач.

### Список навыков

| | |
|---|---|
| **Метод** | `GET` |
| **URL** | `/api/skills/` |
| **Auth** | Требуется |

**Ответ `200 OK`:**

```json
[
  {
    "id": 1,
    "name": "Python",
    "description": "Backend development"
  },
  {
    "id": 2,
    "name": "React",
    "description": "Frontend development"
  }
]
```

---

### Получение навыка

| | |
|---|---|
| **Метод** | `GET` |
| **URL** | `/api/skills/{id}/` |
| **Auth** | Требуется |

**Ответ `200 OK`:**

```json
{
  "id": 1,
  "name": "Python",
  "description": "Backend development"
}
```

> Навыки создаются через Django Admin (`/admin/`) или SQL-скрипт инициализации БД.

---

## Типовой сценарий использования

### 1. Руководитель создаёт задачу

```http
POST /api/auth/token/
POST /api/skills/          → получить id навыка
GET  /api/employees/       → получить id сотрудника
POST /api/tasks/           → создать задачу
```

### 2. Сотрудник отмечает прогресс

```http
POST /api/auth/token/
GET  /api/tasks/           → список своих задач
POST /api/progress/        → добавить прогресс
POST /api/comments/        → оставить комментарий
PATCH /api/tasks/{id}/     → обновить статус на done
```

### 3. Руководитель проверяет результат

```http
GET /api/tasks/
GET /api/progress/?task=1
GET /api/comments/?task=1
POST /api/comments/        → обратная связь
```

---

## Права доступа (сводка)

| Эндпоинт | manager | employee |
|----------|---------|----------|
| `POST /api/auth/register/` | ✅ | ✅ |
| `POST /api/auth/token/` | ✅ | ✅ |
| `GET /api/auth/me/` | ✅ | ✅ |
| `GET /api/employees/` | ✅ | ❌ |
| `GET /api/tasks/` | ✅ (свои) | ✅ (назначенные) |
| `POST /api/tasks/` | ✅ | ❌ |
| `PATCH /api/tasks/{id}/` | ✅ (участник) | ✅ (участник) |
| `DELETE /api/tasks/{id}/` | ✅ (создатель) | ❌ |
| `GET /api/progress/` | ✅ | ✅ |
| `POST /api/progress/` | ❌ | ✅ |
| `GET /api/comments/` | ✅ | ✅ |
| `POST /api/comments/` | ✅ (участник) | ✅ (участник) |
| `GET /api/skills/` | ✅ | ✅ |
