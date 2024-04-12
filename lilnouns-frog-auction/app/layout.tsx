import type { Metadata } from 'next'
import { Londrina_Solid } from "next/font/google"
import './globals.css'

const londrinaSolidFont = Londrina_Solid({ weight: "400", subsets: ["latin"] });


export const metadata: Metadata = {
  title: 'Lil Nouns Frame',
  description: 'Lil Nouns Frame',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={londrinaSolidFont.className}>{children}</body>
    </html>
  )
}
