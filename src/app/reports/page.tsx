'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  BarChart3, 
  PieChart, 
  Table as TableIcon,
  Calendar,
  RefreshCw,
  File,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string;
  boq_budget: number;
  tax_rate: number;
  reinvestment_rate: number;
  created_at: string;
}

interface ReportData {
  project: Project;
  expenses: {
    total: number;
    byCategory: Record<string, number>;
    byMonth: Record<string, number>;
  };
  income: {
    total: number;
    bySource: Record<string, number>;
    byMonth: Record<string, number>;
  };
  summary: {
    netProfit: number;
    taxAmount: number;
    reinvestmentAmount: number;
    takeHomeAmount: number;
    profitMargin: number;
    expenseRatio: number;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportType, setReportType] = useState<'financial' | 'tax' | 'expense'>('financial');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'csv'>('pdf');
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({
    from: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        router.push('/auth');
        return;
      }
      
      const data = await response.json();
      setAuthenticated(true);
      setTokenBalance(data.tokens?.balance || 0);
      
      // Fetch user's projects
      fetchProjects();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data.projects || []);
      
      // Auto-select the first project if available
      if (data.projects && data.projects.length > 0) {
        setSelectedProjectId(data.projects[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const generateReport = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    if ((tokenBalance || 0) < 5) {
      toast.error('Insufficient tokens. Reports require 5 tokens.');
      return;
    }
    
    setGeneratingReport(true);
    
    try {
      // In a real implementation, you'd call an API endpoint to generate the report
      // This is simulated data for demonstration
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      
      if (!selectedProject) {
        throw new Error('Project not found');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock report data
      const mockReportData: ReportData = {
        project: selectedProject,
        expenses: {
          total: 750000,
          byCategory: {
            'Materials': 400000,
            'Labor': 200000,
            'Transport': 100000,
            'Miscellaneous': 50000
          },
          byMonth: {
            'Jun 2025': 250000,
            'Jul 2025': 300000,
            'Aug 2025': 200000
          }
        },
        income: {
          total: 1200000,
          bySource: {
            'Client Payments': 1000000,
            'Material Sales': 150000,
            'Other': 50000
          },
          byMonth: {
            'Jun 2025': 300000,
            'Jul 2025': 400000,
            'Aug 2025': 500000
          }
        },
        summary: {
          netProfit: 450000,
          taxAmount: 450000 * (selectedProject.tax_rate / 100),
          reinvestmentAmount: 450000 * (selectedProject.reinvestment_rate / 100),
          takeHomeAmount: 450000 * (1 - (selectedProject.tax_rate / 100) - (selectedProject.reinvestment_rate / 100)),
          profitMargin: (450000 / 1200000) * 100,
          expenseRatio: (750000 / 1200000) * 100
        }
      };
      
      setReportData(mockReportData);
      
      // Deduct tokens (simulated)
      setTokenBalance((prev) => (prev || 0) - 5);
      
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExport = async () => {
    if (!reportData) {
      toast.error('No report data to export');
      return;
    }
    
    // Simulate export
    toast.success(`Exporting ${exportType.toUpperCase()} report...`);
    
    // In a real app, you'd implement actual PDF/CSV generation and download
    setTimeout(() => {
      toast.success(`${exportType.toUpperCase()} exported successfully`);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Reports</h1>
            <p className="text-gray-600">
              Generate and view detailed reports for your projects
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Settings</CardTitle>
                <CardDescription>
                  Configure your report parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="project">Select Project</Label>
                  <Select 
                    value={selectedProjectId} 
                    onValueChange={setSelectedProjectId}
                  >
                    <SelectTrigger id="project" className="w-full">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.length === 0 ? (
                        <SelectItem value="none" disabled>No projects found</SelectItem>
                      ) : (
                        projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select 
                    value={reportType} 
                    onValueChange={(value: 'financial' | 'tax' | 'expense') => setReportType(value)}
                  >
                    <SelectTrigger id="report-type" className="w-full">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial Summary</SelectItem>
                      <SelectItem value="tax">Tax Report</SelectItem>
                      <SelectItem value="expense">Expense Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Date Range</Label>
                  <div className="grid grid-cols-2 gap-4 mt-1.5">
                    <div>
                      <Label htmlFor="date-from" className="text-xs">From</Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date-to" className="text-xs">To</Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Label htmlFor="export-format">Export Format</Label>
                  <div className="grid grid-cols-2 gap-4 mt-1.5">
                    <Button
                      type="button"
                      variant={exportType === 'pdf' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setExportType('pdf')}
                    >
                      <File className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      type="button"
                      variant={exportType === 'csv' ? 'default' : 'outline'}
                      className="justify-start"
                      onClick={() => setExportType('csv')}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col space-y-2">
                <Button 
                  className="w-full" 
                  onClick={generateReport}
                  disabled={generatingReport || !selectedProjectId}
                >
                  {generatingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Report (5 tokens)
                    </>
                  )}
                </Button>
                
                {tokenBalance !== null && tokenBalance < 5 && (
                  <div className="text-center text-sm text-red-600">
                    Insufficient tokens. Reports require 5 tokens.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-red-600 font-normal"
                      onClick={() => router.push('/tokens/purchase')}
                    >
                      Buy more tokens
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Report Types</CardTitle>
                <CardDescription>
                  Available report templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded mr-3">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Financial Summary</h4>
                    <p className="text-sm text-gray-600">
                      Complete overview of income, expenses, and profits
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 p-2 rounded mr-3">
                    <PieChart className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Tax Report</h4>
                    <p className="text-sm text-gray-600">
                      Tax calculations and reinvestment projections
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-orange-100 p-2 rounded mr-3">
                    <TableIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Expense Analysis</h4>
                    <p className="text-sm text-gray-600">
                      Detailed breakdown of all project expenses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            {reportData ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {reportData.project.name} Report
                  </h2>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export {exportType.toUpperCase()}
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={generateReport}
                      disabled={generatingReport}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${generatingReport ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
                    <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
                    <TabsTrigger value="expenses" className="flex-1">Expenses</TabsTrigger>
                    <TabsTrigger value="tax" className="flex-1">Tax & Reinvestment</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">KES {reportData.income.total.toLocaleString()}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">KES {reportData.expenses.total.toLocaleString()}</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">KES {reportData.summary.netProfit.toLocaleString()}</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span>Profit Margin</span>
                            <span className="font-medium">{reportData.summary.profitMargin.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${Math.min(100, reportData.summary.profitMargin)}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>Expense Ratio</span>
                            <span className="font-medium">{reportData.summary.expenseRatio.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-orange-500 h-2.5 rounded-full" 
                              style={{ width: `${Math.min(100, reportData.summary.expenseRatio)}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="income" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Income Sources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(reportData.income.bySource).map(([source, amount]) => (
                            <div key={source} className="flex justify-between items-center">
                              <span>{source}</span>
                              <span className="font-medium">KES {amount.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
                            <span>Total Income</span>
                            <span>KES {reportData.income.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Income</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(reportData.income.byMonth).map(([month, amount]) => (
                            <div key={month} className="flex justify-between items-center">
                              <span>{month}</span>
                              <span className="font-medium">KES {amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="expenses" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Expense Categories</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(reportData.expenses.byCategory).map(([category, amount]) => (
                            <div key={category} className="flex justify-between items-center">
                              <span>{category}</span>
                              <span className="font-medium">KES {amount.toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
                            <span>Total Expenses</span>
                            <span>KES {reportData.expenses.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Expenses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {Object.entries(reportData.expenses.byMonth).map(([month, amount]) => (
                            <div key={month} className="flex justify-between items-center">
                              <span>{month}</span>
                              <span className="font-medium">KES {amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="tax" className="space-y-6 mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Profit Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span>Net Profit</span>
                            <span className="font-medium">KES {reportData.summary.netProfit.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>Tax ({reportData.project.tax_rate}%)</span>
                            <span className="font-medium">KES {reportData.summary.taxAmount.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>Reinvestment ({reportData.project.reinvestment_rate}%)</span>
                            <span className="font-medium">KES {reportData.summary.reinvestmentAmount.toLocaleString()}</span>
                          </div>
                          
                          <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
                            <span>Take Home Amount</span>
                            <span>KES {reportData.summary.takeHomeAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Tax & Reinvestment Settings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span>Tax Rate</span>
                            <span className="font-medium">{reportData.project.tax_rate}%</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>Reinvestment Rate</span>
                            <span className="font-medium">{reportData.project.reinvestment_rate}%</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span>Take Home Rate</span>
                            <span className="font-medium">{100 - reportData.project.tax_rate - reportData.project.reinvestment_rate}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="h-full flex flex-col justify-center items-center py-16">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">No Report Generated</h3>
                <p className="text-gray-500 text-center max-w-md mb-6">
                  Select a project and report type, then click "Generate Report" to view your project analytics.
                </p>
                <Button 
                  onClick={generateReport}
                  disabled={!selectedProjectId || (tokenBalance !== null && tokenBalance < 5)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}