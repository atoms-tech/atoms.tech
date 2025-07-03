'use client';

import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    Clock,
    Code,
    Download,
    FileText,
    Lock,
    Monitor,
    Settings,
    Shield,
    TrendingUp,
    Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

interface ComplianceSummary {
    totalControls: number;
    compliantControls: number;
    nonCompliantControls: number;
    inProgressControls: number;
    notAssessedControls: number;
    compliancePercentage: number;
    riskScore: number;
    lastUpdated: string;
}

interface Control {
    id: string;
    name: string;
    description: string;
    family: string;
    status: 'compliant' | 'non_compliant' | 'in_progress' | 'not_assessed';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    lastAssessed: string;
    nextAssessment: string;
    evidence: string[];
    issues: Issue[];
}

interface Issue {
    id: string;
    controlId: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
    createdAt: string;
    resolvedAt?: string;
    assignee?: string;
}

interface AuditEvent {
    id: string;
    timestamp: string;
    eventType: string;
    userId?: string;
    resource: string;
    action: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

export default function SOC2Dashboard() {
    const [summary, setSummary] = useState<ComplianceSummary | null>(null);
    const [controls, setControls] = useState<Control[]>([]);
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch compliance summary
            const summaryResponse = await fetch('/api/soc2/summary');
            const summaryData = await summaryResponse.json();

            if (summaryData.success) {
                setSummary(summaryData.data);
            }

            // Fetch controls
            const controlsResponse = await fetch('/api/soc2/controls');
            const controlsData = await controlsResponse.json();

            if (controlsData.success) {
                setControls(controlsData.data);
            }

            // Fetch audit events
            const auditResponse = await fetch(
                '/api/soc2/audit-events?limit=10',
            );
            const auditData = await auditResponse.json();

            if (auditData.success) {
                setAuditEvents(auditData.data);
            }
        } catch (err) {
            setError('Failed to load dashboard data');
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'compliant':
                return 'bg-green-500';
            case 'non_compliant':
                return 'bg-red-500';
            case 'in_progress':
                return 'bg-yellow-500';
            case 'not_assessed':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low':
                return 'text-green-500';
            case 'medium':
                return 'text-yellow-500';
            case 'high':
                return 'text-orange-500';
            case 'critical':
                return 'text-red-500';
            default:
                return 'text-muted-foreground';
        }
    };

    const getFamilyIcon = (family: string) => {
        switch (family) {
            case 'CC1':
                return <Users className="h-4 w-4" />;
            case 'CC2':
                return <FileText className="h-4 w-4" />;
            case 'CC3':
                return <AlertTriangle className="h-4 w-4" />;
            case 'CC4':
                return <Activity className="h-4 w-4" />;
            case 'CC5':
                return <Settings className="h-4 w-4" />;
            case 'CC6':
                return <Lock className="h-4 w-4" />;
            case 'CC7':
                return <Monitor className="h-4 w-4" />;
            case 'CC8':
                return <TrendingUp className="h-4 w-4" />;
            default:
                return <Shield className="h-4 w-4" />;
        }
    };

    const openImplementationModal = (feature: string) => {
        setModalFeature(feature);
        setShowImplementationModal(true);
    };

    const ImplementationBadge = ({ feature }: { feature: string }) => (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 text-xs bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100">
                    <Construction className="h-3 w-3 mr-1" />
                    Requires Implementation
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Construction className="h-5 w-5 text-amber-600" />
                        Implementation Required
                    </DialogTitle>
                    <DialogDescription>
                        This feature requires Supabase database integration to display real data.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h4 className="font-medium text-amber-800 mb-2">Feature: {feature}</h4>
                        <p className="text-sm text-amber-700 mb-3">
                            This feature currently shows mock data. To enable real-time data:
                        </p>
                        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                            <li>Set up Supabase audit logging tables</li>
                            <li>Implement real-time data synchronization</li>
                            <li>Configure proper database permissions</li>
                            <li>Add API endpoints for data retrieval</li>
                        </ul>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Database Schema Available
                        </h4>
                        <p className="text-sm text-blue-700">
                            The required database schema is already defined in the types system. 
                            Integration requires connecting to existing audit_logs and usage_logs tables.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    const DataSourceIndicator = ({ isReal, source }: { isReal: boolean; source: string }) => (
        <div className="flex items-center gap-2 text-xs">
            {isReal ? (
                <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700">Live Data: {source}</span>
                </>
            ) : (
                <>
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-amber-700">Mock Data</span>
                </>
            )}
        </div>
    );

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">
                            Loading SOC2 Dashboard...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            SOC2 Compliance Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Monitor and manage SOC2 compliance across your
                            organization
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Shield className="h-8 w-8 text-primary" />
                        <span className="text-sm text-muted-foreground">
                            Last updated:{' '}
                            {summary
                                ? new Date(summary.lastUpdated).toLocaleString()
                                : 'Never'}
                        </span>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Compliance Score
                                </CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.compliancePercentage.toFixed(1)}%
                                </div>
                                <Progress
                                    value={summary.compliancePercentage}
                                    className="mt-2"
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Risk Score
                                </CardTitle>
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.riskScore}/100
                                </div>
                                <Progress
                                    value={summary.riskScore}
                                    className="mt-2"
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Controls
                                </CardTitle>
                                <Shield className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.totalControls}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {summary.compliantControls} compliant,{' '}
                                    {summary.nonCompliantControls} non-compliant
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    In Progress
                                </CardTitle>
                                <Clock className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {summary.inProgressControls}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {summary.notAssessedControls} not assessed
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Main Content */}
                <Tabs defaultValue="controls" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="controls">Controls</TabsTrigger>
                        <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                    </TabsList>

                    <TabsContent value="controls" className="space-y-4">
                        {/* Controls Filters */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>SOC2 Controls</span>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>
                                            {controls.length} total controls
                                        </span>
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    Monitor the status of all SOC2 Trust Service
                                    Criteria controls
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Filter Bar */}
                                <div className="flex flex-wrap gap-4 mb-6 p-4 border rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            Filter by Status:
                                        </span>
                                        <div className="flex gap-2">
                                            <Badge
                                                variant="outline"
                                                className="bg-green-500/80 text-white cursor-pointer hover:bg-green-600"
                                            >
                                                Compliant (
                                                {
                                                    controls.filter(
                                                        (c) =>
                                                            c.status ===
                                                            'compliant',
                                                    ).length
                                                }
                                                )
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="bg-yellow-500/80 text-white cursor-pointer hover:bg-yellow-600"
                                            >
                                                In Progress (
                                                {
                                                    controls.filter(
                                                        (c) =>
                                                            c.status ===
                                                            'in_progress',
                                                    ).length
                                                }
                                                )
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="bg-red-500/80 text-white cursor-pointer hover:bg-red-600"
                                            >
                                                Non-Compliant (
                                                {
                                                    controls.filter(
                                                        (c) =>
                                                            c.status ===
                                                            'non_compliant',
                                                    ).length
                                                }
                                                )
                                            </Badge>
                                            <Badge
                                                variant="outline"
                                                className="bg-gray-500/80 text-white cursor-pointer hover:bg-gray-600"
                                            >
                                                Not Assessed (
                                                {
                                                    controls.filter(
                                                        (c) =>
                                                            c.status ===
                                                            'not_assessed',
                                                    ).length
                                                }
                                                )
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            Filter by Family:
                                        </span>
                                        <div className="flex gap-2">
                                            {[
                                                'CC1',
                                                'CC2',
                                                'CC3',
                                                'CC4',
                                                'CC5',
                                                'CC6',
                                                'CC7',
                                                'CC8',
                                            ].map((family) => (
                                                <Badge
                                                    key={family}
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-primary/10"
                                                >
                                                    {family} (
                                                    {
                                                        controls.filter(
                                                            (c) =>
                                                                c.family ===
                                                                family,
                                                        ).length
                                                    }
                                                    )
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {controls.map((control) => (
                                        <div
                                            key={control.id}
                                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3 flex-1">
                                                    {getFamilyIcon(
                                                        control.family,
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h3 className="font-semibold text-lg">
                                                                {control.id}
                                                            </h3>
                                                            <Badge
                                                                variant="outline"
                                                                className={`${getStatusColor(control.status)} text-white`}
                                                            >
                                                                {control.status.replace(
                                                                    '_',
                                                                    ' ',
                                                                )}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className={`${getRiskColor(control.riskLevel)} text-white`}
                                                            >
                                                                {control.riskLevel.toUpperCase()}{' '}
                                                                RISK
                                                            </Badge>
                                                        </div>
                                                        <h4 className="font-medium mb-1">
                                                            {control.name}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground mb-3">
                                                            {
                                                                control.description
                                                            }
                                                        </p>

                                                        {/* Evidence Section */}
                                                        <div className="mb-3">
                                                            <h5 className="text-xs font-medium text-gray-700 mb-1">
                                                                Evidence:
                                                            </h5>
                                                            <div className="flex flex-wrap gap-1">
                                                                {control.evidence.map(
                                                                    (
                                                                        evidence,
                                                                        index,
                                                                    ) => (
                                                                        <Badge
                                                                            key={
                                                                                index
                                                                            }
                                                                            variant="secondary"
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                evidence
                                                                            }
                                                                        </Badge>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Issues Section */}
                                                        {control.issues.length >
                                                            0 && (
                                                            <div className="mb-3 p-3 border border-red-500/20 rounded bg-red-500/5">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                                                    <p className="text-sm font-medium text-red-800">
                                                                        {
                                                                            control
                                                                                .issues
                                                                                .length
                                                                        }{' '}
                                                                        Open
                                                                        Issue
                                                                        {control
                                                                            .issues
                                                                            .length >
                                                                        1
                                                                            ? 's'
                                                                            : ''}
                                                                    </p>
                                                                </div>
                                                                {control.issues.map(
                                                                    (issue) => (
                                                                        <div
                                                                            key={
                                                                                issue.id
                                                                            }
                                                                            className="mb-2 last:mb-0"
                                                                        >
                                                                            <div className="flex items-start justify-between">
                                                                                <div className="flex-1">
                                                                                    <p className="text-sm font-medium text-red-800">
                                                                                        {
                                                                                            issue.title
                                                                                        }
                                                                                    </p>
                                                                                    <p className="text-xs text-red-600">
                                                                                        {
                                                                                            issue.description
                                                                                        }
                                                                                    </p>
                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                        <Badge
                                                                                            variant="outline"
                                                                                            className="text-xs bg-red-500/20 text-red-500"
                                                                                        >
                                                                                            {issue.severity.toUpperCase()}
                                                                                        </Badge>
                                                                                        <span className="text-xs text-red-600">
                                                                                            Assigned
                                                                                            to:{' '}
                                                                                            {
                                                                                                issue.assignee
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={`text-xs ${
                                                                                        issue.status ===
                                                                                        'open'
                                                                                            ? 'bg-red-500/20 text-red-500'
                                                                                            : issue.status ===
                                                                                                'in_progress'
                                                                                              ? 'bg-yellow-500/20 text-yellow-500'
                                                                                              : 'bg-green-500/20 text-green-500'
                                                                                    }`}
                                                                                >
                                                                                    {issue.status.replace(
                                                                                        '_',
                                                                                        ' ',
                                                                                    )}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2 mt-3">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        <FileText className="h-3 w-3 mr-1" />
                                                                        View Details
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                                                                    <DialogHeader>
                                                                        <DialogTitle className="flex items-center gap-2">
                                                                            {getFamilyIcon(control.family)}
                                                                            {control.id} - {control.name}
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            Detailed information about this SOC2 control
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4 pr-2">
                                                                        <div>
                                                                            <h4 className="font-medium mb-2">Description</h4>
                                                                            <p className="text-sm text-gray-600">{control.description}</p>
                                                                        </div>
                                                                        <Separator />
                                                                        <div>
                                                                            <h4 className="font-medium mb-2">Evidence Documentation</h4>
                                                                            <div className="space-y-2">
                                                                                {control.evidence.map((evidence, index) => (
                                                                                    <div key={index} className="flex items-center gap-2 text-sm">
                                                                                        <FileText className="h-4 w-4 text-gray-400" />
                                                                                        {evidence}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                        {control.issues.length > 0 && (
                                                                            <>
                                                                                <Separator />
                                                                                <div>
                                                                                    <h4 className="font-medium mb-2 text-red-800">Open Issues</h4>
                                                                                    <div className="space-y-2">
                                                                                        {control.issues.map((issue) => (
                                                                                            <div key={issue.id} className="p-3 border border-red-200 rounded bg-red-50">
                                                                                                <p className="font-medium text-red-800 text-sm">{issue.title}</p>
                                                                                                <p className="text-red-600 text-xs mt-1">{issue.description}</p>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                <Activity className="h-3 w-3 mr-1" />
                                                                Test Control
                                                            </Button>
                                                            {control.issues
                                                                .length > 0 && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-xs text-red-600"
                                                                >
                                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                                    Manage
                                                                    Issues
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs text-gray-500 ml-4">
                                                    <div className="space-y-1">
                                                        <p>
                                                            <span className="font-medium">
                                                                Last:
                                                            </span>{' '}
                                                            {new Date(
                                                                control.lastAssessed,
                                                            ).toLocaleDateString()}
                                                        </p>
                                                        <p>
                                                            <span className="font-medium">
                                                                Next:
                                                            </span>{' '}
                                                            {new Date(
                                                                control.nextAssessment,
                                                            ).toLocaleDateString()}
                                                        </p>
                                                        <div className="mt-2 pt-2 border-t">
                                                            <div
                                                                className={`text-xs px-2 py-1 rounded ${
                                                                    new Date(
                                                                        control.nextAssessment,
                                                                    ) <
                                                                    new Date()
                                                                        ? 'bg-red-500/20 text-red-500'
                                                                        : new Date(
                                                                                control.nextAssessment,
                                                                            ) <
                                                                            new Date(
                                                                                Date.now() +
                                                                                    7 *
                                                                                        24 *
                                                                                        60 *
                                                                                        60 *
                                                                                        1000,
                                                                            )
                                                                          ? 'bg-yellow-500/20 text-yellow-500'
                                                                          : 'bg-green-500/20 text-green-500'
                                                                }`}
                                                            >
                                                                {new Date(
                                                                    control.nextAssessment,
                                                                ) < new Date()
                                                                    ? 'Overdue'
                                                                    : new Date(
                                                                            control.nextAssessment,
                                                                        ) <
                                                                        new Date(
                                                                            Date.now() +
                                                                                7 *
                                                                                    24 *
                                                                                    60 *
                                                                                    60 *
                                                                                    1000,
                                                                        )
                                                                      ? 'Due Soon'
                                                                      : 'On Track'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="audit" className="space-y-4">
                        {/* Audit Trail Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="relative">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="text-2xl font-bold">
                                                {auditEvents.length}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Events Today
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="text-2xl font-bold">
                                                {
                                                    new Set(
                                                        auditEvents.map(
                                                            (e) => e.userId,
                                                        ),
                                                    ).size
                                                }
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Active Users
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                                        <div>
                                            <p className="text-2xl font-bold">
                                                {
                                                    auditEvents.filter(
                                                        (e) =>
                                                            e.eventType ===
                                                            'access_denied',
                                                    ).length
                                                }
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Access Denied
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-purple-600" />
                                        <div>
                                            <p className="text-2xl font-bold">
                                                {
                                                    auditEvents.filter(
                                                        (e) =>
                                                            e.eventType ===
                                                            'privileged_access',
                                                    ).length
                                                }
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Privileged Access
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="relative">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Audit Trail</span>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline">
                                            <Download className="h-4 w-4 mr-2" />
                                            Export CSV
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Filter
                                        </Button>
                                    </div>
                                </CardTitle>
                                <CardDescription className="flex items-center justify-between">
                                    <span>Real-time system access and change monitoring for compliance</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Event Type Filters */}
                                <div className="mb-4 p-3 border rounded-lg">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-sm font-medium">
                                            Event Types:
                                        </span>
                                        {[
                                            'user_login',
                                            'data_access',
                                            'configuration_change',
                                            'privileged_access',
                                            'access_denied',
                                        ].map((type) => (
                                            <Badge
                                                key={type}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-primary/10"
                                            >
                                                {type.replace('_', ' ')} (
                                                {
                                                    auditEvents.filter(
                                                        (e) =>
                                                            e.eventType ===
                                                            type,
                                                    ).length
                                                }
                                                )
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {auditEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3 flex-1">
                                                    <div
                                                        className={`p-2 rounded-full ${
                                                            event.eventType ===
                                                            'user_login'
                                                                ? 'bg-green-500/20'
                                                                : event.eventType ===
                                                                    'data_access'
                                                                  ? 'bg-blue-500/20'
                                                                  : event.eventType ===
                                                                      'configuration_change'
                                                                    ? 'bg-orange-500/20'
                                                                    : event.eventType ===
                                                                        'privileged_access'
                                                                      ? 'bg-purple-500/20'
                                                                      : event.eventType ===
                                                                          'access_denied'
                                                                        ? 'bg-red-500/20'
                                                                        : 'bg-muted'
                                                        }`}
                                                    >
                                                        {event.eventType ===
                                                        'user_login' ? (
                                                            <Users className="h-4 w-4 text-green-600" />
                                                        ) : event.eventType ===
                                                          'data_access' ? (
                                                            <FileText className="h-4 w-4 text-blue-600" />
                                                        ) : event.eventType ===
                                                          'configuration_change' ? (
                                                            <Settings className="h-4 w-4 text-orange-600" />
                                                        ) : event.eventType ===
                                                          'privileged_access' ? (
                                                            <Shield className="h-4 w-4 text-purple-600" />
                                                        ) : event.eventType ===
                                                          'access_denied' ? (
                                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                                        ) : (
                                                            <Activity className="h-4 w-4 text-gray-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-medium text-gray-900">
                                                                {event.eventType
                                                                    .replace(
                                                                        '_',
                                                                        ' ',
                                                                    )
                                                                    .toUpperCase()}
                                                            </h4>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {event.resource}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {event.action}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            User:{' '}
                                                            <span className="font-medium">
                                                                {event.userId}
                                                            </span>
                                                        </p>

                                                        {/* Event Details */}
                                                        {event.details &&
                                                            Object.keys(
                                                                event.details,
                                                            ).length > 0 && (
                                                                <div className="mt-2 p-2 border rounded text-xs">
                                                                    <span className="font-medium">
                                                                        Details:{' '}
                                                                    </span>
                                                                    {Object.entries(
                                                                        event.details,
                                                                    ).map(
                                                                        ([
                                                                            key,
                                                                            value,
                                                                        ]) => (
                                                                            <span
                                                                                key={
                                                                                    key
                                                                                }
                                                                                className="mr-3"
                                                                            >
                                                                                {
                                                                                    key
                                                                                }

                                                                                :{' '}
                                                                                <span className="font-medium">
                                                                                    {String(
                                                                                        value,
                                                                                    )}
                                                                                </span>
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs text-gray-500 ml-4">
                                                    <div className="space-y-1">
                                                        <p className="font-medium">
                                                            {new Date(
                                                                event.timestamp,
                                                            ).toLocaleString()}
                                                        </p>
                                                        <p>
                                                            IP:{' '}
                                                            {event.ipAddress}
                                                        </p>
                                                        {event.userAgent && (
                                                            <p
                                                                className="max-w-32 truncate"
                                                                title={
                                                                    event.userAgent
                                                                }
                                                            >
                                                                {
                                                                    event.userAgent.split(
                                                                        ' ',
                                                                    )[0]
                                                                }
                                                            </p>
                                                        )}
                                                        <div className="mt-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-xs h-6"
                                                            >
                                                                View Details
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Load More */}
                                <div className="text-center mt-6">
                                    <Button variant="outline">
                                        Load More Events
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Report Generation */}
                            <Card className="relative">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Generate Reports
                                    </CardTitle>
                                    <CardDescription className="flex items-center justify-between">
                                        <span>Create comprehensive compliance reports for auditors and stakeholders</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <Button
                                            className="w-full justify-start"
                                            variant="outline"
                                            onClick={() =>
                                                window.open(
                                                    '/api/soc2/report?format=pdf',
                                                    '_blank',
                                                )
                                            }
                                        >
                                            <FileText className="h-4 w-4 mr-2" />
                                            SOC2 Compliance Summary (PDF)
                                        </Button>
                                        <Button
                                            className="w-full justify-start"
                                            variant="outline"
                                            onClick={() =>
                                                window.open(
                                                    '/api/soc2/report?format=excel',
                                                    '_blank',
                                                )
                                            }
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Control Matrix (Excel)
                                        </Button>
                                        <Button
                                            className="w-full justify-start"
                                            variant="outline"
                                            onClick={() =>
                                                window.open(
                                                    '/api/soc2/audit-events?format=csv',
                                                    '_blank',
                                                )
                                            }
                                        >
                                            <Activity className="h-4 w-4 mr-2" />
                                            Audit Trail (CSV)
                                        </Button>
                                        <Button
                                            className="w-full justify-start"
                                            variant="outline"
                                            onClick={() =>
                                                window.open(
                                                    '/api/soc2/report?format=json',
                                                    '_blank',
                                                )
                                            }
                                        >
                                            <Code className="h-4 w-4 mr-2" />
                                            API Data Export (JSON)
                                        </Button>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <h4 className="font-medium mb-2">
                                            Custom Report Options
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="include-evidence"
                                                    className="rounded"
                                                    defaultChecked
                                                />
                                                <label
                                                    htmlFor="include-evidence"
                                                    className="text-sm"
                                                >
                                                    Include Evidence
                                                    Documentation
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="include-issues"
                                                    className="rounded"
                                                    defaultChecked
                                                />
                                                <label
                                                    htmlFor="include-issues"
                                                    className="text-sm"
                                                >
                                                    Include Open Issues
                                                </label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="include-audit"
                                                    className="rounded"
                                                />
                                                <label
                                                    htmlFor="include-audit"
                                                    className="text-sm"
                                                >
                                                    Include Audit Trail (Last 30
                                                    Days)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Report History */}
                            <Card className="relative">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5" />
                                        Recent Reports
                                    </CardTitle>
                                    <CardDescription className="flex items-center justify-between">
                                        <span>Previously generated compliance reports</span>
                                        </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    Q1 2024 SOC2 Report
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Generated on{' '}
                                                    {new Date().toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="ghost">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    Control Assessment Matrix
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Generated on{' '}
                                                    {new Date(
                                                        Date.now() - 86400000,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="ghost">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    Audit Trail Export
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Generated on{' '}
                                                    {new Date(
                                                        Date.now() - 172800000,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="ghost">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Compliance Metrics Overview */}
                        <Card className="relative">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Compliance Metrics Trends
                                </CardTitle>
                                <CardDescription className="flex items-center justify-between">
                                    <span>Historical compliance performance and trends</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            94%
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Average Compliance (6 months)
                                        </div>
                                        <div className="text-xs text-green-600 mt-1">
                                            ↗ +2.3% from last quarter
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            18
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Controls Tested (This Month)
                                        </div>
                                        <div className="text-xs text-blue-600 mt-1">
                                            → On track with schedule
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            3.2
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Avg. Issue Resolution (Days)
                                        </div>
                                        <div className="text-xs text-green-600 mt-1">
                                            ↗ 15% improvement
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">
                                        Upcoming Assessments
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>
                                                CC6.1 - Logical Access Controls
                                            </span>
                                            <span className="text-orange-600">
                                                Due in 5 days
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>
                                                CC7.2 - System Monitoring
                                            </span>
                                            <span className="text-red-600">
                                                Overdue by 2 days
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>
                                                CC3.4 - Change Assessment
                                            </span>
                                            <span className="text-green-600">
                                                Due in 12 days
                                            </span>
                                        </div>
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
