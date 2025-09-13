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
  })
}

// Helper function to extract user ID from authenticated request
export const getUserId = (req: any): string => {
  return req.user?.id
}