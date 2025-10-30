/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
    namespace React {
        interface ChangeEvent<T = Element> {
            target: T & {
                value: string;
            };
        }

        interface MouseEvent<_T = Element> {
            preventDefault(): void;
        }
    }
}

export {};
