import type { Skill, Relationship, CavernEvent, DemonQuestion, Ending, Quest } from '@/types/game'

export const STARTER_SKILLS: Skill[] = [
  {
    id: 'basic_breath',
    name: '吐纳术',
    description: '最基础的呼吸吐纳之法，能缓慢吸收天地灵气。',
    level: 1,
    maxLevel: 5,
    type: 'cultivation',
    tags: ['基础', '修炼']
  },
  {
    id: 'basic_fist',
    name: '铁砂拳',
    description: '凡间流传的粗浅拳法，配合灵力使用威力尚可。',
    level: 1,
    maxLevel: 5,
    type: 'attack',
    tags: ['基础', '拳法']
  }
]

export const PURCHASABLE_SKILLS: Skill[] = [
  {
    id: 'sword_basic',
    name: '御剑术·入门',
    description: '御剑飞行的基础法门，练至深处可剑随心动。',
    level: 1,
    maxLevel: 10,
    type: 'attack',
    tags: ['剑术', '飞行']
  },
  {
    id: 'heal_light',
    name: '回春术',
    description: '以温和灵力滋养肉身，加速伤势恢复。',
    level: 1,
    maxLevel: 8,
    type: 'support',
    tags: ['治疗', '木系']
  },
  {
    id: 'fireball',
    name: '火球术',
    description: '凝聚火属性灵力凝成火球攻击敌人。',
    level: 1,
    maxLevel: 8,
    type: 'attack',
    tags: ['火系', '法术']
  },
  {
    id: 'iron_body',
    name: '金钟罩',
    description: '外门炼体功法，可强化肉身防御力。',
    level: 1,
    maxLevel: 10,
    type: 'defense',
    tags: ['炼体', '防御']
  },
  {
    id: 'spirit_sense',
    name: '神识扩展',
    description: '锻炼神识，可探查周身灵气波动和潜在危险。',
    level: 1,
    maxLevel: 10,
    type: 'support',
    tags: ['神识', '探查']
  },
  {
    id: 'thunder_step',
    name: '雷霆步法',
    description: '以雷属性灵力刺激双腿，短距离内快如闪电。',
    level: 1,
    maxLevel: 8,
    type: 'support',
    tags: ['雷系', '身法']
  },
  {
    id: 'ice_shield',
    name: '玄冰护体',
    description: '在体表形成一层坚冰护罩，可挡兵刃法术。',
    level: 1,
    maxLevel: 10,
    type: 'defense',
    tags: ['冰系', '防御']
  },
  {
    id: 'soul_temper',
    name: '锻神诀',
    description: '专门锻炼元神的心法，对神识提升显著。',
    level: 1,
    maxLevel: 12,
    type: 'cultivation',
    tags: ['修炼', '神识']
  }
]

export const SKILL_PRICES: Record<string, number> = {
  sword_basic: 300,
  heal_light: 250,
  fireball: 280,
  iron_body: 200,
  spirit_sense: 350,
  thunder_step: 400,
  ice_shield: 320,
  soul_temper: 500
}

export const NPC_POOL: Relationship[] = [
  {
    id: 'npc_qingxuan',
    name: '青玄子',
    title: '青云掌门',
    description: '青云派掌门，元婴期修士，气质出尘，眼光独到。',
    bond: 0,
    role: 'master',
    portrait: '👴'
  },
  {
    id: 'npc_linger',
    name: '苏灵儿',
    title: '掌门千金',
    description: '活泼可爱的少女，苏掌门独女，对修仙充满好奇。',
    bond: 0,
    role: 'friend',
    portrait: '👧'
  },
  {
    id: 'npc_hanfeng',
    name: '寒风',
    title: '内门大师兄',
    description: '沉稳可靠的大师兄，剑法出众，是不少弟子的榜样。',
    bond: 0,
    role: 'friend',
    portrait: '🧑'
  },
  {
    id: 'npc_mohen',
    name: '墨痕',
    title: '散修客卿',
    description: '来历神秘的散修，对古籍秘闻颇有研究。',
    bond: 0,
    role: 'acquaintance',
    portrait: '🧙'
  },
  {
    id: 'npc_baishang',
    name: '白裳',
    title: '医仙传人',
    description: '医术高明的女修，心地善良，常行医救人。',
    bond: 0,
    role: 'friend',
    portrait: '👩'
  },
  {
    id: 'npc_yeming',
    name: '夜冥',
    title: '黑市商人',
    description: '暗中经营黑市的神秘商人，只有你想不到的，没有他弄不到的。',
    bond: 0,
    role: 'acquaintance',
    portrait: '🕵️'
  },
  {
    id: 'npc_liancheng',
    name: '连城',
    title: '世家少主',
    description: '与你有过节的世家子弟，心胸狭隘，睚眦必报。',
    bond: 0,
    role: 'rival',
    portrait: '😤'
  }
]

