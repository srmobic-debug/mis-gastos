import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, FileText, Plus, MessageSquare, Tag, Users, User, LogOut } from 'lucide-react'
import logoImg from '../assets/logo.png'

interface NavItem {
  to: string
  icon: React.ReactNode
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
    { to: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/movimientos', icon: <FileText size={20} />, label: 'Movimientos' },
    { to: '/gastos/nuevo', icon: <Plus size={20} />, label: 'Nuevo Gasto' },
    { to: '/mensajes', icon: <MessageSquare size={20} />, label: 'Mensajes', badge: pendingCount },
    { to: '/categorias', icon: <Tag size={20} />, label: 'Categorías', adminOnly: true },
    { to: '/usuarios', icon: <Users size={20} />, label: 'Usuarios', adminOnly: true },
  ]

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const LogoComponent = () => {
    return (
      <div className="flex items-center gap-2">
        <img src={logoImg} alt="sr.mobic" className="w-8 h-8 object-contain" />
        <div>
          <p className="font-bold text-sm leading-tight" style={{ color: 'var(--black-soft)' }}>sr.mobic</p>
          <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Control de gastos</p>
        </div>
      </div>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--white)' }}>
      {/* Logo */}
      <div className="px-6 py-5" style={{ borderBottom: '1px solid var(--gray-100)' }}>
        <LogoComponent />
      </div>

      {/* Usuario */}
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--gray-100)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0" style={{ backgroundColor: 'var(--red-primary)' }}>
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--gray-700)' }}>{user?.name}</p>
            <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{isAdmin ? 'Administrador' : 'Usuario'}</p>
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
            className='flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors'
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--error-light)' : 'transparent',
              color: isActive ? 'var(--red-primary)' : 'var(--gray-400)',
            })}
          >
            <span className="w-5 text-center flex-shrink-0" style={{ color: 'currentColor' }}>
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--red-primary)' }}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Separador */}
        <div className="pt-4 mt-4" style={{ borderTop: '1px solid var(--gray-100)' }}>
          <NavLink
            to="/perfil"
            onClick={() => setSidebarOpen(false)}
            className='flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors'
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--error-light)' : 'transparent',
              color: isActive ? 'var(--red-primary)' : 'var(--gray-400)',
            })}
          >
            <span className="w-5 text-center flex-shrink-0" style={{ color: 'currentColor' }}>
              <User size={20} />
            </span>
            Mi Cuenta
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-red-50"
            style={{ color: 'var(--red-primary)' }}
          >
            <span className="w-5 text-center flex-shrink-0">
              <LogOut size={20} />
            </span>
            Cerrar sesión
          </button>
        </div>
      </nav>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--white-soft)' }}>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 shrink-0" style={{ backgroundColor: 'var(--white)', borderRight: '1px solid var(--gray-100)' }}>
        <SidebarContent />
      </aside>

      {/* Sidebar móvil (drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 shadow-xl" style={{ backgroundColor: 'var(--white)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header móvil */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3" style={{ backgroundColor: 'var(--white)', borderBottom: '1px solid var(--gray-100)' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg transition"
            style={{ color: 'var(--gray-400)', backgroundColor: 'var(--white-soft)' }}
          >
            ☰
          </button>
          <span className="font-semibold" style={{ color: 'var(--black-soft)' }}>sr.mobic</span>
        </header>

        {/* Área scrolleable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
