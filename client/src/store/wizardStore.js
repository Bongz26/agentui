import { create } from 'zustand'

export const useWizardStore = create((set, get) => ({
  // Current application being edited
  applicationId: null,
  currentStep: 1,
  totalSteps: 6,
  saveStatus: 'saved', // 'saved' | 'saving' | 'offline' | 'error'
  isOnline: navigator.onLine,

  setApplicationId: (id) => set({ applicationId: id }),
  setStep: (step) => set({ currentStep: step }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setOnline: (online) => set({ isOnline: online }),

  reset: () => set({ applicationId: null, currentStep: 1, saveStatus: 'saved' }),
}))
