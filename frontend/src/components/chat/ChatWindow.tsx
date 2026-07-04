import { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { askResearchQuestion, type ResearchOutput } from '../../api/research';
import { useWorkspaceStore } from '../../store/workspaceStore';
import WorkspaceSelector from '../workspaces/WorkspaceSelector';

export default function ChatWindow() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<ResearchOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!activeWorkspaceId || !question.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await askResearchQuestion({ workspace_id: activeWorkspaceId, question: question.trim() });
      setResult(response.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="chat-layout">
      <form className="card form-card" onSubmit={submit}>
        <WorkspaceSelector />
        <label>
          Question
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} required placeholder="What changed in revenue and margin?" />
        </label>
        <button type="submit" disabled={busy || !activeWorkspaceId}>
          <Send size={18} />
          {busy ? 'Searching' : 'Ask'}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>

      <section className="card answer-card">
        {result ? (
          <>
            <h2>Answer</h2>
            <pre className="answer-text">{result.answer}</pre>
            <h3>Citations</h3>
            <div className="stack">
              {result.citations.map((citation) => (
                <article className="citation" key={citation.chunk_id}>
                  <strong>Page {citation.page ?? 'unknown'}</strong>
                  <span>{citation.document_id}</span>
                  <p>{citation.snippet}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">Ask a question after documents have been ingested.</p>
        )}
      </section>
    </section>
  );
}