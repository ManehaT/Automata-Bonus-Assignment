// Navigation switching logic
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".feature-section");

// Default: show Language Generator
showSection("generator");

navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.section;
        showSection(target);
    });
});

function showSection(id) {
    // hide all sections
    sections.forEach(sec => sec.classList.add("hidden"));

    // show one
    document.getElementById(id).classList.remove("hidden");

    // remove active class
    navButtons.forEach(b => b.classList.remove("nav-active"));

    // add active styling
    document.querySelectorAll(`[data-section="${id}"]`).forEach(b => {
        b.classList.add("nav-active");
    });
}


// i shud probably use a backend proxy BUT I DONT HAVE TIME
const GROQ_API_KEY = "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"; 
const API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const generateBtn = document.getElementById('generate-btn');
const descriptionInput = document.getElementById('language-description');
const outputTypeSelect = document.getElementById('output-type');
const resultOutput = document.getElementById('result-output');

generateBtn.addEventListener('click', async () => {
    const description = descriptionInput.value.trim();
    const type = outputTypeSelect.value;

    if (description === "") {
        resultOutput.innerHTML = "<span class='text-red-400'>Please describe the language first.</span>";
        return;
    }
    
    // Check if the key is the placeholder
    if (GROQ_API_KEY === "YOUR_GROQ_API_KEY") {
        resultOutput.innerHTML = "<span class='text-red-400'>ERROR: Please replace 'YOUR_GROQ_API_KEY' in app.js with a valid key to enable real-time generation.</span>";
        return;
    }

    // 1. Show Loading State
    resultOutput.innerHTML = "Generating... Please wait.";
    generateBtn.disabled = true;

    // 2. Craft the System Prompt for the LLM
    const systemPrompt = `You are an expert in the Theory of Automata and Formal Languages. Your task is to generate the specified formal definition based on the user's plain English description. Provide ONLY the formal definition, do not include any extra text, explanations, or conversational fillers.
If the user asks for a Regular Expression (RE), provide only the RE string.
If the user asks for a Context-Free Grammar (CFG), provide the rules one per line, separated by newline characters.
If the user asks for a DFA description, provide the formal 5-tuple description (Q, \u03A3, \u03B4, q0, F) with transitions clearly listed.`;
    
    const userMessage = `Language Description: "${description}". Generate the corresponding ${type} for this language.`;

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // model: 'llama3-8b-8192', // didnt work
                // model: 'mixtral-8x7b-32768', // didnt work
                // model: 'llama3-70b-8192', // didnt work
                model: 'llama-3.3-70b-versatile', // worked hehe
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.1, 
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error ${response.status}: ${errorData.error.message}`);
        }

        const data = await response.json();
        
        // Extract the LLM's response text
        const llmOutput = data.choices[0].message.content.trim();

        // 3. Display Result
        resultOutput.textContent = `// Language: ${description}\n// Formalism: ${type.toUpperCase()}\n\n${llmOutput}`;

    } catch (error) {
        console.error("LLM Generation Failed:", error);
        resultOutput.innerHTML = `<span class='text-red-400'>Error: Could not connect to LLM. Please check your API key, network, and ensure the key is enabled. Details: ${error.message}</span>`;
    } finally {
        // Reset Button
        generateBtn.disabled = false;
    }
});


// --- CYK Visualizer Logic (MOCK CYK) ---
const runCykBtn = document.getElementById('run-cyk-btn');
const cykGrammarInput = document.getElementById('cyk-grammar');
const cykStringInput = document.getElementById('cyk-string');
const visualizationContainer = document.getElementById('cyk-visualization-container');

// A highly simplified mock CYK function for prototyping
function mockRunCYK(grammar, targetString) {
    const N = targetString.length;
    let accepted = false;

    // SIMPLIFIED LOGIC: Accept only if the string length is between 3 and 7.
    if (N >= 3 && N <= 7) {
        accepted = true;
    }

    // Generate a mock table for visual effect
    const mockTable = [];
    
    // Bottom row (length 1)
    if (N > 0) {
        const baseRow = targetString.split('').map(char => [char.toUpperCase()]);
        mockTable.push(baseRow);
    }
    

    // Middle/Top rows (just fill with non-terminal placeholders)
    for (let i = 2; i <= N; i++) {
        const row = [];
        for (let j = 0; j <= N - i; j++) {
             // For the very top cell (i==N), use 'S' if accepted, or 'Empty' if rejected
            if (i === N && j === 0) {
                row.push(accepted ? ['S'] : ['Empty']);
            } else {
                row.push(['A', 'B']); // Non-terminal placeholder
            }
        }
        mockTable.push(row);
    }

    return {
        accepted: accepted,
        table: mockTable,
        cnf: ['S -> AB | BC', 'A -> BA | a'] // Mock CNF rules
    };
}

