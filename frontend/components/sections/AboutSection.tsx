export function AboutSection() {
  return (
    <section className="py-16 bg-amber-50/50">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="section-title">Homebrewing with Craft & Brew</h2>
          <p className="section-subtitle">
            From beer and wine to mead and kombucha, Craft & Brew offers premium homebrewing kits that make it easy to
            create your own beverages right at home. Whether you're new to brewing or an experienced enthusiast, our
            kits include everything you need to get started.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🍺</span>
              </div>
              <h3 className="font-heading font-bold text-xl text-amber-900">Premium Kits</h3>
              <p className="text-amber-700">
                Complete brewing kits with all ingredients and equipment needed for your first batch.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="font-heading font-bold text-xl text-amber-900">Expert Guidance</h3>
              <p className="text-amber-700">
                Step-by-step instructions and expert tips to ensure brewing success every time.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="font-heading font-bold text-xl text-amber-900">Quality Guaranteed</h3>
              <p className="text-amber-700">
                Premium ingredients and equipment sourced from trusted suppliers worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
