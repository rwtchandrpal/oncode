import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';

// jsdom has no scrollIntoView (used by the chat panel)
Element.prototype.scrollIntoView = () => {};

// Monaco cannot run in jsdom. This stand-in behaves like @monaco-editor/react with a `path` prop:
// one model per path, created from defaultValue the first time and kept afterwards.
const models = new Map();
vi.mock('@monaco-editor/react', async () => {
  const React = await import('react');
  const Editor = ({ path, defaultValue, onChange, onMount }) => {
    if (!models.has(path)) models.set(path, defaultValue);
    const [, force] = React.useReducer((x) => x + 1, 0);
    React.useEffect(() => {
      onMount?.({ getValue: () => models.get(path), setValue: (v) => { models.set(path, v); onChange?.(v); force(); }, layout() {} });
    }, [path, onMount, onChange]);
    return React.createElement('textarea', {
      'data-testid': 'editor',
      'data-path': path,
      value: models.get(path),
      onChange: (e) => { models.set(path, e.target.value); onChange?.(e.target.value); force(); },
    });
  };
  return { default: Editor, loader: { config() {} } };
});
vi.mock('../utils/monacoSetup', () => ({}));

const PROBLEM = {
  _id: 'p1',
  slug: 'double-it',
  title: 'Double It',
  difficulty: 'Easy',
  topics: ['Math'],
  description: 'Return n * 2.',
  constraints: [],
  examples: [],
  visibleTestCase: { input: '3', expectedOutput: '6' },
  codeSnippets: [
    { language: 'cpp', userSnippet: '// cpp starter' },
    { language: 'java', userSnippet: '// java starter' },
  ],
};

vi.mock('../utils/axiosClient', () => ({
  default: { get: vi.fn(async () => ({ data: { problem: PROBLEM } })), post: vi.fn() },
  setupInterceptors: () => {},
}));

const { default: ProblemWorkSpace } = await import('../pages/problemWorkspace/problemWorkspace');
const { default: axiosClient } = await import('../utils/axiosClient');

const Where = () => <span data-testid="where">{useLocation().pathname}</span>;

// The workspace is only reachable signed in (or as a guest); drafts are scoped to that account.
const signedIn = (userId) => ({
  auth: { ...authReducer(undefined, { type: '@@init' }), user: { _id: userId, role: 'user' }, isAuthenticated: true },
});

const renderWorkspace = (url = '/problems/double-it', userId = 'u1') => {
  const store = configureStore({ reducer: { auth: authReducer }, preloadedState: signedIn(userId) });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/problems/:slug" element={<><Where /><ProblemWorkSpace /></>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

const editor = () => screen.getByTestId('editor');
const type = (value) => fireEvent.change(editor(), { target: { value } });
const pickLanguage = (lang) => fireEvent.change(screen.getByLabelText('Select programming language'), { target: { value: lang } });

describe('workspace language buffers and drafts', () => {
  beforeEach(() => {
    models.clear();
    localStorage.clear();
  });
  afterEach(cleanup);

  it('offers only the languages the problem has', async () => {
    renderWorkspace();
    await screen.findByTestId('editor');
    const options = Array.from(screen.getByLabelText('Select programming language').options).map((o) => o.value);
    expect(options).toEqual(['cpp', 'java']);
  });

  it('switching C++ -> Java -> C++ keeps both edits', async () => {
    renderWorkspace();
    await screen.findByTestId('editor');
    expect(editor().value).toBe('// cpp starter');
    type('// my C++ edit');
    pickLanguage('java');
    expect(editor().dataset.path).toBe('p1-java');
    expect(editor().value).toBe('// java starter');
    type('// my Java edit');
    pickLanguage('cpp');
    expect(editor().value).toBe('// my C++ edit');
    pickLanguage('java');
    expect(editor().value).toBe('// my Java edit');
  });

  it('saves a draft 500 ms after typing and restores it on the next visit', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWorkspace();
    await screen.findByTestId('editor');
    type('// draft');
    await act(async () => { vi.advanceTimersByTime(600); });
    expect(localStorage.getItem('oncode:code:u1:p1:cpp')).toBe('// draft');
    vi.useRealTimers();

    cleanup();
    models.clear(); // a fresh page load has no Monaco models
    renderWorkspace();
    await screen.findByTestId('editor');
    expect(editor().value).toBe('// draft');
  });

  it('another account on the same browser gets the starter code, not the previous user\'s draft', async () => {
    localStorage.setItem('oncode:code:u1:p1:cpp', '// private code of u1');
    renderWorkspace('/problems/double-it', 'u2');
    await screen.findByTestId('editor');
    expect(editor().value).toBe('// cpp starter');
  });
});

describe('workspace slug URLs', () => {
  beforeEach(() => {
    models.clear();
    localStorage.clear();
    axiosClient.get.mockClear();
    axiosClient.post.mockReset();
  });
  afterEach(cleanup);

  it('loads the problem by the slug in /problems/:slug', async () => {
    renderWorkspace();
    await screen.findByTestId('editor');
    expect(axiosClient.get).toHaveBeenCalledTimes(1);
    expect(axiosClient.get).toHaveBeenCalledWith('/problem/double-it');
    expect(screen.getByTestId('where').textContent).toBe('/problems/double-it');
  });

  it('run and submit send the _id, not the slug', async () => {
    axiosClient.post.mockResolvedValue({ data: { status: 'Accepted', submissionResult: { status: 'Accepted' } } });
    renderWorkspace();
    await screen.findByTestId('editor');
    fireEvent.click(screen.getByLabelText('Run Code'));
    await waitFor(() => expect(axiosClient.post).toHaveBeenCalledWith('/submission/run/p1', expect.any(Object), { skipWakeBanner: true }));
    fireEvent.click(screen.getByLabelText('Submit Solution'));
    await waitFor(() => expect(axiosClient.post).toHaveBeenCalledWith('/submission/submit/p1', expect.any(Object), { skipWakeBanner: true }));
  });
});
