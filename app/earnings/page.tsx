"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getPaymentsByUserId, type PaymentRecord } from "@/lib/storage"
import { getProjects, getTaskById, calculateStudentEarnings, type Task } from "@/lib/task-management"
import { ExternalLink, DollarSign, ArrowUpRight, Clock, CheckCircle } from "lucide-react"

export default function EarningsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([])
  const [activeTasks, setActiveTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [pendingEarningsTotal, setPendingEarningsTotal] = useState(0)
  const [potentialEarningsTotal, setPotentialEarningsTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false)

  useEffect(() => {
    // Redirect if not logged in or not a student
    if (!user) {
      router.push("/login")
      return
    }

    if (user.userType !== "student") {
      router.push("/dashboard")
      return
    }

    // Load earnings data
    const loadEarningsData = async () => {
      try {
        setIsLoading(true)

        // Get completed payments for the current user
        const userPayments = getPaymentsByUserId(user.id)

        // Filter completed payments
        const completedPayments = userPayments.filter((payment) => payment.status === "completed")

        // Filter pending payments (completed tasks awaiting payment)
        const awaitingPayments = userPayments.filter((payment) => payment.status === "pending")

        // Get all tasks assigned to this student
        const studentTasks = getAllTasksForStudent(user.id)

        // Separate active and completed tasks
        const activeTasksList = studentTasks.filter(
          (task) => task.status !== "completed" && task.assignment && task.assignment.studentId === user.id,
        )

        const completedTasksList = studentTasks.filter(
          (task) => task.status === "completed" && task.assignment && task.assignment.studentId === user.id,
        )

        // Calculate totals
        const totalCompleted = completedPayments.reduce((sum, payment) => sum + payment.amount, 0)

        // For pending earnings, use completed tasks that don't have a completed payment
        const pendingTasksEarnings = completedTasksList
          .filter((task) => !completedPayments.some((payment) => payment.taskId === task.id))
          .reduce((sum, task) => sum + calculateStudentEarnings(task.price || 0), 0)

        // For potential earnings, use active tasks
        const potentialEarnings = activeTasksList.reduce(
          (sum, task) => sum + calculateStudentEarnings(task.price || 0),
          0,
        )

        setPayments(completedPayments)
        setPendingPayments(awaitingPayments)
        setActiveTasks(activeTasksList)
        setCompletedTasks(completedTasksList)
        setTotalEarnings(totalCompleted)
        setPendingEarningsTotal(pendingTasksEarnings)
        setPotentialEarningsTotal(potentialEarnings)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading earnings data:", error)
        setIsLoading(false)
      }
    }

    loadEarningsData()
  }, [user, router])

  // Get all tasks assigned to a student from all projects
  const getAllTasksForStudent = (studentId: string): Task[] => {
    const allProjects = getProjects("all")
    const studentTasks: Task[] = []

    allProjects.forEach((project) => {
      project.sprints.forEach((sprint) => {
        sprint.campaigns.forEach((campaign) => {
          campaign.tasks.forEach((task) => {
            if (task.assigneeId === studentId || (task.assignment && task.assignment.studentId === studentId)) {
              studentTasks.push({
                ...task,
                projectName: project.name,
                sprintName: sprint.name,
                campaignName: campaign.name,
              })
            }
          })
        })
      })
    })

    return studentTasks
  }

  const handleViewPaymentDetails = (payment: PaymentRecord) => {
    setSelectedPayment(payment)
    setIsPaymentDetailsOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Completed
          </Badge>
        )
      case "in_progress":
      case "doing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            In Progress
          </Badge>
        )
      case "review":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            In Review
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Earnings</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pending">Pending Payments</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Earnings</CardTitle>
                    <CardDescription>Your received payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
                      <span className="text-3xl font-bold">₹{totalEarnings.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pending Earnings</CardTitle>
                    <CardDescription>Completed tasks awaiting payment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-yellow-500 mr-1" />
                      <span className="text-3xl font-bold">₹{pendingEarningsTotal.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Potential Earnings</CardTitle>
                    <CardDescription>From your active tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-blue-500 mr-1" />
                      <span className="text-3xl font-bold">₹{potentialEarningsTotal.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Active Tasks</CardTitle>
                  <CardDescription>Your current tasks and potential earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No active tasks found</p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Potential Earning</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeTasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.title}</TableCell>
                              <TableCell>{task.projectName || "Unknown Project"}</TableCell>
                              <TableCell>
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                              </TableCell>
                              <TableCell>{getTaskStatusBadge(task.status)}</TableCell>
                              <TableCell>₹{calculateStudentEarnings(task.price || 0).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completed Tasks Awaiting Payment</CardTitle>
                  <CardDescription>Tasks you've completed that are pending payment</CardDescription>
                </CardHeader>
                <CardContent>
                  {completedTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No completed tasks awaiting payment</p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Completion Date</TableHead>
                            <TableHead>Expected Earning</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {completedTasks
                            .filter((task) => !payments.some((payment) => payment.taskId === task.id))
                            .map((task) => (
                              <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>{task.projectName || "Unknown Project"}</TableCell>
                                <TableCell>
                                  {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "Unknown"}
                                </TableCell>
                                <TableCell>₹{calculateStudentEarnings(task.price || 0).toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  >
                                    Awaiting Payment
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>Your most recent payments</CardDescription>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No payment history found</p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.slice(0, 3).map((payment) => {
                            const task = getTaskById(payment.taskId)
                            return (
                              <TableRow key={payment.id}>
                                <TableCell className="font-medium">{task?.title || "Unknown Task"}</TableCell>
                                <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                                <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" onClick={() => handleViewPaymentDetails(payment)}>
                                    <ArrowUpRight className="h-4 w-4" />
                                    <span className="sr-only">View details</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                {payments.length > 3 && (
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab("history")}>
                      View All Payments
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Tasks completed and awaiting payment</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : pendingPayments.length === 0 &&
                completedTasks.filter((task) => !payments.some((payment) => payment.taskId === task.id)).length ===
                  0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No pending payments found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingPayments.length > 0 && (
                    <>
                      <h3 className="text-lg font-medium">Payments Being Processed</h3>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Task</TableHead>
                              <TableHead>Submission Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingPayments.map((payment) => {
                              const task = getTaskById(payment.taskId)
                              return (
                                <TableRow key={payment.id}>
                                  <TableCell className="font-medium">{task?.title || "Unknown Task"}</TableCell>
                                  <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                                  <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                                      <span>Processing</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleViewPaymentDetails(payment)}>
                                      <ArrowUpRight className="h-4 w-4" />
                                      <span className="sr-only">View details</span>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}

                  {completedTasks.filter((task) => !payments.some((payment) => payment.taskId === task.id)).length >
                    0 && (
                    <>
                      <h3 className="text-lg font-medium mt-6">Completed Tasks Awaiting Payment</h3>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Task</TableHead>
                              <TableHead>Project</TableHead>
                              <TableHead>Completion Date</TableHead>
                              <TableHead>Expected Earning</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedTasks
                              .filter((task) => !payments.some((payment) => payment.taskId === task.id))
                              .map((task) => (
                                <TableRow key={task.id}>
                                  <TableCell className="font-medium">{task.title}</TableCell>
                                  <TableCell>{task.projectName || "Unknown Project"}</TableCell>
                                  <TableCell>
                                    {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : "Unknown"}
                                  </TableCell>
                                  <TableCell>₹{calculateStudentEarnings(task.price || 0).toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                    >
                                      Awaiting Payment
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Complete history of your payments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No payment history found</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <ScrollArea className="w-full overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Task</TableHead>
                          <TableHead className="min-w-[120px]">Transaction ID</TableHead>
                          <TableHead className="min-w-[100px]">Date</TableHead>
                          <TableHead className="min-w-[100px]">Amount</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => {
                          const task = getTaskById(payment.taskId)
                          return (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">{task?.title || "Unknown Task"}</TableCell>
                              <TableCell>{payment.transactionId || "N/A"}</TableCell>
                              <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                              <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                              <TableCell>{getStatusBadge(payment.status)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleViewPaymentDetails(payment)}>
                                  <ArrowUpRight className="h-4 w-4" />
                                  <span className="sr-only">View details</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      <Dialog open={isPaymentDetailsOpen} onOpenChange={setIsPaymentDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {selectedPayment && (
              <>
                <div className="flex items-center gap-4">
                  {selectedPayment.status === "completed" ? (
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  ) : (
                    <Clock className="h-10 w-10 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">{getTaskById(selectedPayment.taskId)?.title || "Unknown Task"}</p>
                    <p className="text-sm text-muted-foreground">
                      Transaction ID: {selectedPayment.transactionId || "Pending"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="grid grid-cols-2 gap-2 py-2 border-b">
                    <p className="text-sm font-medium">Amount</p>
                    <p className="text-sm">₹{selectedPayment.amount.toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-b">
                    <p className="text-sm font-medium">Payment Date</p>
                    <p className="text-sm">{new Date(selectedPayment.paymentDate).toLocaleString()}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 border-b">
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm">{getStatusBadge(selectedPayment.status)}</p>
                  </div>

                  {selectedPayment.message && (
                    <div className="py-2">
                      <p className="text-sm font-medium mb-1">Message</p>
                      <p className="text-sm bg-muted p-2 rounded">{selectedPayment.message}</p>
                    </div>
                  )}
                </div>

                {selectedPayment.paymentUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(selectedPayment.paymentUrl, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Payment Receipt
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
