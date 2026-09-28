// ========================================
// MarkSense - Student Dashboard JavaScript
// ========================================

// ----------------------------------------
// Demo Student Data
// ----------------------------------------

const studentData = {
    name: "Student Name",
    prediction: 82.5,
    attendance: 88,
    studyHours: 3.5,
    predictionCount: 4
};


// ----------------------------------------
// Display Student Data
// ----------------------------------------

document.getElementById("studentName").textContent =
    studentData.name;

document.getElementById("latestPrediction").textContent =
    studentData.prediction;

document.getElementById("predictionValue").textContent =
    studentData.prediction;

document.getElementById("attendanceValue").textContent =
    studentData.attendance + "%";

document.getElementById("studyHoursValue").textContent =
    studentData.studyHours;

document.getElementById("predictionCount").textContent =
    studentData.predictionCount;

document.getElementById("performanceScore").textContent =
    studentData.prediction;


// ----------------------------------------
// Logout
// ----------------------------------------

const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", function () {

    const confirmLogout = confirm(
        "Are you sure you want to logout?"
    );

    if (confirmLogout) {

        /*
        Later, when backend authentication is connected,
        the session/token will be cleared here.
        */

        window.location.href = "login.html";
    }
});


// ----------------------------------------
// Future Backend Integration
// ----------------------------------------

/*
Later, this dashboard will get real data
from the Flask backend.

Example:

fetch("http://127.0.0.1:5000/api/student/dashboard")
    .then(response => response.json())
    .then(data => {

        // Update dashboard with real student data

    })
    .catch(error => {

        console.error(
            "Unable to load dashboard data:",
            error
        );

    });

*/


// ----------------------------------------
// Dashboard Ready
// ----------------------------------------

console.log("MarkSense student dashboard loaded.");