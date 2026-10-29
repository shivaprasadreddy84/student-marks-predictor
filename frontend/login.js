document.addEventListener("DOMContentLoaded", function () {
    const passwordInput = document.getElementById("password");
    const togglePassword = document.getElementById("togglePassword");
    const loginForm = document.getElementById("loginForm");
    const formMessage = document.getElementById("formMessage");
    const loginSubmit = document.getElementById("loginSubmit");

    // Show or hide password
    togglePassword.addEventListener("click", function () {
        const isHidden = passwordInput.type === "password";

        passwordInput.type = isHidden ? "text" : "password";
        togglePassword.textContent = isHidden ? "Hide" : "Show";
        togglePassword.setAttribute(
            "aria-label",
            isHidden ? "Hide password" : "Show password"
        );
    });

    // Login using the Flask backend
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = passwordInput.value;
        const selectedRole = document.querySelector(
            'input[name="role"]:checked'
        ).value;

        formMessage.textContent = "";
        loginSubmit.disabled = true;
        loginSubmit.innerHTML = "Signing in...";

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Login failed. Please try again."
                );
            }

            // Ensure the selected role matches the account
            if (result.role !== selectedRole) {
                formMessage.textContent =
                    "This account is not registered as " +
                    selectedRole + ". Please select the correct role.";
                return;
            }

            // Save the authenticated user's basic details
            sessionStorage.setItem(
                "marksense_user",
                JSON.stringify({
                    user_id: result.user_id,
                    full_name: result.full_name,
                    email: email,
                    role: result.role,
                    account_id: result.account_id
                })
            );

            formMessage.style.color = "#6ee7b7";
            formMessage.textContent = "Login successful! Redirecting...";

            // Redirect according to account role
            if (result.role === "admin") {
                window.location.href = "admin-dashboard.html";
            } else {
                window.location.href = "student-dashboard.html";
            }

        } catch (error) {
            formMessage.style.color = "#fca5a5";

            if (error instanceof TypeError) {
                formMessage.textContent =
                    "Cannot connect to the server. Please check that MarkSense is running.";
            } else {
                formMessage.textContent = error.message;
            }

        } finally {
            loginSubmit.disabled = false;
            loginSubmit.innerHTML = 'Sign In <span>→</span>';
        }
    });
});