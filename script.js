// Playback speed factor
const playbackSpeedFactor = 200;

// Precomputed styles
const mediaQuery = window.matchMedia("screen and (max-width: 768px)");
const isMobile = mediaQuery.matches;
const style = getComputedStyle(document.documentElement);
const defaultArenaHeight = parseInt(style.getPropertyValue('--arena-default-height'));
const arenaStartLeft = parseInt(style.getPropertyValue('--arena-start-left'));
const arenaBeachFrac = parseFloat(style.getPropertyValue('--arena-beach-frac'));
const paddingHorizontal = parseInt(style.getPropertyValue('--padding-horizontal'));
const timeLabelLongest = parseInt(style.getPropertyValue('--time-label-longest'));
const minLaneHeight = parseInt(
  isMobile
  ? style.getPropertyValue('--lane-min-height-mobile')
  : style.getPropertyValue('--lane-min-height-desktop')
);

// Reset beach vs ocean background widths upon resize
window.addEventListener('resize', setArenaBackground);
window.addEventListener('DOMContentLoaded', setArenaBackground);

// Fetch the event data
fetch('./data/event.json')
  .then(response => response.json())
  .then(event => {
    simulateEvent(event);
  })
  .catch(error => {
    console.error('Error fetching data:', error);
    document.getElementById('arena').textContent = 'Failed to load event data.';
 });

/**
 * Sets the arena background
 * @returns 
 */
 function setArenaBackground() {
  // Get arena element
  const arena = document.getElementById('arena');

  // Calculate beach width in pixels
  const totalWidth = arena.offsetWidth;
  const remaining = totalWidth - arenaStartLeft;
  const beachWidth = remaining * arenaBeachFrac;

  // Set background
  arena.style.background = `
    linear-gradient(
      to right,
      ${style.getPropertyValue('--page-background-color')} 0 ${arenaStartLeft}px,
      ${style.getPropertyValue('--arena-beach-color')} ${arenaStartLeft}px ${arenaStartLeft + beachWidth}px,
      ${style.getPropertyValue('--arena-ocean-color')} ${arenaStartLeft + beachWidth}px 100%
    )
  `;
 }

/**
 * Initializes the arena element
 * @param {number} arenaHeight - Height of the arena in pixels
 * @returns 
 */
function setArenaElement(arenaHeight) {
  const arena = document.getElementById('arena');
  setArenaBackground();
  arena.style.height = `${arenaHeight}px`;
  arena.innerHTML = ''; // Clear existing lanes
  return arena;
}

/**
 * Initializes the lane element
 * @param {object} result - Dictionary with details of the lane's result
 * @param {number} laneHeightPercent - Percentage of the arena taken up by the lane
 * @returns {HTMLDivElement} Lane element
 */
function setLaneElement(result, laneHeightPercent) {
  const lane = document.createElement('div');
  lane.className = 'lane';
  lane.id = `lane-${result.lane}`;
  lane.style.height = laneHeightPercent + '%';
  return lane;
}

/**
 * Initializes the lane label element
 * @param {object} result - Dictionary with details of the lane's result
 * @returns {HTMLDivElement} Lane label element
 */
function setLaneLabelElement(result) {
  const laneLabel = document.createElement('div');
  laneLabel.className = 'lane-label';
  laneLabel.id = `lane-label-${result.lane}`;
  laneLabel.innerHTML = result.team + '<br>&nbsp;';
  return laneLabel;
}

/**
 * Initializes the dot element
 * @param {object} result - Dictionary with details of the lane's result
 * @returns {HTMLDivElement} Dot element
 */
function setDotElement(result) {
  const dot = document.createElement('div');
  dot.className = 'dot';
  dot.id = `dot-${result.lane}`;
  dot.setAttribute('dot-team', result.team);
  return dot;
}

/**
 * Initializes the total time label element
 * @param {object} result - Dictionary with details of the lane's result
 * @returns {HTMLDivElement} Total time label element
 */
function setTotalTimeLabelElement(result) {
  const totalTimeLabel = document.createElement('div');
  totalTimeLabel.className = 'total-time-label';
  totalTimeLabel.id = `total-time-label-${result.lane}`;
  totalTimeLabel.textContent = '';  // Initially blank
  return totalTimeLabel;
}

/**
 * Sets dynamic positions of objects in document based on the maximum lane label width
 */
