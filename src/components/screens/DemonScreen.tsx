import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { DemonChoice } from '@/types/game'

export default function DemonScreen() {
  const character = useGameStore(s => s.character)
  const pendingDemonTrial = useGameStore(s => s.pendingDemonTrial)
  const triggerDemonTrial = useGameStore(s => s.triggerDemonTrial)
  const resolveDemonChoice = useGameStore(s => s.resolveDemonChoice)
  const breakthroughReady = useGameStore(s => s.breakthroughReady)
  const attemptBreakthrough = useGameStore(s => s.attemptBreakthrough)

  const [loading, setLoading] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<DemonChoice | null>(null)
  const [outcomeShown, setOutcomeShown] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [showBreakthroughOptions, setShowBreakthroughOptions] = useState(false)

  const handleStartTrial = async () => {
    setLoading(true)
    setSelectedChoice(null)
    setOutcomeShown(false)
    await triggerDemonTrial()
    setLoading(false)
  }

  const handleChoose = (choice: DemonChoice) => {
    setSelectedChoice(choice)
    setOutcomeShown(true)
  }

  const handleConfirmOutcome = () => {
    if (!selectedChoice) return
    resolveDemonChoice(selectedChoice)
    setCompletedCount(c => c + 1)
    setSelectedChoice(null)
    setOutcomeShown(false)
  }

  if (!character) return null

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="card mb-6" style={{ borderColor: 'var(--accent-purple)', boxShadow: 'var(--shadow-glow)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="section-title" style={{ color: 'var(--accent-purple)' }}>
              👁️ 心魔试炼 · 本心拷问
            </h2>
            <p className="text-secondary text-sm">
              修行路上，最大的敌人从不是妖兽与天劫——而是自己的本心。<br/>
              每一次直面心魔，都是一次道心的淬火成钢。
            </p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <div className="text-sm text-secondary">
              已通过试炼：<span className="font-bold text-gold">{completedCount}</span> 次
            </div>
            <button
              className="btn btn-primary text-lg py-3 px-6"
              onClick={handleStartTrial}
              disabled={loading || !!pendingDemonTrial}
              style={{
                boxShadow: !pendingDemonTrial && !loading ? '0 0 25px rgba(139,92,246,0.4)' : undefined,
                animation: !pendingDemonTrial && !loading ? 'pulse-glow 2.5s ease-in-out infinite' : undefined
              }}
            >
              {loading ? '🌀 心魔降临中...' : pendingDemonTrial ? '⚡ 拷问中' : '🔥 开启心魔试炼'}
            </button>
            {breakthroughReady && (
              <button
                className="btn btn-gold text-lg py-3 px-6"
                onClick={() => setShowBreakthroughOptions(true)}
              >
                ⚡ 境界突破
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="card text-center py-16">
          <div className="text-8xl mb-6 animate-pulse">👁️</div>
          <p className="text-xl mb-2" style={{ color: 'var(--accent-purple)' }}>识海之中，黑影渐显……</p>
          <p className="text-secondary text-sm">你的心魔，正在成形。</p>
        </div>
      )}

      {pendingDemonTrial && !outcomeShown && !loading && (
        <div className="fade-in">
          <div className="card mb-6" style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(239,68,68,0.1))',
            borderColor: 'var(--accent-purple)',
            boxShadow: '0 0 40px rgba(139,92,246,0.3)'
          }}>
            <div className="text-center mb-6">
              <div className="inline-block text-7xl mb-4" style={{ animation: 'sparkle 2s ease-in-out infinite' }}>
                👁️
              </div>
              <div className="text-sm text-secondary mb-2">——心魔拷问——</div>
            </div>

            <div className="p-6 rounded-xl bg-[rgba(0,0,0,0.3)] border border-[rgba(139,92,246,0.3)] mb-6">
              <p className="text-xl leading-loose text-center" style={{ lineHeight: 2 }}>
                {pendingDemonTrial.question}
              </p>
            </div>

            <div className="text-xs text-center text-secondary mb-4">
              💡 你的每一个选择，都会影响你的道心稳固度与因果业力
            </div>

            <div className="space-y-3">
              {pendingDemonTrial.choices.map(choice => {
                const good = choice.heartStrength > 20
                const bad = choice.heartStrength < -20
                return (
                  <button
                    key={choice.id}
                    onClick={() => handleChoose(choice)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all hover:-translate-y-0.5 ${
                      good
                        ? 'border-[rgba(16,185,129,0.5)] bg-[rgba(16,185,129,0.05)] hover:border-[var(--accent-green)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                        : bad
                        ? 'border-[rgba(239,68,68,0.5)] bg-[rgba(239,68,68,0.05)] hover:border-[var(--accent-red)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                        : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-gold)] hover:shadow-[var(--shadow-gold)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">
                        {good ? '✨' : bad ? '💀' : '🔹'}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-lg mb-2 leading-relaxed">{choice.text}</div>
                        <div className="flex gap-3 flex-wrap text-xs opacity-70">
                          <span className={choice.heartStrength >= 0 ? 'text-good' : 'text-bad'}>
                            心之力：{choice.heartStrength > 0 ? '+' : ''}{choice.heartStrength}
                          </span>
                          <span className={choice.karmaEffect >= 0 ? 'text-good' : 'text-bad'}>
                            因果影响：{choice.karmaEffect > 0 ? '+' : ''}{choice.karmaEffect}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {outcomeShown && selectedChoice && (
        <div className="fade-in">
          <div className="card text-center" style={{
            background: selectedChoice.heartStrength >= 0
              ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.1))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(139,92,246,0.1))',
            borderColor: selectedChoice.heartStrength >= 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            boxShadow: `0 0 40px ${selectedChoice.heartStrength >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
          }}>
            <div className="text-8xl mb-4">
              {selectedChoice.heartStrength >= 30 ? '🌟' : selectedChoice.heartStrength >= 0 ? '✨' : '💔'}
            </div>
            <h3 className={`text-2xl font-bold mb-6 ${selectedChoice.heartStrength >= 0 ? 'text-good' : 'text-bad'}`}>
              {selectedChoice.heartStrength >= 30 ? '道心圆满！' : selectedChoice.heartStrength >= 0 ? '道心得守' : '道心动摇……'}
            </h3>
            <div className="p-6 rounded-xl bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] mb-6">
              <p className="text-lg leading-loose" style={{ lineHeight: 2 }}>
                {selectedChoice.outcomeText}
              </p>
            </div>
            <div className="flex justify-center gap-6 mb-6 flex-wrap">
              <div className="text-center">
                <div className="text-sm text-secondary mb-1">心之力</div>
                <div className={`text-2xl font-bold ${selectedChoice.heartStrength >= 0 ? 'text-good' : 'text-bad'}`}>
                  {selectedChoice.heartStrength > 0 ? '+' : ''}{selectedChoice.heartStrength}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-secondary mb-1">因果</div>
                <div className={`text-2xl font-bold ${selectedChoice.karmaEffect >= 0 ? 'text-good' : 'text-bad'}`}>
                  {selectedChoice.karmaEffect > 0 ? '+' : ''}{selectedChoice.karmaEffect}
                </div>
              </div>
              {selectedChoice.heartStrength >= 30 && (
                <div className="text-center">
                  <div className="text-sm text-secondary mb-1">修为进度</div>
                  <div className="text-2xl font-bold text-gold">+30</div>
                </div>
              )}
            </div>
            <button className="btn btn-primary text-lg py-3 px-10" onClick={handleConfirmOutcome}>
              收下这份考验 →
            </button>
          </div>
        </div>
      )}

      {!pendingDemonTrial && !loading && !outcomeShown && (
        <div className="grid gap-4">
          <div className="card">
            <h3 className="section-title">🕯️ 心魔试炼说明</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-[var(--bg-secondary)]">
                <h4 className="font-bold text-good mb-2 flex items-center gap-2">
                  ✅ 通过试炼的好处
                </h4>
                <ul className="text-sm text-secondary space-y-2">
                  <li>• 心之力高，可获得大量修为进度（最高+30）</li>
                  <li>• 神识属性提升，道心更加稳固</li>
                  <li>• 有助于后续的境界突破</li>
                  <li>• 部分结局需要足够的"心之历练"</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-[var(--bg-secondary)]">
                <h4 className="font-bold text-bad mb-2 flex items-center gap-2">
                  ⚠️ 失败的代价
                </h4>
                <ul className="text-sm text-secondary space-y-2">
                  <li>• 道心动摇，神识受损</li>
                  <li>• 负面因果积累</li>
                  <li>• 严重者可能走火入魔，修为倒退</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">🔮 你的道心属性</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[var(--bg-secondary)] text-center">
                <div className="text-4xl mb-2">🧠</div>
                <div className="text-sm text-secondary mb-1">神识</div>
                <div className="text-xl font-bold text-info">
                  {character.mind.value} / {character.mind.max}
                </div>
                <div className="text-xs text-secondary mt-1">神识越高，越能识破心魔诡计</div>
              </div>
              <div className="p-4 rounded-lg bg-[var(--bg-secondary)] text-center">
                <div className="text-4xl mb-2">⚖️</div>
                <div className="text-sm text-secondary mb-1">因果</div>
                <div className={`text-xl font-bold ${character.karma >= 0 ? 'text-good' : 'text-bad'}`}>
                  {character.karma >= 0 ? '+' : ''}{character.karma}
                </div>
                <div className="text-xs text-secondary mt-1">
                  善因者心魔更弱，恶业者心魔更强
                </div>
              </div>
              <div className="p-4 rounded-lg bg-[var(--bg-secondary)] text-center">
                <div className="text-4xl mb-2">🍀</div>
                <div className="text-sm text-secondary mb-1">气运</div>
                <div className="text-xl font-bold text-gold">{character.luck}</div>
                <div className="text-xs text-secondary mt-1">气旺者逢凶化吉</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBreakthroughOptions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card card-gold max-w-2xl w-full fade-in">
            <h2 className="section-title text-center text-2xl mb-6">⚡ 境界突破策略</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { k: 'safe', i: '🐢', t: '稳中求胜', s: '高成功 / 低收益', d: '成功率75%，成功+10，失败-20' },
                { k: 'balanced', i: '⚖️', t: '平衡之道', s: '中成功 / 中收益', d: '成功率50%，成功+20，失败-40' },
                { k: 'reckless', i: '🔥', t: '破釜沉舟', s: '低成功 / 高收益', d: '成功率25%，成功+50，失败-60' }
              ].map(opt => (
                <button
                  key={opt.k}
                  onClick={() => {
                    attemptBreakthrough(opt.k as any)
                    setShowBreakthroughOptions(false)
                  }}
                  className="p-5 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] hover:border-[var(--border-gold)] transition-all text-center"
                >
                  <div className="text-4xl mb-2">{opt.i}</div>
                  <div className="font-bold mb-1">{opt.t}</div>
                  <div className="text-xs text-info mb-2">{opt.s}</div>
                  <div className="text-xs text-secondary">{opt.d}</div>
                </button>
              ))}
            </div>
            <button className="btn w-full" onClick={() => setShowBreakthroughOptions(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
