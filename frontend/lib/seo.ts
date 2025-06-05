import type { Metadata } from "next"

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: string
}

export function generateSEO({
  title = "Forest Store - Premium Natural Products",
  description = "Discover premium natural products including pure honey, organic coffee, nuts, and super seeds. Quality guaranteed, sourced directly from nature.",
  keywords = ["natural products", "honey", "coffee", "nuts", "seeds", "organic", "premium"],
  image = "/images/og-image.jpg",
  url = "https://foreststore.com",
  type = "website",
}: SEOProps = {}): Metadata {
  return {
    title,
    description,
    keywords: keywords.join(", "),
    authors: [{ name: "Forest Store" }],
    creator: "Forest Store",
    publisher: "Forest Store",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Forest Store",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type: type as any,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@foreststore",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "your-google-verification-code",
    },
  }
}

export const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Forest Store",
  description: "Premium natural products including honey, coffee, nuts, and seeds",
  url: "https://foreststore.com",
  logo: "https://foreststore.com/images/logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-9876543210",
    contactType: "customer service",
  },
  sameAs: ["https://facebook.com/foreststore", "https://instagram.com/foreststore", "https://twitter.com/foreststore"],
}
