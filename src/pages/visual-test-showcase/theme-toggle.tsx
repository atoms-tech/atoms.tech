import React, { useState } from 'react';
import { NextPage } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';

/**
 * Theme Toggle Visual Test Showcase
 * 
 * Comprehensive showcase of theme toggle components for visual testing
 */
const ThemeToggleShowcase: NextPage = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(newTheme);
    
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // System theme
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
      document.documentElement.setAttribute('data-theme', systemTheme);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Theme Toggle Components</h1>
          <p className="text-muted-foreground">
            Visual testing showcase for theme switching component
          </p>
        </div>

        {/* Current Theme Display */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Current Theme: {theme}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className={theme === 'light' ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  Light Theme
                </CardTitle>
                <CardDescription>
                  Bright and clean appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-20 bg-background border rounded-md flex items-center justify-center">
                  <span className="text-foreground">Light Mode</span>
                </div>
              </CardContent>
            </Card>

            <Card className={theme === 'dark' ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  Dark Theme
                </CardTitle>
                <CardDescription>
                  Reduced eye strain in low light
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-20 bg-background border rounded-md flex items-center justify-center">
                  <span className="text-foreground">Dark Mode</span>
                </div>
              </CardContent>
            </Card>

            <Card className={theme === 'system' ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  System Theme
                </CardTitle>
                <CardDescription>
                  Follows system preference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-20 bg-background border rounded-md flex items-center justify-center">
                  <span className="text-foreground">System Mode</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Theme Toggle Button */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Theme Toggle Button</h2>
          <div className="flex justify-center">
            <Button 
              data-testid="theme-toggle"
              onClick={toggleTheme}
              variant="outline"
              size="lg"
              className="transition-all duration-200"
            >
              {theme === 'light' && <Sun className="h-5 w-5 mr-2" />}
              {theme === 'dark' && <Moon className="h-5 w-5 mr-2" />}
              {theme === 'system' && <Monitor className="h-5 w-5 mr-2" />}
              {theme === 'light' && 'Light Mode'}
              {theme === 'dark' && 'Dark Mode'}
              {theme === 'system' && 'System Mode'}
            </Button>
          </div>
        </section>

        {/* Theme Toggle Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Theme Toggle Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Icon Only</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  data-testid="theme-toggle-icon"
                  onClick={toggleTheme}
                  variant="ghost"
                  size="icon"
                >
                  {theme === 'light' && <Sun className="h-5 w-5" />}
                  {theme === 'dark' && <Moon className="h-5 w-5" />}
                  {theme === 'system' && <Monitor className="h-5 w-5" />}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Small Toggle</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  data-testid="theme-toggle-small"
                  onClick={toggleTheme}
                  variant="outline"
                  size="sm"
                >
                  {theme === 'light' && <Sun className="h-4 w-4 mr-2" />}
                  {theme === 'dark' && <Moon className="h-4 w-4 mr-2" />}
                  {theme === 'system' && <Monitor className="h-4 w-4 mr-2" />}
                  Toggle
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Large Toggle</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  data-testid="theme-toggle-large"
                  onClick={toggleTheme}
                  variant="default"
                  size="lg"
                >
                  {theme === 'light' && <Sun className="h-6 w-6 mr-2" />}
                  {theme === 'dark' && <Moon className="h-6 w-6 mr-2" />}
                  {theme === 'system' && <Monitor className="h-6 w-6 mr-2" />}
                  Switch Theme
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Theme-Aware Components */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Theme-Aware Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card in Current Theme</CardTitle>
                <CardDescription>
                  This card adapts to the current theme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-muted-foreground">
                      This is muted background content
                    </p>
                  </div>
                  <div className="p-4 bg-primary rounded-lg">
                    <p className="text-primary-foreground">
                      This is primary background content
                    </p>
                  </div>
                  <div className="p-4 bg-secondary rounded-lg">
                    <p className="text-secondary-foreground">
                      This is secondary background content
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interactive Elements</CardTitle>
                <CardDescription>
                  Buttons and inputs in current theme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="default" className="w-full">
                    Primary Button
                  </Button>
                  <Button variant="outline" className="w-full">
                    Outline Button
                  </Button>
                  <Button variant="ghost" className="w-full">
                    Ghost Button
                  </Button>
                  <input
                    type="text"
                    placeholder="Input field"
                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Theme Transition Effect */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Theme Transition Effect</h2>
          <Card>
            <CardHeader>
              <CardTitle>Smooth Transitions</CardTitle>
              <CardDescription>
                All elements should transition smoothly between themes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                  <h3 className="font-semibold">Gradient Background</h3>
                  <p className="text-sm opacity-90">
                    Gradients remain consistent
                  </p>
                </div>
                <div className="p-4 border-2 border-primary rounded-lg">
                  <h3 className="font-semibold">Border Colors</h3>
                  <p className="text-sm text-muted-foreground">
                    Borders adapt to theme
                  </p>
                </div>
                <div className="p-4 shadow-lg rounded-lg bg-background">
                  <h3 className="font-semibold">Shadow Effects</h3>
                  <p className="text-sm text-muted-foreground">
                    Shadows adjust appropriately
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Theme Preference Indicators */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Theme Preference Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-muted'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  <span>Light</span>
                </div>
                {theme === 'light' && (
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-muted'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  <span>Dark</span>
                </div>
                {theme === 'dark' && (
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${theme === 'system' ? 'border-primary bg-primary/10' : 'border-muted'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  <span>System</span>
                </div>
                {theme === 'system' && (
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Color Palette Display */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Color Palette in Current Theme</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Colors
              </CardTitle>
              <CardDescription>
                Color tokens adapting to the current theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="w-full h-12 bg-background border rounded"></div>
                  <p className="text-sm text-center">Background</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-12 bg-foreground rounded"></div>
                  <p className="text-sm text-center">Foreground</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-12 bg-primary rounded"></div>
                  <p className="text-sm text-center">Primary</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-12 bg-secondary rounded"></div>
                  <p className="text-sm text-center">Secondary</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-12 bg-muted rounded"></div>
                  <p className="text-sm text-center">Muted</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-12 bg-accent rounded"></div>
                  <p className="text-sm text-center">Accent</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-12 bg-destructive rounded"></div>
                  <p className="text-sm text-center">Destructive</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-12 bg-border rounded"></div>
                  <p className="text-sm text-center">Border</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default ThemeToggleShowcase;