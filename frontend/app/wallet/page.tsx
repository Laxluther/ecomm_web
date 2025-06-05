"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, CreditCard } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/Button"
import Input from "@/shared/ui/input/Input"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface Transaction {
  id: string
  type: "credit" | "debit"
  amount: number
  description: string
  date: string
  status: "completed" | "pending" | "failed"
}

interface WalletData {
  balance: number
  transactions: Transaction[]
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [amount, setAmount] = useState("")
  const [addingMoney, setAddingMoney] = useState(false)

  const { user } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/wallet")
      return
    }
    loadWalletData()
  }, [user, router])

  const loadWalletData = async () => {
    try {
      setLoading(true)
      const response = await api.getWallet()

      if (response.data) {
        setWalletData(response.data)
      } else {
        showToast("Failed to load wallet data", "error")
      }
    } catch (error) {
      console.error("Failed to load wallet:", error)
      showToast("Failed to load wallet data", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    const addAmount = Number.parseFloat(amount)

    if (!addAmount || addAmount <= 0) {
      showToast("Please enter a valid amount", "error")
      return
    }

    if (addAmount < 10) {
      showToast("Minimum amount is ₹10", "error")
      return
    }

    if (addAmount > 50000) {
      showToast("Maximum amount is ₹50,000", "error")
      return
    }

    setAddingMoney(true)

    try {
      const response = await api.addMoneyToWallet(addAmount)

      if (response.data?.success) {
        await loadWalletData() // Reload wallet data
        setAmount("")
        setShowAddMoney(false)
        showToast(`₹${addAmount} added to wallet successfully`, "success")
      } else {
        showToast(response.error || "Failed to add money to wallet", "error")
      }
    } catch (error) {
      console.error("Failed to add money:", error)
      showToast("Failed to add money to wallet", "error")
    } finally {
      setAddingMoney(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100"
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "failed":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  if (loading) {
    return (
      <div className="container py-16 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!walletData) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-green-800 mb-4">Unable to Load Wallet</h1>
        <p className="text-green-700 mb-8">Please try again later.</p>
        <Button onClick={loadWalletData}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-heading font-bold text-green-800 mb-8">My Wallet</h1>

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="h-8 w-8" />
              <h2 className="text-2xl font-heading font-bold">Wallet Balance</h2>
            </div>
            <p className="text-4xl font-bold">₹{walletData.balance.toFixed(2)}</p>
            <p className="text-green-100 mt-2">Available for purchases</p>
          </div>
          <Button onClick={() => setShowAddMoney(true)} className="bg-white text-green-800 hover:bg-green-50">
            <Plus className="h-4 w-4 mr-2" />
            Add Money
          </Button>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-heading font-bold text-green-800 mb-4">Add Money to Wallet</h3>

            <form onSubmit={handleAddMoney} className="space-y-4">
              <Input
                label="Amount (₹)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="10"
                max="50000"
                required
              />

              <div className="text-sm text-gray-600">
                <p>• Minimum amount: ₹10</p>
                <p>• Maximum amount: ₹50,000</p>
                <p>• Money will be added instantly</p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" loading={addingMoney} className="flex-1">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Money
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddMoney(false)
                    setAmount("")
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Amounts */}
      <div className="bg-white rounded-lg shadow-sm border border-green-100 p-6 mb-8">
        <h3 className="text-lg font-heading font-bold text-green-800 mb-4">Quick Add</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[100, 500, 1000, 2000].map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => {
                setAmount(quickAmount.toString())
                setShowAddMoney(true)
              }}
              className="p-3 border border-green-200 rounded-lg text-green-800 hover:bg-green-50 transition-colors"
            >
              ₹{quickAmount}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden">
        <div className="p-6 border-b border-green-100">
          <h3 className="text-lg font-heading font-bold text-green-800">Transaction History</h3>
        </div>

        {walletData.transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-green-800 mb-2">No transactions yet</h4>
            <p className="text-green-600">Your wallet transactions will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-green-100">
            {walletData.transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${transaction.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                    {transaction.type === "credit" ? (
                      <ArrowDownLeft className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-green-800">{transaction.description}</p>
                    <p className="text-sm text-green-600">{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                    {transaction.type === "credit" ? "+" : "-"}₹{transaction.amount.toFixed(2)}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
