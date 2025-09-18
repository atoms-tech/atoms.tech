from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Literal, Tuple, Dict
import json
import re

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:3000"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DiagramType = Literal['flowchart', 'sequenceDiagram', 'classDiagram']

class DiagramRequest(BaseModel):
    requirement: str
    diagram_type: str

#store the req and diagramType
fetched_data = {}


def clean_mermaid_code(text: str):
    code = text.strip()
    start = code.split('\n')[0].strip().lower()

    if start.startswith('graph') or start.startswith('flowchart'):
        return {
            'type': 'flowchart',
            'code': code
        }
    elif start.startswith('sequencediagram'):
        return {
            'type': 'sequenceDiagram',
            'code': code
        }
    elif start.startswith('classdiagram'):
        return {
            'type': 'classDiagram',
            'code': code
        }
    else:
        raise ValueError("Invalid mermaid code")

def convertToJson(code: str) -> str:
    mermaid_lines = [line.strip() for line in code.strip().splitlines()]
    joined_mermaid = "\n".join(mermaid_lines)

    # Convert to JSON format
    json_output = json.dumps({"mermaid_syntax": joined_mermaid}, separators=(',', ':'))
    return json_output

@app.post("/diagram")
async def receive_diagram(input: DiagramRequest):
    
    # fetch req and diagram type for LLM use
    fetched_data["requirement"] =input.requirement
    fetched_data["diagram_type"] =input.diagram_type
    try:
       
        # Then use the req and diagram type here as input and 
        # use LLM for gernerate mermaid output(assigned for evan)

        '''also this below part for mermaid syntax will be not static , 
        content will be the output from Evan generate and assign here'''

        mermaid = """
        graph TD
        A[Vehicle in motion]->B{Seatbelt unbuckled?}
        B -- No->F[No action]
        B --Yes->C[Start 3s timer]
        C -> D{Alert within 3 seconds?}
        D -- Yes--E[Alert driver]
        D -- No --G[Timeout / Failed]
        """

        #clean to mermaid syntax
        result = clean_mermaid_code(mermaid)
        
        jsonRes = convertToJson(mermaid)

        return {
            "status": "success",
            "requirement": fetched_data["requirement"],
            "diagram_type": fetched_data["diagram_type"],
            "Detected Diagram Type": result['type'],
            "Clean Mermaid Code": result['code'],
            "Json Mermaid Code": jsonRes,
        }

    except Exception as e:
        print("Error:", str(e))
