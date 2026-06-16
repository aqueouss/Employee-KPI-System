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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_kpi_snapshots: {
        Row: {
          calculated_at: string
          completed_tasks: number
          completion_pct: number
          employee_id: string
          flag: Database["public"]["Enums"]["kpi_flag"]
          id: string
          kpi_date: string
          rules_version: number
          total_tasks: number
        }
        Insert: {
          calculated_at?: string
          completed_tasks: number
          completion_pct: number
          employee_id: string
          flag: Database["public"]["Enums"]["kpi_flag"]
          id?: string
          kpi_date: string
          rules_version: number
          total_tasks: number
        }
        Update: {
          calculated_at?: string
          completed_tasks?: number
          completion_pct?: number
          employee_id?: string
          flag?: Database["public"]["Enums"]["kpi_flag"]
          id?: string
          kpi_date?: string
          rules_version?: number
          total_tasks?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_kpi_snapshots_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_rules: {
        Row: {
          company_timezone: string
          count_weekends: boolean
          green_streak_for_reward: number
          green_threshold: number
          id: number
          red_flags_for_warning: number
          termination_window_days: number
          updated_at: string
          updated_by: string | null
          version: number
          warnings_for_termination: number
          yellow_threshold: number
        }
        Insert: {
          company_timezone?: string
          count_weekends?: boolean
          green_streak_for_reward?: number
          green_threshold?: number
          id?: number
          red_flags_for_warning?: number
          termination_window_days?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
          warnings_for_termination?: number
          yellow_threshold?: number
        }
        Update: {
          company_timezone?: string
          count_weekends?: boolean
          green_streak_for_reward?: number
          green_threshold?: number
          id?: number
          red_flags_for_warning?: number
          termination_window_days?: number
          updated_at?: string
          updated_by?: string | null
          version?: number
          warnings_for_termination?: number
          yellow_threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          termination_review_status: Database["public"]["Enums"]["termination_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          hire_date?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          termination_review_status?: Database["public"]["Enums"]["termination_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          termination_review_status?: Database["public"]["Enums"]["termination_status"]
          updated_at?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          eligible_at: string
          employee_id: string
          id: string
          issued_at: string | null
          issued_by: string | null
          notes: string | null
          status: Database["public"]["Enums"]["reward_status"]
          streak_end_date: string
          streak_start_date: string
        }
        Insert: {
          eligible_at?: string
          employee_id: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["reward_status"]
          streak_end_date: string
          streak_start_date: string
        }
        Update: {
          eligible_at?: string
          employee_id?: string
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["reward_status"]
          streak_end_date?: string
          streak_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          employee_id: string
          id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["task_status"]
          submitted_at: string | null
          task_date: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          employee_id: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          submitted_at?: string | null
          task_date: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          submitted_at?: string | null
          task_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      termination_reviews: {
        Row: {
          employee_id: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["review_status"]
          triggered_at: string
          warning_ids: string[]
        }
        Insert: {
          employee_id: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          triggered_at?: string
          warning_ids: string[]
        }
        Update: {
          employee_id?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          triggered_at?: string
          warning_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "termination_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_reviews_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warnings: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          employee_id: string
          id: string
          issued_at: string
          reason: string
          red_flag_dates: string[]
          status: Database["public"]["Enums"]["warning_status"]
          warning_month: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          employee_id: string
          id?: string
          issued_at?: string
          reason?: string
          red_flag_dates: string[]
          status?: Database["public"]["Enums"]["warning_status"]
          warning_month: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          employee_id?: string
          id?: string
          issued_at?: string
          reason?: string
          red_flag_dates?: string[]
          status?: Database["public"]["Enums"]["warning_status"]
          warning_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "warnings_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warnings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_completion_pct: {
        Args: { p_employee_id: string; p_kpi_date: string }
        Returns: {
          completed_tasks: number
          completion_pct: number
          total_tasks: number
        }[]
      }
      current_profile_id: { Args: never; Returns: string }
      get_employee_rankings: {
        Args: { p_end: string; p_start: string }
        Returns: {
          avg_completion: number
          days_tracked: number
          employee_id: string
          full_name: string
          green_days: number
        }[]
      }
      determine_kpi_flag: {
        Args: {
          p_completion_pct: number
          p_green_threshold: number
          p_total_tasks: number
          p_yellow_threshold: number
        }
        Returns: Database["public"]["Enums"]["kpi_flag"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      kpi_flag: "green" | "yellow" | "red" | "no_tasks"
      review_status: "eligible" | "under_review" | "resolved"
      reward_status: "eligible" | "issued" | "declined"
      task_status: "pending" | "completed" | "submitted" | "rejected"
      termination_status: "none" | "eligible" | "under_review" | "resolved"
      user_role: "admin" | "employee"
      warning_status: "active" | "acknowledged"
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
    Enums: {
      kpi_flag: ["green", "yellow", "red", "no_tasks"],
      review_status: ["eligible", "under_review", "resolved"],
      reward_status: ["eligible", "issued", "declined"],
      task_status: ["pending", "completed", "submitted", "rejected"],
      termination_status: ["none", "eligible", "under_review", "resolved"],
      user_role: ["admin", "employee"],
      warning_status: ["active", "acknowledged"],
    },
  },
} as const
