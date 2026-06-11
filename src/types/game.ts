export type Origin = 'noble' | 'peasant' | 'merchant' | 'scholar' | 'soldier' | 'orphan'
export type Daoxin = 'benevolent' | 'ambitious' | 'cautious' | 'free' | 'vengeful' | 'detached'
export type Realm = '凡人' | '炼气期' | '筑基期' | '金丹期' | '元婴期' | '化神期' | '渡劫期' | '大乘期'
export type Screen = 'creation' | 'schedule' | 'town' | 'cavern' | 'demon' | 'ending' | 'menu'
export type MoralAlignment = '善' | '中' | '恶'
export type RiskLevel = 'safe' | 'balanced' | 'reckless'

export interface Attribute {
  name: string
  value: number
  max: number
}

export interface Skill {
  id: string
  name: string
  description: string
  level: number
  maxLevel: number
  type: 'attack' | 'defense' | 'support' | 'cultivation'
  tags: string[]
}

export type SectPosition = 'outer' | 'inner' | 'core' | 'elder' | 'grand_elder' | 'sect_master'

export const SECT_POSITION_INFO: Record<SectPosition, {
  name: string
  description: string
  minFame: number
  minRealm: Realm
  questMultiplier: number
  bondBonus: number
}> = {
  outer: {
    name: '外门弟子',
    description: '初入宗门，打杂修行，能接取宗门基础任务。',
    minFame: 0,
    minRealm: '炼气期',
    questMultiplier: 1.0,
    bondBonus: 0
  },
  inner: {
    name: '内门弟子',
    description: '宗门重点培养对象，可修习上乘功法，有机会得长老指点。',
    minFame: 30,
    minRealm: '筑基期',
    questMultiplier: 1.5,
    bondBonus: 5
  },
  core: {
    name: '核心弟子',
    description: '宗门种子，传承侯选，地位尊崇，资源充沛。',
    minFame: 60,
    minRealm: '金丹期',
    questMultiplier: 2.0,
    bondBonus: 10
  },
  elder: {
    name: '宗门长老',
    description: '开宗立派的人物之一，掌管一峰或一职，决策宗门事务。',
    minFame: 100,
    minRealm: '元婴期',
    questMultiplier: 3.0,
    bondBonus: 20
  },
  grand_elder: {
    name: '太上长老',
    description: '宗门底蕴，不问俗事，只在宗门存亡之际出手。',
    minFame: 150,
    minRealm: '化神期',
    questMultiplier: 4.0,
    bondBonus: 30
  },
  sect_master: {
    name: '掌门',
    description: '一宗之主，执掌生杀，一言一行皆牵动修真界风云。',
    minFame: 200,
    minRealm: '渡劫期',
    questMultiplier: 5.0,
    bondBonus: 50
  }
}

export type InjuryType = 'meridian_damage' | 'foundation_crack' | 'demon_seed' | 'debt_favor' | 'loss_reputation' | 'none'

export interface Injury {
  id: string
  type: InjuryType
  name: string
  description: string
  severity: number
  daysRemaining: number
  effects: {
    spirit?: number
    body?: number
    mind?: number
    luck?: number
    successRatePenalty?: number
  }
}

export interface BreakthroughPreparation {
  pills: number
  guardians: string[]
  location: 'sect' | 'cavern' | 'mountain_peak' | 'secret_realm'
  preparationDays: number
  hasPrepared: boolean
}

export interface MainQuestChoiceRecord {
  stepId: string
  stepTitle: string
  choiceId: string
  choiceText: string
  outcomeSummary: string
}

export interface SecretRealmResult {
  id: string
  name: string
  completed: boolean
  finalChoice: string
  finalChoiceId: string
  acquiredSkillId?: string
  unlockedHiddenDemon: boolean
  hiddenDemonTriggered?: boolean
  hiddenDemonChoiceId?: string
  hiddenDemonChoiceText?: string
  hiddenDemonOutcome?: string
}

export interface Character {
  name: string
  origin: Origin
  daoxin: Daoxin
  age: number
  realm: Realm
  realmProgress: number
  spirit: Attribute
  body: Attribute
  mind: Attribute
  luck: number
  karma: number
  fame: number
  sectFame: number
  sectPosition: SectPosition
  spiritStones: number
  skills: Skill[]
  maxSkills: number
  injuries: Injury[]
  breakthroughPrep: BreakthroughPreparation
  hiddenDemonUnlocked: boolean
  hiddenDemonUsed: boolean
  hasPillToxin: boolean
}

