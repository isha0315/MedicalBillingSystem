/* validation.js */
(function () {
    "use strict";

    const PAYMENT_METHODS = new Set([
        "Cash",
        "UPI",
        "Card",
        "Net Banking"
    ]);

    function value(id) {
        return (document.getElementById(id)?.value || "").trim();
    }

    function addError(errors, message) {
        if (!errors.includes(message)) {
            errors.push(message);
        }
    }

    function showErrors(form, errors) {
        form.querySelector(".validation-errors")?.remove();

        if (errors.length === 0) {
            return true;
        }

        const container = document.createElement("div");
        container.className = "validation-errors";
        container.setAttribute("role", "alert");
        container.tabIndex = -1;

        const title = document.createElement("p");
        title.textContent = "Please correct the following:";
        container.appendChild(title);

        const list = document.createElement("ul");

        errors.forEach((error) => {
            const item = document.createElement("li");
            item.textContent = error;
            list.appendChild(item);
        });

        container.appendChild(list);
        form.prepend(container);
        container.focus();

        return false;
    }

    function validatePatientForm(form) {
        const errors = [];
        const patientName = value("patientName");
        const age = Number(value("age"));
        const gender = value("gender");
        const phone = value("phone");
        const disease = value("disease");
        const address = value("address");

        if (patientName.length < 2 || patientName.length > 100) {
            addError(errors, "Patient name must contain 2 to 100 characters.");
        }

        if (!Number.isInteger(age) || age < 1 || age > 130) {
            addError(errors, "Age must be a whole number from 1 to 130.");
        }

        if (!["Male", "Female", "Other"].includes(gender)) {
            addError(errors, "Please select a valid gender.");
        }

        const phoneDigits = phone.replace(/\D/g, "");

        if (phone && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
            addError(errors, "Phone number must contain 7 to 15 digits.");
        }

        if (disease.length > 100) {
            addError(errors, "Disease details cannot exceed 100 characters.");
        }

        if (address.length > 500) {
            addError(errors, "Address cannot exceed 500 characters.");
        }

        return showErrors(form, errors);
    }

    function validateBillingForm(form) {
        const errors = [];
        const billNumber = value("billNumber");
        const patientId = value("patientSelect");
        const gst = Number(value("gst"));
        const paymentMethod = value("paymentMethod");

        if (!billNumber || billNumber.length > 30) {
            addError(errors, "Enter a bill number with no more than 30 characters.");
        }

        if (!patientId) {
            addError(errors, "Please select a patient.");
        }

        if (!Number.isFinite(gst) || gst < 0 || gst > 100) {
            addError(errors, "GST must be a number from 0 to 100.");
        }

        if (!PAYMENT_METHODS.has(paymentMethod)) {
            addError(errors, "Please select a valid payment method.");
        }

        const selects = [
            ...form.querySelectorAll(".serviceSelect, .medicineSelect")
        ];

        const selectedItems = selects.filter((select) => select.value);

        if (selectedItems.length === 0) {
            addError(errors, "Add at least one service or medicine.");
        }

        selectedItems.forEach((select) => {
            const row = select.closest("tr");
            const quantity = Number(
                row?.querySelector(".serviceQty, .medicineQty")?.value
            );

            if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
                addError(
                    errors,
                    "Every selected item needs a quantity from 1 to 100000."
                );
            }
        });

        return showErrors(form, errors);
    }

    document.addEventListener("submit", (event) => {
        const form = event.target;
        let valid = true;

        if (form?.id === "patientForm") {
            valid = validatePatientForm(form);
        } else if (form?.id === "billingForm") {
            valid = validateBillingForm(form);
        }

        if (!valid) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    }, true);
}());