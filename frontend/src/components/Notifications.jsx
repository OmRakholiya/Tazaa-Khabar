import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  HiMail, HiDeviceMobile, HiCheck, HiX, HiInformationCircle,
  HiRefresh, HiPaperAirplane, HiSelector
} from 'react-icons/hi'
import LoadingSpinner from './LoadingSpinner'
import API_BASE from '../lib/api'
import NeonCheckbox from './NeonCheckbox'

function Notifications() {
  const [articles, setArticles] = useState([])
  const [selectedArticles, setSelectedArticles] = useState([])
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [notificationType, setNotificationType] = useState('email')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [selectionMode, setSelectionMode] = useState('manual') // 'manual' or 'auto'
  const [topCount, setTopCount] = useState(5)

  // Format date consistently with Articles page
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Unknown') return 'Recent'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      })
    } catch {
      return 'Recent'
    }
  }

  // Add sort key for consistent sorting
  const addSortKey = (article) => ({
    ...article,
    _sortKey: new Date(article.published === 'Unknown' ? article.fetched_at : article.published).getTime()
  })

  // Fetch articles on component mount
  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/articles`)
      // Add sort key and sort by published date (newest first)
      const sortedArticles = (res.data.articles || [])
        .map(addSortKey)
        .sort((a, b) => b._sortKey - a._sortKey)

      setArticles(sortedArticles)
    } catch (err) {
      console.error('Failed to fetch articles:', err)
      setMessage('Failed to fetch articles')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleArticleSelect = (articleIndex) => {
    setSelectedArticles(prev => {
      if (prev.includes(articleIndex)) {
        return prev.filter(i => i !== articleIndex)
      } else {
        return [...prev, articleIndex]
      }
    })
  }

  const selectAllArticles = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([])
    } else {
      setSelectedArticles(articles.map((_, index) => index))
    }
  }

  const selectTopArticles = (count) => {
    // Since articles are already sorted by date, we can just take the first N
    const topIndices = Array.from({ length: Math.min(count, articles.length) }, (_, i) => i)
    setSelectedArticles(topIndices)
  }

  const sendNotifications = async () => {
    let articlesToSend = []

    if (selectionMode === 'auto') {
      if (topCount <= 0 || topCount > articles.length) {
        setMessage(`Please enter a valid number between 1 and ${articles.length}`)
        setMessageType('error')
        return
      }
      articlesToSend = articles.slice(0, topCount)
    } else {
      if (selectedArticles.length === 0) {
        setMessage('Please select at least one article')
        setMessageType('error')
        return
      }
      articlesToSend = selectedArticles.map(index => articles[index])
    }

    if (notificationType === 'email' && !email) {
      setMessage('Please enter an email address')
      setMessageType('error')
      return
    }

    if (notificationType === 'whatsapp' && !whatsapp) {
      setMessage('Please enter a WhatsApp number')
      setMessageType('error')
      return
    }

    setSending(true)
    setMessage('')

    try {
      const endpoint = notificationType === 'email' ? '/send-email' : '/send-whatsapp'
      const payload = {
        articles: articlesToSend,
        [notificationType]: notificationType === 'email' ? email : whatsapp
      }

      const response = await axios.post(`${API_BASE}${endpoint}`, payload)

      setMessage(`Successfully sent ${articlesToSend.length} articles via ${notificationType}!`)
      setMessageType('success')
      if (selectionMode === 'manual') {
        setSelectedArticles([])
      }

    } catch (err) {
      console.error('Failed to send notifications:', err)
      setMessage(`Failed to send notifications: ${err.response?.data?.detail || err.message}`)
      setMessageType('error')
    } finally {
      setSending(false)
    }
  }


  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div className="header-content">
          <div className="header-left">
            <HiPaperAirplane size={32} className="header-icon" />
            <div>
              <h1>News Notifications</h1>
              <p>Select articles and send them via email or WhatsApp</p>
            </div>
          </div>
          <button onClick={fetchArticles} disabled={loading} className="refresh-btn">
            <HiRefresh size={16} className={loading ? 'spinning' : ''} />
            Refresh Articles
          </button>
        </div>
      </div>

      <div className="notifications-layout">
        {/* Left Configuration Panel - Fixed */}
        <div className="notification-settings-panel">
          <div className="settings-content">
            <h3>Notification Settings</h3>

            {/* Notification Type Selection */}
            <div className="form-group">
              <label>Notification Type</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="email"
                    checked={notificationType === 'email'}
                    onChange={(e) => setNotificationType(e.target.value)}
                  />
                  <HiMail size={20} />
                  Email
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="whatsapp"
                    checked={notificationType === 'whatsapp'}
                    onChange={(e) => setNotificationType(e.target.value)}
                  />
                  <HiDeviceMobile size={20} />
                  WhatsApp
                </label>
              </div>
            </div>

            {/* Contact Input */}
            <div className="form-group">
              {notificationType === 'email' ? (
                <>
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="form-input"
                  />
                </>
              ) : (
                <>
                  <label htmlFor="whatsapp">WhatsApp Number</label>
                  <input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Enter WhatsApp number (e.g., +1234567890)"
                    className="form-input"
                  />
                </>
              )}
            </div>

            {/* Selection Mode */}
            <div className="form-group">
              <label>Selection Mode</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="manual"
                    checked={selectionMode === 'manual'}
                    onChange={(e) => setSelectionMode(e.target.value)}
                  />
                  <HiSelector size={20} />
                  Manual Selection
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="auto"
                    checked={selectionMode === 'auto'}
                    onChange={(e) => setSelectionMode(e.target.value)}
                  />
                  📊
                  Top N Articles
                </label>
              </div>
            </div>

            {/* Auto Selection - Top N Input */}
            {selectionMode === 'auto' && (
              <div className="form-group">
                <label htmlFor="topCount">Number of Articles to Send</label>
                <input
                  id="topCount"
                  type="number"
                  min="1"
                  max={articles.length}
                  value={topCount}
                  onChange={(e) => setTopCount(parseInt(e.target.value) || 1)}
                  placeholder="Enter number (e.g., 5, 10)"
                  className="form-input"
                />
                <small className="input-hint">Will send the {topCount} most recent articles</small>
              </div>
            )}

            {/* Manual Selection Summary */}
            {selectionMode === 'manual' && (
              <div className="selection-summary">
                <div className="summary-header">
                  <span>Selected Articles: {selectedArticles.length}</span>
                  <button onClick={selectAllArticles} className="select-all-btn">
                    {selectedArticles.length === articles.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="quick-select-buttons">
                  <button onClick={() => selectTopArticles(5)} className="quick-select-btn">
                    Top 5
                  </button>
                  <button onClick={() => selectTopArticles(10)} className="quick-select-btn">
                    Top 10
                  </button>
                  <button onClick={() => selectTopArticles(20)} className="quick-select-btn">
                    Top 20
                  </button>
                </div>
              </div>
            )}

            {/* Auto Selection Summary */}
            {selectionMode === 'auto' && (
              <div className="selection-summary">
                <div className="summary-header">
                  <span>Will send top {topCount} articles</span>
                </div>
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={sendNotifications}
              disabled={sending || (selectionMode === 'manual' && selectedArticles.length === 0) || (selectionMode === 'auto' && (topCount <= 0 || topCount > articles.length))}
              className="send-btn"
            >
              {sending ? (
                <>
                  <LoadingSpinner size="small" />
                  Sending...
                </>
              ) : (
                <>
                  <HiPaperAirplane size={16} />
                  Send {selectionMode === 'auto' ? topCount : selectedArticles.length} Article{(selectionMode === 'auto' ? topCount : selectedArticles.length) !== 1 ? 's' : ''}
                </>
              )}
            </button>

            {/* Status Message */}
            {message && (
              <div className={`status-message ${messageType}`}>
                {messageType === 'success' ? <HiCheck size={16} /> : <HiX size={16} />}
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Right Articles Section - Scrollable */}
        <div className="articles-main-section">
          <div className="articles-header-section">
            <h3>Available Articles ({articles.length})</h3>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LoadingSpinner size="small" />
                <span className="loading-text">Loading articles...</span>
              </div>
            )}
          </div>

          <div className="articles-scrollable-list">
            {articles.length === 0 && !loading ? (
              <div className="empty-state">
                <HiInformationCircle size={48} />
                <p>No articles available. Try refreshing or scraping new articles.</p>
              </div>
            ) : (
              articles.map((article, index) => (
                <div
                  key={index}
                  className={`article-item ${selectedArticles.includes(index) ? 'selected' : ''}`}
                  onClick={() => handleArticleSelect(index)}
                >
                  <div className="article-checkbox">
                    <NeonCheckbox
                      checked={selectedArticles.includes(index)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleArticleSelect(index);
                      }}
                      aria-label={article.title}
                    />
                  </div>
                  <div className="article-content">
                    <div className="article-meta">
                      <span className="article-source">{article.source}</span>
                      <span className="article-date">{formatDate(article.published)}</span>
                    </div>
                    <h4 className="article-title">{article.title}</h4>
                    <p className="article-summary">{article.summary}</p>
                  </div>
                  <div className="selection-indicator">
                    {selectedArticles.includes(index) && <HiCheck size={20} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
