import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import AdminLayout from './components/AdminLayout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Chats from './pages/Chats'
import Feedback from './pages/Feedback'
import SystemLogs from './pages/SystemLogs'
import Settings from './pages/Settings'
import Login from './pages/Login'
import { socketService } from './utils/socket'
import { api } from './utils/api'
import { clearAdminToken, setAdminToken } from './utils/auth'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const expireSession = () => {
      socketService.disconnect()
      clearAdminToken()
      setIsAuthenticated(false)
    }
    window.addEventListener('admin-auth-expired', expireSession)

    // Check dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    }

    return () => window.removeEventListener('admin-auth-expired', expireSession)
  }, [])

  const handleLogin = (token) => {
    setAdminToken(token)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    api.logout()
    socketService.disconnect()
    clearAdminToken()
    setIsAuthenticated(false)
  }

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('darkMode', newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    )
  }

  return (
    <Router>
      <AdminLayout 
        onLogout={handleLogout} 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/system" element={<SystemLogs />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminLayout>
    </Router>
  )
}

export default App
