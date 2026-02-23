import { useState, useRef, useEffect } from 'react'
import { HiSearch, HiX, HiClock } from 'react-icons/hi'

function SearchBar({ articles, onFilter, className = '' }) {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [searchHistory, setSearchHistory] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('taaza-khabar-search-history') || '[]')
        } catch { return [] }
    })
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const inputRef = useRef(null)
    const wrapperRef = useRef(null)

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const saveToHistory = (term) => {
        const updated = [term, ...searchHistory.filter(h => h !== term)].slice(0, 8)
        setSearchHistory(updated)
        localStorage.setItem('taaza-khabar-search-history', JSON.stringify(updated))
    }

    const handleSearch = (searchTerm) => {
        const term = searchTerm || query
        if (term.trim()) {
            saveToHistory(term.trim())
        }
        onFilter(term.trim())
        setShowSuggestions(false)
        setSelectedIndex(-1)
    }

    const handleInputChange = (e) => {
        const value = e.target.value
        setQuery(value)
        setSelectedIndex(-1)

        if (value.length > 1 && articles.length > 0) {
            const lower = value.toLowerCase()
            const matched = articles
                .filter(a =>
                    a.title?.toLowerCase().includes(lower) ||
                    a.summary?.toLowerCase().includes(lower) ||
                    a.source?.toLowerCase().includes(lower)
                )
                .slice(0, 5)
                .map(a => a.title)
            setSuggestions(matched)
            setShowSuggestions(matched.length > 0 || searchHistory.length > 0)
        } else if (value.length === 0) {
            setSuggestions([])
            setShowSuggestions(false)
            onFilter('')
        } else {
            setSuggestions([])
            setShowSuggestions(searchHistory.length > 0)
        }
    }

    const handleKeyDown = (e) => {
        const items = query.length > 1 ? suggestions : searchHistory
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => prev < items.length - 1 ? prev + 1 : 0)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => prev > 0 ? prev - 1 : items.length - 1)
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (selectedIndex >= 0 && items[selectedIndex]) {
                setQuery(items[selectedIndex])
                handleSearch(items[selectedIndex])
            } else {
                handleSearch()
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false)
            setSelectedIndex(-1)
        }
    }

    const clearSearch = () => {
        setQuery('')
        setSuggestions([])
        setShowSuggestions(false)
        onFilter('')
        inputRef.current?.focus()
    }

    const clearHistory = () => {
        setSearchHistory([])
        localStorage.removeItem('taaza-khabar-search-history')
    }

    return (
        <div className={`search-bar-wrapper ${className}`} ref={wrapperRef}>
            <div className="search-input-group">
                <HiSearch size={18} className="search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (searchHistory.length > 0 || suggestions.length > 0) {
                            setShowSuggestions(true)
                        }
                    }}
                    placeholder="Search articles by title, source, or keyword..."
                    className="search-input"
                />
                {query && (
                    <button onClick={clearSearch} className="search-clear-btn" aria-label="Clear search">
                        <HiX size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {showSuggestions && (
                <div className="search-dropdown">
                    {/* Auto-complete suggestions */}
                    {suggestions.length > 0 && (
                        <div className="search-section">
                            <span className="search-section-label">Suggestions</span>
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    className={`search-suggestion-item ${selectedIndex === i ? 'selected' : ''}`}
                                    onClick={() => { setQuery(s); handleSearch(s) }}
                                >
                                    <HiSearch size={14} />
                                    <span>{s.length > 65 ? s.substring(0, 65) + '...' : s}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search history */}
                    {query.length <= 1 && searchHistory.length > 0 && (
                        <div className="search-section">
                            <div className="search-section-header">
                                <span className="search-section-label">Recent Searches</span>
                                <button onClick={clearHistory} className="search-clear-history">Clear</button>
                            </div>
                            {searchHistory.map((h, i) => (
                                <button
                                    key={i}
                                    className={`search-suggestion-item history ${selectedIndex === i ? 'selected' : ''}`}
                                    onClick={() => { setQuery(h); handleSearch(h) }}
                                >
                                    <HiClock size={14} />
                                    <span>{h}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default SearchBar
