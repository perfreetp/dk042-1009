import { useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

interface SaveInfo {
  slot: number
  modified: string
  characterName: string
  realm: string
}

export default function MainMenu() {
  const setScreen = useGameStore(s => s.setScreen)
  const loadState = useGameStore(s => s.loadState)
  const resetGame = useGameStore(s => s.resetGame)

  const [saves, setSaves] = useState<SaveInfo[]>([])
  const [showLoad, setShowLoad] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadSaves = async () => {
      if (window.electronAPI) {
        try {
          const list = await window.electronAPI.listSaves()
          setSaves(list)
        } catch (e) {
          console.log('No electron API available')
        }
      }
    }
    loadSaves()
  }, [])

  const handleNewGame = () => {
    resetGame()
    setScreen('creation')
  }

  const handleLoadGame = async (slot: number) => {
    if (!window.electronAPI) {
      alert('请在 Electron 环境中运行以使用存档功能')
      return
    }
    setLoading(true)
    const result = await window.electronAPI.loadGame(slot)
    if (result.success) {
      loadState(result.data)
    } else {
      alert('读取存档失败')
    }
    setLoading(false)
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="max-w-3xl w-full text-center fade-in">
        <div className="mb-12">
          <div className="text-7xl mb-6">⚔️</div>
          <h1 className="text-5xl font-bold mb-4 text-gold" style={{ textShadow: '0 0 30px rgba(212,175,55,0.4)' }}>
            修 仙 旅 程
          </h1>
          <p className="text-xl text-secondary mb-2">—— AI 驱动的文本冒险 ——</p>
          <p className="text-sm text-secondary max-w-xl mx-auto">
            一段可歌可泣的个人修行史诗，由你亲手书写。<br/>
            出身、道心、机缘、劫难、羁绊、因果——每一个选择，都将通向不同的结局。
          </p>
        </div>

        {!showLoad ? (
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            <button
              className="btn btn-gold text-xl py-4"
              onClick={handleNewGame}
              style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}
            >
              ✨ 开启新的修仙之旅 ✨
            </button>
            <button
              className="btn text-lg py-3"
              onClick={() => setShowLoad(true)}
              disabled={saves.length === 0}
            >
              📜 读取存档 {saves.length > 0 && `（${saves.length} 个）`}
            </button>
          </div>
        ) : (
          <div className="card card-gold max-w-xl mx-auto text-left">
            <h2 className="section-title">选择存档</h2>
            {saves.length === 0 ? (
              <p className="text-secondary text-center py-8">暂无存档</p>
            ) : (
              <div className="space-y-3">
                {saves.map(save => (
                  <div
                    key={save.slot}
                    onClick={() => !loading && handleLoadGame(save.slot)}
                    className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] cursor-pointer hover:border-[var(--border-gold)] transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-lg">
                          存档 #{save.slot} · <span className="text-gold">{save.characterName}</span>
                        </div>
                        <div className="text-sm text-secondary">
                          境界：{save.realm} · {new Date(save.modified).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      {loading && <span className="text-info">加载中...</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn mt-6 w-full" onClick={() => setShowLoad(false)}>
              返回
            </button>
          </div>
        )}

        <div className="mt-16 text-xs text-secondary">
          <p>💡 提示：游戏支持多分支剧情，不同的选择将通向 12 种不同结局</p>
          <p className="mt-1">🌙 建议全程静下心来体验，方得修仙之真谛</p>
        </div>
      </div>
    </div>
  )
}
