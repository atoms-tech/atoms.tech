'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    CheckCircle, 
    XCircle, 
    Star, 
    FileSpreadsheet,
    Edit3,
    Grid3X3,
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
    const assignees = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];

    return Array.from({ length: count }, (_, i) => ({
        id: `REQ-${String(i + 1).padStart(3, '0')}`,
        title: `Requirement ${i + 1}`,
        description: `This is a detailed description for requirement ${i + 1}.`,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        createdDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        estimatedHours: Math.floor(Math.random() * 40) + 1,
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

interface TableLibraryTesterProps {
    className?: string;
}

const TableLibraryTester: React.FC<TableLibraryTesterProps> = ({ className }) => {
    const [activeTab, setActiveTab] = useState('comparison');
    const [mockData] = useState(() => generateMockRequirements(25));
    const { tableLibrary } = useDocumentStore();

    const handleSave = async (item: any, isNew: boolean) => {
        console.log('Save:', item, isNew);
        await new Promise(resolve => setTimeout(resolve, 500));
    };

    const handleDelete = async (item: any) => {
        console.log('Delete:', item);
        await new Promise(resolve => setTimeout(resolve, 300));
    };

    const handlePostSave = async () => {
        console.log('Post save');
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

    const containerClass = className ? `min-h-screen bg-background ${className}` : 'min-h-screen bg-background';

    return (
        <div className={containerClass}>
            {/* ATOMS-style header section */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                Table Library Testing & Comparison
                            </h1>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Comprehensive testing environment for all table implementations in ATOMS.tech
                            </p>
                        </div>
                        <div className="flex justify-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                <FileSpreadsheet className="h-3 w-3 mr-1" />
                                Live Testing
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                <Edit3 className="h-3 w-3 mr-1" />
                                Feature Comparison
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                <Grid3X3 className="h-3 w-3 mr-1" />
                                Performance Analysis
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-6 bg-muted">
                        <TabsTrigger value="comparison" className="text-sm">Comparison</TabsTrigger>
                        <TabsTrigger value="default" className="text-sm">Default</TabsTrigger>
                        <TabsTrigger value="tanstack" className="text-sm">TanStack</TabsTrigger>
                        <TabsTrigger value="mantine" className="text-sm">Mantine</TabsTrigger>
                        <TabsTrigger value="material-ui" className="text-sm">Material-UI</TabsTrigger>
                        <TabsTrigger value="live-test" className="text-sm">Live Test</TabsTrigger>
                    </TabsList>

                    <TabsContent value="comparison" className="space-y-6 mt-6">
                        <Card className="border bg-card text-card-foreground shadow">
                            <CardHeader className="pb-4">
                                <CardTitle className="font-semibold leading-none tracking-tight">
                                    Table Library Comparison
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    Compare different table implementations available in ATOMS.tech
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card className="p-4 bg-muted/50">
                                        <h3 className="font-semibold mb-2 text-foreground">Default Table</h3>
                                        <p className="text-sm text-muted-foreground mb-3">Lightweight custom implementation</p>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-xs">~12kB</Badge>
                                            <Badge variant="secondary" className="text-xs">Stable</Badge>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-muted/50">
                                        <h3 className="font-semibold mb-2 text-foreground">TanStack Table</h3>
                                        <p className="text-sm text-muted-foreground mb-3">Powerful headless table</p>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-xs">~45kB</Badge>
                                            <Badge variant="default" className="text-xs">Recommended</Badge>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-muted/50">
                                        <h3 className="font-semibold mb-2 text-foreground">Mantine Table</h3>
                                        <p className="text-sm text-muted-foreground mb-3">Feature-rich with clean design</p>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-xs">~48kB</Badge>
                                            <Badge variant="secondary" className="text-xs">Beta</Badge>
                                        </div>
                                    </Card>
                                    <Card className="p-4 bg-muted/50">
                                        <h3 className="font-semibold mb-2 text-foreground">Material-UI Table</h3>
                                        <p className="text-sm text-muted-foreground mb-3">Comprehensive Material Design</p>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-xs">~60kB</Badge>
                                            <Badge variant="secondary" className="text-xs">Beta</Badge>
                                        </div>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="default" className="space-y-4 mt-6">
                        <Card className="border bg-card text-card-foreground shadow">
                            <CardHeader className="pb-4">
                                <CardTitle className="font-semibold leading-none tracking-tight">
                                    Default Table - Live Demo
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    Lightweight custom table implementation
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {renderTableDemo('default')}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="tanstack" className="space-y-4 mt-6">
                        <Card className="border bg-card text-card-foreground shadow">
                            <CardHeader className="pb-4">
                                <CardTitle className="font-semibold leading-none tracking-tight">
                                    TanStack Table - Live Demo
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    Powerful headless table with advanced features
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {renderTableDemo('tanstack')}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="mantine" className="space-y-4 mt-6">
                        <Card className="border bg-card text-card-foreground shadow">
                            <CardHeader className="pb-4">
                                <CardTitle className="font-semibold leading-none tracking-tight">
                                    Mantine React Table - Live Demo
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    Feature-rich table with clean design system
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {renderTableDemo('mantine')}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="material-ui" className="space-y-4 mt-6">
                        <Card className="border bg-card text-card-foreground shadow">
                            <CardHeader className="pb-4">
                                <CardTitle className="font-semibold leading-none tracking-tight">
                                    Material-UI React Table - Live Demo
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    Comprehensive table with Material Design
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {renderTableDemo('material-ui')}
                            </CardContent>
                        </Card>
                    </TabsContent>

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

export default TableLibraryTester;
