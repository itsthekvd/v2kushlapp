"use client"

import { useEffect } from "react"

export function ViewportMeta() {
  useEffect(() => {
    // Function to update the viewport meta tag
    const updateViewportMeta = () => {
      // Find existing viewport meta tag
      let viewportMeta = document.querySelector('meta[name="viewport"]')

      // If it doesn't exist, create it
      if (!viewportMeta) {
        viewportMeta = document.createElement("meta")
        viewportMeta.setAttribute("name", "viewport")
        document.head.appendChild(viewportMeta)
      }

      // Set the content attribute to prevent unwanted zooming
      viewportMeta.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      )
    }

    // Update the viewport meta tag
    updateViewportMeta()

    // Add event listener for orientation changes
    window.addEventListener("orientationchange", updateViewportMeta)

    // Cleanup
    return () => {
      window.removeEventListener("orientationchange", updateViewportMeta)
    }
  }, [])

  return null
}
