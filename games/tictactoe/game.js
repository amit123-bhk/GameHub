const cells = document.querySelectorAll('[data-index]');
const currentPlayerElement = document.getElementById('currentPlayer');
const resetScoreBtn = document.getElementById('resetScoreBtn');
const playerXScore = document.getElementById('playerXScore');
const playerOScore = document.getElementById('playerOScore');
const totalGames = document.getElementById('totalGames');
const playWithFriendBtn = document.getElementById('playWithFriendBtn');
const playWithComputerBtn = document.getElementById('playWithComputerBtn');
const statusDisplay = document.getElementById('status');

let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let gameMode = 'friend'; // 'friend' or 'computer'
let winningCombination = null;
let playerXScoreCount = 0;
let playerOScoreCount = 0;
let totalGamesCount = 0;

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
];

function updateScores() {
    playerXScore.textContent = playerXScoreCount;
    playerOScore.textContent = playerOScoreCount;
    totalGames.textContent = totalGamesCount;
}

function handleCellClick(e) {
    const cell = e.target;
    const index = cell.getAttribute('data-index');

    if (gameBoard[index] !== '' || !gameActive) return;

    makeMove(index, cell);

    // If in computer mode and game is still active, make computer move
    if (gameMode === 'computer' && gameActive && currentPlayer === 'O') {
        setTimeout(makeComputerMove, 500);
    }
}

function makeMove(index, cell) {
    gameBoard[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer === 'X' ? 'text-blue-500' : 'text-red-500');

    if (checkWin()) {
        gameActive = false;
        highlightWinningCombination();
        if (currentPlayer === 'X') {
            playerXScoreCount++;
        } else {
            playerOScoreCount++;
        }
        totalGamesCount++;
        updateScores();
        statusDisplay.textContent = `Player ${currentPlayer} wins!`;
        return;
    }

    if (checkDraw()) {
        gameActive = false;
        totalGamesCount++;
        updateScores();
        statusDisplay.textContent = "It's a draw!";
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    currentPlayerElement.textContent = currentPlayer;
    currentPlayerElement.className = currentPlayer === 'X' ? 'text-blue-500' : 'text-red-500';
    updateStatus();
}

function makeComputerMove() {
    if (!gameActive) return;

    // Try to win
    const winningMove = findBestMove('O');
    if (winningMove !== -1) {
        makeMove(winningMove, cells[winningMove]);
        return;
    }

    // Try to block player
    const blockingMove = findBestMove('X');
    if (blockingMove !== -1) {
        makeMove(blockingMove, cells[blockingMove]);
        return;
    }

    // Take center if available
    if (gameBoard[4] === '') {
        makeMove(4, cells[4]);
        return;
    }

    // Take corners if available
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => gameBoard[i] === '');
    if (availableCorners.length > 0) {
        const randomCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
        makeMove(randomCorner, cells[randomCorner]);
        return;
    }

    // Take any available move
    const availableMoves = gameBoard
        .map((cell, index) => cell === '' ? index : null)
        .filter(cell => cell !== null);
    
    if (availableMoves.length > 0) {
        const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        makeMove(randomMove, cells[randomMove]);
    }
}

function findBestMove(player) {
    // Check for winning move
    for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i] === '') {
            gameBoard[i] = player;
            if (checkWinForPlayer(player)) {
                gameBoard[i] = '';
                return i;
            }
            gameBoard[i] = '';
        }
    }
    return -1;
}

function checkWinForPlayer(player) {
    return winningCombinations.some(combination => {
        return combination.every(index => {
            return gameBoard[index] === player;
        });
    });
}

function checkWin() {
    for (const combination of winningCombinations) {
        if (combination.every(index => gameBoard[index] === currentPlayer)) {
            winningCombination = combination;
            return true;
        }
    }
    return false;
}

function highlightWinningCombination() {
    if (winningCombination) {
        winningCombination.forEach(index => {
            cells[index].classList.add('bg-green-500', 'bg-opacity-50');
        });
    }
}

function checkDraw() {
    return gameBoard.every(cell => cell !== '');
}

function updateStatus() {
    statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
}

function resetGame() {
    // Reset game state
    currentPlayer = 'X';
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    winningCombination = null;
    
    // Reset UI
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('text-blue-500', 'text-red-500', 'bg-green-500', 'bg-opacity-50');
    });
    
    // Update status
    currentPlayerElement.textContent = currentPlayer;
    currentPlayerElement.className = 'text-blue-500';
    statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
}

function resetScores() {
    playerXScoreCount = 0;
    playerOScoreCount = 0;
    totalGamesCount = 0;
    updateScores();
}

function setGameMode(mode) {
    // If clicking the same mode, reset the game
    if (gameMode === mode) {
        resetGame();
        return;
    }
    
    // Otherwise, switch modes
    gameMode = mode;
    
    // Update button styles
    playWithFriendBtn.classList.remove('bg-blue-500', 'text-white');
    playWithComputerBtn.classList.remove('bg-blue-500', 'text-white');
    
    if (mode === 'friend') {
        playWithFriendBtn.classList.add('bg-blue-500', 'text-white');
    } else {
        playWithComputerBtn.classList.add('bg-blue-500', 'text-white');
    }
    
    resetGame();
}

// Event listeners
cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
});

resetScoreBtn.addEventListener('click', resetScores);
playWithFriendBtn.addEventListener('click', () => setGameMode('friend'));
playWithComputerBtn.addEventListener('click', () => setGameMode('computer'));

// Initialize game
resetGame(); 