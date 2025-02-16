'use client';

import { Project } from '@/types/base/projects.types';
import { createContext, useContext, useState } from 'react';

interface ProjectContextType {
    project: Project | null;
    setProject: (project: Project | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(
    undefined,
);

export const ProjectProvider = ({
    children,
    initialProject,
}: {    
    children: React.ReactNode;
    initialProject: Project | null;
}) => {
    const [project, setProject] = useState<Project | null>(initialProject);
    return (
        <ProjectContext.Provider value={{ project, setProject }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error(
            'useProject must be used within a ProjectProvider',
        );
    }
    return context;
};
