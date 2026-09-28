// ========================================
// MarkSense - Admin Analysis JavaScript
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

        The backend will provide:

        - Average marks
        - Highest marks
        - Average attendance
        - Average study hours
        - Exam-wise performance
        - Performance distribution
        - Academic factor analysis
        - Statistical insights
    */

});