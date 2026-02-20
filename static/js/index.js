window.HELP_IMPROVE_VIDEOJS = false;

// More Works Dropdown Functionality
function toggleMoreWorks() {
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        button.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const container = document.querySelector('.more-works-container');
    const dropdown = document.getElementById('moreWorksDropdown');
    const button = document.querySelector('.more-works-btn');
    
    if (container && !container.contains(event.target)) {
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('moreWorksDropdown');
        const button = document.querySelector('.more-works-btn');
        dropdown.classList.remove('show');
        button.classList.remove('active');
    }
});

// Copy BibTeX to clipboard
function copyBibTeX() {
    const bibtexElement = document.getElementById('bibtex-code');
    const button = document.querySelector('.copy-bibtex-btn');
    const copyText = button.querySelector('.copy-text');
    
    if (bibtexElement) {
        navigator.clipboard.writeText(bibtexElement.textContent).then(function() {
            // Success feedback
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        }).catch(function(err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = bibtexElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            button.classList.add('copied');
            copyText.textContent = 'Cop';
            setTimeout(function() {
                button.classList.remove('copied');
                copyText.textContent = 'Copy';
            }, 2000);
        });
    }
}

// Scroll to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
    } else {
        scrollButton.classList.remove('visible');
    }
});

// Video carousel autoplay when in view
function setupVideoCarouselAutoplay() {
    const carouselVideos = document.querySelectorAll('.results-carousel video');
    
    if (carouselVideos.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                // Video is in view, play it
                video.play().catch(e => {
                    // Autoplay failed, probably due to browser policy
                    console.log('Autoplay prevented:', e);
                });
            } else {
                // Video is out of view, pause it
                video.pause();
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the video is visible
    });
    
    carouselVideos.forEach(video => {
        observer.observe(video);
    });
}

// Token Guessing Game
let csvData = [];
let predictionsData = [];
let currentProblem = null;
let guesses = [];

// Improved CSV parser that handles multi-line fields
function parseCSV(text) {
    const lines = [];
    let currentLine = '';
    let inQuotes = false;
    
    // First, properly split lines respecting quoted fields
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                currentLine += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
                currentLine += char;
            }
        } else if (char === '\n' && !inQuotes) {
            lines.push(currentLine);
            currentLine = '';
        } else {
            currentLine += char;
        }
    }
    if (currentLine) lines.push(currentLine);
    
    if (lines.length < 2) return [];
    
    // Parse headers
    const headers = parseCSVLine(lines[0]);
    const data = [];
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        const values = parseCSVLine(lines[i]);
        
        if (values.length >= headers.length) {
            const obj = {};
            headers.forEach((header, index) => {
                let value = values[index] || '';
                // Remove surrounding quotes if present
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1).replace(/""/g, '"');
                }
                obj[header.trim()] = value.trim();
            });
            data.push(obj);
        }
    }
    
    return data;
}

// Parse a single CSV line
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);
    
    return values;
}

// Load CSV data
async function loadCSVData() {
    try {
        // Try multiple possible paths
        const paths = [
            'success_subset_data.csv',
            '../success_subset_data.csv',
            './success_subset_data.csv'
        ];
        
        let response = null;
        for (const path of paths) {
            try {
                response = await fetch(path);
                if (response.ok) break;
            } catch (e) {
                continue;
            }
        }
        
        if (!response || !response.ok) {
            throw new Error('CSV file not found');
        }
        
        const text = await response.text();
        csvData = parseCSV(text);
        console.log(`Loaded ${csvData.length} problems`);
    } catch (error) {
        console.error('Error loading CSV:', error);
        alert('Error loading problem data. Please make sure success_subset_data.csv is accessible in the repository.');
    }
}

// Load predictions CSV data
async function loadPredictionsData() {
    try {
        const paths = [
            'all_models_averaged_predictions.csv',
            '../all_models_averaged_predictions.csv',
            './all_models_averaged_predictions.csv'
        ];
        
        let response = null;
        for (const path of paths) {
            try {
                response = await fetch(path);
                if (response.ok) break;
            } catch (e) {
                continue;
            }
        }
        
        if (!response || !response.ok) {
            console.warn('Predictions CSV not found, AI predictions will not be available');
            return;
        }
        
        const text = await response.text();
        predictionsData = parseCSV(text);
        console.log(`Loaded ${predictionsData.length} prediction records`);
    } catch (error) {
        console.error('Error loading predictions CSV:', error);
        // Don't alert, just log - predictions are optional
    }
}

