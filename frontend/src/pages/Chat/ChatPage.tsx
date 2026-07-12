import { type FormEvent, useState } from 'react';
import { Send, Bot, Sparkles, Zap, Brain } from 'lucide-react';
import { Card, Badge } from '../../components/Common';
import { askResearchQuestion, type ResearchOutput } from '../../services/api/research';
import { useWorkspaceStore } from '../../store/workspaceStore';

type LLMProvider = 'groq' | 'google';

function ModelSelector({ value, onChange }: { value: LLMProvider; onChange: (v: LLMProvider) => void }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-surface-400">AI Model</label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange('groq')}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
            value === 'groq'
              ? 'border-amber-500/60 bg-amber-500/10 shadow-sm shadow-amber-500/10'
              : 'border-surface-700 bg-surface-800/60 hover:border-surface-600'
          }`}
        >
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            value === 'groq' ? 'bg-amber-500/20' : 'bg-surface-700/60'
          }`}>
            <Zap className={`h-3.5 w-3.5 ${value === 'groq' ? 'text-amber-400' : 'text-surface-400'}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${value === 'groq' ? 'text-amber-300' : 'text-surface-300'}`}>Groq</p>
            <p className="text-[10px] leading-tight text-surface-500">Fast</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange('google')}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all ${
            value === 'google'
              ? 'border-blue-500/60 bg-blue-500/10 shadow-sm shadow-blue-500/10'
              : 'border-surface-700 bg-surface-800/60 hover:border-surface-600'
          }`}
        >
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            value === 'google' ? 'bg-blue-500/20' : 'bg-surface-700/60'
          }`}>
            <Brain className={`h-3.5 w-3.5 ${value === 'google' ? 'text-blue-400' : 'text-surface-400'}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${value === 'google' ? 'text-blue-300' : 'text-surface-300'}`}>Gemini</p>
            <p className="text-[10px] leading-tight text-surface-500">Deep</p>
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
        <h1 className="text-2xl font-bold text-white">AI Research Chat</h1>
        <p className="mt-1 text-sm text-surface-400">Ask cited financial research questions about your documents</p>
      </div>

      <div className="grid grid-cols-1 gap-4 flex-1 xl:grid-cols-5 min-h-0">
        {/* Question Form */}
        <Card className="xl:col-span-2 flex flex-col">
          <form onSubmit={submit} className="flex flex-col gap-4 flex-1">
            <div>
              <p className="text-xs font-semibold tracking-widest text-primary-400 uppercase">Research Agent</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Ask the Filing</h3>
              <p className="mt-1 text-xs text-surface-400">The agent retrieves evidence paths, then cites every factual response.</p>
            </div>

            {/* AI Model Selector */}
            <ModelSelector value={llmProvider} onChange={setLlmProvider} />

            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-surface-400">Question</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                placeholder="What changed in revenue, margins, and leverage?"
                className="w-full h-32 resize-none rounded-lg border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !activeWorkspaceId}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary-600/20 hover:bg-primary-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {busy ? 'Retrieving evidence…' : 'Ask Research Question'}
            </button>
            {!activeWorkspaceId && <p className="text-xs text-surface-500 text-center">Preparing workspace…</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}
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
                  <h3 className="mt-1 text-lg font-semibold text-white">Research Answer</h3>
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
                    <p className={`text-sm leading-relaxed text-surface-200 ${index > 0 ? 'ml-11' : ''}`}>
                      {paragraph}
                    </p>
                  </div>
                ))}
              </div>

              {/* Research Focus */}
              {result.research_steps?.question_breakdown && (
                <div className="rounded-lg border border-surface-700/40 bg-surface-900/40 p-3">
                  <p className="text-xs font-semibold text-surface-400 mb-1">Retrieval Focus</p>
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
                  <h4 className="mb-2 text-xs font-semibold tracking-widest text-surface-400 uppercase">Source Citations</h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {result.citations.map((citation) => (
                      <div key={citation.chunk_id} className="rounded-lg border border-surface-700/40 bg-surface-900/40 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-primary-300">{citation.citation_id || 'Source'}</span>
                          <span className="text-xs text-surface-500">Page {citation.page ?? '?'}</span>
                        </div>
                        <p className="text-xs text-surface-400 line-clamp-3">{citation.snippet}</p>
                        {citation.score !== undefined && (
                          <p className="mt-1 text-xs text-surface-600">Relevance: {Math.round(citation.score * 100)}%</p>
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
              <h3 className="mt-4 text-sm font-medium text-surface-200">Evidence-first Research</h3>
              <p className="mt-1 max-w-sm text-xs text-surface-500">
                Ask a financial question after at least one filing has been indexed. Each response keeps its source pages in view.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
