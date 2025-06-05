"use client"

import type React from "react"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Send, Users, Crown } from "lucide-react"
import { adminApi } from "@/lib/api"
import toast from "react-hot-toast"

interface NewsletterModalProps {
  children: React.ReactNode
}

export function NewsletterModal({ children }: NewsletterModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    target_audience: "all",
    include_premium: true,
    include_active: true,
  })

  const sendNewsletterMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.post("/newsletter/send", data)
      return response.data
    },
    onSuccess: (data) => {
      toast.success(`Newsletter sent to ${data.recipients_count} users!`)
      setOpen(false)
      setFormData({
        subject: "",
        message: "",
        target_audience: "all",
        include_premium: true,
        include_active: true,
      })
    },
    onError: () => {
      toast.error("Failed to send newsletter")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in both subject and message")
      return
    }

    // Mock sending newsletter
    setTimeout(() => {
      const mockRecipients =
        formData.target_audience === "all" ? 1247 : formData.target_audience === "premium" ? 234 : 1156

      sendNewsletterMutation.mutate({
        ...formData,
        recipients_count: mockRecipients,
      })
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Send Newsletter</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Newsletter subject..."
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Newsletter content..."
              rows={8}
              required
            />
          </div>

          <div>
            <Label htmlFor="target_audience">Target Audience</Label>
            <Select
              value={formData.target_audience}
              onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>All Users (1,247)</span>
                  </div>
                </SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>Active Users (1,156)</span>
                  </div>
                </SelectItem>
                <SelectItem value="premium">
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-amber-600" />
                    <span>Premium Users (234)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Additional Filters</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include_premium"
                checked={formData.include_premium}
                onCheckedChange={(checked) => setFormData({ ...formData, include_premium: !!checked })}
              />
              <Label htmlFor="include_premium" className="text-sm">
                Include premium users
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include_active"
                checked={formData.include_active}
                onCheckedChange={(checked) => setFormData({ ...formData, include_active: !!checked })}
              />
              <Label htmlFor="include_active" className="text-sm">
                Include only active users
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sendNewsletterMutation.isLoading}>
              <Send className="h-4 w-4 mr-2" />
              {sendNewsletterMutation.isLoading ? "Sending..." : "Send Newsletter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
