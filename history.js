// ========================================
// MarkSense - Prediction History JavaScript
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const examFilter = document.getElementById("examFilter");
    const difficultyFilter = document.getElementById("difficultyFilter");
    const clearFilters = document.getElementById("clearFilters");
    const tableBody = document.getElementById("historyTableBody");
    const logoutBtn = document.getElementById("logoutBtn");


    // =====================================
    // Filter Table
    // =====================================

    function filterTable() {

        const selectedExam = examFilter.value.toLowerCase();
        const selectedDifficulty =
            difficultyFilter.value.toLowerCase();

        const rows = tableBody.querySelectorAll("tr");

        rows.forEach(function (row) {

            const exam =
                row.cells[0].textContent.trim().toLowerCase();

            const difficulty =
                row.cells[6].textContent.trim().toLowerCase();


            const examMatch =
                selectedExam === "all" ||
                exam.includes(
                    selectedExam.replace("mid1", "mid exam 1")
                        .replace("mid2", "mid exam 2")
                        .replace("internal", "internal assessment")
                        .replace("semester", "semester exam")
                );


            const difficultyMatch =
                selectedDifficulty === "all" ||
                difficulty.includes(selectedDifficulty);


            if (examMatch && difficultyMatch) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    }


    // =====================================
    // Filter Events
    // =====================================

    examFilter.addEventListener(
        "change",
        filterTable
    );

    difficultyFilter.addEventListener(
        "change",
        filterTable
    );


    // =====================================
    // Clear Filters
    // =====================================

    clearFilters.addEventListener("click", function () {

        examFilter.value = "all";
        difficultyFilter.value = "all";

        filterTable();

    });


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
    // Initial Setup
    // =====================================

    filterTable();

});