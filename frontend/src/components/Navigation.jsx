import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { HiNewspaper, HiHome, HiGlobeAlt, HiChat, HiUser, HiLogout, HiLogin, HiBookmark } from 'react-icons/hi'
import { cn } from "../lib/utils"

import { useAuth } from "../context/AuthContext"

const navItems = [
  { name: "Home", url: "/", icon: HiHome },
  { name: "Articles", url: "/articles", icon: HiGlobeAlt },
  { name: "AI Chat", url: "/chatbot", icon: HiChat },
]

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const currentItem = navItems.find(item =>
      item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)
    )
    if (currentItem) {
      setActiveTab(currentItem.name)
    }
  }, [location.pathname])

  // Close user menu on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.user-menu-wrapper')) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
    navigate('/')
  }

  return (
    <nav className="main-navigation" aria-label="Main navigation">
      <div className="nav-container">
        {/* Brand Logo */}
        <Link to="/" className="nav-brand">
          <div className="brand-badge">
            <HiNewspaper size={18} />
          </div>
          {!isMobile && <span>Taaza Khabar</span>}
        </Link>

        {/* Navigation Items */}
        <div className="nav-pill-container">
          <div className="nav-pill-wrapper">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.name

              return (
                <NavLink
                  key={item.name}
                  to={item.url}
                  onClick={() => setActiveTab(item.name)}
                  className={cn(
                    "nav-pill-item",
                    isActive && "nav-pill-active"
                  )}
                  end={item.url === "/"}
                >
                  <span className="nav-pill-text">{item.name}</span>
                  <span className="nav-pill-icon">
                    <Icon size={18} strokeWidth={2.5} />
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="lamp"
                      className="nav-pill-highlight"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      <div className="nav-pill-glow">
                        <div className="nav-pill-glow-1" />
                        <div className="nav-pill-glow-2" />
                        <div className="nav-pill-glow-3" />
                      </div>
                    </motion.div>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>

        {/* Right side: Theme + Auth */}
        <div className="nav-right-actions">


          {/* Auth Buttons */}
          {isAuthenticated ? (
            <div className="user-menu-wrapper">
              <button
                className="nav-action-btn user-avatar-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                title={user?.name}
              >
                <HiUser size={18} />
                {!isMobile && <span className="user-name-label">{user?.name?.split(' ')[0]}</span>}
              </button>

              {showUserMenu && (
                <div className="user-dropdown-menu">
                  <div className="user-menu-header">
                    <HiUser size={20} />
                    <div>
                      <strong>{user?.name}</strong>
                      <small>{user?.email}</small>
                    </div>
                  </div>
                  <div className="user-menu-divider" />
                  <button onClick={() => { setShowUserMenu(false); navigate('/profile') }}>
                    <HiUser size={16} /> My Profile
                  </button>
                  <button onClick={() => { setShowUserMenu(false); navigate('/profile') }}>
                    <HiBookmark size={16} /> My Bookmarks
                  </button>
                  <button onClick={handleLogout} className="logout-option">
                    <HiLogout size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-nav-btns">
              <Link to="/login" className="nav-action-btn login-btn">
                <HiLogin size={18} />
                {!isMobile && <span>Login</span>}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation
