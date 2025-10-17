from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Literal, Dict, Any, List
import json
import re
import os # A number of new imports to support the API connector
import asyncio
from functools import lru_cache

from dotenv import load_dotenv # Supports security but technically not needed
import google.generativeai as genai # Supports Gemini API

import httpx

# Load environment variables from .env file
load_dotenv()
print("DEBUG load dotenv")
# Configure the API key from .env
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    raise ValueError("GOOGLE_API_KEY not found in .env file")
else:
    print("DEBUG API key loaded")

genai.configure(api_key = api_key)

# Initialize Gemini 2.0 Flash Code
model = genai.GenerativeModel('gemini-2.5-flash-preview-09-2025')

# Prompt file is now loaded dynamically in the generate_mermaid_with_gemini function

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # will use this later ["https://www.atoms.tech/"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DiagramType = Literal['flowchart', 'sequenceDiagram', 'classDiagram', 'sequence', 'class']


class DiagramRequest(BaseModel):
    requirement: str
    diagram_type: str

#store two inputs
fetched_data={}


def clean_mermaid_code(text: str):
    print("DEBUG clean mermaid code")
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
    print("DEBUG convert to json")

    mermaid_lines = [line.strip() for line in code.strip().splitlines()]
    joined_mermaid = "\n".join(mermaid_lines)

    # Convert to JSON format
    json_output = json.dumps({"mermaid_syntax": joined_mermaid}, separators=(',', ':'))
    return json_output


