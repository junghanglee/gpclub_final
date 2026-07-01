export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_products: {
        Row: {
          brand_name: string;
          conditions: Json;
          cover_image_url: string | null;
          created_at: string;
          detail_html: string | null;
          id: string;
          is_featured: boolean;
          is_new: boolean;
          is_popular: boolean;
          media: Json;
          product_name: string;
          product_type: string;
          published: boolean;
          short_intro: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          brand_name?: string;
          conditions?: Json;
          cover_image_url?: string | null;
          created_at?: string;
          detail_html?: string | null;
          id?: string;
          is_featured?: boolean;
          is_new?: boolean;
          is_popular?: boolean;
          media?: Json;
          product_name?: string;
          product_type?: string;
          published?: boolean;
          short_intro?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          brand_name?: string;
          conditions?: Json;
          cover_image_url?: string | null;
          created_at?: string;
          detail_html?: string | null;
          id?: string;
          is_featured?: boolean;
          is_new?: boolean;
          is_popular?: boolean;
          media?: Json;
          product_name?: string;
          product_type?: string;
          published?: boolean;
          short_intro?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      b2b_inquiries: {
        Row: {
          brands: string | null;
          channel: string;
          city: string;
          company: string;
          created_at: string;
          email: string;
          id: string;
          message: string | null;
          monthly_volume: string;
          name: string;
          phone: string;
          position: string;
          status: string;
          admin_note: string | null;
          updated_at: string;
        };
        Insert: {
          brands?: string | null;
          channel: string;
          city: string;
          company: string;
          created_at?: string;
          email: string;
          id?: string;
          message?: string | null;
          monthly_volume: string;
          name: string;
          phone: string;
          position: string;
          status?: string;
          admin_note?: string | null;
          updated_at?: string;
        };
        Update: {
          brands?: string | null;
          channel?: string;
          city?: string;
          company?: string;
          created_at?: string;
          email?: string;
          id?: string;
          message?: string | null;
          monthly_volume?: string;
          name?: string;
          phone?: string;
          position?: string;
          status?: string;
          admin_note?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      chatbot_training: {
        Row: {
          answer: string | null;
          content: string | null;
          created_at: string;
          enabled: boolean;
          id: string;
          kind: string;
          question: string | null;
          tags: string[] | null;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          answer?: string | null;
          content?: string | null;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          kind?: string;
          question?: string | null;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          answer?: string | null;
          content?: string | null;
          created_at?: string;
          enabled?: boolean;
          id?: string;
          kind?: string;
          question?: string | null;
          tags?: string[] | null;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      chatbot_documents: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          raw_content: string | null;
          language: string;
          category: string;
          source_type: string;
          file_url: string | null;
          status: string;
          enabled: boolean;
          version: number;
          tags: string[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          raw_content?: string | null;
          language?: string;
          category?: string;
          source_type?: string;
          file_url?: string | null;
          status?: string;
          enabled?: boolean;
          version?: number;
          tags?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          raw_content?: string | null;
          language?: string;
          category?: string;
          source_type?: string;
          file_url?: string | null;
          status?: string;
          enabled?: boolean;
          version?: number;
          tags?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chatbot_document_chunks: {
        Row: {
          id: string;
          document_id: string;
          chunk_index: number;
          content: string;
          content_hash: string | null;
          language: string;
          token_count: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          chunk_index: number;
          content: string;
          content_hash?: string | null;
          language?: string;
          token_count?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          chunk_index?: number;
          content?: string;
          content_hash?: string | null;
          language?: string;
          token_count?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      chatbot_training_jobs: {
        Row: {
          id: string;
          document_id: string | null;
          status: string;
          error_message: string | null;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id?: string | null;
          status?: string;
          error_message?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string | null;
          status?: string;
          error_message?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chatbot_tree_nodes: {
        Row: {
          id: string;
          scenario_key: string;
          parent_id: string | null;
          sort_order: number;
          label_ko: string | null;
          label_en: string | null;
          label_vi: string | null;
          answer_ko: string | null;
          answer_en: string | null;
          answer_vi: string | null;
          action_type: string;
          linked_training_id: string | null;
          linked_document_id: string | null;
          enabled: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scenario_key?: string;
          parent_id?: string | null;
          sort_order?: number;
          label_ko?: string | null;
          label_en?: string | null;
          label_vi?: string | null;
          answer_ko?: string | null;
          answer_en?: string | null;
          answer_vi?: string | null;
          action_type?: string;
          linked_training_id?: string | null;
          linked_document_id?: string | null;
          enabled?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scenario_key?: string;
          parent_id?: string | null;
          sort_order?: number;
          label_ko?: string | null;
          label_en?: string | null;
          label_vi?: string | null;
          answer_ko?: string | null;
          answer_en?: string | null;
          answer_vi?: string | null;
          action_type?: string;
          linked_training_id?: string | null;
          linked_document_id?: string | null;
          enabled?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chatbot_tree_nodes_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "chatbot_tree_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chatbot_tree_nodes_linked_training_id_fkey";
            columns: ["linked_training_id"];
            isOneToOne: false;
            referencedRelation: "chatbot_training";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chatbot_tree_nodes_linked_document_id_fkey";
            columns: ["linked_document_id"];
            isOneToOne: false;
            referencedRelation: "chatbot_documents";
            referencedColumns: ["id"];
          },
        ];
      };
      chatbot_records: {
        Row: {
          id: string;
          session_id: string | null;
          customer_message: string;
          chatbot_reply: string;
          history: Json;
          source: string;
          status: string;
          admin_note: string | null;
          matched_documents: Json;
          matched_chunks: Json;
          confidence: number | null;
          needs_review: boolean;
          chat_ui_mode: string;
          selected_tree_path: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          customer_message: string;
          chatbot_reply: string;
          history?: Json;
          source?: string;
          status?: string;
          admin_note?: string | null;
          matched_documents?: Json;
          matched_chunks?: Json;
          confidence?: number | null;
          needs_review?: boolean;
          chat_ui_mode?: string;
          selected_tree_path?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          customer_message?: string;
          chatbot_reply?: string;
          history?: Json;
          source?: string;
          status?: string;
          admin_note?: string | null;
          matched_documents?: Json;
          matched_chunks?: Json;
          confidence?: number | null;
          needs_review?: boolean;
          chat_ui_mode?: string;
          selected_tree_path?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_inquiries: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          message: string;
          name: string;
          phone: string | null;
          status: string;
          subject: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          message: string;
          name: string;
          phone?: string | null;
          status?: string;
          subject?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          message?: string;
          name?: string;
          phone?: string | null;
          status?: string;
          subject?: string | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          body_en: string | null;
          body_vi: string | null;
          created_at: string;
          cta_label_en: string | null;
          cta_label_vi: string | null;
          cta_url: string | null;
          event_date: string | null;
          featured: boolean;
          id: string;
          media_type: string;
          media_url: string | null;
          published: boolean;
          post_type: string;
          sort_order: number;
          summary_en: string | null;
          summary_vi: string | null;
          title_en: string;
          title_vi: string;
          updated_at: string;
        };
        Insert: {
          body_en?: string | null;
          body_vi?: string | null;
          created_at?: string;
          cta_label_en?: string | null;
          cta_label_vi?: string | null;
          cta_url?: string | null;
          event_date?: string | null;
          featured?: boolean;
          id?: string;
          media_type?: string;
          media_url?: string | null;
          published?: boolean;
          post_type?: string;
          sort_order?: number;
          summary_en?: string | null;
          summary_vi?: string | null;
          title_en: string;
          title_vi: string;
          updated_at?: string;
        };
        Update: {
          body_en?: string | null;
          body_vi?: string | null;
          created_at?: string;
          cta_label_en?: string | null;
          cta_label_vi?: string | null;
          cta_url?: string | null;
          event_date?: string | null;
          featured?: boolean;
          id?: string;
          media_type?: string;
          media_url?: string | null;
          published?: boolean;
          post_type?: string;
          sort_order?: number;
          summary_en?: string | null;
          summary_vi?: string | null;
          title_en?: string;
          title_vi?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          answer: string;
          category: string;
          created_at: string;
          id: string;
          published: boolean;
          question: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          answer: string;
          category?: string;
          created_at?: string;
          id?: string;
          published?: boolean;
          question: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          category?: string;
          created_at?: string;
          id?: string;
          published?: boolean;
          question?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      home_content: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      popups: {
        Row: {
          active: boolean;
          content: string | null;
          created_at: string;
          cta_label: string | null;
          cta_url: string | null;
          ends_at: string | null;
          id: string;
          image_url: string | null;
          priority: number;
          starts_at: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          content?: string | null;
          created_at?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          ends_at?: string | null;
          id?: string;
          image_url?: string | null;
          priority?: number;
          starts_at?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          content?: string | null;
          created_at?: string;
          cta_label?: string | null;
          cta_url?: string | null;
          ends_at?: string | null;
          id?: string;
          image_url?: string | null;
          priority?: number;
          starts_at?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;

