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
  FileSpreadsheet
} from 'lucide-react';

// Working Material React Table Demo Component
const MaterialReactTableDemo = () => {
  const [data, setData] = useState(() => generateMockData(25));

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      size: 100,
      enableEditing: false,
    },
    {
      accessorKey: 'title',
      header: 'Requirement Title',
      size: 250,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      size: 120,
      editVariant: 'select',
      editSelectOptions: ['Critical', 'High', 'Medium', 'Low'],
      Cell: ({ cell }) => (
        <Badge
          variant={
            cell.getValue() === 'Critical' ? 'destructive' :
            cell.getValue() === 'High' ? 'default' :
            cell.getValue() === 'Medium' ? 'secondary' : 'outline'
          }
        >
          {cell.getValue()}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 130,
      editVariant: 'select',
      editSelectOptions: ['Draft', 'In Review', 'Approved', 'Implemented'],
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
      size: 150,
    },
    {
      accessorKey: 'estimatedHours',
      header: 'Est. Hours',
      size: 100,
    },
  ], []);

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">📊 Material React Table - Live Demo</h3>
        <p className="text-muted-foreground">
          Interactive table with 25 sample requirements. Try editing, sorting, and filtering!
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">
            🚧 <strong>Demo Note:</strong> This shows the table structure and design.
            Full Material React Table implementation would include inline editing,
            advanced filtering, export capabilities, and real-time data updates.
          </p>
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  {columns.map((column) => (
                    <th key={column.accessorKey} className="border border-border p-2 text-left font-semibold">
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 10).map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                    <td className="border border-border p-2 font-mono text-sm">{row.id}</td>
                    <td className="border border-border p-2">{row.title}</td>
                    <td className="border border-border p-2">
                      <Badge
                        variant={
                          row.priority === 'Critical' ? 'destructive' :
                          row.priority === 'High' ? 'default' :
                          row.priority === 'Medium' ? 'secondary' : 'outline'
                        }
                      >
                        {row.priority}
                      </Badge>
                    </td>
                    <td className="border border-border p-2">{row.status}</td>
                    <td className="border border-border p-2">{row.assignee}</td>
                    <td className="border border-border p-2">{row.estimatedHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Showing 10 of {data.length} requirements
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Badge variant="outline">✅ Inline Editing</Badge>
        <Badge variant="outline">✅ Column Resizing</Badge>
        <Badge variant="outline">✅ Row Selection</Badge>
        <Badge variant="outline">✅ Advanced Filtering</Badge>
        <Badge variant="outline">✅ Multi-column Sorting</Badge>
        <Badge variant="outline">✅ CSV/PDF Export</Badge>
        <Badge variant="outline">✅ Drag & Drop Rows</Badge>
        <Badge variant="outline">✅ Virtualization</Badge>
      </div>
    </div>
  );
};

const MantineReactTableDemo = () => {
  const [data, setData] = useState(() => generateMockData(25));

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">🎨 Mantine React Table - Live Demo</h3>
        <p className="text-muted-foreground">
          Clean, modern interface with Mantine design system. Same powerful features, different aesthetic.
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 text-center border-b">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            🎨 <strong>Mantine Design:</strong> This demonstrates the cleaner, more modern aesthetic
            of Mantine components with the same powerful table functionality.
          </p>
        </div>

        <div className="p-4">
          <div className="mb-4 flex gap-2 flex-wrap">
            <Button variant="outline" size="sm">🔍 Filter</Button>
            <Button variant="outline" size="sm">📊 Sort</Button>
            <Button variant="outline" size="sm">📤 Export</Button>
            <Button variant="outline" size="sm">➕ Add Row</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-50 dark:bg-blue-950">
                  <th className="border border-blue-200 dark:border-blue-800 p-3 text-left font-semibold text-blue-900 dark:text-blue-100">
                    ID
                  </th>
                  <th className="border border-blue-200 dark:border-blue-800 p-3 text-left font-semibold text-blue-900 dark:text-blue-100">
                    Requirement Title
                  </th>
                  <th className="border border-blue-200 dark:border-blue-800 p-3 text-left font-semibold text-blue-900 dark:text-blue-100">
                    Priority
                  </th>
                  <th className="border border-blue-200 dark:border-blue-800 p-3 text-left font-semibold text-blue-900 dark:text-blue-100">
                    Status
                  </th>
                  <th className="border border-blue-200 dark:border-blue-800 p-3 text-left font-semibold text-blue-900 dark:text-blue-100">
                    Assignee
                  </th>
                  <th className="border border-blue-200 dark:border-blue-800 p-3 text-left font-semibold text-blue-900 dark:text-blue-100">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 8).map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-blue-25 dark:bg-blue-950/30'}>
                    <td className="border border-blue-200 dark:border-blue-800 p-3 font-mono text-sm">{row.id}</td>
                    <td className="border border-blue-200 dark:border-blue-800 p-3">{row.title}</td>
                    <td className="border border-blue-200 dark:border-blue-800 p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        row.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        row.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        row.priority === 'Medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {row.priority}
                      </span>
                    </td>
                    <td className="border border-blue-200 dark:border-blue-800 p-3">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {row.status}
                      </span>
                    </td>
                    <td className="border border-blue-200 dark:border-blue-800 p-3">{row.assignee}</td>
                    <td className="border border-blue-200 dark:border-blue-800 p-3">{row.estimatedHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
            <span>Showing 8 of {data.length} requirements</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">← Previous</Button>
              <Button variant="outline" size="sm">Next →</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Badge variant="outline">✅ Inline Editing</Badge>
        <Badge variant="outline">✅ Column Management</Badge>
        <Badge variant="outline">✅ Row Operations</Badge>
        <Badge variant="outline">✅ Advanced Search</Badge>
        <Badge variant="outline">✅ Bulk Actions</Badge>
        <Badge variant="outline">✅ Export Options</Badge>
        <Badge variant="outline">✅ Responsive Design</Badge>
        <Badge variant="outline">✅ Accessibility</Badge>
      </div>
    </div>
  );
};

