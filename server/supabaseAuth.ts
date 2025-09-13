import { type RequestHandler } from 'express'
import { createClient } from '@supabase/supabase-js'
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
          emailRedirectTo: `${req.protocol}://${req.get('host')}/`
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
      // manually confirm the user and create a session
      if (!data.session && data.user) {
        console.log('Manually confirming user for development...')

        try {
          // Use admin client to confirm email
          const supabaseAdmin = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )

          // Update user to confirm email
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            data.user.id,
            { email_confirm: true }
          )

          if (updateError) {
            console.log('Failed to auto-confirm email:', updateError)
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
          console.log('Auto-confirmation failed:', error)
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
      console.log('Auth callback received:', req.query)

      // Supabase sends access_token and refresh_token in the callback
      const { access_token, refresh_token, type } = req.query

      if (type === 'signup' || type === 'recovery') {
        // For email confirmation, we need to exchange the tokens
        if (access_token) {
          const { data, error } = await supabase.auth.getUser(String(access_token))

          if (error) {
            console.error('Error getting user with access token:', error)
            return res.redirect('/login?error=Invalid confirmation link')
          }

          if (data.user) {
            console.log('Email confirmed for user:', data.user.email)

            // Try to set the session
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: String(access_token),
              refresh_token: refresh_token ? String(refresh_token) : ''
            })

            if (sessionError) {
              console.error('Error setting session:', sessionError)
            }

            // Redirect with success message and auto-login script
            return res.send(`
              <html>
                <body>
                  <h2>Email confirmed successfully!</h2>
                  <p>You will be redirected to the application shortly...</p>
                  <script>
                    localStorage.setItem('supabase_token', '${access_token}');
                    setTimeout(() => {
                      window.location.href = '/';
                    }, 2000);
                  </script>
                </body>
              </html>
            `)
          }
        }
      }

      // Fallback: try to get current session
      const { data: sessionData, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session after confirmation:', error)
        return res.redirect('/login?error=Could not confirm email')
      }

      if (sessionData.session) {
        // Session exists, redirect to app
        return res.send(`
          <html>
            <body>
              <h2>Email confirmed successfully!</h2>
              <p>You will be redirected to the application shortly...</p>
              <script>
                localStorage.setItem('supabase_token', '${sessionData.session.access_token}');
                setTimeout(() => {
                  window.location.href = '/';
                }, 2000);
              </script>
            </body>
          </html>
        `)
      }

      // No session found
      res.redirect('/login?message=Email confirmed! Please log in.')
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