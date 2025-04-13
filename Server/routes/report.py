# app/routes/report.py

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa
from io import BytesIO
from datetime import datetime
from pydantic import BaseModel
from typing import Dict
from database.conn import get_db
from database.models import Conversation, Message, Master, Vibemeter, Leave, Performance, Rewards, ActivityTracker,HRUser
from .auth import verify_user
from transformers import pipeline
from aws_uploader import upload_pdf_to_s3
import os
import json
from openai import AsyncOpenAI
from datetime import datetime
import concurrent.futures
import asyncio
import httpx


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

# @router.post("/employee")
# def generate_report(request: ReportRequest, db: Session = Depends(get_db)):
#     """
#     Generate a PDF report from the conversation and upload it to AWS S3.
#     Returns the public S3 URL of the PDF.
#     """
#     # Fetch conversation record
#     conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
#     if not conversation:
#         raise HTTPException(status_code=404, detail="Conversation not found")
    
#     if not conversation.message_ids:
#         raise HTTPException(status_code=404, detail="No messages found for this conversation")

#     # Fetch and sort messages
#     messages = db.query(Message).filter(Message.id.in_(conversation.message_ids)).all()
#     messages.sort(key=lambda m: m.id)

#     # Build conversation history
#     conversation_history = [
#         {"role": "Chatbot" if msg.sender_type.lower() == "chatbot" else "Employee", "content": msg.content}
#         for msg in messages
#     ]

#     # Perform emotion analysis
#     severity_score, escalate = analyze_emotions(messages)

#     # Determine sentiment label and commentary
#     if severity_score <= 25:
#         sentiment = "Positive"
#         sentiment_commentary = "The employee appears happy and engaged."
#     elif severity_score <= 50:
#         sentiment = "Neutral"
#         sentiment_commentary = "The employee’s responses indicate a balanced mood."
#     elif severity_score <= 75:
#         sentiment = "Negative"
#         sentiment_commentary = "The employee shows signs of sadness or frustration."
#     else:
#         sentiment = "Severe"
#         sentiment_commentary = "The employee exhibits strong signs of sadness or anger. HR action recommended."

#     # Prepare report data
#     report_data = {
#         "logo_url": "https://upload.wikimedia.org/wikipedia/commons/5/56/Deloitte.svg",
#         "employee_name": conversation.employee_name,
#         "employee_id": request.employee_id,
#         "date": conversation.date.strftime("%Y-%m-%d") if conversation.date else datetime.now().strftime("%Y-%m-%d"),
#         "time": conversation.time.strftime("%H:%M:%S") if conversation.time else datetime.now().strftime("%H:%M:%S"),
#         "executive_summary": (
#             "This report summarizes the employee’s conversation with the chatbot, highlighting key factors "
#             "affecting their well-being based on provided SHAP values and emotion analysis."
#         ),
#         "conversation_history": conversation_history,
#         "shap_values": request.shap_values,
#         "sentiment": sentiment,
#         "severity_score": round(severity_score, 2),
#         "sentiment_commentary": sentiment_commentary,
#         "escalate": escalate,
#         "detailed_insights": (
#             "Recommendations: " + (
#                 "Immediate HR intervention required due to severe emotional state." if escalate else
#                 "Monitor employee well-being and consider follow-up discussions."
#             )
#         )
#     }

#     # Render the HTML template using Jinja2
#     env = Environment(loader=FileSystemLoader("templates"))
#     template = env.get_template("report_template.html")
#     html_content = template.render(report_data=report_data)

#     # Generate PDF with xhtml2pdf in-memory
#     pdf_file = BytesIO()
#     pisa_status = pisa.CreatePDF(html_content, dest=pdf_file)

#     if pisa_status.err:
#         raise HTTPException(status_code=500, detail="Error generating PDF with xhtml2pdf")

#     pdf_file.seek(0)  # Reset the buffer pointer
#     pdf_bytes = pdf_file.getvalue()

#     # S3 Upload
#     filename = f"report_{request.employee_id}_{request.conversation_id}.pdf"
#     s3_url = upload_pdf_to_s3(pdf_bytes, filename)

#     # Close PDF buffer
#     pdf_file.close()

#     conversation.report = s3_url
#     db.commit()

#     return {"message": "PDF report uploaded successfully", "pdf_url": s3_url}




# Set up OpenAI API key
client=AsyncOpenAI()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Replace with your actual API key or use environment variables

