'use client';

import '../src/index.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Modal } from '@/components/common/Modal'
import DeveloperRoleSwitcher from '@/components/common/DeveloperRoleSwitcher'
import ErrorBoundary from '@/components/common/ErrorBoundary'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-background text-foreground antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('bs-app-theme');
                  var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  if (savedTheme === 'dark' || (savedTheme === 'auto' && systemTheme === 'dark') || (!savedTheme && systemTheme === 'dark')) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <Modal />
              <DeveloperRoleSwitcher />
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
