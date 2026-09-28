// ========================================
// MarkSense - Prediction JavaScript
// Temporary frontend prediction logic
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const predictionForm =
        document.getElementById("predictionForm");

    const formMessage =
        document.getElementById("formMessage");

    const resultPlaceholder =
        document.querySelector(".result-placeholder");

    const predictionResult =
        document.getElementById("predictionResult");

    const resultStatus =
        document.querySelector(".result-status");

    const predictedMarks =
        document.getElementById("predictedMarks");

    const performanceLevel =
        document.getElementById("performanceLevel");

    const resultDifficulty =
        document.getElementById("resultDifficulty");

    const resultAttendance =
        document.getElementById("resultAttendance");

    const resultStudyHours =
        document.getElementById("resultStudyHours");

    const logoutButton =
        document.getElementById("logoutButton");


    // ========================================
    // Prediction Form
    // ========================================

    predictionForm.addEventListener("submit", function (event) {

        event.preventDefault();

        clearMessage();


        // Get values

        const examName =
            document.getElementById("examName").value.trim();

        const previousMarks =
            parseFloat(
                document.getElementById("previousMarks").value
            );

        const assessmentMarks =
            parseFloat(
                document.getElementById("assessmentMarks").value
            );

        const attendance =
            parseFloat(
                document.getElementById("attendance").value
            );

        const studyHours =
            parseFloat(
                document.getElementById("studyHours").value
            );

        const difficulty =
            document.getElementById("difficulty").value;


        // ========================================
        // Validation
        // ========================================

        if (examName === "") {

            showMessage(
                "Please enter the exam or assessment name.",
                "error"
            );

            document.getElementById("examName").focus();

            return;
        }


        if (
            isNaN(previousMarks) ||
            previousMarks < 0 ||
            previousMarks > 100
        ) {

            showMessage(
                "Previous marks must be between 0 and 100.",
                "error"
            );

            return;
        }


        if (
            isNaN(assessmentMarks) ||
            assessmentMarks < 0 ||
            assessmentMarks > 100
        ) {

            showMessage(
                "Assessment marks must be between 0 and 100.",
                "error"
            );

            return;
        }


        if (
            isNaN(attendance) ||
            attendance < 0 ||
            attendance > 100
        ) {

            showMessage(
                "Attendance must be between 0% and 100%.",
                "error"
            );

            return;
        }


        if (
            isNaN(studyHours) ||
            studyHours < 0 ||
            studyHours > 24
        ) {

            showMessage(
                "Study hours must be between 0 and 24.",
                "error"
            );

            return;
        }


        if (difficulty === "") {

            showMessage(
                "Please select the exam difficulty.",
                "error"
            );

            return;
        }


        // ========================================
        // Temporary Prediction Calculation
        // ========================================
        //
        // This is NOT the final ML model.
        // It is only for testing the frontend.
        //
        // Later:
        // Frontend → Flask API → ML Model → Result
        //

        let difficultyAdjustment = 0;

        if (difficulty === "easy") {
            difficultyAdjustment = 3;
        }

        if (difficulty === "medium") {
            difficultyAdjustment = 0;
        }

        if (difficulty === "hard") {
            difficultyAdjustment = -4;
        }


        let studyContribution =
            Math.min(studyHours * 1.5, 12);

        let attendanceContribution =
            ((attendance - 50) / 50) * 8;


        let prediction =
            (previousMarks * 0.45) +
            (assessmentMarks * 0.35) +
            studyContribution +
            attendanceContribution +
            difficultyAdjustment;


        // Keep result between 0 and 100

        prediction =
            Math.max(0, Math.min(100, prediction));


        prediction =
            Math.round(prediction * 10) / 10;


        // ========================================
        // Performance Level
        // ========================================

        let level = "";
        let levelClass = "";

        if (prediction >= 85) {

            level = "Excellent Performance";
            levelClass = "excellent";

        } else if (prediction >= 70) {

            level = "Good Performance";
            levelClass = "good";

        } else if (prediction >= 50) {

            level = "Average Performance";
            levelClass = "average";

        } else {

            level = "Needs Improvement";
            levelClass = "needs-improvement";
        }


        // ========================================
        // Display Result
        // ========================================

        predictedMarks.textContent = prediction;

        performanceLevel.textContent = level;

        performanceLevel.className =
            "performance-level " + levelClass;


        resultDifficulty.textContent =
            difficulty.charAt(0).toUpperCase() +
            difficulty.slice(1);

        resultAttendance.textContent =
            attendance + "%";

        resultStudyHours.textContent =
            studyHours + " hrs";


        // Change status

        resultStatus.textContent = "Completed";

        resultStatus.style.background = "#ecfdf3";
        resultStatus.style.color = "#15803d";


        // Hide placeholder

        resultPlaceholder.style.display = "none";

        // Show result

        predictionResult.classList.add("show");


        // Success message

        showMessage(
            "Prediction generated successfully.",
            "success"
        );


        // Scroll to result on smaller screens

        if (window.innerWidth <= 1100) {

            document
                .getElementById("resultCard")
                .scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        }

    });


    // ========================================
    // Logout
    // ========================================

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
    // Show Message
    // ========================================

    function showMessage(message, type) {

        formMessage.textContent = message;

        formMessage.className = "form-message";

        formMessage.classList.add(type);

    }


    // ========================================
    // Clear Message
    // ========================================

    function clearMessage() {

        formMessage.textContent = "";

        formMessage.className = "form-message";

    }

});