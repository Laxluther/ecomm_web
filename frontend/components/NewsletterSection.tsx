"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/contexts/ToastContext"

export function NewsletterSection() {
  const [email, setEmail] = useState("")
  const { showToast } = useToast()

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      showToast("Thank you for subscribing!", "success")
      setEmail("")
    }
  }

  return (
    <section className="py-16 bg-green-800 text-white">
      <div className="container text-center">
        <h2 className="text-3xl font-heading font-bold mb-4">Stay Updated</h2>
        <p className="text-green-100 mb-8 max-w-2xl mx-auto">
          Subscribe to our newsletter for the latest wellness tips, product updates, and exclusive offers.
        </p>
        <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg text-green-800 focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  )
}
