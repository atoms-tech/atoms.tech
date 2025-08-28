/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    GridCellKind,
    useTheme,
    type CustomCell,
    type CustomRenderer,
} from '@glideapps/glide-data-grid';
import * as React from 'react';
import Select, { components } from 'react-select';
import CreatableSelect from 'react-select/creatable';

type SelectOption = {
    value: string;
    label?: string;
    color?: string;
};

interface MultiSelectCellProps {
    readonly kind: 'multi-select-cell';
    readonly values: string[] | undefined | null;
    readonly options?: readonly (SelectOption | string)[];
    readonly allowCreation?: boolean;
    readonly allowDuplicates?: boolean;
}

export type MultiSelectCell = CustomCell<MultiSelectCellProps>;

const Wrap: React.FC<
    React.PropsWithChildren<{
        onKeyDown?: (e: React.KeyboardEvent) => void;
        'data-testid'?: string;
    }>
> = ({ children, ...rest }) => <div {...rest}>{children}</div>;
const PortalWrap: React.FC<React.PropsWithChildren> = ({ children }) => (
    <div>{children}</div>
);

export const prepareOptions = (options: readonly (string | SelectOption)[]) => {
    return options.map((option) => {
        if (typeof option === 'string' || option === null || option === undefined) {
            return {
                value: option as string,
                label: option ?? '',
                color: undefined,
            } as SelectOption;
        }
        return option as SelectOption;
    });
};

// Resolve values to the shape react-select expects, respecting allowDuplicates
const VALUE_PREFIX = '__value';
const VALUE_PREFIX_REGEX = new RegExp(`^${VALUE_PREFIX}\\d+__`);
export const resolveValues = (
    values: string[] | null | undefined,
    options: readonly SelectOption[],
    allowDuplicates?: boolean,
) => {
    if (!values) return [] as { value: string; label?: string; color?: string }[];
    return values.map((value, index) => {
        const valuePrefix = allowDuplicates ? `${VALUE_PREFIX}${index}__` : '';
        const matched = options.find((o) => o.value === value);
        if (matched) {
            return {
                ...matched,
                value: `${valuePrefix}${matched.value}`,
            };
        }
        return {
            value: `${valuePrefix}${value}`,
            label: value,
        };
    });
};

