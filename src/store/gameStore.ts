import { create } from 'zustand'
import type {
  GameState, Character, Origin, Daoxin, Realm,
  Attribute, Relationship, Quest, QuestChoice, EventChoice,
  DemonChoice, RiskLevel, GameLog, Skill, EventOutcome, Screen
} from '@/types/game'
import { ORIGIN_INFO, DAOXIN_INFO, REALM_ORDER } from '@/types/game'
import { ENDINGS, STARTER_SKILLS } from '@/data/gameData'
import {
  generateDailyNarrative, generateRandomCavernEvent, generateRandomDemonTrial,
  generateAvailableNPCs, generateAvailableQuests, generateShopItems,
  generateFriendDialogue, generateShifuDialogue, generateBondChangeNarrative
} from '@/services/aiService'

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

const randomOutcome = <T extends { probability: number }>(outcomes: T[]): T => {
  const rand = Math.random()
  let cum = 0
  for (const o of outcomes) {
    cum += o.probability
    if (rand <= cum) return o
  }
  return outcomes[outcomes.length - 1]
}

interface GameActions {
  setScreen: (screen: Screen) => void
  createCharacter: (name: string, origin: Origin, daoxin: Daoxin) => void
  loadState: (state: GameState) => void
  getFullState: () => GameState
  addLog: (narrative: string) => void
  doMeditation: () => Promise<void>
  doBodyTraining: () => Promise<void>
  doTravel: () => Promise<void>
  triggerCavernEvent: () => Promise<void>
  resolveCavernChoice: (choice: EventChoice) => void
  triggerDemonTrial: () => Promise<void>
  resolveDemonChoice: (choice: DemonChoice) => void
  attemptBreakthrough: (risk: RiskLevel) => void
  refreshTown: () => Promise<void>
  interactWithNPC: (npcId: string) => Promise<void>
  acceptQuest: (questId: string) => void
  resolveQuest: (questId: string, choice: QuestChoice) => void
  buySkill: (skillId: string, price: number) => void
  cultivateSkill: (skillId: string) => void
  checkEnding: () => void
  resetGame: () => void
}

