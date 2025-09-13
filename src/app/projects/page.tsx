'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Plus, MoreHorizontal, Edit, Trash2, FolderOpen, TrendingUp, TrendingDown, DollarSign, Download, FileText, Table, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

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
  created_at: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null); // projectId being exported
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    boq_budget: '',
    tax_rate: '16',
    reinvestment_rate: '10'
  });

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        fetchProjects();
      } else {
        // Redirect to login if not authenticated
        router.push('/login');
      }
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      console.log('Fetching projects with authentication...');
      
      const response = await fetch('/api/projects', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Projects API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Authentication error while fetching projects');
          toast.error('Your session has expired. Please log in again.');
          await checkAuth(); // Re-check auth status
          router.push('/login');
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
      }
      
      const data = await response.json();
      const projectsArr = data.projects || [];

      // Calculate derived data and sort projects by creation date
      const projectsWithCalculatedData = projectsArr.map((project: any) => {
        const total_expenses = project.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
        const total_income = project.income?.reduce((sum: number, income: any) => sum + income.amount, 0) || 0;
        const profit = total_income - total_expenses;
        const profit_margin = total_income > 0 ? (profit / total_income) * 100 : 0;
        const budget_used = project.boq_budget > 0 ? (total_expenses / project.boq_budget) * 100 : 0;

        return {
          ...project,
          total_expenses,
          total_income,
          profit,
          profit_margin,
          budget_used
        };
      }).sort((a: Project, b: Project) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setProjects(projectsWithCalculatedData);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch projects');
      
      // If there's an auth error, recheck authentication
      checkAuth();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      toast.success('Project created successfully!');
      setShowCreateDialog(false);
      setFormData({
        name: '',
        description: '',
        boq_budget: '',
        tax_rate: '16',
        reinvestment_rate: '10'
      });
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        toast.error('Session expired or unauthorized. Please log in again.');
        checkAuth();
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete project');
      }

      toast.success('Project deleted successfully!');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete project');
    }
  };

  const handleExportReport = async (projectId: string, format: 'pdf' | 'csv') => {
    setExporting(projectId);

    try {
      // First, get the data and deduct tokens
      const response = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ format }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast.error(`Insufficient tokens. You need 5 tokens but have ${result.currentBalance}.`);
          return;
        }
        throw new Error(result.error || 'Failed to export report');
      }

      // Generate and download the file
      if (format === 'pdf') {
        await generatePDFReport(result.data);
      } else {
        await generateCSVReport(result.data);
      }

      toast.success(`Report exported successfully! ${result.tokensDeducted} tokens deducted. Remaining balance: ${result.remainingBalance}`);

    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export report');
    } finally {
      setExporting(null);
    }
  };

  const generatePDFReport = async (data: any) => {
    try {
      // Import both libraries
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      await import('jspdf-autotable');
      
      // Create a new document - use any type to bypass TypeScript errors
      // @ts-ignore - jsPDF with autoTable has complex typing issues
      const doc = new jsPDF();
      const project = data.project;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SmartPlanner Project Report', 20, 20);
      
      doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date(data.generatedAt).toLocaleDateString()}`, 20, 30);

    // Project Information
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Information', 20, 45);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${project.name}`, 20, 55);
    doc.text(`Description: ${project.description || 'N/A'}`, 20, 62);
    doc.text(`BOQ Budget: KES ${project.boq_budget.toLocaleString()}`, 20, 69);
    doc.text(`Tax Rate: ${project.tax_rate}%`, 20, 76);
    doc.text(`Reinvestment Rate: ${project.reinvestment_rate}%`, 20, 83);

    // Financial Summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary', 20, 98);

    const financialData = [
      ['Budget', `KES ${project.boq_budget.toLocaleString()}`],
      ['Total Expenses', `KES ${project.total_expenses.toLocaleString()}`],
      ['Total Income', `KES ${project.total_income.toLocaleString()}`],
      ['Budget Used', `${project.budget_used.toFixed(1)}%`],
      ['Budget Remaining', `KES ${project.budget_remaining.toLocaleString()}`],
      ['Gross Profit', `KES ${project.profit.toLocaleString()}`],
      ['Tax Amount', `KES ${project.tax_amount.toLocaleString()}`],
      ['Net Profit', `KES ${project.net_profit.toLocaleString()}`],
      ['Reinvestment', `KES ${project.reinvestment_amount.toLocaleString()}`],
      ['Final Profit', `KES ${project.final_profit.toLocaleString()}`],
    ];

    // @ts-ignore - jsPDF with autoTable has complex typing issues
    doc.autoTable({
      startY: 110,
      head: [['Metric', 'Value']],
      body: financialData,
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    // Expenses Table
    if (data.expenses.length > 0) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Expenses Breakdown', 20, 20);

      const expenseData = data.expenses.map((expense: any) => [
        expense.title,
        expense.category,
        `KES ${expense.amount.toLocaleString()}`,
        new Date(expense.date).toLocaleDateString(),
      ]);

      // @ts-ignore - jsPDF with autoTable has complex typing issues
      doc.autoTable({
        startY: 30,
        head: [['Title', 'Category', 'Amount', 'Date']],
        body: expenseData,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] },
      });
    }

    // Income Table
    if (data.income.length > 0) {
      if (data.expenses.length === 0) {
        doc.addPage();
      }
      
      // @ts-ignore - Access lastAutoTable property
      const startY = data.expenses.length > 0 ? doc.lastAutoTable.finalY + 20 : 30;
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Income Breakdown', 20, startY - 10);

      const incomeData = data.income.map((income: any) => [
        income.source,
        `KES ${income.amount.toLocaleString()}`,
        new Date(income.date).toLocaleDateString(),
      ]);

      // @ts-ignore - jsPDF with autoTable has complex typing issues
      doc.autoTable({
        startY: startY,
        head: [['Source', 'Amount', 'Date']],
        body: incomeData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] },
      });
    }

    // Save the PDF
    doc.save(`${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  };

  const generateCSVReport = async (data: any) => {
    const Papa = (await import('papaparse')).default;
    const project = data.project;

    // Prepare CSV data
    const csvData = [
      ['SmartPlanner Project Report'],
      ['Generated on', new Date(data.generatedAt).toLocaleDateString()],
      [''],
      ['PROJECT INFORMATION'],
      ['Name', project.name],
      ['Description', project.description || 'N/A'],
      ['BOQ Budget', project.boq_budget],
      ['Tax Rate (%)', project.tax_rate],
      ['Reinvestment Rate (%)', project.reinvestment_rate],
      [''],
      ['FINANCIAL SUMMARY'],
      ['Budget', project.boq_budget],
      ['Total Expenses', project.total_expenses],
      ['Total Income', project.total_income],
      ['Budget Used (%)', project.budget_used.toFixed(1)],
      ['Budget Remaining', project.budget_remaining],
      ['Gross Profit', project.profit],
      ['Tax Amount', project.tax_amount],
      ['Net Profit', project.net_profit],
      ['Reinvestment Amount', project.reinvestment_amount],
      ['Final Profit', project.final_profit],
      [''],
      ['EXPENSES'],
      ['Title', 'Category', 'Amount', 'Date'],
      ...data.expenses.map((expense: any) => [
        expense.title,
        expense.category,
        expense.amount,
        new Date(expense.date).toLocaleDateString(),
      ]),
      [''],
      ['INCOME'],
      ['Source', 'Amount', 'Date'],
      ...data.income.map((income: any) => [
        income.source,
        income.amount,
        new Date(income.date).toLocaleDateString(),
      ]),
    ];

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-600';
    if (profit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Projects</h1>
            <p className="mt-2 text-gray-600 text-base">All your construction projects in one place. Click a project to view details, add expenses, or track income.</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Set up a new construction project to track expenses and income.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  {/* ...existing code for form fields... */}
                  <div>
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Residential Building A"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of the project"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="boq_budget">BOQ Budget (KES)</Label>
                    <Input
                      id="boq_budget"
                      type="number"
                      value={formData.boq_budget}
                      onChange={(e) => setFormData(prev => ({ ...prev, boq_budget: e.target.value }))}
                      placeholder="e.g. 5000000"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                      <Input
                        id="tax_rate"
                        type="number"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: e.target.value }))}
                        placeholder="16"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reinvestment_rate">Reinvestment (%)</Label>
                      <Input
                        id="reinvestment_rate"
                        type="number"
                        value={formData.reinvestment_rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, reinvestment_rate: e.target.value }))}
                        placeholder="10"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Creating...' : 'Create Project'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <img src="/empty-projects.svg" alt="No projects" className="mx-auto h-32 w-32 opacity-80 mb-4" onError={e => (e.currentTarget.style.display='none')} />
            <h3 className="mt-2 text-lg font-semibold text-gray-900">No projects yet</h3>
            <p className="mt-1 text-base text-gray-500">
              Get started by creating your first project.
            </p>
            <div className="mt-6">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-2xl hover:scale-[1.02] transition-all duration-200 border-2 border-transparent hover:border-blue-200 cursor-pointer group bg-white"
                onClick={async () => {
                  // Check authentication before navigating
                  if (!isAuthenticated) {
                    toast.error('Your session has expired. Please log in again.');
                    await checkAuth();
                    router.push('/login');
                    return;
                  }
                  router.push(`/projects/${project.id}`);
                }}
              >
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg group-hover:text-blue-700 transition-colors">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="mt-1 text-gray-500 group-hover:text-blue-500 transition-colors">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={async e => {
                          e.stopPropagation();
                          if (!isAuthenticated) {
                            toast.error('Your session has expired. Please log in again.');
                            await checkAuth();
                            router.push('/login');
                            return;
                          }
                          router.push(`/projects/${project.id}`);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => { e.stopPropagation(); handleExportReport(project.id, 'pdf'); }}
                        disabled={exporting === project.id}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Export PDF (5 tokens)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => { e.stopPropagation(); handleExportReport(project.id, 'csv'); }}
                        disabled={exporting === project.id}
                      >
                        <Table className="mr-2 h-4 w-4" />
                        Export CSV (5 tokens)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => { e.stopPropagation(); handleDeleteProject(project.id); }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Quick Stats Row */}
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                      <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                      <span>Budget: {formatCurrency(project.boq_budget)}</span>
                    </div>
                    {/* Budget Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Budget Used</span>
                        <span className="font-medium">
                          {formatCurrency(project.total_expenses)} / {formatCurrency(project.boq_budget)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(project.budget_used, 100)}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{project.budget_used.toFixed(1)}% used</span>
                        <span>{formatCurrency(project.boq_budget - project.total_expenses)} remaining</span>
                      </div>
                    </div>
                    {/* Financial Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-xs text-gray-600">Income</span>
                        </div>
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(project.total_income)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                          <span className="text-xs text-gray-600">Expenses</span>
                        </div>
                        <p className="text-sm font-semibold text-red-600">
                          {formatCurrency(project.total_expenses)}
                        </p>
                      </div>
                    </div>
                    {/* Profit */}
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign className="h-4 w-4 text-blue-600 mr-1" />
                        <span className="text-xs text-gray-600">Profit</span>
                      </div>
                      <p className={`text-sm font-semibold ${getProfitColor(project.profit)}`}>
                        {formatCurrency(project.profit)}
                      </p>
                      {project.total_income > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {project.profit_margin.toFixed(1)}% margin
                        </p>
                      )}
                    </div>
                    {/* Export Status */}
                    {exporting === project.id && (
                      <div className="text-center p-2 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-center">
                          <Download className="h-4 w-4 text-yellow-600 mr-2 animate-spin" />
                          <span className="text-xs text-yellow-600">Exporting...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
