/**
 * Storybook Integration for Visual Testing
 * Comprehensive Storybook setup with Chromatic integration for component visual testing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class StorybookIntegration {
  constructor(options = {}) {
    this.port = options.port || 6006;
    this.buildDir = options.buildDir || 'storybook-static';
    this.configDir = options.configDir || '.storybook';
    this.storiesDir = options.storiesDir || 'src/stories';
    this.staticDir = options.staticDir || 'public';
  }

  /**
   * Setup Storybook for visual testing
   */
  async setup() {
    console.log('📚 Setting up Storybook for visual testing...');

    // Check if Storybook is already initialized
    if (!fs.existsSync(this.configDir)) {
      console.log('🚀 Initializing Storybook...');
      execSync('npx storybook@latest init --yes', { stdio: 'inherit' });
    } else {
      console.log('✅ Storybook is already initialized');
    }

    // Install additional Storybook addons for visual testing
    await this.installAddons();

    // Configure Storybook for visual testing
    await this.configureStorybook();

    // Create comprehensive component stories
    await this.createComponentStories();

    // Setup visual testing utilities
    await this.setupVisualTestingUtils();

    // Update package.json scripts
    await this.updatePackageScripts();

    console.log('✅ Storybook visual testing setup completed!');
  }

  /**
   * Install essential Storybook addons for visual testing
   */
  async installAddons() {
    console.log('📦 Installing Storybook addons for visual testing...');

    const addons = [
      '@storybook/addon-essentials',
      '@storybook/addon-interactions',
      '@storybook/addon-a11y',
      '@storybook/addon-viewport',
      '@storybook/addon-backgrounds',
      '@storybook/addon-controls',
      '@storybook/addon-docs',
      '@chromaui/addon-visual-tests',
      '@storybook/addon-measure',
      '@storybook/addon-outline',
      'storybook-addon-designs',
      'storybook-addon-pseudo-states',
    ];

    try {
      const installCommand = `npm install --save-dev ${addons.join(' ')}`;
      execSync(installCommand, { stdio: 'inherit' });
      console.log('✅ Storybook addons installed successfully');
    } catch (error) {
      console.error('❌ Failed to install Storybook addons:', error.message);
      throw error;
    }
  }

  /**
   * Configure Storybook main configuration
   */
  async configureStorybook() {
    console.log('⚙️ Configuring Storybook for visual testing...');

    // Main configuration
    const mainConfig = `
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/**/*.story.@(js|jsx|mjs|ts|tsx)',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-controls',
    '@storybook/addon-docs',
    '@chromaui/addon-visual-tests',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
    'storybook-addon-designs',
    'storybook-addon-pseudo-states',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.js',
    },
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  features: {
    buildStoriesJson: true,
    storyStoreV7: true,
  },
  staticDirs: ['../public'],
  core: {
    disableTelemetry: true,
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  managerHead: (head) => \`
    \${head}
    <style>
      .sidebar-container {
        background: var(--color-bg-primary);
      }
    </style>
  \`,
};

export default config;
`;

    // Preview configuration for visual testing
    const previewConfig = `
import type { Preview } from '@storybook/react';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import '../src/styles/globals.css';

// Mock Next.js features
import { fn } from '@storybook/test';

// Mock next/navigation
const useRouter = fn(() => ({
  push: fn(),
  replace: fn(),
  prefetch: fn(),
  back: fn(),
  forward: fn(),
  refresh: fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}));

const usePathname = fn(() => '/');
const useSearchParams = fn(() => new URLSearchParams());

// Set up global mocks
Object.defineProperty(require, 'cache', {
  value: {
    ...require.cache,
    'next/navigation': {
      exports: {
        useRouter,
        usePathname,
        useSearchParams,
      },
    },
  },
});

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
    },
    docs: {
      story: {
        inline: true,
        iframeHeight: '200px',
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f0f0f',
        },
        {
          name: 'gray',
          value: '#f8f9fa',
        },
      ],
    },
    viewport: {
      viewports: {
        ...INITIAL_VIEWPORTS,
        responsive: {
          name: 'Responsive',
          styles: {
            width: '100%',
            height: '100%',
          },
          type: 'desktop',
        },
        smallMobile: {
          name: 'Small Mobile',
          styles: {
            width: '320px',
            height: '568px',
          },
          type: 'mobile',
        },
        largeMobile: {
          name: 'Large Mobile',
          styles: {
            width: '414px',
            height: '896px',
          },
          type: 'mobile',
        },
        smallTablet: {
          name: 'Small Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
          type: 'tablet',
        },
        largeTablet: {
          name: 'Large Tablet',
          styles: {
            width: '1024px',
            height: '1366px',
          },
          type: 'tablet',
        },
        smallDesktop: {
          name: 'Small Desktop',
          styles: {
            width: '1280px',
            height: '720px',
          },
          type: 'desktop',
        },
        largeDesktop: {
          name: 'Large Desktop',
          styles: {
            width: '1920px',
            height: '1080px',
          },
          type: 'desktop',
        },
        ultraWide: {
          name: 'Ultra Wide',
          styles: {
            width: '2560px',
            height: '1080px',
          },
          type: 'desktop',
        },
      },
    },
    layout: 'centered',
    // Chromatic configuration for visual testing
    chromatic: {
      viewports: [320, 768, 1024, 1280, 1920],
      modes: {
        light: {
          backgrounds: { value: '#ffffff' },
        },
        dark: {
          backgrounds: { value: '#0f0f0f' },
        },
        'high-contrast': {
          backgrounds: { value: '#000000' },
        },
      },
      pauseAnimationAtEnd: true,
      diffThreshold: 0.2,
      forcedColors: 'active',
    },
    // A11y addon configuration
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-trap',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
        ],
      },
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
        restoreScroll: true,
      },
    },
    // Pseudo states addon configuration
    pseudo: {
      hover: true,
      focus: true,
      focusVisible: true,
      active: true,
      visited: true,
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'high-contrast', title: 'High Contrast', icon: 'contrast' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'en',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'es', title: 'Español' },
          { value: 'fr', title: 'Français' },
          { value: 'de', title: 'Deutsch' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      
      return (
        <div 
          className={\`theme-\${theme}\`}
          data-theme={theme}
          style={{
            padding: '1rem',
            minHeight: '100vh',
            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
`;

    // Create .storybook directory if it doesn't exist
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // Write configuration files
    fs.writeFileSync(path.join(this.configDir, 'main.ts'), mainConfig.trim());
    fs.writeFileSync(path.join(this.configDir, 'preview.ts'), previewConfig.trim());

    // Create manager configuration for custom branding
    const managerConfig = `
import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';

const theme = create({
  base: 'light',
  brandTitle: 'Atoms.tech Design System',
  brandUrl: 'https://atoms.tech',
  brandImage: undefined,
  brandTarget: '_self',
  
  colorPrimary: '#3b82f6',
  colorSecondary: '#1e40af',
  
  // UI
  appBg: '#ffffff',
  appContentBg: '#ffffff',
  appBorderColor: '#e5e7eb',
  appBorderRadius: 4,
  
  // Typography
  fontBase: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontCode: 'Monaco, "SF Mono", "Roboto Mono", "Fira Code", Consolas, monospace',
  
  // Text colors
  textColor: '#1f2937',
  textInverseColor: '#ffffff',
  
  // Toolbar default and active colors
  barTextColor: '#6b7280',
  barSelectedColor: '#3b82f6',
  barBg: '#f9fafb',
  
  // Form colors
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  inputTextColor: '#1f2937',
  inputBorderRadius: 4,
});

addons.setConfig({
  theme,
  panelPosition: 'bottom',
  selectedPanel: 'storybook/controls/panel',
  initialActive: 'sidebar',
  sidebar: {
    showRoots: true,
    collapsedRoots: ['other'],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
    'storybook/background': { hidden: false },
    'storybook/viewport': { hidden: false },
    'storybook/toolbars': { hidden: false },
  },
});
`;

    fs.writeFileSync(path.join(this.configDir, 'manager.ts'), managerConfig.trim());

    console.log('✅ Storybook configuration completed');
  }

  /**
   * Create comprehensive component stories for visual testing
   */
  async createComponentStories() {
    console.log('📝 Creating comprehensive component stories...');

    // Create stories directory
    if (!fs.existsSync(this.storiesDir)) {
      fs.mkdirSync(this.storiesDir, { recursive: true });
    }

    // Button component stories
    await this.createButtonStories();
    
    // Form component stories
    await this.createFormStories();
    
    // Layout component stories
    await this.createLayoutStories();
    
    // Navigation component stories
    await this.createNavigationStories();
    
    // Feedback component stories
    await this.createFeedbackStories();

    console.log('✅ Component stories created successfully');
  }

  /**
   * Create Button component stories
   */
  async createButtonStories() {
    const buttonStories = `
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/ui/button';
import { ChevronRight, Download, Plus, Trash2, Settings } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states.',
      },
    },
    chromatic: {
      viewports: [320, 768, 1200],
      modes: {
        light: { backgrounds: { value: '#ffffff' } },
        dark: { backgrounds: { value: '#0f0f0f' } },
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the button',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

// Basic variants
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Primary Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const IconButton: Story = {
  args: {
    size: 'icon',
    children: <Plus className="h-4 w-4" />,
  },
};

// States
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        Loading...
      </>
    ),
  },
};

// With icons
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Download className="h-4 w-4 mr-2" />
        Download
      </>
    ),
  },
};

export const WithTrailingIcon: Story = {
  args: {
    children: (
      <>
        Continue
        <ChevronRight className="h-4 w-4 ml-2" />
      </>
    ),
  },
};

// Comprehensive showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-x-2">
        <Button>Default</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="space-x-2">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon"><Settings className="h-4 w-4" /></Button>
      </div>
      <div className="space-x-2">
        <Button disabled>Disabled</Button>
        <Button disabled variant="destructive">Disabled Destructive</Button>
        <Button disabled variant="outline">Disabled Outline</Button>
      </div>
    </div>
  ),
  parameters: {
    chromatic: {
      modes: {
        light: { backgrounds: { value: '#ffffff' } },
        dark: { backgrounds: { value: '#0f0f0f' } },
        'high-contrast': { backgrounds: { value: '#000000' } },
      },
    },
  },
};

// Interactive states for visual testing
export const HoverStates: Story = {
  render: () => (
    <div className="space-x-2">
      <Button className="hover:scale-105 transition-transform">Hover me</Button>
      <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground">Hover Outline</Button>
      <Button variant="ghost" className="hover:bg-accent">Hover Ghost</Button>
    </div>
  ),
  parameters: {
    pseudo: { hover: true },
  },
};

export const FocusStates: Story = {
  render: () => (
    <div className="space-x-2">
      <Button>Focus me</Button>
      <Button variant="outline">Focus Outline</Button>
      <Button variant="destructive">Focus Destructive</Button>
    </div>
  ),
  parameters: {
    pseudo: { focus: true },
  },
};
`;

    fs.writeFileSync(path.join(this.storiesDir, 'Button.stories.tsx'), buttonStories.trim());
  }

  /**
   * Create Form component stories
   */
  async createFormStories() {
    const formStories = `
import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';

const meta: Meta = {
  title: 'UI/Forms',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Form components for user input and data collection.',
      },
    },
    chromatic: {
      viewports: [320, 768, 1200],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const BasicForm: Story = {
  render: () => (
    <form className="space-y-4 w-96">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Enter your name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="Enter your email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Enter password" />
      </div>
      <Button type="submit" className="w-full">Submit</Button>
    </form>
  ),
};

export const FormWithSelect: Story = {
  render: () => (
    <form className="space-y-4 w-96">
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="de">Germany</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" placeholder="Tell us about yourself" />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">I agree to the terms and conditions</Label>
      </div>
      <Button type="submit" className="w-full">Create Account</Button>
    </form>
  ),
};

export const FormStates: Story = {
  render: () => (
    <div className="space-y-8 w-96">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Default State</h3>
        <Input placeholder="Default input" />
        <Button>Submit</Button>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Focused State</h3>
        <Input placeholder="Focused input" className="ring-2 ring-blue-500" />
        <Button className="ring-2 ring-blue-500">Focused Button</Button>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Error State</h3>
        <Input placeholder="Error input" className="border-red-500 ring-red-500" />
        <p className="text-sm text-red-500">This field is required</p>
        <Button variant="destructive">Error Button</Button>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Disabled State</h3>
        <Input placeholder="Disabled input" disabled />
        <Button disabled>Disabled Button</Button>
      </div>
    </div>
  ),
};

export const ResponsiveForm: Story = {
  render: () => (
    <form className="space-y-4 w-full max-w-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" placeholder="John" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" placeholder="Doe" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="john.doe@example.com" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </div>
    </form>
  ),
  parameters: {
    chromatic: {
      viewports: [320, 768, 1200],
    },
  },
};
`;

    fs.writeFileSync(path.join(this.storiesDir, 'Forms.stories.tsx'), formStories.trim());
  }

  /**
   * Create Layout component stories
   */
  async createLayoutStories() {
    const layoutStories = `
import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';

const meta: Meta = {
  title: 'UI/Layout',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Layout components for organizing content and creating structure.',
      },
    },
    chromatic: {
      viewports: [320, 768, 1200],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const BasicCard: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>
          This is a description of the card content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content area of the card.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const CardWithBadges: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Project Status</CardTitle>
          <Badge variant="secondary">Active</Badge>
        </div>
        <CardDescription>
          Current project development status and metrics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Progress</span>
            <Badge>75%</Badge>
          </div>
          <div className="flex justify-between">
            <span>Issues</span>
            <Badge variant="destructive">3</Badge>
          </div>
          <div className="flex justify-between">
            <span>Team Size</span>
            <Badge variant="outline">5</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle>Card {i}</CardTitle>
            <CardDescription>Description for card {i}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content for card {i}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    chromatic: {
      viewports: [320, 768, 1200, 1920],
    },
  },
};

export const ModalDialog: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: {
    chromatic: {
      delay: 1000,
    },
  },
};

export const LayoutWithSeparators: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Section 1</h3>
        <p className="text-sm text-muted-foreground">
          This is the first section of content.
        </p>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-semibold">Section 2</h3>
        <p className="text-sm text-muted-foreground">
          This is the second section of content.
        </p>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-semibold">Section 3</h3>
        <p className="text-sm text-muted-foreground">
          This is the third section of content.
        </p>
      </div>
    </div>
  ),
};
`;

    fs.writeFileSync(path.join(this.storiesDir, 'Layout.stories.tsx'), layoutStories.trim());
  }

  /**
   * Create Navigation component stories
   */
  async createNavigationStories() {
    const navigationStories = `
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Home, Settings, User, Bell, Search, Menu } from 'lucide-react';

const meta: Meta = {
  title: 'UI/Navigation',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Navigation components for site structure and wayfinding.',
      },
    },
    chromatic: {
      viewports: [320, 768, 1200],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const TopNavigation: Story = {
  render: () => (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="font-bold">Atoms.tech</div>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  ),
};

export const SideNavigation: Story = {
  render: () => (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-background">
        <div className="p-6">
          <div className="font-bold text-lg">Atoms.tech</div>
        </div>
        <nav className="space-y-2 px-4">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Main Content Area</h1>
        <p className="text-muted-foreground">
          This is where the main content would be displayed.
        </p>
      </main>
    </div>
  ),
};

export const MobileNavigation: Story = {
  render: () => (
    <div className="flex flex-col h-screen">
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-4">
          <Button variant="ghost" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="font-bold">Atoms.tech</div>
          <Button variant="ghost" size="icon">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4">
        <h1 className="text-xl font-bold">Mobile Layout</h1>
        <p className="text-sm text-muted-foreground">
          Optimized for mobile viewing
        </p>
      </main>
      <nav className="border-t bg-background">
        <div className="flex h-16 items-center justify-around">
          <Button variant="ghost" size="icon">
            <Home className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </nav>
    </div>
  ),
  parameters: {
    chromatic: {
      viewports: [320, 375],
    },
  },
};

export const Breadcrumbs: Story = {
  render: () => (
    <nav className="flex items-center space-x-2 text-sm">
      <Button variant="link" className="p-0 h-auto">
        Home
      </Button>
      <span>/</span>
      <Button variant="link" className="p-0 h-auto">
        Projects
      </Button>
      <span>/</span>
      <Button variant="link" className="p-0 h-auto">
        Design System
      </Button>
      <span>/</span>
      <span className="text-muted-foreground">Components</span>
    </nav>
  ),
};

export const TabNavigation: Story = {
  render: () => (
    <div className="w-full">
      <div className="border-b">
        <nav className="flex space-x-8">
          <Button variant="link" className="border-b-2 border-primary text-primary">
            Overview
          </Button>
          <Button variant="link" className="text-muted-foreground hover:text-foreground">
            Analytics
          </Button>
          <Button variant="link" className="text-muted-foreground hover:text-foreground">
            Reports
          </Button>
          <Button variant="link" className="text-muted-foreground hover:text-foreground">
            Notifications
            <Badge variant="secondary" className="ml-2">
              3
            </Badge>
          </Button>
        </nav>
      </div>
      <div className="py-6">
        <h2 className="text-xl font-semibold">Overview Content</h2>
        <p className="text-muted-foreground">
          This is the content for the overview tab.
        </p>
      </div>
    </div>
  ),
};
`;

    fs.writeFileSync(path.join(this.storiesDir, 'Navigation.stories.tsx'), navigationStories.trim());
  }

  /**
   * Create Feedback component stories
   */
  async createFeedbackStories() {
    const feedbackStories = `
import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Skeleton } from '../components/ui/skeleton';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const meta: Meta = {
  title: 'UI/Feedback',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Feedback components for communicating state and providing user feedback.',
      },
    },
    chromatic: {
      viewports: [320, 768, 1200],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Alerts: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          This is an informational alert with some helpful information.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Success</AlertTitle>
        <AlertDescription className="text-green-700">
          Your changes have been saved successfully.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Warning</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Please review your information before proceeding.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800">Error</AlertTitle>
        <AlertDescription className="text-red-700">
          Something went wrong. Please try again.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const Badges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
      
      <div className="flex items-center space-x-2">
        <Badge className="bg-green-100 text-green-800">Success</Badge>
        <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
        <Badge className="bg-blue-100 text-blue-800">Info</Badge>
        <Badge className="bg-purple-100 text-purple-800">New</Badge>
      </div>
      
      <div className="flex items-center space-x-2">
        <Badge>
          <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
          Active
        </Badge>
        <Badge variant="secondary">
          <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
          Inactive
        </Badge>
      </div>
    </div>
  ),
};

export const ProgressIndicators: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>25%</span>
        </div>
        <Progress value={25} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Loading</span>
          <span>60%</span>
        </div>
        <Progress value={60} className="h-2" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Complete</span>
          <span>100%</span>
        </div>
        <Progress value={100} className="h-3" />
      </div>
      
      <div className="space-y-2">
        <span className="text-sm">Indeterminate</span>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  ),
};

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-6 w-96">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  ),
};

export const StatusIndicators: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        <span>Online</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
        <span>Away</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
        <span>Offline</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        <span>Unknown</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
        <span>Connecting...</span>
      </div>
    </div>
  ),
};
`;

    fs.writeFileSync(path.join(this.storiesDir, 'Feedback.stories.tsx'), feedbackStories.trim());
  }

  /**
   * Setup visual testing utilities for Storybook
   */
  async setupVisualTestingUtils() {
    console.log('🔧 Setting up visual testing utilities...');

    const utilsDir = path.join(this.storiesDir, 'utils');
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }

    // Visual testing utilities
    const visualTestingUtils = `
/**
 * Visual Testing Utilities for Storybook
 * Helper functions and decorators for consistent visual testing
 */

import type { Decorator } from '@storybook/react';
import { useEffect } from 'react';

// Disable animations for consistent screenshots
export const withNoAnimations: Decorator = (Story) => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = \`
      *, *::before, *::after {
        animation-delay: -1ms !important;
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        background-attachment: initial !important;
        scroll-behavior: auto !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    \`;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <Story />;
};

// Theme decorator for consistent theming
export const withTheme = (theme: 'light' | 'dark' | 'high-contrast'): Decorator => (Story, context) => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = \`theme-\${theme}\`;
  }, []);

  return <Story />;
};

// Viewport decorator for responsive testing
export const withViewport = (width: number, height: number): Decorator => (Story) => {
  return (
    <div style={{ width, height, overflow: 'auto' }}>
      <Story />
    </div>
  );
};

// Loading state decorator
export const withLoadingState: Decorator = (Story) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
      <Story />
    </div>
  );
};

// Error state decorator
export const withErrorState: Decorator = (Story) => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-red-50 z-10 flex items-center justify-center border-2 border-red-200 rounded">
        <div className="text-red-800 text-center">
          <p className="font-semibold">Error State</p>
          <p className="text-sm">Something went wrong</p>
        </div>
      </div>
      <Story />
    </div>
  );
};

// Chromatic parameters for visual testing
export const chromaticParams = {
  chromatic: {
    viewports: [320, 768, 1024, 1280, 1920],
    modes: {
      light: { backgrounds: { value: '#ffffff' } },
      dark: { backgrounds: { value: '#0f0f0f' } },
      'high-contrast': { backgrounds: { value: '#000000' } },
    },
    pauseAnimationAtEnd: true,
    diffThreshold: 0.2,
  },
};

// Common story configurations
export const storyConfig = {
  parameters: {
    layout: 'centered',
    ...chromaticParams,
  },
  decorators: [withNoAnimations],
};

export const fullscreenStoryConfig = {
  parameters: {
    layout: 'fullscreen',
    ...chromaticParams,
  },
  decorators: [withNoAnimations],
};

// Wait for fonts and images to load
export const waitForAssets = async () => {
  // Wait for fonts
  await document.fonts.ready;
  
  // Wait for images
  const images = Array.from(document.querySelectorAll('img'));
  await Promise.all(images.map(img => {
    if (img.complete) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      img.addEventListener('load', resolve);
      img.addEventListener('error', reject);
    });
  }));
};

// Hide dynamic content for consistent screenshots
export const hideDynamicContent = () => {
  const style = document.createElement('style');
  style.innerHTML = \`
    [data-testid="timestamp"],
    [data-testid="random-id"],
    .loading-spinner,
    .skeleton,
    [data-dynamic="true"] {
      visibility: hidden !important;
    }
  \`;
  document.head.appendChild(style);
};

// Pseudo-state utilities
export const addHoverState = (selector: string) => {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.classList.add('hover');
    (el as HTMLElement).style.setProperty('--pseudo-hover', 'true');
  });
};

export const addFocusState = (selector: string) => {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.classList.add('focus');
    (el as HTMLElement).style.setProperty('--pseudo-focus', 'true');
  });
};

export const addActiveState = (selector: string) => {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.classList.add('active');
    (el as HTMLElement).style.setProperty('--pseudo-active', 'true');
  });
};
`;

    fs.writeFileSync(path.join(utilsDir, 'visual-testing.ts'), visualTestingUtils.trim());

    console.log('✅ Visual testing utilities created');
  }

  /**
   * Update package.json scripts for Storybook
   */
  async updatePackageScripts() {
    const packageJsonPath = 'package.json';
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = packageJson.scripts || {};
    
    // Add Storybook scripts if not present
    if (!packageJson.scripts['storybook']) {
      packageJson.scripts['storybook'] = `storybook dev -p ${this.port}`;
    }
    
    if (!packageJson.scripts['build-storybook']) {
      packageJson.scripts['build-storybook'] = `storybook build -o ${this.buildDir}`;
    }

    // Add visual testing specific scripts
    packageJson.scripts['storybook:test'] = 'test-storybook';
    packageJson.scripts['storybook:coverage'] = 'test-storybook --coverage';
    packageJson.scripts['storybook:ci'] = 'concurrently -k -s first -n "SB,TEST" -c "magenta,blue" "npm run build-storybook && npx http-server storybook-static --port 6006 --silent" "wait-on http://127.0.0.1:6006 && npm run storybook:test"';
    
    // Visual regression testing with Chromatic
    packageJson.scripts['chromatic'] = 'chromatic --exit-zero-on-changes';
    packageJson.scripts['chromatic:ci'] = 'chromatic --exit-zero-on-changes --skip="dependabot/**"';

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json scripts for Storybook');
  }

  /**
   * Run Storybook development server
   */
  async runStorybook() {
    console.log('🚀 Starting Storybook development server...');

    try {
      execSync(`npm run storybook`, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to start Storybook:', error.message);
      throw error;
    }
  }

  /**
   * Build Storybook for production
   */
  async buildStorybook() {
    console.log('🏗️ Building Storybook for production...');

    try {
      execSync(`npm run build-storybook`, { stdio: 'inherit' });
      console.log('✅ Storybook built successfully!');
    } catch (error) {
      console.error('❌ Failed to build Storybook:', error.message);
      throw error;
    }
  }

  /**
   * Run visual tests with Chromatic
   */
  async runVisualTests(options = {}) {
    console.log('🎨 Running visual tests with Chromatic...');

    const {
      autoAcceptChanges = false,
      exitZeroOnChanges = true,
      onlyChanged = false,
    } = options;

    let command = 'npx chromatic';
    
    if (autoAcceptChanges) {
      command += ' --auto-accept-changes';
    }
    
    if (exitZeroOnChanges) {
      command += ' --exit-zero-on-changes';
    }
    
    if (onlyChanged) {
      command += ' --only-changed';
    }

    try {
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Visual tests completed successfully!');
    } catch (error) {
      console.error('❌ Visual tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    console.log('📊 Generating Storybook visual testing report...');

    const reportData = {
      timestamp: new Date().toISOString(),
      storybookVersion: 'latest',
      port: this.port,
      buildDir: this.buildDir,
      configDir: this.configDir,
      storiesDir: this.storiesDir,
    };

    const reportPath = 'test-results/visual-reports/storybook-report.json';
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`✅ Storybook report saved to: ${reportPath}`);

    return reportData;
  }
}

module.exports = StorybookIntegration;