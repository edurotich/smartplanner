'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import SettingsDialog from './SettingsDialog';
import EditProjectDialog from './EditProjectDialog';

interface Project {
  id: string;
  name: string;
  description: string;
  boq_budget: number;
  tax_rate: number;
  reinvestment_rate: number;
  total_expenses: number;
  total_income: number;
  profit: number;
  profit_margin: number;
  budget_used: number;
  budget_remaining: number;
  tax_amount: number;
  net_profit: number;
  reinvestment_amount: number;
  final_profit: number;
  expenses: Expense[];
  income: Income[];
}

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  created_at: string;
}

interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
  created_at: string;
}

// Common expense categories
const EXPENSE_CATEGORIES = [
  'Materials',
  'Labor',
  'Equipment',
  'Transport',
  'Permits',
  'Utilities',
  'Professional Services',
  'Insurance',
  'Other'
];

// Common income sources
const INCOME_SOURCES = [
  'Client Payment',
  'Progress Payment',
  'Final Payment',
  'Retention Release',
  'Variation Order',
  'Other'
];

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form states
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [projectSettingsForm, setProjectSettingsForm] = useState({
    taxRate: '',
    reinvestmentRate: ''
  });

  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    boqBudget: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [incomeForm, setIncomeForm] = useState({
    source: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  useEffect(() => {
    if (project) {
      setProjectSettingsForm({
        taxRate: project.tax_rate.toString(),
        reinvestmentRate: project.reinvestment_rate.toString()
      });
      
      setProjectForm({
        name: project.name,
        description: project.description || '',
        boqBudget: project.boq_budget.toString()
      });
    }
  }, [project]);

  const fetchProject = async () => {
    try {
      console.log('Fetching project with ID:', params.id);
      const response = await fetch(`/api/projects/${params.id}`, {
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch project');
      }

      // Update to handle the project directly from the response
      setProject(data);
      console.log('Project data set:', data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingExpense 
        ? `/api/projects/${params.id}/expenses/${editingExpense.id}`
        : `/api/projects/${params.id}/expenses`;
      
      const method = editingExpense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(expenseForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save expense');
      }

      toast.success(editingExpense ? 'Expense updated!' : 'Expense added!');
      setShowExpenseDialog(false);
      setEditingExpense(null);
      setExpenseForm({
        title: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchProject(); // Refresh data
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingIncome 
        ? `/api/projects/${params.id}/income/${editingIncome.id}`
        : `/api/projects/${params.id}/income`;
      
      const method = editingIncome ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(incomeForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save income');
      }

      toast.success(editingIncome ? 'Income updated!' : 'Income added!');
      setShowIncomeDialog(false);
      setEditingIncome(null);
      setIncomeForm({
        source: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchProject(); // Refresh data
    } catch (error) {
      console.error('Error saving income:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save income');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${params.id}/expenses/${expenseId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete expense');
      }

      toast.success('Expense deleted!');
      fetchProject(); // Refresh data
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete expense');
    }
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!confirm('Are you sure you want to delete this income?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${params.id}/income/${incomeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete income');
      }

      toast.success('Income deleted!');
      fetchProject(); // Refresh data
    } catch (error) {
      console.error('Error deleting income:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete income');
    }
  };
  
  const handleEditProject = () => {
    setIsEditProjectDialogOpen(true);
  };

  const handleEditSettings = () => {
    setIsSettingsDialogOpen(true);
  };

  const handleProjectUpdate = async (formData: any) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          boqBudget: formData.boqBudget,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project');
      }

      toast.success("Project updated successfully");
      
      setIsEditProjectDialogOpen(false);
      fetchProject(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || "Failed to update project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsUpdate = async (formData: any) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/projects/${params.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          taxRate: formData.taxRate,
          reinvestmentRate: formData.reinvestmentRate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update project settings');
      }

      toast.success("Project settings updated successfully");
      
      setIsSettingsDialogOpen(false);
      fetchProject(); // Refresh data to get updated calculations
    } catch (error: any) {
      toast.error(error.message || "Failed to update project settings");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getBudgetColor = (percentage: number) => {
    if (percentage <= 75) return 'bg-green-500';
    if (percentage <= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    // Enhanced error/debug output for missing/unauthorized project
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg border border-gray-100">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
            <h2 className="mt-2 text-xl font-bold text-gray-900">Project Not Found or Unauthorized</h2>
            <p className="mt-2 text-gray-600">We couldn't find this project, or you don't have access.<br/>This can happen if:</p>
            <ul className="mt-2 text-left text-sm text-gray-500 list-disc list-inside">
              <li>The project was deleted or never existed</li>
              <li>You are not logged in or your session expired</li>
              <li>This project does not belong to your account</li>
            </ul>
          </div>
          <Button onClick={() => router.push('/projects')} className="mt-4 w-full bg-blue-600 hover:bg-blue-700">
            Back to Projects
          </Button>
          <div className="mt-6 text-xs text-gray-400">
            <strong>Debug Info:</strong><br/>
            <span>Session Token: <code>{typeof document !== 'undefined' ? document.cookie : 'N/A'}</code></span><br/>
            <span>Project ID: <code>{params.id}</code></span><br/>
            <span>Time: <code>{new Date().toISOString()}</code></span><br/>
            <Button 
              onClick={() => window.location.href='/debug'} 
              variant="outline" 
              size="sm" 
              className="mt-2 text-xs h-6 w-full"
            >
              Go to Debug Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditProject()}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditSettings()}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(project.boq_budget)}</div>
                  <div className="mt-2">
                    <Progress 
                      value={Math.min(project.budget_used, 100)} 
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {project.budget_used.toFixed(1)}% used
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(project.total_income)}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {project.income?.length || 0} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(project.total_expenses)}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {project.expenses?.length || 0} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getProfitColor(project.profit)}`}>
                    {formatCurrency(project.profit)}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {project.total_income > 0 ? `${project.profit_margin.toFixed(1)}% margin` : 'No income yet'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Financial Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Breakdown</CardTitle>
                  <CardDescription>
                    Detailed profit analysis including taxes and reinvestment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Profit</span>
                    <span className={`font-medium ${getProfitColor(project.profit)}`}>
                      {formatCurrency(project.profit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({project.tax_rate}%)</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(project.tax_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Profit (After Tax)</span>
                    <span className={`font-medium ${getProfitColor(project.net_profit)}`}>
                      {formatCurrency(project.net_profit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reinvestment ({project.reinvestment_rate}%)</span>
                    <span className="font-medium text-blue-600">
                      -{formatCurrency(project.reinvestment_amount)}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Final Profit</span>
                      <span className={`font-bold text-lg ${getProfitColor(project.final_profit)}`}>
                        {formatCurrency(project.final_profit)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Analysis</CardTitle>
                  <CardDescription>
                    Budget utilization and remaining funds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Budget</span>
                    <span className="font-medium">
                      {formatCurrency(project.boq_budget)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expenses</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(project.total_expenses)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget Remaining</span>
                    <span className={`font-medium ${project.budget_remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(project.budget_remaining)}
                    </span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold">Budget Utilization</span>
                      <span className="font-bold">
                        {project.budget_used.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(project.budget_used, 100)} 
                      className={`h-3 mt-2 ${getBudgetColor(project.budget_used)}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Continue in next part... */}

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Expenses</h3>
                <p className="text-gray-600">Track all project expenses</p>
              </div>
              <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                    </DialogTitle>
                    <DialogDescription>
                      Record a new project expense with details.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                      <Label htmlFor="expense-title">Title</Label>
                      <Input
                        id="expense-title"
                        value={expenseForm.title}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Cement purchase"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="expense-category">Category</Label>
                      <Select
                        value={expenseForm.category}
                        onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expense-amount">Amount (KES)</Label>
                      <Input
                        id="expense-amount"
                        type="number"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="expense-date">Date</Label>
                      <Input
                        id="expense-date"
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowExpenseDialog(false);
                          setEditingExpense(null);
                          setExpenseForm({
                            title: '',
                            category: '',
                            amount: '',
                            date: new Date().toISOString().split('T')[0]
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : (editingExpense ? 'Update' : 'Add Expense')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Expenses List */}
            <Card>
              <CardContent className="p-0">
                {project.expenses && project.expenses.length > 0 ? (
                  <div className="divide-y">
                    {project.expenses.map((expense) => (
                      <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <h4 className="font-medium">{expense.title}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Badge variant="outline">{expense.category}</Badge>
                                <span>•</span>
                                <span>{formatDate(expense.date)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-red-600">
                                {formatCurrency(expense.amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingExpense(expense);
                                setExpenseForm({
                                  title: expense.title,
                                  category: expense.category,
                                  amount: expense.amount.toString(),
                                  date: expense.date
                                });
                                setShowExpenseDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <TrendingDown className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start tracking your project expenses.
                    </p>
                    <Button
                      onClick={() => setShowExpenseDialog(true)}
                      className="mt-4"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Expense
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Income</h3>
                <p className="text-gray-600">Track all project income</p>
              </div>
              <Dialog open={showIncomeDialog} onOpenChange={setShowIncomeDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Income
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingIncome ? 'Edit Income' : 'Add New Income'}
                    </DialogTitle>
                    <DialogDescription>
                      Record a new project income with details.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddIncome} className="space-y-4">
                    <div>
                      <Label htmlFor="income-source">Source</Label>
                      <Select
                        value={incomeForm.source}
                        onValueChange={(value) => setIncomeForm(prev => ({ ...prev, source: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select income source" />
                        </SelectTrigger>
                        <SelectContent>
                          {INCOME_SOURCES.map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="income-amount">Amount (KES)</Label>
                      <Input
                        id="income-amount"
                        type="number"
                        value={incomeForm.amount}
                        onChange={(e) => setIncomeForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="income-date">Date</Label>
                      <Input
                        id="income-date"
                        type="date"
                        value={incomeForm.date}
                        onChange={(e) => setIncomeForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowIncomeDialog(false);
                          setEditingIncome(null);
                          setIncomeForm({
                            source: '',
                            amount: '',
                            date: new Date().toISOString().split('T')[0]
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Saving...' : (editingIncome ? 'Update' : 'Add Income')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Income List */}
            <Card>
              <CardContent className="p-0">
                {project.income && project.income.length > 0 ? (
                  <div className="divide-y">
                    {project.income.map((income) => (
                      <div key={income.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <h4 className="font-medium">{income.source}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>{formatDate(income.date)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">
                                {formatCurrency(income.amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingIncome(income);
                                setIncomeForm({
                                  source: income.source,
                                  amount: income.amount.toString(),
                                  date: income.date
                                });
                                setShowIncomeDialog(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteIncome(income.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No income</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start tracking your project income.
                    </p>
                    <Button
                      onClick={() => setShowIncomeDialog(true)}
                      className="mt-4"
                      size="sm"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Income
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Financial Reports</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.expenses && project.expenses.length > 0 ? (
                      <div className="space-y-3">
                        {EXPENSE_CATEGORIES.map((category) => {
                          const categoryExpenses = project.expenses.filter(e => e.category === category);
                          const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
                          const percentage = project.total_expenses > 0 ? (total / project.total_expenses) * 100 : 0;
                          
                          if (total === 0) return null;
                          
                          return (
                            <div key={category} className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{category}</span>
                                  <span className="text-sm text-gray-600">{formatCurrency(total)}</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No expenses to analyze</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Income Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.income && project.income.length > 0 ? (
                      <div className="space-y-3">
                        {INCOME_SOURCES.map((source) => {
                          const sourceIncome = project.income.filter(i => i.source === source);
                          const total = sourceIncome.reduce((sum, i) => sum + i.amount, 0);
                          const percentage = project.total_income > 0 ? (total / project.total_income) * 100 : 0;
                          
                          if (total === 0) return null;
                          
                          return (
                            <div key={source} className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">{source}</span>
                                  <span className="text-sm text-gray-600">{formatCurrency(total)}</span>
                                </div>
                                <Progress value={percentage} className="h-2" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No income to analyze</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Settings Dialog */}
      {project && (
        <SettingsDialog
          isOpen={isSettingsDialogOpen}
          onClose={() => setIsSettingsDialogOpen(false)}
          onSubmit={handleSettingsUpdate}
          initialData={projectSettingsForm}
          isLoading={isLoading}
        />
      )}
      
      {/* Edit Project Dialog */}
      {project && (
        <EditProjectDialog
          isOpen={isEditProjectDialogOpen}
          onClose={() => setIsEditProjectDialogOpen(false)}
          onSubmit={handleProjectUpdate}
          initialData={projectForm}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
