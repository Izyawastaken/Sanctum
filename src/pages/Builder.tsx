import React, { useCallback, useMemo, useRef, useState, useTransition } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { hashString } from '../utils/hash';
import { parsePaste } from '../utils/parser';
import AccentPicker from '../shared/AccentPicker';
import { performanceMonitor, debounce, throttle } from '../utils/performance';
import '../styles/main.css';

const SUPABASE_URL = 'https://pywievpwcedaareqkuxm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5d2lldnB3Y2VkYWFyZXFrdXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMTA5MjMsImV4cCI6MjA2Nzg4NjkyM30.wHvcWCjkejn811z_ELF-9zvoR8_UjIYJd2e57A8QBIs';
const client = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Builder() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const lastHashRef = useRef<string | null>(null);

  const sanitizedContent = useMemo(() => content
    .replace(/[“”]/g, '"')
    .replace(/\u200B/g, '')
    .replace(/\r/g, '')
    .trim(), [content]);

  const onPaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const paste = e.clipboardData?.getData('text') || '';
    if (paste.includes('pokepast.es')) {
      e.preventDefault();
      const raw = await tryImportFromPokepaste(paste);
      if (raw) setContent(raw.trim());
      else alert('⚠️ Failed to import from Pokepaste. Check the link!');
    }
  }, []);

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanitizedContent) {
      alert("Paste content can't be empty!");
      return;
    }
    const currentHash = await hashString(sanitizedContent);
    if (currentHash === lastHashRef.current) {
      alert('⚠️ This team was already pasted. Please modify it first.');
      return;
    }
    let parsed;
    try {
      parsed = parsePaste(sanitizedContent);
      if (!parsed || parsed.length === 0) throw new Error('Empty');
    } catch {
      alert('⚠️ Invalid team format! Please check your paste.');
      return;
    }

    setGenerating(true);
    const id = Math.random().toString(36).substring(2, 8);
    const { error } = await client.from('pastes').insert([{ id, title: title.trim(), author: author.trim(), content: sanitizedContent, created_at: new Date().toISOString() }]);
    setGenerating(false);

    if (error) {
      console.error(error);
      alert('❌ Failed to save paste to Supabase!');
      return;
    }

    lastHashRef.current = currentHash;
    const base = (import.meta as any).env?.BASE_URL || '/';
    const normalizedBase = base.endsWith('/') ? base : base + '/';
    const fullURL = `${normalizedBase.replace(/\/+/g, '/')}view/${id}`;
    setLink(fullURL);
  }, [author, sanitizedContent, title]);

  return (
    <div className="container">
      <header>
        <h1>Sanctum</h1>
        <p className="subtitle">Share your Pokémon teams with style.</p>
      </header>

      <form onSubmit={onSubmit} id="pasteForm">
        <input type="text" id="title" placeholder="Paste Title" value={title} onChange={e => setTitle(e.target.value)} />
        <input type="text" id="author" placeholder="Author (optional)" value={author} onChange={e => setAuthor(e.target.value)} />
        <textarea id="content" placeholder="Paste your team here..." rows={20} spellCheck={false} value={content} onChange={e => setContent(e.target.value)} onPaste={onPaste} />
        <button type="submit" disabled={generating}>{generating ? 'Saving…' : 'Generate Link'}</button>
      </form>

      <div id="paste-link">
        {link && (
          <div className="paste-output fade-in">
            <p><strong>Your Paste Link:</strong></p>
            <div className="link-buttons">
              <a className="fancy-btn" href={link} target="_blank" rel="noreferrer">🔗 View Paste</a>
              <CopyButton link={link} />
              <span className="link-status" style={{ marginLeft: 10, color: 'green' }}>✅ Link updated!</span>
            </div>
          </div>
        )}
      </div>

      <footer>
        <p>Inspired by <a href="https://pokepast.es" target="_blank" rel="noreferrer">Pokepaste</a> by felixphew</p>
      </footer>

      <AccentPicker />
      <a className="floating-report-btn" href="https://github.com/Izyawastaken/NeoPaste/issues" target="_blank" rel="noreferrer">🐛 Report Issues Here</a>
    </div>
  );
}

function CopyButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [link]);

  return (
    <button className={`copy-link-btn fancy-btn ${copied ? 'copied' : ''}`} onClick={onCopy} disabled={copied}>
      {copied ? '✅ Copied!' : '📋 Copy Link'}
    </button>
  );
}

async function tryImportFromPokepaste(url: string): Promise<string | null> {
  const match = url.match(/pokepast\.es\/([a-z0-9]+)/i);
  if (!match) return null;
  const pasteId = match[1];
  const targetUrl = `https://pokepast.es/${pasteId}`;
  const proxyUrl = `https://neopasteworker.agastyawastaken.workers.dev/?url=${encodeURIComponent(targetUrl)}`;
  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('Bad response');
    const text = await res.text();
    if (text.toLowerCase().includes('<html')) throw new Error('Received HTML instead of paste content');
    return text.trim();
  } catch (err) {
    console.error('Pokepaste import failed:', err);
    return null;
  }
} 