export const CAVERN_EVENTS: CavernEvent[] = [
  {
    id: 'evt_herb_picking',
    title: '灵草丛生',
    narrative: '你在洞天深处发现了一片长势喜人的灵草园，似乎是前人遗留。四周静悄悄的，但你隐约感觉到灵草深处似乎有东西在蠕动。',
    type: 'choice',
    choices: [
      {
        id: 'careful_pick',
        text: '小心翼翼地采摘灵草，同时警惕四周',
        outcomes: [
          {
            probability: 0.7,
            narrative: '你谨慎地采摘了数十株灵草，小心翼翼地离开了，没有惊动任何东西。',
            spiritStonesChange: 150,
            luckChange: 2
          },
          {
            probability: 0.3,
            narrative: '你刚采了几株，一条花斑灵蛇突然窜出！你仓皇后退，但还是被咬了一口。',
            bodyChange: -10,
            spiritStonesChange: 50
          }
        ]
      },
      {
        id: 'quick_pick',
        text: '快速搜刮，能拿多少拿多少',
        outcomes: [
          {
            probability: 0.4,
            narrative: '你运气不错，以迅雷不及掩耳之势采完了大半灵草，满载而归！',
            spiritStonesChange: 350,
            luckChange: 5
          },
          {
            probability: 0.6,
            narrative: '灵草深处窜出一窝毒蜂！你被蜇得浑身是包，手中灵草也掉了大半。',
            bodyChange: -20,
            mindChange: -5,
            spiritStonesChange: 80
          }
        ]
      },
      {
        id: 'investigate',
        text: '先探查草丛中的异动再做决定',
        requires: { attribute: 'mind', minValue: 30 },
        outcomes: [
          {
            probability: 0.9,
            narrative: '你以神识探查，发现是一条守护药园的灵蛇，你以安抚之法将其引开，从容采集了全部灵草。',
            spiritStonesChange: 400,
            mindChange: 5,
            luckChange: 3
          }
        ]
      }
    ]
  },
  {
    id: 'evt_ancient_ruins',
    title: '远古遗迹',
    narrative: '洞府深处出现了一座若隐若现的远古传送阵，阵旁石碑上刻着："入我门者，机缘与劫难并存，生死由命。"',
    type: 'opportunity',
    minRealm: '炼气期',
    choices: [
      {
        id: 'enter_ruins',
        text: '踏入传送阵，探索遗迹',
        outcomes: [
          {
            probability: 0.3,
            narrative: '你在遗迹深处发现了一枚远古修士的储物戒指，里面竟有一部功法残卷！',
            realmProgressChange: 15,
            fameChange: 10
          },
          {
            probability: 0.4,
            narrative: '遗迹中遇到一些低级禁制，你费了一番功夫破解，获得了一些灵石和丹药。',
            spiritStonesChange: 500,
            mindChange: 5
          },
          {
            probability: 0.3,
            narrative: '你误触了一个强大禁制，被禁制反噬，浑身灵力紊乱，受伤不轻！',
            spiritChange: -20,
            bodyChange: -15,
            realmProgressChange: -5
          }
        ]
      },
      {
        id: 'study_stele',
        text: '先仔细研究石碑上的文字',
        requires: { attribute: 'mind', minValue: 40 },
        outcomes: [
          {
            probability: 0.8,
            narrative: '你从石碑文字中领悟了一套基础的阵法知识，还破解了安全传送的关键。',
            spiritStonesChange: 600,
            mindChange: 10,
            realmProgressChange: 10
          }
        ]
      },
      {
        id: 'leave_ruins',
        text: '危险未知，转身离开',
        outcomes: [
          {
            probability: 1,
            narrative: '你明智地选择了离开，机缘虽好，但命更重要。',
            luckChange: 1
          }
        ]
      }
    ]
  },
  {
    id: 'evt_saving_disciple',
    title: '落难修士',
    narrative: '山道旁，一个身受重伤的年轻修士倒在地上，他气息奄奄，旁边散落着几包药草。你认得他是附近门派的弟子。',
    type: 'choice',
    choices: [
      {
        id: 'save_him',
        text: '耗费自身灵力为他疗伤',
        outcomes: [
          {
            probability: 0.9,
            narrative: '你以灵力替他稳住伤势，他千恩万谢，赠予你他师门的独门丹药作为谢礼，还说日后必有重谢。',
            karmaChange: 15,
            fameChange: 10,
            spiritChange: -10
          },
          {
            probability: 0.1,
            narrative: '你虽然尽力了，但他伤势太重，最终还是没能撑过去。你埋葬了他，心中有些许沉重。',
            karmaChange: 5,
            mindChange: -5
          }
        ]
      },
      {
        id: 'search_body',
        text: '先翻翻他身上有什么好东西',
        outcomes: [
          {
            probability: 0.5,
            narrative: '你在他身上找到了不少灵石和一张隐秘地图。他突然醒来，看到你在翻他东西，眼中充满恨意！',
            spiritStonesChange: 300,
            karmaChange: -20,
            fameChange: -15
          },
          {
            probability: 0.5,
            narrative: '你在他身上找到了一些灵石，但他早已气绝。你良心不安，最后还是把他安葬了。',
            spiritStonesChange: 150,
            karmaChange: -8
          }
        ]
      },
      {
        id: 'report_sect',
        text: '通知他的师门，在原地等他们来人',
        outcomes: [
          {
            probability: 1,
            narrative: '他的师门长辈匆匆赶来，虽然弟子重伤未醒，但他们感激你的正直，赠予你一笔灵石。',
            fameChange: 20,
            karmaChange: 10,
            spiritStonesChange: 200
          }
        ]
      }
    ]
  },
  {
    id: 'evt_enlightenment',
    title: '悟道石前',
    narrative: '一块刻满奇异符文的古石静静矗立，你刚一靠近，便感觉灵台一片清明，似乎与天地产生了某种共鸣。',
    type: 'enlightenment',
    choices: [
      {
        id: 'meditate_long',
        text: '长坐悟道，细细参悟其中玄妙',
        outcomes: [
          {
            probability: 0.6,
            narrative: '你在悟道石前枯坐七日七夜，终于领悟了一丝天地至理！灵力大涨！',
            spiritChange: 20,
            mindChange: 15,
            realmProgressChange: 25
          },
          {
            probability: 0.4,
            narrative: '你苦思冥想数日，虽然未能完全参悟，但对修行也有了新的认识。',
            spiritChange: 8,
            mindChange: 8,
            realmProgressChange: 10
          }
        ]
      },
      {
        id: 'quick_meditate',
        text: '稍作参悟，不可贪多',
        outcomes: [
          {
            probability: 0.95,
            narrative: '你静坐半日，颇有收获，心满意足地离开了。',
            spiritChange: 5,
            mindChange: 5,
            realmProgressChange: 5
          }
        ]
      }
    ]
  },
  {
    id: 'evt_beast_horde',
    title: '兽潮来袭',
    narrative: '洞天中突然传来惊天动地的兽吼，你看到成群的妖兽正向你的方向涌来！为首的是一头三阶妖兽！',
    type: 'combat',
    minRealm: '筑基期',
    choices: [
      {
        id: 'fight_beasts',
        text: '仗剑而出，迎击兽潮',
        outcomes: [
          {
            probability: 0.3,
            narrative: '你奋勇杀敌，激战半日，斩杀妖兽数十头！兽潮溃散，你从妖兽身上收获了大量材料。',
            spiritStonesChange: 800,
            fameChange: 30,
            karmaChange: 5,
            bodyChange: -15
          },
          {
            probability: 0.5,
            narrative: '你斩杀了几头妖兽，但寡不敌众，只得且战且退，受了些伤。',
            spiritStonesChange: 250,
            bodyChange: -20,
            spiritChange: -10
          },
          {
            probability: 0.2,
            narrative: '你低估了兽潮的恐怖！危急关头你拼命突围，虽然保住性命，但伤势极重。',
            bodyChange: -40,
            spiritChange: -30,
            realmProgressChange: -10
          }
        ]
      },
      {
        id: 'set_trap',
        text: '就地布下陷阱，借助地利御敌',
        requires: { attribute: 'mind', minValue: 50 },
        outcomes: [
          {
            probability: 0.85,
            narrative: '你以精妙阵法困住大批妖兽，再逐个击破，事半功倍！',
            spiritStonesChange: 600,
            fameChange: 20,
            mindChange: 5
          }
        ]
      },
      {
        id: 'flee_beasts',
        text: '走为上策，速速撤离',
        outcomes: [
          {
            probability: 0.9,
            narrative: '你施展身法迅速脱离了兽潮范围，虽然有些狼狈，但安然无恙。',
            luckChange: 2
          },
          {
            probability: 0.1,
            narrative: '逃跑途中你被一头落单的妖兽追上，不得不战斗一番才脱身。',
            bodyChange: -10,
            spiritStonesChange: 80
          }
        ]
      }
    ]
  },
  {
    id: 'evt_demon_blood',
    title: '魔血诱惑',
    narrative: '你在一个隐秘洞穴中发现了一个古老的玉匣，打开后是一瓶散发着诡异红光的液体。冥冥中有一个声音告诉你，这是远古魔修留下的魔血，服下可瞬间暴涨修为，但也可能万劫不复。',
    type: 'disaster',
    choices: [
      {
        id: 'drink_blood',
        text: '冒险服下魔血，追求力量',
        outcomes: [
          {
            probability: 0.25,
            narrative: '你竟然奇迹般地炼化了魔血！修为暴涨，但你的心性也受到了魔气的侵蚀。',
            realmProgressChange: 40,
            karmaChange: -30,
            spiritChange: 30,
            bodyChange: 20
          },
          {
            probability: 0.75,
            narrative: '魔血入体，你痛苦地蜷缩在地上，魔气在你经脉中疯狂肆虐！你险些走火入魔！',
            spiritChange: -30,
            bodyChange: -25,
            mindChange: -20,
            realmProgressChange: -15,
            karmaChange: -15
          }
        ]
      },
      {
        id: 'sell_blood',
        text: '封存此物，拿去黑市卖掉',
        outcomes: [
          {
            probability: 1,
            narrative: '你将魔血卖给了黑市商人，获得了一大笔灵石，但心中总觉不安。',
            spiritStonesChange: 1200,
            karmaChange: -10,
            fameChange: -5
          }
        ]
      },
      {
        id: 'destroy_blood',
        text: '此物不祥，就地销毁',
        outcomes: [
          {
            probability: 1,
            narrative: '你以真火将魔血化为灰烬。魔血消散之际，你隐约听到一声怨恨的咆哮，但你的道心反而更加稳固了。',
            karmaChange: 25,
            mindChange: 15,
            fameChange: 5,
            luckChange: 5
          }
        ]
      }
    ]
  }
]

