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
      admin_session_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          module_accessed: string
          session_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          module_accessed: string
          session_start?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          module_accessed?: string
          session_start?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_agente_skills: {
        Row: {
          agente_id: string
          created_at: string
          ordem: number
          skill_id: string
        }
        Insert: {
          agente_id: string
          created_at?: string
          ordem?: number
          skill_id: string
        }
        Update: {
          agente_id?: string
          created_at?: string
          ordem?: number
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agente_skills_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "ai_agentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agente_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "ai_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agentes: {
        Row: {
          base_conhecimento_id: string | null
          created_at: string
          descricao: string | null
          id: string
          max_tokens: number
          modelo_id: string | null
          nome: string
          prompt_sistema: string
          status: Database["public"]["Enums"]["ai_status"]
          temperatura: number
          updated_at: string
        }
        Insert: {
          base_conhecimento_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          max_tokens?: number
          modelo_id?: string | null
          nome: string
          prompt_sistema?: string
          status?: Database["public"]["Enums"]["ai_status"]
          temperatura?: number
          updated_at?: string
        }
        Update: {
          base_conhecimento_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          max_tokens?: number
          modelo_id?: string | null
          nome?: string
          prompt_sistema?: string
          status?: Database["public"]["Enums"]["ai_status"]
          temperatura?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agentes_base_conhecimento_id_fkey"
            columns: ["base_conhecimento_id"]
            isOneToOne: false
            referencedRelation: "ai_base_conhecimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agentes_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "ai_modelos"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_base_conhecimento: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          modelo_embedding: string | null
          nome: string
          status: Database["public"]["Enums"]["ai_status"]
          tipo: string
          total_chunks: number
          total_documentos: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          modelo_embedding?: string | null
          nome: string
          status?: Database["public"]["Enums"]["ai_status"]
          tipo?: string
          total_chunks?: number
          total_documentos?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          modelo_embedding?: string | null
          nome?: string
          status?: Database["public"]["Enums"]["ai_status"]
          tipo?: string
          total_chunks?: number
          total_documentos?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_consumo_log: {
        Row: {
          agente_id: string | null
          created_at: string
          custo_estimado: number
          id: string
          modelo_id: string | null
          sucesso: boolean
          tokens_input: number
          tokens_output: number
          user_id: string | null
        }
        Insert: {
          agente_id?: string | null
          created_at?: string
          custo_estimado?: number
          id?: string
          modelo_id?: string | null
          sucesso?: boolean
          tokens_input?: number
          tokens_output?: number
          user_id?: string | null
        }
        Update: {
          agente_id?: string | null
          created_at?: string
          custo_estimado?: number
          id?: string
          modelo_id?: string | null
          sucesso?: boolean
          tokens_input?: number
          tokens_output?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_consumo_log_agente_id_fkey"
            columns: ["agente_id"]
            isOneToOne: false
            referencedRelation: "ai_agentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_consumo_log_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "ai_modelos"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_cotas_usuario: {
        Row: {
          created_at: string
          id: string
          limite_tokens_mes: number
          observacoes: string | null
          reset_em: string
          tokens_consumidos_mes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          limite_tokens_mes?: number
          observacoes?: string | null
          reset_em?: string
          tokens_consumidos_mes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          limite_tokens_mes?: number
          observacoes?: string | null
          reset_em?: string
          tokens_consumidos_mes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_mcp_servers: {
        Row: {
          auth_secret_name: string | null
          auth_tipo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["ai_status"]
          transporte: Database["public"]["Enums"]["ai_mcp_transporte"]
          updated_at: string
          url: string
        }
        Insert: {
          auth_secret_name?: string | null
          auth_tipo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["ai_status"]
          transporte?: Database["public"]["Enums"]["ai_mcp_transporte"]
          updated_at?: string
          url: string
        }
        Update: {
          auth_secret_name?: string | null
          auth_tipo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["ai_status"]
          transporte?: Database["public"]["Enums"]["ai_mcp_transporte"]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      ai_modelos: {
        Row: {
          categoria: Database["public"]["Enums"]["ai_modelo_categoria"]
          contexto_max: number
          created_at: string
          custo_input_1k: number
          custo_output_1k: number
          descricao: string | null
          id: string
          identificador: string
          nome: string
          provedor: string
          status: Database["public"]["Enums"]["ai_status"]
          suporta_imagem: boolean
          suporta_tools: boolean
          updated_at: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["ai_modelo_categoria"]
          contexto_max?: number
          created_at?: string
          custo_input_1k?: number
          custo_output_1k?: number
          descricao?: string | null
          id?: string
          identificador: string
          nome: string
          provedor: string
          status?: Database["public"]["Enums"]["ai_status"]
          suporta_imagem?: boolean
          suporta_tools?: boolean
          updated_at?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["ai_modelo_categoria"]
          contexto_max?: number
          created_at?: string
          custo_input_1k?: number
          custo_output_1k?: number
          descricao?: string | null
          id?: string
          identificador?: string
          nome?: string
          provedor?: string
          status?: Database["public"]["Enums"]["ai_status"]
          suporta_imagem?: boolean
          suporta_tools?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ai_skills: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          schema_entrada: Json
          status: Database["public"]["Enums"]["ai_status"]
          updated_at: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          schema_entrada?: Json
          status?: Database["public"]["Enums"]["ai_status"]
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          schema_entrada?: Json
          status?: Database["public"]["Enums"]["ai_status"]
          updated_at?: string
        }
        Relationships: []
      }
      ai_tokens_provedores: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          provedor: string
          rotulo: string
          secret_name: string
          status: Database["public"]["Enums"]["ai_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          provedor: string
          rotulo: string
          secret_name: string
          status?: Database["public"]["Enums"]["ai_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          provedor?: string
          rotulo?: string
          secret_name?: string
          status?: Database["public"]["Enums"]["ai_status"]
          updated_at?: string
        }
        Relationships: []
      }
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
      alertas_geofencing: {
        Row: {
          carga_id: string | null
          created_at: string
          distancia_desvio_m: number | null
          id: string
          latitude: number | null
          longitude: number | null
          mensagem: string
          severidade: Database["public"]["Enums"]["alerta_severidade"]
          status: Database["public"]["Enums"]["alerta_geo_status"]
          tipo: Database["public"]["Enums"]["alerta_geo_tipo"]
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          carga_id?: string | null
          created_at?: string
          distancia_desvio_m?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          mensagem: string
          severidade?: Database["public"]["Enums"]["alerta_severidade"]
          status?: Database["public"]["Enums"]["alerta_geo_status"]
          tipo: Database["public"]["Enums"]["alerta_geo_tipo"]
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          carga_id?: string | null
          created_at?: string
          distancia_desvio_m?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          mensagem?: string
          severidade?: Database["public"]["Enums"]["alerta_severidade"]
          status?: Database["public"]["Enums"]["alerta_geo_status"]
          tipo?: Database["public"]["Enums"]["alerta_geo_tipo"]
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_geofencing_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "cargas_perigosas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_geofencing_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos_frota"
            referencedColumns: ["id"]
          },
        ]
      }
      app_acoes_automaticas: {
        Row: {
          acao_config: Json
          acao_tipo: string
          ativo: boolean
          condicao: Json
          created_at: string
          descricao: string
          evento: string
          id: string
          nome: string
          total_execucoes: number
          ultimo_disparo: string | null
          updated_at: string
        }
        Insert: {
          acao_config?: Json
          acao_tipo: string
          ativo?: boolean
          condicao?: Json
          created_at?: string
          descricao?: string
          evento: string
          id?: string
          nome: string
          total_execucoes?: number
          ultimo_disparo?: string | null
          updated_at?: string
        }
        Update: {
          acao_config?: Json
          acao_tipo?: string
          ativo?: boolean
          condicao?: Json
          created_at?: string
          descricao?: string
          evento?: string
          id?: string
          nome?: string
          total_execucoes?: number
          ultimo_disparo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      app_listas_suspensas: {
        Row: {
          ativo: boolean
          categoria: string
          codigo: string
          created_at: string
          id: string
          metadados: Json
          ordem: number
          rotulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          codigo: string
          created_at?: string
          id?: string
          metadados?: Json
          ordem?: number
          rotulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          codigo?: string
          created_at?: string
          id?: string
          metadados?: Json
          ordem?: number
          rotulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_logs_sistema: {
        Row: {
          acao: string
          contexto: Json
          created_at: string
          id: string
          ip_address: string | null
          mensagem: string
          modulo: string
          nivel: string
          user_id: string | null
        }
        Insert: {
          acao: string
          contexto?: Json
          created_at?: string
          id?: string
          ip_address?: string | null
          mensagem: string
          modulo: string
          nivel?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          contexto?: Json
          created_at?: string
          id?: string
          ip_address?: string | null
          mensagem?: string
          modulo?: string
          nivel?: string
          user_id?: string | null
        }
        Relationships: []
      }
      app_regras_negocio: {
        Row: {
          ativo: boolean
          chave: string
          created_at: string
          descricao: string
          escopo: string
          id: string
          nome: string
          tipo: string
          updated_at: string
          valor: Json
        }
        Insert: {
          ativo?: boolean
          chave: string
          created_at?: string
          descricao?: string
          escopo?: string
          id?: string
          nome: string
          tipo?: string
          updated_at?: string
          valor?: Json
        }
        Update: {
          ativo?: boolean
          chave?: string
          created_at?: string
          descricao?: string
          escopo?: string
          id?: string
          nome?: string
          tipo?: string
          updated_at?: string
          valor?: Json
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
      benchmark_estados: {
        Row: {
          ano_referencia: number
          created_at: string
          estado_ibge: string
          id: string
          meta_pnrs_cumprida: boolean
          nome_estado: string
          populacao: number
          taxa_desvio_aterro: number
          uf: string
          updated_at: string
          volume_coletado_ton: number
          volume_reciclado_ton: number
        }
        Insert: {
          ano_referencia?: number
          created_at?: string
          estado_ibge: string
          id?: string
          meta_pnrs_cumprida?: boolean
          nome_estado: string
          populacao?: number
          taxa_desvio_aterro?: number
          uf: string
          updated_at?: string
          volume_coletado_ton?: number
          volume_reciclado_ton?: number
        }
        Update: {
          ano_referencia?: number
          created_at?: string
          estado_ibge?: string
          id?: string
          meta_pnrs_cumprida?: boolean
          nome_estado?: string
          populacao?: number
          taxa_desvio_aterro?: number
          uf?: string
          updated_at?: string
          volume_coletado_ton?: number
          volume_reciclado_ton?: number
        }
        Relationships: []
      }
      benchmark_municipios: {
        Row: {
          ano_referencia: number
          created_at: string
          eficiencia_coleta_seletiva: number
          engajamento_cidadao: number
          id: string
          municipio_ibge: string
          nome_municipio: string
          pontos_coleta_por_km2: number
          populacao: number
          taxa_desvio_aterro: number
          uf: string
          updated_at: string
          volume_coletado_ton: number
          volume_reciclado_ton: number
        }
        Insert: {
          ano_referencia?: number
          created_at?: string
          eficiencia_coleta_seletiva?: number
          engajamento_cidadao?: number
          id?: string
          municipio_ibge: string
          nome_municipio: string
          pontos_coleta_por_km2?: number
          populacao?: number
          taxa_desvio_aterro?: number
          uf: string
          updated_at?: string
          volume_coletado_ton?: number
          volume_reciclado_ton?: number
        }
        Update: {
          ano_referencia?: number
          created_at?: string
          eficiencia_coleta_seletiva?: number
          engajamento_cidadao?: number
          id?: string
          municipio_ibge?: string
          nome_municipio?: string
          pontos_coleta_por_km2?: number
          populacao?: number
          taxa_desvio_aterro?: number
          uf?: string
          updated_at?: string
          volume_coletado_ton?: number
          volume_reciclado_ton?: number
        }
        Relationships: []
      }
      benchmark_selos: {
        Row: {
          ano_referencia: number
          ativo: boolean
          created_at: string
          data_concessao: string
          descricao: string | null
          id: string
          municipio_ibge: string
          nome_municipio: string
          tipo_selo: string
          uf: string
          updated_at: string
        }
        Insert: {
          ano_referencia?: number
          ativo?: boolean
          created_at?: string
          data_concessao?: string
          descricao?: string | null
          id?: string
          municipio_ibge: string
          nome_municipio: string
          tipo_selo: string
          uf: string
          updated_at?: string
        }
        Update: {
          ano_referencia?: number
          ativo?: boolean
          created_at?: string
          data_concessao?: string
          descricao?: string | null
          id?: string
          municipio_ibge?: string
          nome_municipio?: string
          tipo_selo?: string
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      cargas_perigosas: {
        Row: {
          categoria: Database["public"]["Enums"]["carga_categoria"]
          created_at: string
          destino_final: string
          detalhamento: string
          id: string
          origem_identificacao_hash: string | null
          origem_localidade: string | null
          origem_tipo: string
          peso_declarado_kg: number | null
          peso_destino_kg: number | null
          peso_origem_kg: number | null
          status: Database["public"]["Enums"]["carga_status"]
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          categoria: Database["public"]["Enums"]["carga_categoria"]
          created_at?: string
          destino_final: string
          detalhamento: string
          id?: string
          origem_identificacao_hash?: string | null
          origem_localidade?: string | null
          origem_tipo: string
          peso_declarado_kg?: number | null
          peso_destino_kg?: number | null
          peso_origem_kg?: number | null
          status?: Database["public"]["Enums"]["carga_status"]
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["carga_categoria"]
          created_at?: string
          destino_final?: string
          detalhamento?: string
          id?: string
          origem_identificacao_hash?: string | null
          origem_localidade?: string | null
          origem_tipo?: string
          peso_declarado_kg?: number | null
          peso_destino_kg?: number | null
          peso_origem_kg?: number | null
          status?: Database["public"]["Enums"]["carga_status"]
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cargas_perigosas_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos_frota"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_integracoes: {
        Row: {
          auth_header: string | null
          auth_type: string
          created_at: string
          descricao: string
          id: string
          intervalo_sync_min: number
          metadados: Json
          modulo: string
          nome: string
          status: string
          tipo: string
          ultimo_sync: string | null
          updated_at: string
          url_base: string
        }
        Insert: {
          auth_header?: string | null
          auth_type?: string
          created_at?: string
          descricao?: string
          id?: string
          intervalo_sync_min?: number
          metadados?: Json
          modulo?: string
          nome: string
          status?: string
          tipo?: string
          ultimo_sync?: string | null
          updated_at?: string
          url_base?: string
        }
        Update: {
          auth_header?: string | null
          auth_type?: string
          created_at?: string
          descricao?: string
          id?: string
          intervalo_sync_min?: number
          metadados?: Json
          modulo?: string
          nome?: string
          status?: string
          tipo?: string
          ultimo_sync?: string | null
          updated_at?: string
          url_base?: string
        }
        Relationships: []
      }
      contenedor_localizacoes: {
        Row: {
          capacidade_litros: number
          cep: string | null
          cidade: string
          contenedor_id: string
          created_at: string
          endereco: string
          id: string
          latitude: number | null
          longitude: number | null
          nivel_preenchimento: number
          nome_local: string
          status_operacional: string
          uf: string
          ultima_coleta: string | null
          updated_at: string
        }
        Insert: {
          capacidade_litros?: number
          cep?: string | null
          cidade: string
          contenedor_id: string
          created_at?: string
          endereco?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nivel_preenchimento?: number
          nome_local: string
          status_operacional?: string
          uf: string
          ultima_coleta?: string | null
          updated_at?: string
        }
        Update: {
          capacidade_litros?: number
          cep?: string | null
          cidade?: string
          contenedor_id?: string
          created_at?: string
          endereco?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nivel_preenchimento?: number
          nome_local?: string
          status_operacional?: string
          uf?: string
          ultima_coleta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contenedor_localizacoes_contenedor_id_fkey"
            columns: ["contenedor_id"]
            isOneToOne: false
            referencedRelation: "contenedores"
            referencedColumns: ["id"]
          },
        ]
      }
      contenedores: {
        Row: {
          ativo: boolean
          boas_praticas: string[]
          cor: string
          created_at: string
          descricao: string
          icone: string
          id: string
          material: string
          nome: string
          updated_at: string
          volumes: string[]
        }
        Insert: {
          ativo?: boolean
          boas_praticas?: string[]
          cor: string
          created_at?: string
          descricao?: string
          icone?: string
          id?: string
          material: string
          nome: string
          updated_at?: string
          volumes?: string[]
        }
        Update: {
          ativo?: boolean
          boas_praticas?: string[]
          cor?: string
          created_at?: string
          descricao?: string
          icone?: string
          id?: string
          material?: string
          nome?: string
          updated_at?: string
          volumes?: string[]
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
      economia_fatores_material: {
        Row: {
          agua_evitada_m3_por_ton: number | null
          ano_referencia_fator: number | null
          ativo: boolean
          co2e_evitado_ton_por_ton: number | null
          created_at: string
          custo_aterro_evitado_rs_ton: number
          densidade_ton_m3: number
          energia_evitada_mwh_por_ton: number | null
          fonte: string | null
          fonte_url: string | null
          id: string
          material: string
          metodologia: string | null
          uf: string | null
          updated_at: string
          valor_reciclado_rs_ton: number
          vigencia_fim: string | null
          vigencia_inicio: string
        }
        Insert: {
          agua_evitada_m3_por_ton?: number | null
          ano_referencia_fator?: number | null
          ativo?: boolean
          co2e_evitado_ton_por_ton?: number | null
          created_at?: string
          custo_aterro_evitado_rs_ton?: number
          densidade_ton_m3: number
          energia_evitada_mwh_por_ton?: number | null
          fonte?: string | null
          fonte_url?: string | null
          id?: string
          material: string
          metodologia?: string | null
          uf?: string | null
          updated_at?: string
          valor_reciclado_rs_ton?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Update: {
          agua_evitada_m3_por_ton?: number | null
          ano_referencia_fator?: number | null
          ativo?: boolean
          co2e_evitado_ton_por_ton?: number | null
          created_at?: string
          custo_aterro_evitado_rs_ton?: number
          densidade_ton_m3?: number
          energia_evitada_mwh_por_ton?: number | null
          fonte?: string | null
          fonte_url?: string | null
          id?: string
          material?: string
          metodologia?: string | null
          uf?: string | null
          updated_at?: string
          valor_reciclado_rs_ton?: number
          vigencia_fim?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      entidades_perfis: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string
          id: string
          nome: string
          permissoes: Json
          tipo_entidade: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          id?: string
          nome: string
          permissoes?: Json
          tipo_entidade: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          permissoes?: Json
          tipo_entidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      financeiro_servico_municipal: {
        Row: {
          ano_referencia: number
          created_at: string
          despesa_coleta_seletiva_rs: number
          despesa_total_rs: number
          fonte: string
          fonte_url: string | null
          id: string
          massa_coletada_ton: number
          massa_disposta_aterro_ton: number
          massa_recuperada_ton: number
          municipio_ibge: string
          nome_municipio: string
          observacoes: string | null
          populacao_atendida_seletiva: number | null
          populacao_urbana: number | null
          possui_cobranca_especifica: boolean
          receita_taxa_rs: number
          uf: string
          updated_at: string
        }
        Insert: {
          ano_referencia: number
          created_at?: string
          despesa_coleta_seletiva_rs?: number
          despesa_total_rs?: number
          fonte?: string
          fonte_url?: string | null
          id?: string
          massa_coletada_ton?: number
          massa_disposta_aterro_ton?: number
          massa_recuperada_ton?: number
          municipio_ibge: string
          nome_municipio: string
          observacoes?: string | null
          populacao_atendida_seletiva?: number | null
          populacao_urbana?: number | null
          possui_cobranca_especifica?: boolean
          receita_taxa_rs?: number
          uf: string
          updated_at?: string
        }
        Update: {
          ano_referencia?: number
          created_at?: string
          despesa_coleta_seletiva_rs?: number
          despesa_total_rs?: number
          fonte?: string
          fonte_url?: string | null
          id?: string
          massa_coletada_ton?: number
          massa_disposta_aterro_ton?: number
          massa_recuperada_ton?: number
          municipio_ibge?: string
          nome_municipio?: string
          observacoes?: string | null
          populacao_atendida_seletiva?: number | null
          populacao_urbana?: number | null
          possui_cobranca_especifica?: boolean
          receita_taxa_rs?: number
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      geradores_criticos: {
        Row: {
          ativo: boolean
          cnes: string | null
          cnpj: string
          created_at: string
          endereco: string | null
          id: string
          latitude: number | null
          longitude: number | null
          municipio: string | null
          razao_social: string
          responsavel_email: string | null
          responsavel_nome: string | null
          responsavel_telefone: string | null
          tipo: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnes?: string | null
          cnpj: string
          created_at?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio?: string | null
          razao_social: string
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          tipo: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnes?: string | null
          cnpj?: string
          created_at?: string
          endereco?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          municipio?: string | null
          razao_social?: string
          responsavel_email?: string | null
          responsavel_nome?: string | null
          responsavel_telefone?: string | null
          tipo?: string
          uf?: string | null
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
      integracao_sei: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          identificacao_servico: string
          metadados: Json
          nome: string
          sigla_sistema: string
          status_teste: string | null
          tipo_processo_padrao: string | null
          token_secret_ref: string | null
          ultimo_teste: string | null
          unidade_padrao: string
          updated_at: string
          url_servico: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          identificacao_servico: string
          metadados?: Json
          nome?: string
          sigla_sistema: string
          status_teste?: string | null
          tipo_processo_padrao?: string | null
          token_secret_ref?: string | null
          ultimo_teste?: string | null
          unidade_padrao: string
          updated_at?: string
          url_servico: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          identificacao_servico?: string
          metadados?: Json
          nome?: string
          sigla_sistema?: string
          status_teste?: string | null
          tipo_processo_padrao?: string | null
          token_secret_ref?: string | null
          ultimo_teste?: string | null
          unidade_padrao?: string
          updated_at?: string
          url_servico?: string
        }
        Relationships: []
      }
      integracao_webhook_logs: {
        Row: {
          created_at: string
          duracao_ms: number | null
          erro: string | null
          evento: string
          http_status: number | null
          id: string
          payload: Json
          resposta: string | null
          status: string
          tentativa: number
          webhook_id: string
        }
        Insert: {
          created_at?: string
          duracao_ms?: number | null
          erro?: string | null
          evento: string
          http_status?: number | null
          id?: string
          payload?: Json
          resposta?: string | null
          status?: string
          tentativa?: number
          webhook_id: string
        }
        Update: {
          created_at?: string
          duracao_ms?: number | null
          erro?: string | null
          evento?: string
          http_status?: number | null
          id?: string
          payload?: Json
          resposta?: string | null
          status?: string
          tentativa?: number
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integracao_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "integracao_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      integracao_webhooks: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string
          eventos: Json
          headers: Json
          id: string
          metodo: string
          nome: string
          retry_delay_seg: number
          retry_max: number
          secret_token: string | null
          timeout_seg: number
          total_envios: number
          total_falhas: number
          ultimo_envio: string | null
          updated_at: string
          url: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          eventos?: Json
          headers?: Json
          id?: string
          metodo?: string
          nome: string
          retry_delay_seg?: number
          retry_max?: number
          secret_token?: string | null
          timeout_seg?: number
          total_envios?: number
          total_falhas?: number
          ultimo_envio?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string
          eventos?: Json
          headers?: Json
          id?: string
          metodo?: string
          nome?: string
          retry_delay_seg?: number
          retry_max?: number
          secret_token?: string | null
          timeout_seg?: number
          total_envios?: number
          total_falhas?: number
          ultimo_envio?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      iot_dispositivos_instancias: {
        Row: {
          apelido: string | null
          bateria_percent: number | null
          config: Json
          contenedor_localizacao_id: string | null
          created_at: string
          id: string
          modelo_id: string
          serial_number: string
          sinal_dbm: number | null
          status: string
          ultimo_heartbeat: string | null
          updated_at: string
        }
        Insert: {
          apelido?: string | null
          bateria_percent?: number | null
          config?: Json
          contenedor_localizacao_id?: string | null
          created_at?: string
          id?: string
          modelo_id: string
          serial_number: string
          sinal_dbm?: number | null
          status?: string
          ultimo_heartbeat?: string | null
          updated_at?: string
        }
        Update: {
          apelido?: string | null
          bateria_percent?: number | null
          config?: Json
          contenedor_localizacao_id?: string | null
          created_at?: string
          id?: string
          modelo_id?: string
          serial_number?: string
          sinal_dbm?: number | null
          status?: string
          ultimo_heartbeat?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iot_dispositivos_instancias_contenedor_localizacao_id_fkey"
            columns: ["contenedor_localizacao_id"]
            isOneToOne: false
            referencedRelation: "contenedor_localizacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iot_dispositivos_instancias_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "iot_dispositivos_modelos"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_dispositivos_modelos: {
        Row: {
          ativo: boolean
          capacidades: Json
          categoria: string
          config_padrao: Json
          created_at: string
          fabricante: string
          firmware_versao: string | null
          id: string
          modelo: string
          nome: string
          protocolo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          capacidades?: Json
          categoria?: string
          config_padrao?: Json
          created_at?: string
          fabricante: string
          firmware_versao?: string | null
          id?: string
          modelo: string
          nome: string
          protocolo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          capacidades?: Json
          categoria?: string
          config_padrao?: Json
          created_at?: string
          fabricante?: string
          firmware_versao?: string | null
          id?: string
          modelo?: string
          nome?: string
          protocolo?: string
          updated_at?: string
        }
        Relationships: []
      }
      ldap_config: {
        Row: {
          ativo: boolean
          atributo_email: string
          atributo_grupo: string
          atributo_login: string
          atributo_nome: string
          base_dn: string
          bind_dn: string
          bind_password_secret_ref: string | null
          cadastro_automatico: boolean
          created_at: string
          group_filter: string
          host: string
          id: string
          intervalo_sync_min: number
          mapeamento_grupos: Json
          nome: string
          porta: number
          ultima_sync: string | null
          updated_at: string
          use_ssl: boolean
          use_tls: boolean
          user_filter: string
        }
        Insert: {
          ativo?: boolean
          atributo_email?: string
          atributo_grupo?: string
          atributo_login?: string
          atributo_nome?: string
          base_dn: string
          bind_dn: string
          bind_password_secret_ref?: string | null
          cadastro_automatico?: boolean
          created_at?: string
          group_filter?: string
          host: string
          id?: string
          intervalo_sync_min?: number
          mapeamento_grupos?: Json
          nome: string
          porta?: number
          ultima_sync?: string | null
          updated_at?: string
          use_ssl?: boolean
          use_tls?: boolean
          user_filter?: string
        }
        Update: {
          ativo?: boolean
          atributo_email?: string
          atributo_grupo?: string
          atributo_login?: string
          atributo_nome?: string
          base_dn?: string
          bind_dn?: string
          bind_password_secret_ref?: string | null
          cadastro_automatico?: boolean
          created_at?: string
          group_filter?: string
          host?: string
          id?: string
          intervalo_sync_min?: number
          mapeamento_grupos?: Json
          nome?: string
          porta?: number
          ultima_sync?: string | null
          updated_at?: string
          use_ssl?: boolean
          use_tls?: boolean
          user_filter?: string
        }
        Relationships: []
      }
      ldap_sync_log: {
        Row: {
          detalhes: Json
          erros: number
          finalizado_em: string | null
          id: string
          iniciado_em: string
          ldap_config_id: string
          mensagem: string | null
          status: string
          usuarios_atualizados: number
          usuarios_criados: number
        }
        Insert: {
          detalhes?: Json
          erros?: number
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          ldap_config_id: string
          mensagem?: string | null
          status?: string
          usuarios_atualizados?: number
          usuarios_criados?: number
        }
        Update: {
          detalhes?: Json
          erros?: number
          finalizado_em?: string | null
          id?: string
          iniciado_em?: string
          ldap_config_id?: string
          mensagem?: string | null
          status?: string
          usuarios_atualizados?: number
          usuarios_criados?: number
        }
        Relationships: [
          {
            foreignKeyName: "ldap_sync_log_ldap_config_id_fkey"
            columns: ["ldap_config_id"]
            isOneToOne: false
            referencedRelation: "ldap_config"
            referencedColumns: ["id"]
          },
        ]
      }
      licencas_ambientais: {
        Row: {
          arquivo_url: string | null
          created_at: string
          emissao: string
          id: string
          numero: string
          observacoes: string | null
          operador_id: string
          orgao_emissor: string
          tipo: string
          updated_at: string
          validade: string
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          emissao: string
          id?: string
          numero: string
          observacoes?: string | null
          operador_id: string
          orgao_emissor: string
          tipo: string
          updated_at?: string
          validade: string
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          emissao?: string
          id?: string
          numero?: string
          observacoes?: string | null
          operador_id?: string
          orgao_emissor?: string
          tipo?: string
          updated_at?: string
          validade?: string
        }
        Relationships: [
          {
            foreignKeyName: "licencas_ambientais_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "operadores_logisticos"
            referencedColumns: ["id"]
          },
        ]
      }
      lixao_alertas_tratativas: {
        Row: {
          alerta_key: string
          created_at: string
          id: string
          lixao_id: string | null
          observacoes: string | null
          origem: string
          situacao: string
          titulo: string
          tratado_em: string
          tratado_por: string | null
          updated_at: string
        }
        Insert: {
          alerta_key: string
          created_at?: string
          id?: string
          lixao_id?: string | null
          observacoes?: string | null
          origem: string
          situacao?: string
          titulo: string
          tratado_em?: string
          tratado_por?: string | null
          updated_at?: string
        }
        Update: {
          alerta_key?: string
          created_at?: string
          id?: string
          lixao_id?: string | null
          observacoes?: string | null
          origem?: string
          situacao?: string
          titulo?: string
          tratado_em?: string
          tratado_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lixao_alertas_tratativas_lixao_id_fkey"
            columns: ["lixao_id"]
            isOneToOne: false
            referencedRelation: "lixoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lixao_alertas_tratativas_lixao_id_fkey"
            columns: ["lixao_id"]
            isOneToOne: false
            referencedRelation: "vw_lixoes_pnrs"
            referencedColumns: ["id"]
          },
        ]
      }
      lixao_auditoria: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json
          entidade: string
          entidade_id: string | null
          id: string
          lixao_id: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json
          entidade: string
          entidade_id?: string | null
          id?: string
          lixao_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json
          entidade?: string
          entidade_id?: string | null
          id?: string
          lixao_id?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lixao_encerramento_etapas: {
        Row: {
          created_at: string
          data_conclusao: string | null
          data_prevista: string | null
          descricao: string | null
          etapa: string
          id: string
          lixao_id: string
          observacoes: string | null
          ordem: number
          responsavel: string | null
          situacao: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_conclusao?: string | null
          data_prevista?: string | null
          descricao?: string | null
          etapa: string
          id?: string
          lixao_id: string
          observacoes?: string | null
          ordem: number
          responsavel?: string | null
          situacao?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_conclusao?: string | null
          data_prevista?: string | null
          descricao?: string | null
          etapa?: string
          id?: string
          lixao_id?: string
          observacoes?: string | null
          ordem?: number
          responsavel?: string | null
          situacao?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lixao_encerramento_etapas_lixao_id_fkey"
            columns: ["lixao_id"]
            isOneToOne: false
            referencedRelation: "lixoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lixao_encerramento_etapas_lixao_id_fkey"
            columns: ["lixao_id"]
            isOneToOne: false
            referencedRelation: "vw_lixoes_pnrs"
            referencedColumns: ["id"]
          },
        ]
      }
      lixao_prazo_historico: {
        Row: {
          alterado_por: string | null
          created_at: string
          etapa: string
          etapa_id: string | null
          id: string
          lixao_id: string | null
          prazo_anterior: string | null
          prazo_novo: string | null
        }
        Insert: {
          alterado_por?: string | null
          created_at?: string
          etapa: string
          etapa_id?: string | null
          id?: string
          lixao_id?: string | null
          prazo_anterior?: string | null
          prazo_novo?: string | null
        }
        Update: {
          alterado_por?: string | null
          created_at?: string
          etapa?: string
          etapa_id?: string | null
          id?: string
          lixao_id?: string | null
          prazo_anterior?: string | null
          prazo_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lixao_prazo_historico_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "lixao_encerramento_etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      lixao_volume_historico: {
        Row: {
          created_at: string
          id: string
          lixao_id: string
          mes_referencia: string
          observacoes: string | null
          residuo_recuperavel_pct: number | null
          updated_at: string
          volume_estocado_m3: number
          volume_recuperado_m3: number
          volume_removido_m3: number
        }
        Insert: {
          created_at?: string
          id?: string
          lixao_id: string
          mes_referencia: string
          observacoes?: string | null
          residuo_recuperavel_pct?: number | null
          updated_at?: string
          volume_estocado_m3: number
          volume_recuperado_m3?: number
          volume_removido_m3?: number
        }
        Update: {
          created_at?: string
          id?: string
          lixao_id?: string
          mes_referencia?: string
          observacoes?: string | null
          residuo_recuperavel_pct?: number | null
          updated_at?: string
          volume_estocado_m3?: number
          volume_recuperado_m3?: number
          volume_removido_m3?: number
        }
        Relationships: [
          {
            foreignKeyName: "lixao_volume_historico_lixao_id_fkey"
            columns: ["lixao_id"]
            isOneToOne: false
            referencedRelation: "lixoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lixao_volume_historico_lixao_id_fkey"
            columns: ["lixao_id"]
            isOneToOne: false
            referencedRelation: "vw_lixoes_pnrs"
            referencedColumns: ["id"]
          },
        ]
      }
      lixoes: {
        Row: {
          area_ha: number | null
          catadores_estimados: number | null
          consorcio_publico: boolean | null
          created_at: string
          data_abertura: string | null
          data_encerramento_prevista: string | null
          data_encerramento_real: string | null
          data_ultima_verificacao: string | null
          fonte: string | null
          fonte_verificacao: string | null
          id: string
          latitude: number
          longitude: number
          municipio: string
          municipio_ibge: string | null
          nome: string
          observacoes: string | null
          populacao_municipio: number | null
          possui_coleta_seletiva: boolean | null
          possui_plano_municipal: boolean | null
          status: Database["public"]["Enums"]["lixao_status"]
          tipo: Database["public"]["Enums"]["lixao_tipo"]
          uf: string
          updated_at: string
          volume_estocado_m3_inicial: number | null
        }
        Insert: {
          area_ha?: number | null
          catadores_estimados?: number | null
          consorcio_publico?: boolean | null
          created_at?: string
          data_abertura?: string | null
          data_encerramento_prevista?: string | null
          data_encerramento_real?: string | null
          data_ultima_verificacao?: string | null
          fonte?: string | null
          fonte_verificacao?: string | null
          id?: string
          latitude: number
          longitude: number
          municipio: string
          municipio_ibge?: string | null
          nome: string
          observacoes?: string | null
          populacao_municipio?: number | null
          possui_coleta_seletiva?: boolean | null
          possui_plano_municipal?: boolean | null
          status?: Database["public"]["Enums"]["lixao_status"]
          tipo?: Database["public"]["Enums"]["lixao_tipo"]
          uf: string
          updated_at?: string
          volume_estocado_m3_inicial?: number | null
        }
        Update: {
          area_ha?: number | null
          catadores_estimados?: number | null
          consorcio_publico?: boolean | null
          created_at?: string
          data_abertura?: string | null
          data_encerramento_prevista?: string | null
          data_encerramento_real?: string | null
          data_ultima_verificacao?: string | null
          fonte?: string | null
          fonte_verificacao?: string | null
          id?: string
          latitude?: number
          longitude?: number
          municipio?: string
          municipio_ibge?: string | null
          nome?: string
          observacoes?: string | null
          populacao_municipio?: number | null
          possui_coleta_seletiva?: boolean | null
          possui_plano_municipal?: boolean | null
          status?: Database["public"]["Enums"]["lixao_status"]
          tipo?: Database["public"]["Enums"]["lixao_tipo"]
          uf?: string
          updated_at?: string
          volume_estocado_m3_inicial?: number | null
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
      mtr_solicitacoes: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          assinatura_destinador: string | null
          assinatura_gerador: string | null
          assinatura_transportador: string | null
          classe_residuo: string
          codigo: string
          created_at: string
          created_by: string | null
          data_coleta: string | null
          data_prevista: string | null
          data_recepcao: string | null
          destinador_id: string | null
          fluxo_status: Database["public"]["Enums"]["mtr_fluxo_status"]
          gerador_id: string
          id: string
          motivo_bloqueio: string | null
          observacoes: string | null
          onu_number: string | null
          operador_id: string | null
          quantidade_kg: number
          status: string
          updated_at: string
          veiculo_id: string | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          assinatura_destinador?: string | null
          assinatura_gerador?: string | null
          assinatura_transportador?: string | null
          classe_residuo: string
          codigo?: string
          created_at?: string
          created_by?: string | null
          data_coleta?: string | null
          data_prevista?: string | null
          data_recepcao?: string | null
          destinador_id?: string | null
          fluxo_status?: Database["public"]["Enums"]["mtr_fluxo_status"]
          gerador_id: string
          id?: string
          motivo_bloqueio?: string | null
          observacoes?: string | null
          onu_number?: string | null
          operador_id?: string | null
          quantidade_kg: number
          status?: string
          updated_at?: string
          veiculo_id?: string | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          assinatura_destinador?: string | null
          assinatura_gerador?: string | null
          assinatura_transportador?: string | null
          classe_residuo?: string
          codigo?: string
          created_at?: string
          created_by?: string | null
          data_coleta?: string | null
          data_prevista?: string | null
          data_recepcao?: string | null
          destinador_id?: string | null
          fluxo_status?: Database["public"]["Enums"]["mtr_fluxo_status"]
          gerador_id?: string
          id?: string
          motivo_bloqueio?: string | null
          observacoes?: string | null
          onu_number?: string | null
          operador_id?: string | null
          quantidade_kg?: number
          status?: string
          updated_at?: string
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mtr_solicitacoes_destinador_id_fkey"
            columns: ["destinador_id"]
            isOneToOne: false
            referencedRelation: "operadores_logisticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtr_solicitacoes_gerador_id_fkey"
            columns: ["gerador_id"]
            isOneToOne: false
            referencedRelation: "geradores_criticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtr_solicitacoes_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "operadores_logisticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mtr_solicitacoes_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos_homologados"
            referencedColumns: ["id"]
          },
        ]
      }
      munic_diagnostico: {
        Row: {
          ano_referencia: number
          created_at: string
          fonte: string
          id: string
          pct_aterro_controlado: number | null
          pct_aterro_sanitario: number | null
          pct_catadores_informais: number | null
          pct_coleta_seletiva: number | null
          pct_entidades_catadores: number | null
          pct_instrumento_legal: number | null
          pct_lixao: number
          pct_lixao_acima_50k: number | null
          regiao: string
        }
        Insert: {
          ano_referencia?: number
          created_at?: string
          fonte?: string
          id?: string
          pct_aterro_controlado?: number | null
          pct_aterro_sanitario?: number | null
          pct_catadores_informais?: number | null
          pct_coleta_seletiva?: number | null
          pct_entidades_catadores?: number | null
          pct_instrumento_legal?: number | null
          pct_lixao: number
          pct_lixao_acima_50k?: number | null
          regiao: string
        }
        Update: {
          ano_referencia?: number
          created_at?: string
          fonte?: string
          id?: string
          pct_aterro_controlado?: number | null
          pct_aterro_sanitario?: number | null
          pct_catadores_informais?: number | null
          pct_coleta_seletiva?: number | null
          pct_entidades_catadores?: number | null
          pct_instrumento_legal?: number | null
          pct_lixao?: number
          pct_lixao_acima_50k?: number | null
          regiao?: string
        }
        Relationships: []
      }
      notif_canais: {
        Row: {
          ativo: boolean
          config: Json
          created_at: string
          descricao: string
          id: string
          nome: string
          secret_ref: string | null
          tipo: string
          total_envios: number
          total_falhas: number
          ultimo_envio: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          config?: Json
          created_at?: string
          descricao?: string
          id?: string
          nome: string
          secret_ref?: string | null
          tipo: string
          total_envios?: number
          total_falhas?: number
          ultimo_envio?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          config?: Json
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          secret_ref?: string | null
          tipo?: string
          total_envios?: number
          total_falhas?: number
          ultimo_envio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notif_envios: {
        Row: {
          assunto: string | null
          canal_id: string | null
          corpo: string | null
          created_at: string
          destinatario: string
          erro: string | null
          evento: string | null
          id: string
          status: string
          template_id: string | null
        }
        Insert: {
          assunto?: string | null
          canal_id?: string | null
          corpo?: string | null
          created_at?: string
          destinatario: string
          erro?: string | null
          evento?: string | null
          id?: string
          status?: string
          template_id?: string | null
        }
        Update: {
          assunto?: string | null
          canal_id?: string | null
          corpo?: string | null
          created_at?: string
          destinatario?: string
          erro?: string | null
          evento?: string | null
          id?: string
          status?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notif_envios_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "notif_canais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notif_envios_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notif_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notif_templates: {
        Row: {
          assunto: string
          ativo: boolean
          canal_tipo: string
          corpo: string
          created_at: string
          evento: string
          id: string
          nome: string
          updated_at: string
          variaveis: Json
        }
        Insert: {
          assunto?: string
          ativo?: boolean
          canal_tipo: string
          corpo?: string
          created_at?: string
          evento: string
          id?: string
          nome: string
          updated_at?: string
          variaveis?: Json
        }
        Update: {
          assunto?: string
          ativo?: boolean
          canal_tipo?: string
          corpo?: string
          created_at?: string
          evento?: string
          id?: string
          nome?: string
          updated_at?: string
          variaveis?: Json
        }
        Relationships: []
      }
      operadores_logisticos: {
        Row: {
          bloqueado: boolean
          cnpj: string
          contato_email: string | null
          contato_telefone: string | null
          created_at: string
          homologado: boolean
          id: string
          motivo_bloqueio: string | null
          natureza: string
          razao_social: string
          tipo: string
          updated_at: string
        }
        Insert: {
          bloqueado?: boolean
          cnpj: string
          contato_email?: string | null
          contato_telefone?: string | null
          created_at?: string
          homologado?: boolean
          id?: string
          motivo_bloqueio?: string | null
          natureza?: string
          razao_social: string
          tipo: string
          updated_at?: string
        }
        Update: {
          bloqueado?: boolean
          cnpj?: string
          contato_email?: string | null
          contato_telefone?: string | null
          created_at?: string
          homologado?: boolean
          id?: string
          motivo_bloqueio?: string | null
          natureza?: string
          razao_social?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      residuos_criticos_auditoria: {
        Row: {
          acao: string
          created_at: string
          detalhes: Json
          entidade: string
          entidade_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          detalhes?: Json
          entidade: string
          entidade_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          detalhes?: Json
          entidade?: string
          entidade_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      role_audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: string | null
          performed_at: string
          performed_by: string
          role: string
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          ip_address?: string | null
          performed_at?: string
          performed_by: string
          role: string
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          ip_address?: string | null
          performed_at?: string
          performed_by?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      rotas_planejadas: {
        Row: {
          carga_id: string
          created_at: string
          destino_lat: number
          destino_lng: number
          id: string
          origem_lat: number
          origem_lng: number
          raio_tolerancia_m: number
          updated_at: string
          waypoints: Json
        }
        Insert: {
          carga_id: string
          created_at?: string
          destino_lat: number
          destino_lng: number
          id?: string
          origem_lat: number
          origem_lng: number
          raio_tolerancia_m?: number
          updated_at?: string
          waypoints?: Json
        }
        Update: {
          carga_id?: string
          created_at?: string
          destino_lat?: number
          destino_lng?: number
          id?: string
          origem_lat?: number
          origem_lng?: number
          raio_tolerancia_m?: number
          updated_at?: string
          waypoints?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rotas_planejadas_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "cargas_perigosas"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetria_frota: {
        Row: {
          carga_id: string | null
          id: string
          lat: number
          lng: number
          peso_carga_kg: number | null
          recebido_em: string
          status_porta: Database["public"]["Enums"]["porta_status"]
          veiculo_id: string
          velocidade_kmh: number | null
        }
        Insert: {
          carga_id?: string | null
          id?: string
          lat: number
          lng: number
          peso_carga_kg?: number | null
          recebido_em?: string
          status_porta?: Database["public"]["Enums"]["porta_status"]
          veiculo_id: string
          velocidade_kmh?: number | null
        }
        Update: {
          carga_id?: string | null
          id?: string
          lat?: number
          lng?: number
          peso_carga_kg?: number | null
          recebido_em?: string
          status_porta?: Database["public"]["Enums"]["porta_status"]
          veiculo_id?: string
          velocidade_kmh?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "telemetria_frota_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "cargas_perigosas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetria_frota_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos_frota"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetria_historico: {
        Row: {
          contenedor_localizacao_id: string
          created_at: string
          evento: string
          id: string
          nivel_antes: number | null
          nivel_preenchimento: number
          registrado_em: string
        }
        Insert: {
          contenedor_localizacao_id: string
          created_at?: string
          evento?: string
          id?: string
          nivel_antes?: number | null
          nivel_preenchimento?: number
          registrado_em?: string
        }
        Update: {
          contenedor_localizacao_id?: string
          created_at?: string
          evento?: string
          id?: string
          nivel_antes?: number | null
          nivel_preenchimento?: number
          registrado_em?: string
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios_perfis_extra: {
        Row: {
          ativo: boolean
          cargo: string | null
          created_at: string
          departamento: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          ldap_dn: string | null
          origem_cadastro: string
          telefone: string | null
          ultimo_login: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          ldap_dn?: string | null
          origem_cadastro?: string
          telefone?: string | null
          ultimo_login?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          ldap_dn?: string | null
          origem_cadastro?: string
          telefone?: string | null
          ultimo_login?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      veiculos_frota: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          placa: string
          tipo_licenca: string | null
          tracker_id: string
          transportadora: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          placa: string
          tipo_licenca?: string | null
          tracker_id: string
          transportadora: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          placa?: string
          tipo_licenca?: string | null
          tracker_id?: string
          transportadora?: string
          updated_at?: string
        }
        Relationships: []
      }
      veiculos_homologados: {
        Row: {
          antt: string | null
          ativo: boolean
          capacidade_kg: number | null
          created_at: string
          id: string
          onu_class: string | null
          operador_id: string
          placa: string
          tipo: string
          updated_at: string
          vistoria_validade: string | null
        }
        Insert: {
          antt?: string | null
          ativo?: boolean
          capacidade_kg?: number | null
          created_at?: string
          id?: string
          onu_class?: string | null
          operador_id: string
          placa: string
          tipo: string
          updated_at?: string
          vistoria_validade?: string | null
        }
        Update: {
          antt?: string | null
          ativo?: boolean
          capacidade_kg?: number | null
          created_at?: string
          id?: string
          onu_class?: string | null
          operador_id?: string
          placa?: string
          tipo?: string
          updated_at?: string
          vistoria_validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_homologados_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "operadores_logisticos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_api_credential: {
        Row: {
          api_key_prefix: string | null
          created_at: string | null
          data_expiracao: string | null
          id: string | null
          industria_id: string | null
          nome: string | null
          scopes: string[] | null
          status: string | null
          ultimo_uso: string | null
          updated_at: string | null
        }
        Insert: {
          api_key_prefix?: string | null
          created_at?: string | null
          data_expiracao?: string | null
          id?: string | null
          industria_id?: string | null
          nome?: string | null
          scopes?: string[] | null
          status?: string | null
          ultimo_uso?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key_prefix?: string | null
          created_at?: string | null
          data_expiracao?: string | null
          id?: string | null
          industria_id?: string | null
          nome?: string | null
          scopes?: string[] | null
          status?: string | null
          ultimo_uso?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_api_log: {
        Row: {
          created_at: string | null
          credential_id: string | null
          endpoint: string | null
          id: string | null
          industria_id: string | null
          ip_address: string | null
          method: string | null
          request_summary: string | null
          response_summary: string | null
          status_code: number | null
        }
        Insert: {
          created_at?: string | null
          credential_id?: string | null
          endpoint?: string | null
          id?: string | null
          industria_id?: string | null
          ip_address?: string | null
          method?: string | null
          request_summary?: string | null
          response_summary?: string | null
          status_code?: number | null
        }
        Update: {
          created_at?: string | null
          credential_id?: string | null
          endpoint?: string | null
          id?: string | null
          industria_id?: string | null
          ip_address?: string | null
          method?: string | null
          request_summary?: string | null
          response_summary?: string | null
          status_code?: number | null
        }
        Relationships: []
      }
      v_auditoria_infracoes: {
        Row: {
          artigo_pnrs_violado: string | null
          cnpj_infrator: string | null
          created_at: string | null
          data_autuacao: string | null
          id: string | null
          motivo: string | null
          razao_social_infrator: string | null
          status: string | null
          updated_at: string | null
          valor_multa: number | null
        }
        Insert: {
          artigo_pnrs_violado?: string | null
          cnpj_infrator?: string | null
          created_at?: string | null
          data_autuacao?: string | null
          id?: string | null
          motivo?: string | null
          razao_social_infrator?: string | null
          status?: string | null
          updated_at?: string | null
          valor_multa?: number | null
        }
        Update: {
          artigo_pnrs_violado?: string | null
          cnpj_infrator?: string | null
          created_at?: string | null
          data_autuacao?: string | null
          id?: string | null
          motivo?: string | null
          razao_social_infrator?: string | null
          status?: string | null
          updated_at?: string | null
          valor_multa?: number | null
        }
        Relationships: []
      }
      v_carteira_creditos: {
        Row: {
          created_at: string | null
          data_ultima_atualizacao: string | null
          id: string | null
          saldo_pontos_moeda_eco: number | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_ultima_atualizacao?: string | null
          id?: string | null
          saldo_pontos_moeda_eco?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_ultima_atualizacao?: string | null
          id?: string | null
          saldo_pontos_moeda_eco?: number | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      v_catador_associado: {
        Row: {
          cooperativa_id: string | null
          cpf_hash: string | null
          created_at: string | null
          data_associacao: string | null
          id: string | null
          nome: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cooperativa_id?: string | null
          cpf_hash?: string | null
          created_at?: string | null
          data_associacao?: string | null
          id?: string | null
          nome?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cooperativa_id?: string | null
          cpf_hash?: string | null
          created_at?: string | null
          data_associacao?: string | null
          id?: string | null
          nome?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_certificado_logistica_reversa: {
        Row: {
          ano_referencia: number | null
          created_at: string | null
          data_emissao: string | null
          hash_auditoria: string | null
          id: string | null
          industria_id: string | null
          status: "Válido" | "Expirado" | "Revogado" | null
          updated_at: string | null
          volume_total_certificado: number | null
        }
        Insert: {
          ano_referencia?: number | null
          created_at?: string | null
          data_emissao?: string | null
          hash_auditoria?: string | null
          id?: string | null
          industria_id?: string | null
          status?: "Válido" | "Expirado" | "Revogado" | null
          updated_at?: string | null
          volume_total_certificado?: number | null
        }
        Update: {
          ano_referencia?: number | null
          created_at?: string | null
          data_emissao?: string | null
          hash_auditoria?: string | null
          id?: string | null
          industria_id?: string | null
          status?: "Válido" | "Expirado" | "Revogado" | null
          updated_at?: string | null
          volume_total_certificado?: number | null
        }
        Relationships: []
      }
      v_coleta_registro: {
        Row: {
          app_origem: string | null
          created_at: string | null
          data_hora: string | null
          geolocalizacao_lat: number | null
          geolocalizacao_lon: number | null
          id: string | null
          id_transacao_app_externo: string | null
          peso_kg: number | null
          tipo_material:
            | "PET"
            | "Vidro"
            | "Alumínio"
            | "Papelão"
            | "Metal"
            | "Plástico"
            | "Orgânico"
            | "Eletrônico"
            | "Outros"
            | null
          updated_at: string | null
          usuario_id: string | null
        }
        Insert: {
          app_origem?: string | null
          created_at?: string | null
          data_hora?: string | null
          geolocalizacao_lat?: number | null
          geolocalizacao_lon?: number | null
          id?: string | null
          id_transacao_app_externo?: string | null
          peso_kg?: number | null
          tipo_material?:
            | "PET"
            | "Vidro"
            | "Alumínio"
            | "Papelão"
            | "Metal"
            | "Plástico"
            | "Orgânico"
            | "Eletrônico"
            | "Outros"
            | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Update: {
          app_origem?: string | null
          created_at?: string | null
          data_hora?: string | null
          geolocalizacao_lat?: number | null
          geolocalizacao_lon?: number | null
          id?: string | null
          id_transacao_app_externo?: string | null
          peso_kg?: number | null
          tipo_material?:
            | "PET"
            | "Vidro"
            | "Alumínio"
            | "Papelão"
            | "Metal"
            | "Plástico"
            | "Orgânico"
            | "Eletrônico"
            | "Outros"
            | null
          updated_at?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      v_cooperativa: {
        Row: {
          capacidade_processamento: number | null
          cidade: string | null
          cnpj: string | null
          created_at: string | null
          estado: string | null
          id: string | null
          licenca_ambiental: string | null
          nome: string | null
          updated_at: string | null
        }
        Insert: {
          capacidade_processamento?: number | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string | null
          licenca_ambiental?: string | null
          nome?: string | null
          updated_at?: string | null
        }
        Update: {
          capacidade_processamento?: number | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string | null
          licenca_ambiental?: string | null
          nome?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_despacho_industria: {
        Row: {
          chave_nfe: string | null
          cooperativa_id: string | null
          created_at: string | null
          data_despacho: string | null
          id: string | null
          industria_destino_cnpj: string | null
          industria_destino_nome: string | null
          numero_nota_fiscal: string | null
          peso_despachado_kg: number | null
          status: string | null
          tipo_material: string | null
          token_rastreabilidade: string | null
          updated_at: string | null
        }
        Insert: {
          chave_nfe?: string | null
          cooperativa_id?: string | null
          created_at?: string | null
          data_despacho?: string | null
          id?: string | null
          industria_destino_cnpj?: string | null
          industria_destino_nome?: string | null
          numero_nota_fiscal?: string | null
          peso_despachado_kg?: number | null
          status?: string | null
          tipo_material?: string | null
          token_rastreabilidade?: string | null
          updated_at?: string | null
        }
        Update: {
          chave_nfe?: string | null
          cooperativa_id?: string | null
          created_at?: string | null
          data_despacho?: string | null
          id?: string | null
          industria_destino_cnpj?: string | null
          industria_destino_nome?: string | null
          numero_nota_fiscal?: string | null
          peso_despachado_kg?: number | null
          status?: string | null
          tipo_material?: string | null
          token_rastreabilidade?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_despacho_lote: {
        Row: {
          cooperativa_destino_cnpj: string | null
          cooperativa_destino_nome: string | null
          created_at: string | null
          data_despacho: string | null
          entidade_id: string | null
          id: string | null
          observacoes: string | null
          peso_total_kg: number | null
          status: string | null
          tipo_material: string | null
          updated_at: string | null
        }
        Insert: {
          cooperativa_destino_cnpj?: string | null
          cooperativa_destino_nome?: string | null
          created_at?: string | null
          data_despacho?: string | null
          entidade_id?: string | null
          id?: string | null
          observacoes?: string | null
          peso_total_kg?: number | null
          status?: string | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Update: {
          cooperativa_destino_cnpj?: string | null
          cooperativa_destino_nome?: string | null
          created_at?: string | null
          data_despacho?: string | null
          entidade_id?: string | null
          id?: string | null
          observacoes?: string | null
          peso_total_kg?: number | null
          status?: string | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_entidade_credenciada: {
        Row: {
          cnpj: string | null
          created_at: string | null
          email_contato: string | null
          id: string | null
          natureza_juridica: "Privada" | "Órgão Público" | null
          nome_fantasia: string | null
          razao_social: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          email_contato?: string | null
          id?: string | null
          natureza_juridica?: "Privada" | "Órgão Público" | null
          nome_fantasia?: string | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          email_contato?: string | null
          id?: string | null
          natureza_juridica?: "Privada" | "Órgão Público" | null
          nome_fantasia?: string | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_estacao_coleta: {
        Row: {
          capacidade_toneladas: number | null
          cep: string | null
          cidade: string | null
          created_at: string | null
          endereco: string | null
          entidade_id: string | null
          estado: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          status_operacional: "Ativo" | "Inativo" | "Manutenção" | null
          updated_at: string | null
        }
        Insert: {
          capacidade_toneladas?: number | null
          cep?: string | null
          cidade?: string | null
          created_at?: string | null
          endereco?: string | null
          entidade_id?: string | null
          estado?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          status_operacional?: "Ativo" | "Inativo" | "Manutenção" | null
          updated_at?: string | null
        }
        Update: {
          capacidade_toneladas?: number | null
          cep?: string | null
          cidade?: string | null
          created_at?: string | null
          endereco?: string | null
          entidade_id?: string | null
          estado?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          status_operacional?: "Ativo" | "Inativo" | "Manutenção" | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_estoque_cooperativa: {
        Row: {
          cooperativa_id: string | null
          id: string | null
          saldo_kg: number | null
          tipo_material: string | null
          updated_at: string | null
        }
        Insert: {
          cooperativa_id?: string | null
          id?: string | null
          saldo_kg?: number | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Update: {
          cooperativa_id?: string | null
          id?: string | null
          saldo_kg?: number | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_industria: {
        Row: {
          cidade: string | null
          cnae_principal: string | null
          cnpj: string | null
          created_at: string | null
          estado: string | null
          id: string | null
          licenca_operacao: string | null
          razao_social: string | null
          updated_at: string | null
        }
        Insert: {
          cidade?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string | null
          licenca_operacao?: string | null
          razao_social?: string | null
          updated_at?: string | null
        }
        Update: {
          cidade?: string | null
          cnae_principal?: string | null
          cnpj?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string | null
          licenca_operacao?: string | null
          razao_social?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_licenca_cooperativa: {
        Row: {
          arquivo_url: string | null
          cooperativa_id: string | null
          created_at: string | null
          data_emissao: string | null
          data_validade: string | null
          id: string | null
          numero: string | null
          status: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          arquivo_url?: string | null
          cooperativa_id?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          id?: string | null
          numero?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          arquivo_url?: string | null
          cooperativa_id?: string | null
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          id?: string | null
          numero?: string | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_lote_entrada: {
        Row: {
          cooperativa_id: string | null
          created_at: string | null
          data_recebimento: string | null
          id: string | null
          origem_id: string | null
          origem_tipo: "Cidadão" | "PontoColeta" | null
          peso_bruto_kg: number | null
          tipo_material: string | null
          updated_at: string | null
        }
        Insert: {
          cooperativa_id?: string | null
          created_at?: string | null
          data_recebimento?: string | null
          id?: string | null
          origem_id?: string | null
          origem_tipo?: "Cidadão" | "PontoColeta" | null
          peso_bruto_kg?: number | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Update: {
          cooperativa_id?: string | null
          created_at?: string | null
          data_recebimento?: string | null
          id?: string | null
          origem_id?: string | null
          origem_tipo?: "Cidadão" | "PontoColeta" | null
          peso_bruto_kg?: number | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_lote_recebido: {
        Row: {
          chave_nfe: string | null
          cooperativa_cnpj: string | null
          cooperativa_nome: string | null
          created_at: string | null
          data_recebimento: string | null
          id: string | null
          industria_id: string | null
          numero_nota_fiscal: string | null
          origem_importacao: string | null
          peso_kg: number | null
          status: string | null
          tipo_material: string | null
          token_rastreabilidade: string | null
          token_validado: boolean | null
          updated_at: string | null
        }
        Insert: {
          chave_nfe?: string | null
          cooperativa_cnpj?: string | null
          cooperativa_nome?: string | null
          created_at?: string | null
          data_recebimento?: string | null
          id?: string | null
          industria_id?: string | null
          numero_nota_fiscal?: string | null
          origem_importacao?: string | null
          peso_kg?: number | null
          status?: string | null
          tipo_material?: string | null
          token_rastreabilidade?: string | null
          token_validado?: boolean | null
          updated_at?: string | null
        }
        Update: {
          chave_nfe?: string | null
          cooperativa_cnpj?: string | null
          cooperativa_nome?: string | null
          created_at?: string | null
          data_recebimento?: string | null
          id?: string | null
          industria_id?: string | null
          numero_nota_fiscal?: string | null
          origem_importacao?: string | null
          peso_kg?: number | null
          status?: string | null
          tipo_material?: string | null
          token_rastreabilidade?: string | null
          token_validado?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_lote_saida_faturado: {
        Row: {
          cooperativa_id: string | null
          created_at: string | null
          data_despacho: string | null
          id: string | null
          industria_destino_cnpj: string | null
          numero_nota_fiscal: string | null
          peso_liquido_kg: number | null
          tipo_material: string | null
          updated_at: string | null
          valor_venda: number | null
        }
        Insert: {
          cooperativa_id?: string | null
          created_at?: string | null
          data_despacho?: string | null
          id?: string | null
          industria_destino_cnpj?: string | null
          numero_nota_fiscal?: string | null
          peso_liquido_kg?: number | null
          tipo_material?: string | null
          updated_at?: string | null
          valor_venda?: number | null
        }
        Update: {
          cooperativa_id?: string | null
          created_at?: string | null
          data_despacho?: string | null
          id?: string | null
          industria_destino_cnpj?: string | null
          numero_nota_fiscal?: string | null
          peso_liquido_kg?: number | null
          tipo_material?: string | null
          updated_at?: string | null
          valor_venda?: number | null
        }
        Relationships: []
      }
      v_materia_prima_reciclada: {
        Row: {
          comprovante_reaproveitamento: string | null
          created_at: string | null
          data_registro: string | null
          id: string | null
          industria_id: string | null
          lote_saida_id: string | null
          peso_kg: number | null
          tipo_insumo: string | null
          updated_at: string | null
        }
        Insert: {
          comprovante_reaproveitamento?: string | null
          created_at?: string | null
          data_registro?: string | null
          id?: string | null
          industria_id?: string | null
          lote_saida_id?: string | null
          peso_kg?: number | null
          tipo_insumo?: string | null
          updated_at?: string | null
        }
        Update: {
          comprovante_reaproveitamento?: string | null
          created_at?: string | null
          data_registro?: string | null
          id?: string | null
          industria_id?: string | null
          lote_saida_id?: string | null
          peso_kg?: number | null
          tipo_insumo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_meta_pnrs: {
        Row: {
          ano_referencia: number | null
          atingido_peso_kg: number | null
          created_at: string | null
          id: string | null
          industria_id: string | null
          meta_peso_kg: number | null
          tipo_material: string | null
          updated_at: string | null
        }
        Insert: {
          ano_referencia?: number | null
          atingido_peso_kg?: number | null
          created_at?: string | null
          id?: string | null
          industria_id?: string | null
          meta_peso_kg?: number | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Update: {
          ano_referencia?: number | null
          atingido_peso_kg?: number | null
          created_at?: string | null
          id?: string | null
          industria_id?: string | null
          meta_peso_kg?: number | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_metas_orgao_publico: {
        Row: {
          ano_vigencia: number | null
          atingimento_peso_kg: number | null
          created_at: string | null
          entidade_id: string | null
          id: string | null
          meta_peso_kg: number | null
          updated_at: string | null
        }
        Insert: {
          ano_vigencia?: number | null
          atingimento_peso_kg?: number | null
          created_at?: string | null
          entidade_id?: string | null
          id?: string | null
          meta_peso_kg?: number | null
          updated_at?: string | null
        }
        Update: {
          ano_vigencia?: number | null
          atingimento_peso_kg?: number | null
          created_at?: string | null
          entidade_id?: string | null
          id?: string | null
          meta_peso_kg?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_metrica_planares: {
        Row: {
          ano_referencia: number | null
          created_at: string | null
          id: string | null
          tipo_meta:
            | "Fim Lixões"
            | "% Reciclagem Urbana"
            | "Recuperação Áreas Degradadas"
            | "Inclusão Catadores"
            | "Logística Reversa"
            | null
          updated_at: string | null
          valor_alvo: number | null
          valor_atingido: number | null
        }
        Insert: {
          ano_referencia?: number | null
          created_at?: string | null
          id?: string | null
          tipo_meta?:
            | "Fim Lixões"
            | "% Reciclagem Urbana"
            | "Recuperação Áreas Degradadas"
            | "Inclusão Catadores"
            | "Logística Reversa"
            | null
          updated_at?: string | null
          valor_alvo?: number | null
          valor_atingido?: number | null
        }
        Update: {
          ano_referencia?: number | null
          created_at?: string | null
          id?: string | null
          tipo_meta?:
            | "Fim Lixões"
            | "% Reciclagem Urbana"
            | "Recuperação Áreas Degradadas"
            | "Inclusão Catadores"
            | "Logística Reversa"
            | null
          updated_at?: string | null
          valor_alvo?: number | null
          valor_atingido?: number | null
        }
        Relationships: []
      }
      v_registro_entrada: {
        Row: {
          cpf_cidadao: string | null
          created_at: string | null
          entidade_id: string | null
          estacao_id: string | null
          id: string | null
          observacoes: string | null
          origem_anonima: boolean | null
          peso_kg: number | null
          recibo_codigo: string | null
          tipo_material: string | null
          updated_at: string | null
        }
        Insert: {
          cpf_cidadao?: string | null
          created_at?: string | null
          entidade_id?: string | null
          estacao_id?: string | null
          id?: string | null
          observacoes?: string | null
          origem_anonima?: boolean | null
          peso_kg?: number | null
          recibo_codigo?: string | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf_cidadao?: string | null
          created_at?: string | null
          entidade_id?: string | null
          estacao_id?: string | null
          id?: string | null
          observacoes?: string | null
          origem_anonima?: boolean | null
          peso_kg?: number | null
          recibo_codigo?: string | null
          tipo_material?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_telemetria_consolidada: {
        Row: {
          created_at: string | null
          data_referencia: string | null
          estado_ibge: string | null
          id: string | null
          municipio_ibge: string | null
          updated_at: string | null
          volume_total_coletado_ton: number | null
          volume_total_reciclado_ton: number | null
        }
        Insert: {
          created_at?: string | null
          data_referencia?: string | null
          estado_ibge?: string | null
          id?: string | null
          municipio_ibge?: string | null
          updated_at?: string | null
          volume_total_coletado_ton?: number | null
          volume_total_reciclado_ton?: number | null
        }
        Update: {
          created_at?: string | null
          data_referencia?: string | null
          estado_ibge?: string | null
          id?: string | null
          municipio_ibge?: string | null
          updated_at?: string | null
          volume_total_coletado_ton?: number | null
          volume_total_reciclado_ton?: number | null
        }
        Relationships: []
      }
      v_usuario_app: {
        Row: {
          cpf_hash: string | null
          created_at: string | null
          data_cadastro: string | null
          email: string | null
          id: string | null
          nome_exibicao: string | null
          tipo_perfil: "Cidadão" | "Catador" | null
          updated_at: string | null
        }
        Insert: {
          cpf_hash?: string | null
          created_at?: string | null
          data_cadastro?: string | null
          email?: string | null
          id?: string | null
          nome_exibicao?: string | null
          tipo_perfil?: "Cidadão" | "Catador" | null
          updated_at?: string | null
        }
        Update: {
          cpf_hash?: string | null
          created_at?: string | null
          data_cadastro?: string | null
          email?: string | null
          id?: string | null
          nome_exibicao?: string | null
          tipo_perfil?: "Cidadão" | "Catador" | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vw_comparativo_municipal: {
        Row: {
          ano_referencia: number | null
          eficiencia_coleta_seletiva: number | null
          engajamento_cidadao: number | null
          kg_per_capita: number | null
          municipio_ibge: string | null
          nome_municipio: string | null
          pontos_coleta_por_km2: number | null
          populacao: number | null
          taxa_desvio_aterro: number | null
          uf: string | null
          volume_coletado_ton: number | null
          volume_reciclado_ton: number | null
        }
        Insert: {
          ano_referencia?: number | null
          eficiencia_coleta_seletiva?: number | null
          engajamento_cidadao?: number | null
          kg_per_capita?: never
          municipio_ibge?: string | null
          nome_municipio?: string | null
          pontos_coleta_por_km2?: number | null
          populacao?: number | null
          taxa_desvio_aterro?: number | null
          uf?: string | null
          volume_coletado_ton?: number | null
          volume_reciclado_ton?: number | null
        }
        Update: {
          ano_referencia?: number | null
          eficiencia_coleta_seletiva?: number | null
          engajamento_cidadao?: number | null
          kg_per_capita?: never
          municipio_ibge?: string | null
          nome_municipio?: string | null
          pontos_coleta_por_km2?: number | null
          populacao?: number | null
          taxa_desvio_aterro?: number | null
          uf?: string | null
          volume_coletado_ton?: number | null
          volume_reciclado_ton?: number | null
        }
        Relationships: []
      }
      vw_economia_estado: {
        Row: {
          ano_referencia: number | null
          economia_per_capita_rs: number | null
          economia_total_rs: number | null
          estado_ibge: string | null
          nome_estado: string | null
          populacao: number | null
          uf: string | null
          volume_reciclado_m3: number | null
          volume_reciclado_ton: number | null
        }
        Relationships: []
      }
      vw_indicadores_ana: {
        Row: {
          ano_referencia: number | null
          cobertura_receita_pct: number | null
          cobertura_seletiva_pct: number | null
          custo_por_habitante_rs: number | null
          custo_por_tonelada_rs: number | null
          despesa_total_rs: number | null
          fonte: string | null
          id: string | null
          massa_coletada_ton: number | null
          massa_recuperada_ton: number | null
          municipio_ibge: string | null
          nome_municipio: string | null
          possui_cobranca_especifica: boolean | null
          receita_taxa_rs: number | null
          situacao_sustentabilidade: string | null
          taxa_desvio_aterro_pct: number | null
          taxa_recuperacao_pct: number | null
          uf: string | null
        }
        Insert: {
          ano_referencia?: number | null
          cobertura_receita_pct?: never
          cobertura_seletiva_pct?: never
          custo_por_habitante_rs?: never
          custo_por_tonelada_rs?: never
          despesa_total_rs?: number | null
          fonte?: string | null
          id?: string | null
          massa_coletada_ton?: number | null
          massa_recuperada_ton?: number | null
          municipio_ibge?: string | null
          nome_municipio?: string | null
          possui_cobranca_especifica?: boolean | null
          receita_taxa_rs?: number | null
          situacao_sustentabilidade?: never
          taxa_desvio_aterro_pct?: never
          taxa_recuperacao_pct?: never
          uf?: string | null
        }
        Update: {
          ano_referencia?: number | null
          cobertura_receita_pct?: never
          cobertura_seletiva_pct?: never
          custo_por_habitante_rs?: never
          custo_por_tonelada_rs?: never
          despesa_total_rs?: number | null
          fonte?: string | null
          id?: string | null
          massa_coletada_ton?: number | null
          massa_recuperada_ton?: number | null
          municipio_ibge?: string | null
          nome_municipio?: string | null
          possui_cobranca_especifica?: boolean | null
          receita_taxa_rs?: number | null
          situacao_sustentabilidade?: never
          taxa_desvio_aterro_pct?: never
          taxa_recuperacao_pct?: never
          uf?: string | null
        }
        Relationships: []
      }
      vw_lixoes_correlacao: {
        Row: {
          correlacao_reciclagem_pct: number | null
          economia_estimada_rs: number | null
          lixoes_ativos: number | null
          lixoes_em_encerramento: number | null
          lixoes_encerrados: number | null
          lixoes_recuperados: number | null
          taxa_desvio_aterro_uf: number | null
          taxa_reducao_pct: number | null
          uf: string | null
          volume_estocado_m3_total: number | null
          volume_inicial_m3_total: number | null
          volume_reciclado_ton_uf: number | null
          volume_recuperado_m3_total: number | null
          volume_removido_m3_total: number | null
        }
        Relationships: []
      }
      vw_lixoes_pnrs: {
        Row: {
          catadores_estimados: number | null
          consorcio_publico: boolean | null
          data_ultima_verificacao: string | null
          etapas_concluidas: number | null
          etapas_total: number | null
          faixa_populacional: string | null
          fonte_verificacao: string | null
          id: string | null
          municipio: string | null
          municipio_ibge: string | null
          nome: string | null
          populacao_municipio: number | null
          possui_coleta_seletiva: boolean | null
          possui_plano_municipal: boolean | null
          prazo_legal_pnrs: string | null
          progresso_encerramento_pct: number | null
          situacao_pnrs: string | null
          status: Database["public"]["Enums"]["lixao_status"] | null
          tipo: Database["public"]["Enums"]["lixao_tipo"] | null
          uf: string | null
        }
        Relationships: []
      }
      vw_ranking_estadual: {
        Row: {
          ano_referencia: number | null
          kg_per_capita: number | null
          meta_pnrs_cumprida: boolean | null
          nome_estado: string | null
          populacao: number | null
          posicao_ranking: number | null
          taxa_desvio_aterro: number | null
          uf: string | null
          volume_coletado_ton: number | null
          volume_reciclado_ton: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      fn_operador_licenca_vigente: {
        Args: { _operador_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_mcp_transporte: "http" | "sse" | "stdio"
      ai_modelo_categoria: "free" | "pago" | "treinado"
      ai_status: "ativo" | "inativo" | "manutencao"
      alert_severity: "critical" | "high" | "medium" | "low"
      alert_status: "active" | "acknowledged" | "resolved"
      alerta_geo_status: "active" | "acknowledged" | "resolved"
      alerta_geo_tipo:
        | "desvio_rota"
        | "porta_aberta"
        | "peso_divergente"
        | "parada_nao_autorizada"
      alerta_severidade: "low" | "medium" | "high" | "critical"
      app_role:
        | "gov"
        | "cooperativa"
        | "industria"
        | "ponto_coleta"
        | "super_admin"
      audit_status: "Conforme" | "Não Conforme" | "Pendente" | "Em Análise"
      carga_categoria: "contaminado_perigoso" | "hospitalar" | "quimico"
      carga_status:
        | "planejada"
        | "em_transito"
        | "entregue"
        | "divergente"
        | "cancelada"
      lixao_status: "ativo" | "em_encerramento" | "encerrado" | "recuperado"
      lixao_tipo:
        | "lixao"
        | "aterro_controlado"
        | "aterro_sanitario"
        | "transbordo"
      lote_status: "Coletado" | "Em Processamento" | "Em Trânsito" | "Entregue"
      mtr_fluxo_status:
        | "rascunho"
        | "enviado"
        | "em_analise"
        | "aprovado"
        | "bloqueado"
      porta_status: "fechada" | "aberta"
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
      ai_mcp_transporte: ["http", "sse", "stdio"],
      ai_modelo_categoria: ["free", "pago", "treinado"],
      ai_status: ["ativo", "inativo", "manutencao"],
      alert_severity: ["critical", "high", "medium", "low"],
      alert_status: ["active", "acknowledged", "resolved"],
      alerta_geo_status: ["active", "acknowledged", "resolved"],
      alerta_geo_tipo: [
        "desvio_rota",
        "porta_aberta",
        "peso_divergente",
        "parada_nao_autorizada",
      ],
      alerta_severidade: ["low", "medium", "high", "critical"],
      app_role: [
        "gov",
        "cooperativa",
        "industria",
        "ponto_coleta",
        "super_admin",
      ],
      audit_status: ["Conforme", "Não Conforme", "Pendente", "Em Análise"],
      carga_categoria: ["contaminado_perigoso", "hospitalar", "quimico"],
      carga_status: [
        "planejada",
        "em_transito",
        "entregue",
        "divergente",
        "cancelada",
      ],
      lixao_status: ["ativo", "em_encerramento", "encerrado", "recuperado"],
      lixao_tipo: [
        "lixao",
        "aterro_controlado",
        "aterro_sanitario",
        "transbordo",
      ],
      lote_status: ["Coletado", "Em Processamento", "Em Trânsito", "Entregue"],
      mtr_fluxo_status: [
        "rascunho",
        "enviado",
        "em_analise",
        "aprovado",
        "bloqueado",
      ],
      porta_status: ["fechada", "aberta"],
      transaction_status: ["Concluída", "Em Trânsito", "Pendente", "Auditoria"],
    },
  },
} as const
