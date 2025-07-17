'use client';

// This is a version of the BlockCanvas component that uses TanStack Tables
// for the EditableTable component.
import { BlockCanvas } from './index';
import { BlockCanvasProps } from './types';

/**
 * BlockCanvasTanStack - A version of BlockCanvas that uses TanStack Tables
 *
 * This component is identical to the regular BlockCanvas except it uses
 * the TanStack Table implementation for the EditableTable.
 *
 * This is achieved by setting a global context value that the TableBlockContent
 * component will use to decide which EditableTable implementation to render.
 */
export function BlockCanvasTanStack(props: BlockCanvasProps) {
    // Simply pass through to the BlockCanvas with a hidden prop that enables TanStack mode
    return <BlockCanvas {...props} _useTanStackTables={true} />;
}
