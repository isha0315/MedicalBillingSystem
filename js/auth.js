const API_URL = "/api";


function setButtonLoading(button, loading, loadingText, defaultText) {
    if (!button) {
        return;
    }

    button.disabled = loading;

    if (loading) {
        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            ${loadingText}
        `;
    } else {
        button.innerHTML = defaultText;
    }
}


async function readResponse(response) {
    try {
        return await response.json();
    } catch {
        return {
            success: false,
            message: "The server returned an invalid response."
        };
    }
}


function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll(".togglePassword");

    toggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const inputBox = button.closest(".input-box, .password-box");
            const passwordInput = inputBox?.querySelector("input");

            if (!passwordInput) {
                return;
            }

            const isHidden = passwordInput.type === "password";

            passwordInput.type = isHidden ? "text" : "password";

            button.classList.toggle("fa-eye", !isHidden);
            button.classList.toggle("fa-eye-slash", isHidden);
        });
    });
}


function setupRegisterForm() {
    const registerForm = document.getElementById("registerForm");

    if (!registerForm) {
        return;
    }

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!fullName || !email || !username || !password || !confirmPassword) {
            alert("Please complete all required fields.");
            return;
        }

        if (!emailPattern.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        if (password.length < 8) {
            alert("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        const submitButton = registerForm.querySelector(
            'button[type="submit"]'
        );

        try {
            setButtonLoading(
                submitButton,
                true,
                "Creating Account...",
                "Create Account"
            );

            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    username,
                    password
                })
            });

            const data = await readResponse(response);

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to create account.");
            }

            alert(data.message || "Registration successful.");
            window.location.href = "login.html";

        } catch (error) {
            console.error("Registration error:", error);

            alert(
                error.message ||
                "Unable to connect to the Flask server."
            );

        } finally {
            setButtonLoading(
                submitButton,
                false,
                "",
                '<i class="fa-solid fa-user-plus"></i> Create Account'
            );
        }
    });
}


function setupLoginForm() {
    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        const submitButton = loginForm.querySelector(
            'button[type="submit"]'
        );

        try {
            setButtonLoading(
                submitButton,
                true,
                "Signing In...",
                "Sign In"
            );

            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await readResponse(response);

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to sign in.");
            }

            localStorage.setItem(
                "loggedInUser",
                JSON.stringify(data.user)
            );

            window.location.href = "dashboard.html";

        } catch (error) {
            console.error("Login error:", error);

            alert(
                error.message ||
                "Unable to connect to the Flask server."
            );

        } finally {
            setButtonLoading(
                submitButton,
                false,
                "",
                '<i class="fa-solid fa-right-to-bracket"></i> Sign In'
            );
        }
    });
}


document.addEventListener("DOMContentLoaded", () => {
    setupPasswordToggles();
    setupRegisterForm();
    setupLoginForm();
});