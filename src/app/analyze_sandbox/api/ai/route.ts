//import { NextRequest, NextResponse } from 'next/server';

//import {
// PipelineRunState,
//StartPipelineParams,
//gumloopService,
//} from '@/lib/services/gumloop';

// // import { createClient } from '@/lib/supabase/supabaseServer';

// export async function POST(request: NextRequest) {
//     try {
//         // Parse and validate request body
//         const body = (await request.json()) as StartPipelineParams;

//         const pipelineResponse = await gumloopService.startPipeline(body);

//         return NextResponse.json(pipelineResponse);
//     } catch (error) {
//         console.error('API error:', error);
//         return NextResponse.json(
//             {
//                 error: error instanceof Error ? error.message : 'An error occurred',
//             },
//             { status: 500 },
//         );
//     }
// }

// // GET method for pipeline status checks
// export async function GET(request: NextRequest) {
//     try {
//         const runId = request.nextUrl.searchParams.get('runId');
//         if (!runId) {
//             return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
//         }

//         // const organizationId = request.nextUrl.searchParams.get('organizationId');

//         const status = await gumloopService.getPipelineRun({ runId });

//         // if (status.state == PipelineRunState.DONE) {
//         //     console.log(
//         //         `Adding ${status.credit_cost} cost to the billing cache`,
//         //     );

//         //     // increment the API usage counter
//         //     const supabase = await createClient();
//         //     const { data: billingRecord, error } = await supabase
//         //         .from('billing_cache')
//         //         .select('*')
//         //         .eq('organization_id', organizationId)
//         //         .single();

//         //     if (error) throw error;

//         //     // @ts-expect-error The property exists
//         //     billingRecord.current_period_usage.api_calls += status.credit_cost;
//         //     if (!billingRecord.current_period_usage) {
//         //         throw new Error('No billing record found');
//         //     }

//         //     // Update the record in database
//         //     const { error: updateError } = await supabase
//         //         .from('billing_cache')
//         //         .update({
//         //             current_period_usage: {
//         //                 // @ts-expect-error The property exists
//         //                 ...billingRecord.current_period_usage,
//         //             },
//         //         })
//         //         .eq('organization_id', organizationId)
//         //         .select();

//         //     if (updateError) throw updateError;
//         // }

//         return NextResponse.json(status);
//     } catch (error) {
//         console.error('API error:', error);
//         return NextResponse.json(
//             {
//                 error: error instanceof Error ? error.message : 'An error occurred',
//             },
//             { status: 500 },
//         );
//     }
// }

