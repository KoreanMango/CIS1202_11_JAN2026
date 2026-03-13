var trafficSystem = {
  northSouth: {
    phase: "RED",
    redEl: null,
    yellowEl: null,
    greenEl: null,
    textEl: null
  },
  eastWest: {
    phase: "GREEN",
    redEl: null,
    yellowEl: null,
    greenEl: null,
    textEl: null
  },
  durations: {
    green: 6000,
    yellow: 3000
  },
  isRunning: false,
  stopRequested: false,
  cycleCounter: 0,
  logListEl: null,
  systemStateEl: null
};

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function getTimestamp() {
  return new Date().toLocaleTimeString();
}

function addLog(message) {
  var entry = document.createElement("li");
  entry.innerText = "[" + getTimestamp() + "] " + message;
  trafficSystem.logListEl.insertBefore(entry, trafficSystem.logListEl.firstChild);
}

function clearActiveLights(directionObj) {
  directionObj.redEl.className = "light red";
  directionObj.yellowEl.className = "light yellow";
  directionObj.greenEl.className = "light green";
}

function applyPhase(directionObj, phase) {
  directionObj.phase = phase;
  clearActiveLights(directionObj);

  if (phase === "RED") {
    directionObj.redEl.className = "light red active";
  }

  if (phase === "YELLOW") {
    directionObj.yellowEl.className = "light yellow active";
  }

  if (phase === "GREEN") {
    directionObj.greenEl.className = "light green active";
  }

  directionObj.textEl.innerText = "Current: " + phase;
}

function updateSystemPill(text) {
  trafficSystem.systemStateEl.innerText = text;
}

function setIntersectionState(nsPhase, ewPhase) {
  applyPhase(trafficSystem.northSouth, nsPhase);
  applyPhase(trafficSystem.eastWest, ewPhase);

  addLog("North-South " + nsPhase + " | East-West " + ewPhase);
}

async function runDirectionCycle(activeDirection, waitingDirection, name) {
  setIntersectionState(
    activeDirection === trafficSystem.northSouth ? "GREEN" : "RED",
    activeDirection === trafficSystem.eastWest ? "GREEN" : "RED"
  );

  addLog(name + " active: GREEN phase");
  await sleep(trafficSystem.durations.green);

  if (trafficSystem.stopRequested) {
    return;
  }

  setIntersectionState(
    activeDirection === trafficSystem.northSouth ? "YELLOW" : "RED",
    activeDirection === trafficSystem.eastWest ? "YELLOW" : "RED"
  );

  addLog(name + " transition: YELLOW for 3s");
  await sleep(trafficSystem.durations.yellow);

  if (trafficSystem.stopRequested) {
    return;
  }

  setIntersectionState(
    activeDirection === trafficSystem.northSouth ? "RED" : "RED",
    activeDirection === trafficSystem.eastWest ? "RED" : "RED"
  );

  addLog(name + " transition complete: RED");

  if (waitingDirection.phase !== "RED") {
    applyPhase(waitingDirection, "RED");
  }
}

async function runTrafficLoop() {
  while (trafficSystem.isRunning && !trafficSystem.stopRequested) {
    trafficSystem.cycleCounter += 1;
    updateSystemPill("Running • Cycle " + trafficSystem.cycleCounter);

    await runDirectionCycle(
      trafficSystem.northSouth,
      trafficSystem.eastWest,
      "North-South"
    );

    if (trafficSystem.stopRequested) {
      break;
    }

    await runDirectionCycle(
      trafficSystem.eastWest,
      trafficSystem.northSouth,
      "East-West"
    );
  }

  trafficSystem.isRunning = false;
  trafficSystem.stopRequested = false;
  updateSystemPill("Stopped");
  addLog("System stopped.");
}

function startSystem() {
  if (trafficSystem.isRunning) {
    addLog("Start ignored: system already running.");
    return;
  }

  trafficSystem.isRunning = true;
  trafficSystem.stopRequested = false;
  addLog("System started.");
  runTrafficLoop();
}

function stopSystem() {
  if (!trafficSystem.isRunning) {
    addLog("Stop ignored: system already stopped.");
    return;
  }

  trafficSystem.stopRequested = true;
  updateSystemPill("Stopping...");
  addLog("Stop requested. Waiting for current phase to finish.");
}

function bindDomReferences() {
  trafficSystem.northSouth.redEl = document.getElementById("nsRed");
  trafficSystem.northSouth.yellowEl = document.getElementById("nsYellow");
  trafficSystem.northSouth.greenEl = document.getElementById("nsGreen");
  trafficSystem.northSouth.textEl = document.getElementById("nsPhaseText");

  trafficSystem.eastWest.redEl = document.getElementById("ewRed");
  trafficSystem.eastWest.yellowEl = document.getElementById("ewYellow");
  trafficSystem.eastWest.greenEl = document.getElementById("ewGreen");
  trafficSystem.eastWest.textEl = document.getElementById("ewPhaseText");

  trafficSystem.logListEl = document.getElementById("logList");
  trafficSystem.systemStateEl = document.getElementById("systemStatePill");

  document.getElementById("startBtn").onclick = startSystem;
  document.getElementById("stopBtn").onclick = stopSystem;
}

function initializeSystem() {
  bindDomReferences();
  setIntersectionState("RED", "GREEN");
  updateSystemPill("Ready");
  addLog("Initialized with East-West GREEN.");
}

document.addEventListener("DOMContentLoaded", initializeSystem);
