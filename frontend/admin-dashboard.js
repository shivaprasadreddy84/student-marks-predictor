document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);
    const API = "/api/admin";
    const PERF = "/api/performance";

    let students = [];
    let exams = [];
    let predictions = [];
    let performance = [];
    let entryStudents = [];

    const departmentSubjects = {
        "Computer Science (CSE)": [
            "Machine Learning", "Computer Networks", "DBMS", "Software Engineering"
        ],
        "Information Technology (IT)": [
            "Web Technologies", "Data Mining", "Cyber Security"
        ],
        "Electronics (ECE)": [
            "Digital Electronics", "Signals and Systems",
            "Microprocessors", "Communication Systems"
        ],
        "Electrical (EEE)": [
            "Power Systems", "Electrical Machines",
            "Control Systems", "Power Electronics"
        ],
        "Mechanical": [
            "Thermodynamics", "Manufacturing Technology",
            "Fluid Mechanics", "Machine Design"
        ],
        "Civil": [
            "Structural Analysis", "Geotechnical Engineering",
            "Surveying", "Transportation Engineering"
        ],
        "Other": []
    };

    // ---------------- LOGIN ----------------

    let user;

    try {
        user = JSON.parse(sessionStorage.getItem("marksense_user") || "null");
    } catch {
        user = null;
    }

    if (!user || !user.user_id || user.role !== "admin") {
        window.location.replace(
            user?.role === "student" ? "student-dashboard.html" : "login.html"
        );
        return;
    }

    setText("adminName", user.full_name || "Administrator");
    setText("welcomeName", (user.full_name || "Admin").split(" ")[0]);
    setText("adminAvatar", (user.full_name || "A").charAt(0).toUpperCase());
    setText("currentYear", new Date().getFullYear());

    // ---------------- HELPERS ----------------

    function setText(id, value) {
        if ($(id)) $(id).textContent = value ?? "";
    }

    function formatMarks(value) {
        return value == null || value === ""
            ? "—"
            : Number(value).toFixed(2);
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? String(value)
            : date.toLocaleDateString();
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    async function requestJSON(url, options = {}) {
        const response = await fetch(url, options);
        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("The server returned an invalid response.");
        }

        if (!response.ok) {
            throw new Error(
                data.message || data.error ||
                `Request failed (${response.status}).`
            );
        }

        return data;
    }

    function fetchAPI(endpoint) {
        return requestJSON(`${API}/${endpoint}`);
    }

    function message(id, text, type = "error") {
        const element = $(id);
        if (!element) return;

        element.textContent = text;
        element.classList.remove("hidden", "error", "success");
        element.classList.add(type);
    }

    function clearMessage(id) {
        const element = $(id);
        if (!element) return;

        element.textContent = "";
        element.classList.add("hidden");
        element.classList.remove("error", "success");
    }

    function showEmptyRow(id, colspan, text) {
        const tbody = $(id);
        if (!tbody) return;

        tbody.innerHTML = `
            <tr>
                <td colspan="${colspan}" class="table-empty">
                    ${escapeHTML(text)}
                </td>
            </tr>
        `;
    }

    function renderTable(id, records, columns, emptyText) {
        const tbody = $(id);
        if (!tbody) return;

        if (!records.length) {
            showEmptyRow(id, columns.length, emptyText);
            return;
        }

        tbody.innerHTML = records.map(record => `
            <tr>
                ${columns.map(col => `
                    <td>${escapeHTML(col(record) ?? "—")}</td>
                `).join("")}
            </tr>
        `).join("");
    }

    function fillSelect(select, options, placeholder) {
        if (!select) return;

        select.innerHTML = "";
        select.add(new Option(placeholder, ""));

        options.forEach(option => {
            select.add(new Option(option.label, option.value));
        });

        select.disabled = options.length === 0;
    }

    function normalizeDepartment(value) {
        const v = String(value || "").trim().toLowerCase();

        const aliases = {
            "cse": "computer science (cse)",
            "computer science": "computer science (cse)",
            "it": "information technology (it)",
            "information technology": "information technology (it)",
            "ece": "electronics (ece)",
            "electronics": "electronics (ece)",
            "eee": "electrical (eee)",
            "electrical": "electrical (eee)"
        };

        return aliases[v] || v;
    }

    // ---------------- NAVIGATION ----------------

    const sections = {
        overview: "overviewSection",
        students: "studentsSection",
        exams: "examsSection",
        updatePerformance: "updatePerformanceSection",
        predictions: "predictionsSection",
        performance: "performanceSection"
    };

    const titles = {
        overview: "Dashboard",
        students: "Student Management",
        exams: "Exam Management",
        updatePerformance: "Update Student Performance",
        predictions: "Prediction Records",
        performance: "Performance Records"
    };

    function showSection(name) {
        if (!sections[name]) return;

        Object.entries(sections).forEach(([key, id]) => {
            $(id)?.classList.toggle("hidden", key !== name);
        });

        document.querySelectorAll(".nav-link").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.section === name
            );
        });

        setText("pageTitle", titles[name]);
        $("sidebar")?.classList.remove("open");

        if (name === "overview") loadDashboard();
        if (name === "students") loadStudents();
        if (name === "exams") loadExams();
        if (name === "updatePerformance") initializePerformanceSelection();
        if (name === "predictions") loadPredictions(false);
        if (name === "performance") loadPerformance();

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

    // ---------------- DASHBOARD ----------------

    async function loadDashboard() {
        try {
            const stats = await fetchAPI("statistics");

            setText("totalStudents", stats.total_students ?? 0);
            setText("totalExams", stats.total_exams ?? 0);
            setText("totalPredictions", stats.total_predictions ?? 0);
            setText(
                "averagePrediction",
                Number(stats.average_prediction ?? 0).toFixed(2)
            );

            await loadPredictions(true);
        } catch (error) {
            console.error(error);
            message(
                "pageMessage",
                `Unable to load dashboard: ${error.message}`
            );
        }
    }

    // ---------------- STUDENTS ----------------

    async function loadStudents() {
        showEmptyRow("studentsTable", 8, "Loading students...");

        try {
            students = await fetchAPI("students");
            renderStudents();
        } catch (error) {
            console.error(error);
            showEmptyRow("studentsTable", 8, "Unable to load students.");
            message("pageMessage", error.message);
        }
    }

    function renderStudents() {
        const query = ($("studentSearch")?.value || "")
            .trim().toLowerCase();

        const rows = students.filter(s =>
            [
                s.student_id,
                s.account_id,
                s.full_name,
                s.email,
                s.department
            ].join(" ").toLowerCase().includes(query)
        );

        renderTable("studentsTable", rows, [
            r => r.student_id,
            r => r.account_id,
            r => r.full_name,
            r => r.email,
            r => r.department,
            r => r.year,
            r => r.semester,
            r => r.attendance == null ? "—" : `${r.attendance}%`
        ], "No student records found.");

        setText(
            "studentCount",
            `${rows.length} of ${students.length} students`
        );
    }

    // ---------------- EXAMS ----------------

    function updateExamSubjects() {
        const department = $("examDepartment")?.value;
        const subjects = departmentSubjects[department] || [];

        fillSelect(
            $("subject"),
            subjects.map(s => ({ label: s, value: s })),
            department ? "Select subject" : "Select department first"
        );
    }

    $("examDepartment")?.addEventListener("change", updateExamSubjects);

    async function loadExams() {
        showEmptyRow("examsTable", 7, "Loading exams...");

        try {
            exams = await requestJSON("/api/exam/all");

            renderTable("examsTable", exams, [
                r => r.exam_id,
                r => r.exam_name,
                r => r.subject,
                r => r.department,
                r => formatDate(r.exam_date),
                r => r.difficulty,
                r => r.max_marks
            ], "No exams available.");

            updatePerformanceExamDropdown();
        } catch (error) {
            console.error(error);
            showEmptyRow("examsTable", 7, "Unable to load exams.");
            message("pageMessage", error.message);
        }
    }

    $("examForm")?.addEventListener("submit", async event => {
        event.preventDefault();
        clearMessage("examFormMessage");

        const department = $("examDepartment").value;
        const subject = $("subject").value;
        const examName = $("exam_name").value.trim();
        const difficulty = $("difficulty").value;
        const maxMarks = Number($("max_marks").value);

        if (
            !department || !subject || !examName || !difficulty ||
            !Number.isFinite(maxMarks) || maxMarks <= 0
        ) {
            message(
                "examFormMessage",
                "Please complete all required fields."
            );
            return;
        }

        if (!(departmentSubjects[department] || []).includes(subject)) {
            message(
                "examFormMessage",
                "Choose a subject for the selected department."
            );
            return;
        }

        const button = $("createExamButton");
        button.disabled = true;
        button.textContent = "Creating...";

        try {
            const result = await requestJSON("/api/exam/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exam_name: examName,
                    subject,
                    department,
                    exam_date: $("exam_date").value || null,
                    difficulty,
                    max_marks: maxMarks
                })
            });

            message(
                "examFormMessage",
                result.message || "Exam created successfully.",
                "success"
            );

            $("examForm").reset();
            updateExamSubjects();
            $("max_marks").value = 100;

            await loadExams();
            await loadDashboard();
        } catch (error) {
            message("examFormMessage", error.message);
        } finally {
            button.disabled = false;
            button.textContent = "Create Exam";
        }
    });

    // ---------------- UPDATE PERFORMANCE ----------------

    function initializePerformanceSelection() {
        updatePerformanceSubjectDropdown();
        updatePerformanceExamDropdown();
    }

    function clearEntryTable(
        text = "Select department, subject and exam, then load students."
    ) {
        entryStudents = [];
        showEmptyRow("performanceEntryTable", 9, text);
        setText("performanceEntryCount", "0 students");

        if ($("savePerformanceButton")) {
            $("savePerformanceButton").disabled = true;
        }
    }

    function updatePerformanceSubjectDropdown() {
        const department = $("performanceDepartment")?.value;
        const subjects = departmentSubjects[department] || [];

        fillSelect(
            $("performanceSubject"),
            subjects.map(s => ({ label: s, value: s })),
            department ? "Select subject" : "Select department first"
        );

        fillSelect($("performanceExam"), [], "Select subject first");
        clearEntryTable();
    }

    function updatePerformanceExamDropdown() {
        const department = $("performanceDepartment")?.value;
        const subject = $("performanceSubject")?.value;

        const matches = exams.filter(e =>
            normalizeDepartment(e.department) ===
                normalizeDepartment(department) &&
            e.subject === subject
        );

        fillSelect(
            $("performanceExam"),
            matches.map(e => ({
                label: `${e.exam_name} (${e.max_marks} marks)`,
                value: String(e.exam_id)
            })),
            subject ? "Select exam" : "Select subject first"
        );

        const exam = exams.find(
            e => String(e.exam_id) === $("performanceExam")?.value
        );

        if ($("performanceMaxMarks")) {
            $("performanceMaxMarks").value = exam?.max_marks ?? 100;
        }

        clearEntryTable();
    }

    $("performanceDepartment")?.addEventListener(
        "change",
        updatePerformanceSubjectDropdown
    );

    $("performanceSubject")?.addEventListener(
        "change",
        updatePerformanceExamDropdown
    );

    $("performanceExam")?.addEventListener("change", () => {
        const exam = exams.find(
            e => String(e.exam_id) === $("performanceExam").value
        );

        if ($("performanceMaxMarks")) {
            $("performanceMaxMarks").value = exam?.max_marks ?? 100;
        }

        clearEntryTable();
    });

    function inputCell(studentId, field, value, max, placeholder = "") {
        const input = document.createElement("input");

        input.type = "number";
        input.min = "0";
        input.max = String(max);
        input.step = "0.01";
        input.placeholder = placeholder || `0–${max}`;
        input.value = value ?? "";
        input.dataset.studentId = studentId;
        input.dataset.field = field;
        input.style.width = "95px";
        input.style.minWidth = "80px";

        return input;
    }

    function scaledExternal(value) {
        return value === "" || value == null
            ? "—"
            : (Number(value) * 0.6).toFixed(2);
    }

    function finalMarks(record) {
        if (
            record.assignment1_marks == null ||
            record.assignment2_marks == null ||
            record.actual_marks == null ||
            record.assignment1_marks === "" ||
            record.assignment2_marks === "" ||
            record.actual_marks === ""
        ) {
            return "—";
        }

        return (
            Number(record.assignment1_marks) +
            Number(record.assignment2_marks) +
            Number(record.actual_marks) * 0.6
        ).toFixed(2);
    }

    async function loadPerformanceStudents() {
        clearMessage("performanceEntryMessage");

        const department = $("performanceDepartment").value;
        const subject = $("performanceSubject").value;
        const examId = $("performanceExam").value;

        if (!department || !subject || !examId) {
            message(
                "performanceEntryMessage",
                "Select department, subject and exam first."
            );
            return;
        }

        const button = $("performanceLoadButton");
        button.disabled = true;
        button.textContent = "Loading...";

        showEmptyRow("performanceEntryTable", 9, "Loading students...");

        try {
            const list = await requestJSON(
                `${PERF}/department-students?department=${encodeURIComponent(department)}`
            );

            entryStudents = await Promise.all(list.map(async student => {
                let old = null;

                try {
                    const records = await requestJSON(
                        `${PERF}/student/${student.student_id}`
                    );

                    old = Array.isArray(records)
                        ? records.find(
                            r => String(r.exam_id) === String(examId)
                        )
                        : null;
                } catch (error) {
                    console.warn(
                        "Unable to prefill student record:",
                        error.message
                    );
                }

                return {
                    ...student,
                    previous_marks: old?.previous_marks ?? null,
                    assignment1_marks: old?.assignment1_marks ?? null,
                    assignment2_marks: old?.assignment2_marks ?? null,
                    actual_marks: old?.actual_marks ?? null,
                    attendance: old?.attendance ?? null,
                    study_hours: old?.study_hours ?? null
                };
            }));

            renderEntryTable();

            message(
                "performanceEntryMessage",
                `Loaded ${entryStudents.length} students.`,
                "success"
            );
        } catch (error) {
            console.error(error);
            clearEntryTable("Unable to load students.");
            message("performanceEntryMessage", error.message);
        } finally {
            button.disabled = false;
            button.textContent = "Load Students";
        }
    }

    function renderEntryTable() {
        const tbody = $("performanceEntryTable");
        tbody.innerHTML = "";

        if (!entryStudents.length) {
            clearEntryTable("No students found.");
            return;
        }

        entryStudents.forEach(student => {
            const row = document.createElement("tr");

            const id = document.createElement("td");
            id.textContent = student.student_id;

            const name = document.createElement("td");
            name.textContent = student.full_name || "Student";

            row.append(id, name);

            const fields = [
                ["assignment1_marks", 20],
                ["assignment2_marks", 20],
                ["actual_marks", 100],
                ["external_scaled", null],
                ["final_marks", null],
                ["attendance", 100],
                ["study_hours", 168]
            ];

            fields.forEach(([field, max]) => {
                const cell = document.createElement("td");

                if (field === "external_scaled" || field === "final_marks") {
                    const output = document.createElement("span");
                    output.dataset.output = field;
                    output.dataset.studentId = student.student_id;

                    output.textContent = field === "external_scaled"
                        ? scaledExternal(student.actual_marks)
                        : finalMarks(student);

                    cell.appendChild(output);
                } else {
                    cell.appendChild(
                        inputCell(
                            student.student_id,
                            field,
                            student[field],
                            max
                        )
                    );
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

        setText("performanceEntryCount", `${entryStudents.length} students`);
        $("savePerformanceButton").disabled = false;
    }

    function readEntryRecords() {
        const map = new Map();

        entryStudents.forEach(student => {
            map.set(String(student.student_id), {
                student_id: Number(student.student_id)
            });
        });

        document.querySelectorAll(
            "#performanceEntryTable input[data-field]"
        ).forEach(input => {
            const record = map.get(String(input.dataset.studentId));
            if (!record) return;

            record[input.dataset.field] =
                input.value.trim() === "" ? null : Number(input.value);
        });

        return [...map.values()];
    }

    $("performanceEntryTable")?.addEventListener("input", () => {
        readEntryRecords().forEach(record => {
            const scaled = document.querySelector(
                `[data-output="external_scaled"][data-student-id="${record.student_id}"]`
            );

            const final = document.querySelector(
                `[data-output="final_marks"][data-student-id="${record.student_id}"]`
            );

            if (scaled) {
                scaled.textContent = scaledExternal(record.actual_marks);
            }

            if (final) {
                final.textContent = finalMarks(record);
            }
        });
    });

    $("performanceSelectionForm")?.addEventListener("submit", event => {
        event.preventDefault();
        loadPerformanceStudents();
    });

    $("savePerformanceButton")?.addEventListener("click", async () => {
        clearMessage("performanceEntryMessage");

        const examId = $("performanceExam").value;

        if (!examId || !entryStudents.length) {
            message(
                "performanceEntryMessage",
                "Load students before saving."
            );
            return;
        }

        const records = readEntryRecords();
        const exam = exams.find(
            e => String(e.exam_id) === String(examId)
        );

        const externalMax = Math.min(
            100,
            Number(exam?.max_marks ?? 100)
        );

        for (const record of records) {
            const rules = [
                ["assignment1_marks", 20, "Assignment 1"],
                ["assignment2_marks", 20, "Assignment 2"],
                ["actual_marks", externalMax, "External marks"],
                ["attendance", 100, "Attendance"],
                ["study_hours", 168, "Study hours"]
            ];

            for (const [field, max, label] of rules) {
                const value = record[field];

                if (value == null) continue;

                if (
                    !Number.isFinite(value) ||
                    value < 0 ||
                    value > max
                ) {
                    message(
                        "performanceEntryMessage",
                        `${label} for student ${record.student_id} must be between 0 and ${max}.`
                    );
                    return;
                }
            }
        }

        const button = $("savePerformanceButton");
        button.disabled = true;
        button.textContent = "Saving...";

        try {
            const result = await requestJSON(`${PERF}/bulk-save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    exam_id: Number(examId),
                    records: records.map(r => ({
                        student_id: r.student_id,
                        previous_marks: r.previous_marks ?? null,
                        assignment1_marks: r.assignment1_marks ?? null,
                        assignment2_marks: r.assignment2_marks ?? null,
                        actual_marks: r.actual_marks ?? null,
                        attendance: r.attendance ?? null,
                        study_hours: r.study_hours ?? null
                    }))
                })
            });

            message(
                "performanceEntryMessage",
                result.message ||
                    `Saved ${result.saved_count ?? records.length} records.`,
                "success"
            );

            await loadPerformance();
            await loadDashboard();
            await loadPerformanceStudents();
        } catch (error) {
            console.error(error);
            message(
                "performanceEntryMessage",
                `Unable to save: ${error.message}`
            );
        } finally {
            button.disabled = entryStudents.length === 0;
            button.textContent = "Save All Performance Records";
        }
    });

    // ---------------- PREDICTIONS ----------------

    async function loadPredictions(forDashboard = false) {
        try {
            predictions = await fetchAPI("predictions");

            if (forDashboard) {
                renderTable(
                    "recentPredictions",
                    predictions.slice(0, 5),
                    [
                        r => r.student_name,
                        r => r.exam_name,
                        r => r.subject,
                        r => r.predicted_marks == null
                            ? "—"
                            : `${formatMarks(r.predicted_marks)}/100`,
                        r => r.performance_level
                    ],
                    "No prediction records available."
                );
            } else {
                renderPredictions();
            }
        } catch (error) {
            console.error(error);

            showEmptyRow(
                forDashboard ? "recentPredictions" : "predictionsTable",
                forDashboard ? 5 : 9,
                "Unable to load predictions."
            );
        }
    }

    function renderPredictions() {
        const query = ($("predictionSearch")?.value || "")
            .toLowerCase().trim();

        const rows = predictions.filter(r =>
            [
                r.prediction_id,
                r.account_id,
                r.student_name,
                r.exam_name,
                r.subject
            ].join(" ").toLowerCase().includes(query)
        );

        renderTable("predictionsTable", rows, [
            r => r.prediction_id,
            r => r.account_id,
            r => r.student_name,
            r => r.exam_name,
            r => r.subject,
            r => r.predicted_marks == null
                ? "—"
                : `${formatMarks(r.predicted_marks)}/100`,
            r => r.performance_level,
            r => r.exam_difficulty,
            r => formatDate(r.created_at)
        ], "No prediction records found.");

        setText(
            "predictionCount",
            `${rows.length} of ${predictions.length} predictions`
        );
    }

    // ---------------- PERFORMANCE RECORDS ----------------

    async function loadPerformance() {
        showEmptyRow(
            "performanceTable",
            12,
            "Loading performance records..."
        );

        try {
            performance = await fetchAPI("performance");
            renderPerformance();
        } catch (error) {
            console.error(error);

            showEmptyRow(
                "performanceTable",
                12,
                "Unable to load performance records."
            );

            message("pageMessage", error.message);
        }
    }

    function renderPerformance() {
        const query = ($("performanceSearch")?.value || "")
            .toLowerCase().trim();

        const rows = performance.filter(r =>
            [
                r.performance_id,
                r.account_id,
                r.student_name,
                r.exam_name,
                r.subject
            ].join(" ").toLowerCase().includes(query)
        );

        const tbody = $("performanceTable");
        if (!tbody) return;

        if (!rows.length) {
            showEmptyRow(
                "performanceTable",
                12,
                "No performance records found."
            );

            setText("performanceCount", "0 records");
            return;
        }

        tbody.innerHTML = rows.map(r => {
            const scaled = r.actual_marks == null ||
                r.actual_marks === ""
                ? null
                : Number(r.actual_marks) * 0.6;

            const hasAllMarks =
                r.assignment1_marks != null &&
                r.assignment1_marks !== "" &&
                r.assignment2_marks != null &&
                r.assignment2_marks !== "" &&
                r.actual_marks != null &&
                r.actual_marks !== "";

            const final = r.final_marks != null &&
                r.final_marks !== ""
                ? Number(r.final_marks)
                : hasAllMarks
                    ? Number(r.assignment1_marks) +
                      Number(r.assignment2_marks) +
                      Number(r.actual_marks) * 0.6
                    : null;

            return `
                <tr>
                    <td>${escapeHTML(r.performance_id)}</td>
                    <td>${escapeHTML(r.account_id ?? "—")}</td>
                    <td>${escapeHTML(r.student_name ?? "—")}</td>
                    <td>${escapeHTML(r.exam_name ?? "—")}</td>
                    <td>${escapeHTML(r.subject ?? "—")}</td>
                    <td>${escapeHTML(formatMarks(r.assignment1_marks))}</td>
                    <td>${escapeHTML(formatMarks(r.assignment2_marks))}</td>
                    <td>${escapeHTML(formatMarks(r.actual_marks))}</td>
                    <td>${escapeHTML(formatMarks(scaled))}</td>
                    <td>${escapeHTML(formatMarks(final))}</td>
                    <td>${escapeHTML(
                        r.attendance == null ? "—" : `${r.attendance}%`
                    )}</td>
                    <td>${escapeHTML(r.study_hours ?? "—")}</td>
                </tr>
            `;
        }).join("");

        setText(
            "performanceCount",
            `${rows.length} of ${performance.length} records`
        );
    }

    // ---------------- SEARCH / REFRESH ----------------

    $("studentSearch")?.addEventListener("input", renderStudents);
    $("predictionSearch")?.addEventListener("input", renderPredictions);
    $("performanceSearch")?.addEventListener("input", renderPerformance);

    $("refreshStudents")?.addEventListener("click", loadStudents);
    $("refreshExams")?.addEventListener("click", loadExams);

    $("refreshPredictions")?.addEventListener("click", () => {
        loadPredictions(false);
    });

    $("refreshPerformance")?.addEventListener("click", loadPerformance);

    // ---------------- START ----------------

    updateExamSubjects();
    loadDashboard();
    loadStudents();
    loadExams();
});