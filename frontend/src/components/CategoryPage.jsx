import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import {
    HiClock, HiEmojiHappy, HiEmojiSad, HiMinus, HiBookmark,
    HiArrowLeft, HiGlobeAlt, HiChartBar, HiExternalLink
} from 'react-icons/hi'
import LoadingSpinner from './LoadingSpinner'
import SearchBar from './SearchBar'
import API_BASE from '../lib/api'
import { processArticles, formatDate, categoryColors, categoryKeywords } from '../lib/newsUtils'
import { useAuth } from '../context/AuthContext'

// Category metadata for hero sections
const categoryMeta = {
    Politics: {
        icon: '🏛️',
        gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
        tagline: 'Government, elections, policy & governance',
        emoji: '🗳️'
    },
    Technology: {
        icon: '💻',
        gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e3a8a 100%)',
        tagline: 'Innovation, AI, startups & digital world',
        emoji: '🚀'
    },
    Business: {
        icon: '📈',
        gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)',
        tagline: 'Markets, economy, finance & trade',
        emoji: '💰'
    },
    Sports: {
        icon: '⚽',
        gradient: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
        tagline: 'Cricket, football, Olympics & championships',
        emoji: '🏆'
    },
    Entertainment: {
        icon: '🎬',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)',
        tagline: 'Bollywood, music, celebrities & streaming',
        emoji: '🌟'
    },
    Health: {
        icon: '🏥',
        gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 50%, #831843 100%)',
        tagline: 'Medicine, fitness, mental health & wellness',
        emoji: '💊'
    },
    Education: {
        icon: '📚',
        gradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)',
        tagline: 'Schools, exams, universities & learning',
        emoji: '🎓'
    },
    International: {
        icon: '🌍',
        gradient: 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #881337 100%)',
        tagline: 'World affairs, diplomacy & global news',
        emoji: '🌐'
    }
}

