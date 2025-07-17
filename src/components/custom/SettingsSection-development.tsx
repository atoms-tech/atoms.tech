'use client';

import {
    Accessibility,
    Bell,
    Keyboard,
    Monitor,
    Moon,
    Palette,
    Settings,
    Sun,
    User,
    Wrench,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { KeyboardShortcutsDialog } from '@/components/ui/keyboard-shortcuts-dialog';
import { Label } from '@/components/ui/label';
import { useLiveRegion } from '@/components/ui/live-region';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    defaultKeyboardShortcuts,
    useKeyboardNavigation,
} from '@/hooks/useKeyboardNavigation';
import { useAccessibility } from '@/lib/providers/accessibility.provider';
import { useUser } from '@/lib/providers/user.provider';

// Component for features that are in development
const InProgressOverlay = ({
    children,
    feature: _feature,
}: {
    children: React.ReactNode;
    feature: string;
}) => {
    return (
        <div className="relative p-3 rounded-lg">
            <div className="relative z-10 opacity-50 pointer-events-none">{children}</div>
            <div className="absolute inset-0 z-20 bg-white/70 dark:bg-black/40 backdrop-blur-[3px] rounded-lg border border-dashed border-muted-foreground/40 flex items-center justify-center">
                <div className="flex items-center gap-2 text-xs text-foreground/80 bg-background/95 px-3 py-1.5 rounded-full border border-border/60 shadow-sm">
                    <Wrench className="h-3 w-3" />
                    <span className="font-medium">In Development</span>
                </div>
            </div>
        </div>
    );
};

