const API_URL = "/api";

const form = document.getElementById("patientForm");
const tableBody = document.getElementById("patientTableBody");
const searchInput = document.getElementById("searchPatient");

let patients = [];


function apiFetch(path, options = {}) {
    return fetch(`${API_URL}${path}`, {
        credentials: "include",
        ...options
    });
}


function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value || "-";

    return cell;
}


function renderPatients() {
    const query = searchInput.value.trim().toLowerCase();

    const visiblePatients = patients.filter((patient) => {
        const searchable = `
            ${patient.id}
            ${patient.patient_name}
            ${patient.phone || ""}
            ${patient.disease || ""}
        `.toLowerCase();

        return searchable.includes(query);
    });

    tableBody.innerHTML = "";

    if (visiblePatients.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No patient records found.
                </td>
            </tr>
        `;

        return;
    }

    visiblePatients.forEach((patient) => {
        const row = document.createElement("tr");

        row.appendChild(createCell(patient.id));
        row.appendChild(createCell(patient.patient_name));
        row.appendChild(createCell(patient.age));
        row.appendChild(createCell(patient.gender));
        row.appendChild(createCell(patient.phone));
        row.appendChild(createCell(patient.disease));

        tableBody.appendChild(row);
    });
}


async function loadPatients() {
    try {
        const response = await apiFetch("/patients");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load patients."
            );
        }

        patients = data.patients || [];

        document.getElementById("patientCount").textContent =
            patients.length;

        renderPatients();

    } catch (error) {
        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    ${error.message || "Please sign in again and make sure the server is running."}
                </td>
            </tr>
        `;
    }
}


form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    const patient = {
        patient_name: document.getElementById("patientName").value.trim(),
        age: document.getElementById("age").value,
        gender: document.getElementById("gender").value,
        phone: document.getElementById("phone").value.trim(),
        disease: document.getElementById("disease").value.trim(),
        address: document.getElementById("address").value.trim()
    };

    try {
        submitButton.disabled = true;

        const response = await apiFetch("/add_patient", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(patient)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to save patient."
            );
        }

        form.reset();

        await loadPatients();

        alert(data.message);

    } catch (error) {
        console.error(error);

        alert(
            error.message || "Unable to save patient."
        );

    } finally {
        submitButton.disabled = false;
    }
});


searchInput.addEventListener("input", renderPatients);


document.getElementById("openPatientForm").addEventListener(
    "click",
    () => {
        document.getElementById("patientFormCard").scrollIntoView({
            behavior: "smooth"
        });

        document.getElementById("patientName").focus();
    }
);


document.getElementById("logoutBtn").addEventListener("click", () => {
    apiFetch("/logout", {
        method: "POST"
    }).catch(() => {});

    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("latestBill");
});


loadPatients();