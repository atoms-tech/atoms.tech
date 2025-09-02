/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    GridCellKind,
    getLuminance,
    getMiddleCenterBias,
    measureTextCached,
    roundedRect,
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

// Match Glide's visual constants
const BUBBLE_HEIGHT = 20;
const BUBBLE_PADDING = 6;
const BUBBLE_MARGIN = 4;

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
}> = ({ value: cell, initialValue, onChange, onFinishedEditing: _onFinishedEditing }) => {
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
        input: (styles: any, { isDisabled }: any) => {
            if (isDisabled) return { display: 'none' };
            return {
                ...styles,
                fontSize: (theme as any).editorFontSize,
                fontFamily: (theme as any).fontFamily,
                color: (theme as any).textDark,
            };
        },
        placeholder: (styles: any) => ({
            ...styles,
            fontSize: (theme as any).editorFontSize,
            fontFamily: (theme as any).fontFamily,
            color: (theme as any).textLight,
        }),
        noOptionsMessage: (styles: any) => ({
            ...styles,
            fontSize: (theme as any).editorFontSize,
            fontFamily: (theme as any).fontFamily,
            color: (theme as any).textLight,
        }),
        clearIndicator: (styles: any) => ({
            ...styles,
            color: (theme as any).textLight,
            ':hover': { color: (theme as any).textDark, cursor: 'pointer' },
        }),
        multiValue: (styles: any, { data }: any) => ({
            ...styles,
            backgroundColor: data.color ?? (theme as any).bgBubble,
            borderRadius: `${(theme as any).roundingRadius ?? BUBBLE_HEIGHT / 2}px`,
        }),
        multiValueLabel: (styles: any, { data, isDisabled }: any) => ({
            ...styles,
            paddingRight: isDisabled ? BUBBLE_PADDING : 0,
            paddingLeft: BUBBLE_PADDING,
            paddingTop: 0,
            paddingBottom: 0,
            color: data.color
                ? getLuminance(data.color) > 0.5
                    ? 'black'
                    : 'white'
                : (theme as any).textBubble,
            fontSize: (theme as any).editorFontSize,
            fontFamily: (theme as any).fontFamily,
            justifyContent: 'center',
            alignItems: 'center',
            display: 'flex',
            height: BUBBLE_HEIGHT,
        }),
        multiValueRemove: (styles: any, { data, isDisabled, isFocused }: any) => {
            if (isDisabled) return { display: 'none' };
            return {
                ...styles,
                color: data.color
                    ? getLuminance(data.color) > 0.5
                        ? 'black'
                        : 'white'
                    : (theme as any).textBubble,
                backgroundColor: undefined,
                borderRadius: isFocused
                    ? `${(theme as any).roundingRadius ?? BUBBLE_HEIGHT / 2}px`
                    : undefined,
                ':hover': { cursor: 'pointer' },
            };
        },
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
                // Let react-select handle selection. If creating, add without closing.
                if (allowDuplicates && allowCreation && inputValue) {
                    setInputValue('');
                    submitValues([...(value ?? []), inputValue]);
                    setMenuOpen(true);
                    event.preventDefault();
                }
                break;
            default:
                break;
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
                closeMenuOnSelect={false}
                blurInputOnSelect={false}
                menuPortalTarget={portalElement}
                autoFocus
                openMenuOnFocus
                openMenuOnClick
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
                    setInputValue('');
                    setMenuOpen(true);
                }}
            />
        </Wrap>
    );
};

const renderer: CustomRenderer<MultiSelectCell> = {
    kind: GridCellKind.Custom,
    isMatch: (c): c is MultiSelectCell => (c as any)?.data?.kind === 'multi-select-cell',
    draw: (args, cell) => {
        const { ctx, theme, rect, highlighted } = args as any;
        const { values, options: optionsIn } = (cell as any).data as any;
        if (values === undefined || values === null) return true;

        const options = prepareOptions(optionsIn ?? []);
        const drawArea = {
            x: rect.x + (theme as any).cellHorizontalPadding,
            y: rect.y + (theme as any).cellVerticalPadding,
            width: rect.width - 2 * (theme as any).cellHorizontalPadding,
            height: rect.height - 2 * (theme as any).cellVerticalPadding,
        };
        const rows = Math.max(
            1,
            Math.floor(drawArea.height / (BUBBLE_HEIGHT + BUBBLE_PADDING)),
        );

        let x = drawArea.x;
        let row = 1;
        let y =
            rows === 1
                ? drawArea.y + (drawArea.height - BUBBLE_HEIGHT) / 2
                : drawArea.y +
                  (drawArea.height - rows * BUBBLE_HEIGHT - (rows - 1) * BUBBLE_PADDING) /
                      2;

        for (const value of values as string[]) {
            const matchedOption = options.find((t) => t.value === value);
            const color =
                (matchedOption as any)?.color ??
                (highlighted ? (theme as any).bgBubbleSelected : (theme as any).bgBubble);
            const displayText = (matchedOption as any)?.label ?? value;
            const metrics = measureTextCached(displayText, ctx as any);
            const width = metrics.width + BUBBLE_PADDING * 2;
            const textY = BUBBLE_HEIGHT / 2;

            if (
                x !== drawArea.x &&
                x + width > drawArea.x + drawArea.width &&
                row < rows
            ) {
                row++;
                y += BUBBLE_HEIGHT + BUBBLE_PADDING;
                x = drawArea.x;
            }

            (ctx as CanvasRenderingContext2D).fillStyle = color as string;
            (ctx as CanvasRenderingContext2D).beginPath();
            roundedRect(
                ctx as any,
                x,
                y,
                width,
                BUBBLE_HEIGHT,
                (theme as any).roundingRadius ?? BUBBLE_HEIGHT / 2,
            );
            (ctx as CanvasRenderingContext2D).fill();

            // text color: black/white based on bubble color luminance, else theme textBubble
            (ctx as CanvasRenderingContext2D).fillStyle = (matchedOption as any)?.color
                ? getLuminance(color as string) > 0.5
                    ? '#000000'
                    : '#ffffff'
                : (theme as any).textBubble;
            (ctx as CanvasRenderingContext2D).fillText(
                displayText,
                x + BUBBLE_PADDING,
                y + textY + getMiddleCenterBias(ctx as any, theme as any),
            );
            x += width + BUBBLE_MARGIN;
            if (
                x > drawArea.x + drawArea.width + (theme as any).cellHorizontalPadding &&
                row >= rows
            ) {
                break;
            }
        }
        return true;
    },
    measure: (ctx, cell, t) => {
        const { values, options } = (cell as any).data as any;
        if (!values) return (t as any).cellHorizontalPadding * 2;
        const labels = resolveValues(
            values,
            prepareOptions(options ?? []),
            ((cell as any).data as any).allowDuplicates,
        ).map((x) => x.label ?? x.value);
        return (
            labels.reduce(
                (acc: number, data: string) =>
                    (ctx as any).measureText(data).width +
                    acc +
                    BUBBLE_PADDING * 2 +
                    BUBBLE_MARGIN,
                0,
            ) +
            2 * (t as any).cellHorizontalPadding -
            4
        );
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