export function SettingsSectionDevelopment() {
    const { user, profile } = useUser();
    const { theme, setTheme } = useTheme();
    const { announce } = useLiveRegion();
    const { settings: _accessibilitySettings, updateSetting } = useAccessibility();
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

    // Local settings for features not yet implemented in accessibility provider
    const [localSettings, setLocalSettings] = useState({
        notifications: true,
        soundEffects: false,
        autoSave: true,
        compactMode: false,
    });

    // Set up keyboard navigation
    const { isHelpVisible, setIsHelpVisible } = useKeyboardNavigation(
        defaultKeyboardShortcuts,
        {
            enableGlobalShortcuts: true,
            enableArrowNavigation: true,
            enableTabNavigation: true,
            enableEscapeHandling: true,
        },
    );

    const updateLocalSetting = (key: string, value: boolean) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
        announce(`${key} ${value ? 'enabled' : 'disabled'}`, 'polite');
    };

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Settings className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Settings</h2>
            </div>

            <Tabs defaultValue="appearance" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                </TabsList>

                <TabsContent value="appearance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Theme
                            </CardTitle>
                            <CardDescription>
                                Choose your preferred color theme
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <Button
                                    variant={theme === 'light' ? 'default' : 'outline'}
                                    onClick={() => handleThemeChange('light')}
                                    className="flex flex-col items-center gap-2 h-auto py-4"
                                >
                                    <Sun className="h-5 w-5" />
                                    Light
                                </Button>
                                <Button
                                    variant={theme === 'dark' ? 'default' : 'outline'}
                                    onClick={() => handleThemeChange('dark')}
                                    className="flex flex-col items-center gap-2 h-auto py-4"
                                >
                                    <Moon className="h-5 w-5" />
                                    Dark
                                </Button>
                                <Button
                                    variant={theme === 'system' ? 'default' : 'outline'}
                                    onClick={() => handleThemeChange('system')}
                                    className="flex flex-col items-center gap-2 h-auto py-4"
                                >
                                    <Monitor className="h-5 w-5" />
                                    System
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Display Options</CardTitle>
                            <CardDescription>
                                Customize how content is displayed
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InProgressOverlay feature="compactMode">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="compact-mode">Compact mode</Label>
                                    <Switch
                                        id="compact-mode"
                                        checked={localSettings.compactMode}
                                        onCheckedChange={(checked) =>
                                            updateLocalSetting('compactMode', checked)
                                        }
                                    />
                                </div>
                            </InProgressOverlay>
                            <InProgressOverlay feature="autoSave">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="auto-save">Auto-save documents</Label>
                                    <Switch
                                        id="auto-save"
                                        checked={localSettings.autoSave}
                                        onCheckedChange={(checked) =>
                                            updateLocalSetting('autoSave', checked)
                                        }
                                    />
                                </div>
                            </InProgressOverlay>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="accessibility" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Accessibility className="h-4 w-4" />
                                Accessibility Features
                            </CardTitle>
                            <CardDescription>
                                Configure accessibility options for better usability
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="keyboard-nav">
                                        Enhanced keyboard navigation
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable full keyboard navigation with visual
                                        indicators
                                    </p>
                                </div>
                                <Switch
                                    id="keyboard-nav"
                                    checked={true}
                                    onCheckedChange={(checked) => {
                                        updateSetting('keyboardNavigation', checked);
                                        announce(
                                            `Keyboard navigation ${checked ? 'enabled' : 'disabled'}`,
                                            'polite',
                                        );
                                    }}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="reduced-motion">Reduce motion</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Minimize animations and transitions
                                    </p>
                                </div>
                                <Switch
                                    id="reduced-motion"
                                    checked={true}
                                    onCheckedChange={(checked) => {
                                        updateSetting('reducedMotion', checked);
                                        announce(
                                            `Reduced motion ${checked ? 'enabled' : 'disabled'}`,
                                            'polite',
                                        );
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="high-contrast">
                                        High contrast mode
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Increase contrast for better visibility
                                    </p>
                                </div>
                                <Switch
                                    id="high-contrast"
                                    checked={true}
                                    onCheckedChange={(checked) => {
                                        updateSetting('highContrast', checked);
                                        announce(
                                            `High contrast mode ${checked ? 'enabled' : 'disabled'}`,
                                            'polite',
                                        );
                                    }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="screen-reader">
                                        Screen reader optimizations
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enhanced support for screen readers
                                    </p>
                                </div>
                                <Switch
                                    id="screen-reader"
                                    checked={true}
                                    onCheckedChange={(checked) => {
                                        updateSetting('screenReader', checked);
                                        announce(
                                            `Screen reader optimizations ${checked ? 'enabled' : 'disabled'}`,
                                            'polite',
                                        );
                                    }}
                                />
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowKeyboardShortcuts(true)}
                                    className="w-full justify-start"
                                >
                                    <Keyboard className="h-4 w-4 mr-2" />
                                    View Keyboard Shortcuts
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Press{' '}
                                    <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border border-border rounded">
                                        Shift
                                    </kbd>{' '}
                                    +{' '}
                                    <kbd className="px-1 py-0.5 text-xs font-mono bg-muted border border-border rounded">
                                        ?
                                    </kbd>{' '}
                                    anywhere to open shortcuts
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-4 w-4" />
                                Notification Preferences
                            </CardTitle>
                            <CardDescription>
                                Control how and when you receive notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InProgressOverlay feature="notifications">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="notifications">
                                            Enable notifications
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Receive notifications for important updates
                                        </p>
                                    </div>
                                    <Switch
                                        id="notifications"
                                        checked={localSettings.notifications}
                                        onCheckedChange={(checked) =>
                                            updateLocalSetting('notifications', checked)
                                        }
                                    />
                                </div>
                            </InProgressOverlay>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="sound-effects">Sound effects</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Play sounds for actions and notifications
                                    </p>
                                </div>
                                <Switch
                                    id="sound-effects"
                                    checked={true}
                                    onCheckedChange={(checked) => {
                                        updateSetting('soundEffects', checked);
                                        announce(
                                            `Sound effects ${checked ? 'enabled' : 'disabled'}`,
                                            'polite',
                                        );
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="account" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Account Information
                            </CardTitle>
                            <CardDescription>
                                Your account details and preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <p className="text-sm text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <p className="text-sm text-muted-foreground">
                                    {profile?.full_name || 'Not set'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>User ID</Label>
                                <p className="text-sm text-muted-foreground font-mono">
                                    {user?.id}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Keyboard Shortcuts Dialog */}
            <KeyboardShortcutsDialog
                isOpen={showKeyboardShortcuts || isHelpVisible}
                onClose={() => {
                    setShowKeyboardShortcuts(false);
                    setIsHelpVisible(false);
                }}
                shortcuts={defaultKeyboardShortcuts}
            />
        </div>
    );
}
