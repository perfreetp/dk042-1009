import { create } from 'zustand'
import type {
  GameState, Character, Origin, Daoxin, Realm,
  Attribute, Relationship, Quest, QuestChoice, EventChoice,
  DemonChoice, RiskLevel, GameLog, Skill, EventOutcome, Screen,
  MainQuestStep, RelationshipEvent, EndingReason
} from '@/types/game'
import { ORIGIN_INFO, DAOXIN_INFO, REALM_ORDER } from '@/types/game'
import {
  ENDINGS, STARTER_SKILLS, MAIN_QUESTS, SECRET_REALM_DATA,
  SECRET_REALM_EVENTS, RELATIONSHIP_EVENTS_DATA, HIDDEN_DEMON_QUESTION,
  NEW_SKILLS, SKILL_PRICES_EXTRA
} from '@/data/gameData'
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
  addLog: (narrative: string, category?: GameLog['category']) => void
  doMeditation: () => Promise<void>
  doBodyTraining: () => Promise<void>
  doTravel: () => Promise<void>
  triggerCavernEvent: () => Promise<void>
  resolveCavernChoice: (choice: EventChoice) => void
  triggerDemonTrial: (fromSchedule?: boolean) => Promise<void>
  resolveDemonChoice: (choice: DemonChoice) => void
  resolveDemonChoiceInSchedule: (choice: DemonChoice) => void
  attemptBreakthrough: (risk: RiskLevel) => void
  refreshTown: () => Promise<void>
  interactWithNPC: (npcId: string) => Promise<void>
  acceptQuest: (questId: string) => void
  resolveQuest: (questId: string, choice: QuestChoice) => void
  buySkill: (skillId: string, price: number) => void
  cultivateSkill: (skillId: string) => void
  checkEnding: (force?: boolean) => void
  resetGame: () => void
  startMainQuest: (questId: string) => void
  resolveMainQuestChoice: (choice: QuestChoice) => void
  advanceSecretRealm: () => Promise<void>
  resolveRelationshipEvent: (choice?: QuestChoice) => void
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
  pendingDemonFromSchedule: false,
  breakthroughReady: false,
  endingId: null,
  availableEndings: [],
  mainQuest: null,
  secretRealmProgress: [],
  relationshipEvents: [],
  pendingRelationshipEvent: null,
  endingReasons: []
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

    const initialMainQuest = MAIN_QUESTS.main_qingyun as unknown as GameState['mainQuest']
    const initialSecretRealm = { ...SECRET_REALM_DATA, clues: [] }
    const initialRelationshipEvents = RELATIONSHIP_EVENTS_DATA.map(e => ({ ...e, triggered: false }))

    set({
      character,
      currentScreen: 'schedule',
      currentDay: 1,
      logs: [openLog],
      mainQuest: initialMainQuest,
      secretRealmProgress: [initialSecretRealm],
      relationshipEvents: initialRelationshipEvents,
      endingReasons: [],
      pendingDemonFromSchedule: false,
      pendingRelationshipEvent: null
    })
  },

  loadState: (state) => set(state),

  addLog: (narrative, category) => {
    const { currentDay, currentScreen, logs } = get()
    const log: GameLog = {
      day: currentDay,
      screen: currentScreen,
      narrative,
      timestamp: Date.now(),
      category
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

  triggerDemonTrial: async (fromSchedule = false) => {
    const resp = await generateRandomDemonTrial()
    set({
      pendingDemonTrial: resp.data,
      pendingDemonFromSchedule: fromSchedule
    })
  },

  resolveDemonChoiceInSchedule: (choice) => {
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

    set({
      pendingDemonTrial: null,
      pendingDemonFromSchedule: false
    })
    ;(get() as any)._advanceDay()
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

  checkEnding: (force = false) => {
    const { character, relationships, addLog, mainQuest } = get()
    if (!character) return

    const bondSum = relationships.reduce((sum, r) => sum + r.bond, 0)
    const currentRealmRank = REALM_ORDER.indexOf(character.realm)

    const allEndings = [...ENDINGS]

    const endingScores: { ending: typeof allEndings[0]; score: number; reasons: EndingReason[] }[] = []

    for (const ending of allEndings) {
      const c = ending.conditions
      const reasons: EndingReason[] = []
      let totalScore = 0
      let failedHardCondition = false

      if (c.minRealm) {
        const met = currentRealmRank >= REALM_ORDER.indexOf(c.minRealm)
        reasons.push({
          condition: `修为≥${c.minRealm}`,
          met,
          weight: met ? 30 : -100,
          description: met ? `修为达到${character.realm}，满足要求` : `修为仅${character.realm}，未达要求`
        })
        totalScore += met ? 30 : -100
      }

      if (c.maxRealm) {
        const met = currentRealmRank <= REALM_ORDER.indexOf(c.maxRealm)
        reasons.push({
          condition: `修为≤${c.maxRealm}`,
          met,
          weight: met ? 10 : -50,
          description: met ? `修为${character.realm}，符合上限` : `修为${character.realm}，超出上限`
        })
        totalScore += met ? 10 : -50
        if (!met) failedHardCondition = true
      }

      if (c.minFame !== undefined) {
        const met = character.fame >= c.minFame
        reasons.push({
          condition: `名望≥${c.minFame}`,
          met,
          weight: met ? 15 : -10,
          description: met ? `名望${character.fame}，满足要求` : `名望仅${character.fame}，未达要求`
        })
        totalScore += met ? 15 : -10
      }

      if (c.maxFame !== undefined) {
        const met = character.fame <= c.maxFame
        reasons.push({
          condition: `名望≤${c.maxFame}`,
          met,
          weight: met ? 5 : -15,
          description: met ? `名望${character.fame}，符合上限` : `名望${character.fame}，超出上限`
        })
        totalScore += met ? 5 : -15
      }

      if (c.minKarma !== undefined) {
        const met = character.karma >= c.minKarma
        reasons.push({
          condition: `因果≥${c.minKarma}`,
          met,
          weight: met ? 20 : -15,
          description: met ? `因果${character.karma}，满足要求` : `因果仅${character.karma}，未达要求`
        })
        totalScore += met ? 20 : -15
      }

      if (c.maxKarma !== undefined) {
        const met = character.karma <= c.maxKarma
        reasons.push({
          condition: `因果≤${c.maxKarma}`,
          met,
          weight: met ? 20 : -15,
          description: met ? `因果${character.karma}，符合上限` : `因果${character.karma}，超出上限`
        })
        totalScore += met ? 20 : -15
      }

      if (c.minBondSum !== undefined) {
        const met = bondSum >= c.minBondSum
        reasons.push({
          condition: `羁绊总和≥${c.minBondSum}`,
          met,
          weight: met ? 25 : -10,
          description: met ? `羁绊总和${bondSum}，满足要求` : `羁绊总和仅${bondSum}，未达要求`
        })
        totalScore += met ? 25 : -10
      }

      if (c.maxBondSum !== undefined) {
        const met = bondSum <= c.maxBondSum
        reasons.push({
          condition: `羁绊总和≤${c.maxBondSum}`,
          met,
          weight: met ? 10 : -15,
          description: met ? `羁绊总和${bondSum}，符合上限` : `羁绊总和${bondSum}，超出上限`
        })
        totalScore += met ? 10 : -15
      }

      if (c.daoxin) {
        const met = c.daoxin.includes(character.daoxin)
        reasons.push({
          condition: `道心为${c.daoxin.map(d => DAOXIN_INFO[d].name).join('/')}`,
          met: met,
          weight: met ? 15 : -5,
          description: met ? `道心为${DAOXIN_INFO[character.daoxin].name}，契合` : `道心为${DAOXIN_INFO[character.daoxin].name}，不契合`
        })
        totalScore += met ? 15 : -5
      }

      if (c.completedMainQuest) {
        const met = !!(mainQuest?.completed && mainQuest.id === c.completedMainQuest)
        reasons.push({
          condition: `完成主线任务【${c.completedMainQuest}】`,
          met,
          weight: met ? 50 : -30,
          description: met ? '已完成主线任务' : '未完成主线任务'
        })
        totalScore += met ? 50 : -30
        if (!met) failedHardCondition = true
      }

      const rarityBonus = { '普通': 0, '稀有': 5, '传说': 10, '神话': 20 }[ending.rarity]
      totalScore += rarityBonus

      if (!force && failedHardCondition) continue

      endingScores.push({ ending, score: totalScore, reasons })
    }

    if (endingScores.length === 0) {
      addLog('你的故事尚未结束，继续修行吧……')
      return
    }

    endingScores.sort((a, b) => b.score - a.score)

    const chosen = endingScores[0]
    set({
      endingId: chosen.ending.id,
      availableEndings: endingScores.slice(0, 5).map(e => e.ending.id),
      endingReasons: chosen.reasons,
      currentScreen: 'ending'
    })
    addLog(`一生修行，终得结局：【${chosen.ending.title}】`)
  },

  _advanceDay: () => {
    const { character, currentDay, maxDays, addLog, checkEnding, mainQuest, relationshipEvents, relationships } = get()
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

    const state = get()
    if (state.mainQuest && !state.mainQuest.completed) {
      const mq = state.mainQuest
      const currentStep = mq.steps[mq.currentStepIndex]
      if (currentStep && nextDay >= currentStep.minDay && !mq.started) {
        set(s => s.mainQuest ? {
          mainQuest: { ...s.mainQuest, started: true }
        } : {})
        addLog(`【主线开启】${mq.name}：${currentStep.title}`, 'main')
      }
    }

    const state2 = get()
    for (const event of state2.relationshipEvents) {
      if (event.triggered) continue
      const rel = state2.relationships.find(r => r.id === event.relationshipId)
      if (!rel) continue
      
      const triggerMet = event.triggerBond > 0 ? rel.bond >= event.triggerBond : rel.bond <= event.triggerBond
      if (triggerMet) {
        set(s => ({
          pendingRelationshipEvent: event,
          relationshipEvents: s.relationshipEvents.map(e =>
            e.id === event.id ? { ...e, triggered: true } : e
          )
        }))
        addLog(`【特殊事件】${event.title}`, 'social')
        break
      }
    }

    if (nextDay > maxDays || (character.realm === '大乘期' && character.realmProgress >= 100)) {
      checkEnding(true)
    }
  },

  startMainQuest: (questId) => {
    const { mainQuest, addLog } = get()
    if (!mainQuest || mainQuest.id !== questId || mainQuest.completed) return

    addLog(`你接下了主线任务：【${mainQuest.name}】`, 'main')
  },

  resolveMainQuestChoice: (choice) => {
    const { character, addLog, mainQuest, relationships } = get()
    if (!mainQuest || !character) return

    const currentStep = mainQuest.steps[mainQuest.currentStepIndex]
    if (!currentStep) return

    const success = Math.random() < choice.successRate
    const rewards: string[] = []

    set(state => {
      if (!state.character) return {}
      const ch = { ...state.character }

      if (success) {
        if (choice.fameChange) {
          ch.fame = clamp(ch.fame + choice.fameChange, -100, 100)
          rewards.push(`名望${choice.fameChange > 0 ? '+' : ''}${choice.fameChange}`)
        }
        if (choice.karmaChange) {
          ch.karma = clamp(ch.karma + choice.karmaChange, -100, 100)
          rewards.push(`因果${choice.karmaChange > 0 ? '+' : ''}${choice.karmaChange}`)
        }

        const reward = currentStep.reward
        if (reward) {
          if (reward.fame) {
            ch.fame = clamp(ch.fame + reward.fame, -100, 100)
            rewards.push(`名望+${reward.fame}`)
          }
          if (reward.karma) {
            ch.karma = clamp(ch.karma + reward.karma, -100, 100)
            rewards.push(`因果+${reward.karma}`)
          }
          if (reward.spiritStones) {
            ch.spiritStones += reward.spiritStones
            rewards.push(`灵石+${reward.spiritStones}`)
          }
          if (reward.skillId) {
            const skill = NEW_SKILLS.find(s => s.id === reward.skillId)
            if (skill && ch.skills.length < ch.maxSkills && !ch.skills.some(s => s.id === skill.id)) {
              ch.skills = [...ch.skills, { ...skill }]
              rewards.push(`习得功法【${skill.name}】`)
            }
          }
        }
      }

      let newRelationships = [...state.relationships]
      if (success && currentStep.reward?.relationshipChanges) {
        for (const rc of currentStep.reward.relationshipChanges) {
          newRelationships = newRelationships.map(r =>
            r.id === rc.id
              ? { ...r, bond: clamp(r.bond + rc.bondChange, -100, 100) }
              : r
          )
          rewards.push(`${newRelationships.find(r => r.id === rc.id)?.name} 羁绊${rc.bondChange > 0 ? '+' : ''}${rc.bondChange}`)
        }
      }

      const isLastStep = mainQuest.currentStepIndex >= mainQuest.steps.length - 1
      let newMainQuest = { ...mainQuest }
      if (success) {
        if (isLastStep) {
          newMainQuest.completed = true
        } else {
          newMainQuest.currentStepIndex = mainQuest.currentStepIndex + 1
        }
      }

      return {
        character: ch,
        relationships: newRelationships,
        mainQuest: newMainQuest,
        completedQuests: success && isLastStep
          ? [...state.completedQuests, mainQuest.id]
          : state.completedQuests
      }
    })

    const resultText = success
      ? choice.specialOutcome
      : '事情似乎出了些变数，未能完全如愿……'

    const nextState = get()
    if (success && nextState.mainQuest?.completed) {
      addLog(`【主线完成·${currentStep.title}】${resultText}（${rewards.join('，') || '无特殊奖励'}）`, 'main')
      addLog(`恭喜！你完成了主线【${mainQuest.name}】！`, 'main')
    } else if (success) {
      addLog(`【主线·${currentStep.title}】${resultText}（${rewards.join('，') || '无特殊奖励'}）`, 'main')
    } else {
      addLog(`【主线·${currentStep.title}】${resultText}`, 'main')
    }
  },

  advanceSecretRealm: async () => {
    const { character, secretRealmProgress, addLog } = get()
    if (!character || secretRealmProgress.length === 0) return

    const realm = secretRealmProgress[0]
    if (realm.completed) {
      addLog('天机秘境的缘分已尽，无需再探索了。')
      return
    }

    const stage = realm.stage
    if (stage >= SECRET_REALM_EVENTS.length) {
      set(s => ({
        secretRealmProgress: s.secretRealmProgress.map(r =>
          r.id === realm.id ? { ...r, completed: true } : r
        )
      }))
      addLog('你已探索完天机秘境的所有奥秘。')
      return
    }

    const event = SECRET_REALM_EVENTS[stage]
    set(s => ({
      pendingEvent: event as GameState['pendingEvent'],
      secretRealmProgress: s.secretRealmProgress.map(r =>
        r.id === realm.id
          ? { ...r, stage: Math.min(r.stage + 1, r.totalStages), lastVisitedDay: s.currentDay, discovered: true }
          : r
      )
    }))

    addLog(`【天机秘境·阶段${stage + 1}】${event.title}`)
  },

  resolveRelationshipEvent: (choice) => {
    const { character, addLog, pendingRelationshipEvent, relationships } = get()
    if (!pendingRelationshipEvent || !character) return

    const event = pendingRelationshipEvent
    let rewardsApplied = false
    const rewards: string[] = []

    if (choice && event.choices) {
      const selectedChoice = event.choices.find(c => c.id === choice.id)
      if (selectedChoice) {
        const success = Math.random() < selectedChoice.successRate
        if (success) {
          set(state => {
            if (!state.character) return {}
            const ch = { ...state.character }

            if (selectedChoice.fameChange) {
              ch.fame = clamp(ch.fame + selectedChoice.fameChange, -100, 100)
              rewards.push(`名望${selectedChoice.fameChange > 0 ? '+' : ''}${selectedChoice.fameChange}`)
            }
            if (selectedChoice.karmaChange) {
              ch.karma = clamp(ch.karma + selectedChoice.karmaChange, -100, 100)
              rewards.push(`因果${selectedChoice.karmaChange > 0 ? '+' : ''}${selectedChoice.karmaChange}`)
            }

            let newRels = [...state.relationships]
            if (event.reward?.bondChange) {
              newRels = newRels.map(r =>
                r.id === event.relationshipId
                  ? { ...r, bond: clamp(r.bond + event.reward!.bondChange!, -100, 100) }
                  : r
              )
              rewards.push(`羁绊${event.reward.bondChange > 0 ? '+' : ''}${event.reward.bondChange}`)
            }
            if (event.reward?.spiritStones) {
              ch.spiritStones += event.reward.spiritStones
              rewards.push(`灵石${event.reward.spiritStones > 0 ? '+' : ''}${event.reward.spiritStones}`)
            }
            if (event.reward?.skillId) {
              const skill = NEW_SKILLS.find(s => s.id === event.reward!.skillId)
              if (skill && ch.skills.length < ch.maxSkills && !ch.skills.some(s => s.id === skill.id)) {
                ch.skills = [...ch.skills, { ...skill }]
                rewards.push(`习得功法【${skill.name}】`)
              }
            }

            return {
              character: ch,
              relationships: newRels
            }
          })
          rewardsApplied = true
          addLog(`【${event.title}】${selectedChoice.specialOutcome}（${rewards.join('，') || '无特殊奖励'}）`, 'social')
        } else {
          addLog(`【${event.title}】似乎没有达到预期的结果……`, 'social')
        }
      }
    } else {
      set(state => {
        if (!state.character) return {}
        const ch = { ...state.character }

        let newRels = [...state.relationships]
        if (event.reward?.bondChange) {
          newRels = newRels.map(r =>
            r.id === event.relationshipId
              ? { ...r, bond: clamp(r.bond + event.reward!.bondChange!, -100, 100) }
              : r
          )
          rewards.push(`羁绊${event.reward.bondChange > 0 ? '+' : ''}${event.reward.bondChange}`)
        }
        if (event.reward?.spiritStones) {
          ch.spiritStones += event.reward.spiritStones
          rewards.push(`灵石${event.reward.spiritStones > 0 ? '+' : ''}${event.reward.spiritStones}`)
        }
        if (event.reward?.skillId) {
          const skill = NEW_SKILLS.find(s => s.id === event.reward!.skillId)
          if (skill && ch.skills.length < ch.maxSkills && !ch.skills.some(s => s.id === skill.id)) {
            ch.skills = [...ch.skills, { ...skill }]
            rewards.push(`习得功法【${skill.name}】`)
          }
        }

        return {
          character: ch,
          relationships: newRels
        }
      })
      rewardsApplied = true
      addLog(`【${event.title}】${event.narrative}（${rewards.join('，') || '无特殊奖励'}）`, 'social')
    }

    set({ pendingRelationshipEvent: null })
  }
}))
