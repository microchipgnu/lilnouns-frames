import type { Metadata } from 'next'
import './globals.css'

import { Londrina_Solid } from "next/font/google"

const londrinaSolidFont = Londrina_Solid({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Lil Nouns Playground',
  description: 'Lil Nouns Playground',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${londrinaSolidFont.className}`}>{children}</body>
    </html>
  )
}
