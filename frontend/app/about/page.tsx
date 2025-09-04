import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf, Heart, Users, Award, TreePine } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 pt-32 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About WellNest</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            At WELLNEST, we believe true health comes from living in harmony with nature.
            Our mission is to bring you pure, naturally crafted, and wholesome products that fit seamlessly into a healthy lifestyle — without breaking the bank.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>WellNest is a startup in planning phase</strong> — we're building something special from the ground up. 
                Our vision is to become a trusted global name for natural wellness solutions that inspire people to live 
                healthier, happier, and more mindful lives — one choice at a time.
              </p>
              <p>
                From energizing coffee and revitalizing honey to nutrient-rich snacks, our planned range is designed to 
                fuel your body, uplift your spirit, and support your well-being every single day.
              </p>
              <p>
                We're currently developing partnerships with ethical suppliers and preparing to launch our first collection 
                of premium natural products that embody our motto: <em>"Fuel Your Body, Feed Your Soul — Naturally."</em>
              </p>
            </div>
          </div>
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image src="/images/hero-banner-1.png" alt="Coffee plantation" fill className="object-cover" />
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
              href="mailto:info@wellnest.com"
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
