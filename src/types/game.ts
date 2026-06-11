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
  spiritStones: number
  skills: Skill[]
  maxSkills: number
}

export interface Relationship {
  id: string
  name: string
  title: string
  description: string
  bond: number
  role: 'master' | 'friend' | 'lover' | 'enemy' | 'rival' | 'disciple' | 'acquaintance'
  portrait: string
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
  completed: boolean
  type: 'commission' | 'combat' | 'social' | 'secret'
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
}

export interface DemonQuestion {
  id: string
  question: string
  choices: DemonChoice[]
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
    minFame?: number
    minKarma?: number
    maxKarma?: number
    minBondSum?: number
    daoxin?: Daoxin[]
  }
  rarity: '普通' | '稀有' | '传说' | '神话'
}

export interface GameLog {
  day: number
  screen: Screen
  narrative: string
  timestamp: number
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
  breakthroughReady: boolean
  endingId: string | null
  availableEndings: string[]
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