# Function to make API calls to OpenAI
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

async def generate_content(system_prompt, user_prompt, model="gpt-4o", temperature=0.4):
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            max_tokens=1500,
        )
        # Extract the text from the response
        # print(response)
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating content")
    
    
async def generate_personal_details_section(employee_data={}, vibe_data={}, leave_data={}, performance_data={}, rewards_data={}, activity_data={}):
    system_prompt = """
    You are an HR analytics expert tasked with preparing an employee profile section for an internal report.
    Your output should be concise, factual, and professionally formatted.
    Structure the information clearly with appropriate headings and bullet points.
    Present the data neutrally without making judgments about the employee.
    Include all relevant identifiers and metrics provided in the data.
    """
    
    user_prompt = f"""
    Create the 'Personal Details' section of an employee report using the following data:
    
    Employee Information:
    {json.dumps(employee_data, indent=2)}

    {f'Vibe Meter Data: {json.dumps(vibe_data, indent=2)}' if vibe_data else ''}

    {f'Leave Information:{json.dumps(leave_data, indent=2)}' if leave_data else ''}

    {f'Performance Summary:{json.dumps(performance_data, indent=2)}' if performance_data else ''}

    {f'Rewards & Recognition:{json.dumps(rewards_data, indent=2)}' if rewards_data else ''}

    {f'Activity Metrics: {json.dumps(activity_data, indent=2)}' if activity_data else ''}
    
    Format this as a professional HR report section titled "Personal Details" with appropriate subsections for each data category.
    Include the employee's current mood rating from the Vibe Meter data and keep each subsection pretty short. Overall keep the content very precise and short.
    """
    
    return await generate_content(system_prompt, user_prompt)

async def generate_pre_conversation_analysis(shap_data, dataset_mapping):
    system_prompt = """
    You are a data scientist specializing in HR analytics and SHAP (SHapley Additive exPlanations) value interpretation.
    Your task is to analyze SHAP values that show which features are influencing an employee's mood/vibe score.
    Explain the SHAP values in clear, non-technical language appropriate for HR managers.
    Identify which features are positively and negatively affecting the employee's vibe.
    Rank the features by their absolute impact on the prediction.
    Provide actionable insights based on this analysis.
    """
    
    user_prompt = f"""
    Create a 'Data Analysis Pre-Conversation' section for an employee report using the following SHAP data:
    
    SHAP FEATURES AND THEIR VALUES (in descending order of impact):
    {json.dumps(shap_data, indent=2)}
    
    Dataset Mapping (which dataset each feature belongs to):
    {json.dumps(dataset_mapping, indent=2)}
    
    Please include:
    1. A detailed analysis of which features are affecting the employee's vibe most significantly
    2. Clear separation of positive and negative influencing factors
    3. The reason this employee was selected for a conversation based on this analysis
    4. Any patterns or correlations worth noting
    
    Format this as a professional analytical report section with appropriate headings and bullet points where needed and keep each subsection pretty short. Overall keep the content very precise and short.
    """
    
    return await generate_content(system_prompt, user_prompt)


async def generate_conversation_summary(conversation_transcript):
    system_prompt = """
    You are an expert in employee communications analysis working in HR.
    Your task is to summarize a conversation between an employee and an HR chatbot/representative.
    Focus on extracting key themes, concerns, and emotional states expressed by the employee.
    Maintain complete confidentiality and objectivity in your analysis.
    Be thorough but concise, highlighting only the most relevant information.
    Look specifically for expressions of the employee's emotional state or work challenges.
    """
    
    user_prompt = f"""
    Create a 'Conversation Summary' section for an employee report based on the following conversation transcript:
    
    {conversation_transcript}
    
    Please include:
    1. A concise summary of the main topics discussed in the conversation
    2. Notable points raised by the employee regarding their emotional state or well-being 
    3. Any specific work-related concerns or challenges mentioned or Key questions or requests made by the employee
    4. Any immediate needs or support requirements identified
    
    Format this as a professional report section with clear headings and bullet points where appropriate.
    Maintain the employee's privacy by focusing on themes rather than specific personal details and keep each subsection short. Overall keep the content very precise and short.
    """
    
    return await generate_content(system_prompt, user_prompt)

