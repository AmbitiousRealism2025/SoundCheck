import { type RequestHandler } from 'express'
import { supabase } from './lib/supabase'

// Validate required environment variables at startup
function validateEnvironment() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  console.log('Auth configured for Supabase')
}

validateEnvironment()

export async function setupAuth(app: any) {
  app.set("trust proxy", 1)

  // Supabase auth endpoints
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, firstName, lastName } = req.body

    console.log('Signup request:', { email, firstName, lastName })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${req.protocol}://${req.get('host')}/`,
          // Skip email confirmation for development
          noConfirmEmail: true
        }
      })

      if (error) {
        console.log('Supabase signup error:', error)
        let errorMessage = error.message

        // Provide more user-friendly error messages
        if (error.code === 'email_address_invalid') {
          errorMessage = 'Please enter a valid email address (e.g., user@gmail.com)'
        } else if (error.message.includes('password')) {
          errorMessage = 'Password must be at least 6 characters long'
        }

        return res.status(400).json({ error: errorMessage })
      }

      console.log('Signup successful:', { user: data.user, session: !!data.session })

      // For development, if no session was created (email confirmation required),
      // automatically sign in the user
      if (!data.session && data.user) {
        console.log('Auto-signing in user for development...')
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          console.log('Auto-signin failed:', signInError)
          // Return the original signup response
          return res.json({
            message: 'Signup successful',
            user: data.user,
            session: null
          })
        }

        console.log('Auto-signin successful')
        return res.json({
          message: 'Signup successful',
          user: signInData.user,
          session: signInData.session
        })
      }

      res.json({
        message: 'Signup successful',
        user: data.user,
        session: data.session
      })
    } catch (error) {
      console.log('Server error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return res.status(401).json({ error: error.message })
      }

      res.json({
        message: 'Login successful',
        user: data.user,
        session: data.session
      })
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  app.post('/api/auth/logout', async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return res.status(400).json({ error: error.message })
      }

      res.json({ message: 'Logout successful' })
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  // OAuth login endpoint for redirecting to Supabase auth
  app.get('/api/login', (req, res) => {
    const redirectUrl = `${req.protocol}://${req.get('host')}/auth/callback`
    const authUrl = `https://dzafkwqhzeinbzgwbfwv.supabase.co/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`
    res.redirect(authUrl)
  })

  // Email confirmation callback handler
  app.get('/auth/callback', async (req, res) => {
    try {
      const { error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session after confirmation:', error)
        return res.redirect('/login?error=Could not confirm email')
      }

      // Email confirmed successfully, redirect to login page with success message
      res.redirect('/login?message=Email confirmed successfully! Please log in.')
    } catch (error) {
      console.error('Email confirmation error:', error)
      res.redirect('/login?error=Confirmation failed')
    }
  })
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Missing or invalid authorization header" })
  }

  const token = authHeader.substring(7)

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ message: "Invalid or expired token" })
    }

    // Add user to request object for use in route handlers
    req.user = user
    return next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({ message: "Authentication failed" })
  }
}

// Helper function to extract user ID from authenticated request
export const getUserId = (req: any): string => {
  return req.user?.id
}