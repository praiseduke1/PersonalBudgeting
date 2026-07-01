export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          monthly_budget: number
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          monthly_budget?: number
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          monthly_budget?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedSchema: "auth"
          }
        ]
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'income' | 'expense'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedSchema: "public"
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          category_id: string
          amount: number
          transaction_date: string
          description: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          amount: number
          transaction_date?: string
          description?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          amount?: number
          transaction_date?: string
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedSchema: "public"
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedSchema: "public"
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
