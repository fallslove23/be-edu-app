import '../src/index.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BS 학습 관리 앱',
  description: 'BS 교육 과정 관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
