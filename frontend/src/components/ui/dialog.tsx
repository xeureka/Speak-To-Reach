import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }
interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { asChild?: boolean }
interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> { onClose?: () => void }
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void }>({ open: false, onOpenChange: () => {} })

function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen
  return <DialogContext.Provider value={{ open, onOpenChange: setOpen }}>{children}</DialogContext.Provider>
}

function DialogTrigger({ children, ...props }: DialogTriggerProps) {
  const { onOpenChange } = React.useContext(DialogContext)
  return <button {...props} onClick={() => onOpenChange(true)}>{children}</button>
}

function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { open, onOpenChange } = React.useContext(DialogContext)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative bg-card border border-border/60 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200",
            className
          )}
          role="dialog"
          {...props}
        >
          {children}
          <button
            className="absolute right-4 top-4 rounded-full p-1.5 opacity-60 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => onOpenChange(false)}
          >
            <span className="sr-only">Close</span>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
}

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h3 className={cn("text-xl font-bold leading-none tracking-tight", className)} {...props} />
}

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <p className={cn("text-sm text-muted-foreground mt-1", className)} {...props} />
}

function DialogFooter({ className, ...props }: DialogFooterProps) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)} {...props} />
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
