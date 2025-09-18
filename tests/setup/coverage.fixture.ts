import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Create a custom test fixture that extends the base test with coverage collection
export const test = base.extend({
  page: async ({ page }, use) => {
    // Only collect coverage when E2E_COVERAGE environment variable is set
    if (process.env.E2E_COVERAGE) {
      await page.addInitScript(() => {
        // This script will be injected into the page to collect coverage
        window.addEventListener('beforeunload', () => {
          // Ensure coverage is saved before page unloads
          if ((window as any).__coverage__) {
            // Store coverage data in sessionStorage to be retrieved later
            sessionStorage.setItem('__coverage__', JSON.stringify((window as any).__coverage__));
          }
        });
      });
    }

    await use(page);

    // After the test, collect coverage data if enabled
    if (process.env.E2E_COVERAGE) {
      try {
        // Try to get coverage from the page
        const coverage = await page.evaluate(() => (window as any).__coverage__);
        
        if (coverage) {
          // Create .nyc_output directory if it doesn't exist
          const outputDir = path.join(process.cwd(), '.nyc_output');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          // Generate a unique filename for this coverage data
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const coverageFile = path.join(outputDir, `coverage-${timestamp}-${Math.random().toString(36).substr(2, 9)}.json`);

          // Write coverage data to file
          fs.writeFileSync(coverageFile, JSON.stringify(coverage));
          console.log(`Coverage data saved to: ${coverageFile}`);
        } else {
          // Try to get coverage from sessionStorage as fallback
          const sessionStorageCoverage = await page.evaluate(() => sessionStorage.getItem('__coverage__'));
          if (sessionStorageCoverage) {
            const coverage = JSON.parse(sessionStorageCoverage);
            const outputDir = path.join(process.cwd(), '.nyc_output');
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const coverageFile = path.join(outputDir, `coverage-${timestamp}-${Math.random().toString(36).substr(2, 9)}.json`);

            fs.writeFileSync(coverageFile, JSON.stringify(coverage));
            console.log(`Coverage data (from sessionStorage) saved to: ${coverageFile}`);
          }
        }
      } catch (error) {
        console.warn('Failed to collect coverage data:', error);
      }
    }
  },
});

// Export the custom test and expect
export { expect };

// Utility function to merge coverage files
export function mergeCoverageFiles(outputDir: string = '.nyc_output'): void {
  if (!fs.existsSync(outputDir)) {
    console.log('No coverage directory found');
    return;
  }

  const files = fs.readdirSync(outputDir).filter(file => file.startsWith('coverage-') && file.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('No coverage files found');
    return;
  }

  let mergedCoverage: any = {};

  files.forEach(file => {
    try {
      const filePath = path.join(outputDir, file);
      const coverageData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Merge coverage data
      Object.keys(coverageData).forEach(key => {
        if (!mergedCoverage[key]) {
          mergedCoverage[key] = coverageData[key];
        } else {
          // Merge coverage data for the same file
          const existingData = mergedCoverage[key];
          const newData = coverageData[key];
          
          // Merge statement maps
          if (existingData.s && newData.s) {
            Object.keys(newData.s).forEach(statementKey => {
              if (!existingData.s[statementKey]) {
                existingData.s[statementKey] = newData.s[statementKey];
              } else {
                existingData.s[statementKey] += newData.s[statementKey];
              }
            });
          }
          
          // Merge function maps
          if (existingData.f && newData.f) {
            Object.keys(newData.f).forEach(functionKey => {
              if (!existingData.f[functionKey]) {
                existingData.f[functionKey] = newData.f[functionKey];
              } else {
                existingData.f[functionKey] += newData.f[functionKey];
              }
            });
          }
          
          // Merge branch maps
          if (existingData.b && newData.b) {
            Object.keys(newData.b).forEach(branchKey => {
              if (!existingData.b[branchKey]) {
                existingData.b[branchKey] = newData.b[branchKey];
              } else {
                existingData.b[branchKey] = existingData.b[branchKey].map((count: number, index: number) => 
                  count + (newData.b[branchKey][index] || 0)
                );
              }
            });
          }
        }
      });
    } catch (error) {
      console.warn(`Failed to merge coverage file ${file}:`, error);
    }
  });

  // Write merged coverage data
  const mergedFile = path.join(outputDir, 'coverage-final.json');
  fs.writeFileSync(mergedFile, JSON.stringify(mergedCoverage));
  console.log(`Merged coverage data saved to: ${mergedFile}`);
}