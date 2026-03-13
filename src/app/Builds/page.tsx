"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import CopyTextButton from "@/app/components/CopyTextButton"
import { BUILD_SNAPSHOT_UPDATED_EVENT } from "@/app/lib/buildEvents"
import {
  applyBuildProfile,
  areStoredBuildDataEqual,
  captureCurrentBuildData,
  deleteBuildProfile,
  exportBuildProfile,
  importBuildProfile,
  readBuildManagerState,
  renameBuildProfile,
  saveCurrentBuildProfile,
  type StoredBuildData,
  type StoredBuildProfile,
} from "@/app/lib/buildStorage"

type FeedbackTone = "success" | "error" | "info"

type FeedbackState = {
  tone: FeedbackTone
  text: string
}

const cardClass =
  "rounded-[26px] border border-slate-800/80 bg-slate-950/70 shadow-[0_24px_80px_rgba(2,6,23,0.42)] backdrop-blur"

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400/70"

const compactInputClass =
  "rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none transition focus:border-sky-400/70"

const compactButtonClass =
  "rounded-lg border border-slate-700 bg-slate-950/90 px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-sky-400/50 hover:text-sky-200"

const compactPrimaryButtonClass =
  "rounded-lg border border-sky-500/60 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-100 transition hover:bg-sky-500/15"

const dangerButtonClass =
  "rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15"

const feedbackClassByTone: Record<FeedbackTone, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  error: "border-rose-500/40 bg-rose-500/10 text-rose-100",
  info: "border-slate-700 bg-slate-900/80 text-slate-200",
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatTimestamp(value: string): string {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? value : dateFormatter.format(timestamp)
}

function buildJsonFilename(name: string): string {
  const sanitized = name
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()

  return `${sanitized || "mango-build"}.json`
}

function downloadJsonFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function readBuildManagerViewState(storage: Storage): {
  profiles: StoredBuildProfile[]
  activeBuildId: string | null
  currentData: StoredBuildData
} {
  const nextState = readBuildManagerState(storage)

  return {
    profiles: nextState.profiles,
    activeBuildId: nextState.activeBuildId,
    currentData: captureCurrentBuildData(storage),
  }
}

