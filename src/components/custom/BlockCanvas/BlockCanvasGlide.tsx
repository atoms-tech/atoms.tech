'use client';

// This is a version of the BlockCanvas component that uses Glide Tables
// for the EditableTable component.
import { BlockCanvas } from './index';
import { BlockCanvasProps } from './types';

/**
 * BlockCanvasGlide - A version of BlockCanvas that uses Glide Tables
 *
 * This component is identical to the regular BlockCanvas except it uses
 * the Glide Table implementation for the EditableTable.
 *
 * This is achieved by setting a global context value that the TableBlockContent
 * component will use to decide which EditableTable implementation to render.
 */
export function BlockCanvasGlide(props: BlockCanvasProps) {
    // Simply pass through to the BlockCanvas with a hidden prop that enables Glide mode
    return <BlockCanvas {...props} _useGlideTables={true} />;
}
