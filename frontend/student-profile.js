document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("studentProfileForm");
    const message = document.getElementById("formMessage");
    const saveButton = document.getElementById("saveButton");

    // Check the logged-in account
    const userData = sessionStorage.getItem("marksense_user");

    if (!userData) {
        window.location.replace("login.html");
        return;
    }

    let user;

    try {
        user = JSON.parse(userData);
    } catch (error) {
        sessionStorage.removeItem("marksense_user");
        window.location.replace("login.html");
        return;
    }

    if (!user.user_id || user.role !== "student") {
        window.location.replace("login.html");
        return;
    }

    // Check whether a profile already exists
    async function checkExistingProfile() {
        try {
            const response = await fetch(
                `/api/student/profile/${encodeURIComponent(user.user_id)}`
            );

            if (response.ok) {
                message.style.color = "#fdba74";
                message.textContent =
                    "A student profile already exists for this account. Return to your dashboard.";

                saveButton.disabled = true;
                saveButton.textContent = "Profile Already Created";
                return true;
            }

            if (response.status !== 404) {
                message.style.color = "#fca5a5";
                message.textContent =
                    "Unable to check your profile. Please try again.";
                saveButton.disabled = true;
                return true;
            }

            return false;
        } catch (error) {
            message.style.color = "#fca5a5";
            message.textContent =
                "Cannot connect to the server. Check that MarkSense is running.";
            saveButton.disabled = true;
            return true;
        }
    }

    checkExistingProfile();

    // Save student profile
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const department = document.getElementById("department").value;
        const year = Number(document.getElementById("year").value);
        const semester = Number(document.getElementById("semester").value);
        const studyHours = Number(
            document.getElementById("study_hours").value
        );
        const attendance = Number(
            document.getElementById("attendance").value
        );

        message.style.color = "#fca5a5";
        message.textContent = "";

        if (
            !department ||
            !year ||
            !semester ||
            document.getElementById("study_hours").value === "" ||
            document.getElementById("attendance").value === ""
        ) {
            message.textContent = "Please complete all fields.";
            return;
        }

        if (studyHours < 0 || studyHours > 24) {
            message.textContent =
                "Daily study hours must be between 0 and 24.";
            return;
        }

        if (attendance < 0 || attendance > 100) {
            message.textContent =
                "Attendance must be between 0 and 100.";
            return;
        }

        saveButton.disabled = true;
        saveButton.textContent = "Saving profile...";

        try {
            const response = await fetch("/api/student/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    user_id: user.user_id,
                    department: department,
                    year: year,
                    semester: semester,
                    study_hours: studyHours,
                    attendance: attendance
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to save student profile."
                );
            }

            message.style.color = "#6ee7b7";
            message.textContent =
                "Student profile saved successfully! Redirecting to dashboard...";

            saveButton.textContent = "Profile Saved";

            window.setTimeout(function () {
                window.location.href = "student-dashboard.html";
            }, 2000);

        } catch (error) {
            message.style.color = "#fca5a5";

            if (error instanceof TypeError) {
                message.textContent =
                    "Cannot connect to the server. Please try again.";
            } else {
                message.textContent = error.message;
            }

            saveButton.disabled = false;
            saveButton.innerHTML = "Save Student Profile <span>→</span>";
        }
    });
});