'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function DebugPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [cookieInfo, setCookieInfo] = useState<{name: string; value: string; expires?: string}[]>([]);
  const [userTokens, setUserTokens] = useState<number | null>(null);

  useEffect(() => {
    checkSession();
    checkCookies();
  }, []);

  const checkCookies = () => {
    const cookies = document.cookie.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value };
    });
    setCookieInfo(cookies);
  };

  const checkSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/session', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch session info');
      }
      
      const data = await response.json();
      console.log('Debug session data:', data);
      setSessionInfo(data.session);
      setProjectIds(data.projectIds || []);
      setUserTokens(data.tokens?.balance || null);
    } catch (error) {
      console.error('Error checking session:', error);
      toast.error('Failed to load session information');
    } finally {
      setLoading(false);
    }
  };

  const fixSession = async () => {
    try {
      const response = await fetch('/api/debug/fix-session', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fix session');
      }
      
      toast.success('Session fixed! Please log in again.');
      router.push('/login');
    } catch (error) {
      console.error('Error fixing session:', error);
      toast.error('Failed to fix session');
    }
  };

  const createTestProject = async () => {
    try {
      const response = await fetch('/api/debug/create-test-project', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to create test project');
      }
      
      const data = await response.json();
      toast.success(`Test project created with ID: ${data.projectId}`);
      checkSession();
    } catch (error) {
      console.error('Error creating test project:', error);
      toast.error('Failed to create test project');
    }
  };

  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh session');
      }
      
      toast.success('Session refreshed!');
      checkSession();
    } catch (error) {
      console.error('Error refreshing session:', error);
      toast.error('Failed to refresh session');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Debug Tools</h1>
          <p className="text-gray-500 mt-1">Troubleshoot common issues</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
          <Button variant="outline" onClick={checkSession}>Refresh Info</Button>
        </div>
      </div>

      {loading ? (
        <Card className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Session Information */}
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
              <CardDescription>Details about your current authentication session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Badge variant={sessionInfo ? "success" : "destructive"}>
                  {sessionInfo ? "Authenticated" : "Not Authenticated"}
                </Badge>
                {userTokens !== null && (
                  <Badge variant="outline" className="ml-2">
                    {userTokens} Tokens
                  </Badge>
                )}
              </div>

              {sessionInfo ? (
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">User ID</TableCell>
                      <TableCell>{sessionInfo.user?.id || sessionInfo.user_id}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Phone</TableCell>
                      <TableCell>{sessionInfo.user?.phone || 'Unknown'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Verified</TableCell>
                      <TableCell>{sessionInfo.user?.verified ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Session Token</TableCell>
                      <TableCell className="truncate max-w-xs">
                        {sessionInfo.session_token?.substring(0, 10)}...
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Expires At</TableCell>
                      <TableCell>
                        {sessionInfo.expires_at 
                          ? new Date(sessionInfo.expires_at).toLocaleString()
                          : 'Unknown'
                        }
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4 bg-red-50 text-red-700 rounded-md">
                  No active session found. Please log in.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={refreshSession}>
                Refresh Session
              </Button>
              <Button variant="destructive" onClick={fixSession}>
                Reset Session
              </Button>
            </CardFooter>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies</CardTitle>
              <CardDescription>Current browser cookies</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Value (truncated)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cookieInfo.length > 0 ? (
                    cookieInfo.map((cookie, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{cookie.name}</TableCell>
                        <TableCell className="truncate max-w-xs">
                          {cookie.value.length > 20 
                            ? `${cookie.value.substring(0, 20)}...` 
                            : cookie.value}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">No cookies found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>List of projects you have access to</CardDescription>
            </CardHeader>
            <CardContent>
              {projectIds.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project ID</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectIds.map((id, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{id}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/projects/${id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4 bg-yellow-50 text-yellow-700 rounded-md">
                  No projects found for your account.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={createTestProject}>Create Test Project</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}