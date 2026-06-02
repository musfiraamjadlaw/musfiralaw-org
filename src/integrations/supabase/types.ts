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
      adhd_patterns: {
        Row: {
          created_at: string
          id: string
          response: string | null
          trigger: string
          user_id: string
          what_worked: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          response?: string | null
          trigger: string
          user_id: string
          what_worked?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          response?: string | null
          trigger?: string
          user_id?: string
          what_worked?: string | null
        }
        Relationships: []
      }
      article_recommendations: {
        Row: {
          connects_to: string[]
          created_at: string
          gap: string | null
          id: string
          outline: string | null
          question: string | null
          rationale: string
          score: number | null
          status: string
          suggested_essay: string | null
          themes: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connects_to?: string[]
          created_at?: string
          gap?: string | null
          id?: string
          outline?: string | null
          question?: string | null
          rationale: string
          score?: number | null
          status?: string
          suggested_essay?: string | null
          themes?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connects_to?: string[]
          created_at?: string
          gap?: string | null
          id?: string
          outline?: string | null
          question?: string | null
          rationale?: string
          score?: number | null
          status?: string
          suggested_essay?: string | null
          themes?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          content_html: string | null
          content_text: string
          created_at: string
          guid: string | null
          id: string
          imported_at: string
          published_at: string | null
          source: string
          summary: string | null
          tags: string[]
          themes: string[]
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          content_html?: string | null
          content_text?: string
          created_at?: string
          guid?: string | null
          id?: string
          imported_at?: string
          published_at?: string | null
          source: string
          summary?: string | null
          tags?: string[]
          themes?: string[]
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          content_html?: string | null
          content_text?: string
          created_at?: string
          guid?: string | null
          id?: string
          imported_at?: string
          published_at?: string | null
          source?: string
          summary?: string | null
          tags?: string[]
          themes?: string[]
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      courtroom_entries: {
        Row: {
          alternatives: string | null
          assumptions: string | null
          created_at: string
          evidence: string | null
          facts: string | null
          id: string
          situation: string
          user_id: string
          verdict: string | null
        }
        Insert: {
          alternatives?: string | null
          assumptions?: string | null
          created_at?: string
          evidence?: string | null
          facts?: string | null
          id?: string
          situation: string
          user_id: string
          verdict?: string | null
        }
        Update: {
          alternatives?: string | null
          assumptions?: string | null
          created_at?: string
          evidence?: string | null
          facts?: string | null
          id?: string
          situation?: string
          user_id?: string
          verdict?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          future_self: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          future_self: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          future_self?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_entries: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_lessons: {
        Row: {
          created_at: string
          id: string
          lesson: string
          mentor_name: string
          role: string | null
          source: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson: string
          mentor_name: string
          role?: string | null
          source?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson?: string
          mentor_name?: string
          role?: string | null
          source?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          category: string | null
          created_at: string
          done: boolean
          id: string
          priority: string | null
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          done?: boolean
          id?: string
          priority?: string | null
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          done?: boolean
          id?: string
          priority?: string | null
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      substack_sources: {
        Row: {
          created_at: string
          feed_url: string
          id: string
          last_synced_at: string | null
          publication_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_url: string
          id?: string
          last_synced_at?: string | null
          publication_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feed_url?: string
          id?: string
          last_synced_at?: string | null
          publication_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          future_self: string | null
          id: string
          lane: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          why: string | null
        }
        Insert: {
          created_at?: string
          future_self?: string | null
          id?: string
          lane?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          why?: string | null
        }
        Update: {
          created_at?: string
          future_self?: string | null
          id?: string
          lane?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      unfinished_threads: {
        Row: {
          created_at: string
          evidence: string | null
          id: string
          last_seen_at: string | null
          mentions_count: number
          question: string | null
          sources: string[]
          status: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evidence?: string | null
          id?: string
          last_seen_at?: string | null
          mentions_count?: number
          question?: string | null
          sources?: string[]
          status?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evidence?: string | null
          id?: string
          last_seen_at?: string | null
          mentions_count?: number
          question?: string | null
          sources?: string[]
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      untangle_analyses: {
        Row: {
          core_question: string | null
          created_at: string
          id: string
          input: string
          missing_condition: string | null
          result: Json
          user_id: string
        }
        Insert: {
          core_question?: string | null
          created_at?: string
          id?: string
          input: string
          missing_condition?: string | null
          result: Json
          user_id: string
        }
        Update: {
          core_question?: string | null
          created_at?: string
          id?: string
          input?: string
          missing_condition?: string | null
          result?: Json
          user_id?: string
        }
        Relationships: []
      }
      writing_themes: {
        Row: {
          created_at: string
          description: string | null
          frequency: number
          id: string
          last_seen_at: string | null
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency?: number
          id?: string
          last_seen_at?: string | null
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: number
          id?: string
          last_seen_at?: string | null
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
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
