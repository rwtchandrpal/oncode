// Reads the user-facing message from an API error. The backend answers errors as
// { error: { code, message } } (older responses used { message }).
export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const data = error?.response?.data;
  if (data?.error && typeof data.error === 'object' && data.error.message) return data.error.message;
  if (typeof data?.message === 'string' && data.message) return data.message;
  if (typeof data?.error === 'string' && data.error) return data.error;
  return error?.userMessage || fallback;
};

export const getApiErrorCode = (error) => error?.response?.data?.error?.code || null;
