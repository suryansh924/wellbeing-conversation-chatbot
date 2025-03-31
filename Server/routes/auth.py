from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from datetime import timedelta
import firebase_admin
from firebase_admin import auth, credentials

from database.models import Master
from database.conn import SessionLocal
from pydantic import BaseModel, EmailStr
from typing import List


# cred = credentials.Certificate("path/to/serviceAccountKey.json")
# firebase_admin.initialize_app(cred)

# Base.metadata.create_all(bind=engine)

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Schemas

class EmployeeCheckRequest(BaseModel):
    employee_id: str

class EmployeeCheckResponse(BaseModel):
    exists: bool

class UserRegister(BaseModel):
    employee_id: str
    email: EmailStr
    name: str

class UserResponse(BaseModel):
    employee_id: str
    employee_name: str
    employee_email: EmailStr
    role: str
    is_selected: bool
    sentimental_score: int
    shap_values: List[str]
    vibe_score: int

    class Config:
        orm_mode = True


@router.get("/check/{employee_id}", response_model=EmployeeCheckResponse)
def check_employee_id(employee_id: str, db: Session = Depends(get_db)):
    """
    Check if the employee_id exists in the system.
    """
    existing = db.query(Master).filter(Master.employee_id == employee_id).first()
    return {"exists": bool(existing)}

@router.post("/register", response_model=UserRegister)
def register(user: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user using Firebase (or an external provider). The employee IDs are
    preloaded in the database. When a user registers, update the existing record with the
    provided name and email. If the employee_id does not exist or the email is already set,
    return an error.
    """
    # Check if the employee_id exists in the database
    existing_employee = db.query(Master).filter(Master.employee_id == user.employee_id).first()
    if not existing_employee:
        raise HTTPException(
            status_code=400,
            detail="Invalid employee_id. Please contact HR."
        )
    
    # If an email is already registered for that employee, reject the registration
    if existing_employee.employee_email and existing_employee.employee_email.strip() != "":
        raise HTTPException(
            status_code=400,
            detail="This employee is already registered."
        )
    
    # Update the existing record with name and email
    existing_employee.employee_name = user.name
    existing_employee.employee_email = user.email
    db.commit()
    db.refresh(existing_employee)
    
    return {"message": "Registration successful."}


def verify_firebase_token(token: str):
    """
    Verifies the Firebase JWT and returns the decoded claims.
    """
    try:
        decoded_claims = auth.verify_id_token(token)
        return decoded_claims
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Extracts the token from the 'Authorization' header, verifies it with Firebase,
    and returns the corresponding Employee record from the database.
    It first attempts to get the employee_id from the token claims.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    claims = verify_firebase_token(token)
    

    employee_id = claims.get("employee_id")
    if not employee_id:
        employee_id = claims.get("uid")  
        if not employee_id:
            raise HTTPException(status_code=401, detail="Token missing employee identifier")
    
    # Query the Employee record using the employee_id
    user = db.query(Master).filter(Master.employee_id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.get("/employee", response_model=UserResponse)
def get_employee(current_user: Master = Depends(get_current_user)):
    return current_user