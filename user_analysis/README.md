
# User Analysis API (FastAPI)

This folder contains a FastAPI application for analyzing user input and uploaded files using MCP AI via agent orchestration (ADK).

## Setup Instructions

1. **Install Python dependencies:**
   ```bash
   pip install fastapi uvicorn python-multipart PyPDF2 python-docx pytesseract Pillow
   ```

2. **Run the API server:**
   ```bash
   python main.py
   ```
   The server will start at `http://localhost:8000`.

3. **Test the `/analyze` endpoint:**
   - Use Postman, curl, or any HTTP client to send a POST request to:
     `http://localhost:8000/analyze`
   - Send form data:
     - `user_input`: Requirement text (string)
     - `file`: (optional) Upload a file (PDF, DOCX, TXT, MD, PNG, JPG, JPEG, etc.)

   Example using `curl`:
   ```bash
   curl -X POST "http://localhost:8000/analyze" -F "user_input=The system shall allow authenticated users to reset their password within 5 minutes of requesting a reset link." -F "file=@filepath"
   ```
   eg:curl -X POST "http://localhost:8000/analyze" -F "user_input=The system shall allow authenticated users to reset their password within 5 minutes of requesting a reset link." -F "file=@C:/Users/summe/Desktop/atoms.tech/atoms-mcp/user_analysis/sample_regulation.docx"
   
## How it works
- The API receives user input and an optional file upload.
- Extracts text/content from any file type (PDF, DOCX, TXT, MD, images).
- Prepares a prompt and sends it to the MCP client via ADK for LLM analysis (e.g., Google Gemini).
- Returns the analysis result to the frontend for display.

## MCP Client Integration
- Integrate the MCP client (ADK) in `main.py` where indicated.
- Example placeholder:
  ```python
  # from adk.mcp_client import MCPClient
  # mcp_client = MCPClient(llm="gemini-2.0-flash-001")
  # analysis_result = mcp_client.analyze(prompt)
  ```
- Replace the placeholder with your actual MCP client code.

## Notes
- Make sure `python-multipart` is installed for file uploads to work.
- Extend the API as needed for your project and MCP workflow.

---
For questions, contact Jinduo please