async def generate_sentiment_analysis(conversation_transcript, severity_score):

    
    system_prompt = """
    You are an AI specialist in natural language processing and sentiment analysis with expertise in workplace psychology.
    Your task is to perform a detailed sentiment analysis of an employee-HR conversation.
    Identify emotional patterns, stress indicators, anxiety levels, and overall emotional tone.
    Look for linguistic markers of specific emotional states (frustration, optimism, burnout, engagement).
    Track the emotional arc of the conversation (how sentiment changes throughout).
    Identify emotional peaks and valleys, noting what topics triggered these changes.
    Analyze self-reflection patterns where the employee discusses their own state or needs.
    Be objective, detailed, and psychologically insightful in your analysis.
    """
    
    user_prompt = f"""
    Create a 'Sentiment Analysis' section for an employee report based on the following conversation transcript:
    
    {conversation_transcript}
    
    Please include:
    1. Overall emotional tone assessment of the conversation and Analysis of stress or anxiety levels detected in the employee's language
    2. Direction in which the conversation trends (improving/deteriorating/neutral)
    3. Sentiment score (0-100) based on the conversation with the bot: {severity_score}
    3. Identification of emotional peaks in the conversation (moments of highest positive or negative sentiment)
    4. Analysis of specific language patterns indicating frustration or optimism
    5. Notable self-reflections where the employee identifies their own needs or challenges

    The sentiment score is a measure of the employee's emotional state during the conversation.
    The score is calculated based on the analysis of the conversation transcript and ranges from 0 to 100, where:
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
    
    Format this as a professional analytical report with appropriate subsections and quantitative measures where possible.
    Support your analysis with specific examples from the conversation when relevant and keep each subsection short. Overall keep the content very precise and short.
    """
    
    return await generate_content(system_prompt, user_prompt, temperature=0.3)

async def generate_root_cause_analysis(conversation_transcript,shap_data, dataset_mapping):
    system_prompt = """
    You are an organizational psychologist specializing in employee well-being and workplace dynamics.
    Your task is to analyze an employee conversation alongside relevant HR data to identify root causes of the employee's current emotional state.
    Provide a systemic analysis that connects different factors and identifies primary drivers.
    Consider both professional factors (workload, recognition, performance) and personal elements when mentioned.
    Rank factors by their likely impact on the employee's mood and engagement.
    Be evidence-based, citing specific data points or conversation elements that support your analysis.
    Be balanced and objective, avoiding assumptions where data is insufficient.
    """
    
    user_prompt = f"""
    Create a 'Root Cause Analysis' section for an employee report based on the following information:
    
    Conversation Transcript:
    {conversation_transcript}

    SHAP FEATURES AND THEIR VALUES (in descending order of impact):
    {json.dumps(shap_data, indent=2)}

    
    Dataset Mapping (which dataset each feature belongs to):
    {json.dumps(dataset_mapping, indent=2)}


    
    Please include:
    1. A detailed breakdown of potential factors influencing the employee's mood and engagement
    2. Clear ranking or weightage indicating which factors appear most dominant
    
    Format this as a professional analytical report with clear headings, rankings, and evidence-based conclusions and keep each subsection short. Overall keep the content very precise and short.
    """
    
    return await generate_content(system_prompt, user_prompt, temperature=0.2)

# Risk level assessment
# Is the employee flaged

