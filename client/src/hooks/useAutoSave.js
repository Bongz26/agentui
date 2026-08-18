import { useEffect, useRef, useCallback } from 'react'
import { useWizardStore } from '../store/wizardStore.js'
import { updateApplication } from '../api/applications.js'

const DEBOUNCE_MS = 2000

export function useAutoSave(applicationId, data) {
  const setSaveStatus = useWizardStore(s => s.setSaveStatus)
  const isOnline = useWizardStore(s => s.isOnline)
  const timerRef = useRef(null)
  const pendingRef = useRef(null)

  const save = useCallback(async (payload) => {
    if (!applicationId) return
    if (!isOnline) {
      setSaveStatus('offline')
      // Store pending save for when back online
      pendingRef.current = payload
      return
    }
    setSaveStatus('saving')
    try {
      await updateApplication(applicationId, payload)
      setSaveStatus('saved')
      pendingRef.current = null
    } catch {
      setSaveStatus('error')
    }
  }, [applicationId, isOnline, setSaveStatus])

  // Debounced auto-save when data changes
  useEffect(() => {
    if (!data || !applicationId) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(data), DEBOUNCE_MS)
    return () => clearTimeout(timerRef.current)
  }, [data, applicationId, save])

  // When coming back online, flush pending save
  useEffect(() => {
    if (isOnline && pendingRef.current) {
      save(pendingRef.current)
    }
  }, [isOnline, save])

  return { save }
}
