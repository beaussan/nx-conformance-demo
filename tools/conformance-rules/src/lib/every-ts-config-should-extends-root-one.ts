import {
  createConformanceRule,
  ConformanceRuleResult,
} from '@nx/powerpack-conformance';
import { join } from 'path';
import {
  readJsonFile,
  workspaceRoot,
  offsetFromRoot,
  updateJson,
  formatFiles,
  readProjectConfiguration,
} from '@nx/devkit';

const rule = createConformanceRule({
  name: 'Every ts config should extends root one',
  category: 'consistency', // `consistency`, `maintainability`, `reliability` or `security`
  reporter: 'project-reporter', // `project-reporter` or `project-files-reporter`
  description:
    'Ensures that every tsconfig.json extends the tsconfig.base.json and have the rights ts paths',
  fixGenerator: async (tree, { violations }) => {
    for (const violation of violations) {
      const projectConfig = readProjectConfiguration(
        tree,
        violation.sourceProject
      );
      const expectedTsPath = join(
        offsetFromRoot(projectConfig.root),
        'tsconfig.base.json'
      );
      console.log(expectedTsPath);
      const tsconfigPath = join(projectConfig.root, 'tsconfig.json');
      updateJson<{ extends: string }>(tree, tsconfigPath, (data) => ({
        ...data,
        extends: expectedTsPath,
      }));
    }
    await formatFiles(tree);
  },
  implementation: async (context) => {
    const { projectGraph } = context;
    const violations: ConformanceRuleResult<'project-reporter'>['details']['violations'] =
      [];

    for (const project of Object.values(projectGraph.nodes)) {
      const tsconfigPath = join(
        workspaceRoot,
        project.data.root,
        'tsconfig.json'
      );
      const expectedTsPath = join(
        offsetFromRoot(project.data.root),
        'tsconfig.base.json'
      );
      const tsconfig = await readJsonFile(tsconfigPath);
      const foundTsPath = tsconfig.extends;
      if (foundTsPath !== expectedTsPath) {
        violations.push({
          sourceProject: project.name,
          message: `tsconfig.json does not extends tsconfig.base.json, found: ${foundTsPath} instead of ${expectedTsPath}`,
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
