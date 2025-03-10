const WebSocket = require("ws");
const https = require("https");
const fs = require("fs");
const path = require("path");

const serverOptions = {
  cert: fs.readFileSync("C:\\Users\\jocmi\\Certificate\\fullchain.pem"),
  key: fs.readFileSync("C:\\Users\\jocmi\\Certificate\\cert-key.pem"),
  passphrase: "mihailo",
};

const users = [
  { id: 12345, name: "Admin", age: 30, role: "admin", password: "admin" },
  { id: 67890, name: "Worker", age: 25, role: "worker", password: "worker" },
];

const authenticatedUsers = new Map();

const roles = {
  admin: { ping: true },
  worker: { ping: false }
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

const login = (req, res, parsedBody) => {
  console.log("Login in process");
  const { Username, Password } = parsedBody;

  const user = users.find(
    u => u.name === Username && u.password === Password
  );
  console.log(user);

  if (user) {
    authenticatedUsers.set(user, user.role);
    console.log(authenticatedUsers);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Korisnik ulogovan!", user: user }));
    console.log(`User ${user.name} logged in.`);
  } else {
    res.writeHead(401, { "Content-Type": "text/plain" });
    res.end("Korisnik nije pronadjen");
  }
};

const server = https.createServer(serverOptions, (req, res) => {
  if (req.url === "/") {
    fetchFile(req, res, "index.html", "text/html");
  } else if (req.url === "/script.js") {
    fetchFile(req, res, "script.js", "application/javascript");
  } else if (req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        if (!body) {
          throw new Error("empty req body");
        }

        const parsedBody = JSON.parse(body);

        if (req.url === "/login") {
          login(req, res, parsedBody);
        }
      } catch (err) {
        console.log(err);
      }
    });
  } else if(req.method === "GET") {
    if(req.url.startsWith("/access")) {
      const url = req.url.split('/');

      const role = url[2];
      const action = url[3];
      console.log(role, action);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ allowed: roles[role][action] }));

    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Invalid role or action" }));

    }

  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(8080, () => {
  console.log("WebSocket server running on wss://localhost:8080");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.send(JSON.stringify({ message: "You are connected." }));

  ws.on("message", (message) => {
    const request = JSON.parse(message);

    if (request.type === "ping" && request.role === "admin") {
      const response = { type: "pong", timestamp: new Date().toISOString() };
      ws.send(JSON.stringify(response));
    } else if(request.type === "ping" && !request.role === "admin"){
      const response = {type: "pong", message: "access denied"};
      ws.send(JSON.stringify(response));
    }
  });

  ws.on("close", () => {
    console.log("klijent diskonektovan");
  });

  ws.on("error", (error) => {
    console.error("Greska:", error);
  });
});
