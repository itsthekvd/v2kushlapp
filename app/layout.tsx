import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { GamificationProvider } from "@/contexts/gamification-context"
import { MobileHeader } from "@/components/mobile-header"
import { MobileNavigation } from "@/components/mobile-navigation"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { RecurringTasksInitializer } from "@/components/recurring-tasks-initializer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KushL App",
  description: "Connect students with opportunities",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} flex min-h-full flex-col overscroll-none`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <GamificationProvider>
              <RecurringTasksInitializer />
              <div className="flex flex-1 flex-col">
                <MobileHeader />
                <main className="flex-1 pb-16">{children}</main>
                <MobileNavigation />
              </div>
              <Toaster />
            </GamificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
