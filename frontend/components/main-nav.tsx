import Link from "next/link"
import { DumbbellIcon } from "lucide-react"

export function MainNav() {
  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <DumbbellIcon className="h-6 w-6 text-primary" />
        <span className="hidden font-bold sm:inline-block">Fit&Fast</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
          Home
        </Link>
        <Link href="/activity" className="transition-colors hover:text-foreground/80 text-muted-foreground">
          Activity
        </Link>
        <Link href="/calendar" className="transition-colors hover:text-foreground/80 text-muted-foreground">
          Calendar
        </Link>
        <Link href="/profile" className="transition-colors hover:text-foreground/80 text-muted-foreground">
          Profile
        </Link>
      </nav>
    </div>
  )
}

