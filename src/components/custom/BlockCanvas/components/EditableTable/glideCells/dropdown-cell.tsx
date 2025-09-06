import {
    GridCellKind,
    TextCellEntry,
    getMiddleCenterBias,
    useTheme,
    type CustomCell,
    type CustomRenderer,
} from '@glideapps/glide-data-grid';
import * as React from 'react';
import Select, { components } from 'react-select';

// This file mirrors @glideapps/glide-data-grid-cells dropdown-cell implementation
// with two behavior fixes to keep the menu pinned and prevent page scroll:
// 1) menuShouldScrollIntoView: false
// 2) menuPosition: 'fixed' (together with menuPortalTarget to the same #portal as the overlay)

type DropdownOption =
    | string
    | {
          value: string;
          label: string;
      }
    | undefined
    | null;

interface DropdownCellProps {
    readonly kind: 'dropdown-cell' | 'dropdown-cell-fixed';
    readonly value: string | undefined | null;
    readonly allowedValues: readonly DropdownOption[];
}

export type DropdownCell = CustomCell<DropdownCellProps>;

const CustomMenu = (p: any) => {
    const { Menu } = components as any;
    const { children, ...rest } = p;
    return <Menu {...rest}>{children}</Menu>;
};

const MenuList: React.FC<any> = (props) => (
    <components.MenuList {...props}>
        <div style={{ padding: '4px 8px', fontSize: 10, opacity: 0.7 }}>Select one</div>
        {props.children}
    </components.MenuList>
);

// lightweight wrappers to avoid styling library dependency; the grid already provides styling
const Wrap: React.FC<React.PropsWithChildren> = ({ children }) => <div>{children}</div>;
const PortalWrap: React.FC<React.PropsWithChildren> = ({ children }) => (
    <div>{children}</div>
);
const ReadOnlyWrap: React.FC<React.PropsWithChildren> = ({ children }) => (
    <div style={{ margin: 'auto 8.5px', paddingBottom: 3 }}>{children}</div>
);

export const FixedDropdownEditor: React.FC<{
    value: DropdownCell;
    onFinishedEditing: (newCell: DropdownCell) => void;
    initialValue?: string;
}> = (p) => {
    const { value: cell, onFinishedEditing, initialValue } = p;
    const { allowedValues, value: valueIn } = cell.data;
    const [value, setValue] = React.useState(valueIn);
    const [inputValue, setInputValue] = React.useState(initialValue ?? '');
    const theme = useTheme();

    const values = React.useMemo(() => {
        return allowedValues.map((option) => {
            if (typeof option === 'string' || option == null) {
                return {
                    value: option as string | undefined | null,
                    label: option?.toString() ?? '',
                } as { value: string | undefined | null; label: string };
            }
            return option as { value: string; label: string };
        });
    }, [allowedValues]);

    // Using the same portal element as the grid overlay to keep positions in sync
    const portalElement =
        typeof document !== 'undefined'
            ? (document.getElementById('portal') ?? document.body)
            : undefined;

    // No-op: removed debug logging after verification

    if (cell.readonly) {
        return (
            <ReadOnlyWrap>
                <TextCellEntry
                    highlight
                    autoFocus={false}
                    disabled
                    value={value ?? ''}
                    onChange={() => undefined}
                />
            </ReadOnlyWrap>
        );
    }

    return (
        <Wrap>
            <Select
                className="glide-select atoms-fixed-dropdown"
                classNamePrefix="atoms-fixed"
                inputValue={inputValue}
                onInputChange={setInputValue}
                // Lock placement below the control to avoid re-computation during scroll
                menuPlacement="bottom"
                // Critical fixes for scroll/position behavior
                menuShouldScrollIntoView={false}
                menuPosition="fixed"
                closeMenuOnScroll={false}
                menuPortalTarget={portalElement as HTMLElement | undefined}
                value={values.find((x) => x.value === value) as any}
                styles={{
                    control: (base) => ({
                        ...base,
                        border: 0,
                        boxShadow: 'none',
                    }),
                    option: (base, { isFocused }) => ({
                        ...base,
                        fontSize: (theme as any).editorFontSize,
                        fontFamily: (theme as any).fontFamily,
                        cursor: isFocused ? 'pointer' : undefined,
                        paddingLeft: (theme as any).cellHorizontalPadding,
                        paddingRight: (theme as any).cellHorizontalPadding,
                        ':active': {
                            ...(base as any)[':active'],
                            color: (theme as any).accentFg,
                        },
                        ':empty::after': {
                            content: '"\u00a0"',
                            visibility: 'hidden',
                        },
                    }),
                }}
                theme={(t) => {
                    return {
                        ...t,
                        colors: {
                            ...t.colors,
                            neutral0: (theme as any).bgCell,
                            neutral5: (theme as any).bgCell,
                            neutral10: (theme as any).bgCell,
                            neutral20: (theme as any).bgCellMedium,
                            neutral30: (theme as any).bgCellMedium,
                            neutral40: (theme as any).bgCellMedium,
                            neutral50: (theme as any).textLight,
                            neutral60: (theme as any).textMedium,
                            neutral70: (theme as any).textMedium,
                            neutral80: (theme as any).textDark,
                            neutral90: (theme as any).textDark,
                            neutral100: (theme as any).textDark,
                            primary: (theme as any).accentColor,
                            primary75: (theme as any).accentColor,
                            primary50: (theme as any).accentColor,
                            primary25: (theme as any).accentLight,
                        },
                    } as any;
                }}
                autoFocus
                openMenuOnFocus
                components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                    MenuList,
                    Menu: (props: any) => (
                        <PortalWrap>
                            <CustomMenu className="click-outside-ignore" {...props} />
                        </PortalWrap>
                    ),
                }}
                options={values as any}
                onChange={async (e: any) => {
                    if (e === null) return;
                    setValue(e.value);
                    await new Promise((r) => window.requestAnimationFrame(r));
                    onFinishedEditing({
                        ...cell,
                        data: {
                            ...cell.data,
                            value: e.value,
                        },
                    });
                }}
            />
        </Wrap>
    );
};

