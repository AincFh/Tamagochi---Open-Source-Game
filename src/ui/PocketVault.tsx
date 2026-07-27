import { useRef, useState, type ChangeEvent } from 'react'
import { useGameStore } from '../game/store'

type VaultStatus = { tone: 'ok' | 'error'; message: string } | null

const MAX_FILE_BYTES = 200_000

export function PocketVault() {
  const exportSave = useGameStore((state) => state.exportSave)
  const importSave = useGameStore((state) => state.importSave)
  const petName = useGameStore((state) => state.petName)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pasted, setPasted] = useState('')
  const [status, setStatus] = useState<VaultStatus>(null)

  const downloadBackup = () => {
    const backup = exportSave()
    try {
      const blob = new Blob([backup.contents], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = backup.fileName
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStatus({ tone: 'ok', message: `Saved ${backup.fileName} to your downloads.` })
    } catch {
      setStatus({ tone: 'error', message: 'This browser blocked the download. Try copying the backup instead.' })
    }
  }

  const copyBackup = async () => {
    const backup = exportSave()
    try {
      await navigator.clipboard.writeText(backup.contents)
      setStatus({ tone: 'ok', message: 'Backup copied to your clipboard.' })
    } catch {
      setStatus({ tone: 'error', message: 'Clipboard access was refused. Use Download backup instead.' })
    }
  }

  const restore = (contents: string) => {
    if (!window.confirm(`Replace ${petName}'s current progress with this backup?`)) return
    const result = importSave(contents)
    if (result.ok) {
      setPasted('')
      setStatus({ tone: 'ok', message: 'Backup restored. Your pocket world is back.' })
      return
    }
    setStatus({ tone: 'error', message: result.error })
  }

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setStatus({ tone: 'error', message: 'That file is too large to be a Tamagochi save.' })
      return
    }

    try {
      restore(await file.text())
    } catch {
      setStatus({ tone: 'error', message: 'That file could not be read. Try exporting a fresh backup.' })
    }
  }

  return (
    <section className="vault-section" aria-labelledby="vault-title">
      <div className="vault-heading">
        <div>
          <p className="eyebrow">POCKET VAULT · STAYS ON YOUR DEVICE</p>
          <h2 id="vault-title">Back up<br /><em>your world.</em></h2>
        </div>
        <p>Saves normally live only in this browser. Export a backup before clearing site data, switching browsers, or moving to a new device.</p>
      </div>

      <div className="vault-grid">
        <article className="vault-card">
          <h3>Export</h3>
          <p>Download a readable JSON copy of {petName}’s needs, bond, memories, Sparks, growth, and keepsakes.</p>
          <div className="vault-actions">
            <button className="vault-primary" onClick={downloadBackup}>DOWNLOAD BACKUP</button>
            <button onClick={() => void copyBackup()}>COPY AS TEXT</button>
          </div>
        </article>

        <article className="vault-card">
          <h3>Restore</h3>
          <p>Load a backup from this or another device. Restoring replaces the current save, so export first if you want to keep it.</p>
          <div className="vault-actions">
            <button className="vault-primary" onClick={() => fileInputRef.current?.click()}>CHOOSE BACKUP FILE</button>
            <input
              ref={fileInputRef}
              className="vault-file"
              type="file"
              accept="application/json,.json"
              onChange={(event) => void chooseFile(event)}
              aria-label="Choose a Tamagochi backup file"
            />
          </div>
          <label className="vault-paste" htmlFor="vault-paste-field">
            <span>Or paste backup text</span>
            <textarea
              id="vault-paste-field"
              rows={3}
              value={pasted}
              spellCheck={false}
              placeholder='{ "app": "tamagochi", … }'
              onChange={(event) => setPasted(event.target.value)}
            />
          </label>
          <button className="vault-restore" disabled={!pasted.trim()} onClick={() => restore(pasted)}>
            RESTORE FROM TEXT
          </button>
        </article>
      </div>

      <p className={`vault-status ${status?.tone === 'error' ? 'is-error' : ''}`} role="status" aria-live="polite">
        {status?.message ?? 'Backups are plain JSON. Nothing is uploaded, and no account is required.'}
      </p>
    </section>
  )
}
