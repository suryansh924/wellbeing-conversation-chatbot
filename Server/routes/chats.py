from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import requests
import json
from dotenv import load_dotenv
import os
from question_bank import question_bank
from gemini import generate_text
from database.conn import get_db
from typing import List, Dict
from datetime import datetime
from chatgpt import chat_with_gpt4o

from database.models import Conversation,Message


load_dotenv()
API_KEY = os.getenv("GENAI_API_KEY")
BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

router = APIRouter()

class StartConversationRequest(BaseModel):
    employee_name: str
    employee_id: str
    shap: List[str]

class MessageRequest(BaseModel):
    employee_name: str
    employee_id:str
    shap: List[str]
    message: str
    conversation_id:int
    selected_questions:List[str]
    chat_history:List[Dict[str, str]]


class PromptRequest(BaseModel):
    prompt: str


@router.post("/start")
async def start_conversation(request: StartConversationRequest, db: Session = Depends(get_db)):
    greeting_prompt = f"Generate a greeting message for {request.employee_name} and ask his/her vibe of today."
    greeting_message = chat_with_gpt4o(greeting_prompt)
    gemini_message = Message(
        content=greeting_message,
        sender_type="chatbot"
    )
    db.add(gemini_message)
    db.commit()
    db.refresh(gemini_message)

    # Pre-select the questions based on `shap` topics
    selected_questions = []
    for topic in request.shap:
        if topic in question_bank:
            selected_questions.extend(question_bank[topic])

    if not selected_questions:
        raise HTTPException(status_code=400, detail="No valid questions found for the given SHAP topics")
    
    now = datetime.now()
    new_conversation = Conversation(
        employee_id=request.employee_id,
        employee_name=request.employee_name,
        message_ids=[gemini_message.id],  # Store the message ID
        date=now.date(),
        time=now.time()
    )
    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)
    return {"chatbot_response":greeting_message , "conversation_id":new_conversation.id ,"selected_questions":selected_questions}   # Send the conversation id along with the message



@router.post("/message")
async def send_message(request: MessageRequest, db: Session = Depends(get_db)):
    """
    Accepts employee message, generates chatbot response, and appends both
    message IDs to the existing conversation using `conversation_id`.
    """
    try:
        # Retrieve existing conversation using `conversation_id`
        conversation = db.query(Conversation).filter_by(id=request.conversation_id).first()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Store the employee's message in `Message` table
        employee_message = Message(
            content=request.message,
            sender_type="employee"
        )
        db.add(employee_message)
        db.commit()
        db.refresh(employee_message)

        # Retrieve the chat-history
        chat_history  = request.chat_history
        chat_history_text = "\n".join([
            f"{msg['sender_type'].capitalize()}: {msg['message']}"
            for msg in chat_history
        ])

        # Retrieve the pre-selected questions
        questions = request.selected_questions
        if not questions:
            raise HTTPException(status_code=404, detail="No pre-selected questions found")
        question_text = "\n".join([f"- {q}" for q in questions])


        # Generate AI's response
        ai_prompt = f"""
The employee's response is: {request.message} 

- Based on this response, provide suggestionas and ask **ONLY ONE follow-up question** strictly from the question bank provided below.
- **Your response MUST be Two sentences.**
- **You are provided with your chat history with the employee**
- **Understand the context of conversation from the chat history and you can tweak accordingly, the next question from the question bank.**
- **STRICTLY follow the provided format**.
- **After asking five-six questions, end the Conversation.

### Your Chat History: {chat_history_text}

### Question bank:
{question_text}
"""
        generated_message = chat_with_gpt4o(ai_prompt)

        # Store the AI response in `Message` table
        chatbot_message = Message(
            content=generated_message,
            sender_type="chatbot"
        )
        db.add(chatbot_message)
        db.commit()
        db.refresh(chatbot_message)

        # Append both message IDs to the existing conversation
        conversation.message_ids.append(employee_message.id)
        conversation.message_ids.append(chatbot_message.id)
        db.commit()

        # Append current employee message to the chat history
        chat_history.append({
            "sender_type": "employee",
            "message": request.message
        })
        # Append chatbot message to the chat history
        chat_history.append({
            "sender_type": "chatbot",
            "message": generated_message
        })        
        return {
            "ai_prompt":ai_prompt,
            "chatbot_response": generated_message,
            "conversation_id": conversation.id,
            "chat_history":chat_history
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/history/employee/{employee_id}")
def get_conversation_history(employee_id: str,db:Session = Depends(get_db)):
    try:
        conversations = db.query(Conversation).filter(Conversation.employee_id == employee_id).all()
        if not conversations:
            raise HTTPException(status_code=404, detail="No conversations found for this employee ID")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetcging the conversations: {str(e)}")
    # Return the conversations
    return {"conversations": conversations}


@router.get("/history/{conversation_id}")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):  # Ensure ID is int if it's an integer column
    try:
        # Fetch the conversation by ID
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Fetch associated messages by their IDs
        messages = db.query(Message).filter(Message.id.in_(conversation.message_ids)).all()

        # Format the response
        message_list = [{"id": msg.id, "content": msg.content, "sender_type": msg.sender_type} for msg in messages]

        return message_list

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights/{conversation_id}")
def get_insights(conversation_id: int, db: Session = Depends(get_db)):
    """
    Generate insights based on the entire conversation using Gemini.
    """
    try:
        # 1. Fetch the conversation by ID
        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # 2. Fetch all messages associated with this conversation
        messages = db.query(Message).filter(Message.id.in_(conversation.message_ids)).all()

        if not messages:
            raise HTTPException(status_code=404, detail="No messages found for this conversation")

        # 3. Compile the conversation history
        conversation_history = ""
        for msg in messages:
            role = "Employee" if msg.sender_type == "employee" else "Chatbot"
            conversation_history += f"{role}: {msg.content}\n"

        # 4. Create an insightful prompt for openai
        insight_prompt = (
            f"Here is a conversation between the employee ({conversation.employee_name}) and a chatbot:\n\n"
            f"{conversation_history}\n\n"
            f"Generate detailed insights based on this conversation:\n"
            f"- Identify the employee's mood, concerns, and sentiments.\n"
            f"- Highlight key issues or recurring themes.\n"
            f"- Provide suggestions or recommendations to improve the situation.\n"
            f"- Format the insights in a clear and organized manner."
        )
        # 5. Generate insights using Gemini
        insights = chat_with_gpt4o(insight_prompt)

        # 6. Return the insights
        return {
            "conversation_id": conversation.id,
            "employee_id": conversation.employee_id,
            "employee_name": conversation.employee_name,
            "insights": insights
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")

@router.post("/test")
def generate(request: PromptRequest):
    try:
        response = generate_text(request.prompt)
        return {"response": response}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")   
