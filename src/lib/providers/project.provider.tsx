'use client';

import { createContext, use, useState } from 'react';

import { Project } from '@/types/base/projects.types';

interface ProjectContextType {
    project: Project | null;
    setProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({
    children,
    initialProject,
}: {
    children: React.ReactNode;
    initialProject: Project | null;
}) => {
    const [project, setProject] = useState<Project | null>(initialProject);
    return <ProjectContext value={{ project, setProject }}>{children}</ProjectContext>;
};

export const useProject = () => {
    const context = use(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
