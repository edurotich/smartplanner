export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string
          otp_code: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id: string
          phone: string
          otp_code?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string
          otp_code?: string | null
          verified?: boolean
          created_at?: string
        }
      }
      user_tokens: {
        Row: {
          id: string
          user_id: string
          balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          boq_budget: number | null
          tax_rate: number
          reinvestment_rate: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          boq_budget?: number | null
          tax_rate?: number
          reinvestment_rate?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          boq_budget?: number | null
          tax_rate?: number
          reinvestment_rate?: number
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          project_id: string
          title: string
          category: string
          amount: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          category: string
          amount: number
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          category?: string
          amount?: number
          date?: string
          created_at?: string
        }
      }
      income: {
        Row: {
          id: string
          project_id: string
          source: string
          amount: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          source: string
          amount: number
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          source?: string
          amount?: number
          date?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          mpesa_receipt: string
          amount: number
          tokens_added: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mpesa_receipt: string
          amount: number
          tokens_added: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mpesa_receipt?: string
          amount?: number
          tokens_added?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_tokens: {
        Args: {
          user_uuid: string
          token_change: number
        }
        Returns: void
      }
      get_user_token_balance: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type UserTokens = Database['public']['Tables']['user_tokens']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type Income = Database['public']['Tables']['income']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type IncomeInsert = Database['public']['Tables']['income']['Insert']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']
export type IncomeUpdate = Database['public']['Tables']['income']['Update']
