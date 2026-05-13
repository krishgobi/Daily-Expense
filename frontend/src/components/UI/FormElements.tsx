import React from 'react'
import { cn } from '../../lib/utils'

/* ─── Input ──────────────────────────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: boolean
}

export const Input: React.FC<InputProps> = ({ icon, error, className, ...props }) => (
  <div className="relative">
    {icon && (
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </span>
    )}
    <input
      className={cn(
        'input',
        icon && 'pl-10',
        error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-600',
        className,
      )}
      {...props}
    />
  </div>
)

/* ─── Textarea ───────────────────────────────────────────────────────────── */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea: React.FC<TextareaProps> = ({ error, className, ...props }) => (
  <textarea
    className={cn(
      'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition',
      'placeholder:text-gray-400',
      'hover:border-gray-300',
      'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
      'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
      'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
      'dark:hover:border-gray-600 dark:focus:border-brand-400 dark:focus:ring-brand-400/20',
      error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
      className,
    )}
    {...props}
  />
)

/* ─── Select ─────────────────────────────────────────────────────────────── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select: React.FC<SelectProps> = ({ error, className, children, ...props }) => (
  <select
    className={cn(
      'input appearance-none cursor-pointer',
      error && 'border-red-400 focus:border-red-500 focus:ring-red-500/20',
      className,
    )}
    {...props}
  >
    {children}
  </select>
)

/* ─── FormField ──────────────────────────────────────────────────────────── */
interface FormFieldProps {
  label:     string
  htmlFor?:  string
  required?: boolean
  error?:    string
  hint?:     string
  children:  React.ReactNode
  className?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}) => (
  <div className={cn('space-y-1.5', className)}>
    <label htmlFor={htmlFor} className="label">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>
)
