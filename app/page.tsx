import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { computeSessionToken, SESSION_COOKIE } from '@/lib/auth'

export default async function RootPage() {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  if (session?.value === computeSessionToken()) {
    redirect('/dashboard')
  }
  redirect('/login')
}
