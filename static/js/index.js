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

// Display results
function displayResults(guessTokens, guessCost) {
    const stats = getAllModelStats(currentProblem);
    
    // Calculate average across all models
    const avgTotalTokens = stats.reduce((sum, m) => sum + m.total, 0) / stats.length;
    const avgCost = stats.reduce((sum, m) => sum + m.cost, 0) / stats.length;
    
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
    
    // Populate table
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
function recordGuess(guess) {
    guesses.push(guess);
    
    // Store in localStorage
    const storedGuesses = JSON.parse(localStorage.getItem('tokenGuesses') || '[]');
    storedGuesses.push(guess);
    localStorage.setItem('tokenGuesses', JSON.stringify(storedGuesses));
    
    console.log('Guess recorded:', guess);
}

// Initialize guessing game
function initGuessingGame() {
    loadCSVData();
    
    document.getElementById('startGame').addEventListener('click', () => {
        const problem = getRandomProblem();
        if (problem) {
            displayProblem(problem);
        }
    });
    
    document.getElementById('newProblem').addEventListener('click', () => {
        const problem = getRandomProblem();
        if (problem) {
            displayProblem(problem);
        }
    });
    
    document.getElementById('submitGuess').addEventListener('click', () => {
        const guessTokens = parseFloat(document.getElementById('guessTokens').value);
        const guessCost = parseFloat(document.getElementById('guessCost').value);
        
        if (isNaN(guessTokens) || isNaN(guessCost) || guessTokens < 0 || guessCost < 0) {
            alert('Please enter valid numbers for both tokens and cost.');
            return;
        }
        
        displayResults(guessTokens, guessCost);
    });
    
    document.getElementById('tryAnother').addEventListener('click', () => {
        const problem = getRandomProblem();
        if (problem) {
            displayProblem(problem);
        }
    });
}

$(document).ready(function() {
    // Check for click events on the navbar burger icon

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
	
    bulmaSlider.attach();
    
    // Setup video autoplay for carousel
    setupVideoCarouselAutoplay();
    
    // Initialize guessing game
    initGuessingGame();

})
