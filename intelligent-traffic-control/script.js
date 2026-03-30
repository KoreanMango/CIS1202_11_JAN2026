const trafficSystem = {
  northSouth: { phase: "RED", redEl: null, yellowEl: null, greenEl: null, textEl: null },
  eastWest: { phase: "GREEN", redEl: null, yellowEl: null, greenEl: null, textEl: null },
  durations: { green: 3000, yellow: 1500, allRed: 500 },
  mode: "manual",
  timedSettings: { nsGreenSec: 10, ewGreenSec: 7 },
  isRunning: false,
  stopRequested: false,
  cycleCounter: 0,
  logListEl: null,
  systemStateEl: null,
  modeToggleEl: null,
  modeTextEl: null,
  nsDurationInputEl: null,
  ewDurationInputEl: null,
  pedIndicatorEl: null,
  pedHintEl: null,
  isPedestrianQueued: false,
  isPedestrianCrossing: false
};

// Applied modern Arrow Functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getTimestamp = () => new Date().toLocaleTimeString();

function addLog(message) {
  const entry = document.createElement("li");
  // Used Template Literals for cleaner string formatting
  entry.innerText = `[${getTimestamp()}] ${message}`; 
  trafficSystem.logListEl.insertBefore(entry, trafficSystem.logListEl.firstChild);
}

//  Applied classList.toggle (Removed the unnecessary clearActiveLights function!)
function applyPhase(directionObj, phase) {
  directionObj.phase = phase;

  // Utilized the second boolean argument of classList.toggle to drastically simplify the code.
  // If the condition (e.g., phase === "RED") is true, 'active' is added; if false, it is automatically removed.
  directionObj.redEl.classList.toggle("active", phase === "RED");
  directionObj.yellowEl.classList.toggle("active", phase === "YELLOW");
  directionObj.greenEl.classList.toggle("active", phase === "GREEN");

  directionObj.textEl.innerText = `Current: ${phase}`;
}

function updateSystemPill(text) {
  trafficSystem.systemStateEl.innerText = text;
}

function setPedestrianState(state) {
  if (!trafficSystem.pedIndicatorEl || !trafficSystem.pedHintEl) return;

  trafficSystem.pedIndicatorEl.classList.remove("stop", "wait", "walk");

  if (state === "walk") {
    trafficSystem.pedIndicatorEl.classList.add("walk");
    trafficSystem.pedIndicatorEl.innerText = "WALK";
    trafficSystem.pedHintEl.innerText = "You may cross now.";
    return;
  }

  if (state === "wait") {
    trafficSystem.pedIndicatorEl.classList.add("wait");
    trafficSystem.pedIndicatorEl.innerText = "WAIT";
    trafficSystem.pedHintEl.innerText = "Request queued. Please wait for all-red.";
    return;
  }

  trafficSystem.pedIndicatorEl.classList.add("stop");
  trafficSystem.pedIndicatorEl.innerText = "STOP";
  trafficSystem.pedHintEl.innerText = "Please wait. Crossing is closed.";
}

function setIntersectionState(nsPhase, ewPhase) {
  applyPhase(trafficSystem.northSouth, nsPhase);
  applyPhase(trafficSystem.eastWest, ewPhase);
  addLog(`North-South ${nsPhase} | East-West ${ewPhase}`);

  if (!trafficSystem.isPedestrianQueued && !trafficSystem.isPedestrianCrossing) {
    setPedestrianState("stop");
  }
}

function clampDuration(value, fallback) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  return Math.max(3, Math.min(120, Math.round(numeric)));
}

function getGreenDurationMs(isNorthSouthDirection) {
  if (trafficSystem.mode !== "timed") {
    return trafficSystem.durations.green;
  }

  const selectedSec = isNorthSouthDirection
    ? trafficSystem.timedSettings.nsGreenSec
    : trafficSystem.timedSettings.ewGreenSec;
  return selectedSec * 1000;
}

