// Ensure HotkeyParser is available. If in browser, it might be via a <script> tag or another JS file.
// For a modular approach (e.g., using ES modules), you would use:
// import HotkeyParser from './HotkeyParser.js';

class VirtualEnvManager {
    constructor(BUFFER_TIMEOUT_MS=10000) {
        this.environments = {}; // { envName: { tag: 'tagForEnv', hotkeys: [], isActive: false, name: 'envName' } }
        this.activeEnvironmentName = null;
        this.textBuffer = ""
        this.bufferTimeoutId = null;
        this.BUFFER_TIMEOUT_MS = BUFFER_TIMEOUT_MS; // 10 segundos para o buffer de tag
        // Removed keyCaptureBuffer and keyCaptureTimeoutId as the new textBuffer logic is simpler

        // Bind methods
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._initEventListeners();
        console.log("VirtualEnvManager initialized");
    }

    _initEventListeners() {
        document.addEventListener('keydown', this._handleKeyDown);
    }

    _isInputElement(element) {
        if (!element) return false;
        const tagName = element.tagName.toUpperCase();
        return tagName === 'INPUT' || tagName === 'TEXTAREA' || element.isContentEditable;
    }

    _handleKeyDown(event) {
        if (this._isInputElement(event.target)) {
            return; // Ignore if typing in an input field
        }

        // 1. Process for hotkeys in the active environment
        const pressedCombination = HotkeyParser.eventToCombination(event);
        // console.log("Pressed combination (raw from event):");
        // console.dir(event);
        // console.log(`Normalized pressed combination: ${pressedCombination}`);


        if (pressedCombination && this.activeEnvironmentName && this.environments[this.activeEnvironmentName]) {
            const activeEnv = this.environments[this.activeEnvironmentName];
            if (activeEnv.isActive && activeEnv.hotkeys) {
                for (const hotkey of activeEnv.hotkeys) {
                    if (hotkey.normalizedCombination === pressedCombination) {
                        // console.log(`Hotkey match: ${pressedCombination} for env ${this.activeEnvironmentName}`);
                        event.preventDefault(); // Prevent default browser action for the hotkey
                        event.stopPropagation(); // Stop event from bubbling up
                        try {
                            hotkey.callback(...hotkey.callbackArgs);
                        } catch (e) {
                            console.error(`Error executing hotkey callback for ${pressedCombination}:`, e);
                        }
                        return; // Hotkey processed, no need to check for tag buffer for this event
                    }
                }
            }
        }

        // 2. Process for tag buffer (only if no hotkey was matched and it's a character key)
        // Modifier keys (Ctrl, Alt, Shift, Meta) or functional keys (F1-F12, Enter, Tab etc.) 
        // should not typically contribute to the tag buffer unless explicitly designed for.
        // event.key.length === 1 is a good heuristic for printable characters.
        // We also allow backspace to modify the buffer.
        if (event.key.length === 1 || event.key === 'Backspace') { 
            // Prevent tag buffer input if a modifier is pressed, unless it's part of a hotkey handled above
            if (event.ctrlKey || event.altKey || event.metaKey) {
                // Allow Shift + character for typing uppercase letters into buffer
                if (!event.shiftKey || event.key.length !== 1) {
                    return;
                }
            }
            this._updateTextBuffer(event.key);
        }
    }

    _updateTextBuffer(key) {
        if (this.bufferTimeoutId) {
            clearTimeout(this.bufferTimeoutId);
        }

        if (key === 'Backspace') {
            this.textBuffer = this.textBuffer.slice(0, -1);
        } else if (key.length === 1) { // Only add single characters to buffer
            this.textBuffer += key; // Case-sensitive as requested
        }

        // console.log(`Current textBuffer: ${this.textBuffer}`);

        if (this.textBuffer.length === 0) {
            this.bufferTimeoutId = null;
            return;
        }

        // Check for environment tag match
        for (const envName in this.environments) {
            if (this.environments[envName].tag === this.textBuffer) {
                this.setActiveEnvironmentByName(envName);
                // this.textBuffer = ''; // Clear buffer after successful switch - already done in setActiveEnvironmentByName
                // clearTimeout(this.bufferTimeoutId); // also done in setActiveEnvironmentByName
                // this.bufferTimeoutId = null;
                return; // Exit after successful switch
            }
        }

        // Reset buffer if no match after timeout
        this.bufferTimeoutId = setTimeout(() => {
            // console.log("Text buffer timed out, clearing.");
            this.textBuffer = '';
            this.bufferTimeoutId = null;
        }, this.BUFFER_TIMEOUT_MS);
    }

