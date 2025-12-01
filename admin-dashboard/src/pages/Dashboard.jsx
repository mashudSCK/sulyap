import { useState, useEffect, useRef } from 'react'
import { 
  Users, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  Activity,
  Zap,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { api } from '../utils/api'
import { socketService } from '../utils/socket'

const COLORS = ['#8b5cf6', '#d946ef', '#06b6d4', '#10b981', '#f59e0b']

export default function Dashboard() {
  const [stats, setStats] = useState({
    onlineUsers: 0,
    activeChats: 0,
    avgSessionDuration: 0,
    users24h: 0,
    users7d: 0,
    totalMessages: 0,
    avgMessagesPerChat: 0,
    disconnectRate: 0
  })

  const [activityData, setActivityData] = useState([])
  const [sessionData, setSessionData] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastUpdate, setLastUpdate] = useState({
    activity: null,
    hourly: null,
    session: null
  })
  
  // Animation refs for smooth value transitions
  const prevStatsRef = useRef(stats)
  const animationFrameRef = useRef(null)

  // Chart update helper functions
  const addDataPoint = (prevData, newPoint, maxPoints = 20) => {
    const updated = [...prevData, newPoint]
    return updated.slice(-maxPoints) // Keep only last N points
  }

  const updateActivityData = (timestamp, value) => {
    const hour = new Date(timestamp).getHours()
    const timeStr = `${hour}:00`
    
    setActivityData(prev => {
      const newPoint = { hour: timeStr, users: value, timestamp }
      return addDataPoint(prev, newPoint, 20)
    })
    
    setLastUpdate(prev => ({ ...prev, activity: Date.now() }))
  }

  const updateHourlyMessages = (timestamp, value) => {
    const hour = new Date(timestamp).getHours()
    const timeStr = `${hour}:00`
    
    setHourlyData(prev => {
      const newPoint = { hour: timeStr, messages: value, timestamp }
      return addDataPoint(prev, newPoint, 20)
    })
    
    setLastUpdate(prev => ({ ...prev, hourly: Date.now() }))
  }

  useEffect(() => {
    loadStats()
    
    // Connect to real-time updates
    const token = localStorage.getItem('adminToken')
    socketService.connect(token)

    // Listen for connection status changes
    socketService.on('connection-status', (status) => {
      setConnectionStatus(status.status)
      setReconnectAttempts(status.attempts || 0)
    })

    // Listen for real-time stats updates
    socketService.on('stats-update', (data) => {
      animateStatsUpdate(data)
    })

    // NEW: Listen for chart data updates
    socketService.on('chart-update', (data) => {
      if (data.activityPoint) {
        updateActivityData(data.timestamp, data.activityPoint)
      }
      if (data.messagePoint) {
        updateHourlyMessages(data.timestamp, data.messagePoint)
      }
      if (data.sessionData) {
        setSessionData(data.sessionData)
        setLastUpdate(prev => ({ ...prev, session: Date.now() }))
      }
      // Update complete datasets if provided
      if (data.activityData && Array.isArray(data.activityData)) {
        setActivityData(data.activityData)
        setLastUpdate(prev => ({ ...prev, activity: Date.now() }))
      }
      if (data.hourlyData && Array.isArray(data.hourlyData)) {
        setHourlyData(data.hourlyData)
        setLastUpdate(prev => ({ ...prev, hourly: Date.now() }))
      }
    })

    // Listen for individual events to update charts
    socketService.on('user-connected', () => {
      setStats(prev => ({ ...prev, onlineUsers: prev.onlineUsers + 1 }))
      // Update activity chart with new data point
      updateActivityData(new Date().toISOString(), stats.onlineUsers + 1)
    })

    socketService.on('user-disconnected', () => {
      setStats(prev => ({ ...prev, onlineUsers: Math.max(0, prev.onlineUsers - 1) }))
      updateActivityData(new Date().toISOString(), Math.max(0, stats.onlineUsers - 1))
    })

    socketService.on('chat-started', () => {
      setStats(prev => ({ ...prev, activeChats: prev.activeChats + 1 }))
    })

    socketService.on('chat-ended', () => {
      setStats(prev => ({ ...prev, activeChats: Math.max(0, prev.activeChats - 1) }))
    })

    socketService.on('message-sent', () => {
      setStats(prev => ({ ...prev, totalMessages: prev.totalMessages + 1 }))
      // Update message chart
      updateHourlyMessages(new Date().toISOString(), stats.totalMessages + 1)
    })

    socketService.on('feedback-submitted', () => {
      // Optional: trigger a notification or update
      console.log('📝 New feedback received')
    })

    // Reduced polling interval since we have real-time updates
    const interval = setInterval(loadStats, 30000) // Every 30 seconds for backup

    return () => {
      clearInterval(interval)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const animateStatsUpdate = (newData) => {
    // Smooth animation for stat changes
    const startStats = { ...prevStatsRef.current }
    const endStats = { ...stats, ...newData }
    const duration = 500 // milliseconds
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
      const easedProgress = easeOutCubic(progress)

      const interpolatedStats = {}
      Object.keys(endStats).forEach(key => {
        if (typeof endStats[key] === 'number') {
          interpolatedStats[key] = Math.round(
            startStats[key] + (endStats[key] - startStats[key]) * easedProgress
          )
        } else {
          interpolatedStats[key] = endStats[key]
        }
      })

      setStats(interpolatedStats)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        prevStatsRef.current = endStats
      }
    }

    animate()
  }

  const loadStats = async () => {
    const data = await api.getStats()
    if (data) {
      setStats(data.current || data)
      if (data.activityData) setActivityData(data.activityData)
      if (data.sessionData) setSessionData(data.sessionData)
      if (data.hourlyData) setHourlyData(data.hourlyData)
    }
    setLoading(false)
  }

  const ConnectionIndicator = () => {
    const getStatusColor = () => {
      switch (connectionStatus) {
        case 'connected':
          return 'bg-green-500'
        case 'connecting':
        case 'reconnecting':
          return 'bg-yellow-500'
        case 'disconnected':
        case 'failed':
          return 'bg-red-500'
        default:
          return 'bg-gray-500'
      }
    }

    const getStatusText = () => {
      switch (connectionStatus) {
        case 'connected':
          return 'LIVE'
        case 'connecting':
          return 'Connecting...'
        case 'reconnecting':
          return `Reconnecting... (${reconnectAttempts})`
        case 'disconnected':
          return 'Disconnected'
        case 'failed':
          return 'Connection Failed'
        default:
          return 'Unknown'
      }
    }

    const getIcon = () => {
      switch (connectionStatus) {
        case 'connected':
          return <Wifi className="w-3 h-3" />
        case 'connecting':
        case 'reconnecting':
          return <RefreshCw className="w-3 h-3 animate-spin" />
        default:
          return <WifiOff className="w-3 h-3" />
      }
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`}></div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          {getIcon()}
          {getStatusText()}
        </span>
      </div>
    )
  }

  const LiveBadge = ({ lastUpdate }) => {
    const [pulse, setPulse] = useState(false)
    
    useEffect(() => {
      if (lastUpdate) {
        setPulse(true)
        const timer = setTimeout(() => setPulse(false), 1000)
        return () => clearTimeout(timer)
      }
    }, [lastUpdate])
    
    return (
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full bg-green-500 ${pulse ? 'animate-ping' : 'animate-pulse'}`}></div>
        <span className="text-xs font-medium text-green-600 dark:text-green-400">LIVE</span>
      </div>
    )
  }

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="stat-card transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white transition-all duration-300">
            {value}
          </p>
          {change && (
            <p className={`mt-2 text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="inline w-4 h-4 mr-1" />
              {Math.abs(change)}% from last week
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with Sulyap today.
          </p>
        </div>
        <ConnectionIndicator />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Online Users"
          value={stats.onlineUsers}
          change={12}
          icon={Users}
          color="bg-gradient-to-br from-primary-500 to-primary-600"
        />
        <StatCard
          title="Active Chats"
          value={stats.activeChats}
          change={8}
          icon={MessageSquare}
          color="bg-gradient-to-br from-accent-500 to-accent-600"
        />
        <StatCard
          title="Avg. Session"
          value={`${stats.avgSessionDuration} min`}
          change={-5}
          icon={Clock}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Users (24h)"
          value={stats.users24h}
          change={15}
          icon={Activity}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Activity Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Activity (Real-Time)
            </h3>
            <LiveBadge lastUpdate={lastUpdate.activity} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis 
                dataKey="hour" 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                animationDuration={300}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={300}
                animationEasing="ease-in-out"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Session Duration Pie Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Session Duration Distribution
            </h3>
            <LiveBadge lastUpdate={lastUpdate.session} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sessionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationDuration={300}
                animationEasing="ease-out"
                isAnimationActive={true}
              >
                {sessionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Message Activity Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Message Activity (Live Stream)
          </h3>
          <LiveBadge lastUpdate={lastUpdate.hourly} />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis 
              dataKey="hour" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
              animationDuration={300}
            />
            <Legend />
            <Bar 
              dataKey="messages" 
              fill="#d946ef" 
              radius={[8, 8, 0, 0]}
              animationDuration={300}
              animationEasing="ease-in-out"
              isAnimationActive={true}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalMessages}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Msgs/Chat</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.avgMessagesPerChat}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-500">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disconnect Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.disconnectRate}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
