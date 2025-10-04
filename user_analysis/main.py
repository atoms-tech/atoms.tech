
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
import uvicorn

# --- New: Import required libraries for extraction ---
import io
# PDF extraction
import PyPDF2
# DOCX extraction
import docx
# Image OCR
import pytesseract
from PIL import Image

app = FastAPI()


@app.post("/analyze")
async def analyze_input(
    user_input: str = Form(...),
    file: UploadFile = File(None)
):
    file_content = None
    extracted_text = None
    print("Received input:", user_input)
    if file:
        file_content = await file.read()
        print("Received file:", file.filename, "Size:", len(file_content))

        # --- New: Extract text based on file type ---
        filename = file.filename.lower()
        mime_type = file.content_type

        # TXT/MD: Read as plain text
        if mime_type in ["text/plain", "text/markdown"] or filename.endswith((".txt", ".md")):
            extracted_text = file_content.decode('utf-8', errors='ignore')

        # PDF: Use PyPDF2 for text extraction
        elif mime_type == "application/pdf" or filename.endswith('.pdf'):
            try:
                reader = PyPDF2.PdfReader(io.BytesIO(file_content))
                extracted_text = ""
                for page in reader.pages:
                    extracted_text += page.extract_text() or ""
            except Exception as e:
                extracted_text = None

        # DOCX: Use python-docx for text extraction
        elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or filename.endswith('.docx'):
            try:
                doc = docx.Document(io.BytesIO(file_content))
                extracted_text = "\n".join([para.text for para in doc.paragraphs])
            except Exception as e:
                extracted_text = None

        # Images: Use pytesseract for OCR
        elif mime_type.startswith("image/") or filename.endswith((".png", ".jpg", ".jpeg")):
            try:
                img = Image.open(io.BytesIO(file_content))
                extracted_text = pytesseract.image_to_string(img)
            except Exception as e:
                extracted_text = None

        else:
            extracted_text = None

        print("Extracted text:", extracted_text[:200] if extracted_text else "None")  # Print first 200 chars

    else:
        print("No file uploaded.")


    # --- MCP Client/ADK integration ---
    # Prepare the prompt for MCP analysis
    prompt = f"Requirement: {user_input}\nDocument Content:\n{extracted_text}"

    # TODO: Replace with actual MCP client/ADK call
    # Example:
    # from adk.mcp_client import MCPClient
    # mcp_client = MCPClient(llm="gemini-2.0-flash-001")
    # analysis_result = mcp_client.analyze(prompt)

    # For now, use a placeholder
    analysis_result = "MCP AI analysis result would go here"

    result = {
        "user_input": user_input,
        "file_uploaded": bool(file),
        "file_name": file.filename if file else None,
        "file_size": len(file_content) if file_content else 0,
        "extracted_text": extracted_text,
        "analysis": analysis_result
    }
    return JSONResponse(content=result)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