    createEnvironment(name, tag) {
        if (typeof name !== 'string' || name.trim() === '') {
            console.error("Environment name must be a non-empty string.");
            return false;
        }
        if (typeof tag !== 'string' || tag.trim() === '') {
            console.error("Environment tag must be a non-empty string.");
            return false;
        }
        if (this.environments[name]) {
            console.warn(`Environment with name '${name}' already exists.`);
            return false;
        }
        for (const envKey in this.environments) {
            if (this.environments[envKey].tag === tag) {
                console.warn(`Environment tag '${tag}' is already in use by environment '${envKey}'.`);
                return false;
            }
        }

        this.environments[name] = {
            name: name,
            tag: tag,
            hotkeys: [],
            isActive: false
        };
        // console.log(`Environment '${name}' created with tag '${tag}'.`);
        return true;
    }

    setActiveEnvironmentByName(name) {
        if (!this.environments[name]) {
            console.warn(`Environment '${name}' not found.`);
            return false;
        }
        if (this.activeEnvironmentName === name) {
            return true; 
        }
        if (this.activeEnvironmentName && this.environments[this.activeEnvironmentName]) {
            this.environments[this.activeEnvironmentName].isActive = false;
        }
        this.activeEnvironmentName = name;
        this.environments[name].isActive = true;
        
        this.textBuffer = ''; 
        if(this.bufferTimeoutId) {
            clearTimeout(this.bufferTimeoutId);
            this.bufferTimeoutId = null;
        }
        
        this._showToast(`Ambiente '${name}' ativado.`);
        // console.log(`Environment '${name}' activated.`);
        return true;
    }

    getCurrentEnvironmentName() {
        return this.activeEnvironmentName;
    }

    _showToast(message) {
        // This will be replaced by a call to a dedicated ToastNotifier module
        console.info(`TOAST: ${message}`);
        // For now, a simple console log. Later, this will interact with ToastNotifier.js
        // Check if ToastNotifier class is available and use it
        if (typeof ToastNotifier !== 'undefined' && ToastNotifier.show) {
            ToastNotifier.show(message);
        } else {
            // Fallback or default internal toast if ToastNotifier is not loaded/integrated yet
            const toastElement = document.createElement('div');
            toastElement.textContent = message;
            toastElement.style.position = 'fixed';
            toastElement.style.bottom = '20px';
            toastElement.style.right = '20px';
            toastElement.style.padding = '10px 20px';
            toastElement.style.backgroundColor = '#333';
            toastElement.style.color = 'white';
            toastElement.style.borderRadius = '5px';
            toastElement.style.zIndex = '10000';
            toastElement.style.opacity = '0';
            toastElement.style.transition = 'opacity 0.5s ease';
            document.body.appendChild(toastElement);
            setTimeout(() => { toastElement.style.opacity = '1'; }, 10);
            setTimeout(() => {
                toastElement.style.opacity = '0';
                setTimeout(() => { document.body.removeChild(toastElement); }, 500);
            }, 3000);
        }
    }

    addHotkeyToEnvironment(environmentName, keyCombination, callback, ...callbackArgs) {
        if (!this.environments[environmentName]) {
            console.error(`Cannot add hotkey: Environment '${environmentName}' does not exist.`);
            return false;
        }
        if (typeof callback !== 'function') {
            console.error(`Callback for hotkey '${keyCombination}' must be a function.`);
            return false;
        }

        const normalizedCombination = HotkeyParser.normalizeCombination(keyCombination);
        if (!normalizedCombination) {
            console.error(`Invalid hotkey combination: '${keyCombination}'.`);
            return false;
        }

        const hotkeyEntry = { 
            originalCombination: keyCombination,
            normalizedCombination: normalizedCombination, 
            callback, 
            callbackArgs 
        };
        this.environments[environmentName].hotkeys.push(hotkeyEntry);
        // console.log(`Hotkey '${normalizedCombination}' (original: '${keyCombination}') added to environment '${environmentName}'.`);
        return true;
    }

    destroy() {
        document.removeEventListener('keydown', this._handleKeyDown);
        if (this.bufferTimeoutId) {
            clearTimeout(this.bufferTimeoutId);
        }
        this.environments = {};
        this.activeEnvironmentName = null;
        this.textBuffer = '';
        console.log("VirtualEnvManager destroyed and listeners removed.");
    }
}

// Example of making HotkeyParser available if not using modules and it's in another file:
// Assuming HotkeyParser.js is loaded before this script or bundled.
// No explicit import needed here if HotkeyParser is globally available or on the window object.

