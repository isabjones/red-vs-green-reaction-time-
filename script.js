const experiment = {
  times: [],
  maxTrials: 10,
  waitHnd: -1,
  started: false,
  ended: false,
  stimulusWait: false,
  stimulusShown: false,
  stimulusShownAt: -1,
  currentColour: "", // Tracks whether the current trial is red or green using British spelling
  btnDisabled: false
};

const btn = document.querySelector(".button-default");
const stimulus = document.querySelector(".circle");

const advanceTrial = function () {
  // Reset stimulus
  updateStimulus("inactive");

  if (experiment.times.length < experiment.maxTrials) {
    // Still need to run more trials
    experiment.stimulusShown = false; 
    scheduleStimulus();
  } else {
    // Experiment ended
    experiment.stimulusShown = false;
    endExperiment();
  }
};

const endExperiment = function () {
  console.info("INFO: Experiment ended. Await download of results");

  experiment.ended = true;

  // Update Button Styling
  experiment.btnDisabled = false;
  btn.classList.toggle("button-enabled");
  btn.classList.toggle("button-disabled");
  btn.textContent = "Download Data";
};

const scheduleStimulus = function () {
  experiment.stimulusWait = true;
  const randomDelay = Math.floor(Math.random() * 4 + 2); // 2 - 5s
  experiment.waitHnd = window.setTimeout(showStimulus, randomDelay * 1000); 
  console.info(
    "INFO: Trial",
    experiment.times.length,
    ". Random delay:",
    randomDelay
  );
};

const showStimulus = function () {
  // Randomly assign either 'red' or 'green' for this trial
  experiment.currentColour = Math.random() < 0.5 ? "red" : "green";

  experiment.stimulusShownAt = Date.now();
  console.info(
    "INFO: Trial",
    experiment.times.length,
    ". Colour:", 
    experiment.currentColour, 
    ". Stimulus shown",
    experiment.stimulusShownAt
  );
  updateStimulus("active");
  experiment.stimulusWait = false;
  experiment.stimulusShown = true;
};

const updateStimulus = function (state) {
  if (state === "active") {
    // Clear out inactive/other classes and apply active state + randomized colour class
    stimulus.classList.remove("inactive", "red", "green");
    stimulus.classList.add("active", experiment.currentColour);
  } else {
    // Revert back to inactive white state
    stimulus.classList.remove("active", "red", "green");
    stimulus.classList.add("inactive");
  }
};

const logReaction = function () {
  let userReactedAt = Date.now();
  console.info("INFO: User reaction captured.", userReactedAt);

  let deltaTime = userReactedAt - experiment.stimulusShownAt;
  
  // Store an object containing both the colour and the reaction time
  experiment.times.push({ colour: experiment.currentColour, time: deltaTime });
  
  // Show both reaction time and the colour on screen
  document.querySelector("#time").textContent = deltaTime + " ms (" + experiment.currentColour + ")";
};

const userReaction = function () {
  if (!experiment.started) {
    return;
  } 
  if (experiment.stimulusWait) {
    return; 
  } 

  if (experiment.stimulusShown) {
    logReaction();
    advanceTrial();
  }
};

const startExperiment = function () {
  console.info("INFO: Experiment Started");
  stimulus.style = "background-color:'';";
  document.querySelector("#instructions").style.display = "none";
  experiment.started = true;
  window.addEventListener("keypress", onKey); 
  advanceTrial();
};

const btnAction = function () {
  console.debug("DBG:", "click");
  if(experiment.btnDisabled) return;
  if (!experiment.ended) {
    experiment.btnDisabled = true;
    btn.classList.toggle("button-enabled");
    btn.classList.toggle("button-disabled");
  }
  if (!experiment.started) {
    startExperiment();
  } else {
    if (experiment.ended) {
      exportExperimentLog();
      
      // Separate total trials into individual red and green arrays for statistics calculation
      const redTimes = experiment.times.filter(t => t.colour === "red").map(t => t.time);
      const greenTimes = experiment.times.filter(t => t.colour === "green").map(t => t.time);
      
      const redStats = computeStatistics(redTimes);
      const greenStats = computeStatistics(greenTimes);

      // Display split statistics for both colours on screen
      document.querySelector("#time").innerHTML = [
        "Red — Count:", redStats.cnt, "Mean:", redStats.mean.toFixed(2), "ms, SD:", redStats.sd.toFixed(2), "ms<br>",
        "Green — Count:", greenStats.cnt, "Mean:", greenStats.mean.toFixed(2), "ms, SD:", greenStats.sd.toFixed(2), "ms"
      ].join(" ");
    } else {
      console.log("DBG: Should this occur?");
    }
  }
};

const computeStatistics = function (timeArr) {
  const sums = timeArr.reduce((acc, num) => acc + num, 0);
  const meanDeltaTime = sums / timeArr.length;

  const squaredDiffs = timeArr.reduce(
    (acc, num) => (num - meanDeltaTime) ** 2 + acc,
    0
  );
  const standardDeviationTime = Math.sqrt(squaredDiffs / timeArr.length);

  return {
    sd: standardDeviationTime,
    mean: meanDeltaTime,
    cnt: timeArr.length,
  };
};

const exportExperimentLog = function () {
  let csvHeader = "pid,trial#,colour,reactionTime (ms)\n"; // Updated column header to 'colour'
  let pid = Math.floor(Math.random() * 900000) + 100000;
  let csvData = experiment.times
    .map((item, idx) => [pid, idx, item.colour, item.time].join(",")) 
    .join("\n"); 
  exportData(csvHeader + csvData, "ColourReactionTestResults.csv");
};

const exportData = function (csvDataString, exportFileName) {
  const blob = new Blob([csvDataString], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = window.URL.createObjectURL(blob);
  a.download = exportFileName;

  document.body.appendChild(a);
  a.style.display = "none";
  a.click();

  window.URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
};

const onKey = function (evt) {
  if (evt == null) {
    evt = window.event;
  }
  switch (evt.which || evt.charCode || evt.keyCode) {
    case 32: //space
      userReaction();
      break;
    default:
      console.warn("WARN: Key:", evt, evt.which, evt.charCode, evt.keyCode);
  }
};

btn.addEventListener("click", btnAction);
