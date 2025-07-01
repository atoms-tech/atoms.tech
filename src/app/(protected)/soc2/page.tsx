'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download,
  Users,
  Database,
  Lock,
  Activity
} from 'lucide-react';
import { SOC2Summary, SOC2Control, SOC2AuditEvent } from '@/lib/soc2/complianceService';

export default function SOC2DashboardPage() {
  const [summary, setSummary] = useState<SOC2Summary | null>(null);
  const [controls, setControls] = useState<SOC2Control[]>([]);
  const [auditEvents, setAuditEvents] = useState<SOC2AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, controlsRes, auditRes] = await Promise.all([
        fetch('/api/soc2/summary'),
        fetch('/api/soc2/controls'),
        fetch('/api/soc2/audit-events?limit=20'),
      ]);

      const summaryData = await summaryRes.json();
      const controlsData = await controlsRes.json();
      const auditData = await auditRes.json();

      setSummary(summaryData);
      setControls(controlsData);
      setAuditEvents(auditData);
    } catch (error) {
      console.error('Failed to fetch SOC2 data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (format: string) => {
    try {
      const response = await fetch('/api/soc2/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });

      const result = await response.json();
      if (result.success && result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-b border-gray-800">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative container mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="h-12 w-12 text-blue-400" />
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-wider">
                SOC2 COMPLIANCE DASHBOARD
              </h1>
              <p className="text-xl text-gray-300 mt-2">
                Enterprise-Grade Security & Compliance Monitoring
              </p>
            </div>
          </div>
          
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-sm font-medium uppercase tracking-wide">
                        Overall Score
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {summary.overallScore}%
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm font-medium uppercase tracking-wide">
                        Compliant Controls
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {summary.compliantControls}/{summary.totalControls}
                      </p>
                    </div>
                    <Database className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-300 text-sm font-medium uppercase tracking-wide">
                        Critical Issues
                      </p>
                      <p className="text-3xl font-bold text-white">
                        {summary.criticalIssues}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm font-medium uppercase tracking-wide">
                        Next Assessment
                      </p>
                      <p className="text-lg font-bold text-white">
                        {new Date(summary.nextAssessment).toLocaleDateString()}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="controls" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="controls" className="data-[state=active]:bg-blue-600">
              Controls
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-blue-600">
              Audit Trail
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="space-y-6">
            <div className="grid gap-6">
              {controls.map((control) => (
                <Card key={control.id} className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{control.id} - {control.title}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {control.family}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={control.status === 'compliant' ? 'default' : 'destructive'}
                          className={
                            control.status === 'compliant' 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : control.status === 'in-progress'
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-red-600 hover:bg-red-700'
                          }
                        >
                          {control.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          {control.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">{control.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Last Assessed</p>
                        <p className="text-white">{new Date(control.lastAssessed).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Next Assessment</p>
                        <p className="text-white">{new Date(control.nextAssessment).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Assignee</p>
                        <p className="text-white">{control.assignee}</p>
                      </div>
                    </div>
                    {control.issues.length > 0 && (
                      <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded">
                        <h4 className="text-red-300 font-medium mb-2">Open Issues</h4>
                        {control.issues.map((issue) => (
                          <div key={issue.id} className="text-sm text-gray-300">
                            <span className="font-medium">{issue.title}</span> - {issue.description}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Audit Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-gray-800 rounded border border-gray-700">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className={`border-${event.category === 'security' ? 'red' : 'blue'}-500 text-${event.category === 'security' ? 'red' : 'blue'}-300`}
                          >
                            {event.category.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-white font-medium">{event.event}</p>
                        <p className="text-gray-400 text-sm">{event.details}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          User: {event.user} | IP: {event.ipAddress}
                        </p>
                      </div>
                      <Badge 
                        variant={event.riskLevel === 'high' ? 'destructive' : 'secondary'}
                        className={
                          event.riskLevel === 'high' 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : event.riskLevel === 'medium'
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }
                      >
                        {event.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Generate Compliance Reports
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Export comprehensive compliance reports in various formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => generateReport('pdf')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF Report
                  </Button>
                  <Button 
                    onClick={() => generateReport('excel')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel Report
                  </Button>
                  <Button 
                    onClick={() => generateReport('csv')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV Export
                  </Button>
                  <Button 
                    onClick={() => generateReport('json')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    JSON Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
