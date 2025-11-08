// Fusion Command Palette JavaScript - Professional Chat Interface

// Conversation history management
let conversationHistory = [];
let debugData = {
    toolCalls: [],
    executionLog: [],
    rawData: []
};

// Settings management
let settings = {
    fontSize: 14,
    showToolCalls: false,
    showExecutionLog: false,
    showRawData: false,
    endpoint: 'local' // 'local' or 'staging'
};

// Authentication state
let authState = {
    isAuthenticated: false,
    user: null
};

// Example prompts with detailed instructions
const examplePrompts = [
    {
        title: "Build a mechanical gear assembly...",
        prompt: "Create a mechanical gear assembly with the following steps: First, create a base gear with 20 teeth, 5cm outer diameter, and 1cm thickness. Then create a second smaller gear with 10 teeth that meshes with the first gear. Add a central shaft hole of 1cm diameter to both gears. Apply a 0.2cm fillet to all sharp edges. Finally, position the gears so they mesh properly with appropriate spacing."
    },
    {
        title: "Design a parametric enclosure box...",
        prompt: "Design a parametric electronics enclosure box with these specifications: Create a rectangular base 15cm x 10cm x 3cm. Add mounting posts at each corner (0.5cm diameter, 2cm height). Create a matching lid that's 0.5cm thick with snap-fit tabs. Add ventilation slots (0.3cm x 3cm) on two sides. Apply 0.3cm fillets to all external edges for a smooth finish. Ensure all dimensions are parametric for easy modification."
    }
];

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('cadzeroSettings');
    if (saved) {
        settings = { ...settings, ...JSON.parse(saved) };
        updateFontSize(settings.fontSize);
        document.getElementById('fontSizeSlider').value = settings.fontSize;
        document.getElementById('fontSizeValue').textContent = settings.fontSize + 'px';
        
        // Update button states
        if (settings.showToolCalls) {
            document.getElementById('toolCallsBtn').classList.add('active');
            document.getElementById('toolCallsSection').classList.add('active');
        }
        if (settings.showExecutionLog) {
            document.getElementById('executionLogBtn').classList.add('active');
            document.getElementById('executionLogSection').classList.add('active');
        }
        if (settings.showRawData) {
            document.getElementById('rawDataBtn').classList.add('active');
            document.getElementById('rawDataSection').classList.add('active');
        }
        
        // Update endpoint toggle
        const toggle = document.getElementById('endpointToggle');
        if (toggle) {
            toggle.checked = settings.endpoint === 'staging';
            updateEndpointDisplay(settings.endpoint);
        }
    }
    
    // Sync with backend endpoint setting
    syncEndpointWithBackend();
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('cadzeroSettings', JSON.stringify(settings));
}

// Font size control
function updateFontSize(size) {
    settings.fontSize = parseInt(size);
    document.documentElement.style.setProperty('--font-size-base', size + 'px');
    document.getElementById('fontSizeValue').textContent = size + 'px';
    saveSettings();
}

// Debug section toggles
function toggleDebugSection(type) {
    const btn = document.getElementById(`${type}Btn`);
    const section = document.getElementById(`${type}Section`);
    
    if (section.classList.contains('active')) {
        section.classList.remove('active');
        btn.classList.remove('active');
        settings[`show${type.charAt(0).toUpperCase() + type.slice(1)}`] = false;
    } else {
        section.classList.add('active');
        btn.classList.add('active');
        settings[`show${type.charAt(0).toUpperCase() + type.slice(1)}`] = true;
    }
    saveSettings();
}

// Debug content toggle
function toggleDebugContent(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('active');
}

// Chat management
function addMessage(content, isUser = false, timestamp = null, addActions = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = content;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = timestamp || new Date().toLocaleTimeString();
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    
    // Add action buttons if requested
    if (addActions && !isUser) {
        addMessageActions(messageDiv);
    }
    
    scrollToBottom(chatMessages);
}

// Add user message with special styling
function addUserMessage(content) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Create user prompt section
    const userSection = document.createElement('div');
    userSection.className = 'chat-user-section';
    
    const userLabel = document.createElement('div');
    userLabel.className = 'chat-user-label';
    userLabel.textContent = 'USER';
    
    const userQuery = document.createElement('div');
    userQuery.className = 'chat-user-query';
    userQuery.textContent = content;
    
    userSection.appendChild(userLabel);
    userSection.appendChild(userQuery);
    chatMessages.appendChild(userSection);
    
    scrollToBottom(chatMessages);
}

