import { useState, useCallback } from 'react'
import { toggleTheme } from '../lib/theme'

export function useTheme() {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  const toggle = useCallback(() => {
    toggleTheme()
    setIsDark(!isDark)
  }, [isDark])

  return { isDark, toggle }
}