// Get random problem
function getRandomProblem() {
    if (csvData.length === 0) {
        alert('No problems available. Please wait for data to load.');
        return null;
    }
    const randomIndex = Math.floor(Math.random() * csvData.length);
    return csvData[randomIndex];
}

// Calculate total tokens and cost for a model
function getModelStats(problem, modelPrefix) {
    const inputKey = `${modelPrefix}_avg_input_token`;
    const outputKey = `${modelPrefix}_avg_output_token`;
    const costKey = `${modelPrefix}_cost`;
    const roundsKey = `${modelPrefix}_avg_rounds`;
    
    const input = parseFloat(problem[inputKey]) || 0;
    const output = parseFloat(problem[outputKey]) || 0;
    const cost = parseFloat(problem[costKey]) || 0;
    const rounds = parseFloat(problem[roundsKey]) || 0;
    
    return {
        input,
        output,
        total: input + output,
        cost,
        rounds: Math.round(rounds)
    };
}

// Get all model stats
function getAllModelStats(problem) {
    const models = [
        { prefix: 'gpt5', name: 'GPT-5' },
        { prefix: 'gpt5.2', name: 'GPT-5.2' },
        { prefix: 'qwen', name: 'Qwen3-Coder' },
        { prefix: 'gemini', name: 'Gemini 3' },
        { prefix: 'kimi', name: 'Kimi K2' },
        { prefix: 'sonnet3-7', name: 'Sonnet 3.7' },
        { prefix: 'sonnet4', name: 'Sonnet 4' },
        { prefix: 'sonnet4-5', name: 'Sonnet 4.5' }
    ];
    
    return models.map(model => ({
        name: model.name,
        ...getModelStats(problem, model.prefix)
    })).filter(model => model.total > 0); // Only show models with data
}

// Display problem
function displayProblem(problem) {
    currentProblem = problem;
    document.getElementById('problemId').value = problem.problem_id || '';
    document.getElementById('problemStatement').value = problem.problem_statement || '';
    document.getElementById('guessTokens').value = '';
    document.getElementById('guessCost').value = '';
    
    document.getElementById('initialState').style.display = 'none';
    document.getElementById('problemDisplay').style.display = 'block';
    document.getElementById('resultsDisplay').style.display = 'none';
}

