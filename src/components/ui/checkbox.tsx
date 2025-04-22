import type { InputHTMLAttributes, Ref } from 'react';

import { cn } from '@/lib/utils';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
    className?: string;
    label?: string;
    labelClassName?: string;
    wrapperClassName?: string;
    ref?: Ref<HTMLInputElement>;
}

const Checkbox = ({
    className,
    label,
    labelClassName,
    wrapperClassName,
    ref,
    ...props
}: CheckboxProps) => {
    return (
        <label
            className={cn(
                'inline-flex items-center cursor-pointer',
                wrapperClassName,
            )}
        >
            <input
                type="checkbox"
                ref={ref}
                className="sr-only peer"
                {...props}
            />
            <div
                className={cn(
                    "relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-muted peer-checked:bg-primary dark:peer-checked:bg-blue-600",
                    className,
                )}
            />
            {label && (
                <span
                    className={cn(
                        'ms-3 text-sm font-medium text-gray-900 dark:text-gray-300',
                        labelClassName,
                    )}
                >
                    {label}
                </span>
            )}
        </label>
    );
};

export { Checkbox };
