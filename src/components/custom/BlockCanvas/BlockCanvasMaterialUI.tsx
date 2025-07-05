'use client';

import { BlockCanvas } from './index';
import { BlockCanvasProps } from './types';

/**
 * BlockCanvasMaterialUI - A version of BlockCanvas that uses Material UI tables
 *
 * This component is identical to the regular BlockCanvas except it uses
 * the Material UI table implementation for the EditableTable.
 *
 * This is achieved by setting a global context value that the TableBlockContent
 * component will use to decide which EditableTable implementation to render.
 */
export function BlockCanvasMaterialUI(props: BlockCanvasProps) {
    // Simply pass through to the BlockCanvas with a hidden prop that enables Material UI mode
    return <BlockCanvas {...props} _useMaterialUITables={true} />;
}
