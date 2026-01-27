import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { BookDesk } from '@/pages/BookDesk'
import { MyBookings } from '@/pages/MyBookings'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminLocations } from '@/pages/admin/AdminLocations'
import { AdminFloors } from '@/pages/admin/AdminFloors'
import { AdminDesks } from '@/pages/admin/AdminDesks'
import { AdminReports } from '@/pages/admin/AdminReports'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/book"
        element={
          <ProtectedRoute>
            <Layout>
              <BookDesk />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Layout>
              <MyBookings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/locations"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminLocations />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/floors"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminFloors />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/desks"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminDesks />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requireAdmin>
            <Layout>
              <AdminReports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

