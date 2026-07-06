import { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { askResearchQuestion, type ResearchOutput } from '../../api/research';
import { useWorkspaceStore } from '../../store/workspaceStore';

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

  const answerParagraphs = result?.answer.split(/\n{2,}/).filter(Boolean) ?? [];

  return (
    <section className="chat-layout">
      <form className="card form-card research-form" onSubmit={submit}>
        <div><p className="eyebrow">Research agent</p><h2>Ask the filing</h2><p className="muted">The agent retrieves several evidence paths, then cites every factual response.</p></div>
        <label>Question<textarea value={question} onChange={(event) => setQuestion(event.target.value)} required placeholder="What changed in revenue, margins, and leverage?" /></label>
        <button type="submit" disabled={busy || !activeWorkspaceId}><Send size={18} />{busy ? 'Retrieving evidence' : 'Ask research question'}</button>
        {!activeWorkspaceId && <p className="muted">Preparing analysis...</p>}
        {error && <p className="error-text">{error}</p>}
      </form>
      <section className="research-answer">{result ? <><div className="answer-heading"><div><p className="eyebrow">Source-grounded response</p><h2>Research answer</h2></div><span>{result.research_steps?.evidence_count ?? result.citations.length} sources reviewed</span></div><div className="answer-copy">{answerParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>{result.research_steps?.question_breakdown && <div className="research-focus"><strong>Retrieval focus</strong><span>{result.research_steps.question_breakdown.join(' · ')}</span></div>}<section className="citation-section"><h3>Source citations</h3><div className="citation-grid">{result.citations.map((citation) => <article className="citation" key={citation.chunk_id}><div><strong>{citation.citation_id || 'Source'}</strong><span>Page {citation.page ?? 'unknown'}</span></div><small>{citation.document_id}{citation.score !== undefined ? ` · relevance ${Math.round(citation.score * 100)}%` : ''}</small><p>{citation.snippet}</p></article>)}</div></section></> : <div className="research-empty"><Send size={26} aria-hidden="true" /><h2>Evidence-first research</h2><p>Ask a financial question after at least one filing has been indexed. Each response keeps its source pages in view.</p></div>}</section>
    </section>
  );
}
