const API_URL = "/api";

let services = [];
let medicines = [];

const billNumber = document.getElementById("billNumber");
const patientSelect = document.getElementById("patientSelect");
const subtotalInput = document.getElementById("subtotal");
const gstInput = document.getElementById("gst");
const totalAmountInput = document.getElementById("totalAmount");
const paymentMethod = document.getElementById("paymentMethod");

const serviceTableBody = document.querySelector("#serviceTable tbody");
const medicineTableBody = document.querySelector("#medicineTable tbody");

const addServiceButton = document.getElementById("addService");
const addMedicineButton = document.getElementById("addMedicine");
const billingForm = document.getElementById("billingForm");


function apiFetch(path, options = {}) {
    return fetch(`${API_URL}${path}`, {
        credentials: "include",
        ...options
    });
}


function showMessage(message) {
    alert(message);
}


function formatAmount(value) {
    return (Number(value) || 0).toFixed(2);
}


function generateBillNumber() {
    const date = new Date();

    const datePart = date
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

    const randomPart = String(Date.now()).slice(-6);

    billNumber.value = `MB-${datePart}-${randomPart}`;
}


function calculateTotals() {
    let subtotal = 0;

    document.querySelectorAll(".serviceAmount").forEach((input) => {
        subtotal += Number(input.value) || 0;
    });

    document.querySelectorAll(".medicineAmount").forEach((input) => {
        subtotal += Number(input.value) || 0;
    });

    const gstPercentage = Number(gstInput.value) || 0;
    const gstAmount = (subtotal * gstPercentage) / 100;
    const totalAmount = subtotal + gstAmount;

    subtotalInput.value = formatAmount(subtotal);
    totalAmountInput.value = formatAmount(totalAmount);
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

        patientSelect.innerHTML =
            '<option value="">Select patient</option>';

        data.patients.forEach((patient) => {
            const option = document.createElement("option");

            option.value = patient.id;

            option.textContent =
                `${patient.patient_name} (${patient.phone || "No phone"})`;

            patientSelect.appendChild(option);
        });

    } catch (error) {
        console.error(error);

        showMessage(
            "Unable to load patients. Please login again and make sure Flask is running."
        );
    }
}


async function loadServices() {
    try {
        const response = await apiFetch("/services");
        const data = await response.json();

        if (!response.ok) {
            throw new Error("Unable to load services.");
        }

        services = data;

    } catch (error) {
        console.error(error);
        showMessage("Unable to load services.");
    }
}


async function loadMedicines() {
    try {
        const response = await apiFetch("/inventory");
        const data = await response.json();

        if (!response.ok) {
            throw new Error("Unable to load medicine inventory.");
        }

        medicines = data;

    } catch (error) {
        console.error(error);
        showMessage("Unable to load medicine inventory.");
    }
}


function createServiceOptions() {
    let options = '<option value="">Select service</option>';

    services.forEach((service) => {
        options += `
            <option
                value="${service.id}"
                data-name="${service.service_name}"
                data-price="${service.price}">
                ${service.service_name}
            </option>
        `;
    });

    return options;
}


function createMedicineOptions() {
    let options = '<option value="">Select medicine</option>';

    medicines.forEach((medicine) => {
        options += `
            <option
                value="${medicine.id}"
                data-name="${medicine.medicine_name}"
                data-price="${medicine.unit_price}"
                data-stock="${medicine.stock}">
                ${medicine.medicine_name}
            </option>
        `;
    });

    return options;
}


function addServiceRow() {
    if (services.length === 0) {
        showMessage(
            "Services are loading or no services are available."
        );

        return;
    }

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <select class="serviceSelect">
                ${createServiceOptions()}
            </select>
        </td>

        <td>
            <input
                type="number"
                class="serviceQty"
                min="1"
                value="1">
        </td>

        <td>
            <input
                type="number"
                class="servicePrice"
                readonly>
        </td>

        <td>
            <input
                type="number"
                class="serviceAmount"
                readonly>
        </td>

        <td>
            <button
                type="button"
                class="removeServiceBtn">
                <i class="fa-solid fa-trash"></i>
            </button>
        </td>
    `;

    serviceTableBody.appendChild(row);

    const serviceSelect = row.querySelector(".serviceSelect");
    const quantityInput = row.querySelector(".serviceQty");
    const priceInput = row.querySelector(".servicePrice");
    const amountInput = row.querySelector(".serviceAmount");
    const removeButton = row.querySelector(".removeServiceBtn");

    function updateServiceRow() {
        const selectedOption =
            serviceSelect.options[serviceSelect.selectedIndex];

        const price = Number(selectedOption.dataset.price) || 0;

        const quantity = Math.max(
            1,
            Number(quantityInput.value) || 1
        );

        quantityInput.value = quantity;
        priceInput.value = formatAmount(price);
        amountInput.value = formatAmount(price * quantity);

        calculateTotals();
    }

    serviceSelect.addEventListener("change", updateServiceRow);
    quantityInput.addEventListener("input", updateServiceRow);

    removeButton.addEventListener("click", () => {
        row.remove();
        calculateTotals();
    });
}


function addMedicineRow() {
    if (medicines.length === 0) {
        showMessage(
            "Medicines are loading or no medicines are available."
        );

        return;
    }

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>
            <select class="medicineSelect">
                ${createMedicineOptions()}
            </select>
        </td>

        <td>
            <input
                type="text"
                class="availableStock"
                readonly>
        </td>

        <td>
            <input
                type="number"
                class="medicineQty"
                min="1"
                value="1">
        </td>

        <td>
            <input
                type="number"
                class="medicinePrice"
                readonly>
        </td>

        <td>
            <input
                type="number"
                class="medicineAmount"
                readonly>
        </td>

        <td>
            <button
                type="button"
                class="removeMedicineBtn">
                <i class="fa-solid fa-trash"></i>
            </button>
        </td>
    `;

    medicineTableBody.appendChild(row);

    const medicineSelect = row.querySelector(".medicineSelect");
    const stockInput = row.querySelector(".availableStock");
    const quantityInput = row.querySelector(".medicineQty");
    const priceInput = row.querySelector(".medicinePrice");
    const amountInput = row.querySelector(".medicineAmount");
    const removeButton = row.querySelector(".removeMedicineBtn");

    function updateMedicineRow() {
        const selectedOption =
            medicineSelect.options[medicineSelect.selectedIndex];

        const stock = Number(selectedOption.dataset.stock) || 0;
        const price = Number(selectedOption.dataset.price) || 0;

        let quantity = Number(quantityInput.value) || 1;

        if (medicineSelect.value && quantity > stock) {
            showMessage(`Only ${stock} unit(s) are available.`);

            quantity = stock;
            quantityInput.value = stock;
        }

        if (quantity < 1 && medicineSelect.value) {
            quantity = 1;
            quantityInput.value = 1;
        }

        stockInput.value = medicineSelect.value ? stock : "";
        priceInput.value = formatAmount(price);
        amountInput.value = formatAmount(price * quantity);

        calculateTotals();
    }

    medicineSelect.addEventListener("change", updateMedicineRow);
    quantityInput.addEventListener("input", updateMedicineRow);

    removeButton.addEventListener("click", () => {
        row.remove();
        calculateTotals();
    });
}


