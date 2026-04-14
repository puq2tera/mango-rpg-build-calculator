"use client"

import Link from "next/link"
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  PAGE_PERF_RUN_QUERY_PARAM,
  type PagePerfBenchmarkResult,
  summarizeBenchmark,
} from "@/app/lib/pagePerf"

type MonitoredRoute = {
  id: string
  label: string
  path: string
  description: string
  supportsBenchmarks: boolean
}

type RouteStatus = {
  state: "queued" | "running" | "completed" | "warning" | "error"
  message: string
}

type ResourceSummary = {
  resourceCount: number
  htmlEncodedBytes: number
  htmlTransferBytes: number
  htmlDecodedBytes: number
  scriptEncodedBytes: number
  styleEncodedBytes: number
  fontEncodedBytes: number
  imageEncodedBytes: number
  otherEncodedBytes: number
  totalEncodedBytes: number
  totalTransferBytes: number
  totalDecodedBytes: number
}

type LoadSummary = {
  domInteractiveMs: number | null
  domContentLoadedMs: number | null
  loadMs: number | null
  firstPaintMs: number | null
  firstContentfulPaintMs: number | null
  readyMs: number | null
}

type RouteMeasurement = {
  route: MonitoredRoute
  resourceSummary: ResourceSummary
  loadSummary: LoadSummary
  benchmarks: PagePerfBenchmarkResult[]
  benchmarkError: string | null
  measuredAt: string
}

type BaseRouteMeasurement = Pick<RouteMeasurement, "resourceSummary" | "loadSummary">

const monitoredRoutes: MonitoredRoute[] = [
  {
    id: "character-summary",
    label: "Character Summary",
    path: "/CharacterSummary",
    description: "Dense build summary and disclosure-heavy route.",
    supportsBenchmarks: false,
  },
  {
    id: "talents",
    label: "Talents",
    path: "/talents",
    description: "Talent table with average-damage delta recomputation.",
    supportsBenchmarks: true,
  },
  {
    id: "skills",
    label: "Skills",
    path: "/Skills",
    description: "Skill table with training-driven recomputation.",
    supportsBenchmarks: true,
  },
  {
    id: "damage-calc",
    label: "Damage Calc",
    path: "/DamageCalc",
    description: "Damage calculator input -> output repaint timing.",
    supportsBenchmarks: true,
  },
  {
    id: "healing",
    label: "Healing",
    path: "/Healing",
    description: "Healing calculator input -> output repaint timing.",
    supportsBenchmarks: true,
  },
  {
    id: "world-boss",
    label: "World Boss",
    path: "/WorldBoss",
    description: "Action table refresh after stat updates.",
    supportsBenchmarks: true,
  },
]

