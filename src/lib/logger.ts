export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface LogEntry {
  id: number
  time: string
  level: LogLevel
  category: string
  message: string
  detail?: unknown
}

let enabled = false
let nextId = 0
const entries: LogEntry[] = []
const MAX_ENTRIES = 500
const listeners = new Set<() => void>()

function notify() {
  for (const fn of listeners) fn()
}

export function setDebugMode(on: boolean) {
  enabled = on
  if (on) notify()
}

export function isDebugMode(): boolean {
  return enabled
}

export function subscribeLog(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getLogEntries(): readonly LogEntry[] {
  return entries
}

export function clearLog() {
  entries.length = 0
  notify()
}

function addEntry(level: LogLevel, category: string, message: string, detail?: unknown) {
  if (!enabled) return
  const entry: LogEntry = {
    id: nextId++,
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(Date.now() % 1000).padStart(3, '0'),
    level,
    category,
    message,
    detail,
  }
  entries.push(entry)
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES)
  notify()
}

export const log = {
  info: (category: string, message: string, detail?: unknown) => addEntry('info', category, message, detail),
  warn: (category: string, message: string, detail?: unknown) => addEntry('warn', category, message, detail),
  error: (category: string, message: string, detail?: unknown) => addEntry('error', category, message, detail),
  debug: (category: string, message: string, detail?: unknown) => addEntry('debug', category, message, detail),
}
