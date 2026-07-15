const FIELD_LABELS = {
  username: "Логин",
  password: "Пароль",
  email: "Email",
  role: "Роль",
  title: "Название",
  description: "Описание",
  skill: "Навык",
  employee: "Сотрудник",
  due_date: "Срок",
  status: "Статус",
  task: "Задача",
  text: "Текст",
  percent: "Прогресс",
  note: "Комментарий",
  name: "Название",
  non_field_errors: "Ошибка",
};

const MESSAGE_TRANSLATIONS = {
  "No active account found with the given credentials": "Неверный логин или пароль.",
  "Authentication credentials were not provided.": "Требуется авторизация.",
  "Given token not valid for any token type": "Сессия истекла. Войдите снова.",
  "Token is invalid or expired": "Сессия истекла. Войдите снова.",
  "Not found.": "Запись не найдена.",
  "Not found": "Запись не найдена.",
  "You do not have permission to perform this action.": "Недостаточно прав для выполнения действия.",
};

const PARTIAL_TRANSLATIONS = [
  [/this field is required\.?/i, "Обязательное поле."],
  [/ensure this field has at least (\d+) characters?\.?/i, "Минимальная длина — $1 символов."],
  [/ensure this field has no more than (\d+) characters?\.?/i, "Максимальная длина — $1 символов."],
  [/enter a valid email address\.?/i, "Введите корректный email."],
  [/a user with that username already exists\.?/i, "Пользователь с таким логином уже существует."],
  [/invalid credentials?\.?/i, "Неверный логин или пароль."],
  [/not authenticated\.?/i, "Требуется авторизация."],
  [/permission denied\.?/i, "Недостаточно прав."],
  [/string should have at least (\d+) characters?\.?/i, "Минимальная длина — $1 символов."],
  [/string should have at most (\d+) characters?\.?/i, "Максимальная длина — $1 символов."],
  [/field required\.?/i, "Обязательное поле."],
  [/value is not a valid email address\.?/i, "Введите корректный email."],
  [/input should be a valid integer\.?/i, "Укажите целое число."],
  [/input should be greater than (\d+)\.?/i, "Значение должно быть больше $1."],
  [/input should be greater than or equal to (\d+)\.?/i, "Значение должно быть не меньше $1."],
  [/input should be less than or equal to (\d+)\.?/i, "Значение должно быть не больше $1."],
];

function translateMessage(message) {
  if (typeof message !== "string") {
    return "";
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return "";
  }

  if (MESSAGE_TRANSLATIONS[trimmed]) {
    return MESSAGE_TRANSLATIONS[trimmed];
  }

  for (const [pattern, replacement] of PARTIAL_TRANSLATIONS) {
    if (pattern.test(trimmed)) {
      return trimmed.replace(pattern, replacement);
    }
  }

  return trimmed;
}

function getFieldLabel(field) {
  return FIELD_LABELS[field] || field;
}

function formatFieldValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => translateMessage(String(item))).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([field, nestedValue]) => `${getFieldLabel(field)}: ${formatFieldValue(nestedValue)}`)
      .join(" ");
  }

  return translateMessage(String(value));
}

function formatFieldErrors(data) {
  return Object.entries(data)
    .filter(([field]) => field !== "errors")
    .map(([field, value]) => `${getFieldLabel(field)}: ${formatFieldValue(value)}`)
    .join(" ");
}

function formatPydanticErrors(errors) {
  return errors
    .map((entry) => {
      const field = entry.loc?.[entry.loc.length - 1];
      const label = getFieldLabel(String(field || "Ошибка"));
      return `${label}: ${translateMessage(entry.msg || "Некорректное значение.")}`;
    })
    .join(" ");
}

export default function getApiErrorMessage(error, fallback = "Не удалось выполнить запрос.") {
  const data = error?.response?.data;

  if (!data) {
    if (!error?.response) {
      return "Сервер недоступен. Попробуйте зайти позже.";
    }

    return fallback;
  }

  if (typeof data === "string") {
    return translateMessage(data) || fallback;
  }

  if (data.detail) {
    if (Array.isArray(data.detail)) {
      const translated = data.detail.map((item) => translateMessage(String(item))).filter(Boolean);
      return translated.join(" ") || fallback;
    }

    return translateMessage(String(data.detail)) || fallback;
  }

  if (Array.isArray(data.errors)) {
    return formatPydanticErrors(data.errors) || "Ошибка валидации. Проверьте введённые данные.";
  }

  if (data.errors && typeof data.errors === "object") {
    return formatFieldErrors(data.errors) || "Ошибка валидации. Проверьте введённые данные.";
  }

  const fieldErrors = formatFieldErrors(data);
  return fieldErrors || fallback;
}
