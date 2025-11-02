import { useState, useEffect } from 'react'
import { MessageSquare, Send, Users, Clock } from 'lucide-react'

export default function Chats() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat Activity</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Monitor chat sessions and message flow
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Chats</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">21</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages Today</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">3,456</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paired Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">42</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Duration</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">12m</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Live Chat Monitor
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>• Privacy-respecting metadata only (no message content)</p>
          <p>• Shows connection times, duration, and status</p>
          <p>• Real-time updates via WebSocket</p>
        </div>
      </div>
    </div>
  )
}
