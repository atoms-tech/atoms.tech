from RequirementAnalysisAgent.agent import root_agent as requirement_analysis_agent
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.runners import Runner
from google.genai.types import Content, Part
import asyncio

APP_NAME = "test_app"
USER_ID = "test_user"
SESSION_ID = "test_session"

async def AnalyseRequirement(prompt: str):

    ### This will help in retaining the memory of agent
    session_service = InMemorySessionService()
    await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )

    ### This is the wrapper class which starts the loop of agent
    requirement_analysis_runner = Runner(agent=requirement_analysis_agent, app_name=APP_NAME, session_service=session_service)

    # wrap the user message, Don't know why this is needed have to look further in the documentation
    user_content = Content(role="user", parts=[Part(text=prompt)])

    async for event in requirement_analysis_runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=user_content):
        if event.is_final_response():
            return event.content.parts[0].text
    return "{error: analysis could not be completed}"

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("-userInput", type=str, required=True)
    parser.add_argument("-extractedText", type=str, required=True)
    args = parser.parse_args()

    userInput = args.userInput
    extractedText = args.extractedText

    prompt = f"""User Requirement: {userInput}\n
                Extracted Text: {extractedText}\n
                Analyze the user requirement and generate a structured requirements in EARS and INCOSE format."""
    
    print(asyncio.run(AnalyseRequirement(prompt)))