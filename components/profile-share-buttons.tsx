"use client"

import { useState } from "react"
import { Copy, Share2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ProfileShareButtonsProps {
  profileId: string
}

export function ProfileShareButtons({ profileId }: ProfileShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const profileUrl =
    typeof window !== "undefined" ? `${window.location.origin}/profile/${profileId}` : `/profile/${profileId}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      toast({
        title: "Link copied",
        description: "Profile link copied to clipboard",
        duration: 2000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const shareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this profile",
          text: "I thought you might be interested in this profile",
          url: profileUrl,
        })
        toast({
          title: "Shared successfully",
          duration: 2000,
        })
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast({
            title: "Failed to share",
            description: "Please try again",
            variant: "destructive",
          })
        }
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <div className="profile-share-buttons">
      <button onClick={copyToClipboard} className="profile-share-button" aria-label="Copy profile link">
        <Copy className="h-4 w-4 mr-2" />
        <span>{copied ? "Copied" : "Copy Link"}</span>
      </button>
      <button onClick={shareProfile} className="profile-share-button" aria-label="Share profile">
        <Share2 className="h-4 w-4 mr-2" />
        <span>Share</span>
      </button>
    </div>
  )
}
