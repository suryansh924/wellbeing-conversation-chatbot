# app/routes/report.py

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from io import BytesIO
from datetime import datetime
from pydantic import BaseModel
from typing import Dict
from database.conn import get_db
from database.models import Conversation, Message
from transformers import pipeline
from aws_uploader import upload_pdf_to_s3

router = APIRouter()

# Initialize DistilBERT emotion classifier with bhadresh-savani model
emotion_classifier = pipeline("text-classification", model="bhadresh-savani/distilbert-base-uncased-emotion", top_k=None)

class ReportRequest(BaseModel):
    conversation_id: int
    employee_id: str
    shap_values: Dict[str, float]

def analyze_emotions(messages):
    """
    Analyze emotions in employee messages and return a severity score (0-100) and escalation flag.
    """
    employee_messages = [msg.content for msg in messages if msg.sender_type.lower() != "assistant"]
    if not employee_messages:
        return 50, False  # Default to neutral
    
    # Analyze emotions for each message
    total_sadness = 0
    total_anger = 0
    for msg in employee_messages:
        emotions = emotion_classifier(msg)[0]  # List of dicts with label and score
        sadness = next((e["score"] for e in emotions if e["label"] == "sadness"), 0)
        anger = next((e["score"] for e in emotions if e["label"] == "anger"), 0)
        total_sadness += sadness
        total_anger += anger
    
    # Average scores
    avg_sadness = total_sadness / len(employee_messages)
    avg_anger = total_anger / len(employee_messages)
    
    # Severity score: max of sadness or anger, scaled to 0-100
    severity_score = max(avg_sadness, avg_anger) * 100
    escalate = severity_score > 75  # Threshold for HR escalation
    
    return severity_score, escalate

@router.post("/employee")
def generate_report(request: ReportRequest, db: Session = Depends(get_db)):
    """
    Generate a PDF report from the conversation and upload it to AWS S3.
    Returns the public S3 URL of the PDF.
    """
    # Fetch conversation record
    conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if not conversation.message_ids:
        raise HTTPException(status_code=404, detail="No messages found for this conversation")

    # Fetch and sort messages
    messages = db.query(Message).filter(Message.id.in_(conversation.message_ids)).all()
    messages.sort(key=lambda m: m.id)

    # Build conversation history
    conversation_history = [
        {"role": "Chatbot" if msg.sender_type.lower() == "chatbot" else "Employee", "content": msg.content}
        for msg in messages
    ]

    # Perform emotion analysis
    severity_score, escalate = analyze_emotions(messages)

    # Determine sentiment label and commentary
    if severity_score <= 25:
        sentiment = "Positive"
        sentiment_commentary = "The employee appears happy and engaged."
    elif severity_score <= 50:
        sentiment = "Neutral"
        sentiment_commentary = "The employee’s responses indicate a balanced mood."
    elif severity_score <= 75:
        sentiment = "Negative"
        sentiment_commentary = "The employee shows signs of sadness or frustration."
    else:
        sentiment = "Severe"
        sentiment_commentary = "The employee exhibits strong signs of sadness or anger. HR action recommended."

    # Prepare report data
    report_data = {
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/5/56/Deloitte.svg",
        "employee_name": conversation.employee_name,
        "employee_id": request.employee_id,
        "date": conversation.date.strftime("%Y-%m-%d") if conversation.date else datetime.now().strftime("%Y-%m-%d"),
        "time": conversation.time.strftime("%H:%M:%S") if conversation.time else datetime.now().strftime("%H:%M:%S"),
        "executive_summary": (
            "This report summarizes the employee’s conversation with the chatbot, highlighting key factors "
            "affecting their well-being based on provided SHAP values and emotion analysis."
        ),
        "conversation_history": conversation_history,
        "shap_values": request.shap_values,
        "sentiment": sentiment,
        "severity_score": round(severity_score, 2),
        "sentiment_commentary": sentiment_commentary,
        "escalate": escalate,
        "detailed_insights": (
            "Recommendations: " + (
                "Immediate HR intervention required due to severe emotional state." if escalate else
                "Monitor employee well-being and consider follow-up discussions."
            )
        )
    }

    # Render the HTML template using Jinja2
    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("report_template.html")
    html_content = template.render(report_data=report_data)

    # Generate PDF with xhtml2pdf in-memory
    pdf_file = BytesIO()
    pisa_status = pisa.CreatePDF(html_content, dest=pdf_file)

    if pisa_status.err:
        raise HTTPException(status_code=500, detail="Error generating PDF with xhtml2pdf")

    pdf_file.seek(0)  # Reset the buffer pointer
    pdf_bytes = pdf_file.getvalue()

    # S3 Upload
    filename = f"report_{request.employee_id}_{request.conversation_id}.pdf"
    s3_url = upload_pdf_to_s3(pdf_bytes, filename)

    # Close PDF buffer
    pdf_file.close()

    conversation.report = s3_url
    db.commit()

    return {"message": "PDF report uploaded successfully", "pdf_url": s3_url}