export const DEMON_QUESTIONS: DemonQuestion[] = [
  {
    id: 'demon_power',
    question: '心魔化作你最敬仰之人的模样，对你说："你的道心虽坚，但修行之路艰难，何不借我之力？只需献出心中最重要之物，我便让你一步登天！" 你如何回答？',
    choices: [
      {
        id: 'accept',
        text: '"好！只要能变强，我愿意付出任何代价！"',
        heartStrength: -30,
        karmaEffect: -20,
        outcomeText: '你毫不犹豫地答应了。心魔大笑，你的道心出现了一道不可磨灭的裂痕……'
      },
      {
        id: 'hesitate',
        text: '"让我……再想想。"',
        heartStrength: -10,
        karmaEffect: -5,
        outcomeText: '你犹豫不决，心魔趁机侵入你的神识，虽然你最终清醒过来，但也受了不小的冲击。'
      },
      {
        id: 'refuse',
        text: '"修行之路，当一步一个脚印。我的道，不需要你施舍！"',
        heartStrength: 30,
        karmaEffect: 10,
        outcomeText: '你义正言辞地拒绝，心魔的幻象开始扭曲消散！你的道心更加坚不可摧！'
      },
      {
        id: 'counter',
        text: '"想夺我道心？今日便让你看看，谁才是主宰！"',
        heartStrength: 50,
        karmaEffect: 15,
        outcomeText: '你以道心为剑，反向斩向心魔！心魔惨叫着被你吞噬炼化，你不仅守住了道心，还获得了莫大好处！'
      }
    ]
  },
  {
    id: 'demon_regret',
    question: '心魔变幻场景：你看到自己当年做出的一个选择，那个选择让你悔恨至今。心魔说："只要你愿意，我可以让时光倒流，你可以重新选择一次。代价是——放弃你现在所有的修为。"',
    choices: [
      {
        id: 'go_back',
        text: '"我愿意！那个遗憾，我一辈子都放不下！"',
        heartStrength: -40,
        karmaEffect: -10,
        outcomeText: '你沉浸在过去的幻影中无法自拔，修为大跌，心神俱伤！'
      },
      {
        id: 'doubt',
        text: '"如果……真的能重来吗？"',
        heartStrength: -15,
        karmaEffect: -5,
        outcomeText: '你心生动摇，虽然没有完全堕落，但道心蒙上了一层阴影。'
      },
      {
        id: 'accept_past',
        text: '"过去种种，皆为今我之根基。遗憾也好，悔恨也罢，都是我的一部分。"',
        heartStrength: 35,
        karmaEffect: 10,
        outcomeText: '你坦然接受了过去的一切，心魔制造的幻象不攻自破！你的道心再无破绽！'
      },
      {
        id: 'create_future',
        text: '"与其沉溺过去，不如把握现在。那些遗憾，我会用未来弥补！"',
        heartStrength: 45,
        karmaEffect: 15,
        outcomeText: '你放下过去，放眼未来，心魔的幻境彻底崩塌！你的道心圆融无碍，突破在即！'
      }
    ]
  },
  {
    id: 'demon_bond',
    question: '心魔化作你最珍视之人的幻影，她/他身受重伤倒在你面前，虚弱地说："救我……只要你放弃道心，我就能活下去……" 你的道心和你的羁绊，只能选一个。',
    choices: [
      {
        id: 'save_bond',
        text: '"道心可以再修，但你不能死！"',
        heartStrength: -25,
        karmaEffect: 20,
        outcomeText: '你放弃了道心去救幻影，幻影却在你怀中化作飞灰。你悲痛欲绝，虽然道心受损，但因果之力却在你身周流转不息……'
      },
      {
        id: 'choose_dao',
        text: '"大道无情，我走的就是这条路。对不起。"',
        heartStrength: 20,
        karmaEffect: -25,
        outcomeText: '你选择了道心，幻影消散。你的道心愈发冰冷坚定，但心中那道疤痕，怕是永远消不掉了。'
      },
      {
        id: 'see_through',
        text: '"你不是她/他。真正的羁绊，不需要用牺牲来证明。"',
        heartStrength: 55,
        karmaEffect: 20,
        outcomeText: '你一眼看破心魔的伎俩，既不为情所困，也不为道所执。中道而行，方为大道！心魔被你这份超然彻底击溃！'
      }
    ]
  },
  {
    id: 'demon_justice',
    question: '心魔展现给你一幅画面：那些你憎恨的人，那些欺辱过你的人，此刻正逍遥快活地享受着一切。心魔说："将你的恨意交给我，我会让他们付出代价，千倍万倍地偿还你！"',
    choices: [
      {
        id: 'give_hate',
        text: '"好！我要他们死！我要他们永世不得超生！"',
        heartStrength: -50,
        karmaEffect: -40,
        outcomeText: '你将恨意交给心魔，你以为你在复仇，其实你已经变成了自己最憎恨的样子……道心沦丧，坠入魔道！'
      },
      {
        id: 'hold_hate',
        text: '"我的仇，我自己会报。不需要你的假手。"',
        heartStrength: 0,
        karmaEffect: -10,
        outcomeText: '你拒绝了心魔，但恨意仍在你心中燃烧。道心虽未破，但已有隙。'
      },
      {
        id: 'let_go',
        text: '"冤冤相报何时了。他们欠我的，岁月自会清算。"',
        heartStrength: 40,
        karmaEffect: 25,
        outcomeText: '你放下了心中的恨意，心魔顿时失去了力量源泉，哀嚎着消散！这一刻，你真正领悟了放下的力量！'
      },
      {
        id: 'transcend',
        text: '"今日之我，已非昨日之我。他们若还执迷不悟，终有一天会为自己的行为付出代价。"',
        heartStrength: 50,
        karmaEffect: 30,
        outcomeText: '你超越了过去的自己，也超越了心中的恨意。心魔在你面前卑微地匍匐，最终烟消云散。你的境界，已然不同！'
      }
    ]
  },
  {
    id: 'demon_meaning',
    question: '心魔最后化作你自己的样子，与你四目相对："你修行至今，究竟是为了什么？长生？力量？还是……你自己也不知道？"',
    choices: [
      {
        id: 'answer_power',
        text: '"为了力量。足够强的力量，可以解决一切问题。"',
        heartStrength: 15,
        karmaEffect: -5,
        outcomeText: '你坦诚了自己的欲望。心魔沉默片刻，点头道："至少你没有骗自己。" 身影逐渐变淡。'
      },
      {
        id: 'answer_longevity',
        text: '"为了长生。我想看看，天地的尽头是什么样子。"',
        heartStrength: 20,
        karmaEffect: 0,
        outcomeText: '你说出了最本真的愿望。心魔微微一笑："世人皆惧死，你倒是坦率。" 化作漫天光点消散。'
      },
      {
        id: 'answer_protect',
        text: '"为了守护。守护我珍视的人，守护这片天地。"',
        heartStrength: 35,
        karmaEffect: 15,
        outcomeText: '你说出这句话时，周身散发着淡淡的金光。心魔叹了口气："你这样的人，我怕是永远无法动摇。" 彻底消散。'
      },
      {
        id: 'answer_question',
        text: '"或许现在还不知道。但我会用一生去寻找这个答案。"',
        heartStrength: 60,
        karmaEffect: 20,
        outcomeText: '你的回答让心魔怔了许久，最后他大笑三声："好！好一个用一生去寻找！你的道，比我想象的要宽得多！" 心魔化为一道精纯的意念，融入了你的元神！'
      }
    ]
  }
]

