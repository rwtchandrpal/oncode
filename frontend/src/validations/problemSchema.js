import { z } from 'zod';

export const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  topics: z.string().min(1, 'At least one topic is required'), 
  constraints: z.string().min(1, 'At least one constraint is required'), 
});

export const createProblemSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  topics: z.string().min(1, 'At least one topic is required (comma-separated)'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  constraints: z.string().min(1, 'At least one constraint is required (newline-separated)'),
  visibleTestCase: z.object({
    input: z.string().min(1, 'Visible test case input is required'),
    expectedOutput: z.string().min(1, 'Visible test case expected output is required'),
  }),
  hiddenTestCases: z.array(z.object({
    input: z.string().min(1, 'Hidden test case input is required'),
    expectedOutput: z.string().min(1, 'Hidden test case expected output is required'),
  })).min(1, 'At least one hidden test case is required'),
  examples: z.array(z.object({
    input: z.string().min(1, 'Example input is required'),
    output: z.string().min(1, 'Example output is required'),
    explanation: z.string().optional(),
  })).default([]),
  codeSnippets: z.array(z.object({
    language: z.string(),
    userSnippet: z.string().min(1, 'User starter snippet is required'),
    driverCode: z.string().refine(val => val.includes('{{USER_CODE}}'), {
      message: 'Driver code must contain {{USER_CODE}}',
    }),
  })).min(1, 'At least one code snippet is required'),
  referenceSolutions: z.array(z.object({
    language: z.string(),
    code: z.string().min(1, 'Reference solution code is required'),
  })).min(1, 'At least one reference solution is required'),
});

export default problemSchema;