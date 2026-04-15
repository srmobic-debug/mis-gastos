interface Props {
  status: string
  type?: 'expense' | 'message'
}

const COLORS = {
  primaryRed: '#D60000',
  gray400: '#7A7A7A',
  gray700: '#3A3A3A',
}

const EXPENSE_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  confirmed:  { label: 'Confirmado',  bg: '#DBEAFE', text: '#1E40AF' },
  pending:    { label: 'Pendiente',   bg: '#FEF3C7', text: '#92400E' },
  incomplete: { label: 'Incompleto',  bg: '#FED7AA', text: '#9A3412' },
  error:      { label: 'Error',       bg: '#FECACA', text: '#991B1B' },
}

const MESSAGE_STATUS: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: 'Pendiente',  bg: '#FEF3C7', text: '#92400E' },
  processed: { label: 'Procesado', bg: '#DBEAFE', text: '#1E40AF' },
  error:     { label: 'Error',     bg: '#FECACA', text: '#991B1B' },
  reviewed:  { label: 'Revisado',  bg: '#D1FAE5', text: '#065F46' },
}

export default function StatusBadge({ status, type = 'expense' }: Props) {
  const map = type === 'message' ? MESSAGE_STATUS : EXPENSE_STATUS
  const config = map[status] || { label: status, bg: '#EAEAEA', text: COLORS.gray700 }

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  )
}
