import { useGameStore } from '@/store/gameStore'
import { ORIGIN_INFO, DAOXIN_INFO } from '@/types/game'

export default function StatusBar() {
  const character = useGameStore(s => s.character)
  const currentDay = useGameStore(s => s.currentDay)
  const maxDays = useGameStore(s => s.maxDays)
  const breakthroughReady = useGameStore(s => s.breakthroughReady)

  if (!character) return null

  const originInfo = ORIGIN_INFO[character.origin]
  const daoxinInfo = DAOXIN_INFO[character.daoxin]
  const dayProgress = Math.min((currentDay / maxDays) * 100, 100)

  const karmaColor = character.karma > 20 ? 'text-good' : character.karma < -20 ? 'text-bad' : 'text-secondary'
  const karmaLabel = character.karma > 50 ? '大善之人' : character.karma > 20 ? '善心人士'
    : character.karma > -20 ? '中性之人' : character.karma > -50 ? '有污点者' : '大奸大恶'

  const AttributeBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
    <div className="flex-1 min-w-[120px]">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-secondary">{label}</span>
        <span className="font-bold">{value}/{max}</span>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill progress-${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  )

  return (
    <div className="bg-[rgba(10,10,30,0.95)] backdrop-blur-md border-b border-[var(--border-primary)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 pr-4 border-r border-[var(--border-primary)]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center text-2xl">
            🧘
          </div>
          <div>
            <div className="font-bold text-gold text-lg">{character.name}</div>
            <div className="text-xs text-secondary">
              {originInfo.name} · {daoxinInfo.name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 border-r border-[var(--border-primary)]">
          <div className="text-center">
            <div className="text-xs text-secondary">境界</div>
            <div className={`font-bold ${breakthroughReady ? 'text-gold animate-pulse' : ''}`}>
              {character.realm}
              {breakthroughReady && <span className="ml-1 text-xs">✨可突破</span>}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-[200px] px-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-secondary">修为进度</span>
            <span className="font-bold">{character.realmProgress}/100</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill progress-gold" style={{ width: `${Math.min(character.realmProgress, 100)}%` }} />
          </div>
        </div>

        <div className="flex gap-3 flex-1 min-w-[360px]">
          <AttributeBar label={character.spirit.name} value={character.spirit.value} max={character.spirit.max} color="purple" />
          <AttributeBar label={character.body.name} value={character.body.value} max={character.body.max} color="green" />
          <AttributeBar label={character.mind.name} value={character.mind.value} max={character.mind.max} color="blue" />
        </div>

        <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-primary)] text-sm">
          <div className="text-center min-w-[60px]">
            <div className="text-xs text-secondary">灵石</div>
            <div className="font-bold text-gold">💎{character.spiritStones}</div>
          </div>
          <div className="text-center min-w-[60px]">
            <div className="text-xs text-secondary">名望</div>
            <div className="font-bold text-info">🏆{character.fame}</div>
          </div>
          <div className="text-center min-w-[60px]">
            <div className="text-xs text-secondary">气运</div>
            <div className="font-bold text-good">🍀{character.luck}</div>
          </div>
          <div className="text-center min-w-[80px]">
            <div className="text-xs text-secondary">因果</div>
            <div className={`font-bold ${karmaColor}`}>
              ⚖️{character.karma >= 0 ? '+' : ''}{character.karma}
              <div className="text-[10px]">{karmaLabel}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-[var(--border-primary)] min-w-[140px]">
          <div>
            <div className="text-xs text-secondary">仙历</div>
            <div className="font-bold">第 {currentDay} / {maxDays} 日</div>
          </div>
          <div className="w-16">
            <div className="progress-bar">
              <div className="progress-fill progress-red" style={{ width: `${dayProgress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
