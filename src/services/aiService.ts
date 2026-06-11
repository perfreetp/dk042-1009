import type { CavernEvent, DemonQuestion, Relationship, Quest, Skill } from '@/types/game'
import { CAVERN_EVENTS, DEMON_QUESTIONS, NPC_POOL, PURCHASABLE_SKILLS, SKILL_PRICES, TOWN_QUESTS } from '@/data/gameData'

const SHIFU_DIALOGUES = [
  '徒儿，修行之道，贵在持之以恒。切不可急功近利，更不可半途而废。',
  '昨夜观星象，紫微帝星黯淡，煞星微光……你近日行事，需多加小心。',
  '为师今日传你一段口诀，你且记好——天地玄黄，宇宙洪荒，日月盈昃，辰宿列张。',
  '听说你近日在城中颇有名气，这是好事。但切记，木秀于林，风必摧之。',
  '道心者，修行之根本也。心若蒙尘，则道必不远。'
]

const FRIEND_DIALOGUES = [
  '嗨！你今日气色不错，可是有什么喜事？',
  '我最近听说了一个秘境，要不要约个时间一起去探索一番？',
  '上次你帮我那件事，我还没好好谢你呢。走，我请你喝酒！',
  '修行路上，能结识你这样的朋友，真是我之大幸。',
  '最近城中新来了一个神秘商人，据说有不少好东西，要一起去看看吗？'
]

const RIVAL_DIALOGUES = [
  '哼，又是你。别以为有几分运气就能一直嚣张下去。',
  '下次宗门大比，我一定会让你知道，什么叫真正的实力。',
  '听说你最近又得了什么机缘？可惜啊，有些人就是守不住自己的东西。',
  '走着瞧吧，总有一天，我会把你踩在脚下。',
  '……不想和你说话，滚开。'
]

const ACQUAINTANCE_DIALOGUES = [
  '道友有礼了。今日天气不错，正适合外出游历啊。',
  '听说坊市近日有拍卖，道友有意去看看吗？',
  '最近太平吗？我总觉得山雨欲来风满楼……',
  '道友年纪轻轻就有如此修为，将来前途不可限量啊。',
  '若是有什么需要帮忙的，尽管开口。当然，灵石不能少。'
]

export interface AIResponse<T> {
  success: boolean
  data: T
  fromAI: boolean
}

export async function generateShifuDialogue(relationship: Relationship): Promise<AIResponse<string>> {
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
  return {
    success: true,
    data: SHIFU_DIALOGUES[Math.floor(Math.random() * SHIFU_DIALOGUES.length)],
    fromAI: false
  }
}

export async function generateFriendDialogue(relationship: Relationship): Promise<AIResponse<string>> {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 400))
  const pool = relationship.role === 'rival' ? RIVAL_DIALOGUES
    : relationship.role === 'friend' || relationship.role === 'lover' ? FRIEND_DIALOGUES
    : ACQUAINTANCE_DIALOGUES
  return {
    success: true,
    data: pool[Math.floor(Math.random() * pool.length)],
    fromAI: false
  }
}

export async function generateRandomCavernEvent(currentRealm: string): Promise<AIResponse<CavernEvent>> {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800))
  const REALM_ORDER_ARR = ['凡人', '炼气期', '筑基期', '金丹期', '元婴期', '化神期', '渡劫期', '大乘期']
  const currentRank = REALM_ORDER_ARR.indexOf(currentRealm)
  
  const available = CAVERN_EVENTS.filter(e => {
    if (!e.minRealm) return true
    return REALM_ORDER_ARR.indexOf(e.minRealm) <= currentRank
  })
  
  const event = available[Math.floor(Math.random() * available.length)]
  return {
    success: true,
    data: event,
    fromAI: false
  }
}

export async function generateRandomDemonTrial(): Promise<AIResponse<DemonQuestion>> {
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
  const question = DEMON_QUESTIONS[Math.floor(Math.random() * DEMON_QUESTIONS.length)]
  return {
    success: true,
    data: question,
    fromAI: false
  }
}

