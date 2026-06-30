const STORAGE_KEY = "theme";
let onThemeChange = () => {};

export function initTheme(onChange) {
  if (typeof onChange === "function") onThemeChange = onChange;

  const themeToggle = document.getElementById("theme-toggle");
  const saved = localStorage.getItem(STORAGE_KEY);
  const systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

  applyTheme(saved === "light" || (!saved && systemPrefersLight));

  themeToggle.addEventListener("change", (e) => applyTheme(e.target.checked));
}

function applyTheme(isLight) {
  const themeToggle = document.getElementById("theme-toggle");
  if (isLight) {
    document.body.classList.add("light-theme");
    themeToggle.checked = true;
    localStorage.setItem(STORAGE_KEY, "light");
  } else {
    document.body.classList.remove("light-theme");
    themeToggle.checked = false;
    localStorage.setItem(STORAGE_KEY, "dark");
  }
  onThemeChange();
}

export function getThemeColors() {
  const isLight = document.body.classList.contains("light-theme");
  return {
    text: isLight ? "#475569" : "#94a3b8",
    grid: isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.08)",
    tooltipBg: isLight ? "#ffffff" : "#1e293b",
    tooltipText: isLight ? "#0f172a" : "#f8fafc",
  };
}
