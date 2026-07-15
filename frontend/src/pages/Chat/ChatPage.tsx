import { type FormEvent, useState } from 'react';
import { Send, Bot, Sparkles, Zap, Brain } from 'lucide-react';
import { Card, Badge } from '../../components/Common';
import { askResearchQuestion, type ResearchOutput } from '../../services/api/research';
import { useWorkspaceStore } from '../../store/workspaceStore';

type LLMProvider = 'groq' | 'google';

function ModelSelector({ value, onChange }: { value: LLMProvider; onChange: (v: LLMProvider) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">AI Model</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange('groq')}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
            value === 'groq'
              ? 'border-warning-border bg-warning shadow-sm'
              : 'border-border bg-muted hover:border-primary-500/30'
          }`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            value === 'groq' ? 'bg-warning' : 'bg-muted'
          }`}>
            <Zap className={`h-3.5 w-3.5 ${value === 'groq' ? 'text-warning-foreground' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className={`text-xs font-semibold ${value === 'groq' ? 'text-warning-foreground' : 'text-foreground-muted'}`}>Groq</p>
            <p className="text-[10px] leading-tight text-muted-foreground">Fast</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange('google')}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
            value === 'google'
              ? 'border-info-border bg-info shadow-sm'
              : 'border-border bg-muted hover:border-primary-500/30'
          }`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            value === 'google' ? 'bg-info' : 'bg-muted'
          }`}>
            <Brain className={`h-3.5 w-3.5 ${value === 'google' ? 'text-info-foreground' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className={`text-xs font-semibold ${value === 'google' ? 'text-info-foreground' : 'text-foreground-muted'}`}>Gemini</p>
            <p className="text-[10px] leading-tight text-muted-foreground">Deep</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const [question, setQuestion] = useState('');
  const [llmProvider, setLlmProvider] = useState<LLMProvider>('groq');
  const [result, setResult] = useState<ResearchOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!activeWorkspaceId || !question.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await askResearchQuestion({
        workspace_id: activeWorkspaceId,
        question: question.trim(),
        llm_provider: llmProvider,
      });
      setResult(response.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research request failed');
    } finally {
      setBusy(false);
    }
  }

  const answerParagraphs = result?.answer.split(/\n{2,}/).filter(Boolean) ?? [];

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Research Chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ask cited financial research questions about your documents</p>
      </div>

      <div className="grid grid-cols-1 gap-4 flex-1 xl:grid-cols-5 min-h-0">
        {/* Question Form */}
        <Card className="xl:col-span-2 flex flex-col">
          <form onSubmit={submit} className="flex flex-col gap-4 flex-1">
            <div>
              <p className="text-xs font-semibold tracking-widest text-primary-400 uppercase">Research Agent</p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">Ask the Filing</h3>
              <p className="mt-1 text-xs text-muted-foreground">The agent retrieves evidence paths, then cites every factual response.</p>
            </div>

            {/* AI Model Selector */}
            <ModelSelector value={llmProvider} onChange={setLlmProvider} />

            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                placeholder="What changed in revenue, margins, and leverage?"
                className="w-full h-32 resize-none rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !activeWorkspaceId}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary hover:bg-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {busy ? 'Retrieving evidence…' : 'Ask Research Question'}
            </button>
            {!activeWorkspaceId && <p className="text-xs text-muted-foreground text-center">Preparing workspace…</p>}
            {error && <p className="text-sm text-error-foreground">{error}</p>}
          </form>
        </Card>

        {/* Answer Area */}
        <Card className="xl:col-span-3 flex flex-col overflow-hidden">
          {result ? (
            <div className="flex flex-col gap-4 overflow-y-auto flex-1">
              {/* Answer Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-primary-400 uppercase">Source-grounded response</p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">Research Answer</h3>
                </div>
                <Badge variant="info">
                  {result.research_steps?.evidence_count ?? result.citations.length} sources
                </Badge>
              </div>

              {/* Answer Content */}
              <div className="space-y-3">
                {answerParagraphs.map((paragraph, index) => (
                  <div key={index} className="flex gap-3">
                    {index === 0 && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600/30">
                        <Bot className="h-4 w-4 text-primary-300" />
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed text-foreground-muted ${index > 0 ? 'ml-11' : ''}`}>
                      {paragraph}
                    </p>
                  </div>
                ))}
              </div>

              {/* Research Focus */}
              {result.research_steps?.question_breakdown && (
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Retrieval Focus</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.research_steps.question_breakdown.map((q, i) => (
                      <Badge key={i} variant="neutral">{q}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Citations */}
              {result.citations.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">Source Citations</h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {result.citations.map((citation) => (
                      <div key={citation.chunk_id} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-primary-300">{citation.citation_id || 'Source'}</span>
                          <span className="text-xs text-muted-foreground">Page {citation.page ?? '?'}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3">{citation.snippet}</p>
                        {citation.score !== undefined && (
                          <p className="mt-1 text-xs text-muted-foreground">Relevance: {Math.round(citation.score * 100)}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center py-12">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600/15">
                <Sparkles className="h-7 w-7 text-primary-400" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground-muted">Evidence-first Research</h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Ask a financial question after at least one filing has been indexed. Each response keeps its source pages in view.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
