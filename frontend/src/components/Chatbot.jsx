import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { HiPaperAirplane, HiUser, HiSparkles, HiRefresh } from 'react-icons/hi'
import LoadingSpinner from './LoadingSpinner'
import PromptBox from './PromptBox'
import API_BASE from '../lib/api'

// Formatted Message Component
const FormattedMessage = ({ sections }) => {
  const parseInlineStyles = (text) => {
    if (typeof text !== 'string') return text;

    // Simple regex for bold **text** and italic *text*
    // Note: This is simplified. For full markdown use react-markdown
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  const renderSection = (section, index) => {
    switch (section.type) {
      case 'header':
        const HeaderTag = section.level === 2 ? 'h3' : 'h4'
        return (
          <HeaderTag key={index} className={`formatted-header level-${section.level}`}>
            {parseInlineStyles(section.content[0])}
          </HeaderTag>
        )

      case 'bullet_list':
        return (
          <ul key={index} className="formatted-list bullet-list">
            {section.content.map((item, i) => (
              <li key={i}>{parseInlineStyles(item)}</li>
            ))}
          </ul>
        )

      case 'numbered_list':
        return (
          <ol key={index} className="formatted-list numbered-list">
            {section.content.map((item, i) => (
              <li key={i}>{parseInlineStyles(item)}</li>
            ))}
          </ol>
        )

      case 'paragraph':
      default:
        return (
          <div key={index} className="formatted-paragraph">
            {section.content.map((line, i) => (
              <p key={i}>{parseInlineStyles(line)}</p>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="formatted-content">
      {sections.map((section, index) => renderSection(section, index))}
    </div>
  )
}


function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I am your Taaza Khabar News Assistant. I have access to the latest headlines and can help you summarize today highlights, analyze market trends, or answer specific questions about current events.\n\nTry asking me about "latest tech news" or "world headlines today"!',
      timestamp: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (data) => {
    if (!data.message.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: data.message,
      image: data.image,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        query: data.message,
        image: data.image
      })

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.text,
        formatted: response.data.formatted,
        sections: response.data.sections,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      console.error('Chat error:', err)
      setError('Failed to get response. Please try again.')

      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again or check your connection.',
        timestamp: new Date(),
        isError: true
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        content: 'Hello! I am your Taaza Khabar News Assistant. I have access to the latest headlines and can help you summarize today highlights, analyze market trends, or answer specific questions about current events.\n\nTry asking me about "latest tech news" or "world headlines today"!',
        timestamp: new Date()
      }
    ])
    setError(null)
  }

  return (
    <div className="chatbot-page">
      {/* Chat Header - Fixed Top */}
      <div className="chat-header-fixed">
        <h3>AI Chat</h3>
        <button onClick={clearChat} className="clear-chat-btn">
          <HiRefresh size={16} />
        </button>
      </div>

      {/* Messages Container - Scrollable Middle */}
      <div className="messages-container-fixed">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.type} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-avatar">
              {message.type === 'user' ? (
                <HiUser size={16} />
              ) : (
                <HiSparkles size={16} />
              )}
            </div>
            <div className="message-content">
              {/* Image display for user messages */}
              {message.type === 'user' && message.image && (
                <div className="message-image">
                  <img
                    src={message.image}
                    alt="Attached image"
                    className="max-w-64 max-h-48 rounded-lg object-cover"
                  />
                </div>
              )}

              <div className="message-text">
                {message.formatted && message.sections ? (
                  <FormattedMessage sections={message.sections} />
                ) : (
                  <div className="plain-text">{message.content}</div>
                )}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message bot">
            <div className="message-avatar">
              <HiSparkles size={16} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <LoadingSpinner size="small" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed Bottom */}
      <div className="input-area-fixed">
        {/* Suggestion Chips */}
        {!isLoading && messages.length <= 2 && (
          <div className="chat-suggestions">
            <button onClick={() => sendMessage({ message: "What are today's top highlights?" })} className="suggestion-chip">
              🔥 Top Highlights
            </button>
            <button onClick={() => sendMessage({ message: "Show me the latest news in India" })} className="suggestion-chip">
              🇮🇳 India News
            </button>
            <button onClick={() => sendMessage({ message: "What's new in technology today?" })} className="suggestion-chip">
              💻 Tech Updates
            </button>
            <button onClick={() => sendMessage({ message: "Explain the current market trends" })} className="suggestion-chip">
              📈 Market Trends
            </button>
          </div>
        )}
        <PromptBox
          onSubmit={sendMessage}
          disabled={isLoading}
          className="w-full"
        />
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  )
}

export default Chatbot
