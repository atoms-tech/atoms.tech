'use client';

import React, { useMemo, useState } from 'react';
import {
  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from 'mantine-react-table';
import { MantineProvider, createTheme } from '@mantine/core';
import { 
  Box, 
  Button, 
  ActionIcon, 
  Badge,
  Text,
  Group,
  Stack,
  Tooltip
} from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconDownload,
} from '@tabler/icons-react';

// Mock data type
interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'In Review' | 'Approved' | 'Implemented' | 'Testing';
  type: 'Functional' | 'Non-Functional' | 'Business' | 'Technical';
  assignee: string;
  createdDate: string;
  estimatedHours: number;
  tags: string[];
}

// Generate mock data
const generateMockData = (count: number): Requirement[] => {
  const priorities: Requirement['priority'][] = ['Critical', 'High', 'Medium', 'Low'];
  const statuses: Requirement['status'][] = ['Draft', 'In Review', 'Approved', 'Implemented', 'Testing'];
  const types: Requirement['type'][] = ['Functional', 'Non-Functional', 'Business', 'Technical'];
  const assignees = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'];
  const tagOptions = ['feature', 'ui', 'backend', 'api', 'security', 'performance', 'mobile'];

  return Array.from({ length: count }, (_, i) => ({
    id: `REQ-${String(i + 1).padStart(3, '0')}`,
    title: `User Story ${i + 1}: ${['Login System', 'Dashboard View', 'Data Export', 'User Management', 'Reporting Module'][i % 5]}`,
    description: `Detailed description for requirement ${i + 1}. This includes comprehensive acceptance criteria, implementation notes, and business value proposition.`,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    type: types[Math.floor(Math.random() * types.length)],
    assignee: assignees[Math.floor(Math.random() * assignees.length)],
    createdDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
    estimatedHours: Math.floor(Math.random() * 40) + 1,
    tags: tagOptions.slice(0, Math.floor(Math.random() * 3) + 1),
  }));
};

// Mantine theme
const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
});

const MantineReactTableDemo: React.FC = () => {
  const [data, setData] = useState<Requirement[]>(() => generateMockData(25));
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'red';
      case 'High': return 'orange';
      case 'Medium': return 'blue';
      case 'Low': return 'green';
      default: return 'gray';
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'gray';
      case 'In Review': return 'yellow';
      case 'Approved': return 'blue';
      case 'Implemented': return 'green';
      case 'Testing': return 'purple';
      default: return 'gray';
    }
  };

  const columns = useMemo<MRT_ColumnDef<Requirement>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        enableEditing: false,
        size: 100,
        Cell: ({ cell }) => (
          <Text size="sm" ff="monospace">
            {cell.getValue<string>()}
          </Text>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        size: 250,
        mantineEditTextInputProps: {
          required: true,
          error: validationErrors?.title,
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 300,
        Cell: ({ cell }) => (
          <Box style={{ maxWidth: 300 }}>
            <Text size="sm" lineClamp={2}>
              {cell.getValue<string>()}
            </Text>
          </Box>
        ),
        mantineEditTextInputProps: {
          required: true,
        },
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 120,
        editVariant: 'select',
        mantineEditSelectProps: {
          data: ['Critical', 'High', 'Medium', 'Low'],
        },
        Cell: ({ cell }) => (
          <Badge
            color={getPriorityColor(cell.getValue<string>())}
            size="sm"
          >
            {cell.getValue<string>()}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 130,
        editVariant: 'select',
        mantineEditSelectProps: {
          data: ['Draft', 'In Review', 'Approved', 'Implemented', 'Testing'],
        },
        Cell: ({ cell }) => (
          <Badge
            color={getStatusColor(cell.getValue<string>())}
            size="sm"
            variant="outline"
          >
            {cell.getValue<string>()}
          </Badge>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        size: 130,
        editVariant: 'select',
        mantineEditSelectProps: {
          data: ['Functional', 'Non-Functional', 'Business', 'Technical'],
        },
      },
      {
        accessorKey: 'assignee',
        header: 'Assignee',
        size: 150,
        editVariant: 'select',
        mantineEditSelectProps: {
          data: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'],
        },
      },
      {
        accessorKey: 'createdDate',
        header: 'Created',
        size: 120,
        Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString(),
      },
      {
        accessorKey: 'estimatedHours',
        header: 'Est. Hours',
        size: 100,
        mantineEditTextInputProps: {
          type: 'number',
          required: true,
        },
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        size: 200,
        enableEditing: false,
        Cell: ({ cell }) => (
          <Group gap="xs">
            {(cell.getValue<string[]>() || []).map((tag, index) => (
              <Badge key={index} size="xs" variant="light">
                {tag}
              </Badge>
            ))}
          </Group>
        ),
      },
    ],
    [validationErrors],
  );

  // Handle creating new requirement
  const handleCreateRequirement = async ({ values, table }: any) => {
    const newRequirement: Requirement = {
      id: `REQ-${String(data.length + 1).padStart(3, '0')}`,
      ...values,
      tags: ['new'],
    };
    setData([...data, newRequirement]);
    table.setCreatingRow(null);
  };

  // Handle saving edited requirement
  const handleSaveRequirement = async ({ values, table }: any) => {
    setData((prev) =>
      prev.map((item) => (item.id === values.id ? { ...item, ...values } : item))
    );
    table.setEditingRow(null);
  };

  // Handle deleting requirement
  const handleDeleteRequirement = (row: any) => {
    if (window.confirm(`Are you sure you want to delete ${row.original.id}?`)) {
      setData((prev) => prev.filter((item) => item.id !== row.original.id));
    }
  };

  const table = useMantineReactTable({
    columns,
    data,
    createDisplayMode: 'modal',
    editDisplayMode: 'modal',
    enableEditing: true,
    enableRowSelection: true,
    enableColumnOrdering: true,
    enableColumnPinning: true,
    enableRowActions: true,
    enableColumnResizing: true,
    enableSorting: true,
    enableGlobalFilter: true,
    enableColumnFilters: true,
    enablePagination: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableHiding: true,
    positionActionsColumn: 'last',
    positionToolbarAlertBanner: 'bottom',
    mantineSearchTextInputProps: {
      placeholder: 'Search requirements...',
      style: { minWidth: '300px' },
    },
    mantinePaginationProps: {
      rowsPerPageOptions: ['10', '20', '30'],
    },
    onCreatingRowSave: handleCreateRequirement,
    onEditingRowSave: handleSaveRequirement,
    renderRowActions: ({ row, table }) => (
      <Group gap="xs">
        <Tooltip label="Edit">
          <ActionIcon onClick={() => table.setEditingRow(row)}>
            <IconEdit size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete">
          <ActionIcon color="red" onClick={() => handleDeleteRequirement(row)}>
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
    ),
    renderTopToolbarCustomActions: ({ table }) => (
      <Group gap="sm">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            table.setCreatingRow(true);
          }}
        >
          Add Requirement
        </Button>
        <Button
          variant="outline"
          leftSection={<IconDownload size={16} />}
          onClick={() => {
            // Handle export
            console.log('Export data:', table.getPrePaginationRowModel().rows);
          }}
        >
          Export
        </Button>
      </Group>
    ),
    initialState: {
      showColumnFilters: false,
      showGlobalFilter: true,
      columnPinning: {
        left: ['mrt-row-select', 'id'],
        right: ['mrt-row-actions'],
      },
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
  });

  return (
    <MantineProvider theme={theme}>
      <Box style={{ width: '100%' }}>
        <MantineReactTable table={table} />
      </Box>
    </MantineProvider>
  );
};

export default MantineReactTableDemo;
