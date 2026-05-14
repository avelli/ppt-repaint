import { create } from 'zustand'

interface SettingsStore {}

export const useSettingsStore = create<SettingsStore>()(() => ({}))
