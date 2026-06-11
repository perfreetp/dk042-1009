import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ENDINGS } from '@/data/gameData'
import { ORIGIN_INFO, DAOXIN_INFO, REALM_ORDER, SECT_POSITION_INFO } from '@/types/game'
import type { SectPosition } from '@/types/game'

const RARITY_ORDER = ['普通', '稀有', '传说', '神话'] as const

export default function EndingScreen() {
  const character = useGameStore(s => s.character)
  const endingId = useGameStore(s => s.endingId)
  const availableEndings = useGameStore(s => s.availableEndings)
  const endingReasons = useGameStore(s => s.endingReasons)
  const relationships = useGameStore(s => s.relationships)
  const logs = useGameStore(s => s.logs)
  const mainQuest = useGameStore(s => s.mainQuest)
  const mainQuestChoices = useGameStore(s => s.mainQuestChoices)
  const secretRealmProgress = useGameStore(s => s.secretRealmProgress)
  const secretRealmResults = useGameStore(s => s.secretRealmResults)
  const positionHistory = useGameStore(s => s.positionHistory)
  const breakthroughHistory = useGameStore(s => s.breakthroughHistory)
  const sectEventRecords = useGameStore(s => s.sectEventRecords)
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

  interface ChronicleEvent {
    day: number
    type: 'main' | 'sect' | 'position' | 'breakthrough' | 'secret' | 'demon' | 'injury'
    icon: string
    title: string
    description: string
    success?: boolean
  }

  const chronicle = useMemo<ChronicleEvent[]>(() => {
    const events: ChronicleEvent[] = []

    if (mainQuestChoices) {
      mainQuestChoices.forEach(c => {
        const step = mainQuest?.steps.find(s => s.id === c.stepId)
        events.push({
          day: step?.minDay || 1,
          type: 'main',
          icon: '📜',
          title: `主线·${c.stepTitle}`,
          description: `选择「${c.choiceText}」${c.outcomeSummary}`,
          success: true
        })
      })
    }

    if (positionHistory) {
      positionHistory.forEach(p => {
        const info = SECT_POSITION_INFO[p.position as SectPosition]
        events.push({
          day: p.day,
          type: 'position',
          icon: '🏵️',
          title: '宗门晋升',
          description: `晋升为【${info?.name || p.position}】`,
          success: true
        })
      })
    }

    if (breakthroughHistory) {
      breakthroughHistory.forEach(b => {
        events.push({
          day: b.day,
          type: 'breakthrough',
          icon: b.success ? '⚡' : '💥',
          title: b.success ? '突破成功' : '突破失败',
          description: `尝试突破【${b.realm}】${b.hadInjury && b.injuryName ? `，留下${b.injuryName}` : ''}`,
          success: b.success
        })
      })
    }

    if (sectEventRecords) {
      sectEventRecords.forEach(e => {
        events.push({
          day: e.day,
          type: 'sect',
          icon: '🏛️',
          title: `宗门要事·${e.title}`,
          description: `选择「${e.choiceText}」`,
          success: e.success
        })
      })
    }

    if (secretRealmResults) {
      secretRealmResults.forEach(r => {
        events.push({
          day: 50,
          type: 'secret',
          icon: '🗝️',
          title: `秘境·${r.name}`,
          description: `最终抉择：${r.finalChoice}`,
          success: r.completed
        })
        if (r.hiddenDemonTriggered && r.hiddenDemonChoiceText) {
          events.push({
            day: 60,
            type: 'demon',
            icon: '🪞',
            title: '往生镜·隐藏心魔题',
            description: `你的答案：${r.hiddenDemonChoiceText}`,
            success: true
          })
        }
      })
    }

    if (character?.injuries && character.injuries.length > 0) {
      character.injuries.forEach(ij => {
        events.push({
          day: currentDay,
          type: 'injury',
          icon: '🩹',
          title: '未愈伤势',
          description: `${ij.name}（剩余${ij.daysRemaining}日）`,
          success: false
        })
      })
    }

    if (character?.hasPillToxin) {
      events.push({
        day: currentDay,
        type: 'injury',
        icon: '☠️',
        title: '丹毒残留',
        description: '下次突破成功率 -5%',
        success: false
      })
    }

    return events.sort((a, b) => a.day - b.day)
  }, [mainQuestChoices, mainQuest, positionHistory, breakthroughHistory, sectEventRecords, secretRealmResults, character, currentDay])

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

        <div className="card mb-8" style={{ borderColor: 'rgba(139,92,246,0.5)' }}>
          <h2 className="section-title text-xl mb-4">📜 一生履历 · 修行足迹</h2>
          <p className="text-secondary text-sm mb-6">
            你一生的重要选择与经历，汇聚成此刻的结局——
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            {positionHistory && positionHistory.length > 0 && (
              <div className="p-5 rounded-xl bg-[rgba(212,175,55,0.05)] border border-[rgba(212,175,55,0.2)]">
                <h3 className="font-bold text-gold mb-3 flex items-center gap-2">
                  🏵️ 宗门履历
                </h3>
                <div className="space-y-2">
                  {positionHistory.map((p, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-secondary">仙历第 {p.day} 日</span>
                      <span className="font-bold">→ {SECT_POSITION_INFO[p.position as SectPosition]?.name || p.position}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[rgba(212,175,55,0.15)] text-xs text-secondary">
                  宗门声望：{character?.sectFame || 0}，最终职位：
                  <span className="text-gold font-bold ml-1">
                    {SECT_POSITION_INFO[(character?.sectPosition || 'outer') as SectPosition]?.name}
                  </span>
                </div>
                {character?.injuries && character.injuries.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[rgba(212,175,55,0.1)] text-xs">
                    <span className="text-bad font-bold">🩹 未愈伤势：</span>
                    <span className="text-secondary ml-1">
                      {character.injuries.map(ij => `${ij.name}（剩余${ij.daysRemaining}日）`).join('、')}
                    </span>
                  </div>
                )}
                {sectEventRecords && sectEventRecords.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[rgba(212,175,55,0.1)] text-xs">
                    <span className="text-purple-300 font-bold">🏛️ 宗门要事：</span>
                    <div className="mt-1 space-y-1">
                      {sectEventRecords.map((e, i) => (
                        <div key={i} className="text-secondary flex justify-between">
                          <span>仙历第{e.day}日</span>
                          <span className={e.success ? 'text-good' : 'text-bad'}>
                            {e.success ? '✓' : '✗'} {e.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {breakthroughHistory && breakthroughHistory.length > 0 && (
              <div className="p-5 rounded-xl bg-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.2)]">
                <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--accent-purple)' }}>
                  ⚡ 境界突破
                </h3>
                <div className="space-y-2">
                  {breakthroughHistory.map((b, i) => (
                    <div key={i} className="flex justify-between text-sm items-center">
                      <span className="text-secondary">仙历第 {b.day} 日</span>
                      <span className={b.success ? 'text-good font-bold' : 'text-bad font-bold'}>
                        {b.success ? '✓' : '✗'} {b.realm}
                        {b.hadInjury && b.injuryName && <span className="ml-1 text-xs text-bad">[留下{b.injuryName}]</span>}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[rgba(139,92,246,0.15)] text-xs text-secondary">
                  成功突破 {breakthroughHistory.filter(b => b.success).length} 次，
                  失败 {breakthroughHistory.filter(b => !b.success).length} 次
                  {breakthroughHistory.some(b => b.hadInjury) && (
                    <span className="text-bad ml-2">
                      · 留下伤势：{breakthroughHistory.filter(b => b.injuryName).map(b => b.injuryName).join('、')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {mainQuest && (
              <div className="p-5 rounded-xl bg-[rgba(251,191,36,0.05)] border border-[rgba(251,191,36,0.2)]">
                <h3 className="font-bold text-gold mb-3 flex items-center gap-2">
                  📜 主线 · {mainQuest.name}
                </h3>
                <div className="mb-3 text-sm">
                  <span className="text-secondary">最终状态：</span>
                  <span className={mainQuest.completed ? 'text-good font-bold' : 'text-info font-bold'}>
                    {mainQuest.completed ? '已完成' : `进行中（第 ${mainQuest.currentStepIndex + 1}/${mainQuest.steps.length} 章）`}
                  </span>
                </div>
                {mainQuestChoices && mainQuestChoices.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mainQuestChoices.map((c, i) => (
                      <div key={i} className="p-2 rounded bg-[var(--bg-secondary)] text-xs">
                        <div className="font-bold mb-0.5 text-gold">
                          【{c.stepTitle}】{c.outcomeSummary}
                        </div>
                        <div className="text-secondary">你的选择：{c.choiceText}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-secondary">未做出主线选择</p>
                )}
              </div>
            )}

            {secretRealmProgress && secretRealmProgress.length > 0 && (
              <div className="p-5 rounded-xl bg-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.2)]">
                <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--accent-purple)' }}>
                  🗝️ 天机秘境
                </h3>
                <div className="mb-3 text-sm">
                  {secretRealmProgress[0].completed ? (
                    <span className="text-good font-bold">✨ 已完成全部探索</span>
                  ) : (
                    <span className="text-info font-bold">
                      进度 {secretRealmProgress[0].stage}/{secretRealmProgress[0].totalStages}
                    </span>
                  )}
                </div>
                {secretRealmResults && secretRealmResults.length > 0 && (
                  <div className="space-y-2">
                    {secretRealmResults.map((r, i) => (
                      <div key={i} className="p-2 rounded bg-[var(--bg-secondary)] text-xs">
                        <div className="font-bold text-gold mb-0.5">{r.name}</div>
                        <div className="text-secondary">最终抉择：{r.finalChoice}</div>
                        {r.unlockedHiddenDemon && r.hiddenDemonTriggered && r.hiddenDemonChoiceText && (
                          <>
                            <div className="text-purple mt-1">· 🪞 往生镜触发隐藏心魔题</div>
                            <div className="text-secondary ml-2">你的答案：{r.hiddenDemonChoiceText}</div>
                            <div className="text-secondary italic ml-2">结果：{r.hiddenDemonOutcome}</div>
                          </>
                        )}
                        {r.unlockedHiddenDemon && !r.hiddenDemonTriggered && (
                          <div className="text-gold">· 解锁隐藏心魔题（尚未触发）</div>
                        )}
                        {r.unlockedHiddenDemon && r.hiddenDemonTriggered && (!r.hiddenDemonChoiceText && (
                          <div className="text-good">· 已触发隐藏心魔题</div>
                        ))}
                        {r.acquiredSkillId && (
                          <div className="text-info">· 获得特殊功法</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {relationships && relationships.filter(r => Math.abs(r.bond) >= 30).length > 0 && (
              <div className="p-5 rounded-xl bg-[rgba(239,68,68,0.03)] border border-[rgba(239,68,68,0.15)] md:col-span-2">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  💞 重要羁绊
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {relationships
                    .filter(r => Math.abs(r.bond) >= 30)
                    .sort((a, b) => Math.abs(b.bond) - Math.abs(a.bond))
                    .map(r => (
                      <div key={r.id} className="p-3 rounded-lg bg-[var(--bg-secondary)] flex items-center gap-2">
                        <div className="text-3xl">{r.portrait}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">{r.name}</div>
                          <div className="text-xs text-secondary">{r.title}</div>
                          <div className={`text-xs font-bold ${r.bond >= 0 ? 'text-good' : 'text-bad'}`}>
                            {r.bond >= 0 ? '情深' : '仇怨'} {Math.abs(r.bond)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {chronicle.length > 0 && (
          <div className="card mb-8" style={{ borderColor: 'rgba(139,92,246,0.4)' }}>
            <h2 className="section-title text-xl">📖 修仙传记·大事年表</h2>
            <p className="text-secondary text-sm mb-6">
              按时间线回顾你这一生的重要时刻，每一步都铸就了今日的结局。
            </p>
            <div className="relative pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-[2px] bg-gradient-to-b from-[rgba(139,92,246,0.8)] via-[rgba(236,72,153,0.4)] to-[rgba(139,92,246,0.2)]" />
              {chronicle.map((evt, idx) => (
                <div key={idx} className="relative mb-4">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-[rgba(139,92,246,0.6)] bg-[var(--bg-primary)] flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${
                      evt.success === false ? 'bg-bad' :
                      evt.type === 'main' ? 'bg-info' :
                      evt.type === 'sect' ? 'bg-purple-500' :
                      evt.type === 'position' ? 'bg-gold' :
                      evt.type === 'breakthrough' ? 'bg-orange-500' :
                      evt.type === 'secret' ? 'bg-purple-500' :
                      evt.type === 'demon' ? 'bg-pink-500' :
                      'bg-gray-500'
                    }`} />
                  </div>
                  <div className="ml-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-secondary">仙历{evt.day}日</span>
                      <span className={`text-xs px-2 py-[1px] rounded-full ${
                        evt.success === false
                          ? 'bg-[rgba(239,68,68,0.15)] text-bad'
                          : 'bg-[rgba(139,92,246,0.15)] text-[rgba(167,139,250,0.9)]'
                      }`}>
                        {evt.icon} {evt.title}
                      </span>
                    </div>
                    <div className="text-sm text-primary">{evt.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {endingReasons.length > 0 && (
          <div className="card mb-8" style={{ borderColor: 'rgba(251,191,36,0.4)' }}>
            <h2 className="section-title text-xl">📋 结局达成原因分析</h2>
            <p className="text-secondary text-sm mb-4">
              你的每一个选择，都在影响最终的结局。以下是系统根据你的修行轨迹做出的判定：
            </p>
            <div className="space-y-2">
              {endingReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg flex items-start gap-3 ${
                    reason.met
                      ? 'bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.3)]'
                      : 'bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)]'
                  }`}
                >
                  <div className="text-2xl flex-shrink-0 mt-0.5">
                    {reason.met ? '✅' : '❌'}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-bold ${reason.met ? 'text-good' : 'text-bad'}`}>
                        {reason.condition}
                      </span>
                      <span className="text-xs text-secondary">
                        权重: {reason.weight > 0 ? '+' : ''}{reason.weight}
                      </span>
                    </div>
                    <p className="text-sm text-secondary">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-lg bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)]">
              <p className="text-sm text-secondary text-center">
                💡 <span className="text-good">绿色</span> 表示该条件对你达成此结局有正面贡献，
                <span className="text-bad"> 红色</span> 表示该条件未满足或产生负面影响
              </p>
            </div>
          </div>
        )}

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
