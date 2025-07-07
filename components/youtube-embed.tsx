"use client"

import { useState, useEffect } from "react"
import { getYouTubeEmbedUrl } from "@/lib/task-management"

interface YouTubeEmbedProps {
  url: string
  title?: string
  className?: string
}

export function YouTubeEmbed({ url, title = "YouTube video", className = "" }: YouTubeEmbedProps) {
  const [embedUrl, setEmbedUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (!url) {
        setError("No video URL provided")
        setIsLoading(false)
        return
      }

      const embed = getYouTubeEmbedUrl(url)
      if (!embed) {
        setError("Invalid YouTube URL")
        setIsLoading(false)
        return
      }

      setEmbedUrl(embed)
      setError(null)
      setIsLoading(false)
    } catch (err) {
      console.error("Error processing YouTube URL:", err)
      setError("Error processing video URL")
      setIsLoading(false)
    }
  }, [url])

  if (isLoading) {
    return (
      <div className={`aspect-video bg-gray-100 animate-pulse rounded-md ${className}`}>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error || !embedUrl) {
    return (
      <div className={`aspect-video bg-gray-100 rounded-md ${className}`}>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">{error || "Video unavailable"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`aspect-video ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full rounded-md"
      />
    </div>
  )
}
