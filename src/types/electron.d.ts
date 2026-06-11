export {}

declare global {
  interface Window {
    electronAPI?: {
      listSaves: () => Promise<any[]>
      loadGame: (slot: number) => Promise<any>
      saveGame: (slot: number, data: any) => Promise<any>
    }
  }
}
