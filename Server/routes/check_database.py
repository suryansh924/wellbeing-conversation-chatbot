from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlalchemy.orm import Session
from database.conn import get_db
from csv_ingest import ingest_csv_data, update_master_feature_vector,ingest_shap_values
from database.models import Master,Conversation,Message

# Create a router instance
router = APIRouter()

@router.post("/ingest")
async def ingest_data(
    table: str = "master",  # default to master if not provided
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    table = table.lower()
    allowed_tables = {
        "master", "hr", "conversation", "message",
        "activity_tracker", "leave", "onboarding", "performance", "rewards", "vibemeter"
    }
    if table not in allowed_tables:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid table specified for ingestion. Supported values: {', '.join(sorted(allowed_tables))}."
        )
    # Check if the file extension is .csv (ignoring case)
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")
    
    try:
        file_content = await file.read()
        count = ingest_csv_data(file_content, table, db)
        return {"message": f"Ingested {count} records into {table} table successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")


@router.post("/update_master")
def update_master(db: Session = Depends(get_db)):
    try:
        update_master_feature_vector(db)
        return {"message": "Master table updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating master table: {str(e)}")

# Route to update the shap values of master table
@router.post("/update_master_shap")
async def ingest_data(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check if the file extension is .csv (ignoring case)
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file.")
    try:
        file_content = await file.read()
        count = ingest_shap_values(file_content, db)
        return {"message": f"Ingested {count} records into master table successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")


@router.get("/employees")
def get_employees(db: Session = Depends(get_db)):
    """
    Fetch all employees from the database.
    """
    try:
        employees = db.query(Master).all()

        # Convert the result to a list of dictionaries
        employees_list = [
            {
                "Employee_ID": emp.employee_id,
                # "Work_Hours": emp.work_hours,
                # "Leave_Days": emp.leave_days,
                # "Leave_Type": emp.leave_type,
                # "Performance_Rating": emp.performance_rating,
                # "Manager_Feedback": emp.manager_feedback,
                # "Promotion_Consideration": emp.promotion_consideration,
                # "Reward_Points": emp.reward_points,
                # "Award_Type": emp.award_type,
                # "Team_Messages_Sent": emp.team_messages_sent,
                # "Vibe_Score": emp.vibe_score,
                "Shap": emp.shap_values,
                "Employee_Name": emp.employee_name,
                "Employee_Email": emp.employee_email,
                # "Hashed_Password": emp.password,
                "feature_vector": emp.feature_vector,
                "Employee_Role": emp.role,
                "Report": emp.report,
                "Sentimental_Score": emp.sentimental_score,
                "Is_Resolved": emp.is_resolved,
            }
            for emp in employees
        ]

        return {"employees": employees_list}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")