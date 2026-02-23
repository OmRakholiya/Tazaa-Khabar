import { HiNewspaper, HiChat, HiGlobeAlt, HiClock, HiTrendingUp, HiFire } from 'react-icons/hi'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { BackgroundPaths } from './BackgroundPaths'
import { AnimatedCounter } from './AnimatedCounter'
import DisplayCards from './DisplayCards'
import API_BASE from '../lib/api'
import { categoryColors } from '../lib/newsUtils'

function Home() {
  const [trending, setTrending] = useState([])

  useEffect(() => {
    axios.get(`${API_BASE}/auth/trending`)
      .then(res => setTrending(res.data.trending || []))
      .catch(() => { })
  }, [])

  return (
    <div className="home-page">
      {/* Animated Background */}
      <BackgroundPaths />

      {/* Main Content */}
      <div className="home-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-icon">
              <HiNewspaper size={80} />
            </div>
            <h1 className="hero-title">Welcome to Taaza Khabar</h1>
            <p className="hero-subtitle">
              Your intelligent news aggregator powered by AI sentiment analysis and smart categorization
            </p>
            <div className="hero-actions">
              <Link to="/articles" className="hero-btn primary">
                <HiGlobeAlt size={20} />
                Browse News
              </Link>
              <Link to="/chatbot" className="hero-btn secondary">
                <HiChat size={20} />
                AI Chat
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="container">
            <h2 className="section-title">Why Choose Taaza Khabar?</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <HiClock size={32} />
                </div>
                <h3>Real-time Updates</h3>
                <p>Get the latest news from multiple sources with automatic updates and smart categorization.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <HiChat size={32} />
                </div>
                <h3>AI-Powered Analysis</h3>
                <p>Advanced sentiment analysis and intelligent categorization using cutting-edge AI technology.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <HiGlobeAlt size={32} />
                </div>
                <h3>Smart Filtering</h3>
                <p>Filter news by category, sentiment, and source to find exactly what interests you.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <HiNewspaper size={32} />
                </div>
                <h3>Comprehensive Coverage</h3>
                <p>Coverage across Politics, Technology, Business, Sports, Entertainment, Health, Education, and more.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="container">
            <div className="stats-grid">
              <div className="stat-item">
                <AnimatedCounter target={8} duration={1.2} suffix="+" />
                <div className="stat-label">News Categories</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">AI</div>
                <div className="stat-label">Sentiment Analysis</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">Real-time</div>
                <div className="stat-label">Updates</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">Smart</div>
                <div className="stat-label">Filtering</div>
              </div>
            </div>
          </div>
        </section>

        {/* Trending News Section */}
        {trending.length > 0 && (
          <section className="trending-section">
            <div className="container">
              <h2 className="section-title"><HiFire size={24} /> Trending Now</h2>
              <p className="section-subtitle">Most read articles by our community</p>
              <div className="trending-list">
                {trending.slice(0, 5).map((item, i) => (
                  <div key={i} className="trending-item">
                    <span className="trending-rank">#{i + 1}</span>
                    <div className="trending-info">
                      <h4>{item.title}</h4>
                      <div className="trending-meta">
                        <span className="trending-source">{item.source}</span>
                        <span
                          className="trending-cat-badge"
                          style={{ backgroundColor: categoryColors[item.category] || '#6b7280' }}
                        >
                          {item.category}
                        </span>
                        <span className="trending-reads">
                          <HiTrendingUp size={14} /> {item.read_count} reads
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}


        {/* Display Cards Section */}
        <section className="quick-start-section">
          <div className="container">
            <h2 className="section-title">Get Started</h2>
            <div className="display-cards-container">
              <DisplayCards />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="home-footer">
          <div className="container">
            <div className="footer-grid">
              {/* Brand Column */}
              <div className="footer-brand-col">
                <div className="footer-brand">
                  <HiNewspaper size={24} />
                  <span>Taaza Khabar</span>
                </div>
                <p className="footer-tagline">Intelligent News Without Overload. AI-powered aggregation from 14+ trusted Indian news sources.</p>
              </div>

              {/* Quick Links */}
              <div className="footer-links-col">
                <h4>Quick Links</h4>
                <ul>
                  <li><Link to="/"><HiClock size={14} /> Home</Link></li>
                  <li><Link to="/articles"><HiGlobeAlt size={14} /> Articles</Link></li>
                  <li><Link to="/chatbot"><HiChat size={14} /> AI Chat</Link></li>

                </ul>
              </div>

              {/* Tech Stack */}
              <div className="footer-links-col">
                <h4>Powered By</h4>
                <ul>
                  <li><span>⚛️ React + Vite</span></li>
                  <li><span>⚡ FastAPI + Python</span></li>
                  <li><span>🤖 Google Gemini AI</span></li>
                  <li><span>🗄️ MongoDB Atlas</span></li>
                </ul>
              </div>
            </div>

            <div className="footer-bottom">
              <p>© {new Date().getFullYear()} Taaza Khabar • Built by <strong>Daksh Savani</strong> • v1.0.0</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Home

