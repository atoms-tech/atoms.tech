'use client';

import { Card } from '@/components/ui/card';
import { BlockCanvas } from '@/components/custom/BlockCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MonospaceTable } from '@/components/base/MonospaceTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Users, GitBranch, Activity, FileText, ListTodo, BarChart3, Layout } from 'lucide-react';
import { useDocumentStore } from '@/lib/store/document.store';
import { useMemo } from 'react';
import type { Column } from '@/components/base/DashboardView';
import type { Requirement } from '@/types/base/requirements.types';

// Mock document data
const documentInfo = {
  name: 'System Requirements Specification',
  description: 'Core system requirements and specifications for the project',
  version: '1.0.0',
  status: 'in_progress',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'John Doe',
  collaborators: ['John Doe', 'Jane Smith', 'Bob Wilson'],
  tags: ['backend', 'core', 'v1'],
};

export default function TestPage() {
  const { blocks } = useDocumentStore();

  // Aggregate all requirements from all table blocks
  const allRequirements = useMemo(() => {
    return blocks
      .filter(block => block.type === 'table')
      .flatMap(block => {
        const content = block.content as { requirements: Requirement[] };
        return content?.requirements || [];
      });
  }, [blocks]);

  // Calculate some statistics
  const stats = useMemo(() => {
    const totalReqs = allRequirements.length;
    const completedReqs = allRequirements.filter(req => req.status === 'active').length;
    const highPriority = allRequirements.filter(req => req.priority === 'high').length;
    
    return {
      total: totalReqs,
      completed: completedReqs,
      completion: totalReqs ? Math.round((completedReqs / totalReqs) * 100) : 0,
      highPriority,
    };
  }, [allRequirements]);

  // Columns for the requirements list view
  const requirementColumns: Column<Requirement>[] = [
    {
      header: 'Name',
      accessor: (req) => req.name,
      width: 30,
    },
    {
      header: 'Description',
      accessor: (req) => req.description || '',
      width: 40,
    },
    {
      header: 'Priority',
      accessor: (req) => req.priority,
      width: 10,
      renderCell: (req) => (
        <Badge variant={req.priority === 'high' ? 'destructive' : req.priority === 'medium' ? 'default' : 'secondary'}>
          {req.priority}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: (req) => req.status,
      width: 10,
      renderCell: (req) => (
        <Badge variant={req.status === 'active' ? 'default' : 'secondary'}>
          {req.status}
        </Badge>
      ),
    },
    {
      header: 'Format',
      accessor: (req) => req.format,
      width: 10,
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Document Header */}
      <Card className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{documentInfo.name}</h1>
            <p className="text-muted-foreground mt-1">{documentInfo.description}</p>
            <div className="flex gap-2 mt-4">
              {documentInfo.tags.map((tag) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GitBranch className="h-4 w-4" />
              <span>Version {documentInfo.version}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>Updated {new Date(documentInfo.updated_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{documentInfo.collaborators.length} collaborators</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Requirements</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{stats.completion}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{stats.highPriority}</div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <ListTodo className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Active Requirements</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="canvas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="canvas" className="gap-2">
              <Layout className="h-4 w-4" />
              Canvas
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <FileText className="h-4 w-4" />
              Requirements List
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="canvas" className="space-y-4">
            <BlockCanvas />
          </TabsContent>

          <TabsContent value="list">
            <MonospaceTable
              data={allRequirements}
              columns={requirementColumns}
              showFilter={true}
              emptyMessage="No requirements found. Add some using the Canvas view."
            />
          </TabsContent>

          <TabsContent value="tasks">
            <div className="text-center text-muted-foreground py-8">
              Tasks view coming soon...
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center text-muted-foreground py-8">
              Analytics view coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
} 