"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import type { Theme } from "next-themes/dist/types"
import React from "react"
import { useTheme } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { setTheme, storageKey } = useTheme()

  React.useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme
    if (storedTheme) {
      setTheme(storedTheme)
    }
  }, [storageKey, setTheme])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
