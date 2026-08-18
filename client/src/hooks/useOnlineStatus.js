import { useEffect, useState } from 'react'
import { useWizardStore } from '../store/wizardStore.js'

export function useOnlineStatus() {
  const setOnline = useWizardStore(s => s.setOnline)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline  = () => { setIsOnline(true);  setOnline(true); }
    const handleOffline = () => { setIsOnline(false); setOnline(false); }

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline])

  return isOnline
}
