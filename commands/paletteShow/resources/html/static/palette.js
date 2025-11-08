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
function addMessage(content, isUser = false, timestamp = null) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = isUser ? 'U' : 'AI';
    
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
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom(chatMessages);
}

// Clear chat
function clearChat() {
    if (confirm('Clear all chat messages?')) {
        document.getElementById('chatMessages').innerHTML = '';
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
    toolCallsContent.innerHTML = debugData.toolCalls.map(call => 
        `<div>${JSON.stringify(call, null, 2)}</div>`
    ).join('<hr>') || '<div>No tool calls yet</div>';
    
    // Update execution log
    const executionLogContent = document.getElementById('executionLogContent');
    executionLogContent.innerHTML = debugData.executionLog.map(log => 
        `<div>[${log.timestamp}] ${log.message}</div>`
    ).join('') || '<div>No execution log yet</div>';
    
    // Update raw data
    const rawDataContent = document.getElementById('rawDataContent');
    rawDataContent.innerHTML = debugData.rawData.map(data => 
        `<div>${JSON.stringify(data, null, 2)}</div>`
    ).join('<hr>') || '<div>No raw data yet</div>';
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
    
    if (!input || !input.value.trim()) {
        console.log('No input to submit');
        return;
    }
    
    const message = input.value.trim();
    input.value = ''; // Clear input immediately
    
    // Disable button during processing
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
    }
    
    // Add user message to chat
    addMessage(message, true);
    
    // Add user message to conversation history
    conversationHistory.push({
        role: 'user',
        content: message
    });
    
    // Add debug log
    addDebugLog(`User message: ${message}`);
    
    // Show loading indicator
    const loadingId = showLoadingMessage();
    
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
        hideLoadingMessage(loadingId);
        addMessage('❌ Error: Fusion API not available. Make sure this is running inside Fusion 360.', false);
        addDebugLog('Error: Fusion API not available', 'executionLog');
        
        // Re-enable button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send';
        }
        return;
    }
    
    adsk.fusionSendData('chatMessage', JSON.stringify(chatData))
        .then((result) => {
            hideLoadingMessage(loadingId);
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
                    addMessage('⏳ Processing your request...', false);
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
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send';
            }
        })
        .catch((error) => {
            hideLoadingMessage(loadingId);
            console.log('Request error:', error);
            addMessage(`❌ Error: ${error}`, false);
            addDebugLog(`Request error: ${error}`, 'executionLog');
            
            // Re-enable button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send';
            }
        });
}

function showLoadingMessage() {
    const loadingId = 'loading-' + Date.now();
    addMessage('Thinking...', false);
    return loadingId;
}

function hideLoadingMessage(loadingId) {
    // Remove the last message if it's a loading message
    const messages = document.querySelectorAll('.message');
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.querySelector('.message-text').textContent.includes('Thinking')) {
        lastMessage.remove();
    }
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
        
        // Build a single comprehensive response message
        let fullResponse = '';
        
        // Add execution results if available
        if (response.execution_results && response.execution_results.length > 0) {
            fullResponse += '🔧 Tool Execution Results:\n';
            response.execution_results.forEach((result, index) => {
                const statusIcon = result.success ? '✅' : '❌';
                fullResponse += `  ${statusIcon} ${result.tool_name}: ${result.message}\n`;
                addDebugLog(`${statusIcon} ${result.tool_name}: ${result.message}`, 'executionLog');
            });
            fullResponse += '\n';
        }
        
        // Add the main AI response
        if (aiResponse) {
            fullResponse += aiResponse;
            
            // Add assistant response to conversation history
            conversationHistory.push({
                role: 'assistant',
                content: aiResponse
            });
        }
        
        // Add tool call summary if available
        if (response.tool_calls && response.tool_calls.length > 0) {
            fullResponse += `\n\n📋 Executed ${response.tool_calls.length} tool(s)`;
        }
        
        // Display the single comprehensive response
        if (fullResponse.trim()) {
            addMessage(fullResponse, false);
        }
        
        updateDebugSections();
    } else {
        const errorMsg = response.error || 'Unknown error';
        console.log('Error:', errorMsg);
        addMessage(`❌ Error: ${errorMsg}`, false);
        addDebugLog(`Error: ${errorMsg}`, 'executionLog');
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

// Initialize
window.addEventListener('load', function() {
    console.log('CADZERO AI initializing...');
    
    // Load settings
    loadSettings();
    
    // Add welcome message
    addMessage('🚀 CADZERO AI Assistant initialized', false);
    addMessage('💡 Click an example below or type your own request', false);
    
    // Add debug log
    addDebugLog('Application initialized');
    
    // Add Enter key support for input field
    const input = document.getElementById('userInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submit();
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
