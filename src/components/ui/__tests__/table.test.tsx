import { render, screen } from '@/test-utils';
import { 
    Table, 
    TableHeader, 
    TableBody, 
    TableFooter, 
    TableRow, 
    TableHead, 
    TableCell, 
    TableCaption 
} from '../table';

describe('Table Components', () => {
    describe('Table', () => {
        it('renders with wrapper div', () => {
            render(
                <Table data-testid="table">
                    <TableBody>
                        <TableRow>
                            <TableCell>Cell content</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );
            
            const wrapper = screen.getByTestId('table').parentElement;
            expect(wrapper).toHaveClass('relative', 'w-full', 'overflow-auto');
            
            const table = screen.getByTestId('table');
            expect(table.tagName).toBe('TABLE');
            expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
        });

        it('applies custom className', () => {
            const customClass = 'custom-table-class';
            render(
                <Table className={customClass} data-testid="table">
                    <TableBody>
                        <TableRow>
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );
            
            const table = screen.getByTestId('table');
            expect(table).toHaveClass(customClass);
        });

        it('has correct display name', () => {
            expect(Table.displayName).toBe('Table');
        });
    });

    describe('TableHeader', () => {
        it('renders as thead element', () => {
            render(
                <Table>
                    <TableHeader data-testid="table-header">
                        <TableRow>
                            <TableHead>Header</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            );
            
            const header = screen.getByTestId('table-header');
            expect(header.tagName).toBe('THEAD');
            expect(header).toHaveClass('[&_tr]:border-b');
        });

        it('has correct display name', () => {
            expect(TableHeader.displayName).toBe('TableHeader');
        });
    });

    describe('TableBody', () => {
        it('renders as tbody element', () => {
            render(
                <Table>
                    <TableBody data-testid="table-body">
                        <TableRow>
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );
            
            const body = screen.getByTestId('table-body');
            expect(body.tagName).toBe('TBODY');
            expect(body).toHaveClass('[&_tr:last-child]:border-0');
        });

        it('has correct display name', () => {
            expect(TableBody.displayName).toBe('TableBody');
        });
    });

    describe('TableFooter', () => {
        it('renders as tfoot element', () => {
            render(
                <Table>
                    <TableFooter data-testid="table-footer">
                        <TableRow>
                            <TableCell>Footer</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            );
            
            const footer = screen.getByTestId('table-footer');
            expect(footer.tagName).toBe('TFOOT');
            expect(footer).toHaveClass(
                'border-t',
                'bg-muted/50',
                'font-medium',
                '[&>tr]:last:border-b-0'
            );
        });

        it('has correct display name', () => {
            expect(TableFooter.displayName).toBe('TableFooter');
        });
    });

    describe('TableRow', () => {
        it('renders as tr element', () => {
            render(
                <Table>
                    <TableBody>
                        <TableRow data-testid="table-row">
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );
            
            const row = screen.getByTestId('table-row');
            expect(row.tagName).toBe('TR');
            expect(row).toHaveClass(
                'border-b',
                'transition-colors',
                'hover:bg-muted/50',
                'data-[state=selected]:bg-muted'
            );
        });

        it('has correct display name', () => {
            expect(TableRow.displayName).toBe('TableRow');
        });
    });

    describe('TableHead', () => {
        it('renders as th element', () => {
            render(
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead data-testid="table-head">
                                Header Cell
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            );
            
            const head = screen.getByTestId('table-head');
            expect(head.tagName).toBe('TH');
            expect(head).toHaveClass(
                'h-10',
                'px-2',
                'text-left',
                'align-middle',
                'font-medium',
                'text-muted-foreground',
                '[&:has([role=checkbox])]:pr-0',
                '[&>[role=checkbox]]:translate-y-[2px]'
            );
        });

        it('has correct display name', () => {
            expect(TableHead.displayName).toBe('TableHead');
        });
    });

    describe('TableCell', () => {
        it('renders as td element', () => {
            render(
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell data-testid="table-cell">
                                Cell Content
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );
            
            const cell = screen.getByTestId('table-cell');
            expect(cell.tagName).toBe('TD');
            expect(cell).toHaveClass(
                'p-2',
                'align-middle',
                '[&:has([role=checkbox])]:pr-0',
                '[&>[role=checkbox]]:translate-y-[2px]'
            );
        });

        it('has correct display name', () => {
            expect(TableCell.displayName).toBe('TableCell');
        });
    });

    describe('TableCaption', () => {
        it('renders as caption element', () => {
            render(
                <Table>
                    <TableCaption data-testid="table-caption">
                        Table Caption
                    </TableCaption>
                    <TableBody>
                        <TableRow>
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            );
            
            const caption = screen.getByTestId('table-caption');
            expect(caption.tagName).toBe('CAPTION');
            expect(caption).toHaveClass('mt-4', 'text-sm', 'text-muted-foreground');
        });

        it('has correct display name', () => {
            expect(TableCaption.displayName).toBe('TableCaption');
        });
    });

    describe('Complete Table Structure', () => {
        it('renders complete table with all components', () => {
            render(
                <Table>
                    <TableCaption>Monthly Sales Report</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Sales</TableHead>
                            <TableHead>Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>Product A</TableCell>
                            <TableCell>100</TableCell>
                            <TableCell>$1,000</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Product B</TableCell>
                            <TableCell>150</TableCell>
                            <TableCell>$1,500</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell>Total</TableCell>
                            <TableCell>250</TableCell>
                            <TableCell>$2,500</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            );
            
            expect(screen.getByText('Monthly Sales Report')).toBeInTheDocument();
            expect(screen.getByText('Product')).toBeInTheDocument();
            expect(screen.getByText('Sales')).toBeInTheDocument();
            expect(screen.getByText('Revenue')).toBeInTheDocument();
            expect(screen.getByText('Product A')).toBeInTheDocument();
            expect(screen.getByText('Product B')).toBeInTheDocument();
            expect(screen.getByText('Total')).toBeInTheDocument();
        });

        it('applies custom classNames to all components', () => {
            render(
                <Table className="custom-table">
                    <TableHeader className="custom-header">
                        <TableRow className="custom-row">
                            <TableHead className="custom-head">Header</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="custom-body">
                        <TableRow className="custom-body-row">
                            <TableCell className="custom-cell">Cell</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter className="custom-footer">
                        <TableRow>
                            <TableCell>Footer</TableCell>
                        </TableRow>
                    </TableFooter>
                    <TableCaption className="custom-caption">Caption</TableCaption>
                </Table>
            );
            
            expect(screen.getByRole('table')).toHaveClass('custom-table');
            expect(screen.getByRole('rowgroup')).toHaveClass('custom-header');
            expect(screen.getByText('Header').closest('tr')).toHaveClass('custom-row');
            expect(screen.getByText('Header')).toHaveClass('custom-head');
            expect(screen.getByText('Cell').closest('tbody')).toHaveClass('custom-body');
            expect(screen.getByText('Cell').closest('tr')).toHaveClass('custom-body-row');
            expect(screen.getByText('Cell')).toHaveClass('custom-cell');
            expect(screen.getByText('Footer').closest('tfoot')).toHaveClass('custom-footer');
            expect(screen.getByText('Caption')).toHaveClass('custom-caption');
        });
    });
});