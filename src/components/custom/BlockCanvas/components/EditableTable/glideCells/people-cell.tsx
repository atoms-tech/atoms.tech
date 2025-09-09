/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    GridCellKind,
    type CustomCell,
    type CustomRenderer,
} from '@glideapps/glide-data-grid';

// Lightweight alias to our multi-select cell; we can extend later for avatars, etc.
interface PeopleCellProps {
    readonly kind: 'people-cell';
    readonly values: string[] | undefined | null;
    readonly options?: readonly (string | { label: string; value: string })[];
}

export type PeopleCell = CustomCell<PeopleCellProps>;

const renderer: CustomRenderer<PeopleCell> = {
    kind: GridCellKind.Custom,
    isMatch: (c): c is PeopleCell => (c as any)?.data?.kind === 'people-cell',
    draw: () => true,
};

export default renderer;
