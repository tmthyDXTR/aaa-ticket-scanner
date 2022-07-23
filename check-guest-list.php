<?php 
if(isset($_POST['id']) && !empty($_POST['id'])) {
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
  $id = $_POST['id'];
  $sql = "SELECT * FROM guest_list_22 WHERE guest_list_id = '".$id."'";
  // echo $sql;
  $result = $conn->query($sql);
  if($result){
    if ($result->num_rows > 0) {
      // output data of each row
      while($row = $result->fetch_assoc()) {
        if ($row["guest_list_checkedin"] == 0) {
          $sqlUpdate = "UPDATE guest_list_22
          SET guest_list_checkedin = 1 WHERE guest_list_id = '".$id."'";
        }
        else {
            $sqlUpdate = "UPDATE guest_list_22
            SET guest_list_checkedin = 0 WHERE guest_list_id = '".$id."'";
        }
        $conn->query($sqlUpdate);
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