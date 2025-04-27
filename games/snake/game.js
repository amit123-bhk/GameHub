const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startGameBtn = document.getElementById('startGameBtn');
const pauseBtn = document.getElementById('pauseBtn');
const scoreElement = document.getElementById('score');
const playerNameInput = document.getElementById('playerName');
const startScreen = document.getElementById('startScreen');
const gameControlsDiv = document.getElementById('gameControls');
const highScoresList = document.getElementById('highScoresList');
const currentDifficultySpan = document.getElementById('currentDifficulty');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

// Set canvas size to match container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Initial resize
resizeCanvas();

// Resize on window resize
window.addEventListener('resize', resizeCanvas);

const gridSize = 20;
let tileCount;

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let gameInterval;
let gameStarted = false;
let gamePaused = false;
let baseSpeed = 100; // Base speed for medium difficulty
let lastDirection = 'right'; // Track last direction to prevent 180-degree turns
let playerName = '';
let selectedDifficulty = null;

// Load high scores from localStorage
let highScores = JSON.parse(localStorage.getItem('snakeHighScores')) || [];

function getGameSpeed() {
    switch(selectedDifficulty) {
        case 'easy':
            return baseSpeed * 1.5; // Slower for easy
        case 'medium':
            return baseSpeed; // Normal speed
        case 'hard':
            return baseSpeed * 0.5; // Faster for hard
        default:
            return baseSpeed;
    }
}

function initGame() {
    // Calculate tile count based on canvas size
    tileCount = {
        x: Math.floor(canvas.width / gridSize),
        y: Math.floor(canvas.height / gridSize)
    };

    // Start snake in the middle
    const startX = Math.floor(tileCount.x / 2);
    const startY = Math.floor(tileCount.y / 2);
    
    snake = [
        {x: startX, y: startY},
        {x: startX - 1, y: startY},
        {x: startX - 2, y: startY}
    ];
    
    food = generateFood();
    dx = 1; // Start moving right
    dy = 0;
    lastDirection = 'right';
    score = 0;
    scoreElement.textContent = score;
}

function generateFood() {
    let newFood;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        newFood = {
            x: Math.floor(Math.random() * tileCount.x),
            y: Math.floor(Math.random() * tileCount.y)
        };
        attempts++;
    } while (
        snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) &&
        attempts < maxAttempts
    );

    // If we couldn't find a valid position, place food in a corner
    if (attempts >= maxAttempts) {
        newFood = {x: 1, y: 1};
    }

    return newFood;
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tileCount.x; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < tileCount.y; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Head
            ctx.fillStyle = '#10B981';
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
            // Draw eyes
            ctx.fillStyle = '#000';
            const eyeSize = gridSize / 5;
            const eyeOffset = gridSize / 4;
            if (dx === 1) { // Moving right
                ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset, segment.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else if (dx === -1) { // Moving left
                ctx.fillRect(segment.x * gridSize + eyeOffset - eyeSize, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + eyeOffset - eyeSize, segment.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else if (dy === -1) { // Moving up
                ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + eyeOffset - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + eyeOffset - eyeSize, eyeSize, eyeSize);
            } else if (dy === 1) { // Moving down
                ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + gridSize - eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + gridSize - eyeOffset, eyeSize, eyeSize);
            }
        } else {
            // Body
            ctx.fillStyle = '#059669';
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
        }
    });

    // Draw food
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize/2,
        food.y * gridSize + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Draw pause overlay if game is paused
    if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width/2, canvas.height/2);
    }
}

function moveSnake() {
    if (gamePaused) return;

    const head = {x: snake[0].x + dx, y: snake[0].y + dy};

    // Check wall collision
    if (head.x < 0 || head.x >= tileCount.x || head.y < 0 || head.y >= tileCount.y) {
        gameOver();
        return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        food = generateFood();
    } else {
        snake.pop();
    }
}

function gameLoop() {
    moveSnake();
    drawGame();
}

function updateHighScores() {
    const newScore = {
        name: playerName,
        score: score,
        difficulty: selectedDifficulty,
        date: new Date().toLocaleDateString()
    };

    highScores.push(newScore);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5); // Keep only top 5 scores
    localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
    displayHighScores();
}

function displayHighScores() {
    highScoresList.innerHTML = '';
    highScores.forEach((score, index) => {
        const row = document.createElement('tr');
        row.className = 'border-t border-gray-600';
        row.innerHTML = `
            <td class="py-2">${index + 1}</td>
            <td>${score.name}</td>
            <td class="text-right">${score.score}</td>
            <td class="text-right">${score.difficulty}</td>
        `;
        highScoresList.appendChild(row);
    });
}

function gameOver() {
    clearInterval(gameInterval);
    gameStarted = false;
    gamePaused = false;
    startScreen.classList.remove('hidden');
    gameControlsDiv.classList.add('hidden');
    updateHighScores();
    alert(`Game Over! Your score: ${score}`);
}

function startGame() {
    playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name to start the game!');
        return;
    }

    if (!selectedDifficulty) {
        alert('Please select a difficulty level!');
        return;
    }

    startScreen.classList.add('hidden');
    gameControlsDiv.classList.remove('hidden');
    currentDifficultySpan.textContent = `Difficulty: ${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}`;
    initGame();
    gameStarted = true;
    gamePaused = false;
    gameInterval = setInterval(gameLoop, getGameSpeed());
}

function togglePause() {
    if (!gameStarted) return;
    
    gamePaused = !gamePaused;
    pauseBtn.innerHTML = gamePaused ? 
        '<i class="fas fa-play mr-1"></i>Resume' : 
        '<i class="fas fa-pause mr-1"></i>Pause';
}

// Difficulty selection
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        difficultyButtons.forEach(btn => btn.classList.remove('ring-2', 'ring-white'));
        // Add active class to selected button
        button.classList.add('ring-2', 'ring-white');
        selectedDifficulty = button.dataset.difficulty;
        startGameBtn.disabled = false;
    });
});

startGameBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);

document.addEventListener('keydown', (e) => {
    if (!gameStarted || gamePaused) return;

    // Prevent default behavior for arrow keys and spacebar
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    switch(e.key) {
        case 'ArrowUp':
            if (lastDirection !== 'down') {
                dx = 0;
                dy = -1;
                lastDirection = 'up';
            }
            break;
        case 'ArrowDown':
            if (lastDirection !== 'up') {
                dx = 0;
                dy = 1;
                lastDirection = 'down';
            }
            break;
        case 'ArrowLeft':
            if (lastDirection !== 'right') {
                dx = -1;
                dy = 0;
                lastDirection = 'left';
            }
            break;
        case 'ArrowRight':
            if (lastDirection !== 'left') {
                dx = 1;
                dy = 0;
                lastDirection = 'right';
            }
            break;
        case ' ':
            togglePause();
            break;
    }
});

// Initial display of high scores
displayHighScores(); 