import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';

/**
 * Visual Test Showcase Index Page
 * 
 * Central hub for all visual testing showcase pages
 */
const VisualTestShowcaseIndex: NextPage = () => {
  const showcasePages = [
    {
      path: '/visual-test-showcase/button',
      title: 'Button Components',
      description: 'Button variants, sizes, and states',
    },
    {
      path: '/visual-test-showcase/card',
      title: 'Card Components',
      description: 'Card layouts and interactions',
    },
    {
      path: '/visual-test-showcase/input',
      title: 'Input Components',
      description: 'Form inputs and validation states',
    },
    {
      path: '/visual-test-showcase/select',
      title: 'Select Components',
      description: 'Select dropdowns and options',
    },
    {
      path: '/visual-test-showcase/dialog',
      title: 'Dialog Components',
      description: 'Modal dialogs and overlays',
    },
    {
      path: '/visual-test-showcase/badge',
      title: 'Badge Components',
      description: 'Badge variants and sizes',
    },
    {
      path: '/visual-test-showcase/tooltip',
      title: 'Tooltip Components',
      description: 'Tooltip positioning and content',
    },
    {
      path: '/visual-test-showcase/avatar',
      title: 'Avatar Components',
      description: 'Avatar images and fallbacks',
    },
    {
      path: '/visual-test-showcase/skeleton',
      title: 'Skeleton Components',
      description: 'Loading skeleton states',
    },
    {
      path: '/visual-test-showcase/separator',
      title: 'Separator Components',
      description: 'Horizontal and vertical separators',
    },
    {
      path: '/visual-test-showcase/label',
      title: 'Label Components',
      description: 'Form labels and associations',
    },
    {
      path: '/visual-test-showcase/custom',
      title: 'Custom Components',
      description: 'Application-specific components',
    },
    {
      path: '/visual-test-showcase/theme-toggle',
      title: 'Theme Toggle',
      description: 'Theme switching component',
    },
    {
      path: '/visual-test-showcase/recent-activity',
      title: 'Recent Activity',
      description: 'Activity feed and timeline',
    },
    {
      path: '/visual-test-showcase/settings',
      title: 'Settings',
      description: 'Settings forms and layouts',
    },
    {
      path: '/visual-test-showcase/block-canvas',
      title: 'Block Canvas',
      description: 'Canvas and block components',
    },
    {
      path: '/visual-test-showcase/test-matrix',
      title: 'Test Matrix',
      description: 'Test matrix and grid components',
    },
    {
      path: '/visual-test-showcase/modals',
      title: 'Modal Showcase',
      description: 'All modal types and sizes',
    },
    {
      path: '/visual-test-showcase/dropdown',
      title: 'Dropdown Components',
      description: 'Dropdown menus and selections',
    },
    {
      path: '/visual-test-showcase/drag-drop',
      title: 'Drag & Drop',
      description: 'Drag and drop interactions',
    },
    {
      path: '/visual-test-showcase/form',
      title: 'Form Components',
      description: 'Complete form layouts',
    },
    {
      path: '/visual-test-showcase/table',
      title: 'Table Components',
      description: 'Data tables and interactions',
    },
    {
      path: '/visual-test-showcase/tabs',
      title: 'Tab Components',
      description: 'Tab navigation and content',
    },
    {
      path: '/visual-test-showcase/loading',
      title: 'Loading States',
      description: 'Loading indicators and states',
    },
    {
      path: '/visual-test-showcase/error',
      title: 'Error States',
      description: 'Error handling and recovery',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">
            Visual Test Showcase
          </h1>
          
          <p className="text-lg text-muted-foreground text-center mb-12">
            Comprehensive visual testing showcase for all UI components and interactions.
            These pages are designed for automated visual regression testing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcasePages.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                className="group block p-6 border rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary">
                  {page.title}
                </h3>
                <p className="text-muted-foreground">
                  {page.description}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Visual Testing Guidelines</h2>
            <ul className="space-y-2 text-sm">
              <li>• All components should be tested across light and dark themes</li>
              <li>• Test all interactive states (hover, focus, active, disabled)</li>
              <li>• Verify responsive behavior across mobile, tablet, and desktop</li>
              <li>• Include loading, error, and empty states where applicable</li>
              <li>• Test keyboard navigation and accessibility</li>
              <li>• Verify cross-browser consistency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualTestShowcaseIndex;