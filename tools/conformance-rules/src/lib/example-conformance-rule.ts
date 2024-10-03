import {
  createConformanceRule,
  ConformanceRuleResult,
} from '@nx/powerpack-conformance';

const rule = createConformanceRule({
  name: 'Example Conformance Rule',
  description: 'This is the description of the example conformance rule',
  category: 'maintainability', // `consistency`, `maintainability`, `reliability` or `security`
  reporter: 'project-reporter', // `project-reporter` or `project-files-reporter`
  implementation: async (context) => {
    const { projectGraph, ruleOptions } = context;
    const violations: ConformanceRuleResult<'project-reporter'>['details']['violations'] =
      [];

    for (const project of Object.values(projectGraph.nodes)) {
      violations.push({
        sourceProject: project.name,
        message: `This is an example violation message. Rule options: ${JSON.stringify(
          ruleOptions
        )}`,
      });
    }

    return {
      severity: 'medium', // 'high', 'medium' or 'low'
      details: {
        violations,
      },
    };
  },
});

export default rule;
