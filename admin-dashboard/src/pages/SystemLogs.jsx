import { useState, useEffect } from 'react'
import { Activity, AlertCircle, CheckCircle, XCircle, Download, Filter } from 'lucide-react'
import { api } from '../utils/api'
import { format } from 'date-fns'

export default function SystemLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, error, warning, info
  const [serverStatus, setServerStatus] = useState({
    online: false,
    uptimeSeconds: 0,
    memoryPercent: 0,
    loadAverage: 0,
    cpuCount: 1
  })

  useEffect(() => {
    loadLogs()
    loadServerStatus()

    // Poll for updates
    const interval = setInterval(() => {
      loadLogs()
      loadServerStatus()
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [filter])

  const loadLogs = async () => {
    const data = await api.getLogs({ severity: filter !== 'all' ? filter : undefined })
    setLogs(data)
    setLoading(false)
  }

  const loadServerStatus = async () => {
    const health = await api.getHealth()
    if (health) setServerStatus(health)
    else setServerStatus(current => ({ ...current, online: false }))
  }

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const handleExport = () => {
    api.exportData('logs')
  }

  const getLogIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />
    }
  }

  const getLogBadge = (severity) => {
    switch (severity) {
      case 'error':
        return <span className="badge-error">Error</span>
      case 'warning':
        return <span className="badge-warning">Warning</span>
      default:
        return <span className="badge-info">Info</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-editorial text-3xl font-normal tracking-tight text-gray-900 dark:text-white">System Health & Logs</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Monitor server status and system logs
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </button>
      </div>

      {/* Server Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Server Status</p>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                {serverStatus.online ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className={`w-2 h-2 rounded-full ${serverStatus.online ? 'bg-green-600' : 'bg-red-600'}`} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center border border-primary-200 text-primary-700 dark:text-primary-300">
              <Activity className="w-4 h-4" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Process Uptime</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatUptime(serverStatus.uptimeSeconds)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Memory Usage</p>
            <div className="flex items-center">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600"
                  style={{ width: `${serverStatus.memoryPercent}%` }}
                />
              </div>
              <span className="ml-3 text-sm font-semibold text-gray-900 dark:text-white">
                {serverStatus.memoryPercent}%
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">1m Load Average</p>
            <div className="flex items-center">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500"
                  style={{ width: `${Math.min((serverStatus.loadAverage / serverStatus.cpuCount) * 100, 100)}%` }}
                />
              </div>
              <span className="ml-3 text-sm font-semibold text-gray-900 dark:text-white">
                {serverStatus.loadAverage.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-500" />
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Errors
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'warning'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Warnings
        </button>
        <button
          onClick={() => setFilter('info')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Info
        </button>
      </div>

      {/* Logs */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Logs</h3>
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No logs to display</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {getLogIcon(log.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getLogBadge(log.severity)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{log.message}</p>
                  {log.details && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{log.details}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
