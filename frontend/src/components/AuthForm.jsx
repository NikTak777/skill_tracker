import { useState } from "react";

import { getMe, login } from "../api.js";
import LoadingSpinner from "./LoadingSpinner.jsx";


function getErrorMessage(error) {
  const responseData = error.response?.data;

  if (!responseData) {
    return "Не удалось войти. Проверьте логин и пароль.";
  }

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData.detail) {
    return responseData.detail;
  }

  if (responseData.username) {
    const message = Array.isArray(responseData.username)
      ? responseData.username.join(" ")
      : responseData.username;
    return `Логин: ${message}`;
  }

  if (responseData.password) {
    const message = Array.isArray(responseData.password)
      ? responseData.password.join(" ")
      : responseData.password;
    return `Пароль: ${message}`;
  }

  return "Не удалось войти. Проверьте введённые данные.";
}

export default function AuthForm({ onAuthSuccess }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
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
    setIsSubmitting(true);

    try {
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
        // Если профиль временно недоступен, используем базовые данные.
      }

      onAuthSuccess({ role, username });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="hero auth-hero">
        <h1>Вход в SkillTracker</h1>
        <p>Войдите, чтобы перейти на панель работника и работать с задачами.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Введите данные</h2>

        <label>
          Логин
          <input
            name="username"
            type="text"
            placeholder="Введите логин"
            value={formData.username}
            onChange={updateField}
            required
          />
        </label>

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

        {isSubmitting ? (
          <LoadingSpinner label="Вход..." />
        ) : (
          <button type="submit">Войти</button>
        )}

        <p className="auth-form__switch">
          Нет аккаунта? Запросите данные у руководителя.
        </p>
      </form>
    </section>
  );
}
