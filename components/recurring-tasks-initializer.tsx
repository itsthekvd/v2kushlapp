"use client"

import { useEffect } from "react"
import { checkAndResetRecurringTasks } from "@/lib/task-management"

export function RecurringTasksInitializer() {
  useEffect(() => {
    // Check and reset recurring tasks on component mount
    checkAndResetRecurringTasks()

    // Set up an interval to check every minute
    const intervalId = setInterval(() => {
      checkAndResetRecurringTasks()
    }, 60000) // 60000 ms = 1 minute

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  // This component doesn't render anything
  return null
}
