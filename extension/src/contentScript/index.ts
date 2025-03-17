import './styles.css'

interface SelectionData {
  text: string
  ranges: Range[]
  anchorNode?: Node | null
  focusNode?: Node | null
}

interface Message {
  action: string
  content: any
}

class TranslationPopup {
  private popup: HTMLDivElement | null = null
  private lastSelection: SelectionData | null = null

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
    
    return !!(
      selection.anchorNode === icon ||
      selection.focusNode === icon ||
      selection.anchorNode === popup ||
      selection.focusNode === popup ||
      selection.anchorNode?.parentElement?.closest('#translation-popup') ||
      selection.focusNode?.parentElement?.closest('#translation-popup')
    )
  }

  private getOrCreateSelectionIcon(): HTMLDivElement {
    let icon = document.getElementById('selection-icon') as HTMLDivElement
    if (!icon) {
      icon = document.createElement('div')
      icon.id = 'selection-icon'
      icon.className = 'selection-icon'
      icon.style.background = `url(${chrome.runtime.getURL('img/icon.png')})`
      icon.style.backgroundSize = 'contain'
      icon.style.position = 'absolute'
      icon.style.width = '24px'
      icon.style.height = '24px'
      icon.style.cursor = 'pointer'
      icon.style.zIndex = '1000'
      icon.addEventListener('click', this.handleIconClick.bind(this))
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
