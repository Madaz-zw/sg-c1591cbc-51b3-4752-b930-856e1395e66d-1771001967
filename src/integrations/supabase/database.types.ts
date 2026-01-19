 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      board_transactions: {
        Row: {
          board_id: string
          board_name: string | null
          created_at: string | null
          customer_name: string | null
          date: string | null
          id: string
          job_card_number: string | null
          notes: string | null
          quantity: number
          type: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          board_id: string
          board_name?: string | null
          created_at?: string | null
          customer_name?: string | null
          date?: string | null
          id?: string
          job_card_number?: string | null
          notes?: string | null
          quantity: number
          type: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          board_id?: string
          board_name?: string | null
          created_at?: string | null
          customer_name?: string | null
          date?: string | null
          id?: string
          job_card_number?: string | null
          notes?: string | null
          quantity?: number
          type?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_transactions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          color: string
          created_at: string | null
          id: string
          min_threshold: number
          quantity: number
          type: string
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          min_threshold?: number
          quantity?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          min_threshold?: number
          quantity?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_goods: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_name: string
          description: string
          id: string
          notes: string | null
          quantity: number
          received_by: string | null
          received_by_name: string | null
          received_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_name: string
          description: string
          id?: string
          notes?: string | null
          quantity?: number
          received_by?: string | null
          received_by_name?: string | null
          received_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_name?: string
          description?: string
          id?: string
          notes?: string | null
          quantity?: number
          received_by?: string | null
          received_by_name?: string | null
          received_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_goods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_goods_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      job_cards: {
        Row: {
          assembling_completed_at: string | null
          assembling_status: string | null
          board_color: string
          board_name: string
          board_type: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          fabrication_completed_at: string | null
          fabrication_status: string | null
          id: string
          job_card_number: string
          materials_used: Json | null
          overall_status: string | null
          recipient_name: string
          status: string | null
          supervisor_id: string | null
          supervisor_name: string
          updated_at: string | null
        }
        Insert: {
          assembling_completed_at?: string | null
          assembling_status?: string | null
          board_color: string
          board_name: string
          board_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          fabrication_completed_at?: string | null
          fabrication_status?: string | null
          id?: string
          job_card_number: string
          materials_used?: Json | null
          overall_status?: string | null
          recipient_name: string
          status?: string | null
          supervisor_id?: string | null
          supervisor_name: string
          updated_at?: string | null
        }
        Update: {
          assembling_completed_at?: string | null
          assembling_status?: string | null
          board_color?: string
          board_name?: string
          board_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          fabrication_completed_at?: string | null
          fabrication_status?: string | null
          id?: string
          job_card_number?: string
          materials_used?: Json | null
          overall_status?: string | null
          recipient_name?: string
          status?: string | null
          supervisor_id?: string | null
          supervisor_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_cards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_cards_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      material_requests: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          approved_by_name: string | null
          board_color: string
          board_name: string
          created_at: string | null
          id: string
          job_card_number: string
          material_id: string
          material_name: string
          notes: string | null
          quantity: number
          recipient_name: string
          requested_by: string | null
          requested_by_name: string
          status: string
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          board_color: string
          board_name: string
          created_at?: string | null
          id?: string
          job_card_number: string
          material_id: string
          material_name: string
          notes?: string | null
          quantity: number
          recipient_name: string
          requested_by?: string | null
          requested_by_name: string
          status?: string
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          approved_by_name?: string | null
          board_color?: string
          board_name?: string
          created_at?: string | null
          id?: string
          job_card_number?: string
          material_id?: string
          material_name?: string
          notes?: string | null
          quantity?: number
          recipient_name?: string
          requested_by?: string | null
          requested_by_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requests_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      material_transactions: {
        Row: {
          board_color: string | null
          board_name: string | null
          created_at: string | null
          date: string | null
          id: string
          job_card_number: string | null
          material_id: string
          material_name: string | null
          notes: string | null
          quantity: number
          recipient_name: string | null
          transaction_type: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          board_color?: string | null
          board_name?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          job_card_number?: string | null
          material_id: string
          material_name?: string | null
          notes?: string | null
          quantity: number
          recipient_name?: string | null
          transaction_type: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          board_color?: string | null
          board_name?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          job_card_number?: string | null
          material_id?: string
          material_name?: string | null
          notes?: string | null
          quantity?: number
          recipient_name?: string | null
          transaction_type?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_transactions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          created_at: string | null
          id: string
          min_threshold: number
          name: string
          quantity: number
          unit: string
          updated_at: string | null
          variant: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          min_threshold?: number
          name: string
          quantity?: number
          unit?: string
          updated_at?: string | null
          variant?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          min_threshold?: number
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string | null
          variant?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tool_transactions: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          notes: string | null
          tool_id: string
          tool_name: string | null
          transaction_type: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          tool_id: string
          tool_name?: string | null
          transaction_type: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          tool_id?: string
          tool_name?: string | null
          transaction_type?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_transactions_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          category: string
          checked_out_at: string | null
          checked_out_by: string | null
          checked_out_by_name: string | null
          checked_out_date: string | null
          checked_out_to: string | null
          code: string
          created_at: string | null
          id: string
          is_damaged: boolean | null
          name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          category: string
          checked_out_at?: string | null
          checked_out_by?: string | null
          checked_out_by_name?: string | null
          checked_out_date?: string | null
          checked_out_to?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_damaged?: boolean | null
          name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          checked_out_at?: string | null
          checked_out_by?: string | null
          checked_out_by_name?: string | null
          checked_out_date?: string | null
          checked_out_to?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_damaged?: boolean | null
          name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tools_checked_out_by_fkey"
            columns: ["checked_out_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          password: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          password?: string | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          password?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
