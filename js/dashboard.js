const API_URL = "/api";

const recentPatientsBody = document.getElementById("recentPatients");
const recentBillsBody = document.getElementById("recentBills");


function apiFetch(path, options = {}) {
    return fetch(`${API_URL}${path}`, {
        credentials: "include",
        ...options
    });
}


function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}


function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value || "-";

    return cell;
}


function showEmptyRow(tableBody, columnCount, message) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="${columnCount}" class="empty-state">
                ${message}
            </td>
        </tr>
    `;
}


function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
        return "Good morning";
    }

    if (hour >= 12 && hour < 17) {
        return "Good afternoon";
    }

    return "Good evening";
}


function loadLoggedInUser() {
    const userData = localStorage.getItem("loggedInUser");

    if (!userData) {
        window.location.replace("login.html");
        return null;
    }

    try {
        const user = JSON.parse(userData);

        const fullName = user.fullName || user.username || "User";
        const firstName = fullName.split(" ")[0];

        document.getElementById("welcomeMessage").textContent =
            `Welcome back, ${firstName}`;

        document.getElementById("profileName").textContent = fullName;

        document.getElementById("greeting").textContent =
            `${getGreeting()}, ${firstName}`;

        return user;

    } catch (error) {
        console.error("Invalid login data.", error);

        localStorage.removeItem("loggedInUser");

        window.location.replace("login.html");

        return null;
    }
}


function renderRecentPatients(patients) {
    recentPatientsBody.innerHTML = "";

    if (!patients || patients.length === 0) {
        showEmptyRow(
            recentPatientsBody,
            3,
            "No patients have been added yet."
        );

        return;
    }

    patients.forEach((patient) => {
        const row = document.createElement("tr");

        row.appendChild(createCell(patient.patient_name));
        row.appendChild(createCell(patient.age));
        row.appendChild(createCell(patient.disease || "Not specified"));

        recentPatientsBody.appendChild(row);
    });
}


function renderRecentBills(bills) {
    recentBillsBody.innerHTML = "";

    if (!bills || bills.length === 0) {
        showEmptyRow(
            recentBillsBody,
            4,
            "No billing records have been created yet."
        );

        return;
    }

    bills.forEach((bill) => {
        const row = document.createElement("tr");

        row.appendChild(createCell(bill.bill_number));
        row.appendChild(createCell(bill.patient_name));
        row.appendChild(createCell(
            formatCurrency(bill.total_amount)
        ));
        row.appendChild(createCell(
            bill.payment_method || "Paid"
        ));

        recentBillsBody.appendChild(row);
    });
}


async function loadDashboardData() {
    try {
        const response = await apiFetch("/dashboard");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load dashboard data."
            );
        }

        document.getElementById("totalPatients").textContent =
            data.total_patients || 0;

        document.getElementById("totalBills").textContent =
            data.total_bills || 0;

        document.getElementById("totalRevenue").textContent =
            formatCurrency(data.total_revenue);

        document.getElementById("pendingBills").textContent =
            data.pending_bills || 0;

        renderRecentPatients(data.recent_patients);
        renderRecentBills(data.recent_bills);

    } catch (error) {
        console.error(error);

        showEmptyRow(
            recentPatientsBody,
            3,
            "Unable to load recent patients. Please login again."
        );

        showEmptyRow(
            recentBillsBody,
            4,
            "Unable to load recent bills. Please login again."
        );
    }
}


function setupLogout() {
    const logoutButton = document.getElementById("logoutBtn");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", () => {
        apiFetch("/logout", {
            method: "POST"
        }).catch(() => {});

        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("latestBill");
    });
}


document.addEventListener("DOMContentLoaded", () => {
    const user = loadLoggedInUser();

    if (!user) {
        return;
    }

    setupLogout();
    loadDashboardData();
});