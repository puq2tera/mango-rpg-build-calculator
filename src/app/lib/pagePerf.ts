"use client"

import { useEffect, useLayoutEffect, useRef } from "react"

export const PAGE_PERF_RUN_QUERY_PARAM = "__perfRun"
export const PAGE_PERF_BRIDGE_READY_MESSAGE_TYPE = "mango:page-perf-bridge-ready"
export const PAGE_PERF_BRIDGE_UPDATED_MESSAGE_TYPE = "mango:page-perf-bridge-updated"
export const PAGE_PERF_RUN_EVENT = "mango:page-perf:run"
export const PAGE_PERF_RESULT_EVENT = "mango:page-perf:result"
export const PAGE_PERF_PAGE_ID_ATTRIBUTE = "data-mango-page-perf-page-id"
export const PAGE_PERF_PAGE_LABEL_ATTRIBUTE = "data-mango-page-perf-page-label"
export const PAGE_PERF_BRIDGE_ATTRIBUTE = "data-mango-page-perf-bridge"
export const PAGE_PERF_READY_ATTRIBUTE = "data-mango-page-perf-ready"

export type PagePerfBenchmarkResult = {
  name: string
  description: string
  averageMs: number
  medianMs: number
  minMs: number
  maxMs: number
  iterationCount: number
  samplesMs: number[]
}

export type PagePerfBridge = {
  pageId: string
  pageLabel: string
  isReady: () => boolean
  runBenchmarks: () => Promise<PagePerfBenchmarkResult[]>
}

export type PagePerfBridgeMessage = {
  type: typeof PAGE_PERF_BRIDGE_READY_MESSAGE_TYPE | typeof PAGE_PERF_BRIDGE_UPDATED_MESSAGE_TYPE
  pageId: string
  pageLabel: string
}

export type PagePerfRunEventDetail = {
  requestId: string
}

export type PagePerfResultEventDetail = {
  requestId: string
  pageId: string
  pageLabel: string
  benchmarks: PagePerfBenchmarkResult[]
  error: string | null
}

type UsePagePerfBridgeOptions = {
  pageId: string
  pageLabel: string
  isReady: boolean
  runBenchmarks: () => Promise<PagePerfBenchmarkResult[]>
}

declare global {
  interface Window {
    __MANGO_PAGE_PERF__?: PagePerfBridge
  }
}

export function isPagePerfRunSearch(search: string): boolean {
  return new URLSearchParams(search).has(PAGE_PERF_RUN_QUERY_PARAM)
}

export function isPagePerfRun(): boolean {
  return typeof window !== "undefined" && isPagePerfRunSearch(window.location.search)
}

export async function waitForAnimationFrames(frameCount = 1): Promise<void> {
  for (let index = 0; index < frameCount; index += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }
}

export function waitForCondition(
  predicate: () => boolean,
  timeoutMs = 5000,
  intervalMs = 16,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = performance.now()

    const check = () => {
      if (predicate()) {
        resolve()
        return
      }

      if ((performance.now() - start) >= timeoutMs) {
        reject(new Error(`Timed out after ${timeoutMs}ms while waiting for a benchmark update.`))
        return
      }

      window.setTimeout(check, intervalMs)
    }

    check()
  })
}

export function summarizeBenchmark(
  name: string,
  description: string,
  samplesMs: number[],
): PagePerfBenchmarkResult {
  const sortedSamples = [...samplesMs].sort((left, right) => left - right)
  const totalMs = samplesMs.reduce((sum, sample) => sum + sample, 0)
  const middleIndex = Math.floor(sortedSamples.length / 2)
  const medianMs = sortedSamples.length === 0
    ? 0
    : sortedSamples.length % 2 === 0
      ? (sortedSamples[middleIndex - 1] + sortedSamples[middleIndex]) / 2
      : sortedSamples[middleIndex]

  return {
    name,
    description,
    averageMs: samplesMs.length === 0 ? 0 : totalMs / samplesMs.length,
    medianMs,
    minMs: sortedSamples[0] ?? 0,
    maxMs: sortedSamples[sortedSamples.length - 1] ?? 0,
    iterationCount: samplesMs.length,
    samplesMs,
  }
}

