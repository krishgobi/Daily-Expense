import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme('light')
    document.documentElement.classList.remove('dark')
  }, [])

  const toggleTheme = () => {
    // Dark mode is disabled - no-op
  }

  return { theme, toggleTheme }
}
