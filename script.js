// --- Puzzle Game Script ---

// DOM Elements
const gridSizeInput = document.getElementById("gridSizeInput");
const gridContainer = document.getElementById("gridContainer");
const moveCounter = document.getElementById("movecounter");
const popup = document.getElementById("popup");
const popupMoves = document.getElementById("mo");
const popupTime = document.getElementById("ti");
const popupBtn = document.getElementById("bu");
const leaderboardBtn = document.getElementById("leaderboard");
const leaderboardList = document.getElementById("leaderboardList");
const popup1 = document.getElementById("popup1");
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resumeBtn = document.getElementById('resume');
const resetBtn = document.getElementById('reset');
const hrElem = document.getElementById('hr');
const minElem = document.getElementById('min');
const secElem = document.getElementById('sec');
const namePopup = document.getElementById('namePopup');
const nameSubmit = document.getElementById('nameSubmit');
const playerNameInput = document.getElementById('playerNameInput');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const nameWarning = document.getElementById('nameWarning');
const shuffleBtn = document.getElementById('shuffle');

// Timer variables
let hour = 0, minute = 0, second = 0;
let timer = false;
let timerInterval = null;
let moves = 0;
let gameActive = false;
let playerName = "";
let currentGridSize = 4;

// --- Utility Functions ---

function getTimeInSeconds() {
    return hour * 3600 + minute * 60 + second;
}

function getTimeString() {
    return `${hour}Hr ${minute}Min ${second}Sec`;
}

function generateShuffledArray(size) {
    let arr, solved, correctCount;
    const maxCorrect = Math.floor((size * size) / 2);
    do {
        arr = [];
        for (let i = 1; i < size * size; i++) arr.push(i);
        arr.push(0);
        // Shuffle
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        solved = arr.every((val, idx) => val === (idx === arr.length - 1 ? 0 : idx + 1));
        correctCount = arr.reduce((acc, val, idx) => {
            if (val !== 0 && val === idx + 1) acc++;
            return acc;
        }, 0);
    } while (!isSolvable(arr, size) || solved || correctCount > maxCorrect);
    return arr;
}

function isSolvable(arr, size) {
    let inv = 0;
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] && arr[j] && arr[i] > arr[j]) inv++;
        }
    }
    if (size % 2 !== 0) return inv % 2 === 0;
    const blankRow = size - Math.floor(arr.indexOf(0) / size);
    if (blankRow % 2 === 0) return inv % 2 !== 0;
    return inv % 2 === 0;
}

// --- Grid Creation ---

function createGrid() {
    const size = parseInt(gridSizeInput.value);
    if (isNaN(size) || size < 2 || size > 10) {
        alert("Please enter a correct value between 2 and 10 for grid size.");
        gridSizeInput.value = 4;
        return;
    }
    currentGridSize = size;
    setGridSize();
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    const arr = generateShuffledArray(size);

    for (let i = 0; i < size * size; i++) {
        const gridItem = document.createElement("button");
        gridItem.className = "grid-item disabled";
        gridItem.id = "grid-item" + (i + 1);
        gridItem.textContent = arr[i] === 0 ? "" : arr[i];
        gridItem.disabled = true;
        gridItem.style.fontSize = `${Math.max(2, 8 - size)}vw`;
        gridItem.addEventListener('click', () => handleTileClick(i, size));
        gridContainer.appendChild(gridItem);
    }
    moves = 0;
    moveCounter.textContent = moves;
    resetTimer();
    updateTimerDisplay();
    gameActive = false;
    showButtons("start");
    colorTiles(size);
}

function setGridSize() {
    const size = parseInt(gridSizeInput.value);
    let vw = Math.min(window.innerWidth, window.innerHeight);
    let gridSize = vw < 700 ? 90 : 50;
    gridContainer.style.width = gridContainer.style.height = `${gridSize}vw`;
}

// --- Tile Coloring ---

function colorTiles(size) {
    for (let i = 0; i < size * size; i++) {
        const tile = document.getElementById("grid-item" + (i + 1));
        if (!tile) continue;
        if (tile.textContent == (i + 1)) {
            tile.style.background = "linear-gradient(to right,#d1fae5,#bbf7d0)";
            tile.style.color = "#059669";
        } else {
            tile.style.background = "linear-gradient(135deg, #bae6fd 0%, #2563eb 100%)";
            tile.style.color = "#1e293b";
        }
    }
}

