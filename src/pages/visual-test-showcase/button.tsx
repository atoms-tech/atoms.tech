import React from 'react';
import { NextPage } from 'next';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight, Settings, Heart } from 'lucide-react';

/**
 * Button Visual Test Showcase
 * 
 * Comprehensive showcase of button components for visual testing
 */
const ButtonShowcase: NextPage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Button Components</h1>
          <p className="text-muted-foreground">
            Visual testing showcase for button variants, sizes, and states
          </p>
        </div>

        {/* Button Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Button Variants</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button data-testid="button-default" variant="default">
              Default
            </Button>
            <Button data-testid="button-destructive" variant="destructive">
              Destructive
            </Button>
            <Button data-testid="button-outline" variant="outline">
              Outline
            </Button>
            <Button data-testid="button-secondary" variant="secondary">
              Secondary
            </Button>
            <Button data-testid="button-ghost" variant="ghost">
              Ghost
            </Button>
            <Button data-testid="button-link" variant="link">
              Link
            </Button>
          </div>
        </section>

        {/* Button Sizes */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Button Sizes</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button data-testid="button-size-sm" size="sm">
              Small
            </Button>
            <Button data-testid="button-size-default" size="default">
              Default
            </Button>
            <Button data-testid="button-size-lg" size="lg">
              Large
            </Button>
            <Button data-testid="button-size-icon" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Button States */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Button States</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Button data-testid="button-primary">
              Primary
            </Button>
            <Button data-testid="button-disabled" disabled>
              Disabled
            </Button>
            <Button data-testid="button-loading" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading
            </Button>
            <Button data-testid="button-active" className="active">
              Active
            </Button>
            <Button data-testid="button-with-icon">
              <Heart className="mr-2 h-4 w-4" />
              With Icon
            </Button>
          </div>
        </section>

        {/* Button with Icons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Buttons with Icons</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button data-testid="button-icon-left">
              <Settings className="mr-2 h-4 w-4" />
              Left Icon
            </Button>
            <Button data-testid="button-icon-right">
              Right Icon
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button data-testid="button-icon-only" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button data-testid="button-icon-loading" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading
            </Button>
          </div>
        </section>

        {/* Button Groups */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Button Groups</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button data-testid="button-group-1" variant="outline">
                Option 1
              </Button>
              <Button data-testid="button-group-2" variant="outline">
                Option 2
              </Button>
              <Button data-testid="button-group-3" variant="outline">
                Option 3
              </Button>
            </div>
            <div className="flex">
              <Button data-testid="button-group-left" variant="outline" className="rounded-r-none">
                Left
              </Button>
              <Button data-testid="button-group-middle" variant="outline" className="rounded-none border-x-0">
                Middle
              </Button>
              <Button data-testid="button-group-right" variant="outline" className="rounded-l-none">
                Right
              </Button>
            </div>
          </div>
        </section>

        {/* Responsive Button Layout */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Responsive Button Layout</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button data-testid="button-responsive-1" className="w-full">
              Full Width Button
            </Button>
            <Button data-testid="button-responsive-2" className="w-full" variant="outline">
              Responsive Outline
            </Button>
            <Button data-testid="button-responsive-3" className="w-full" variant="secondary">
              Responsive Secondary
            </Button>
          </div>
        </section>

        {/* Button with Ripple Effect */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Button with Ripple Effect</h2>
          <div className="flex gap-4">
            <Button 
              data-testid="button-ripple"
              className="relative overflow-hidden"
              onClick={(e) => {
                const button = e.currentTarget;
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const ripple = document.createElement('span');
                ripple.className = 'absolute bg-white/20 rounded-full animate-ping';
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.transform = 'translate(-50%, -50%)';
                
                button.appendChild(ripple);
                
                setTimeout(() => {
                  ripple.remove();
                }, 600);
              }}
            >
              Click for Ripple
            </Button>
          </div>
        </section>

        {/* Button in Different Contexts */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Buttons in Different Contexts</h2>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="mb-2">On Background Color</h3>
              <Button data-testid="button-context-bg">Background Button</Button>
            </div>
            <div className="p-4 bg-primary rounded-lg">
              <h3 className="mb-2 text-primary-foreground">On Primary Background</h3>
              <Button data-testid="button-context-primary" variant="secondary">
                Secondary on Primary
              </Button>
            </div>
            <div className="p-4 bg-destructive rounded-lg">
              <h3 className="mb-2 text-destructive-foreground">On Destructive Background</h3>
              <Button data-testid="button-context-destructive" variant="outline">
                Outline on Destructive
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ButtonShowcase;