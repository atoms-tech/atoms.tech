'use client';

import { motion } from 'framer-motion';
import { Mail, MessageCircle, Plus, Users } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard.types';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    status: 'online' | 'away' | 'offline';
    lastActive?: Date;
    projects: string[];
}

export function TeamMembersWidget({ instance, onConfigChange }: WidgetProps) {
    const {
        maxMembers = 6,
        showStatus = true,
        showProjects = true,
    } = instance.config || {};

    const [members] = useState<TeamMember[]>([
        {
            id: '1',
            name: 'Alice Johnson',
            email: 'alice@atoms.tech',
            role: 'Product Manager',
            status: 'online',
            projects: ['Project Alpha', 'Project Beta'],
            lastActive: new Date(),
        },
        {
            id: '2',
            name: 'Bob Smith',
            email: 'bob@atoms.tech',
            role: 'Senior Developer',
            status: 'online',
            projects: ['Project Alpha', 'Project Gamma'],
            lastActive: new Date(Date.now() - 300000), // 5 minutes ago
        },
        {
            id: '3',
            name: 'Carol Davis',
            email: 'carol@atoms.tech',
            role: 'UX Designer',
            status: 'away',
            projects: ['Project Beta'],
            lastActive: new Date(Date.now() - 1800000), // 30 minutes ago
        },
        {
            id: '4',
            name: 'David Wilson',
            email: 'david@atoms.tech',
            role: 'QA Engineer',
            status: 'offline',
            projects: ['Project Gamma'],
            lastActive: new Date(Date.now() - 7200000), // 2 hours ago
        },
        {
            id: '5',
            name: 'Eva Brown',
            email: 'eva@atoms.tech',
            role: 'DevOps Engineer',
            status: 'online',
            projects: ['Project Alpha', 'Project Beta', 'Project Gamma'],
            lastActive: new Date(),
        },
    ]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'away':
                return 'bg-yellow-500';
            case 'offline':
                return 'bg-gray-400';
            default:
                return 'bg-gray-400';
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    const formatLastActive = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60),
        );

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440)
            return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const displayedMembers = members.slice(0, maxMembers);
    const onlineCount = members.filter((m) => m.status === 'online').length;

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" />
                        Team Members
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-500">
                                {onlineCount} online
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {displayedMembers.map((member, index) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                        <div className="relative">
                            <Avatar className="h-10 w-10">
                                <AvatarImage
                                    src={member.avatar}
                                    alt={member.name}
                                />
                                <AvatarFallback className="text-sm">
                                    {getInitials(member.name)}
                                </AvatarFallback>
                            </Avatar>
                            {showStatus && (
                                <div
                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(member.status)}`}
                                ></div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {member.name}
                                </h4>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                    >
                                        <MessageCircle className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                    >
                                        <Mail className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {member.role}
                            </p>

                            {showProjects && member.projects.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                    <div className="flex gap-1">
                                        {member.projects
                                            .slice(0, 2)
                                            .map((project) => (
                                                <span
                                                    key={project}
                                                    className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded"
                                                >
                                                    {project.replace(
                                                        'Project ',
                                                        '',
                                                    )}
                                                </span>
                                            ))}
                                        {member.projects.length > 2 && (
                                            <span className="text-xs text-gray-500">
                                                +{member.projects.length - 2}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {showStatus && member.status !== 'online' && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {formatLastActive(
                                        member.lastActive || new Date(),
                                    )}
                                </p>
                            )}
                        </div>
                    </motion.div>
                ))}

                {members.length > maxMembers && (
                    <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" className="text-xs">
                            View {members.length - maxMembers} more members
                        </Button>
                    </div>
                )}

                {displayedMembers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No team members found</p>
                        <p className="text-sm">
                            Invite team members to get started
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
