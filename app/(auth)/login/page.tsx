export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-brand-purple border-t-transparent animate-spin" />
      </div>
    }>
      <LoginClient />
    </Suspense>
  )
}