// Add status bar message
function addStatusMessage(status = 'Complete', elapsed = null) {
    const chatMessages = document.getElementById('chatMessages');
    
    const statusDiv = document.createElement('div');
    statusDiv.className = 'chat-status-bar';
    statusDiv.id = 'currentStatusBar';
    
    const statusModel = document.createElement('span');
    statusModel.className = 'status-model';
    statusModel.textContent = 'CADZERO AI';
    
    const statusDivider = document.createElement('span');
    statusDivider.className = 'status-divider';
    statusDivider.textContent = '•';
    
    const statusText = document.createElement('span');
    statusText.className = 'status-time';
    statusText.textContent = elapsed ? `Ran for ${elapsed}s` : status;
    
    statusDiv.appendChild(statusModel);
    statusDiv.appendChild(statusDivider);
    statusDiv.appendChild(statusText);
    
    chatMessages.appendChild(statusDiv);
    scrollToBottom(chatMessages);
}

// Update status message
function updateStatusMessage(status, elapsed = null) {
    const statusBar = document.getElementById('currentStatusBar');
    if (statusBar) {
        const statusText = statusBar.querySelector('.status-time');
        if (statusText) {
            statusText.textContent = elapsed ? `Ran for ${elapsed}s` : status;
        }
    }
}

// Clear chat
function clearChat() {
    if (confirm('Clear all chat messages?')) {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) chatMessages.innerHTML = '';
        
        // Hide thinking box
        const thinkingBox = document.getElementById('thinkingBox');
        if (thinkingBox) thinkingBox.classList.add('hidden');
        
        conversationHistory = [];
        debugData = { toolCalls: [], executionLog: [], rawData: [] };
        updateDebugSections();
    }
}

