// Shared news analysis utilities
import { format, parseISO } from 'date-fns'

// Sentiment analysis
const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'brilliant', 'outstanding', 'success', 'achievement', 'victory', 'win', 'positive', 'growth', 'improvement', 'progress', 'happy', 'joy', 'celebration', 'breakthrough', 'innovation', 'advancement', 'development', 'profit', 'gain', 'increase', 'rise', 'boost', 'surge', 'jump', 'climb', 'soar', 'leap', 'award', 'honor', 'record', 'milestone', 'peace', 'reform', 'support', 'benefit', 'rescue', 'hero', 'recover', 'thrive']
const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disaster', 'crisis', 'problem', 'issue', 'failure', 'loss', 'defeat', 'negative', 'decline', 'drop', 'fall', 'crash', 'collapse', 'breakdown', 'sad', 'angry', 'fear', 'worry', 'concern', 'danger', 'threat', 'risk', 'attack', 'violence', 'death', 'injury', 'damage', 'destruction', 'corruption', 'scandal', 'controversy', 'conflict', 'protest', 'strike', 'penalty', 'fraud', 'crime', 'arrest', 'murder', 'accident', 'flood', 'drought', 'earthquake', 'terror', 'bomb', 'war', 'poverty']

export const analyzeSentiment = (text) => {
    const words = text.toLowerCase().split(/\s+/)
    let pos = 0, neg = 0
    words.forEach(word => {
        if (positiveWords.includes(word)) pos++
        else if (negativeWords.includes(word)) neg++
    })
    const total = pos + neg
    if (total === 0) return 'neutral'
    if (pos / total > 0.6) return 'positive'
    if (neg / total > 0.6) return 'negative'
    return 'neutral'
}

// Category keywords
export const categoryKeywords = {
    Politics: ['election', 'government', 'minister', 'parliament', 'political', 'vote', 'democracy', 'congress', 'bjp', 'party', 'modi', 'president', 'senate', 'legislation', 'policy'],
    Technology: ['tech', 'technology', 'digital', 'app', 'software', 'ai', 'artificial intelligence', 'startup', 'innovation', 'cyber', 'data', 'cloud', 'robot', 'machine learning', 'blockchain'],
    Business: ['business', 'economy', 'market', 'stock', 'finance', 'investment', 'company', 'corporate', 'trade', 'economic', 'gdp', 'revenue', 'profit', 'startup', 'ipo'],
    Sports: ['cricket', 'football', 'sports', 'match', 'tournament', 'player', 'team', 'game', 'olympics', 'ipl', 'tennis', 'championship', 'medal', 'league', 'goal'],
    Entertainment: ['movie', 'film', 'actor', 'actress', 'bollywood', 'hollywood', 'music', 'celebrity', 'entertainment', 'show', 'concert', 'album', 'award', 'netflix', 'streaming'],
    Health: ['health', 'medical', 'doctor', 'hospital', 'disease', 'covid', 'vaccine', 'medicine', 'treatment', 'healthcare', 'mental health', 'fitness', 'nutrition', 'surgery', 'pandemic'],
    Education: ['education', 'school', 'college', 'university', 'student', 'exam', 'study', 'academic', 'learning', 'teacher', 'scholarship', 'curriculum', 'degree', 'enrollment'],
    International: ['world', 'international', 'global', 'foreign', 'diplomatic', 'un', 'nato', 'europe', 'america', 'china', 'russia', 'ukraine', 'middle east', 'africa', 'asia']
}

// Category colors
export const categoryColors = {
    Politics: '#ef4444',
    Technology: '#3b82f6',
    Business: '#f59e0b',
    Sports: '#10b981',
    Entertainment: '#8b5cf6',
    Health: '#ec4899',
    Education: '#14b8a6',
    International: '#f43f5e',
    Other: '#6b7280',
    All: '#000000'
}

// Assign category to article
export const assignCategory = (article) => {
    const text = `${article.title || ''} ${article.summary || ''}`.toLowerCase()
    for (const [cat, keys] of Object.entries(categoryKeywords)) {
        if (keys.some(k => text.includes(k))) return cat
    }
    return 'Other'
}

// Format dates safely
export const formatDate = (dateString) => {
    if (!dateString || dateString === 'Unknown') return 'Recent'
    try { return format(parseISO(dateString), 'MMM dd, yyyy') }
    catch { return 'Recent' }
}

// Reading time estimate
export const getReadingTime = (text) => {
    if (!text) return '1 min'
    const words = text.split(/\s+/).length
    const minutes = Math.max(1, Math.ceil(words / 200))
    return `${minutes} min read`
}

// Process articles with sentiment and category
export const processArticles = (articles) => {
    return articles.map(a => ({
        ...a,
        sentiment: analyzeSentiment(`${a.title || ''} ${a.summary || ''}`),
        category: assignCategory(a),
        readingTime: getReadingTime(`${a.title || ''} ${a.summary || ''}`),
        _sortKey: new Date(a.published === 'Unknown' ? a.fetched_at : a.published).getTime()
    })).sort((a, b) => b._sortKey - a._sortKey)
}
