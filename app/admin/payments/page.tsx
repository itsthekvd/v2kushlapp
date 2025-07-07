"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllPublishedTasks, updateTask, getCommissionPercentage } from "@/lib/task-management"
import { getUserById, getPayments, addPayment, findUserById } from "@/lib/storage"
import { Search, MoreHorizontal, Eye, ExternalLink, Clock, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function AdminPaymentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("pending")
  const [tasks, setTasks] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [filteredItems, setFilteredItems] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isViewPaymentDialogOpen, setIsViewPaymentDialogOpen] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState("")
  const [paymentMessage, setPaymentMessage] = useState("")

  const loadPaymentsData = async () => {
    try {
      setIsLoading(true)

      // Get all tasks from the task management system
      const allTasks = await getAllPublishedTasks()
      console.log("All published tasks:", allTasks.length)

      // Filter for completed tasks that have been assigned and not yet paid
      const completedTasks = allTasks.filter(
        (task) => task.status === "completed" && (task.assignedTo || task.assigneeId) && task.isPaid !== true,
      )

      console.log("Completed tasks awaiting payment:", completedTasks.length)

      // Enhance tasks with employer and student info
      const enhancedTasks = await Promise.all(
        completedTasks.map(async (task) => {
          let employer = null
          let student = null

          // Fetch employer data - try both methods to ensure we get data
          if (task.employerId || task.ownerId) {
            const employerId = task.employerId || task.ownerId
            try {
              // First try getUserById
              employer = await getUserById(employerId)

              // If that doesn't work, try findUserById
              if (!employer || !employer.fullName) {
                const foundEmployer = findUserById(employerId)
                if (foundEmployer) {
                  employer = foundEmployer
                  console.log(`Found employer using findUserById for task ${task.id}:`, employer)
                }
              }

              console.log(`Fetched employer for task ${task.id}:`, employer)
            } catch (error) {
              console.error(`Error fetching employer for task ${task.id}:`, error)

              // Try findUserById as fallback
              try {
                const foundEmployer = findUserById(employerId)
                if (foundEmployer) {
                  employer = foundEmployer
                  console.log(`Found employer using findUserById for task ${task.id}:`, employer)
                }
              } catch (fallbackError) {
                console.error(`Fallback error fetching employer for task ${task.id}:`, fallbackError)
              }
            }
          }

          // Fetch student data - try both methods to ensure we get data
          if (task.assignedTo || task.assigneeId) {
            const studentId = task.assignedTo || task.assigneeId
            try {
              // First try getUserById
              student = await getUserById(studentId)

              // If that doesn't work, try findUserById
              if (!student || !student.fullName) {
                const foundStudent = findUserById(studentId)
                if (foundStudent) {
                  student = foundStudent
                  console.log(`Found student using findUserById for task ${task.id}:`, student)
                }
              }

              console.log(`Fetched student for task ${task.id}:`, student)
            } catch (error) {
              console.error(`Error fetching student for task ${task.id}:`, error)

              // Try findUserById as fallback
              try {
                const foundStudent = findUserById(studentId)
                if (foundStudent) {
                  student = foundStudent
                  console.log(`Found student using findUserById for task ${task.id}:`, student)
                }
              } catch (fallbackError) {
                console.error(`Fallback error fetching student for task ${task.id}:`, fallbackError)
              }
            }
          }

          // Calculate financial information
          const budget = task.price || task.budget || 0
          const commissionPercentage = getCommissionPercentage(budget)
          const platformCharge = Math.round((budget * commissionPercentage) / 100)
          const studentEarning = budget - platformCharge

          return {
            ...task,
            employerId: task.employerId || task.ownerId || "",
            employerName: employer?.fullName || employer?.name || employer?.displayName || "Unknown",
            employerEmail: employer?.email || "",
            assignedTo: task.assignedTo || task.assigneeId || "",
            studentName: student?.fullName || student?.name || student?.displayName || "Unassigned",
            studentEmail: student?.email || "",
            completionDate: task.completedAt || Date.now(),
            budget: budget,
            platformCharge,
            studentEarning,
          }
        }),
      )

      // Get all payments from storage
      const allPayments = await getPayments()
      console.log("All payments:", allPayments.length)

      // Enhance payments with user info if needed
      const enhancedPayments = await Promise.all(
        allPayments.map(async (payment) => {
          // If payment already has all the info we need, return it as is
          if (payment.studentName && payment.employerName) {
            return payment
          }

          let student = null
          let employer = null

          // Fetch student data if needed - try both methods
          if (payment.studentId && !payment.studentName) {
            try {
              // First try getUserById
              student = await getUserById(payment.studentId)

              // If that doesn't work, try findUserById
              if (!student || !student.fullName) {
                const foundStudent = findUserById(payment.studentId)
                if (foundStudent) {
                  student = foundStudent
                  console.log(`Found student using findUserById for payment ${payment.id}:`, student)
                }
              }

              console.log(`Fetched student for payment ${payment.id}:`, student)
            } catch (error) {
              console.error(`Error fetching student for payment ${payment.id}:`, error)

              // Try findUserById as fallback
              try {
                const foundStudent = findUserById(payment.studentId)
                if (foundStudent) {
                  student = foundStudent
                  console.log(`Found student using findUserById for payment ${payment.id}:`, student)
                }
              } catch (fallbackError) {
                console.error(`Fallback error fetching student for payment ${payment.id}:`, fallbackError)
              }
            }
          }

          // Fetch employer data if needed - try both methods
          if (payment.employerId && !payment.employerName) {
            try {
              // First try getUserById
              employer = await getUserById(payment.employerId)

              // If that doesn't work, try findUserById
              if (!employer || !employer.fullName) {
                const foundEmployer = findUserById(payment.employerId)
                if (foundEmployer) {
                  employer = foundEmployer
                  console.log(`Found employer using findUserById for payment ${payment.id}:`, employer)
                }
              }

              console.log(`Fetched employer for payment ${payment.id}:`, employer)
            } catch (error) {
              console.error(`Error fetching employer for payment ${payment.id}:`, error)

              // Try findUserById as fallback
              try {
                const foundEmployer = findUserById(payment.employerId)
                if (foundEmployer) {
                  employer = foundEmployer
                  console.log(`Found employer using findUserById for payment ${payment.id}:`, employer)
                }
              } catch (fallbackError) {
                console.error(`Fallback error fetching employer for payment ${payment.id}:`, fallbackError)
              }
            }
          }

          return {
            ...payment,
            studentName:
              payment.studentName || student?.fullName || student?.name || student?.displayName || "Unknown Student",
            employerName:
              payment.employerName ||
              employer?.fullName ||
              employer?.name ||
              employer?.displayName ||
              "Unknown Employer",
          }
        }),
      )

      setTasks(enhancedTasks)
      setPayments(enhancedPayments)

      // Set initial filtered items based on active tab
      if (activeTab === "pending") {
        setFilteredItems(enhancedTasks)
      } else {
        setFilteredItems(enhancedPayments)
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error loading payments data:", error)
      toast({
        title: "Error",
        description: "Failed to load payment data. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

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

    // Load payments data
    loadPaymentsData()

    // Refresh data every 5 minutes
    const intervalId = setInterval(loadPaymentsData, 5 * 60 * 1000)

    return () => clearInterval(intervalId)
  }, [user, router, toast])

  useEffect(() => {
    // Apply filters based on active tab
    let items = activeTab === "pending" ? [...tasks] : [...payments]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (activeTab === "pending") {
        items = items.filter(
          (task) =>
            task.title?.toLowerCase().includes(query) ||
            task.employerName?.toLowerCase().includes(query) ||
            task.studentName?.toLowerCase().includes(query),
        )
      } else {
        items = items.filter(
          (payment) =>
            payment.taskTitle?.toLowerCase().includes(query) ||
            payment.employerName?.toLowerCase().includes(query) ||
            payment.studentName?.toLowerCase().includes(query) ||
            payment.transactionId?.toLowerCase().includes(query),
        )
      }
    }

    setFilteredItems(items)
  }, [searchQuery, activeTab, tasks, payments])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchQuery("")
  }

  const handleViewTask = (taskId: string) => {
    router.push(`/task/${taskId}`)
  }

  const handleProcessPayment = (task: any) => {
    setSelectedTask(task)
    setPaymentUrl("")
    setPaymentMessage("")
    setIsPaymentDialogOpen(true)
  }

  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment)
    setIsViewPaymentDialogOpen(true)
  }

  const confirmPayment = async () => {
    if (!selectedTask || !paymentUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide a payment confirmation URL.",
      })
      return
    }

    try {
      // Calculate platform commission
      const budget = selectedTask.budget || 0
      const commissionPercentage = getCommissionPercentage(budget)
      const platformCommission = Math.round((budget * commissionPercentage) / 100)

      // Create payment record
      const paymentData = {
        id: `payment-${Date.now()}`,
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        amount: budget,
        platformCommission: platformCommission,
        paymentDate: new Date().toISOString(),
        status: "completed",
        paymentUrl: paymentUrl,
        message: paymentMessage,
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        studentId: selectedTask.assignedTo || selectedTask.assigneeId || "",
        employerId: selectedTask.employerId || selectedTask.ownerId || "",
        studentName: selectedTask.studentName || "",
        employerName: selectedTask.employerName || "",
        studentEmail: selectedTask.studentEmail || "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      // Add payment record to storage
      const success = await addPayment(paymentData)

      if (success) {
        // Mark the task as paid
        const taskUpdateSuccess = await updateTask(
          selectedTask.id,
          {
            isPaid: true,
            paymentProcessedAt: Date.now(),
            paymentStatus: "completed",
          },
          user?.id,
          user?.fullName,
        )

        if (taskUpdateSuccess) {
          toast({
            title: "Payment Processed",
            description: `Payment for "${selectedTask.title}" has been processed successfully.`,
          })

          // Update local state
          setPayments((prev) => [...prev, paymentData])
          setTasks((prev) => prev.filter((task) => task.id !== selectedTask.id))

          // Switch to completed tab to show the new payment
          setActiveTab("completed")
        } else {
          toast({
            title: "Warning",
            description: "Payment record created but failed to update task status.",
            variant: "warning",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to process payment. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }

    setIsPaymentDialogOpen(false)
  }

  const getStatusBadge = (status: string) => {
    if (!status) {
      return <Badge variant="outline">Unknown</Badge>
    }

    switch (status.toLowerCase()) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "N/A"

    try {
      // Handle string dates
      if (typeof date === "string") {
        return new Date(date).toLocaleDateString()
      }

      // Handle number timestamps
      if (typeof date === "number") {
        return new Date(date).toLocaleDateString()
      }

      // Handle Date objects
      if (date instanceof Date) {
        return date.toLocaleDateString()
      }

      return "N/A"
    } catch (error) {
      console.error("Error formatting date:", error)
      return "N/A"
    }
  }

  if (!user || user.userType !== "admin") {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Debug information - only visible to admins */}
      <div className="bg-muted p-4 rounded-md mb-4">
        <h2 className="text-lg font-semibold mb-2">Payment System Status</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Tasks Awaiting Payment:</div>
          <div>{tasks.length}</div>
          <div>Completed Payments:</div>
          <div>{payments.length}</div>
          <div>Current View:</div>
          <div>{activeTab === "pending" ? "Tasks Awaiting Payment" : "Payment History"}</div>
        </div>
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Force refresh data
              setIsLoading(true)
              loadPaymentsData()
            }}
          >
            Refresh Payment Data
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment Management</h1>
        <Button onClick={() => router.push("/admin/dashboard")}>Back to Dashboard</Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Tasks Awaiting Payment ({tasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Payment History ({payments.length})</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search payments..." className="pl-8" value={searchQuery} onChange={handleSearch} />
          </div>
          {activeTab === "pending" && (
            <div className="text-sm text-muted-foreground">
              Tasks marked as completed by employers will appear here for payment processing
            </div>
          )}
        </div>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks Pending Payment</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <ScrollArea className="w-full overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Task</TableHead>
                          <TableHead className="min-w-[150px]">Employer</TableHead>
                          <TableHead className="min-w-[150px]">Student</TableHead>
                          <TableHead className="min-w-[100px]">Completion Date</TableHead>
                          <TableHead className="min-w-[100px]">Amount</TableHead>
                          <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No pending payments found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredItems.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">
                                <Link href={`/task/${task.id}`} className="text-blue-600 hover:underline">
                                  {task.title}
                                </Link>
                              </TableCell>
                              <TableCell>
                                {task.employerId ? (
                                  <Link href={`/profile/${task.employerId}`} className="text-blue-600 hover:underline">
                                    {task.employerName}
                                  </Link>
                                ) : (
                                  "Unknown"
                                )}
                              </TableCell>
                              <TableCell>
                                {task.assignedTo ? (
                                  <Link href={`/profile/${task.assignedTo}`} className="text-blue-600 hover:underline">
                                    {task.studentName}
                                  </Link>
                                ) : (
                                  "Unassigned"
                                )}
                              </TableCell>
                              <TableCell>{formatDate(task.completionDate)}</TableCell>
                              <TableCell>{task.budget > 0 ? `₹${task.budget.toLocaleString()}` : "N/A"}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewTask(task.id)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleProcessPayment(task)}>
                                      <Clock className="mr-2 h-4 w-4" />
                                      Process Payment
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <ScrollArea className="w-full overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Task</TableHead>
                          <TableHead className="min-w-[150px]">Student</TableHead>
                          <TableHead className="min-w-[120px]">Transaction ID</TableHead>
                          <TableHead className="min-w-[100px]">Date</TableHead>
                          <TableHead className="min-w-[100px]">Amount</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No completed payments found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredItems.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">
                                <Link href={`/task/${payment.taskId}`} className="text-blue-600 hover:underline">
                                  {payment.taskTitle}
                                </Link>
                              </TableCell>
                              <TableCell>
                                {payment.studentId ? (
                                  <Link
                                    href={`/profile/${payment.studentId}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {payment.studentName}
                                  </Link>
                                ) : (
                                  "Unknown"
                                )}
                              </TableCell>
                              <TableCell>{payment.transactionId}</TableCell>
                              <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                              <TableCell>
                                {payment.amount > 0 ? `₹${payment.amount.toLocaleString()}` : "N/A"}
                              </TableCell>
                              <TableCell>{getStatusBadge(payment.status)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewTask(payment.taskId)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewPayment(payment)}>
                                      <Clock className="mr-2 h-4 w-4" />
                                      View Payment Details
                                    </DropdownMenuItem>
                                    {payment.paymentUrl && (
                                      <DropdownMenuItem onClick={() => window.open(payment.paymentUrl, "_blank")}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        View Receipt
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
        </TabsContent>
      </Tabs>

      {/* Process Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Confirm that you've manually processed this payment and provide the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-100 text-green-600 flex items-center justify-center rounded-full">
                <span className="text-xl font-bold">₹</span>
              </div>
              <div>
                <p className="font-medium">{selectedTask?.title}</p>
                <p className="text-sm text-muted-foreground">
                  Student: {selectedTask?.studentName} ({selectedTask?.studentEmail})
                </p>
                <p className="text-sm font-semibold mt-1">
                  Amount: {selectedTask?.budget > 0 ? `₹${selectedTask?.budget?.toLocaleString()}` : "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="paymentUrl" className="text-sm font-medium">
                  Payment Screenshot URL <span className="text-red-500">*</span>
                </label>
                <Input
                  id="paymentUrl"
                  placeholder="https://drive.google.com/file/payment-screenshot"
                  value={paymentUrl}
                  onChange={(e) => setPaymentUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Upload a screenshot of the payment confirmation and paste the URL here
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="paymentMessage" className="text-sm font-medium">
                  Payment Note (Optional)
                </label>
                <Textarea
                  id="paymentMessage"
                  placeholder="Payment processed via UPI on May 11, 2025"
                  value={paymentMessage}
                  onChange={(e) => setPaymentMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPayment} disabled={!paymentUrl}>
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Payment Dialog */}
      <Dialog open={isViewPaymentDialogOpen} onOpenChange={setIsViewPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div>
                <p className="font-medium">{selectedPayment?.taskTitle}</p>
                <p className="text-sm text-muted-foreground">
                  Student: {selectedPayment?.studentName} ({selectedPayment?.studentEmail})
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <p className="text-sm font-medium">Transaction ID</p>
                <p className="text-sm">{selectedPayment?.transactionId}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <p className="text-sm font-medium">Amount</p>
                <p className="text-sm">
                  {selectedPayment?.amount > 0 ? `₹${selectedPayment?.amount?.toLocaleString()}` : "N/A"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <p className="text-sm font-medium">Platform Commission</p>
                <p className="text-sm">
                  {selectedPayment?.platformCommission > 0
                    ? `₹${selectedPayment?.platformCommission?.toLocaleString()}`
                    : "N/A"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <p className="text-sm font-medium">Payment Date</p>
                <p className="text-sm">{formatDate(selectedPayment?.paymentDate)}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm">{getStatusBadge(selectedPayment?.status)}</p>
              </div>

              {selectedPayment?.message && (
                <div className="py-2">
                  <p className="text-sm font-medium mb-1">Message to Student</p>
                  <p className="text-sm bg-muted p-2 rounded">{selectedPayment?.message}</p>
                </div>
              )}
            </div>

            {selectedPayment?.paymentUrl && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(selectedPayment.paymentUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Payment Receipt
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
