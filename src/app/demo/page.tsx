'use client';

import { useState } from 'react';

import { IntelligentSidebar } from '@/components/base/sidebar/IntelligentSidebar';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContainer,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import { OrganizationProvider } from '@/lib/providers/organization.provider';
import { UserProvider } from '@/lib/providers/user.provider';

// Mock data for demo
const mockUser = {
    id: 'demo-user-123',
    email: 'demo@atoms.tech',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    factors: [],
};

const mockProfile = {
    id: 'demo-user-123',
    full_name: 'Demo User',
    email: 'demo@atoms.tech',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    personal_organization_id: 'demo-personal-org',
    pinned_organization_id: 'demo-enterprise-org',
};

const mockOrganizations = [
    {
        id: 'demo-enterprise-org',
        name: 'Acme Corporation',
        slug: 'acme-corp',
        type: 'enterprise' as const,
        description: 'Enterprise organization for demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'demo-user-123',
        updated_by: 'demo-user-123',
        billing_plan: 'pro' as const,
        billing_cycle: 'month' as const,
        max_members: 100,
        max_monthly_requests: 10000,
        member_count: 25,
        storage_used: 1024,
        status: 'active' as const,
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        owner_id: 'demo-user-123',
        logo_url: null,
        settings: null,
        metadata: null,
    },
    {
        id: 'demo-personal-org',
        name: 'Personal Workspace',
        slug: 'personal',
        type: 'personal' as const,
        description: 'Personal workspace for demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'demo-user-123',
        updated_by: 'demo-user-123',
        billing_plan: 'free' as const,
        billing_cycle: 'month' as const,
        max_members: 1,
        max_monthly_requests: 1000,
        member_count: 1,
        storage_used: 256,
        status: 'active' as const,
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        owner_id: 'demo-user-123',
        logo_url: null,
        settings: null,
        metadata: null,
    },
];

export default function DemoPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [currentContext, setCurrentContext] = useState<'home' | 'org' | 'project'>('home');

    const contextExamples = {
        home: 'Home - Recent activity across all workspaces',
        org: 'Organization - Acme Corporation context',
        project: 'Project - Engineering Team context',
    };

    return (
        <UserProvider initialUser={mockUser} initialProfile={mockProfile}>
            <OrganizationProvider initialOrganizations={mockOrganizations}>
                <div className="min-h-screen bg-background">
                    <Sidebar defaultOpen={sidebarOpen} open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <div className="flex h-screen">
                            {/* Demo Sidebar */}
                            <SidebarContainer variant="sidebar" collapsible="offcanvas">
                                <SidebarContent className="flex flex-col h-full">
                                    {/* Logo Header */}
                                    <SidebarGroup className="px-3 py-2">
                                        <SidebarGroupLabel className="flex items-center gap-2 px-1 mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                                    <span className="text-sm font-bold">A</span>
                                                </div>
                                                <span className="font-semibold text-base">ATOMS</span>
                                            </div>
                                        </SidebarGroupLabel>
                                    </SidebarGroup>

                                    {/* Intelligent Sidebar - Context-aware content */}
                                    <div className="flex-1 overflow-hidden">
                                        <IntelligentSidebar />
                                    </div>

                                    <SidebarSeparator />

                                    {/* Baseline Navigation */}
                                    <SidebarGroup className="px-3 py-2">
                                        <SidebarGroupContent>
                                            <SidebarMenu>
                                                <SidebarMenuItem className="mb-0.5">
                                                    <SidebarMenuButton asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start"
                                                            onClick={() => setCurrentContext('home')}
                                                        >
                                                            <span className="text-xs font-medium">🏠 Home</span>
                                                        </Button>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                                <SidebarMenuItem className="mb-0.5">
                                                    <SidebarMenuButton asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start"
                                                            onClick={() => setCurrentContext('org')}
                                                        >
                                                            <span className="text-xs font-medium">🏢 Dashboard</span>
                                                        </Button>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                                <SidebarMenuItem className="mb-0.5">
                                                    <SidebarMenuButton asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start"
                                                            onClick={() => setCurrentContext('project')}
                                                        >
                                                            <span className="text-xs font-medium">✨ Playground</span>
                                                        </Button>
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            </SidebarMenu>
                                        </SidebarGroupContent>
                                    </SidebarGroup>
                                </SidebarContent>

                                {/* User Footer */}
                                <SidebarFooter className="px-3 py-1.5">
                                    <SidebarMenu>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton className="w-full">
                                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-xs font-medium">D</span>
                                                    </div>
                                                    <span className="text-xs font-medium">Demo User</span>
                                                </div>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </SidebarMenu>
                                </SidebarFooter>
                            </SidebarContainer>

                            {/* Main Content */}
                            <div className="flex-1 p-8">
                                <div className="max-w-4xl mx-auto">
                                    <h1 className="text-3xl font-bold mb-6">
                                        🚀 Enterprise Intelligence Sidebar Demo
                                    </h1>
                                    
                                    <div className="bg-card border rounded-lg p-6 mb-6">
                                        <h2 className="text-xl font-semibold mb-4">Current Context</h2>
                                        <p className="text-muted-foreground mb-4">
                                            {contextExamples[currentContext]}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant={currentContext === 'home' ? 'default' : 'outline'}
                                                onClick={() => setCurrentContext('home')}
                                            >
                                                Home Context
                                            </Button>
                                            <Button
                                                variant={currentContext === 'org' ? 'default' : 'outline'}
                                                onClick={() => setCurrentContext('org')}
                                            >
                                                Org Context
                                            </Button>
                                            <Button
                                                variant={currentContext === 'project' ? 'default' : 'outline'}
                                                onClick={() => setCurrentContext('project')}
                                            >
                                                Project Context
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-card border rounded-lg p-6">
                                            <h3 className="text-lg font-semibold mb-3">🎯 Key Features</h3>
                                            <ul className="space-y-2 text-sm text-muted-foreground">
                                                <li>• Context-aware search and navigation</li>
                                                <li>• Recent activity across all workspaces</li>
                                                <li>• Smart filters for enterprise scale</li>
                                                <li>• Intelligent organization switching</li>
                                                <li>• Preserved baseline navigation</li>
                                            </ul>
                                        </div>

                                        <div className="bg-card border rounded-lg p-6">
                                            <h3 className="text-lg font-semibold mb-3">🏢 Enterprise Scale</h3>
                                            <ul className="space-y-2 text-sm text-muted-foreground">
                                                <li>• Handles 1000s of organizations</li>
                                                <li>• Scales to millions of documents</li>
                                                <li>• MS Suite/G Suite UX patterns</li>
                                                <li>• Search-first interaction model</li>
                                                <li>• Intelligent content grouping</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Sidebar>
                </div>
            </OrganizationProvider>
        </UserProvider>
    );
}
