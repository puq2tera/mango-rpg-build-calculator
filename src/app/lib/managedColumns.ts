"use client"

import { arrayMove } from "@dnd-kit/sortable"
import { useEffect, useState } from "react"

export type ManagedColumnDefinition<T extends string = string> = {
  id: T
  label: string
  title?: string
  defaultWidth: number
  minWidth?: number
  defaultCollapsed?: boolean
}

export type ManagedColumn<T extends string = string> = ManagedColumnDefinition<T> & {
  width: number
  renderWidth: number
  collapsed: boolean
}

type StoredColumnLayout = {
  order: string[]
  collapsed: string[]
  widths: Record<string, number>
  hidden?: string[]
}

const DEFAULT_MIN_WIDTH = 48
const MAX_COLUMN_WIDTH = 1600
const COLLAPSED_COLUMN_WIDTH = 16

function clampWidth(value: number, minWidth: number): number {
  if (!Number.isFinite(value)) return minWidth
  return Math.min(MAX_COLUMN_WIDTH, Math.max(minWidth, Math.round(value)))
}

function getDefaultLayout<T extends string>(definitions: readonly ManagedColumnDefinition<T>[]): StoredColumnLayout {
  return {
    order: definitions.map((definition) => definition.id),
    collapsed: definitions
      .filter((definition) => definition.defaultCollapsed)
      .map((definition) => definition.id),
    widths: Object.fromEntries(
      definitions.map((definition) => [
        definition.id,
        clampWidth(definition.defaultWidth, definition.minWidth ?? DEFAULT_MIN_WIDTH),
      ])
    ),
  }
}

function normalizeStoredLayout<T extends string>(
  definitions: readonly ManagedColumnDefinition<T>[],
  raw: unknown,
): StoredColumnLayout {
  const defaults = getDefaultLayout(definitions)
  const definitionIds = new Set<string>(definitions.map((definition) => definition.id))
  const stored = typeof raw === "object" && raw !== null ? raw as Partial<StoredColumnLayout> : {}

  const order: string[] = []
  for (const id of Array.isArray(stored.order) ? stored.order : []) {
    if (typeof id !== "string" || !definitionIds.has(id) || order.includes(id)) continue
    order.push(id)
  }
  for (const definition of definitions) {
    if (!order.includes(definition.id)) {
      order.push(definition.id)
    }
  }

  const collapsed = Array.isArray(stored.collapsed)
    ? stored.collapsed.filter((id): id is string => typeof id === "string" && definitionIds.has(id))
    : Array.isArray(stored.hidden)
      ? stored.hidden.filter((id): id is string => typeof id === "string" && definitionIds.has(id))
      : defaults.collapsed

  const widths = definitions.reduce<Record<string, number>>((result, definition) => {
    const value = stored.widths?.[definition.id]
    result[definition.id] = clampWidth(
      typeof value === "number" ? value : defaults.widths[definition.id],
      definition.minWidth ?? DEFAULT_MIN_WIDTH,
    )
    return result
  }, {})

  return { order, collapsed, widths }
}

export function useManagedColumns<T extends string>(
  storageKey: string,
  definitions: readonly ManagedColumnDefinition<T>[],
) {
  const [isReady, setIsReady] = useState(false)
  const [order, setOrder] = useState<string[]>(() => definitions.map((definition) => definition.id))
  const [collapsed, setCollapsed] = useState<string[]>(
    () => definitions.filter((definition) => definition.defaultCollapsed).map((definition) => definition.id),
  )
  const [widths, setWidths] = useState<Record<string, number>>(
    () => getDefaultLayout(definitions).widths,
  )

  useEffect(() => {
    const storedValue = localStorage.getItem(storageKey)

    if (!storedValue) {
      const defaults = getDefaultLayout(definitions)
      setOrder(defaults.order)
      setCollapsed(defaults.collapsed)
      setWidths(defaults.widths)
      setIsReady(true)
      return
    }

    try {
      const parsed = JSON.parse(storedValue)
      const normalized = normalizeStoredLayout(definitions, parsed)
      setOrder(normalized.order)
      setCollapsed(normalized.collapsed)
      setWidths(normalized.widths)
    } catch {
      const defaults = getDefaultLayout(definitions)
      setOrder(defaults.order)
      setCollapsed(defaults.collapsed)
      setWidths(defaults.widths)
    }

    setIsReady(true)
  }, [definitions, storageKey])

  useEffect(() => {
    if (!isReady) return

    const payload: StoredColumnLayout = {
      order,
      collapsed,
      widths,
    }
    localStorage.setItem(storageKey, JSON.stringify(payload))
  }, [collapsed, isReady, order, storageKey, widths])

  const definitionById = definitions.reduce<Record<string, ManagedColumnDefinition<T>>>((result, definition) => {
    result[definition.id] = definition
    return result
  }, {})

  const collapsedSet = new Set(collapsed)
  const allColumns = order
    .map((id) => {
      const definition = definitionById[id]
      if (!definition) return null

      return {
        ...definition,
        width: widths[id] ?? definition.defaultWidth,
        renderWidth: collapsedSet.has(id) ? COLLAPSED_COLUMN_WIDTH : (widths[id] ?? definition.defaultWidth),
        collapsed: collapsedSet.has(id),
      }
    })
    .filter((column): column is ManagedColumn<T> => column !== null)

  const visibleColumns = allColumns
  const gridTemplateColumns = visibleColumns.map((column) => `${column.renderWidth}px`).join(" ")

  const setColumnCollapsed = (id: T, shouldCollapse: boolean) => {
    setCollapsed((currentCollapsed) => {
      const isCollapsed = currentCollapsed.includes(id)

      if (!shouldCollapse) {
        return isCollapsed ? currentCollapsed.filter((columnId) => columnId !== id) : currentCollapsed
      }

      if (isCollapsed) return currentCollapsed

      const expandedCount = definitions.length - currentCollapsed.length
      if (expandedCount <= 1) return currentCollapsed

      return [...currentCollapsed, id]
    })
  }

  const setColumnWidth = (id: T, value: number) => {
    if (!Number.isFinite(value)) return

    const definition = definitionById[id]
    if (!definition) return

    setWidths((currentWidths) => ({
      ...currentWidths,
      [id]: clampWidth(value, definition.minWidth ?? DEFAULT_MIN_WIDTH),
    }))
  }

  const reset = () => {
    const defaults = getDefaultLayout(definitions)
    setOrder(defaults.order)
    setCollapsed(defaults.collapsed)
    setWidths(defaults.widths)
  }

  const reorderVisibleColumns = (activeId: T, overId: T) => {
    if (activeId === overId) return

    setOrder((currentOrder) => {
      const oldIndex = currentOrder.indexOf(activeId)
      const newIndex = currentOrder.indexOf(overId)

      if (oldIndex < 0 || newIndex < 0) {
        return currentOrder
      }

      return arrayMove(currentOrder, oldIndex, newIndex)
    })
  }

  return {
    isReady,
    allColumns,
    visibleColumns,
    gridTemplateColumns,
    setColumnCollapsed,
    reorderVisibleColumns,
    setColumnWidth,
    reset,
  }
}