export const TOWN_QUESTS: Quest[] = [
  {
    id: 'quest_find_cat',
    title: '寻找失踪的灵猫',
    description: '杂货铺老板娘哭哭啼啼地请求你帮忙：她的灵猫"雪儿"已经失踪三天了，最后有人看到它向镇外的树林方向跑去。',
    difficulty: 1,
    reward: { spiritStones: 100, fame: 5, karma: 10 },
    completed: false,
    type: 'commission',
    choices: [
      {
        id: 'careful_search',
        text: '仔细搜索林中每一处角落',
        karmaChange: 5,
        fameChange: 2,
        successRate: 0.85,
        specialOutcome: '你在一处山洞中找到了灵猫，它被困在陷阱里。你救出了它，还顺便帮它治好了伤。'
      },
      {
        id: 'quick_search',
        text: '快速扫荡一遍，找不到就算了',
        karmaChange: 0,
        fameChange: 0,
        successRate: 0.4,
        specialOutcome: '你找了一会儿就不耐烦了，正准备离开时，碰巧看到了灵猫的身影。'
      },
      {
        id: 'bait_lure',
        text: '买些灵鱼干当诱饵，引它出来',
        karmaChange: 2,
        fameChange: 0,
        successRate: 0.7,
        specialOutcome: '你用灵鱼干引来了灵猫，但它身后还跟着一大群野猫……场面一度十分混乱。'
      }
    ]
  },
  {
    id: 'quest_escort_merchant',
    title: '护送商队',
    description: '一支商队要前往邻镇，听说途中山贼出没，需要一位修士护送。酬劳丰厚，但可能有风险。',
    difficulty: 2,
    reward: { spiritStones: 400, fame: 15 },
    completed: false,
    type: 'combat',
    choices: [
      {
        id: 'fight_bandits',
        text: '正面迎击山贼',
        karmaChange: 5,
        fameChange: 10,
        successRate: 0.6,
        specialOutcome: '山贼果然出现了，你大展神威击退了他们！商队安全抵达，领队对你赞不绝口！'
      },
      {
        id: 'detour_route',
        text: '建议商队走偏僻小道绕过去',
        karmaChange: 3,
        fameChange: 5,
        successRate: 0.75,
        specialOutcome: '虽然绕了远路，但你们成功避开了山贼。只是路上遇到了一些妖兽，花了些力气打发。'
      },
      {
        id: 'bribe_bandits',
        text: '沿途给山贼一些"过路费"',
        karmaChange: -3,
        fameChange: -5,
        successRate: 0.9,
        specialOutcome: '你花钱消灾，虽然顺利通过，但商队里有人看不起你的做法，在背后议论纷纷。'
      }
    ]
  },
  {
    id: 'quest_medicine',
    title: '收集灵药',
    description: '镇上的大夫说，近期有许多村民染上风寒，需要几味特定的灵药才能配药。但这几味药只在危险的山崖上生长。',
    difficulty: 2,
    reward: { karma: 30, fame: 20 },
    completed: false,
    type: 'commission',
    choices: [
      {
        id: 'climb_careful',
        text: '小心翼翼地攀爬山崖采药',
        karmaChange: 10,
        fameChange: 5,
        successRate: 0.7,
        specialOutcome: '你一步一步攀上陡峭的山崖，终于采齐了所有灵药！虽然过程惊险，但收获满满。'
      },
      {
        id: 'fly_up',
        text: '用御剑术飞上去（需学会御剑术）',
        karmaChange: 10,
        fameChange: 10,
        successRate: 0.95,
        specialOutcome: '你御剑而起，引来无数村民惊叹。不仅轻松采到了灵药，还在村民面前大大露脸！'
      },
      {
        id: 'hire_help',
        text: '雇几个身手好的猎户和你一起去',
        karmaChange: 5,
        fameChange: 0,
        successRate: 0.8,
        specialOutcome: '猎户们熟悉地形，帮了大忙。你分给他们一些灵石作为报酬，皆大欢喜。'
      }
    ]
  },
  {
    id: 'quest_duel',
    title: '决斗挑战',
    description: '另一位修士公开向你发出挑战，称要与你"切磋武艺"。你听说这个人喜欢用卑鄙手段取胜，但如果拒绝又会被人嘲笑胆小。',
    difficulty: 3,
    reward: { fame: 30 },
    completed: false,
    type: 'combat',
    choices: [
      {
        id: 'accept_duel',
        text: '光明正大接受挑战',
        karmaChange: 5,
        fameChange: 15,
        successRate: 0.5,
        specialOutcome: '你堂堂正正地赢了！围观群众欢呼雀跃，对方虽然不服，但也无可奈何。'
      },
      {
        id: 'counter_trap',
        text: '提前防备他的阴招',
        karmaChange: 0,
        fameChange: 10,
        successRate: 0.8,
        specialOutcome: '你识破了他暗藏的毒针和陷阱，将计就计反将一军！虽然对方控诉你"胜之不武"，但明白人都知道是谁先搞鬼。'
      },
      {
        id: 'refuse_public',
        text: '公开拒绝，并嘲讽他的为人',
        karmaChange: 0,
        fameChange: -10,
        successRate: 1,
        specialOutcome: '你拒绝了决斗，还当众揭露了他的斑斑劣迹。虽然有人说你胆小，但也有不少人支持你。'
      }
    ]
  },
  {
    id: 'quest_secret',
    title: '神秘委托',
    description: '一个戴着斗篷的神秘人暗中找你，要你帮他从某个"不方便透露"的地方拿回一个小盒子，报酬极其丰厚。他没有说明盒子里装的是什么。',
    difficulty: 3,
    reward: { spiritStones: 1000 },
    completed: false,
    type: 'secret',
    choices: [
      {
        id: 'accept_blind',
        text: '不问原因，拿钱办事',
        karmaChange: -10,
        fameChange: 0,
        successRate: 0.7,
        specialOutcome: '你顺利完成了委托，但总觉得那个盒子里的东西散发出阵阵邪气……你告诉自己不要多管闲事。'
      },
      {
        id: 'peek_box',
        text: '取到盒子后先偷偷看看是什么',
        karmaChange: -5,
        fameChange: 0,
        successRate: 0.5,
        specialOutcome: '你发现盒子里是一件魔道法器！你面临选择：照约定交货？还是举报？还是……据为己有？'
      },
      {
        id: 'refuse_shady',
        text: '来路不明的委托，拒绝',
        karmaChange: 10,
        fameChange: 0,
        successRate: 1,
        specialOutcome: '你拒绝了这个委托。神秘人冷哼一声消失在黑暗中。几天后，你听说有修士因为"来历不明的魔道物品"被正道修士追杀……'
      }
    ]
  }
]

