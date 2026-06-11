import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Quest, QuestChoice, MainQuest, RelationshipEvent } from '@/types/game'
import { SECT_POSITION_INFO, REALM_ORDER } from '@/types/game'
import { generateShopItems } from '@/services/aiService'
import type { Skill } from '@/types/game'
import { SECT_QUESTS } from '@/data/gameData'

interface ShopItem {
  skill: Skill
  price: number
}

const ROLE_LABELS: Record<string, string> = {
  master: '师父',
  friend: '好友',
  lover: '道侣',
  enemy: '仇敌',
  rival: '对手',
  disciple: '弟子',
  acquaintance: '相识'
}

export default function TownScreen() {
  const character = useGameStore(s => s.character)
  const relationships = useGameStore(s => s.relationships)
  const quests = useGameStore(s => s.quests)
  const mainQuest = useGameStore(s => s.mainQuest)
  const pendingRelationshipEvent = useGameStore(s => s.pendingRelationshipEvent)
  const refreshTown = useGameStore(s => s.refreshTown)
  const interactWithNPC = useGameStore(s => s.interactWithNPC)
  const acceptQuest = useGameStore(s => s.acceptQuest)
  const resolveQuest = useGameStore(s => s.resolveQuest)
  const resolveMainQuestChoice = useGameStore(s => s.resolveMainQuestChoice)
  const resolveRelationshipEvent = useGameStore(s => s.resolveRelationshipEvent)
  const buySkill = useGameStore(s => s.buySkill)
  const addLog = useGameStore(s => s.addLog)
  const trySectPositionUpgrade = useGameStore(s => s.trySectPositionUpgrade)

  const [tab, setTab] = useState<'people' | 'quests' | 'shop'>('people')
  const [loading, setLoading] = useState(false)
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null)
  const [activeMainQuestStep, setActiveMainQuestStep] = useState<MainQuest['steps'][0] | null>(null)
  const [eventOutcome, setEventOutcome] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await refreshTown()
      const shopResp = await generateShopItems()
      setShopItems(shopResp.data)
      setLoading(false)
    }
    init()
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    await refreshTown()
    const shopResp = await generateShopItems()
    setShopItems(shopResp.data)
    addLog('你在镇上转了一圈，遇到了些新面孔，也听到了些新消息。')
    setLoading(false)
  }

  const handleResolveQuest = (choice: QuestChoice) => {
    if (!activeQuest) return
    resolveQuest(activeQuest.id, choice)
    setActiveQuest(null)
  }

  const handleBuy = (item: ShopItem) => {
    if (!character) return
    if (character.spiritStones < item.price) {
      addLog(`灵石不足！购买【${item.skill.name}】需要 ${item.price} 灵石。`)
      return
    }
    buySkill(item.skill.id, item.price)
    setShopItems(prev => prev.filter(i => i.skill.id !== item.skill.id))
  }

  const handleResolveMainQuest = (choice: QuestChoice) => {
    if (!activeMainQuestStep) return
    setEventOutcome(choice.specialOutcome || '你的选择产生了深远的影响……')
    setTimeout(() => {
      resolveMainQuestChoice(choice)
      setActiveMainQuestStep(null)
      setEventOutcome(null)
    }, 2000)
  }

  const handleRelationshipEventChoice = (choice?: QuestChoice) => {
    if (!pendingRelationshipEvent) return
    if (choice) {
      setEventOutcome(choice.specialOutcome || '事情告一段落……')
      setTimeout(() => {
        resolveRelationshipEvent(choice)
        setEventOutcome(null)
      }, 2000)
    } else {
      resolveRelationshipEvent()
    }
  }

  const getBondColor = (bond: number) => {
    if (bond >= 50) return 'text-good'
    if (bond >= 20) return 'text-info'
    if (bond > -20) return 'text-secondary'
    if (bond > -50) return 'text-bad'
    return 'text-bad font-bold'
  }

  const getBondLabel = (bond: number) => {
    if (bond >= 80) return '生死之交'
    if (bond >= 50) return '莫逆于心'
    if (bond >= 20) return '意气相投'
    if (bond > -20) return '点头之交'
    if (bond > -50) return '心存芥蒂'
    return '势不两立'
  }

  if (!character) return null

  return (
    <div className="fade-in max-w-5xl mx-auto">
      <div className="card card-gold mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="section-title mb-2">🏯 青云坊市</h2>
            <p className="text-secondary text-sm">
              三教九流汇集之地，或能结识贵人，或可承接委托，机缘法宝皆藏于此。
            </p>
            <div className="flex items-center gap-3 mt-3 flex-wrap text-xs">
              <div className="px-3 py-1 rounded-full bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.3)]">
                <span className="text-secondary">宗门职位：</span>
                <span className="text-gold font-bold">
                  {SECT_POSITION_INFO[character.sectPosition]?.name || character.sectPosition}
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)]">
                <span className="text-secondary">宗门声望：</span>
                <span className="font-bold text-gold">{character.sectFame || 0}</span>
              </div>
              {character.injuries && character.injuries.length > 0 && (
                <div className="px-3 py-1 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-bad">
                  🩹 伤势 ×{character.injuries.length}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-secondary">
              灵石：<span className="font-bold text-gold text-lg">💎 {character.spiritStones}</span>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => trySectPositionUpgrade()}
              title="尝试晋升宗门职位"
            >
              🏵️ 考核晋升
            </button>
            <button
              className="btn btn-primary"
              onClick={handleRefresh}
              disabled={loading}
            >
              🔄 游走探访
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-6 border-b border-[var(--border-primary)]">
          {([
            { k: 'people', l: '👥 结缘交友' },
            { k: 'quests', l: '📋 委托任务' },
            { k: 'shop', l: '🛒 功法商店' }
          ] as const).map(({ k, l }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-5 py-3 font-bold transition-all border-b-2 -mb-px ${
                tab === k
                  ? 'border-[var(--border-gold)] text-gold bg-[rgba(212,175,55,0.08)]'
                  : 'border-transparent text-secondary hover:text-[var(--text-primary)]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4 animate-bounce">🌀</div>
          <p className="text-secondary">正在探访坊市……</p>
        </div>
      ) : tab === 'people' ? (
        <div>
          <div className="card mb-6">
            <h3 className="section-title">人物关系一览</h3>
            {relationships.length === 0 ? (
              <p className="text-secondary text-center py-8">
                尚未结识任何人，点击上方「游走探访」在坊市中碰碰运气吧。
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relationships.map(npc => (
                  <div
                    key={npc.id}
                    className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-light)] transition-all"
                  >
                    <div className="flex gap-4">
                      <div className="text-5xl w-16 h-16 flex items-center justify-center rounded-full bg-[rgba(139,92,246,0.1)] flex-shrink-0">
                        {npc.portrait}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-lg text-gold">{npc.name}</span>
                          <span className="tag tag-cultivation">{ROLE_LABELS[npc.role] || npc.role}</span>
                        </div>
                        <p className="text-xs text-info mb-2">{npc.title}</p>
                        <p className="text-xs text-secondary mb-3 line-clamp-2">{npc.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 mr-4">
                            <div className="flex justify-between text-xs mb-1">
                              <span>羁绊值</span>
                              <span className={`font-bold ${getBondColor(npc.bond)}`}>
                                {npc.bond >= 0 ? '+' : ''}{npc.bond} · {getBondLabel(npc.bond)}
                              </span>
                            </div>
                            <div className="bond-bar">
                              <div
                                className={npc.bond >= 0 ? 'bond-fill-positive' : 'bond-fill-negative'}
                                style={{ width: `${Math.abs(npc.bond)}%`, marginLeft: npc.bond < 0 ? `${100 + npc.bond}%` : 0 }}
                              />
                            </div>
                          </div>
                          <button
                            className="btn btn-primary text-sm py-2 px-4 flex-shrink-0"
                            onClick={() => interactWithNPC(npc.id)}
                          >
                            💬 交谈
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : tab === 'quests' ? (
        <div>
          {mainQuest && mainQuest.started && !mainQuest.completed && (
            <div className="card card-gold mb-6" style={{ borderColor: 'rgba(251,191,36,0.6)' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="text-4xl flex-shrink-0">📜</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="section-title !mb-0">
                      【主线】{mainQuest.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-[rgba(251,191,36,0.2)] text-gold font-bold">
                      第 {mainQuest.currentStepIndex + 1}/{mainQuest.steps.length} 章
                    </span>
                  </div>
                  <p className="text-sm text-secondary mb-3">{mainQuest.description}</p>
                  {mainQuest.currentStepIndex < mainQuest.steps.length && (
                    <div className="p-4 rounded-lg bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)]">
                      <h4 className="font-bold text-gold mb-2">
                        当前任务：{mainQuest.steps[mainQuest.currentStepIndex].title}
                      </h4>
                      <p className="text-sm text-secondary mb-3">
                        {mainQuest.steps[mainQuest.currentStepIndex].description}
                      </p>
                      <button
                        className="btn btn-gold"
                        onClick={() => setActiveMainQuestStep(mainQuest.steps[mainQuest.currentStepIndex])}
                      >
                        ▶ 接取主线任务
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title !mb-0">🏵️ 宗门任务 · {SECT_POSITION_INFO[character.sectPosition]?.name}</h3>
              <span className="text-xs text-secondary">宗门声望：{character.sectFame || 0}</span>
            </div>
            <div className="grid gap-4">
              {(SECT_QUESTS[character.sectPosition] || []).map(quest => (
                <div
                  key={quest.id}
                  className="p-5 rounded-xl bg-[rgba(139,92,246,0.06)] border border-[rgba(139,92,246,0.2)] hover:border-[rgba(251,191,36,0.5)] transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-bold text-lg text-gold">{quest.title}</h4>
                        <span className={`tag ${quest.type === 'combat' ? 'tag-attack' : quest.type === 'cultivation' ? 'tag-cultivation' : 'tag-support'}`}>
                          {quest.type === 'combat' ? '战斗' : quest.type === 'social' ? '社交' : '修行'}
                        </span>
                        <span className="tag">难度 {'⭐'.repeat(quest.difficulty)}</span>
                      </div>
                      <p className="text-secondary text-sm mb-3">{quest.description}</p>
                      <div className="flex gap-3 flex-wrap text-xs text-secondary">
                        <span>奖励：灵石 {quest.reward?.spiritStones || 0}，名望 +{quest.reward?.fame || 0}，因果 +{quest.reward?.karma || 0}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary flex-shrink-0"
                      onClick={() => setActiveQuest(quest)}
                    >
                      接取
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card mb-6">
            <h3 className="section-title">可接委托</h3>
            {quests.length === 0 ? (
              <p className="text-secondary text-center py-8">
                目前暂无委托可接。点击「游走探访」看看有没有新任务吧。
              </p>
            ) : (
              <div className="grid gap-4">
                {quests.map(quest => (
                  <div
                    key={quest.id}
                    className="p-5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-gold)] transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-bold text-lg text-gold">{quest.title}</h4>
                          <span className={`tag ${
                            quest.type === 'combat' ? 'tag-attack' :
                            quest.type === 'secret' || quest.type === 'cultivation' ? 'tag-cultivation' : 'tag-support'
                          }`}>
                            {quest.type === 'commission' ? '委托' : quest.type === 'combat' ? '战斗'
                              : quest.type === 'social' ? '社交' : quest.type === 'cultivation' ? '修行' : '隐秘'}
                          </span>
                          <span className="text-xs text-secondary">
                            难度：{'⭐'.repeat(quest.difficulty)}
                          </span>
                        </div>
                        <p className="text-sm text-secondary mb-3 leading-relaxed">{quest.description}</p>
                        <div className="flex gap-2 flex-wrap text-xs">
                          {quest.reward.spiritStones && (
                            <span className="px-2 py-1 rounded bg-[rgba(212,175,55,0.1)] text-gold">
                              灵石 +{quest.reward.spiritStones}
                            </span>
                          )}
                          {quest.reward.fame && (
                            <span className="px-2 py-1 rounded bg-[rgba(59,130,246,0.1)] text-info">
                              名望 +{quest.reward.fame}
                            </span>
                          )}
                          {quest.reward.karma && (
                            <span className="px-2 py-1 rounded bg-[rgba(16,185,129,0.1)] text-good">
                              因果 +{quest.reward.karma}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="btn btn-gold flex-shrink-0"
                        onClick={() => { acceptQuest(quest.id); setActiveQuest(quest) }}
                      >
                        接取 ▶
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="card mb-6">
            <h3 className="section-title">功法阁 · 秘典残卷出售</h3>
            <p className="text-sm text-secondary mb-4">
              阁中功法均为孤本残卷，售出即空。你的灵石：
              <span className="font-bold text-gold ml-1">💎 {character.spiritStones}</span>
              ，已习得功法：<span className="font-bold ml-1">{character.skills.length}/{character.maxSkills}</span>
            </p>
            {shopItems.length === 0 ? (
              <p className="text-secondary text-center py-8">
                今日功法阁已售罄，明日请早。（点击「游走探访」刷新）
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shopItems.map(item => {
                  const owned = character.skills.some(s => s.id === item.skill.id)
                  const canAfford = character.spiritStones >= item.price
                  const slotsFree = character.skills.length < character.maxSkills
                  return (
                    <div
                      key={item.skill.id}
                      className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-gold">{item.skill.name}</h4>
                            <span className={`tag tag-${item.skill.type}`}>
                              {item.skill.type === 'attack' ? '攻击' : item.skill.type === 'defense' ? '防御'
                                : item.skill.type === 'support' ? '辅助' : '修炼'}
                            </span>
                          </div>
                          <p className="text-xs text-secondary mb-2">{item.skill.description}</p>
                          <div className="flex gap-1 flex-wrap mb-3">
                            {item.skill.tags.map(t => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(60,60,120,0.4)] text-secondary">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-xs text-secondary mb-1">售价</div>
                          <div className={`text-xl font-bold ${canAfford ? 'text-gold' : 'text-bad'}`}>
                            💎 {item.price}
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn w-full text-sm"
                        onClick={() => handleBuy(item)}
                        disabled={owned || !canAfford || !slotsFree}
                      >
                        {owned ? '已拥有' : !slotsFree ? '功法格已满' : !canAfford ? '灵石不足' : '🛒 购买参悟'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeQuest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card card-gold max-w-2xl w-full fade-in max-h-[85vh] overflow-y-auto">
            <h2 className="section-title text-xl">📋 {activeQuest.title} · 选择执行方式</h2>
            <p className="text-secondary mb-6">{activeQuest.description}</p>
            <div className="space-y-3 mb-6">
              {activeQuest.choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleResolveQuest(choice)}
                  className="w-full text-left p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-gold)] transition-all"
                >
                  <div className="font-bold mb-1">{choice.text}</div>
                  <div className="flex gap-3 flex-wrap text-xs">
                    <span className="text-info">成功率：{Math.round(choice.successRate * 100)}%</span>
                    {choice.karmaChange !== 0 && (
                      <span className={choice.karmaChange > 0 ? 'text-good' : 'text-bad'}>
                        因果 {choice.karmaChange > 0 ? '+' : ''}{choice.karmaChange}
                      </span>
                    )}
                    {choice.fameChange !== 0 && (
                      <span className={choice.fameChange > 0 ? 'text-good' : 'text-bad'}>
                        名望 {choice.fameChange > 0 ? '+' : ''}{choice.fameChange}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button className="btn w-full" onClick={() => setActiveQuest(null)}>
              取消（暂不执行）
            </button>
          </div>
        </div>
      )}

      {activeMainQuestStep && !eventOutcome && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card card-gold max-w-2xl w-full fade-in max-h-[85vh] overflow-y-auto" style={{ boxShadow: '0 0 80px rgba(251,191,36,0.3)' }}>
            <h2 className="section-title text-xl text-center text-gold">
              📜 【主线】{activeMainQuestStep.title}
            </h2>
            <div className="p-5 rounded-xl bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.3)] mb-6">
              <p className="text-lg leading-relaxed">
                {activeMainQuestStep.narrative}
              </p>
            </div>
            <div className="space-y-3 mb-6">
              {activeMainQuestStep.choices.map(choice => (
                <button
                  key={choice.id}
                  onClick={() => handleResolveMainQuest(choice)}
                  className="w-full text-left p-5 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] hover:border-[var(--border-gold)] hover:bg-[rgba(212,175,55,0.08)] transition-all text-lg"
                >
                  <div className="font-bold mb-2">{choice.text}</div>
                  <div className="flex gap-3 flex-wrap text-xs">
                    <span className="text-info">成功率：{Math.round(choice.successRate * 100)}%</span>
                    {choice.karmaChange !== 0 && (
                      <span className={choice.karmaChange > 0 ? 'text-good' : 'text-bad'}>
                        因果 {choice.karmaChange > 0 ? '+' : ''}{choice.karmaChange}
                      </span>
                    )}
                    {choice.fameChange !== 0 && (
                      <span className={choice.fameChange > 0 ? 'text-good' : 'text-bad'}>
                        名望 {choice.fameChange > 0 ? '+' : ''}{choice.fameChange}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button className="btn w-full" onClick={() => setActiveMainQuestStep(null)}>
              取消（稍后再做决定）
            </button>
          </div>
        </div>
      )}

      {eventOutcome && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card card-gold max-w-xl w-full fade-in" style={{ boxShadow: 'var(--shadow-gold)' }}>
            <h2 className="section-title text-xl text-center text-gold mb-4">
              ✨ 抉择已定
            </h2>
            <div className="p-5 rounded-xl bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.3)]">
              <p className="text-lg leading-relaxed text-center">
                {eventOutcome}
              </p>
            </div>
          </div>
        </div>
      )}

      {pendingRelationshipEvent && !eventOutcome && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`card max-w-xl w-full fade-in ${
            pendingRelationshipEvent.type === 'betrayal' ? 'card-bad' :
            pendingRelationshipEvent.type === 'romance' ? 'card-gold' : 'card'
          }`} style={{
            borderColor: pendingRelationshipEvent.type === 'betrayal' ? 'rgba(239,68,68,0.6)' :
                       pendingRelationshipEvent.type === 'romance' ? 'rgba(251,191,36,0.6)' :
                       'rgba(139,92,246,0.6)'
          }}>
            <h2 className="section-title text-xl text-center mb-4" style={{
              color: pendingRelationshipEvent.type === 'betrayal' ? 'var(--accent-red)' :
                     pendingRelationshipEvent.type === 'romance' ? 'var(--accent-gold)' :
                     'var(--accent-purple)'
            }}>
              {pendingRelationshipEvent.type === 'gift' ? '🎁 ' :
               pendingRelationshipEvent.type === 'romance' ? '💕 ' :
               pendingRelationshipEvent.type === 'betrayal' ? '⚔️ ' :
               pendingRelationshipEvent.type === 'special_dialogue' ? '💬 ' :
               pendingRelationshipEvent.type === 'rivalry' ? '⚡ ' : '✨ '}
              {pendingRelationshipEvent.title}
            </h2>
            <div className="p-5 rounded-xl bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.3)] mb-6">
              <p className="text-lg leading-relaxed">
                {pendingRelationshipEvent.narrative}
              </p>
            </div>
            {pendingRelationshipEvent.choices && pendingRelationshipEvent.choices.length > 0 ? (
              <div className="space-y-3">
                {pendingRelationshipEvent.choices.map(choice => (
                  <button
                    key={choice.id}
                    onClick={() => handleRelationshipEventChoice(choice)}
                    className="w-full text-left p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-gold)] transition-all"
                  >
                    <div className="font-bold mb-1">{choice.text}</div>
                    <div className="flex gap-3 flex-wrap text-xs">
                      <span className="text-info">成功率：{Math.round(choice.successRate * 100)}%</span>
                      {choice.karmaChange !== 0 && (
                        <span className={choice.karmaChange > 0 ? 'text-good' : 'text-bad'}>
                          因果 {choice.karmaChange > 0 ? '+' : ''}{choice.karmaChange}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <button className="btn btn-gold w-full" onClick={() => handleRelationshipEventChoice()}>
                收下这份心意
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
