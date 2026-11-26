// Page URL of a problem: /problems/<slug>. Falls back to the _id for a problem that has no slug yet
// (before backend/scripts/addSlugsToProblems.js has run); the page then still loads, since the API
// accepts either.
export const problemPath = (problem) => `/problems/${encodeURIComponent(problem?.slug || problem?._id || '')}`;