// Get AI predictions for a problem
function getAIPredictions(problemId) {
    const prediction = predictionsData.find(p => p.problem_id === problemId);
    if (!prediction) return null;
    
    const models = [
        { 
            name: 'Claude Sonnet 3.7',
            predInputKey: 'claude37sonnet_predicted_avg_input',
            predOutputKey: 'claude37sonnet_predicted_avg_output',
            predCostKey: 'claude37sonnet_predicted_avg_cost',
            actualInputKey: 'claude37sonnet_gt_input_token_avg',
            actualOutputKey: 'claude37sonnet_gt_output_token_avg',
            actualCostKey: 'claude37sonnet_gt_task_cost_avg'
        },
        {
            name: 'Gemini 3',
            predInputKey: 'gemini3_predicted_avg_input',
            predOutputKey: 'gemini3_predicted_avg_output',
            predCostKey: 'gemini3_predicted_avg_cost',
            actualInputKey: 'gemini3_gt_input_token_avg',
            actualOutputKey: 'gemini3_gt_output_token_avg',
            actualCostKey: 'gemini3_gt_task_cost_avg'
        },
        {
            name: 'GPT-5',
            predInputKey: 'gpt5_predicted_avg_input',
            predOutputKey: 'gpt5_predicted_avg_output',
            predCostKey: 'gpt5_predicted_avg_cost',
            actualInputKey: 'gpt5_gt_input_token_avg',
            actualOutputKey: 'gpt5_gt_output_token_avg',
            actualCostKey: 'gpt5_gt_task_cost_avg'
        },
        {
            name: 'GPT-5.2',
            predInputKey: 'gpt52_predicted_avg_input',
            predOutputKey: 'gpt52_predicted_avg_output',
            predCostKey: 'gpt52_predicted_avg_cost',
            actualInputKey: 'gpt52_gt_input_token_avg',
            actualOutputKey: 'gpt52_gt_output_token_avg',
            actualCostKey: 'gpt52_gt_task_cost_avg'
        },
        {
            name: 'Kimi K2',
            predInputKey: 'kimik2_predicted_avg_input',
            predOutputKey: 'kimik2_predicted_avg_output',
            predCostKey: 'kimik2_predicted_avg_cost',
            actualInputKey: 'kimik2_gt_input_token_avg',
            actualOutputKey: 'kimik2_gt_output_token_avg',
            actualCostKey: 'kimik2_gt_task_cost_avg'
        },
        {
            name: 'Qwen3-Coder',
            predInputKey: 'qwen3coder_predicted_avg_input',
            predOutputKey: 'qwen3coder_predicted_avg_output',
            predCostKey: 'qwen3coder_predicted_avg_cost',
            actualInputKey: 'qwen3coder_gt_input_token_avg',
            actualOutputKey: 'qwen3coder_gt_output_token_avg',
            actualCostKey: 'qwen3coder_gt_task_cost_avg'
        },
        {
            name: 'Sonnet 4.5',
            predInputKey: 'sonnet45_predicted_avg_input',
            predOutputKey: 'sonnet45_predicted_avg_output',
            predCostKey: 'sonnet45_predicted_avg_cost',
            actualInputKey: 'sonnet45_gt_input_token_avg',
            actualOutputKey: 'sonnet45_gt_output_token_avg',
            actualCostKey: 'sonnet45_gt_task_cost_avg'
        },
        {
            name: 'Sonnet 4',
            predInputKey: 'sonnet4base_predicted_avg_input',
            predOutputKey: 'sonnet4base_predicted_avg_output',
            predCostKey: 'sonnet4base_predicted_avg_cost',
            actualInputKey: 'sonnet4base_gt_input_token_avg',
            actualOutputKey: 'sonnet4base_gt_output_token_avg',
            actualCostKey: 'sonnet4base_gt_task_cost_avg'
        }
    ];
    
    return models.map(model => {
        const predInput = parseFloat(prediction[model.predInputKey]) || 0;
        const predOutput = parseFloat(prediction[model.predOutputKey]) || 0;
        const predTokens = predInput + predOutput;
        const predCost = parseFloat(prediction[model.predCostKey]) || 0;
        
        const actualInput = parseFloat(prediction[model.actualInputKey]) || 0;
        const actualOutput = parseFloat(prediction[model.actualOutputKey]) || 0;
        const actualTokens = actualInput + actualOutput;
        const actualCost = parseFloat(prediction[model.actualCostKey]) || 0;
        
        let tokenError = 0;
        let costError = 0;
        if (actualTokens > 0) {
            tokenError = ((Math.abs(predTokens - actualTokens) / actualTokens) * 100).toFixed(1);
        }
        if (actualCost > 0) {
            costError = ((Math.abs(predCost - actualCost) / actualCost) * 100).toFixed(1);
        }
        
        return {
            name: model.name,
            predTokens,
            predCost,
            actualTokens,
            actualCost,
            tokenError: parseFloat(tokenError),
            costError: parseFloat(costError)
        };
    }).filter(m => m.actualTokens > 0 || m.actualCost > 0);
}

// Count previous guesses for a problem
function countPreviousGuesses(problemId) {
    const storedGuesses = JSON.parse(localStorage.getItem('tokenGuesses') || '[]');
    return storedGuesses.filter(g => g.problemId === problemId).length;
}

// Calculate percentile ranking (lower error = better)
// "Top X%" means you're better than (100-X)% of people
function calculatePercentile(userError, allErrors) {
    if (allErrors.length === 0) return 50; // Default to middle if no data
    
    // Count how many people did worse (higher error)
    const worseCount = allErrors.filter(e => e > userError).length;
    // Percentile: percentage of people you beat
    const percentile = ((worseCount / allErrors.length) * 100).toFixed(1);
    return Math.max(0, Math.min(100, parseFloat(percentile)));
}

