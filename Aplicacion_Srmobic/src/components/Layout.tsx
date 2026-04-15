import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface NavItem {
  to: string
  icon: string
  label: string
  adminOnly?: boolean
  badge?: number
}

interface LayoutProps {
  children: React.ReactNode
  pendingCount?: number
}

export default function Layout({ children, pendingCount = 0 }: LayoutProps) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems: NavItem[] = [
    { to: '/', icon: '🏠', label: 'Dashboard' },
    { to: '/movimientos', icon: '📋', label: 'Movimientos' },
    { to: '/gastos/nuevo', icon: '➕', label: 'Nuevo Gasto' },
    { to: '/mensajes', icon: '💬', label: 'Mensajes', badge: pendingCount },
    { to: '/categorias', icon: '🏷', label: 'Categorías', adminOnly: true },
    { to: '/usuarios', icon: '👥', label: 'Usuarios', adminOnly: true },
  ]

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💸</span>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Mis Gastos</p>
            <p className="text-xs text-gray-400">Control financiero</p>
          </div>
        </div>
      </div>

      {/* Usuario */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400">{isAdmin ? 'Administrador' : 'Usuario'}</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Separador */}
        <div className="pt-4 border-t border-gray-100 mt-4">
          <NavLink
            to="/perfil"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span className="text-base w-5 text-center">👤</span>
            Mi Cuenta
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <span className="text-base w-5 text-center">🚪</span>
            Cerrar sesión
          </button>
        </div>
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar móvil (drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header móvil */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            ☰
          </button>
          <span className="font-semibold text-gray-900">Mis Gastos</span>
        </header>

        {/* Área scrolleable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
