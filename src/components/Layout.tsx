import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { LogOut, Calendar, Home, Settings, BarChart3 } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/book', label: 'Book a Desk', icon: Calendar },
    { path: '/bookings', label: 'My Bookings', icon: Calendar },
  ]

  const adminNavItems = [
    { path: '/admin', label: 'Admin Dashboard', icon: Settings },
    { path: '/admin/locations', label: 'Locations', icon: Settings },
    { path: '/admin/floors', label: 'Floors', icon: Settings },
    { path: '/admin/desks', label: 'Desks', icon: Settings },
    { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link to="/" className="text-2xl font-bold text-primary">
              SpaceBird
            </Link>
            <nav className="flex items-center gap-2 flex-wrap">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
            {isAdmin && (
              <>
                {adminNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                      title={item.label}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  )
                })}
              </>
            )}
            <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {profile?.full_name || profile?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} title="Sign Out">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

