'use client'
import { AlertCircle } from 'lucide-react'

export default function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5">
      <AlertCircle size={12} className="flex-shrink-0" />
      {message}
    </p>
  )
}