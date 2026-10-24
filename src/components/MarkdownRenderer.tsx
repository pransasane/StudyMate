import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple yet robust line-based Markdown parser
  const renderLines = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    const flushList = (key: string) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={key} className="space-y-2 my-3 pl-5 list-disc text-slate-700 marker:text-blue-600">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushCode = (key: string) => {
      if (codeBuffer.length > 0) {
        elements.push(
          <div key={key} className="my-4 rounded-xl bg-slate-900 p-4 font-mono text-sm text-slate-100 overflow-x-auto shadow-inner border border-slate-800">
            <pre className="font-mono text-xs md:text-sm leading-relaxed">{codeBuffer.join('\n')}</pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
      }
    };

    const formatInline = (text: string) => {
      // Bold text **word**
      const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-blue-700 border border-slate-200">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Code blocks
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          flushCode(`code-${index}`);
        } else {
          flushList(`list-before-code-${index}`);
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        flushList(`list-h3-${index}`);
        elements.push(
          <h4 key={`h3-${index}`} className="text-base font-bold text-slate-900 mt-6 mb-2 tracking-tight">
            {formatInline(trimmed.replace('### ', ''))}
          </h4>
        );
        return;
      }

      if (trimmed.startsWith('## ')) {
        flushList(`list-h2-${index}`);
        elements.push(
          <div key={`h2-${index}`} className="mt-8 mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block" />
              {formatInline(trimmed.replace('## ', ''))}
            </h3>
          </div>
        );
        return;
      }

      if (trimmed.startsWith('# ')) {
        flushList(`list-h1-${index}`);
        elements.push(
          <h2 key={`h1-${index}`} className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-6 mb-4">
            {formatInline(trimmed.replace('# ', ''))}
          </h2>
        );
        return;
      }

      // Blockquotes or Formulas
      if (trimmed.startsWith('> ')) {
        flushList(`list-quote-${index}`);
        elements.push(
          <blockquote key={`quote-${index}`} className="my-3 border-l-4 border-blue-500 bg-blue-50/50 p-3.5 rounded-r-lg text-slate-700 italic text-sm">
            {formatInline(trimmed.replace('> ', ''))}
          </blockquote>
        );
        return;
      }

      // Bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        inList = true;
        const text = trimmed.replace(/^[-*]\s+/, '');
        listItems.push(
          <li key={`li-${index}`} className="text-sm md:text-base leading-relaxed text-slate-700">
            {formatInline(text)}
          </li>
        );
        return;
      }

      // Numbered lists
      if (/^\d+\.\s+/.test(trimmed)) {
        flushList(`list-num-${index}`);
        const text = trimmed.replace(/^\d+\.\s+/, '');
        elements.push(
          <div key={`num-${index}`} className="flex items-start gap-3 my-2 text-sm md:text-base text-slate-700">
            <span className="font-semibold text-blue-600 shrink-0 min-w-5">
              {trimmed.match(/^\d+\./)?.[0]}
            </span>
            <div className="leading-relaxed">{formatInline(text)}</div>
          </div>
        );
        return;
      }

      // Empty line
      if (!trimmed) {
        flushList(`list-empty-${index}`);
        return;
      }

      // Standard paragraph
      flushList(`list-p-${index}`);
      elements.push(
        <p key={`p-${index}`} className="text-slate-700 leading-relaxed text-sm md:text-base my-3">
          {formatInline(trimmed)}
        </p>
      );
    });

    flushList('list-end');
    flushCode('code-end');

    return elements;
  };

  return <div className="space-y-1">{renderLines()}</div>;
};
