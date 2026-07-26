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

export const SERVER_ERROR_MESSAGE = "Ошибка сервера. Попробуйте позже.";
export const NETWORK_ERROR_MESSAGE = "Сервер недоступен. Попробуйте зайти позже.";
export const VALIDATION_ERROR_MESSAGE = "Ошибка валидации. Проверьте введённые данные.";

const SERVER_DUMP_PATTERN = /traceback|exception type|internal server error|<!doctype|<html|django\.|integrityerror|programming error|syntaxerror|unexpected token|\sat line \d+/i;

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

function looksLikeServerDump(message) {
  if (typeof message !== "string") {
    return false;
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.length > 240) {
    return true;
  }

  return SERVER_DUMP_PATTERN.test(trimmed);
}

function isUserFacingMessage(message) {
  if (!message) {
    return false;
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return false;
  }

  if (MESSAGE_TRANSLATIONS[trimmed]) {
    return true;
  }

  if (/[а-яё]/i.test(trimmed)) {
    return true;
  }

  return PARTIAL_TRANSLATIONS.some(([pattern]) => pattern.test(trimmed));
}

function sanitizeMessage(message, fallback, { validation = false } = {}) {
  if (!message) {
    if (validation) {
      return VALIDATION_ERROR_MESSAGE;
    }

    return fallback;
  }

  if (looksLikeServerDump(message)) {
    return SERVER_ERROR_MESSAGE;
  }

  const translated = translateMessage(message);
  if (isUserFacingMessage(translated)) {
    return translated;
  }

  if (validation) {
    return VALIDATION_ERROR_MESSAGE;
  }

  return fallback;
}

function getFieldLabel(field) {
  return FIELD_LABELS[field] || field;
}

function formatFieldValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeMessage(String(item), VALIDATION_ERROR_MESSAGE, { validation: true }))
      .join(" ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([field, nestedValue]) => `${getFieldLabel(field)}: ${formatFieldValue(nestedValue)}`)
      .join(" ");
  }

  return sanitizeMessage(String(value), VALIDATION_ERROR_MESSAGE, { validation: true });
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
      const message = sanitizeMessage(entry.msg || "Некорректное значение.", VALIDATION_ERROR_MESSAGE, {
        validation: true,
      });
      return `${label}: ${message}`;
    })
    .join(" ");
}

function extractMessageFromData(data, fallback, { validation = false } = {}) {
  if (typeof data === "string") {
    return sanitizeMessage(data, fallback, { validation });
  }

  if (data.detail) {
    if (Array.isArray(data.detail)) {
      const translated = data.detail
        .map((item) => sanitizeMessage(String(item), fallback, { validation }))
        .filter(Boolean);
      return translated.join(" ") || (validation ? VALIDATION_ERROR_MESSAGE : fallback);
    }

    return sanitizeMessage(String(data.detail), fallback, { validation });
  }

  if (Array.isArray(data.errors)) {
    return formatPydanticErrors(data.errors) || VALIDATION_ERROR_MESSAGE;
  }

  if (data.errors && typeof data.errors === "object") {
    return formatFieldErrors(data.errors) || VALIDATION_ERROR_MESSAGE;
  }

  const fieldErrors = formatFieldErrors(data);
  if (fieldErrors) {
    return fieldErrors;
  }

  return validation ? VALIDATION_ERROR_MESSAGE : fallback;
}

export default function getApiErrorMessage(error, fallback = SERVER_ERROR_MESSAGE) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (!error?.response) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (status >= 500) {
    return SERVER_ERROR_MESSAGE;
  }

  if (!data) {
    return fallback;
  }

  const isValidationStatus = status >= 400 && status < 500;
  return extractMessageFromData(data, fallback, { validation: isValidationStatus });
}