const tableHeaderClass = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400"
const tableCellClass = "px-4 py-4 align-top text-sm text-slate-200"

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB"
  }

  const kilobytes = bytes / 1024
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(kilobytes < 100 ? 1 : 0)} KB`
  }

  return `${(kilobytes / 1024).toFixed(2)} MB`
}

function formatMs(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "n/a"
  }

  return `${value.toFixed(value >= 100 ? 0 : 1)} ms`
}

function formatBenchmarkSummary(benchmark: PagePerfBenchmarkResult): string {
  return `${benchmark.averageMs.toFixed(1)} ms avg`
}

function getPaintEntryTime(
  entries: PerformanceEntry[],
  name: "first-paint" | "first-contentful-paint",
): number | null {
  const match = entries.find((entry) => entry.name === name)
  return match ? match.startTime : null
}

function getEncodedBytesForResource(entry: PerformanceResourceTiming): number {
  return Number.isFinite(entry.encodedBodySize) ? entry.encodedBodySize : 0
}

function getTransferBytesForResource(entry: PerformanceResourceTiming): number {
  return Number.isFinite(entry.transferSize) ? entry.transferSize : 0
}

function getDecodedBytesForResource(entry: PerformanceResourceTiming): number {
  return Number.isFinite(entry.decodedBodySize) ? entry.decodedBodySize : 0
}

function getResourceKind(entry: PerformanceResourceTiming): "script" | "style" | "font" | "image" | "other" {
  const lowercaseName = entry.name.toLocaleLowerCase()

  if (entry.initiatorType === "script" || lowercaseName.endsWith(".js") || lowercaseName.includes("/_next/static/chunks/")) {
    return "script"
  }

  if (entry.initiatorType === "css" || lowercaseName.endsWith(".css")) {
    return "style"
  }

  if (
    entry.initiatorType === "font"
    || lowercaseName.endsWith(".woff2")
    || lowercaseName.endsWith(".woff")
    || lowercaseName.endsWith(".ttf")
  ) {
    return "font"
  }

  if (
    entry.initiatorType === "img"
    || lowercaseName.endsWith(".png")
    || lowercaseName.endsWith(".jpg")
    || lowercaseName.endsWith(".jpeg")
    || lowercaseName.endsWith(".webp")
    || lowercaseName.endsWith(".svg")
    || lowercaseName.endsWith(".gif")
  ) {
    return "image"
  }

  return "other"
}

function collectPerformanceData(frameWindow: Window): BaseRouteMeasurement {
  const navigationEntry = frameWindow.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
  const paintEntries = frameWindow.performance.getEntriesByType("paint")
  const resourceEntries = frameWindow.performance.getEntriesByType("resource") as PerformanceResourceTiming[]

  const resourceSummary = resourceEntries.reduce<ResourceSummary>((summary, entry) => {
    const encodedBytes = getEncodedBytesForResource(entry)
    const transferBytes = getTransferBytesForResource(entry)
    const decodedBytes = getDecodedBytesForResource(entry)
    const kind = getResourceKind(entry)

    summary.resourceCount += 1
    summary.totalEncodedBytes += encodedBytes
    summary.totalTransferBytes += transferBytes
    summary.totalDecodedBytes += decodedBytes

    if (kind === "script") {
      summary.scriptEncodedBytes += encodedBytes
    } else if (kind === "style") {
      summary.styleEncodedBytes += encodedBytes
    } else if (kind === "font") {
      summary.fontEncodedBytes += encodedBytes
    } else if (kind === "image") {
      summary.imageEncodedBytes += encodedBytes
    } else {
      summary.otherEncodedBytes += encodedBytes
    }

    return summary
  }, {
    resourceCount: 0,
    htmlEncodedBytes: navigationEntry?.encodedBodySize ?? 0,
    htmlTransferBytes: navigationEntry?.transferSize ?? 0,
    htmlDecodedBytes: navigationEntry?.decodedBodySize ?? 0,
    scriptEncodedBytes: 0,
    styleEncodedBytes: 0,
    fontEncodedBytes: 0,
    imageEncodedBytes: 0,
    otherEncodedBytes: 0,
    totalEncodedBytes: navigationEntry?.encodedBodySize ?? 0,
    totalTransferBytes: navigationEntry?.transferSize ?? 0,
    totalDecodedBytes: navigationEntry?.decodedBodySize ?? 0,
  })

  return {
    resourceSummary,
    loadSummary: {
      domInteractiveMs: navigationEntry?.domInteractive ?? null,
      domContentLoadedMs: navigationEntry?.domContentLoadedEventEnd ?? null,
      loadMs: navigationEntry?.loadEventEnd ?? null,
      firstPaintMs: getPaintEntryTime(paintEntries, "first-paint"),
      firstContentfulPaintMs: getPaintEntryTime(paintEntries, "first-contentful-paint"),
      readyMs: null,
    },
  }
}

function createPerfUrl(path: string): string {
  const url = new URL(path, window.location.origin)
  url.searchParams.set(PAGE_PERF_RUN_QUERY_PARAM, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  return url.toString()
}

function waitInWindow(frameWindow: Window, delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    frameWindow.setTimeout(resolve, delayMs)
  })
}

function measureRepeatedBenchmark(
  name: string,
  description: string,
  sampleCount: number,
  repeatCount: number,
  operation: (sampleIndex: number, repeatIndex: number) => number,
): PagePerfBenchmarkResult {
  const samplesMs: number[] = []
  let checksum = 0

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const startedAt = performance.now()

    for (let repeatIndex = 0; repeatIndex < repeatCount; repeatIndex += 1) {
      checksum += operation(sampleIndex, repeatIndex)
    }

    samplesMs.push((performance.now() - startedAt) / repeatCount)
  }

  if (checksum === Number.MIN_SAFE_INTEGER) {
    console.info("Performance benchmark checksum", checksum)
  }

  return summarizeBenchmark(name, description, samplesMs)
}

function loadIframe(iframe: HTMLIFrameElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      iframe.removeEventListener("load", handleLoad)
      reject(new Error(`Timed out while loading ${src}.`))
    }, 20000)

    const handleLoad = () => {
      window.clearTimeout(timeoutId)
      resolve()
    }

    iframe.addEventListener("load", handleLoad, { once: true })
    iframe.src = src
  })
}

async function runLocalRouteBenchmarks(route: MonitoredRoute): Promise<PagePerfBenchmarkResult[]> {
  if (!route.supportsBenchmarks) {
    return []
  }

  if (route.id === "talents") {
    const [{ talent_data }, buildStatsModule, damageCalcModule] = await Promise.all([
      import("@/app/data/talent_data"),
      import("@/app/lib/buildStats"),
      import("@/app/lib/damageCalc"),
    ])
    const snapshot = buildStatsModule.readBuildSnapshot(window.localStorage)
    const damageState = damageCalcModule.readDamageCalcState(window.localStorage)
    const talentNames = Object.keys(talent_data)

    return [
      measureRepeatedBenchmark(
        "Talent delta recomputation",
        "Recomputes the per-talent average-damage delta map using the current build snapshot.",
        3,
        1,
        (sampleIndex) => {
          const selectedTalentNames = snapshot.selectedTalents
          const stages = buildStatsModule.computeBuildStatStages(snapshot, { selectedTalents: selectedTalentNames })
          const deltaCache = buildStatsModule.prepareBuildStatDeltaCache(snapshot, stages)
          const currentAverage = damageCalcModule.calculateDamage(stages.StatsDmgReady, damageState).average
          let checksum = currentAverage

          for (let index = 0; index < talentNames.length; index += 1) {
            const talentName = talentNames[(index + sampleIndex) % talentNames.length]
            const wasSelected = selectedTalentNames.includes(talentName)

            checksum += damageCalcModule.calculateDamage(
              buildStatsModule.computeTalentToggledDmgReadyStats(deltaCache, talentName, wasSelected),
              damageState,
            ).average
          }

          return checksum
        },
      ),
    ]
  }

  if (route.id === "skills") {
    const [{ skill_data }, buildStatsModule, damageCalcModule] = await Promise.all([
      import("@/app/data/skill_data"),
      import("@/app/lib/buildStats"),
      import("@/app/lib/damageCalc"),
    ])
    const baseSnapshot = buildStatsModule.readBuildSnapshot(window.localStorage)
    const damageState = damageCalcModule.readDamageCalcState(window.localStorage)
    const skillNames = Object.keys(skill_data)

    return [
      measureRepeatedBenchmark(
        "Training update recomputation",
        "Runs the same full skill-delta recomputation path used after training changes.",
        3,
        1,
        (sampleIndex) => {
          const snapshot = {
            ...baseSnapshot,
            selectedTraining: {
              ...baseSnapshot.selectedTraining,
              ATK: (baseSnapshot.selectedTraining.ATK ?? 0) + sampleIndex + 1,
            },
          }
          const selectedBuffNames = snapshot.selectedBuffs
          const stages = buildStatsModule.computeBuildStatStages(snapshot)
          const deltaCache = buildStatsModule.prepareBuildStatDeltaCache(snapshot, stages)
          const currentAverage = damageCalcModule.calculateDamage(stages.StatsDmgReady, damageState).average
          let checksum = currentAverage

          for (let index = 0; index < skillNames.length; index += 1) {
            const skillName = skillNames[(index + sampleIndex) % skillNames.length]
            const toggledSkills = new Set(selectedBuffNames)

            if (toggledSkills.has(skillName)) {
              toggledSkills.delete(skillName)
            } else {
              toggledSkills.add(skillName)
            }

            checksum += damageCalcModule.calculateDamage(
              buildStatsModule.computeBuffSelectionDmgReadyStats(deltaCache, toggledSkills),
              damageState,
            ).average
          }

          return checksum
        },
      ),
    ]
  }

  if (route.id === "damage-calc") {
    const [buildStatsModule, damageCalcModule] = await Promise.all([
      import("@/app/lib/buildStats"),
      import("@/app/lib/damageCalc"),
    ])
    const snapshot = buildStatsModule.readBuildSnapshot(window.localStorage)
    const stats = buildStatsModule.computeBuildStatStages(snapshot).StatsDmgReady
    const damageState = damageCalcModule.readDamageCalcState(window.localStorage)

    return [
      measureRepeatedBenchmark(
        "Damage calculation update",
        "Measures calculateDamage with varied skill-damage inputs using the current build stats.",
        6,
        40,
        (sampleIndex, repeatIndex) => {
          const result = damageCalcModule.calculateDamage(stats, {
            ...damageState,
            inputs: {
              ...damageState.inputs,
              skillDmg: damageState.inputs.skillDmg + sampleIndex + repeatIndex,
            },
          })

          return result.average + result.crit + result.dotCrit
        },
      ),
    ]
  }

  if (route.id === "healing") {
    const [buildStatsModule, healingCalcModule, threatModule] = await Promise.all([
      import("@/app/lib/buildStats"),
      import("@/app/lib/healingCalc"),
      import("@/app/lib/threat"),
    ])
    const snapshot = buildStatsModule.readBuildSnapshot(window.localStorage)
    const stages = buildStatsModule.computeBuildStatStages(snapshot)
    const healingState = healingCalcModule.readHealingCalcState(window.localStorage)
    const threatBonusMultiplier = threatModule.getThreatBonusMultiplier(stages.StatsDmgReady)

    return [
      measureRepeatedBenchmark(
        "Healing calculation update",
        "Measures calculateHealing with varied skill-heal inputs using the current build stats.",
        6,
        60,
        (sampleIndex, repeatIndex) => {
          const result = healingCalcModule.calculateHealing({
            baseStat: healingState.baseStat,
            totalStat: healingState.totalStat,
            skillHealPercent: healingState.skillHealPercent + sampleIndex + repeatIndex,
            skillFlatHeal: healingState.skillFlatHeal,
            critChancePercent: healingState.critChancePercent,
            critDamagePercent: healingState.critDamagePercent,
            overdrivePercent: healingState.overdrivePercent,
            canCrit: healingState.canCrit,
            threatPercent: healingState.threatPercent,
            threatBonusMultiplier,
          })

          return result.average + result.crit + result.threatAverage
        },
      ),
    ]
  }

  if (route.id === "world-boss") {
    const [buildStatsModule, worldBossModule] = await Promise.all([
      import("@/app/lib/buildStats"),
      import("@/app/lib/worldBoss"),
    ])
    const snapshot = buildStatsModule.readBuildSnapshot(window.localStorage)
    const stages = buildStatsModule.computeBuildStatStages(snapshot)
    const baseUserStats = worldBossModule.getWorldBossUserStatsFromBuildStages(stages)

    return [
      measureRepeatedBenchmark(
        "World Boss action refresh",
        "Measures action-range recalculation with varied ATK values based on the current build.",
        6,
        120,
        (sampleIndex, repeatIndex) => {
          const actionResults = worldBossModule.calculateWorldBossActions({
            ...baseUserStats,
            ATK: baseUserStats.ATK + sampleIndex + repeatIndex,
          })

          return actionResults.reduce((sum, result) => sum + result.average, 0)
        },
      ),
    ]
  }

  return []
}

async function measureRoute(
  route: MonitoredRoute,
  iframe: HTMLIFrameElement,
): Promise<RouteMeasurement> {
  const src = createPerfUrl(route.path)

  await loadIframe(iframe, src)

  const frameWindow = iframe.contentWindow

  if (!frameWindow) {
    throw new Error(`Unable to access the iframe window for ${route.label}.`)
  }

  await waitInWindow(frameWindow, 50)

  const baseMeasurement = collectPerformanceData(frameWindow)
  const readyMs: number | null = null
  let benchmarks: PagePerfBenchmarkResult[] = []
  let benchmarkError: string | null = null

  if (route.supportsBenchmarks) {
    try {
      benchmarks = await runLocalRouteBenchmarks(route)
    } catch (error) {
      benchmarkError = error instanceof Error ? error.message : "Unable to run route-specific benchmarks."
    }
  }

  return {
    route,
    resourceSummary: baseMeasurement.resourceSummary,
    loadSummary: {
      ...baseMeasurement.loadSummary,
      readyMs,
    },
    benchmarks,
    benchmarkError,
    measuredAt: new Date().toISOString(),
  }
}

export default function PerformancePage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [resultsById, setResultsById] = useState<Record<string, RouteMeasurement>>({})
  const [statusById, setStatusById] = useState<Record<string, RouteStatus>>(() => (
    monitoredRoutes.reduce<Record<string, RouteStatus>>((result, route) => {
      result[route.id] = { state: "queued", message: "Waiting to run." }
      return result
    }, {})
  ))
  const [logLines, setLogLines] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null)
  const runSequenceRef = useRef(0)

  const appendLog = useCallback((message: string) => {
    setLogLines((current) => [...current, message].slice(-18))
  }, [])

  const runBenchmarks = useCallback(async () => {
    const iframe = iframeRef.current

    if (!iframe) {
      return
    }

    const sequenceId = runSequenceRef.current + 1
    runSequenceRef.current = sequenceId
    setIsRunning(true)
    setActiveRouteId(null)
    setResultsById({})
    setStatusById(monitoredRoutes.reduce<Record<string, RouteStatus>>((result, route) => {
      result[route.id] = { state: "queued", message: "Waiting to run." }
      return result
    }, {}))
    setLogLines([`Starting benchmark run for ${monitoredRoutes.length} routes.`])

    for (const route of monitoredRoutes) {
      if (runSequenceRef.current !== sequenceId) {
        return
      }

      setActiveRouteId(route.id)
      setStatusById((current) => ({
        ...current,
        [route.id]: {
          state: "running",
          message: `Measuring ${route.label}...`,
        },
      }))
      appendLog(`Loading ${route.label} (${route.path}).`)

      try {
        const measurement = await measureRoute(route, iframe)

        if (runSequenceRef.current !== sequenceId) {
          return
        }

        startTransition(() => {
          setResultsById((current) => ({
            ...current,
            [route.id]: measurement,
          }))
        })
        setStatusById((current) => ({
          ...current,
          [route.id]: {
            state: measurement.benchmarkError ? "warning" : "completed",
            message: measurement.benchmarkError
              ? `Load and size metrics collected. Benchmark skipped: ${measurement.benchmarkError}`
              : measurement.benchmarks.length > 0
                ? `${measurement.benchmarks.length} benchmark${measurement.benchmarks.length === 1 ? "" : "s"} collected.`
                : "Load and size metrics collected.",
          },
        }))
        appendLog(
          `${route.label}: ${formatBytes(measurement.resourceSummary.totalEncodedBytes)}, load ${formatMs(measurement.loadSummary.loadMs)}${measurement.benchmarkError ? `, benchmark skipped` : ""}.`,
        )
      } catch (error) {
        if (runSequenceRef.current !== sequenceId) {
          return
        }

        const message = error instanceof Error ? error.message : "Unknown benchmark failure."
        setStatusById((current) => ({
          ...current,
          [route.id]: {
            state: "error",
            message,
          },
        }))
        appendLog(`${route.label}: ${message}`)
      }
    }

    setActiveRouteId(null)
    setIsRunning(false)
    appendLog("Benchmark run complete.")
  }, [appendLog])

  useEffect(() => {
    void runBenchmarks()
  }, [runBenchmarks])

  const orderedResults = useMemo(
    () => monitoredRoutes
      .map((route) => resultsById[route.id])
      .filter((measurement): measurement is RouteMeasurement => Boolean(measurement)),
    [resultsById],
  )
  const largestRoute = useMemo(() => {
    return orderedResults.reduce<RouteMeasurement | null>((largest, measurement) => {
      if (!largest || measurement.resourceSummary.totalEncodedBytes > largest.resourceSummary.totalEncodedBytes) {
        return measurement
      }

      return largest
    }, null)
  }, [orderedResults])
  const slowestLoadRoute = useMemo(() => {
    return orderedResults.reduce<RouteMeasurement | null>((slowest, measurement) => {
      const currentLoad = measurement.loadSummary.loadMs ?? -1
      const slowestLoad = slowest?.loadSummary.loadMs ?? -1

      if (!slowest || currentLoad > slowestLoad) {
        return measurement
      }

      return slowest
    }, null)
  }, [orderedResults])
  const slowestBenchmark = useMemo(() => {
    return orderedResults.reduce<{ route: MonitoredRoute; benchmark: PagePerfBenchmarkResult } | null>((slowest, measurement) => {
      for (const benchmark of measurement.benchmarks) {
        if (!slowest || benchmark.averageMs > slowest.benchmark.averageMs) {
          slowest = {
            route: measurement.route,
            benchmark,
          }
        }
      }

      return slowest
    }, null)
  }, [orderedResults])
  const averageEncodedBytes = useMemo(() => {
    if (orderedResults.length === 0) {
      return 0
    }

    const totalBytes = orderedResults.reduce((sum, measurement) => sum + measurement.resourceSummary.totalEncodedBytes, 0)
    return totalBytes / orderedResults.length
  }, [orderedResults])

  return (
    <div className="min-h-[calc(100vh-var(--top-nav-height))] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex w-full flex-col gap-6">
        <section className="rounded-[28px] border border-slate-800/80 bg-slate-950/70 p-6 shadow-[0_22px_70px_rgba(2,6,23,0.42)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                Runtime Performance Dashboard
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">Performance</h1>
                <p className="max-w-3xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                  This page loads representative routes in a hidden iframe for size and navigation timing, then runs
                  route-specific calculation benchmarks locally against your current saved build state.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Environment</div>
                <div className="mt-1 font-semibold text-slate-100">
                  {process.env.NODE_ENV === "production" ? "Production build" : "Development build"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void runBenchmarks()}
                disabled={isRunning}
                className="rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunning ? "Running..." : "Run Benchmarks"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Routes Tested</div>
              <div className="mt-2 text-2xl font-semibold text-slate-50">{orderedResults.length}/{monitoredRoutes.length}</div>
              <div className="mt-1 text-sm text-slate-400">Current run progress</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Average Encoded Size</div>
              <div className="mt-2 text-2xl font-semibold text-slate-50">{formatBytes(averageEncodedBytes)}</div>
              <div className="mt-1 text-sm text-slate-400">HTML + loaded resources</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Largest Route</div>
              <div className="mt-2 text-lg font-semibold text-slate-50">{largestRoute?.route.label ?? "n/a"}</div>
              <div className="mt-1 text-sm text-slate-400">
                {largestRoute ? formatBytes(largestRoute.resourceSummary.totalEncodedBytes) : "No data yet"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Slowest Result</div>
              <div className="mt-2 text-lg font-semibold text-slate-50">
                {slowestBenchmark?.route.label ?? slowestLoadRoute?.route.label ?? "n/a"}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {slowestBenchmark
                  ? `${slowestBenchmark.benchmark.name}: ${formatMs(slowestBenchmark.benchmark.averageMs)}`
                  : slowestLoadRoute
                    ? `Load: ${formatMs(slowestLoadRoute.loadSummary.loadMs)}`
                    : "No data yet"}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm leading-6 text-amber-100/90">
            {process.env.NODE_ENV === "production"
              ? "These numbers reflect the currently running production build and the browser's cache state."
              : "Development mode includes HMR and dev-only chunks, so bundle sizes and load timings will be noisier than production."}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="overflow-hidden rounded-[28px] border border-slate-800/80 bg-slate-950/70 shadow-[0_22px_70px_rgba(2,6,23,0.42)] backdrop-blur">
            <div className="border-b border-slate-800/80 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-50">Route Measurements</h2>
              <p className="mt-1 text-sm text-slate-400">Load metrics come from iframe route loads. Benchmark timings come from local calculator-logic runs using the same current build data.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-950/90">
                  <tr className="border-b border-slate-800/80">
                    <th className={tableHeaderClass}>Route</th>
                    <th className={tableHeaderClass}>Size</th>
                    <th className={tableHeaderClass}>Load</th>
                    <th className={tableHeaderClass}>Benchmarks</th>
                    <th className={tableHeaderClass}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoredRoutes.map((route) => {
                    const measurement = resultsById[route.id]
                    const status = statusById[route.id]

                    return (
                      <tr key={route.id} className="border-b border-slate-900/80 last:border-b-0">
                        <td className={tableCellClass}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold text-slate-50">
                                <Link href={route.path} className="transition hover:text-sky-300">
                                  {route.label}
                                </Link>
                              </div>
                              <div className="mt-1 max-w-sm text-xs leading-5 text-slate-400">{route.description}</div>
                            </div>
                            {activeRouteId === route.id ? (
                              <span className="rounded-full border border-sky-500/35 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
                                Running
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className={tableCellClass}>
                          {measurement ? (
                            <div className="space-y-1.5 text-xs leading-5 text-slate-300">
                              <div>Total encoded: <span className="font-semibold text-slate-100">{formatBytes(measurement.resourceSummary.totalEncodedBytes)}</span></div>
                              <div>Transfer: <span className="font-semibold text-slate-100">{formatBytes(measurement.resourceSummary.totalTransferBytes)}</span></div>
                              <div>HTML: <span className="font-semibold text-slate-100">{formatBytes(measurement.resourceSummary.htmlEncodedBytes)}</span></div>
                              <div>Scripts: <span className="font-semibold text-slate-100">{formatBytes(measurement.resourceSummary.scriptEncodedBytes)}</span></div>
                              <div>Styles/Fonts: <span className="font-semibold text-slate-100">{formatBytes(measurement.resourceSummary.styleEncodedBytes + measurement.resourceSummary.fontEncodedBytes)}</span></div>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className={tableCellClass}>
                          {measurement ? (
                            <div className="space-y-1.5 text-xs leading-5 text-slate-300">
                              <div>FP: <span className="font-semibold text-slate-100">{formatMs(measurement.loadSummary.firstPaintMs)}</span></div>
                              <div>FCP: <span className="font-semibold text-slate-100">{formatMs(measurement.loadSummary.firstContentfulPaintMs)}</span></div>
                              <div>DOM ready: <span className="font-semibold text-slate-100">{formatMs(measurement.loadSummary.domContentLoadedMs)}</span></div>
                              <div>Load: <span className="font-semibold text-slate-100">{formatMs(measurement.loadSummary.loadMs)}</span></div>
                              <div>Benchmark ready: <span className="font-semibold text-slate-100">{formatMs(measurement.loadSummary.readyMs)}</span></div>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className={tableCellClass}>
                          {measurement ? (
                            measurement.benchmarks.length > 0 ? (
                              <div className="space-y-2 text-xs leading-5 text-slate-300">
                                {measurement.benchmarks.map((benchmark) => (
                                  <div key={benchmark.name} className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">
                                    <div className="font-semibold text-slate-100">{benchmark.name}</div>
                                    <div className="mt-1 text-slate-400">{benchmark.description}</div>
                                    <div className="mt-2 text-slate-300">
                                      {formatBenchmarkSummary(benchmark)} | median {formatMs(benchmark.medianMs)} | range {formatMs(benchmark.minMs)} to {formatMs(benchmark.maxMs)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : measurement.benchmarkError ? (
                              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
                                {measurement.benchmarkError}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">No route-specific benchmark</span>
                            )
                          ) : (
                            <span className="text-sm text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className={tableCellClass}>
                          <div
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                              status?.state === "completed"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                                : status?.state === "running"
                                  ? "border-sky-500/30 bg-sky-500/10 text-sky-100"
                                  : status?.state === "warning"
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
                                  : status?.state === "error"
                                    ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                                    : "border-slate-700 bg-slate-900/70 text-slate-300"
                            }`}
                          >
                            {status?.state ?? "queued"}
                          </div>
                          <div className="mt-2 max-w-xs text-xs leading-5 text-slate-400">{status?.message}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-800/80 bg-slate-950/70 p-5 shadow-[0_22px_70px_rgba(2,6,23,0.42)] backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-50">Run Log</h2>
              <div className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                {logLines.length > 0 ? (
                  logLines.map((line, index) => (
                    <div key={`${line}-${index}`} className="rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-2">
                      {line}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-2 text-slate-500">
                    Waiting to start.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-800/80 bg-slate-950/70 p-5 shadow-[0_22px_70px_rgba(2,6,23,0.42)] backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-50">Tracked Routes</h2>
              <div className="mt-4 space-y-3">
                {monitoredRoutes.map((route) => (
                  <div key={route.id} className="rounded-xl border border-slate-800 bg-slate-950/55 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={route.path} className="font-semibold text-slate-100 transition hover:text-sky-300">
                        {route.label}
                      </Link>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                        route.supportsBenchmarks
                          ? "border-sky-500/30 bg-sky-500/10 text-sky-200"
                          : "border-slate-700 bg-slate-900/80 text-slate-300"
                      }`}>
                        {route.supportsBenchmarks ? "Load + update" : "Load only"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">{route.path}</div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </div>

      <iframe
        ref={iframeRef}
        title="Performance benchmark frame"
        className="pointer-events-none fixed -left-[9999px] top-0 h-[900px] w-[1440px] opacity-0"
      />
    </div>
  )
}
