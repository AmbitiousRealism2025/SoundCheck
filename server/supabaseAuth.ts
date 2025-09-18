import { type RequestHandler, type Request, type Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

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
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body

    console.log('Signup request received')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${req.protocol}://${req.get('host')}/auth/callback`
        }
      })

      if (error) {
        console.log('Supabase signup error:', error.message)
        let errorMessage = error.message

        // Provide more user-friendly error messages
        if (error.code === 'email_address_invalid') {
          errorMessage = 'Please enter a valid email address (e.g., user@gmail.com)'
        } else if (error.message.includes('password')) {
          errorMessage = 'Password must be at least 6 characters long'
        }

        return res.status(400).json({ error: errorMessage })
      }

      console.log('Signup successful')

      // For development, if no session was created (email confirmation required),
      // manually confirm the user and create a session
      if (!data.session && data.user) {
        console.log('Manually confirming user for development...')

        try {
          // Use admin client to confirm email
          const supabaseUrl = process.env.SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !serviceKey) {
            throw new Error('Missing required environment variables for admin client');
          }

          const supabaseAdmin = createClient(supabaseUrl, serviceKey)

          // Update user to confirm email
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            data.user.id,
            { email_confirm: true }
          )

          if (updateError) {
            console.log('Failed to auto-confirm email:', updateError.message)
          } else {
            console.log('Email auto-confirmed successfully')

            // Now try to sign in
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            })

            if (!signInError && signInData.session) {
              console.log('Auto-signin successful')
              return res.json({
                message: 'Signup successful',
                user: signInData.user,
                session: signInData.session
              })
            }
          }
        } catch (error) {
          console.log('Auto-confirmation failed')
        }

        // Return the original signup response
        return res.json({
          message: 'Signup successful',
          user: data.user,
          session: null
        })
      }

      res.json({
        message: 'Signup successful',
        user: data.user,
        session: data.session
      })
    } catch (error) {
      console.log('Server error during signup')
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  app.post('/api/auth/login', async (req: Request, res: Response) => {
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

  app.post('/api/auth/logout', async (_req: Request, res: Response) => {
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
  app.get('/api/login', (req: Request, res: Response) => {
    const redirectUrl = `${req.protocol}://${req.get('host')}/auth/callback`
    const authUrl = `${process.env.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`
    res.redirect(authUrl)
  })

  // Compatibility shim for old logout endpoint - client-side logout via supabase.auth.signOut() is preferred
  app.get('/api/logout', (_req: Request, res: Response) => {
    res.status(204).send()
  })

  // Remove server /auth/callback handler - let client handle it
  // The /auth/callback route will be handled by the SPA client
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthenticatedRequest;
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
    authReq.user = user
    return next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({ message: "Authentication failed" })
  }
}

// Helper function to extract user ID from authenticated request
export const getUserId = (req: AuthenticatedRequest): string => {
  return req.user?.id
}
