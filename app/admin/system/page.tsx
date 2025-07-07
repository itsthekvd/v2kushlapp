"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertTriangle,
  CheckCircle,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Shield,
  Cpu,
  Download,
  Upload,
  Clock,
  Users,
  FileText,
  DollarSign,
  Settings,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getSystemHealth, backupData, restoreData } from "@/lib/admin"

export default function AdminSystemPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("health")
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [backupFile, setBackupFile] = useState<File | null>(null)
  const [isBackupInProgress, setIsBackupInProgress] = useState(false)
  const [isRestoreInProgress, setIsRestoreInProgress] = useState(false)

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

    // Load system health data
    const loadSystemHealth = async () => {
      try {
        setIsLoading(true)
        const healthData = await getSystemHealth()
        setSystemHealth(healthData)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading system health data:", error)
        setIsLoading(false)
      }
    }

    loadSystemHealth()

    // Refresh data every 30 seconds
    const intervalId = setInterval(loadSystemHealth, 30000)

    return () => clearInterval(intervalId)
  }, [user, router])

  const handleRefreshHealth = async () => {
    try {
      setIsLoading(true)
      const healthData = await getSystemHealth()
      setSystemHealth(healthData)
      setIsLoading(false)

      toast({
        title: "System Health Refreshed",
        description: "The system health data has been refreshed.",
      })
    } catch (error) {
      console.error("Error refreshing system health data:", error)
      setIsLoading(false)

      toast({
        title: "Refresh Failed",
        description: "Failed to refresh system health data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBackup = async () => {
    try {
      setIsBackupInProgress(true)
      const backupResult = await backupData()

      if (backupResult.success) {
        // Create a blob and download link
        const blob = new Blob([JSON.stringify(backupResult.data)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `kushl-backup-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast({
          title: "Backup Successful",
          description: "System data has been backed up successfully.",
        })
      } else {
        throw new Error(backupResult.message || "Backup failed")
      }
    } catch (error) {
      console.error("Error creating backup:", error)

      toast({
        title: "Backup Failed",
        description: "Failed to create system backup. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBackupInProgress(false)
      setIsBackupDialogOpen(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBackupFile(e.target.files[0])
    }
  }

  const handleRestore = async () => {
    if (!backupFile) {
      toast({
        title: "No File Selected",
        description: "Please select a backup file to restore.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRestoreInProgress(true)

      // Read the file
      const fileReader = new FileReader()
      fileReader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string)
          const restoreResult = await restoreData(backupData)

          if (restoreResult.success) {
            toast({
              title: "Restore Successful",
              description: "System data has been restored successfully. The page will reload.",
            })

            // Reload the page after a short delay
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          } else {
            throw new Error(restoreResult.message || "Restore failed")
          }
        } catch (error) {
          console.error("Error parsing backup file:", error)

          toast({
            title: "Restore Failed",
            description: "Failed to parse backup file. The file may be corrupted.",
            variant: "destructive",
          })
          setIsRestoreInProgress(false)
        }
      }

      fileReader.readAsText(backupFile)
    } catch (error) {
      console.error("Error restoring backup:", error)

      toast({
        title: "Restore Failed",
        description: "Failed to restore system data. Please try again.",
        variant: "destructive",
      })
      setIsRestoreInProgress(false)
    } finally {
      setIsRestoreDialogOpen(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Warning
          </Badge>
        )
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Unknown
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
        <h1 className="text-2xl font-bold">System Management</h1>
        <Button onClick={() => router.push("/admin/dashboard")}>Back to Dashboard</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">System Health Overview</h2>
            <Button variant="outline" onClick={handleRefreshHealth} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : systemHealth ? (
            <>
              {systemHealth.alerts.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>System Alerts</AlertTitle>
                  <AlertDescription>
                    There are {systemHealth.alerts.length} active alerts that require attention.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Used</span>
                        <span className="text-sm font-medium">{systemHealth.storage.used} MB</span>
                      </div>
                      <Progress value={systemHealth.storage.percentUsed} className="h-2" />
                      <div className="flex justify-between text-xs">
                        <span>{systemHealth.storage.percentUsed}% used</span>
                        <span>{systemHealth.storage.total} MB total</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Used</span>
                        <span className="text-sm font-medium">{systemHealth.memory.used} MB</span>
                      </div>
                      <Progress value={systemHealth.memory.percentUsed} className="h-2" />
                      <div className="flex justify-between text-xs">
                        <span>{systemHealth.memory.percentUsed}% used</span>
                        <span>{systemHealth.memory.total} MB total</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Load</span>
                        <span className="text-sm font-medium">{systemHealth.cpu.load}%</span>
                      </div>
                      <Progress value={systemHealth.cpu.load} className="h-2" />
                      <div className="flex justify-between text-xs">
                        <span>Cores: {systemHealth.cpu.cores}</span>
                        <span>Temp: {systemHealth.cpu.temperature}°C</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>System Components</CardTitle>
                  <CardDescription>Status of critical system components</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Component</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Check</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {systemHealth.components.map((component: any) => (
                          <TableRow key={component.name}>
                            <TableCell>
                              <div className="flex items-center">
                                {component.type === "database" && <Database className="h-4 w-4 mr-2" />}
                                {component.type === "storage" && <HardDrive className="h-4 w-4 mr-2" />}
                                {component.type === "server" && <Server className="h-4 w-4 mr-2" />}
                                {component.type === "security" && <Shield className="h-4 w-4 mr-2" />}
                                {component.type === "processor" && <Cpu className="h-4 w-4 mr-2" />}
                                <span className="font-medium">{component.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(component.status)}</TableCell>
                            <TableCell>{component.lastCheck}</TableCell>
                            <TableCell>{component.details}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {systemHealth.alerts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Alerts</CardTitle>
                    <CardDescription>Issues that require attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-4">
                        {systemHealth.alerts.map((alert: any, index: number) => (
                          <div key={index} className="p-4 border rounded-md">
                            <div className="flex items-start gap-4">
                              <AlertTriangle
                                className={`h-5 w-5 ${alert.severity === "critical" ? "text-red-500" : "text-yellow-500"}`}
                              />
                              <div>
                                <h4 className="font-medium">{alert.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge variant="outline">{alert.severity}</Badge>
                                  <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Failed to load system health data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="backup" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Backup System Data</CardTitle>
                <CardDescription>Create a backup of all system data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Backing up your system data creates a snapshot of all users, tasks, payments, and settings. This
                  backup can be used to restore the system in case of data loss.
                </p>
                <div className="rounded-md border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">What's included in the backup:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      User accounts and profiles
                    </li>
                    <li className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-green-500" />
                      Tasks, projects, and assignments
                    </li>
                    <li className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-yellow-500" />
                      Payment records and transactions
                    </li>
                    <li className="flex items-center">
                      <Settings className="h-4 w-4 mr-2 text-purple-500" />
                      System settings and configurations
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setIsBackupDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Restore System Data</CardTitle>
                <CardDescription>Restore system data from a backup file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Restoring from a backup will replace all current system data with the data from the backup file. This
                  action cannot be undone.
                </p>
                <div className="rounded-md border p-4 bg-yellow-50 text-yellow-800">
                  <h4 className="font-medium mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Warning
                  </h4>
                  <p className="text-sm">
                    Restoring from a backup will overwrite all current data. Make sure to create a backup of your
                    current data before proceeding.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setIsRestoreDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore from Backup
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>Recent system backups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>2023-06-15 14:30:22</TableCell>
                      <TableCell>Admin User</TableCell>
                      <TableCell>2.4 MB</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2023-06-01 09:15:47</TableCell>
                      <TableCell>System</TableCell>
                      <TableCell>2.1 MB</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Maintenance</CardTitle>
                <CardDescription>Upcoming maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex items-start gap-4">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Database Optimization</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Scheduled database optimization to improve performance.
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">Scheduled</Badge>
                        <span className="text-xs text-muted-foreground">June 20, 2023 - 02:00 AM</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="flex items-start gap-4">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium">System Update</h4>
                      <p className="text-sm text-muted-foreground mt-1">Scheduled system update to version 2.5.0.</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">Scheduled</Badge>
                        <span className="text-xs text-muted-foreground">June 25, 2023 - 03:00 AM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Schedule Maintenance
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Cleanup</CardTitle>
                <CardDescription>Clean up system data to improve performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Temporary Files</span>
                    <span className="text-sm font-medium">45 MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Log Files</span>
                    <span className="text-sm font-medium">120 MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache</span>
                    <span className="text-sm font-medium">78 MB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Deleted Users Data</span>
                    <span className="text-sm font-medium">12 MB</span>
                  </div>
                </div>
                <div className="rounded-md border p-4 bg-muted/50">
                  <p className="text-sm">
                    Cleaning up system data will free up storage space and may improve system performance. This action
                    cannot be undone.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Run Cleanup</Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <CardDescription>Recent maintenance activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>2023-06-10 02:15:33</TableCell>
                      <TableCell>Database Optimization</TableCell>
                      <TableCell>System</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>12 minutes</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2023-06-05 03:00:12</TableCell>
                      <TableCell>System Update (v2.4.5)</TableCell>
                      <TableCell>Admin User</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>25 minutes</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>2023-06-01 01:30:45</TableCell>
                      <TableCell>System Cleanup</TableCell>
                      <TableCell>Admin User</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>8 minutes</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Backup Dialog */}
      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create System Backup</DialogTitle>
            <DialogDescription>
              This will create a backup of all system data. The backup file will be downloaded to your device.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md border p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Backup Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created By:</span>
                  <span>{user.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Size:</span>
                  <span>~2.5 MB</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBackupDialogOpen(false)} disabled={isBackupInProgress}>
              Cancel
            </Button>
            <Button onClick={handleBackup} disabled={isBackupInProgress}>
              {isBackupInProgress ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore System Data</DialogTitle>
            <DialogDescription>
              This will restore system data from a backup file. All current data will be replaced.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="rounded-md border p-4 bg-yellow-50 text-yellow-800">
              <h4 className="font-medium mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Warning
              </h4>
              <p className="text-sm">
                Restoring from a backup will overwrite all current data. This action cannot be undone.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="backup-file" className="text-sm font-medium">
                Select Backup File
              </label>
              <input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full border rounded-md p-2"
              />
              <p className="text-xs text-muted-foreground">
                Only .json backup files created by this system are supported.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)} disabled={isRestoreInProgress}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRestore} disabled={!backupFile || isRestoreInProgress}>
              {isRestoreInProgress ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
