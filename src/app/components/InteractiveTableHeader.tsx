"use client"

import { useEffect, useState } from "react"
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ManagedColumn } from "@/app/lib/managedColumns"

type InteractiveTableHeaderProps<T extends string> = {
  allColumns: ManagedColumn<T>[]
  visibleColumns: ManagedColumn<T>[]
  gridTemplateColumns: string
  onSetColumnCollapsed: (id: T, collapsed: boolean) => void
  onReorderColumns: (activeId: T, overId: T) => void
  onSetColumnWidth: (id: T, width: number) => void
}

type ResizeState<T extends string> = {
  id: T
  startX: number
  startWidth: number
}

type HeaderCellProps<T extends string> = {
  column: ManagedColumn<T>
  canCollapse: boolean
  onToggleCollapsed: (id: T, collapsed: boolean) => void
  onResizeStart: (id: T, startX: number, startWidth: number) => void
}

function SortableHeaderCell<T extends string>({
  column,
  canCollapse,
  onToggleCollapsed,
  onResizeStart,
}: HeaderCellProps<T>) {
  const sortable = useSortable({ id: column.id })
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable

  if (column.collapsed) {
    return (
      <button
        ref={setNodeRef}
        type="button"
        onClick={() => onToggleCollapsed(column.id, false)}
        onContextMenu={(event) => {
          event.preventDefault()
          onToggleCollapsed(column.id, false)
        }}
        className="relative flex items-center justify-center border-r border-slate-600 bg-slate-950/70 text-[10px] text-slate-300 hover:bg-slate-800 last:border-r-0"
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.7 : 1,
        }}
        title={`Expand ${column.label}`}
      >
        <span className="pointer-events-none select-none">+</span>
      </button>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
      }}
      className="relative flex min-w-0 items-stretch border-r border-slate-600 last:border-r-0"
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        onContextMenu={(event) => {
          event.preventDefault()
          if (canCollapse) {
            onToggleCollapsed(column.id, true)
          }
        }}
        className="flex min-w-0 flex-1 cursor-grab items-center justify-center px-2 py-2 font-bold whitespace-nowrap active:cursor-grabbing"
        title={column.title ?? `${column.label}: drag to reorder, right-click to collapse`}
      >
        <span className="truncate">{column.label}</span>
      </button>

      <div
        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-sky-400/20"
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onResizeStart(column.id, event.clientX, column.width)
        }}
        title={`${column.label}: drag divider to resize`}
      />
    </div>
  )
}

export function InteractiveTableHeader<T extends string>({
  allColumns,
  visibleColumns,
  gridTemplateColumns,
  onSetColumnCollapsed,
  onReorderColumns,
  onSetColumnWidth,
}: InteractiveTableHeaderProps<T>) {
  const [resizeState, setResizeState] = useState<ResizeState<T> | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  useEffect(() => {
    if (!resizeState) return

    const previousUserSelect = document.body.style.userSelect
    const previousCursor = document.body.style.cursor
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    const handlePointerMove = (event: PointerEvent) => {
      const nextWidth = resizeState.startWidth + (event.clientX - resizeState.startX)
      onSetColumnWidth(resizeState.id, nextWidth)
    }

    const stopResizing = () => {
      setResizeState(null)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", stopResizing)
    window.addEventListener("pointercancel", stopResizing)

    return () => {
      document.body.style.userSelect = previousUserSelect
      document.body.style.cursor = previousCursor
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", stopResizing)
      window.removeEventListener("pointercancel", stopResizing)
    }
  }, [onSetColumnWidth, resizeState])

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return
    onReorderColumns(event.active.id as T, event.over.id as T)
  }

  return (
    <div className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleColumns.map((column) => column.id)} strategy={horizontalListSortingStrategy}>
          <div className="grid min-w-full w-max gap-x-0" style={{ gridTemplateColumns }}>
            {visibleColumns.map((column) => (
              <SortableHeaderCell
                key={column.id}
                column={column}
                canCollapse={visibleColumns.length > 1}
                onToggleCollapsed={onSetColumnCollapsed}
                onResizeStart={(id, startX, startWidth) => setResizeState({ id, startX, startWidth })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