export default function BuildsPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [profiles, setProfiles] = useState<StoredBuildProfile[]>([])
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null)
  const [currentData, setCurrentData] = useState<StoredBuildData>({})
  const [saveName, setSaveName] = useState("")
  const [importName, setImportName] = useState("")
  const [importText, setImportText] = useState("")
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({})
  const [renamingProfileId, setRenamingProfileId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)

  const syncFromStorage = () => {
    const nextViewState = readBuildManagerViewState(window.localStorage)

    setProfiles(nextViewState.profiles)
    setActiveBuildId(nextViewState.activeBuildId)
    setCurrentData(nextViewState.currentData)
    setRenameDrafts((current) => nextViewState.profiles.reduce<Record<string, string>>((result, profile) => {
      result[profile.id] = current[profile.id] ?? profile.name
      return result
    }, {}))
  }

  useEffect(() => {
    const refresh = () => {
      const nextViewState = readBuildManagerViewState(window.localStorage)

      setProfiles(nextViewState.profiles)
      setActiveBuildId(nextViewState.activeBuildId)
      setCurrentData(nextViewState.currentData)
      setRenameDrafts((current) => nextViewState.profiles.reduce<Record<string, string>>((result, profile) => {
        result[profile.id] = current[profile.id] ?? profile.name
        return result
      }, {}))
    }

    refresh()
    setIsHydrated(true)

    window.addEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refresh)
    window.addEventListener("focus", refresh)
    window.addEventListener("storage", refresh)

    return () => {
      window.removeEventListener(BUILD_SNAPSHOT_UPDATED_EVENT, refresh)
      window.removeEventListener("focus", refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  const activeProfile = profiles.find((profile) => profile.id === activeBuildId) ?? null
  const currentBuildDirty = activeProfile ? !areStoredBuildDataEqual(activeProfile.data, currentData) : false
  const currentExportName = saveName.trim() || activeProfile?.name || "Current Build"
  const currentExportText = useMemo(
    () => exportBuildProfile({
      name: currentExportName,
      createdAt: activeProfile?.createdAt,
      updatedAt: activeProfile?.updatedAt,
      data: currentData,
    }),
    [activeProfile?.createdAt, activeProfile?.updatedAt, currentData, currentExportName],
  )
  const exportedProfileTexts = useMemo(
    () => profiles.reduce<Record<string, string>>((result, profile) => {
      result[profile.id] = exportBuildProfile(profile)
      return result
    }, {}),
    [profiles],
  )

  const handleSaveNew = () => {
    try {
      const profile = saveCurrentBuildProfile(window.localStorage, saveName)
      setSaveName(profile.name)
      setFeedback({ tone: "success", text: `Saved "${profile.name}" from the current local storage state.` })
      syncFromStorage()
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to save build." })
    }
  }

  const handleOverwrite = (profile: StoredBuildProfile) => {
    try {
      const updatedProfile = saveCurrentBuildProfile(window.localStorage, profile.name, profile.id)
      setSaveName(updatedProfile.name)
      setFeedback({ tone: "success", text: `Overwrote "${updatedProfile.name}" with the current local storage state.` })
      syncFromStorage()
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to overwrite build." })
    }
  }

  const handleLoad = (profileId: string) => {
    try {
      const profile = applyBuildProfile(window.localStorage, profileId)
      setSaveName(profile.name)
      setFeedback({ tone: "success", text: `Loaded "${profile.name}" into the active local storage build.` })
      syncFromStorage()
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to load build." })
    }
  }

  const handleRename = (profile: StoredBuildProfile) => {
    try {
      const nextName = renameDrafts[profile.id] ?? profile.name
      const renamedProfile = renameBuildProfile(window.localStorage, profile.id, nextName)
      setRenamingProfileId(null)
      setFeedback({ tone: "success", text: `Renamed build to "${renamedProfile.name}".` })
      syncFromStorage()
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to rename build." })
    }
  }

  const handleDelete = (profile: StoredBuildProfile) => {
    if (!window.confirm(`Delete "${profile.name}"?`)) {
      return
    }

    deleteBuildProfile(window.localStorage, profile.id)
    setFeedback({ tone: "info", text: `Deleted "${profile.name}".` })
    syncFromStorage()
  }

  const handleImport = (loadAfterImport: boolean) => {
    try {
      const importedProfile = importBuildProfile(window.localStorage, importText, importName)

      if (loadAfterImport) {
        applyBuildProfile(window.localStorage, importedProfile.id)
      }

      setSaveName(importedProfile.name)
      setImportName("")
      setImportText("")
      setFeedback({
        tone: "success",
        text: loadAfterImport
          ? `Imported and loaded "${importedProfile.name}".`
          : `Imported "${importedProfile.name}" as a saved build.`,
      })
      syncFromStorage()
    } catch (error) {
      setFeedback({ tone: "error", text: error instanceof Error ? error.message : "Unable to import build." })
    }
  }

  const handleDownloadCurrent = () => {
    downloadJsonFile(buildJsonFilename(currentExportName), currentExportText)
    setFeedback({ tone: "info", text: `Downloaded "${buildJsonFilename(currentExportName)}".` })
  }

  const handleDownloadProfile = (profile: StoredBuildProfile) => {
    const exportText = exportedProfileTexts[profile.id] ?? exportBuildProfile(profile)
    const filename = buildJsonFilename(profile.name)

    downloadJsonFile(filename, exportText)
    setFeedback({ tone: "info", text: `Downloaded "${filename}".` })
  }

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const derivedName = file.name.replace(/\.json$/i, "")

      setImportText(text)
      setImportName((current) => current.trim().length > 0 ? current : derivedName)
      setFeedback({ tone: "info", text: `Loaded "${file.name}" into the import field.` })
    } catch {
      setFeedback({ tone: "error", text: `Unable to read "${file.name}".` })
    } finally {
      event.target.value = ""
    }
  }

  if (!isHydrated) {
    return <div className="p-4 text-sm text-slate-300">Loading build manager...</div>
  }

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(234,88,12,0.10),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <section className="rounded-[30px] border border-slate-800/80 bg-[linear-gradient(135deg,rgba(7,12,20,0.97),rgba(15,23,42,0.9))] px-6 py-6 shadow-[0_40px_100px_rgba(2,6,23,0.48)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-300">
                Build Manager
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
                Save, import, export, and switch local builds
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-400">
                Saved builds are stored entirely in local storage. Loading a saved build replaces the app&apos;s current
                local build state with that profile.
              </p>
            </div>

            <div className="grid min-w-[18rem] gap-3 sm:grid-cols-3">
              <div className={cardClass}>
                <div className="px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Saved Builds</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-50">{profiles.length}</div>
                </div>
              </div>
              <div className={cardClass}>
                <div className="px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Current Keys</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-50">{Object.keys(currentData).length}</div>
                </div>
              </div>
              <div className={cardClass}>
                <div className="px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Loaded Build</div>
                  <div className="mt-2 text-lg font-semibold text-slate-50">{activeProfile?.name ?? "Unsaved current state"}</div>
                </div>
              </div>
            </div>
          </div>

          {feedback ? (
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${feedbackClassByTone[feedback.tone]}`}>
              {feedback.text}
            </div>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section className={`${cardClass} px-5 py-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-50">Current Build</h2>
                  <p className="max-w-2xl text-sm leading-6 text-slate-400">
                    Snapshot the build that is currently loaded in local storage, or export it directly as JSON.
                  </p>
                </div>
                <div className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300">
                  {currentBuildDirty ? "Unsaved changes against loaded build" : activeProfile ? "Matches loaded build" : "No saved build loaded"}
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Build Name</span>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(event) => setSaveName(event.target.value)}
                    placeholder="Tank Farm Setup"
                    className={inputClass}
                  />
                </label>

                <div className="flex flex-wrap items-end gap-2 md:justify-end">
                  <button type="button" onClick={handleSaveNew} className={compactPrimaryButtonClass}>
                    Save New
                  </button>

                  {activeProfile ? (
                    <button type="button" onClick={() => handleOverwrite(activeProfile)} className={compactButtonClass}>
                      Overwrite Current Build
                    </button>
                  ) : null}

                  <CopyTextButton
                    label="Copy to Clipboard"
                    copiedLabel="Export Copied"
                    text={currentExportText}
                    className="h-fit self-end"
                  />
                  <button type="button" onClick={handleDownloadCurrent} className={compactButtonClass}>
                    Download JSON
                  </button>
                </div>
              </div>

              {activeProfile ? (
                <div className="mt-4 text-sm text-slate-400">
                  <div>
                    Last saved {formatTimestamp(activeProfile.updatedAt)}
                  </div>
                </div>
              ) : null}
            </section>

            <section className={`${cardClass} px-5 py-5`}>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-50">Import Build</h2>
                <p className="text-sm leading-6 text-slate-400">
                  Paste a previously exported build JSON blob. You can save it only, or save and load it immediately.
                </p>
              </div>

              <div className="mt-5 grid gap-4">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Optional Name Override</span>
                  <input
                    type="text"
                    value={importName}
                    onChange={(event) => setImportName(event.target.value)}
                    placeholder="Imported Support Setup"
                    className={inputClass}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Build JSON</span>
                  <textarea
                    value={importText}
                    onChange={(event) => setImportText(event.target.value)}
                    rows={4}
                    placeholder={`{\n  "type": "mango-build-profile",\n  ...\n}`}
                    className={`${inputClass} min-h-28 resize-y font-mono text-xs leading-6`}
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <label className={`${compactButtonClass} inline-flex cursor-pointer items-center`}>
                    Upload JSON
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleUploadFile}
                      className="hidden"
                    />
                  </label>
                  <button type="button" onClick={() => handleImport(false)} className={compactButtonClass}>
                    Import Saved Build
                  </button>
                  <button type="button" onClick={() => handleImport(true)} className={compactPrimaryButtonClass}>
                    Import and Load
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">Saved Builds</h2>
              <p className="mt-1 text-sm text-slate-400">
                Loading a build swaps the app&apos;s current local storage state to that profile.
              </p>
            </div>
          </div>

          {profiles.length === 0 ? (
            <div className={`${cardClass} px-5 py-8 text-sm text-slate-300`}>
              No saved builds yet. Save the current local storage state or import a build JSON blob to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {profiles.map((profile) => {
                const isActive = profile.id === activeBuildId
                const renameValue = renameDrafts[profile.id] ?? profile.name
                const isRenaming = renamingProfileId === profile.id

                return (
                  <article key={profile.id} className={`${cardClass} px-5 py-5`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-50">{profile.name}</h3>
                          {isActive ? (
                            <span className="rounded-full border border-sky-500/50 bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">
                              Loaded
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
                          <span>{Object.keys(profile.data).length} stored keys</span>
                          <span>Created {formatTimestamp(profile.createdAt)}</span>
                          <span>Updated {formatTimestamp(profile.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-start gap-2">
                        <button type="button" onClick={() => handleLoad(profile.id)} className={compactPrimaryButtonClass}>
                          Load
                        </button>
                        <button type="button" onClick={() => handleOverwrite(profile)} className={compactButtonClass}>
                          Overwrite
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingProfileId((current) => current === profile.id ? null : profile.id)}
                          className={compactButtonClass}
                        >
                          Rename
                        </button>
                        <CopyTextButton
                          label="Copy Export"
                          copiedLabel="Export Copied"
                          text={exportedProfileTexts[profile.id] ?? ""}
                        />
                        <button type="button" onClick={() => handleDownloadProfile(profile)} className={compactButtonClass}>
                          Download
                        </button>
                        <button type="button" onClick={() => handleDelete(profile)} className={dangerButtonClass}>
                          Delete
                        </button>
                        {isRenaming ? (
                          <>
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(event) => setRenameDrafts((current) => ({
                                ...current,
                                [profile.id]: event.target.value,
                              }))}
                              className={`${compactInputClass} w-40 sm:w-48`}
                              aria-label={`Rename ${profile.name}`}
                            />
                            <button type="button" onClick={() => handleRename(profile)} className={compactPrimaryButtonClass}>
                              Save
                            </button>
                            <button type="button" onClick={() => setRenamingProfileId(null)} className={compactButtonClass}>
                              Cancel
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
