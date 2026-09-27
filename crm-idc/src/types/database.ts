// Tipos do banco no formato gerado pelo Supabase CLI
// (`supabase gen types typescript`). Mantenha em sincronia com
// supabase/migrations/0001_schema.sql.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "dentist";

export type LeadStatus =
  | "novo"
  | "em_contato"
  | "agendado"
  | "confirmado"
  | "compareceu"
  | "nao_compareceu"
  | "cancelado"
  | "perdido";

export type LeadSource =
  | "google_ads"
  | "google_organico"
  | "gmn"
  | "instagram"
  | "indicacao"
  | "retorno"
  | "outro";

export type ServiceType =
  | "clinica_geral"
  | "implante"
  | "protese_protocolo"
  | "estetica"
  | "preventivo"
  | "canal"
  | "extracao"
  | "clareamento"
  | "lente_contato"
  | "ortodontia"
  | "odontopediatria"
  | "fisioterapia"
  | "sono"
  | "outro";

export interface Competitor {
  name: string;
  rating: number;
  reviews: number;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          role: UserRole;
          active: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email?: string | null;
          role: UserRole;
          active?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          role?: UserRole;
          active?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          phone: string;
          notes: string | null;
          source: LeadSource;
          campaign: string | null;
          keyword: string | null;
          ad_group: string | null;
          landing_page: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          service: ServiceType | null;
          service_detail: string | null;
          status: LeadStatus;
          contacted_at: string | null;
          scheduled_at: string | null;
          confirmed_at: string | null;
          attended_at: string | null;
          estimated_value: number | null;
          parent_lead_id: string | null;
          created_by: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          notes?: string | null;
          source: LeadSource;
          campaign?: string | null;
          keyword?: string | null;
          ad_group?: string | null;
          landing_page?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          service?: ServiceType | null;
          service_detail?: string | null;
          status?: "novo";
          contacted_at?: string | null;
          scheduled_at?: string | null;
          confirmed_at?: string | null;
          attended_at?: string | null;
          estimated_value?: number | null;
          parent_lead_id?: string | null;
          created_by?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          notes?: string | null;
          source?: LeadSource;
          campaign?: string | null;
          keyword?: string | null;
          ad_group?: string | null;
          landing_page?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          service?: ServiceType | null;
          service_detail?: string | null;
          status?: LeadStatus;
          contacted_at?: string | null;
          scheduled_at?: string | null;
          confirmed_at?: string | null;
          attended_at?: string | null;
          estimated_value?: number | null;
          parent_lead_id?: string | null;
          created_by?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_parent_lead_id_fkey";
            columns: ["parent_lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_history: {
        Row: {
          id: string;
          lead_id: string;
          old_status: LeadStatus | null;
          new_status: LeadStatus;
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          old_status?: LeadStatus | null;
          new_status: LeadStatus;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          old_status?: LeadStatus | null;
          new_status?: LeadStatus;
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lead_history_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_metrics: {
        Row: {
          id: string;
          date: string; // yyyy-MM-dd
          campaign: string;
          impressions: number;
          clicks: number;
          cost: number;
          conversions: number;
          leads_total: number;
          leads_agendados: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          campaign: string;
          impressions?: number;
          clicks?: number;
          cost?: number;
          conversions?: number;
          leads_total?: number;
          leads_agendados?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          campaign?: string;
          impressions?: number;
          clicks?: number;
          cost?: number;
          conversions?: number;
          leads_total?: number;
          leads_agendados?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      gmn_metrics: {
        Row: {
          id: string;
          period_start: string; // yyyy-MM-dd
          period_end: string; // yyyy-MM-dd
          search_views: number;
          maps_views: number;
          website_clicks: number;
          direction_requests: number;
          phone_calls: number;
          total_reviews: number;
          average_rating: number | null;
          new_reviews: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          period_start: string;
          period_end: string;
          search_views?: number;
          maps_views?: number;
          website_clicks?: number;
          direction_requests?: number;
          phone_calls?: number;
          total_reviews?: number;
          average_rating?: number | null;
          new_reviews?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          period_start?: string;
          period_end?: string;
          search_views?: number;
          maps_views?: number;
          website_clicks?: number;
          direction_requests?: number;
          phone_calls?: number;
          total_reviews?: number;
          average_rating?: number | null;
          new_reviews?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: number;
          clinic_name: string;
          crm_name: string;
          logo_url: string | null;
          primary_color: string;
          accent_color: string;
          competitors: Competitor[];
          whatsapp_message: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          clinic_name?: string;
          crm_name?: string;
          logo_url?: string | null;
          primary_color?: string;
          accent_color?: string;
          competitors?: Competitor[];
          whatsapp_message?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          clinic_name?: string;
          crm_name?: string;
          logo_url?: string | null;
          primary_color?: string;
          accent_color?: string;
          competitors?: Competitor[];
          whatsapp_message?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_active_user: { Args: Record<PropertyKey, never>; Returns: boolean };
      lead_status_transition_allowed: { Args: { p_from: string; p_to: string }; Returns: boolean };
      change_lead_status: {
        Args: {
          p_lead_id: string;
          p_status: LeadStatus;
          p_scheduled_at?: string | null;
          p_note?: string | null;
        };
        Returns: Database["public"]["Tables"]["leads"]["Row"];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicTables = Database["public"]["Tables"];

export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"];
export type TablesInsert<T extends keyof PublicTables> = PublicTables[T]["Insert"];
export type TablesUpdate<T extends keyof PublicTables> = PublicTables[T]["Update"];

export type Profile = Tables<"profiles">;
export type Lead = Tables<"leads">;
export type LeadInsert = TablesInsert<"leads">;
export type LeadUpdate = TablesUpdate<"leads">;
export type LeadHistory = Tables<"lead_history">;
export type DailyMetric = Tables<"daily_metrics">;
export type DailyMetricInsert = TablesInsert<"daily_metrics">;
export type GmnMetric = Tables<"gmn_metrics">;
export type GmnMetricInsert = TablesInsert<"gmn_metrics">;
export type AppSettings = Tables<"app_settings">;
