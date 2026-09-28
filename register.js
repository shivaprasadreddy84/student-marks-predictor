// ========================================
// MarkSense - Register JavaScript
// ========================================

const registerForm = document.getElementById("registerForm");

const roleStudent = document.getElementById("roleStudent");
const roleAdmin = document.getElementById("roleAdmin");

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const studentIdInput = document.getElementById("studentId");
const departmentInput = document.getElementById("department");

const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

const formMessage = document.getElementById("formMessage");

let selectedRole = "student";


// ========================================
// Role Selection
// ========================================

roleStudent.addEventListener("click", function () {

    selectedRole = "student";

    roleStudent.classList.add("active");
    roleAdmin.classList.remove("active");

    clearMessage();
});


roleAdmin.addEventListener("click", function () {

    selectedRole = "admin";

    roleAdmin.classList.add("active");
    roleStudent.classList.remove("active");

    clearMessage();
});


// ========================================
// Registration Form
// ========================================

registerForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const studentId = studentIdInput.value.trim();
    const department = departmentInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    clearMessage();


    // Full Name
    if (fullName === "") {
        showMessage("Please enter your full name.", "error");
        fullNameInput.focus();
        return;
    }


    if (fullName.length < 3) {
        showMessage("Please enter a valid full name.", "error");
        fullNameInput.focus();
        return;
    }


    // Email
    if (email === "") {
        showMessage("Please enter your email address.", "error");
        emailInput.focus();
        return;
    }


    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        showMessage("Please enter a valid email address.", "error");
        emailInput.focus();
        return;
    }


    // ID
    if (studentId === "") {
        showMessage("Please enter your Student / Employee ID.", "error");
        studentIdInput.focus();
        return;
    }


    // Department
    if (department === "") {
        showMessage("Please select your department.", "error");
        departmentInput.focus();
        return;
    }


    // Password
    if (password === "") {
        showMessage("Please create a password.", "error");
        passwordInput.focus();
        return;
    }


    if (password.length < 6) {
        showMessage(
            "Password must contain at least 6 characters.",
            "error"
        );
        passwordInput.focus();
        return;
    }


    // Confirm Password
    if (confirmPassword === "") {
        showMessage("Please confirm your password.", "error");
        confirmPasswordInput.focus();
        return;
    }


    if (password !== confirmPassword) {
        showMessage("Passwords do not match.", "error");
        confirmPasswordInput.focus();
        return;
    }


    // ========================================
    // Temporary Registration
    // ========================================

    showMessage(
        `Registration details validated for ${
            selectedRole === "student"
                ? "Student"
                : "Faculty/Admin"
        }. Backend registration will be connected later.`,
        "success"
    );


    /*
    ============================================
    FUTURE BACKEND API INTEGRATION
    ============================================

    Later we will connect this form to Flask:

    fetch("http://127.0.0.1:5000/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: fullName,
            email: email,
            user_id: studentId,
            department: department,
            role: selectedRole,
            password: password
        })
    })
    .then(response => response.json())
    .then(data => {

        if (data.success) {
            // Registration successful
        } else {
            // Show server error
        }

    })
    .catch(error => {
        showMessage(
            "Unable to connect to the server.",
            "error"
        );
    });

    ============================================
    */
});


// ========================================
// Show Message
// ========================================

function showMessage(message, type) {

    formMessage.textContent = message;

    formMessage.className = "form-message";

    if (type === "error") {
        formMessage.classList.add("error");
    }

    if (type === "success") {
        formMessage.classList.add("success");
    }
}


// ========================================
// Clear Message
// ========================================

function clearMessage() {

    formMessage.textContent = "";
    formMessage.className = "form-message";
}