function setDynamicPositions() {
  // Get document elements
  const lanes = document.querySelectorAll('.lane');
  const finishOnRight = false;

  lanes.forEach(lane => {
    // Dot position
    const dot = lane.querySelector('.dot');

    if (isMobile) {
      // Mobile
      dot.style.left = arenaStartLeft + paddingHorizontal;
    } else {
      // Desktop
      dot.style.left = (arenaStartLeft + paddingHorizontal) + 'px';
    }
    const dotStyle = getComputedStyle(dot);
    const dotLeft = parseInt(dotStyle.left);
    const dotWidth = parseInt(dotStyle.width);

    // Total time label position
    const totalTimeLabel = lane.querySelector('.total-time-label');

    if (isMobile) {
      // Mobile
      if (finishOnRight) {
        // Mobile, finishes on right
        totalTimeLabel.style.left = (arenaStartLeft + paddingHorizontal) + 'px';
        totalTimeLabel.style.right = 'auto';
      } else {
        // Mobile, finishes on left
        totalTimeLabel.style.left = (arenaStartLeft + dotWidth + 2 * paddingHorizontal) + 'px';
        totalTimeLabel.style.right = 'auto';
      }
    } else {
      // Desktop
      if (finishOnRight) {
        // Desktop, finishes on right
        totalTimeLabel.style.left = 'auto';
        totalTimeLabel.style.right = (arenaStartLeft + dotWidth + 2 * paddingHorizontal) + 'px';
      } else {
        // Desktop, finishes on left
        totalTimeLabel.style.left = (arenaStartLeft + dotWidth + 2 * paddingHorizontal) + 'px';
        totalTimeLabel.style.right = 'auto';
      }
    }
  });
}

/**
 * Populates the arena when an event is first loaded
 * @param {object} event - Dictionary containing event details 
 */
function populateArena(event) {

  // Set title
  document.getElementById('title-bar').textContent = event.eventName;
  document.title = event.eventName;

  // Calculate lane height and arena height
  const numberOfLanes = event.results.length;
  const laneHeightPercent = (100 / numberOfLanes).toFixed(2);
  const arenaHeight = Math.max(numberOfLanes * minLaneHeight, defaultArenaHeight);

  // Set arena element
  const arena = setArenaElement(arenaHeight);
  
  // Set lap marker
  setLapMarker(event.lapDistanceMetres);

  event.results.forEach(result => {
    // Set elements within the arena
    const lane = setLaneElement(result, laneHeightPercent);
    const laneLabel = setLaneLabelElement(result);
    const dot = setDotElement(result);
    const totalTimeLabel = setTotalTimeLabelElement(result)

    // Append to the arena element
    lane.appendChild(laneLabel);
    lane.appendChild(dot);
    lane.appendChild(totalTimeLabel);
    arena.appendChild(lane);
  });

  // Update positions based on finishing end and longest lane label
  setDynamicPositions();
}

/**
 * Sets the lap length annotation below the arena
 * @param {number} lapDistanceMetres - Distance of one lap in metres
 */
function setLapMarker(lapDistanceMetres) {
  const lapMarker = document.getElementById('lap-marker');
  lapMarker.textContent = `${lapDistanceMetres.toLocaleString()}m`;
}

/**
 * Adds a placing attribute to each result based on their finishing time
 * @param {list} results - List of each lane's results
 * @returns 
 */
function determinePlacings(results) {

  // Calculate total time for each team
  results.forEach(result => {
    const totalAthleteTime = result.athletes.reduce((acc, athlete) => acc + athlete.timeSeconds, 0);
    result.totalTimeSeconds = totalAthleteTime + result.handicapSeconds;
  });

  // Sort the results by timeSeconds in ascending order
  results.sort((a, b) => a.totalTimeSeconds - b.totalTimeSeconds);

  // Initialize placing and a counter for ties
  let placing = 1;
  let tieCount = 0;

  for (let i = 0; i < results.length; i++) {
      if (i > 0 && results[i].totalTimeSeconds === results[i - 1].totalTimeSeconds) {
          // If tied with the previous time, assign the same placing
          results[i].placing = placing;
          tieCount++; // Increase the tie count
      } else {
          // If not tied, update placing, taking into account previous ties
          placing += tieCount;
          results[i].placing = placing;
          tieCount = 1; // Reset tie count for next sequence
      }
  }

  // Sort the results by lane again
  results.sort((a, b) => a.lane - b.lane);
  return results;
}

/**
 * Adds a medal to a total time label if applicable
 * @param {HTMLDivElement} totalTimeLabel - HTML element of the athlete's total time label
 * @param {number} placing - Ordinal placing of the athlete 
 * @param {number} totalLaps - Total number of laps in the event
 * @returns
 */
function addMedalIfWon(totalTimeLabel, placing) {
  // Define the medal abbrevations for each placing. Note that this defines which medals are available.
  const placingAbbrevs = {
    1: 'G',
    2: 'S',
    3: 'B'
  };

  // Determine whether the athlete wins a medal
  const isMedalWinner = placingAbbrevs.hasOwnProperty(placing);
  const finishOnRight = false;

  if (isMedalWinner) {
    // Create the medal
    const medal = document.createElement('span');
    medal.classList.add('medal');
    medal.textContent = placingAbbrevs[placing];
    medal.setAttribute('medal-placing', placing);

    // Set the medal's position
    if (isMobile) {
      // Mobile
      medal.style.left = (arenaStartLeft + timeLabelLongest) + 'px';
      medal.style.right = 'auto'; // Reset right
    } else if (finishOnRight) {
      // Desktop, finish on right
      medal.style.right = (arenaStartLeft + timeLabelLongest)  + 'px';
      medal.style.left = 'auto'; // Reset left
    } else {
      // Desktop, finish on left
      medal.style.left = style.getPropertyValue('--medal-offset-left');
      medal.style.right = 'auto'; // Reset right
    }

    totalTimeLabel.appendChild(medal); 
  }
}

