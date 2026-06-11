import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { RiskLevel, DemonChoice } from '@/types/game'
import { REALM_ORDER } from '@/types/game'

export default function ScheduleScreen() {
  const character = useGameStore(s => s.character)
  const currentDay = useGameStore(s => s.currentDay)
  const breakthroughReady = useGameStore(s => s.breakthroughReady)
  const pendingDemonTrial = useGameStore(s => s.pendingDemonTrial)
  const pendingDemonFromSchedule = useGameStore(s => s.pendingDemonFromSchedule)
  const triggerDemonTrial = useGameStore(s => s.triggerDemonTrial)
  const resolveDemonChoiceInSchedule = useGameStore(s => s.resolveDemonChoiceInSchedule)
  const attemptBreakthrough = useGameStore(s => s.attemptBreakthrough)
  const doMeditation = useGameStore(s => s.doMeditation)
  const doBodyTraining = useGameStore(s => s.doBodyTraining)
  const doTravel = useGameStore(s => s.doTravel)
  const cultivateSkill = useGameStore(s => s.cultivateSkill)

  const [loading, setLoading] = useState<string | null>(null)
  const [showBreakthrough, setShowBreakthrough] = useState(false)
  const [showDemon, setShowDemon] = useState(false)
  const [demonOutcome, setDemonOutcome] = useState<{ text: string; choice: DemonChoice } | null>(null)

  if (!character) return null

  const withLoading = async (key: string, fn: () => Promise<void> | void) => {
    setLoading(key)
    await fn()
    setLoading(null)
  }

  const handleBreakthrough = (risk: RiskLevel) => {
    attemptBreakthrough(risk)
    setShowBreakthrough(false)
  }

  const handleDemonTrial = async () => {
    setShowDemon(false)
    setDemonOutcome(null)
    await withLoading('demon', () => triggerDemonTrial(true))
  }

  const handleDemonChoice = (choice: DemonChoice) => {
    setDemonOutcome({ text: choice.outcomeText, choice })
    setTimeout(() => {
      resolveDemonChoiceInSchedule(choice)
      setDemonOutcome(null)
    }, 2000)
  }

  const nextRealm = REALM_ORDER[REALM_ORDER.indexOf(character.realm) + 1] || '巅峰'
  const isDemonDay = currentDay % 10 === 0

  const DailyAction = ({
    icon, title, subtitle, desc, actionKey, color, onClick
  }: {
    icon: string; title: string; subtitle: string; desc: string;
    actionKey: string; color: string; onClick: () => Promise<void> | void
  }) => (
    <button
      onClick={() => withLoading(actionKey, onClick)}
      disabled={loading !== null}
      className={`text-left p-6 rounded-xl border-2 transition-all hover:-translate-y-1 ${
        loading === actionKey
          ? 'opacity-60 border-[var(--border-gold)] shadow-[var(--shadow-gold)]'
          : `border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-${color}-500 hover:shadow-lg`
      }`}
      style={{
        boxShadow: loading === actionKey ? 'var(--shadow-gold)' : undefined
      }}
    >
      <div className="flex items-start gap-4">
        <div className="text-5xl flex-shrink-0">{loading === actionKey ? '⏳' : icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gold mb-1">{title}</h3>
          <p className="text-sm text-info mb-2">{subtitle}</p>
          <p className="text-sm text-secondary leading-relaxed">{desc}</p>
        </div>
      </div>
    </button>
  )

  return (
    <div className="fade-in max-w-5xl mx-auto">
      <div className="card card-gold mb-6">
        <h2 className="section-title">☀️ 今日修行 · 仙历第 {currentDay} 日</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px] p-4 rounded-lg bg-[rgba(20,20,50,0.6)]">
            <p className="text-secondary text-sm mb-2">当前状态</p>
            <p className="text-lg leading-relaxed">
              你是 <span className="text-gold font-bold">{character.name}</span>，
              现为 <span className="font-bold">{character.realm}</span> 修士，
              年方 <span className="text-info">{character.age}</span> 岁。
              {character.realmProgress >= 100 ? (
                <span className="ml-2 text-good font-bold animate-pulse">
                  瓶颈已至，可尝试突破！
                </span>
              ) : (
                <>距离下一境界还需 <span className="text-gold">{100 - character.realmProgress}</span> 点修为。</>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {breakthroughReady && (
              <button
                className="btn btn-gold"
                onClick={() => setShowBreakthrough(true)}
                style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
              >
                ⚡ 尝试突破境界
              </button>
            )}
            {isDemonDay && (
              <button
                className="btn btn-primary"
                onClick={() => setShowDemon(true)}
              >
                👁️ 今日心魔劫
              </button>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gold mb-4 px-2">选择今日的修行方式</h3>

      <div className="grid gap-4 mb-6">
        <DailyAction
          icon="🧘"
          title="打坐炼气"
          subtitle="吐纳天地灵气，增长灵力神识"
          desc="盘膝而坐，五心朝天，引天地灵气入体，循周天经脉运行。可稳步提升灵力与神识，是最基础也最稳妥的修行方式。"
          actionKey="meditation"
          color="purple"
          onClick={doMeditation}
        />
        <DailyAction
          icon="💪"
          title="炼体强身"
          subtitle="磨练肉身筋骨，外练皮骨内练气"
          desc="扎马步、举石锁、淬体炼丹。以苦行之法锤炼肉身，虽会消耗些许灵力，却能为未来的修行打下坚实根基。"
          actionKey="body"
          color="green"
          onClick={doBodyTraining}
        />
        <DailyAction
          icon="🚶"
          title="出门游历"
          subtitle="行万里路，增广见闻"
          desc="不登高山，不知天之高也；不临深溪，不知地之厚也。离开洞府，游历名山大川，或许会有意想不到的收获……"
          actionKey="travel"
          color="blue"
          onClick={doTravel}
        />
      </div>

      <div className="card">
        <h3 className="section-title">📖 参悟功法（日常修炼提升技能等级）</h3>
        {character.skills.length === 0 ? (
          <p className="text-secondary text-center py-6">暂无功法可修炼</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {character.skills.map(skill => (
              <div
                key={skill.id}
                className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{skill.name}</span>
                    <span className={`tag tag-${skill.type}`}>
                      {skill.type === 'attack' ? '攻击' : skill.type === 'defense' ? '防御' : skill.type === 'support' ? '辅助' : '修炼'}
                    </span>
                    <span className="text-xs text-gold">Lv.{skill.level}/{skill.maxLevel}</span>
                  </div>
                  <p className="text-xs text-secondary mb-1">{skill.description}</p>
                  <div className="flex gap-1 flex-wrap">
                    {skill.tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[rgba(60,60,120,0.4)] text-secondary">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  className="btn btn-primary ml-4 text-sm py-2"
                  onClick={() => cultivateSkill(skill.id)}
                  disabled={skill.level >= skill.maxLevel || loading !== null}
                >
                  {skill.level >= skill.maxLevel ? '已满级' : '修炼 ↑'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBreakthrough && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card card-gold max-w-2xl w-full fade-in">
            <h2 className="section-title text-2xl text-center">⚡ 突破 {character.realm} → {nextRealm}</h2>
            <p className="text-secondary mb-6 text-center">
              瓶颈当前，成败在此一举。请选择你的突破策略——
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => handleBreakthrough('safe')}
                className="p-6 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--accent-green)] hover:shadow-lg transition-all text-left"
              >
                <div className="text-4xl mb-2">🐢</div>
                <h3 className="font-bold text-lg text-good mb-1">稳中求胜</h3>
                <p className="text-xs text-secondary mb-2">成功率：高（约75%）</p>
                <p className="text-sm text-secondary">厚积薄发，水到渠成。<br/>成功后进度 +10，失败 -20。</p>
              </button>
              <button
                onClick={() => handleBreakthrough('balanced')}
                className="p-6 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--accent-blue)] hover:shadow-lg transition-all text-left"
              >
                <div className="text-4xl mb-2">⚖️</div>
                <h3 className="font-bold text-lg text-info mb-1">平衡之道</h3>
                <p className="text-xs text-secondary mb-2">成功率：中（约50%）</p>
                <p className="text-sm text-secondary">阴阳相济，风险与收益并存。<br/>成功后进度 +20，失败 -40。</p>
              </button>
              <button
                onClick={() => handleBreakthrough('reckless')}
                className="p-6 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--accent-red)] hover:shadow-lg transition-all text-left"
              >
                <div className="text-4xl mb-2">🔥</div>
                <h3 className="font-bold text-lg text-bad mb-1">破釜沉舟</h3>
                <p className="text-xs text-secondary mb-2">成功率：低（约25%）</p>
                <p className="text-sm text-secondary">不成功便成仁，富贵险中求。<br/>成功后进度 +50，失败 -60。</p>
              </button>
            </div>
            <p className="text-xs text-secondary text-center mb-4">
              💡 你的气运 {character.luck} 与神识 {character.mind.value}/{character.mind.max} 会额外影响成功率
            </p>
            <button className="btn w-full" onClick={() => setShowBreakthrough(false)}>
              暂时放弃，继续积累
            </button>
          </div>
        </div>
      )}

      {showDemon && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-xl w-full fade-in" style={{ borderColor: 'var(--accent-purple)', boxShadow: 'var(--shadow-glow)' }}>
            <h2 className="section-title text-2xl text-center" style={{ color: 'var(--accent-purple)' }}>
              👁️ 心魔将至
            </h2>
            <div className="p-6 rounded-lg bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.3)] mb-6">
              <p className="text-lg leading-relaxed text-center">
                仙历第 <span className="text-gold font-bold">{currentDay}</span> 日，
                你如往常一样入定修行。<br/>
                忽然——识海中波涛翻涌，一股阴森诡异的气息悄然蔓延。
              </p>
              <p className="mt-4 text-secondary text-center">
                心魔，来了。
              </p>
              <p className="mt-4 text-info text-sm text-center">
                💡 通过心魔试炼可获得大量修为进度与神识提升，但失败也会付出惨痛代价。
              </p>
            </div>
            <div className="flex gap-3">
              <button className="btn flex-1" onClick={() => setShowDemon(false)}>
                今日暂且回避
              </button>
              <button className="btn btn-primary flex-1" onClick={handleDemonTrial}>
                直面本心，迎接试炼
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDemonTrial && pendingDemonFromSchedule && !demonOutcome && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full fade-in" style={{ borderColor: 'var(--accent-purple)', boxShadow: '0 0 60px rgba(139,92,246,0.5)' }}>
            <h2 className="section-title text-2xl text-center mb-6" style={{ color: 'var(--accent-purple)' }}>
              👁️ 心魔试炼 · 直面本心
            </h2>
            <div className="p-6 rounded-lg bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.4)] mb-6">
              <p className="text-xl leading-relaxed text-center font-medium">
                {pendingDemonTrial.question}
              </p>
            </div>
            <div className="space-y-3">
              {pendingDemonTrial.choices.map((choice, idx) => (
                <button
                  key={choice.id}
                  onClick={() => handleDemonChoice(choice)}
                  className="w-full text-left p-5 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)] hover:border-[var(--accent-purple)] hover:bg-[rgba(139,92,246,0.15)] transition-all text-lg"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <span className="text-gold font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {choice.text}
                </button>
              ))}
            </div>
            <p className="text-xs text-secondary text-center mt-4">
              选择一个答案，直面你内心最真实的想法……
            </p>
          </div>
        </div>
      )}

      {demonOutcome && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-xl w-full fade-in" style={{ borderColor: 'var(--accent-gold)', boxShadow: 'var(--shadow-gold)' }}>
            <h2 className="section-title text-2xl text-center mb-6 text-gold">
              ✨ 试炼结果
            </h2>
            <div className="p-6 rounded-lg bg-[rgba(255,215,0,0.08)] border border-[rgba(255,215,0,0.3)] mb-6">
              <p className="text-lg leading-relaxed text-center">
                {demonOutcome.text}
              </p>
            </div>
            <div className="text-center text-secondary">
              <p className="mb-2">
                心之力 <span className={demonOutcome.choice.heartStrength >= 0 ? 'text-good' : 'text-bad'}>
                  {demonOutcome.choice.heartStrength >= 0 ? '+' : ''}{demonOutcome.choice.heartStrength}
                </span>
              </p>
              <p>
                因果 <span className={demonOutcome.choice.karmaEffect >= 0 ? 'text-good' : 'text-bad'}>
                  {demonOutcome.choice.karmaEffect >= 0 ? '+' : ''}{demonOutcome.choice.karmaEffect}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
