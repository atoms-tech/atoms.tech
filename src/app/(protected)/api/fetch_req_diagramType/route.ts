import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { requirement, diagram_type } = req.body;

        // Optional: generate mermaid here
        const mermaid = `sequenceDiagram
    participant User
    participant System
    User->>System: ${requirement}
    Note right of System: Type: ${diagram_type}`;

        res.status(200).json({ mermaid });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
