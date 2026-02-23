import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import {
    HiArrowLeft, HiClock, HiExternalLink, HiBookmark,
    HiEmojiHappy, HiEmojiSad, HiMinus, HiGlobeAlt, HiSparkles
} from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import { formatDate, getReadingTime, categoryColors, processArticles } from '../lib/newsUtils'
import API_BASE from '../lib/api'
import LoadingSpinner from './LoadingSpinner'

function ArticleDetail() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const { isAuthenticated, isBookmarked, addBookmark, removeBookmark, recordRead } = useAuth()

    const [bookmarkLoading, setBookmarkLoading] = useState(false)
    const [aiRelated, setAiRelated] = useState([])
    const [relatedLoading, setRelatedLoading] = useState(false)

    const article = state?.article
    const fallbackRelated = state?.relatedArticles || []

    // Track read & fetch AI related articles
    useEffect(() => {
        if (!article) return

        // Record read
        if (isAuthenticated) {
            recordRead(article)
        }

        // Fetch AI-related articles
        const fetchRelated = async () => {
            setRelatedLoading(true)
            try {
                const res = await axios.post(`${API_BASE}/related`, {
                    title: article.title,
                    category: article.category || 'Other',
                    summary: article.summary || ''
                })
                const processed = processArticles(res.data.related || [])
                setAiRelated(processed.filter(r => r.title !== article.title).slice(0, 6))
            } catch (err) {
                console.error('Failed to fetch AI related:', err)
                setAiRelated([])
            } finally {
                setRelatedLoading(false)
            }
        }
        fetchRelated()
    }, [article?.title])

    if (!article) {
        return (
            <div className="article-detail-page">
                <div className="article-detail-empty">
                    <h2>Article not found</h2>
                    <p>Please navigate from the articles page.</p>
                    <Link to="/articles" className="back-link">
                        <HiArrowLeft size={16} /> Back to Articles
                    </Link>
                </div>
            </div>
        )
    }


    const handleBookmark = async () => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        setBookmarkLoading(true)
        try {
            if (isBookmarked(article.title)) {
                await removeBookmark(article.title)
            } else {
                await addBookmark(article)
            }
        } catch (err) {
            console.error('Bookmark error:', err)
        } finally {
            setBookmarkLoading(false)
        }
    }

    const getSentimentIcon = (s) => {
        if (s === 'positive') return <HiEmojiHappy size={18} />
        if (s === 'negative') return <HiEmojiSad size={18} />
        return <HiMinus size={18} />
    }

    const getSentimentLabel = (s) => {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Neutral'
    }

    const getSentimentColor = (s) => {
        if (s === 'positive') return '#10b981'
        if (s === 'negative') return '#ef4444'
        return '#6b7280'
    }

    const bookmarked = isAuthenticated && isBookmarked(article.title)
    const relatedToShow = aiRelated.length > 0 ? aiRelated : fallbackRelated

    return (
        <div className="article-detail-page">
            <div className="article-detail-container">
                {/* Back button */}
                <button onClick={() => navigate(-1)} className="detail-back-btn">
                    <HiArrowLeft size={18} /> Back
                </button>

                {/* Main content */}
                <div className="article-detail-layout">
                    <div className="article-detail-main">
                        {/* Meta */}
                        <div className="detail-meta">
                            <span
                                className="detail-category-badge"
                                style={{ backgroundColor: categoryColors[article.category] || '#6b7280' }}
                            >
                                {article.category || 'Other'}
                            </span>
                            <span className="detail-source">{article.source}</span>
                            <span className="detail-date"><HiClock size={14} /> {formatDate(article.published)}</span>
                            <span className="detail-reading-time">{article.readingTime || getReadingTime(article.summary)}</span>
                        </div>

                        {/* Title */}
                        <h1 className="detail-title">{article.title}</h1>

                        {/* Sentiment badge */}
                        <div className="detail-sentiment" style={{ color: getSentimentColor(article.sentiment) }}>
                            {getSentimentIcon(article.sentiment)}
                            <span>{getSentimentLabel(article.sentiment)} Sentiment</span>
                        </div>

                        {/* Summary / Content */}
                        <div className="detail-content">
                            <p>{article.summary}</p>
                        </div>

                        {/* Read full article */}
                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="detail-read-full">
                            <HiExternalLink size={18} /> Read Full Article on {article.source}
                        </a>

                        {/* Action bar */}
                        <div className="detail-actions">
                            <button
                                onClick={handleBookmark}
                                disabled={bookmarkLoading}
                                className={`detail-action-btn ${bookmarked ? 'bookmarked' : ''}`}
                            >
                                <HiBookmark size={18} />
                                {bookmarked ? 'Bookmarked' : 'Bookmark'}
                            </button>


                        </div>
                    </div>

                    {/* Sidebar - AI Related Articles */}
                    <aside className="article-detail-sidebar">
                        <h3>
                            <HiSparkles size={18} /> AI-Suggested Related
                        </h3>
                        {relatedLoading ? (
                            <div className="related-loading">
                                <LoadingSpinner size="small" />
                                <p>Finding related articles...</p>
                            </div>
                        ) : relatedToShow.length > 0 ? (
                            relatedToShow.slice(0, 6).map((ra, i) => (
                                <Link
                                    key={i}
                                    to={`/article/${i}`}
                                    state={{ article: ra, relatedArticles: relatedToShow.filter((_, j) => j !== i) }}
                                    className="related-article-card"
                                >
                                    <span className="related-source">{ra.source}</span>
                                    <h4>{ra.title}</h4>
                                    <span className="related-date">{formatDate(ra.published)}</span>
                                </Link>
                            ))
                        ) : (
                            <p className="no-related">No related articles found.</p>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default ArticleDetail

