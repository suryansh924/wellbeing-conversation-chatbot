import csv
import io
from sqlalchemy.orm import Session
from database.models import Master, HRUser, Conversation, Message, ActivityTracker, Leave, Onboarding, Performance, Rewards, Vibemeter
import json

def parse_bool(value: str) -> bool:
    return value.strip().lower() == "true"

def parse_float(value: str) -> float:
    try:
        return float(value)
    except (ValueError, TypeError):
        return 0.0

def parse_int(value: str) -> int:
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0
    
def parse_shap_values(value: str):
    """
    Parse comma-separated feature names into a list of strings.
    e.g. "Performance_Rating,Promotion_Consideration,Leave_Type"
    -> ["Performance_Rating", "Promotion_Consideration", "Leave_Type"]
    """
    if not value:
        return []
    # Split by comma and strip whitespace
    return [item.strip() for item in value.split(",")]

def ingest_csv_data(file_content: bytes, table: str, db: Session):
    """
    Reads CSV data from the given bytes and ingests records into the specified table.
    Supported tables: 'master', 'hr', 'conversation', 'message', 'activity_tracker', 'leave', 'onboarding', 'performance', 'rewards', 'vibemeter'
    """
    decoded = file_content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    records = []
    table = table.lower()

    if table == "master":
        for row in reader:
            row = {key.lower(): value for key, value in row.items()}
            employee_id = row.get("employee_id")
            if not employee_id:
                raise ValueError("Missing employee_id")
            # Map CSV columns to fixed fields in the Employee model

            shap_str = row.get("shap_values", "")
            shap_list = parse_shap_values(shap_str)

            employee = Master(
                employee_id=row.get("employee_id"),
                shap_values=shap_list,
                # employee_name=row.get("employee_name", ""),
                # employee_email=row.get("employee_email"),
                # password=hash_password(row.get("password")),
                feature_vector= row.get("feature_vector", []),
                # role=row.get("role", "employee"),
                # report=row.get("report", ""),
                sentimental_score=parse_int(row.get("sentimental_score", "0")),
                # is_resolved=parse_bool(row.get("is_resolved", "false")),

                # work_hours=parse_float(row.get("work_hours", "0.0")),
                # leave_days=parse_int(row.get("leave_days", "0")),
                # leave_type=row.get("leave_type", ""),
                # performance_rating=parse_int(row.get("performance_rating", "0")),
                # manager_feedback=row.get("manager_feedback", ""),
                # promotion_consideration=parse_bool(row.get("promotion_consideration", "false")),
                # reward_points=parse_int(row.get("reward_points", "0")),
                # award_type=row.get("award_type", ""),
                # team_messages_sent=parse_int(row.get("team_messages_sent", "0")),
                # vibe_score=parse_int(row.get("vibe_score", "0"))
            )
            db.add(employee)
            records.append(employee)
    elif table == "hr":
        for row in reader:
            row = {key.lower(): value for key, value in row.items()}
            hr_user = HRUser(
                email=row.get("email"),
                # password=hash_password(row.get("password")),
                role=row.get("role", "admin")
            )
            db.add(hr_user)
            records.append(hr_user)
    elif table == "conversation":
        for row in reader:
            row = {key.lower(): value for key, value in row.items()}
            try:
                messages_arr = json.loads(row.get("messages", "[]"))
            except Exception:
                messages_arr = []
            conversation = Conversation(
                id=int(row.get("conv_id")),  # assuming conv_id is provided as integer
                employee_id=row.get("employee_id"),
                messages=messages_arr
            )
            db.add(conversation)
            records.append(conversation)
    elif table == "message":
        for row in reader:
            row = {key.lower(): value for key, value in row.items()}
            message = Message(
                id=int(row.get("message_id")),  # assuming message_id is provided as integer
                conv_id=int(row.get("conv_id")),
                content=row.get("content")
            )
            db.add(message)
            records.append(message)
    elif table == "activity_tracker":
        for row in reader:
            row = {key.lower(): value for key, value in row.items()}
            activity = ActivityTracker(
                employee_id=row.get("employee_id"),
                date=row.get("date"),
                teams_messages_sent = row.get("teams_messages_sent"),
                emails_sent = row.get("emails_sent"),
                work_hours = row.get("work_hours"),
                meetings_attended = row.get("meetings_attended")
            )
            db.add(activity)
            records.append(activity)
    elif table == "leave":
        for row in reader:
            row = {key.lower(): value for key, value in row.items()}
            leave = Leave(
                employee_id=row.get("employee_id"),
                leave_type=row.get("leave_type", ""),
                leave_start_date=row.get("leave_start_date", ""),
                leave_end_date=row.get("leave_end_date", ""),
                leave_days=parse_int(row.get("leave_days", "0"))
            )
            db.add(leave)
            records.append(leave)
    elif table == "onboarding":
        for row in reader:
            row = {key.lower(): value for key, value in row.items()}
            onboarding = Onboarding(
                employee_id=row.get("employee_id"),
                joining_date=row.get("joining_date"),
                onboarding_feedback=row.get("onboarding_feedback", ""),
                mentor_assigned = parse_bool(row.get("mentor_assigned")),
                initial_training_completed=parse_bool(row.get("initial_training_completed"))
            )
            db.add(onboarding)
            records.append(onboarding)
    elif table == "performance":
        for row in reader:
            row = {key.lower(): value for key, value in row.items()}
            performance = Performance(
                employee_id=row.get("employee_id"),
                review_period=row.get("review_period"),
                performance_rating=parse_int(row.get("performance_rating", "0")),
                manager_feedback=row.get("manager_feedback", ""),
                promotion_consideration = parse_bool(row.get("promotion_consideration"))
            )
            db.add(performance)
            records.append(performance)
    elif table == "rewards":
        for row in reader:
            row = {key.lower(): value for key, value in row.items()}
            rewards = Rewards(
                employee_id=row.get("employee_id"),
                award_date=row.get("award_date"),
                award_type=row.get("award_type", ""),
                reward_points=parse_int(row.get("reward_points", "0")),
            )
            db.add(rewards)
            records.append(rewards)
    elif table == "vibemeter":
        for row in reader:
            row = {key.lower(): value for key, value in row.items()}
            vibemeter = Vibemeter(
                employee_id=row.get("employee_id"),
                response_date=row.get("response_date"),
                emotion_zone=row.get("emotion_zone", ""),
                vibe_score=row.get("vibe_score")
            )
            db.add(vibemeter)
            records.append(vibemeter)
    else:
        raise ValueError("Invalid table specified for ingestion.")
    
    db.commit()
    return len(records)


