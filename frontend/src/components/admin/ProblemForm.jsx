import { useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { ArrowLeft, Plus, Trash2, Code2, FileText, Eye, Terminal, AlertCircle, CheckCircle2, HelpCircle, Cpu } from 'lucide-react';
import { LANGUAGES, makeProblemFormSchema, formValuesToPayload } from '../../validations/problemSchema';

const inputClass = 'input input-bordered w-full bg-base-100 border-base-content/20 text-base-content focus:border-primary focus:outline-none';
const textareaClass = 'textarea textarea-bordered w-full bg-base-100 border-base-content/20 text-base-content focus:border-primary focus:outline-none font-mono min-h-[120px]';
const cardClass = 'bg-base-200 p-6 rounded-xl border border-base-content/10 shadow-xl space-y-4';
const labelClass = 'text-xs font-semibold text-base-content/70';

const FieldError = ({ error }) => (error ? <p className="text-xs text-error mt-1">{error.message}</p> : null);

// Shared create/edit form for admin problem authoring (BUG-09, BUG-10).
// mode: 'create' | 'edit'. onSubmit receives the API payload and should throw on failure.
const ProblemForm = ({ mode, defaultValues, onSubmit, heading, subheading, submitError }) => {
  const isCreate = mode === 'create';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState(
    LANGUAGES.find((l) => defaultValues.languages[l.id]?.enabled)?.id || LANGUAGES[0].id
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(makeProblemFormSchema({ requireSolutions: isCreate })),
    defaultValues,
  });

  const { fields: hiddenFields, append: appendHidden, remove: removeHidden } = useFieldArray({ control, name: 'hiddenTestCases' });
  const { fields: exampleFields, append: appendExample, remove: removeExample } = useFieldArray({ control, name: 'examples' });

  const languages = useWatch({ control, name: 'languages' });

  const submit = async (values) => {
    setIsSubmitting(true);
    try {
      await onSubmit(formValuesToPayload(values));
    } finally {
      setIsSubmitting(false);
    }
  };

  const busyLabel = isCreate ? 'Validating on Judge0...' : 'Saving...';
  const idleLabel = isCreate ? 'Publish Problem' : 'Save Changes';

  const renderSubmitButton = (className) => (
    <button type="submit" form="problem-form" disabled={isSubmitting} className={className}>
      {isSubmitting ? (
        <>
          <span className="loading loading-spinner loading-xs"></span>
          {busyLabel}
        </>
      ) : (
        <>
          <CheckCircle2 className="w-4 h-4" />
          {idleLabel}
        </>
      )}
    </button>
  );

  return (
    <div className="space-y-6 text-base-content max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/admin/problems" className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:text-base-content" aria-label="Back to problems">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-base-content">{heading}</h1>
          </div>
          <p className="text-base-content/60 text-sm ml-8">{subheading}</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto ml-8 sm:ml-0">
          <Link to="/admin/problems" className="btn btn-ghost btn-sm">Cancel</Link>
          {renderSubmitButton("btn btn-primary btn-sm gap-2")}
        </div>
      </div>

      {submitError && (
        <div role="alert" className="alert alert-error text-sm shadow-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">{isCreate ? 'Problem Validation or Creation Failed' : 'Update Failed'}</div>
            <div className="text-xs font-mono whitespace-pre-wrap">{submitError}</div>
          </div>
        </div>
      )}

      {isSubmitting && (
        <div className="alert alert-info text-sm shadow-md flex items-center gap-3 bg-info/10 border-info/30 text-info">
          <Cpu className="w-5 h-5 animate-pulse" />
          <span>
            {isCreate
              ? 'Executing every reference solution against the hidden test cases on Judge0... Please wait.'
              : 'Saving. If test cases, driver code or solutions changed, they are re-validated on Judge0 first.'}
          </span>
        </div>
      )}

      <form id="problem-form" onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
        {/* 1. Overview */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-lg font-bold border-b border-base-content/10 pb-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2>Problem Overview</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label htmlFor="pf-title" className={labelClass}>Problem Title *</label>
              <input id="pf-title" type="text" placeholder="e.g. Valid Palindrome II" {...register('title')} className={inputClass} />
              <FieldError error={errors.title} />
            </div>
            <div className="space-y-1">
              <label htmlFor="pf-difficulty" className={labelClass}>Difficulty *</label>
              <select id="pf-difficulty" {...register('difficulty')} className="select select-bordered w-full bg-base-100 border-base-content/20">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <FieldError error={errors.difficulty} />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-slug" className={labelClass}>Slug (optional, e.g. valid-palindrome-ii)</label>
            <input id="pf-slug" type="text" placeholder="lowercase-words-with-hyphens" {...register('slug')} className={inputClass} />
            <FieldError error={errors.slug} />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-topics" className={labelClass}>Topics * (Comma-separated)</label>
            <input id="pf-topics" type="text" placeholder="e.g. String, Two Pointers, Greedy" {...register('topics')} className={inputClass} />
            <FieldError error={errors.topics} />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-description" className={labelClass}>Problem Statement * (Markdown Supported)</label>
            <textarea id="pf-description" rows={6} placeholder="Describe the problem, input format, output format, and requirements..." {...register('description')} className={textareaClass}></textarea>
            <FieldError error={errors.description} />
          </div>

          <div className="space-y-1">
            <label htmlFor="pf-constraints" className={labelClass}>Constraints (One per line)</label>
            <textarea id="pf-constraints" rows={3} placeholder={'1 <= s.length <= 10^5\ns consists of lowercase English letters'} {...register('constraints')} className={textareaClass}></textarea>
            <FieldError error={errors.constraints} />
          </div>
        </div>

        {/* 2. Examples */}
        <div className={cardClass}>
          <div className="flex items-center justify-between border-b border-base-content/10 pb-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Eye className="w-5 h-5 text-secondary" />
              <h2>Problem Examples</h2>
            </div>
            <button type="button" onClick={() => appendExample({ input: '', output: '', explanation: '' })} className="btn btn-xs btn-outline btn-secondary gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Example
            </button>
          </div>
          <p className="text-xs text-base-content/60">Examples displayed on the problem statement page for users.</p>

          <div className="space-y-4">
            {exampleFields.map((field, idx) => (
              <div key={field.id} className="p-4 bg-base-100 rounded-lg border border-base-content/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-base-content/70">Example {idx + 1}</span>
                  <button type="button" onClick={() => removeExample(idx)} className="btn btn-ghost btn-xs btn-square text-error" aria-label={`Remove example ${idx + 1}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor={`pf-ex-${idx}-input`} className="text-xs font-medium text-base-content/60">Input</label>
                    <input id={`pf-ex-${idx}-input`} type="text" placeholder='s = "aba"' {...register(`examples.${idx}.input`)} className={inputClass} />
                    <FieldError error={errors.examples?.[idx]?.input} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`pf-ex-${idx}-output`} className="text-xs font-medium text-base-content/60">Output</label>
                    <input id={`pf-ex-${idx}-output`} type="text" placeholder="true" {...register(`examples.${idx}.output`)} className={inputClass} />
                    <FieldError error={errors.examples?.[idx]?.output} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor={`pf-ex-${idx}-explanation`} className="text-xs font-medium text-base-content/60">Explanation (Optional)</label>
                  <input id={`pf-ex-${idx}-explanation`} type="text" placeholder="Explanation of the sample output..." {...register(`examples.${idx}.explanation`)} className={inputClass} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Visible test case */}
        <div className={cardClass}>
          <div className="flex items-center gap-2 text-lg font-bold border-b border-base-content/10 pb-3">
            <Terminal className="w-5 h-5 text-accent" />
            <h2>Visible Sample Test Case *</h2>
          </div>
          <p className="text-xs text-base-content/60">The default test case shown in the workspace "Testcase" tab and used by Run.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="pf-visible-input" className={labelClass}>Sample Input (stdin) *</label>
              <textarea id="pf-visible-input" rows={3} placeholder="aba" {...register('visibleTestCase.input')} className={textareaClass}></textarea>
              <FieldError error={errors.visibleTestCase?.input} />
            </div>
            <div className="space-y-1">
              <label htmlFor="pf-visible-output" className={labelClass}>Expected Output (stdout) *</label>
              <textarea id="pf-visible-output" rows={3} placeholder="true" {...register('visibleTestCase.expectedOutput')} className={textareaClass}></textarea>
              <FieldError error={errors.visibleTestCase?.expectedOutput} />
            </div>
          </div>
        </div>

        {/* 4. Hidden test cases */}
        <div className={cardClass}>
          <div className="flex items-center justify-between border-b border-base-content/10 pb-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Cpu className="w-5 h-5 text-warning" />
              <h2>Hidden Evaluation Test Cases *</h2>
            </div>
            <button type="button" onClick={() => appendHidden({ input: '', expectedOutput: '' })} className="btn btn-xs btn-outline btn-warning gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Hidden Test Case
            </button>
          </div>
          <p className="text-xs text-base-content/60">Graded by Judge0 on Submit. The reference solutions are run against these before saving.</p>
          <FieldError error={errors.hiddenTestCases?.root || errors.hiddenTestCases} />

          <div className="space-y-4">
            {hiddenFields.map((field, idx) => (
              <div key={field.id} className="p-4 bg-base-100 rounded-lg border border-base-content/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-warning uppercase tracking-wider">Hidden Test Case {idx + 1}</span>
                  {hiddenFields.length > 1 && (
                    <button type="button" onClick={() => removeHidden(idx)} className="btn btn-ghost btn-xs btn-square text-error" aria-label={`Remove hidden test case ${idx + 1}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor={`pf-hidden-${idx}-input`} className="text-xs font-medium text-base-content/60">Input (stdin) *</label>
                    <textarea id={`pf-hidden-${idx}-input`} rows={2} placeholder="Input data" {...register(`hiddenTestCases.${idx}.input`)} className={textareaClass}></textarea>
                    <FieldError error={errors.hiddenTestCases?.[idx]?.input} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`pf-hidden-${idx}-output`} className="text-xs font-medium text-base-content/60">Expected Output (stdout) *</label>
                    <textarea id={`pf-hidden-${idx}-output`} rows={2} placeholder="Expected output" {...register(`hiddenTestCases.${idx}.expectedOutput`)} className={textareaClass}></textarea>
                    <FieldError error={errors.hiddenTestCases?.[idx]?.expectedOutput} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Languages: starter snippet, driver code and reference solution per language */}
        <div className={cardClass}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-content/10 pb-3">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Code2 className="w-5 h-5 text-info" />
              <h2>Languages *</h2>
            </div>
            <div className="flex flex-wrap gap-4" role="group" aria-label="Enabled languages">
              {LANGUAGES.map((l) => (
                <label key={l.id} htmlFor={`pf-lang-${l.id}-enabled`} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input id={`pf-lang-${l.id}-enabled`} type="checkbox" className="checkbox checkbox-sm checkbox-primary" {...register(`languages.${l.id}.enabled`)} />
                  {l.label}
                </label>
              ))}
            </div>
          </div>
          <FieldError error={errors.languages?.root} />

          <div role="tablist" aria-label="Language to edit" className="tabs tabs-boxed bg-base-100 w-fit">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={activeLanguage === l.id}
                onClick={() => setActiveLanguage(l.id)}
                className={`tab ${activeLanguage === l.id ? 'tab-active' : ''}`}
              >
                {l.label}
                {!languages?.[l.id]?.enabled && <span className="ml-1 text-base-content/40">(off)</span>}
                {(errors.languages?.[l.id]?.userSnippet || errors.languages?.[l.id]?.driverCode || errors.languages?.[l.id]?.solution) && (
                  <span className="ml-1 text-error" aria-label="has errors">•</span>
                )}
              </button>
            ))}
          </div>

          <div className="alert alert-warning/10 text-xs text-warning border-warning/20">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>
              Driver code must contain the exact placeholder <code className="bg-base-300 px-1 py-0.5 rounded font-mono font-bold">{'{{USER_CODE}}'}</code>. Users can only pick enabled languages.
            </span>
          </div>

          {LANGUAGES.map((l) => (
            <div key={l.id} role="tabpanel" hidden={activeLanguage !== l.id} className="space-y-4">
              {!languages?.[l.id]?.enabled && (
                <p className="text-sm text-base-content/60">{l.label} is disabled for this problem. Tick it above to offer it to users.</p>
              )}
              {/* Not a disabled <fieldset>: react-hook-form would drop disabled values from the form data */}
              <div className={`space-y-4 ${languages?.[l.id]?.enabled ? "" : "opacity-50"}`}>
                <div className="space-y-1">
                  <label htmlFor={`pf-lang-${l.id}-snippet`} className={labelClass}>User Starter Snippet ({l.label}) *</label>
                  <p className="text-xs text-base-content/50">Loaded into the editor when a user opens the problem.</p>
                  <textarea id={`pf-lang-${l.id}-snippet`} rows={6} {...register(`languages.${l.id}.userSnippet`)} className={textareaClass}></textarea>
                  <FieldError error={errors.languages?.[l.id]?.userSnippet} />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`pf-lang-${l.id}-driver`} className={labelClass}>Complete Driver Code ({l.label}) *</label>
                  <p className="text-xs text-base-content/50">Wraps the user's code with I/O handling for compilation and execution.</p>
                  <textarea id={`pf-lang-${l.id}-driver`} rows={8} {...register(`languages.${l.id}.driverCode`)} className={textareaClass}></textarea>
                  <FieldError error={errors.languages?.[l.id]?.driverCode} />
                </div>
                <div className="space-y-1">
                  <label htmlFor={`pf-lang-${l.id}-solution`} className={labelClass}>
                    Reference Solution ({l.label}) {isCreate ? '*' : '(recommended)'}
                  </label>
                  <p className="text-xs text-base-content/50">
                    Run with this driver against every hidden test case on Judge0 before saving.
                    {!isCreate && ' Without one, this language is offered but its driver is not verified.'}
                  </p>
                  <textarea id={`pf-lang-${l.id}-solution`} rows={8} {...register(`languages.${l.id}.solution`)} className={textareaClass}></textarea>
                  <FieldError error={errors.languages?.[l.id]?.solution} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Link to="/admin/problems" className="btn btn-ghost">Cancel</Link>
          {renderSubmitButton("btn btn-primary px-8 gap-2 shadow-lg")}
        </div>
      </form>
    </div>
  );
};

export default ProblemForm;
