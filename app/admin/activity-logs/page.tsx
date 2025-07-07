"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Filter, Download, Eye } from "lucide-react"
import { format, subDays } from "date-fns"
import { getActivityLogs } from "@/lib/admin"

export default function AdminActivityLogsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [filteredLogs, setFilteredLogs] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [timeRange, setTimeRange] = useState("7days")
  const [logType, setLogType] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Redirect if not logged in or not an admin
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "admin") {
      router.push("/")
      return
    }

    // Load activity logs
    const loadActivityLogs = async () => {
      try {
        setIsLoading(true)
        const timeRangeDate = getTimeRangeDate(timeRange)
        const fetchedLogs = await getActivityLogs(timeRangeDate)
        setLogs(fetchedLogs)
        setFilteredLogs(fetchedLogs)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading activity logs:", error)
        setIsLoading(false)
      }
    }

    loadActivityLogs()
  }, [user, router, timeRange])

  useEffect(() => {
    // Filter logs based on search query and log type
    let filtered = [...logs]

    // Apply log type filter
    if (logType !== "all") {
      filtered = filtered.filter((log) => log.type === logType)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(query) ||
          log.userId.toLowerCase().includes(query) ||
          log.userName.toLowerCase().includes(query),
      )
    }

    setFilteredLogs(filtered)
  }, [searchQuery, logType, logs])

  const getTimeRangeDate = (range: string): number => {
    const now = new Date()
    switch (range) {
      case "24hours":
        return subDays(now, 1).getTime()
      case "7days":
        return subDays(now, 7).getTime()
      case "30days":
        return subDays(now, 30).getTime()
      case "all":
        return 0
      default:
        return subDays(now, 7).getTime()
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleExportLogs = () => {
    // Create CSV content
    const csvContent =
      "Timestamp,User ID,User Name,Type,Message\n" +
      filteredLogs
        .map(
          (log) =>
            `"${format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}","${log.userId}","${log.userName}","${
              log.type
            }","${log.message.replace(/"/g, '""')}"`,
        )
        .join("\n")

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case "auth":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Auth
          </Badge>
        )
      case "user":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            User
          </Badge>
        )
      case "task":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            Task
          </Badge>
        )
      case "payment":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Payment
          </Badge>
        )
      case "admin":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Admin
          </Badge>
        )
      case "system":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            System
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {type}
          </Badge>
        )
    }
  }

  if (!user || user.userType !== "admin") {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <Button onClick={() => router.push("/admin/dashboard")}>Back to Dashboard</Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-8" value={searchQuery} onChange={handleSearch} />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24hours">Last 24 hours</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={logType} onValueChange={setLogType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Log type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="auth">Auth</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="task">Task</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>View system activity logs for monitoring and troubleshooting purposes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="w-[80px] text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          {searchQuery || logType !== "all"
                            ? "No logs found matching your filters"
                            : "No activity logs found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span className="font-medium">{log.userName}</span>
                              <span className="text-xs text-muted-foreground block">{log.userId}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getLogTypeBadge(log.type)}</TableCell>
                          <TableCell>
                            <div className="max-w-md truncate">{log.message}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            {log.details && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
