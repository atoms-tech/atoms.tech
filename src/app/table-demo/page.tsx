'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableLibrarySelector } from '@/components/custom/BlockCanvas/components/TableLibrarySelector';
import { useDocumentStore } from '@/store/document.store';
import { 
    FileSpreadsheet, 
    Zap, 
    CheckCircle, 
    ArrowRight,
    Settings,
    Database
} from 'lucide-react';

export default function TableDemoPage() {
    const { tableLibrary } = useDocumentStore();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center space-y-4">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                                Live Table Library Demo
                            </h1>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Experience real-time table library switching in ATOMS.tech production environment
                            </p>
                        </div>
                        <div className="flex justify-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Live Switching
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                <Database className="h-3 w-3 mr-1" />
                                Production Ready
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Full Feature Parity
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                
                {/* Current Implementation Status */}
                <Card className="border bg-card text-card-foreground shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 font-semibold leading-none tracking-tight">
                            <Settings className="h-5 w-5" />
                            Current Table Implementation
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Switch between table libraries and see changes applied instantly across the application
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                            <div className="space-y-1">
                                <span className="font-medium text-foreground">Active Implementation:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-lg text-primary">{tableLibrary}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {tableLibrary === 'default' ? 'Stable' : 
                                         tableLibrary === 'tanstack' ? 'Stable' : 'Beta'}
                                    </Badge>
                                </div>
                            </div>
                            <TableLibrarySelector />
                        </div>
                    </CardContent>
                </Card>

                {/* How It Works */}
                <Card className="border bg-card text-card-foreground shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="font-semibold leading-none tracking-tight">
                            How Live Table Switching Works
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Understanding the implementation and benefits
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">1</span>
                                    </div>
                                    <h3 className="font-semibold">Global State Management</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Table library selection is stored in Zustand global state, ensuring consistency across all components.
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">2</span>
                                    </div>
                                    <h3 className="font-semibold">Dynamic Component Loading</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    TableBlockContent dynamically selects the appropriate table component based on the current library setting.
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">3</span>
                                    </div>
                                    <h3 className="font-semibold">Instant Updates</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Changes apply immediately without page refresh, maintaining user data and state.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Available Implementations */}
                <Card className="border bg-card text-card-foreground shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="font-semibold leading-none tracking-tight">
                            Available Table Implementations
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Choose the implementation that best fits your needs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className={`p-4 transition-all ${tableLibrary === 'default' ? 'ring-2 ring-primary bg-primary/5' : 'bg-muted/50'}`}>
                                <h3 className="font-semibold mb-2 text-foreground">Default Table</h3>
                                <p className="text-sm text-muted-foreground mb-3">Lightweight custom implementation</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs">~12kB</Badge>
                                        <Badge variant="secondary" className="text-xs">Stable</Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ✓ Basic editing • ✓ Sorting • ✓ Filtering
                                    </div>
                                </div>
                            </Card>
                            
                            <Card className={`p-4 transition-all ${tableLibrary === 'tanstack' ? 'ring-2 ring-primary bg-primary/5' : 'bg-muted/50'}`}>
                                <h3 className="font-semibold mb-2 text-foreground">TanStack Table</h3>
                                <p className="text-sm text-muted-foreground mb-3">Powerful headless table</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs">~45kB</Badge>
                                        <Badge variant="default" className="text-xs">Recommended</Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ✓ Advanced sorting • ✓ Virtualization • ✓ TypeScript
                                    </div>
                                </div>
                            </Card>
                            
                            <Card className={`p-4 transition-all ${tableLibrary === 'mantine' ? 'ring-2 ring-primary bg-primary/5' : 'bg-muted/50'}`}>
                                <h3 className="font-semibold mb-2 text-foreground">Mantine Table</h3>
                                <p className="text-sm text-muted-foreground mb-3">Feature-rich with clean design</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs">~48kB</Badge>
                                        <Badge variant="secondary" className="text-xs">Beta</Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ✓ Inline editing • ✓ Export • ✓ Clean design
                                    </div>
                                </div>
                            </Card>
                            
                            <Card className={`p-4 transition-all ${tableLibrary === 'material-ui' ? 'ring-2 ring-primary bg-primary/5' : 'bg-muted/50'}`}>
                                <h3 className="font-semibold mb-2 text-foreground">Material-UI Table</h3>
                                <p className="text-sm text-muted-foreground mb-3">Comprehensive Material Design</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs">~60kB</Badge>
                                        <Badge variant="secondary" className="text-xs">Beta</Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ✓ Full features • ✓ Material design • ✓ Accessibility
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="border bg-card text-card-foreground shadow">
                    <CardHeader className="pb-4">
                        <CardTitle className="font-semibold leading-none tracking-tight">
                            Try It Live
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                            Experience the table library switching in real ATOMS.tech documents
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                <FileSpreadsheet className="h-5 w-5 text-primary" />
                                <div className="flex-1">
                                    <h4 className="font-medium">Document Tables</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Open any document with tables to see live switching in action
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                                <Settings className="h-5 w-5 text-primary" />
                                <div className="flex-1">
                                    <h4 className="font-medium">Global Settings</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Use the sidebar selector to change table library globally
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
