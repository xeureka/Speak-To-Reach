import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DropdownMenuProps { children: React.ReactNode }
interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { asChild?: boolean }
interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> { align?: "start" | "center" | "end" }
interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownContext = React.createContext<{ open: boolean; setOpen: (v: boolean) => void; triggerRef: React.RefObject<HTMLButtonElement | null> }>({ open: false, setOpen: () => {}, triggerRef: { current: null } })

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  return <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>{children}</DropdownContext.Provider>
}

function DropdownMenuTrigger({ children, className, ...props }: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownContext)
  return (
    <button ref={triggerRef} className={cn("outline-none", className)} onClick={() => setOpen(!open)} aria-expanded={open} {...props}>
      {children}
    </button>
  )
}

function DropdownMenuContent({ className, align = "end", children, ...props }: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownContext)
  const ref = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ top: 0, left: 0 })

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const menuHeight = ref.current?.offsetHeight ?? 200
      const spaceBelow = window.innerHeight - rect.bottom
      const openAbove = spaceBelow < menuHeight + 8 && rect.top > menuHeight

      const top = openAbove ? rect.top - menuHeight - 4 : rect.bottom + 4
      const left = align === "start" ? rect.left : align === "center" ? rect.left + rect.width / 2 : rect.right

      setPos({ top, left })
    }
  }, [open, triggerRef, align])

  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, setOpen, triggerRef])

  if (!open) return null

  const transformOrigin = align === "start" ? "origin-top-left" : align === "center" ? "origin-top" : "origin-top-right"
  const translateX = align === "start" ? "-translate-x-full" : align === "center" ? "-translate-x-1/2" : ""

  return createPortal(
    <div
      ref={ref}
      className={cn(
        "fixed z-[9999] min-w-[14rem] overflow-hidden rounded-lg border bg-popover p-1.5 text-popover-foreground",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
        transformOrigin,
        translateX,
        className
      )}
      style={{ top: pos.top, left: pos.left }}
      {...props}
    >
      {children}
    </div>,
    document.body
  )
}

function DropdownMenuItem({ className, onClick, children, ...props }: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownContext)
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none transition-colors",
        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        className
      )}
      onClick={(e) => { onClick?.(e); setOpen(false) }}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("-mx-1 my-1.5 h-px bg-border", className)} {...props} />
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }
