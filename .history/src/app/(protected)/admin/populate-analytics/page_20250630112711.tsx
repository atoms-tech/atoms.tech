'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Database, BarChart3, Activity } from 'lucide-react';

export default function PopulateAnalyticsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [orgId, setOrgId] = useState('46bddba6-f612-4bb8-b5d0-5b0be00c945c'); // Default to Demo Organization
    const [projectId, setProjectId] = useState('');
    const [daysBack, setDaysBack] = useState(30);
    const [activitiesPerDay, setActivitiesPerDay] = useState(20);
    const [result, setResult] = useState<any>(null);
    const { toast } = useToast();

    const handlePopulate = async () => {
        if (!orgId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Organization ID is required'
            });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/populate-analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orgId,
                    projectId: projectId || undefined,
                    daysBack,
                    activitiesPerDay
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to populate analytics data');
            }

            setResult(data);
            toast({
                variant: 'default',
                title: 'Success!',
                description: data.message
            });

        } catch (error) {
            console.error('Error:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to populate analytics data'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center space-x-2">
                <Database className="w-6 h-6" />
                <h1 className="text-3xl font-bold">Populate Analytics Data</h1>
            </div>
            
            <p className="text-muted-foreground">
                This tool generates realistic audit log entries to populate the analytics dashboard with sample data.
                It creates various types of activities (created, updated, viewed, etc.) spread across the specified time period.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5" />
                        <span>Configuration</span>
                    </CardTitle>
                    <CardDescription>
                        Configure the parameters for generating analytics data
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="orgId">Organization ID *</Label>
                            <Input
                                id="orgId"
                                value={orgId}
                                onChange={(e) => setOrgId(e.target.value)}
                                placeholder="46bddba6-f612-4bb8-b5d0-5b0be00c945c"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="projectId">Project ID (optional)</Label>
                            <Input
                                id="projectId"
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                placeholder="Leave empty for all projects"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="daysBack">Days Back</Label>
                            <Input
                                id="daysBack"
                                type="number"
                                value={daysBack}
                                onChange={(e) => setDaysBack(parseInt(e.target.value) || 30)}
                                min="1"
                                max="365"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="activitiesPerDay">Activities Per Day</Label>
                            <Input
                                id="activitiesPerDay"
                                type="number"
                                value={activitiesPerDay}
                                onChange={(e) => setActivitiesPerDay(parseInt(e.target.value) || 20)}
                                min="1"
                                max="100"
                            />
                        </div>
                    </div>
                    
                    <Button 
                        onClick={handlePopulate} 
                        disabled={isLoading || !orgId}
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Populating Analytics Data...
                            </>
                        ) : (
                            <>
                                <Activity className="w-4 h-4 mr-2" />
                                Populate Analytics Data
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {result && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600">Success!</CardTitle>
                        <CardDescription>Analytics data has been populated</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p><strong>Message:</strong> {result.message}</p>
                            
                            {result.details && (
                                <div className="mt-4">
                                    <h4 className="font-semibold mb-2">Details:</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>Organization ID: {result.details.orgId}</div>
                                        <div>Project ID: {result.details.projectId || 'All projects'}</div>
                                        <div>Days Back: {result.details.daysBack}</div>
                                        <div>Activities Per Day: {result.details.activitiesPerDay}</div>
                                        <div>Documents Found: {result.details.documentsFound}</div>
                                        <div>Blocks Found: {result.details.blocksFound}</div>
                                        <div>Users Found: {result.details.usersFound}</div>
                                        <div>Timestamps Generated: {result.details.timestampsGenerated}</div>
                                        <div>Audit Logs Created: {result.details.auditLogsCreated}</div>
                                        <div>Audit Logs Inserted: {result.details.auditLogsInserted}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                            <p className="text-green-800 font-medium">
                                🎉 Analytics data has been populated! You can now visit the analytics pages to see real data:
                            </p>
                            <ul className="mt-2 space-y-1 text-green-700">
                                <li>• <a href={`/org/${orgId}/analytics`} className="underline hover:text-green-900">Organization Analytics</a></li>
                                {result.details?.projectId && (
                                    <li>• <a href={`/org/${orgId}/project/${result.details.projectId}/analytics`} className="underline hover:text-green-900">Project Analytics</a></li>
                                )}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Activity Types Generated</CardTitle>
                    <CardDescription>The following types of activities will be created</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>• Created (20%)</div>
                        <div>• Updated (50%)</div>
                        <div>• Viewed (30%)</div>
                        <div>• Deleted (5%)</div>
                        <div>• Restored (3%)</div>
                        <div>• Duplicated (8%)</div>
                        <div>• Shared (10%)</div>
                        <div>• Exported (7%)</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
