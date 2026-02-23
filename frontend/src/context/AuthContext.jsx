import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import API_BASE from '../lib/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(() => localStorage.getItem('taaza-khabar-token'))
    const [loading, setLoading] = useState(true)
    const [bookmarks, setBookmarks] = useState([])

    const authHeaders = useCallback(() => ({
        headers: { Authorization: `Bearer ${token}` }
    }), [token])

    // Verify token on mount
    useEffect(() => {
        if (token) {
            axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => {
                    setUser(res.data.user)
                    // Fetch bookmarks
                    return axios.get(`${API_BASE}/auth/bookmarks`, { headers: { Authorization: `Bearer ${token}` } })
                })
                .then(res => {
                    setBookmarks(res.data.bookmarks || [])
                })
                .catch(() => {
                    setToken(null)
                    setUser(null)
                    localStorage.removeItem('taaza-khabar-token')
                })
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const login = async (email, password) => {
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password })
        const { token: newToken, user: userData } = res.data
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('taaza-khabar-token', newToken)
        // Fetch bookmarks
        try {
            const bRes = await axios.get(`${API_BASE}/auth/bookmarks`, { headers: { Authorization: `Bearer ${newToken}` } })
            setBookmarks(bRes.data.bookmarks || [])
        } catch { /* ignore */ }
        return res.data
    }

    const signup = async (name, email, password) => {
        const res = await axios.post(`${API_BASE}/auth/signup`, { name, email, password })
        const { token: newToken, user: userData } = res.data
        setToken(newToken)
        setUser(userData)
        localStorage.setItem('taaza-khabar-token', newToken)
        return res.data
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        setBookmarks([])
        localStorage.removeItem('taaza-khabar-token')
    }

    const addBookmark = async (article) => {
        const res = await axios.post(`${API_BASE}/auth/bookmarks`, {
            article_title: article.title,
            article_source: article.source,
            article_summary: article.summary,
            article_link: article.link,
            article_published: article.published || 'Unknown'
        }, authHeaders())
        setBookmarks(prev => [...prev, {
            article_title: article.title,
            article_source: article.source,
            article_summary: article.summary,
            article_link: article.link,
            article_published: article.published || 'Unknown'
        }])
        return res.data
    }

    const removeBookmark = async (articleTitle) => {
        await axios.delete(`${API_BASE}/auth/bookmarks`, {
            ...authHeaders(),
            params: { article_title: articleTitle }
        })
        setBookmarks(prev => prev.filter(b => b.article_title !== articleTitle))
    }

    const isBookmarked = (articleTitle) => {
        return bookmarks.some(b => b.article_title === articleTitle)
    }

    const recordRead = async (article) => {
        if (!token || !article) return
        try {
            await axios.post(`${API_BASE}/auth/read`, {
                article_title: article.title,
                article_source: article.source || 'Unknown',
                article_category: article.category || 'Other'
            }, authHeaders())
        } catch { /* silent */ }
    }

    return (
        <AuthContext.Provider value={{
            user, token, loading, bookmarks,
            login, signup, logout,
            addBookmark, removeBookmark, isBookmarked,
            recordRead,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
