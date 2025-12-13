/**
 * Database Types - Auto-generated from Supabase
 * Last updated: 2025-12-13 (updated with master_contact_id for contact linking)
 *
 * DO NOT EDIT THE TYPES BELOW MANUALLY
 * Run: supabase gen types typescript --local > src/types/database.types.ts
 */

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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          id: number
          notes: string | null
          platform_client_id: number
          scheduled_for: string
          social_contact_id: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          notes?: string | null
          platform_client_id: number
          scheduled_for: string
          social_contact_id: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          notes?: string | null
          platform_client_id?: number
          scheduled_for?: string
          social_contact_id?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_platform_client_id_fkey"
            columns: ["platform_client_id"]
            isOneToOne: false
            referencedRelation: "platform_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_social_contact_id_fkey"
            columns: ["social_contact_id"]
            isOneToOne: false
            referencedRelation: "social_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: string | null
          closed_at: string | null
          id: number
          platform_client_id: number
          social_contact_id: number
          started_at: string
          status: string | null
        }
        Insert: {
          channel?: string | null
          closed_at?: string | null
          id?: number
          platform_client_id: number
          social_contact_id: number
          started_at?: string
          status?: string | null
        }
        Update: {
          channel?: string | null
          closed_at?: string | null
          id?: number
          platform_client_id?: number
          social_contact_id?: number
          started_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_platform_client_id_fkey"
            columns: ["platform_client_id"]
            isOneToOne: false
            referencedRelation: "platform_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_social_contact_id_fkey"
            columns: ["social_contact_id"]
            isOneToOne: false
            referencedRelation: "social_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          platform_client_id: number | null
          user_document_id: number | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          platform_client_id?: number | null
          user_document_id?: number | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          platform_client_id?: number | null
          user_document_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_document_id_fkey"
            columns: ["user_document_id"]
            isOneToOne: false
            referencedRelation: "user_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_platform_client"
            columns: ["platform_client_id"]
            isOneToOne: false
            referencedRelation: "platform_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      message_directions: {
        Row: {
          code: string
          created_at: string
          display_name: string
          is_inbound: boolean
        }
        Insert: {
          code: string
          created_at?: string
          display_name: string
          is_inbound?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          display_name?: string
          is_inbound?: boolean
        }
        Relationships: []
      }
      message_types: {
        Row: {
          code: string
          created_at: string
          display_name: string
          is_media: boolean
          is_system: boolean
        }
        Insert: {
          code: string
          created_at?: string
          display_name: string
          is_media?: boolean
          is_system?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          display_name?: string
          is_media?: boolean
          is_system?: boolean
        }
        Relationships: []
      }
      messages: {
        Row: {
          content_media: Json | null
          content_text: string | null
          conversation_id: number | null
          created_at: string | null
          direction: string
          id: number
          message_type: string | null
          platform_message_id: string | null
          sender_type: string | null
          social_contact_id: number
        }
        Insert: {
          content_media?: Json | null
          content_text?: string | null
          conversation_id?: number | null
          created_at?: string | null
          direction: string
          id?: number
          message_type?: string | null
          platform_message_id?: string | null
          sender_type?: string | null
          social_contact_id: number
        }
        Update: {
          content_media?: Json | null
          content_text?: string | null
          conversation_id?: number | null
          created_at?: string | null
          direction?: string
          id?: number
          message_type?: string | null
          platform_message_id?: string | null
          sender_type?: string | null
          social_contact_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_conversation"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_direction"
            columns: ["direction"]
            isOneToOne: false
            referencedRelation: "message_directions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fk_messages_message_type"
            columns: ["message_type"]
            isOneToOne: false
            referencedRelation: "message_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "fk_messages_sender_type"
            columns: ["sender_type"]
            isOneToOne: false
            referencedRelation: "sender_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "messages_social_contact_id_fkey"
            columns: ["social_contact_id"]
            isOneToOne: false
            referencedRelation: "social_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          created_at: string | null
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          features: Json | null
          id: number
          max_contacts: number | null
          max_messages_per_month: number | null
          name: string
          price_monthly: number | null
          support_level: string | null
        }
        Insert: {
          features?: Json | null
          id?: number
          max_contacts?: number | null
          max_messages_per_month?: number | null
          name: string
          price_monthly?: number | null
          support_level?: string | null
        }
        Update: {
          features?: Json | null
          id?: number
          max_contacts?: number | null
          max_messages_per_month?: number | null
          name?: string
          price_monthly?: number | null
          support_level?: string | null
        }
        Relationships: []
      }
      platform_clients: {
        Row: {
          business_name: string
          created_at: string | null
          email: string
          id: number
          instagram_account_id: string | null
          instagram_token_secret_id: string | null
          messenger_page_id: string | null
          messenger_token_secret_id: string | null
          phone: string | null
          plan_id: number | null
          status: string | null
          subscription_plan: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp_phone_id: string | null
          whatsapp_token_secret_id: string | null
        }
        Insert: {
          business_name: string
          created_at?: string | null
          email: string
          id?: number
          instagram_account_id?: string | null
          instagram_token_secret_id?: string | null
          messenger_page_id?: string | null
          messenger_token_secret_id?: string | null
          phone?: string | null
          plan_id?: number | null
          status?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_phone_id?: string | null
          whatsapp_token_secret_id?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string | null
          email?: string
          id?: number
          instagram_account_id?: string | null
          instagram_token_secret_id?: string | null
          messenger_page_id?: string | null
          messenger_token_secret_id?: string | null
          phone?: string | null
          plan_id?: number | null
          status?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_phone_id?: string | null
          whatsapp_token_secret_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_platform_clients_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      sender_types: {
        Row: {
          code: string
          created_at: string
          display_name: string
          is_bot: boolean
          is_human: boolean
          is_system: boolean
        }
        Insert: {
          code: string
          created_at?: string
          display_name: string
          is_bot?: boolean
          is_human?: boolean
          is_system?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          display_name?: string
          is_bot?: boolean
          is_human?: boolean
          is_system?: boolean
        }
        Relationships: []
      }
      social_contacts: {
        Row: {
          age: number | null
          company: string | null
          data_completeness: number | null
          display_name: string | null
          email: string | null
          first_contact: string | null
          goal: Json | null
          id: number
          last_interaction: string | null
          lead_score: number | null
          lead_source: string | null
          master_contact_id: number | null
          name: string | null
          phone: string | null
          plan_suggested: string | null
          platform: string
          platform_client_id: number
          platform_user_id: string
          profile_data: Json | null
          qualification_status: string | null
          surname: string | null
          volume: number | null
        }
        Insert: {
          age?: number | null
          company?: string | null
          data_completeness?: number | null
          display_name?: string | null
          email?: string | null
          first_contact?: string | null
          goal?: Json | null
          id?: number
          last_interaction?: string | null
          lead_score?: number | null
          lead_source?: string | null
          master_contact_id?: number | null
          name?: string | null
          phone?: string | null
          plan_suggested?: string | null
          platform: string
          platform_client_id: number
          platform_user_id: string
          profile_data?: Json | null
          qualification_status?: string | null
          surname?: string | null
          volume?: number | null
        }
        Update: {
          age?: number | null
          company?: string | null
          data_completeness?: number | null
          display_name?: string | null
          email?: string | null
          first_contact?: string | null
          goal?: Json | null
          id?: number
          last_interaction?: string | null
          lead_score?: number | null
          lead_source?: string | null
          master_contact_id?: number | null
          name?: string | null
          phone?: string | null
          plan_suggested?: string | null
          platform?: string
          platform_client_id?: number
          platform_user_id?: string
          profile_data?: Json | null
          qualification_status?: string | null
          surname?: string | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_social_contacts_platform_client"
            columns: ["platform_client_id"]
            isOneToOne: false
            referencedRelation: "platform_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_contacts_master_contact_id_fkey"
            columns: ["master_contact_id"]
            isOneToOne: false
            referencedRelation: "social_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_contacts_platform_client_id_fkey"
            columns: ["platform_client_id"]
            isOneToOne: false
            referencedRelation: "platform_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          category: string | null
          description: string | null
          drive_file_id: string | null
          drive_web_view_link: string | null
          file_name: string
          file_size: number
          id: number
          mime_type: string
          platform_client_id: number
          search_vector: unknown
          storage_path: string
          tags: string[] | null
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          drive_file_id?: string | null
          drive_web_view_link?: string | null
          file_name: string
          file_size: number
          id?: number
          mime_type: string
          platform_client_id: number
          search_vector?: unknown
          storage_path: string
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          description?: string | null
          drive_file_id?: string | null
          drive_web_view_link?: string | null
          file_name?: string
          file_size?: number
          id?: number
          mime_type?: string
          platform_client_id?: number
          search_vector?: unknown
          storage_path?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_platform_client_id_fkey"
            columns: ["platform_client_id"]
            isOneToOne: false
            referencedRelation: "platform_clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_platform_token: {
        Args: { p_platform_client_id: number; p_token_type: string }
        Returns: boolean
      }
      get_client_by_recipient: {
        Args: { recipient_key: string }
        Returns: {
          client_id: string
          client_name: string
          drive_folder_id: string
          language: string
          system_prompt_file_id: string
          timezone: string
        }[]
      }
      get_conversation_history: {
        Args: { p_client_id: string; p_limit?: number; p_sender_id: string }
        Returns: {
          content: string
          created_at: string
          message_id: string
          role: string
        }[]
      }
      get_document_storage_url: {
        Args: { p_storage_path: string }
        Returns: string
      }
      get_platform_token: {
        Args: { p_platform_client_id: number; p_token_type: string }
        Returns: string
      }
      lookup_client_by_messenger: {
        Args: { p_messenger_page_id: string }
        Returns: {
          client_id: string
          client_name: string
          created_at: string
          drive_folder_id: string
          id: string
          instagram_account_id: string
          language: string
          max_context_messages: number
          messenger_page_id: string
          status: string
          system_prompt_file_id: string
          timezone: string
          updated_at: string
          whatsapp_number: string
        }[]
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      store_platform_token: {
        Args: {
          p_platform_client_id: number
          p_token_type: string
          p_token_value: string
        }
        Returns: string
      }
      update_platform_token: {
        Args: {
          p_new_token_value: string
          p_platform_client_id: number
          p_token_type: string
        }
        Returns: string
      }
      upsert_user: {
        Args: {
          p_client_id: string
          p_name?: string
          p_platform: string
          p_sender_id: string
        }
        Returns: string
      }
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

/**
 * Convenience type for social_contacts table
 */
export type SocialContact = Tables<'social_contacts'>
