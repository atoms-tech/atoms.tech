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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_org_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_org_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_org_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_health: {
        Row: {
          agent_id: string
          consecutive_failures: number | null
          created_at: string | null
          id: string
          last_check: string | null
          last_error: string | null
          metadata: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          last_check?: string | null
          last_error?: string | null
          metadata?: Json | null
          status: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          last_check?: string | null
          last_error?: string | null
          metadata?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_health_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_health_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "v_agent_status"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          name: string | null
          organization_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          name?: string | null
          organization_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          name?: string | null
          organization_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          assignee_id: string
          comment: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          due_date: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_deleted: boolean | null
          role: Database["public"]["Enums"]["assignment_role"]
          status: Database["public"]["Enums"]["requirement_status"]
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          assignee_id: string
          comment?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          due_date?: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_deleted?: boolean | null
          role: Database["public"]["Enums"]["assignment_role"]
          status: Database["public"]["Enums"]["requirement_status"]
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          assignee_id?: string
          comment?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          due_date?: string | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_deleted?: boolean | null
          role?: Database["public"]["Enums"]["assignment_role"]
          status?: Database["public"]["Enums"]["requirement_status"]
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          compliance_category: string | null
          correlation_id: string | null
          created_at: string
          description: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          event_type: Database["public"]["Enums"]["audit_event_type"] | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          project_id: string | null
          resource_id: string | null
          resource_type: Database["public"]["Enums"]["resource_type"] | null
          risk_level: string | null
          session_id: string | null
          severity: Database["public"]["Enums"]["audit_severity"] | null
          soc2_control: string | null
          source_system: string | null
          threat_indicators: string[] | null
          timestamp: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          compliance_category?: string | null
          correlation_id?: string | null
          created_at?: string
          description?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          event_type?: Database["public"]["Enums"]["audit_event_type"] | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          project_id?: string | null
          resource_id?: string | null
          resource_type?: Database["public"]["Enums"]["resource_type"] | null
          risk_level?: string | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["audit_severity"] | null
          soc2_control?: string | null
          source_system?: string | null
          threat_indicators?: string[] | null
          timestamp?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          compliance_category?: string | null
          correlation_id?: string | null
          created_at?: string
          description?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          event_type?: Database["public"]["Enums"]["audit_event_type"] | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          project_id?: string | null
          resource_id?: string | null
          resource_type?: Database["public"]["Enums"]["resource_type"] | null
          risk_level?: string | null
          session_id?: string | null
          severity?: Database["public"]["Enums"]["audit_severity"] | null
          soc2_control?: string | null
          source_system?: string | null
          threat_indicators?: string[] | null
          timestamp?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_audit_logs_organization_id"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_logs_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_audit_logs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_cache: {
        Row: {
          billing_status: Json
          current_period_usage: Json
          organization_id: string
          period_end: string
          period_start: string
          synced_at: string
        }
        Insert: {
          billing_status?: Json
          current_period_usage?: Json
          organization_id: string
          period_end?: string
          period_start?: string
          synced_at?: string
        }
        Update: {
          billing_status?: Json
          current_period_usage?: Json
          organization_id?: string
          period_end?: string
          period_start?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          content: Json | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_id: string
          id: string
          is_deleted: boolean | null
          name: string
          org_id: string | null
          position: number
          type: string
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_id: string
          id?: string
          is_deleted?: boolean | null
          name?: string
          org_id?: string | null
          position: number
          type: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_id?: string
          id?: string
          is_deleted?: boolean | null
          name?: string
          org_id?: string | null
          position?: number
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "blocks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_summary"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "blocks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean
          message_index: number
          metadata: Json | null
          parent_id: string | null
          role: string
          sequence: number
          session_id: string
          tokens_in: number | null
          tokens_out: number | null
          tokens_total: number | null
          updated_at: string | null
          variant_index: number
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          message_index?: number
          metadata?: Json | null
          parent_id?: string | null
          role: string
          sequence?: number
          session_id: string
          tokens_in?: number | null
          tokens_out?: number | null
          tokens_total?: number | null
          updated_at?: string | null
          variant_index?: number
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean
          message_index?: number
          metadata?: Json | null
          parent_id?: string | null
          role?: string
          sequence?: number
          session_id?: string
          tokens_in?: number | null
          tokens_out?: number | null
          tokens_total?: number | null
          updated_at?: string | null
          variant_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_recent_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_parent_session"
            columns: ["parent_id", "session_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id", "session_id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          agent_id: string | null
          agent_type: string | null
          archived: boolean
          created_at: string | null
          id: string
          last_message_at: string | null
          message_count: number
          metadata: Json | null
          model: string | null
          model_id: string | null
          org_id: string | null
          title: string | null
          tokens_in: number
          tokens_out: number
          tokens_total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          agent_type?: string | null
          archived?: boolean
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number
          metadata?: Json | null
          model?: string | null
          model_id?: string | null
          org_id?: string | null
          title?: string | null
          tokens_in?: number
          tokens_out?: number
          tokens_total?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          agent_type?: string | null
          archived?: boolean
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number
          metadata?: Json | null
          model?: string | null
          model_id?: string | null
          org_id?: string | null
          title?: string | null
          tokens_in?: number
          tokens_out?: number
          tokens_total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "v_agent_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      columns: {
        Row: {
          block_id: string | null
          created_at: string | null
          created_by: string | null
          default_value: string | null
          id: string
          is_hidden: boolean | null
          is_pinned: boolean | null
          position: number
          property_id: string
          updated_at: string | null
          updated_by: string | null
          width: number | null
        }
        Insert: {
          block_id?: string | null
          created_at?: string | null
          created_by?: string | null
          default_value?: string | null
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          position: number
          property_id: string
          updated_at?: string | null
          updated_by?: string | null
          width?: number | null
        }
        Update: {
          block_id?: string | null
          created_at?: string | null
          created_by?: string | null
          default_value?: string | null
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          position?: number
          property_id?: string
          updated_at?: string | null
          updated_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "columns_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "columns_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      diagram_element_links: {
        Row: {
          created_at: string | null
          created_by: string | null
          diagram_id: string
          element_id: string
          id: string
          link_type: string | null
          metadata: Json | null
          requirement_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          diagram_id: string
          element_id: string
          id?: string
          link_type?: string | null
          metadata?: Json | null
          requirement_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          diagram_id?: string
          element_id?: string
          id?: string
          link_type?: string | null
          metadata?: Json | null
          requirement_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagram_element_links_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "excalidraw_diagrams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagram_element_links_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          embedding: string | null
          fts_vector: unknown
          id: string
          is_deleted: boolean | null
          name: string
          project_id: string
          slug: string
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          embedding?: string | null
          fts_vector?: unknown
          id?: string
          is_deleted?: boolean | null
          name: string
          project_id: string
          slug: string
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          embedding?: string | null
          fts_vector?: unknown
          id?: string
          is_deleted?: boolean | null
          name?: string
          project_id?: string
          slug?: string
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_cache: {
        Row: {
          access_count: number | null
          accessed_at: string | null
          cache_key: string
          created_at: string | null
          embedding: string | null
          id: string
          model: string
          tokens_used: number
        }
        Insert: {
          access_count?: number | null
          accessed_at?: string | null
          cache_key: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          model?: string
          tokens_used?: number
        }
        Update: {
          access_count?: number | null
          accessed_at?: string | null
          cache_key?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          model?: string
          tokens_used?: number
        }
        Relationships: []
      }
      excalidraw_diagrams: {
        Row: {
          created_at: string | null
          created_by: string | null
          diagram_data: Json | null
          id: string
          name: string | null
          organization_id: string | null
          project_id: string | null
          thumbnail_url: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          diagram_data?: Json | null
          id?: string
          name?: string | null
          organization_id?: string | null
          project_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          diagram_data?: Json | null
          id?: string
          name?: string | null
          organization_id?: string | null
          project_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      excalidraw_element_links: {
        Row: {
          create_by: string | null
          created_at: string
          element_id: string | null
          excalidraw_canvas_id: string | null
          id: string
          requirement_id: string | null
        }
        Insert: {
          create_by?: string | null
          created_at?: string
          element_id?: string | null
          excalidraw_canvas_id?: string | null
          id?: string
          requirement_id?: string | null
        }
        Update: {
          create_by?: string | null
          created_at?: string
          element_id?: string | null
          excalidraw_canvas_id?: string | null
          id?: string
          requirement_id?: string | null
        }
        Relationships: []
      }
      external_documents: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          gumloop_name: string | null
          id: string
          is_deleted: boolean | null
          name: string
          organization_id: string
          owned_by: string | null
          size: number | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gumloop_name?: string | null
          id?: string
          is_deleted?: boolean | null
          name: string
          organization_id: string
          owned_by?: string | null
          size?: number | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          gumloop_name?: string | null
          id?: string
          is_deleted?: boolean | null
          name?: string
          organization_id?: string
          owned_by?: string | null
          size?: number | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          url?: string | null
        }
        Relationships: []
      }
      mcp_audit_log: {
        Row: {
          action: string
          details: string | null
          id: number
          ip_address: string | null
          org_id: string
          resource_id: string | null
          resource_type: string
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          details?: string | null
          id?: number
          ip_address?: string | null
          org_id: string
          resource_id?: string | null
          resource_type: string
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          details?: string | null
          id?: number
          ip_address?: string | null
          org_id?: string
          resource_id?: string | null
          resource_type?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mcp_configurations: {
        Row: {
          args: string | null
          auth_header: string | null
          auth_token: string | null
          auth_type: string
          command: string | null
          config: string | null
          created_at: string
          created_by: string
          description: string | null
          enabled: boolean
          endpoint: string | null
          id: string
          name: string
          org_id: string | null
          scope: string
          type: string
          updated_at: string
          updated_by: string
          user_id: string | null
        }
        Insert: {
          args?: string | null
          auth_header?: string | null
          auth_token?: string | null
          auth_type: string
          command?: string | null
          config?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          enabled?: boolean
          endpoint?: string | null
          id?: string
          name: string
          org_id?: string | null
          scope: string
          type: string
          updated_at?: string
          updated_by: string
          user_id?: string | null
        }
        Update: {
          args?: string | null
          auth_header?: string | null
          auth_token?: string | null
          auth_type?: string
          command?: string | null
          config?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          enabled?: boolean
          endpoint?: string | null
          id?: string
          name?: string
          org_id?: string | null
          scope?: string
          type?: string
          updated_at?: string
          updated_by?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mcp_oauth_tokens: {
        Row: {
          access_token: string | null
          expires_at: string | null
          id: string
          issued_at: string
          mcp_namespace: string
          organization_id: string | null
          provider_key: string
          refresh_token: string | null
          scope: string | null
          token_type: string | null
          transaction_id: string
          upstream_response: Json | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          mcp_namespace: string
          organization_id?: string | null
          provider_key: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          transaction_id: string
          upstream_response?: Json | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          mcp_namespace?: string
          organization_id?: string | null
          provider_key?: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          transaction_id?: string
          upstream_response?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcp_oauth_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_oauth_tokens_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "mcp_oauth_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_oauth_transactions: {
        Row: {
          authorization_url: string | null
          code_challenge: string | null
          code_verifier: string | null
          completed_at: string | null
          created_at: string
          error: Json | null
          id: string
          mcp_namespace: string
          organization_id: string | null
          provider_key: string
          scopes: string[] | null
          state: string | null
          status: string
          updated_at: string
          upstream_metadata: Json | null
          user_id: string | null
        }
        Insert: {
          authorization_url?: string | null
          code_challenge?: string | null
          code_verifier?: string | null
          completed_at?: string | null
          created_at?: string
          error?: Json | null
          id?: string
          mcp_namespace: string
          organization_id?: string | null
          provider_key: string
          scopes?: string[] | null
          state?: string | null
          status: string
          updated_at?: string
          upstream_metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          authorization_url?: string | null
          code_challenge?: string | null
          code_verifier?: string | null
          completed_at?: string | null
          created_at?: string
          error?: Json | null
          id?: string
          mcp_namespace?: string
          organization_id?: string | null
          provider_key?: string
          scopes?: string[] | null
          state?: string | null
          status?: string
          updated_at?: string
          upstream_metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcp_oauth_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_profiles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          servers: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          servers?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          servers?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mcp_proxy_configs: {
        Row: {
          auth_config: Json
          auth_type: string
          created_at: string
          created_by: string
          error_count: number | null
          health_error: string | null
          health_status: string | null
          id: string
          last_error: string | null
          last_error_at: string | null
          last_health_check: string | null
          last_used_at: string | null
          organization_id: string | null
          proxy_status: string | null
          proxy_url: string | null
          request_count: number | null
          server_name: string
          server_url: string
          updated_at: string
        }
        Insert: {
          auth_config?: Json
          auth_type: string
          created_at?: string
          created_by: string
          error_count?: number | null
          health_error?: string | null
          health_status?: string | null
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          last_health_check?: string | null
          last_used_at?: string | null
          organization_id?: string | null
          proxy_status?: string | null
          proxy_url?: string | null
          request_count?: number | null
          server_name: string
          server_url: string
          updated_at?: string
        }
        Update: {
          auth_config?: Json
          auth_type?: string
          created_at?: string
          created_by?: string
          error_count?: number | null
          health_error?: string | null
          health_status?: string | null
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          last_health_check?: string | null
          last_used_at?: string | null
          organization_id?: string | null
          proxy_status?: string | null
          proxy_url?: string | null
          request_count?: number | null
          server_name?: string
          server_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_proxy_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_registry_sync_status: {
        Row: {
          created_at: string
          error_details: Json | null
          error_message: string | null
          id: string
          servers_added: number | null
          servers_failed: number | null
          servers_removed: number | null
          servers_updated: number | null
          sync_completed_at: string | null
          sync_started_at: string
          sync_status: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          servers_added?: number | null
          servers_failed?: number | null
          servers_removed?: number | null
          servers_updated?: number | null
          sync_completed_at?: string | null
          sync_started_at: string
          sync_status: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          servers_added?: number | null
          servers_failed?: number | null
          servers_removed?: number | null
          servers_updated?: number | null
          sync_completed_at?: string | null
          sync_started_at?: string
          sync_status?: string
        }
        Relationships: []
      }
      mcp_server_security_reviews: {
        Row: {
          auth_review_notes: string | null
          auth_review_passed: boolean | null
          code_review_notes: string | null
          code_review_passed: boolean | null
          created_at: string
          dependency_review_notes: string | null
          dependency_review_passed: boolean | null
          expires_at: string | null
          id: string
          license_review_notes: string | null
          license_review_passed: boolean | null
          network_review_notes: string | null
          network_review_passed: boolean | null
          notes: string | null
          recommendations: string | null
          review_date: string
          reviewed_by: string
          reviewer_email: string | null
          risk_level: string | null
          security_scan_notes: string | null
          security_scan_passed: boolean | null
          security_scan_results: Json | null
          server_id: string
          status: string
          updated_at: string
        }
        Insert: {
          auth_review_notes?: string | null
          auth_review_passed?: boolean | null
          code_review_notes?: string | null
          code_review_passed?: boolean | null
          created_at?: string
          dependency_review_notes?: string | null
          dependency_review_passed?: boolean | null
          expires_at?: string | null
          id?: string
          license_review_notes?: string | null
          license_review_passed?: boolean | null
          network_review_notes?: string | null
          network_review_passed?: boolean | null
          notes?: string | null
          recommendations?: string | null
          review_date?: string
          reviewed_by: string
          reviewer_email?: string | null
          risk_level?: string | null
          security_scan_notes?: string | null
          security_scan_passed?: boolean | null
          security_scan_results?: Json | null
          server_id: string
          status: string
          updated_at?: string
        }
        Update: {
          auth_review_notes?: string | null
          auth_review_passed?: boolean | null
          code_review_notes?: string | null
          code_review_passed?: boolean | null
          created_at?: string
          dependency_review_notes?: string | null
          dependency_review_passed?: boolean | null
          expires_at?: string | null
          id?: string
          license_review_notes?: string | null
          license_review_passed?: boolean | null
          network_review_notes?: string | null
          network_review_passed?: boolean | null
          notes?: string | null
          recommendations?: string | null
          review_date?: string
          reviewed_by?: string
          reviewer_email?: string | null
          risk_level?: string | null
          security_scan_notes?: string | null
          security_scan_passed?: boolean | null
          security_scan_results?: Json | null
          server_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_server_security_reviews_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_server_usage_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          request_params: Json | null
          server_id: string
          success: boolean
          tool_name: string | null
          user_agent: string | null
          user_id: string
          user_server_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          request_params?: Json | null
          server_id: string
          success: boolean
          tool_name?: string | null
          user_agent?: string | null
          user_id: string
          user_server_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          request_params?: Json | null
          server_id?: string
          success?: boolean
          tool_name?: string | null
          user_agent?: string | null
          user_id?: string
          user_server_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcp_server_usage_logs_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcp_server_usage_logs_user_server_id_fkey"
            columns: ["user_server_id"]
            isOneToOne: false
            referencedRelation: "user_mcp_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_servers: {
        Row: {
          active_users: number | null
          auth_config: Json | null
          auth_type: string
          category: string | null
          created_at: string
          created_by: string | null
          deprecated: boolean | null
          deprecation_date: string | null
          deprecation_reason: string | null
          description: string | null
          documentation_url: string | null
          downloads: number | null
          enabled: boolean | null
          env: Json | null
          health_status: string | null
          homepage_url: string | null
          id: string
          install_count: number | null
          last_health_check: string | null
          last_synced_at: string | null
          last_updated_at: string | null
          license: string | null
          metadata: Json | null
          name: string
          namespace: string
          organization_id: string | null
          project_id: string | null
          publisher_namespace: string | null
          publisher_type: string | null
          publisher_verified: boolean | null
          repository_url: string | null
          scope: string | null
          security_notes: string | null
          security_review_date: string | null
          security_review_expires_at: string | null
          security_review_status: string | null
          security_reviewed_by: string | null
          source: string
          stars: number | null
          sync_source: string | null
          tags: string[] | null
          tier: string
          transport: string
          transport_config: Json | null
          transport_type: string | null
          updated_at: string
          url: string
          user_id: string | null
          version: string
        }
        Insert: {
          active_users?: number | null
          auth_config?: Json | null
          auth_type: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          deprecated?: boolean | null
          deprecation_date?: string | null
          deprecation_reason?: string | null
          description?: string | null
          documentation_url?: string | null
          downloads?: number | null
          enabled?: boolean | null
          env?: Json | null
          health_status?: string | null
          homepage_url?: string | null
          id?: string
          install_count?: number | null
          last_health_check?: string | null
          last_synced_at?: string | null
          last_updated_at?: string | null
          license?: string | null
          metadata?: Json | null
          name: string
          namespace: string
          organization_id?: string | null
          project_id?: string | null
          publisher_namespace?: string | null
          publisher_type?: string | null
          publisher_verified?: boolean | null
          repository_url?: string | null
          scope?: string | null
          security_notes?: string | null
          security_review_date?: string | null
          security_review_expires_at?: string | null
          security_review_status?: string | null
          security_reviewed_by?: string | null
          source: string
          stars?: number | null
          sync_source?: string | null
          tags?: string[] | null
          tier?: string
          transport: string
          transport_config?: Json | null
          transport_type?: string | null
          updated_at?: string
          url: string
          user_id?: string | null
          version?: string
        }
        Update: {
          active_users?: number | null
          auth_config?: Json | null
          auth_type?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          deprecated?: boolean | null
          deprecation_date?: string | null
          deprecation_reason?: string | null
          description?: string | null
          documentation_url?: string | null
          downloads?: number | null
          enabled?: boolean | null
          env?: Json | null
          health_status?: string | null
          homepage_url?: string | null
          id?: string
          install_count?: number | null
          last_health_check?: string | null
          last_synced_at?: string | null
          last_updated_at?: string | null
          license?: string | null
          metadata?: Json | null
          name?: string
          namespace?: string
          organization_id?: string | null
          project_id?: string | null
          publisher_namespace?: string | null
          publisher_type?: string | null
          publisher_verified?: boolean | null
          repository_url?: string | null
          scope?: string | null
          security_notes?: string | null
          security_review_date?: string | null
          security_review_expires_at?: string | null
          security_review_status?: string | null
          security_reviewed_by?: string | null
          source?: string
          stars?: number | null
          sync_source?: string | null
          tags?: string[] | null
          tier?: string
          transport?: string
          transport_config?: Json | null
          transport_type?: string | null
          updated_at?: string
          url?: string
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      mcp_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          mcp_state: Json | null
          oauth_data: Json
          session_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          mcp_state?: Json | null
          oauth_data: Json
          session_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          mcp_state?: Json | null
          oauth_data?: Json
          session_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      models: {
        Row: {
          agent_id: string
          config: Json | null
          created_at: string | null
          description: string | null
          display_name: string | null
          enabled: boolean | null
          id: string
          model_id: string | null
          name: string
          provider: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          enabled?: boolean | null
          id?: string
          model_id?: string | null
          name: string
          provider?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          enabled?: boolean | null
          id?: string
          model_id?: string | null
          name?: string
          provider?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "v_agent_status"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          unread: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          unread?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          unread?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      organization_invitations: {
        Row: {
          created_at: string | null
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          email: string
          expires_at: string
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          organization_id: string
          role: Database["public"]["Enums"]["user_role_type"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          expires_at?: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          organization_id: string
          role?: Database["public"]["Enums"]["user_role_type"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role_type"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          last_active_at: string | null
          organization_id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role_type"]
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          last_active_at?: string | null
          organization_id: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role_type"]
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          last_active_at?: string | null
          organization_id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role_type"]
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_cycle: Database["public"]["Enums"]["pricing_plan_interval"]
          billing_plan: Database["public"]["Enums"]["billing_plan"]
          created_at: string | null
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          embedding: string | null
          fts_vector: unknown
          id: string
          is_deleted: boolean | null
          logo_url: string | null
          max_members: number
          max_monthly_requests: number
          member_count: number | null
          metadata: Json | null
          name: string
          owner_id: string | null
          settings: Json | null
          slug: string
          status: Database["public"]["Enums"]["user_status"] | null
          storage_used: number | null
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          billing_cycle?: Database["public"]["Enums"]["pricing_plan_interval"]
          billing_plan?: Database["public"]["Enums"]["billing_plan"]
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          embedding?: string | null
          fts_vector?: unknown
          id?: string
          is_deleted?: boolean | null
          logo_url?: string | null
          max_members?: number
          max_monthly_requests?: number
          member_count?: number | null
          metadata?: Json | null
          name: string
          owner_id?: string | null
          settings?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["user_status"] | null
          storage_used?: number | null
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          billing_cycle?: Database["public"]["Enums"]["pricing_plan_interval"]
          billing_plan?: Database["public"]["Enums"]["billing_plan"]
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          embedding?: string | null
          fts_vector?: unknown
          id?: string
          is_deleted?: boolean | null
          logo_url?: string | null
          max_members?: number
          max_monthly_requests?: number
          member_count?: number | null
          metadata?: Json | null
          name?: string
          owner_id?: string | null
          settings?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["user_status"] | null
          storage_used?: number | null
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          added_at: string | null
          added_by: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          updated_at: string | null
          workos_user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
          workos_user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
          workos_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_organization_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string
          full_name: string | null
          id: string
          is_approved: boolean
          is_deleted: boolean | null
          job_title: string | null
          last_login_at: string | null
          login_count: number | null
          personal_organization_id: string | null
          pinned_organization_id: string | null
          preferences: Json | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
          workos_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_organization_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          full_name?: string | null
          id: string
          is_approved?: boolean
          is_deleted?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          login_count?: number | null
          personal_organization_id?: string | null
          pinned_organization_id?: string | null
          preferences?: Json | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          workos_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_organization_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          is_deleted?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          login_count?: number | null
          personal_organization_id?: string | null
          pinned_organization_id?: string | null
          preferences?: Json | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          workos_id?: string | null
        }
        Relationships: []
      }
      project_invitations: {
        Row: {
          created_at: string | null
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          email: string
          expires_at: string
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          expires_at?: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          project_id: string
          role?: Database["public"]["Enums"]["project_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          last_accessed_at: string | null
          org_id: string | null
          permissions: Json | null
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          last_accessed_at?: string | null
          org_id?: string | null
          permissions?: Json | null
          project_id: string
          role?: Database["public"]["Enums"]["project_role"]
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          last_accessed_at?: string | null
          org_id?: string | null
          permissions?: Json | null
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          embedding: string | null
          fts_vector: unknown
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          name: string
          organization_id: string
          owned_by: string
          settings: Json | null
          slug: string
          star_count: number | null
          status: Database["public"]["Enums"]["project_status"]
          tags: string[] | null
          updated_at: string | null
          updated_by: string
          version: number | null
          visibility: Database["public"]["Enums"]["visibility"]
        }
        Insert: {
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          embedding?: string | null
          fts_vector?: unknown
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          name: string
          organization_id: string
          owned_by: string
          settings?: Json | null
          slug: string
          star_count?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[] | null
          updated_at?: string | null
          updated_by: string
          version?: number | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Update: {
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          embedding?: string | null
          fts_vector?: unknown
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          owned_by?: string
          settings?: Json | null
          slug?: string
          star_count?: number | null
          status?: Database["public"]["Enums"]["project_status"]
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string
          version?: number | null
          visibility?: Database["public"]["Enums"]["visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_id: string | null
          id: string
          is_base: boolean | null
          is_deleted: boolean
          name: string
          options: Json | null
          org_id: string
          project_id: string | null
          property_type: string
          scope: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_id?: string | null
          id?: string
          is_base?: boolean | null
          is_deleted?: boolean
          name: string
          options?: Json | null
          org_id: string
          project_id?: string | null
          property_type: string
          scope?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_id?: string | null
          id?: string
          is_base?: boolean | null
          is_deleted?: boolean
          name?: string
          options?: Json | null
          org_id?: string
          project_id?: string | null
          property_type?: string
          scope?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_summary"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "properties_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rag_embeddings: {
        Row: {
          content_hash: string | null
          created_at: string | null
          embedding: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          quality_score: number | null
        }
        Insert: {
          content_hash?: string | null
          created_at?: string | null
          embedding: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          quality_score?: number | null
        }
        Update: {
          content_hash?: string | null
          created_at?: string | null
          embedding?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          quality_score?: number | null
        }
        Relationships: []
      }
      rag_search_analytics: {
        Row: {
          cache_hit: boolean
          created_at: string | null
          execution_time_ms: number
          id: string
          organization_id: string | null
          query_hash: string
          query_text: string
          result_count: number
          search_type: string
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean
          created_at?: string | null
          execution_time_ms: number
          id?: string
          organization_id?: string | null
          query_hash: string
          query_text: string
          result_count: number
          search_type: string
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean
          created_at?: string | null
          execution_time_ms?: number
          id?: string
          organization_id?: string | null
          query_hash?: string
          query_text?: string
          result_count?: number
          search_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      react_flow_diagrams: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          diagram_type: string | null
          edges: Json
          id: string
          layout_algorithm: string | null
          metadata: Json | null
          name: string
          nodes: Json
          project_id: string
          settings: Json | null
          theme: string | null
          updated_at: string | null
          updated_by: string | null
          viewport: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          diagram_type?: string | null
          edges?: Json
          id?: string
          layout_algorithm?: string | null
          metadata?: Json | null
          name?: string
          nodes?: Json
          project_id: string
          settings?: Json | null
          theme?: string | null
          updated_at?: string | null
          updated_by?: string | null
          viewport?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          diagram_type?: string | null
          edges?: Json
          id?: string
          layout_algorithm?: string | null
          metadata?: Json | null
          name?: string
          nodes?: Json
          project_id?: string
          settings?: Json | null
          theme?: string | null
          updated_at?: string | null
          updated_by?: string | null
          viewport?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "react_flow_diagrams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_tests: {
        Row: {
          created_at: string | null
          defects: Json | null
          evidence_artifacts: Json | null
          executed_at: string | null
          executed_by: string | null
          execution_environment: string | null
          execution_status: Database["public"]["Enums"]["execution_status"]
          execution_version: string | null
          external_req_id: string | null
          external_test_id: string | null
          id: string
          requirement_id: string
          result_notes: string | null
          test_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          defects?: Json | null
          evidence_artifacts?: Json | null
          executed_at?: string | null
          executed_by?: string | null
          execution_environment?: string | null
          execution_status?: Database["public"]["Enums"]["execution_status"]
          execution_version?: string | null
          external_req_id?: string | null
          external_test_id?: string | null
          id?: string
          requirement_id: string
          result_notes?: string | null
          test_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          defects?: Json | null
          evidence_artifacts?: Json | null
          executed_at?: string | null
          executed_by?: string | null
          execution_environment?: string | null
          execution_status?: Database["public"]["Enums"]["execution_status"]
          execution_version?: string | null
          external_req_id?: string | null
          external_test_id?: string | null
          id?: string
          requirement_id?: string
          result_notes?: string | null
          test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirement_tests_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirement_tests_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "test_req"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          ai_analysis: Json | null
          block_id: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          document_id: string
          embedding: string | null
          enchanced_requirement: string | null
          external_id: string | null
          format: Database["public"]["Enums"]["requirement_format"]
          fts_vector: unknown
          id: string
          is_deleted: boolean | null
          level: Database["public"]["Enums"]["requirement_level"]
          name: string
          original_requirement: string | null
          position: number
          priority: Database["public"]["Enums"]["requirement_priority"]
          properties: Json | null
          status: Database["public"]["Enums"]["requirement_status"]
          tags: string[] | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          ai_analysis?: Json | null
          block_id: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          document_id: string
          embedding?: string | null
          enchanced_requirement?: string | null
          external_id?: string | null
          format?: Database["public"]["Enums"]["requirement_format"]
          fts_vector?: unknown
          id?: string
          is_deleted?: boolean | null
          level?: Database["public"]["Enums"]["requirement_level"]
          name: string
          original_requirement?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["requirement_priority"]
          properties?: Json | null
          status?: Database["public"]["Enums"]["requirement_status"]
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          ai_analysis?: Json | null
          block_id?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          document_id?: string
          embedding?: string | null
          enchanced_requirement?: string | null
          external_id?: string | null
          format?: Database["public"]["Enums"]["requirement_format"]
          fts_vector?: unknown
          id?: string
          is_deleted?: boolean | null
          level?: Database["public"]["Enums"]["requirement_level"]
          name?: string
          original_requirement?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["requirement_priority"]
          properties?: Json | null
          status?: Database["public"]["Enums"]["requirement_status"]
          tags?: string[] | null
          type?: string | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "requirements_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_summary"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "requirements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements_closure: {
        Row: {
          ancestor_id: string
          created_at: string
          created_by: string
          depth: number
          descendant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ancestor_id: string
          created_at?: string
          created_by: string
          depth: number
          descendant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ancestor_id?: string
          created_at?: string
          created_by?: string
          depth?: number
          descendant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requirements_closure_ancestor_id_fkey"
            columns: ["ancestor_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_closure_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_closure_descendant_id_fkey"
            columns: ["descendant_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_closure_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          denial_reason: string | null
          denied_at: string | null
          denied_by: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          denial_reason?: string | null
          denied_at?: string | null
          denied_by?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          denial_reason?: string | null
          denied_at?: string | null
          denied_by?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string | null
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_prompts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          enabled: boolean
          id: string
          is_default: boolean | null
          is_public: boolean | null
          name: string
          organization_id: string | null
          priority: number
          scope: string
          tags: string[] | null
          template: string | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          name: string
          organization_id?: string | null
          priority?: number
          scope: string
          tags?: string[] | null
          template?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          enabled?: boolean
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          name?: string
          organization_id?: string | null
          priority?: number
          scope?: string
          tags?: string[] | null
          template?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      table_rows: {
        Row: {
          block_id: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          document_id: string
          id: string
          is_deleted: boolean | null
          position: number
          row_data: Json | null
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          block_id: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_id: string
          id?: string
          is_deleted?: boolean | null
          position?: number
          row_data?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          block_id?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          document_id?: string
          id?: string
          is_deleted?: boolean | null
          position?: number
          row_data?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "table_rows_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_rows_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_summary"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "table_rows_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      test_matrix_views: {
        Row: {
          configuration: Json
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          project_id: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          configuration?: Json
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          project_id: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          project_id?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_matrix_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_req: {
        Row: {
          attachments: Json | null
          category: string[] | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          estimated_duration: unknown
          expected_results: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean
          method: Database["public"]["Enums"]["test_method"]
          preconditions: string | null
          priority: Database["public"]["Enums"]["test_priority"]
          project_id: string | null
          result: string | null
          status: Database["public"]["Enums"]["test_status"]
          test_environment: string | null
          test_id: string | null
          test_steps: Json | null
          test_type: Database["public"]["Enums"]["test_type"]
          title: string
          updated_at: string | null
          updated_by: string | null
          version: string | null
        }
        Insert: {
          attachments?: Json | null
          category?: string[] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          estimated_duration?: unknown
          expected_results?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean
          method?: Database["public"]["Enums"]["test_method"]
          preconditions?: string | null
          priority?: Database["public"]["Enums"]["test_priority"]
          project_id?: string | null
          result?: string | null
          status?: Database["public"]["Enums"]["test_status"]
          test_environment?: string | null
          test_id?: string | null
          test_steps?: Json | null
          test_type?: Database["public"]["Enums"]["test_type"]
          title: string
          updated_at?: string | null
          updated_by?: string | null
          version?: string | null
        }
        Update: {
          attachments?: Json | null
          category?: string[] | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          estimated_duration?: unknown
          expected_results?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean
          method?: Database["public"]["Enums"]["test_method"]
          preconditions?: string | null
          priority?: Database["public"]["Enums"]["test_priority"]
          project_id?: string | null
          result?: string | null
          status?: Database["public"]["Enums"]["test_status"]
          test_environment?: string | null
          test_id?: string | null
          test_steps?: Json | null
          test_type?: Database["public"]["Enums"]["test_type"]
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_req_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_req_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      trace_links: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          is_deleted: boolean | null
          link_type: Database["public"]["Enums"]["trace_link_type"]
          source_id: string
          source_type: Database["public"]["Enums"]["entity_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["entity_type"]
          updated_at: string | null
          updated_by: string | null
          version: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          link_type: Database["public"]["Enums"]["trace_link_type"]
          source_id: string
          source_type: Database["public"]["Enums"]["entity_type"]
          target_id: string
          target_type: Database["public"]["Enums"]["entity_type"]
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_deleted?: boolean | null
          link_type?: Database["public"]["Enums"]["trace_link_type"]
          source_id?: string
          source_type?: Database["public"]["Enums"]["entity_type"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string | null
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          created_at: string | null
          feature: string
          id: string
          metadata: Json | null
          organization_id: string
          quantity: number
          unit_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature: string
          id?: string
          metadata?: Json | null
          organization_id: string
          quantity: number
          unit_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          quantity?: number
          unit_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mcp_servers: {
        Row: {
          auth_token_encrypted: string | null
          custom_config: Json | null
          enabled: boolean | null
          error_count: number | null
          id: string
          installed_at: string
          last_error: string | null
          last_error_at: string | null
          last_used_at: string | null
          oauth_tokens_encrypted: string | null
          organization_id: string | null
          server_id: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          auth_token_encrypted?: string | null
          custom_config?: Json | null
          enabled?: boolean | null
          error_count?: number | null
          id?: string
          installed_at?: string
          last_error?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          oauth_tokens_encrypted?: string | null
          organization_id?: string | null
          server_id: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          auth_token_encrypted?: string | null
          custom_config?: Json | null
          enabled?: boolean | null
          error_count?: number | null
          id?: string
          installed_at?: string
          last_error?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          oauth_tokens_encrypted?: string | null
          organization_id?: string | null
          server_id?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mcp_servers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mcp_servers_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "mcp_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          admin_role: Database["public"]["Enums"]["user_role_type"] | null
          created_at: string
          document_id: string | null
          document_role: Database["public"]["Enums"]["project_role"] | null
          id: string
          org_id: string | null
          project_id: string | null
          project_role: Database["public"]["Enums"]["project_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_role?: Database["public"]["Enums"]["user_role_type"] | null
          created_at?: string
          document_id?: string | null
          document_role?: Database["public"]["Enums"]["project_role"] | null
          id?: string
          org_id?: string | null
          project_id?: string | null
          project_role?: Database["public"]["Enums"]["project_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["user_role_type"] | null
          created_at?: string
          document_id?: string | null
          document_role?: Database["public"]["Enums"]["project_role"] | null
          id?: string
          org_id?: string | null
          project_id?: string | null
          project_role?: Database["public"]["Enums"]["project_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_summary"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "user_roles_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      diagram_element_links_with_details: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_avatar: string | null
          created_by_name: string | null
          diagram_id: string | null
          diagram_name: string | null
          element_id: string | null
          id: string | null
          link_type: string | null
          metadata: Json | null
          requirement_description: string | null
          requirement_id: string | null
          requirement_name: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagram_element_links_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "excalidraw_diagrams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagram_element_links_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      document_summary: {
        Row: {
          block_count: number | null
          document_id: string | null
          document_name: string | null
          project_id: string | null
          requirement_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pg_all_foreign_keys: {
        Row: {
          fk_columns: unknown[] | null
          fk_constraint_name: unknown
          fk_schema_name: unknown
          fk_table_name: unknown
          fk_table_oid: unknown
          is_deferrable: boolean | null
          is_deferred: boolean | null
          match_type: string | null
          on_delete: string | null
          on_update: string | null
          pk_columns: unknown[] | null
          pk_constraint_name: unknown
          pk_index_name: unknown
          pk_schema_name: unknown
          pk_table_name: unknown
          pk_table_oid: unknown
        }
        Relationships: []
      }
      tap_funky: {
        Row: {
          args: string | null
          is_definer: boolean | null
          is_strict: boolean | null
          is_visible: boolean | null
          kind: unknown
          langoid: unknown
          name: unknown
          oid: unknown
          owner: unknown
          returns: string | null
          returns_set: boolean | null
          schema: unknown
          volatility: string | null
        }
        Relationships: []
      }
      v_agent_status: {
        Row: {
          consecutive_failures: number | null
          enabled: boolean | null
          health_status: string | null
          id: string | null
          last_check: string | null
          model_count: number | null
          name: string | null
          type: string | null
        }
        Relationships: []
      }
      v_recent_sessions: {
        Row: {
          agent_name: string | null
          created_at: string | null
          id: string | null
          last_message_at: string | null
          message_count: number | null
          model_name: string | null
          org_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _cleanup: { Args: never; Returns: boolean }
      _contract_on: { Args: { "": string }; Returns: unknown }
      _currtest: { Args: never; Returns: number }
      _db_privs: { Args: never; Returns: unknown[] }
      _extensions: { Args: never; Returns: unknown[] }
      _get: { Args: { "": string }; Returns: number }
      _get_latest: { Args: { "": string }; Returns: number[] }
      _get_note: { Args: { "": string }; Returns: string }
      _is_verbose: { Args: never; Returns: boolean }
      _prokind: { Args: { p_oid: unknown }; Returns: unknown }
      _query: { Args: { "": string }; Returns: string }
      _refine_vol: { Args: { "": string }; Returns: string }
      _table_privs: { Args: never; Returns: unknown[] }
      _temptypes: { Args: { "": string }; Returns: string }
      _todo: { Args: never; Returns: string }
      accept_invitation: {
        Args: { invitation_token: string }
        Returns: boolean
      }
      can_use_resource: {
        Args: { org_id: string; quantity: number; resource_type: string }
        Returns: boolean
      }
      check_requirement_cycle: {
        Args: { p_ancestor_id: string; p_descendant_id: string }
        Returns: boolean
      }
      cleanup_expired_oauth_tokens: { Args: never; Returns: undefined }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      col_is_null:
        | {
            Args: {
              column_name: unknown
              description?: string
              table_name: unknown
            }
            Returns: string
          }
        | {
            Args: {
              column_name: unknown
              description?: string
              schema_name: unknown
              table_name: unknown
            }
            Returns: string
          }
      col_not_null:
        | {
            Args: {
              column_name: unknown
              description?: string
              table_name: unknown
            }
            Returns: string
          }
        | {
            Args: {
              column_name: unknown
              description?: string
              schema_name: unknown
              table_name: unknown
            }
            Returns: string
          }
      create_columns_for_table_block: {
        Args: { block_id: string; p_org_id: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          message?: string
          metadata?: Json
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Returns: string
      }
      create_personal_organization: {
        Args: { name: string; user_id: string }
        Returns: string
      }
      create_requirement_relationship: {
        Args: {
          p_ancestor_id: string
          p_created_by: string
          p_descendant_id: string
        }
        Returns: {
          error_code: string
          message: string
          relationships_created: number
          success: boolean
        }[]
      }
      debug_closure_state: {
        Args: never
        Returns: {
          ancestor_id: string
          ancestor_name: string
          depth: number
          descendant_id: string
          descendant_name: string
          relationship_type: string
        }[]
      }
      debug_delete_logic_step_by_step: {
        Args: { p_ancestor_id: string; p_descendant_id: string }
        Returns: {
          details: string
          result_count: number
          step_name: string
        }[]
      }
      debug_deletion_preview: {
        Args: { p_ancestor_id: string; p_descendant_id: string }
        Returns: {
          deletion_reason: string
          path_from_descendant_id: string
          path_to_ancestor_id: string
          will_delete_ancestor_name: string
          will_delete_depth: number
          will_delete_descendant_name: string
        }[]
      }
      delete_requirement_relationship: {
        Args: {
          p_ancestor_id: string
          p_descendant_id: string
          p_updated_by: string
        }
        Returns: {
          error_code: string
          message: string
          relationships_deleted: number
          success: boolean
        }[]
      }
      delete_requirement_relationship_safe: {
        Args: {
          p_ancestor_id: string
          p_descendant_id: string
          p_updated_by: string
        }
        Returns: {
          debug_info: Json
          error_code: string
          message: string
          relationships_deleted: number
          success: boolean
        }[]
      }
      diag:
        | {
            Args: { msg: unknown }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { msg: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      diag_test_name: { Args: { "": string }; Returns: string }
      do_tap:
        | { Args: { "": string }; Returns: string[] }
        | { Args: never; Returns: string[] }
      fail:
        | { Args: never; Returns: string }
        | { Args: { "": string }; Returns: string }
      findfuncs: { Args: { "": string }; Returns: string[] }
      finish: { Args: { exception_on_failure?: boolean }; Returns: string[] }
      generate_slug: { Args: { name: string }; Returns: string }
      get_active_session: {
        Args: { p_session_id: string }
        Returns: {
          created_at: string
          expires_at: string
          mcp_state: Json
          oauth_data: Json
          session_id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_merged_system_prompt: {
        Args: { p_organization_id?: string; p_user_id: string }
        Returns: {
          merged_content: string
          organization_content: string
          organization_prompt_id: string
          system_content: string
          system_prompt_id: string
          user_content: string
          user_prompt_id: string
        }[]
      }
      get_organization_usage: {
        Args: { end_date?: string; org_id: string; start_date?: string }
        Returns: Json
      }
      get_requirement_ancestors: {
        Args: { p_descendant_id: string; p_max_depth?: number }
        Returns: {
          depth: number
          direct_parent: boolean
          requirement_id: string
          title: string
        }[]
      }
      get_requirement_descendants: {
        Args: { p_ancestor_id: string; p_max_depth?: number }
        Returns: {
          depth: number
          direct_parent: boolean
          requirement_id: string
          title: string
        }[]
      }
      get_requirement_tree: {
        Args: { p_project_id?: string }
        Returns: {
          depth: number
          has_children: boolean
          parent_id: string
          path: string
          requirement_id: string
          title: string
        }[]
      }
      get_user_organization_ids:
        | {
            Args: { p_user_id: string }
            Returns: {
              organization_id: string
            }[]
          }
        | {
            Args: { user_workos_id: string }
            Returns: {
              organization_id: string
            }[]
          }
      get_user_organizations: {
        Args: { include_inactive?: boolean; user_id: string }
        Returns: {
          billing_plan: Database["public"]["Enums"]["billing_plan"]
          id: string
          is_personal: boolean
          member_count: number
          name: string
          role: Database["public"]["Enums"]["user_role_type"]
          slug: string
          status: Database["public"]["Enums"]["user_status"]
          type: Database["public"]["Enums"]["organization_type"]
        }[]
      }
      handle_entity_update: { Args: never; Returns: undefined }
      has_project_access: {
        Args: {
          project_id: string
          required_role?: Database["public"]["Enums"]["project_role"]
          user_id: string
        }
        Returns: boolean
      }
      has_unique: { Args: { "": string }; Returns: string }
      in_todo: { Args: never; Returns: boolean }
      initialize_billing: {
        Args: { org_id: string; user_id: string }
        Returns: undefined
      }
      invite_organization_member: {
        Args: {
          email: string
          org_id: string
          role?: Database["public"]["Enums"]["user_role_type"]
        }
        Returns: string
      }
      is_empty: { Args: { "": string }; Returns: string }
      is_project_owner_or_admin: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { p_user_id: string }; Returns: boolean }
      is_valid_email: { Args: { email: string }; Returns: boolean }
      is_valid_slug: { Args: { slug: string }; Returns: boolean }
      isnt_empty: { Args: { "": string }; Returns: string }
      lives_ok: { Args: { "": string }; Returns: string }
      log_resource_usage: {
        Args: {
          feature: string
          metadata?: Json
          org_id: string
          quantity: number
          unit_type: string
          user_id: string
        }
        Returns: boolean
      }
      match_documents: {
        Args: {
          filters?: Json
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_organizations: {
        Args: {
          filters?: Json
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_projects: {
        Args: {
          filters?: Json
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_requirements: {
        Args: {
          filters?: Json
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_tests: {
        Args: {
          filters?: Json
          match_count?: number
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      no_plan: { Args: never; Returns: boolean[] }
      normalize_slug: { Args: { input_slug: string }; Returns: string }
      num_failed: { Args: never; Returns: number }
      os_name: { Args: never; Returns: string }
      pass:
        | { Args: never; Returns: string }
        | { Args: { "": string }; Returns: string }
      pg_version: { Args: never; Returns: string }
      pg_version_num: { Args: never; Returns: number }
      pgtap_version: { Args: never; Returns: number }
      preview_delete_requirement_relationship: {
        Args: { p_ancestor_id: string; p_descendant_id: string }
        Returns: {
          ancestor_id: string
          depth: number
          descendant_id: string
          will_be_deleted: boolean
        }[]
      }
      project_has_members: { Args: { p_project_id: string }; Returns: boolean }
      project_member_can_manage: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      remove_requirement_relationship: {
        Args: {
          p_ancestor_id: string
          p_descendant_id: string
          p_updated_by: string
        }
        Returns: {
          error_code: string
          message: string
          relationships_deleted: number
          success: boolean
        }[]
      }
      reorder_blocks: {
        Args: {
          p_block_ids: string[]
          p_document_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      runtests:
        | { Args: never; Returns: string[] }
        | { Args: { "": string }; Returns: string[] }
      search_documents_fts: {
        Args: { filters?: Json; match_limit?: number; search_query: string }
        Returns: {
          description: string
          id: string
          name: string
          rank: number
        }[]
      }
      search_organizations_fts: {
        Args: { filters?: Json; match_limit?: number; search_query: string }
        Returns: {
          description: string
          id: string
          name: string
          rank: number
        }[]
      }
      search_projects_fts: {
        Args: { filters?: Json; match_limit?: number; search_query: string }
        Returns: {
          description: string
          id: string
          name: string
          rank: number
        }[]
      }
      search_requirements_fts: {
        Args: { filters?: Json; match_limit?: number; search_query: string }
        Returns: {
          description: string
          id: string
          name: string
          rank: number
        }[]
      }
      setup_debug_test_scenario: { Args: never; Returns: string }
      skip:
        | { Args: { how_many: number; why: string }; Returns: string }
        | { Args: { "": string }; Returns: string }
      switch_organization: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      sync_billing_data: { Args: { org_id: string }; Returns: Json }
      test_specific_deletion: {
        Args: { p_ancestor_id: string; p_descendant_id: string }
        Returns: {
          details: string
          result_count: number
          test_step: string
        }[]
      }
      throws_ok: { Args: { "": string }; Returns: string }
      todo:
        | { Args: { how_many: number; why: string }; Returns: boolean[] }
        | { Args: { how_many: number; why: string }; Returns: boolean[] }
        | { Args: { how_many: number }; Returns: boolean[] }
        | { Args: { why: string }; Returns: boolean[] }
      todo_end: { Args: never; Returns: boolean[] }
      todo_start:
        | { Args: { "": string }; Returns: boolean[] }
        | { Args: never; Returns: boolean[] }
      uid: { Args: never; Returns: string }
      update_embedding_backfill: {
        Args: {
          p_embedding: string
          p_record_id: string
          p_table_name: string
          p_updated_by: string
        }
        Returns: undefined
      }
      update_session_activity: {
        Args: { p_session_id: string; p_ttl_hours?: number }
        Returns: boolean
      }
      user_can_access_project: {
        Args: { p_project_id: string; p_user_id: string }
        Returns: boolean
      }
      user_has_document_access: {
        Args: { document_id: string; user_workos_id: string }
        Returns: boolean
      }
      validate_closure_integrity: {
        Args: never
        Returns: {
          check_name: string
          details: string
          is_valid: boolean
          issue_count: number
        }[]
      }
      workos_id_to_supabase_id: { Args: { input_id: string }; Returns: string }
    }
    Enums: {
      action_type:
        | "create"
        | "read"
        | "update"
        | "delete"
        | "manage"
        | "assign"
        | "invite"
        | "approve"
        | "reject"
        | "export"
        | "import"
        | "share"
        | "archive"
        | "restore"
        | "audit"
        | "monitor"
        | "configure"
        | "admin"
      assignment_role: "assignee" | "reviewer" | "approver"
      audit_event_type:
        | "login"
        | "logout"
        | "login_failed"
        | "password_change"
        | "mfa_enabled"
        | "mfa_disabled"
        | "permission_granted"
        | "permission_denied"
        | "role_assigned"
        | "role_removed"
        | "data_created"
        | "data_read"
        | "data_updated"
        | "data_deleted"
        | "data_exported"
        | "system_config_changed"
        | "backup_created"
        | "backup_restored"
        | "security_violation"
        | "suspicious_activity"
        | "rate_limit_exceeded"
        | "compliance_report_generated"
        | "audit_log_accessed"
        | "data_retention_applied"
      audit_severity: "low" | "medium" | "high" | "critical"
      billing_plan: "free" | "pro" | "enterprise"
      entity_type: "document" | "requirement"
      execution_status:
        | "not_executed"
        | "in_progress"
        | "passed"
        | "failed"
        | "blocked"
        | "skipped"
      invitation_status: "pending" | "accepted" | "rejected" | "revoked"
      notification_type: "invitation" | "mention" | "system"
      organization_type: "personal" | "team" | "enterprise"
      pricing_plan_interval: "none" | "month" | "year"
      project_role: "owner" | "admin" | "maintainer" | "editor" | "viewer"
      project_status: "active" | "archived" | "draft" | "deleted"
      property_type:
        | "text"
        | "number"
        | "boolean"
        | "date"
        | "url"
        | "array"
        | "enum"
        | "entity_reference"
        | "select"
        | "multi_select"
        | "file"
      requirement_format: "incose" | "ears" | "other"
      requirement_level: "component" | "system" | "subsystem"
      requirement_priority: "low" | "medium" | "high" | "critical"
      requirement_status:
        | "active"
        | "archived"
        | "draft"
        | "deleted"
        | "in_review"
        | "in_progress"
        | "approved"
        | "rejected"
      resource_type:
        | "organization"
        | "project"
        | "document"
        | "requirement"
        | "user"
        | "member"
        | "invitation"
        | "role"
        | "permission"
        | "external_document"
        | "diagram"
        | "trace_link"
        | "assignment"
        | "audit_log"
        | "security_event"
        | "system_config"
        | "compliance_report"
      subscription_status:
        | "active"
        | "inactive"
        | "trialing"
        | "past_due"
        | "canceled"
        | "paused"
      test_method: "manual" | "automated" | "hybrid"
      test_priority: "critical" | "high" | "medium" | "low"
      test_status:
        | "draft"
        | "ready"
        | "in_progress"
        | "blocked"
        | "completed"
        | "obsolete"
      test_type:
        | "unit"
        | "integration"
        | "system"
        | "acceptance"
        | "performance"
        | "security"
        | "usability"
        | "other"
      trace_link_type:
        | "derives_from"
        | "implements"
        | "relates_to"
        | "conflicts_with"
        | "is_related_to"
        | "parent_of"
        | "child_of"
      user_role_type: "member" | "admin" | "owner" | "super_admin"
      user_status: "active" | "inactive"
      visibility: "private" | "team" | "organization" | "public"
    }
    CompositeTypes: {
      _time_trial_type: {
        a_time: number | null
      }
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
      action_type: [
        "create",
        "read",
        "update",
        "delete",
        "manage",
        "assign",
        "invite",
        "approve",
        "reject",
        "export",
        "import",
        "share",
        "archive",
        "restore",
        "audit",
        "monitor",
        "configure",
        "admin",
      ],
      assignment_role: ["assignee", "reviewer", "approver"],
      audit_event_type: [
        "login",
        "logout",
        "login_failed",
        "password_change",
        "mfa_enabled",
        "mfa_disabled",
        "permission_granted",
        "permission_denied",
        "role_assigned",
        "role_removed",
        "data_created",
        "data_read",
        "data_updated",
        "data_deleted",
        "data_exported",
        "system_config_changed",
        "backup_created",
        "backup_restored",
        "security_violation",
        "suspicious_activity",
        "rate_limit_exceeded",
        "compliance_report_generated",
        "audit_log_accessed",
        "data_retention_applied",
      ],
      audit_severity: ["low", "medium", "high", "critical"],
      billing_plan: ["free", "pro", "enterprise"],
      entity_type: ["document", "requirement"],
      execution_status: [
        "not_executed",
        "in_progress",
        "passed",
        "failed",
        "blocked",
        "skipped",
      ],
      invitation_status: ["pending", "accepted", "rejected", "revoked"],
      notification_type: ["invitation", "mention", "system"],
      organization_type: ["personal", "team", "enterprise"],
      pricing_plan_interval: ["none", "month", "year"],
      project_role: ["owner", "admin", "maintainer", "editor", "viewer"],
      project_status: ["active", "archived", "draft", "deleted"],
      property_type: [
        "text",
        "number",
        "boolean",
        "date",
        "url",
        "array",
        "enum",
        "entity_reference",
        "select",
        "multi_select",
        "file",
      ],
      requirement_format: ["incose", "ears", "other"],
      requirement_level: ["component", "system", "subsystem"],
      requirement_priority: ["low", "medium", "high", "critical"],
      requirement_status: [
        "active",
        "archived",
        "draft",
        "deleted",
        "in_review",
        "in_progress",
        "approved",
        "rejected",
      ],
      resource_type: [
        "organization",
        "project",
        "document",
        "requirement",
        "user",
        "member",
        "invitation",
        "role",
        "permission",
        "external_document",
        "diagram",
        "trace_link",
        "assignment",
        "audit_log",
        "security_event",
        "system_config",
        "compliance_report",
      ],
      subscription_status: [
        "active",
        "inactive",
        "trialing",
        "past_due",
        "canceled",
        "paused",
      ],
      test_method: ["manual", "automated", "hybrid"],
      test_priority: ["critical", "high", "medium", "low"],
      test_status: [
        "draft",
        "ready",
        "in_progress",
        "blocked",
        "completed",
        "obsolete",
      ],
      test_type: [
        "unit",
        "integration",
        "system",
        "acceptance",
        "performance",
        "security",
        "usability",
        "other",
      ],
      trace_link_type: [
        "derives_from",
        "implements",
        "relates_to",
        "conflicts_with",
        "is_related_to",
        "parent_of",
        "child_of",
      ],
      user_role_type: ["member", "admin", "owner", "super_admin"],
      user_status: ["active", "inactive"],
      visibility: ["private", "team", "organization", "public"],
    },
  },
} as const
A new version of Supabase CLI is available: v2.54.11 (currently installed v2.51.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
