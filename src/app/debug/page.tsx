'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug-auth', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDebugInfo(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">SmartPlanner Debug</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push('/projects')}>
              Back to Projects
            </Button>
            <Button variant="default" onClick={fetchDebugInfo}>
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Authentication Status */}
            <Card className={debugInfo?.session?.valid ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
              <CardHeader>
                <CardTitle className={debugInfo?.session?.valid ? "text-green-600" : "text-yellow-600"}>
                  Authentication Status
                </CardTitle>
                <CardDescription>
                  {debugInfo?.session?.valid 
                    ? "You are authenticated! Your session is valid."
                    : "You are not authenticated. Please log in."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {debugInfo?.session?.valid && (
                  <div className="rounded-md bg-green-100 p-4">
                    <p className="text-sm text-green-700">
                      Logged in as: {debugInfo?.session?.data?.user?.phoneObfuscated || "Unknown"}
                    </p>
                    <p className="text-sm text-green-700">
                      Session expires: {new Date(debugInfo?.session?.data?.expires_at).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-700">
                      Tokens: {debugInfo?.user?.tokens}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle>Cookies ({debugInfo?.cookies?.count || 0})</CardTitle>
                <CardDescription>
                  {debugInfo?.cookies?.sessionTokenPresent 
                    ? "Session token is present ✅" 
                    : "Session token is missing ❌"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded overflow-x-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {debugInfo?.cookies?.all && JSON.stringify(debugInfo.cookies.all, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Request Headers */}
            <Card>
              <CardHeader>
                <CardTitle>Request Headers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded overflow-x-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {debugInfo?.headers && JSON.stringify(debugInfo.headers, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-4 rounded overflow-x-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {debugInfo?.session && JSON.stringify(debugInfo.session, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Timestamp */}
            <div className="text-center text-sm text-gray-500">
              Last refreshed: {debugInfo?.timestamp ? new Date(debugInfo.timestamp).toLocaleString() : "Unknown"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}