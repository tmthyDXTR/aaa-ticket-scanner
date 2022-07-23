<?php 
if(isset($_POST['get']) && !empty($_POST['get'])) {
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

$sql = "SELECT * FROM guest_list_22";
$result = $conn->query($sql);
echo json_encode(mysqli_fetch_all($result,MYSQLI_ASSOC));
}
?>