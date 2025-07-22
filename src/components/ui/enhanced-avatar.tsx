
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"

const EnhancedAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: "sm" | "md" | "lg" | "xl"
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12", 
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  }

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
})
EnhancedAvatar.displayName = AvatarPrimitive.Root.displayName

const EnhancedAvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
EnhancedAvatarImage.displayName = AvatarPrimitive.Image.displayName

const EnhancedAvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    initials?: string
    size?: "sm" | "md" | "lg" | "xl"
  }
>(({ className, initials, size = "md", ...props }, ref) => {
  // Generate dynamic background color based on initials
  const getBackgroundColor = (text: string = '') => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-cyan-500',
      'bg-emerald-500',
      'bg-violet-500',
      'bg-rose-500'
    ]
    
    if (!text) return colors[0]
    
    const charCode = text.charCodeAt(0) + (text.charCodeAt(1) || 0)
    return colors[charCode % colors.length]
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm", 
    lg: "text-lg",
    xl: "text-2xl"
  }

  const bgColor = getBackgroundColor(initials)

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full text-white font-bold",
        bgColor,
        textSizes[size],
        className
      )}
      {...props}
    >
      {initials}
    </AvatarPrimitive.Fallback>
  )
})
EnhancedAvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { EnhancedAvatar, EnhancedAvatarImage, EnhancedAvatarFallback }
