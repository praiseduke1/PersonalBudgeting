const STORAGE_KEY = 'financersaas-theme'

export type Theme = 'light' | 'dark'

export function getStoredTheme(): Theme | null {
  return localStorage.getItem(STORAGE_KEY) as Theme | null
}

export function setStoredTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme)
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function getPreferredTheme(): Theme {
  const stored = getStoredTheme()
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function toggleTheme(): Theme {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
  applyTheme(next)
  setStoredTheme(next)
  return next
}

export function initTheme() {
  applyTheme(getPreferredTheme())
}
