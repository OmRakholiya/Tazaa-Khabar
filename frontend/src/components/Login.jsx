import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiMail, HiLockClosed, HiNewspaper, HiArrowRight } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await login(email, password)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    {/* Header */}
                    <div className="auth-header">
                        <div className="auth-logo">
                            <HiNewspaper size={36} />
                        </div>
                        <h1>Welcome Back</h1>
                        <p>Sign in to your Taaza Khabar account</p>
                    </div>

                    {/* Error */}
                    {error && <div className="auth-error">{error}</div>}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="email">
                                <HiMail size={16} /> Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="password">
                                <HiLockClosed size={16} /> Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                            <HiArrowRight size={16} />
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>Don't have an account? <Link to="/signup">Create one</Link></p>
                    </div>
                </div>

                {/* Side visual */}
                <div className="auth-visual">
                    <div className="auth-visual-content">
                        <HiNewspaper size={80} />
                        <h2>Taaza Khabar</h2>
                        <p>Intelligent News Without Overload</p>
                        <ul>
                            <li>📰 14+ trusted news sources</li>
                            <li>🤖 AI-powered analysis</li>
                            <li>🔔 Smart notifications</li>
                            <li>🔖 Bookmark favorites</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
