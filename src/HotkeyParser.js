class HotkeyParser {
    /**
     * Normalizes a key combination string into a consistent format.
     * Example: "ctrl+shift+a" -> "Control+Shift+A"
     * Sorts modifier keys alphabetically.
     * @param {string} combinationString - e.g., "Ctrl+Shift+a", "cmd+k", "F1"
     * @returns {string} Normalized key combination or empty string if invalid.
     */
    static normalizeCombination(combinationString) {
        if (typeof combinationString !== 'string' || combinationString.trim() === '') {
            return '';
        }

        const parts = combinationString.toLowerCase().split('+').map(part => part.trim());
        const modifiers = [];
        let mainKey = '';

        for (const part of parts) {
            if (this.isModifier(part)) {
                modifiers.push(this.mapModifier(part));
            } else if (!mainKey) {
                mainKey = part.length === 1 ? part.toUpperCase() : this.capitalizeFirstLetter(part); // F1, Enter, A, B
            } else {
                // More than one main key found, invalid combination
                console.warn(`Invalid hotkey part: ${part} in ${combinationString}. Multiple main keys?`);
                return ''; 
            }
        }

        if (!mainKey && modifiers.length === 0) {
             console.warn(`Invalid hotkey: ${combinationString}. No main key or modifiers.`);
            return ''; // Must have at least one key
        }
        if (!mainKey && modifiers.length > 0) {
            // If only modifiers are present, it's not a typical hotkey we can act on alone.
            // Or, the last part was intended as the main key but wasn't caught.
            // For simplicity, we'll assume a main key is required if modifiers are present.
            // This could be adjusted if modifier-only hotkeys are needed (e.g. holding Shift).
            // For now, let's consider it invalid if there's no clear main key.
            // A single modifier like "Shift" is not a hotkey.
            if (parts.length === 1 && this.isModifier(parts[0])) return ''; // Single modifier is not a hotkey
            mainKey = this.capitalizeFirstLetter(parts[parts.length-1]); // Assume last part is main key if not modifier
        }
        
        modifiers.sort(); // Sort modifiers for consistency (e.g., Ctrl+Shift+A is same as Shift+Ctrl+A)

        return modifiers.concat(mainKey).join('+');
    }

    /**
     * Checks if a key string is a known modifier.
     * @param {string} keyString 
     * @returns {boolean}
     */
    static isModifier(keyString) {
        const lowerKey = keyString.toLowerCase();
        return ['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(lowerKey);
    }

    /**
     * Maps common modifier aliases to a standard name.
     * @param {string} modifierString 
     * @returns {string}
     */
    static mapModifier(modifierString) {
        const lower = modifierString.toLowerCase();
        if (lower === 'ctrl' || lower === 'control') return 'Control';
        if (lower === 'cmd' || lower === 'command' || lower === 'meta') return 'Meta'; // Meta is often Command on Mac
        if (lower === 'alt') return 'Alt';
        if (lower === 'shift') return 'Shift';
        return ''; // Should not happen if isModifier was true
    }

    static capitalizeFirstLetter(string) {
        if (!string) return '';
        if (string.toLowerCase().startsWith('f') && string.length > 1 && !isNaN(string.substring(1))) {
            return string.toUpperCase(); // F1, F2, etc.
        }
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    /**
     * Creates a normalized representation of a KeyboardEvent.
     * @param {KeyboardEvent} event
     * @returns {string} Normalized key combination from the event.
     */
    static eventToCombination(event) {
        if (!event) return '';
        const modifiers = [];
        if (event.ctrlKey) modifiers.push('Control');
        if (event.altKey) modifiers.push('Alt');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.metaKey) modifiers.push('Meta');

        modifiers.sort();

        let mainKey = '';
        // Avoid using event.key for modifiers themselves if they are the main pressed key
        // (e.g. if user just presses "Shift" and nothing else)
        if (!this.isModifier(event.key)) {
            if (event.key.length === 1) {
                mainKey = event.key.toUpperCase();
            } else if (event.key.startsWith('F') && event.key.length > 1 && !isNaN(event.key.substring(1))) {
                mainKey = event.key.toUpperCase(); // F1, F2 etc.
            } else {
                mainKey = this.capitalizeFirstLetter(event.key); // Enter, Tab, ArrowUp, etc.
            }
        }
        
        // If only a modifier was pressed, and it's the event.key, it's not a hotkey combination
        if (modifiers.length > 0 && mainKey === '' && modifiers.map(m => m.toLowerCase()).includes(event.key.toLowerCase())){
            return ''; // e.g. user just pressed Ctrl key itself
        }
        if (mainKey === '') return ''; // No main key identified, not a valid hotkey for action

        return modifiers.concat(mainKey).join('+');
    }
}

// For Node.js environment / testing
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = HotkeyParser;
// }

