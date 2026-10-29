document.addEventListener("DOMContentLoaded", function () {
    const $ = id => document.getElementById(id);

    // =====================================
    // 1. CHECK STUDENT LOGIN
    // =====================================

    const userData = sessionStorage.getItem("marksense_user");

    if (!userData) {
        window.location.replace("login.html");
        return;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch {
        sessionStorage.removeItem("marksense_user");
        window.location.replace("login.html");
        return;
    }

    if (!user.user_id || user.role !== "student") {
        window.location.replace(
            user.role === "admin"
                ? "admin-dashboard.html"
                : "login.html"
        );
        return;
    }

    let studentProfile = null;
    let exams = [];
    let selectedExam = null;

    const name = user.full_name || "Student";

    setText("welcomeName", name.split(" ")[0]);
    setText("headerName", name);
    setText("userAvatar", name.charAt(0).toUpperCase());
    setText("profileAvatar", name.charAt(0).toUpperCase());
    setText("profileName", name);
    setText("profileFullName", name);
    setText("profileEmail", user.email || "Not available");
    setText("profileAccountId", user.account_id || "Not available");
    setText("profileRole", "Student");

    // =====================================
    // 2. NAVIGATION
    // =====================================

    const sections = {
        overview: "overviewSection",
        predict: "predictSection",
        performance: "performanceSection",
        history: "historySection",
        profile: "profileSection"
    };

    const titles = {
        overview: "Overview",
        predict: "Predict Marks",
        performance: "Performance",
        history: "Prediction History",
        profile: "My Profile"
    };

    function showSection(sectionName) {
        if (!sections[sectionName]) return;

        Object.entries(sections).forEach(([key, id]) => {
            $(id)?.classList.toggle("hidden", key !== sectionName);
        });

        document.querySelectorAll(".nav-link").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.section === sectionName
            );
        });

        setText("pageTitle", titles[sectionName]);
        $("sidebar")?.classList.remove("open");

        if (sectionName === "profile") {
            loadStudentProfile();
        }

        if (sectionName === "predict") {
            loadExams();
        }

        if (sectionName === "history" || sectionName === "overview") {
            loadHistory();
        }

        if (sectionName === "performance") {
            loadPerformance();
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.querySelectorAll(".nav-link").forEach(button => {
        button.addEventListener("click", () => {
            showSection(button.dataset.section);
        });
    });

    document.querySelectorAll("[data-go]").forEach(button => {
        button.addEventListener("click", () => {
            showSection(button.dataset.go);
        });
    });

    $("menuToggle")?.addEventListener("click", () => {
        $("sidebar")?.classList.toggle("open");
    });

    $("logoutButton")?.addEventListener("click", () => {
        sessionStorage.removeItem("marksense_user");
        window.location.replace("login.html");
    });

    // =====================================
    // 3. HELPER FUNCTIONS
    // =====================================

    function setText(id, value) {
        const element = $(id);
        if (element) element.textContent = value ?? "";
    }

    function formatMark(value) {
        return value == null || value === ""
            ? "—"
            : Number(value).toFixed(2);
    }

    function setTableMessage(tbody, columns, message) {
        if (!tbody) return;

        tbody.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = columns;
        cell.className = "table-empty";
        cell.textContent = message;

        row.appendChild(cell);
        tbody.appendChild(row);
    }

    async function requestJSON(url, options = {}) {
        const response = await fetch(url, options);

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error(
                `The server returned an invalid response (${response.status}).`
            );
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                `Request failed (${response.status}).`
            );
        }

        return result;
    }

    // Treat department abbreviations and full names as equivalent.
    function normalizeDepartment(value) {
        const department = String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

        const aliases = {
            "cse": "computer science",
            "computer science": "computer science",
            "computer science (cse)": "computer science",

            "it": "information technology",
            "information technology": "information technology",
            "information technology (it)": "information technology",

            "ece": "electronics",
            "electronics": "electronics",
            "electronics (ece)": "electronics",

            "eee": "electrical",
            "electrical": "electrical",
            "electrical (eee)": "electrical"
        };

        return aliases[department] || department;
    }

    // =====================================
    // 4. LOAD STUDENT PROFILE
    // =====================================

    async function loadStudentProfile() {
        try {
            const result = await requestJSON(
                `/api/student/profile/${encodeURIComponent(user.user_id)}`
            );

            studentProfile = result;

            setText(
                "overviewDepartment",
                result.department || "Not provided"
            );

            const year = Number(result.year);

            setText(
                "overviewYear",
                result.year
                    ? `${result.year}${year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} Year`
                    : "Not provided"
            );

            setText(
                "overviewSemester",
                result.semester
                    ? `Semester ${result.semester}`
                    : "Not provided"
            );

            setText(
                "overviewAttendance",
                result.attendance == null
                    ? "Not provided"
                    : `${result.attendance}%`
            );

            setText("profileFullName", result.full_name || name);
            setText("profileEmail", result.email || user.email || "—");
            setText(
                "profileAccountId",
                result.account_id || user.account_id || "—"
            );
            setText(
                "profileDepartment",
                result.department || "Not provided"
            );
            setText("profileYear", result.year ?? "Not provided");
            setText("profileSemester", result.semester ?? "Not provided");
            setText("profileStudyHours", result.study_hours ?? "Not provided");

            setText(
                "profileAttendance",
                result.attendance == null
                    ? "Not provided"
                    : `${result.attendance}%`
            );

            setText("profileMessage", "");

            return result;

        } catch (error) {
            console.error("Profile loading error:", error);

            studentProfile = null;

            setText("overviewDepartment", "Not provided");
            setText("overviewYear", "Not provided");
            setText("overviewSemester", "Not provided");
            setText("overviewAttendance", "Not provided");

            setText(
                "profileMessage",
                error.message.includes("404")
                    ? "Create your student profile first."
                    : `Unable to load profile: ${error.message}`
            );

            return null;
        }
    }

    // =====================================
    // 5. LOAD EXAMS FOR STUDENT DEPARTMENT
    // =====================================

    async function loadExams() {
        const select = $("exam_id");
        const message = $("predictionMessage");

        if (!select) {
            console.error(
                'Exam dropdown not found. Check that your HTML contains id="exam_id".'
            );
            return;
        }

        if (message) {
            message.textContent = "";
            message.style.color = "";
        }

        select.replaceChildren();

        const loadingOption = document.createElement("option");
        loadingOption.value = "";
        loadingOption.textContent = "Loading subjects...";
        select.appendChild(loadingOption);

        try {
            // Make sure the latest profile has loaded.
            if (!studentProfile) {
                await loadStudentProfile();
            }

            if (!studentProfile) {
                select.replaceChildren();

                const option = document.createElement("option");
                option.value = "";
                option.textContent = "Student profile unavailable";
                select.appendChild(option);

                setText(
                    "predictionMessage",
                    "Unable to load your student profile. Open My Profile and check your details."
                );
                return;
            }

            if (!studentProfile.department) {
                select.replaceChildren();

                const option = document.createElement("option");
                option.value = "";
                option.textContent = "Department not set";
                select.appendChild(option);

                setText(
                    "predictionMessage",
                    "Your student profile does not have a department. Please update your profile."
                );
                return;
            }

            // Request every exam from the backend.
            const result = await requestJSON("/api/exam/all");

            if (!Array.isArray(result)) {
                throw new Error(
                    "The exam API did not return a list. Check backend/routes/exam.py."
                );
            }

            exams = result;

            console.log("Student department:", studentProfile.department);
            console.log("Exams returned by API:", exams);

            // Check department values using normalized names.
            const studentDepartment = normalizeDepartment(
                studentProfile.department
            );

            const matchingExams = exams.filter(exam => {
                if (!exam.department) return false;

                return normalizeDepartment(exam.department) === studentDepartment;
            });

            console.log("Matching exams:", matchingExams);

            select.replaceChildren();

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "Select a subject";
            select.appendChild(placeholder);

            matchingExams.forEach(exam => {
                const option = document.createElement("option");

                option.value = exam.exam_id;
                option.textContent =
                    `${exam.subject} — ${exam.exam_name}`;

                select.appendChild(option);
            });

            selectedExam = null;

            if (matchingExams.length === 0) {
                if (message) {
                    message.style.color = "#fdba74";
                    message.textContent =
                        "No matching exams were returned for your department. Check the exam API response.";
                }
            } else if (message) {
                message.textContent = "";
            }

        } catch (error) {
            console.error("Exam loading error:", error);

            exams = [];
            selectedExam = null;

            select.replaceChildren();

            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Unable to load subjects";
            select.appendChild(option);

            if (message) {
                message.style.color = "#fca5a5";
                message.textContent =
                    `Unable to load exams: ${error.message}`;
            }
        }
    }

    $("exam_id")?.addEventListener("change", function () {
        selectedExam = exams.find(
            exam => String(exam.exam_id) === this.value
        ) || null;
    });

    // =====================================
    // 6. PREDICT MARKS
    // =====================================

    $("predictionForm")?.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = $("predictionMessage");
        const button = $("predictButton");
        const resultCard = $("predictionResult");

        if (message) {
            message.textContent = "";
            message.style.color = "";
        }

        resultCard?.classList.add("hidden");

        if (!studentProfile?.student_id) {
            setText(
                "predictionMessage",
                "Your student profile is missing. Open My Profile and check your details."
            );
            return;
        }

        const examId = $("exam_id")?.value ?? "";
        const studytime = $("studytime")?.value ?? "";
        const failures = $("failures")?.value ?? "";
        const absences = $("absences")?.value ?? "";
        const g1 = $("g1")?.value ?? "";
        const g2 = $("g2")?.value ?? "";

        if (
            [examId, studytime, failures, absences, g1, g2]
                .some(value => value === "")
        ) {
            setText("predictionMessage", "Please complete all fields.");
            return;
        }

        const selected = exams.find(
            exam => String(exam.exam_id) === examId
        );

        if (!selected) {
            setText(
                "predictionMessage",
                "Please select a valid exam from the dropdown."
            );
            return;
        }

        if (
            normalizeDepartment(selected.department) !==
            normalizeDepartment(studentProfile.department)
        ) {
            setText(
                "predictionMessage",
                "This exam does not belong to your department."
            );
            return;
        }

        if (
            Number(studytime) < 1 ||
            Number(studytime) > 4 ||
            Number(failures) < 0 ||
            Number(absences) < 0 ||
            Number(g1) < 0 ||
            Number(g1) > 20 ||
            Number(g2) < 0 ||
            Number(g2) > 20
        ) {
            setText(
                "predictionMessage",
                "Enter study time from 1–4, non-negative failures and absences, and marks from 0–20."
            );
            return;
        }

        try {
            if (button) {
                button.disabled = true;
                button.textContent = "Predicting...";
            }

            const result = await requestJSON(
                "/api/prediction/predict",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        student_id: studentProfile.student_id,
                        exam_id: Number(examId),
                        study_time_level: Number(studytime),
                        failures: Number(failures),
                        absences: Number(absences),
                        g1_marks: Number(g1),
                        g2_marks: Number(g2)
                    })
                }
            );

            setText(
                "resultMarks",
                Number(result.predicted_marks).toFixed(2)
            );

            setText(
                "resultDescription",
                `${selected.subject} — ${selected.exam_name} · ${result.performance_level} · Difficulty: ${result.exam_difficulty}`
            );

            resultCard?.classList.remove("hidden");

            if (message) {
                message.style.color = "#6ee7b7";
                message.textContent =
                    "Prediction generated and saved successfully.";
            }

            await loadHistory();

        } catch (error) {
            console.error("Prediction error:", error);

            if (message) {
                message.style.color = "#fca5a5";
                message.textContent = error.message;
            }

        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Predict marks →";
            }
        }
    });

    // =====================================
    // 7. LOAD PREDICTION HISTORY
    // =====================================

    async function loadHistory() {
        const recentBody = $("recentPredictions");
        const historyBody = $("historyPredictions");

        if (!studentProfile?.student_id) {
            setTableMessage(
                recentBody,
                4,
                "Create your student profile to view prediction history."
            );

            setTableMessage(
                historyBody,
                4,
                "Create your student profile to view prediction history."
            );

            setText("predictionCount", "—");
            setText("latestPrediction", "—");
            setText("overviewPredictionCount", "—");
            setText("overviewLatestMarks", "—");
            setText("recordCount", "—");
            return;
        }

        try {
            const records = await requestJSON(
                `/api/prediction/student/${studentProfile.student_id}`
            );

            if (!Array.isArray(records) || records.length === 0) {
                setTableMessage(
                    recentBody,
                    4,
                    "No saved predictions yet."
                );

                setTableMessage(
                    historyBody,
                    4,
                    "No saved predictions yet."
                );

                setText("predictionCount", "0");
                setText("latestPrediction", "—");
                setText("overviewPredictionCount", "0");
                setText("overviewLatestMarks", "—");
                return;
            }

            setText("predictionCount", records.length);
            setText("overviewPredictionCount", records.length);

            setText(
                "latestPrediction",
                Number(records[0].predicted_marks).toFixed(2)
            );

            setText(
                "overviewLatestMarks",
                `${Number(records[0].predicted_marks).toFixed(2)}/100`
            );

            function renderRows(body, rows) {
                if (!body) return;

                body.replaceChildren();

                rows.forEach(record => {
                    const row = document.createElement("tr");

                    const values = [
                        record.created_at
                            ? new Date(record.created_at).toLocaleDateString()
                            : "—",
                        record.exam_name || record.subject || "—",
                        record.predicted_marks == null
                            ? "—"
                            : `${Number(record.predicted_marks).toFixed(2)}/100`,
                        record.performance_level || "—"
                    ];

                    values.forEach(value => {
                        const cell = document.createElement("td");
                        cell.textContent = value;
                        row.appendChild(cell);
                    });

                    body.appendChild(row);
                });
            }

            renderRows(recentBody, records.slice(0, 5));
            renderRows(historyBody, records);

        } catch (error) {
            console.error("History loading error:", error);

            setTableMessage(
                recentBody,
                4,
                "Unable to load prediction history."
            );

            setTableMessage(
                historyBody,
                4,
                "Unable to load prediction history."
            );
        }
    }

