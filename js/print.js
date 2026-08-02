const storedBill = localStorage.getItem("latestBill");

const bill = storedBill
    ? JSON.parse(storedBill)
    : null;

const billItemsBody = document.getElementById("billItems");
const printButton = document.getElementById("printButton");


function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(Number(value) || 0);
}


function formatDate(value) {
    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) {
        return new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}


function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;

    return cell;
}


function showEmptyItems(message) {
    billItemsBody.innerHTML = `
        <tr>
            <td colspan="5" class="empty-state">
                ${message}
            </td>
        </tr>
    `;
}


function loadInvoice() {
    if (!bill || !Array.isArray(bill.items)) {
        alert(
            "No invoice is available. Please create or open a bill first."
        );

        window.location.replace("History.html");
        return;
    }

    const subtotal = Number(bill.subtotal) || 0;
    const gstPercentage = Number(bill.gst) || 0;
    const totalAmount = Number(bill.total_amount) || 0;
    const gstAmount = totalAmount - subtotal;

    document.getElementById("date").textContent =
        formatDate(bill.created_at);

    document.getElementById("billNumber").textContent =
        bill.bill_number || "-";

    document.getElementById("patient").textContent =
        bill.patient_name || "-";

    document.getElementById("payment").textContent =
        bill.payment_method || "-";

    document.getElementById("gst").textContent =
        gstPercentage.toFixed(2);

    document.getElementById("gst2").textContent =
        gstPercentage.toFixed(2);

    document.getElementById("subtotal").textContent =
        subtotal.toFixed(2);

    document.getElementById("gstAmount").textContent =
        formatCurrency(gstAmount);

    document.getElementById("total").textContent =
        totalAmount.toFixed(2);

    billItemsBody.innerHTML = "";

    if (bill.items.length === 0) {
        showEmptyItems("No items found for this bill.");
        return;
    }

    bill.items.forEach((item) => {
        const row = document.createElement("tr");

        row.appendChild(createCell(item.item_name || "-"));
        row.appendChild(createCell(item.item_type || "-"));
        row.appendChild(createCell(item.quantity || 0));
        row.appendChild(createCell(
            formatCurrency(item.unit_price)
        ));
        row.appendChild(createCell(
            formatCurrency(item.amount)
        ));

        billItemsBody.appendChild(row);
    });
}


printButton.addEventListener("click", () => {
    window.print();
});


loadInvoice();