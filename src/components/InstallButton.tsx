'use client'

import { usePWAInstall } from '@/hooks/usePWAInstall'

export function InstallButton() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall()

  // Don't show button if already installed or not installable
  if (isInstalled || !isInstallable) {
    return null
  }

  const handleInstallClick = async () => {
    await promptInstall()
  }

  return (
    <button
      onClick={handleInstallClick}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      aria-label="Install Rate Your Day app"
    >
      Install App
    </button>
  )
}
