import { useState, useEffect, type ReactNode } from 'react'

const SESSION_KEY = 'gpt-image-playground-auth'

function checkSessionAuth(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'ok'
  } catch {
    return false
  }
}

function setSessionAuth() {
  try {
    sessionStorage.setItem(SESSION_KEY, 'ok')
  } catch {
    /* ignore */
  }
}

interface LoginGateProps {
  password: string
  children: ReactNode
}

export default function LoginGate({ password, children }: LoginGateProps) {
  const [authenticated, setAuthenticated] = useState(checkSessionAuth)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!authenticated) {
      // 聚焦输入框
      const timer = setTimeout(() => {
        document.getElementById('login-password-input')?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [authenticated])

  if (authenticated) return <>{children}</>

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === password) {
      setSessionAuth()
      setAuthenticated(true)
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div
        className={`w-full max-w-sm mx-4 p-8 rounded-3xl border border-white/50 bg-white/90 shadow-2xl ring-1 ring-black/5 dark:border-white/[0.08] dark:bg-gray-900/90 dark:ring-white/10 transition-transform ${
          shake ? 'animate-[shake_0.5s_ease-in-out]' : ''
        }`}
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">GPT Image Playground</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">请输入访问密码以继续</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="login-password-input"
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false) }}
              placeholder="访问密码"
              autoComplete="current-password"
              className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-300 dark:text-gray-200 dark:focus:border-blue-500/50 ${
                error
                  ? 'border-red-300 bg-red-50/50 dark:border-red-500/40 dark:bg-red-500/10'
                  : 'border-gray-200/70 bg-white/60 dark:border-white/[0.08] dark:bg-white/[0.03]'
              }`}
            />
            {error && (
              <p className="mt-2 text-xs text-red-500 dark:text-red-400 text-center">密码错误，请重试</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            进入
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}
