const trafficSystem = {
  northSouth: {
    phase: "RED",
    redEl: null,
    yellowEl: null,
    greenEl: null,
    textEl: null,
    countdownEl: null,
    timerCardEl: null,
    timerBadgeEl: null,
    timerActionEl: null,
    timerValueEl: null,
    timerSubEl: null
  },
  eastWest: {
    phase: "GREEN",
    redEl: null,
    yellowEl: null,
    greenEl: null,
    textEl: null,
    countdownEl: null,
    timerCardEl: null,
    timerBadgeEl: null,
    timerActionEl: null,
    timerValueEl: null,
    timerSubEl: null
  },
  durations: { green: 8000, yellow: 1500, allRed: 500 },
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
  pedTimerCardEl: null,
  pedTimerBadgeEl: null,
  pedTimerActionEl: null,
  pedTimerValueEl: null,
  pedTimerSubEl: null,
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

function setCountdownTexts(nsText, ewText) {
  if (trafficSystem.northSouth.countdownEl) {
    trafficSystem.northSouth.countdownEl.innerText = nsText;
  }
  if (trafficSystem.eastWest.countdownEl) {
    trafficSystem.eastWest.countdownEl.innerText = ewText;
  }
}

function setDirectionTimer(directionObj, state, badge, action, seconds, subtitle) {
  if (!directionObj.timerCardEl) return;

  directionObj.timerCardEl.dataset.state = state;
  directionObj.timerBadgeEl.innerText = badge;
  directionObj.timerActionEl.innerText = action;
  directionObj.timerValueEl.innerText = Number.isFinite(seconds) ? String(seconds) : "--";
  directionObj.timerSubEl.innerText = subtitle;
}

function setPedTimer(state, badge, action, seconds, subtitle) {
  if (!trafficSystem.pedTimerCardEl) return;

  trafficSystem.pedTimerCardEl.dataset.state = state;
  trafficSystem.pedTimerBadgeEl.innerText = badge;
  trafficSystem.pedTimerActionEl.innerText = action;
  trafficSystem.pedTimerValueEl.innerText = Number.isFinite(seconds) ? String(seconds) : "--";
  trafficSystem.pedTimerSubEl.innerText = subtitle;
}

async function waitWithCountdown(durationMs, onTick) {
  const endAt = Date.now() + durationMs;
  let lastSecond = -1;

  while (true) {
    const remainingMs = endAt - Date.now();
    if (remainingMs <= 0) break;

    const secondsLeft = Math.ceil(remainingMs / 1000);
    if (secondsLeft !== lastSecond) {
      if (onTick) {
        onTick(secondsLeft);
      }
      lastSecond = secondsLeft;
    }

    await sleep(Math.min(200, remainingMs));
  }
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
    trafficSystem.pedHintEl.innerText = "Request queued. Please wait for E-W green.";
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

function getDisplayedSeconds(directionObj) {
  if (!directionObj || !directionObj.timerValueEl) return null;
  const value = Number(directionObj.timerValueEl.innerText);
  return Number.isFinite(value) ? value : null;
}

function getSecondsUntilPedWalk() {
  const nsPhase = trafficSystem.northSouth.phase;
  const ewPhase = trafficSystem.eastWest.phase;
  const nsTotalSec = Math.ceil(getGreenDurationMs(true) / 1000);
  const nsRemain = getDisplayedSeconds(trafficSystem.northSouth) ?? nsTotalSec;
  const ewRemain = getDisplayedSeconds(trafficSystem.eastWest) ?? Math.ceil(getGreenDurationMs(false) / 1000);

  // Pedestrian GO only when EW=GREEN and NS=RED.
  if (ewPhase === "GREEN" && nsPhase === "RED") return 0;

  // NS active (EW red): wait current NS cycle remainder.
  if (nsPhase === "GREEN" && ewPhase === "RED") return nsRemain;

  // Transition right before EW turn.
  if (nsPhase === "YELLOW" && ewPhase === "YELLOW") return nsRemain;

  // EW transition means NS turn is next; then must wait full NS cycle.
  if (ewPhase === "YELLOW") return ewRemain + nsTotalSec;

  return nsTotalSec;
}

async function runDirectionCycle(activeDirection, waitingDirection, name) {
  const isNorthSouthDirection = activeDirection === trafficSystem.northSouth;
  const totalSec = Math.ceil(getGreenDurationMs(isNorthSouthDirection) / 1000);
  const yellowWindowSec = Math.min(2, Math.max(1, totalSec - 1));

  addLog(`${name} cycle: ${totalSec}s (GREEN ${Math.max(1, totalSec - yellowWindowSec)}s + YELLOW ${yellowWindowSec}s)`);

  await waitWithCountdown(totalSec * 1000, (secondsLeft) => {
    const isYellowWindow = secondsLeft <= yellowWindowSec;
    const activePhase = isYellowWindow ? "YELLOW" : "GREEN";
    const waitingPhase = isYellowWindow ? "YELLOW" : "RED";

    setIntersectionState(
      isNorthSouthDirection ? activePhase : waitingPhase,
      isNorthSouthDirection ? waitingPhase : activePhase
    );

    if (isNorthSouthDirection) {
      setDirectionTimer(
        trafficSystem.northSouth,
        isYellowWindow ? "yellow" : "green",
        isYellowWindow ? "YELLOW" : "GREEN",
        isYellowWindow ? "Wait" : "Go",
        secondsLeft,
        isYellowWindow ? "CHANGE IMMINENT" : "GREEN TIME LEFT"
      );
      setDirectionTimer(
        trafficSystem.eastWest,
        isYellowWindow ? "yellow" : "red",
        isYellowWindow ? "YELLOW" : "RED",
        isYellowWindow ? "Wait" : "Stop",
        secondsLeft,
        isYellowWindow ? "CHANGE IMMINENT" : "UNTIL GREEN"
      );
      setCountdownTexts(`Next change in: ${secondsLeft}s`, `Next change in: ${secondsLeft}s`);

      if (trafficSystem.isPedestrianQueued) {
        setPedestrianState("wait");
        setPedTimer("yellow", "WAIT", "Wait", secondsLeft, "WAITING FOR E-W GREEN");
      } else {
        setPedestrianState("stop");
        setPedTimer("red", "DON'T WALK", "Stop", null, "PRESS BUTTON TO REQUEST");
      }
      trafficSystem.isPedestrianCrossing = false;
    } else {
      setDirectionTimer(
        trafficSystem.eastWest,
        isYellowWindow ? "yellow" : "green",
        isYellowWindow ? "YELLOW" : "GREEN",
        isYellowWindow ? "Wait" : "Go",
        secondsLeft,
        isYellowWindow ? "CHANGE IMMINENT" : "GREEN TIME LEFT"
      );
      setDirectionTimer(
        trafficSystem.northSouth,
        isYellowWindow ? "yellow" : "red",
        isYellowWindow ? "YELLOW" : "RED",
        isYellowWindow ? "Wait" : "Stop",
        secondsLeft,
        isYellowWindow ? "CHANGE IMMINENT" : "UNTIL GREEN"
      );
      setCountdownTexts(`Next change in: ${secondsLeft}s`, `Next change in: ${secondsLeft}s`);

      if (!isYellowWindow && (trafficSystem.isPedestrianQueued || trafficSystem.isPedestrianCrossing)) {
        trafficSystem.isPedestrianCrossing = true;
        setPedestrianState("walk");
        setPedTimer("green", "WALK", "Go", secondsLeft, "E-W GREEN ACTIVE");
        if (trafficSystem.isPedestrianQueued) {
          trafficSystem.isPedestrianQueued = false;
          addLog("Pedestrian request served on E-W GREEN.");
        }
      } else if (trafficSystem.isPedestrianQueued) {
        setPedestrianState("wait");
        setPedTimer("yellow", "WAIT", "Wait", secondsLeft, "SIGNAL TRANSITION");
        trafficSystem.isPedestrianCrossing = false;
      } else {
        setPedestrianState("stop");
        setPedTimer("red", "DON'T WALK", "Stop", null, "PRESS BUTTON TO REQUEST");
        trafficSystem.isPedestrianCrossing = false;
      }
    }
  });

  if (trafficSystem.stopRequested) return;
  addLog(`${name} transition complete`);

  if (waitingDirection.phase !== "RED") {
    applyPhase(waitingDirection, "RED");
  }
}

async function runTrafficLoop() {
  while (trafficSystem.isRunning && !trafficSystem.stopRequested) {
    trafficSystem.cycleCounter += 1;
    updateSystemPill(`Running • Cycle ${trafficSystem.cycleCounter}`);

    await runDirectionCycle(trafficSystem.eastWest, trafficSystem.northSouth, "East-West");
    if (trafficSystem.stopRequested) break;
    
    await runDirectionCycle(trafficSystem.northSouth, trafficSystem.eastWest, "North-South");
  }

  trafficSystem.isRunning = false;
  trafficSystem.stopRequested = false;
  updateSystemPill("Stopped");
  setCountdownTexts("Next change in: --", "Next change in: --");
  setDirectionTimer(trafficSystem.northSouth, "red", "RED", "Stop", null, "PAUSED");
  setDirectionTimer(trafficSystem.eastWest, "red", "RED", "Stop", null, "PAUSED");
  if (!trafficSystem.isPedestrianQueued && !trafficSystem.isPedestrianCrossing) {
    setPedTimer("red", "DON'T WALK", "Stop", null, "PRESS BUTTON TO REQUEST");
  }
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
  trafficSystem.northSouth.countdownEl = document.querySelector("#nsCountdownText");
  trafficSystem.northSouth.timerCardEl = document.querySelector("#nsTimerCard");
  trafficSystem.northSouth.timerBadgeEl = document.querySelector("#nsTimerBadge");
  trafficSystem.northSouth.timerActionEl = document.querySelector("#nsTimerAction");
  trafficSystem.northSouth.timerValueEl = document.querySelector("#nsTimerValue");
  trafficSystem.northSouth.timerSubEl = document.querySelector("#nsTimerSub");

  trafficSystem.eastWest.redEl = document.querySelector("#ewRed");
  trafficSystem.eastWest.yellowEl = document.querySelector("#ewYellow");
  trafficSystem.eastWest.greenEl = document.querySelector("#ewGreen");
  trafficSystem.eastWest.textEl = document.querySelector("#ewPhaseText");
  trafficSystem.eastWest.countdownEl = document.querySelector("#ewCountdownText");
  trafficSystem.eastWest.timerCardEl = document.querySelector("#ewTimerCard");
  trafficSystem.eastWest.timerBadgeEl = document.querySelector("#ewTimerBadge");
  trafficSystem.eastWest.timerActionEl = document.querySelector("#ewTimerAction");
  trafficSystem.eastWest.timerValueEl = document.querySelector("#ewTimerValue");
  trafficSystem.eastWest.timerSubEl = document.querySelector("#ewTimerSub");

  trafficSystem.logListEl = document.querySelector("#logList");
  trafficSystem.systemStateEl = document.querySelector("#systemStatePill");
  trafficSystem.modeToggleEl = document.querySelector("#modeToggle");
  trafficSystem.modeTextEl = document.querySelector("#modeText");
  trafficSystem.nsDurationInputEl = document.querySelector("#nsDurationInput");
  trafficSystem.ewDurationInputEl = document.querySelector("#ewDurationInput");
  trafficSystem.pedIndicatorEl = document.querySelector("#pedIndicator");
  trafficSystem.pedHintEl = document.querySelector("#pedHintText");
  trafficSystem.pedTimerCardEl = document.querySelector("#pedTimerCard");
  trafficSystem.pedTimerBadgeEl = document.querySelector("#pedTimerBadge");
  trafficSystem.pedTimerActionEl = document.querySelector("#pedTimerAction");
  trafficSystem.pedTimerValueEl = document.querySelector("#pedTimerValue");
  trafficSystem.pedTimerSubEl = document.querySelector("#pedTimerSub");

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
  setCountdownTexts("Next change in: --", "Next change in: --");
  setDirectionTimer(trafficSystem.northSouth, "red", "RED", "Stop", null, "UNTIL GREEN");
  setDirectionTimer(trafficSystem.eastWest, "green", "GREEN", "Go", null, "GREEN TIME LEFT");
  setPedTimer("red", "DON'T WALK", "Stop", null, "PRESS BUTTON TO REQUEST");
  setIntersectionState("RED", "GREEN");
  updateSystemPill("Ready");
  addLog("Initialized with East-West GREEN (East-West priority).");
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
        const isEwGreenNow = trafficSystem.eastWest.phase === "GREEN" && trafficSystem.northSouth.phase === "RED";

        if (isEwGreenNow) {
          const ewRemaining = getDisplayedSeconds(trafficSystem.eastWest) ?? Math.ceil(getGreenDurationMs(false) / 1000);
          trafficSystem.isPedestrianCrossing = true;
          setPedestrianState("walk");
          setPedTimer("green", "WALK", "Go", ewRemaining, "E-W GREEN ACTIVE");
          addLog('Pedestrian request served immediately (E-W already GREEN).');
          return;
        }

        trafficSystem.isPedestrianQueued = true;
        const waitSec = getSecondsUntilPedWalk();
        pedButton.textContent = 'Queued';
        setPedestrianState("wait");
        setPedTimer("yellow", "WAIT", "Wait", waitSec, "WAITING FOR E-W GREEN");
        addLog(`Pedestrian request queued: crossing opens in about ${waitSec}s.`);
        }
    });

    setInterval(() => {
      if (trafficSystem.isPedestrianQueued) {
        pedButton.textContent = 'Queued';
      } else {
        pedButton.textContent = 'Pedestrian Crossing';
      }
    }, 500);
})();
