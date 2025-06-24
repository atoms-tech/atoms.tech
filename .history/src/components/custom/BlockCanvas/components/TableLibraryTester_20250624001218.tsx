'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    Star, 
    Download, 
    Zap, 
    Users, 
    Code, 
    Palette, 
    Database, 
    Edit3, 
    Filter, 
    BarChart3, 
    Grid3X3, 
    MousePointer, 
    Keyboard, 
    Eye, 
    Copy, 
    FileSpreadsheet,
    Settings
} from 'lucide-react';

import { EditableTable } from './EditableTable/EditableTable';
import { TanStackEditableTable } from './EditableTable/TanStackEditableTable';
import { MantineEditableTable } from './EditableTable/MantineEditableTable';
import { MaterialUIEditableTable } from './EditableTable/MaterialUIEditableTable';
import { TableLibrarySelector } from './TableLibrarySelector';
import { useDocumentStore, TableLibraryType } from '@/store/document.store';

// Mock data generator
const generateMockRequirements = (count: number) => {
    const priorities = ['High', 'Medium', 'Low', 'Critical'];
    const statuses = ['Draft', 'In Review', 'Approved', 'Implemented', 'Testing'];
    const types = ['Functional', 'Non-Functional', 'Business', 'Technical'];
    const assignees = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];

    return Array.from({ length: count }, (_, i) => ({
        id: `REQ-${String(i + 1).padStart(3, '0')}`,
        title: `Requirement ${i + 1}`,
        description: `This is a detailed description for requirement ${i + 1}. It includes comprehensive details about the functionality, acceptance criteria, and implementation notes.`,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        type: types[Math.floor(Math.random() * types.length)],
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        createdDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        estimatedHours: Math.floor(Math.random() * 40) + 1,
        tags: ['feature', 'ui', 'backend'].slice(0, Math.floor(Math.random() * 3) + 1),
        ai_analysis: {
            confidence: Math.random(),
            suggestions: [],
            issues: [],
        },
    }));
};

