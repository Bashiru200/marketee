'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const THEME_KEY = 'markeetee-theme-v2'
const OLD_THEME_KEYS = ['markeetee-theme', 'markeetee-dark-mode']

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => {
      const storedDark = localStorage.getItem(THEME_KEY) === 'dark'
      setDark(storedDark)
      setMounted(true)
    }, 0)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  function toggle() {
    const next = !dark
    setDark(next)
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    OLD_THEME_KEYS.forEach((key) => localStorage.removeItem(key))
  }

  const isDark = mounted ? dark : false

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-[#9FE1CB] dark:hover:text-white dark:hover:bg-[#17382f] transition-colors">
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
