export interface Theme {
    id: string;
    name: string;
    description: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        card: string;
        text: string;
        border: string;
    };
}

export const themes: Record<string, Theme> = {
    classic: {
        id: 'classic',
        name: '🟦 Classic',
        description: 'Original Minecraft blue',
        colors: {
            primary: '#3b82f6',      // Blue
            secondary: '#10b981',     // Green
            accent: '#8b5cf6',        // Purple
            background: '#f3f4f6',    // Light gray
            card: '#ffffff',          // White
            text: '#1f2937',          // Dark gray
            border: '#000000',        // Black
        },
    },
    nether: {
        id: 'nether',
        name: '🔥 Nether',
        description: 'Fiery reds and oranges',
        colors: {
            primary: '#ef4444',       // Red
            secondary: '#f97316',     // Orange
            accent: '#dc2626',        // Dark red
            background: '#1a0a0a',    // Very dark red-black
            card: '#2d1515',          // Dark red
            text: '#fef2f2',          // Light red tint
            border: '#7f1d1d',        // Dark red
        },
    },
    end: {
        id: 'end',
        name: '✨ The End',
        description: 'Purple void aesthetic',
        colors: {
            primary: '#a855f7',       // Purple
            secondary: '#ec4899',     // Pink
            accent: '#6366f1',        // Indigo
            background: '#0f0424',    // Very dark purple
            card: '#1e1139',          // Dark purple
            text: '#f3e8ff',          // Light purple
            border: '#581c87',        // Dark purple
        },
    },
    ocean: {
        id: 'ocean',
        name: '🌊 Ocean',
        description: 'Deep sea blues',
        colors: {
            primary: '#06b6d4',       // Cyan
            secondary: '#0ea5e9',     // Sky blue
            accent: '#14b8a6',        // Teal
            background: '#0c1629',    // Very dark blue
            card: '#162b47',          // Dark blue
            text: '#e0f2fe',          // Light blue
            border: '#0e7490',        // Dark cyan
        },
    },
};

export const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    // Apply CSS variables
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-accent', theme.colors.accent);
    root.style.setProperty('--color-bg', theme.colors.background);
    root.style.setProperty('--color-card', theme.colors.card);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-border', theme.colors.border);

    // Save to localStorage
    localStorage.setItem('selectedTheme', theme.id);

    // Auto-detect dark mode based on background brightness
    const isDark = isColorDark(theme.colors.background);
    if (isDark && !document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
    } else if (!isDark && document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
    }
};

export const loadSavedTheme = () => {
    const savedThemeId = localStorage.getItem('selectedTheme');
    if (savedThemeId && themes[savedThemeId]) {
        applyTheme(themes[savedThemeId]);
    } else {
        applyTheme(themes.classic);
    }
};

// Helper to detect if color is dark
function isColorDark(color: string): boolean {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
}
