# MarkSense — Student Marks Predictor

## Project Overview
MarkSense is a machine learning-based web application that predicts student marks using academic information and exam-related factors. It also helps administrators maintain student performance records and allows students to review their academic progress.

## Features
- **Student Management:** View registered student details.
- **Exam Management:** Create and manage exams by department and subject.
- **Performance Tracking:** Record assignments, external exam marks, attendance, and study hours.
- **Marks Calculation:** Calculate final marks out of 100 using assignment and external examination marks.
- **ML-Based Prediction:** Predict student marks using academic factors and exam difficulty.
- **Performance Analysis:** View saved academic records and track student progress.
- **Prediction History:** Review previous marks predictions.
- **Role-Based Dashboards:** Separate interfaces for students and administrators.

## Marks Calculation
The project uses the following marking system:

- Assignment 1: 20 marks
- Assignment 2: 20 marks
- External Examination: 100 marks, scaled to 60

**Formula:**

External Scaled Marks = External Marks × 0.6

Final Marks = Assignment 1 + Assignment 2 + External Scaled Marks

Example:

- Assignment 1 = 18/20
- Assignment 2 = 15/20
- External Examination = 85/100
- External Scaled Marks = 51/60
- **Final Marks = 84/100**

Final marks are calculated when all three marks are available.

## Technology Stack

**Frontend**
- HTML
- CSS
- JavaScript

**Backend**
- Python
- Flask

**Database**
- PostgreSQL

**Machine Learning**
- Python
- Scikit-learn

## Project Structure

```text
student-marks-predictor/
├── backend/
│   ├── app.py
│   ├── database.py
│   ├── routes/
│   └── ml/
├── frontend/
│   ├── index.html
│   ├── index.css
│   ├── index.js
│   ├── admin-dashboard.html
│   ├── admin-dashboard.css
│   ├── admin-dashboard.js
│   ├── student-dashboard.html
│   ├── student-dashboard.css
│   └── student-dashboard.js
├── student-mat.csv
├── .gitignore
└── README.md
```

*Note: The folder structure above shows the main project files; additional files may exist in the actual project.*

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shivaprasadreddy84/student-marks-predictor.git
cd student-marks-predictor
```

### 2. Set Up the Python Environment

```bash
python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

### 3. Install Dependencies

Install the packages listed in your project's `requirements.txt` file:

```bash
pip install -r backend/requirements.txt
```

*If your requirements file is stored in a different location, adjust the command accordingly.*

### 4. Configure PostgreSQL

- Install and start PostgreSQL.
- Create a database named `marksense_db`.
- Configure the database connection in the backend.
- Set the correct database username, password, host, and port.
- Ensure the required database tables have been created.

Do not upload database passwords or other secret credentials to GitHub.

### 5. Run the Backend

```bash
cd backend
python app.py
```

Open the website at:

http://127.0.0.1:5000

## How It Works

1. Administrators manage students and exams.
2. Administrators enter assignment marks, external marks, attendance, and study hours.
3. MarkSense stores performance information in PostgreSQL.
4. The application calculates final marks when all required marks are available.
5. The machine learning model predicts student marks based on its configured academic features.
6. Students can view their performance records and prediction history.

## Project Objective

The objective of MarkSense is to use machine learning and academic data to predict student marks and provide a convenient way to manage and review student performance.

## Future Enhancements
- Improved prediction accuracy.
- Visual performance analytics.
- Identification of students who may need academic support.
- Additional reports and performance comparisons.

## Repository

GitHub: https://github.com/shivaprasadreddy84/student-marks-predictor
