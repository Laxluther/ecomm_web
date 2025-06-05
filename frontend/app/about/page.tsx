import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf, Heart, Users, Award, TreePine } from "lucide-react"
import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About lorem ipsum</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're passionate about bringing you the finest natural products directly from pristine forests and organic
            farms. Our mission is to connect you with nature's purest offerings while supporting sustainable farming
            practices.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Founded in 2020, lorem ipsum began as a small family business with a simple vision: to share the
                incredible bounty of nature with health-conscious consumers who value quality and authenticity.
              </p>
              <p>
                Our journey started when our founder discovered the amazing health benefits of raw forest honey during a
                trek in the Western Ghats. This experience sparked a passion for sourcing the finest natural products
                directly from their origins.
              </p>
              <p>
                Today, we work with over 100 small-scale farmers and forest communities across India, ensuring fair
                trade practices and sustainable harvesting methods that protect our precious ecosystems.
              </p>
            </div>
          </div>
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image src="/images/hero-banner-1.png" alt="Forest landscape" fill className="object-cover" />
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-2 hover:border-emerald-200 transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">100% Natural</h3>
                <p className="text-gray-600">
                  We source only the purest, unprocessed products directly from nature, with no artificial additives or
                  preservatives.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-emerald-200 transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Ethical Sourcing</h3>
                <p className="text-gray-600">
                  We ensure fair trade practices and support local communities while maintaining the highest quality
                  standards.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 hover:border-emerald-200 transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TreePine className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Sustainability</h3>
                <p className="text-gray-600">
                  We're committed to protecting our environment through sustainable harvesting and eco-friendly
                  packaging.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-emerald-800 text-white rounded-lg p-12 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-emerald-200">Partner Farmers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-emerald-200">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">20+</div>
              <div className="text-emerald-200">Premium Products</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5</div>
              <div className="text-emerald-200">Years of Excellence</div>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-600 mb-8">
              To make premium natural products accessible to everyone while supporting sustainable farming practices and
              empowering rural communities. We believe that when you choose natural, you're not just nourishing your
              body – you're supporting a healthier planet.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-2 border-emerald-100">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Users className="h-6 w-6 text-emerald-600 mr-3" />
                    <h3 className="font-semibold text-lg">Community Impact</h3>
                  </div>
                  <p className="text-gray-600">
                    We work directly with farming communities, ensuring fair wages and supporting local economies while
                    preserving traditional harvesting methods.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-emerald-100">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Award className="h-6 w-6 text-emerald-600 mr-3" />
                    <h3 className="font-semibold text-lg">Quality Assurance</h3>
                  </div>
                  <p className="text-gray-600">
                    Every product undergoes rigorous quality testing and certification to ensure you receive only the
                    finest natural products that meet our strict standards.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-emerald-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            We'd love to hear from you! Get in touch with our team for any questions about our products or sourcing
            practices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:info@foreststore.com"
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Email Us
            </a>
            <a
              href="tel:+919876543210"
              className="inline-flex items-center px-6 py-3 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Call Us
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
