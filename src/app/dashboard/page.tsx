'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  CheckCircle, 
  Wallet, 
  Plus,
  BarChart3,
  Target,
  PiggyBank,
  AlertTriangle,
  Lightbulb,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface UserProfile {
  phone: string;
  tokens: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  boq_budget: number;
  tax_rate: number;
  reinvestment_rate: number;
  created_at: string;
  total_expenses: number;
  total_income: number;
}

interface ProjectInsight {
  project: Project;
  budgetUtilization: number;
  profitMargin: number;
  status: 'on-track' | 'over-budget' | 'at-risk' | 'profitable';
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

interface DashboardStats {
  totalProjects: number;
  totalExpenses: number;
  totalIncome: number;
  netProfit: number;
  profitableProjects: number;
  overBudgetProjects: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [insights, setInsights] = useState<ProjectInsight[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if user is authenticated by trying to fetch profile
      console.log('Checking authentication...')
      console.log('Document cookies at auth check:', document.cookie)
      
      const response = await fetch('/api/user/profile', {
        credentials: 'include' // Ensure cookies are sent
      });
      if (!response.ok) {
        router.push('/auth');
        return;
      }
      
      await Promise.all([
        fetchUserProfile(),
        fetchProjects()
      ]);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth');
    }
  };

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile...')
      console.log('Document cookies:', document.cookie)
      
      const response = await fetch('/api/user/profile', {
        credentials: 'include' // Ensure cookies are sent
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load user profile');
    }
  };

  const fetchProjects = async () => {
    try {
      console.log('Fetching projects...')
      console.log('Document cookies before projects fetch:', document.cookie)
      
      const response = await fetch('/api/projects', {
        credentials: 'include' // Ensure cookies are sent
      });
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
      
      // Generate insights and stats
      generateInsights(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (projects: Project[]) => {
    const projectInsights: ProjectInsight[] = projects.map(project => {
      const budgetUtilization = (project.total_expenses / project.boq_budget) * 100;
      const profitMargin = project.total_income > 0 
        ? ((project.total_income - project.total_expenses) / project.total_income) * 100 
        : 0;

      let status: ProjectInsight['status'] = 'on-track';
      let recommendation = '';
      let priority: ProjectInsight['priority'] = 'low';

      if (budgetUtilization > 100) {
        status = 'over-budget';
        recommendation = `Project is ${(budgetUtilization - 100).toFixed(1)}% over budget. Consider cost reduction measures.`;
        priority = 'high';
      } else if (budgetUtilization > 80) {
        status = 'at-risk';
        recommendation = `Budget utilization at ${budgetUtilization.toFixed(1)}%. Monitor expenses closely.`;
        priority = 'medium';
      } else if (profitMargin > 20) {
        status = 'profitable';
        recommendation = `Excellent profit margin of ${profitMargin.toFixed(1)}%. Consider scaling similar projects.`;
        priority = 'low';
      } else if (project.total_income === 0 && project.total_expenses > 0) {
        status = 'at-risk';
        recommendation = 'No income recorded yet. Add income entries to track profitability.';
        priority = 'medium';
      }

      return {
        project,
        budgetUtilization,
        profitMargin,
        status,
        recommendation,
        priority
      };
    });

    // Sort by priority and budget utilization
    projectInsights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.budgetUtilization - a.budgetUtilization;
    });

    setInsights(projectInsights);
  };

  const calculateStats = (projects: Project[]) => {
    const stats: DashboardStats = {
      totalProjects: projects.length,
      totalExpenses: projects.reduce((sum, p) => sum + p.total_expenses, 0),
      totalIncome: projects.reduce((sum, p) => sum + p.total_income, 0),
      netProfit: 0,
      profitableProjects: 0,
      overBudgetProjects: 0
    };

    stats.netProfit = stats.totalIncome - stats.totalExpenses;
    stats.profitableProjects = projects.filter(p => p.total_income > p.total_expenses).length;
    stats.overBudgetProjects = projects.filter(p => p.total_expenses > p.boq_budget).length;

    setStats(stats);
  };

  const getStatusIcon = (status: ProjectInsight['status']) => {
    switch (status) {
      case 'profitable':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'on-track':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'at-risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'over-budget':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ProjectInsight['status']) => {
    switch (status) {
      case 'profitable':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on-track':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'over-budget':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.phone}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Token Balance */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Token Balance</p>
                      <p className="text-lg font-bold text-blue-800">{user?.tokens || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Link href="/projects">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Profit</p>
                    <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.netProfit)}
                    </p>
                  </div>
                  {stats.netProfit >= 0 ? (
                    <ArrowUp className="h-8 w-8 text-green-600" />
                  ) : (
                    <ArrowDown className="h-8 w-8 text-red-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Profitable Projects</p>
                    <p className="text-2xl font-bold text-green-600">{stats.profitableProjects}</p>
                  </div>
                  <PiggyBank className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Over Budget</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overBudgetProjects}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Insights and Recommendations */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Smart Recommendations</CardTitle>
                </div>
                <CardDescription>
                  AI-powered insights to help optimize your projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.slice(0, 5).map((insight, index) => (
                      <div key={insight.project.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(insight.status)}
                            <h4 className="font-medium text-gray-900">{insight.project.name}</h4>
                            <Badge className={getStatusColor(insight.status)}>
                              {insight.status.replace('-', ' ')}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">#{index + 1}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">Budget Used</p>
                            <div className="flex items-center space-x-2">
                              <Progress 
                                value={Math.min(insight.budgetUtilization, 100)} 
                                className="flex-1"
                              />
                              <span className="text-sm font-medium">
                                {insight.budgetUtilization.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Profit Margin</p>
                            <p className={`text-sm font-medium ${insight.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {insight.profitMargin.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          {insight.recommendation}
                        </p>
                        
                        <div className="mt-3 flex justify-end">
                          <Link href={`/projects/${insight.project.id}`}>
                            <Button variant="outline" size="sm">
                              View Project
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No projects yet. Create your first project to get insights!</p>
                    <Link href="/projects">
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Summary */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/projects" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </Link>
                <Link href="/projects" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View All Projects
                  </Button>
                </Link>
                <Link href="/purchase-tokens" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Wallet className="h-4 w-4 mr-2" />
                    Buy Tokens
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Financial Overview</CardTitle>
                  <CardDescription>Your portfolio summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Income</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(stats.totalIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Expenses</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(stats.totalExpenses)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Net Profit</span>
                    <span className={`font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.netProfit)}
                    </span>
                  </div>
                  
                  {stats.totalProjects > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Success Rate:</strong> {Math.round((stats.profitableProjects / stats.totalProjects) * 100)}% 
                        of your projects are profitable
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Token Usage Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Token Tips</CardTitle>
                <CardDescription>Optimize your token usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <p className="text-gray-600">
                      Login costs 1 token per session (7 days)
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <p className="text-gray-600">
                      Report exports cost 5 tokens each
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                    <p className="text-gray-600">
                      Project management is free during your session
                    </p>
                  </div>
                </div>
                {user && user.tokens < 10 && (
                  <div className="mt-4">
                    <Link href="/purchase-tokens">
                      <Button size="sm" className="w-full">
                        <Wallet className="h-4 w-4 mr-2" />
                        Recharge Tokens
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