export const ENDINGS: Ending[] = [
  {
    id: 'end_immortal',
    title: '飞升成仙',
    subtitle: '神话结局',
    description: '你历经无数劫难，终于勘破生死玄关，白日飞升！',
    narrative: '那一日，天地变色，九色祥云笼罩九天。你立于云巅之上，回首望向你走过的修仙之路——有欢笑，有泪水，有遗憾，也有圆满。你淡然一笑，转身踏入了那道通往仙界的金光之门。从此，凡间只留下你的传说。',
    conditions: { minRealm: '大乘期', minFame: 100 },
    rarity: '神话'
  },
  {
    id: 'end_grandmaster',
    title: '一代宗师',
    subtitle: '传说结局',
    description: '你修为深不可测，开宗立派，名垂青史。',
    narrative: '你在修真界建立了自己的宗门，广收门徒，传下道统。你的一生波澜壮阔，弟子万千。寿元将尽之时，你将掌门之位传于最得意的弟子，含笑坐化。数千年后，人们仍在传颂你的名字——那是一个时代的象征。',
    conditions: { minRealm: '化神期', minFame: 80, minBondSum: 50 },
    rarity: '传说'
  },
  {
    id: 'end_savior',
    title: '苍生救星',
    subtitle: '传说结局',
    description: '你心怀苍生，在浩劫中拯救了无数生灵。',
    narrative: '千年一度的灭世大劫降临，魔物倾巢而出。在所有人都绝望的时候，你站了出来。你以一己之力对抗劫波，耗尽毕生修为将魔潮封印。你倒下的那一刻，万民跪拜。你的肉身虽灭，但你的精神，永远活在人们心中。',
    conditions: { minRealm: '元婴期', minKarma: 80, minFame: 60 },
    rarity: '传说'
  },
  {
    id: 'end_hermit',
    title: '世外高人',
    subtitle: '稀有结局',
    description: '你看破红尘，隐居深山，逍遥自在。',
    narrative: '你厌倦了修真界的尔虞我诈，带着最珍视的人隐居到了没人能找到的深山之中。每日读书、品茶、论道，日子过得逍遥似神仙。偶有上山寻仙的人，会隐约看到山巅有两位仙风道骨之人对弈，但想靠近时，却什么也找不到。',
    conditions: { minRealm: '金丹期', minBondSum: 80, maxKarma: 50 },
    rarity: '稀有'
  },
  {
    id: 'end_ruler',
    title: '天下霸主',
    subtitle: '稀有结局',
    description: '你以雷霆手段统一修真界，成为至高无上的统治者。',
    narrative: '你用铁血手腕扫平了所有反对势力，建立了一个以你为尊的修真帝国。有人说你是暴君，有人说你是明主。但无论如何，在你的治下，修真界迎来了前所未有的秩序与和平。你坐在至高的宝座上，俯瞰着你的帝国，心中却在想：接下来，还有什么能让我感兴趣呢？',
    conditions: { minRealm: '元婴期', minFame: 70, daoxin: ['ambitious', 'vengeful'] },
    rarity: '稀有'
  },
  {
    id: 'end_demon_lord',
    title: '魔道至尊',
    subtitle: '稀有结局',
    description: '你坠入魔道，成为令人闻风丧胆的魔尊。',
    narrative: '正魔两道本就一念之间。你选择了那条最为人不齿的路，却也走得最是坚定。你踏着尸骨登上魔尊之位，手中沾染了无数鲜血。可在你最孤独的夜里，偶尔也会想起：如果当初选择了另一条路，现在会是什么样子？',
    conditions: { minRealm: '元婴期', maxKarma: -50 },
    rarity: '稀有'
  },
  {
    id: 'end_scholar',
    title: '百世大儒',
    subtitle: '稀有结局',
    description: '你将修仙之理融入儒家之道，开创一代学风。',
    narrative: '你发现修仙并非只有法术与长生，更重要的是明理与传道。你著书立说，将毕生所悟化为文字，惠及了无数后人。你的学说传遍天下，甚至影响了凡间王朝的治国方略。百年之后，你的牌位被请入孔庙，与古圣先贤并列。',
    conditions: { minRealm: '筑基期', minKarma: 40, daoxin: ['benevolent', 'cautious'] },
    rarity: '稀有'
  },
  {
    id: 'end_wealthy',
    title: '富甲天下',
    subtitle: '普通结局',
    description: '虽然修为平平，但你富可敌国，享尽人间繁华。',
    narrative: '你发现自己在修炼上确实没什么天赋，但在赚钱方面却无人能及。你建立了一个庞大的商业帝国，灵石多得数不清。虽然没能成仙，但你过上了锦衣玉食的生活，身边有知己相伴，此生也不算枉过。',
    conditions: { minFame: 30 },
    rarity: '普通'
  },
  {
    id: 'end_mediocre',
    title: '碌碌终生',
    subtitle: '普通结局',
    description: '你在修真界浑浑噩噩地度过了一生，没什么大成就，也没什么大过错。',
    narrative: '你本以为自己会是那个天选之子，但现实给了你一记响亮的耳光。资质平庸、机缘寥寥，你就在炼气和筑基之间反复蹉跎，直到寿元耗尽。临死前你才明白：不是每个人都能成为故事的主角，平凡，也许才是大多数人的宿命。',
    conditions: { minRealm: '炼气期' },
    rarity: '普通'
  },
  {
    id: 'end_tragic',
    title: '悲惨收场',
    subtitle: '普通结局',
    description: '你的修仙之路走到了尽头，下场凄凉。',
    narrative: '你曾有过机会，也曾有过希望，但一次错误的选择，就让一切化为泡影。走火入魔？被人暗算？还是渡劫失败？结局已经不重要了。你在冰冷的洞府中闭上双眼，无人知晓，无人哀悼。',
    conditions: { maxKarma: -20 },
    rarity: '普通'
  },
  {
    id: 'end_lover',
    title: '神仙眷侣',
    subtitle: '传说结局',
    description: '你与挚爱携手共修，双双得道。',
    narrative: '修仙路上最幸运的事，莫过于找到一个能与你携手同行的人。你们一起笑过、哭过、一起面对过生死考验。在你们双双飞升的那天，有人看到两道金色的身影手牵着手，消失在云端。这，或许就是爱情最美好的样子。',
    conditions: { minRealm: '化神期', minBondSum: 120 },
    rarity: '传说'
  },
  {
    id: 'end_eternal',
    title: '大道无情',
    subtitle: '神话结局',
    description: '你斩断七情六欲，与天地同寿，与日月同辉。',
    narrative: '你放弃了一切——爱情、友情、亲情、甚至是善恶。你成为了"道"本身的一部分，没有喜怒哀乐，没有爱恨情仇。你存在于每一粒尘埃中，也存在于浩渺的星河间。永恒，是对你最好的诠释。只是，在那无尽的岁月深处，似乎还残留着一丝……你早已忘记的温暖。',
    conditions: { minRealm: '大乘期', daoxin: ['detached'] },
    rarity: '神话'
  }
]
