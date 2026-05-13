"use client";
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Loader2, 
  BrainCircuit, 
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import { getAccessToken } from '@/src/lib/auth-client';
import { cn } from '@/src/lib/utils';

interface Message {
  role: 'user' | 'ai';
  content: string;
  citations?: Array<{
    filename: string;
    chunk_index: number;
    preview: string;
  }>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleCopyAnswer = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex((current) => (current === index ? null : current)), 1800);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setInput("");

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Authentication session expired');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ question: input })
      });

      if (!res.ok) throw new Error('Query failed');
      const data = await res.json();

      const aiMessage: Message = {
        role: 'ai',
        content: data.answer,
        citations: data.citations
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error processing your query." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-165px)] max-w-6xl flex-col">
      {/* Messages View */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-44 pt-4 md:px-4"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center space-y-6 pt-24 text-center">
             <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent text-black shadow-2xl shadow-accent/20">
                <BrainCircuit size={40} />
             </div>
             <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-[#E2E8F0]">Ask a question about your uploaded documents.</h2>
                <p className="max-w-md text-sm text-slate-500">SpringVox will answer only from your indexed files and show the supporting verified sources separately.</p>
             </div>
             <div className="grid w-full max-w-2xl gap-3 px-4 md:grid-cols-2">
                {[
                  'Summarize my uploaded document',
                  'List the key products and services',
                  'What are the main features mentioned?',
                  'What should I know from this document?',
                ].map(q => (
                  <button 
                    key={q} 
                    onClick={() => setInput(q)}
                    className="rounded-2xl border border-[#2D3039] bg-[#15171C] p-4 text-left text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 transition-all hover:border-accent/50 hover:bg-[#1A1C20]"
                  >
                    {q}
                  </button>
                ))}
             </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn(
            "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-8",
            m.role === 'user' ? "flex-row-reverse" : "flex-row"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
              m.role === 'user' ? "bg-accent font-bold text-black" : "bg-[#15171C] border border-[#2D3039]"
            )}>
              {m.role === 'user' ? <span className="text-[10px]">YOU</span> : <BrainCircuit size={14} className="text-accent" />}
            </div>
            <div className={cn(
              "space-y-4 max-w-[92%] md:max-w-[84%] xl:max-w-[78%]",
              m.role === 'user' ? "items-end" : "items-start"
            )}>
               <div className={cn(
                 "rounded-[1.6rem] border text-sm leading-7 shadow-xl",
                 m.role === 'user' ? "border-accent/20 bg-accent/10 text-[#E2E8F0] rounded-tr-none" : "border-[#2D3039] bg-[#15171C] text-slate-200 rounded-tl-none"
               )}>
                 {m.role === 'ai' ? (
                   <>
                     <div className="flex items-center justify-between border-b border-[#2D3039] px-5 py-3">
                       <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Answer</p>
                       <button
                         type="button"
                         onClick={() => handleCopyAnswer(m.content, i)}
                         className="flex items-center gap-2 rounded-lg border border-[#2D3039] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-white"
                       >
                         {copiedIndex === i ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                         {copiedIndex === i ? 'Copied' : 'Copy answer'}
                       </button>
                     </div>
                     <div className="px-5 py-5">
                       <div className="markdown-container">
                         <ReactMarkdown>{m.content}</ReactMarkdown>
                       </div>
                     </div>
                   </>
                 ) : (
                   <div className="whitespace-pre-wrap px-5 py-4">{m.content}</div>
                 )}
               </div>

               {m.citations && m.citations.length > 0 && (
                 <CitationList citations={m.citations} />
               )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-[#15171C] border border-[#2D3039] flex items-center justify-center">
              <BrainCircuit size={14} className="text-accent/50" />
            </div>
            <div className="rounded-[1.6rem] rounded-tl-none border border-[#2D3039] bg-[#15171C] p-5">
              <div className="flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-accent" />
                <div>
                  <p className="text-sm font-semibold text-[#E2E8F0]">Analyzing your indexed documents</p>
                  <p className="text-xs text-slate-500">Retrieving grounded context and composing a verified answer.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 mt-auto bg-[linear-gradient(180deg,rgba(11,12,14,0)_0%,rgba(11,12,14,0.92)_28%,rgba(11,12,14,1)_100%)] px-2 pb-4 pt-8 md:px-4">
        <form onSubmit={handleSend} className="relative mx-auto flex max-w-4xl gap-2">
            <div className="relative flex-1 group">
               <input 
                 className="w-full rounded-2xl border border-[#2D3039] bg-[#1A1C20] pl-5 pr-14 py-4 text-sm text-[#E2E8F0] shadow-2xl shadow-black/50 transition-all focus:outline-none focus:border-accent/50"
                 placeholder="Ask your documents anything..."
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 disabled={loading}
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="text-[10px] uppercase font-bold text-slate-600 tracking-widest hidden md:block mono">RETURN ↵</div>
                  <button 
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="rounded-lg bg-accent p-2 text-black shadow-lg shadow-accent/20 transition-all hover:bg-orange-600 disabled:opacity-30"
                  >
                    <Send size={18} />
                  </button>
               </div>
            </div>
        </form>
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-slate-500">SPRINGVOX KNOWLEDGE ENGINE • 1.0</p>
      </div>
    </div>
  );
}

function CitationList({
  citations,
}: {
  citations: Array<{
    filename: string;
    chunk_index: number;
    preview: string;
  }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const uniqueCitations = citations.filter((citation, index, allCitations) => {
    return (
      allCitations.findIndex(
        (item) =>
          item.filename === citation.filename &&
          item.chunk_index === citation.chunk_index,
      ) === index
    );
  }).slice(0, 5);

  return (
    <div className="w-full rounded-2xl border border-[#2D3039] bg-[#101217] p-3 md:p-4">
      <button
        type="button"
        onClick={() => setExpanded((currentValue) => !currentValue)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          <ShieldCheck size={12} className="text-accent" />
          Sources
          <span className="rounded-full border border-[#2D3039] px-2 py-0.5 text-[9px] text-slate-500">
            {uniqueCitations.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {expanded ? 'Hide sources' : 'Show sources'}
          </span>
          {expanded ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 grid gap-3">
          {uniqueCitations.map((citation) => (
            <div
              key={`${citation.filename}-${citation.chunk_index}`}
              className="rounded-xl border border-[#2D3039] bg-[#15171C] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#2D3039] bg-[#0D0F12]">
                  <FileText size={14} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#E2E8F0]">{citation.filename}</p>
                  <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                    Chunk {citation.chunk_index}
                  </p>
                  <p className="mt-3 text-xs leading-6 text-slate-400">
                    {citation.preview.length > 140 ? `${citation.preview.slice(0, 140)}...` : citation.preview}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!expanded && (
        <p className="mt-2 pl-5 text-xs leading-6 text-slate-500">
          View the supporting document chunks used to ground this answer.
        </p>
      )}
      {citations.length > uniqueCitations.length && (
        <p className="mt-2 pl-5 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-600">
          Showing top 5 unique sources
        </p>
      )}
      {expanded && uniqueCitations.length === 0 && (
        <p className="mt-3 text-xs text-slate-500">No verified sources available.</p>
      )}
    </div>
  );
}
