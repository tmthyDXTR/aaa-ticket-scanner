console.log("main.js loaded");

const scanbox = document.getElementById("scan-box");
if (scanbox) {
    scanbox.value = "";
    scanbox.focus();
}
const statusMsg = document.getElementById("status-msg");
if (statusMsg) {
    statusMsg.innerHTML = "NOT READY (window must be active)";
    document.getElementById("status-btn").classList.remove("btn-primary");
    document.getElementById("status-btn").classList.add("btn-warning");
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

var isOnFocus = true;  
window.onblur = function(){  
    isOnFocus = false;  
    statusMsg.innerHTML = "NOT READY (window must be active)";
    document.getElementById("status-btn").classList.remove("btn-primary");
    document.getElementById("status-btn").classList.add("btn-warning");

    statusSpinner.style.display = "none";
}  
window.onfocus = function(){  
    isOnFocus = true;  
    statusMsg.innerHTML = "READY";
    document.getElementById("status-btn").classList.add("btn-primary");
    document.getElementById("status-btn").classList.remove("btn-warning");

    statusSpinner.style.display = "none";
}


var isScanning = false;
var scanResult = "";
var cnt = 0;

var scanHistory;
if (localStorage.getItem('scanHistory') === null) {
    scanHistory = [];
}
else {
    scanHistory = JSON.parse(localStorage.getItem('scanHistory'));
}
var scanHistArr;
if (localStorage.getItem('scanHistoryInfo') === null) {
    scanHistArr = [];
}
else {
    scanHistArr = JSON.parse(localStorage.getItem('scanHistoryInfo'));
    for (var i = 0; i <= 4; i++) {
        // UPDATE HISTORY TABLE
        var table = document.getElementById("history-table");

        // Create an empty <tr> element and add it to the 1st position of the table:
        var row = table.insertRow(1);

        // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);

        // Add some text to the new cells:
        cell1.innerHTML = scanHistArr[i][0];
        cell2.innerHTML = scanHistArr[i][1];
        cell3.innerHTML = scanHistArr[i][2];
        cell4.innerHTML = scanHistArr[i][3];
    }
}


document.onkeypress = function(evt) {
    if (document.getElementById("guest-list-btn").classList.contains("collapsed")) {
        isScanning = true;
        statusSpinner.style.display = "block";
        resultBox.style.visibility = "hidden";
        evt = evt || window.event;
        evt.preventDefault();
        var charCode = evt.keyCode || evt.which;
        // console.log(charCode);
        var charStr = String.fromCharCode(charCode);
        // console.log(charStr);
        if (isScanning && charCode !== 13) {
            console.log("is Scanning");
            statusMsg.innerHTML = "SCANNING " + cnt++;
            scanResult += charStr;
        } 
        if (charCode === 13) {
            isScanning = false;
            console.log("scan complete");
            console.log("scan result: " + scanResult);
            // QR Code string clean up
            var strSplit = scanResult.split("&");
            var secCode = strSplit[3].split("=")[1];
            console.log("scanned security code: " + secCode);
            // CHECK SECURITY CODE
            checkCode(secCode);
            scanResult = "";
            cnt = 0;
        }
    }
    

};


var scanHistoryInfo = "No info";
var typeInfo = "-"

function checkCode(code) {
    if (code.length != 10) {
        return;
    }
    scanbox.value = code;
    document.getElementById("status-btn").classList.add("btn-primary");
    document.getElementById("status-btn").classList.remove("btn-warning");

    scanResult = "";
    cnt = 0;
    

    var response = $.ajax(
        {
            type: "POST",
            url: "ticket-scan.php",
            data: {secCode: code},
            async: false,
        })
        .done(function(response) {
            resultBox.classList.remove("btn-warning");
            resultBox.classList.add("btn-success");
            var data = JSON.parse(response);
            
            console.log(data);
            if (data.length == 0) {
                resultBox.classList.add("btn-warning");
                resultBox.classList.remove("btn-success");
                resultBox.innerHTML = "NOT FOUND";
            }
            // RESPONSE CASES; PAYMENT CLOSED? ALREADY SCANNED?
            else if (data['Einchecken'] == null && data['Bestellstatus'] == "Abgeschlossen") {
                resultBox.innerHTML = '<b>CHECK IN SUCCESS</b><br><br>'
                                    + data['Sicherheitscode'] + '<br><b>'
                                    + data['Karte'].toUpperCase() + '</b><br>'
                                    + data['Name_des_Käufers'].toUpperCase();   
                scanHistoryInfo = "CHECK IN";
            }
            else if (data['Einchecken'] != null) {
                resultBox.classList.add("btn-warning");
                resultBox.classList.remove("btn-success");
                resultBox.innerHTML = '<b>ALREADY CHECKED IN</b><br><br>'
                                    + data['Sicherheitscode'] + '<br>'
                                    + data['Karte'].toUpperCase() + '<br>'
                                    + data['Name_des_Käufers'].toUpperCase() + '<br><b>'
                                    + data['Einchecken'];
                scanHistoryInfo = "ALREADY CHECKED";
            }
            else {
                resultBox.classList.add("btn-warning");
                resultBox.classList.remove("btn-success");
                resultBox.innerHTML = '<b>NO CHECK IN <br><br></b>'
                + data['Sicherheitscode'] + '<br>'
                + data['Karte'].toUpperCase() + '<br>'
                + data['Name_des_Käufers'].toUpperCase() + '</b><br>'
                + 'Zahlung: ' +data['Bestellstatus'].toUpperCase() + '</b><br>'
                + data['Karte_ID'].toUpperCase();   
                scanHistoryInfo = "NO CHECK IN";
            }
            typeInfo = data['Karte'];
        })
        .fail(function(xhr, status, error){
            var errorMessage = xhr.status + ': ' + xhr.statusText
            resultBox.classList.add("btn-warning");
            resultBox.classList.remove("btn-success");
            resultBox.innerHTML = "Error: " + errorMessage;
            scanHistoryInfo = "ERROR";
        })
        .always(function() {
            resultBox.style.visibility = "visible";
            statusMsg.innerHTML = "READY";
            statusSpinner.style.display = "none";
        });

    // SCAN HISTORY
    scanHistory.includes(code) ? console.log("already scanned") : scanHistory.push(code);
    localStorage.setItem("scanHistory", JSON.stringify(scanHistory));
    
    var timeElapsed = Date.now();
    var today = new Date(timeElapsed);
    today.toUTCString();
    var d = today.toString();
    var c = d.split(" ");
    console.log(c);
    var goodTime = c[2] + " " + c[1] + " " + c[4];
    var histEntry = [goodTime, typeInfo, code, scanHistoryInfo];
    scanHistArr.push(histEntry);
    localStorage.setItem("scanHistoryInfo", JSON.stringify(scanHistArr));
    console.log("scan history: " +scanHistory);
    console.log("scan info length :" + scanHistArr.length);
    // UPDATE HISTORY TABLE
    var table = document.getElementById("history-table");
    
    // Create an empty <tr> element and add it to the 1st position of the table:
    var row = table.insertRow(1);

    // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);

    // Add some text to the new cells:
    cell1.innerHTML = histEntry[0];
    cell2.innerHTML = histEntry[1];
    cell3.innerHTML = histEntry[2];
    cell4.innerHTML = histEntry[3];

    if (table.rows.length > 6) {
        table.deleteRow(6);
    }
}



function loadGuestList() {
    var btn = document.getElementById("guest-list-btn");
    if (btn.classList.contains("collapsed")) return;
    console.log("Load guest list");
    var table = document.getElementById("guest-list-table");
    table.innerHTML = `<thead>
    <tr>
        <th scope="col">NAME</th>
        <th scope="col">BAND/COMP</th>
        <th scope="col">TYPE</th>
        <th scope="col">CHECKED IN</th>
    </tr>
    </thead>
    <tbody>
    
    </tbody>`;

    var response = $.ajax(
        {
            type: "POST",
            url: "get-guest-list.php",
            data: {get: "get"},
            async: false,
        })
        .done(function(response) {
            var data = JSON.parse(response);
            // UPDATE GUEST LIST TABLE
            table = document.getElementById("guest-list-table");
            
            for (var i = 0; i <= data.length - 1; i++) {        
                // Create an empty <tr> element and add it to the 1st position of the table:
                var row = table.insertRow(1);
        
                // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                var cell4 = row.insertCell(3);
        
                // Add some text to the new cells:
                cell1.innerHTML = data[i]['guest_list_name'];
                cell2.innerHTML = data[i]['guest_list_band'];
                cell3.innerHTML = data[i]['guest_list_type'];
                // Check in box
                if (data[i]['guest_list_checkedin'] === "0") {
                    cell4.innerHTML = `<center><input onclick='checkGuestList(`+data[i]['guest_list_id']+`)' class="form-check-input" type="checkbox" value="" id="flexCheckDefault"></input></center>`;
                }
                else {
                    cell4.innerHTML = `<center><input onclick='checkGuestList(`+data[i]['guest_list_id']+`)' class="form-check-input" type="checkbox" checked value="" id="flexCheckDefault"></input></center>`;
                }
            }
            console.log(data);
            console.log("got guest list");
        })
        .fail(function(xhr, status, error){

        })
        .always(function() {

        });
}

function searchGuest() {
    var input = document.getElementById("suche-input");
    var filter = input.value.toUpperCase();
    var table = document.getElementById("guest-list-table");
    var tr = table.getElementsByTagName("tr");
    for (i = 1; i < tr.length; i++) {
        td = tr[i].getElementsByTagName("td")[0]; // for column one
         td1 = tr[i].getElementsByTagName("td")[1]; // for column two
    /* ADD columns here that you want you to filter to be used on */
        if (td) {
          if ( (td.innerHTML.toUpperCase().indexOf(filter) > -1) || (td1.innerHTML.toUpperCase().indexOf(filter) > -1) )  {            
            tr[i].style.display = "";
          } else {
            tr[i].style.display = "none";
          }
        }
      }

}

function checkGuestList(id) {
    console.log("check guest list id: " + id);
    var response = $.ajax(
        {
            type: "POST",
            url: "check-guest-list.php",
            data: {id: id},
            async: false,
        })
        .done(function(response) {
            
        })
        .fail(function(xhr, status, error){

        })
        .always(function() {

        });
}