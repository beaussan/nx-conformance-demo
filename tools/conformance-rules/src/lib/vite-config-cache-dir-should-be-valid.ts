import {
  createConformanceRule,
  ConformanceRuleResult,
} from '@nx/powerpack-conformance';
import { join } from 'path';
import * as fs from 'node:fs';
import {
  workspaceRoot,
  offsetFromRoot,
  readProjectConfiguration,
  Tree,
  formatFiles,
} from '@nx/devkit';
import { includes, ast, replace } from '@phenomnomnominal/tsquery';

const BASE_SELECTOR =
  'CallExpression:has(Identifier[name="defineConfig"]) PropertyAssignment:has(Identifier[name="cacheDir"]) StringLiteral';

const rule = createConformanceRule({
  name: 'Vite cache dir should be valid and scoped to the project',
  category: 'reliability', // `consistency`, `maintainability`, `reliability` or `security`
  reporter: 'project-reporter', // `project-reporter` or `project-files-reporter`
  description: 'Ensure that the vite cache dir is scoped to the project',

  fixGenerator: async (tree: Tree, { violations }) => {
    for (const violation of violations) {
      const projectConfig = readProjectConfiguration(
        tree,
        violation.sourceProject
      );
      const viteConfigPath = join(projectConfig.root, 'vite.config.ts');
      const expectedCacheDir = join(
        offsetFromRoot(projectConfig.root),
        'node_modules/.vite',
        projectConfig.root
      );
      const viteConfigContent = tree.read(viteConfigPath, 'utf-8');
      if (!viteConfigContent) {
        continue;
      }
      const newViteConfig = replace(
        viteConfigContent,
        BASE_SELECTOR,
        () => `'${expectedCacheDir}'`
      );
      tree.write(viteConfigPath, newViteConfig);
    }
    await formatFiles(tree);
  },
  implementation: async (context) => {
    const { projectGraph } = context;
    const violations: ConformanceRuleResult<'project-reporter'>['details']['violations'] =
      [];

    for (const project of Object.values(projectGraph.nodes)) {
      const viteConfigPath = join(
        workspaceRoot,
        project.data.root,
        'vite.config.ts'
      );

      if (!fs.existsSync(viteConfigPath)) {
        continue;
      }
      const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');

      const expectedCacheDir = join(
        offsetFromRoot(project.data.root),
        'node_modules/.vite',
        project.data.root
      );

      if (
        !includes(
          ast(viteConfigContent),
          `${BASE_SELECTOR}[value="${expectedCacheDir}"]`
        )
      ) {
        violations.push({
          message: `Vite cache dir should be "${expectedCacheDir}"`,
          sourceProject: project.name,
        });
      }
    }

    return {
      severity: 'high', // 'high', 'medium' or 'low'
      details: {
        violations,
      },
    };
  },
});

export default rule;
