"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPaymentsByUserId } from "@/lib/storage"
import { getTaskById } from "@/lib/task-management"
import { ExternalLink, DollarSign, ArrowUpRight, Clock, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function WalletPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [payments, setPayments] = useState<any[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [pendingEarnings, setPendingEarnings] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false)

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push("/login")
      return
    }

    // Load wallet data
    const loadWalletData = async () => {
      try {
        setIsLoading(true)

        // Get payments for the current user
        const userPayments = getPaymentsByUserId(user.id)

        // Enhance payments with task info
        const enhancedPayments = await Promise.all(
          userPayments.map(async (payment) => {
            const task = getTaskById(payment.taskId)
            return {
              ...payment,
              taskTitle: task?.title || "Unknown Task",
            }
          }),
        )

        // Calculate total earnings
        const total = enhancedPayments.reduce((sum, payment) => sum + payment.amount, 0)
        setTotalEarnings(total)

        // Calculate pending earnings (placeholder - would come from pending tasks)
        setPendingEarnings(1500) // Example value

        setPayments(enhancedPayments)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading wallet data:", error)
        setIsLoading(false)
      }
    }

    loadWalletData()
  }, [user, router])

  const handleViewPaymentDetails = (payment: any) => {
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

  if (!user) {
    return null
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wallet</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Earnings</CardTitle>
                    <CardDescription>Your lifetime earnings on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-muted-foreground mr-1" />
                      <span className="text-3xl font-bold">₹{totalEarnings.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pending Earnings</CardTitle>
                    <CardDescription>Earnings from tasks awaiting payment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-muted-foreground mr-1" />
                      <span className="text-3xl font-bold">₹{pendingEarnings.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                          {payments.slice(0, 5).map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">{payment.taskTitle}</TableCell>
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
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                {payments.length > 5 && (
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
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.taskTitle}</TableCell>
                            <TableCell>{payment.transactionId}</TableCell>
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
                        ))}
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
            <div className="flex items-center gap-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div>
                <p className="font-medium">{selectedPayment?.taskTitle}</p>
                <p className="text-sm text-muted-foreground">Transaction ID: {selectedPayment?.transactionId}</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <p className="text-sm font-medium">Amount</p>
                <p className="text-sm">₹{selectedPayment?.amount?.toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <p className="text-sm font-medium">Payment Date</p>
                <p className="text-sm">
                  {selectedPayment?.paymentDate && new Date(selectedPayment.paymentDate).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 py-2 border-b">
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm">{getStatusBadge(selectedPayment?.status)}</p>
              </div>

              {selectedPayment?.message && (
                <div className="py-2">
                  <p className="text-sm font-medium mb-1">Message</p>
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
