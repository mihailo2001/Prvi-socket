const socket = new WebSocket("wss://192.168.88.45:8080");

socket.addEventListener("open", () => {
  console.log("WebSocket connection established.");

  setInterval(() => {
    const message = { type: "ping", timestamp: new Date().toISOString() };
    socket.send(JSON.stringify(message));
    console.log("Message sent to the server:", message);
  }, 5000);
});

socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "loginResponse") {
    const messageElement = document.getElementById("loginMessage");

    if (data.success) {
      messageElement.style.color = "green";
      messageElement.textContent = "Login successful!";
    } else {
      messageElement.style.color = "red";
      messageElement.textContent = "Login failed: " + data.error;
    }
  } else if (data.type === "pong") {
    console.log("Received message from server:", data);
    document.getElementById(
      "response"
    ).innerHTML = `<p>Received from server: ${JSON.stringify(data)}</p>`;
  }
});

$("#loginBtn").on("click", () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Send login request over WebSocket
  const loginRequest = {
    type: "login",
    username: username,
    password: password,
  };
  socket.send(JSON.stringify(loginRequest));
});