export async function generateAvailableNPCs(): Promise<AIResponse<Relationship[]>> {
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600))
  const count = 3 + Math.floor(Math.random() * 3)
  const shuffled = [...NPC_POOL].sort(() => Math.random() - 0.5)
  return {
    success: true,
    data: shuffled.slice(0, count).map(npc => ({ ...npc, bond: 0 })),
    fromAI: false
  }
}

export async function generateAvailableQuests(currentRealm: string): Promise<AIResponse<Quest[]>> {
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
  const count = 2 + Math.floor(Math.random() * 3)
  const shuffled = [...TOWN_QUESTS].sort(() => Math.random() - 0.5)
  return {
    success: true,
    data: shuffled.slice(0, count).map(q => ({ ...q, completed: false })),
    fromAI: false
  }
}

export async function generateShopItems(): Promise<AIResponse<{ skill: Skill; price: number }[]>> {
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400))
  const count = 3 + Math.floor(Math.random() * 3)
  const shuffled = [...PURCHASABLE_SKILLS].sort(() => Math.random() - 0.5)
  return {
    success: true,
    data: shuffled.slice(0, count).map(skill => ({
      skill,
      price: SKILL_PRICES[skill.id] || 300
    })),
    fromAI: false
  }
}

export async function generateDailyNarrative(day: number, action: string): Promise<AIResponse<string>> {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
  const narratives: Record<string, string[]> = {
    meditation: [
      `第${day}日，你盘膝而坐，吐纳周天。体内灵力缓缓运转，经脉中传来阵阵暖意。`,
      `第${day}日，你入定修行，灵台清明。恍惚间似乎感应到了天地法则的一丝脉动。`,
      `第${day}日，你潜心修炼，不敢有丝毫懈怠。日头西斜时，你缓缓睁眼，只觉神清气爽。`
    ],
    body_train: [
      `第${day}日，你扎马步、举石锁，磨练肉身筋骨。汗水浸透了衣衫，但你咬牙坚持。`,
      `第${day}日，你以灵药浸泡全身，再辅以锻体之法。虽痛苦不堪，但肉身强度稳步提升。`,
      `第${day}日，你外练筋骨皮，内练一口气。日落时分，你挥出一拳，竟隐隐有破空之声。`
    ],
    travel: [
      `第${day}日，你离开洞府，游历四方。名山大川之间，留下了你的足迹。`,
      `第${day}日，你踏上旅途，沿途见闻令你大开眼界。世间百态，尽入你眼。`,
      `第${day}日，你信马由缰，随心而行。不知走了多远，只觉得心境开阔了不少。`
    ]
  }
  
  const pool = narratives[action] || narratives.meditation
  return {
    success: true,
    data: pool[Math.floor(Math.random() * pool.length)],
    fromAI: false
  }
}

export async function generateBondChangeNarrative(
  relationship: Relationship,
  bondChange: number,
  interactionType: string
): Promise<AIResponse<string>> {
  await new Promise(resolve => setTimeout(resolve, 250 + Math.random() * 400))
  
  const positive = bondChange > 0
  const narratives = positive ? [
    `你与${relationship.name}相谈甚欢，两人之间的羁绊加深了。`,
    `今日的相处让你对${relationship.name}有了更深的了解，关系更进一步。`,
    `${relationship.name}对你的表现十分满意，看向你的眼神中多了几分认可。`,
    `你与${relationship.name}谈笑风生，临别时双方都有些意犹未尽。`
  ] : [
    `你与${relationship.name}之间发生了一些不愉快，关系出现了裂痕。`,
    `${relationship.name}对你今日的所作所为颇有微词，拂袖而去。`,
    `你能感觉到，${relationship.name}看向你的眼神中多了几分疏离。`,
    `这次的互动并不愉快，你与${relationship.name}之间的气氛变得有些微妙。`
  ]
  
  return {
    success: true,
    data: narratives[Math.floor(Math.random() * narratives.length)],
    fromAI: false
  }
}
