// Self-hosted Monaco. @monaco-editor/react would otherwise load Monaco from
// cdn.jsdelivr.net at runtime: third-party script on our origin, no SRI, and incompatible with a
// strict CSP. Only the editor core, the C++/Java tokenizers and the base editor worker are bundled.
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/editor/editor.api';
import 'monaco-editor/languages/definitions/cpp/register';
import 'monaco-editor/languages/definitions/java/register';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';

self.MonacoEnvironment = {
  getWorker() {
    return new EditorWorker();
  },
};

loader.config({ monaco });

export default monaco;
