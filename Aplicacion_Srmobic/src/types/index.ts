export interface User {
  id: string | number
  name: string
  email: string | null
  phone: string | null
  role: 'admin' | 'user'
  status?: 'active' | 'inactive' | 'unregistered'
  created_at?: string
}

export interface AuthState {
  token?: string
  user: User
}

export interface Category {
  id: number
  name: string
  color: string
  icon: string
  is_active: boolean
  expense_count?: number
}

export interface Message {
  id: number
  user_id: number
  user_name: string
  user_phone: string
  message_type: 'text' | 'audio' | 'image' | 'document'
  raw_text: string | null
  raw_content: string | null
  processing_status: 'pending' | 'processed' | 'error' | 'reviewed'
  error_reason: string | null
  processed_at: string | null
  created_at: string
  expense_id: number | null
  expense_amount: number | null
  expense_status: string | null
  expense_category: string | null
  expense_category_icon: string | null
}

export interface Expense {
  id: number
  amount: number
  description: string | null
  expense_date: string
  status: 'confirmed' | 'pending' | 'incomplete' | 'error'
  capture_channel: 'whatsapp' | 'manual' | 'appsmith'
  payment_method: 'cash' | 'card' | 'transfer' | 'other' | null
  confidence_score: number | null
  created_at: string
  updated_at: string
  user_id: number
  user_name: string
  user_phone: string
  category_id: number | null
  category_name: string | null
  category_icon: string | null
  category_color: string | null
  message_id: number | null
  message_raw_text?: string | null
  message_type?: string | null
}

export interface DashboardSummary {
  total_mes: number
  cantidad: number
  promedio: number
  total_mes_anterior: number
  pendientes: number
  con_error: number
}

export interface DashboardCategory {
  name: string
  icon: string
  color: string
  total: number
  count: number
  percentage: number
}

export interface DashboardDaily {
  date: string
  total: number
}

export interface NewExpensePayload {
  amount: number
  category_id?: number
  description?: string
  expense_date?: string
  payment_method?: string
  capture_channel: 'manual'
}

// Aliases for backward compatibility
export type Gasto = Expense
export type Resumen = DashboardSummary
