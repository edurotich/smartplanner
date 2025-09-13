'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginDebugPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string[]>([]);

  const addDebugMessage = (message: string) => {
    setDebug(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, -1)}: ${message}`]);
  };

  const sendOtp = async () => {
    setLoading(true);
    setError(null);
    addDebugMessage(`Sending OTP to ${phone}`);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok) {
        addDebugMessage(`OTP sent successfully: ${JSON.stringify(data)}`);
        setStep('otp');
      } else {
        setError(data.error || 'Failed to send OTP');
        addDebugMessage(`Error sending OTP: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Network error');
      addDebugMessage(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError(null);
    addDebugMessage(`Verifying OTP: ${otp}`);

    try {
      const response = await fetch('/api/auth/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ phone, otp_code: otp }),
      });

      // Check response headers for our debug headers
      const sessionTokenSet = response.headers.get('X-Session-Token-Set');
      const sessionTokenLength = response.headers.get('X-Session-Token-Length');
      
      addDebugMessage(`Response headers: X-Session-Token-Set=${sessionTokenSet}, X-Session-Token-Length=${sessionTokenLength}`);

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        addDebugMessage(`Login successful: ${JSON.stringify(data)}`);
        checkCookies();
      } else {
        setError(data.error || 'Failed to verify OTP');
        addDebugMessage(`Error verifying OTP: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Network error');
      addDebugMessage(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkCookies = async () => {
    addDebugMessage(`Checking cookies: ${document.cookie}`);
    const hasSessionToken = document.cookie.includes('session-token=');
    addDebugMessage(`Has session-token cookie: ${hasSessionToken}`);

    // Try to parse the cookie value
    if (hasSessionToken) {
      const match = document.cookie.match(/session-token=([^;]+)/);
      if (match) {
        const cookieValue = match[1];
        addDebugMessage(`Session token value length: ${cookieValue.length}`);
      }
    }

    // Try the debug API
    try {
      addDebugMessage('Calling debug API to verify session...');
      const debugResponse = await fetch('/api/debug-auth', {
        credentials: 'include',
      });
      const debugData = await debugResponse.json();
      addDebugMessage(`Debug API response: ${JSON.stringify(debugData)}`);
    } catch (err) {
      addDebugMessage(`Error calling debug API: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Check cookie on page load
  useEffect(() => {
    addDebugMessage('Page loaded');
    checkCookies();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Login Debug Tool</CardTitle>
            <CardDescription>
              This tool will help diagnose cookie and session issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'phone' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="254711222333"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 254XXXXXXXXX (without + sign)
                  </p>
                </div>
                <Button 
                  onClick={sendOtp} 
                  disabled={loading || !phone}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OTP Code
                  </label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('phone')}
                    disabled={loading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={verifyOtp} 
                    disabled={loading || !otp || otp.length !== 6}
                    className="flex-1"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 p-3 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {result && (
              <div className="bg-green-50 p-3 rounded text-green-700 text-sm space-y-2">
                <p className="font-medium">Login Successful!</p>
                <p>Token: {result.session?.token ? `${result.session.token.substring(0, 5)}...` : 'None'}</p>
                <p>Expires: {result.session?.expires_at ? new Date(result.session.expires_at).toLocaleString() : 'N/A'}</p>
                <p>Tokens: {result.tokens_remaining}</p>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      window.location.href = '/projects';
                    }}
                  >
                    Go to Projects
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Log */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Debug Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-md">
              <pre className="text-xs overflow-auto max-h-60">
                {debug.join('\n')}
              </pre>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={checkCookies}
              >
                Check Cookies
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setDebug([])}
              >
                Clear Log
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}