function CategoryPage() {
    const { categoryName } = useParams()
    const [articles, setArticles] = useState([])
    const [allArticles, setAllArticles] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const { isAuthenticated, isBookmarked, addBookmark, removeBookmark } = useAuth()

    // Normalize category name from URL
    const category = categoryName ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase() : ''
    const meta = categoryMeta[category] || {
        icon: '📰',
        gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%)',
        tagline: 'Latest news and updates',
        emoji: '📰'
    }

    const fetchArticles = useCallback(async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API_BASE}/articles`)
            const processed = processArticles(res.data.articles || [])
            setAllArticles(processed)
            setArticles(processed.filter(a => a.category === category))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [category])

    useEffect(() => {
        fetchArticles()
    }, [fetchArticles])

    const getSentimentIcon = (s) => {
        if (s === 'positive') return <HiEmojiHappy size={14} />
        if (s === 'negative') return <HiEmojiSad size={14} />
        return <HiMinus size={14} />
    }

    const getSentimentColor = (s) => {
        if (s === 'positive') return '#10b981'
        if (s === 'negative') return '#ef4444'
        return '#6b7280'
    }

    const handleBookmark = async (e, article) => {
        e.preventDefault()
        e.stopPropagation()
        try {
            if (isBookmarked(article.title)) {
                await removeBookmark(article.title)
            } else {
                await addBookmark(article)
            }
        } catch (err) { console.error(err) }
    }

    const filteredArticles = searchQuery
        ? articles.filter(a =>
            a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.summary?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : articles

    // Stats
    const positiveCount = articles.filter(a => a.sentiment === 'positive').length
    const negativeCount = articles.filter(a => a.sentiment === 'negative').length
    const neutralCount = articles.filter(a => a.sentiment === 'neutral').length
    const uniqueSources = new Set(articles.map(a => a.source)).size

    // Other categories for sidebar nav
    const otherCategories = Object.keys(categoryMeta).filter(c => c !== category)

    return (
        <div className="category-page">
            {/* Hero Section */}
            <section className="category-hero" style={{ background: meta.gradient }}>
                <div className="category-hero-content">
                    <Link to="/articles" className="category-back-link">
                        <HiArrowLeft size={16} /> All Articles
                    </Link>

                    <h1>{category} News</h1>
                    <p>{meta.tagline}</p>
                    <div className="category-hero-stats">
                        <span>{meta.emoji} {articles.length} articles</span>
                        <span>📰 {uniqueSources} sources</span>
                        <span>😊 {positiveCount} positive</span>
                        <span>😟 {negativeCount} negative</span>
                    </div>
                </div>
                {/* Decorative shapes */}
                <div className="category-hero-decor">
                    <div className="hero-circle hero-circle-1" />
                    <div className="hero-circle hero-circle-2" />
                    <div className="hero-circle hero-circle-3" />
                </div>
            </section>

            {/* Content */}
            <div className="category-content">
                {/* Main area */}
                <div className="category-main">
                    {/* Search */}
                    <div className="category-toolbar">
                        <SearchBar
                            articles={articles}
                            onFilter={setSearchQuery}
                            className="category-search"
                        />
                        <span className="category-result-count">
                            {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Articles */}
                    {loading ? (
                        <div className="loading-container">
                            <LoadingSpinner size="medium" />
                            <p>Loading {category} news...</p>
                        </div>
                    ) : filteredArticles.length === 0 ? (
                        <div className="no-articles">
                            <p>No {category} articles found.</p>
                            <Link to="/articles" className="clear-filters-btn">View all articles</Link>
                        </div>
                    ) : (
                        <div className="articles-grid">
                            {filteredArticles.map((a, i) => (
                                <Link
                                    key={`${a.title}-${a.source}`}
                                    to={`/article/${i}`}
                                    state={{
                                        article: a,
                                        relatedArticles: articles.filter(ra => ra.title !== a.title).slice(0, 6)
                                    }}
                                    className="article-card-link"
                                >
                                    <article className="article-card" style={{ borderTop: `3px solid ${categoryColors[category] || '#6b7280'}` }}>
                                        <div className="article-card-top">
                                            <span className="source">{a.source}</span>
                                            <span className="article-category-dot" style={{ backgroundColor: categoryColors[category] }} title={category} />
                                        </div>
                                        <h2>{a.title}</h2>
                                        <p>{a.summary}</p>
                                        <div className="article-card-footer">
                                            <span className="article-date"><HiClock size={12} /> {formatDate(a.published)}</span>
                                            <span className="article-reading-time">{a.readingTime}</span>
                                            <span className="sentiment-badge" style={{ backgroundColor: getSentimentColor(a.sentiment) }}>
                                                {getSentimentIcon(a.sentiment)}
                                            </span>
                                            {isAuthenticated && (
                                                <button
                                                    onClick={(e) => handleBookmark(e, a)}
                                                    className={`bookmark-btn ${isBookmarked(a.title) ? 'bookmarked' : ''}`}
                                                >
                                                    <HiBookmark size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar - Browse other categories */}
                <aside className="category-sidebar">
                    <h3><HiGlobeAlt size={18} /> Browse Categories</h3>
                    {otherCategories.map(cat => {
                        const catMeta = categoryMeta[cat]
                        const catCount = allArticles.filter(a => a.category === cat).length
                        return (
                            <Link
                                key={cat}
                                to={`/category/${cat.toLowerCase()}`}
                                className="category-sidebar-link"
                                style={{ '--cat-color': categoryColors[cat] }}
                            >

                                <div className="cat-sidebar-info">
                                    <strong>{cat}</strong>
                                    <small>{catCount} article{catCount !== 1 ? 's' : ''}</small>
                                </div>
                                <HiChartBar size={14} className="cat-sidebar-arrow" />
                            </Link>
                        )
                    })}
                </aside>
            </div>
        </div>
    )
}

export default CategoryPage
