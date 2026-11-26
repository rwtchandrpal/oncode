// Page URL of a problem: /problems/<slug>
export const problemPath = (problem) => `/problems/${encodeURIComponent(problem?.slug || '')}`;