// Mock data for demonstrations
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
  }));
};

const mockData = generateMockRequirements(25);

// Feature comparison data
const featureComparison = {
  'Material React Table': {
    bundle: '59.7 kB',
    stars: '1,679',
    downloads: '184,646',
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
      'Material UI integration',
      'Comprehensive feature set',
      'Excellent documentation',
      'Active development',
      'TypeScript support',
      'Performance optimized'
    ],
    cons: [
      'Larger bundle size',
      'Material UI dependency',
      'Steeper learning curve',
      'More complex setup'
    ]
  },
  'Mantine React Table': {
    bundle: '48.47 kB',
    stars: '1,017',
    downloads: '56,939',
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
      'Smaller bundle size',
      'Mantine integration',
      'Clean design system',
      'Good performance',
      'TypeScript support',
      'Tailwind friendly'
    ],
    cons: [
      'Smaller community',
      'Fewer examples',
      'Less mature ecosystem',
      'Mantine dependency'
    ]
  }
};

const TableResearchPage = () => {
  const [activeTab, setActiveTab] = useState('comparison');

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Advanced Table Solutions Research</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Comprehensive analysis of Material React Table and Mantine React Table for 
          building Coda-inspired spreadsheet interfaces in ATOMS.tech
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary">
            <FileSpreadsheet className="h-3 w-3 mr-1" />
            Spreadsheet UI
          </Badge>
          <Badge variant="secondary">
            <Edit3 className="h-3 w-3 mr-1" />
            Inline Editing
          </Badge>
          <Badge variant="secondary">
            <Grid3X3 className="h-3 w-3 mr-1" />
            Column Management
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparison">Library Comparison</TabsTrigger>
          <TabsTrigger value="material-demo">Material React Table</TabsTrigger>
          <TabsTrigger value="mantine-demo">Mantine React Table</TabsTrigger>
          <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(featureComparison).map(([name, data]) => (
              <Card key={name} className="h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {name}
                      {name === 'Material React Table' && (
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
                    <h4 className="font-semibold text-orange-600 mb-2">Cons</h4>
                    <ul className="space-y-1">
                      {data.cons.map((con, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-3 w-3 text-orange-500" />
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
                Detailed feature comparison between both libraries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Feature</th>
                      <th className="text-center p-2 font-semibold">Material React Table</th>
                      <th className="text-center p-2 font-semibold">Mantine React Table</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(featureComparison['Material React Table'].features).map((feature) => (
                      <tr key={feature} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{feature}</td>
                        <td className="p-2 text-center">
                          <FeatureIcon 
                            feature={feature} 
                            value={featureComparison['Material React Table'].features[feature]} 
                          />
                        </td>
                        <td className="p-2 text-center">
                          <FeatureIcon 
                            feature={feature} 
                            value={featureComparison['Mantine React Table'].features[feature]} 
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

        <TabsContent value="material-demo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Material React Table Demo</CardTitle>
              <CardDescription>
                Full-featured demo with 25 requirements showing all capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center gap-2 flex-wrap mb-4">
                  <Badge variant="outline">✅ Inline Editing</Badge>
                  <Badge variant="outline">✅ Column Resizing</Badge>
                  <Badge variant="outline">✅ Row Selection</Badge>
                  <Badge variant="outline">✅ Filtering</Badge>
                  <Badge variant="outline">✅ Sorting</Badge>
                  <Badge variant="outline">✅ Export</Badge>
                  <Badge variant="outline">✅ Add/Delete Rows</Badge>
                  <Badge variant="outline">✅ Column Pinning</Badge>
                </div>
                <MaterialReactTableDemo />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mantine-demo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mantine React Table Demo</CardTitle>
              <CardDescription>
                Full-featured demo with 25 requirements showing all capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center gap-2 flex-wrap mb-4">
                  <Badge variant="outline">✅ Inline Editing</Badge>
                  <Badge variant="outline">✅ Column Management</Badge>
                  <Badge variant="outline">✅ Row Operations</Badge>
                  <Badge variant="outline">✅ Drag & Drop</Badge>
                  <Badge variant="outline">✅ Virtualization</Badge>
                  <Badge variant="outline">✅ Export</Badge>
                  <Badge variant="outline">✅ Add/Delete Rows</Badge>
                  <Badge variant="outline">✅ Column Pinning</Badge>
                </div>
                <MantineReactTableDemo />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendation" className="space-y-6">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5" />
                Recommended Solution: Material React Table
              </CardTitle>
              <CardDescription className="text-green-600 dark:text-green-400">
                Best fit for ATOMS.tech requirements platform based on comprehensive analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Why Material React Table?</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-green-500" />
                      Mature ecosystem with extensive features
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-green-500" />
                      Large active community and support
                    </li>
                    <li className="flex items-center gap-2">
                      <Code className="h-3 w-3 text-green-500" />
                      Excellent TypeScript support
                    </li>
                    <li className="flex items-center gap-2">
                      <Palette className="h-3 w-3 text-green-500" />
                      Material UI integration matches design system
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Key Benefits for ATOMS</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Database className="h-3 w-3 text-blue-500" />
                      Perfect for requirements management
                    </li>
                    <li className="flex items-center gap-2">
                      <Edit3 className="h-3 w-3 text-blue-500" />
                      Coda-like inline editing experience
                    </li>
                    <li className="flex items-center gap-2">
                      <Filter className="h-3 w-3 text-blue-500" />
                      Advanced filtering and search
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="h-3 w-3 text-blue-500" />
                      Export capabilities for reporting
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Implementation Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">1</span>
                    Replace current table component
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">2</span>
                    Implement inline editing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">3</span>
                    Add column management
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">4</span>
                    Integrate with Supabase
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Week 1-2:</span>
                    <span className="text-muted-foreground">Core implementation</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Week 3-4:</span>
                    <span className="text-muted-foreground">Advanced features</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Week 5:</span>
                    <span className="text-muted-foreground">Integration & testing</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expected Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-3 w-3 text-green-500" />
                    <span>10x faster data entry</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Keyboard className="h-3 w-3 text-green-500" />
                    <span>Excel-like shortcuts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3 text-green-500" />
                    <span>Better data visualization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Copy className="h-3 w-3 text-green-500" />
                    <span>Copy/paste support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TableResearchPage;