import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
//take care of different file types
import mammoth from 'mammoth';
import { NextRequest, NextResponse } from 'next/server';
import pdfExtract from 'pdf-text-extract';
import Tesseract from 'tesseract.js';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    console.log(' API Route ');

    try {
        // --- Parse form data ---
        const formData = await request.formData();
        const userInput = formData.get('user_input') as string;
        const file = formData.get('file') as File | null;
        console.log(' User input:', userInput || '(none)');
        console.log('File uploaded:', !!file ? file.name : 'no file');
        let extractedText = '';

        // --- File handling ---
        if (file) {
            const bytes = Buffer.from(await file.arrayBuffer());
            const fileName = file.name.toLowerCase();

            try {
                if (fileName.endsWith('.pdf')) {
                    console.log('Extracting text using pdf-text-extract...');
                    const tempPath = `/tmp/${file.name}`;
                    await fs.promises.writeFile(tempPath, bytes);
                    try {
                        extractedText = await new Promise((resolve, reject) => {
                            pdfExtract(tempPath, (err, pages) => {
                                if (err) return reject(err);
                                resolve(pages.join('\n'));
                            });
                        });
                    } finally {
                        await fs.promises.unlink(tempPath);
                    }
                }

                if (fileName.endsWith('.docx')) {
                    console.log('Extracting text from DOCX...');
                    const { value } = await mammoth.extractRawText({ buffer: bytes });
                    extractedText = value;
                    console.log('DOCX text extracted. Length:', extractedText.length);
                } else if (fileName.match(/\.(png|jpg|jpeg)$/)) {
                    console.log('Extracting text from image via OCR...');
                    const { data } = await Tesseract.recognize(bytes, 'eng');
                    extractedText = data.text;
                    console.log('OCR text extracted. Length:', extractedText.length);
                } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
                    console.log('Reading plain text file...');
                    extractedText = bytes.toString('utf8');
                    console.log('Text file read. Length:', extractedText.length);
                } else {
                    console.warn('Unsupported file type:', fileName);
                    extractedText = 'Unsupported file type.';
                }
            } catch (parseErr: unknown) {
                console.error('File parsing error:', parseErr);
                const msg =
                    parseErr instanceof Error ? parseErr.message : 'unknown error';
                extractedText = `Failed to extract text from file: ${msg}`;
            }
        }

        // --- Build strict JSON prompt for AI ,this is temp prompt need to be enhanced later---
        const prompt = `
You are a requirement analysis assistant.
Analyze the following user requirement and extracted document content.

Respond ONLY with a valid JSON object in this format. Do NOT wrap in code fences or markdown. Return raw JSON only:
{
  "ears": "<short EARS format sentence>",
  "incose": "<clarity, completeness, verifiability, feasibility ratings or summary>",
  "compliance": "<compliance summary>",
  "enhanced_ears": "<improved EARS requirement>",
  "enhanced_incose": "<improved INCOSE requirement>",
  "general_feedback": "<general feedback or summary>"
}
IMPORTANT: Do not include any extra text, comments, or explanation. Your response must be parseable by JSON.parse(). Use double quotes for all keys and values. Do not use trailing commas or single quotes.

User Requirement:
${userInput}

Extracted File Content (first 1500 chars):
${extractedText.slice(0, 1500)}
`;
        console.log('Built AI prompt (first 200 chars):', prompt.slice(0, 200));

        // ---Initialize Gemini ---
        if (!process.env.GEMINI_API_KEY) {
            console.error('Missing GEMINI_API_KEY in environment variables');
            throw new Error('GEMINI_API_KEY is missing');
        }

        const genAI = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY!,
        });

        console.log('Sending prompt to Gemini 2.5 Flash...');

        let analysisResult = 'No response generated.';
        try {
            const response = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            console.log('Gemini response received');
            // Prefer text; fallback to candidates/parts depending on SDK version
            type GenAITextResponse = {
                text?: string;
                outputText?: () => string;
                candidates?: Array<{
                    content?: { parts?: Array<{ text?: string }> };
                }>;
            };
            const r = response as unknown as GenAITextResponse;
            if (typeof r.text === 'string' && r.text.length > 0) {
                analysisResult = r.text;
            } else if (typeof r.outputText === 'function') {
                analysisResult = r.outputText() ?? analysisResult;
            } else if (Array.isArray(r.candidates) && r.candidates.length > 0) {
                const parts = r.candidates[0]?.content?.parts ?? [];
                const joined = parts
                    .map((p) => p.text ?? '')
                    .filter(Boolean)
                    .join('\n');
                if (joined) analysisResult = joined;
            }
        } catch (apiErr: unknown) {
            console.error('Gemini API error:', apiErr);
            const msg =
                apiErr instanceof Error ? apiErr.message : 'Gemini API request failed';
            throw new Error(msg);
        }

        // --- Parse AI response as JSON with fallback ---
        let structuredAnalysis = {
            ears: 'N/A',
            incose: 'N/A',
            compliance: 'N/A',
            enhanced_ears: 'N/A',
            enhanced_incose: 'N/A',
            general_feedback: 'N/A',
        };
        const extractJsonString = (raw: string): string | null => {
            if (!raw) return null;
            // Fenced code block ```json ... ``` or ``` ... ```
            const fence = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            if (fence && fence[1]) {
                return fence[1].trim();
            }
            // First balanced looking JSON slice between first { and last }
            const first = raw.indexOf('{');
            const last = raw.lastIndexOf('}');
            if (first !== -1 && last !== -1 && last > first) {
                return raw.slice(first, last + 1).trim();
            }
            return null;
        };

        const stripTrailingCommas = (s: string) => s.replace(/,\s*([}\]])/g, '$1');

        const tryParse = (text: string): Record<string, unknown> | null => {
            try {
                return JSON.parse(text);
            } catch {
                /* continue */
            }
            const candidate = extractJsonString(text);
            if (candidate) {
                try {
                    return JSON.parse(candidate);
                } catch {
                    /* continue */
                }
                try {
                    return JSON.parse(stripTrailingCommas(candidate));
                } catch {
                    /* continue */
                }
            }
            try {
                return JSON.parse(stripTrailingCommas(text));
            } catch {
                /* continue */
            }
            return null;
        };

        const parsed = tryParse(analysisResult);
        if (parsed) {
            structuredAnalysis = {
                ears: (parsed.ears ?? 'N/A')?.toString().trim() || 'N/A',
                incose: (parsed.incose ?? 'N/A')?.toString().trim() || 'N/A',
                compliance: (parsed.compliance ?? 'N/A')?.toString().trim() || 'N/A',
                enhanced_ears:
                    (parsed.enhanced_ears ?? 'N/A')?.toString().trim() || 'N/A',
                enhanced_incose:
                    (parsed.enhanced_incose ?? 'N/A')?.toString().trim() || 'N/A',
                general_feedback:
                    (parsed.general_feedback ?? 'N/A')?.toString().trim() || 'N/A',
            };
        } else {
            console.error(
                'Failed to parse AI JSON response; returning defaults. Raw:',
                analysisResult.slice(0, 500),
            );
        }

        // ---  Return structured JSON ---
        console.log('Sending analysis result back to frontend...');
        return NextResponse.json({
            success: true,
            user_input: userInput,
            file_uploaded: !!file,
            file_name: file?.name ?? null,
            extracted_text_length: extractedText.length,
            analysis: structuredAnalysis,
        });
    } catch (error: unknown) {
        console.error('Unhandled /api/ai error:', error);
        return NextResponse.json(
            {
                error: true,
                message:
                    error instanceof Error
                        ? error.message
                        : typeof error === 'string'
                          ? error
                          : JSON.stringify(error, null, 2) || 'Unknown error',
                stack: error instanceof Error ? error.stack : null,
            },
            { status: 500 },
        );
    }
}
