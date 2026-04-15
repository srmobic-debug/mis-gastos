import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Movimientos from './pages/Movimientos'
import Agregar from './pages/Agregar'
import Mensajes from './pages/Mensajes'
import Categorias from './pages/Categorias'
import Usuarios from './pages/Usuarios'
import Perfil from './pages/Perfil'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/movimientos" element={<Movimientos />} />
                <Route path="/gastos/nuevo" element={<Agregar />} />
                <Route path="/mensajes" element={<Mensajes />} />
                <Route path="/categorias" element={
                  <ProtectedRoute adminOnly>
                    <Categorias />
                  </ProtectedRoute>
                } />
                <Route path="/usuarios" element={
                  <ProtectedRoute adminOnly>
                    <Usuarios />
                  </ProtectedRoute>
                } />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}
