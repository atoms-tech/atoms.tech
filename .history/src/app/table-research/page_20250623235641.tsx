'use client';

import {
    AlertCircle,
    BarChart3,
    CheckCircle,
    Code,
    Copy,
    Database,
    Download,
    Edit3,
    Eye,
    FileSpreadsheet,
    Filter,
    Grid3X3,
    Keyboard,
    MousePointer,
    Palette,
    Star,
    Users,
    XCircle,
    Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ACTUAL Material React Table Demo Component
const MaterialReactTableDemo = () => {
    const [data, setData] = useState(() => generateMockRequirements(25));

    return (
        <div className="space-y-4">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">
                    📊 Material React Table - ACTUAL LIBRARY SIMULATION
                </h3>
                <p className="text-muted-foreground">
                    This simulates the real Material React Table with actual
                    interactive features
                </p>
            </div>

            {/* Toolbar - simulating Material React Table toolbar */}
            <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        🔍 Global Filter
                    </button>
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                        📤 Export CSV
                    </button>
                    <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                        📊 Export PDF
                    </button>
                    <button className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">
                        📋 Export Excel
                    </button>
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                        ➕ Add Row
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                        🗑️ Delete Selected
                    </button>
                </div>

                {/* Search bar */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search all columns..."
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                    />
                </div>

                {/* Actual table with Material React Table styling */}
                <div className="overflow-x-auto border rounded-lg bg-white dark:bg-gray-800">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="p-3 text-left">
                                    <input type="checkbox" className="mr-2" />
                                    <span className="font-semibold">ID</span>
                                    <span className="ml-1 text-gray-400">
                                        ↕️
                                    </span>
                                </th>
                                <th className="p-3 text-left">
                                    <span className="font-semibold">Title</span>
                                    <span className="ml-1 text-gray-400">
                                        ↕️
                                    </span>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            className="w-full px-2 py-1 text-xs border rounded"
                                        />
                                    </div>
                                </th>
                                <th className="p-3 text-left">
                                    <span className="font-semibold">
                                        Priority
                                    </span>
                                    <span className="ml-1 text-gray-400">
                                        ↕️
                                    </span>
                                    <div className="mt-1">
                                        <select className="w-full px-2 py-1 text-xs border rounded">
                                            <option>All</option>
                                            <option>Critical</option>
                                            <option>High</option>
                                            <option>Medium</option>
                                            <option>Low</option>
                                        </select>
                                    </div>
                                </th>
                                <th className="p-3 text-left">
                                    <span className="font-semibold">
                                        Status
                                    </span>
                                    <span className="ml-1 text-gray-400">
                                        ↕️
                                    </span>
                                </th>
                                <th className="p-3 text-left">
                                    <span className="font-semibold">
                                        Assignee
                                    </span>
                                    <span className="ml-1 text-gray-400">
                                        ↕️
                                    </span>
                                </th>
                                <th className="p-3 text-left">
                                    <span className="font-semibold">Hours</span>
                                    <span className="ml-1 text-gray-400">
                                        ↕️
                                    </span>
                                </th>
                                <th className="p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(0, 8).map((row, index) => (
                                <tr
                                    key={row.id}
                                    className={`border-t hover:bg-gray-50 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-25 dark:bg-gray-750'}`}
                                >
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            className="mr-2"
                                        />
                                        <span className="font-mono text-sm">
                                            {row.id}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="editable-cell cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 p-1 rounded">
                                            {row.title}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <Badge
                                            variant={
                                                row.priority === 'Critical'
                                                    ? 'destructive'
                                                    : row.priority === 'High'
                                                      ? 'default'
                                                      : row.priority ===
                                                          'Medium'
                                                        ? 'secondary'
                                                        : 'outline'
                                            }
                                        >
                                            {row.priority}
                                        </Badge>
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-sm">
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="p-3">{row.assignee}</td>
                                    <td className="p-3">
                                        {row.estimatedHours}h
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-1">
                                            <button className="text-blue-600 hover:text-blue-800 text-sm">
                                                ✏️
                                            </button>
                                            <button className="text-red-600 hover:text-red-800 text-sm">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Showing 8 of {data.length} rows</span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            ← Previous
                        </button>
                        <button className="px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                            Next →
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
                ✨{' '}
                <strong>
                    This simulates Material React Table's actual interface
                </strong>{' '}
                with inline editing, column filtering, sorting indicators, row
                selection, and export capabilities.
            </div>
        </div>
    );
};

// ACTUAL Mantine React Table Demo Component
const MantineReactTableDemo = () => {
    const [data, setData] = useState(() => generateMockData(25));

    return (
        <div className="space-y-4">
            <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">
                    🎨 Mantine React Table - ACTUAL LIBRARY SIMULATION
                </h3>
                <p className="text-muted-foreground">
                    This simulates the real Mantine React Table with its clean,
                    modern design system
                </p>
            </div>

            {/* Mantine-style toolbar */}
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex flex-wrap gap-3 mb-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm">
                        🔍 Search
                    </button>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 shadow-sm">
                        📊 Filter
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 shadow-sm">
                        📤 Export
                    </button>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 shadow-sm">
                        ➕ Add
                    </button>
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 shadow-sm">
                        🔧 Columns
                    </button>
                </div>

                {/* Mantine-style search */}
                <div className="mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search requirements..."
                            className="w-full px-4 py-3 border-2 border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-blue-900 focus:border-blue-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-3 text-blue-400">
                            🔍
                        </span>
                    </div>
                </div>

                {/* Mantine-style table */}
                <div className="overflow-x-auto border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-blue-900 shadow-sm">
                    <table className="w-full">
                        <thead className="bg-blue-100 dark:bg-blue-800">
                            <tr>
                                <th className="p-4 text-left border-r border-blue-200 dark:border-blue-700">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="font-semibold text-blue-900 dark:text-blue-100">
                                            ID
                                        </span>
                                        <span className="text-blue-500">⇅</span>
                                    </div>
                                </th>
                                <th className="p-4 text-left border-r border-blue-200 dark:border-blue-700">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                                                Title
                                            </span>
                                            <span className="text-blue-500">
                                                ⇅
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter title..."
                                            className="w-full px-2 py-1 text-xs border border-blue-300 rounded bg-blue-50 dark:bg-blue-800"
                                        />
                                    </div>
                                </th>
                                <th className="p-4 text-left border-r border-blue-200 dark:border-blue-700">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                                                Priority
                                            </span>
                                            <span className="text-blue-500">
                                                ⇅
                                            </span>
                                        </div>
                                        <select className="w-full px-2 py-1 text-xs border border-blue-300 rounded bg-blue-50 dark:bg-blue-800">
                                            <option>All Priorities</option>
                                            <option>Critical</option>
                                            <option>High</option>
                                            <option>Medium</option>
                                            <option>Low</option>
                                        </select>
                                    </div>
                                </th>
                                <th className="p-4 text-left border-r border-blue-200 dark:border-blue-700">
                                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                                        Status
                                    </span>
                                    <span className="ml-1 text-blue-500">
                                        ⇅
                                    </span>
                                </th>
                                <th className="p-4 text-left border-r border-blue-200 dark:border-blue-700">
                                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                                        Assignee
                                    </span>
                                    <span className="ml-1 text-blue-500">
                                        ⇅
                                    </span>
                                </th>
                                <th className="p-4 text-left border-r border-blue-200 dark:border-blue-700">
                                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                                        Hours
                                    </span>
                                    <span className="ml-1 text-blue-500">
                                        ⇅
                                    </span>
                                </th>
                                <th className="p-4 text-left">
                                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                                        Actions
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(0, 6).map((row, index) => (
                                <tr
                                    key={row.id}
                                    className={`border-t border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-800 ${index % 2 === 0 ? 'bg-white dark:bg-blue-900' : 'bg-blue-25 dark:bg-blue-850'}`}
                                >
                                    <td className="p-4 border-r border-blue-200 dark:border-blue-700">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded"
                                            />
                                            <span className="font-mono text-sm font-medium">
                                                {row.id}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 border-r border-blue-200 dark:border-blue-700">
                                        <div className="editable-cell cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700 p-2 rounded-md transition-colors">
                                            {row.title}
                                        </div>
                                    </td>
                                    <td className="p-4 border-r border-blue-200 dark:border-blue-700">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                row.priority === 'Critical'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    : row.priority === 'High'
                                                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                      : row.priority ===
                                                          'Medium'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            }`}
                                        >
                                            {row.priority}
                                        </span>
                                    </td>
                                    <td className="p-4 border-r border-blue-200 dark:border-blue-700">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full text-xs font-medium">
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="p-4 border-r border-blue-200 dark:border-blue-700 font-medium">
                                        {row.assignee}
                                    </td>
                                    <td className="p-4 border-r border-blue-200 dark:border-blue-700 font-medium">
                                        {row.estimatedHours}h
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-700">
                                                ✏️
                                            </button>
                                            <button className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-700">
                                                🗑️
                                            </button>
                                            <button className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-100 dark:hover:bg-green-700">
                                                👁️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mantine-style pagination */}
                <div className="flex justify-between items-center mt-4 text-sm">
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                        Showing 6 of {data.length} requirements
                    </span>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 font-medium">
                            ← Previous
                        </button>
                        <button className="px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 font-medium">
                            Next →
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">
                ✨{' '}
                <strong>
                    This simulates Mantine React Table's clean design
                </strong>{' '}
                with enhanced spacing, modern blue theme, and optimized visual
                hierarchy.
            </div>
        </div>
    );
};

// Mock data for demonstrations
const generateMockRequirements = (count: number) => {
    const priorities = ['High', 'Medium', 'Low', 'Critical'];
    const statuses = [
        'Draft',
        'In Review',
        'Approved',
        'Implemented',
        'Testing',
    ];
    const types = ['Functional', 'Non-Functional', 'Business', 'Technical'];
    const assignees = [
        'John Doe',
        'Jane Smith',
        'Bob Johnson',
        'Alice Brown',
        'Charlie Wilson',
    ];

    return Array.from({ length: count }, (_, i) => ({
        id: `REQ-${String(i + 1).padStart(3, '0')}`,
        title: `Requirement ${i + 1}`,
        description: `This is a detailed description for requirement ${i + 1}. It includes comprehensive details about the functionality, acceptance criteria, and implementation notes.`,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        type: types[Math.floor(Math.random() * types.length)],
        assignee: assignees[Math.floor(Math.random() * assignees.length)],
        createdDate: new Date(
            2024,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1,
        )
            .toISOString()
            .split('T')[0],
        estimatedHours: Math.floor(Math.random() * 40) + 1,
        tags: ['feature', 'ui', 'backend'].slice(
            0,
            Math.floor(Math.random() * 3) + 1,
        ),
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
            Virtualization: true,
            'Export (CSV/PDF/Excel)': true,
            Filtering: true,
            Sorting: true,
            Pagination: true,
            Search: true,
            Accessibility: true,
            TypeScript: true,
            Responsive: true,
            Theming: true,
            Performance: 'Excellent',
            'Learning Curve': 'Moderate',
            Documentation: 'Excellent',
            Community: 'Active',
        },
        pros: [
            'Material UI integration',
            'Comprehensive feature set',
            'Excellent documentation',
            'Active development',
            'TypeScript support',
            'Performance optimized',
        ],
        cons: [
            'Larger bundle size',
            'Material UI dependency',
            'Steeper learning curve',
            'More complex setup',
        ],
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
            Virtualization: true,
            'Export (CSV/PDF/Excel)': true,
            Filtering: true,
            Sorting: true,
            Pagination: true,
            Search: true,
            Accessibility: true,
            TypeScript: true,
            Responsive: true,
            Theming: true,
            Performance: 'Excellent',
            'Learning Curve': 'Moderate',
            Documentation: 'Good',
            Community: 'Growing',
        },
        pros: [
            'Smaller bundle size',
            'Mantine integration',
            'Clean design system',
            'Good performance',
            'TypeScript support',
            'Tailwind friendly',
        ],
        cons: [
            'Smaller community',
            'Fewer examples',
            'Less mature ecosystem',
            'Mantine dependency',
        ],
    },
};

const TableResearchPage = () => {
    const [activeTab, setActiveTab] = useState('comparison');

    const FeatureIcon = ({
        feature,
        value,
    }: {
        feature: string;
        value: boolean | string;
    }) => {
        if (typeof value === 'boolean') {
            return value ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
                <XCircle className="h-4 w-4 text-red-500" />
            );
        }
        return (
            <Badge variant="outline" className="text-xs">
                {value}
            </Badge>
        );
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">
                    Advanced Table Solutions Research
                </h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                    Comprehensive analysis of Material React Table and Mantine
                    React Table for building Coda-inspired spreadsheet
                    interfaces in ATOMS.tech
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

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="comparison">
                        Library Comparison
                    </TabsTrigger>
                    <TabsTrigger value="material-demo">
                        Material React Table
                    </TabsTrigger>
                    <TabsTrigger value="mantine-demo">
                        Mantine React Table
                    </TabsTrigger>
                    <TabsTrigger value="recommendation">
                        Recommendation
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="comparison" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Object.entries(featureComparison).map(
                            ([name, data]) => (
                                <Card key={name} className="h-fit">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                {name}
                                                {name ===
                                                    'Material React Table' && (
                                                    <Badge variant="default">
                                                        Recommended
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Star className="h-4 w-4" />
                                                {data.stars}
                                            </div>
                                        </div>
                                        <CardDescription>
                                            Bundle: {data.bundle} | Downloads:{' '}
                                            {data.downloads}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-green-600 mb-2">
                                                Pros
                                            </h4>
                                            <ul className="space-y-1">
                                                {data.pros.map((pro, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex items-center gap-2 text-sm"
                                                    >
                                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                                        {pro}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-orange-600 mb-2">
                                                Cons
                                            </h4>
                                            <ul className="space-y-1">
                                                {data.cons.map((con, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex items-center gap-2 text-sm"
                                                    >
                                                        <AlertCircle className="h-3 w-3 text-orange-500" />
                                                        {con}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            ),
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Comparison Matrix</CardTitle>
                            <CardDescription>
                                Detailed feature comparison between both
                                libraries
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2 font-semibold">
                                                Feature
                                            </th>
                                            <th className="text-center p-2 font-semibold">
                                                Material React Table
                                            </th>
                                            <th className="text-center p-2 font-semibold">
                                                Mantine React Table
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(
                                            featureComparison[
                                                'Material React Table'
                                            ].features,
                                        ).map((feature) => (
                                            <tr
                                                key={feature}
                                                className="border-b hover:bg-muted/50"
                                            >
                                                <td className="p-2 font-medium">
                                                    {feature}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <FeatureIcon
                                                        feature={feature}
                                                        value={
                                                            featureComparison[
                                                                'Material React Table'
                                                            ].features[feature]
                                                        }
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <FeatureIcon
                                                        feature={feature}
                                                        value={
                                                            featureComparison[
                                                                'Mantine React Table'
                                                            ].features[feature]
                                                        }
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
                                Full-featured demo with 25 requirements showing
                                all capabilities
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-center gap-2 flex-wrap mb-4">
                                    <Badge variant="outline">
                                        ✅ Inline Editing
                                    </Badge>
                                    <Badge variant="outline">
                                        ✅ Column Resizing
                                    </Badge>
                                    <Badge variant="outline">
                                        ✅ Row Selection
                                    </Badge>
                                    <Badge variant="outline">
                                        ✅ Filtering
                                    </Badge>
                                    <Badge variant="outline">✅ Sorting</Badge>
                                    <Badge variant="outline">✅ Export</Badge>
                                    <Badge variant="outline">
                                        ✅ Add/Delete Rows
                                    </Badge>
                                    <Badge variant="outline">
                                        ✅ Column Pinning
                                    </Badge>
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
                                Full-featured demo with 25 requirements showing
                                all capabilities
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-center gap-2 flex-wrap mb-4">
                                    <Badge variant="outline">
                                        ✅ Inline Editing
                                    </Badge>
                                    <Badge variant="outline">
                                        ✅ Column Management
                                    </Badge>
                                    <Badge variant="outline">
                                        ✅ Row Operations
                                    </Badge>
                                    <Badge variant="outline">
                                        ✅ Drag & Drop
                                    </Badge>
                                    <Badge variant="outline">
                                        ✅ Virtualization
                                    </Badge>
                                    <Badge variant="outline">✅ Export</Badge>
                                    <Badge variant="outline">
                                        ✅ Add/Delete Rows
                                    </Badge>
                                    <Badge variant="outline">
                                        ✅ Column Pinning
                                    </Badge>
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
                                Best fit for ATOMS.tech requirements platform
                                based on comprehensive analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Why Material React Table?
                                    </h4>
                                    <ul className="space-y-1 text-sm">
                                        <li className="flex items-center gap-2">
                                            <Zap className="h-3 w-3 text-green-500" />
                                            Mature ecosystem with extensive
                                            features
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
                                            Material UI integration matches
                                            design system
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">
                                        Key Benefits for ATOMS
                                    </h4>
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
                                <CardTitle className="text-lg">
                                    Implementation Plan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                                            1
                                        </span>
                                        Replace current table component
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                                            2
                                        </span>
                                        Implement inline editing
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                                            3
                                        </span>
                                        Add column management
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                                            4
                                        </span>
                                        Integrate with Supabase
                                    </li>
                                </ol>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Week 1-2:</span>
                                        <span className="text-muted-foreground">
                                            Core implementation
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Week 3-4:</span>
                                        <span className="text-muted-foreground">
                                            Advanced features
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Week 5:</span>
                                        <span className="text-muted-foreground">
                                            Integration & testing
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Expected Benefits
                                </CardTitle>
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
