"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Phone, MapPin, Send } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/contexts/ToastContext"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await api.submitContactForm(formData)
      if (response.data?.message) {
        showToast(response.data.message, "success")
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        })
      } else if (response.error) {
        showToast(response.error, "error")
      }
    } catch (error) {
      console.error("Failed to submit contact form:", error)
      showToast("Failed to submit contact form", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-heading font-bold text-green-800 mb-8 text-center">Contact Us</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-heading font-bold text-green-800 mb-6">Get in Touch</h2>
            <p className="text-green-700 mb-8">
              Have questions about our products or services? Fill out the form and our team will get back to you as soon as possible.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-green-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-green-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-green-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-green-700 mb-1">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="Product Inquiry">Product Inquiry</option>
                    <option value="Order Status">Order Status</option>
                    <option value="Return Request">Return Request</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-green-700 mb-1">
                  Your Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  required
                ></textarea>
              </div>
              <div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-heading font-bold text-green-800 mb-6">Contact Information</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800 mb-1">Our Location</h3>
                  <p className="text-green-700">
                    123 Green Forest Avenue
                    <br />
                    Bangalore, Karnataka 560001
                    <br />
                    India
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800 mb-1">Email Us</h3>
                  <p className="text-green-700">
                    <a href="mailto:support@lauriumipsum.com" className="hover:text-green-600 transition-colors">
                      support@lauriumipsum.com
                    </a>
                    <br />
                    <a href="mailto:sales@lauriumipsum.com" className="hover:text-green-600 transition-colors">
                      sales@lauriumipsum.com
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800 mb-1">Call Us</h3>
                  <p className="text-green-700">
                    <a href="tel:+919876543210" className="hover:text-green-600 transition-colors">
                      +91 98765 43210
                    </a>
                    <br />
                    <a href="tel:+918765432109" className="hover:text-green-600 transition-colors">
                      +91 87654 32109
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-heading font-bold text-green-800 mb-6">Business Hours</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700">Monday - Friday:</span>
                <span className="text-green-800 font-medium">10:00 AM - 7:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Saturday:</span>
                <span className="text-green-800 font-medium">11:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Sunday:</span>
                <span className="text-green-800 font-medium">Closed</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="font-heading font-bold text-green-800 mb-2">Follow Us</h3>
            <p className="text-green-700 mb-4">
              Stay connected with us on social media for updates, promotions, and more.
            </p>
            <div className="flex space-\
