'use client';

import { BlockCanvas } from './index';
import { BlockCanvasProps } from './types';

/**
 * BlockCanvasGlide - A version of BlockCanvas that uses GlideEditableGrid
 *
 * This component is identical to the regular BlockCanvas except it uses
 * the Glide Table implementation for the EditableTable.
 *
 * This is achieved by setting a global context value that the TableBlockContent
 * component will use to decide which EditableTable implementation to render.
 */
export function BlockCanvasGlide(props: BlockCanvasProps) {
    return <BlockCanvas {...props} _useGlideTables={true} />;
}
