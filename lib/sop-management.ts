"use client"

import { TASK_CATEGORIES } from "./constants"

// SOP storage key
const SOP_STORAGE_KEY = "kushl_standard_operating_procedures"

export interface StandardOperatingProcedure {
  id: string
  category: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  createdBy: string
  creatorName: string
}

// Get all SOPs
export const getAllSOPs = (): StandardOperatingProcedure[] => {
  if (typeof window === "undefined") return []

  try {
    const sops = localStorage.getItem(SOP_STORAGE_KEY)
    return sops ? JSON.parse(sops) : []
  } catch (error) {
    console.error("Error getting SOPs:", error)
    return []
  }
}

// Get SOPs by category
export const getSOPsByCategory = (category: string): StandardOperatingProcedure[] => {
  const allSOPs = getAllSOPs()
  return allSOPs.filter((sop) => sop.category === category)
}

// Add a new SOP
export const addSOP = (
  sop: Omit<StandardOperatingProcedure, "id" | "createdAt" | "updatedAt">,
): StandardOperatingProcedure => {
  const allSOPs = getAllSOPs()

  const newSOP: StandardOperatingProcedure = {
    ...sop,
    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  allSOPs.push(newSOP)
  localStorage.setItem(SOP_STORAGE_KEY, JSON.stringify(allSOPs))

  return newSOP
}

// Update an existing SOP
export const updateSOP = (updatedSOP: StandardOperatingProcedure): boolean => {
  const allSOPs = getAllSOPs()
  const index = allSOPs.findIndex((sop) => sop.id === updatedSOP.id)

  if (index === -1) return false

  allSOPs[index] = {
    ...updatedSOP,
    updatedAt: Date.now(),
  }

  localStorage.setItem(SOP_STORAGE_KEY, JSON.stringify(allSOPs))
  return true
}

// Delete a SOP
export const deleteSOP = (sopId: string): boolean => {
  const allSOPs = getAllSOPs()
  const filteredSOPs = allSOPs.filter((sop) => sop.id !== sopId)

  if (filteredSOPs.length === allSOPs.length) return false

  localStorage.setItem(SOP_STORAGE_KEY, JSON.stringify(filteredSOPs))
  return true
}

// Get all available categories
export const getAvailableCategories = (): string[] => {
  return TASK_CATEGORIES
}

// Get categories with SOPs
export const getCategoriesWithSOPs = (): string[] => {
  const allSOPs = getAllSOPs()
  const categories = new Set(allSOPs.map((sop) => sop.category))
  return Array.from(categories)
}

// Get categories without SOPs
export const getCategoriesWithoutSOPs = (): string[] => {
  const allCategories = getAvailableCategories()
  const categoriesWithSOPs = getCategoriesWithSOPs()
  return allCategories.filter((category) => !categoriesWithSOPs.includes(category))
}
