import { createAdminClient } from './supabase/server'

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  user?: {
    id: string
    phone: string
    name?: string
    verified: boolean
  }
}

export class PhoneAuthService {
  private static async getAdminClient() {
    return await createAdminClient()
  }

  // Generate a secure session token using Web Crypto API
  static generateSessionToken(): string {
    // Use Web Crypto API for broader compatibility
    const array = new Uint8Array(32)
    if (typeof window !== 'undefined' && window.crypto) {
      // Browser environment
      window.crypto.getRandomValues(array)
    } else if (typeof global !== 'undefined' && global.crypto) {
      // Edge Runtime
      global.crypto.getRandomValues(array)
    } else {
      // Fallback for Node.js environments
      const crypto = require('crypto')
      const buffer = crypto.randomBytes(32)
      return buffer.toString('hex')
    }
    
    // Convert Uint8Array to hex string
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Create a new user session (7 days expiry)
  static async createSession(userId: string): Promise<{ token: string; expires_at: string } | null> {
    try {
      const adminClient = await this.getAdminClient()
      const sessionToken = this.generateSessionToken()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      
      // Delete any existing sessions for this user to avoid conflicts
      await adminClient
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)
      
      console.log(`Creating new session for user: ${userId}, token length: ${sessionToken.length}`)
      
      const { data, error } = await adminClient
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Session creation error:', error)
        return null
      }
      
      console.log(`Session created successfully with ID: ${data.id}`)

      return {
        token: sessionToken,
        expires_at: expiresAt.toISOString()
      }
    } catch (error) {
      console.error('Session creation exception:', error)
      return null
    }
  }

  // Validate session token and return user info
  static async validateSession(sessionToken: string): Promise<UserSession | null> {
    try {
      if (!sessionToken || sessionToken.length < 10) {
        console.log('Invalid session token format');
        return null;
      }
      
      console.log(`Validating session token: ${sessionToken.substring(0, 6)}...${sessionToken.substring(sessionToken.length - 6)}`);
      
      const adminClient = await this.getAdminClient();
      
      // Clean up expired sessions first - but don't wait for it
      try {
        adminClient
          .from('user_sessions')
          .delete()
          .lt('expires_at', new Date().toISOString())
          .then((result) => {
            console.log(`Cleaned up ${result.count || 0} expired sessions`);
          });
      } catch (cleanupError) {
        console.error('Error cleaning up expired sessions:', cleanupError);
      }

      // Get session with user info - direct query approach
      const { data, error } = await adminClient
        .from('user_sessions')
        .select(`
          id,
          user_id,
          session_token,
          expires_at,
          users:user_id (
            id,
            phone,
            name,
            verified
          )
        `)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        console.error('Session validation error:', error);
        
        // Try a fallback query without the expiry check
        const fallbackResult = await adminClient
          .from('user_sessions')
          .select(`
            id,
            user_id,
            session_token,
            expires_at,
            users:user_id (
              id,
              phone,
              name,
              verified
            )
          `)
          .eq('session_token', sessionToken)
          .single();
          
        if (fallbackResult.error || !fallbackResult.data) {
          console.log('No valid session found, even without expiry check');
          return null;
        }
        
        // Check if it's expired
        if (new Date(fallbackResult.data.expires_at) < new Date()) {
          console.log('Session found but expired:', fallbackResult.data.expires_at);
          return null;
        }
        
        console.log(`Session found in fallback for user: ${(fallbackResult.data.users as any)?.phone || 'unknown'}`);
        
        return {
          id: fallbackResult.data.id,
          user_id: fallbackResult.data.user_id,
          session_token: fallbackResult.data.session_token,
          expires_at: fallbackResult.data.expires_at,
          user: fallbackResult.data.users as any
        };
      }
      
      if (!data) {
        console.log('No session found with token');
        return null;
      }
      
      console.log(`Session found for user: ${(data.users as any)?.phone || 'unknown'}`);

      return {
        id: data.id,
        user_id: data.user_id,
        session_token: data.session_token,
        expires_at: data.expires_at,
        user: data.users as any
      };
    } catch (error) {
      console.error('Session validation exception:', error)
      return null
    }
  }

  // Extend session expiry (refresh session)
  static async refreshSession(sessionToken: string): Promise<boolean> {
    try {
      const adminClient = await this.getAdminClient()
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      
      const { error } = await adminClient
        .from('user_sessions')
        .update({ expires_at: newExpiresAt.toISOString() })
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString()) // Only refresh active sessions

      return !error
    } catch (error) {
      console.error('Session refresh exception:', error)
      return false
    }
  }

  // Delete a session (logout)
  static async deleteSession(sessionToken: string): Promise<boolean> {
    try {
      const adminClient = await this.getAdminClient()
      
      const { error } = await adminClient
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken)

      return !error
    } catch (error) {
      console.error('Session deletion exception:', error)
      return false
    }
  }

  // Delete all sessions for a user
  static async deleteAllUserSessions(userId: string): Promise<boolean> {
    try {
      const adminClient = await this.getAdminClient()
      
      const { error } = await adminClient
        .from('user_sessions')
        .delete()
        .eq('user_id', userId)

      return !error
    } catch (error) {
      console.error('User sessions deletion exception:', error)
      return false
    }
  }

  // Generate OTP code
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Send OTP via Wasiliana
  static async sendOTP(phone: string, otpCode: string, isSignup = false): Promise<{success: boolean, error?: string, data?: any}> {
    try {
      console.log('Sending OTP to:', phone, 'Code:', otpCode, 'IsSignup:', isSignup)
      
      const wasiliana_url = `${process.env.WASILIANA_BASE_URL}/api/v1/send/sms`
      const message = isSignup 
        ? `Welcome to SmartPlanner! Your signup code: ${otpCode}. FREE signup!`
        : `SmartPlanner login code: ${otpCode}. Valid for 5 minutes.`
      
      console.log('SMS URL:', wasiliana_url)
      console.log('SMS message:', message)
      
      const smsResponse = await fetch(wasiliana_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ApiKey': process.env.WASILIANA_API_KEY || ''
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
          from: process.env.WASILIANA_SENDER_ID || 'SMARTPLAN'
        })
      })

      console.log('SMS Response status:', smsResponse.status)
      console.log('SMS Response ok:', smsResponse.ok)

      if (smsResponse.ok) {
        const responseData = await smsResponse.json()
        console.log('SMS Response data:', responseData)
        return { 
          success: true, 
          data: responseData 
        }
      } else {
        const errorData = await smsResponse.text()
        console.log('SMS Error data:', errorData)
        return { 
          success: false, 
          error: `SMS API error: ${smsResponse.status} - ${errorData}` 
        }
      }
    } catch (error) {
      console.error('SMS sending exception:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown SMS error' 
      }
    }
  }

  // Deduct token for OTP usage
  static async deductOTPToken(userId: string): Promise<boolean> {
    try {
      const adminClient = await this.getAdminClient()
      
      // Check current balance
      const { data: tokenData } = await adminClient
        .from('user_tokens')
        .select('balance')
        .eq('user_id', userId)
        .single()

      if (!tokenData || tokenData.balance < 1) {
        return false // Insufficient tokens
      }

      // Deduct 1 token
      const { error } = await adminClient
        .from('user_tokens')
        .update({ 
          balance: tokenData.balance - 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      return !error
    } catch (error) {
      console.error('Token deduction error:', error)
      return false
    }
  }
}