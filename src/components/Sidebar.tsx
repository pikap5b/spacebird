import { Link, useLocation } from 'react-router-dom'
import { Calendar, BookOpen, List, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Sidebar() {
  const location = useLocation()
  const { isAdmin } = useAuth()

  const navItems = [
    { path: '/', label: 'Schedule', icon: Calendar },
    { path: '/book', label: 'Book', icon: BookOpen },
    { path: '/bookings', label: 'Bookings', icon: List },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-2xl font-bold text-gray-900">SpaceBird</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || 
            (item.path === '/book' && location.pathname.startsWith('/book'))
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-purple-700' : 'text-gray-500'}`} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Notifications */}
      <div className="p-4 border-t border-gray-200">
        <button className="relative w-full flex items-center justify-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </aside>
  )
}

