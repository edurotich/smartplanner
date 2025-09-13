'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Phone, Shield, UserPlus, LogIn } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      const data = await response.json()

      if (response.ok) {
        if (mode === 'signup') {
          setUserId(data.userId)
          setMessage(data.message || 'Account created! OTP sent to your phone. Check your SMS.')
        } else {
          setUserId(data.userId || '') // Login might not return userId, that's fine
          setMessage(data.message || 'OTP sent to your phone! Check your SMS.')
        }
        setStep('otp')
      } else {
        setError(data.error || `Failed to ${mode === 'signup' ? 'create account' : 'send login OTP'}`)
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const endpoint = mode === 'signup' ? '/api/auth/verify-otp-simple' : '/api/auth/verify-login'
      const requestBody = mode === 'signup' 
        ? { phone, otp_code: otp, user_id: userId }
        : { phone, otp_code: otp } // Login doesn't need user_id

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are received
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`${mode === 'signup' ? 'Account verified' : 'Login'} successful! You are now logged in.`)
        
        // Print debug information about cookies
        console.log('Login successful! Checking cookies...')
        console.log('Current cookies:', document.cookie)
        
        // Check for session-token specifically
        const hasSessionToken = document.cookie.includes('session-token=')
        console.log('Has session-token:', hasSessionToken)
        
        if (!hasSessionToken) {
          console.warn('Warning: No session-token cookie found after login!')
          setError('Warning: Login succeeded but no session cookie was set. Please contact support.')
        }
        
        // Test the session token immediately with the debug API
        console.log('Testing session with debug API...')
        try {
          const debugResponse = await fetch('/api/debug-auth', {
            credentials: 'include'
          })
          const debugData = await debugResponse.json()
          console.log('Debug API response:', debugData)
          
          if (!debugData.cookies.sessionTokenPresent) {
            console.warn('Debug API confirms session token is missing!')
          }
        } catch (err) {
          console.error('Error testing debug API:', err)
        }
        
        // Redirect to projects page
        setTimeout(() => {
          window.location.href = '/projects'
        }, 1500)
      } else {
        setError(data.error || 'Failed to verify OTP')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep('phone')
    setPhone('')
    setOtp('')
    setUserId('')
    setError('')
    setMessage('')
  }

  const switchMode = () => {
    const newMode = mode === 'signup' ? 'login' : 'signup'
    setMode(newMode)
    resetForm()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SmartPlanner</h1>
          <p className="mt-2 text-gray-600">Project Expense & Income Tracker</p>
        </div>

  {step === 'phone' && (
          <Card>
            <CardHeader className="text-center">
              {mode === 'signup' ? (
                <UserPlus className="mx-auto h-12 w-12 text-blue-600" />
              ) : (
                <LogIn className="mx-auto h-12 w-12 text-green-600" />
              )}
              <CardTitle>
                {mode === 'signup' ? 'Create Account' : 'Login'}
              </CardTitle>
              <CardDescription>
                {mode === 'signup' 
                  ? 'Enter your phone number to create a new account'
                  : 'Enter your phone number to login'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePhoneAuth} className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="254711831290"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Format: 254XXXXXXXXX (without + sign)
                  </p>
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                    {error}
                  </div>
                )}
                
                {message && (
                  <div className="text-green-600 text-sm bg-green-50 p-3 rounded">
                    {message}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === 'signup' ? 'Creating Account...' : 'Sending OTP...'}
                    </>
                  ) : (
                    mode === 'signup' ? 'Create Account' : 'Send Login OTP'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {mode === 'signup' 
                      ? 'Already have an account? Login' 
                      : 'Need an account? Sign up'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

  {step === 'otp' && (
          <Card>
            <CardHeader className="text-center">
              <Shield className="mx-auto h-12 w-12 text-green-600" />
              <CardTitle>Verify OTP</CardTitle>
              <CardDescription>
                Enter the 6-digit code sent to {phone}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleOtpVerification} className="space-y-4">
                <div>
                  <Label htmlFor="otp">OTP Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                    className="mt-1 text-center text-lg tracking-widest"
                  />
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                    {error}
                  </div>
                )}
                
                {message && (
                  <div className="text-green-600 text-sm bg-green-50 p-3 rounded">
                    {message}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('phone')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-gray-500">
          {mode === 'signup' ? (
            <p>By signing up, you get 5 free tokens to start using SmartPlanner!</p>
          ) : (
            <p>Login costs 1 token. Purchase more tokens to continue using SmartPlanner.</p>
          )}
        </div>

        {/* Debug Panel for Cookies/Session */}
        <div className="mt-8 p-4 bg-gray-100 rounded text-left text-xs text-gray-700">
          <strong>Debug Info:</strong>
          <div className="mt-1">
            <span>All Cookies: </span>
            <code style={{ wordBreak: 'break-all' }}>{typeof document !== 'undefined' ? document.cookie : 'N/A'}</code>
          </div>
          <div className="mt-1">
            <span>Session Token: </span>
            <code style={{ wordBreak: 'break-all' }}>{typeof document !== 'undefined' ? (document.cookie.split('; ').find(c => c.startsWith('session-token=')) || 'Not set') : 'N/A'}</code>
          </div>
        </div>
      </div>
    </div>
  )
}