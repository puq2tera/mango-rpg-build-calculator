import Hello from "@/app/components/hello";
import Link from 'next/link';

export default function equipment() {
    return (
        <div>
            <h2 className="text-3xl"> Equipment</h2>

            <ul className='mt-10'>
                <li><Link href="/equipment/magic_helm">Slot 1</Link></li>
                <li><Link href="/equipment/2">Slot 2</Link></li>
                <li><Link href="/equipment/3">Slot 3</Link></li>
                <li><Link href="/equipment/4">Slot 4</Link></li>
            </ul>
        </div>
    )
}