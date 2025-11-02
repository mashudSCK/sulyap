import { useState, useEffect } from 'react'
import { Users as UsersIcon, UserCheck, UserX, Globe } from 'lucide-react'

export default function Users() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    idle: 0,
    byRegion: []
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Monitor user activity and engagement
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">1,234</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Now</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">42</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600">
              <UserX className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Idle</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">18</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Activity Timeline
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time user connection data will appear here...
        </p>
      </div>
    </div>
  )
}
