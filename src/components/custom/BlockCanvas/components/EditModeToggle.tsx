'use client';

import { motion } from 'framer-motion';
import { Check, Edit2, Lock, Unlock } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { memo, useEffect, useMemo, useState } from 'react';

import BaseToggle from '@/components/custom/toggles/BaseToggle';
import { useLayout } from '@/lib/providers/layout.provider';
import { useUser } from '@/lib/providers/user.provider';

function useUserRole(userId: string) {
    const params = useParams();
    const projectId = useMemo(() => {
        const raw = params?.projectId;
        if (Array.isArray(raw)) return raw[0];
        return typeof raw === 'string' ? raw : '';
    }, [params]);

    const [role, setRole] = useState<'owner' | 'editor' | 'viewer'>('viewer');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchRole() {
            if (!userId || !projectId) {
                if (!cancelled) {
                    setRole('viewer');
                    setIsLoading(false);
                }
                return;
            }

            try {
                const response = await fetch(`/api/projects/${projectId}/role`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch role: ${response.statusText}`);
                }

                const data = (await response.json()) as { role?: string };
                const fetchedRole =
                    data.role === 'owner' || data.role === 'editor'
                        ? data.role
                        : 'viewer';

                if (!cancelled) {
                    setRole(fetchedRole);
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
                if (!cancelled) {
                    setRole('viewer');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        setIsLoading(true);
        fetchRole();

        return () => {
            cancelled = true;
        };
    }, [projectId, userId]);

    return { role, isLoading };
}

// Floating action button version
export const EditModeFloatingToggle = memo(() => {
    const { isEditMode, setIsEditMode } = useLayout();
    const { user } = useUser(); // Fetch user using useUser()
    const userId = user?.id || ''; // Ensure userId is extracted correctly

    const { role, isLoading } = useUserRole(userId);
    const canEdit = role === 'owner' || role === 'editor';

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    if (isLoading || !canEdit) return null;

    return (
        <motion.div
            className="fixed bottom-4 right-8 z-50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
        >
            <BaseToggle
                icon={<Edit2 className="h-6 w-6" />}
                activeIcon={<Check className="h-6 w-6" />}
                tooltip={isEditMode ? 'Save Changes' : 'Edit Content'}
                isActive={isEditMode}
                onClick={toggleEditMode}
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg bg-primary text-primary-foreground"
                variant={isEditMode ? 'outline' : 'destructive'}
            />
        </motion.div>
    );
});

// Toolbar version
export const EditModeToggle = memo(() => {
    const { isEditMode, setIsEditMode } = useLayout();
    const { user } = useUser(); // Fetch user using useUser()
    const userId = user?.id || ''; // Ensure userId is extracted correctly

    const { role, isLoading } = useUserRole(userId);
    const canEdit = role === 'owner' || role === 'editor';

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    if (isLoading || !canEdit) return null;

    return (
        <BaseToggle
            icon={<Lock className="h-5 w-5" />}
            activeIcon={<Unlock className="h-5 w-5" />}
            tooltip={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            isActive={isEditMode}
            onClick={toggleEditMode}
            className={
                isEditMode
                    ? 'text-destructive-foreground bg-destructive/80 hover:bg-destructive/90'
                    : ''
            }
        />
    );
});

// Display names for debugging
EditModeFloatingToggle.displayName = 'EditModeFloatingToggle';
EditModeToggle.displayName = 'EditModeToggle';

export default EditModeToggle;
