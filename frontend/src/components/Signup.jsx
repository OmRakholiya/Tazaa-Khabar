import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiMail, HiLockClosed, HiUser, HiNewspaper, HiArrowRight } from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'

function Signup() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signup } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            await signup(name, email, password)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.detail || 'Signup failed. Please try again.')
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
                        <h1>Create Account</h1>
                        <p>Join Taaza Khabar for personalized news</p>
                    </div>

                    {/* Error */}
                    {error && <div className="auth-error">{error}</div>}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label htmlFor="name">
                                <HiUser size={16} /> Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                                required
                                autoFocus
                            />
                        </div>

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
                                placeholder="Min 6 characters"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="confirmPassword">
                                <HiLockClosed size={16} /> Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repeat your password"
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                            <HiArrowRight size={16} />
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login">Sign In</Link></p>
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

export default Signup
