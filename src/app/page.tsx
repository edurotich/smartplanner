'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  Smartphone, 
  Shield, 
  CreditCard, 
  BarChart3,
  Coins,
  Building,
  ArrowRight,
  User,
  LogOut
} from 'lucide-react'
import PWARegister from '@/components/PWARegister'
import { toast } from 'sonner'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)

  useEffect(() => {
    // Check if user is authenticated 
    const checkAuth = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Ensure cookies are sent
        })
        
        if (response.ok) {
          // User is authenticated
          const data = await response.json()
          setAuthenticated(true)
          setUserInfo(data.user)
          setTokenBalance(data.tokens?.balance || 0)
        } else {
          setAuthenticated(false)
          setUserInfo(null)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        setAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  return (
    <>
      <PWARegister />
      
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading SmartPlanner...</p>
          </div>
        </div>
      ) : authenticated ? (
        // Authenticated Dashboard View
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-blue-600 mr-3" />
                  <h1 className="text-2xl font-bold text-gray-900">SmartPlanner</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <Card className="border-0 shadow-sm bg-white p-2">
                    <CardContent className="p-2 flex items-center">
                      <div className="mr-3">
                        <p className="text-sm text-gray-500">Token Balance</p>
                        <p className="text-xl font-bold">{tokenBalance || 0}</p>
                      </div>
                      <Button 
                        variant={tokenBalance && tokenBalance < 5 ? "default" : "outline"}
                        size="sm"
                        className={tokenBalance && tokenBalance < 5 ? "bg-blue-600 hover:bg-blue-700" : ""}
                        onClick={() => router.push('/tokens/purchase')}
                      >
                        {tokenBalance && tokenBalance < 5 ? (
                          <span className="flex items-center">
                            <Coins className="h-3.5 w-3.5 mr-1.5" />
                            Low Balance
                          </span>
                        ) : (
                          "Buy Tokens"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/settings')}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {userInfo?.name || userInfo?.phone || 'User'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={async () => {
                        try {
                          await fetch('/api/auth/logout', {
                            method: 'POST',
                            credentials: 'include'
                          });
                          toast.success('Logged out successfully');
                          router.push('/auth');
                        } catch (error) {
                          console.error('Logout error:', error);
                        }
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
                <p className="text-gray-600 mt-1">Manage your construction projects efficiently</p>
              </div>
              <Button 
                onClick={() => router.push('/projects/new')}
              >
                New Project
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Token Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tokenBalance || 0}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {tokenBalance && tokenBalance < 5 ? 'Low balance' : 'Available tokens'}
                  </div>
                  <Button 
                    variant="link" 
                    className="px-0 text-blue-600"
                    onClick={() => router.push('/tokens/purchase')}
                  >
                    Purchase more
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="col-span-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-2">Welcome to SmartPlanner</h3>
                  <p className="mb-4 opacity-90">
                    Track your construction projects' finances with ease and precision.
                  </p>
                  <div className="flex space-x-3">
                    <Button 
                      variant="secondary" 
                      className="bg-white text-blue-600 hover:bg-gray-100"
                      onClick={() => router.push('/projects')}
                    >
                      My Projects
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-white text-white hover:bg-blue-700"
                      onClick={() => router.push('/reports')}
                    >
                      View Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/projects')}
              >
                <CardHeader>
                  <CardTitle>My Projects</CardTitle>
                  <CardDescription>
                    View and manage all your construction projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Building className="h-12 w-12 text-blue-600 opacity-80" />
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="ghost" className="w-full justify-between">
                    View All Projects
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/tokens/purchase')}
              >
                <CardHeader>
                  <CardTitle>Purchase Tokens</CardTitle>
                  <CardDescription>
                    Buy tokens via M-PESA for login and exports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Coins className="h-12 w-12 text-yellow-500 opacity-80" />
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="ghost" className="w-full justify-between">
                    Buy Tokens
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push('/reports')}
              >
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>
                    Generate financial reports and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <BarChart3 className="h-12 w-12 text-green-500 opacity-80" />
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button variant="ghost" className="w-full justify-between">
                    Generate Reports
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </main>
        </div>
      ) : (
        // Public Landing Page
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Header */}
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-blue-600 mr-3" />
                  <h1 className="text-2xl font-bold text-gray-900">SmartPlanner</h1>
                </div>
                <div className="space-x-3">
                  <Button variant="outline" onClick={() => router.push('/auth')}>
                    Login
                  </Button>
                  <Button onClick={() => router.push('/auth')}>
                    Sign Up Free
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="py-20 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-blue-100 text-blue-800">
                PWA • Installable Mobile App
              </Badge>
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Project Expense & Income Tracker
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Track your project finances with secure OTP login, token-based billing, 
                and comprehensive reporting. Install as a mobile app for offline access.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="px-8 py-3"
                  onClick={() => router.push('/auth')}
                >
                  Sign Up Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="px-8 py-3"
                  onClick={() => router.push('/auth')}
                >
                  Login
                </Button>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Everything You Need
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* OTP Authentication */}
                <Card className="transition-transform hover:scale-105">
                  <CardHeader>
                    <Shield className="h-10 w-10 text-green-600 mb-2" />
                    <CardTitle>Secure OTP Login</CardTitle>
                    <CardDescription>
                      Phone number registration with SMS verification. 
                      First signup free, subsequent logins cost 1 token.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Token Billing */}
                <Card className="transition-transform hover:scale-105">
                  <CardHeader>
                    <Coins className="h-10 w-10 text-yellow-600 mb-2" />
                    <CardTitle>Token-Based Billing</CardTitle>
                    <CardDescription>
                      Purchase tokens via M-PESA. Each login and password reset 
                      consumes 1 token (1 KES).
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* M-PESA Integration */}
                <Card className="transition-transform hover:scale-105">
                  <CardHeader>
                    <CreditCard className="h-10 w-10 text-blue-600 mb-2" />
                    <CardTitle>M-PESA Payments</CardTitle>
                    <CardDescription>
                      Seamless integration with M-PESA Daraja API for 
                      secure and convenient token purchases.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Project Management */}
                <Card className="transition-transform hover:scale-105">
                  <CardHeader>
                    <Calculator className="h-10 w-10 text-purple-600 mb-2" />
                    <CardTitle>Project Management</CardTitle>
                    <CardDescription>
                      Track multiple projects with expenses, income, 
                      tax rates, and reinvestment calculations.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Financial Reports */}
                <Card className="transition-transform hover:scale-105">
                  <CardHeader>
                    <BarChart3 className="h-10 w-10 text-red-600 mb-2" />
                    <CardTitle>Financial Reports</CardTitle>
                    <CardDescription>
                      Comprehensive reports with profit calculations, 
                      tax deductions, and profitability analysis.
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* PWA Features */}
                <Card className="transition-transform hover:scale-105">
                  <CardHeader>
                    <Smartphone className="h-10 w-10 text-indigo-600 mb-2" />
                    <CardTitle>Mobile App (PWA)</CardTitle>
                    <CardDescription>
                      Install on Android/iOS. Offline support with 
                      local storage and automatic sync when online.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-gray-900 text-white py-12 px-4">
            <div className="max-w-6xl mx-auto text-center">
              <div className="flex items-center justify-center mb-6">
                <Building className="h-8 w-8 text-blue-400 mr-3" />
                <h4 className="text-2xl font-bold">SmartPlanner</h4>
              </div>
              <p className="text-gray-400 mb-8">
                Professional project expense and income tracking for modern businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="outline" 
                  className="border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => router.push('/auth')}
                >
                  Sign Up Free
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => router.push('/auth')}
                >
                  Login
                </Button>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-400">
                <p>&copy; {new Date().getFullYear()} SmartPlanner. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  )
}