def update_master_feature_vector(db: Session):
    """
    For every unique employee_id found in the six datasets, update the Master table.
    The feature_vector field in Master is updated to include the table names (features)
    where that employee appears.
    """
    # List of tuples (table_feature_name, ModelClass)
    tables_to_check = [
        ("activity_tracker", ActivityTracker),
        ("leave", Leave),
        ("onboarding", Onboarding),
        ("performance", Performance),
        ("rewards", Rewards),
        ("vibemeter", Vibemeter)
    ]
    
    # Dictionary to collect employee_id and associated features (table names)
    employee_features = {}
    for feature_name, model in tables_to_check:
        results = db.query(model.employee_id).distinct().all()
        for (emp_id,) in results:
            if not emp_id:
                continue
            if emp_id not in employee_features:
                employee_features[emp_id] = set()
            employee_features[emp_id].add(feature_name)
    
    # Update or create records in Master table
    for emp_id, features in employee_features.items():
        master_record = db.query(Master).filter(Master.employee_id == emp_id).first()
        if master_record:
            # Update the feature_vector by unioning existing features with new ones
            existing_features = set(master_record.feature_vector) if master_record.feature_vector else set()
            updated_features = existing_features.union(features)
            master_record.feature_vector = list(updated_features)
        else:
            # Create new Master record with defaults and the feature_vector
            new_master = Master(
                employee_id=emp_id,
                feature_vector=list(features)
            )
            db.add(new_master)
    
    db.commit()


