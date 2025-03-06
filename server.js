const WebSocket = require("ws");
const https = require("https");
const fs = require("fs");
const path = require("path");

const serverOptions = {
  cert: fs.readFileSync("C:\\Users\\jocmi\\Certificate\\fullchain.pem"),
  key: fs.readFileSync("C:\\Users\\jocmi\\Certificate\\cert-key.pem"),
  passphrase: "mihailo",
};

const fetchFile = (req, res, file, contentType) => {
  fs.readFile(path.join(__dirname, file), "utf8", (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Error loading ${file}`);
      return;
    }
    res.writeHead(200, { "Content-Type": `${contentType}` });
    res.end(data);
  });
};

const server = https.createServer(serverOptions, (req, res) => {
  if (req.url === "/") {
    fetchFile(req, res, "index.html", "text/html");
  } 
  else if (req.url === "/script.js") {
    fetchFile(req, res, "script.js", "application/javascript");
  } 
  
  else if (req.url === "/login") {

  } 
  else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    const request = JSON.parse(message);

    if (request.type === "ping" && ws.isAuthenticated) {
      const response = { type: "pong", timestamp: new Date().toISOString() };
      ws.send(JSON.stringify(response));
    }

    if(request.type === "/login") {
        const {username, password} = request;

        const user = users.find((u) => u.username === username && u.password === password);

        if(user) {
            const response = {
                type: "loginResponse",
                success: true
            }
            ws.send(JSON.stringify(response));
            ws.isAuthenticated = true;  // Mark this WebSocket connection as authenticated
        console.log(`User ${username} logged in`);
        } else {
            ws.send(JSON.stringify({ error: "Invalid credentials" }));
        }
    }

    if (request.type === "getUserData" && !ws.isAuthenticated) {
        // If not authenticated, reject the request
        ws.send(JSON.stringify({ error: "User is not authenticated" }));
      }
  });
});

server.listen(8080, () => {
  console.log("WebSocket server running on wss://localhost:8080");
});

const users = [
  { id: 12345, name: "John Doe", age: 30, role: "admin", password: "admin" },
  { id: 67890, name: "Jane Smith", age: 25, role: "worker", password: "worker" },
];
