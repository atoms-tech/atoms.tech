/**
 * Chromatic Integration for Visual Testing
 * Integrates with Chromatic service for cloud-based visual regression testing
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ChromaticIntegration {
  constructor(options = {}) {
    this.projectToken = options.projectToken || process.env.CHROMATIC_PROJECT_TOKEN;
    this.buildScriptName = options.buildScriptName || 'build-storybook';
    this.storybookDir = options.storybookDir || 'storybook-static';
    this.configDir = options.configDir || '.storybook';
    this.autoAcceptChanges = options.autoAcceptChanges || false;
    this.exitZeroOnChanges = options.exitZeroOnChanges || true;
  }

  /**
   * Setup Chromatic for the project
   */
  async setup() {
    console.log('🎨 Setting up Chromatic integration...');

    // Check if Chromatic is already installed
    try {
      execSync('npx chromatic --version', { stdio: 'pipe' });
      console.log('✅ Chromatic is already installed');
    } catch {
      console.log('📦 Installing Chromatic...');
      execSync('npm install --save-dev chromatic', { stdio: 'inherit' });
    }

    // Setup Storybook if not present
    if (!fs.existsSync(this.configDir)) {
      console.log('📚 Setting up Storybook...');
      execSync('npx storybook@latest init', { stdio: 'inherit' });
    }

    // Update package.json scripts
    await this.updatePackageScripts();

    // Create Chromatic configuration
    await this.createChromaticConfig();

    // Setup GitHub Actions workflow
    await this.setupGitHubActions();

    console.log('✅ Chromatic setup completed!');
  }

  /**
   * Run Chromatic visual tests
   */
  async runVisualTests(options = {}) {
    console.log('🎨 Running Chromatic visual tests...');

    if (!this.projectToken) {
      throw new Error('CHROMATIC_PROJECT_TOKEN is required');
    }

    const {
      buildScriptName = this.buildScriptName,
      autoAcceptChanges = this.autoAcceptChanges,
      exitZeroOnChanges = this.exitZeroOnChanges,
      branchName,
      skip,
      onlyChanged,
      untraced,
      externals,
    } = options;

    let command = `npx chromatic`;
    
    // Add build script
    if (buildScriptName) {
      command += ` --build-script-name=${buildScriptName}`;
    }

    // Add project token
    command += ` --project-token=${this.projectToken}`;

    // Add options
    if (autoAcceptChanges) {
      command += ` --auto-accept-changes`;
    }

    if (exitZeroOnChanges) {
      command += ` --exit-zero-on-changes`;
    }

    if (branchName) {
      command += ` --branch-name=${branchName}`;
    }

    if (skip) {
      command += ` --skip`;
    }

    if (onlyChanged) {
      command += ` --only-changed`;
    }

    if (untraced) {
      command += ` --untraced`;
    }

    if (externals && externals.length > 0) {
      command += ` --externals=${externals.join(',')}`;
    }

    console.log(`📋 Running: ${command}`);

    try {
      const result = execSync(command, { 
        stdio: 'inherit',
        encoding: 'utf8'
      });

      console.log('✅ Chromatic visual tests completed successfully!');
      return result;
    } catch (error) {
      console.error('❌ Chromatic visual tests failed:', error.message);
      throw error;
    }
  }

  /**
   * Update package.json scripts for Chromatic
   */
  async updatePackageScripts() {
    const packageJsonPath = 'package.json';
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    packageJson.scripts = packageJson.scripts || {};
    
    // Add Chromatic scripts
    packageJson.scripts['chromatic'] = 'chromatic --exit-zero-on-changes';
    packageJson.scripts['chromatic:ci'] = 'chromatic --exit-zero-on-changes --skip=dependabot/**';
    packageJson.scripts['chromatic:accept'] = 'chromatic --auto-accept-changes';
    
    // Add Storybook scripts if not present
    if (!packageJson.scripts['storybook']) {
      packageJson.scripts['storybook'] = 'storybook dev -p 6006';
    }
    
    if (!packageJson.scripts['build-storybook']) {
      packageJson.scripts['build-storybook'] = 'storybook build';
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json scripts');
  }

  /**
   * Create Chromatic configuration file
   */
  async createChromaticConfig() {
    const configPath = 'chromatic.config.json';
    
    const config = {
      projectToken: '${CHROMATIC_PROJECT_TOKEN}',
      buildScriptName: this.buildScriptName,
      exitZeroOnChanges: this.exitZeroOnChanges,
      autoAcceptChanges: this.autoAcceptChanges,
      skip: 'dependabot/**',
      externals: [
        'public/**',
        'assets/**',
        'static/**',
      ],
      ignoreLastBuildOnBranch: 'main',
      onlyChanged: true,
      untraced: [
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
      ],
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Created chromatic.config.json');
  }

  /**
   * Setup GitHub Actions workflow for Chromatic
   */
  async setupGitHubActions() {
    const workflowDir = '.github/workflows';
    const workflowPath = path.join(workflowDir, 'chromatic.yml');

    // Create .github/workflows directory if it doesn't exist
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }

    const workflow = `
name: 'Chromatic Visual Tests'

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  chromatic-deployment:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build Storybook
        run: npm run build-storybook
        
      - name: Run Chromatic
        uses: chromaui/action@v11
        with:
          projectToken: \${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: 'build-storybook'
          exitZeroOnChanges: true
          onlyChanged: true
          skip: 'dependabot/**'
          
      - name: Upload Chromatic results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: chromatic-results
          path: |
            chromatic-build-*.log
            .chromatic/
          retention-days: 30
`;

    fs.writeFileSync(workflowPath, workflow.trim());
    console.log('✅ Created GitHub Actions workflow for Chromatic');
  }

  /**
   * Create Storybook stories for visual testing
   */
  async createStorybookStories() {
    console.log('📚 Creating Storybook stories for visual testing...');

    const storiesDir = 'src/stories';
    
    if (!fs.existsSync(storiesDir)) {
      fs.mkdirSync(storiesDir, { recursive: true });
    }

    // Create component stories template
    const componentStoryTemplate = `
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/ui/button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    chromatic: {
      viewports: [320, 768, 1200],
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' },
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

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

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
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

export const Icon: Story = {
  args: {
    size: 'icon',
    children: '🚀',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

// Interactive states for visual testing
export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-x-2">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="space-x-2">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">🚀</Button>
      </div>
      <div className="space-x-2">
        <Button disabled>Disabled</Button>
        <Button disabled variant="secondary">Disabled Secondary</Button>
        <Button disabled variant="destructive">Disabled Destructive</Button>
      </div>
    </div>
  ),
  parameters: {
    chromatic: {
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' },
        'high-contrast': { theme: 'high-contrast' },
      },
    },
  },
};
`;

    const buttonStoryPath = path.join(storiesDir, 'Button.stories.tsx');
    fs.writeFileSync(buttonStoryPath, componentStoryTemplate.trim());

    console.log('✅ Created Storybook stories');
  }

  /**
   * Configure Storybook for visual testing
   */
  async configureStorybook() {
    console.log('⚙️  Configuring Storybook for visual testing...');

    const mainConfigPath = path.join(this.configDir, 'main.ts');
    
    const mainConfig = `
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/**/*.story.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
    '@chromaui/addon-visual-tests',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  features: {
    buildStoriesJson: true,
  },
  staticDirs: ['../public'],
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
};

export default config;
`;

    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    fs.writeFileSync(mainConfigPath, mainConfig.trim());

    // Create preview configuration
    const previewConfigPath = path.join(this.configDir, 'preview.ts');
    
    const previewConfig = `
import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
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
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
    },
    chromatic: {
      // Global Chromatic configuration
      viewports: [375, 768, 1200],
      modes: {
        light: {
          backgrounds: { value: '#ffffff' },
        },
        dark: {
          backgrounds: { value: '#0f0f0f' },
        },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
`;

    fs.writeFileSync(previewConfigPath, previewConfig.trim());

    console.log('✅ Configured Storybook');
  }

  /**
   * Generate visual test report
   */
  async generateReport(buildId) {
    console.log('📊 Generating Chromatic visual test report...');

    const reportData = {
      timestamp: new Date().toISOString(),
      buildId,
      projectToken: this.projectToken,
      buildUrl: buildId ? `https://www.chromatic.com/build?appId=${this.projectToken}&number=${buildId}` : null,
    };

    const reportPath = 'test-results/visual-reports/chromatic-report.json';
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`✅ Chromatic report saved to: ${reportPath}`);

    return reportData;
  }
}

module.exports = ChromaticIntegration;