function syncModeUi() {
  const isTimed = trafficSystem.mode === "timed";
  trafficSystem.modeToggleEl.checked = isTimed;
  trafficSystem.modeTextEl.style.opacity = isTimed ? "1" : "0.5";
  trafficSystem.nsDurationInputEl.disabled = !isTimed;
  trafficSystem.ewDurationInputEl.disabled = !isTimed;
}

function setMode(nextMode) {
  trafficSystem.mode = nextMode === "timed" ? "timed" : "manual";
  syncModeUi();

  if (trafficSystem.mode === "timed") {
    addLog(
      `Switched to TIMED mode (N-S ${trafficSystem.timedSettings.nsGreenSec}s | E-W ${trafficSystem.timedSettings.ewGreenSec}s)`
    );
    return;
  }

  addLog("Switched to MANUAL mode.");
}

function updateTimedDuration(direction) {
  if (direction === "ns") {
    const value = clampDuration(trafficSystem.nsDurationInputEl.value, trafficSystem.timedSettings.nsGreenSec);
    trafficSystem.timedSettings.nsGreenSec = value;
    trafficSystem.nsDurationInputEl.value = String(value);
    addLog(`Updated N-S GO time to ${value}s.`);
    return;
  }

  const value = clampDuration(trafficSystem.ewDurationInputEl.value, trafficSystem.timedSettings.ewGreenSec);
  trafficSystem.timedSettings.ewGreenSec = value;
  trafficSystem.ewDurationInputEl.value = String(value);
  addLog(`Updated E-W GO time to ${value}s.`);
}

async function runDirectionCycle(activeDirection, waitingDirection, name) {
  const isNorthSouthDirection = activeDirection === trafficSystem.northSouth;
  const greenDurationMs = getGreenDurationMs(isNorthSouthDirection);

  setIntersectionState(
    isNorthSouthDirection ? "GREEN" : "RED",
    isNorthSouthDirection ? "RED" : "GREEN"
  );
  addLog(`${name} active: GREEN phase (${Math.round(greenDurationMs / 1000)}s)`);
  await sleep(greenDurationMs);

  if (trafficSystem.stopRequested) return;

  setIntersectionState(
    isNorthSouthDirection ? "YELLOW" : "RED",
    isNorthSouthDirection ? "RED" : "YELLOW"
  );
  addLog(`${name} transition: YELLOW for 1.5s`);
  await sleep(trafficSystem.durations.yellow);

  if (trafficSystem.stopRequested) return;

  // Simplified duplicated logic
  setIntersectionState("RED", "RED"); 
  
  addLog("Safety Buffer: ALL-RED for 0.5s");
  await sleep(trafficSystem.durations.allRed);
  
  addLog(`${name} transition complete: RED`);

  if (waitingDirection.phase !== "RED") {
    applyPhase(waitingDirection, "RED");
  }
}

