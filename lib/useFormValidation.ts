'use client'
import { useState, useRef, useCallback } from 'react'

type Validator = (value: string) => string | null

interface FieldConfig {
  required?:  boolean
  validator?: Validator
  label?:     string
}

export function useFormValidation(config: Record<string, FieldConfig>) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Keep config in a ref so callbacks never go stale even as the component re-renders
  const configRef = useRef(config)
  configRef.current = config

  
  const validate = useCallback((field: string, value: string): boolean => {
    const cfg = configRef.current[field]
    if (!cfg) return true

    const trimmed = (value ?? '').trim()

    if (cfg.required && !trimmed) {
      setErrors(e => ({ ...e, [field]: `${cfg.label ?? field} is required` }))
      return false
    }

    if (cfg.validator) {
      const result = cfg.validator(trimmed)
      if (result) {
        setErrors(e => ({ ...e, [field]: result }))
        return false
      }
    }

    // Field is valid — clear any existing error
    setErrors(e => {
      if (!e[field]) return e
      const next = { ...e }
      delete next[field]
      return next
    })
    return true
  }, [])

  const validateAll = useCallback((values: Record<string, string>): boolean => {
    const cfg = configRef.current
    let allValid = true
    const newErrors: Record<string, string> = {}

    for (const field of Object.keys(cfg)) {
      const fieldCfg = cfg[field]
      const value = (values[field] ?? '').trim()

      if (fieldCfg.required && !value) {
        newErrors[field] = `${fieldCfg.label ?? field} is required`
        allValid = false
        continue
      }

      if (fieldCfg.validator) {
        const result = fieldCfg.validator(value)
        if (result) {
          newErrors[field] = result
          allValid = false
        }
      }
    }

    setErrors(newErrors)
    return allValid
  }, [])

  const clearError = useCallback((field: string) => {
    setErrors(e => {
      if (!e[field]) return e
      const next = { ...e }
      delete next[field]
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setErrors({})
  }, [])

  return { errors, validate, validateAll, clearError, clearAll }
}

// Common reusable validators
export const validators = {
  email: (v: string) =>
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address' : null,

  minLength: (min: number, fieldName = 'This field') => (v: string) =>
    v.length < min ? `${fieldName} must be at least ${min} characters` : null,

  phone: (v: string) =>
    v.replace(/\D/g, '').length < 10 ? 'Enter a valid phone number' : null,

  matches: (otherValue: string, message = 'Values do not match') => (v: string) =>
    v !== otherValue ? message : null,

  url: (v: string) => {
    if (!v) return null
    try { new URL(v); return null } catch { return 'Enter a valid URL (include https://)' }
  },
}