// Display results
function displayResults(guessTokens, guessCost) {
    const stats = getAllModelStats(currentProblem);
    
    // Calculate average across all models
    const avgTotalTokens = stats.reduce((sum, m) => sum + m.total, 0) / stats.length;
    const avgCost = stats.reduce((sum, m) => sum + m.cost, 0) / stats.length;
    
    // Calculate user's error
    const userTokenError = avgTotalTokens > 0 ? (Math.abs(guessTokens - avgTotalTokens) / avgTotalTokens) * 100 : 100;
    const userCostError = avgCost > 0 ? (Math.abs(guessCost - avgCost) / avgCost) * 100 : 100;
    const userCombinedError = (userTokenError + userCostError) / 2;
    
    // Count previous guesses
    const previousGuesses = countPreviousGuesses(currentProblem.problem_id);
    document.getElementById('previousGuessesCount').textContent = previousGuesses;
    
    // Calculate percentile (simulate with stored guesses)
    const storedGuesses = JSON.parse(localStorage.getItem('tokenGuesses') || '[]');
    const allErrors = storedGuesses.map(g => {
        if (g.actualAvgTokens > 0 && g.actualAvgCost > 0) {
            const tokenErr = (Math.abs(g.guessTokens - g.actualAvgTokens) / g.actualAvgTokens) * 100;
            const costErr = (Math.abs(g.guessCost - g.actualAvgCost) / g.actualAvgCost) * 100;
            return (tokenErr + costErr) / 2;
        }
        return 100;
    });
    
    const percentile = calculatePercentile(userCombinedError, allErrors);
    document.getElementById('userPercentile').textContent = `Top ${percentile}%`;
    document.getElementById('userGuessSummary').textContent = `${guessTokens.toLocaleString()} tokens, $${guessCost.toFixed(2)}`;
    
    // Show comparison
    const tokenDiff = Math.abs(guessTokens - avgTotalTokens);
    const costDiff = Math.abs(guessCost - avgCost);
    const tokenPercent = ((tokenDiff / avgTotalTokens) * 100).toFixed(1);
    const costPercent = ((costDiff / avgCost) * 100).toFixed(1);
    
    let comparisonClass = 'is-info';
    if (tokenPercent < 20 && costPercent < 20) {
        comparisonClass = 'is-success';
    } else if (tokenPercent > 50 || costPercent > 50) {
        comparisonClass = 'is-warning';
    }
    
    document.getElementById('guessComparison').className = `notification ${comparisonClass}`;
    document.getElementById('guessComparison').innerHTML = `
        <strong>Your Guess vs. Average:</strong><br>
        Tokens: ${guessTokens.toLocaleString()} (actual: ${avgTotalTokens.toLocaleString()}, difference: ${tokenPercent}%)<br>
        Cost: $${guessCost.toFixed(2)} (actual: $${avgCost.toFixed(2)}, difference: ${costPercent}%)
    `;
    
    // Display AI predictions
    const aiPredictions = getAIPredictions(currentProblem.problem_id);
    const aiTbody = document.getElementById('aiPredictionsTableBody');
    aiTbody.innerHTML = '';
    
    if (aiPredictions && aiPredictions.length > 0) {
        aiPredictions.forEach(pred => {
            const row = document.createElement('tr');
            const avgError = ((pred.tokenError + pred.costError) / 2).toFixed(1);
            row.innerHTML = `
                <td><strong>${pred.name}</strong></td>
                <td>${pred.predTokens.toLocaleString()}</td>
                <td>$${pred.predCost.toFixed(4)}</td>
                <td>${pred.actualTokens.toLocaleString()}</td>
                <td>$${pred.actualCost.toFixed(4)}</td>
                <td><strong>${avgError}%</strong></td>
            `;
            aiTbody.appendChild(row);
        });
    } else {
        aiTbody.innerHTML = '<tr><td colspan="6" class="has-text-centered">AI predictions not available for this problem</td></tr>';
    }
    
    // Populate actual results table
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    
    stats.forEach(model => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${model.name}</strong></td>
            <td>${model.input.toLocaleString()}</td>
            <td>${model.output.toLocaleString()}</td>
            <td><strong>${model.total.toLocaleString()}</strong></td>
            <td>${model.rounds}</td>
            <td><strong>$${model.cost.toFixed(4)}</strong></td>
        `;
        tbody.appendChild(row);
    });
    
    // Record guess
    recordGuess({
        problemId: currentProblem.problem_id,
        guessTokens: guessTokens,
        guessCost: guessCost,
        actualAvgTokens: avgTotalTokens,
        actualAvgCost: avgCost,
        timestamp: new Date().toISOString()
    });
    
    document.getElementById('problemDisplay').style.display = 'none';
    document.getElementById('resultsDisplay').style.display = 'block';
}

// Record guess
async function recordGuess(guess) {
    guesses.push(guess);
    
    // Store in localStorage
    const storedGuesses = JSON.parse(localStorage.getItem('tokenGuesses') || '[]');
    storedGuesses.push(guess);
    localStorage.setItem('tokenGuesses', JSON.stringify(storedGuesses));
    
    console.log('Guess recorded:', guess);
    
    // Save to Google Sheets (optional - won't break if it fails)
    try {
        await saveGuessToGoogleSheets(guess);
    } catch (error) {
        console.error('Failed to save to Google Sheets:', error);
        // Don't show error to user, just log it
    }
}

// Save guess to Google Sheets via Apps Script
async function saveGuessToGoogleSheets(guess) {
    // Google Apps Script web app URL
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwz_G-iDXs31FJojcDwvyuZ0cRk4gn3DstIU0UF62rUeOJKu1lqC_XO1H1NDrQa8AnX/exec';
    
    const formData = new FormData();
    formData.append('problemId', guess.problemId || '');
    formData.append('guessTokens', guess.guessTokens || '');
    formData.append('guessCost', guess.guessCost || '');
    formData.append('actualAvgTokens', guess.actualAvgTokens || '');
    formData.append('actualAvgCost', guess.actualAvgCost || '');
    formData.append('timestamp', guess.timestamp || new Date().toISOString());
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.text();
}

// Update leaderboard
function updateLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboardTableBody');
    if (!leaderboardBody) {
        return; // Not on the leaderboard page
    }
    
    const storedGuesses = JSON.parse(localStorage.getItem('tokenGuesses') || '[]');
    
    if (storedGuesses.length === 0) {
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="9" class="has-text-centered">
                    <p class="is-size-6">No guesses yet. <a href="game.html" target="_blank">Play the game</a> to see your predictions here!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Calculate errors for each guess and sort by combined error (ascending = best first)
    const guessesWithErrors = storedGuesses.map(guess => {
        const tokenError = guess.actualAvgTokens > 0 
            ? (Math.abs(guess.guessTokens - guess.actualAvgTokens) / guess.actualAvgTokens) * 100 
            : 100;
        const costError = guess.actualAvgCost > 0 
            ? (Math.abs(guess.guessCost - guess.actualAvgCost) / guess.actualAvgCost) * 100 
            : 100;
        const combinedError = (tokenError + costError) / 2;
        
        return {
            ...guess,
            tokenError: parseFloat(tokenError.toFixed(2)),
            costError: parseFloat(costError.toFixed(2)),
            combinedError: parseFloat(combinedError.toFixed(2))
        };
    });
    
    // Sort by combined error (ascending)
    guessesWithErrors.sort((a, b) => a.combinedError - b.combinedError);
    
    // Take top 50
    const topGuesses = guessesWithErrors.slice(0, 50);
    
    leaderboardBody.innerHTML = topGuesses.map((guess, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? 'has-text-weight-bold' : '';
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
        
        return `
            <tr>
                <td class="${rankClass}">${medal} ${rank}</td>
                <td>${guess.problemId || 'N/A'}</td>
                <td>${guess.guessTokens ? guess.guessTokens.toLocaleString() : 'N/A'}</td>
                <td>${guess.actualAvgTokens ? guess.actualAvgTokens.toLocaleString() : 'N/A'}</td>
                <td>$${guess.guessCost ? guess.guessCost.toFixed(4) : 'N/A'}</td>
                <td>$${guess.actualAvgCost ? guess.actualAvgCost.toFixed(4) : 'N/A'}</td>
                <td>${guess.tokenError.toFixed(2)}%</td>
                <td>${guess.costError.toFixed(2)}%</td>
                <td class="${rankClass}"><strong>${guess.combinedError.toFixed(2)}%</strong></td>
            </tr>
        `;
    }).join('');
}

// Initialize guessing game
function initGuessingGame() {
    // Check if elements exist
    const startBtn = document.getElementById('startGame');
    if (!startBtn) {
        console.log('Start game button not found - not on game page');
        return;
    }
    
    // Add click handler immediately (even before CSV loads)
    startBtn.addEventListener('click', () => {
        console.log('Start game button clicked');
        if (csvData.length === 0) {
            alert('Loading problem data... Please wait a moment and try again.');
            // Try to load data if not loaded yet
            loadCSVData().then(() => {
                const problem = getRandomProblem();
                if (problem) {
                    displayProblem(problem);
                } else {
                    alert('No problems available. Please refresh the page.');
                }
            }).catch(() => {
                alert('Error loading problem data. Please refresh the page.');
            });
            return;
        }
        const problem = getRandomProblem();
        if (problem) {
            displayProblem(problem);
        } else {
            alert('No problems available. Please wait for data to load or refresh the page.');
        }
    });
    
    // Load both CSV files
    Promise.all([loadCSVData(), loadPredictionsData()]).then(() => {
        console.log('CSV data loaded successfully');
        
        // New problem button
        const newProblemBtn = document.getElementById('newProblem');
        if (newProblemBtn) {
            newProblemBtn.addEventListener('click', () => {
                const problem = getRandomProblem();
                if (problem) {
                    displayProblem(problem);
                } else {
                    alert('No problems available. Please wait for data to load.');
                }
            });
        }
        
        // Submit guess button
        const submitBtn = document.getElementById('submitGuess');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const guessTokens = parseFloat(document.getElementById('guessTokens').value);
                const guessCost = parseFloat(document.getElementById('guessCost').value);
                
                if (isNaN(guessTokens) || isNaN(guessCost) || guessTokens < 0 || guessCost < 0) {
                    alert('Please enter valid numbers for both tokens and cost.');
                    return;
                }
                
                displayResults(guessTokens, guessCost);
            });
        }
        
        // Try another button
        const tryAnotherBtn = document.getElementById('tryAnother');
        if (tryAnotherBtn) {
            tryAnotherBtn.addEventListener('click', () => {
                const problem = getRandomProblem();
                if (problem) {
                    displayProblem(problem);
                } else {
                    alert('No problems available. Please wait for data to load.');
                }
            });
        }
    }).catch(error => {
        console.error('Error initializing guessing game:', error);
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                alert('Error loading problem data. Please refresh the page.');
            });
        }
    });
}

// Initialize when DOM is ready (works with or without jQuery)
function initializePage() {
    // Check for click events on the navbar burger icon

    // Initialize carousel if it exists
    if (typeof bulmaCarousel !== 'undefined') {
        var options = {
            slidesToScroll: 1,
            slidesToShow: 1,
            loop: true,
            infinite: true,
            autoplay: true,
            autoplaySpeed: 5000,
        }
        // Initialize all div with carousel class
        var carousels = bulmaCarousel.attach('.carousel', options);
    }
	
    // Initialize slider if it exists
    if (typeof bulmaSlider !== 'undefined') {
        bulmaSlider.attach();
    }
    
    // Setup video autoplay for carousel if function exists
    if (typeof setupVideoCarouselAutoplay === 'function') {
        setupVideoCarouselAutoplay();
    }
    
    // Initialize guessing game (only if on game page)
    initGuessingGame();
    
    // Update leaderboard (only if on main page)
    updateLeaderboard();
    
    // Listen for storage changes to update leaderboard when guesses are made in another tab/window
    window.addEventListener('storage', (e) => {
        if (e.key === 'tokenGuesses') {
            updateLeaderboard();
        }
    });
    
    // Update leaderboard when page becomes visible (user returns from game page)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            updateLeaderboard();
        }
    });
    
    // Also update on focus (when user switches back to this tab)
    window.addEventListener('focus', () => {
        updateLeaderboard();
    });
}

// Use jQuery if available, otherwise use DOMContentLoaded
if (typeof $ !== 'undefined') {
    $(document).ready(initializePage);
} else {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePage);
    } else {
        // DOM is already ready
        initializePage();
    }
}