// Mock columns configuration
const mockColumns = [
    { key: 'title', header: 'Title', type: 'text' },
    { key: 'priority', header: 'Priority', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
    { key: 'status', header: 'Status', type: 'select', options: ['Draft', 'In Review', 'Approved', 'Implemented', 'Testing'] },
    { key: 'assignee', header: 'Assignee', type: 'text' },
    { key: 'estimatedHours', header: 'Hours', type: 'number' },
    { key: 'createdDate', header: 'Created', type: 'date' },
];

// Feature comparison data
const featureComparison = {
    'default': {
        name: 'Default Table',
        bundle: '~12kB',
        stars: 'N/A',
        downloads: 'Built-in',
        features: {
            'Inline Editing': true,
            'Column Management': true,
            'Row Operations': true,
            'Drag & Drop': false,
            'Virtualization': false,
            'Export (CSV/PDF/Excel)': false,
            'Filtering': true,
            'Sorting': true,
            'Pagination': false,
            'Search': false,
            'Accessibility': true,
            'TypeScript': true,
            'Responsive': true,
            'Theming': true,
            'Performance': 'Good',
            'Learning Curve': 'Easy',
            'Documentation': 'Good',
            'Community': 'Internal'
        },
        pros: [
            'Lightweight',
            'No external dependencies',
            'Fast loading',
            'Simple to use',
            'Customizable',
            'Integrated with app'
        ],
        cons: [
            'Limited features',
            'No advanced functionality',
            'Basic styling',
            'Manual implementation needed'
        ]
    },
    'tanstack': {
        name: 'TanStack Table',
        bundle: '~45kB',
        stars: '24.9k',
        downloads: '2.8M',
        features: {
            'Inline Editing': true,
            'Column Management': true,
            'Row Operations': true,
            'Drag & Drop': true,
            'Virtualization': true,
            'Export (CSV/PDF/Excel)': false,
            'Filtering': true,
            'Sorting': true,
            'Pagination': true,
            'Search': true,
            'Accessibility': true,
            'TypeScript': true,
            'Responsive': true,
            'Theming': true,
            'Performance': 'Excellent',
            'Learning Curve': 'Moderate',
            'Documentation': 'Excellent',
            'Community': 'Very Active'
        },
        pros: [
            'Headless architecture',
            'Excellent performance',
            'Comprehensive features',
            'Great TypeScript support',
            'Active development',
            'Flexible and extensible'
        ],
        cons: [
            'Steeper learning curve',
            'Requires more setup',
            'Larger bundle size',
            'Complex for simple use cases'
        ]
    },
    'mantine': {
        name: 'Mantine React Table',
        bundle: '~48kB',
        stars: '1.0k',
        downloads: '57k',
        features: {
            'Inline Editing': true,
            'Column Management': true,
            'Row Operations': true,
            'Drag & Drop': true,
            'Virtualization': true,
            'Export (CSV/PDF/Excel)': true,
            'Filtering': true,
            'Sorting': true,
            'Pagination': true,
            'Search': true,
            'Accessibility': true,
            'TypeScript': true,
            'Responsive': true,
            'Theming': true,
            'Performance': 'Excellent',
            'Learning Curve': 'Moderate',
            'Documentation': 'Good',
            'Community': 'Growing'
        },
        pros: [
            'Clean design system',
            'Good performance',
            'Built-in export features',
            'Mantine integration',
            'TypeScript support',
            'Modern UI components'
        ],
        cons: [
            'Smaller community',
            'Mantine dependency',
            'Less mature ecosystem',
            'Fewer examples'
        ]
    },
    'material-ui': {
        name: 'Material React Table',
        bundle: '~60kB',
        stars: '1.7k',
        downloads: '185k',
        features: {
            'Inline Editing': true,
            'Column Management': true,
            'Row Operations': true,
            'Drag & Drop': true,
            'Virtualization': true,
            'Export (CSV/PDF/Excel)': true,
            'Filtering': true,
            'Sorting': true,
            'Pagination': true,
            'Search': true,
            'Accessibility': true,
            'TypeScript': true,
            'Responsive': true,
            'Theming': true,
            'Performance': 'Excellent',
            'Learning Curve': 'Moderate',
            'Documentation': 'Excellent',
            'Community': 'Active'
        },
        pros: [
            'Material Design',
            'Comprehensive features',
            'Excellent documentation',
            'Active development',
            'Great accessibility',
            'Rich ecosystem'
        ],
        cons: [
            'Largest bundle size',
            'Material UI dependency',
            'Complex setup',
            'Opinionated design'
        ]
    }
};

interface TableLibraryTesterProps {
    className?: string;
}

export const TableLibraryTester: React.FC<TableLibraryTesterProps> = ({ className }) => {
    const [activeTab, setActiveTab] = useState('comparison');
    const [mockData] = useState(() => generateMockRequirements(25));
    const { tableLibrary } = useDocumentStore();

    const handleSave = async (item: any, isNew: boolean) => {
        console.log('Save:', item, isNew);
        // Mock save implementation
        await new Promise(resolve => setTimeout(resolve, 500));
    };

    const handleDelete = async (item: any) => {
        console.log('Delete:', item);
        // Mock delete implementation
        await new Promise(resolve => setTimeout(resolve, 300));
    };

    const handlePostSave = async () => {
        console.log('Post save');
        // Mock post save implementation
    };

    const FeatureIcon = ({ feature, value }: { feature: string; value: boolean | string }) => {
        if (typeof value === 'boolean') {
            return value ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
                <XCircle className="h-4 w-4 text-red-500" />
            );
        }
        return <Badge variant="outline" className="text-xs">{value}</Badge>;
    };

    const renderTableDemo = (libraryType: TableLibraryType) => {
        const commonProps = {
            data: mockData,
            columns: mockColumns,
            onSave: handleSave,
            onDelete: handleDelete,
            onPostSave: handlePostSave,
            isLoading: false,
            showFilter: true,
            isEditMode: true,
            alwaysShowAddRow: true,
        };

        switch (libraryType) {
            case 'tanstack':
                return <TanStackEditableTable {...commonProps} />;
            case 'mantine':
                return <MantineEditableTable {...commonProps} />;
            case 'material-ui':
                return <MaterialUIEditableTable {...commonProps} />;
            case 'default':
            default:
                return <EditableTable {...commonProps} />;
        }
    };

    return (
        <div className={`container mx-auto p-6 space-y-6 ${className || ''}`}>
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Table Library Testing & Comparison</h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Comprehensive testing environment for all table implementations in ATOMS.tech
                </p>
                <div className="flex justify-center gap-2">
                    <Badge variant="secondary">
                        <FileSpreadsheet className="h-3 w-3 mr-1" />
                        Live Testing
                    </Badge>
                    <Badge variant="secondary">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Feature Comparison
                    </Badge>
                    <Badge variant="secondary">
                        <Grid3X3 className="h-3 w-3 mr-1" />
                        Performance Analysis
                    </Badge>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="comparison">Comparison</TabsTrigger>
                    <TabsTrigger value="default">Default</TabsTrigger>
                    <TabsTrigger value="tanstack">TanStack</TabsTrigger>
                    <TabsTrigger value="mantine">Mantine</TabsTrigger>
                    <TabsTrigger value="material-ui">Material-UI</TabsTrigger>
                    <TabsTrigger value="live-test">Live Test</TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Object.entries(featureComparison).map(([key, data]) => (
                            <Card key={key} className="h-fit">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            {data.name}
                                            {key === 'tanstack' && (
                                                <Badge variant="default">Recommended</Badge>
                                            )}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Star className="h-4 w-4" />
                                            {data.stars}
                                        </div>
                                    </div>
                                    <CardDescription>
                                        Bundle: {data.bundle} | Downloads: {data.downloads}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-green-600 mb-2">Pros</h4>
                                        <ul className="space-y-1">
                                            {data.pros.map((pro, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm">
                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                    {pro}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-red-600 mb-2">Cons</h4>
                                        <ul className="space-y-1">
                                            {data.cons.map((con, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm">
                                                    <XCircle className="h-3 w-3 text-red-500" />
                                                    {con}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Comparison Matrix</CardTitle>
                            <CardDescription>
                                Detailed feature comparison between all table implementations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 font-semibold">Feature</th>
                                            <th className="text-center p-2 font-semibold">Default</th>
                                            <th className="text-center p-2 font-semibold">TanStack</th>
                                            <th className="text-center p-2 font-semibold">Mantine</th>
                                            <th className="text-center p-2 font-semibold">Material-UI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(featureComparison.default.features).map((feature) => (
                                            <tr key={feature} className="border-b hover:bg-muted/50">
                                                <td className="p-2 font-medium">{feature}</td>
                                                <td className="p-2 text-center">
                                                    <FeatureIcon 
                                                        feature={feature} 
                                                        value={featureComparison.default.features[feature as keyof typeof featureComparison.default.features]} 
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <FeatureIcon 
                                                        feature={feature} 
                                                        value={featureComparison.tanstack.features[feature as keyof typeof featureComparison.tanstack.features]} 
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <FeatureIcon 
                                                        feature={feature} 
                                                        value={featureComparison.mantine.features[feature as keyof typeof featureComparison.mantine.features]} 
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <FeatureIcon 
                                                        feature={feature} 
                                                        value={featureComparison['material-ui'].features[feature as keyof typeof featureComparison['material-ui'].features]} 
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Individual table demos */}
                {(['default', 'tanstack', 'mantine', 'material-ui'] as TableLibraryType[]).map((libraryType) => (
                    <TabsContent key={libraryType} value={libraryType} className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {featureComparison[libraryType].name} - Live Demo
                                </CardTitle>
                                <CardDescription>
                                    Interactive demonstration with full editing capabilities
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {renderTableDemo(libraryType)}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}

                <TabsContent value="live-test" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Live Table Testing Environment
                            </CardTitle>
                            <CardDescription>
                                Test the currently selected table implementation with real-time switching
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <span className="font-medium">Current Table Implementation:</span>
                                <TableLibrarySelector />
                            </div>
                            
                            {renderTableDemo(tableLibrary)}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
