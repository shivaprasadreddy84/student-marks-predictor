// ========================================
// MarkSense - Admin Dashboard JavaScript
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const logoutBtn = document.getElementById("logoutBtn");


    // =====================================
    // Logout
    // =====================================

    logoutBtn.addEventListener("click", function () {

        const confirmLogout =
            confirm("Are you sure you want to logout?");

        if (confirmLogout) {

            // Temporary frontend logout.
            // Proper authentication will be added
            // when the backend is connected.

            window.location.href = "login.html";

        }

    });


    // =====================================
    // Future Backend Integration
    // =====================================

    /*
        Later this page will receive real data
        from the Flask backend and database.

        Example:

        - Total students
        - Total predictions
        - Average predicted marks
        - Active exams
        - Recent student predictions
        - Exam difficulty
    */

});