'use client';

import React from 'react';
import { Check, Database, Grid3X3, Table2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useDocumentStore, TableLibraryType } from '@/store/document.store';
import { cn } from '@/lib/utils';

interface TableLibraryOption {
    value: TableLibraryType;
    label: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    status: 'stable' | 'beta' | 'experimental';
    bundleSize: string;
}

const tableLibraryOptions: TableLibraryOption[] = [
    {
        value: 'default',
        label: 'Default Table',
        description: 'Lightweight custom table implementation',
        icon: <Table2 className="h-4 w-4" />,
        features: ['Basic editing', 'Sorting', 'Filtering', 'Lightweight'],
        status: 'stable',
        bundleSize: '~12kB',
    },
    {
        value: 'tanstack',
        label: 'TanStack Table',
        description: 'Powerful headless table with advanced features',
        icon: <Grid3X3 className="h-4 w-4" />,
        features: ['Advanced sorting', 'Virtualization', 'Column management', 'TypeScript'],
        status: 'stable',
        bundleSize: '~45kB',
    },
    {
        value: 'mantine',
        label: 'Mantine React Table',
        description: 'Feature-rich table with Mantine design system',
        icon: <Database className="h-4 w-4" />,
        features: ['Inline editing', 'Export', 'Drag & drop', 'Clean design'],
        status: 'beta',
        bundleSize: '~48kB',
    },
    {
        value: 'material-ui',
        label: 'Material React Table',
        description: 'Comprehensive table with Material-UI components',
        icon: <Grid3X3 className="h-4 w-4" />,
        features: ['Full feature set', 'Material design', 'Export', 'Accessibility'],
        status: 'beta',
        bundleSize: '~60kB',
    },
];

interface TableLibrarySelectorProps {
    className?: string;
    showFeatures?: boolean;
    size?: 'sm' | 'default' | 'lg';
}

export const TableLibrarySelector: React.FC<TableLibrarySelectorProps> = ({
    className,
    showFeatures = true,
    size = 'default',
}) => {
    const { tableLibrary, setTableLibrary } = useDocumentStore();
    
    const currentOption = tableLibraryOptions.find(option => option.value === tableLibrary) || tableLibraryOptions[0];

    const handleLibraryChange = (library: TableLibraryType) => {
        setTableLibrary(library);
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'stable':
                return 'default';
            case 'beta':
                return 'secondary';
            case 'experimental':
                return 'outline';
            default:
                return 'outline';
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size={size}
                    className={cn(
                        'justify-between min-w-[200px]',
                        className
                    )}
                >
                    <div className="flex items-center gap-2">
                        {currentOption.icon}
                        <span>{currentOption.label}</span>
                        <Badge 
                            variant={getStatusBadgeVariant(currentOption.status)}
                            className="text-xs"
                        >
                            {currentOption.status}
                        </Badge>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="start">
                <DropdownMenuLabel>Table Implementation</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {tableLibraryOptions.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleLibraryChange(option.value)}
                        className="flex flex-col items-start gap-2 p-4 cursor-pointer"
                    >
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                {option.icon}
                                <span className="font-medium">{option.label}</span>
                                <Badge 
                                    variant={getStatusBadgeVariant(option.status)}
                                    className="text-xs"
                                >
                                    {option.status}
                                </Badge>
                                {option.value === tableLibrary && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {option.bundleSize}
                            </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground text-left">
                            {option.description}
                        </p>
                        
                        {showFeatures && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {option.features.map((feature) => (
                                    <Badge 
                                        key={feature} 
                                        variant="outline" 
                                        className="text-xs"
                                    >
                                        {feature}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                <div className="p-2 text-xs text-muted-foreground">
                    Choose the table implementation that best fits your needs. 
                    Changes apply to all tables in this document.
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default TableLibrarySelector;
