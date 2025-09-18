import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    (async () => {
      try {
        // Parse tokens from both query (window.location.search) and fragment (window.location.hash)
        const queryParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '')

        // Try to get tokens from query first, then fragment
        const access_token = queryParams.get('access_token') || hashParams.get('access_token')
        const refresh_token = queryParams.get('refresh_token') || hashParams.get('refresh_token')

        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
          window.location.replace('/')
        } else {
          // Fallback: no tokens present
          window.location.replace('/login?message=Email confirmed! Please log in.')
        }
      } catch (e) {
        window.location.replace('/login?error=Confirmation failed')
      }
    })()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>Completing sign-in…</div>
    </div>
  )
}

