'use client';

import { CORE_WIDGETS } from './widget-definitions';
import { widgetRegistry } from './widget-registry';

let isInitialized = false;

export function initializeWidgets() {
    if (isInitialized) {
        return;
    }

    // Register all core widgets
    CORE_WIDGETS.forEach((widget) => {
        widgetRegistry.register(widget);
    });

    isInitialized = true;
    console.log(`Initialized ${CORE_WIDGETS.length} core widgets`);
}

// Auto-initialize when this module is imported
if (typeof window !== 'undefined') {
    initializeWidgets();
}
