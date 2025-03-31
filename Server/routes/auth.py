from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from datetime import timedelta
# import firebase_admin
# from firebase_admin import auth, credentials

from database.models import Master
from database.conn import SessionLocal
from pydantic import BaseModel, EmailStr
from typing import List
from datetime import datetime, timedelta, timezone
import jwt



# cred = credentials.Certificate("path/to/serviceAccountKey.json")
# firebase_admin.initialize_app(cred)

# Base.metadata.create_all(bind=engine)
SECRET_KEY = "your-secret-key"  # Replace with your secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

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
class LoginUser(BaseModel):
    email: EmailStr
    password: str

class RegisterUser(BaseModel):
    email: EmailStr
    emp_id: str
    name: str

class OAuthUser(BaseModel):
    email: EmailStr
    emp_id: str
    name: str
    isRegistration: bool

# Function to generate a JWT token with employee id as payload
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt



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
    
@router.post("/login")
def login(user: LoginUser, db: Session = Depends(get_db)):
    db_user = db.query(Master).filter(Master.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="User does not exist")
    token= create_access_token(data={"emp_id": db_user.employee_id})
    return {"token": token, "role": db_user.role}


@router.post("/oauth")
def oauth(user: OAuthUser, db: Session = Depends(get_db)):
    if not user.isRegistration:
        db_user = db.query(Master).filter(Master.email == user.email).first()
        if not db_user:
            raise HTTPException(status_code=400, detail="User does not exist")
        token= create_access_token(data={"emp_id": db_user.employee_id})
        return {"token": token, "role": db_user.role}
    else:
        existing_employee = db.query(Master).filter(Master.employee_id == user.emp_id).first()
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
        
        check_email = db.query(Master).filter(Master.email == user.email).first()
        if check_email:
            raise HTTPException(
                status_code=400,
                detail="This email is already registered with another employee."
            )
        


        # Update the existing record with name and email
        existing_employee.employee_name = user.name
        existing_employee.employee_email = user.email
        db.commit()
        db.refresh(existing_employee)
        access_token = create_access_token(data={"emp_id": user.emp_id})
        return {"token": access_token}

    

@router.get("/check/{employee_id}", response_model=EmployeeCheckResponse)
def check_employee_id(employee_id: str, db: Session = Depends(get_db)):
    """
    Check if the employee_id exists in the system.
    """
    existing = db.query(Master).filter(Master.employee_id == employee_id).first()
    return {"exists": bool(existing)}

@router.post("/register")
def register(user: RegisterUser, db: Session = Depends(get_db)):
    """
    Register a new user using Firebase (or an external provider). The employee IDs are
    preloaded in the database. When a user registers, update the existing record with the
    provided name and email. If the employee_id does not exist or the email is already set,
    return an error.
    """
    # Check if the employee_id exists in the database
    existing_employee = db.query(Master).filter(Master.employee_id == user.emp_id).first()
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
    check_email = db.query(Master).filter(Master.email == user.email).first()
    if check_email:
        raise HTTPException(
                status_code=400,
                detail="This email is already registered with another employee."
            )
    
    # Update the existing record with name and email
    existing_employee.employee_name = user.name
    existing_employee.employee_email = user.email
    db.commit()
    db.refresh(existing_employee)
    access_token = create_access_token(data={"emp_id": user.emp_id})
    return {"token": access_token}

def verify_user(token: str):
    """
    Verifies the JWT and returns the decoded claims.
    """
    try:
        decoded_claims = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        emp_id= decoded_claims.get("emp_id")
        return emp_id
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/employee", response_model=UserResponse)
def get_employee(user_id: str = Depends(verify_user), db: Session = Depends(get_db)):
    user= db.query(Master).filter(Master.employee_id == user_id).first()
    return user