import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Quest, QuestChoice } from '@/types/game'
import { generateShopItems } from '@/services/aiService'
import type { Skill } from '@/types/game'

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
  const refreshTown = useGameStore(s => s.refreshTown)
  const interactWithNPC = useGameStore(s => s.interactWithNPC)
  const acceptQuest = useGameStore(s => s.acceptQuest)
  const resolveQuest = useGameStore(s => s.resolveQuest)
  const buySkill = useGameStore(s => s.buySkill)
  const addLog = useGameStore(s => s.addLog)

  const [tab, setTab] = useState<'people' | 'quests' | 'shop'>('people')
  const [loading, setLoading] = useState(false)
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [activeQuest, setActiveQuest] = useState<Quest | null>(null)

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
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-secondary">
              灵石：<span className="font-bold text-gold text-lg">💎 {character.spiritStones}</span>
            </div>
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
                            quest.type === 'secret' ? 'tag-cultivation' : 'tag-support'
                          }`}>
                            {quest.type === 'commission' ? '委托' : quest.type === 'combat' ? '战斗'
                              : quest.type === 'social' ? '社交' : '隐秘'}
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
    </div>
  )
}
