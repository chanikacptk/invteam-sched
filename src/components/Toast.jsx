import { useState, useEffect, useCallback } from 'react'

let _addToast = null

export function toast(message, type = 'error') {
  _addToast && _addToast(message, type)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  useEffect(() => {
    _addToast = addToast
    return () => { _addToast = null }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(({ id, message, type }) => (
        <div
          key={id}
          className={`px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-auto animate-fade-in
            ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-emerald-600' : 'bg-gray-800'}`}
        >
          {message}
        </div>
      ))}
    </div>
  )
}
