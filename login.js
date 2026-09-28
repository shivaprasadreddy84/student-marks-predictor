// ========================================
// MarkSense - Login JavaScript
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const loginButton = document.getElementById("loginSubmit");
    const togglePassword = document.getElementById("togglePassword");

    const formMessage = document.getElementById("formMessage");

    let selectedRole = "student";


    // =====================================
    // Role Selection
    // =====================================

    const roleInputs = document.querySelectorAll(
        'input[name="role"]'
    );

    roleInputs.forEach(function (radio) {

        radio.addEventListener("change", function () {

            selectedRole = this.value;

            clearMessage();

        });

    });


    // =====================================
    // Show / Hide Password
    // =====================================

    togglePassword.addEventListener("click", function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            togglePassword.textContent = "Hide";

        } else {

            passwordInput.type = "password";

            togglePassword.textContent = "Show";

        }

    });


    // =====================================
    // Sign In Button
    // =====================================

    loginButton.addEventListener("click", function () {

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();


        // Check Email

        if (email === "") {

            showMessage(
                "Please enter your email address.",
                "error"
            );

            emailInput.focus();

            return;
        }


        // Check Password

        if (password === "") {

            showMessage(
                "Please enter your password.",
                "error"
            );

            passwordInput.focus();

            return;
        }


        // Password Length

        if (password.length < 6) {

            showMessage(
                "Password must contain at least 6 characters.",
                "error"
            );

            passwordInput.focus();

            return;
        }


        // =====================================
        // TEMPORARY FRONTEND LOGIN
        // =====================================

        showMessage(
            "Login successful. Opening dashboard...",
            "success"
        );


        // Open correct page

        setTimeout(function () {

            if (selectedRole === "student") {

                window.location.href =
                    "student-dashboard.html";

            } else {

                window.location.href =
                    "admin-dashboard.html";

            }

        }, 500);

    });


    // =====================================
    // Show Message
    // =====================================

    function showMessage(message, type) {

        formMessage.textContent = message;

        formMessage.className = "form-message";

        formMessage.classList.add(type);

    }


    // =====================================
    // Clear Message
    // =====================================

    function clearMessage() {

        formMessage.textContent = "";

        formMessage.className = "form-message";

    }

});