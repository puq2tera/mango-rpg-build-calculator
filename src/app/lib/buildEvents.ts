export const BUILD_SNAPSHOT_UPDATED_EVENT = "buildSnapshotUpdated"

export function dispatchBuildSnapshotUpdated(): void {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(BUILD_SNAPSHOT_UPDATED_EVENT))
}
