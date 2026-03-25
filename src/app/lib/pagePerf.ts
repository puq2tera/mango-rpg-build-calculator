"use client"

import { useEffect, useRef } from "react"

export const PAGE_PERF_RUN_QUERY_PARAM = "__perfRun"
export const PAGE_PERF_BRIDGE_READY_MESSAGE_TYPE = "mango:page-perf-bridge-ready"
export const PAGE_PERF_BRIDGE_UPDATED_MESSAGE_TYPE = "mango:page-perf-bridge-updated"

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

  useEffect(() => {
    if (!isPagePerfRun()) {
      return
    }

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
    notifyParent(PAGE_PERF_BRIDGE_READY_MESSAGE_TYPE)

    return () => {
      if (window.__MANGO_PAGE_PERF__ === bridge) {
        delete window.__MANGO_PAGE_PERF__
      }
    }
  }, [pageId, pageLabel])

  useEffect(() => {
    if (!isPagePerfRun() || !window.__MANGO_PAGE_PERF__) {
      return
    }

    const message: PagePerfBridgeMessage = {
      type: PAGE_PERF_BRIDGE_UPDATED_MESSAGE_TYPE,
      pageId,
      pageLabel,
    }

    window.parent.postMessage(message, window.location.origin)
  }, [isReady, pageId, pageLabel, runBenchmarks])
}
