// main.js

console.log("main.js loaded");

// Initialize and reset input fields and UI elements
document.addEventListener("DOMContentLoaded", () => {
    const scanbox = document.getElementById("scan-box");
    if (scanbox) {
        scanbox.value = "";
        scanbox.focus();
    }

    const statusMsg = document.getElementById("status-msg");
    if (statusMsg) {
        updateStatus("NOT READY (window must be active)", "btn-warning");
    }

    const resultBox = document.getElementById("result-box");
    if (resultBox) {
        resultBox.innerHTML = "RESULT";
        resultBox.style.visibility = "hidden";
    }

    const statusSpinner = document.getElementById("status-spinner");
    if (statusSpinner) {
        statusSpinner.style.display = "none";
    }

    loadHistoryTable();
});

// Track focus state to ensure proper functionality
var isOnFocus = true;
window.onblur = () => {
    isOnFocus = false;
    updateStatus("NOT READY (window must be active)", "btn-warning");
};

window.onfocus = () => {
    isOnFocus = true;
    updateStatus("READY", "btn-primary");
};

// Helper function to update status message and button style
function updateStatus(message, buttonClass) {
    const statusMsg = document.getElementById("status-msg");
    const statusBtn = document.getElementById("status-btn");

    if (statusMsg) statusMsg.innerHTML = message;
    if (statusBtn) {
        statusBtn.classList.remove("btn-primary", "btn-warning");
        statusBtn.classList.add(buttonClass);
    }
    const statusSpinner = document.getElementById("status-spinner");
    if (statusSpinner) statusSpinner.style.display = "none";
}

// Scanning logic and handling
var isScanning = false;
var scanResult = "";
var scanHistory = JSON.parse(localStorage.getItem('scanHistory')) || [];
var scanHistArr = JSON.parse(localStorage.getItem('scanHistoryInfo')) || [];

// Keypress event for scanning
document.onkeypress = (evt) => {
    const isCollapsed = document.getElementById("guest-list-btn").classList.contains("collapsed");
    if (isCollapsed) {
        startScanning(evt);
    }
};

function startScanning(evt) {
    isScanning = true;
    const statusSpinner = document.getElementById("status-spinner");
    const resultBox = document.getElementById("result-box");
    const statusMsg = document.getElementById("status-msg");

    if (statusSpinner) statusSpinner.style.display = "block";
    if (resultBox) resultBox.style.visibility = "hidden";
    if (statusMsg) statusMsg.innerHTML = `SCANNING ${scanResult.length}`;

    evt.preventDefault();
    const charCode = evt.keyCode || evt.which;

    if (isScanning && charCode !== 13) {
        scanResult += String.fromCharCode(charCode);
    } else if (charCode === 13) {
        finalizeScan();
    }
}

function finalizeScan() {
    isScanning = false;
    const securityCode = extractSecurityCode(scanResult);
    if (securityCode) {
        checkCode(securityCode);
    }
    scanResult = "";
}

// Extract security code from the scanned result
function extractSecurityCode(result) {
    const parts = result.split("&");
    if (parts.length > 3) {
        return parts[3].split("=")[1];
    }
    return null;
}

// Validate and process scanned code
function checkCode(code) {
    if (code.length !== 10) return;

    const scanbox = document.getElementById("scan-box");
    const resultBox = document.getElementById("result-box");

    if (scanbox) scanbox.value = code;

    $.ajax({
        type: "POST",
        url: "ticket-scan.php",
        data: { secCode: code },
        success: (response) => processScanResponse(response, code),
        error: handleError,
        complete: () => {
            if (resultBox) resultBox.style.visibility = "visible";
            updateStatus("READY", "btn-primary");
        },
    });
}

// Handle AJAX response for scanning
function processScanResponse(response, code) {
    const resultBox = document.getElementById("result-box");
    const data = JSON.parse(response);

    if (!data.length) {
        showScanResult(resultBox, "NOT FOUND", "btn-warning");
    } else if (!data['Einchecken'] && data['Bestellstatus'] === "Abgeschlossen") {
        showScanResult(resultBox, formatCheckInSuccess(data), "btn-success");
    } else if (data['Einchecken']) {
        showScanResult(resultBox, formatAlreadyCheckedIn(data), "btn-warning");
    } else {
        showScanResult(resultBox, formatNoCheckIn(data), "btn-warning");
    }

    updateHistory(code, data);
}

// Display scan results in the UI
function showScanResult(resultBox, message, buttonClass) {
    if (resultBox) {
        resultBox.classList.remove("btn-warning", "btn-success");
        resultBox.classList.add(buttonClass);
        resultBox.innerHTML = message;
    }
}

// Format messages for different scan outcomes
function formatCheckInSuccess(data) {
    return `<b>CHECK IN SUCCESS</b><br>${data['Sicherheitscode']}<br><b>${data['Karte'].toUpperCase()}</b><br>${data['Name_des_K\u00e4ufers'].toUpperCase()}`;
}

function formatAlreadyCheckedIn(data) {
    return `<b>ALREADY CHECKED IN</b><br>${data['Sicherheitscode']}<br>${data['Karte'].toUpperCase()}<br>${data['Name_des_K\u00e4ufers'].toUpperCase()}<br><b>${data['Einchecken']}</b>`;
}

function formatNoCheckIn(data) {
    return `<b>NO CHECK IN</b><br>${data['Sicherheitscode']}<br>${data['Karte'].toUpperCase()}<br>${data['Name_des_K\u00e4ufers'].toUpperCase()}<br>Zahlung: ${data['Bestellstatus'].toUpperCase()}<br>${data['Karte_ID'].toUpperCase()}`;
}

// Handle AJAX errors
function handleError(xhr) {
    const resultBox = document.getElementById("result-box");
    const errorMessage = `${xhr.status}: ${xhr.statusText}`;
    showScanResult(resultBox, `Error: ${errorMessage}`, "btn-warning");
}

// Update scan history and UI
function updateHistory(code, data) {
    const time = new Date().toUTCString();
    const entry = [time, data['Karte'] || "-", code, scanHistoryInfo];

    scanHistArr.push(entry);
    localStorage.setItem("scanHistoryInfo", JSON.stringify(scanHistArr));

    addHistoryTableRow(entry);

    if (scanHistArr.length > 5) {
        const table = document.getElementById("history-table");
        if (table && table.rows.length > 6) table.deleteRow(6);
    }
}

// Populate history table rows
function loadHistoryTable() {
    const table = document.getElementById("history-table");
    if (!table) return;

    scanHistArr.slice(0, 5).forEach((entry) => addHistoryTableRow(entry));
}

function addHistoryTableRow(entry) {
    const table = document.getElementById("history-table");
    if (!table) return;

    const row = table.insertRow(1);
    entry.forEach((item) => {
        const cell = row.insertCell();
        cell.innerHTML = item;
    });
}
