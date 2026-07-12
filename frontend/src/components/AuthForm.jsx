import { useState } from "react";
import { Link } from "react-router-dom";

import { getMe, login, register } from "../api.js";
import LoadingSpinner from "./LoadingSpinner.jsx";


function getErrorMessage(error) {
  const responseData = error.response?.data;

  if (!responseData) {
    return "Backend недоступен. Проверьте, что сервер запущен.";
  }

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData.detail) {
    return responseData.detail;
  }

  if (responseData.username) {
    return `Username: ${Array.isArray(responseData.username) ? responseData.username.join(" ") : responseData.username}`;
  }

  if (responseData.password) {
    return `Password: ${Array.isArray(responseData.password) ? responseData.password.join(" ") : responseData.password}`;
  }

  if (responseData.email) {
    return `Email: ${Array.isArray(responseData.email) ? responseData.email.join(" ") : responseData.email}`;
  }

  return "Запрос завершился ошибкой. Проверьте введенные данные.";
}

export default function AuthForm({ mode, onAuthSuccess }) {
  const isLogin = mode === "login";
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "employee",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login({
          username: formData.username,
          password: formData.password,
        });

        let role = "employee";
        let username = formData.username;

        try {
          const profile = await getMe();
          role = profile.role || role;
          username = profile.username || username;
        } catch {
          // Если /auth/me/ временно недоступен, используем базовые данные.
        }

        setStatusMessage("Вход выполнен. Переходим на Dashboard.");
        onAuthSuccess({ role, username });
        return;
      }

      const user = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      await login({
        username: formData.username,
        password: formData.password,
      });

      let profile = user;
      try {
        profile = await getMe();
      } catch {
        // Если /auth/me/ временно недоступен, используем ответ регистрации.
      }

      setStatusMessage("Регистрация выполнена. Переходим на Dashboard.");
      onAuthSuccess({
        role: profile.role || formData.role,
        username: profile.username || formData.username,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="hero auth-hero">
        <p className="label">Доступ</p>
        <h1>{isLogin ? "Вход в SkillTracker" : "Регистрация пользователя"}</h1>
        <p>
          {isLogin
            ? "Войдите, чтобы перейти на Dashboard и работать с задачами."
            : "Создайте аккаунт manager или employee для работы в системе."}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <p className="label">{isLogin ? "Уже есть аккаунт" : "Новый аккаунт"}</p>
        <h2>{isLogin ? "Введите данные" : "Заполните профиль"}</h2>

        <label>
          Username
          <input
            name="username"
            type="text"
            placeholder="employee"
            value={formData.username}
            onChange={updateField}
            required
          />
        </label>

        {!isLogin && (
          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="employee@example.com"
              value={formData.email}
              onChange={updateField}
              required
            />
          </label>
        )}

        {!isLogin && (
          <label>
            Роль
            <select name="role" value={formData.role} onChange={updateField}>
              <option value="employee">Сотрудник</option>
              <option value="manager">Руководитель</option>
            </select>
          </label>
        )}

        <label>
          Пароль
          <input
            name="password"
            type="password"
            placeholder="Введите пароль"
            value={formData.password}
            onChange={updateField}
            required
          />
        </label>

        {errorMessage && <p className="form-message form-message--error">{errorMessage}</p>}
        {statusMessage && <p className="form-message">{statusMessage}</p>}

        {isSubmitting ? (
          <LoadingSpinner label="Отправляем данные..." />
        ) : (
          <button type="submit">
            {isLogin ? "Войти" : "Создать аккаунт"}
          </button>
        )}

        <p className="auth-form__switch">
          {isLogin ? (
            <>
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </>
          ) : (
            <>
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </>
          )}
        </p>
      </form>
    </section>
  );
}
