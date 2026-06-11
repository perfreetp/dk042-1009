import { create } from 'zustand'
import type {
  GameState, Character, Origin, Daoxin, Realm,
  Attribute, Relationship, Quest, QuestChoice, EventChoice,
  DemonChoice, RiskLevel, GameLog, Skill, EventOutcome, Screen,
  MainQuestStep, RelationshipEvent, EndingReason, SectPosition,
  Injury, MainQuestChoiceRecord, SecretRealmResult, BreakthroughPreparation,
  SectEvent, SectEventRecord
} from '@/types/game'
import { ORIGIN_INFO, DAOXIN_INFO, REALM_ORDER, SECT_POSITION_INFO } from '@/types/game'
import {
  ENDINGS, STARTER_SKILLS, MAIN_QUESTS, SECRET_REALM_DATA,
  SECRET_REALM_EVENTS, RELATIONSHIP_EVENTS_DATA, HIDDEN_DEMON_QUESTION,
  NEW_SKILLS, SKILL_PRICES_EXTRA, SECT_QUESTS, INJURY_TEMPLATES,
  BREAKTHROUGH_LOCATIONS, MAIN_QUEST_NPCS, SECRET_REALM_STAGE_REQS,
  SECT_EVENTS, INJURY_HEAL_OPTIONS
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
  trySectPositionUpgrade: () => void
  startBreakthroughPrep: () => void
  setBreakthroughPrep: (prep: Partial<BreakthroughPreparation>) => void
  attemptBreakthroughWithPrep: () => void
  unlockMainQuestNPC: (npcId: string) => void
  addInjury: (injury: Omit<Injury, 'id'>) => void
  healInjuriesByDay: () => void
  checkSectEvents: () => void
  resolveSectEvent: (choice: QuestChoice) => void
  healInjury: (optionId: string) => void
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
  endingReasons: [],
  mainQuestChoices: [],
  secretRealmResults: [],
  positionHistory: [],
  breakthroughHistory: [],
  pendingBreakthroughPrep: false,
  sectEventRecords: [],
  pendingSectEvent: null
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
      sectFame: 0,
      sectPosition: 'outer',
      spiritStones: bonuses.spiritStones || 100,
      skills: [...STARTER_SKILLS.map((s: Skill) => ({ ...s }))],
      maxSkills: 8,
      injuries: [],
      breakthroughPrep: {
        pills: 0,
        guardians: [],
        location: 'sect',
        preparationDays: 0,
        hasPrepared: false
      },
      hiddenDemonUnlocked: false,
      hiddenDemonUsed: false,
      hasPillToxin: false
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
      pendingRelationshipEvent: null,
      mainQuestChoices: [],
      secretRealmResults: [],
      positionHistory: [{ position: 'outer', day: 1 }],
      breakthroughHistory: [],
      pendingBreakthroughPrep: false
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
    let spiritGain = Math.floor((5 + Math.random() * 8) * cultivationBonus)
    let mindGain = Math.floor(2 + Math.random() * 5)
    let progressGain = Math.floor((3 + Math.random() * 6) * cultivationBonus)

    if (character.injuries && character.injuries.length > 0) {
      let spiritPenalty = 0
      let mindPenalty = 0
      let progressPenalty = 0
      character.injuries.forEach(ij => {
        if (ij.effects.spirit) spiritPenalty += ij.effects.spirit
        if (ij.effects.mind) mindPenalty += ij.effects.mind
        if (ij.effects.successRatePenalty) progressPenalty += Math.floor(ij.effects.successRatePenalty * -20)
      })
      spiritGain = Math.max(1, spiritGain + spiritPenalty)
      mindGain = Math.max(0, mindGain + mindPenalty)
      progressGain = Math.max(1, progressGain + progressPenalty)
    }

    const finalSpiritGain = spiritGain
    const finalMindGain = mindGain
    const finalProgressGain = progressGain

    set(s => s.character ? {
      character: {
        ...s.character,
        spirit: { ...s.character.spirit, value: clamp(s.character.spirit.value + finalSpiritGain, 0, s.character.spirit.max) },
        mind: { ...s.character.mind, value: clamp(s.character.mind.value + finalMindGain, 0, s.character.mind.max) },
        realmProgress: s.character.realmProgress + finalProgressGain
      }
    } : {})

    addLog(`${resp.data} 灵力+${finalSpiritGain}，神识+${finalMindGain}，修为进度+${finalProgressGain}。`)
    ;(get() as any)._advanceDay()
  },

  doBodyTraining: async () => {
    const { character, currentDay, addLog } = get()
    if (!character) return

    const resp = await generateDailyNarrative(currentDay, 'body_train')
    let bodyGain = Math.floor(6 + Math.random() * 10)
    let spiritCost = Math.floor(2 + Math.random() * 4)
    let progressGain = Math.floor(2 + Math.random() * 5)

    if (character.injuries && character.injuries.length > 0) {
      let bodyPenalty = 0
      character.injuries.forEach(ij => {
        if (ij.effects.body) bodyPenalty += ij.effects.body
        if (ij.effects.successRatePenalty) bodyPenalty += Math.floor(ij.effects.successRatePenalty * -10)
      })
      bodyGain = Math.max(1, bodyGain + bodyPenalty)
      progressGain = Math.max(1, progressGain + Math.floor(bodyPenalty * 0.3))
    }

    const finalBodyGain = bodyGain
    const finalSpiritCost = spiritCost
    const finalProgressGain = progressGain

    set(s => s.character ? {
      character: {
        ...s.character,
        body: { ...s.character.body, value: clamp(s.character.body.value + finalBodyGain, 0, s.character.body.max) },
        spirit: { ...s.character.spirit, value: clamp(s.character.spirit.value - finalSpiritCost, 0, s.character.spirit.max) },
        realmProgress: s.character.realmProgress + finalProgressGain
      }
    } : {})

    addLog(`${resp.data} 体魄+${finalBodyGain}，灵力-${finalSpiritCost}，修为进度+${finalProgressGain}。`)
    ;(get() as any)._advanceDay()
  },

  doTravel: async () => {
    const { character, currentDay, addLog } = get()
    if (!character) return

    const resp = await generateDailyNarrative(currentDay, 'travel')
    let luckGain = character.daoxin === 'free' ? 2 : 1
    let fameGain = Math.floor(Math.random() * 4)
    let mindGain = Math.floor(1 + Math.random() * 4)
    let progressGain = Math.floor(1 + Math.random() * 3)

    if (character.injuries && character.injuries.length > 0) {
      let luckPenalty = 0
      character.injuries.forEach(ij => {
        if (ij.effects.luck) luckPenalty += ij.effects.luck
        if (ij.effects.mind) mindGain += ij.effects.mind
      })
      luckGain = Math.max(0, luckGain + luckPenalty)
      mindGain = Math.max(0, mindGain)
      progressGain = Math.max(1, progressGain)
    }

    const finalLuckGain = luckGain
    const finalFameGain = fameGain
    const finalMindGain = mindGain
    const finalProgressGain = progressGain

    set(s => s.character ? {
      character: {
        ...s.character,
        luck: s.character.luck + finalLuckGain,
        fame: s.character.fame + finalFameGain,
        mind: { ...s.character.mind, value: clamp(s.character.mind.value + finalMindGain, 0, s.character.mind.max) },
        realmProgress: s.character.realmProgress + finalProgressGain
      }
    } : {})

    addLog(`${resp.data} 气运+${finalLuckGain}，名望+${finalFameGain}，神识+${finalMindGain}，修为进度+${finalProgressGain}。`)
    ;(get() as any)._advanceDay()
  },

  triggerCavernEvent: async () => {
    const { character, secretRealmProgress } = get()
    if (!character) return

    const srp = secretRealmProgress[0]
    if (srp && !srp.discovered && Math.random() < 0.35) {
      const firstEvent = SECRET_REALM_EVENTS[0]
      set({
        pendingEvent: firstEvent as GameState['pendingEvent'],
        secretRealmProgress: secretRealmProgress.map(r =>
          r.id === srp.id ? { ...r, discovered: true, stage: 1, lastVisitedDay: get().currentDay } : r
        )
      })
      ;(get() as any).addLog(`你在洞天深处偶得奇遇，发现了【天机秘境】的线索！`)
      return
    }

    const resp = await generateRandomCavernEvent(character.realm)
    set({ pendingEvent: resp.data })
  },

  resolveCavernChoice: (choice) => {
    const { character, addLog, pendingEvent, secretRealmProgress, secretRealmResults, inventory } = get()
    if (!character || !pendingEvent) return

    const isSecretRealm = pendingEvent.id && (pendingEvent.id.startsWith('evt_tianji') || pendingEvent.id.startsWith('secret_realm'))
    const isRealmStage1 = pendingEvent.id === 'evt_tianji_clue_1'
    const isRealmStage2 = pendingEvent.id === 'evt_tianji_clue_2'
    const isRealmStage3 = pendingEvent.id === 'evt_tianji_entrance'
    const outcome = randomOutcome(choice.outcomes) as EventOutcome
    let narrative = outcome.narrative
    const changes: string[] = []

    let wrongChoice = false
    let newInventory = [...inventory]

    if (isSecretRealm) {
      if (isRealmStage1) {
        if (choice.id === 'take_fragment') {
          if (!newInventory.includes('tianji_fragment')) {
            newInventory.push('tianji_fragment')
            changes.push('获得天机残片·壹')
          }
        } else {
          wrongChoice = true
        }
      } else if (isRealmStage2) {
        if (choice.id === 'show_fragment') {
          newInventory = newInventory.filter(i => i !== 'tianji_fragment')
          if (!newInventory.includes('tianji_fragment_complete')) {
            newInventory.push('tianji_fragment_complete')
            changes.push('集齐三枚残片')
          }
        } else if (choice.id === 'ignore_old_man') {
          wrongChoice = true
        }
      } else if (isRealmStage3) {
        if (choice.id !== 'enter_realm') {
          wrongChoice = true
        }
      }
    }

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

      let newSecretRealmProgress = state.secretRealmProgress
      let newSecretRealmResults = state.secretRealmResults
      if (isSecretRealm && state.secretRealmProgress.length > 0) {
        const realm = state.secretRealmProgress[0]
        const isFinalStage = realm.stage >= realm.totalStages

        if (wrongChoice) {
          newSecretRealmProgress = state.secretRealmProgress.map(r =>
            r.id === realm.id ? { ...r, stage: Math.max(0, r.stage - 1) } : r
          )
        } else if (isFinalStage) {
          newSecretRealmProgress = state.secretRealmProgress.map(r =>
            r.id === realm.id ? { ...r, completed: true } : r
          )
          const resultRecord: SecretRealmResult = {
            id: realm.id,
            name: realm.name,
            completed: true,
            finalChoice: choice.text,
            finalChoiceId: choice.id,
            acquiredSkillId: outcome.skillGain?.id,
            unlockedHiddenDemon: outcome.unlocksHiddenDemon === true
          }
          newSecretRealmResults = [...state.secretRealmResults, resultRecord]

          if (outcome.unlocksHiddenDemon) {
            ch.hiddenDemonUnlocked = true
            setTimeout(() => {
              addLog('🪞 往生镜中映出你的命数，一道隐藏的心魔题已在你识海中种下。下次心魔试炼时，它将会出现……', 'demon')
            }, 100)
          }
        }
      }

      let updatedSrp = newSecretRealmProgress
      if (isSecretRealm && updatedSrp.length > 0) {
        const realm = updatedSrp[0]
        if (!realm.discovered) {
          updatedSrp = updatedSrp.map(r =>
            r.id === realm.id ? { ...r, discovered: true, stage: Math.max(r.stage, 1) } : r
          )
        }
      }

      return {
        character: ch,
        secretRealmProgress: updatedSrp,
        secretRealmResults: newSecretRealmResults,
        inventory: newInventory
      }
    })

    if (changes.length) narrative += ` (${changes.join('，')})`
    addLog(`【${pendingEvent.title}】${narrative}${wrongChoice ? ' （选错了，下次再来吧）' : ''}`)
    set({ pendingEvent: null })
  },

  triggerDemonTrial: async (fromSchedule = false) => {
    const { character } = get()
    if (character?.hiddenDemonUnlocked) {
      set({
        pendingDemonTrial: HIDDEN_DEMON_QUESTION,
        pendingDemonFromSchedule: fromSchedule
      })
      set(s => s.character ? {
        character: { ...s.character, hiddenDemonUnlocked: false, hiddenDemonUsed: true }
      } : {})
      if (get().secretRealmResults.length > 0) {
        set(s => ({
          secretRealmResults: s.secretRealmResults.map(r =>
            r.unlockedHiddenDemon ? { ...r, hiddenDemonTriggered: true } : r
          )
        }))
      }
      return
    }
    const resp = await generateRandomDemonTrial()
    set({
      pendingDemonTrial: resp.data,
      pendingDemonFromSchedule: fromSchedule
    })
  },

  resolveDemonChoiceInSchedule: (choice) => {
    const { character, addLog, pendingDemonTrial } = get()
    if (!character || !pendingDemonTrial) return

    const isHidden = pendingDemonTrial.hidden === true

    let heartStrength = choice.heartStrength
    if (character.daoxin === 'detached') heartStrength = Math.floor(heartStrength * 1.3)
    if (character.daoxin === 'ambitious' && heartStrength < 0) heartStrength = Math.floor(heartStrength * 1.4)

    let karmaEffect = choice.karmaEffect
    if (character.daoxin === 'benevolent') karmaEffect = karmaEffect > 0 ? karmaEffect * 2 : karmaEffect * 2

    set(state => {
      let newResults = state.secretRealmResults
      if (isHidden && newResults.length > 0) {
        newResults = newResults.map(r =>
          r.unlockedHiddenDemon ? {
            ...r,
            hiddenDemonChoiceId: choice.id,
            hiddenDemonChoiceText: choice.text,
            hiddenDemonOutcome: choice.outcomeText
          } : r
        )
      }
      return {
        character: {
          ...state.character!,
          karma: state.character!.karma + karmaEffect,
          mind: {
            ...state.character!.mind,
            value: clamp(state.character!.mind.value + Math.floor(heartStrength / 2), 0, state.character!.mind.max)
          }
        },
        secretRealmResults: newResults
      }
    })

    const prefix = isHidden ? '【往生镜·心魔试炼】' : '【心魔试炼】'
    addLog(`${prefix}${choice.outcomeText}（心之力${heartStrength > 0 ? '+' : ''}${heartStrength}，因果${karmaEffect > 0 ? '+' : ''}${karmaEffect}）`)

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

    const isHidden = pendingDemonTrial.hidden === true

    let heartStrength = choice.heartStrength
    if (character.daoxin === 'detached') heartStrength = Math.floor(heartStrength * 1.3)
    if (character.daoxin === 'ambitious' && heartStrength < 0) heartStrength = Math.floor(heartStrength * 1.4)

    let karmaEffect = choice.karmaEffect
    if (character.daoxin === 'benevolent') karmaEffect = karmaEffect > 0 ? karmaEffect * 2 : karmaEffect * 2

    set(state => {
      let newResults = state.secretRealmResults
      if (isHidden && newResults.length > 0) {
        newResults = newResults.map(r =>
          r.unlockedHiddenDemon ? {
            ...r,
            hiddenDemonChoiceId: choice.id,
            hiddenDemonChoiceText: choice.text,
            hiddenDemonOutcome: choice.outcomeText
          } : r
        )
      }
      return {
        character: {
          ...state.character!,
          karma: state.character!.karma + karmaEffect,
          mind: {
            ...state.character!.mind,
            value: clamp(state.character!.mind.value + Math.floor(heartStrength / 2), 0, state.character!.mind.max)
          }
        },
        secretRealmResults: newResults
      }
    })

    const prefix = isHidden ? '【往生镜·心魔试炼】' : '【心魔试炼】'
    addLog(`${prefix}${choice.outcomeText}（心之力${heartStrength > 0 ? '+' : ''}${heartStrength}，因果${karmaEffect > 0 ? '+' : ''}${karmaEffect}）`)

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

    const posBonus = SECT_POSITION_INFO[character.sectPosition]?.bondBonus || 0

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

    if (posBonus > 0) {
      bondChange += Math.ceil(posBonus * 0.1)
    }

    set(state => ({
      relationships: state.relationships.map(r =>
        r.id === npcId ? { ...r, bond: clamp(r.bond + bondChange, -100, 100) } : r
      )
    }))

    const bondResp = await generateBondChangeNarrative(npc, bondChange, 'chat')
    const posHint = posBonus > 0 ? `（${SECT_POSITION_INFO[character.sectPosition].name}加持）` : ''
    addLog(`【与${npc.name}交谈】"${resp.data}" ${bondResp.data}（羁绊${bondChange > 0 ? '+' : ''}${bondChange}${posHint}）`)
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

    const isSectQuest = quest.id.startsWith('sect_')
    const posInfo = SECT_POSITION_INFO[character.sectPosition]
    const multiplier = isSectQuest ? 1.0 : posInfo.questMultiplier

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
          const stones = Math.floor(quest.reward.spiritStones * multiplier)
          ch.spiritStones += stones
          rewards.push(`灵石+${stones}${multiplier > 1 ? `（×${multiplier}）` : ''}`)
        }
        if (quest.reward.fame) {
          const fame = Math.floor(quest.reward.fame * multiplier)
          ch.fame += fame
          rewards.push(`名望+${fame}`)
        }
        if (quest.reward.karma) {
          let rk = quest.reward.karma
          if (ch.daoxin === 'benevolent') rk = rk > 0 ? rk * 2 : rk
          ch.karma += rk
          rewards.push(`因果+${rk}`)
        }
        if (isSectQuest) {
          const sectFameGain = Math.max(5, Math.floor(10 * (quest.difficulty || 1)))
          ch.sectFame = (ch.sectFame || 0) + sectFameGain
          rewards.push(`宗门声望+${sectFameGain}`)
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
    const { character, currentDay, maxDays, addLog, checkEnding, mainQuest, relationshipEvents, relationships, healInjuriesByDay, unlockMainQuestNPC, checkSectEvents } = get()
    if (!character) return

    const nextDay = currentDay + 1
    set({
      currentDay: nextDay,
      character: { ...character, age: character.age + (nextDay % 365 === 0 ? 1 : 0) }
    })

    healInjuriesByDay()

    set(state => state.character && state.character.realmProgress >= 100 ? { breakthroughReady: true } : {})

    if (nextDay % 10 === 0) {
      addLog(`十年一度的心魔劫将至，准备迎接心魔试炼吧……`)
    }

    const state = get()
    if (state.mainQuest && !state.mainQuest.completed) {
      const mq = state.mainQuest
      const currentStep = mq.steps[mq.currentStepIndex]
      if (currentStep && !mq.started) {
        const realmMet = !currentStep.minRealm || REALM_ORDER.indexOf(character.realm) >= REALM_ORDER.indexOf(currentStep.minRealm)
        const dayMet = nextDay >= currentStep.minDay
        if (realmMet && dayMet) {
          set(s => s.mainQuest ? {
            mainQuest: { ...s.mainQuest, started: true }
          } : {})
          addLog(`【主线开启】${mq.name}：${currentStep.title}`, 'main')

          if (currentStep.unlockNPCs) {
            currentStep.unlockNPCs.forEach(npcId => unlockMainQuestNPC(npcId))
          }
        }
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

    checkSectEvents()

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
    const { character, addLog, mainQuest, relationships, unlockMainQuestNPC, mainQuestChoices } = get()
    if (!mainQuest || !character) return

    const currentStep = mainQuest.steps[mainQuest.currentStepIndex]
    if (!currentStep) return

    const success = Math.random() < choice.successRate
    const rewards: string[] = []

    if (currentStep.unlockNPCs) {
      currentStep.unlockNPCs.forEach(npcId => unlockMainQuestNPC(npcId))
    }

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
          const existing = newRelationships.find(r => r.id === rc.id)
          if (!existing) {
            const npcInfo = MAIN_QUEST_NPCS.find(n => n.id === rc.id)
            if (npcInfo) {
              newRelationships.push({
                id: npcInfo.id,
                name: npcInfo.name,
                title: npcInfo.title,
                description: npcInfo.description,
                bond: npcInfo.minBond + rc.bondChange,
                role: npcInfo.role,
                portrait: npcInfo.portrait,
                autoUnlocked: true
              })
              rewards.push(`结识${npcInfo.name}`)
            }
          } else {
            newRelationships = newRelationships.map(r =>
              r.id === rc.id
                ? { ...r, bond: clamp(r.bond + rc.bondChange, -100, 100) }
                : r
            )
            rewards.push(`${existing.name} 羁绊${rc.bondChange > 0 ? '+' : ''}${rc.bondChange}`)
          }
        }
      }

      const isLastStep = mainQuest.currentStepIndex >= mainQuest.steps.length - 1
      let newMainQuest = { ...mainQuest }
      if (success) {
        if (isLastStep) {
          newMainQuest.completed = true
        } else {
          newMainQuest.currentStepIndex = mainQuest.currentStepIndex + 1
          newMainQuest.started = false
        }
      }

      const choiceRecord: MainQuestChoiceRecord = {
        stepId: currentStep.id,
        stepTitle: currentStep.title,
        choiceId: choice.id,
        choiceText: choice.text,
        outcomeSummary: success ? '成功' : '失败'
      }

      return {
        character: ch,
        relationships: newRelationships,
        mainQuest: newMainQuest,
        mainQuestChoices: [...state.mainQuestChoices, choiceRecord],
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
    const { character, secretRealmProgress, addLog, inventory } = get()
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

    const stageReq = SECRET_REALM_STAGE_REQS[stage]
    if (stageReq) {
      if (stageReq.minRealm) {
        const realmIdx = REALM_ORDER.indexOf(character.realm)
        const minRealmIdx = REALM_ORDER.indexOf(stageReq.minRealm as any)
        if (realmIdx < minRealmIdx) {
          addLog(`秘境此处禁制非你目前修为可破。需【${stageReq.minRealm}】方能继续（当前${character.realm}）。`)
          return
        }
      }
      if (stageReq.requiresItem && !inventory.includes(stageReq.requiresItem)) {
        addLog(`缺少关键物品。${stageReq.description}。`)
        return
      }
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
    addLog(`【天机秘境·第 ${stage + 1} 阶段】${event.title}`)
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
  },

  trySectPositionUpgrade: () => {
    const { character, addLog, positionHistory, currentDay } = get()
    if (!character) return

    const posOrder: SectPosition[] = ['outer', 'inner', 'core', 'elder', 'grand_elder', 'sect_master']
    const currentIdx = posOrder.indexOf(character.sectPosition)

    for (let i = posOrder.length - 1; i > currentIdx; i--) {
      const nextPos = posOrder[i]
      const info = SECT_POSITION_INFO[nextPos]
      const realmIdx = REALM_ORDER.indexOf(character.realm)
      const minRealmIdx = REALM_ORDER.indexOf(info.minRealm)

      if (realmIdx >= minRealmIdx && (character.sectFame || 0) >= info.minFame) {
        set(s => ({
          character: s.character ? {
            ...s.character,
            sectPosition: nextPos
          } : null,
          positionHistory: [...positionHistory, { position: nextPos, day: currentDay }]
        }))
        addLog(`宗门提拔：你晋升为【${info.name}】！`, 'social')
        return
      }
    }
  },

  startBreakthroughPrep: () => {
    const { character } = get()
    if (!character) return

    set({
      pendingBreakthroughPrep: true
    })
  },

  setBreakthroughPrep: (prep) => {
    set(s => ({
      character: s.character ? {
        ...s.character,
        breakthroughPrep: {
          ...s.character.breakthroughPrep,
          ...prep
        }
      } : null
    }))
  },

  attemptBreakthroughWithPrep: () => {
    const { character, addLog, breakthroughHistory, currentDay, trySectPositionUpgrade, checkEnding } = get()
    if (!character) return

    const prep = character.breakthroughPrep
    const currentIdx = REALM_ORDER.indexOf(character.realm)
    const nextRealm = REALM_ORDER[currentIdx + 1]
    if (!nextRealm) return

    const isMidLate = currentIdx >= REALM_ORDER.indexOf('金丹期')

    let baseRate = 0.5 + character.realmProgress * 0.003
    if (character.daoxin === 'ambitious') baseRate -= 0.05
    if (character.daoxin === 'cautious') baseRate += 0.05

    const locInfo = BREAKTHROUGH_LOCATIONS[prep.location]
    const pillsCost = prep.pills * 100
    const locCost = locInfo.cost
    const totalCost = pillsCost + locCost
    const canAfford = character.spiritStones >= totalCost

    if (canAfford) {
      baseRate += locInfo.successBonus
      baseRate += prep.pills * 0.05
    } else {
      baseRate += locInfo.successBonus * 0.3
      baseRate += prep.pills * 0.02
    }

    if (prep.guardians.length > 0) {
      baseRate += prep.guardians.length * 0.03
    }

    if (character.injuries && character.injuries.length > 0) {
      character.injuries.forEach(ij => {
        baseRate += ij.effects.successRatePenalty || 0
      })
    }

    if (character.hasPillToxin) {
      baseRate -= 0.05
    }

    baseRate = clamp(baseRate, 0.05, 0.95)
    const success = Math.random() < baseRate

    if (success) {
      set(s => ({
        character: s.character ? {
          ...s.character,
          realm: nextRealm,
          realmProgress: 0,
          spirit: { ...s.character.spirit, value: s.character.spirit.max },
          body: { ...s.character.body, value: s.character.body.max },
          mind: { ...s.character.mind, value: s.character.mind.max },
          fame: clamp(s.character.fame + 15, -100, 100),
          sectFame: clamp((s.character.sectFame || 0) + 10, 0, 1000),
          spiritStones: Math.max(0, s.character.spiritStones - totalCost),
          hasPillToxin: false,
          breakthroughPrep: {
            pills: 0,
            guardians: [],
            location: 'sect',
            preparationDays: 0,
            hasPrepared: false
          }
        } : null,
        breakthroughHistory: [...breakthroughHistory, { realm: nextRealm, day: currentDay, success: true }],
        breakthroughReady: false,
        pendingBreakthroughPrep: false
      }))
      addLog(`突破成功！晋升【${nextRealm}】，天地异象横生，宗门震动。${totalCost > 0 ? `（消耗 💎${totalCost}）` : ''}`, 'cultivation')
      setTimeout(() => trySectPositionUpgrade(), 100)
      setTimeout(() => checkEnding(false), 200)
    } else {
      const injuryTypes: Injury['type'][] = ['meridian_damage', 'foundation_crack', 'demon_seed']
      if (prep.guardians.length > 0) injuryTypes.push('debt_favor')
      const pick = injuryTypes[Math.floor(Math.random() * injuryTypes.length)]
      const template = INJURY_TEMPLATES[pick]

      const progressLoss = isMidLate ? 30 : 15
      const fameLoss = isMidLate ? 10 : 3

      set(s => ({
        character: s.character ? {
          ...s.character,
          realmProgress: clamp(s.character.realmProgress - progressLoss, 0, 100),
          fame: clamp(s.character.fame - fameLoss, -100, 100),
          spiritStones: Math.max(0, s.character.spiritStones - totalCost),
          injuries: [
            ...(s.character.injuries || []),
            { id: `injury_${Date.now()}`, ...template }
          ],
          breakthroughPrep: {
            pills: 0,
            guardians: [],
            location: 'sect',
            preparationDays: 0,
            hasPrepared: false
          }
        } : null,
        breakthroughHistory: [...breakthroughHistory, { realm: nextRealm, day: currentDay, success: false, hadInjury: true, injuryName: template.name }],
        breakthroughReady: false,
        pendingBreakthroughPrep: false
      }))
      addLog(`突破失败！道心震荡，${template.name}缠身，境界退转。需调养${template.daysRemaining}日。${totalCost > 0 ? `（消耗 💎${totalCost}）` : ''}`, 'cultivation')
      if (pick === 'demon_seed') {
        addLog(`心魔种子潜伏于识海，下次心魔试炼将更为凶险……`, 'demon')
      }
    }
  },

  unlockMainQuestNPC: (npcId) => {
    const { relationships, addLog } = get()
    if (relationships.some(r => r.id === npcId)) return

    const info = MAIN_QUEST_NPCS.find(n => n.id === npcId)
    if (!info) return

    const newRel: Relationship = {
      id: info.id,
      name: info.name,
      title: info.title,
      description: info.description,
      bond: info.minBond,
      role: info.role,
      portrait: info.portrait,
      autoUnlocked: true
    }

    set({ relationships: [...relationships, newRel] })
    addLog(`【主线结缘】你与${info.name}相识，他/她将成为你修行路上的重要人物。`, 'social')
  },

  addInjury: (injury) => {
    set(s => ({
      character: s.character ? {
        ...s.character,
        injuries: [
          ...(s.character.injuries || []),
          { id: `injury_${Date.now()}`, ...injury }
        ]
      } : null
    }))
  },

  healInjuriesByDay: () => {
    set(s => {
      if (!s.character || !s.character.injuries) return {}

      const updatedInjuries = s.character.injuries
        .map(ij => ({ ...ij, daysRemaining: ij.daysRemaining - 1 }))
        .filter(ij => ij.daysRemaining > 0)

      const healed = s.character.injuries.length - updatedInjuries.length
      if (healed > 0) {
        (get() as any).addLog(`调养中，${healed}处伤势痊愈。`, 'cultivation')
      }

      return {
        character: {
          ...s.character,
          injuries: updatedInjuries
        }
      }
    })
  },

  checkSectEvents: () => {
    const { character, currentDay, sectEventRecords, pendingSectEvent, addLog } = get()
    if (!character || pendingSectEvent) return

    const posOrder: SectPosition[] = ['outer', 'inner', 'core', 'elder', 'grand_elder', 'sect_master']
    const posIdx = posOrder.indexOf(character.sectPosition)

    for (const event of SECT_EVENTS) {
      const reqIdx = posOrder.indexOf(event.requiredPosition)
      if (posIdx < reqIdx) continue
      if (currentDay < event.minDay) continue
      if (sectEventRecords.some(r => r.id === event.id)) continue

      set({ pendingSectEvent: event })
      addLog(`【宗门要事·${SECT_POSITION_INFO[event.requiredPosition].name}专属】${event.title}`, 'main')
      break
    }
  },

  resolveSectEvent: (choice) => {
    const { character, pendingSectEvent, currentDay, addLog, sectEventRecords } = get()
    if (!character || !pendingSectEvent) return

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
        const r = pendingSectEvent.reward
        if (r.spiritStones) { ch.spiritStones += r.spiritStones; rewards.push(`灵石+${r.spiritStones}`) }
        if (r.fame) { ch.fame += r.fame; rewards.push(`名望+${r.fame}`) }
        if (r.karma) { ch.karma += r.karma; rewards.push(`因果+${r.karma}`) }
        if (r.sectFame) { ch.sectFame = (ch.sectFame || 0) + r.sectFame; rewards.push(`宗门声望+${r.sectFame}`) }
        if (r.relationshipChanges) {
          const newRels = state.relationships.map(rel => {
            const change = r.relationshipChanges?.find(c => c.id === rel.id)
            if (change) {
              return { ...rel, bond: clamp(rel.bond + change.bondChange, -100, 100) }
            }
            return rel
          })
          return {
            character: ch,
            relationships: newRels,
            pendingSectEvent: null,
            sectEventRecords: [...sectEventRecords, {
              id: pendingSectEvent.id,
              title: pendingSectEvent.title,
              day: currentDay,
              choiceText: choice.text,
              outcome: choice.specialOutcome || '',
              success: true
            }]
          }
        }
      } else {
        const p = pendingSectEvent.penalty
        if (p.fame) { ch.fame = clamp(ch.fame + p.fame, -100, 100); rewards.push(`名望${p.fame}`) }
        if (p.karma) { ch.karma += p.karma; rewards.push(`因果${p.karma}`) }
        if (p.sectFame) { ch.sectFame = Math.max(0, (ch.sectFame || 0) + p.sectFame); rewards.push(`宗门声望${p.sectFame}`) }
      }

      return {
        character: ch,
        pendingSectEvent: null,
        sectEventRecords: [...sectEventRecords, {
          id: pendingSectEvent.id,
          title: pendingSectEvent.title,
          day: currentDay,
          choiceText: choice.text,
          outcome: success ? (choice.specialOutcome || '') : '事情未能如预期般发展，留下了些许遗憾。',
          success: success
        }]
      }
    })

    const resultText = success
      ? choice.specialOutcome || '事情处理得十分妥当。'
      : '事情似乎出了些变数，未能完全如愿。'
    addLog(`【${pendingSectEvent.title}】${resultText}（${rewards.join('，') || '无特殊影响'}）`, 'main')
  },

  healInjury: (optionId) => {
    const { character, addLog, relationships, currentDay } = get()
    if (!character || !character.injuries || character.injuries.length === 0) return

    const option = INJURY_HEAL_OPTIONS.find(o => o.id === optionId)
    if (!option) return

    if (character.spiritStones < option.cost) {
      addLog(`灵石不足，无法选择【${option.name}】。`)
      return
    }

    const success = Math.random() < option.successRate
    const changes: string[] = []

    set(state => {
      if (!state.character) return {}
      const ch = { ...state.character }

      ch.spiritStones += option.spiritStonesChange
      if (option.spiritStonesChange) changes.push(`灵石${option.spiritStonesChange > 0 ? '+' : ''}${option.spiritStonesChange}`)

      if (ch.injuries && ch.injuries.length > 0) {
        const newInjuries = success
          ? ch.injuries.map(ij => ({ ...ij, daysRemaining: Math.max(0, ij.daysRemaining - option.daysReduction) }))
              .filter(ij => ij.daysRemaining > 0)
          : ch.injuries
        const healed = ch.injuries.length - newInjuries.length
        if (success && option.daysReduction > 0) {
          changes.push(`伤势恢复加速${option.daysReduction}日`)
          if (healed > 0) changes.push(`${healed}处伤势痊愈`)
        }
        ch.injuries = newInjuries
      }

      if (option.karmaChange) {
        ch.karma += option.karmaChange
        changes.push(`因果${option.karmaChange > 0 ? '+' : ''}${option.karmaChange}`)
      }

      if (option.id === 'seek_healer') {
        const healer = state.relationships.find(r => r.id === 'npc_baishang')
        if (healer) {
          const newRels = state.relationships.map(r =>
            r.id === 'npc_baishang' ? { ...r, bond: clamp(r.bond + 10, -100, 100) } : r
          )
          changes.push('白裳好感+10')
          return { character: ch, relationships: newRels }
        }
      }

      if (option.id === 'take_medicine' && success && Math.random() < 0.15) {
        ch.hasPillToxin = true
        changes.push('丹毒残留，下次突破成功率-5%')
      }

      return { character: ch }
    })

    if (success) {
      addLog(`【疗伤·${option.name}】${option.description}（${changes.join('，') || '无特殊效果'}）`, 'cultivation')
    } else {
      addLog(`【疗伤·${option.name}】似乎没有什么效果，还需耐心调养。（${changes.join('，') || '无特殊效果'}）`, 'cultivation')
    }

    ;(get() as any)._advanceDay()
  }
}))
