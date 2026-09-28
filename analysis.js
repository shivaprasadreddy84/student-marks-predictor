// ========================================
// MarkSense - Analysis JavaScript
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    // ========================================
    // Demo Analysis Data
    // ========================================

    const analysisData = {
        averageMarks: 78.4,
        highestMarks: 86,
        averageAttendance: 88,
        averageStudyHours: 3.5
    };


    // ========================================
    // Update Summary Cards
    // ========================================

    document.getElementById("averageMarks").textContent =
        analysisData.averageMarks;

    document.getElementById("highestMarks").textContent =
        analysisData.highestMarks;

    document.getElementById("averageAttendance").textContent =
        analysisData.averageAttendance + "%";

    document.getElementById("averageStudyHours").textContent =
        analysisData.averageStudyHours;


    // ========================================
    // Logout
    // ========================================

    const logoutButton =
        document.getElementById("logoutButton");

    if (logoutButton) {

        logoutButton.addEventListener("click", function () {

            const confirmLogout =
                confirm("Are you sure you want to logout?");

            if (confirmLogout) {

                window.location.href = "login.html";

            }

        });

    }


    // ========================================
    // Future Backend Integration
    // ========================================

    /*
    Later, the real statistical values will
    come from the Flask backend.

    Example:

    fetch("http://127.0.0.1:5000/api/student/analysis")
        .then(response => response.json())
        .then(data => {

            document.getElementById("averageMarks").textContent =
                data.average_marks;

            document.getElementById("highestMarks").textContent =
                data.highest_marks;

            document.getElementById("averageAttendance").textContent =
                data.average_attendance + "%";

            document.getElementById("averageStudyHours").textContent =
                data.average_study_hours;

        })
        .catch(error => {

            console.error(
                "Unable to load analysis:",
                error
            );

        });

    */


    console.log("MarkSense analysis page loaded.");

});