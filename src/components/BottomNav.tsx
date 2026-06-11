import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Screen } from '@/types/game'

interface NavItem {
  screen: Screen
  icon: string
  label: string
  description: string
}

const navItems: NavItem[] = [
  { screen: 'schedule', icon: '☀️', label: '修行日程', description: '每日修行选择' },
  { screen: 'town', icon: '🏯', label: '城镇交互', description: '结缘、任务、商店' },
  { screen: 'cavern', icon: '🌋', label: '洞天福地', description: '探索秘境机缘' },
  { screen: 'demon', icon: '👁️', label: '心魔试炼', description: '拷问本心、突破' }
]

export default function BottomNav() {
  const currentScreen = useGameStore(s => s.currentScreen)
  const setScreen = useGameStore(s => s.setScreen)
  const getFullState = useGameStore(s => s.getFullState)
  const checkEnding = useGameStore(s => s.checkEnding)
  const character = useGameStore(s => s.character)
  const resetGame = useGameStore(s => s.resetGame)

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [savingSlot, setSavingSlot] = useState<number | null>(null)
  const [saveMessage, setSaveMessage] = useState('')

  const handleSave = async (slot: number) => {
    if (!window.electronAPI) {
      setSaveMessage('⚠️ 请在 Electron 环境中运行以使用存档功能')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }
    setSavingSlot(slot)
    const state = getFullState()
    const result = await window.electronAPI.saveGame(slot, state)
    if (result.success) {
      setSaveMessage(`✅ 存档 #${slot} 保存成功！`)
    } else {
      setSaveMessage('❌ 保存失败')
    }
    setSavingSlot(null)
    setTimeout(() => setSaveMessage(''), 2500)
  }

  const handleCheckEnding = () => {
    if (confirm('确定要提前结算结局吗？你将无法继续当前的修行。')) {
      checkEnding()
    }
  }

  const handleReturnMenu = () => {
    if (confirm('确定要返回主菜单吗？未保存的进度将丢失。')) {
      resetGame()
    }
  }

  return (
    <>
      <div className="bg-[rgba(10,10,30,0.95)] backdrop-blur-md border-t border-[var(--border-primary)] px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 flex-1">
            {navItems.map(item => {
              const active = currentScreen === item.screen
              return (
                <button
                  key={item.screen}
                  onClick={() => setScreen(item.screen)}
                  className={`flex-1 max-w-[180px] p-3 rounded-lg transition-all flex flex-col items-center gap-1 border-2 ${
                    active
                      ? 'border-[var(--border-gold)] bg-[rgba(212,175,55,0.1)] shadow-[var(--shadow-gold)]'
                      : 'border-transparent bg-[var(--bg-secondary)] hover:border-[var(--border-primary)]'
                  }`}
                >
                  <div className="text-2xl">{item.icon}</div>
                  <div className={`text-sm font-bold ${active ? 'text-gold' : ''}`}>{item.label}</div>
                  <div className="text-[10px] text-secondary">{item.description}</div>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 ml-2 border-l border-[var(--border-primary)] pl-4">
            <div className="flex gap-2">
              <button
                className="btn text-xs py-2 px-3"
                onClick={() => setShowSaveModal(true)}
                title="保存游戏进度"
              >
                💾 存档
              </button>
              <button
                className="btn btn-gold text-xs py-2 px-3"
                onClick={handleCheckEnding}
                title="查看可用结局"
              >
                🏁 结算结局
              </button>
              <button
                className="btn btn-danger text-xs py-2 px-3"
                onClick={handleReturnMenu}
                title="返回主菜单"
              >
                🏠 主菜单
              </button>
            </div>
            {character && (
              <div className="text-[10px] text-secondary text-right">
                技能：{character.skills.length}/{character.maxSkills} · 年龄：{character.age}岁
              </div>
            )}
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => !savingSlot && setShowSaveModal(false)}
        >
          <div
            className="card card-gold w-full max-w-md fade-in"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="section-title">💾 保存游戏</h2>
            <p className="text-sm text-secondary mb-4">选择一个存档位保存当前进度</p>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map(slot => (
                <button
                  key={slot}
                  onClick={() => handleSave(slot)}
                  disabled={savingSlot !== null}
                  className="p-6 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-gold)] transition-all disabled:opacity-50 text-center"
                >
                  <div className="text-3xl mb-1">{savingSlot === slot ? '⏳' : '📁'}</div>
                  <div className="font-bold">存档 #{slot}</div>
                </button>
              ))}
            </div>
            {saveMessage && (
              <div className="mt-4 p-3 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[var(--accent-green)] text-sm text-good">
                {saveMessage}
              </div>
            )}
            <button
              className="btn mt-6 w-full"
              onClick={() => setShowSaveModal(false)}
              disabled={savingSlot !== null}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  )
}
