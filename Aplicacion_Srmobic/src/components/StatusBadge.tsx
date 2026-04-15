interface Props {
  status: string
  type?: 'expense' | 'message'
}

const EXPENSE_STATUS: Record<string, { label: string; className: string }> = {
  confirmed:  { label: 'Confirmado',  className: 'bg-green-100 text-green-700' },
  pending:    { label: 'Pendiente',   className: 'bg-yellow-100 text-yellow-700' },
  incomplete: { label: 'Incompleto',  className: 'bg-orange-100 text-orange-700' },
  error:      { label: 'Error',       className: 'bg-red-100 text-red-700' },
}

const MESSAGE_STATUS: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Pendiente',  className: 'bg-yellow-100 text-yellow-700' },
  processed: { label: 'Procesado', className: 'bg-green-100 text-green-700' },
  error:     { label: 'Error',     className: 'bg-red-100 text-red-700' },
  reviewed:  { label: 'Revisado',  className: 'bg-blue-100 text-blue-700' },
}

export default function StatusBadge({ status, type = 'expense' }: Props) {
  const map = type === 'message' ? MESSAGE_STATUS : EXPENSE_STATUS
  const config = map[status] || { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
