import type React from "react"
import type { Metadata } from "next"
import { Inter, Crimson_Text, Libre_Baskerville, Kablammo } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { generateSEO, structuredData } from "@/lib/seo"
import { Toaster } from "react-hot-toast"

const inter = Inter({ subsets: ["latin"] })
const crimson = Crimson_Text({ 
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ['400', '600', '700']
})
const libre = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-libre",
  weight: ['400', '700']
})
const kablammo = Kablammo({
  subsets: ["latin"],
  variable: "--font-kablammo"
})

export const metadata: Metadata = generateSEO()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#059669" />
      </head>
      <body className={`${inter.className} ${crimson.variable} ${libre.variable} ${kablammo.variable}`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#363636",
                color: "#fff",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