// =====================================
// 8. LOAD PERFORMANCE
// =====================================

async function loadPerformance() {
    const tbody = $("performanceRecords");

    if (!tbody) return;

    if (!studentProfile?.student_id) {
        setTableMessage(
            tbody,
            9,
            "Create your student profile to view performance records."
        );

        setText("performanceRecordCount", "0");
        setText("averageActualMarks", "—");
        setText("averageAttendance", "—");
        setText("recordCount", "0");
        return;
    }

    try {
        const records = await requestJSON(
            `/api/performance/student/${studentProfile.student_id}`
        );

        if (!Array.isArray(records) || records.length === 0) {
            setTableMessage(
                tbody,
                9,
                "No performance records saved yet."
            );

            setText("performanceRecordCount", "0");
            setText("averageActualMarks", "—");
            setText("averageAttendance", "—");
            setText("recordCount", "0");
            return;
        }

        setText("performanceRecordCount", records.length);
        setText("recordCount", records.length);

        // Average external exam marks, out of 100.
        const actualMarks = records
            .map(record => record.actual_marks)
            .filter(value => value != null && value !== "")
            .map(Number)
            .filter(Number.isFinite);

        // Average attendance percentage.
        const attendance = records
            .map(record => record.attendance)
            .filter(value => value != null && value !== "")
            .map(Number)
            .filter(Number.isFinite);

        setText(
            "averageActualMarks",
            actualMarks.length
                ? (
                    actualMarks.reduce((a, b) => a + b, 0) /
                    actualMarks.length
                ).toFixed(2)
                : "—"
        );

        setText(
            "averageAttendance",
            attendance.length
                ? (
                    attendance.reduce((a, b) => a + b, 0) /
                    attendance.length
                ).toFixed(1) + "%"
                : "—"
        );

        tbody.replaceChildren();

        records.forEach(record => {
            const row = document.createElement("tr");

            const assignment1 = record.assignment1_marks;
            const assignment2 = record.assignment2_marks;
            const external = record.actual_marks;

            // Scale external marks from 100 to 60.
            const externalScaled =
                external == null || external === ""
                    ? null
                    : Number(external) * 0.6;

            // Show final marks only when all three marks exist.
            const hasAllMarks =
                assignment1 != null && assignment1 !== "" &&
                assignment2 != null && assignment2 !== "" &&
                external != null && external !== "";

            const finalMarks =
                record.final_marks != null &&
                record.final_marks !== ""
                    ? record.final_marks
                    : hasAllMarks
                        ? Number(assignment1) +
                          Number(assignment2) +
                          Number(external) * 0.6
                        : null;

            const values = [
                record.exam_name || "—",
                record.subject || "—",
                formatMark(assignment1),
                formatMark(assignment2),
                formatMark(external),
                formatMark(externalScaled),
                formatMark(finalMarks),
                record.attendance == null
                    ? "—"
                    : `${record.attendance}%`,
                record.study_hours == null
                    ? "—"
                    : String(record.study_hours)
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

    } catch (error) {
        console.error("Performance loading error:", error);

        setTableMessage(
            tbody,
            9,
            `Unable to load performance records: ${error.message}`
        );
    }
}

    // =====================================
    // 9. INITIALIZE DASHBOARD
    // =====================================

    async function initializeDashboard() {
        await loadStudentProfile();

        if (studentProfile) {
            await Promise.all([
                loadHistory(),
                loadPerformance()
            ]);
        } else {
            await loadHistory();
        }
    }

    initializeDashboard();
});