def ingest_shap_values(file_content: bytes, db: Session):
    """
    Ingests SHAP values and updates the Master table by employee_id.
    Uses csv.DictReader instead of pandas.
    """
    try:
        # 1. Decode the CSV content
        decoded = file_content.decode("utf-8")
        reader = csv.DictReader(io.StringIO(decoded))

        # 2. Validate required columns
        required_columns = {"employee_id", "shap_values", "is_selected"}
        if not required_columns.issubset(reader.fieldnames):
            missing_cols = required_columns - set(reader.fieldnames)
            raise ValueError(f"Missing required columns: {missing_cols}")

        updated_count = 0

        for row in reader:
            employee_id = row["employee_id"]
            
            # Extract SHAP values
            shap_str = row["shap_values"]  # e.g., "Average_Vibe_Score(0.0323), Total_Reward_Points(0.0290), ..."
            
            # Parse and extract SHAP names without scores
            shap_values = [item.split('(')[0].strip() for item in shap_str.split(',')]
            
            # Take only the top 6 SHAP values
            shap_values = shap_values[:6]

            # Convert `is_selected` to boolean
            is_selected = row["is_selected"].lower() == "true"

            # 4. Query the existing record by employee_id
            master_record = db.query(Master).filter(Master.employee_id == employee_id).first()

            if master_record:
                # 5. Update existing record
                master_record.shap_values = shap_values
                master_record.is_selected = is_selected
                updated_count += 1
            else:
                print(f"Employee ID {employee_id} not found. Skipping...")

        # 6. Commit all changes
        db.commit()
        return updated_count
    except Exception as e:
        db.rollback()
        raise Exception(f"Error ingesting SHAP values: {str(e)}")

# import psycopg2
# import csv

# # AWS RDS PostgreSQL connection details
# HOST = "opensoft.c9w2i6somhki.ap-south-1.rds.amazonaws.com"
# DATABASE = "postgres"   # Replace with your actual database name
# USER = "datamaster"
# PASSWORD = "databaseforever"
# CSV_FILE = "./cleaned_employee_data.csv"

# # Connect to PostgreSQL
# try:
#     conn = psycopg2.connect(
#         host=HOST,
#         database=DATABASE,
#         user=USER,
#         password=PASSWORD
#     )
#     print("✅ Connected to PostgreSQL")

#     cursor = conn.cursor()

#     # Ensure the table exists (create it if it doesn't)
#     cursor.execute("""
#     CREATE TABLE IF NOT EXISTS employees (
#         Employee_ID TEXT PRIMARY KEY,
#         Work_Hours FLOAT,
#         Leave_Days INT,
#         Leave_Type TEXT,
#         Performance_Rating INT,
#         Manager_Feedback TEXT,
#         Promotion_Consideration BOOLEAN,
#         Reward_Points INT,
#         Award_Type TEXT,
#         Team_Messages_Sent INT,
#         Vibe_Score INT,
#         shap TEXT
#     );
#     """)
#     print("✅ Table checked/created")

#     # Open CSV file and import data
#     with open(CSV_FILE, 'r') as f:
#         reader = csv.reader(f)
#         header = next(reader)  # Skip header row
#         expected_cols = 12

#         for row in reader:
#             # Validate row length before inserting
#             if len(row) == expected_cols:
#                 cursor.execute("""
#                 INSERT INTO employees (
#                     Employee_ID, Work_Hours, Leave_Days, Leave_Type, Performance_Rating,
#                     Manager_Feedback, Promotion_Consideration, Reward_Points, Award_Type,
#                     Team_Messages_Sent, Vibe_Score, shap
#                 ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
#                 """, row)
#             else:
#                 print(f"⚠️ Skipping invalid row: {len(row)} (length: {len(row)})")

#     conn.commit()
#     print("✅ CSV data imported successfully!")

# except Exception as e:
#     print(f"🔥 Error: {e}")
# finally:
#     cursor.close()
#     conn.close()
#     print("🔌 PostgreSQL connection closed")