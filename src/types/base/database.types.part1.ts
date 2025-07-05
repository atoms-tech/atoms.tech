import { Database } from './database.types.part0';

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof Database },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
    ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database;
    }
        ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    public: {
        Enums: {
            assignment_role: ['assignee', 'reviewer', 'approver'],
            billing_plan: ['free', 'pro', 'enterprise'],
            entity_type: ['document', 'requirement'],
            execution_status: [
                'not_executed',
                'in_progress',
                'passed',
                'failed',
                'blocked',
                'skipped',
            ],
            invitation_status: ['pending', 'accepted', 'rejected', 'revoked'],
            notification_type: ['invitation', 'mention', 'system'],
            organization_type: ['personal', 'team', 'enterprise'],
            pricing_plan_interval: ['none', 'month', 'year'],
            project_role: ['owner', 'admin', 'maintainer', 'editor', 'viewer'],
            project_status: ['active', 'archived', 'draft', 'deleted'],
            property_type: [
                'text',
                'number',
                'boolean',
                'date',
                'url',
                'array',
                'enum',
                'entity_reference',
                'select',
                'multi_select',
                'file',
            ],
            requirement_format: ['incose', 'ears', 'other'],
            requirement_level: ['component', 'system', 'subsystem'],
            requirement_priority: ['low', 'medium', 'high', 'critical'],
            requirement_status: [
                'active',
                'archived',
                'draft',
                'deleted',
                'in_review',
                'in_progress',
                'approved',
                'rejected',
            ],
            subscription_status: [
                'active',
                'inactive',
                'trialing',
                'past_due',
                'canceled',
                'paused',
            ],
            test_method: ['manual', 'automated', 'hybrid'],
            test_priority: ['critical', 'high', 'medium', 'low'],
            test_status: [
                'draft',
                'ready',
                'in_progress',
                'blocked',
                'completed',
                'obsolete',
            ],
            test_type: [
                'unit',
                'integration',
                'system',
                'acceptance',
                'performance',
                'security',
                'usability',
                'other',
            ],
            trace_link_type: [
                'derives_from',
                'implements',
                'relates_to',
                'conflicts_with',
                'is_related_to',
                'parent_of',
                'child_of',
            ],
            user_role_type: ['member', 'admin', 'owner', 'super_admin'],
            user_status: ['active', 'inactive'],
            visibility: ['private', 'team', 'organization', 'public'],
        },
    },
} as const;
