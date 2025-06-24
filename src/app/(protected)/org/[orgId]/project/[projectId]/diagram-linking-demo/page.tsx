'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Link, 
    ExternalLink, 
    Zap, 
    Target, 
    CheckCircle, 
    AlertCircle,
    FileText,
    MousePointer,
    Search,
    Settings
} from 'lucide-react';
import ExcalidrawWithClientOnly from '@/components/custom/LandingPage/excalidrawWrapper';
import { toast } from 'sonner';

export default function DiagramLinkingDemoPage() {
    const params = useParams();
    const pathname = usePathname();
    const [activeDemo, setActiveDemo] = useState<string>('overview');
    const [demoProgress, setDemoProgress] = useState<Record<string, boolean>>({});

    const orgId = params.orgId as string;
    const projectId = params.projectId as string;

    // Demo steps tracking
    const demoSteps = [
        { id: 'right-click', title: 'Right-click Element', description: 'Right-click on any diagram element to open context menu' },
        { id: 'add-link', title: 'Add Link', description: 'Select "Add Link to Requirement" from context menu' },
        { id: 'select-req', title: 'Select Requirement', description: 'Choose a requirement from the dialog' },
        { id: 'visual-indicator', title: 'Visual Indicator', description: 'See the link indicator appear on the element' },
        { id: 'navigate', title: 'Navigate', description: 'Click the link indicator to navigate to requirement' },
        { id: 'auto-detect', title: 'Auto-detection', description: 'Add text like "REQ-001" to see auto-suggestions' },
    ];

    const markStepComplete = (stepId: string) => {
        setDemoProgress(prev => ({ ...prev, [stepId]: true }));
        toast.success(`Demo step completed: ${demoSteps.find(s => s.id === stepId)?.title}`);
    };

    // Sample requirements data for demo
    const sampleRequirements = [
        {
            id: 'req-001',
            name: 'User Authentication System',
            description: 'The system shall provide secure user authentication with multi-factor support',
            external_id: 'REQ-001',
            priority: 'high',
            status: 'approved',
        },
        {
            id: 'req-002', 
            name: 'Data Encryption',
            description: 'All sensitive data must be encrypted at rest and in transit',
            external_id: 'REQ-002',
            priority: 'critical',
            status: 'approved',
        },
        {
            id: 'req-003',
            name: 'User Interface Responsiveness',
            description: 'The UI shall be responsive and work on mobile devices',
            external_id: 'REQ-003',
            priority: 'medium',
            status: 'in_review',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Diagram Element Linking Demo
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Interactive demonstration of linking diagram elements to requirements
                    </p>
                </div>

                <Tabs value={activeDemo} onValueChange={setActiveDemo} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
                        <TabsTrigger value="features">Features</TabsTrigger>
                        <TabsTrigger value="testing">Testing Guide</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MousePointer className="w-5 h-5" />
                                        Context Menu
                                    </CardTitle>
                                    <CardDescription>
                                        Right-click any diagram element to access linking options
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm space-y-1">
                                        <li>• Add Link to Requirement</li>
                                        <li>• Edit existing links</li>
                                        <li>• Navigate to requirements</li>
                                        <li>• Remove links</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Search className="w-5 h-5" />
                                        Requirement Selection
                                    </CardTitle>
                                    <CardDescription>
                                        Searchable dialog for selecting requirements
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm space-y-1">
                                        <li>• Search by name or ID</li>
                                        <li>• Filter by priority/status</li>
                                        <li>• Preview requirement details</li>
                                        <li>• Quick selection</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="w-5 h-5" />
                                        Auto-detection
                                    </CardTitle>
                                    <CardDescription>
                                        Automatically detect requirement references in text
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="text-sm space-y-1">
                                        <li>• Pattern recognition (REQ-001)</li>
                                        <li>• Confidence scoring</li>
                                        <li>• Bulk link creation</li>
                                        <li>• Smart suggestions</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sample Requirements */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Sample Requirements for Demo</CardTitle>
                                <CardDescription>
                                    These requirements are available for linking in the demo
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {sampleRequirements.map(req => (
                                        <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <div className="font-medium">{req.name}</div>
                                                <div className="text-sm text-gray-600">{req.external_id}</div>
                                                <div className="text-xs text-gray-500 mt-1">{req.description}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge variant={req.priority === 'critical' ? 'destructive' : 'secondary'}>
                                                    {req.priority}
                                                </Badge>
                                                <Badge variant="outline">{req.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Interactive Demo Tab */}
                    <TabsContent value="demo" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Demo Steps */}
                            <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Demo Steps</CardTitle>
                                        <CardDescription>Follow these steps to test the linking functionality</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {demoSteps.map((step, index) => (
                                                <div key={step.id} className="flex items-start gap-3">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                                        demoProgress[step.id] 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {demoProgress[step.id] ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            index + 1
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{step.title}</div>
                                                        <div className="text-xs text-gray-600">{step.description}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <Button 
                                            onClick={() => setDemoProgress({})}
                                            variant="outline" 
                                            size="sm" 
                                            className="w-full mt-4"
                                        >
                                            Reset Progress
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Diagram Canvas */}
                            <div className="lg:col-span-3">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Interactive Diagram Canvas</CardTitle>
                                        <CardDescription>
                                            Create shapes and text, then right-click to add requirement links
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[600px] border rounded-lg overflow-hidden">
                                            <ExcalidrawWithClientOnly
                                                diagramId="demo-diagram"
                                                onDiagramSaved={() => {}}
                                                onDiagramNameChange={() => {}}
                                                onDiagramIdChange={() => {}}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Features Tab */}
                    <TabsContent value="features" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Core Features
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Right-click context menu for elements
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Searchable requirement selection dialog
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Visual indicators for linked elements
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Click-to-navigate functionality
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Link management (edit/remove)
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Zap className="w-5 h-5" />
                                        Advanced Features
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Auto-detection of requirement patterns
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Bulk link creation from suggestions
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Link statistics and analytics
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Persistent link storage
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            Mobile-responsive interface
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Testing Guide Tab */}
                    <TabsContent value="testing" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Testing Checklist</CardTitle>
                                <CardDescription>
                                    Comprehensive testing scenarios for the diagram linking feature
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-medium mb-3">Basic Functionality</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li>□ Right-click shows context menu</li>
                                            <li>□ Context menu has correct options</li>
                                            <li>□ Requirement dialog opens and closes</li>
                                            <li>□ Search functionality works</li>
                                            <li>□ Link creation succeeds</li>
                                            <li>□ Visual indicators appear</li>
                                            <li>□ Navigation works correctly</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-3">Advanced Testing</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li>□ Auto-detection finds patterns</li>
                                            <li>□ Bulk operations work</li>
                                            <li>□ Link editing functions</li>
                                            <li>□ Link removal works</li>
                                            <li>□ Performance with many elements</li>
                                            <li>□ Mobile responsiveness</li>
                                            <li>□ Error handling</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
