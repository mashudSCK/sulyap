import { useState, useEffect } from 'react'
import { Star, Check, Pin, Trash2, Download, MessageCircle, Bell } from 'lucide-react'
import { api } from '../utils/api'
import { socketService } from '../utils/socket'
import { format } from 'date-fns'

export default function Feedback() {
  const [feedbackList, setFeedbackList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, pinned
  const [newFeedbackAlert, setNewFeedbackAlert] = useState(false)

  useEffect(() => {
    loadFeedback()
    
    // Connect to real-time feedback updates
    const token = localStorage.getItem('adminToken')
    socketService.connect(token)
    
    // Listen for new feedback submissions
    socketService.on('feedback-submitted', (data) => {
      console.log('📝 New feedback received in real-time:', data)
      setNewFeedbackAlert(true)
      
      // Add new feedback to the list
      setFeedbackList(prev => [data, ...prev])
      
      // Clear alert after 5 seconds
      setTimeout(() => setNewFeedbackAlert(false), 5000)
    })
    
    return () => {
      // No need to disconnect as it's shared across pages
    }
  }, [])

  const loadFeedback = async () => {
    const data = await api.getFeedback()
    setFeedbackList(data)
    setLoading(false)
  }

  const handleMarkRead = async (id) => {
    await api.updateFeedback(id, { read: true })
    loadFeedback()
  }

  const handlePin = async (id, pinned) => {
    await api.updateFeedback(id, { pinned: !pinned })
    loadFeedback()
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      await api.deleteFeedback(id)
      loadFeedback()
    }
  }

  const handleExport = () => {
    api.exportData('feedback')
  }

  const StarRating = ({ rating }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  )

  const filteredFeedback = feedbackList.filter(item => {
    if (filter === 'unread') return !item.read
    if (filter === 'pinned') return item.pinned
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* New Feedback Alert */}
      {newFeedbackAlert && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3 animate-[slideDown_0.3s_ease-out]">
          <Bell className="w-5 h-5 text-green-600 dark:text-green-400 animate-bounce" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              New feedback received!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              A user just submitted feedback
            </p>
          </div>
          <button
            onClick={() => setNewFeedbackAlert(false)}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            User feedback and suggestions
          </p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{feedbackList.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Read</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {feedbackList.filter(f => f.read).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600">
              <Pin className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pinned</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {feedbackList.filter(f => f.pinned).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Rating</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {feedbackList.length > 0
                  ? (feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbackList.length).toFixed(1)
                  : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
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
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('pinned')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pinned'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Pinned
        </button>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <div className="card text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No feedback yet</p>
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div
              key={item.id}
              className={`card ${!item.read ? 'border-l-4 border-primary-500' : ''} ${
                item.pinned ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={item.rating || 0} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.date ? format(new Date(item.date), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </span>
                    {!item.read && (
                      <span className="badge-info">New</span>
                    )}
                    {item.pinned && (
                      <Pin className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  {item.username && (
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {item.username}
                    </p>
                  )}
                  {item.message && (
                    <p className="text-gray-700 dark:text-gray-300">{item.message}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {!item.read && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handlePin(item.id, item.pinned)}
                    className={`p-2 rounded-lg transition-colors ${
                      item.pinned
                        ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={item.pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
