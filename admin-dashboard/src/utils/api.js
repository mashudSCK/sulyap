// API utility for making requests to the backend
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const api = {
  // Get admin statistics
  async getStats() {
    try {
      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  },

  // Get feedback list
  async getFeedback() {
    try {
      const response = await fetch(`${API_BASE}/api/admin/feedback`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  },

  // Update feedback status
  async updateFeedback(id, updates) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(updates)
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating feedback:', error);
      return null;
    }
  },

  // Delete feedback
  async deleteFeedback(id) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/feedback/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      return null;
    }
  },

  // Get system logs
  async getLogs(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE}/api/admin/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
  },

  // Export data
  async exportData(type) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/export/${type}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  },

  // Admin login
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      return await response.json();
    } catch (error) {
      console.error('Error logging in:', error);
      return { error: 'Login failed' };
    }
  }
};

export default api;
