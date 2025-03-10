let socket; // Define socket globally but don't initialize it immediately
let pingInterval;

const initWebSocket = () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log("WebSocket is already open.");
    return;
  }

  socket = new WebSocket("wss://192.168.88.45:8080");

  socket.addEventListener("open", async () => {
    console.log("WebSocket connection established.");
    socket.send(JSON.stringify({ message: "konektovan sam" }));

    const role = sessionStorage.getItem("userRole");
    console.log("Role: 15 " + role);
    const accessPing = await canRoleAccessPing(role);
    console.log("access 17 ",  accessPing);


    if (accessPing) {
      if (accessPing) {
        // Start sending ping messages at regular intervals
        pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
          const message = { type: "ping", role: role, timestamp: new Date().toISOString() };
          socket.send(JSON.stringify(message) , 'mihailo');
          console.log("Message sent to the server:", message);
        }
      }, 5000);
    }
  }
});

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "pong") {
      console.log("Received message from server:", data);
      document.getElementById("response").innerHTML = `<p>Received from server: ${JSON.stringify(data)}</p>`;
    } else {
      console.log("Other message from server:", data);
    }
  });

  socket.addEventListener("close", (event) => {
    console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
  });

  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });
};

const closeSocket = () => {
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    console.log("Closing WebSocket...");
    socket.close(1000, "User logged out");
    clearInterval(pingInterval);
  } else {
    console.log("WebSocket is already closed.");
  }
};

const login = async (username, password) => {
  try {
    const response = await fetch(`https://192.168.88.45:8080/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Username: username, Password: password })
    });

    if(response.ok){
      const data = await response.json();
      console.log("Login successful ", data);
      return data;
    } else {
      const data = await response.text();
      console.log("Login failed:", data);
      return null;
    }
  } catch (error) {
    console.error("Error during login:", error);
    return null;
}
};

const canRoleAccessPing = async (role) => {
  try {
    const response = await fetch(`https://192.168.88.45:8080/access/${role}/ping`);

    if (response.ok) {
      const data = await response.json();
      return data.allowed; 
    } else {
      console.warn(`Access check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("Error in access check:", error);
    return { allowed: false }; 
  }
}

$("#loginBtn").on('click', async () => {
  const username = $("#username").val();
  const password = $("#password").val();

  if(username && password){

    const data = await login(username, password);
    
    if(data != null){
      console.log("data: ", data);
      $("#loginMessage").text(`${data.message}, ${data.user.role}`);
      sessionStorage.setItem("userRole", data.user.role);
      updateUIBasedOnRole(data.user.role);
      initWebSocket();
    } else {
      $("#loginMessage").text(`Pogresno uneseni podaci`);
    }
  }
});

const updateUIBasedOnRole = (role) => {
  if(role === "admin"){
    showAdminPanel();
  } else if(role === "worker"){
    showWorkerPanel();
  }
}

const showAdminPanel = () => {
  $("#adminPanel").show();
  $("#loginPanel").hide();
};

const showWorkerPanel = () => {
  $("#workerPanel").show();
  $("#loginPanel").hide();
}

$(".logoutBtn").off().on('click', () => {
  $("#workerPanel").hide();
  $("#adminPanel").hide();
  $("#loginPanel").show();
  sessionStorage.removeItem("userRole");
  closeSocket();
});

$(document).ready(() => {
  console.log(sessionStorage.getItem("userRole"))
  if(!sessionStorage.getItem("userRole")){
    $("#loginPanel").show();
  } else {
    $("#loginPanel").hide();
    updateUIBasedOnRole(sessionStorage.getItem("userRole"));
    initWebSocket();
  }
});