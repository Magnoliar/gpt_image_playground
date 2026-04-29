import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { getLogEntries, clearLog, subscribeLog, type LogEntry } from '../lib/logger'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'

const LEVEL_COLORS: Record<string, string> = {
  info: 'text-blue-600 dark:text-blue-400',
  warn: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
  debug: 'text-gray-400 dark:text-gray-500',
}

const LEVEL_BG: Record<string, string> = {
  info: '',
  warn: 'bg-yellow-50/50 dark:bg-yellow-500/5',
  error: 'bg-red-50/50 dark:bg-red-500/5',
  debug: '',
}

export default function LogViewer() {
  const showLogViewer = useStore((s) => s.showLogViewer)
  const setShowLogViewer = useStore((s) => s.setShowLogViewer)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useCloseOnEscape(showLogViewer, () => setShowLogViewer(false))

  useEffect(() => {
    if (!showLogViewer) return
    setEntries([...getLogEntries()])
    return subscribeLog(() => {
      setEntries([...getLogEntries()])
    })
  }, [showLogViewer])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries, autoScroll])

  if (!showLogViewer) return null

  const filtered = filter
    ? entries.filter(
        (e) =>
          e.message.toLowerCase().includes(filter.toLowerCase()) ||
          e.category.toLowerCase().includes(filter.toLowerCase()),
      )
    : entries

  return (
    <div data-no-drag-select className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-overlay-in"
        onClick={() => setShowLogViewer(false)}
      />
      <div className="relative z-10 w-full max-w-3xl h-[80vh] rounded-3xl border border-white/50 bg-white/95 shadow-2xl ring-1 ring-black/5 animate-modal-in dark:border-white/[0.08] dark:bg-gray-900/95 dark:ring-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 dark:border-white/[0.08]">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            调试日志
            <span className="text-xs text-gray-400 font-normal">({filtered.length}/{entries.length})</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2 py-1 text-xs rounded-lg transition ${autoScroll ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-gray-400'}`}
            >
              自动滚动
            </button>
            <button
              onClick={clearLog}
              className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-gray-400 dark:hover:bg-white/[0.1] transition"
            >
              清空
            </button>
            <button
              onClick={() => setShowLogViewer(false)}
              className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="px-5 py-2 border-b border-gray-100 dark:border-white/[0.08]">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="过滤日志..."
            className="w-full rounded-lg border border-gray-200/70 bg-white/60 px-3 py-1.5 text-xs text-gray-700 outline-none transition focus:border-blue-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:focus:border-blue-500/50"
          />
        </div>

        {/* Log entries */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs leading-relaxed">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
              {entries.length === 0 ? '暂无日志，启用调试模式后发起请求即可看到' : '无匹配日志'}
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                className={`px-5 py-1 border-b border-gray-50 dark:border-white/[0.03] ${LEVEL_BG[entry.level]}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 dark:text-gray-600 shrink-0 select-all">{entry.time}</span>
                  <span className={`shrink-0 font-semibold uppercase w-12 ${LEVEL_COLORS[entry.level]}`}>{entry.level}</span>
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">[{entry.category}]</span>
                  <span className="text-gray-800 dark:text-gray-200 break-all">{entry.message}</span>
                </div>
                {entry.detail !== undefined && (
                  <pre className="mt-1 ml-16 text-[10px] text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                    {typeof entry.detail === 'string' ? entry.detail : JSON.stringify(entry.detail, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
