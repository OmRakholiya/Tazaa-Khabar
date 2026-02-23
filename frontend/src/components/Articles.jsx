import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  HiClock, HiExternalLink, HiRefresh, HiInformationCircle,
  HiFilter, HiX, HiEmojiHappy, HiEmojiSad, HiMinus, HiOutlineNewspaper,
  HiBookmark, HiSparkles
} from 'react-icons/hi'
import LoadingSpinner from './LoadingSpinner'
import SearchBar from './SearchBar'

import API_BASE from '../lib/api'
import { processArticles, formatDate, categoryColors } from '../lib/newsUtils'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import './Articles.css'

function Articles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aboutInfo, setAboutInfo] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [totalArticles, setTotalArticles] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [liveMode, setLiveMode] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [tldrMap, setTldrMap] = useState({})
  const [tldrLoading, setTldrLoading] = useState({})

  const prevArticleCount = useRef(0)
  const { isAuthenticated, isBookmarked, addBookmark, removeBookmark } = useAuth()
  const { addToast } = useToast()

  const categories = ['All', 'Politics', 'Technology', 'Business', 'Sports', 'Entertainment', 'Health', 'Education', 'International', 'Other']



  // Fetch articles from DB
  const fetchArticlesFromDB = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`${API_BASE}/articles`)
      const processed = processArticles(res.data.articles || [])
      const newCount = processed.length
      const oldCount = prevArticleCount.current

      setArticles(processed)
      setTotalArticles(res.data.total || processed.length)
      setLastRefreshed(new Date())

      // If this is a live-mode refresh, show toast about new articles
      if (silent && newCount > oldCount) {
        const diff = newCount - oldCount
        addToast(`📰 ${diff} new article${diff > 1 ? 's' : ''} arrived!`, 'news', 6000)
        // Browser notification too
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('📰 Taaza Khabar', { body: `${diff} new articles just in!` })
        }
      } else if (silent && newCount === oldCount) {
        addToast('No new articles yet — checking again in 5 min', 'info', 3000)
      }

      prevArticleCount.current = newCount
    } catch (err) {
      console.error(err)
      if (!silent) setError('Failed to fetch articles')
      if (silent) addToast('⚠️ Failed to refresh articles', 'warning', 4000)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [addToast])

  const fetchAbout = async () => {
    try { const res = await axios.get(`${API_BASE}/About`); setAboutInfo(res.data) }
    catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchAbout()
    fetchArticlesFromDB()
  }, [fetchArticlesFromDB])

  // Live mode: auto-refresh every 5 minutes with toast notifications
  useEffect(() => {
    if (!liveMode) return
    addToast('🔴 Live Mode ON — auto-refreshing every 5 minutes', 'success', 4000)
    const interval = setInterval(() => {
      fetchArticlesFromDB(true) // silent=true to use toast instead of loading spinner
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [liveMode, fetchArticlesFromDB, addToast])

  const enableLiveMode = () => {
    const newMode = !liveMode
    setLiveMode(newMode)
    if (newMode) {
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    } else {
      addToast('Live Mode turned off', 'info', 3000)
    }
  }

  const getArticlesToDisplay = () => {
    return articles.filter(a => {
      const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory
      const matchesSearch = !searchQuery ||
        a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.source?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }

  const getCategoryCount = (cat) => {
    return cat === 'All' ? articles.length : articles.filter(a => a.category === cat).length
  }

  const quickScrape = async () => {
    setLoading(true)
    try {
      await axios.post(`${API_BASE}/scrape?n=20`)
      await fetchArticlesFromDB()
      addToast(`✅ Quick Scraped 20 new articles!`, 'success', 5000)
    } catch (err) {
      console.error(err)
      setError('Failed to scrape news')
      addToast('⚠️ Scraping failed', 'warning', 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleBookmark = async (e, article) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      if (isBookmarked(article.title)) {
        await removeBookmark(article.title)
        addToast('Bookmark removed', 'info', 2000)
      } else {
        await addBookmark(article)
        addToast('📌 Article bookmarked!', 'success', 2000)
      }
    } catch (err) {
      console.error('Bookmark error:', err)
    }
  }

  const handleTldr = async (e, article) => {
    e.preventDefault()
    e.stopPropagation()
    const key = article.title
    if (tldrMap[key]) {
      setTldrMap(prev => { const n = { ...prev }; delete n[key]; return n })
      return
    }
    setTldrLoading(prev => ({ ...prev, [key]: true }))
    try {
      const res = await axios.post(`${API_BASE}/summarize`, {
        title: article.title,
        summary: article.summary || ''
      })
      setTldrMap(prev => ({ ...prev, [key]: res.data.tldr }))
    } catch (err) {
      setTldrMap(prev => ({ ...prev, [key]: 'Failed to generate summary. Try again.' }))
    } finally {
      setTldrLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const displayArticles = getArticlesToDisplay()

  return (
    <div className="articles-page">
      {/* Header Controls */}
      <div className="articles-header">
        <div className="header-controls">
          {/* Left side */}
          <div className="left-controls">
            <button onClick={() => setShowSidePanel(!showSidePanel)} className="control-btn">
              <HiFilter size={16} /> Filters
            </button>
            <button
              onClick={enableLiveMode}
              className={`control-btn ${liveMode ? 'live-active' : ''}`}
              title="Auto-refresh every 5 minutes"
            >
              <span className={`live-dot ${liveMode ? 'pulse' : ''}`} />
              {liveMode ? 'Live' : 'Live Mode'}
            </button>
            <button onClick={() => fetchArticlesFromDB()} disabled={loading} className="control-btn" title="Refresh articles">
              <HiRefresh size={16} className={loading ? 'spinning' : ''} />
            </button>
            <button onClick={quickScrape} disabled={loading} className="control-btn primary" title="Quick Scrape (20 articles)">
              <HiOutlineNewspaper size={16} /> Quick Scrape
            </button>
          </div>

          <SearchBar
            articles={articles}
            onFilter={setSearchQuery}
            className="articles-search"
          />
        </div>

      </div>

      {/* Content */}
      <div className="content-wrapper">
        {showSidePanel && (
          <aside className={`side-panel ${showSidePanel ? 'show' : ''}`}>
            <div className="side-panel-header">
              <h3>Filters</h3>
              <button onClick={() => setShowSidePanel(false)}><HiX size={20} /></button>
            </div>

            {/* Categories — now link to dedicated pages too */}
            <div className="filter-section">
              <h4>Categories</h4>
              {categories.map(cat => (
                <div key={cat} className="filter-row">
                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className={selectedCategory === cat ? 'active' : ''}
                    style={{
                      backgroundColor: selectedCategory === cat ? categoryColors[cat] : 'var(--muted-surface)',
                      color: selectedCategory === cat ? '#fff' : 'var(--text)',
                      flex: 1
                    }}
                  >
                    {cat} ({getCategoryCount(cat)})
                  </button>
                  {cat !== 'All' && cat !== 'Other' && (
                    <Link
                      to={`/category/${cat.toLowerCase()}`}
                      className="filter-page-link"
                      title={`Go to ${cat} page`}
                    >
                      →
                    </Link>
                  )}
                </div>
              ))}
            </div>


          </aside>
        )}

        <main className={`main-content ${showSidePanel ? 'with-side-panel' : ''}`}>
          {/* Results info */}
          {(searchQuery || selectedCategory !== 'All') && (
            <div className="results-info">
              Showing {displayArticles.length} of {articles.length} articles
              {searchQuery && <span> matching "<strong>{searchQuery}</strong>"</span>}
              <button onClick={() => { setSelectedCategory('All'); setSearchQuery('') }} className="clear-all-btn">
                <HiX size={14} /> Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <LoadingSpinner size="medium" />
              <p>Loading articles...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => fetchArticlesFromDB()} className="retry-btn">Retry</button>
            </div>
          ) : displayArticles.length === 0 ? (
            <div className="no-articles">
              <p>No articles found matching your filters.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery('') }}
                className="clear-filters-btn"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="articles-grid">
              {displayArticles.map((a, i) => (
                <Link
                  key={`${a.title}-${a.source}`}
                  to={`/article/${i}`}
                  state={{ article: a, relatedArticles: displayArticles.filter(ra => ra.category === a.category && ra.title !== a.title) }}
                  className="article-card-link"
                >
                  <article className="article-card">
                    <div className="article-card-top">
                      <span className="source">{a.source}</span>
                      <span className="article-category-dot" style={{ backgroundColor: categoryColors[a.category] || '#6b7280' }} title={a.category} />
                    </div>
                    <h2>{a.title}</h2>
                    <p>{a.summary}</p>
                    <div className="article-card-footer">
                      <span className="article-date"><HiClock size={12} /> {formatDate(a.published)}</span>
                      <span className="article-reading-time">{a.readingTime}</span>

                      <button
                        onClick={(e) => handleTldr(e, a)}
                        className={`tldr-btn ${tldrMap[a.title] ? 'active' : ''}`}
                        title="AI Summary"
                        disabled={tldrLoading[a.title]}
                      >
                        <HiSparkles size={14} />{tldrLoading[a.title] ? '...' : ''}
                      </button>
                      {isAuthenticated && (
                        <button
                          onClick={(e) => handleBookmark(e, a)}
                          className={`bookmark-btn ${isBookmarked(a.title) ? 'bookmarked' : ''}`}
                          title={isBookmarked(a.title) ? 'Remove bookmark' : 'Add bookmark'}
                        >
                          <HiBookmark size={16} />
                        </button>
                      )}
                    </div>
                    {tldrMap[a.title] && (
                      <div className="tldr-summary">
                        <span className="tldr-label"><HiSparkles size={12} /> AI Detailed Insights</span>
                        <p style={{ whiteSpace: 'pre-line' }}>{tldrMap[a.title]}</p>
                      </div>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      {aboutInfo && <footer className="footer"><HiInformationCircle size={16} /> {aboutInfo.project} v{aboutInfo.version} • By {aboutInfo.developer}</footer>}


    </div>
  )
}

export default Articles