// Function to render the table
function renderCYKTable(result, targetString) {
    const statusClass = result.accepted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
    const statusText = result.accepted ? 'ACCEPTED' : 'REJECTED';
    
    // Reverse the table data to render the pyramid from bottom (length 1) to top (length N)
    const reversedTable = [...result.table].reverse();

    let tableHTML = `
        <div class="bg-pink-900/50 rounded-xl border border-pink-700 shadow-lg overflow-hidden flex flex-col h-full">
            <div class="p-4 border-b border-pink-700 bg-pink-900/80 backdrop-blur flex justify-between items-center">
                <h3 class="font-semibold text-white">Parsing Table (Mock)</h3>
                <div class="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${statusClass}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        ${result.accepted ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'}
                    </svg>
                    ${statusText}
                </div>
            </div>
            
            <div class="p-6 overflow-x-auto bg-pink-900/70 flex-1 flex flex-col justify-end min-h-[400px]">
                <div class="flex flex-col items-center gap-2">
    `;

    // Render the pyramid cells
    reversedTable.forEach((row, rowIndex) => {
        tableHTML += `<div class="flex gap-2 justify-center">`;
        row.forEach((cell, colIndex) => {
            const isTopCell = (result.table.length - 1 - rowIndex) === result.table.length - 1;
            const highlightClass = isTopCell && result.accepted && cell.includes('S') ? 'ring-2 ring-green-500 bg-green-500/20 text-green-300' : '';
            const cellContent = cell.length > 0 && cell[0] !== 'Empty' ? cell.join(',') : '∅';
            const cellColor = cellContent !== '∅' ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200' : 'bg-pink-800 border-pink-700 text-pink-600';

            tableHTML += `
                <div 
                    class="w-16 h-16 flex items-center justify-center rounded-lg border-2 text-sm font-bold shadow-sm cursor-default ${cellColor} ${highlightClass}"
                    title="Length: ${result.table.length - rowIndex}, Start: ${colIndex + 1}"
                >
                    ${cellContent}
                </div>
            `;
        });
        tableHTML += `</div>`;
    });

    tableHTML += `
                </div>
                
                <div class="flex justify-center gap-2 mt-4 pt-4 border-t border-pink-700/50">
                  ${targetString.split('').map(char => `<div class="w-16 text-center font-mono text-pink-400 font-bold text-lg">${char}</div>`).join('')}
                </div>
            </div>

            <div class="p-4 bg-pink-900 border-t border-pink-700">
                <p class="text-xs text-pink-500 font-mono mb-2">MOCK CNF USED:</p>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-pink-400 font-mono">
                  ${result.cnf.map(rule => `<span>${rule}</span>`).join('')}
                </div>
            </div>
        </div>
    `;

    return tableHTML;
}

runCykBtn.addEventListener('click', () => {
    const grammar = cykGrammarInput.value.trim();
    const targetString = cykStringInput.value.trim();

    if (!grammar || !targetString) {
        visualizationContainer.innerHTML = `<div class="text-red-400">Please enter both grammar and string.</div>`;
        return;
    }
    
    // Check if string is empty
    if (targetString.length === 0) {
        visualizationContainer.innerHTML = `<div class="text-red-400">Target string cannot be empty.</div>`;
        return;
    }

    // 1. Show Loading State
    runCykBtn.innerHTML = `<span class="animate-pulse">Processing...</span>`;
    runCykBtn.disabled = true;

    // 2. Run Mock CYK Algorithm (Simulating a delay)
    setTimeout(() => {
        const result = mockRunCYK(grammar, targetString);
        
        // 3. Display Result and Reset
        visualizationContainer.innerHTML = renderCYKTable(result, targetString);
        runCykBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run Algorithm`;
        runCykBtn.disabled = false;
    }, 1000); // 1 second delay
});