import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { EventChoice } from '@/types/game'
import { REALM_ORDER } from '@/types/game'

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  opportunity: { label: '机缘', color: 'text-good', icon: '✨' },
  disaster: { label: '劫难', color: 'text-bad', icon: '💀' },
  choice: { label: '抉择', color: 'text-info', icon: '🔮' },
  enlightenment: { label: '悟道', color: 'text-gold', icon: '💎' },
  combat: { label: '杀伐', color: 'text-bad', icon: '⚔️' }
}

export default function CavernScreen() {
  const character = useGameStore(s => s.character)
  const pendingEvent = useGameStore(s => s.pendingEvent)
  const secretRealmProgress = useGameStore(s => s.secretRealmProgress)
  const triggerCavernEvent = useGameStore(s => s.triggerCavernEvent)
  const resolveCavernChoice = useGameStore(s => s.resolveCavernChoice)
  const advanceSecretRealm = useGameStore(s => s.advanceSecretRealm)
  const addLog = useGameStore(s => s.addLog)

  const [loading, setLoading] = useState(false)
  const [realmLoading, setRealmLoading] = useState(false)
  const [lastNarrative, setLastNarrative] = useState<string | null>(null)
  const [exploredCount, setExploredCount] = useState(0)

  const handleExplore = async () => {
    setLoading(true)
    setLastNarrative(null)
    await triggerCavernEvent()
    setExploredCount(c => c + 1)
    setLoading(false)
  }

  const handleAdvanceRealm = async () => {
    setRealmLoading(true)
    await advanceSecretRealm()
    setRealmLoading(false)
  }

  const isChoiceAvailable = (choice: EventChoice): boolean => {
    if (!choice.requires || !character) return true
    const req = choice.requires
    if (req.attribute && req.minValue) {
      const attr = character[req.attribute as 'spirit' | 'body' | 'mind']
      if (attr && attr.value < req.minValue) return false
    }
    if (req.skill && !character.skills.some(s => s.id === req.skill)) return false
    return true
  }

  const getChoiceRequirementText = (choice: EventChoice): string | null => {
    if (!choice.requires || !character) return null
    const req = choice.requires
    const parts: string[] = []
    if (req.attribute && req.minValue) {
      const attrMap: Record<string, string> = { spirit: '灵力', body: '体魄', mind: '神识' }
      const attr = character[req.attribute as 'spirit' | 'body' | 'mind']
      const attrName = attrMap[req.attribute] || req.attribute
      const current = attr?.value || 0
      parts.push(`${attrName} ${current}/${req.minValue}`)
    }
    if (req.skill) {
      const hasIt = character.skills.some(s => s.id === req.skill)
      parts.push(`需要技能 (${hasIt ? '已掌握' : '未掌握'})`)
    }
    return parts.length ? parts.join('，') : null
  }

  if (!character) return null

  const currentRealmRank = REALM_ORDER.indexOf(character.realm)

  return (
    <div className="fade-in max-w-5xl mx-auto">
      <div className="card card-gold mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="section-title">🌋 洞天福地 · 秘境探索</h2>
            <p className="text-secondary text-sm">
              名山之间，多有洞天。深入其中，或有奇遇机缘，或有杀身之祸。是福是祸，皆凭造化。
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-secondary">
              已探索次数：<span className="font-bold text-gold">{exploredCount}</span>
            </div>
            <button
              className="btn btn-primary text-lg py-3 px-6"
              onClick={handleExplore}
              disabled={loading || !!pendingEvent}
            >
              {loading ? '🌀 探索中...' : pendingEvent ? '✨ 事件进行中' : '🚪 深入探索'}
            </button>
          </div>
        </div>
      </div>

      {secretRealmProgress.length > 0 && secretRealmProgress[0].discovered && !pendingEvent && (
        <div className="card mb-6" style={{ borderColor: 'rgba(139,92,246,0.5)', background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(212,175,55,0.05))' }}>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="text-6xl flex-shrink-0" style={{ animation: 'sparkle 2s ease-in-out infinite' }}>🗝️</div>
            <div className="flex-1 min-w-[300px]">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-bold text-xl text-gold">
                  {secretRealmProgress[0].name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-[rgba(139,92,246,0.2)] text-info">
                  追踪中
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-[rgba(212,175,55,0.2)] text-gold">
                  进度 {secretRealmProgress[0].stage}/{secretRealmProgress[0].totalStages}
                </span>
              </div>
              <p className="text-sm text-secondary mb-3">
                {secretRealmProgress[0].description}
              </p>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-secondary mb-1">
                  <span>探索进度</span>
                  <span>{Math.round((secretRealmProgress[0].stage / secretRealmProgress[0].totalStages) * 100)}%</span>
                </div>
                <div className="h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-amber-500 transition-all duration-500"
                    style={{ width: `${(secretRealmProgress[0].stage / secretRealmProgress[0].totalStages) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-xs text-secondary">
                  上次探索：仙历第 {secretRealmProgress[0].lastVisitedDay || '—'} 日
                </div>
                {!secretRealmProgress[0].completed && (
                  <button
                    className="btn btn-primary"
                    onClick={handleAdvanceRealm}
                    disabled={realmLoading || !!pendingEvent}
                  >
                    {realmLoading ? '🌀 推进中...' : '▶ 继续追踪线索'}
                  </button>
                )}
                {secretRealmProgress[0].completed && (
                  <span className="text-good font-bold">✨ 已完成全部探索</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!pendingEvent && !loading && !lastNarrative && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { icon: '⛰️', name: '青云后山', desc: '宗门所在之地，危险较低，偶有低阶灵草与妖兽。', risk: '低' },
            { icon: '🕳️', name: '幽冥古洞', desc: '传说中上古修士坐化之地，机缘与风险并存。', risk: '中' },
            { icon: '🌊', name: '东海秘境', desc: '百年一开的神秘空间，非筑基以上修士不可入。', risk: '高' }
          ].map(zone => (
            <div
              key={zone.name}
              className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-light)] transition-all cursor-pointer"
              onClick={handleExplore}
            >
              <div className="text-5xl mb-3 text-center">{zone.icon}</div>
              <h3 className="font-bold text-lg text-gold text-center mb-2">{zone.name}</h3>
              <p className="text-xs text-secondary text-center mb-3 leading-relaxed">{zone.desc}</p>
              <div className="text-center">
                <span className={`tag ${
                  zone.risk === '低' ? 'tag-support' : zone.risk === '中' ? 'tag-cultivation' : 'tag-attack'
                }`}>
                  风险：{zone.risk}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="card text-center py-16">
          <div className="text-7xl mb-4" style={{ animation: 'sparkle 1.5s ease-in-out infinite' }}>🌀</div>
          <p className="text-lg text-secondary mb-2">你正在洞天深处穿行……</p>
          <p className="text-sm text-secondary">四周灵气氤氲，光影交错。</p>
        </div>
      )}

      {pendingEvent && (
        <div className="fade-in">
          {(() => {
            const typeInfo = EVENT_TYPE_LABELS[pendingEvent.type] || EVENT_TYPE_LABELS.choice
            const realmLocked = pendingEvent.minRealm &&
              REALM_ORDER.indexOf(pendingEvent.minRealm) > currentRealmRank
            return (
              <div className="card" style={{ borderColor: 'var(--accent-purple)', boxShadow: 'var(--shadow-glow)' }}>
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--border-primary)]">
                  <div className="text-4xl">{typeInfo.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-2xl font-bold text-gold">{pendingEvent.title}</h2>
                      <span className={`tag font-bold ${
                        pendingEvent.type === 'opportunity' || pendingEvent.type === 'enlightenment'
                          ? 'tag-support'
                          : pendingEvent.type === 'disaster' || pendingEvent.type === 'combat'
                          ? 'tag-attack'
                          : 'tag-cultivation'
                      }`}>
                        {typeInfo.label}事件
                      </span>
                      {pendingEvent.minRealm && (
                        <span className={`tag ${realmLocked ? 'tag-attack' : 'tag-defense'}`}>
                          推荐 {pendingEvent.minRealm}+
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-lg mb-6 bg-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.2)]">
                  <p className="text-lg leading-relaxed" style={{ lineHeight: 2 }}>
                    {pendingEvent.narrative}
                  </p>
                </div>

                {realmLocked && (
                  <div className="mb-4 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-sm text-bad">
                    ⚠️ 你的境界不足，此事件风险极高！但你若执意前行，也并非不可。
                  </div>
                )}

                <h3 className="font-bold text-gold mb-3">你的选择：</h3>
                <div className="space-y-3">
                  {pendingEvent.choices.map((choice, idx) => {
                    const available = isChoiceAvailable(choice)
                    const reqText = getChoiceRequirementText(choice)
                    return (
                      <button
                        key={choice.id}
                        onClick={() => {
                          if (!available) return
                          resolveCavernChoice(choice)
                          setLastNarrative('')
                        }}
                        disabled={!available}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                          !available
                            ? 'opacity-50 cursor-not-allowed border-[var(--border-primary)] bg-[var(--bg-secondary)]'
                            : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-gold)] hover:shadow-[var(--shadow-gold)] hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl font-bold text-gold flex-shrink-0">
                            {String.fromCharCode(65 + idx)}.
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg mb-1">{choice.text}</div>
                            {reqText && (
                              <div className={`text-xs ${available ? 'text-good' : 'text-bad'}`}>
                                🔒 条件：{reqText} {available ? '✓' : '✗'}
                              </div>
                            )}
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {choice.outcomes.slice(0, 3).map((out, i) => {
                                const hints: string[] = []
                                if (out.realmProgressChange && out.realmProgressChange > 0) hints.push('修为↑')
                                if (out.realmProgressChange && out.realmProgressChange < 0) hints.push('修为↓')
                                if (out.spiritStonesChange && out.spiritStonesChange > 0) hints.push('灵石↑')
                                if (out.karmaChange && out.karmaChange > 0) hints.push('善果')
                                if (out.karmaChange && out.karmaChange < 0) hints.push('恶果')
                                if (out.bodyChange && out.bodyChange < 0) hints.push('受伤风险')
                                if (out.skillGain) hints.push('技能可能')
                                return hints.length > 0 ? (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-[rgba(60,60,120,0.3)] text-secondary">
                                    概率{Math.round(out.probability * 100)}% · {hints.join('，')}
                                  </span>
                                ) : null
                              })}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {!pendingEvent && !loading && exploredCount > 0 && (
        <div className="card mt-6">
          <h3 className="section-title">💡 探索提示</h3>
          <ul className="text-sm text-secondary space-y-2">
            <li>• 不同的洞天区域危险程度不同，收益与风险总是成正比的。</li>
            <li>• 某些选择有属性或技能门槛，提升自己的属性或许能解锁更多选项。</li>
            <li>• 神识高的人更容易洞察危险，体魄好的人即使遭遇劫难也更容易全身而退。</li>
            <li>• 气运是玄妙之物，气运高者往往能逢凶化吉。</li>
          </ul>
        </div>
      )}
    </div>
  )
}
