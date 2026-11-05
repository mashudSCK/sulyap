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
        <h1 className="font-editorial text-3xl font-normal tracking-tight text-gray-900 dark:text-white">Users</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Monitor user activity and engagement
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center border border-primary-200 text-primary-700 dark:text-primary-300">
              <UsersIcon className="w-4 h-4" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">1,234</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center border border-primary-200 text-primary-700 dark:text-primary-300">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Now</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">42</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center border border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300">
              <UserX className="w-4 h-4" />
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
