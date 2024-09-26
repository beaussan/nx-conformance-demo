import {
  createConformanceRule,
  ConformanceRuleResult,
} from '@nx/powerpack-conformance';

const rule = createConformanceRule({
  name: 'Every project should have lint',
  category: 'maintainability', // `consistency`, `maintainability`, `reliability` or `security`
  reporter: 'project-reporter', // `project-reporter` or `project-files-reporter`
  description:
    'This is to ensure that lint is ran on every project, and task inference works properly',
  implementation: async (context) => {
    const { projectGraph } = context;
    const violations: ConformanceRuleResult<'project-reporter'>['details']['violations'] =
      [];

    // console.log('Here is my rule options: ', ruleOptions);

    for (const project of Object.values(projectGraph.nodes)) {
      if (!project.data.targets?.['lint']) {
        violations.push({
          sourceProject: project.name,
          message: 'This project does not have lint',
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
