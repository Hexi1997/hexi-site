"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

import { cn } from "@/lib/utils"

function Toaster({ className, toastOptions, ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-center"
      closeButton={false}
      expand={false}
      visibleToasts={4}
      offset="1rem"
      mobileOffset="0.75rem"
      className={cn("toaster group", className)}
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-xl border border-border bg-background/95 text-foreground shadow-lg backdrop-blur-sm",
          title: "text-sm font-medium",
          description: "text-sm text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton:
            "bg-muted text-muted-foreground hover:bg-muted/80",
          closeButton:
            "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
        },
        ...toastOptions,
      }}
      {...props}
    />
  )
}

export { Toaster }
