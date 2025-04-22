"use client"

import { useEffect, useState } from "react"
import talent_data from "../data/talent_data"

const STORAGE_KEY = "selectedTalents"
type ToggleButtonProps = {
    id: string
    label: string
  }

export default function ToggleButton({ id, label }: ToggleButtonProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const talent_info = talent_data[label] 

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            setSelected(new Set(JSON.parse(stored)))
          } catch {}
        }
      }, [])
      
      useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]))
      }, [selected])
    
      const isActive = selected.has(id)
    
      const toggle = () => {
        setSelected((prev) => {
          const updated = new Set(prev)
          if (updated.has(id)) {
            updated.delete(id)
          } else {
            updated.add(id)
          }
          return updated
        })
      }

      const maxLabelLength = Math.max(
        ...Object.keys(talent_data).map(name => name.length)
      )
      
      const labelWidth = `${maxLabelLength}ch`
    
      return (
        <button
            onClick={toggle}
            className={`px-4 py-2 rounded-lg border transition flex items-center justify-start gap-4 w-full ${
                isActive
                ? "bg-blue-600 text-white border-blue-700"
                : "bg-gray-200 text-black border-gray-300 hover:bg-gray-300"
            }`}
            >
                <span className="text-left" style={{ width: labelWidth }}>{label}</span>
                <div className="h-5 w-px bg-black/30" />
                <span className="text-left">{talent_info["description"]}</span>
        </button>
      )
}
