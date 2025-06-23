'use client';

import React, { useMemo, useState } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  Box, 
  Button, 
  IconButton, 
  Tooltip,
  Chip,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';

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

// Material UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

const MaterialReactTableDemo: React.FC = () => {
  const [data, setData] = useState<Requirement[]>(() => generateMockData(25));
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'default';
      case 'In Review': return 'warning';
      case 'Approved': return 'info';
      case 'Implemented': return 'success';
      case 'Testing': return 'secondary';
      default: return 'default';
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
          <Typography variant="body2" fontFamily="monospace">
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        size: 250,
        muiEditTextFieldProps: {
          required: true,
          error: !!validationErrors?.title,
          helperText: validationErrors?.title,
        },
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 300,
        Cell: ({ cell }) => (
          <Box sx={{ maxWidth: 300 }}>
            <Typography variant="body2" noWrap>
              {cell.getValue<string>()}
            </Typography>
          </Box>
        ),
        muiEditTextFieldProps: {
          multiline: true,
          rows: 3,
        },
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 120,
        editVariant: 'select',
        editSelectOptions: ['Critical', 'High', 'Medium', 'Low'],
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<string>()}
            color={getPriorityColor(cell.getValue<string>()) as any}
            size="small"
          />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 130,
        editVariant: 'select',
        editSelectOptions: ['Draft', 'In Review', 'Approved', 'Implemented', 'Testing'],
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<string>()}
            color={getStatusColor(cell.getValue<string>()) as any}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        size: 130,
        editVariant: 'select',
        editSelectOptions: ['Functional', 'Non-Functional', 'Business', 'Technical'],
      },
      {
        accessorKey: 'assignee',
        header: 'Assignee',
        size: 150,
        editVariant: 'select',
        editSelectOptions: ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Brown', 'Charlie Wilson'],
      },
      {
        accessorKey: 'createdDate',
        header: 'Created',
        size: 120,
        editVariant: 'date',
        Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString(),
      },
      {
        accessorKey: 'estimatedHours',
        header: 'Est. Hours',
        size: 100,
        muiEditTextFieldProps: {
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
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(cell.getValue<string[]>() || []).map((tag, index) => (
              <Chip key={index} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
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

  const table = useMaterialReactTable({
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
    enableFilters: true,
    enablePagination: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableHiding: true,
    positionActionsColumn: 'last',
    positionToolbarAlertBanner: 'bottom',
    muiSearchTextFieldProps: {
      placeholder: 'Search requirements...',
      sx: { minWidth: '300px' },
      variant: 'outlined',
    },
    muiPaginationProps: {
      color: 'primary',
      rowsPerPageOptions: [10, 20, 30],
      shape: 'rounded',
      variant: 'outlined',
    },
    onCreatingRowSave: handleCreateRequirement,
    onEditingRowSave: handleSaveRequirement,
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: 'flex', gap: '1rem' }}>
        <Tooltip title="Edit">
          <IconButton onClick={() => table.setEditingRow(row)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton color="error" onClick={() => handleDeleteRequirement(row)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: 'flex', gap: '1rem', p: '0.5rem', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            table.setCreatingRow(true);
          }}
        >
          Add Requirement
        </Button>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={() => {
            // Handle export
            console.log('Export data:', table.getPrePaginationRowModel().rows);
          }}
        >
          Export
        </Button>
      </Box>
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
    <ThemeProvider theme={theme}>
      <Box sx={{ width: '100%' }}>
        <MaterialReactTable table={table} />
      </Box>
    </ThemeProvider>
  );
};

export default MaterialReactTableDemo;
