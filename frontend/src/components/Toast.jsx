import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { HiX, HiCheckCircle, HiInformationCircle, HiExclamation, HiNewspaper } from 'react-icons/hi'

const ToastContext = createContext()

let toastId = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type, exiting: false }])

        // Auto-dismiss
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, 300) // match CSS exit animation
        }, duration)

        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 300)
    }, [])

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {/* Toast Container */}
            <div className="toast-container" aria-live="polite">
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export const useToast = () => useContext(ToastContext)

// Individual Toast component
function Toast({ toast, onDismiss }) {
    const getIcon = () => {
        switch (toast.type) {
            case 'success': return <HiCheckCircle size={20} />
            case 'warning': return <HiExclamation size={20} />
            case 'news': return <HiNewspaper size={20} />
            default: return <HiInformationCircle size={20} />
        }
    }

    return (
        <div className={`toast toast-${toast.type} ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}>
            <div className="toast-icon">{getIcon()}</div>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">
                <HiX size={16} />
            </button>
        </div>
    )
}

export default Toast
