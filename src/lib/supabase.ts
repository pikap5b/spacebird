import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'employee' | 'admin'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'employee' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'employee' | 'admin'
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          updated_at?: string
        }
      }
      floors: {
        Row: {
          id: string
          location_id: string
          name: string
          grid_rows: number
          grid_cols: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          location_id: string
          name: string
          grid_rows: number
          grid_cols: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          name?: string
          grid_rows?: number
          grid_cols?: number
          updated_at?: string
        }
      }
      desks: {
        Row: {
          id: string
          floor_id: string
          name: string
          grid_row: number
          grid_col: number
          equipment: string[] | null
          capacity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          floor_id: string
          name: string
          grid_row: number
          grid_col: number
          equipment?: string[] | null
          capacity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          floor_id?: string
          name?: string
          grid_row?: number
          grid_col?: number
          equipment?: string[] | null
          capacity?: number
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          desk_id: string
          booking_date: string
          start_time: string
          end_time: string | null
          status: 'confirmed' | 'checked_in' | 'completed' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          desk_id: string
          booking_date: string
          start_time: string
          end_time?: string | null
          status?: 'confirmed' | 'checked_in' | 'completed' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          desk_id?: string
          booking_date?: string
          start_time?: string
          end_time?: string | null
          status?: 'confirmed' | 'checked_in' | 'completed' | 'cancelled'
          updated_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          reservation_id: string
          checked_in_at: string
          created_at: string
        }
        Insert: {
          id?: string
          reservation_id: string
          checked_in_at: string
          created_at?: string
        }
        Update: {
          id?: string
          checked_in_at?: string
        }
      }
    }
  }
}

