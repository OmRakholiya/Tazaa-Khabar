import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Home from './components/Home'
import Articles from './components/Articles'
import ArticleDetail from './components/ArticleDetail'
import CategoryPage from './components/CategoryPage'
import Chatbot from './components/Chatbot'

import Profile from './components/Profile'
import Login from './components/Login'
import Signup from './components/Signup'
import { ToastProvider } from './components/Toast'
import './App.css'

function App() {
  return (
    <Router>
      <ToastProvider>
        <div className="app">
          <Navigation />
          <main className="main-content-wrapper">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
              <Route path="/chatbot" element={<Chatbot />} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Routes>
          </main>
        </div>
      </ToastProvider>
    </Router>
  )
}

export default App
