import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Code2, 
  FileText, 
  Eye, 
  Terminal, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Cpu
} from 'lucide-react';
import axiosClient from '../../utils/axiosClient';
import { createProblemSchema } from '../../validations/problemSchema';
import { getApiErrorMessage } from '../../utils/apiError';

const DEFAULT_CPP_SNIPPET = `class Solution {
public:
    int solve(int n) {
        // Write your solution here
        return n;
    }
};`;

const DEFAULT_CPP_DRIVER = `#include <iostream>
using namespace std;

{{USER_CODE}}

int main() {
    int n;
    if (cin >> n) {
        Solution sol;
        cout << sol.solve(n) << endl;
    }
    return 0;
}`;

const DEFAULT_CPP_SOLUTION = `class Solution {
public:
    int solve(int n) {
        return n;
    }
};`;

const CreateProblem = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');
  const [isSubmittingToJudge0, setIsSubmittingToJudge0] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(createProblemSchema),
    defaultValues: {
      title: '',
      difficulty: 'Easy',
      topics: '',
      description: '',
      constraints: '',
      visibleTestCase: {
        input: '',
        expectedOutput: ''
      },
      hiddenTestCases: [
        { input: '', expectedOutput: '' }
      ],
      examples: [
        { input: '', output: '', explanation: '' }
      ],
      codeSnippets: [
        {
          language: 'cpp',
          userSnippet: DEFAULT_CPP_SNIPPET,
          driverCode: DEFAULT_CPP_DRIVER
        }
      ],
      referenceSolutions: [
        {
          language: 'cpp',
          code: DEFAULT_CPP_SOLUTION
        }
      ]
    }
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const {
    fields: exampleFields,
    append: appendExample,
    remove: removeExample
  } = useFieldArray({
    control,
    name: 'examples'
  });

  const [selectedLanguage, setSelectedLanguage] = useState('cpp');

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setValue('codeSnippets.0.language', lang);
    setValue('referenceSolutions.0.language', lang);
  };

  const onSubmit = async (formData) => {
    setSubmitError('');
    setIsSubmittingToJudge0(true);

    try {
      // Format topics (comma-separated) and constraints (newline-separated) into arrays
      const payload = {
        ...formData,
        topics: formData.topics
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        constraints: formData.constraints
          .split('\n')
          .map((c) => c.trim())
          .filter(Boolean)
      };

      await axiosClient.post('/problem/', payload);
      navigate('/admin/problems');
    } catch (err) {
      console.error('Problem creation failed:', err);
      const serverMsg = getApiErrorMessage(err, 'An unexpected error occurred while creating the problem.');
      setSubmitError(serverMsg);
    } finally {
      setIsSubmittingToJudge0(false);
    }
  };

  const inputClass = "input input-bordered w-full bg-base-100 border-base-content/20 text-base-content focus:border-primary focus:outline-none";
  const textareaClass = "textarea textarea-bordered w-full bg-base-100 border-base-content/20 text-base-content focus:border-primary focus:outline-none font-mono min-h-[120px]";
  const cardClass = "bg-base-200 p-6 rounded-xl border border-base-content/10 shadow-xl space-y-4";

  return (
    <div className="space-y-6 text-base-content max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/admin/problems" className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-base-content">Create New Problem</h1>
          </div>
          <p className="text-base-content/60 text-sm ml-8">Author a coding challenge with driver code and test cases.</p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto ml-8 sm:ml-0">
          <Link to="/admin/problems" className="btn btn-ghost btn-sm">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmittingToJudge0}
            className="btn btn-primary btn-sm gap-2"
          >
            {isSubmittingToJudge0 ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Validating on Judge0...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Publish Problem
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="alert alert-error text-sm shadow-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Problem Validation or Creation Failed</div>
            <div className="text-xs font-mono whitespace-pre-wrap">{submitError}</div>
          </div>
        </div>
      )}

      {isSubmittingToJudge0 && (
        <div className="alert alert-info text-sm shadow-md flex items-center gap-3 bg-info/10 border-info/30 text-info">
          <Cpu className="w-5 h-5 animate-pulse" />
          <span>Executing reference solution against hidden test cases on Judge0 compiler... Please wait.</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* 1. Basic Metadata */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-lg font-bold border-b border-base-content/10 pb-3">
            <FileText className="w-5 h-5 text-primary" />
            <span>Problem Overview</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-base-content/70">Problem Title *</label>
              <input
                type="text"
                placeholder="e.g. Valid Palindrome II"
                {...register('title')}
                className={inputClass}
              />
              {errors.title && <p className="text-xs text-error mt-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-base-content/70">Difficulty *</label>
              <select {...register('difficulty')} className="select select-bordered w-full bg-base-100 border-base-content/20">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              {errors.difficulty && <p className="text-xs text-error mt-1">{errors.difficulty.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-base-content/70">Topics * (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. String, Two Pointers, Greedy"
              {...register('topics')}
              className={inputClass}
            />
            {errors.topics && <p className="text-xs text-error mt-1">{errors.topics.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-base-content/70">Problem Statement * (Markdown Supported)</label>
            <textarea
              rows={6}
              placeholder="Describe the problem, input format, output format, and requirements..."
              {...register('description')}
              className={textareaClass}
            ></textarea>
            {errors.description && <p className="text-xs text-error mt-1">{errors.description.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-base-content/70">Constraints * (One per line)</label>
            <textarea
              rows={3}
              placeholder="1 <= s.length <= 10^5&#10;s consists of lowercase English letters"
              {...register('constraints')}
              className={textareaClass}
            ></textarea>
            {errors.constraints && <p className="text-xs text-error mt-1">{errors.constraints.message}</p>}
          </div>
        </div>

        {/* 2. Examples */}
        <div className={cardClass}>
          <div className="flex items-center justify-between border-b border-base-content/10 pb-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Eye className="w-5 h-5 text-secondary" />
              <span>Problem Examples</span>
            </div>
            <button
              type="button"
              onClick={() => appendExample({ input: '', output: '', explanation: '' })}
              className="btn btn-xs btn-outline btn-secondary gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Example
            </button>
          </div>

          <p className="text-xs text-base-content/60">Examples displayed on the problem statement page for users.</p>

          <div className="space-y-4">
            {exampleFields.map((field, idx) => (
              <div key={field.id} className="p-4 bg-base-100 rounded-lg border border-base-content/10 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">Example {idx + 1}</span>
                  {exampleFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(idx)}
                      className="btn btn-ghost btn-xs btn-square text-error"
                      aria-label="Remove Example"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-base-content/60">Input</label>
                    <input
                      type="text"
                      placeholder='s = "aba"'
                      {...register(`examples.${idx}.input`)}
                      className={inputClass}
                    />
                    {errors.examples?.[idx]?.input && (
                      <p className="text-xs text-error">{errors.examples[idx].input.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-base-content/60">Output</label>
                    <input
                      type="text"
                      placeholder="true"
                      {...register(`examples.${idx}.output`)}
                      className={inputClass}
                    />
                    {errors.examples?.[idx]?.output && (
                      <p className="text-xs text-error">{errors.examples[idx].output.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-base-content/60">Explanation (Optional)</label>
                  <input
                    type="text"
                    placeholder="Explanation of the sample output..."
                    {...register(`examples.${idx}.explanation`)}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Visible Test Case */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-lg font-bold border-b border-base-content/10 pb-3">
            <Terminal className="w-5 h-5 text-accent" />
            <span>Visible Sample Test Case *</span>
          </div>

          <p className="text-xs text-base-content/60">
            The default test case populated in the workspace "Testcase" tab when users load the problem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-base-content/70">Sample Input (stdin) *</label>
              <textarea
                rows={3}
                placeholder="aba"
                {...register('visibleTestCase.input')}
                className={textareaClass}
              ></textarea>
              {errors.visibleTestCase?.input && (
                <p className="text-xs text-error">{errors.visibleTestCase.input.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-base-content/70">Expected Output (stdout) *</label>
              <textarea
                rows={3}
                placeholder="true"
                {...register('visibleTestCase.expectedOutput')}
                className={textareaClass}
              ></textarea>
              {errors.visibleTestCase?.expectedOutput && (
                <p className="text-xs text-error">{errors.visibleTestCase.expectedOutput.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* 4. Hidden Evaluation Test Cases */}
        <div className={cardClass}>
          <div className="flex items-center justify-between border-b border-base-content/10 pb-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Cpu className="w-5 h-5 text-warning" />
              <span>Hidden Evaluation Test Cases *</span>
            </div>
            <button
              type="button"
              onClick={() => appendHidden({ input: '', expectedOutput: '' })}
              className="btn btn-xs btn-outline btn-warning gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Hidden Test Case
            </button>
          </div>

          <p className="text-xs text-base-content/60">
            These test cases are evaluated by Judge0 on user submissions. The reference solution will be tested against these before saving!
          </p>

          {errors.hiddenTestCases?.root && (
            <p className="text-xs text-error">{errors.hiddenTestCases.root.message}</p>
          )}

          <div className="space-y-4">
            {hiddenFields.map((field, idx) => (
              <div key={field.id} className="p-4 bg-base-100 rounded-lg border border-base-content/10 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-warning uppercase tracking-wider">
                    Hidden Test Case {idx + 1}
                  </span>
                  {hiddenFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHidden(idx)}
                      className="btn btn-ghost btn-xs btn-square text-error"
                      aria-label="Remove Hidden Test Case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-base-content/60">Input (stdin) *</label>
                    <textarea
                      rows={2}
                      placeholder="Input data"
                      {...register(`hiddenTestCases.${idx}.input`)}
                      className={textareaClass}
                    ></textarea>
                    {errors.hiddenTestCases?.[idx]?.input && (
                      <p className="text-xs text-error">{errors.hiddenTestCases[idx].input.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-base-content/60">Expected Output (stdout) *</label>
                    <textarea
                      rows={2}
                      placeholder="Expected output"
                      {...register(`hiddenTestCases.${idx}.expectedOutput`)}
                      className={textareaClass}
                    ></textarea>
                    {errors.hiddenTestCases?.[idx]?.expectedOutput && (
                      <p className="text-xs text-error">{errors.hiddenTestCases[idx].expectedOutput.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Driver Code Architecture & Starter Snippet */}
        <div className={cardClass}>
          <div className="flex items-center justify-between border-b border-base-content/10 pb-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Code2 className="w-5 h-5 text-info" />
              <span>Driver Code & Starter Snippet *</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleLanguageChange('cpp')}
                className={`btn btn-xs ${selectedLanguage === 'cpp' ? 'btn-primary' : 'btn-ghost'}`}
              >
                C++
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('java')}
                className={`btn btn-xs ${selectedLanguage === 'java' ? 'btn-primary' : 'btn-ghost'}`}
              >
                Java
              </button>
            </div>
          </div>

          <div className="alert alert-warning/10 text-xs text-warning border-warning/20">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Driver code must contain the exact placeholder <code className="bg-base-300 px-1 py-0.5 rounded font-mono font-bold">{"{{USER_CODE}}"}</code> where user and reference code will be injected.</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-base-content/70">User Starter Snippet ({selectedLanguage.toUpperCase()}) *</label>
            <p className="text-xs text-base-content/50">Initial template loaded into the code editor when a user starts the problem.</p>
            <textarea
              rows={6}
              {...register('codeSnippets.0.userSnippet')}
              className={textareaClass}
            ></textarea>
            {errors.codeSnippets?.[0]?.userSnippet && (
              <p className="text-xs text-error">{errors.codeSnippets[0].userSnippet.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-base-content/70">Complete Driver Code ({selectedLanguage.toUpperCase()}) *</label>
            <p className="text-xs text-base-content/50">Wraps user code with I/O handling for Judge0 compilation and execution.</p>
            <textarea
              rows={8}
              {...register('codeSnippets.0.driverCode')}
              className={textareaClass}
            ></textarea>
            {errors.codeSnippets?.[0]?.driverCode && (
              <p className="text-xs text-error">{errors.codeSnippets[0].driverCode.message}</p>
            )}
          </div>
        </div>

        {/* 6. Reference Solution */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-lg font-bold border-b border-base-content/10 pb-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span>Reference Solution ({selectedLanguage.toUpperCase()}) *</span>
          </div>

          <p className="text-xs text-base-content/60">
            A correct implementation in {selectedLanguage.toUpperCase()}. Upon clicking Publish, the server will compile this reference solution with your driver code on Judge0 and verify it passes all hidden test cases.
          </p>

          <div className="space-y-1">
            <textarea
              rows={8}
              {...register('referenceSolutions.0.code')}
              className={textareaClass}
            ></textarea>
            {errors.referenceSolutions?.[0]?.code && (
              <p className="text-xs text-error">{errors.referenceSolutions[0].code.message}</p>
            )}
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex justify-end gap-3 pt-4">
          <Link to="/admin/problems" className="btn btn-ghost">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmittingToJudge0}
            className="btn btn-primary px-8 gap-2 shadow-lg"
          >
            {isSubmittingToJudge0 ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Validating on Judge0...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Publish Problem
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateProblem;
