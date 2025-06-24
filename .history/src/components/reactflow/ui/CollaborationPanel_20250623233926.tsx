'use client';

import { Eye, EyeOff, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { CollaborationUser } from '@/types/react-flow.types';

interface CollaborationPanelProps {
    projectId?: string;
    diagramId?: string;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
    projectId,
    diagramId,
}) => {
    const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
    const [isVisible, setIsVisible] = useState(true);

    // Fetch real project collaborators
    useEffect(() => {
        const fetchCollaborators = async () => {
            if (!projectId) return;

            try {
                // Get project members with user details
                const { data: projectMembers, error } = await supabase
                    .from('project_members')
                    .select(
                        `
                        user_id,
                        role,
                        users:user_id (
                            id,
                            email,
                            full_name
                        )
                    `,
                    )
                    .eq('project_id', projectId);

                if (error) {
                    console.error('Error fetching project members:', error);
                    return;
                }

                // Transform to collaboration users
                const colors = [
                    '#3B82F6',
                    '#10B981',
                    '#F59E0B',
                    '#EF4444',
                    '#8B5CF6',
                    '#06B6D4',
                ];
                const transformedUsers: CollaborationUser[] =
                    projectMembers?.map((member: any, index: number) => {
                        const user = member.users;
                        const displayName =
                            user.full_name ||
                            user.email?.split('@')[0] ||
                            'Unknown User';

                        return {
                            id: user.id,
                            name: displayName,
                            avatar: displayName
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2),
                            color: colors[index % colors.length],
                            cursor: { x: 0, y: 0 },
                            selection: [],
                            role: member.role,
                            isOnline: Math.random() > 0.3, // Simulate online status
                        };
                    }) || [];

                setCollaborators(transformedUsers);

                // Set up real-time subscription for project members
                const subscription = supabase
                    .channel(`project-${projectId}-members`)
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'project_members',
                            filter: `project_id=eq.${projectId}`,
                        },
                        () => {
                            // Refetch collaborators when members change
                            fetchCollaborators();
                        },
                    )
                    .subscribe();

                return () => {
                    subscription.unsubscribe();
                };
            } catch (error) {
                console.error('Error in fetchCollaborators:', error);
            }
        };

        fetchCollaborators();
    }, [projectId, diagramId]);

    if (!isVisible) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsVisible(true)}
                className="fixed top-4 right-4 z-10"
            >
                <Eye className="w-4 h-4" />
            </Button>
        );
    }

    return (
        <Card className="w-64 shadow-lg">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Collaborators ({collaborators.length})
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsVisible(false)}
                        className="h-6 w-6 p-0"
                    >
                        <EyeOff className="w-3 h-3" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {collaborators.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No active collaborators
                        </p>
                    ) : (
                        collaborators.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                        style={
                                            {
                                                '--user-color': user.color,
                                                backgroundColor:
                                                    'var(--user-color)',
                                            } as React.CSSProperties
                                        }
                                    >
                                        {user.avatar ||
                                            user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">
                                            {user.name}
                                        </span>
                                        {user.role && (
                                            <span className="text-xs text-gray-500 capitalize">
                                                {user.role}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {user.selection &&
                                        user.selection.length > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {user.selection.length} selected
                                            </Badge>
                                        )}
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {collaborators.length > 0 && (
                    <div className="mt-3 pt-2 border-t">
                        <p className="text-xs text-gray-500">
                            Real-time collaboration active
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default CollaborationPanel;
