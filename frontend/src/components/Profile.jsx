import { useState, useEffect } from 'react'
import axios from 'axios'
import { HiUser, HiBookmark, HiClock, HiTrendingUp, HiStar, HiCalendar, HiNewspaper } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import API_BASE from '../lib/api'
import { categoryColors, formatDate } from '../lib/newsUtils'
import LoadingSpinner from './LoadingSpinner'

function Profile() {
    const { user, token, isAuthenticated, bookmarks, removeBookmark } = useAuth()
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        fetchProfileData()
    }, [isAuthenticated])

    const fetchProfileData = async () => {
        try {
            const headers = { Authorization: `Bearer ${token}` }
            const [profileRes, historyRes] = await Promise.all([
                axios.get(`${API_BASE}/auth/profile`, { headers }),
                axios.get(`${API_BASE}/auth/history`, { headers })
            ])
            setProfile(profileRes.data.profile)
            const historyData = historyRes.data.history || []
            // Sort by read_at descending (newest first)
            setHistory(historyData.sort((a, b) => new Date(b.read_at) - new Date(a.read_at)))
        } catch (err) {
            console.error('Failed to load profile:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveBookmark = async (articleTitle) => {
        try {
            await removeBookmark(articleTitle)
        } catch (err) {
            console.error('Failed to remove bookmark:', err)
        }
    }

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">
                    <LoadingSpinner size="medium" />
                    <p>Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="profile-page">
                <div className="profile-error">
                    <p>Failed to load profile data.</p>
                    <button onClick={fetchProfileData}>Retry</button>
                </div>
            </div>
        )
    }

    const memberSince = profile.member_since
        ? new Date(profile.member_since).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Recently joined'

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Header */}
                <div className="profile-header">
                    <div className="profile-avatar">
                        <HiUser size={48} />
                    </div>
                    <div className="profile-info">
                        <h1>{profile.name}</h1>
                        <p className="profile-email">{profile.email}</p>
                        <p className="profile-joined"><HiCalendar size={14} /> Member since {memberSince}</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="profile-stats-grid">
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon" style={{ background: 'rgba(124, 156, 255, 0.15)', color: '#7c9cff' }}>
                            <HiNewspaper size={24} />
                        </div>
                        <div className="profile-stat-info">
                            <span className="profile-stat-value">{profile.total_reads}</span>
                            <span className="profile-stat-label">Articles Read</span>
                        </div>
                    </div>
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon" style={{ background: 'rgba(124, 92, 255, 0.15)', color: '#7c5cff' }}>
                            <HiBookmark size={24} />
                        </div>
                        <div className="profile-stat-info">
                            <span className="profile-stat-value">{profile.total_bookmarks}</span>
                            <span className="profile-stat-label">Bookmarks</span>
                        </div>
                    </div>
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                            <HiStar size={24} />
                        </div>
                        <div className="profile-stat-info">
                            <span className="profile-stat-value">{profile.favorite_category}</span>
                            <span className="profile-stat-label">Favorite Category</span>
                        </div>
                    </div>
                    <div className="profile-stat-card">
                        <div className="profile-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                            <HiTrendingUp size={24} />
                        </div>
                        <div className="profile-stat-info">
                            <span className="profile-stat-value">{Object.keys(profile.category_breakdown || {}).length}</span>
                            <span className="profile-stat-label">Categories Explored</span>
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                {profile.category_breakdown && Object.keys(profile.category_breakdown).length > 0 && (
                    <div className="profile-section">
                        <h2><HiTrendingUp size={20} /> Reading Breakdown</h2>
                        <div className="category-breakdown-grid">
                            {Object.entries(profile.category_breakdown)
                                .sort(([, a], [, b]) => b - a)
                                .map(([cat, count]) => (
                                    <div key={cat} className="breakdown-item">
                                        <div className="breakdown-bar-wrapper">
                                            <span className="breakdown-label">{cat}</span>
                                            <span className="breakdown-count">{count}</span>
                                        </div>
                                        <div className="breakdown-bar">
                                            <div
                                                className="breakdown-bar-fill"
                                                style={{
                                                    width: `${Math.round((count / profile.total_reads) * 100)}%`,
                                                    backgroundColor: categoryColors[cat] || '#6b7280'
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="profile-tabs">
                    <button
                        className={activeTab === 'overview' ? 'active' : ''}
                        onClick={() => setActiveTab('overview')}
                    >
                        <HiClock size={16} /> Reading History
                    </button>
                    <button
                        className={activeTab === 'bookmarks' ? 'active' : ''}
                        onClick={() => setActiveTab('bookmarks')}
                    >
                        <HiBookmark size={16} /> Bookmarks
                    </button>
                </div>

                {/* Tab Content */}
                <div className="profile-tab-content">
                    {activeTab === 'overview' && (
                        <div className="profile-list">
                            {history.length === 0 ? (
                                <p className="profile-empty">No reading history yet. Start reading articles!</p>
                            ) : (
                                history.slice(0, 7).map((item, i) => (
                                    <div key={i} className="profile-list-item">
                                        <div className="profile-list-dot" style={{ backgroundColor: categoryColors[item.article_category] || '#6b7280' }} />
                                        <div className="profile-list-info">
                                            <h4>{item.article_title}</h4>
                                            <div className="profile-list-meta">
                                                <span>{item.article_source}</span>
                                                <span className="profile-list-cat">{item.article_category}</span>
                                                <span><HiClock size={12} /> {formatDate(item.read_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'bookmarks' && (
                        <div className="profile-list">
                            {bookmarks.length === 0 ? (
                                <p className="profile-empty">No bookmarks yet. Bookmark articles to save them here!</p>
                            ) : (
                                bookmarks.map((item, i) => (
                                    <div key={i} className="profile-list-item">
                                        <div className="profile-list-dot bookmark-dot" />
                                        <div className="profile-list-info">
                                            <h4>{item.article_title}</h4>
                                            <div className="profile-list-meta">
                                                <span>{item.article_source}</span>
                                                {item.article_link && (
                                                    <a href={item.article_link} target="_blank" rel="noopener noreferrer" className="profile-list-link">
                                                        Read →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveBookmark(item.article_title)}
                                            className="bookmark-remove-btn"
                                            title="Remove bookmark"
                                        >
                                            <HiBookmark size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Profile