function collectBillItems() {
    const items = [];

    serviceTableBody.querySelectorAll("tr").forEach((row) => {
        const serviceSelect = row.querySelector(".serviceSelect");

        if (!serviceSelect.value) {
            return;
        }

        const selectedOption =
            serviceSelect.options[serviceSelect.selectedIndex];

        items.push({
            item_name: selectedOption.dataset.name,
            item_type: "Consultation",
            quantity: Number(
                row.querySelector(".serviceQty").value
            ) || 1
        });
    });

    medicineTableBody.querySelectorAll("tr").forEach((row) => {
        const medicineSelect = row.querySelector(".medicineSelect");

        if (!medicineSelect.value) {
            return;
        }

        const selectedOption =
            medicineSelect.options[medicineSelect.selectedIndex];

        items.push({
            item_name: selectedOption.dataset.name,
            item_type: "Medicine",
            quantity: Number(
                row.querySelector(".medicineQty").value
            ) || 1
        });
    });

    return items;
}


async function generateBill(event) {
    event.preventDefault();

    const items = collectBillItems();

    if (!patientSelect.value) {
        showMessage("Please select a patient.");
        return;
    }

    if (items.length === 0) {
        showMessage("Please add at least one service or medicine.");
        return;
    }

    const billData = {
        bill_number: billNumber.value,
        patient_id: Number(patientSelect.value),
        gst: Number(gstInput.value) || 0,
        payment_method: paymentMethod.value,
        items: items
    };

    const submitButton = billingForm.querySelector(
        'button[type="submit"]'
    );

    try {
        submitButton.disabled = true;

        submitButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';

        const response = await apiFetch("/generate_bill", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(billData)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Unable to generate bill."
            );
        }

        const billResponse = await apiFetch(
            `/bill/${encodeURIComponent(result.bill_number)}`
        );

        const savedBill = await billResponse.json();

        if (!billResponse.ok) {
            throw new Error("Bill was created but invoice could not be opened.");
        }

        localStorage.setItem(
            "latestBill",
            JSON.stringify(savedBill)
        );

        window.location.href = "print.html";

    } catch (error) {
        console.error(error);

        showMessage(
            error.message || "Failed to generate the bill."
        );

    } finally {
        submitButton.disabled = false;

        submitButton.innerHTML =
            '<i class="fa-solid fa-file-circle-plus"></i> Generate Bill';
    }
}


function resetBillForm() {
    setTimeout(() => {
        serviceTableBody.innerHTML = "";
        medicineTableBody.innerHTML = "";

        generateBillNumber();

        subtotalInput.value = "0.00";
        totalAmountInput.value = "0.00";
        gstInput.value = "18";
    }, 0);
}


function loadLoggedInUser() {
    const userData = localStorage.getItem("loggedInUser");

    if (!userData) {
        window.location.href = "login.html";
        return;
    }

    try {
        const user = JSON.parse(userData);

        const name =
            user.fullName || user.username || "Receptionist";

        document.getElementById("receptionistName").textContent = name;

    } catch {
        localStorage.removeItem("loggedInUser");
        window.location.href = "login.html";
    }
}


addServiceButton.addEventListener("click", addServiceRow);
addMedicineButton.addEventListener("click", addMedicineRow);

gstInput.addEventListener("input", calculateTotals);

billingForm.addEventListener("submit", generateBill);
billingForm.addEventListener("reset", resetBillForm);

generateBillNumber();
calculateTotals();
loadLoggedInUser();

Promise.all([
    loadPatients(),
    loadServices(),
    loadMedicines()
]);