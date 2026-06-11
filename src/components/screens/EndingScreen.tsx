import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ENDINGS } from '@/data/gameData'
import { ORIGIN_INFO, DAOXIN_INFO, REALM_ORDER } from '@/types/game'

const RARITY_ORDER = ['普通', '稀有', '传说', '神话'] as const

export default function EndingScreen() {
  const character = useGameStore(s => s.character)
  const endingId = useGameStore(s => s.endingId)
  const availableEndings = useGameStore(s => s.availableEndings)
  const relationships = useGameStore(s => s.relationships)
  const logs = useGameStore(s => s.logs)
  const resetGame = useGameStore(s => s.resetGame)
  const currentDay = useGameStore(s => s.currentDay)
  const quests = useGameStore(s => s.completedQuests)

  const ending = useMemo(() => ENDINGS.find(e => e.id === endingId), [endingId])
  const otherEndings = useMemo(
    () => availableEndings.filter(id => id !== endingId).map(id => ENDINGS.find(e => e.id === id)!).filter(Boolean),
    [availableEndings, endingId]
  )

  const stats = useMemo(() => {
    if (!character) return null
    const bondSum = relationships.reduce((s, r) => s + r.bond, 0)
    const positiveBonds = relationships.filter(r => r.bond > 20)
    const negativeBonds = relationships.filter(r => r.bond < -20)
    const karmaLabel = character.karma > 50 ? '大善之人'
      : character.karma > 20 ? '善心人士'
      : character.karma > -20 ? '中性之人'
      : character.karma > -50 ? '有污点者' : '大奸大恶'
    const originInfo = ORIGIN_INFO[character.origin]
    const daoxinInfo = DAOXIN_INFO[character.daoxin]
    const realmRank = REALM_ORDER.indexOf(character.realm)

    return {
      bondSum,
      positiveBonds,
      negativeBonds,
      karmaLabel,
      originInfo,
      daoxinInfo,
      realmRank
    }
  }, [character, relationships])

  const rarityClass = ending ? (
    ending.rarity === '神话' ? 'rarity-myth' :
    ending.rarity === '传说' ? 'rarity-legend' :
    ending.rarity === '稀有' ? 'rarity-rare' : 'rarity-common'
  ) : ''

  if (!ending || !character || !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-secondary">结局加载中……</p>
      </div>
    )
  }

  return (
    <div className="fade-in min-h-full pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-4">
          <div className="text-8xl mb-4" style={{ animation: 'sparkle 2s ease-in-out infinite' }}>
            {ending.rarity === '神话' ? '🌅' : ending.rarity === '传说' ? '⭐' : ending.rarity === '稀有' ? '💫' : '📜'}
          </div>
          <div className={`inline-block text-xs font-bold px-4 py-1 rounded-full mb-3 ${rarityClass}`}
               style={{
                 background: ending.rarity === '神话' ? 'rgba(251,191,36,0.15)' :
                            ending.rarity === '传说' ? 'rgba(192,132,252,0.15)' :
                            ending.rarity === '稀有' ? 'rgba(96,165,250,0.15)' :
                            'rgba(156,163,175,0.15)'
               }}>
            {ending.subtitle} · 达成率：约 {RARITY_ORDER.indexOf(ending.rarity as any) === 0 ? '40%' :
                                 RARITY_ORDER.indexOf(ending.rarity as any) === 1 ? '25%' :
                                 RARITY_ORDER.indexOf(ending.rarity as any) === 2 ? '10%' : '3%'}
          </div>
          <h1 className={`text-5xl font-bold mb-4 ${rarityClass}`}
              style={{ textShadow: ending.rarity === '神话' ? '0 0 30px rgba(251,191,36,0.5)' :
                                 ending.rarity === '传说' ? '0 0 25px rgba(192,132,252,0.4)' : 'none' }}>
            {ending.title}
          </h1>
          <p className="text-xl text-secondary italic max-w-2xl mx-auto">
            "{ending.description}"
          </p>
        </div>

        <div className="card card-gold mb-8" style={{
          borderColor: ending.rarity === '神话' ? 'rgba(251,191,36,0.5)' :
                     ending.rarity === '传说' ? 'rgba(192,132,252,0.5)' : 'var(--border-light)'
        }}>
          <div className="p-6 rounded-xl bg-gradient-to-br from-[rgba(139,92,246,0.08)] to-[rgba(212,175,55,0.08)] border border-[rgba(255,255,255,0.05)]">
            <p className="text-lg leading-loose" style={{ lineHeight: 2.2 }}>
              {ending.narrative}
            </p>
          </div>
        </div>

        <div className="card mb-8">
          <h2 className="section-title text-xl">📊 修行数据一览</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold text-gold mb-3">🧘 基础信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">姓名</span>
                  <span className="font-bold">{character.name}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">出身</span>
                  <span>{stats.originInfo.name}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">道心</span>
                  <span style={{ color: 'var(--accent-purple)' }}>{stats.daoxinInfo.name}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">最终境界</span>
                  <span className="font-bold text-gold">{character.realm}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">修行时长</span>
                  <span>{currentDay} 日（约 {Math.floor(currentDay / 365)} 年）</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">年龄</span>
                  <span>{character.age} 岁</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gold mb-3">⚖️ 数值统计</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">因果</span>
                  <span className={`font-bold ${character.karma >= 0 ? 'text-good' : 'text-bad'}`}>
                    {character.karma >= 0 ? '+' : ''}{character.karma}（{stats.karmaLabel}）
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">名望</span>
                  <span className="font-bold text-info">{character.fame}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">气运</span>
                  <span className="font-bold text-good">{character.luck}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">财富</span>
                  <span className="font-bold text-gold">💎 {character.spiritStones}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">羁绊总数</span>
                  <span className="font-bold">{stats.bondSum >= 0 ? '+' : ''}{stats.bondSum}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-[var(--bg-secondary)]">
                  <span className="text-secondary">完成委托</span>
                  <span className="font-bold">{quests.length} 件</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-gold mb-3">💖 人物羁绊</h3>
            {relationships.length === 0 ? (
              <p className="text-secondary text-sm text-center py-4">你这一生，竟是独自一人走过……</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {relationships.sort((a, b) => Math.abs(b.bond) - Math.abs(a.bond)).slice(0, 9).map(r => (
                  <div key={r.id} className="p-3 rounded-lg bg-[var(--bg-secondary)] flex items-center gap-3">
                    <div className="text-3xl flex-shrink-0">{r.portrait}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm truncate">{r.name}</span>
                        <span className={`text-xs font-bold ${r.bond >= 0 ? 'text-good' : 'text-bad'}`}>
                          {r.bond >= 0 ? '+' : ''}{r.bond}
                        </span>
                      </div>
                      <div className="text-[10px] text-secondary truncate">{r.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-gold mb-3">📚 习得功法</h3>
            {character.skills.length === 0 ? (
              <p className="text-secondary text-sm text-center py-4">你竟是完全不懂任何功法……</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {character.skills.map(s => (
                  <div key={s.id} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{s.name}</span>
                      <span className="text-xs text-gold">Lv.{s.level}</span>
                    </div>
                    <div className="text-[10px] text-secondary line-clamp-2">{s.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {otherEndings.length > 0 && (
          <div className="card mb-8">
            <h2 className="section-title text-xl">🔮 你与这些结局，也曾只有一步之遥</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {otherEndings.map(e => (
                <div key={e.id} className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-bold ${
                      e.rarity === '神话' ? 'rarity-myth' :
                      e.rarity === '传说' ? 'rarity-legend' :
                      e.rarity === '稀有' ? 'rarity-rare' : 'rarity-common'
                    }`}>
                      {e.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(60,60,120,0.4)] text-secondary">
                      {e.rarity}
                    </span>
                  </div>
                  <p className="text-xs text-secondary">{e.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card mb-8">
          <h2 className="section-title text-xl">📜 修行日志 · 要事节选</h2>
          <div className="max-h-96 overflow-y-auto space-y-2 p-2">
            {logs.filter(l => l.narrative.includes('【') || l.narrative.includes('突破') || l.narrative.includes('结局'))
              .slice(-30).map((l, i) => (
              <div key={i} className="p-3 rounded-lg bg-[var(--bg-secondary)] border-l-4 border-[var(--border-gold)]">
                <div className="text-[10px] text-secondary mb-1">仙历第 {l.day} 日</div>
                <div className="text-sm leading-relaxed">{l.narrative}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-gold text-center mb-8 p-8">
          <div className="text-5xl mb-4">🌙</div>
          <p className="text-xl text-gold mb-4 font-bold">
            —— 修仙路远，道阻且长 ——
          </p>
          <p className="text-secondary leading-relaxed max-w-xl mx-auto mb-6">
            这一段故事，到此画上了句点。<br/>
            但修仙界的传说永无止境——换一个出身，立一种道心，<br/>
            又会是怎样一段截然不同的仙途？
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="btn btn-primary text-lg py-3 px-8" onClick={resetGame}>
              🔁 再启新程
            </button>
          </div>
          <p className="text-xs text-secondary mt-6">
            本结局 ID：{ending.id} · 所有结局共 {ENDINGS.length} 种
          </p>
        </div>
      </div>
    </div>
  )
}
