interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
        } ${props.className ?? ''}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        {...props}
        className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors bg-white ${
          error ? 'border-red-400' : 'border-gray-200'
        } ${props.className ?? ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function Textarea({ label, error, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <textarea
        rows={3}
        {...props}
        className={`px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
        } ${props.className ?? ''}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