@app.post("/api/fetch_req_diagramType")
async def receive_diagram(input: DiagramRequest):
    print("DEBUG recieve diagram")
    # Fetch req and diagram type for LLM use (Input like this:)
    fetched_data["requirement"] = input.requirement
    print("DEBUG requirement: " + input.requirement) # debug
    fetched_data["diagram_type"] = input.diagram_type
    print("DEBUG diagram type: "     + input.diagram_type) # debug

    try:
        print("DEBUG try")

       
        # Then use the req and diagram type here as input and
        # use LLM for gernerate mermaid output(assigned for Evan)
        # Take the two inputs to AI via implementing API,
        # say "Ok I need this format", and this format will be in the Gumloop. Put result in comment below.

        # You are effectively a connector for these two parts. You take the two inputs located on
        # lines 70 and 71 and feed it into AI via
        # API, and ask it to return them in the format below, which can be sourced from the Gumloop.
        # '''also this below part for mermaid syntax will be not static,
        # content will be the output from Evan generate and assign here'''

        # Current comment below is for Jinduo. You are to delete it and fill it in with the results
        # of the test.
        # (Output like this:)
        
        # mermaid = "
        # graph TDhsl(0, 100.00%, 50.00%)
        # A[Vehicle in motion]->B{Seatbelt unbuckled?}
        # B -- No->F[No action]
        # B --Yes->C[Start 3s timer]
        # C -> D{Alert within 3 seconds?}
        # D -- Yes--E[Alert driver]
        # D -- No --G[Timeout / Failed]"
        
        

        # Defining the API to be used (THIS URL IS NOT REAL, IT IS A PLACEHOLDER):
        # TODO: Ask Charles how to gain direct access to Gumloop API through this code
        # DEFAULT_GUMLOOP_API_URL = "https://api.gumloop.com/api"
        # Get rid of Gumloop, we just use Gemini 2.5 Flash for all testing via student Google Cloud account for $300
        # (you can use AtomTech credits but try not to for testing)
        # -DONE: Go to Google Cloud, make a student account for $300
        # -DONE: Figure out how to connect your Gemini API to the code
        # -DONE: Do this by using the Python commands and get the library, put the API in a .env file (for security)
        # -DONE: The big prompt Charles sent you is the API prompt (check iamge)
        # -DONE: Use the following model: gemini-2.5-flash-preview-09-2025 (it released today! Let Cursor know this is the model)
        # -TODO: Use Google genlab library to replace and rework Gumloop flow
        # -TODO: Ask for Gumloop access, paste in test example above ^
        # -TODO: Ask Cursor why the output on the back end testing site is just the prompt example and not the actual input
        #        "My requirement and diagram type variables are as follows: (input variables), why is output not sourcing them?""
        # -TODO: Ask charles why output on backend testing website is errored (error_output_backend.txt)
        # Use this as a skeleton for Google API implementation, Cursor could probably do most of this
        # Method 1: Try the basic direct Google Gen AI API

        # TO CURSOR: BEGINNING OF GUT ZONE

        # Defining the mermaid type map structure:
        # TODO: Ask ChatGPT/Cursor if I need the variable repeats. provide full file and this code section.
        MERMAID_TYPE_MAP: Dict[str, str] = {
            "flowchart": "Flowchart",
            "graph": "Flowchart",
            "sequence": "Sequence",
            "sequencediagram": "Sequence",
            "sequenceDiagram": "Sequence",
            "class": "Class",
            "classdiagram": "Class",
            "classDiagram": "Class",
        }

        # Clean any input provided so that it fits processing format, then return it
        # TODO: Check how we sanitize candidates and make sure it works.
        def sanitize_candidate(candidate: str) -> str:
            print("DEBUG sanitize candidate")
            cleaned = candidate.strip()
            cleaned = re.sub(r'^```[a-zA-Z]*\n?', '', cleaned)
            cleaned = re.sub(r'\n?```$', '', cleaned)
            return cleaned.strip()

        # Handler for Google Gemini API interaction
        async def generate_mermaid_with_gemini(requirement: str, diagram_type: str) -> str:
            # Setup and validation
            normalized_type = (diagram_type or "").strip()
            lookup_key = normalized_type.lower()

            if lookup_key not in MERMAID_TYPE_MAP:
                raise HTTPException(status_code=400, detail=f"Unsupported diagram type: {diagram_type}")

            gemini_diagram_type = MERMAID_TYPE_MAP[lookup_key]
            # print(lookup_key) # debug

            # Open prompt file and reate the full prompt with the specific inputs
            file = open('prompt_Gemini_Test.txt', 'r')
            full_prompt = file.read()
            

            try:
                # Generate response using Gemini
                response = model.generate_content(full_prompt)
                
                if not response.text:
                    raise HTTPException(status_code=502, detail="Gemini API returned empty response")
                
                # Clean and validate the response
                #mermaid_code = sanitize_candidate(response.text)
                mermaid_code = response.text
                
                # Validate that the response starts with a valid Mermaid diagram type
                first_line = mermaid_code.splitlines()[0].strip().lower()
                if not first_line.startswith(("graph", "flowchart", "sequencediagram", "classdiagram")):
                    raise HTTPException(status_code=502, detail="Gemini API did not return valid Mermaid syntax")
                
                return mermaid_code
                
            # Misc error if we don't return for some reason
            except Exception as exc:
                raise HTTPException(
                    status_code=502,
                    detail=f"Gemini API error: {str(exc)}"
                ) from exc

        # Finally, function call and assignment
        mermaid_code = await generate_mermaid_with_gemini(
            fetched_data["requirement"],
            fetched_data["diagram_type"],
        )

        # Finally, assign mermaid
        mermaid = mermaid_code
        
        # TO SELF: END OF GUT ZONE

        #clean to mermaid syntax
        result = clean_mermaid_code(mermaid)

        jsonRes = convertToJson(result['code'])

        return {
            "status": "success",
            "requirement": fetched_data["requirement"],
            "diagram_type": fetched_data["diagram_type"],
            "Detected Diagram Type": result['type'],
            "Clean Mermaid Code": result['code'],
            "Json Mermaid Code": jsonRes
        }

    

    except HTTPException:
        raise
    except ValueError as exc:
        print("Mermaid parsing error:", str(exc))
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        print("Unexpected error:", str(exc))
        raise HTTPException(status_code=500, detail="Unexpected error occurred") from exc


def main():
    print("Hello, World!")  
    print("DEBUG methods")
    receive_diagram(diagram_type)  # was gemini_diagram_type
    print("DEBUG after methods")

    if __name__ == "__main__":
        main()



