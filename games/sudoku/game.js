const grid = document.getElementById('sudokuGrid');
const newGameBtn = document.getElementById('newGameBtn');
const checkBtn = document.getElementById('checkBtn');
const difficultyElement = document.getElementById('difficulty');

let selectedCell = null;
let gameBoard = [];
let solution = [];
let difficulty = 'medium';

function generateSudoku() {
    // Initialize empty 9x9 grid
    gameBoard = Array(9).fill().map(() => Array(9).fill(0));
    solution = Array(9).fill().map(() => Array(9).fill(0));

    // Fill diagonal boxes first (they are independent)
    fillDiagonalBoxes();
    
    // Solve the rest of the puzzle
    solveSudoku(solution);
    
    // Copy solution to game board
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            gameBoard[i][j] = solution[i][j];
        }
    }

    // Remove numbers to create puzzle
    removeNumbers();
}

function fillDiagonalBoxes() {
    for (let box = 0; box < 9; box += 3) {
        fillBox(box, box);
    }
}

function fillBox(row, col) {
    let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const randomIndex = Math.floor(Math.random() * numbers.length);
            solution[row + i][col + j] = numbers[randomIndex];
            numbers.splice(randomIndex, 1);
        }
    }
}

function solveSudoku(board) {
    let row = -1;
    let col = -1;
    let isEmpty = true;

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === 0) {
                row = i;
                col = j;
                isEmpty = false;
                break;
            }
        }
        if (!isEmpty) break;
    }

    if (isEmpty) return true;

    for (let num = 1; num <= 9; num++) {
        if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
        }
    }
    return false;
}

function isValidPlacement(board, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }

    // Check 3x3 box
    let startRow = row - row % 3;
    let startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) return false;
        }
    }

    return true;
}

function removeNumbers() {
    const cellsToRemove = {
        'easy': 30,
        'medium': 40,
        'hard': 50
    }[difficulty];

    let removed = 0;
    while (removed < cellsToRemove) {
        let row = Math.floor(Math.random() * 9);
        let col = Math.floor(Math.random() * 9);
        if (gameBoard[row][col] !== 0) {
            gameBoard[row][col] = 0;
            removed++;
        }
    }
}

function createGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('input');
            cell.type = 'text';
            cell.maxLength = 1;
            cell.className = 'w-12 h-12 text-center text-xl font-bold bg-gray-600 border border-gray-500 rounded focus:outline-none focus:border-purple-500';
            
            if (gameBoard[i][j] !== 0) {
                cell.value = gameBoard[i][j];
                cell.readOnly = true;
                cell.classList.add('bg-gray-700');
            }

            // Add border styling for 3x3 boxes
            if (i % 3 === 0 && i !== 0) cell.classList.add('border-t-2');
            if (j % 3 === 0 && j !== 0) cell.classList.add('border-l-2');

            cell.dataset.row = i;
            cell.dataset.col = j;

            cell.addEventListener('click', () => {
                if (selectedCell) {
                    selectedCell.classList.remove('border-purple-500');
                }
                selectedCell = cell;
                cell.classList.add('border-purple-500');
            });

            cell.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value && !/^[1-9]$/.test(value)) {
                    e.target.value = '';
                }
            });

            grid.appendChild(cell);
        }
    }
}

function checkSolution() {
    const cells = grid.querySelectorAll('input');
    let isCorrect = true;
    let hasEmptyCells = false;

    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const value = parseInt(cell.value) || 0;

        if (value === 0) {
            hasEmptyCells = true;
        } else if (value !== solution[row][col]) {
            isCorrect = false;
            cell.classList.add('border-red-500');
        } else {
            cell.classList.remove('border-red-500');
        }
    });

    if (hasEmptyCells) {
        alert('Please fill in all cells before checking the solution.');
    } else if (isCorrect) {
        alert('Congratulations! You solved the puzzle!');
    } else {
        alert('Not quite right. Keep trying!');
    }
}

function startNewGame() {
    generateSudoku();
    createGrid();
}

function changeDifficulty(newDifficulty) {
    difficulty = newDifficulty;
    difficultyElement.textContent = newDifficulty.charAt(0).toUpperCase() + newDifficulty.slice(1);
    startNewGame();
}

newGameBtn.addEventListener('click', startNewGame);
checkBtn.addEventListener('click', checkSolution);

// Add difficulty buttons
const difficultyButtons = document.createElement('div');
difficultyButtons.className = 'flex justify-center space-x-4 mt-4';
['easy', 'medium', 'hard'].forEach(diff => {
    const button = document.createElement('button');
    button.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
    button.className = 'bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded';
    button.onclick = () => changeDifficulty(diff);
    difficultyButtons.appendChild(button);
});
document.querySelector('.max-w-2xl').appendChild(difficultyButtons);

// Start the game
startNewGame(); 