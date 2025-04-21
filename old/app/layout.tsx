import { NavLinks } from '@/app/ui/nav-links'
import '@/app/globals.css'

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body>
        <NavLinks />
        <main>{children}</main>
        </body>
        </html>
    )
}