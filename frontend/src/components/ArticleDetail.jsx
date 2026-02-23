import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import {
    HiArrowLeft, HiClock, HiExternalLink, HiBookmark,
    HiEmojiHappy, HiEmojiSad, HiMinus
} from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import { formatDate, getReadingTime, categoryColors } from '../lib/newsUtils'

function ArticleDetail() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const { isAuthenticated, isBookmarked, addBookmark, removeBookmark, recordRead } = useAuth()

    const [bookmarkLoading, setBookmarkLoading] = useState(false)

    const article = state?.article

    // Track read
    useEffect(() => {
        if (!article) return
        if (isAuthenticated) {
            recordRead(article)
        }
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


                </div>
            </div>
        </div>
    )
}

export default ArticleDetail

