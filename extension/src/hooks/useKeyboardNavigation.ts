import { useEffect } from 'react'

interface UseKeyboardNavigationProps {
  onTabSwitch: (tabIndex: number) => void
  tabIds: string[]
  isEnabled?: boolean
}

/**
 * Custom hook for handling keyboard navigation in the popup
 * Supports Ctrl+1/2/3 (Windows/Linux) and Cmd+1/2/3 (macOS) for tab switching
 * Also supports arrow key navigation within tabs
 */
export const useKeyboardNavigation = ({
  onTabSwitch,
  tabIds,
  isEnabled = true
}: UseKeyboardNavigationProps) => {
  useEffect(() => {
    if (!isEnabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if it's the correct modifier key (Ctrl on Windows/Linux, Cmd on macOS)
      const isCorrectModifier = navigator.platform.includes('Mac') 
        ? event.metaKey && !event.ctrlKey 
        : event.ctrlKey && !event.metaKey

      if (isCorrectModifier) {
        // Check for number keys 1-3
        const keyNumber = parseInt(event.key)
        if (keyNumber >= 1 && keyNumber <= tabIds.length) {
          event.preventDefault()
          event.stopPropagation()
          
          // Convert 1-based key to 0-based index
          const tabIndex = keyNumber - 1
          onTabSwitch(tabIndex)
          
          // Announce the tab switch for screen readers
          const announcement = document.createElement('div')
          announcement.setAttribute('aria-live', 'assertive')
          announcement.setAttribute('aria-atomic', 'true')
          announcement.style.position = 'absolute'
          announcement.style.left = '-10000px'
          announcement.style.width = '1px'
          announcement.style.height = '1px'
          announcement.style.overflow = 'hidden'
          announcement.textContent = `Switched to ${tabIds[tabIndex]} tab`
          document.body.appendChild(announcement)
          
          setTimeout(() => {
            document.body.removeChild(announcement)
          }, 1000)
        }
      }

      // Handle arrow key navigation within tab list
      if (event.target && (event.target as Element).closest('[role="tablist"]')) {
        const currentTabButton = event.target as HTMLElement
        const tabList = currentTabButton.closest('[role="tablist"]')
        const tabButtons = tabList?.querySelectorAll('[role="tab"]')
        
        if (tabButtons && tabButtons.length > 0) {
          const currentIndex = Array.from(tabButtons).indexOf(currentTabButton)
          let nextIndex = currentIndex
          
          switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
              event.preventDefault()
              nextIndex = (currentIndex + 1) % tabButtons.length
              break
            case 'ArrowLeft':
            case 'ArrowUp':
              event.preventDefault()
              nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length
              break
            case 'Home':
              event.preventDefault()
              nextIndex = 0
              break
            case 'End':
              event.preventDefault()
              nextIndex = tabButtons.length - 1
              break
            default:
              return
          }
          
          const nextButton = tabButtons[nextIndex] as HTMLElement
          nextButton.focus()
          nextButton.click()
        }
      }
    }

    // Add event listener to the document
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onTabSwitch, tabIds, isEnabled])
}

/**
 * Get the appropriate modifier key text for the current platform
 */
export const getModifierKeyText = (): string => {
  return navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'
}

/**
 * Generate keyboard shortcut text for a given tab number
 */
export const getShortcutText = (tabNumber: number): string => {
  const modifier = getModifierKeyText()
  return `${modifier}+${tabNumber}`
}
