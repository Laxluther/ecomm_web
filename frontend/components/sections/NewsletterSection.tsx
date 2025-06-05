"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/contexts/ToastContext"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      // Simulate newsletter subscription
      await new Promise((resolve) => setTimeout(resolve, 1000))
      showToast("Successfully subscribed to newsletter!", "success")
      setEmail("")
    } catch (error) {
      showToast("Failed to subscribe. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-16 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
      <div className="container text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">Join the Brewing Community</h2>
        <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
          Get exclusive brewing tips, new product alerts, and special offers delivered to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white text-brown-900 border-0 focus:ring-2 focus:ring-white"
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="bg-brown-800 hover:bg-brown-900 text-white border-0 px-8"
            >
              {loading ? "Subscribing..." : "Subscribe"}
            </Button>
          </div>
        </form>

        <p className="text-sm opacity-75 mt-4">No spam, unsubscribe at any time. We respect your privacy.</p>
      </div>
    </section>
  )
}
