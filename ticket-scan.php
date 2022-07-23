<?php 
if(isset($_POST['secCode']) && !empty($_POST['secCode'])) {
  $servername = "localhost";
  $username = "root";
  $password = "";
  $dbname = "aaa";

  // Create connection
  $conn = new mysqli($servername, $username, $password, $dbname);

  // Check connection
  if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
  }
  // echo "Connected successfully";
  // echo "<br>";

  // echo "post go";
  $sqlResult = array();
  $code = $_POST['secCode'];
  $sql = "SELECT * FROM aaa_tickets_22 WHERE Sicherheitscode = '".$code."'";
  // echo $sql;
  $result = $conn->query($sql);
  if($result){
    if ($result->num_rows > 0) {
      // output data of each row
      while($row = $result->fetch_assoc()) {
        // echo "Karte_ID: " . $row["Karte_ID"]. " - Name: " . $row["Ticket_Holder_Name"]. " - Karte: " . $row["Karte"]. " - Status: " . $row["Bestellstatus"]. "";
        $sqlResult['Karte_ID'] = $row["Karte_ID"];
        $sqlResult['Karte'] = $row["Karte"];
        $sqlResult['Sicherheitscode'] = $row["Sicherheitscode"];
        $sqlResult['Einchecken'] = $row["Einchecken"];
        $sqlResult['Bestell_ID'] = $row["Bestell_ID"];
        $sqlResult['Bestellstatus'] = $row["Bestellstatus"];
        $sqlResult['Ticket_Holder_Name'] = $row["Ticket_Holder_Name"];
        $sqlResult['Ticket_Holder_Email_Address'] = $row["Ticket_Holder_Email_Address"];
        $sqlResult['Name_des_Käufers'] = $row["Name_des_Käufers"];
        $sqlResult['Kunden_EMailAdresse'] = $row["Kunden_EMailAdresse"];

        if ($row["Einchecken"] == null && $row["Bestellstatus"] == "Abgeschlossen") {
          $sqlUpdate = "UPDATE aaa_tickets_22
          SET Einchecken = NOW() WHERE Sicherheitscode = '".$code."'";

          $conn->query($sqlUpdate);
        }
      }
    } else {
      // echo "0 results";
    }
  }
  echo json_encode($sqlResult);

  // echo "<pre>";
  // print_r($sqlResult);
  // echo "</pre>";




}


?>