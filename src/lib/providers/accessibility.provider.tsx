'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { KeyboardShortcutsDialog } from '@/components/ui/keyboard-shortcuts-dialog';
import {
    defaultKeyboardShortcuts,
    useKeyboardNavigation,
    type KeyboardShortcut,
} from '@/hooks/useKeyboardNavigation';

interface AccessibilitySettings {
    keyboardNavigation: boolean;
    reducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
    soundEffects: boolean;
    focusIndicators: boolean;
}

interface AccessibilityContextType {
    settings: AccessibilitySettings;
    updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
    shortcuts: KeyboardShortcut[];
    addShortcut: (shortcut: KeyboardShortcut) => void;
    removeShortcut: (key: string) => void;
    isHelpVisible: boolean;
    showHelp: () => void;
    hideHelp: () => void;
    toggleHelp: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(
    undefined,
);

interface AccessibilityProviderProps {
    children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
    const [settings, setSettings] = useState<AccessibilitySettings>({
        keyboardNavigation: true,
        reducedMotion: false,
        highContrast: false,
        screenReader: false,
        soundEffects: false,
        focusIndicators: true,
    });

    const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(
        defaultKeyboardShortcuts,
    );

    // Set up keyboard navigation with custom shortcuts
    const {
        isHelpVisible,
        setIsHelpVisible,
        toggleHelp: toggleHelpDialog,
    } = useKeyboardNavigation(shortcuts, {
        enableGlobalShortcuts: settings.keyboardNavigation,
        enableArrowNavigation: settings.keyboardNavigation,
        enableTabNavigation: settings.keyboardNavigation,
        enableEscapeHandling: true,
    });

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('accessibility-settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings((prev) => ({ ...prev, ...parsed }));
            } catch (error) {
                console.warn('Failed to parse accessibility settings:', error);
            }
        }
    }, []);

    // Save settings to localStorage when they change
    useEffect(() => {
        localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    }, [settings]);

    // Apply accessibility settings to document
    useEffect(() => {
        const root = document.documentElement;

        // Apply reduced motion
        if (settings.reducedMotion) {
            root.style.setProperty('--motion-reduce', '1');
            root.classList.add('reduce-motion');
        } else {
            root.style.removeProperty('--motion-reduce');
            root.classList.remove('reduce-motion');
        }

        // Apply high contrast
        if (settings.highContrast) {
            root.classList.add('high-contrast');
        } else {
            root.classList.remove('high-contrast');
        }

        // Apply focus indicators
        if (settings.focusIndicators) {
            root.classList.add('enhanced-focus');
        } else {
            root.classList.remove('enhanced-focus');
        }

        // Apply screen reader optimizations
        if (settings.screenReader) {
            root.classList.add('screen-reader-optimized');
        } else {
            root.classList.remove('screen-reader-optimized');
        }
    }, [settings]);

    const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const addShortcut = (shortcut: KeyboardShortcut) => {
        setShortcuts((prev) => [...prev, shortcut]);
    };

    const removeShortcut = (key: string) => {
        setShortcuts((prev) => prev.filter((s) => s.key !== key));
    };

    const showHelp = () => setIsHelpVisible(true);
    const hideHelp = () => setIsHelpVisible(false);
    const toggleHelp = () => toggleHelpDialog();

    const value: AccessibilityContextType = {
        settings,
        updateSetting,
        shortcuts,
        addShortcut,
        removeShortcut,
        isHelpVisible,
        showHelp,
        hideHelp,
        toggleHelp,
    };

    return (
        <AccessibilityContext.Provider value={value}>
            {children}
            <KeyboardShortcutsDialog
                isOpen={isHelpVisible}
                onClose={hideHelp}
                shortcuts={shortcuts}
            />
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
}

/**
 * Hook for components that need to register keyboard shortcuts
 */
export function useRegisterShortcuts(shortcuts: KeyboardShortcut[]) {
    const { addShortcut, removeShortcut } = useAccessibility();

    useEffect(() => {
        shortcuts.forEach(addShortcut);
        return () => {
            shortcuts.forEach((shortcut) => removeShortcut(shortcut.key));
        };
    }, [shortcuts, addShortcut, removeShortcut]);
}

/**
 * Hook for focus management
 */
export function useFocusManagement() {
    const { settings } = useAccessibility();

    const focusElement = (element: HTMLElement | null) => {
        if (!element || !settings.keyboardNavigation) return;

        element.focus();

        // Add visual focus indicator if enabled
        if (settings.focusIndicators) {
            element.classList.add('keyboard-focused');
            setTimeout(() => {
                element.classList.remove('keyboard-focused');
            }, 2000);
        }
    };

    const announceFocus = (message: string) => {
        if (!settings.screenReader) return;

        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    };

    return {
        focusElement,
        announceFocus,
        keyboardNavigationEnabled: settings.keyboardNavigation,
        focusIndicatorsEnabled: settings.focusIndicators,
    };
}

/**
 * Hook for sound effects
 */
export function useSoundEffects() {
    const { settings } = useAccessibility();

    const playSound = (type: 'click' | 'success' | 'error' | 'notification') => {
        if (!settings.soundEffects) return;

        // Create audio context for sound effects
        try {
            const audioContext = new (window.AudioContext ||
                (window as unknown as Record<string, unknown>).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different frequencies for different sound types
            const frequencies = {
                click: 800,
                success: 1000,
                error: 400,
                notification: 600,
            };

            oscillator.frequency.setValueAtTime(
                frequencies[type],
                audioContext.currentTime,
            );
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
                0.01,
                audioContext.currentTime + 0.1,
            );

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.warn('Failed to play sound effect:', error);
        }
    };

    return {
        playSound,
        soundEffectsEnabled: settings.soundEffects,
    };
}
