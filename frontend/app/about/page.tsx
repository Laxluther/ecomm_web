"use client"

import Image from "next/image"
import { Leaf, Users, Award, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-green-50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-green-800 mb-6">About Laurium Ipsum</h1>
            <p className="text-xl text-green-700 leading-relaxed">
              We're passionate about bringing you the finest natural products that enhance your daily life. Our journey
              began with a simple belief: nature provides the best solutions for wellness and vitality.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-heading font-bold text-green-800 mb-6">Our Story</h2>
              <div className="space-y-4 text-green-700">
                <p>
                  Founded in 2020, Laurium Ipsum emerged from a deep appreciation for the healing power of nature. Our
                  founders, passionate about wellness and sustainability, set out to create a brand that would bridge
                  the gap between traditional wisdom and modern lifestyle needs.
                </p>
                <p>
                  What started as a small collection of carefully curated natural products has grown into a
                  comprehensive wellness ecosystem. We work directly with farmers and producers who share our commitment
                  to quality, sustainability, and ethical practices.
                </p>
                <p>
                  Today, we're proud to serve thousands of customers across India, helping them discover the
                  transformative power of nature's finest offerings.
                </p>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="Our story"
                width={600}
                height={400}
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-green-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-green-800 mb-4">Our Values</h2>
            <p className="text-green-700 max-w-2xl mx-auto">
              These core principles guide everything we do, from product selection to customer service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-2">Natural</h3>
              <p className="text-green-700">
                We believe in the power of natural ingredients, sourced responsibly from trusted suppliers.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                <Award className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-2">Quality</h3>
              <p className="text-green-700">
                Every product undergoes rigorous testing to ensure it meets our high standards of excellence.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-2">Community</h3>
              <p className="text-green-700">
                We support local communities and sustainable farming practices that benefit everyone.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 shadow-md">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-2">Care</h3>
              <p className="text-green-700">
                Your wellness journey matters to us. We're here to support you every step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-green-800 mb-4">Meet Our Team</h2>
            <p className="text-green-700 max-w-2xl mx-auto">
              The passionate individuals behind Laurium Ipsum, dedicated to bringing you the best of nature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="relative mb-4">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Team member"
                  width={200}
                  height={200}
                  className="rounded-full mx-auto"
                />
              </div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-1">Priya Sharma</h3>
              <p className="text-green-600 mb-2">Founder & CEO</p>
              <p className="text-green-700 text-sm">
                Passionate about wellness and sustainability, Priya leads our mission to bring natural solutions to
                modern life.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-4">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Team member"
                  width={200}
                  height={200}
                  className="rounded-full mx-auto"
                />
              </div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-1">Rajesh Kumar</h3>
              <p className="text-green-600 mb-2">Head of Product</p>
              <p className="text-green-700 text-sm">
                With 15 years in natural products, Rajesh ensures every item meets our strict quality standards.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-4">
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Team member"
                  width={200}
                  height={200}
                  className="rounded-full mx-auto"
                />
              </div>
              <h3 className="text-xl font-heading font-bold text-green-800 mb-1">Anita Patel</h3>
              <p className="text-green-600 mb-2">Customer Experience</p>
              <p className="text-green-700 text-sm">
                Anita leads our customer support team, ensuring every customer has an exceptional experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-800 text-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-heading font-bold mb-4">Join Our Wellness Journey</h2>
            <p className="text-green-100 mb-8 text-lg">
              Discover the difference that natural, high-quality products can make in your daily life. Start your
              wellness journey with us today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/shop"
                className="bg-white text-green-800 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors"
              >
                Shop Now
              </a>
              <a
                href="/contact"
                className="border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-green-800 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