// Export chat
function exportChat() {
    const messages = Array.from(document.querySelectorAll('.message')).map(msg => {
        const isUser = msg.classList.contains('user');
        const content = msg.querySelector('.message-text').textContent;
        const time = msg.querySelector('.message-time').textContent;
        return `${isUser ? 'User' : 'AI'} [${time}]: ${content}`;
    }).join('\n\n');
    
    const blob = new Blob([messages], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadzero-chat-export-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Update debug sections
function updateDebugSections() {
    // Update tool calls
    const toolCallsContent = document.getElementById('toolCallsContent');
    if (toolCallsContent) {
        toolCallsContent.innerHTML = debugData.toolCalls.map(call => 
            `<div>${JSON.stringify(call, null, 2)}</div>`
        ).join('<hr>') || '<div>No tool calls yet</div>';
    }
    
    // Update execution log
    const executionLogContent = document.getElementById('executionLogContent');
    if (executionLogContent) {
        executionLogContent.innerHTML = debugData.executionLog.map(log => 
            `<div>[${log.timestamp}] ${log.message}</div>`
        ).join('') || '<div>No execution log yet</div>';
    }
    
    // Update raw data
    const rawDataContent = document.getElementById('rawDataContent');
    if (rawDataContent) {
        rawDataContent.innerHTML = debugData.rawData.map(data => 
            `<div>${JSON.stringify(data, null, 2)}</div>`
        ).join('<hr>') || '<div>No raw data yet</div>';
    }
}

// Add debug log entry
function addDebugLog(message, type = 'executionLog') {
    debugData[type].push({
        timestamp: new Date().toLocaleTimeString(),
        message: message
    });
    updateDebugSections();
}

// Legacy functions for backward compatibility
function hideField(fieldId) {
    console.log('hideField called with:', fieldId);
}

function clearField(fieldId) {
    console.log('clearField called with:', fieldId);
}

function clearOutputs() {
    clearChat();
}

function reloadModules() {
    addDebugLog('Reloading modules...');
    console.log('Reloading modules...');
}

function reloadFusionIntf() {
    addDebugLog('Reloading Fusion Interface...');
    console.log('Reloading Fusion Interface...');
}

function playback() {
    addDebugLog('Starting playback...');
    console.log('Starting playback...');
}

function resize() {
    addDebugLog('Resizing interface...');
    console.log('Resize requested');
}

function reloadStyle() {
    addDebugLog('Reloading styles...');
    location.reload();
}

function reset() {
    if (confirm('Reset all settings to defaults?')) {
        localStorage.removeItem('cadzeroSettings');
        location.reload();
    }
}

function reconnect() {
    addDebugLog('Reconnecting to Fusion...');
    console.log('Reconnecting to Fusion...');
}

function uploadTools() {
    addDebugLog('Uploading tools...');
    console.log('Uploading tools...');
}

function startRecord() {
    addDebugLog('Starting recording...');
    console.log('Starting recording...');
}

function submit() {
    const input = document.getElementById('userInput');
    const submitBtn = document.getElementById('submitBtn');
    
    // Check if user is authenticated
    if (!authState.isAuthenticated) {
        addMessage('⚠️ Please sign in to use CADZERO AI', false);
        return;
    }
    
    if (!input || !input.value.trim()) {
        console.log('No input to submit');
        return;
    }
    
    const message = input.value.trim();
    input.value = ''; // Clear input immediately
    
    // Add user message to chat
    addUserMessage(message);
    
    // Add "Thinking" status
    addStatusMessage('Thinking');
    
    // Disable button during processing
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    // Add user message to conversation history
    conversationHistory.push({
        role: 'user',
        content: message
    });
    
    // Add debug log
    addDebugLog(`User message: ${message}`);
    
    // Show loading indicator
    showLoadingMessage();
    
    // Send chat message to backend via Fusion (non-blocking)
    const chatData = {
        action: 'chatMessage',
        message: message,
        history: conversationHistory,
        timestamp: new Date().toISOString()
    };
    
    // Store raw data for debug
    debugData.rawData.push({
        type: 'user_request',
        data: chatData,
        timestamp: new Date().toISOString()
    });
    updateDebugSections();
    
    // Check if adsk.fusionSendData is available
    if (typeof adsk === 'undefined' || typeof adsk.fusionSendData === 'undefined') {
        console.error('Fusion API not available');
        hideLoadingMessage();
        addMessage('❌ Error: Fusion API not available. Make sure this is running inside Fusion 360.', false);
        addDebugLog('Error: Fusion API not available', 'executionLog');
        
        // Re-enable button
        if (submitBtn) submitBtn.disabled = false;
        return;
    }
    
    adsk.fusionSendData('chatMessage', JSON.stringify(chatData))
        .then((result) => {
            hideLoadingMessage();
            console.log('Raw result:', result);
            
            try {
                const response = JSON.parse(result);
                console.log('Parsed response:', response);
                
                // Store raw response for debug
                debugData.rawData.push({
                    type: 'api_response',
                    data: response,
                    timestamp: new Date().toISOString()
                });
                updateDebugSections();
                
                if (response.success && response.status === 'processing') {
                    // Keep showing thinking box
                } else if (response.success) {
                    displayChatResponse(response);
                } else {
                    const errorMsg = response.error || 'Unknown error';
                    console.log('Error:', errorMsg);
                    addMessage(`❌ Error: ${errorMsg}`, false);
                    addDebugLog(`Error: ${errorMsg}`, 'executionLog');
                }
            } catch (e) {
                console.log('Parse error, showing raw result:', e);
                addMessage(`AI: ${result}`, false);
                addDebugLog(`Parse error: ${e.message}`, 'executionLog');
            }
            
            // Re-enable button
            if (submitBtn) submitBtn.disabled = false;
        })
        .catch((error) => {
            hideLoadingMessage();
            console.log('Request error:', error);
            addMessage(`❌ Error: ${error}`, false);
            addDebugLog(`Request error: ${error}`, 'executionLog');
            
            // Re-enable button
            if (submitBtn) submitBtn.disabled = false;
        });
}

// Show user prompt section (deprecated - now handled in chat)
function showUserPrompt(message) {
    // No longer used - user prompt is now part of chat history
    console.log('showUserPrompt called (deprecated)');
}

// Update status bar with timer
let statusStartTime = null;
let statusTimer = null;

function showLoadingMessage() {
    // Start timer
    statusStartTime = Date.now();
    updateStatusTimer();
    statusTimer = setInterval(updateStatusTimer, 1000);
    
    // Show thinking box with active animation
    const thinkingBox = document.getElementById('thinkingBox');
    if (thinkingBox) {
        thinkingBox.classList.remove('hidden');
        thinkingBox.classList.add('active');
        const thinkingText = thinkingBox.querySelector('.thinking-text');
        if (thinkingText) {
            thinkingText.textContent = 'Thinking...';
        }
    }
}

function updateStatusTimer() {
    if (!statusStartTime) return;
    
    const elapsed = Math.floor((Date.now() - statusStartTime) / 1000);
    // Timer is now handled in the thinking box
}

function hideLoadingMessage() {
    // Calculate elapsed time
    const elapsed = statusStartTime ? Math.floor((Date.now() - statusStartTime) / 1000) : 0;
    
    // Stop timer
    if (statusTimer) {
        clearInterval(statusTimer);
        statusTimer = null;
    }
    
    // Update thinking box to show thought duration
    const thinkingBox = document.getElementById('thinkingBox');
    if (thinkingBox && elapsed > 0) {
        thinkingBox.classList.remove('active');
        const thinkingText = thinkingBox.querySelector('.thinking-text');
        if (thinkingText) {
            thinkingText.textContent = `Thought for ${elapsed} second${elapsed !== 1 ? 's' : ''}`;
        }
        // Keep it visible but not animating
    } else if (thinkingBox) {
        thinkingBox.classList.add('hidden');
    }
    
    statusStartTime = null;
}

function displayChatResponse(response) {
    if (response.success) {
        let aiResponse = response.response;
        
        // If response is an object, try to extract message or code
        if (typeof aiResponse === 'object' && aiResponse !== null) {
            aiResponse = aiResponse.message || aiResponse.code || JSON.stringify(aiResponse);
        }
        
        // Fallback to response.message if response.response is empty
        if (!aiResponse || aiResponse === '') {
            aiResponse = response.message || response.code || 'No response text';
        }
        
        console.log('AI Response:', aiResponse);
        
        // Store tool calls for debug
        if (response.tool_calls && response.tool_calls.length > 0) {
            debugData.toolCalls.push(...response.tool_calls);
            addDebugLog(`Executed ${response.tool_calls.length} tool(s)`, 'executionLog');
        }
        
        // Update status bar to complete
        const elapsed = statusStartTime ? Math.floor((Date.now() - statusStartTime) / 1000) : null;
        updateStatusMessage('Complete', elapsed);
        
        // Display tool execution results if available
        if (response.execution_results && response.execution_results.length > 0) {
            addToolExecutionResults(response.execution_results);
        }
        
        // Add the main AI response with action buttons
        if (aiResponse) {
            addMessage(aiResponse, false, null, true);
            
            // Add assistant response to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: aiResponse
            });
        }
        
        updateDebugSections();
    } else {
        const errorMsg = response.error || 'Unknown error';
        console.log('Error:', errorMsg);
        addMessage(`❌ Error: ${errorMsg}`, false);
        addDebugLog(`Error: ${errorMsg}`, 'executionLog');
    }
}

