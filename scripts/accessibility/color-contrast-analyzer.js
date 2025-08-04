/**
 * Color Contrast Analyzer
 * 
 * WCAG 2.1 AA/AAA color contrast validation tool
 * Analyzes colors and generates compliance reports
 */

const fs = require('fs');
const path = require('path');

class ColorContrastAnalyzer {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || 'test-results/accessibility',
      wcagLevel: options.wcagLevel || 'AA',
      includeAAA: options.includeAAA || false,
      ...options
    };
    
    this.results = [];
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * Calculate relative luminance of a color
   */
  getRelativeLuminance(color) {
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(channel => {
      const normalized = channel / 255;
      return normalized <= 0.03928 
        ? normalized / 12.92 
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Parse color string to RGB values
   */
  parseColor(color) {
    // Handle different color formats
    if (color.startsWith('#')) {
      return this.parseHex(color);
    } else if (color.startsWith('rgb')) {
      return this.parseRgb(color);
    } else if (color.startsWith('hsl')) {
      return this.parseHsl(color);
    } else {
      // Try to parse as named color
      return this.parseNamedColor(color);
    }
  }

  parseHex(hex) {
    // Remove # and handle 3 or 6 digit hex
    const cleanHex = hex.replace('#', '');
    
    if (cleanHex.length === 3) {
      return [
        parseInt(cleanHex[0] + cleanHex[0], 16),
        parseInt(cleanHex[1] + cleanHex[1], 16),
        parseInt(cleanHex[2] + cleanHex[2], 16)
      ];
    } else if (cleanHex.length === 6) {
      return [
        parseInt(cleanHex.substr(0, 2), 16),
        parseInt(cleanHex.substr(2, 2), 16),
        parseInt(cleanHex.substr(4, 2), 16)
      ];
    }
    
    return null;
  }

  parseRgb(rgb) {
    const values = rgb.match(/\\d+/g);
    return values ? values.map(v => parseInt(v)) : null;
  }

  parseHsl(hsl) {
    // Convert HSL to RGB
    const values = hsl.match(/\\d+/g);
    if (!values || values.length < 3) return null;

    const h = parseInt(values[0]) / 360;
    const s = parseInt(values[1]) / 100;
    const l = parseInt(values[2]) / 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  parseNamedColor(name) {
    // Basic named colors - extend as needed
    const namedColors = {
      'white': [255, 255, 255],
      'black': [0, 0, 0],
      'red': [255, 0, 0],
      'green': [0, 128, 0],
      'blue': [0, 0, 255],
      'yellow': [255, 255, 0],
      'cyan': [0, 255, 255],
      'magenta': [255, 0, 255],
      'gray': [128, 128, 128],
      'grey': [128, 128, 128]
    };

    return namedColors[name.toLowerCase()] || null;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1, color2) {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG standards
   */
  meetsWCAGStandards(ratio, level = 'AA', isLargeText = false) {
    const thresholds = {
      'AA': {
        normal: 4.5,
        large: 3.0
      },
      'AAA': {
        normal: 7.0,
        large: 4.5
      }
    };

    const threshold = thresholds[level][isLargeText ? 'large' : 'normal'];
    return ratio >= threshold;
  }

  /**
   * Analyze color combinations
   */
  analyzeColorCombinations(combinations) {
    console.log('🎨 Starting Color Contrast Analysis');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    combinations.forEach((combo, index) => {
      console.log(`🔍 Analyzing combination ${index + 1}: ${combo.name || `${combo.foreground} on ${combo.background}`}`);
      
      const result = this.analyzeCombination(combo);
      this.results.push(result);
      
      if (result.wcag.AA.normal && result.wcag.AA.large) {
        console.log(`✅ Passes WCAG AA`);
      } else {
        console.log(`❌ Fails WCAG AA`);
      }
    });

    this.generateReports();
    this.logSummary();
    
    return this.results;
  }

  /**
   * Analyze a single color combination
   */
  analyzeCombination(combination) {
    const { foreground, background, name, context } = combination;
    
    const contrastRatio = this.getContrastRatio(foreground, background);
    
    const result = {
      name: name || `${foreground} on ${background}`,
      foreground,
      background,
      context: context || 'general',
      contrastRatio: Math.round(contrastRatio * 100) / 100,
      wcag: {
        AA: {
          normal: this.meetsWCAGStandards(contrastRatio, 'AA', false),
          large: this.meetsWCAGStandards(contrastRatio, 'AA', true)
        },
        AAA: {
          normal: this.meetsWCAGStandards(contrastRatio, 'AAA', false),
          large: this.meetsWCAGStandards(contrastRatio, 'AAA', true)
        }
      },
      recommendations: this.generateRecommendations(contrastRatio, foreground, background),
      timestamp: new Date().toISOString()
    };

    return result;
  }

  /**
   * Generate recommendations for improving contrast
   */
  generateRecommendations(ratio, foreground, background) {
    const recommendations = [];

    if (ratio < 4.5) {
      recommendations.push({
        type: 'critical',
        message: `Contrast ratio ${ratio.toFixed(2)} fails WCAG AA standards (4.5:1 required)`,
        suggestions: [
          'Darken the foreground color',
          'Lighten the background color',
          'Use a completely different color combination'
        ]
      });
    }

    if (ratio < 7.0 && ratio >= 4.5) {
      recommendations.push({
        type: 'improvement',
        message: `Contrast ratio ${ratio.toFixed(2)} meets AA but not AAA standards (7:1 required)`,
        suggestions: [
          'Consider improving contrast for better accessibility',
          'Test with users who have visual impairments'
        ]
      });
    }

    if (ratio >= 7.0) {
      recommendations.push({
        type: 'excellent',
        message: `Contrast ratio ${ratio.toFixed(2)} exceeds WCAG AAA standards`,
        suggestions: [
          'This combination provides excellent accessibility'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive reports
   */
  generateReports() {
    // JSON Report
    const jsonReport = {
      metadata: {
        timestamp: new Date().toISOString(),
        tool: 'Color Contrast Analyzer',
        wcagVersion: '2.1',
        testStandards: ['AA', 'AAA'],
        combinationsTested: this.results.length
      },
      summary: this.generateSummary(),
      results: this.results
    };

    const jsonPath = path.join(this.options.outputDir, 'color-contrast-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

    // HTML Report
    const htmlReport = this.generateHtmlReport(jsonReport);
    const htmlPath = path.join(this.options.outputDir, 'color-contrast-report.html');
    fs.writeFileSync(htmlPath, htmlReport);

    // CSV Report for data analysis
    const csvReport = this.generateCsvReport();
    const csvPath = path.join(this.options.outputDir, 'color-contrast-data.csv');
    fs.writeFileSync(csvPath, csvReport);

    console.log(`📄 Reports generated:`);
    console.log(`   📋 JSON: ${jsonPath}`);
    console.log(`   🌐 HTML: ${htmlPath}`);
    console.log(`   📊 CSV: ${csvPath}`);
  }

  generateSummary() {
    const summary = {
      total: this.results.length,
      passing: {
        AA: {
          normal: this.results.filter(r => r.wcag.AA.normal).length,
          large: this.results.filter(r => r.wcag.AA.large).length
        },
        AAA: {
          normal: this.results.filter(r => r.wcag.AAA.normal).length,
          large: this.results.filter(r => r.wcag.AAA.large).length
        }
      },
      failing: {
        AA: {
          normal: this.results.filter(r => !r.wcag.AA.normal).length,
          large: this.results.filter(r => !r.wcag.AA.large).length
        },
        AAA: {
          normal: this.results.filter(r => !r.wcag.AAA.normal).length,
          large: this.results.filter(r => !r.wcag.AAA.large).length
        }
      },
      averageRatio: this.results.reduce((sum, r) => sum + r.contrastRatio, 0) / this.results.length,
      highestRatio: Math.max(...this.results.map(r => r.contrastRatio)),
      lowestRatio: Math.min(...this.results.map(r => r.contrastRatio))
    };

    return summary;
  }

  generateHtmlReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Color Contrast Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 5px; }
        .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .color-sample { width: 100px; height: 40px; border: 1px solid #ccc; display: inline-block; margin: 5px; border-radius: 3px; }
        .result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .pass { border-left: 5px solid #10b981; }
        .fail { border-left: 5px solid #ef4444; }
        .warning { border-left: 5px solid #f59e0b; }
        .ratio { font-size: 1.5em; font-weight: bold; }
        .wcag-badges { margin: 10px 0; }
        .badge { padding: 5px 10px; border-radius: 3px; color: white; margin: 2px; display: inline-block; }
        .badge.pass { background: #10b981; }
        .badge.fail { background: #ef4444; }
        .recommendations { background: #f8fafc; padding: 10px; border-radius: 3px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Color Contrast Analysis Report</h1>
        <p>WCAG 2.1 AA/AAA Compliance Analysis</p>
        <p>Generated on ${data.metadata.timestamp}</p>
    </div>

    <div class="summary">
        <h2>📊 Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div>
                <div style="font-size: 2em; font-weight: bold;">${data.summary.total}</div>
                <div>Total Combinations</div>
            </div>
            <div>
                <div style="font-size: 2em; font-weight: bold; color: #10b981;">${data.summary.passing.AA.normal}</div>
                <div>Pass WCAG AA</div>
            </div>
            <div>
                <div style="font-size: 2em; font-weight: bold; color: #3b82f6;">${data.summary.passing.AAA.normal}</div>
                <div>Pass WCAG AAA</div>
            </div>
            <div>
                <div style="font-size: 2em; font-weight: bold;">${data.summary.averageRatio.toFixed(2)}</div>
                <div>Average Ratio</div>
            </div>
        </div>
    </div>

    <h2>📝 Detailed Results</h2>
    ${data.results.map(result => `
        <div class="result ${result.wcag.AA.normal ? 'pass' : 'fail'}">
            <h3>${result.name}</h3>
            
            <div style="display: flex; align-items: center; gap: 20px; margin: 15px 0;">
                <div>
                    <div class="color-sample" style="background-color: ${result.background};"></div>
                    <div>Background: ${result.background}</div>
                </div>
                <div>
                    <div class="color-sample" style="background-color: ${result.foreground}; color: ${result.background};"></div>
                    <div>Foreground: ${result.foreground}</div>
                </div>
                <div>
                    <div class="ratio">${result.contrastRatio}:1</div>
                    <div>Contrast Ratio</div>
                </div>
            </div>

            <div class="wcag-badges">
                <span class="badge ${result.wcag.AA.normal ? 'pass' : 'fail'}">WCAG AA Normal</span>
                <span class="badge ${result.wcag.AA.large ? 'pass' : 'fail'}">WCAG AA Large</span>
                <span class="badge ${result.wcag.AAA.normal ? 'pass' : 'fail'}">WCAG AAA Normal</span>
                <span class="badge ${result.wcag.AAA.large ? 'pass' : 'fail'}">WCAG AAA Large</span>
            </div>

            ${result.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h4>💡 Recommendations</h4>
                    ${result.recommendations.map(rec => `
                        <div>
                            <strong>${rec.type.toUpperCase()}:</strong> ${rec.message}
                            <ul>
                                ${rec.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('')}

    <div style="margin-top: 40px; padding: 20px; background: #f0f0f0; border-radius: 5px;">
        <h3>📚 WCAG Guidelines</h3>
        <ul>
            <li><strong>WCAG AA Normal Text:</strong> 4.5:1 contrast ratio minimum</li>
            <li><strong>WCAG AA Large Text:</strong> 3:1 contrast ratio minimum</li>
            <li><strong>WCAG AAA Normal Text:</strong> 7:1 contrast ratio minimum</li>
            <li><strong>WCAG AAA Large Text:</strong> 4.5:1 contrast ratio minimum</li>
        </ul>
        <p><strong>Large Text:</strong> 18pt+ or 14pt+ bold text</p>
    </div>
</body>
</html>`;
  }

  generateCsvReport() {
    const headers = [
      'Name',
      'Foreground',
      'Background', 
      'Contrast Ratio',
      'WCAG AA Normal',
      'WCAG AA Large',
      'WCAG AAA Normal',
      'WCAG AAA Large',
      'Context'
    ];

    const rows = this.results.map(result => [
      result.name,
      result.foreground,
      result.background,
      result.contrastRatio,
      result.wcag.AA.normal ? 'PASS' : 'FAIL',
      result.wcag.AA.large ? 'PASS' : 'FAIL',
      result.wcag.AAA.normal ? 'PASS' : 'FAIL',
      result.wcag.AAA.large ? 'PASS' : 'FAIL',
      result.context
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\\n');
  }

  logSummary() {
    const summary = this.generateSummary();
    
    console.log('\\n🎨 Color Contrast Analysis Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total Combinations: ${summary.total}`);
    console.log(`✅ WCAG AA Compliant: ${summary.passing.AA.normal}/${summary.total}`);
    console.log(`🏆 WCAG AAA Compliant: ${summary.passing.AAA.normal}/${summary.total}`);
    console.log(`📈 Average Ratio: ${summary.averageRatio.toFixed(2)}:1`);
    console.log(`🔝 Highest Ratio: ${summary.highestRatio.toFixed(2)}:1`);
    console.log(`🔻 Lowest Ratio: ${summary.lowestRatio.toFixed(2)}:1`);
    
    if (summary.failing.AA.normal > 0) {
      console.log(`\\n❌ ${summary.failing.AA.normal} combinations fail WCAG AA standards`);
    } else {
      console.log('\\n✅ All combinations meet WCAG AA standards!');
    }
    
    console.log('\\n📁 Reports saved to: test-results/accessibility/');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
  }
}

// Default color combinations to test
const defaultCombinations = [
  { name: 'Primary Button', foreground: '#ffffff', background: '#3b82f6', context: 'button' },
  { name: 'Secondary Button', foreground: '#374151', background: '#f9fafb', context: 'button' },
  { name: 'Success Message', foreground: '#065f46', background: '#d1fae5', context: 'alert' },
  { name: 'Error Message', foreground: '#991b1b', background: '#fee2e2', context: 'alert' },
  { name: 'Warning Message', foreground: '#92400e', background: '#fef3c7', context: 'alert' },
  { name: 'Link Text', foreground: '#2563eb', background: '#ffffff', context: 'link' },
  { name: 'Body Text', foreground: '#111827', background: '#ffffff', context: 'text' },
  { name: 'Muted Text', foreground: '#6b7280', background: '#ffffff', context: 'text' },
  { name: 'Dark Mode Text', foreground: '#f9fafb', background: '#111827', context: 'dark-mode' },
  { name: 'Dark Mode Link', foreground: '#60a5fa', background: '#111827', context: 'dark-mode' }
];

// CLI execution
if (require.main === module) {
  const analyzer = new ColorContrastAnalyzer();
  
  analyzer.analyzeColorCombinations(defaultCombinations)
    .then(() => {
      console.log('🎉 Color contrast analysis completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Color contrast analysis failed:', error);
      process.exit(1);
    });
}

module.exports = ColorContrastAnalyzer;