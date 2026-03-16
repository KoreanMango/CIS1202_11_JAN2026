const trafficSystem = {
  northSouth: { phase: "RED", redEl: null, yellowEl: null, greenEl: null, textEl: null },
  eastWest: { phase: "GREEN", redEl: null, yellowEl: null, greenEl: null, textEl: null },
  durations: { green: 3000, yellow: 1500 },
  isRunning: false,
  stopRequested: false,
  cycleCounter: 0,
  logListEl: null,
  systemStateEl: null
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

function setIntersectionState(nsPhase, ewPhase) {
  applyPhase(trafficSystem.northSouth, nsPhase);
  applyPhase(trafficSystem.eastWest, ewPhase);
  addLog(`North-South ${nsPhase} | East-West ${ewPhase}`);
}

async function runDirectionCycle(activeDirection, waitingDirection, name) {
  setIntersectionState(
    activeDirection === trafficSystem.northSouth ? "GREEN" : "RED",
    activeDirection === trafficSystem.eastWest ? "GREEN" : "RED"
  );
  addLog(`${name} active: GREEN phase`);
  await sleep(trafficSystem.durations.green);

  if (trafficSystem.stopRequested) return;

  setIntersectionState(
    activeDirection === trafficSystem.northSouth ? "YELLOW" : "RED",
    activeDirection === trafficSystem.eastWest ? "YELLOW" : "RED"
  );
  addLog(`${name} transition: YELLOW for 1.5s`);
  await sleep(trafficSystem.durations.yellow);

  if (trafficSystem.stopRequested) return;

  // Simplified duplicated logic
  setIntersectionState("RED", "RED"); 
  
  addLog("Safety Buffer: ALL-RED for 0.5s");
  await sleep(500);
  
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

  // Replaced inline onclick with modern addEventListener
  document.querySelector("#startBtn").addEventListener("click", startSystem);
  document.querySelector("#stopBtn").addEventListener("click", stopSystem);
  document.querySelector("#clearLogBtn").addEventListener("click", clearLog);
}

function initializeSystem() {
  bindDomReferences();
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

    let isPedestrianQueued = false;

    pedButton.addEventListener('click', () => {
        if (!isPedestrianQueued) {
            isPedestrianQueued = true;
            pedButton.disabled = true;
            pedButton.textContent = '⏳ Queued...';
            
           
            stopSystem(); 
            addLog('Pedestrian requested: System will pause after current cycle.');
        }
    });

    const monitor = setInterval(async () => {
        if (isPedestrianQueued && trafficSystem.isRunning === false) {
            isPedestrianQueued = false;
            pedButton.textContent = '🚶 Crossing...';

            setIntersectionState("RED", "RED");
            addLog('PEDESTRIAN PHASE: All lights RED for 5 seconds.');

            await new Promise(resolve => setTimeout(resolve, 5000));

            addLog('Pedestrian phase complete. Resuming traffic...');
            
            pedButton.disabled = false;
            pedButton.textContent = '🚶 Pedestrian Crossing';
            startSystem();
        }
    }, 500); 
})();