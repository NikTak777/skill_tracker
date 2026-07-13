import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "skilltracker_theme";
const ThemeContext = createContext(null);

function getPreferredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme,
      setTheme,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
