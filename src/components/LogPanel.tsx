import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'

export default function LogPanel() {
  const logs = useGameStore(s => s.logs)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="w-80 bg-[rgba(10,10,30,0.9)] border-l border-[var(--border-primary)] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border-primary)] bg-[rgba(20,20,50,0.8)]">
        <h3 className="font-bold text-gold flex items-center gap-2">
          📜 修行日志
          <span className="text-xs text-secondary font-normal">（{logs.length} 条记录）</span>
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {logs.length === 0 ? (
          <p className="text-secondary text-sm text-center py-8">尚无记录</p>
        ) : (
          logs.map((log, idx) => (
            <div
              key={`${log.timestamp}-${idx}`}
              className={`p-3 rounded-lg text-sm border-l-4 ${
                log.narrative.includes('【突破成功】')
                  ? 'bg-[rgba(212,175,55,0.1)] border-[var(--border-gold)]'
                  : log.narrative.includes('【心魔试炼】')
                  ? 'bg-[rgba(139,92,246,0.08)] border-[var(--accent-purple)]'
                  : log.narrative.includes('失败') || log.narrative.includes('受伤')
                  ? 'bg-[rgba(239,68,68,0.06)] border-[var(--accent-red)]'
                  : log.narrative.includes('【')
                  ? 'bg-[rgba(59,130,246,0.06)] border-[var(--accent-blue)]'
                  : 'bg-[rgba(30,30,74,0.5)] border-[var(--border-primary)]'
              }`}
            >
              <div className="text-[10px] text-secondary mb-1">
                仙历第 {log.day} 日
              </div>
              <div className="text-[var(--text-primary)] leading-relaxed">{log.narrative}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
