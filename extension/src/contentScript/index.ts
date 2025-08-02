import './styles.css'

interface SelectionData {
  text: string
  ranges: Range[]
  anchorNode?: Node | null
  focusNode?: Node | null
}

interface CachedResults {
  translate?: string
  smooth?: string
}

interface Message {
  action: string
  content: any
}

class TranslationPopup {
  private popup: HTMLDivElement | null = null
  private lastSelection: SelectionData | null = null
  private miniTooltip: HTMLDivElement | null = null
  private cachedResults: Map<string, CachedResults> = new Map()
  private isTooltipVisible = false

  constructor() {
    this.initializeEventListeners()
  }

  private initializeEventListeners(): void {
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this))
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))
  }

  private handleSelectionChange(): void {
    console.log('handleSelectionChange');
    const selection = window.getSelection()
    if (!selection) return

    this.updateSelections(selection.toString())

    if (this.isSelectionInPopup(selection)) return

    this.hidePopup()
    this.hideSelectionIcon()

    if (selection.toString().length > 0) {
      this.lastSelection = {
        text: selection.toString(),
        ranges: Array.from({ length: selection.rangeCount }, (_, i) =>
          selection.getRangeAt(i).cloneRange()
        ),
        anchorNode: selection.anchorNode,
        focusNode: selection.focusNode,
      }
      // Clear cache for new selection
      this.cachedResults.clear()
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    const selection = window.getSelection()
    if (!selection || selection.toString().length === 0) {
      this.hideSelectionIcon()
      return
    }

    const icon = this.getOrCreateSelectionIcon()
    icon.style.top = `${event.clientY + window.scrollY + 5}px`
    icon.style.left = `${event.clientX + window.scrollX}px`
    icon.style.display = 'block'
    icon.style.zIndex = '1000'
    document.body.appendChild(icon)
  }

  private isSelectionInPopup(selection: Selection): boolean {
    const popup = document.getElementById('translation-popup')
    const icon = document.getElementById('selection-icon')
    const tooltip = document.getElementById('mini-tooltip')
    
    return !!(
      selection.anchorNode === icon ||
      selection.focusNode === icon ||
      selection.anchorNode === popup ||
      selection.focusNode === popup ||
      selection.anchorNode === tooltip ||
      selection.focusNode === tooltip ||
      (selection.anchorNode as HTMLElement)?.parentElement?.closest('#translation-popup, #mini-tooltip') ||
      (selection.focusNode as HTMLElement)?.parentElement?.closest('#translation-popup, #mini-tooltip')
    )
  }

  private getOrCreateSelectionIcon(): HTMLDivElement {
    let icon = document.getElementById('selection-icon') as HTMLDivElement
    if (!icon) {
      icon = document.createElement('div')
      icon.id = 'selection-icon'
      icon.className = 'selection-icon'
      icon.style.background = `url(${chrome.runtime.getURL('img/new_logo.png')})`
      icon.style.backgroundSize = 'contain'
      icon.style.position = 'absolute'
      icon.style.width = '24px'
      icon.style.height = '24px'
      icon.style.cursor = 'pointer'
      icon.style.zIndex = '1000'
      icon.addEventListener('click', this.handleIconClick.bind(this))
      icon.addEventListener('mouseenter', this.handleIconHover.bind(this))
      icon.addEventListener('mouseleave', this.handleIconMouseLeave.bind(this))
    }
    return icon
  }

  private handleIconClick(): void {
    this.hideSelectionIcon()
    if (this.lastSelection?.text) {
      this.sendMessage({
        action: 'translate',
        content: this.lastSelection.text,
      })
    }
  }

  private hideSelectionIcon(): void {
    const icon = document.getElementById('selection-icon')
    if (icon) {
      icon.style.display = 'none'
    }
  }

  private handleIconHover(): void {
    if (!this.lastSelection?.text) return
    this.showMiniTooltip()
  }

  private handleIconMouseLeave(): void {
    // Delay hiding to allow moving mouse to tooltip
    setTimeout(() => {
      if (!this.isTooltipVisible) {
        this.hideMiniTooltip()
      }
    }, 100)
  }

  private showMiniTooltip(): void {
    const icon = document.getElementById('selection-icon')
    if (!icon || !this.lastSelection?.text) return

    const tooltip = this.getOrCreateMiniTooltip()
    // Ensure tooltip is in the DOM before we try to update its content
    if (!document.getElementById('mini-tooltip')) {
      document.body.appendChild(tooltip)
    }

    const iconRect = icon.getBoundingClientRect()
    
    tooltip.style.top = `${iconRect.bottom + window.scrollY + 5}px`
    tooltip.style.left = `${iconRect.left + window.scrollX}px`
    tooltip.style.display = 'block'
    
    // Load cached results or fetch new ones
    const cached = this.cachedResults.get(this.lastSelection.text)
    if (cached?.translate && cached?.smooth) {
      this.updateTooltipContent(cached.translate, cached.smooth)
    } else {
      this.updateTooltipContent('Loading...', 'Loading...')
      this.fetchTranslateAndSmooth(this.lastSelection.text)
    }
  }

  private hideMiniTooltip(): void {
    const tooltip = document.getElementById('mini-tooltip')
    if (tooltip) {
      tooltip.style.display = 'none'
    }
    this.isTooltipVisible = false
  }

  private getOrCreateMiniTooltip(): HTMLDivElement {
    let tooltip = document.getElementById('mini-tooltip') as HTMLDivElement
    if (!tooltip) {
      tooltip = document.createElement('div')
      tooltip.id = 'mini-tooltip'
      tooltip.className = 'mini-tooltip'
      
      // Mouse events
      tooltip.addEventListener('mouseenter', () => {
        this.isTooltipVisible = true
      })
      tooltip.addEventListener('mouseleave', () => {
        this.isTooltipVisible = false
        this.hideMiniTooltip()
      })
      
      // Prevent selection changes when clicking tooltip
      tooltip.addEventListener('mousedown', (event) => {
        event.preventDefault()
        console.log('[tooltip mousedown prevented]')
      })
      
      // Click event delegation
      tooltip.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        console.log('[tooltip clicked]', target)
        
        if (target.classList.contains('translate-row')) {
          console.log('[translate row clicked]')
          this.hideMiniTooltip()
          this.handleIconClick() // Use existing translate behavior
        } else if (target.classList.contains('smooth-row')) {
          const smoothText = tooltip.getAttribute('data-smooth-text')
          console.log('[smooth row clicked]', smoothText)
          if (smoothText && smoothText !== 'Loading...') {
            this.replaceWithSmooth(smoothText)
            this.hideMiniTooltip()
            this.hideSelectionIcon()
          }
        }
      })
    }
    return tooltip
  }

  private updateTooltipContent(translateText: string, smoothText: string): void {
    const tooltip = document.getElementById('mini-tooltip')
    if (!tooltip) return

    tooltip.innerHTML = `
      <div class="tooltip-row translate-row" data-action="translate">
        ${translateText}
      </div>
      <div class="tooltip-row smooth-row" data-action="smooth">
        ${smoothText}
      </div>
    `

    // Store the current smooth text for click handler
    tooltip.setAttribute('data-smooth-text', smoothText)
    tooltip.setAttribute('data-translate-text', translateText)
    
    console.log('[tooltip updated]', { translateText, smoothText })
  }

  private async fetchTranslateAndSmooth(text: string): Promise<void> {
    if (!text) return

    try {
      const [translateResult, smoothResult] = await Promise.all([
        this.sendMessageAsync({ action: 'translate', content: text }),
        this.sendMessageAsync({ action: 'smooth', content: text })
      ])

      const translateText = translateResult?.content || 'Translation failed'
      const smoothText = smoothResult?.content || 'Smoothing failed'

      // Cache results
      this.cachedResults.set(text, {
        translate: translateText,
        smooth: smoothText
      })

      // Update tooltip if still visible
      this.updateTooltipContent(translateText, smoothText)
    } catch (error) {
      console.error('Error fetching translate/smooth:', error)
      this.updateTooltipContent('Translation failed', 'Smoothing failed')
    }
  }

  private sendMessageAsync(message: Message): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve)
    })
  }

  private replaceWithSmooth(smoothText: string): void {
    if (!this.lastSelection) {
      this.showNotification('No selection found to replace')
      return
    }

    console.log('Attempting to replace with smooth text:', smoothText)
    console.log('Last selection:', this.lastSelection)

    // Try to restore the original selection first
    const selection = window.getSelection()
    if (selection && this.lastSelection.ranges.length > 0) {
      try {
        selection.removeAllRanges()
        // Use the first range from stored selection
        const range = this.lastSelection.ranges[0]
        selection.addRange(range)
        console.log('Restored selection range')
      } catch (error) {
        console.warn('Could not restore selection:', error)
      }
    }

    if (!selection || selection.rangeCount === 0) {
      this.showNotification('Cannot restore selection')
      return
    }

    const range = selection.getRangeAt(0)
    const anchorNode = this.lastSelection.anchorNode || selection.anchorNode

    console.log('Anchor node:', anchorNode)
    console.log('Range:', range)

    // Case 1: INPUT or TEXTAREA
    let editableElement = null
    let currentNode = anchorNode
    while (currentNode && currentNode.nodeType === Node.TEXT_NODE) {
      currentNode = currentNode.parentNode
    }
    
    if (currentNode) {
      editableElement = (currentNode as Element).closest('input, textarea') as HTMLInputElement | HTMLTextAreaElement
    }

    console.log('Found editable element:', editableElement)

    if (editableElement && (editableElement.tagName === 'INPUT' || editableElement.tagName === 'TEXTAREA')) {
      console.log('Replacing in input/textarea')
      const start = editableElement.selectionStart || 0
      const end = editableElement.selectionEnd || 0
      editableElement.setRangeText(smoothText, start, end, 'end')
      editableElement.focus()
      this.showNotification('Text replaced successfully!')
      return
    }

    // Case 2: contentEditable
    let contentEditableElement = currentNode as HTMLElement
    while (contentEditableElement && !contentEditableElement.isContentEditable) {
      contentEditableElement = contentEditableElement.parentElement as HTMLElement
    }

    console.log('Found contentEditable element:', contentEditableElement)

    if (contentEditableElement && contentEditableElement.isContentEditable) {
      console.log('Replacing in contentEditable')
      try {
        range.deleteContents()
        range.insertNode(document.createTextNode(smoothText))
        
        // Collapse selection after insert
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
        this.showNotification('Text replaced successfully!')
        return
      } catch (error) {
        console.error('Error replacing in contentEditable:', error)
        this.showNotification('Error replacing text')
        return
      }
    }

    // Case 3: Try direct range replacement as fallback
    try {
      console.log('Trying direct range replacement')
      range.deleteContents()
      range.insertNode(document.createTextNode(smoothText))
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      this.showNotification('Text replaced successfully!')
      return
    } catch (error) {
      console.error('Error with direct replacement:', error)
    }

    // Not editable - show a subtle notification
    console.log('Text is read-only')
    this.showNotification('Cannot replace - text is read-only')
  }

  private showNotification(message: string): void {
    const notification = document.createElement('div')
    notification.className = 'replace-notification'
    notification.textContent = message
    
    const isSuccess = message.includes('successfully')
    const backgroundColor = isSuccess ? '#52c41a' : '#ff4d4f'
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${backgroundColor};
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 2000)
  }

  private hidePopup(): void {
    const popup = document.getElementById('translation-popup')
    if (popup) {
      popup.style.display = 'none'
    }
  }

  private updateSelections(selection: string): void {
    chrome.storage.local.get('selections', (result) => {
      const selections = result.selections || []
      selections.push(selection)
      chrome.storage.local.set({ selections })
    })
  }

  private createPopup(): HTMLDivElement {
    const popup = document.createElement('div')
    popup.id = 'translation-popup'
    popup.className = 'translation-popup'
    return popup
  }

  private updatePopupPosition(popup: HTMLDivElement): void {
    if (!this.lastSelection) return

    const range = this.lastSelection.ranges[this.lastSelection.ranges.length - 1]
    const rect = range.getBoundingClientRect()
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`
    popup.style.left = `${rect.left + window.scrollX}px`
  }

  private handleSaveTranslation(popup: HTMLDivElement, translation: string): void {
    const saveButton = popup.querySelector('#save-button') as HTMLButtonElement
    if (!saveButton || !this.lastSelection) return

    saveButton.addEventListener('click', () => {
      chrome.runtime.sendMessage(
        {
          action: 'save',
          content: this.lastSelection!.text,
          translation,
        },
        (response) => {
          if (response?.status === 'saved') {
            saveButton.textContent = 'Saved!'
            saveButton.className = 'saved'
          }
        }
      )
    })
  }

  private sendMessage(message: Message): void {
    chrome.runtime.sendMessage(message, (response) => {
      if (!response?.content || !this.lastSelection) return

      let popup = document.getElementById('translation-popup') as HTMLDivElement
      if (!popup) {
        popup = this.createPopup()
      }

      if (!popup) return

      popup.style.display = 'block'
      popup.innerHTML = `
        <select>
          <option>English</option>
          <option>Vietnamese</option>
        </select>
        <div class="translation-content">
          <span>${message.content}</span>
          <h3>Vietnamese</h3>
          <span>${response.content}</span>
        </div>
        <div class="translation-footer">
          <button id="save-button">Save</button>
          <a href="#">Extension Options</a>
        </div>
      `

      this.updatePopupPosition(popup)
      this.handleSaveTranslation(popup, response.content)

      if (!document.getElementById('translation-popup')) {
        document.body.appendChild(popup)
      }
    })
  }
}

// Initialize the translation popup
new TranslationPopup()