export interface Relationship {
  id: string
  name: string
  title: string
  description: string
  bond: number
  role: 'master' | 'friend' | 'lover' | 'enemy' | 'rival' | 'disciple' | 'acquaintance'
  portrait: string
  autoUnlocked?: boolean
}

export interface Quest {
  id: string
  title: string
  description: string
  difficulty: number
  reward: {
    spiritStones?: number
    fame?: number
    karma?: number
    skillId?: string
    relationshipId?: string
  }
  choices: QuestChoice[]
  completed?: boolean
  type: 'commission' | 'combat' | 'social' | 'secret' | 'cultivation'
}

export interface QuestChoice {
  id: string
  text: string
  karmaChange: number
  fameChange: number
  successRate: number
  specialOutcome?: string
}

export interface CavernEvent {
  id: string
  title: string
  narrative: string
  type: 'opportunity' | 'disaster' | 'choice' | 'enlightenment' | 'combat'
  choices: EventChoice[]
  minRealm?: Realm
}

export interface EventChoice {
  id: string
  text: string
  requires?: {
    attribute?: string
    minValue?: number
    item?: string
    skill?: string
  }
  outcomes: EventOutcome[]
}

export interface EventOutcome {
  probability: number
  narrative: string
  spiritChange?: number
  bodyChange?: number
  mindChange?: number
  karmaChange?: number
  fameChange?: number
  luckChange?: number
  spiritStonesChange?: number
  realmProgressChange?: number
  skillGain?: Skill
  relationshipChange?: { id: string; bondChange: number }
  unlocksHiddenDemon?: boolean
}

export interface DemonQuestion {
  id: string
  question: string
  choices: DemonChoice[]
  hidden?: boolean
}

export interface DemonChoice {
  id: string
  text: string
  heartStrength: number
  karmaEffect: number
  outcomeText: string
}

export interface Ending {
  id: string
  title: string
  subtitle: string
  description: string
  narrative: string
  conditions: {
    minRealm?: Realm
    maxRealm?: Realm
    minFame?: number
    maxFame?: number
    minKarma?: number
    maxKarma?: number
    minBondSum?: number
    maxBondSum?: number
    daoxin?: Daoxin[]
    completedMainQuest?: string
  }
  rarity: '普通' | '稀有' | '传说' | '神话'
}

export interface GameLog {
  day: number
  screen: Screen
  narrative: string
  timestamp: number
  category?: 'main' | 'side' | 'combat' | 'social' | 'breakthrough' | 'cultivation' | 'demon'
}

export interface MainQuestStep {
  id: string
  title: string
  description: string
  narrative: string
  minDay: number
  minRealm?: Realm
  requiresCompleted?: string[]
  unlockNPCs?: string[]
  choices: QuestChoice[]
  reward: {
    spiritStones?: number
    fame?: number
    karma?: number
    relationshipChanges?: { id: string; bondChange: number }[]
    skillId?: string
    unlockEnding?: string
  }
}

export interface MainQuest {
  id: string
  name: string
  description: string
  steps: MainQuestStep[]
  currentStepIndex: number
  completed: boolean
  started: boolean
}

export interface SecretRealmProgress {
  id: string
  name: string
  description: string
  stage: number
  totalStages: number
  lastVisitedDay: number
  clues: string[]
  discovered: boolean
  completed: boolean
}

export interface SectEvent {
  id: string
  title: string
  description: string
  requiredPosition: SectPosition
  minDay: number
  choices: QuestChoice[]
  reward: {
    spiritStones?: number
    fame?: number
    karma?: number
    sectFame?: number
    relationshipChanges?: { id: string; bondChange: number }[]
  }
  penalty: {
    spiritStones?: number
    fame?: number
    karma?: number
    sectFame?: number
  }
}

export interface SectEventRecord {
  id: string
  title: string
  day: number
  choiceText: string
  outcome: string
  success: boolean
}

export interface RelationshipEvent {
  id: string
  relationshipId: string
  triggerBond: number
  type: 'gift' | 'special_dialogue' | 'betrayal' | 'reconciliation' | 'romance' | 'rivalry'
  triggered: boolean
  title: string
  narrative: string
  choices?: QuestChoice[]
  reward?: {
    bondChange?: number
    spiritStones?: number
    karma?: number
    skillId?: string
  }
}

