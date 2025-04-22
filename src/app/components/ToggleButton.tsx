"use client"

import talent_data from "../data/talent_data"

type ToggleButtonProps = {
    id: string
    label: string
    selected: boolean
    toggle: (id: string) => void
}
  

export default function ToggleButton({ id, label, selected, toggle }: ToggleButtonProps) {
    const talent_info = talent_data[label] 

    const maxLabelLength = Math.max(...Object.keys(talent_data).map(name => name.length))
    const labelWidth = `${maxLabelLength}ch`

  
    
    return (
        <button
          onClick={() => toggle(id)}
          className={`px-4 py-2 rounded-lg border transition flex items-center justify-start gap-4 w-full ${
            selected ? "bg-blue-600 text-white border-blue-700" : "bg-gray-200 text-black border-gray-300 hover:bg-gray-300"
          }`}
        >
          <span className="text-left" style={{ width: labelWidth }}>{label}</span>
          <div className="h-5 w-px bg-black/30" />
          <span className="text-left">{talent_info.description}</span>
        </button>
      )
    }