async def generate_complete_employee_report(employee_id,conversation_id,db=next(get_db())):
    # 1. Load all necessary data for this employee
    employee_data = load_employee_data(employee_id)
    vibe_data = load_vibe_data(employee_id)
    leave_data = load_leave_data(employee_id)
    performance_data = load_performance_data(employee_id)
    rewards_data = load_rewards_data(employee_id)
    activity_data = load_activity_data(employee_id)
    conversation_data,severity_score,escalate = load_conversation_data(employee_id,conversation_id)
    shap_data = load_shap_data(employee_id)

    


    # personal_details=  generate_personal_details_section(
    #     employee_data=employee_data, 
    #     vibe_data=vibe_data, 
    #     leave_data=leave_data, 
    #     performance_data=performance_data, 
    #     rewards_data=rewards_data, 
    #     activity_data=activity_data
    # )

    # pre_conversation_analysis=  generate_pre_conversation_analysis(
    #     shap_data['feature_dict'], 
    #     shap_data['dataset_mapping']
    # )
    # conversation_summary=  generate_conversation_summary(
    #     conversation_data
    # )
    # sentiment_analysis=  generate_sentiment_analysis(
    #     conversation_data, 
    #     severity_score
    # )
    # root_cause_analysis=  generate_root_cause_analysis(
    #     conversation_data, 
    #     shap_data['feature_dict'], 
    #     shap_data['dataset_mapping']
    # )

    tasks=[ asyncio.create_task(generate_personal_details_section(employee_data, vibe_data, leave_data, performance_data, rewards_data, activity_data)),
        asyncio.create_task(generate_pre_conversation_analysis(shap_data['feature_dict'], shap_data['dataset_mapping'])),
            asyncio.create_task(generate_conversation_summary(conversation_data)),
            asyncio.create_task(generate_sentiment_analysis(conversation_data, severity_score)),
            asyncio.create_task(generate_root_cause_analysis(conversation_data,shap_data['feature_dict'], shap_data['dataset_mapping']))
    ]
    # loop=asyncio.get_event_loop()
    results=await asyncio.gather(*tasks)
    personal_details, pre_conversation_analysis, conversation_summary, sentiment_analysis, root_cause_analysis=results


    
    # print("Personal Details:",personal_details)

    user=db.query(Master).filter(Master.employee_id == employee_id).first()
    # 3. Compile the complete report
    report = {
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/5/56/Deloitte.svg",
        "employee_id": employee_id,
        "report_date": datetime.now().strftime("%Y-%m-%d"),
        "personal_details": personal_details,
        "executive_summary": (
             "This report summarizes the employee’s conversation with the chatbot, highlighting key factors "
             "affecting their well-being based on provided SHAP values and emotion analysis."
         ),
        "data_analysis_pre_conversation": pre_conversation_analysis,
        "conversation_summary": conversation_summary,
        "sentiment_analysis": sentiment_analysis,
        "root_cause_analysis": root_cause_analysis,
        "flagged": user.is_Flagged,
    }
    return report

def parse_shap_data(shap_values):
    """
    Parses SHAP data from a list where each entry is formatted as 'FeatureName(value)'.
    
    Returns:
    - feature_names: List of feature names.
    - values: List of corresponding numerical values.
    - feature_dict: Dictionary mapping feature names to values.
    - dataset_mapping: Dictionary mapping features to their respective datasets.
    """
    

    dataset_mapping = {
        "Total_Reward_Points": "Rewards & Recognition Dataset",
        "Days_since_last_reward": "Rewards & Recognition Dataset",
        "Days_since_joining": "Onboarding Experience Dataset",
        "Latest_Promotion_Consideration": "Performance Management Dataset",
        "Average_Work_Hours": "Activity Tracker Dataset",
        "Average_Performance_Rating": "Performance Management Dataset",
        "Average_Vibe_Score": "Vibemeter Responses Dataset",
        "Promotion_Consideration_Ratio": "Performance Management Dataset",
        "Days_since_last_leave": "Leave Dataset",
        "Latest_Performance_Rating": "Performance Management Dataset"
    }

    print(shap_values)
    return {
        "feature_dict": shap_values,
        "dataset_mapping": dataset_mapping
    }