export interface EndingReason {
  condition: string
  met: boolean
  weight: number
  description: string
}

export interface GameState {
  character: Character | null
  relationships: Relationship[]
  inventory: string[]
  quests: Quest[]
  completedQuests: string[]
  currentScreen: Screen
  currentDay: number
  maxDays: number
  logs: GameLog[]
  pendingEvent: CavernEvent | null
  pendingDemonTrial: DemonQuestion | null
  pendingDemonFromSchedule: boolean
  breakthroughReady: boolean
  endingId: string | null
  availableEndings: string[]
  mainQuest: MainQuest | null
  secretRealmProgress: SecretRealmProgress[]
  relationshipEvents: RelationshipEvent[]
  pendingRelationshipEvent: RelationshipEvent | null
  endingReasons: EndingReason[]
  mainQuestChoices: MainQuestChoiceRecord[]
  secretRealmResults: SecretRealmResult[]
  positionHistory: { position: SectPosition; day: number }[]
  breakthroughHistory: { realm: Realm; day: number; success: boolean; hadInjury?: boolean; injuryName?: string }[]
  pendingBreakthroughPrep: boolean
  sectEventRecords: SectEventRecord[]
  pendingSectEvent: SectEvent | null
}

export const REALM_ORDER: Realm[] = [
  '凡人', '炼气期', '筑基期', '金丹期', '元婴期', '化神期', '渡劫期', '大乘期'
]

export const ORIGIN_INFO: Record<Origin, { name: string; description: string; bonuses: Partial<Character> }> = {
  noble: {
    name: '世家公子',
    description: '出身名门望族，自幼锦衣玉食，受过良好教育，人脉广泛。',
    bonuses: { fame: 20, spiritStones: 500, mind: { name: '神识', value: 35, max: 100 } }
  },
  peasant: {
    name: '山野村夫',
    description: '生于农家，虽贫寒却体魄强健，熟知草木药性，心性坚韧。',
    bonuses: { body: { name: '体魄', value: 45, max: 100 }, luck: 10 }
  },
  merchant: {
    name: '商贾之子',
    description: '父辈经商致富，耳濡目染之下精通利益计算，少有亏损。',
    bonuses: { spiritStones: 800, luck: 15, fame: 10 }
  },
  scholar: {
    name: '书香门第',
    description: '世代读书传家，饱读诗书，对典籍道藏颇有见解。',
    bonuses: { mind: { name: '神识', value: 40, max: 100 }, spirit: { name: '灵力', value: 20, max: 100 } }
  },
  soldier: {
    name: '行伍出身',
    description: '曾在军中服役，练就一身武艺，杀伐果断，胆识过人。',
    bonuses: { body: { name: '体魄', value: 50, max: 100 }, spirit: { name: '灵力', value: 15, max: 100 } }
  },
  orphan: {
    name: '流浪孤儿',
    description: '无依无靠，在社会底层挣扎求生，察言观色，坚韧无比。',
    bonuses: { luck: 25, mind: { name: '神识', value: 25, max: 100 }, body: { name: '体魄', value: 30, max: 100 } }
  }
}

export const DAOXIN_INFO: Record<Daoxin, { name: string; description: string; effects: string }> = {
  benevolent: {
    name: '慈悲道心',
    description: '心怀苍生，以救苦救难为修行根本。',
    effects: '善行获得双倍因果，恶行因果惩罚加倍'
  },
  ambitious: {
    name: '鸿鹄道心',
    description: '志存高远，一心追求大道巅峰。',
    effects: '修行速度提升20%，但心魔更加强大'
  },
  cautious: {
    name: '谨慎道心',
    description: '步步为营，不做无把握之事。',
    effects: '失败几率降低，机缘获得几率也降低'
  },
  free: {
    name: '逍遥道心',
    description: '随心所欲，追求无拘无束的自由。',
    effects: '游历事件更多样，善恶选择影响减半'
  },
  vengeful: {
    name: '恩怨道心',
    description: '睚眦必报，恩怨分明，有仇必报。',
    effects: '战斗类事件伤害提升，因果积累加快'
  },
  detached: {
    name: '太上道心',
    description: '斩断情丝，忘情绝欲，一心向道。',
    effects: '心魔试炼更易通过，羁绊关系难以加深'
  }
}