const FixedMultiSelectEditor: React.FC<{
    value: MultiSelectCell;
    initialValue?: string;
    onChange: (newValue: MultiSelectCell) => void;
    onFinishedEditing: (
        newValue?: MultiSelectCell,
        movement?: readonly [-1 | 0 | 1, -1 | 0 | 1],
    ) => void;
}> = ({ value: cell, initialValue, onChange, onFinishedEditing }) => {
    const data: any = (cell as any).data;
    const { options: optionsIn, values: valuesIn, allowCreation, allowDuplicates } = data;
    const theme = useTheme();
    const [value, setValue] = React.useState(valuesIn);
    const [menuOpen, setMenuOpen] = React.useState(true);
    const [inputValue, setInputValue] = React.useState(initialValue ?? '');

    const options = React.useMemo(() => prepareOptions(optionsIn ?? []), [optionsIn]);
    const menuDisabled = Boolean(
        allowCreation && allowDuplicates && options.length === 0,
    );

    const onKeyDown = React.useCallback(
        (e: React.KeyboardEvent) => {
            if (menuOpen) e.stopPropagation();
        },
        [menuOpen],
    );

    const colorStyles: any = {
        control: (base: any) => ({
            ...base,
            border: 0,
            boxShadow: 'none',
            backgroundColor: (theme as any).bgCell,
        }),
        menu: (styles: any) => ({
            ...styles,
            backgroundColor: (theme as any).bgCell,
        }),
        option: (styles: any, state: any) => ({
            ...styles,
            fontSize: (theme as any).editorFontSize,
            fontFamily: (theme as any).fontFamily,
            color: (theme as any).textDark,
            ...(state.isFocused
                ? { backgroundColor: (theme as any).accentLight, cursor: 'pointer' }
                : {}),
            ':active': {
                ...styles[':active'],
                color: (theme as any).accentFg,
                backgroundColor: (theme as any).accentColor,
            },
        }),
    };

    const submitValues = React.useCallback(
        (valuesOut: string[]) => {
            const mapped = valuesOut.map((v) =>
                allowDuplicates && v.startsWith(VALUE_PREFIX)
                    ? v.replace(new RegExp(VALUE_PREFIX_REGEX), '')
                    : v,
            );
            setValue(mapped);
            onChange({
                ...(cell as any),
                data: { ...(cell as any).data, values: mapped },
            } as any);
        },
        [cell, onChange, allowDuplicates],
    );

    const handleKeyDown = (event: React.KeyboardEvent) => {
        switch (event.key) {
            case 'Enter':
            case 'Tab':
                if (!inputValue) {
                    onFinishedEditing(cell, [0, 1]);
                    return;
                }
                if (allowDuplicates && allowCreation) {
                    setInputValue('');
                    submitValues([...(value ?? []), inputValue]);
                    setMenuOpen(false);
                    event.preventDefault();
                }
        }
    };

    const SelectComponent: any = allowCreation ? CreatableSelect : Select;

    const portalElement =
        typeof document !== 'undefined'
            ? ((document.getElementById('portal') as HTMLElement) ?? document.body)
            : undefined;

    return (
        <Wrap onKeyDown={onKeyDown} data-testid="multi-select-cell">
            <SelectComponent
                className="atoms-fixed-multi-select"
                isMulti
                isDisabled={cell.readonly}
                isClearable
                isSearchable
                inputValue={inputValue}
                onInputChange={setInputValue}
                options={options}
                placeholder={cell.readonly ? '' : allowCreation ? 'Add...' : undefined}
                noOptionsMessage={(input: any) =>
                    allowCreation && allowDuplicates && input.inputValue
                        ? `Create "${input.inputValue}"`
                        : undefined
                }
                menuIsOpen={cell.readonly ? false : menuOpen}
                onMenuOpen={() => setMenuOpen(true)}
                onMenuClose={() => setMenuOpen(false)}
                value={resolveValues(value, options, allowDuplicates)}
                onKeyDown={cell.readonly ? undefined : handleKeyDown}
                // Fixed-position behavior like our dropdown fix
                menuPlacement="bottom"
                menuPosition="fixed"
                menuShouldScrollIntoView={false}
                closeMenuOnScroll={false}
                menuPortalTarget={portalElement}
                autoFocus
                openMenuOnFocus
                openMenuOnClick
                closeMenuOnSelect
                backspaceRemovesValue
                escapeClearsValue={false}
                styles={colorStyles}
                components={{
                    DropdownIndicator: () => null,
                    IndicatorSeparator: () => null,
                    Menu: (props: any) =>
                        menuDisabled ? null : (
                            <PortalWrap>
                                <components.Menu
                                    className="click-outside-ignore"
                                    {...props}
                                />
                            </PortalWrap>
                        ),
                }}
                onChange={async (e: any) => {
                    if (e === null) return;
                    submitValues(e.map((x: any) => x.value));
                }}
            />
        </Wrap>
    );
};

const renderer: CustomRenderer<MultiSelectCell> = {
    kind: GridCellKind.Custom,
    isMatch: (c): c is MultiSelectCell => (c as any)?.data?.kind === 'multi-select-cell',
    draw: (_args, _cell) => {
        // Let the package renderer handle drawing; we only override the editor.
        // Returning false lets default drawing occur, but for safety return true (no custom drawing).
        return true;
    },
    provideEditor: () => ({
        editor: FixedMultiSelectEditor as any,
        disablePadding: true,
        deletedValue: (v: any) => ({
            ...v,
            copyData: '',
            data: {
                ...v.data,
                values: [],
            },
        }),
    }),
    onPaste: (val, cell) => {
        if (!val || !val.trim()) {
            return { ...(cell as any), values: [] } as any;
        }
        let values = val.split(',').map((s) => s.trim());
        if (!((cell as any).data as any).allowDuplicates) {
            values = values.filter((v, index) => values.indexOf(v) === index);
        }
        if (!((cell as any).data as any).allowCreation) {
            const opts = prepareOptions(
                (((cell as any).data as any).options ?? []) as any,
            );
            values = values.filter((v) => opts.find((o) => o.value === v));
        }
        if (values.length === 0) return undefined as any;
        return { ...(cell as any), values } as any;
    },
};

export default renderer;
