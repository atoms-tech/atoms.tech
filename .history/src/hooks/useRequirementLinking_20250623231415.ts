'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { RequirementLink } from '@/types/react-flow.types';

// API functions
const createRequirementLink = async (link: Omit<RequirementLink, 'id' | 'createdAt' | 'updatedAt'>) => {
  const { data, error } = await supabase
    .from('diagram_element_links')
    .insert({
      diagram_id: link.nodeId.split('_')[0], // Extract diagram ID from node ID
      element_id: link.nodeId,
      requirement_id: link.requirementId,
      link_type: link.linkType,
      metadata: link.metadata,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateRequirementLink = async (linkId: string, updates: Partial<RequirementLink>) => {
  const { data, error } = await supabase
    .from('diagram_element_links')
    .update({
      link_type: updates.linkType,
      metadata: updates.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', linkId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteRequirementLink = async (linkId: string) => {
  const { error } = await supabase
    .from('diagram_element_links')
    .delete()
    .eq('id', linkId);

  if (error) throw error;
};

interface RequirementLinkingState {
  isDialogOpen: boolean;
  selectedNodeId: string | null;
  selectedRequirementId: string | null;
  linkType: 'implements' | 'derives' | 'validates' | 'traces';
}

export const useRequirementLinking = () => {
  const queryClient = useQueryClient();
  const [state, setState] = useState<RequirementLinkingState>({
    isDialogOpen: false,
    selectedNodeId: null,
    selectedRequirementId: null,
    linkType: 'implements',
  });

  // Create link mutation
  const createLinkMutation = useMutation({
    mutationFn: createRequirementLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram-element-links'] });
      toast.success('Requirement linked successfully');
      setState(prev => ({ ...prev, isDialogOpen: false, selectedNodeId: null }));
    },
    onError: (error) => {
      console.error('Failed to create requirement link:', error);
      toast.error('Failed to link requirement');
    },
  });

  // Update link mutation
  const updateLinkMutation = useMutation({
    mutationFn: ({ linkId, updates }: { linkId: string; updates: Partial<RequirementLink> }) =>
      updateRequirementLink(linkId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram-element-links'] });
      toast.success('Requirement link updated');
    },
    onError: (error) => {
      console.error('Failed to update requirement link:', error);
      toast.error('Failed to update requirement link');
    },
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: deleteRequirementLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram-element-links'] });
      toast.success('Requirement link removed');
    },
    onError: (error) => {
      console.error('Failed to delete requirement link:', error);
      toast.error('Failed to remove requirement link');
    },
  });

  // Open requirement linking dialog
  const linkNodeToRequirement = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      isDialogOpen: true,
      selectedNodeId: nodeId,
      selectedRequirementId: null,
    }));
  }, []);

  // Close dialog
  const closeDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDialogOpen: false,
      selectedNodeId: null,
      selectedRequirementId: null,
    }));
  }, []);

  // Set selected requirement
  const setSelectedRequirement = useCallback((requirementId: string) => {
    setState(prev => ({ ...prev, selectedRequirementId: requirementId }));
  }, []);

  // Set link type
  const setLinkType = useCallback((linkType: 'implements' | 'derives' | 'validates' | 'traces') => {
    setState(prev => ({ ...prev, linkType }));
  }, []);

  // Create the link
  const createLink = useCallback(() => {
    if (!state.selectedNodeId || !state.selectedRequirementId) {
      toast.error('Please select a requirement');
      return;
    }

    createLinkMutation.mutate({
      nodeId: state.selectedNodeId,
      requirementId: state.selectedRequirementId,
      linkType: state.linkType,
      metadata: {
        createdVia: 'react-flow-canvas',
        timestamp: new Date().toISOString(),
      },
      createdBy: '', // Will be set by the API function
    });
  }, [state, createLinkMutation]);

  // Update existing link
  const updateLink = useCallback((linkId: string, updates: Partial<RequirementLink>) => {
    updateLinkMutation.mutate({ linkId, updates });
  }, [updateLinkMutation]);

  // Remove link
  const removeLink = useCallback((linkId: string) => {
    deleteLinkMutation.mutate(linkId);
  }, [deleteLinkMutation]);

  // Unlink node from requirement
  const unlinkNodeFromRequirement = useCallback(async (nodeId: string, requirementId: string) => {
    try {
      const { data: existingLinks } = await supabase
        .from('diagram_element_links')
        .select('id')
        .eq('element_id', nodeId)
        .eq('requirement_id', requirementId);

      if (existingLinks && existingLinks.length > 0) {
        for (const link of existingLinks) {
          await deleteRequirementLink(link.id);
        }
        queryClient.invalidateQueries({ queryKey: ['diagram-element-links'] });
        toast.success('Requirement unlinked successfully');
      }
    } catch (error) {
      console.error('Failed to unlink requirement:', error);
      toast.error('Failed to unlink requirement');
    }
  }, [queryClient]);

  // Navigate to requirement
  const navigateToRequirement = useCallback((requirementId: string) => {
    // This would navigate to the requirement page
    // Implementation depends on your routing setup
    window.open(`/requirements/${requirementId}`, '_blank');
  }, []);

  // Auto-detect requirement patterns in text
  const detectRequirementPatterns = useCallback((text: string): string[] => {
    const patterns = [
      /REQ-\d+/gi,
      /FR-\d+/gi,
      /NFR-\d+/gi,
      /UC-\d+/gi,
      /US-\d+/gi,
    ];

    const matches: string[] = [];
    patterns.forEach(pattern => {
      const found = text.match(pattern);
      if (found) {
        matches.push(...found);
      }
    });

    return [...new Set(matches)]; // Remove duplicates
  }, []);

  // Bulk link creation from auto-detected patterns
  const createBulkLinksFromText = useCallback(async (nodeId: string, text: string) => {
    const detectedPatterns = detectRequirementPatterns(text);
    
    if (detectedPatterns.length === 0) {
      toast.info('No requirement patterns detected');
      return;
    }

    try {
      // This would need to match patterns to actual requirement IDs
      // For now, we'll just show what was detected
      toast.info(`Detected patterns: ${detectedPatterns.join(', ')}`);
    } catch (error) {
      console.error('Failed to create bulk links:', error);
      toast.error('Failed to create bulk links');
    }
  }, [detectRequirementPatterns]);

  return {
    // State
    isDialogOpen: state.isDialogOpen,
    selectedNodeId: state.selectedNodeId,
    selectedRequirementId: state.selectedRequirementId,
    linkType: state.linkType,
    
    // Actions
    linkNodeToRequirement,
    unlinkNodeFromRequirement,
    closeDialog,
    setSelectedRequirement,
    setLinkType,
    createLink,
    updateLink,
    removeLink,
    navigateToRequirement,
    detectRequirementPatterns,
    createBulkLinksFromText,
    
    // Loading states
    isCreating: createLinkMutation.isPending,
    isUpdating: updateLinkMutation.isPending,
    isDeleting: deleteLinkMutation.isPending,
  };
};
