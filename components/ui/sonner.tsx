"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle2, Info, AlertTriangle, XCircle, Loader2 } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="size-5 text-emerald-500" />,
        info: <Info className="size-5 text-sky-500" />,
        warning: <AlertTriangle className="size-5 text-amber-500" />,
        error: <XCircle className="size-5 text-rose-500" />,
        loading: <Loader2 className="size-5 animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast group",
          success: "cn-toast-success",
          error: "cn-toast-error",
          warning: "cn-toast-warning",
          info: "cn-toast-info",
          title: "data-title",
          description: "data-description",
          closeButton: "data-close-button",
        },
      }}
      closeButton
      richColors={false}
      {...props}
    />
  )
}

export { Toaster }
