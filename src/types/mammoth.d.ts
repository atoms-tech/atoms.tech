// Minimal type declarations for the `mammoth` and "pdf-text-extract" package used in the project.

declare module 'mammoth' {
    export interface ExtractResult {
        value: string; // extracted text
        messages?: unknown[];
    }

    export interface ExtractOptions {
        buffer: ArrayBuffer | Buffer | Uint8Array;
    }

    export function extractRawText(options: ExtractOptions): Promise<ExtractResult>;

    const mammoth: {
        extractRawText: typeof extractRawText;
    };

    export default mammoth;
}

declare module 'pdf-text-extract' {
    /**
     * Extract text pages from a PDF file.
     * @param path Path to the PDF file.
     * @param callback Callback receiving (error, pages[])
     */
    function pdfExtract(
        path: string,
        callback: (err: Error | null, pages: string[]) => void,
    ): void;

    export = pdfExtract;
}