// --- Swapping Logic ---

function handleTileClick(index, size) {
    if (!gameActive) return;
    const tiles = Array.from(gridContainer.children);
    const emptyIndex = tiles.findIndex(tile => tile.textContent === "");
    // Only allow up, down, left, right moves (no diagonal)
    const row = Math.floor(index / size);
    const col = index % size;
    const emptyRow = Math.floor(emptyIndex / size);
    const emptyCol = emptyIndex % size;
    const isAdjacent = (Math.abs(row - emptyRow) + Math.abs(col - emptyCol)) === 1;
    if (isAdjacent) {
        [tiles[emptyIndex].textContent, tiles[index].textContent] = [tiles[index].textContent, tiles[emptyIndex].textContent];
        moves++;
        moveCounter.textContent = moves;
        colorTiles(size);
        checkWin(size);
    }
}

// --- Win Check & Animation ---

function checkWin(size) {
    let won = true;
    for (let i = 0; i < size * size - 1; i++) {
        const tile = document.getElementById("grid-item" + (i + 1));
        if (tile.textContent != (i + 1)) {
            won = false;
            break;
        }
    }
    if (won) {
        stopTimer();
        fetch(`http://localhost:3000/leaderboard?size=${size}`)
            .then(res => res.json())
            .then(data => {
                const entry = data.find(e => e.name.toLowerCase() === playerName.toLowerCase());
                let bestMsg = "";
                if (entry) {
                    if (
                        moves < entry.moves ||
                        (moves === entry.moves && getTimeInSeconds() < entry.timeSec)
                    ) {
                        bestMsg = `<br><span style="color:#059669;">New Best Time!</span>`;
                    } else {
                        bestMsg = `<br>Your Best: ${entry.moves} moves, ${entry.time}`;
                    }
                } else {
                    bestMsg = `<br><span style="color:#059669;">First Score!</span>`;
                }
                showWinPopup(bestMsg);
                updatePlayerInfo();
            });
        postLeaderboard(moves, getTimeString(), getTimeInSeconds(), size);
        disableTiles();
        showButtons("restart");
    }
}

// --- Popup Handling ---

function showWinPopup(bestMsg = "") {
    popup.classList.add("open-popup");
    popupMoves.innerHTML = "Moves : " + moves;
    popupTime.innerHTML = `Time Taken : ${getTimeString()}${bestMsg}`;
    // Add both Play Again and New Player buttons
    popupBtn.textContent = "Play Again";
    if (!document.getElementById("newPlayerBtn")) {
        const newPlayerBtn = document.createElement("button");
        newPlayerBtn.id = "newPlayerBtn";
        newPlayerBtn.className = "btn5";
        newPlayerBtn.style.marginTop = "1vw";
        newPlayerBtn.textContent = "New Player";
        newPlayerBtn.onclick = function () {
            popup.classList.remove("open-popup");
            showNamePopup();
        };
        popup.appendChild(newPlayerBtn);
    }
}

popupBtn.onclick = function () {
    popup.classList.remove("open-popup");
    createGrid();
    // Remove New Player button if present
    const np = document.getElementById("newPlayerBtn");
    if (np) np.remove();
};

