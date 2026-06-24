'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  wrapperClassName?: string
}

export function PasswordInput({ label, error, className, wrapperClassName, id, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false)
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={wrapperClassName}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={show ? 'text' : 'password'}
          autoComplete={props.autoComplete ?? 'current-password'}
          className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-200'
          } ${className ?? ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
        >
          {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