// Add tool execution results with modern checkmark design
function addToolExecutionResults(executionResults) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant tool-execution';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Create tool results list
    const toolsList = document.createElement('div');
    toolsList.className = 'tools-list';
    
    executionResults.forEach((result, index) => {
        const toolItem = document.createElement('div');
        toolItem.className = `tool-item ${result.success ? 'success' : 'error'}`;
        
        const toolInfo = document.createElement('div');
        toolInfo.className = 'tool-info';
        
        const toolName = document.createElement('div');
        toolName.className = 'tool-name';
        // Display message if available, otherwise tool name
        toolName.textContent = result.message || result.tool_name;
        
        toolInfo.appendChild(toolName);
        
        const checkmark = document.createElement('div');
        checkmark.className = 'tool-checkmark';
        checkmark.innerHTML = result.success ? 
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' :
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        
        toolItem.appendChild(toolInfo);
        toolItem.appendChild(checkmark);
        toolsList.appendChild(toolItem);
        
        addDebugLog(`${result.success ? '✅' : '❌'} ${result.tool_name}: ${result.message}`, 'executionLog');
    });
    
    messageContent.appendChild(toolsList);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom(chatMessages);
}

// Add action buttons to a message
function addMessageActions(messageDiv) {
    const messageContent = messageDiv.querySelector('.message-content');
    if (!messageContent) return;
    
    // Check if actions already exist
    if (messageContent.querySelector('.message-actions')) return;
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    
    // Row 1: Checkpoint on left, View diff & Restore checkpoint on right
    const row1 = document.createElement('div');
    row1.className = 'message-actions-row';
    
    const checkpointBtn = document.createElement('button');
    checkpointBtn.className = 'message-action-btn';
    checkpointBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
        <span>Checkpoint</span>
    `;
    checkpointBtn.onclick = () => console.log('Checkpoint saved');
    
    // Right side group
    const rightGroup = document.createElement('div');
    rightGroup.className = 'message-actions-right';
    
    const viewDiffBtn = document.createElement('button');
    viewDiffBtn.className = 'message-action-btn';
    viewDiffBtn.textContent = 'View diff';
    viewDiffBtn.onclick = () => console.log('View diff');
    
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'message-action-btn';
    restoreBtn.textContent = 'Restore checkpoint';
    restoreBtn.onclick = () => console.log('Restore checkpoint');
    
    rightGroup.appendChild(viewDiffBtn);
    rightGroup.appendChild(restoreBtn);
    
    row1.appendChild(checkpointBtn);
    row1.appendChild(rightGroup);
    
    // Row 2: Vote buttons
    const voteBtns = document.createElement('div');
    voteBtns.className = 'message-vote-btns';
    
    const thumbsUpBtn = document.createElement('button');
    thumbsUpBtn.className = 'message-action-btn icon-only';
    thumbsUpBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
    `;
    thumbsUpBtn.onclick = () => console.log('Thumbs up');
    
    const thumbsDownBtn = document.createElement('button');
    thumbsDownBtn.className = 'message-action-btn icon-only';
    thumbsDownBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
        </svg>
    `;
    thumbsDownBtn.onclick = () => console.log('Thumbs down');
    
    voteBtns.appendChild(thumbsUpBtn);
    voteBtns.appendChild(thumbsDownBtn);
    
    actionsDiv.appendChild(row1);
    actionsDiv.appendChild(voteBtns);
    
    // Insert before the timestamp
    const messageTime = messageContent.querySelector('.message-time');
    if (messageTime) {
        messageContent.insertBefore(actionsDiv, messageTime);
    } else {
        messageContent.appendChild(actionsDiv);
    }
}

function scrollToBottom(element) {
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
    });
}

function closeWindow() {
    addDebugLog('Closing palette...');
    console.log('Close requested');
}

// Toggle thinking box expanded state
function toggleThinkingBox() {
    const thinkingBox = document.getElementById('thinkingBox');
    if (thinkingBox) {
        thinkingBox.classList.toggle('expanded');
    }
}

// Send command to Fusion (async to prevent blocking)
async function sendCommand(action, data = {}) {
    const commandData = {
        action: action,
        data: data,
        timestamp: new Date().toISOString()
    };
    
    try {
        const result = await adsk.fusionSendData("paletteCommand", JSON.stringify(commandData));
        addDebugLog(`Success: ${result}`);
        return result;
    } catch (error) {
        addDebugLog(`Error: ${error}`);
        throw error;
    }
}

// Send example prompt by index
function sendExamplePrompt(index) {
    console.log(`Example prompt ${index} clicked`);
    
    if (index < 0 || index >= examplePrompts.length) {
        console.error('Invalid example prompt index:', index);
        return;
    }
    
    const example = examplePrompts[index];
    const container = document.getElementById('examplePrompts');
    const bubbles = container.querySelectorAll('.example-bubble');
    const bubble = bubbles[index];
    
    if (bubble) {
        // Remove the bubble with animation
        bubble.style.animation = 'messageSlideOut 0.2s ease-out';
        setTimeout(() => bubble.remove(), 200);
        
        // If both bubbles are gone, hide the container
        setTimeout(() => {
            const remainingBubbles = container.querySelectorAll('.example-bubble');
            if (remainingBubbles.length === 0) {
                container.style.display = 'none';
            }
        }, 300);
    }
    
    // Auto-send the detailed prompt
    const input = document.getElementById('userInput');
    if (input) {
        input.value = example.prompt;
        setTimeout(() => submit(), 250);
    }
}

// New UI helper functions
function openSettings() {
    // Toggle debug sections visibility
    const toolCallsSection = document.getElementById('toolCallsSection');
    const executionLogSection = document.getElementById('executionLogSection');
    
    if (toolCallsSection) toolCallsSection.classList.toggle('hidden');
    if (executionLogSection) executionLogSection.classList.toggle('hidden');
}

function executeCurrentPrompt() {
    const userQuery = document.getElementById('userQuery');
    if (userQuery && userQuery.textContent) {
        const input = document.getElementById('userInput');
        if (input) {
            input.value = userQuery.textContent;
            submit();
        }
    }
}

function generateImages() {
    addMessage('🖼️ Image generation feature coming soon!', false);
}

// Auth modal functions
let authUrl = '';

function showAuthModal() {
    console.log('Showing auth modal...');
    
    // Get auth URL from config
    // Format: http://localhost:5173/sign-in?redirect_url=http://localhost:8765/
    const callbackUrl = 'http://localhost:8765/';
    const baseUrl = 'http://localhost:5173/sign-in'; // TODO: Get from backend based on endpoint
    authUrl = `${baseUrl}?redirect_url=${encodeURIComponent(callbackUrl)}`;
    
    console.log('Auth URL:', authUrl);
    
    // Update modal with URL
    const authModalLink = document.getElementById('authModalLink');
    if (authModalLink) {
        authModalLink.textContent = authUrl;
    }
    
    // Show modal
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.remove('hidden');
    }
    
    // Start waiting for callback
    startAuthCallback();
}

function closeAuthModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.classList.add('hidden');
    }
}

function openAuthInBrowser() {
    console.log('Opening auth URL in browser:', authUrl);
    
    // Try to open using window.open (may be blocked)
    const newWindow = window.open(authUrl, '_blank');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup blocked, show message
        alert('Pop-up blocked! Please allow pop-ups or copy the link manually.');
    } else {
        console.log('Browser window opened successfully');
    }
}

function copyAuthLink() {
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(authUrl)
            .then(() => {
                // Show success feedback
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                btn.style.background = 'var(--color-success)';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                alert('Failed to copy. Please select and copy the link manually.');
            });
    } else {
        // Fallback: try to select text
        const linkEl = document.getElementById('authModalLink');
        if (linkEl) {
            const range = document.createRange();
            range.selectNodeContents(linkEl);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            alert('Link selected. Press Ctrl+C (or Cmd+C) to copy.');
        }
    }
}

function startAuthCallback() {
    console.log('Starting auth callback listener...');
    
    // Tell backend to start listening for auth callback
    if (typeof adsk !== 'undefined' && typeof adsk.fusionSendData !== 'undefined') {
        adsk.fusionSendData('signIn', JSON.stringify({}))
            .then((result) => {
                console.log('Backend auth listener started:', result);
                const response = JSON.parse(result);
                
                if (response.success && response.status === 'processing') {
                    console.log('Backend is waiting for auth callback...');
                    addDebugLog('Waiting for authentication callback');
                }
            })
            .catch((error) => {
                console.error('Error starting auth listener:', error);
                addDebugLog('Error starting auth listener: ' + error);
            });
    } else {
        console.error('Fusion API not available');
        alert('Error: Fusion 360 API not available. Please restart the add-in.');
        closeAuthModal();
    }
}

// Initialize
window.addEventListener('load', function() {
    console.log('CADZERO AI initializing...');
    
    // Load settings
    loadSettings();
    
    // Check authentication status
    checkAuthStatus();
    
    // Add debug log
    addDebugLog('Application initialized');
    
    // Add Enter key support for input field (backup to inline handler)
    const input = document.getElementById('userInput');
    const submitBtn = document.getElementById('submitBtn');
    
    if (input) {
        // Enable/disable submit button based on input
        input.addEventListener('input', function(e) {
            if (submitBtn) {
                submitBtn.disabled = !e.target.value.trim();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            console.log('keydown event:', e.key, e.keyCode, e.which);
            if ((e.key === 'Enter' || e.keyCode === 13 || e.which === 13) && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Enter pressed, submitting...');
                submit();
                return false;
            }
        });
    }
    
    // Initialize debug sections
    updateDebugSections();
    
    console.log('CADZERO AI initialization complete');
});

// Endpoint management
function toggleEndpoint() {
    const toggle = document.getElementById('endpointToggle');
    const newEndpoint = toggle.checked ? 'staging' : 'local';
    
    // Update settings
    settings.endpoint = newEndpoint;
    saveSettings();
    
    // Update display
    updateEndpointDisplay(newEndpoint);
    
    // Send switch command to backend
    const switchData = {
        action: 'switchEndpoint',
        endpoint: newEndpoint,
        timestamp: new Date().toISOString()
    };
    
    adsk.fusionSendData('switchEndpoint', JSON.stringify(switchData))
        .then((result) => {
            console.log('Endpoint switched:', result);
            const response = JSON.parse(result);
            if (response.success) {
                addDebugLog(`Switched to ${newEndpoint} endpoint: ${response.url}`);
                addMessage(`🔄 Switched to ${newEndpoint.toUpperCase()} endpoint`, false);
            } else {
                addDebugLog(`Failed to switch endpoint: ${result}`);
                addMessage(`❌ Failed to switch endpoint`, false);
            }
        })
        .catch((error) => {
            console.log('Error switching endpoint:', error);
            addDebugLog(`Error switching endpoint: ${error}`);
        });
}

function updateEndpointDisplay(endpoint) {
    const statusLabel = document.getElementById('endpointStatus');
    const toggle = document.getElementById('endpointToggle');
    
    if (statusLabel) {
        if (endpoint === 'staging') {
            statusLabel.textContent = 'Staging';
            statusLabel.style.color = 'var(--color-success)';
        } else {
            statusLabel.textContent = 'Local';
            statusLabel.style.color = 'var(--color-text-muted)';
        }
    }
}

function syncEndpointWithBackend() {
    // Get current endpoint from backend
    const getData = {
        action: 'getEndpoint',
        timestamp: new Date().toISOString()
    };
    
    adsk.fusionSendData('getEndpoint', JSON.stringify(getData))
        .then((result) => {
            console.log('Current endpoint from backend:', result);
            const response = JSON.parse(result);
            if (response.success) {
                settings.endpoint = response.endpoint;
                const toggle = document.getElementById('endpointToggle');
                if (toggle) {
                    toggle.checked = response.endpoint === 'staging';
                    updateEndpointDisplay(response.endpoint);
                }
                addDebugLog(`Current endpoint: ${response.endpoint} (${response.url})`);
            }
        })
        .catch((error) => {
            console.log('Error getting endpoint:', error);
            addDebugLog(`Error getting endpoint: ${error}`);
        });
}

// Authentication functions
async function checkAuthStatus() {
    console.log('=== Checking authentication status ===');
    console.log('adsk available:', typeof adsk !== 'undefined');
    
    // Check if adsk is available
    if (typeof adsk === 'undefined' || typeof adsk.fusionSendData === 'undefined') {
        console.warn('Fusion API not yet available, will check auth status later');
        // Show not authenticated state
        updateAuthUI();
        
        // Try again after a delay
        setTimeout(() => {
            console.log('Retrying auth status check...');
            checkAuthStatus();
        }, 1000);
        return;
    }
    
    try {
        console.log('Calling getAuthStatus...');
        const result = await adsk.fusionSendData('getAuthStatus', JSON.stringify({}));
        console.log('getAuthStatus result:', result);
        
        const response = JSON.parse(result);
        console.log('Parsed auth response:', response);
        
        if (response.success && response.user) {
            authState.isAuthenticated = response.user.is_authenticated;
            authState.user = response.user;
            console.log('Auth status retrieved:', authState);
            updateAuthUI();
        } else {
            // Not authenticated
            console.log('Not authenticated');
            updateAuthUI();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        addDebugLog(`Error checking auth status: ${error}`);
        updateAuthUI();
    }
}

function updateAuthUI() {
    const container = document.querySelector('.container');
    const authSection = document.getElementById('authSection');
    const mainInterface = document.getElementById('mainInterface');
    const userInput = document.getElementById('userInput');
    const submitBtn = document.getElementById('submitBtn');
    
    if (authState.isAuthenticated && authState.user) {
        // User is authenticated - show main interface
        if (container) container.classList.remove('not-authenticated');
        if (authSection) authSection.classList.add('hidden');
        if (mainInterface) {
            mainInterface.classList.remove('hidden');
            mainInterface.style.display = 'flex';
        }
        
        // Update header with user info
        const headerUserName = document.getElementById('headerUserName');
        const headerUserEmail = document.getElementById('headerUserEmail');
        
        if (headerUserName) {
            headerUserName.textContent = authState.user.user_name || 'User';
        }
        if (headerUserEmail) {
            headerUserEmail.textContent = authState.user.user_email || '';
        }
        
        // Enable input
        if (userInput) {
            userInput.disabled = false;
        }
        if (submitBtn) submitBtn.disabled = false;
    } else {
        // User is not authenticated - show auth section only
        if (container) container.classList.add('not-authenticated');
        if (authSection) authSection.classList.remove('hidden');
        if (mainInterface) {
            mainInterface.classList.add('hidden');
            mainInterface.style.display = 'none';
        }
        
        // Disable input
        if (userInput) {
            userInput.disabled = true;
            userInput.value = '';
        }
        if (submitBtn) submitBtn.disabled = true;
    }
}

// Handle sign out from header button
async function handleSignOut() {
    if (!confirm('Are you sure you want to sign out?')) {
        return;
    }
    
    console.log('=== SIGN OUT FLOW STARTING ===');
    
    try {
        const result = await adsk.fusionSendData('signOut', JSON.stringify({}));
        const response = JSON.parse(result);
        
        if (response.success) {
            authState.isAuthenticated = false;
            authState.user = null;
            
            // Clear chat and reset UI
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) chatMessages.innerHTML = '';
            conversationHistory = [];
            
            updateAuthUI();
            addDebugLog('User signed out');
            console.log('Successfully signed out');
        } else {
            addDebugLog('Sign out failed: ' + (response.message || 'Unknown error'));
            console.error('Sign out failed:', response);
            alert('Sign out failed: ' + (response.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Sign out error:', error);
        addDebugLog('Sign out error: ' + error);
        alert('Sign out error: ' + error);
    }
}

async function handleAuthAction() {
    console.log('=== handleAuthAction CALLED ===');
    console.log('Auth state:', authState);
    
    if (authState.isAuthenticated) {
        // Sign out from auth section (shouldn't normally be visible)
        await handleSignOut();
    } else {
        // Sign in - show modal with auth link
        console.log('=== SIGN IN FLOW STARTING ===');
        showAuthModal();
    }
}

function showAuthLoadingState() {
    const authSection = document.getElementById('authSection');
    const authBtn = document.getElementById('authBtn');
    
    if (!authBtn || !authSection) return;
    
    // Disable button
    authBtn.disabled = true;
    authBtn.textContent = 'Authenticating...';
    
    // Show loading indicator in auth status
    const authStatus = document.getElementById('authStatus');
    if (authStatus) {
        authStatus.innerHTML = `
            <div class="auth-welcome">
                <div class="auth-welcome-title">
                    <div class="loader">
                        <div class="loader-dot"></div>
                        <div class="loader-dot"></div>
                        <div class="loader-dot"></div>
                    </div>
                </div>
                <div class="auth-welcome-subtitle">Opening browser for authentication...</div>
            </div>
        `;
    }
}

function hideAuthLoadingState() {
    const authSection = document.getElementById('authSection');
    const authBtn = document.getElementById('authBtn');
    const authStatus = document.getElementById('authStatus');
    
    if (!authBtn || !authSection) return;
    
    // Re-enable button
    authBtn.disabled = false;
    authBtn.textContent = 'Sign In';
    
    // Reset auth status to welcome message
    if (authStatus) {
        authStatus.innerHTML = `
            <div class="auth-welcome">
                <div class="auth-welcome-title">🔐 Welcome to CADZERO AI</div>
                <div class="auth-welcome-subtitle">Sign in to start using AI-powered CAD assistance</div>
            </div>
        `;
    }
}

// Handler for messages from Fusion
window.fusionJavaScriptHandler = {
    handle: function (action, data) {
        try {
            if (action === "updatePrompt") {
                addMessage(data, false);
            } else if (action === "commandResult") {
                const result = JSON.parse(data);
                addMessage(result.message || 'Command completed', false);
                addDebugLog(`Command result: ${result.message || 'Command completed'}`);
            } else if (action === "chatResponse") {
                // Handle asynchronous chat response
                console.log('Received chatResponse:', data);
                const response = JSON.parse(data);
                displayChatResponse(response);
            } else if (action === "authComplete") {
                // Handle authentication completion from async sign-in flow
                console.log('Received authComplete:', data);
                const response = JSON.parse(data);
                
                // Close auth modal
                closeAuthModal();
                hideAuthLoadingState();
                
                if (response.success && response.user) {
                    // Sign-in successful
                    authState.isAuthenticated = response.user.is_authenticated;
                    authState.user = response.user;
                    updateAuthUI();
                    addDebugLog('User signed in: ' + (response.user.user_email || 'user'));
                    console.log('Auth complete - signed in:', response.user.user_email);
                    
                    // Show success message briefly
                    // alert('✅ Successfully signed in as ' + (response.user.user_email || 'user'));
                } else {
                    // Sign-in failed
                    addDebugLog('Sign-in failed: ' + (response.message || 'Unknown error'));
                    console.error('Auth complete - sign-in failed:', response.message);
                    alert('❌ Sign-in failed: ' + (response.message || 'Unknown error'));
                }
            } else if (action === "debugger") {
                debugger;
            } else {
                console.log(`Unknown action: ${action}`);
                addDebugLog(`Unknown action: ${action}`);
                return `Unexpected command type: ${action}`;
            }
        } catch (e) {
            console.log(`Exception: ${e.message}`);
            addMessage(`Error: ${e.message}`, false);
            addDebugLog(`Exception: ${e.message}`);
        }
        return "OK";
    }
};

