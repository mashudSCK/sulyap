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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check if user is already logged in
    const authToken = localStorage.getItem('adminToken')
    if (authToken) {
      setIsAuthenticated(true)
    }

    // Check dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const handleLogin = (token) => {
    localStorage.setItem('adminToken', token)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
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