export function isDropdownCellMatch(c: any): c is DropdownCell {
    return (
        c?.kind === GridCellKind.Custom &&
        (c?.data?.kind === 'dropdown-cell' || c?.data?.kind === 'dropdown-cell-fixed')
    );
}

const renderer: CustomRenderer<DropdownCell> = {
    kind: GridCellKind.Custom,
    isMatch: (c): c is DropdownCell => {
        const k = (c as any).data.kind;
        return k === 'dropdown-cell' || k === 'dropdown-cell-fixed';
    },
    draw: (args, cell) => {
        const { ctx, theme, rect } = args;
        const { value } = cell.data;
        const foundOption = cell.data.allowedValues.find((opt) => {
            if (typeof opt === 'string' || opt === null || opt === undefined) {
                return opt === value;
            }
            return (opt as { value: string }).value === value;
        });
        const displayText =
            typeof foundOption === 'string'
                ? (foundOption as string)
                : ((foundOption as any)?.label ?? '');
        if (displayText) {
            (ctx as CanvasRenderingContext2D).fillStyle = (theme as any).textDark;
            (ctx as CanvasRenderingContext2D).fillText(
                displayText,
                rect.x + (theme as any).cellHorizontalPadding,
                rect.y + rect.height / 2 + getMiddleCenterBias(ctx as any, theme as any),
            );
        }
        return true;
    },
    measure: (ctx, cell, theme) => {
        const { value } = cell.data;
        return (
            (value
                ? (ctx as CanvasRenderingContext2D).measureText(value as string).width
                : 0) +
            (theme as any).cellHorizontalPadding * 2
        );
    },
    provideEditor: () => ({
        editor: FixedDropdownEditor as any,
        disablePadding: true,
        deletedValue: (v: any) => ({
            ...v,
            copyData: '',
            data: {
                ...v.data,
                value: '',
            },
        }),
    }),
    onPaste: (v, d) => ({
        ...d,
        value: (d.allowedValues as readonly DropdownOption[]).includes(v as any)
            ? (v as any)
            : d.value,
    }),
};

export default renderer;
