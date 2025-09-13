import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PhoneAuthService } from '@/lib/phone-auth'

export async function GET(request: NextRequest) {
  try {
    // Validate session token
    const sessionToken = request.cookies.get('session-token')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Validate session and get user
    const userSession = await PhoneAuthService.validateSession(sessionToken)
    if (!userSession?.user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }
    
    // Get project ID from query params
    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')
    const reportType = url.searchParams.get('type') || 'financial'
    const dateFrom = url.searchParams.get('from')
    const dateTo = url.searchParams.get('to')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }
    
    // Check if user has enough tokens (5 tokens required for reports)
    const supabase = await createClient()
    
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userSession.user.id)
      .single()
    
    if (tokenError || !tokenData || tokenData.balance < 5) {
      return NextResponse.json({ 
        error: 'Insufficient tokens. Reports require 5 tokens.',
        tokensNeeded: 5,
        currentBalance: tokenData?.balance || 0
      }, { status: 402 }) // 402 Payment Required
    }
    
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userSession.user.id)
      .single()
    
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    
    // Date filtering
    let fromDate = dateFrom ? new Date(dateFrom) : new Date()
    fromDate.setMonth(fromDate.getMonth() - 1) // Default to last month
    
    let toDate = dateTo ? new Date(dateTo) : new Date()
    
    // Get expenses
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('project_id', projectId)
      .gte('date', fromDate.toISOString().split('T')[0])
      .lte('date', toDate.toISOString().split('T')[0])
    
    if (expensesError) {
      console.error('Error fetching expenses:', expensesError)
    }
    
    // Get income
    const { data: income, error: incomeError } = await supabase
      .from('income')
      .select('*')
      .eq('project_id', projectId)
      .gte('date', fromDate.toISOString().split('T')[0])
      .lte('date', toDate.toISOString().split('T')[0])
    
    if (incomeError) {
      console.error('Error fetching income:', incomeError)
    }
    
    // Process and calculate report data
    const expensesTotal = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
    const incomeTotal = income?.reduce((sum, income) => sum + income.amount, 0) || 0
    const netProfit = incomeTotal - expensesTotal
    
    // Calculate by category, source, month
    const expensesByCategory: Record<string, number> = {}
    expenses?.forEach(expense => {
      const category = expense.category || 'Uncategorized'
      expensesByCategory[category] = (expensesByCategory[category] || 0) + expense.amount
    })
    
    const incomeBySource: Record<string, number> = {}
    income?.forEach(income => {
      const source = income.source || 'Uncategorized'
      incomeBySource[source] = (incomeBySource[source] || 0) + income.amount
    })
    
    // Process by month
    const expensesByMonth: Record<string, number> = {}
    const incomeByMonth: Record<string, number> = {}
    
    // Format months
    const formatMonth = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
    
    expenses?.forEach(expense => {
      const month = formatMonth(expense.date)
      expensesByMonth[month] = (expensesByMonth[month] || 0) + expense.amount
    })
    
    income?.forEach(income => {
      const month = formatMonth(income.date)
      incomeByMonth[month] = (incomeByMonth[month] || 0) + income.amount
    })
    
    // Calculate tax and reinvestment
    const taxRate = project.tax_rate || 0
    const reinvestmentRate = project.reinvestment_rate || 0
    
    const taxAmount = netProfit * (taxRate / 100)
    const reinvestmentAmount = netProfit * (reinvestmentRate / 100)
    const takeHomeAmount = netProfit - taxAmount - reinvestmentAmount
    
    // Deduct 5 tokens for generating the report
    await supabase.rpc('update_user_tokens', {
      user_uuid: userSession.user.id,
      token_change: -5
    })
    
    // Return report data
    return NextResponse.json({
      report: {
        project,
        expenses: {
          total: expensesTotal,
          byCategory: expensesByCategory,
          byMonth: expensesByMonth
        },
        income: {
          total: incomeTotal,
          bySource: incomeBySource,
          byMonth: incomeByMonth
        },
        summary: {
          netProfit,
          taxAmount,
          reinvestmentAmount,
          takeHomeAmount,
          profitMargin: incomeTotal > 0 ? (netProfit / incomeTotal) * 100 : 0,
          expenseRatio: incomeTotal > 0 ? (expensesTotal / incomeTotal) * 100 : 0
        },
        dateRange: {
          from: fromDate.toISOString().split('T')[0],
          to: toDate.toISOString().split('T')[0]
        }
      },
      tokensDeducted: 5
    })
    
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}