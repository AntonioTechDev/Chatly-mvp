/**
 * Database Types - Auto-generated from Supabase
 * Last updated: 2025-12-05
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
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          platform_client_id?: number | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          platform_client_id?: number | null
        }
        Relationships: [
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
          instagram_token: string | null
          messenger_page_id: string | null
          messenger_token: string | null
          phone: string | null
          plan_id: number | null
          status: string | null
          subscription_plan: string | null
          updated_at: string | null
          whatsapp_phone_id: string | null
          whatsapp_token: string | null
        }
        Insert: {
          business_name: string
          created_at?: string | null
          email: string
          id?: number
          instagram_account_id?: string | null
          instagram_token?: string | null
          messenger_page_id?: string | null
          messenger_token?: string | null
          phone?: string | null
          plan_id?: number | null
          status?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
          whatsapp_phone_id?: string | null
          whatsapp_token?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string | null
          email?: string
          id?: number
          instagram_account_id?: string | null
          instagram_token?: string | null
          messenger_page_id?: string | null
          messenger_token?: string | null
          phone?: string | null
          plan_id?: number | null
          status?: string | null
          subscription_plan?: string | null
          updated_at?: string | null
          whatsapp_phone_id?: string | null
          whatsapp_token?: string | null
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
            foreignKeyName: "social_contacts_platform_client_id_fkey"
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

// ============================================================================
// CUSTOM APPLICATION TYPES (Safe to edit below this line)
// ============================================================================

// Table type shortcuts
export type PlatformClient = Tables<"platform_clients">
export type SocialContact = Tables<"social_contacts">
export type Conversation = Tables<"conversations">
export type Message = Tables<"messages">
export type Appointment = Tables<"appointments">
export type Document = Tables<"documents">
export type Plan = Tables<"plans">
export type MessageType = Tables<"message_types">
export type MessageDirection = Tables<"message_directions">
export type SenderType = Tables<"sender_types">

// Insert types
export type PlatformClientInsert = TablesInsert<"platform_clients">
export type SocialContactInsert = TablesInsert<"social_contacts">
export type ConversationInsert = TablesInsert<"conversations">
export type MessageInsert = TablesInsert<"messages">
export type AppointmentInsert = TablesInsert<"appointments">

// Update types
export type PlatformClientUpdate = TablesUpdate<"platform_clients">
export type SocialContactUpdate = TablesUpdate<"social_contacts">
export type ConversationUpdate = TablesUpdate<"conversations">
export type MessageUpdate = TablesUpdate<"messages">
export type AppointmentUpdate = TablesUpdate<"appointments">

// Extended types with relations
export type MessageWithRelations = Message & {
  social_contact?: SocialContact
  conversation?: Conversation
}

export type ConversationWithRelations = Conversation & {
  social_contact?: SocialContact
  platform_client?: PlatformClient
  messages?: Message[]
}

export type SocialContactWithRelations = SocialContact & {
  platform_client?: PlatformClient
  messages?: Message[]
  conversations?: Conversation[]
  appointments?: Appointment[]
}

export type AppointmentWithRelations = Appointment & {
  social_contact?: SocialContact
  platform_client?: PlatformClient
}

// Media content type
export type MediaContent = {
  url: string
  type: 'image' | 'video' | 'audio' | 'document'
  mime_type?: string
  filename?: string
  size?: number
  thumbnail_url?: string
}

// Profile data type
export type ProfileData = {
  avatar_url?: string
  language?: string
  timezone?: string
  preferences?: Record<string, unknown>
  custom_fields?: Record<string, unknown>
}

// Goal type
export type Goal = {
  id: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

// Plan features type
export type PlanFeatures = {
  multi_channel?: boolean
  ai_assistant?: boolean
  analytics?: boolean
  api_access?: boolean
  custom_branding?: boolean
  priority_support?: boolean
  webhooks?: boolean
}

// Database function response types
export type DocumentMatch = {
  content: string
  id: number
  metadata: Json
  similarity: number
}

export type ConversationHistoryMessage = {
  content: string
  created_at: string
  message_id: string
  role: string
}