export function usePagePerfBridge({
  pageId,
  pageLabel,
  isReady,
  runBenchmarks,
}: UsePagePerfBridgeOptions): void {
  const readyRef = useRef(isReady)
  const runBenchmarksRef = useRef(runBenchmarks)

  useEffect(() => {
    readyRef.current = isReady
    runBenchmarksRef.current = runBenchmarks
  }, [isReady, runBenchmarks])

  useLayoutEffect(() => {
    if (!isPagePerfRun()) {
      return
    }

    const root = document.documentElement
    const notifyParent = (type: PagePerfBridgeMessage["type"]) => {
      const message: PagePerfBridgeMessage = {
        type,
        pageId,
        pageLabel,
      }

      window.parent.postMessage(message, window.location.origin)
    }

    const bridge: PagePerfBridge = {
      pageId,
      pageLabel,
      isReady: () => readyRef.current,
      runBenchmarks: () => runBenchmarksRef.current(),
    }

    window.__MANGO_PAGE_PERF__ = bridge
    root.setAttribute(PAGE_PERF_PAGE_ID_ATTRIBUTE, pageId)
    root.setAttribute(PAGE_PERF_PAGE_LABEL_ATTRIBUTE, pageLabel)
    root.setAttribute(PAGE_PERF_BRIDGE_ATTRIBUTE, "1")
    notifyParent(PAGE_PERF_BRIDGE_READY_MESSAGE_TYPE)

    const handleRun = async (event: Event) => {
      const detail = (event as CustomEvent<PagePerfRunEventDetail>).detail

      try {
        const benchmarks = await runBenchmarksRef.current()
        const resultDetail: PagePerfResultEventDetail = {
          requestId: detail.requestId,
          pageId,
          pageLabel,
          benchmarks,
          error: null,
        }

        window.dispatchEvent(new CustomEvent<PagePerfResultEventDetail>(PAGE_PERF_RESULT_EVENT, {
          detail: resultDetail,
        }))
      } catch (error) {
        const resultDetail: PagePerfResultEventDetail = {
          requestId: detail.requestId,
          pageId,
          pageLabel,
          benchmarks: [],
          error: error instanceof Error ? error.message : "Unknown benchmark failure.",
        }

        window.dispatchEvent(new CustomEvent<PagePerfResultEventDetail>(PAGE_PERF_RESULT_EVENT, {
          detail: resultDetail,
        }))
      }
    }

    window.addEventListener(PAGE_PERF_RUN_EVENT, handleRun as EventListener)

    return () => {
      window.removeEventListener(PAGE_PERF_RUN_EVENT, handleRun as EventListener)

      if (window.__MANGO_PAGE_PERF__ === bridge) {
        delete window.__MANGO_PAGE_PERF__
      }

      root.removeAttribute(PAGE_PERF_PAGE_ID_ATTRIBUTE)
      root.removeAttribute(PAGE_PERF_PAGE_LABEL_ATTRIBUTE)
      root.removeAttribute(PAGE_PERF_BRIDGE_ATTRIBUTE)
      root.removeAttribute(PAGE_PERF_READY_ATTRIBUTE)
    }
  }, [pageId, pageLabel])

  useLayoutEffect(() => {
    if (!isPagePerfRun() || !window.__MANGO_PAGE_PERF__) {
      return
    }

    document.documentElement.setAttribute(PAGE_PERF_READY_ATTRIBUTE, isReady ? "1" : "0")

    const message: PagePerfBridgeMessage = {
      type: PAGE_PERF_BRIDGE_UPDATED_MESSAGE_TYPE,
      pageId,
      pageLabel,
    }

    window.parent.postMessage(message, window.location.origin)
  }, [isReady, pageId, pageLabel, runBenchmarks])
}