const initialState: GameState = {
  character: null,
  relationships: [],
  inventory: [],
  quests: [],
  completedQuests: [],
  currentScreen: 'menu',
  currentDay: 1,
  maxDays: 100,
  logs: [],
  pendingEvent: null,
  pendingDemonTrial: null,
  breakthroughReady: false,
  endingId: null,
  availableEndings: []
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  setScreen: (screen) => set({ currentScreen: screen }),

  getFullState: () => get(),

  resetGame: () => set({ ...initialState }),

  createCharacter: (name, origin, daoxin) => {
    const info = ORIGIN_INFO[origin]
    const bonuses = info.bonuses

    const defaultAttr = (name: string, bonus?: Attribute): Attribute => ({
      name: bonus?.name || name,
      value: bonus?.value || 20,
      max: bonus?.max || 100
    })

    const character: Character = {
      name: name || '无名修士',
      origin,
      daoxin,
      age: 16,
      realm: '凡人',
      realmProgress: 0,
      spirit: defaultAttr('灵力', bonuses.spirit as Attribute | undefined),
      body: defaultAttr('体魄', bonuses.body as Attribute | undefined),
      mind: defaultAttr('神识', bonuses.mind as Attribute | undefined),
      luck: bonuses.luck || 5,
      karma: 0,
      fame: bonuses.fame || 0,
      spiritStones: bonuses.spiritStones || 100,
      skills: [...STARTER_SKILLS.map((s: Skill) => ({ ...s }))],
      maxSkills: 8
    }

    const openLog: GameLog = {
      day: 1,
      screen: 'creation',
      narrative: `仙历元年，${character.name}以${info.name}之身，立下${DAOXIN_INFO[daoxin].name}，踏上了漫漫修仙路。`,
      timestamp: Date.now()
    }

    set({
      character,
      currentScreen: 'schedule',
      currentDay: 1,
      logs: [openLog]
    })
  },

  loadState: (state) => set(state),

  addLog: (narrative) => {
    const { currentDay, currentScreen, logs } = get()
    const log: GameLog = {
      day: currentDay,
      screen: currentScreen,
      narrative,
      timestamp: Date.now()
    }
    set({ logs: [...logs, log] })
  },

  doMeditation: async () => {
    const state = get()
    const { character, currentDay, addLog } = state
    if (!character) return

    const resp = await generateDailyNarrative(currentDay, 'meditation')
    const cultivationBonus = character.daoxin === 'ambitious' ? 1.2 : 1.0
    const spiritGain = Math.floor((5 + Math.random() * 8) * cultivationBonus)
    const mindGain = Math.floor(2 + Math.random() * 5)
    const progressGain = Math.floor((3 + Math.random() * 6) * cultivationBonus)

    set(s => s.character ? {
      character: {
        ...s.character,
        spirit: { ...s.character.spirit, value: clamp(s.character.spirit.value + spiritGain, 0, s.character.spirit.max) },
        mind: { ...s.character.mind, value: clamp(s.character.mind.value + mindGain, 0, s.character.mind.max) },
        realmProgress: s.character.realmProgress + progressGain
      }
    } : {})

    addLog(`${resp.data} 灵力+${spiritGain}，神识+${mindGain}，修为进度+${progressGain}。`)
    ;(get() as any)._advanceDay()
  },

  doBodyTraining: async () => {
    const { character, currentDay, addLog } = get()
    if (!character) return

    const resp = await generateDailyNarrative(currentDay, 'body_train')
    const bodyGain = Math.floor(6 + Math.random() * 10)
    const spiritCost = Math.floor(2 + Math.random() * 4)
    const progressGain = Math.floor(2 + Math.random() * 5)

    set(s => s.character ? {
      character: {
        ...s.character,
        body: { ...s.character.body, value: clamp(s.character.body.value + bodyGain, 0, s.character.body.max) },
        spirit: { ...s.character.spirit, value: clamp(s.character.spirit.value - spiritCost, 0, s.character.spirit.max) },
        realmProgress: s.character.realmProgress + progressGain
      }
    } : {})

    addLog(`${resp.data} 体魄+${bodyGain}，灵力-${spiritCost}，修为进度+${progressGain}。`)
    ;(get() as any)._advanceDay()
  },

  doTravel: async () => {
    const { character, currentDay, addLog } = get()
    if (!character) return

    const resp = await generateDailyNarrative(currentDay, 'travel')
    const luckGain = character.daoxin === 'free' ? 2 : 1
    const fameGain = Math.floor(Math.random() * 4)
    const mindGain = Math.floor(1 + Math.random() * 4)
    const progressGain = Math.floor(1 + Math.random() * 3)

    set(s => s.character ? {
      character: {
        ...s.character,
        luck: s.character.luck + luckGain,
        fame: s.character.fame + fameGain,
        mind: { ...s.character.mind, value: clamp(s.character.mind.value + mindGain, 0, s.character.mind.max) },
        realmProgress: s.character.realmProgress + progressGain
      }
    } : {})

    addLog(`${resp.data} 气运+${luckGain}，名望+${fameGain}，神识+${mindGain}，修为进度+${progressGain}。`)
    ;(get() as any)._advanceDay()
  },

  triggerCavernEvent: async () => {
    const { character } = get()
    if (!character) return
    const resp = await generateRandomCavernEvent(character.realm)
    set({ pendingEvent: resp.data })
  },

  resolveCavernChoice: (choice) => {
    const { character, addLog, pendingEvent } = get()
    if (!character || !pendingEvent) return

    const outcome = randomOutcome(choice.outcomes) as EventOutcome
    let narrative = outcome.narrative
    const changes: string[] = []

    set(state => {
      if (!state.character) return {}
      const ch = { ...state.character }

      if (outcome.spiritChange) {
        ch.spirit = { ...ch.spirit, value: clamp(ch.spirit.value + outcome.spiritChange, 0, ch.spirit.max) }
        changes.push(`灵力${outcome.spiritChange > 0 ? '+' : ''}${outcome.spiritChange}`)
      }
      if (outcome.bodyChange) {
        ch.body = { ...ch.body, value: clamp(ch.body.value + outcome.bodyChange, 0, ch.body.max) }
        changes.push(`体魄${outcome.bodyChange > 0 ? '+' : ''}${outcome.bodyChange}`)
      }
      if (outcome.mindChange) {
        ch.mind = { ...ch.mind, value: clamp(ch.mind.value + outcome.mindChange, 0, ch.mind.max) }
        changes.push(`神识${outcome.mindChange > 0 ? '+' : ''}${outcome.mindChange}`)
      }
      if (outcome.karmaChange) {
        let karma = outcome.karmaChange
        if (ch.daoxin === 'benevolent') karma = karma > 0 ? karma * 2 : karma * 2
        if (ch.daoxin === 'free') karma = Math.floor(karma / 2)
        if (ch.daoxin === 'vengeful') karma = Math.floor(karma * 1.5)
        ch.karma += karma
        changes.push(`因果${karma > 0 ? '+' : ''}${karma}`)
      }
      if (outcome.fameChange) {
        ch.fame += outcome.fameChange
        changes.push(`名望${outcome.fameChange > 0 ? '+' : ''}${outcome.fameChange}`)
      }
      if (outcome.luckChange) {
        ch.luck += outcome.luckChange
        changes.push(`气运${outcome.luckChange > 0 ? '+' : ''}${outcome.luckChange}`)
      }
      if (outcome.spiritStonesChange) {
        ch.spiritStones = Math.max(0, ch.spiritStones + outcome.spiritStonesChange)
        changes.push(`灵石${outcome.spiritStonesChange > 0 ? '+' : ''}${outcome.spiritStonesChange}`)
      }
      if (outcome.realmProgressChange) {
        ch.realmProgress = Math.max(0, ch.realmProgress + outcome.realmProgressChange)
        changes.push(`修为进度${outcome.realmProgressChange > 0 ? '+' : ''}${outcome.realmProgressChange}`)
      }
      if (outcome.skillGain && ch.skills.length < ch.maxSkills) {
        ch.skills = [...ch.skills, { ...outcome.skillGain }]
        changes.push(`获得技能：${outcome.skillGain.name}`)
      }
      if (outcome.relationshipChange && state.relationships) {
        const rels = state.relationships.map(r => {
          if (r.id === outcome.relationshipChange!.id) {
            return { ...r, bond: clamp(r.bond + outcome.relationshipChange!.bondChange, -100, 100) }
          }
          return r
        })
        return { character: ch, relationships: rels }
      }
      return { character: ch }
    })

    if (changes.length) narrative += ` (${changes.join('，')})`
    addLog(`【${pendingEvent.title}】${narrative}`)
    set({ pendingEvent: null })
  },

  triggerDemonTrial: async () => {
    const resp = await generateRandomDemonTrial()
    set({ pendingDemonTrial: resp.data })
  },

  resolveDemonChoice: (choice) => {
    const { character, addLog, pendingDemonTrial } = get()
    if (!character || !pendingDemonTrial) return

    let heartStrength = choice.heartStrength
    if (character.daoxin === 'detached') heartStrength = Math.floor(heartStrength * 1.3)
    if (character.daoxin === 'ambitious' && heartStrength < 0) heartStrength = Math.floor(heartStrength * 1.4)

    let karmaEffect = choice.karmaEffect
    if (character.daoxin === 'benevolent') karmaEffect = karmaEffect > 0 ? karmaEffect * 2 : karmaEffect * 2

    set(state => {
      if (!state.character) return {}
      return {
        character: {
          ...state.character,
          karma: state.character.karma + karmaEffect,
          mind: {
            ...state.character.mind,
            value: clamp(state.character.mind.value + Math.floor(heartStrength / 2), 0, state.character.mind.max)
          }
        }
      }
    })

    addLog(`【心魔试炼】${choice.outcomeText}（心之力${heartStrength > 0 ? '+' : ''}${heartStrength}，因果${karmaEffect > 0 ? '+' : ''}${karmaEffect}）`)

    if (heartStrength >= 30) {
      set(state => state.character ? {
        character: { ...state.character, realmProgress: state.character.realmProgress + 30 }
      } : {})
      addLog('道心经受住了考验，修为大幅精进！（修为进度+30）')
    } else if (heartStrength <= -30) {
      addLog('道心受损严重，你需要时间来恢复……')
    }

    set({ pendingDemonTrial: null })
  },

  attemptBreakthrough: (risk) => {
    const { character, addLog } = get()
    if (!character) return

    const currentIdx = REALM_ORDER.indexOf(character.realm)
    if (currentIdx >= REALM_ORDER.length - 1) {
      addLog('你已达修行巅峰，再无可破之境。')
      return
    }
    if (character.realmProgress < 100) {
      addLog('修为不足，尚不可强行突破。')
      return
    }

    let baseRate = 0.3
    if (risk === 'safe') baseRate = 0.75
    if (risk === 'balanced') baseRate = 0.5
    if (risk === 'reckless') baseRate = 0.25

    const luckBonus = character.luck * 0.005
    const mindBonus = (character.mind.value / character.mind.max) * 0.15
    let successRate = baseRate + luckBonus + mindBonus

    const failurePenalty = risk === 'safe' ? -20 : risk === 'balanced' ? -40 : -60
    const successBonus = risk === 'safe' ? 10 : risk === 'balanced' ? 20 : 50

    const success = Math.random() < clamp(successRate, 0.05, 0.95)

    if (success) {
      const nextRealm = REALM_ORDER[currentIdx + 1]
      set(state => state.character ? {
        character: {
          ...state.character,
          realm: nextRealm,
          realmProgress: successBonus,
          spirit: { ...state.character.spirit, value: clamp(state.character.spirit.value + 30, 0, state.character.spirit.max), max: state.character.spirit.max + 20 },
          body: { ...state.character.body, value: clamp(state.character.body.value + 20, 0, state.character.body.max), max: state.character.body.max + 20 },
          mind: { ...state.character.mind, value: clamp(state.character.mind.value + 25, 0, state.character.mind.max), max: state.character.mind.max + 20 },
          fame: state.character.fame + 20
        },
        breakthroughReady: false
      } : {})
      addLog(`【突破成功！】天地异象频生，你顺利踏入了【${nextRealm}】！灵力体魄神识皆有提升，名望大增！`)
    } else {
      set(state => state.character ? {
        character: {
          ...state.character,
          realmProgress: Math.max(0, state.character.realmProgress + failurePenalty),
          spirit: { ...state.character.spirit, value: clamp(state.character.spirit.value - 20, 0, state.character.spirit.max) },
          body: { ...state.character.body, value: clamp(state.character.body.value - 15, 0, state.character.body.max) }
        },
        breakthroughReady: false
      } : {})
      addLog(`【突破失败】瓶颈未能冲破，反噬令你身受重伤。修为进度${failurePenalty}，灵力-20，体魄-15。`)
    }
  },

  refreshTown: async () => {
    const { character, relationships } = get()
    if (!character) return

    const [npcsResp, questsResp, shopResp] = await Promise.all([
      generateAvailableNPCs(),
      generateAvailableQuests(character.realm),
      generateShopItems()
    ])

    const existingIds = new Set(relationships.map(r => r.id))
    const newNPCs = npcsResp.data.filter(n => !existingIds.has(n.id))
    const mergedRelationships = [...relationships, ...newNPCs]

    const existingQuestIds = new Set(get().completedQuests)
    const filteredQuests = questsResp.data.filter(q => !existingQuestIds.has(q.id))

    set({
      relationships: mergedRelationships,
      quests: filteredQuests
    })
  },

  interactWithNPC: async (npcId) => {
    const { character, relationships, addLog } = get()
    if (!character) return
    const npc = relationships.find(r => r.id === npcId)
    if (!npc) return

    const resp = npc.role === 'master'
      ? await generateShifuDialogue(npc)
      : await generateFriendDialogue(npc)

    let bondChange = 0
    if (npc.role === 'rival') {
      bondChange = Math.random() < 0.5 ? -3 : 2
    } else if (npc.role === 'enemy') {
      bondChange = -5
    } else if (character.daoxin === 'detached') {
      bondChange = Math.floor((2 + Math.random() * 4) / 2)
    } else {
      bondChange = 2 + Math.floor(Math.random() * 5)
    }

    set(state => ({
      relationships: state.relationships.map(r =>
        r.id === npcId ? { ...r, bond: clamp(r.bond + bondChange, -100, 100) } : r
      )
    }))

    const bondResp = await generateBondChangeNarrative(npc, bondChange, 'chat')
    addLog(`【与${npc.name}交谈】"${resp.data}" ${bondResp.data}（羁绊${bondChange > 0 ? '+' : ''}${bondChange}）`)
  },

  acceptQuest: (questId) => {
    const { addLog, quests } = get()
    const quest = quests.find(q => q.id === questId)
    if (!quest) return
    addLog(`你接受了委托：【${quest.title}】`)
  },

  resolveQuest: (questId, choice) => {
    const { character, addLog, quests, completedQuests } = get()
    const quest = quests.find(q => q.id === questId)
    if (!quest || !character) return

    const success = Math.random() < choice.successRate
    const rewards: string[] = []

    set(state => {
      if (!state.character) return {}
      const ch = { ...state.character }

      let karma = choice.karmaChange
      if (ch.daoxin === 'benevolent') karma = karma > 0 ? karma * 2 : karma * 2
      if (ch.daoxin === 'free') karma = Math.floor(karma / 2)
      ch.karma += karma
      if (karma) rewards.push(`因果${karma > 0 ? '+' : ''}${karma}`)

      ch.fame += choice.fameChange
      if (choice.fameChange) rewards.push(`名望${choice.fameChange > 0 ? '+' : ''}${choice.fameChange}`)

      if (success) {
        if (quest.reward.spiritStones) {
          ch.spiritStones += quest.reward.spiritStones
          rewards.push(`灵石+${quest.reward.spiritStones}`)
        }
        if (quest.reward.fame) {
          ch.fame += quest.reward.fame
          rewards.push(`名望+${quest.reward.fame}`)
        }
        if (quest.reward.karma) {
          let rk = quest.reward.karma
          if (ch.daoxin === 'benevolent') rk = rk > 0 ? rk * 2 : rk
          ch.karma += rk
          rewards.push(`因果+${rk}`)
        }
      }

      return {
        character: ch,
        quests: state.quests.filter(q => q.id !== questId),
        completedQuests: [...completedQuests, questId]
      }
    })

    const resultText = success ? choice.specialOutcome : '任务过程中出了些状况……虽未能尽善尽美，但也算有所收获。'
    addLog(`【${quest.title}】${resultText}（${rewards.join('，') || '无特殊奖励'}）`)
  },

  buySkill: (skillId, price) => {
    const { character, addLog } = get()
    if (!character) return
    if (character.spiritStones < price) {
      addLog('灵石不足，无法购买此功法。')
      return
    }
    if (character.skills.length >= character.maxSkills) {
      addLog('你已习满功法，无法再修习更多。')
      return
    }
    if (character.skills.some(s => s.id === skillId)) {
      addLog('你已经会这套功法了。')
      return
    }

    import('@/data/gameData').then(({ PURCHASABLE_SKILLS }) => {
      const skill = PURCHASABLE_SKILLS.find(s => s.id === skillId)
      if (!skill) return
      set(state => state.character ? {
        character: {
          ...state.character,
          spiritStones: state.character.spiritStones - price,
          skills: [...state.character.skills, { ...skill }]
        }
      } : {})
      addLog(`你购买并参悟了【${skill.name}】！（灵石-${price}）`)
    })
  },

  cultivateSkill: (skillId) => {
    const { character, addLog } = get()
    if (!character) return
    set(state => state.character ? {
      character: {
        ...state.character,
        skills: state.character.skills.map(s => {
          if (s.id === skillId && s.level < s.maxLevel) {
            return { ...s, level: s.level + 1 }
          }
          return s
        })
      }
    } : {})
    const skill = character.skills.find(s => s.id === skillId)
    if (skill) addLog(`你修炼【${skill.name}】，等级提升至 Lv.${skill.level + 1}。`)
  },

  checkEnding: () => {
    const { character, relationships, addLog } = get()
    if (!character) return

    const bondSum = relationships.reduce((sum, r) => sum + r.bond, 0)
    const currentRealmRank = REALM_ORDER.indexOf(character.realm)

    const eligible = ENDINGS.filter(ending => {
      const c = ending.conditions
      if (c.minRealm && currentRealmRank < REALM_ORDER.indexOf(c.minRealm)) return false
      if (c.minFame !== undefined && character.fame < c.minFame) return false
      if (c.minKarma !== undefined && character.karma < c.minKarma) return false
      if (c.maxKarma !== undefined && character.karma > c.maxKarma) return false
      if (c.minBondSum !== undefined && bondSum < c.minBondSum) return false
      if (c.daoxin && !c.daoxin.includes(character.daoxin)) return false
      return true
    })

    if (eligible.length === 0) {
      addLog('你的故事尚未结束，继续修行吧……')
      return
    }

    eligible.sort((a, b) => {
      const rarityOrder = ['普通', '稀有', '传说', '神话']
      const ra = rarityOrder.indexOf(a.rarity)
      const rb = rarityOrder.indexOf(b.rarity)
      if (ra !== rb) return rb - ra
      const raR = a.conditions.minRealm ? REALM_ORDER.indexOf(a.conditions.minRealm) : -1
      const rbR = b.conditions.minRealm ? REALM_ORDER.indexOf(b.conditions.minRealm) : -1
      return rbR - raR
    })

    const chosen = eligible[0]
    set({
      endingId: chosen.id,
      availableEndings: eligible.map(e => e.id),
      currentScreen: 'ending'
    })
    addLog(`一生修行，终得结局：【${chosen.title}】`)
  },

  _advanceDay: () => {
    const { character, currentDay, maxDays, addLog, checkEnding } = get()
    if (!character) return

    const nextDay = currentDay + 1
    set({
      currentDay: nextDay,
      character: { ...character, age: character.age + (nextDay % 365 === 0 ? 1 : 0) }
    })

    set(state => state.character && state.character.realmProgress >= 100 ? { breakthroughReady: true } : {})

    if (nextDay % 10 === 0) {
      addLog(`十年一度的心魔劫将至，准备迎接心魔试炼吧……`)
    }

    if (nextDay > maxDays || (character.realm === '大乘期' && character.realmProgress >= 100)) {
      checkEnding()
    }
  }
}))
