// components/StatSync.tsx
"use client"

import { useEffect } from "react"
import { talent_data } from "@/app/data/talent_data"

export function computeTalentStats() {
  console.log("Updating Talent Stats")
  const raw = localStorage.getItem("selectedTalents")
  if (!raw) return //Skip if selectedTalents doens't return anything
  try {
    const selected = new Set<string>(JSON.parse(raw))
    const stats: Record<string, number> = {}
    for (const [name, data] of Object.entries(talent_data)) {
      if (!selected.has(name)) continue
      for (const [stat, value] of Object.entries(data.stats)) {
        stats[stat] = (stats[stat] || 0) + value
      }
    }
    localStorage.setItem("StatsTalents", JSON.stringify(stats)) // Save totals to StatsTalents
  } catch {}
}

// export function computeConversionStats() {
//   console.log("Updating Conversion Stats")
//   const raw = localStorage.getItem("selectedTalents")
//   if (!raw) return //Skip if selectedTalents doens't return anything
//   try {
//     const selected = new Set<string>(JSON.parse(raw))
//     const conversions: Record<string, number> = {}
//     for (const [name, data] of Object.entries(talent_data)) {
//       if (!selected.has(name)) continue
//       for (const [stat, value] of Object.entries(data.stats)) {
//         stats[stat] = (stats[stat] || 0) + value
//       }
//     }
//     localStorage.setItem("StatsTalents", JSON.stringify(stats)) // Save totals to StatsTalents
//   } catch {}
// }



export default function StatSync() {
  useEffect(() => {   //Run once on mount
    // Add custom event listeners for stat updates
    window.addEventListener("talentsUpdated", computeTalentStats)

    // Clean up listeners for when unmounted (to prevent multiple updates)
    return () => window.removeEventListener("talentsUpdated", computeTalentStats)
  }, [])
  return null
}





// export function old_StatSync() {
//   //Run once on mount
//   useEffect(() => {
//     const observer = () => {
//       const raw = localStorage.getItem("selectedTalents")
//       // Skip if no selectedTalents isn't returned
//       if (!raw) return
//       try {
//         const selected = new Set<string>(JSON.parse(raw))
//         const stats: Record<string, number> = {}
//         for (const [name, data] of Object.entries(talent_data)) {
//           if (!selected.has(name)) continue
//           for (const [stat, value] of Object.entries(data.stats)) {
//             stats[stat] = (stats[stat] || 0) + value
//           }
//         }
//         localStorage.setItem("computedStats", JSON.stringify(stats))
//       } catch {}
//     }

//     // Make is so that the observer triggers when setItem is called
//     window.addEventListener("storage", observer)
//     observer() // run once on mount
//     return () => window.removeEventListener("storage", observer)
//   }, [])

//   return (null);
// }