async function runTrafficLoop() {
  while (trafficSystem.isRunning && !trafficSystem.stopRequested) {
    trafficSystem.cycleCounter += 1;
    updateSystemPill(`Running • Cycle ${trafficSystem.cycleCounter}`);

    await runDirectionCycle(trafficSystem.northSouth, trafficSystem.eastWest, "North-South");
    if (trafficSystem.stopRequested) break;
    
    await runDirectionCycle(trafficSystem.eastWest, trafficSystem.northSouth, "East-West");
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

  if (trafficSystem.mode === "timed") {
    addLog(
      `Timed mode started - N-S: ${trafficSystem.timedSettings.nsGreenSec}s | E-W: ${trafficSystem.timedSettings.ewGreenSec}s`
    );
  } else {
    addLog("Manual mode started.");
  }

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

// Manually implemented by student: Clears the status log list
function clearLog() {
  trafficSystem.logListEl.innerHTML = "";
  addLog("Log cleared by user.");
}




// Used querySelector instead of getElementById
function bindDomReferences() {
  trafficSystem.northSouth.redEl = document.querySelector("#nsRed");
  trafficSystem.northSouth.yellowEl = document.querySelector("#nsYellow");
  trafficSystem.northSouth.greenEl = document.querySelector("#nsGreen");
  trafficSystem.northSouth.textEl = document.querySelector("#nsPhaseText");

  trafficSystem.eastWest.redEl = document.querySelector("#ewRed");
  trafficSystem.eastWest.yellowEl = document.querySelector("#ewYellow");
  trafficSystem.eastWest.greenEl = document.querySelector("#ewGreen");
  trafficSystem.eastWest.textEl = document.querySelector("#ewPhaseText");

  trafficSystem.logListEl = document.querySelector("#logList");
  trafficSystem.systemStateEl = document.querySelector("#systemStatePill");
  trafficSystem.modeToggleEl = document.querySelector("#modeToggle");
  trafficSystem.modeTextEl = document.querySelector("#modeText");
  trafficSystem.nsDurationInputEl = document.querySelector("#nsDurationInput");
  trafficSystem.ewDurationInputEl = document.querySelector("#ewDurationInput");
  trafficSystem.pedIndicatorEl = document.querySelector("#pedIndicator");
  trafficSystem.pedHintEl = document.querySelector("#pedHintText");

  // Replaced inline onclick with modern addEventListener
  document.querySelector("#startBtn").addEventListener("click", startSystem);
  document.querySelector("#stopBtn").addEventListener("click", stopSystem);
  document.querySelector("#clearLogBtn").addEventListener("click", clearLog);

  trafficSystem.modeToggleEl.addEventListener("change", (event) => {
    setMode(event.target.checked ? "timed" : "manual");
  });

  trafficSystem.nsDurationInputEl.addEventListener("change", () => updateTimedDuration("ns"));
  trafficSystem.ewDurationInputEl.addEventListener("change", () => updateTimedDuration("ew"));
}

function initializeSystem() {
  bindDomReferences();
  syncModeUi();
  setPedestrianState("stop");
  setIntersectionState("RED", "GREEN");
  updateSystemPill("Ready");
  addLog("Initialized with East-West GREEN.");
}

document.addEventListener("DOMContentLoaded", initializeSystem);


// === Pedestrian Crossing Add-on (Modified) ===
(function() {
    const controlsPanel = document.querySelector('.controls-panel') || document.querySelector('.controls');
    if (!controlsPanel) return;

    const pedButton = document.createElement('button');
    pedButton.id = "pedBtn";
    pedButton.textContent = 'Pedestrian Crossing';
    pedButton.className = "action-btn"; 
    controlsPanel.appendChild(pedButton);

    pedButton.addEventListener('click', () => {
      if (!trafficSystem.isPedestrianQueued) {
        trafficSystem.isPedestrianQueued = true;
            pedButton.disabled = true;
            pedButton.textContent = '⏳ Queued...';
        setPedestrianState("wait");
            
           
            stopSystem(); 
            addLog('Pedestrian requested: System will pause after current cycle.');
        }
    });

    const monitor = setInterval(async () => {
      if (trafficSystem.isPedestrianQueued && trafficSystem.isRunning === false) {
        trafficSystem.isPedestrianQueued = false;
        trafficSystem.isPedestrianCrossing = true;
            pedButton.textContent = '🚶 Crossing...';
        setPedestrianState("walk");

            setIntersectionState("RED", "RED");
            addLog('PEDESTRIAN PHASE: All lights RED for 5 seconds.');

            await new Promise(resolve => setTimeout(resolve, 5000));

            addLog('Pedestrian phase complete. Resuming traffic...');
        trafficSystem.isPedestrianCrossing = false;
        setPedestrianState("stop");
            
            pedButton.disabled = false;
            pedButton.textContent = '🚶 Pedestrian Crossing';
            startSystem();
        }
    }, 500); 
})();