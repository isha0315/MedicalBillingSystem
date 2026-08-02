const API_URL = "/api";

const tableBody = document.getElementById("billTableBody");
const searchInput = document.getElementById("searchBill");
const billCount = document.getElementById("billCount");

let allBills = [];


function apiFetch(path, options = {}) {
    return fetch(`${API_URL}${path}`, {
        credentials: "include",
        ...options
    });
}


function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(Number(value) || 0);
}


function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value || "-";

    return cell;
}


function showEmptyMessage(message) {
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-state">
                ${message}
            </td>
        </tr>
    `;
}


function renderBills() {
    const searchValue = searchInput.value.trim().toLowerCase();

    const filteredBills = allBills.filter((bill) => {
        const searchableText = `
            ${bill.bill_number || ""}
            ${bill.patient_name || ""}
            ${bill.payment_method || ""}
        `.toLowerCase();

        return searchableText.includes(searchValue);
    });

    tableBody.innerHTML = "";

    billCount.textContent =
        `${filteredBills.length} invoice${
            filteredBills.length === 1 ? "" : "s"
        }`;

    if (filteredBills.length === 0) {
        showEmptyMessage("No billing records found.");
        return;
    }

    filteredBills.forEach((bill) => {
        const row = document.createElement("tr");

        row.appendChild(createCell(bill.bill_number));
        row.appendChild(createCell(bill.patient_name));
        row.appendChild(createCell(
            formatCurrency(bill.total_amount)
        ));
        row.appendChild(createCell(bill.payment_method));
        row.appendChild(createCell(
            formatDate(bill.created_at)
        ));

        const actionCell = document.createElement("td");

        const viewButton = document.createElement("button");

        viewButton.type = "button";
        viewButton.className = "view-btn";

        viewButton.innerHTML = `
            <i class="fa-solid fa-eye"></i>
            View
        `;

        viewButton.addEventListener("click", () => {
            viewBill(bill.bill_number);
        });

        actionCell.appendChild(viewButton);
        row.appendChild(actionCell);

        tableBody.appendChild(row);
    });
}


async function loadBills() {
    try {
        showEmptyMessage("Loading billing history...");

        const response = await apiFetch("/bills");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load billing history."
            );
        }

        allBills = Array.isArray(data) ? data : [];

        renderBills();

    } catch (error) {
        console.error(error);

        billCount.textContent = "";

        showEmptyMessage(
            error.message ||
            "Unable to load billing history. Please login again."
        );
    }
}


async function viewBill(billNumber) {
    try {
        const response = await apiFetch(
            `/bill/${encodeURIComponent(billNumber)}`
        );

        const bill = await response.json();

        if (!response.ok) {
            throw new Error(
                bill.message || "Unable to load invoice."
            );
        }

        localStorage.setItem(
            "latestBill",
            JSON.stringify(bill)
        );

        window.location.href = "print.html";

    } catch (error) {
        console.error(error);

        alert(
            error.message ||
            "Unable to load this invoice."
        );
    }
}


searchInput.addEventListener("input", renderBills);

loadBills();