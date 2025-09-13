'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Phone, Shield } from 'lucide-react'

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          setError(data.error)
          // Redirect to token purchase page
          router.push('/tokens/purchase')
          return
        }
        throw new Error(data.error)
      }

      setMessage('OTP sent to your phone number')
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Verifying OTP for phone:', phone)
      
      const response = await fetch('/api/auth/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp_code: otp }),
        credentials: 'include' // Ensure cookies are stored
      })

      const data = await response.json()
      console.log('Login verification response:', response.status, data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP')
      }

      // Check if the session token was set in the response
      const hasCookieHeader = response.headers.has('set-cookie') || 
                             response.headers.has('X-Session-Token-Set')
      
      console.log('Session token header present:', hasCookieHeader)
      console.log('Session data:', data.session)
      
      // Store session info in localStorage for debugging
      if (data.session?.token) {
        localStorage.setItem('debug_session_token', data.session.token)
        localStorage.setItem('debug_session_expires', data.session.expires_at)
      }

      setMessage('Login successful! Redirecting...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPhone = () => {
    setStep('phone')
    setOtp('')
    setError('')
    setMessage('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SmartPlanner</CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Enter your phone number to get started'
              : 'Enter the verification code sent to your phone'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+254712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="pl-10"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Login'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={handleBackToPhone}
              >
                Back to Phone Number
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Don't have an account?{' '}
              <button 
                className="text-blue-600 hover:underline"
                onClick={() => router.push('/signup')}
              >
                Sign up for free
              </button>
            </p>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="mb-2">
                Subsequent logins cost 1 token (1 KES).
              </p>
              <button 
                className="text-blue-600 hover:underline"
                onClick={() => router.push('/tokens/purchase')}
              >
                Purchase Tokens
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
