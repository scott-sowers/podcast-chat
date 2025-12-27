"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Library, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserButton } from "@clerk/nextjs"

const navItems = [
  { href: "/", icon: Home, label: "Discover" },
  { href: "/library", icon: Library, label: "Library" },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-card border-r border-border flex flex-col items-center py-4 gap-2 z-40">
      {/* Logo */}
      <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center mb-4">
        <span className="text-white font-bold text-sm">BB</span>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="flex flex-col gap-2 items-center">
        <Link
          href="/settings"
          className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <UserButton afterSignOutUrl="/" />
      </div>
    </aside>
  )
}
