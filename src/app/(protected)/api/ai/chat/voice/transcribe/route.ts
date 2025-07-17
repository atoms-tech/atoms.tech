import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get('audio') as File;
    if (!file) {
        return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Save the uploaded file to a temp location
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whisper-'));
    const tempFilePath = path.join(tempDir, file.name);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));

    // Call Python Whisper to transcribe the audio
    return new Promise<NextResponse>((resolve) => {
        const python = spawn('python', [
            '-m',
            'whisper',
            tempFilePath,
            '--model',
            'base',
            '--language',
            'en',
            '--fp16',
            'False',
            '--output_format',
            'json',
            '--output_dir',
            tempDir,
        ]);

        let stderr = '';
        python.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        python.on('close', (code) => {
            if (code !== 0) {
                resolve(
                    NextResponse.json(
                        { error: 'Whisper failed', details: stderr },
                        { status: 500 },
                    ),
                );
                fs.rmSync(tempDir, { recursive: true, force: true });
                return;
            }
            // Find the output .json file
            const outputFiles = fs
                .readdirSync(tempDir)
                .filter((f) => f.endsWith('.json'));
            if (outputFiles.length === 0) {
                resolve(
                    NextResponse.json({ error: 'No transcript found' }, { status: 500 }),
                );
                fs.rmSync(tempDir, { recursive: true, force: true });
                return;
            }
            const transcriptJson = JSON.parse(
                fs.readFileSync(path.join(tempDir, outputFiles[0]), 'utf-8'),
            );
            const transcript = transcriptJson.text || '';
            resolve(NextResponse.json({ transcript }));
            fs.rmSync(tempDir, { recursive: true, force: true });
        });
    });
}
