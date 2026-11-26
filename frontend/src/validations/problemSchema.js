import { z } from 'zod';

// Languages the judge supports. Each problem enables one or more of them, with its own starter
// snippet, driver code and reference solution.
export const LANGUAGES = [
  { id: 'cpp', label: 'C++' },
  { id: 'java', label: 'Java' },
];

const languageBlock = z.object({
  enabled: z.boolean(),
  userSnippet: z.string(),
  driverCode: z.string(),
  solution: z.string(),
});

const testCase = z.object({
  input: z.string().min(1, 'Input is required'),
  expectedOutput: z.string().min(1, 'Expected output is required'),
});

// requireSolutions: true when creating (every enabled language must be verifiable on Judge0).
// When editing, an existing language may lack a reference solution (older data); the backend then
// simply cannot verify that language's driver.
export const makeProblemFormSchema = ({ requireSolutions }) =>
  z
    .object({
      title: z.string().trim().min(3, 'Title must be at least 3 characters'),
      // URL key (/problems/<slug>). Empty: generated from the title on create, unchanged on edit.
      slug: z
        .string()
        .trim()
        .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words joined by hyphens, e.g. two-sum')
        .default(''),
      difficulty: z.enum(['Easy', 'Medium', 'Hard']),
      topics: z.string().min(1, 'At least one topic is required (comma-separated)'),
      description: z.string().min(10, 'Description must be at least 10 characters'),
      constraints: z.string(),
      visibleTestCase: testCase,
      hiddenTestCases: z.array(testCase).min(1, 'At least one hidden test case is required'),
      examples: z
        .array(
          z.object({
            input: z.string().min(1, 'Example input is required'),
            output: z.string().min(1, 'Example output is required'),
            explanation: z.string().optional(),
          })
        )
        .default([]),
      languages: z.object(Object.fromEntries(LANGUAGES.map((l) => [l.id, languageBlock]))),
    })
    .superRefine((data, ctx) => {
      const enabled = LANGUAGES.filter((l) => data.languages[l.id]?.enabled);
      if (enabled.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['languages', 'root'], message: 'Enable at least one language' });
      }
      for (const { id } of enabled) {
        const block = data.languages[id];
        if (!block.userSnippet.trim()) {
          ctx.addIssue({ code: 'custom', path: ['languages', id, 'userSnippet'], message: 'Starter snippet is required' });
        }
        if (!block.driverCode.includes('{{USER_CODE}}')) {
          ctx.addIssue({ code: 'custom', path: ['languages', id, 'driverCode'], message: 'Driver code must contain {{USER_CODE}}' });
        }
        if (requireSolutions && !block.solution.trim()) {
          ctx.addIssue({ code: 'custom', path: ['languages', id, 'solution'], message: 'Reference solution is required' });
        }
      }
    });

const emptyLanguage = { enabled: false, userSnippet: '', driverCode: '', solution: '' };

// API problem (from GET /problem/:id/admin) -> form values
export const problemToFormValues = (problem) => ({
  title: problem.title || '',
  slug: problem.slug || '',
  difficulty: problem.difficulty || 'Easy',
  topics: (problem.topics || []).join(', '),
  description: problem.description || '',
  constraints: (problem.constraints || []).join('\n'),
  visibleTestCase: {
    input: problem.visibleTestCase?.input || '',
    expectedOutput: problem.visibleTestCase?.expectedOutput || '',
  },
  hiddenTestCases: (problem.hiddenTestCases || []).map(({ input, expectedOutput }) => ({ input, expectedOutput })),
  examples: (problem.examples || []).map(({ input, output, explanation }) => ({ input, output, explanation: explanation || '' })),
  languages: Object.fromEntries(
    LANGUAGES.map(({ id }) => {
      const snippet = (problem.codeSnippets || []).find((s) => s.language?.toLowerCase() === id);
      const solution = (problem.referenceSolutions || []).find((s) => s.language?.toLowerCase() === id);
      return [
        id,
        snippet
          ? { enabled: true, userSnippet: snippet.userSnippet || '', driverCode: snippet.driverCode || '', solution: solution?.code || '' }
          : { ...emptyLanguage },
      ];
    })
  ),
});

// Form values -> API payload (codeSnippets / referenceSolutions arrays, one entry per enabled language)
export const formValuesToPayload = (values) => {
  const enabled = LANGUAGES.filter((l) => values.languages[l.id]?.enabled).map((l) => l.id);
  return {
    title: values.title,
    // "" means "not given": the backend generates the slug on create and keeps the current one on edit
    slug: (values.slug || '').trim(),
    difficulty: values.difficulty,
    description: values.description,
    topics: values.topics.split(',').map((t) => t.trim()).filter(Boolean),
    constraints: values.constraints.split('\n').map((c) => c.trim()).filter(Boolean),
    visibleTestCase: values.visibleTestCase,
    hiddenTestCases: values.hiddenTestCases,
    examples: values.examples,
    codeSnippets: enabled.map((id) => ({
      language: id,
      userSnippet: values.languages[id].userSnippet,
      driverCode: values.languages[id].driverCode,
    })),
    referenceSolutions: enabled
      .filter((id) => values.languages[id].solution.trim())
      .map((id) => ({ language: id, code: values.languages[id].solution })),
  };
};
