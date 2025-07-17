'use client';

import { motion } from 'framer-motion';
import { Check, Edit2, Lock, Unlock } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { memo } from 'react';

import BaseToggle from '@/components/custom/toggles/BaseToggle';
import { useLayout } from '@/lib/providers/layout.provider';
import { useUser } from '@/lib/providers/user.provider';
import { supabase } from '@/lib/supabase/supabaseBrowser';

function useUserRole(userId: string) {
    const params = useParams();
    const projectId = params?.projectId || '';

    if (!projectId) {
        console.error('Project ID is missing from the URL.');
        return async () => 'viewer';
    }

    const getUserRole = async (): Promise<string> => {
        try {
            const { data, error } = await supabase
                .from('project_members')
                .select('role')
                .eq('user_id', userId)
                .eq('project_id', Array.isArray(projectId) ? projectId[0] : projectId)
                .single();

            if (error) {
                console.error('Error fetching user role:', error);
                return 'viewer';
            }

            return data?.role || 'viewer';
        } catch (err) {
            console.error('Unexpected error fetching user role:', err);
            return 'viewer';
        }
    };

    return () => getUserRole();
}

// Floating action button version
export const EditModeFloatingToggle = memo(() => {
    const { isEditMode, setIsEditMode } = useLayout();
    const { user } = useUser(); // Fetch user using useUser()
    const userId = user?.id || ''; // Ensure userId is extracted correctly

    const getUserRole = useUserRole(userId);

    const canPerformAction = async () => {
        const userRole = await getUserRole();
        return ['owner', 'editor'].includes(userRole);
    };

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    if (!canPerformAction()) return null;

    return (
        <motion.div
            className="fixed bottom-8 right-8 z-50"
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

    const getUserRole = useUserRole(userId);

    const canPerformAction = async () => {
        const userRole = await getUserRole();
        return ['owner', 'editor'].includes(userRole);
    };

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    if (!canPerformAction()) return null;

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
