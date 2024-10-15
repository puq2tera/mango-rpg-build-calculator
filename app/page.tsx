'use client'

import { useRouter } from 'next/navigation'
import TalentsTable from "@/components/TalentsTable.tsx";

export default function Page() {
    const router = useRouter()

    return (
        <div>
            <TalentsTable />
            <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            >
                Dashboard
            </button>
        </div>
    )
}
