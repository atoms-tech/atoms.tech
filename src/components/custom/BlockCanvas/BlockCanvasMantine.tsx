'use client';

import { BlockCanvas } from './index';
import { BlockCanvasProps } from './types';

/**
 * BlockCanvasMantine - A version of BlockCanvas that uses Mantine tables
 *
 * This component is identical to the regular BlockCanvas except it uses
 * the Mantine table implementation for the EditableTable.
 *
 * This is achieved by setting a global context value that the TableBlockContent
 * component will use to decide which EditableTable implementation to render.
 */
export function BlockCanvasMantine(props: BlockCanvasProps) {
    // Simply pass through to the BlockCanvas with a hidden prop that enables Mantine mode
    return <BlockCanvas {...props} _useMantineTables={true} />;
}
