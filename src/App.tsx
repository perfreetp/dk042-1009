import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import MainMenu from '@/components/MainMenu'
import CreationScreen from '@/components/screens/CreationScreen'
import ScheduleScreen from '@/components/screens/ScheduleScreen'
import TownScreen from '@/components/screens/TownScreen'
import CavernScreen from '@/components/screens/CavernScreen'
import DemonScreen from '@/components/screens/DemonScreen'
import EndingScreen from '@/components/screens/EndingScreen'
import StatusBar from '@/components/StatusBar'
import LogPanel from '@/components/LogPanel'
import BottomNav from '@/components/BottomNav'

export default function App() {
  const currentScreen = useGameStore(s => s.currentScreen)
  const character = useGameStore(s => s.character)

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (character) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [character])

  const hasCharacter = character !== null

  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <MainMenu />
      case 'creation':
        return <CreationScreen />
      case 'schedule':
        return <ScheduleScreen />
      case 'town':
        return <TownScreen />
      case 'cavern':
        return <CavernScreen />
      case 'demon':
        return <DemonScreen />
      case 'ending':
        return <EndingScreen />
      default:
        return <MainMenu />
    }
  }

  return (
    <div className="app">
      {hasCharacter && currentScreen !== 'menu' && currentScreen !== 'ending' && <StatusBar />}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto p-4">
          {renderScreen()}
        </div>
        {hasCharacter && currentScreen !== 'menu' && currentScreen !== 'ending' && <LogPanel />}
      </div>
      {hasCharacter && currentScreen !== 'menu' && currentScreen !== 'ending' && <BottomNav />}
    </div>
  )
}
