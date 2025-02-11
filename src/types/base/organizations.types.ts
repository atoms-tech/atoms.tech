import { Json } from './database.types';
import {
    BillingPlan,
    OrganizationType,
    PricingPlanInterval,
    UserRoleType,
    UserStatus,
} from './enums.types';

export type Organization = {
    id: string;
    billing_cycle: PricingPlanInterval;
    billing_plan: BillingPlan;
    created_at: string | null;
    created_by: string;
    deleted_at: string | null;
    deleted_by: string | null;
    description: string | null;
    is_deleted: boolean | null;
    logo_url: string | null;
    max_members: number;
    max_monthly_requests: number;
    member_count: number | null;
    metadata: Json | null;
    name: string;
    settings: Json | null;
    slug: string;
    status: UserStatus | null;
    storage_used: number | null;
    type: OrganizationType;
    updated_at: string | null;
    updated_by: string;
};

export type OrganizationMembers = {
    created_at: string | null;
    deleted_at: string | null;
    deleted_by: string | null;
    id: string;
    is_deleted: boolean | null;
    last_active_at: string | null;
    organization_id: string;
    permissions: Json | null;
    role: UserRoleType;
    status: UserStatus | null;
    updated_at: string | null;
    user_id: string;
};
