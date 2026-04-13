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
      alertas: {
        Row: {
          codigo: string
          created_at: string
          description: string
          id: string
          module: string
          severity: Database["public"]["Enums"]["alert_severity"]
          source: string
          status: Database["public"]["Enums"]["alert_status"]
          title: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          description: string
          id?: string
          module: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          source: string
          status?: Database["public"]["Enums"]["alert_status"]
          title: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          description?: string
          id?: string
          module?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          source?: string
          status?: Database["public"]["Enums"]["alert_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      auditorias: {
        Row: {
          auditor: string
          codigo: string
          created_at: string
          data: string
          entidade: string
          id: string
          pontuacao: number
          status: Database["public"]["Enums"]["audit_status"]
          tipo: string
          updated_at: string
        }
        Insert: {
          auditor: string
          codigo: string
          created_at?: string
          data?: string
          entidade: string
          id?: string
          pontuacao?: number
          status?: Database["public"]["Enums"]["audit_status"]
          tipo: string
          updated_at?: string
        }
        Update: {
          auditor?: string
          codigo?: string
          created_at?: string
          data?: string
          entidade?: string
          id?: string
          pontuacao?: number
          status?: Database["public"]["Enums"]["audit_status"]
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      cooperativas: {
        Row: {
          cidade: string
          cnpj: string | null
          created_at: string
          estado: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cidade: string
          cnpj?: string | null
          created_at?: string
          estado: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cidade?: string
          cnpj?: string | null
          created_at?: string
          estado?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      indicadores_sustentabilidade: {
        Row: {
          id: string
          label: string
          suffix: string
          updated_at: string
          value: number
        }
        Insert: {
          id?: string
          label: string
          suffix?: string
          updated_at?: string
          value?: number
        }
        Update: {
          id?: string
          label?: string
          suffix?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      industrias: {
        Row: {
          cidade: string
          cnpj: string | null
          created_at: string
          estado: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          cidade: string
          cnpj?: string | null
          created_at?: string
          estado: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          cidade?: string
          cnpj?: string | null
          created_at?: string
          estado?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      lotes: {
        Row: {
          codigo: string
          created_at: string
          destino: string
          etapa_atual: number
          id: string
          material: string
          origem: string
          peso: string
          status: Database["public"]["Enums"]["lote_status"]
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          destino: string
          etapa_atual?: number
          id?: string
          material: string
          origem: string
          peso: string
          status?: Database["public"]["Enums"]["lote_status"]
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          destino?: string
          etapa_atual?: number
          id?: string
          material?: string
          origem?: string
          peso?: string
          status?: Database["public"]["Enums"]["lote_status"]
          updated_at?: string
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          codigo: string
          cooperativa_id: string | null
          created_at: string
          destino: string
          id: string
          industria_id: string | null
          material: string
          origem: string
          peso: string
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
        }
        Insert: {
          codigo: string
          cooperativa_id?: string | null
          created_at?: string
          destino: string
          id?: string
          industria_id?: string | null
          material: string
          origem: string
          peso: string
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
        }
        Update: {
          codigo?: string
          cooperativa_id?: string | null
          created_at?: string
          destino?: string
          id?: string
          industria_id?: string | null
          material?: string
          origem?: string
          peso?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_cooperativa_id_fkey"
            columns: ["cooperativa_id"]
            isOneToOne: false
            referencedRelation: "cooperativas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_industria_id_fkey"
            columns: ["industria_id"]
            isOneToOne: false
            referencedRelation: "industrias"
            referencedColumns: ["id"]
          },
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
      alert_severity: "critical" | "high" | "medium" | "low"
      alert_status: "active" | "acknowledged" | "resolved"
      audit_status: "Conforme" | "Não Conforme" | "Pendente" | "Em Análise"
      lote_status: "Coletado" | "Em Processamento" | "Em Trânsito" | "Entregue"
      transaction_status: "Concluída" | "Em Trânsito" | "Pendente" | "Auditoria"
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
      alert_severity: ["critical", "high", "medium", "low"],
      alert_status: ["active", "acknowledged", "resolved"],
      audit_status: ["Conforme", "Não Conforme", "Pendente", "Em Análise"],
      lote_status: ["Coletado", "Em Processamento", "Em Trânsito", "Entregue"],
      transaction_status: ["Concluída", "Em Trânsito", "Pendente", "Auditoria"],
    },
  },
} as const