// --- Timer Functions ---

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timer = true;
    timerInterval = setInterval(() => {
        if (!timer) return;
        second++;
        if (second === 60) { minute++; second = 0; }
        if (minute === 60) { hour++; minute = 0; }
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    timer = false;
    if (timerInterval) clearInterval(timerInterval);
}

function resetTimer() {
    stopTimer();
    hour = minute = second = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    hrElem.textContent = hour < 10 ? "0" + hour : hour;
    minElem.textContent = minute < 10 ? "0" + minute : minute;
    secElem.textContent = second < 10 ? "0" + second : second;
}

// --- Button Events & UI State ---

function showButtons(state) {
    if (state === "start") {
        startBtn.style.display = "";
        pauseBtn.style.display = "none";
        resumeBtn.style.display = "none";
        resetBtn.style.display = "none";
        shuffleBtn.style.display = "";
        disableTiles();
    } else if (state === "playing") {
        startBtn.style.display = "none";
        pauseBtn.style.display = "";
        resumeBtn.style.display = "none";
        resetBtn.style.display = "";
        shuffleBtn.style.display = "none";
        enableTiles();
    } else if (state === "paused") {
        startBtn.style.display = "none";
        pauseBtn.style.display = "none";
        resumeBtn.style.display = "";
        resetBtn.style.display = "";
        shuffleBtn.style.display = "none";
        disableTiles();
    } else if (state === "restart") {
        startBtn.style.display = "none";
        pauseBtn.style.display = "none";
        resumeBtn.style.display = "none";
        resetBtn.style.display = "";
        shuffleBtn.style.display = "";
        disableTiles();
    }
}

function enableTiles() {
    Array.from(gridContainer.children).forEach(tile => {
        tile.disabled = false;
        tile.classList.remove("disabled");
    });
}

function disableTiles() {
    Array.from(gridContainer.children).forEach(tile => {
        tile.disabled = true;
        tile.classList.add("disabled");
    });
}

// --- Name Popup Logic ---

function showNamePopup() {
    namePopup.classList.add("open-popup");
    playerNameInput.value = "";
    playerNameInput.focus();
}
nameSubmit.onclick = function () {
    const val = playerNameInput.value.trim();
    if (!val) {
        nameWarning.style.display = "block";
        playerNameInput.focus();
        return;
    }
    nameWarning.style.display = "none";
    playerName = val;
    namePopup.classList.remove("open-popup");
    createGrid();
    updatePlayerInfo();
};

playerNameInput.addEventListener("keydown", function(e){
    if(e.key === "Enter") nameSubmit.click();
    if (nameWarning.style.display === "block" && playerNameInput.value.trim()) {
        nameWarning.style.display = "none";
    }
});

// --- Main Button Events ---

startBtn.onclick = function () {
    gameActive = true;
    showButtons("playing");
    enableTiles();
    startTimer();
};
pauseBtn.onclick = function () {
    timer = false;
    showButtons("paused");
};
resumeBtn.onclick = function () {
    timer = true;
    showButtons("playing");
    enableTiles();
    startTimer();
};
resetBtn.onclick = function () {
    createGrid();
};

gridSizeInput.addEventListener('change', () => {
    setGridSize();
    createGrid();
    updatePlayerInfo();
});

// --- Leaderboard Integration ---

leaderboardBtn.onclick = function () {
    popup1.classList.add("open-popup1");
    fetchLeaderboard();
};
document.getElementById('bu1').onclick = function () {
    popup1.classList.remove("open-popup1");
};

function fetchLeaderboard() {
    const size = parseInt(gridSizeInput.value);
    leaderboardList.innerHTML = "Loading...";
    fetch(`http://localhost:3000/leaderboard?size=${size}`)
        .then(res => res.json())
        .then(data => {
            if (!data.length) {
                leaderboardList.innerHTML = "<div>No entries yet.</div>";
                return;
            }
            leaderboardList.innerHTML = `
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Moves</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map((entry, i) =>
                            `<tr${entry.name.toLowerCase() === playerName.toLowerCase() ? ' style="background:#dbeafe;"' : ''}>
                                <td>${i + 1}</td>
                                <td>${entry.name}</td>
                                <td>${entry.moves}</td>
                                <td>${entry.time}</td>
                            </tr>`
                        ).join('')}
                    </tbody>
                </table>
            `;
        })
        .catch(() => {
            leaderboardList.innerHTML = "<div>Could not load leaderboard.</div>";
        });
}

function postLeaderboard(moves, time, timeSec, size) {
    fetch('http://localhost:3000/leaderboard', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: playerName, moves, time, timeSec, size })
    });
}

// --- Player Info Update ---
function updatePlayerInfo() {
    const size = parseInt(gridSizeInput.value);
    if (!playerName) {
        playerNameDisplay.textContent = "";
        return;
    }
    fetch(`http://localhost:3000/leaderboard?size=${size}`)
        .then(res => res.json())
        .then(data => {
            const entry = data.find(e => e.name.toLowerCase() === playerName.toLowerCase());
            if (entry) {
                playerNameDisplay.textContent = `Player: ${playerName} | Best Score: ${entry.moves} moves, ${entry.time}`;
            } else {
                playerNameDisplay.textContent = `Player: ${playerName}`;
            }
        })
        .catch(() => {
            playerNameDisplay.textContent = `Player: ${playerName}`;
        });
}

// --- Responsive Grid Sizing ---
window.addEventListener('resize', setGridSize);

// --- Initialize ---
window.onload = function() {
    setGridSize();
    showNamePopup();
};

shuffleBtn.onclick = function () {
    if (!gameActive) {
        createGrid();
    }
};