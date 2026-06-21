'use client'
import { useState } from 'react'

type Validator = (value: string) => string | null // returns error message or null if valid

interface FieldConfig {
  required?:  boolean
  validator?: Validator
  label?:     string // used in default required message, e.g. "Email is required"
}

/**
 * Lightweight form validation hook that replaces the browser's native
 * "Please fill out this field" tooltips with inline UI error messages.
 *
 * Usage:
 *   const { errors, validate, validateAll, clearError } = useFormValidation({
 *     email:    { required: true, label: 'Email' },
 *     password: { required: true, label: 'Password',
 *                 validator: v => v.length < 8 ? 'Password must be at least 8 characters' : null },
 *   })
 *
 *   // On submit, instead of relying on <input required>:
 *   function handleSubmit(e) {
 *     e.preventDefault()
 *     if (!validateAll(form)) return // errors are now populated, UI shows them
 *     // ...proceed
 *   }
 *
 *   // On the input itself (no `required` attribute, no native popups):
 *   <input
 *     value={form.email}
 *     onChange={e => { upd('email', e.target.value); clearError('email') }}
 *     onBlur={() => validate('email', form.email)}
 *   />
 *   {errors.email && <FieldError message={errors.email} />}
 */
export function useFormValidation(config: Record<string, FieldConfig>) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(field: string, value: string): boolean {
    const cfg = config[field]
    if (!cfg) return true

    const trimmed = value?.trim() ?? ''

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

    setErrors(e => {
      const next = { ...e }
      delete next[field]
      return next
    })
    return true
  }

  function validateAll(values: Record<string, string>): boolean {
    let allValid = true
    const newErrors: Record<string, string> = {}

    for (const field of Object.keys(config)) {
      const cfg = config[field]
      const value = (values[field] ?? '').trim()

      if (cfg.required && !value) {
        newErrors[field] = `${cfg.label ?? field} is required`
        allValid = false
        continue
      }

      if (cfg.validator) {
        const result = cfg.validator(value)
        if (result) {
          newErrors[field] = result
          allValid = false
        }
      }
    }

    setErrors(newErrors)
    return allValid
  }

  function clearError(field: string) {
    setErrors(e => {
      if (!e[field]) return e
      const next = { ...e }
      delete next[field]
      return next
    })
  }

  function clearAll() {
    setErrors({})
  }

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
    if (!v) return null // optional field
    try { new URL(v); return null } catch { return 'Enter a valid URL (include https://)' }
  },
}