/**
 * Calculates the distance of one lap based on the arena size, dot size, and padding
 * @param {HTMLDivElement} dot - Dot element 
 * @returns {number} Distance of one lap
 */
function calculateLapDistance(dot) {
  // Get document sizes
  const arenaWidth =  getComputedStyle(document.getElementById('arena')).width;
  const dotStyle = getComputedStyle(dot);
  const dotSize =  dotStyle.width;
  const dotLeft = dotStyle.left;

  // Calculate lap distance
  const lapDistance = parseInt(arenaWidth) - parseInt(dotLeft) - parseInt(dotSize) - parseInt(paddingHorizontal);
  return lapDistance;
}

/**
 * Formats a time in h:mm:ss.xx format
 * @param {number} timeInSeconds - the time in seconds
 * @returns {string} - Formatted time in h:mm:ss.xx format
 */
function formatTime(timeInSeconds) {
  const totalHundredths = Math.round(timeInSeconds * 100); // Convert to hundredths
  const hours = Math.floor(totalHundredths / 360000); // Total seconds in an hour
  const minutes = Math.floor((totalHundredths % 360000) / 6000); // Total seconds in a minute
  const seconds = Math.floor((totalHundredths % 6000) / 100); // Total seconds
  const hundredths = totalHundredths % 100; // Remaining hundredths

  // Construct the formatted time based on the values of hours and minutes
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;//.${String(hundredths).padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}`;//.${String(hundredths).padStart(2, '0')}`;
  } else {
    return `${seconds}.${String(hundredths).padStart(2, '0')}`;
  }
}

/**
 * Animates a dot along its lane for the whole event
 * @param {object} result - Dictionary with details of the lane's result
 * @param {number} lapsPerAthlete - Number of laps per athlete
 * @returns
 */
function animateDot(result, lapsPerAthlete) {

  // Get page elements
  const laneNumber = result.lane;
  const dot = document.getElementById(`dot-${laneNumber}`);
  const laneLabel = document.getElementById(`lane-label-${result.lane}`);
  const totalTimeLabel = document.getElementById(`total-time-label-${result.lane}`);

  // Calculate lap distance
  const lapDistance = calculateLapDistance(dot);
  const dotLeft = parseFloat(getComputedStyle(dot).left);
  let laps = [];

  // Push lap data into list
  result.athletes.forEach(athlete => {
    laps.push({ leg: athlete.leg, athleteName: athlete.athleteName, direction: 1, duration: athlete.timeSeconds / lapsPerAthlete }); // forward
    laps.push({ leg: athlete.leg, athleteName: athlete.athleteName, direction: -1, duration: athlete.timeSeconds / lapsPerAthlete }); // back
  });

  let startTime = null;
  let currentLap = 0;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;

    // Calculate progress %
    const lap = laps[currentLap];
    const lapDurationMs = lap.duration * 1000 / playbackSpeedFactor;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / lapDurationMs, 1); // 0 to 1

    // Calculate position
    const position = lap.direction === 1
      ? progress * (lapDistance - paddingHorizontal) + dotLeft
      : (1 - progress) * (lapDistance - paddingHorizontal) + dotLeft;

    // Set position
    dot.style.left =  `${position}px`;

    // Update lane label
    laneLabel.innerHTML = result.team + '<br>' + '(' + lap.leg + ') ' + lap.athleteName;

    if (progress < 1) {
      // Dot continues
      requestAnimationFrame(animate);
    } else {
      // End of lap
      currentLap++;
      if (currentLap < laps.length) {
        // End of leg
        startTime = null;
        requestAnimationFrame(animate);
      } else {
        // End of relay
        laneLabel.innerHTML = result.team;
        totalTimeLabel.textContent = formatTime(result.totalTimeSeconds);
        addMedalIfWon(totalTimeLabel, result.placing);
      }
    }
  }

  // Apply team handicap
  const handicapDelayMs = result.handicapSeconds * 1000 / playbackSpeedFactor;

  setTimeout(() => {
    requestAnimationFrame(animate);
  }, handicapDelayMs);

}

/**
 * Animates all dots along their lanes for the whole event
 * @param {object} event - Dictionary containing event details 
 * @returns
 */
function animateAllDots(event) {

  // Get laps per athlete
  const lapsPerAthlete = event.lapsPerAthlete;

  // Animate each dot
  event.results.forEach(result => {
    animateDot(result, lapsPerAthlete);
  });
}

/**
 * Simulates an event by moving each dot along the arena
 * @param {object} event - Dictionary containing event details
 * @returns
 */
function simulateEvent(event) {
  populateArena(event);
  determinePlacings(event.results);
  animateAllDots(event);
}