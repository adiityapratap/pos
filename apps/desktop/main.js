const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "BIZPOS - Point of Sale",
    icon: path.join(__dirname, "icon.png"), // Add your icon file
    backgroundColor: "#0f172a",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: process.env.NODE_ENV !== "production",
    },
  });

  // Load the app
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  
  if (isDev) {
    win.loadURL(frontendUrl) // Vite dev server - POS Terminal on port 5173
      .catch((err) => {
        console.error("Failed to load URL:", err);
        console.log(`Make sure the POS Terminal dev server is running on ${frontendUrl}`);
        console.log("Run: pnpm dev:pos (or cd apps/pos-terminal && npm run dev)");
        console.log("You can set a custom URL with: FRONTEND_URL=http://localhost:PORT npm run electron");
      });
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
  }

  // Handle window events
  win.on("closed", () => {
    app.quit();
  });
}

// App lifecycle
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

