import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewsletterSection() {
  return (
    <section className="py-16 bg-amber-50">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">10% OFF YOUR FIRST ORDER</h2>
          <p className="text-gray-600 mb-6">
            Subscribe to our newsletter and receive exclusive offers, early access to new products, and wellness tips.
          </p>
          <form className="flex flex-col sm:flex-row gap-3">
            <Input type="email" placeholder="Your email address" className="flex-1" required />
            <Button type="submit" className="bg-amber-700 hover:bg-amber-800">
              Subscribe
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