def load_employee_data(employee_id:str, db=next(get_db())):
    user=db.query(Master).filter(Master.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    employee_data = {
        "employee_id": user.employee_id,
        "employee_name": user.employee_name,
        "employee_email": user.employee_email,
    }
    return employee_data
    pass

def load_vibe_data(employee_id, db=next(get_db())):
    user=db.query(Master).filter(Master.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if "vibemeter" in user.feature_vector:
        vibemeter=db.query(Vibemeter).filter(Vibemeter.employee_id == employee_id).first()
        if not vibemeter:
            raise HTTPException(status_code=404, detail="Vibemeter data not found")
        #Extract the data from the vibemeter object
        vibemeter_score= vibemeter.vibe_score
        vibemeter_emotion_zone=vibemeter.emotion_zone

    # Load Vibemeter data for the employee
        return {
        "vibe_score": vibemeter_score,
        "emotion_zone": vibemeter_emotion_zone,
        }   
    return {}

def load_leave_data(employee_id, db=next(get_db())):
    # Load leave history data for the employee
    user=db.query(Master).filter(Master.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if "leave" in user.feature_vector:
        leave=db.query(Leave).filter(Leave.employee_id == employee_id).first()
        if not leave:
            raise HTTPException(status_code=404, detail="Leave data not found")
        #Extract the data from the leave object
        # print(leave,employee_id)
        leave_days=leave.leave_days
        leave_type=leave.leave_type
        leave_start_date=leave.leave_start_date
        leave_end_date=leave.leave_end_date
    
        return {
        "leave_days": leave_days,
        "leave_type": leave_type,
        "leave_start_date": leave_start_date,
        "leave_end_date": leave_end_date,
        }
    return {}

def load_performance_data(employee_id, db=next(get_db())):
    # Load performance review data for the employee
    user=db.query(Master).filter(Master.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if "performance" in user.feature_vector:
        performance=db.query(Performance).filter(Performance.employee_id == employee_id).first()
        if not performance:
            return {}
        #Extract the data from the performance object
        performance_rating=performance.performance_rating
        review_period=performance.review_period
        manager_feedback=performance.manager_feedback
        promotion_consideration=performance.promotion_consideration

        return {
        "performance_rating": performance_rating,
        "review_period": review_period,
        "manager_feedback": manager_feedback,
        "promotion_consideration": promotion_consideration,
        }  
    return {}
    

def load_rewards_data(employee_id, db=next(get_db())):
    # Load rewards and recognition data for the employee
    user=db.query(Master).filter(Master.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if "rewards" in user.feature_vector:
        rewards=db.query(Rewards).filter(Rewards.employee_id == employee_id).first()
        if not rewards:
            return {}
        #Extract the data from the rewards object
        award_date=rewards.award_date
        award_type=rewards.award_type
        reward_points=rewards.reward_points
        return {
        "award_date": award_date,
        "award_type": award_type,
        "reward_points": reward_points,
        }
    return {}

def load_activity_data(employee_id, db=next(get_db())):
    # Load activity tracker data for the employee
    user=db.query(Master).filter(Master.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if "activity_tracker" in user.feature_vector:
        activity=db.query(ActivityTracker).filter(ActivityTracker.employee_id == employee_id).first()
        if not activity:
            return {}
        #Extract the data from the activity object
        teams_messages_sent=activity.teams_messages_sent
        emails_sent=activity.emails_sent
        work_hours=activity.work_hours
        meetings_attended=activity.meetings_attended

        return {
        "teams_messages_sent": teams_messages_sent,
        "emails_sent": emails_sent,
        "work_hours": work_hours,
        "meetings_attended": meetings_attended,
        }
    return {}

def load_conversation_data(employee_id,conversation_id, db=next(get_db())):
    # Load the transcript of the conversation with the employee
    user=db.query(Master).filter(Master.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    conversation = db.query(Conversation).filter(Conversation.id ==conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if not conversation.message_ids:
        raise HTTPException(status_code=404, detail="No messages found for this conversation")

    # Fetch and sort messages
    messages = db.query(Message).filter(Message.id.in_(conversation.message_ids)).all()
    # print(messages)
    # messages.sort(key=lambda m: m.id)

    # Build conversation history
    conversation_history = [
        {"role": "Chatbot" if msg.sender_type.lower() == "chatbot" else "Employee", "content": msg.content}
        for msg in messages
    ]
    severity_score, escalate = analyze_emotions(messages)
    user.is_Flagged=escalate
    user.sentimental_score=severity_score
    db.commit()
    db.refresh(user)
    
    return conversation_history, severity_score,escalate

def load_shap_data(employee_id, db=next(get_db())):
    # Load SHAP values and feature names for the employee
    user=db.query(Master).filter(Master.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    result=parse_shap_data(user.shap_values)
    return result
        
@router.post("/employee")
async def get_employee_report(request: Request,db: Session = Depends(get_db)):
    """
    Get the complete employee report for the authenticated employee.
    The token is passed in the request header and used to extract the employee ID.
    """

    # Extract token from Authorization header
    try:
        token = request.headers.get("Authorization")
    # print(token)
    # Extract the body from the request
        body= await request.json()
        if not token:
            raise HTTPException(status_code=401, detail="Missing authentication token")

        # Verify the token and extract employee_id
        user_data = verify_user(token)
        emp_id,role=user_data["emp_id"],user_data["role"]
        conversation_id= body.get("conversation_id")
        if not conversation_id:
            raise HTTPException(status_code=400, detail="Missing conversation ID")
        if(role != "employee"):
            raise HTTPException(status_code=401, detail="Invalid token")


        # Generate the report
        # print(employee_id,conversation_id)
        report = await generate_complete_employee_report(emp_id,conversation_id,db)

        # return {"report":report}

        # Render the HTML template using Jinja2
        env = Environment(loader=FileSystemLoader("templates"))
        template = env.get_template("report_template.html")
        html_content = template.render(report_data=report)

        # Generate PDF with xhtml2pdf in-memory
        pdf_file = BytesIO()
        pisa_status = pisa.CreatePDF(html_content, dest=pdf_file)

        if pisa_status.err:
            raise HTTPException(status_code=500, detail="Error generating PDF with xhtml2pdf")

        pdf_file.seek(0)  # Reset the buffer pointer
        pdf_bytes = pdf_file.getvalue()

        # S3 Upload
        filename = f"report_{emp_id}_{conversation_id}.pdf"
        s3_url = upload_pdf_to_s3(pdf_bytes, filename)

        # Close PDF buffer
        pdf_file.close()
        conversation=db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        conversation.report = s3_url
        db.commit()
        db.refresh()

        return {"message": "PDF report uploaded successfully", "pdf_url": s3_url}
    except:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error generating employee report")




    

    


def get_daily_report(db=next(get_db())):

    # Query required data
    selected_employees = db.query(Master).filter(Master.is_selected == True).all()
    flagged_employees = db.query(Master).filter(Master.is_Flagged == True).count()
    
    avg_vibe_score = sum(emp.sentimental_score for emp in selected_employees) / max(1, len(selected_employees))
    top_features = get_top_features(selected_employees)
    
    avg_severity_score = avg_vibe_score  # Assuming severity is vibe post-conversation
    
    db.close()
    
    return {
        "num_selected": len(selected_employees),
        "avg_vibe_score": round(avg_vibe_score, 2),
        "top_sad_mood_features": top_features,
        "avg_severity_score": round(avg_severity_score, 2),
        "num_flagged": flagged_employees,
    }

def get_top_features(selected_employees):
    from collections import Counter

    all_features = [feature for emp in selected_employees for feature in emp.shap_values]
    top_features = [item[0] for item in Counter(all_features).most_common(3)]
    
    return top_features


async def generate_report_content(report_data):
    prompt = f"""
    Generate a professional HR analytics report summary based on the following details:
    
    1️⃣ **Employees Selected for Conversation**: {report_data['num_selected']} employees were chosen for detailed conversations.
    
    2️⃣ **Average Vibe Score**: The emotional sentiment across the selected employees is {report_data['avg_vibe_score']} on a scale of 0 to 10.
    
    3️⃣ **Top Features Contributing to a Sad Mood**: The primary factors affecting employee well-being are {', '.join(report_data['top_sad_mood_features'])}.
    
    4️⃣ **Average Severity Score Post-Conversation**: Post-session evaluations indicate an average severity of {report_data['avg_severity_score']}.
    
    5️⃣ **Number of Flagged Employees**: {report_data['num_flagged']} employees require follow-up action.
    
    **Next Steps**: Employees flagged as requiring attention should have a 1-on-1 meeting scheduled for further discussion.
    Write a professional executive summary for this.
    """

    response = await client.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "system", "content": "You are an HR analytics expert."},
                  {"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content.strip()

@router.post("/daily")
def daily_report(db: Session = Depends(get_db)):
    report_data = get_daily_report()
    report_content = generate_report_content(report_data)

    env = Environment(loader=FileSystemLoader("templates"))
    template = env.get_template("report_template_daily.html")
    html_content = template.render(report_data=report_data, report_content=report_content)

    pdf_file = BytesIO()
    pisa_status = pisa.CreatePDF(html_content, dest=pdf_file)

    if pisa_status.err:
        raise HTTPException(status_code=500, detail="Error generating PDF with xhtml2pdf")

    pdf_file.seek(0)  # Reset the buffer pointer
    pdf_bytes = pdf_file.getvalue()

    # S3 Upload
    filename = f"report_daily_{datetime.now().strftime('%Y-%m-%d')}.pdf"
    s3_url = upload_pdf_to_s3(pdf_bytes, filename)

    # Close PDF buffer
    pdf_file.close()
    #get the first data from hrusers
    user=db.query(HRUser).first()
    if not user:
        raise HTTPException(status_code=404, detail="HR User not found")
    user.daily_report = s3_url
    db.commit()

    return {"message": "PDF report uploaded successfully", "pdf_url": s3_url}




