import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ORIGIN_INFO, DAOXIN_INFO } from '@/types/game'
import type { Origin, Daoxin } from '@/types/game'

export default function CreationScreen() {
  const createCharacter = useGameStore(s => s.createCharacter)
  const resetGame = useGameStore(s => s.resetGame)

  const [step, setStep] = useState<'name' | 'origin' | 'daoxin'>('name')
  const [name, setName] = useState('')
  const [origin, setOrigin] = useState<Origin | null>(null)
  const [daoxin, setDaoxin] = useState<Daoxin | null>(null)

  const canProceed = () => {
    if (step === 'name') return name.trim().length > 0
    if (step === 'origin') return origin !== null
    if (step === 'daoxin') return daoxin !== null
    return false
  }

  const handleCreate = () => {
    if (name.trim() && origin && daoxin) {
      createCharacter(name.trim(), origin, daoxin)
    }
  }

  const renderNameStep = () => (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="card card-gold">
        <h2 className="section-title text-2xl">🪶 道号自名</h2>
        <p className="text-secondary mb-6">
          姓者，统其祖考之所自出；氏者，别其子孙之所自分。名字是你在这修行界的第一个印记，
          请慎重取名，踏上你的仙途。
        </p>
        <div className="mt-6">
          <label className="block text-sm text-secondary mb-2">请输入你的姓名 / 道号</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={12}
            placeholder="如：李逍遥、青云子、剑痴..."
            className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-lg text-[var(--text-primary)] focus:border-[var(--border-gold)]"
          />
          <p className="text-xs text-secondary mt-2">限 12 字以内</p>
        </div>
        <div className="mt-8 flex gap-3">
          <button className="btn" onClick={resetGame}>返回</button>
          <button
            className="btn btn-primary flex-1"
            disabled={!canProceed()}
            onClick={() => setStep('origin')}
          >
            下一步：选择出身 →
          </button>
        </div>
      </div>
    </div>
  )

  const renderOriginStep = () => (
    <div className="fade-in max-w-5xl mx-auto">
      <div className="card card-gold">
        <h2 className="section-title text-2xl">🏛️ 身世来历</h2>
        <p className="text-secondary mb-6">
          每一段传奇都有起点。你的出身决定了你的天赋倾向、初始资源与人脉。
          选择最契合你内心的故事开端吧。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(ORIGIN_INFO) as Origin[]).map(key => {
            const info = ORIGIN_INFO[key]
            const selected = origin === key
            return (
              <div
                key={key}
                onClick={() => setOrigin(key)}
                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  selected
                    ? 'border-[var(--border-gold)] bg-[rgba(212,175,55,0.1)] shadow-[var(--shadow-gold)]'
                    : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--border-light)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gold">{info.name}</h3>
                  {selected && <span className="text-gold text-xl">✓</span>}
                </div>
                <p className="text-sm text-secondary mb-3">{info.description}</p>
                <div className="space-y-1 text-xs">
                  {info.bonuses.fame && <div className="text-info">初始名望 +{info.bonuses.fame}</div>}
                  {info.bonuses.spiritStones && <div className="text-gold">初始灵石 +{info.bonuses.spiritStones}</div>}
                  {info.bonuses.luck && <div className="text-good">初始气运 +{info.bonuses.luck}</div>}
                  {info.bonuses.spirit && <div>初始灵力 {info.bonuses.spirit.value}</div>}
                  {info.bonuses.body && <div>初始体魄 {info.bonuses.body.value}</div>}
                  {info.bonuses.mind && <div>初始神识 {info.bonuses.mind.value}</div>}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-8 flex gap-3">
          <button className="btn" onClick={() => setStep('name')}>← 返回</button>
          <button
            className="btn btn-primary flex-1"
            disabled={!canProceed()}
            onClick={() => setStep('daoxin')}
          >
            下一步：立下道心 →
          </button>
        </div>
      </div>
    </div>
  )

  const renderDaoxinStep = () => (
    <div className="fade-in max-w-5xl mx-auto">
      <div className="card card-gold">
        <h2 className="section-title text-2xl">💎 道心明誓</h2>
        <p className="text-secondary mb-6">
          道心者，修行之基也。万丈高楼从地起，道心不坚则道基不稳。
          你是为何而踏上这条逆天改命之路？请立下你的道心誓言——
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(DAOXIN_INFO) as Daoxin[]).map(key => {
            const info = DAOXIN_INFO[key]
            const selected = daoxin === key
            return (
              <div
                key={key}
                onClick={() => setDaoxin(key)}
                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  selected
                    ? 'border-[var(--accent-purple)] bg-[rgba(139,92,246,0.1)] shadow-[var(--shadow-glow)]'
                    : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[rgba(139,92,246,0.5)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--accent-purple)' }}>{info.name}</h3>
                  {selected && <span style={{ color: 'var(--accent-purple)' }} className="text-xl">✓</span>}
                </div>
                <p className="text-sm text-secondary mb-3">{info.description}</p>
                <div className="p-2 rounded bg-[rgba(0,0,0,0.2)] text-xs">
                  <span className="text-info">效果：</span>
                  <span className="text-secondary">{info.effects}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-8 p-4 rounded-xl bg-[rgba(20,20,50,0.6)] border border-[var(--border-light)]">
          <div className="text-sm text-secondary mb-1">你即将启程的仙途：</div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-gold font-bold">姓名：{name}</span>
            <span className="text-gold font-bold">出身：{origin ? ORIGIN_INFO[origin].name : '—'}</span>
            <span className="font-bold" style={{ color: 'var(--accent-purple)' }}>
              道心：{daoxin ? DAOXIN_INFO[daoxin].name : '—'}
            </span>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="btn" onClick={() => setStep('origin')}>← 返回</button>
          <button
            className="btn btn-gold flex-1 text-lg py-3"
            disabled={!canProceed()}
            onClick={handleCreate}
          >
            ⚔️ 踏上仙途 ⚔️
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {step === 'name' && renderNameStep()}
      {step === 'origin' && renderOriginStep()}
      {step === 'daoxin' && renderDaoxinStep()}
    </div>
  )
}
