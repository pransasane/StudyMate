import React, { useState, useRef } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import { firestoreService } from '../services/firebase.js';
import { Document } from '../types/index.js';
import {
  X,
  UploadCloud,
  FileText,
  FileCheck2,
  AlertCircle,
  Sparkles,
  BookOpen,
  HelpCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (doc: Document, nextAction?: 'summary' | 'quiz') => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [pasteText, setPasteText] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extractedDoc, setExtractedDoc] = useState<Document | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const validExtensions = ['.pdf', '.txt', '.docx', '.doc', '.md'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setError(`Unsupported file format (${ext}). Please select a PDF, TXT, or DOCX document.`);
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File is too large. The maximum supported file size is 25MB.');
      return;
    }

    setFile(selectedFile);
    if (!docTitle) {
      setDocTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      setError('Please select a document to upload.');
      return;
    }

    setError(null);
    setLoading(true);
    setProgress(25);

    try {
      const progressTimer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 200);

      const res = await api.uploadDocument(file, docTitle);
      clearInterval(progressTimer);
      setProgress(100);
      if (user) {
        await firestoreService.saveDocument(user.id, res.document).catch((e) =>
          console.warn('Firestore doc save error:', e)
        );
      }
      setExtractedDoc(res.document);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and extract text from document.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim() || pasteText.trim().length < 20) {
      setError('Please paste at least 20 characters of study notes or text.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.pasteDocument({
        title: docTitle.trim() || 'Pasted Study Notes',
        text: pasteText.trim(),
      });
      if (user) {
        await firestoreService.saveDocument(user.id, res.document).catch((e) =>
          console.warn('Firestore doc save error:', e)
        );
      }
      setExtractedDoc(res.document);
    } catch (err: any) {
      setError(err.message || 'Failed to save pasted notes.');
    } finally {
      setLoading(false);
    }
  };

  // Preset Sample Materials for Instant Experimentation
  const samplePacks = [
    {
      title: 'Computer Science: Algorithms & Asymptotic Complexity',
      filename: 'cs_algorithms_big_o.txt',
      text: `Algorithm Analysis and Asymptotic Notation: Core Principles

1. Fundamental Concepts of Algorithmic Efficiency
Algorithmic efficiency measures the computational resources (time and space) an algorithm requires relative to the size of the input (n). Time complexity quantifies the execution duration expressed as the count of primitive operations, while space complexity quantifies auxiliary memory consumption.

2. Big-O, Big-Omega, and Big-Theta Notations
- Big-O Notation (O(g(n))): Provides an asymptotic UPPER bound on running time (worst-case guarantee). Formally, f(n) = O(g(n)) if there exist positive constants c and n0 such that f(n) <= c * g(n) for all n >= n0.
- Big-Omega Notation (Ω(g(n))): Provides an asymptotic LOWER bound (best-case guarantee). Formally, f(n) >= c * g(n) for all n >= n0.
- Big-Theta Notation (Θ(g(n))): Provides an asymptotically TIGHT bound. Holds if and only if f(n) is both O(g(n)) and Ω(g(n)).

3. Hierarchy of Complexity Classes (Fastest to Slowest)
- O(1) Constant Time: Direct array index lookup, hash table lookup with good distribution.
- O(log n) Logarithmic Time: Binary Search on sorted arrays, balanced search tree operations.
- O(n) Linear Time: Single traversal of an unsorted array, linear search.
- O(n log n) Linearithmic Time: Optimal comparison sorts (Merge Sort, Heapsort, QuickSort average case).
- O(n^2) Quadratic Time: Bubble Sort, Selection Sort, Insertion Sort, nested loops.
- O(2^n) Exponential Time: Recursive Fibonacci, brute force Traveling Salesperson.
- O(n!) Factorial Time: Generating all permutations of an n-element set.

4. Sorting Algorithms Comparison
- Merge Sort: Divide-and-conquer paradigm. Divides array into halves, recursively sorts, and merges. Time Complexity: O(n log n) in best, average, and worst cases. Space Complexity: O(n) auxiliary memory. Stable sort.
- QuickSort: Partitioning around a chosen pivot. Average case O(n log n), worst case O(n^2) when bad pivots are chosen (e.g. already sorted array with first element pivot). Space Complexity: O(log n) call stack. Usually unstable in standard implementation.
- HeapSort: Constructs max-heap in O(n) time, then repeatedly extracts maximum in O(log n). Time Complexity: O(n log n) guaranteed. In-place O(1) auxiliary space.

5. Space-Time Tradeoffs & Hash Tables
Hash tables achieve average-case O(1) search, insert, and delete by hashing keys into bucket indices. Collision resolution strategies include:
- Separate Chaining: Linked lists at each bucket (worst-case degenerates to O(n) if all keys hash to the same bucket).
- Open Addressing: Linear probing, quadratic probing, or double hashing. Load factor alpha = n/m must typically be kept below 0.7 to preserve O(1) performance.`,
    },
    {
      title: 'Macroeconomics: Monetary Policy, Central Banks & Inflation',
      filename: 'macroeconomics_monetary_policy.txt',
      text: `Macroeconomic Dynamics: Monetary Policy, Central Banking, and Inflation

1. The Dual Mandate and Central Banking
Central banks (such as the Federal Reserve, European Central Bank, and Bank of England) are responsible for maintaining macroeconomic stability. The US Federal Reserve operates under a statutory 'dual mandate':
- Maximum Sustainable Employment
- Price Stability (traditionally anchored around a 2% annualized PCE inflation target).

2. The Mechanics of Inflation
Inflation represents a sustained, generalized increase in the price level of goods and services within an economy, eroding purchasing power.
- Demand-Pull Inflation: Occurs when aggregate demand (AD) outpaces aggregate supply (AS), characterized by 'too much money chasing too few goods.' Frequently occurs in overheated economies near full capacity.
- Cost-Push Inflation: Initiated by an adverse supply shock that drives up the marginal cost of production across key inputs (e.g. oil embargoes, geopolitical supply chain disruptions). Shifts Short-Run Aggregate Supply (SRAS) leftward, leading to 'stagflation' (rising prices alongside stagnant growth and rising unemployment).
- The Quantity Theory of Money (Fisher Equation): M * V = P * Y, where M is money supply, V is velocity of money, P is the general price level, and Y is real GDP output. Assuming V and Y are stable in the long run, expansion of M translates directly into inflation P.

3. The Transmission Mechanism of Monetary Policy
When a central bank alters its policy interest rate (the Federal Funds Rate), it impacts the real economy through multiple interconnected channels:
- Interest Rate Channel: Lower rates reduce the cost of borrowing for capital expenditures (business investment) and consumer durable goods (housing, autos), shifting AD right.
- Asset Price Channel: Lower interest rates compress discount rates on equities and real estate, inflating asset values and boosting household net wealth, prompting increased consumption.
- Exchange Rate Channel: Lower domestic interest rates prompt capital outflows in search of higher yields, depreciating the domestic currency. A weaker domestic currency makes exports cheaper and imports costlier, increasing net exports (NX).

4. Conventional vs. Unconventional Policy Tools
- Conventional Tools: Open Market Operations (buying/selling government securities to adjust bank reserves), adjusting the discount window lending rate, and reserve requirement ratios.
- Unconventional Tools: Quantitative Easing (QE) involves large-scale asset purchases of long-dated sovereign bonds and mortgage-backed securities to suppress long-term yields when short-term interest rates are pinned at the Zero Lower Bound (ZLB). Forward Guidance manages market expectations by signaling future rate trajectories.`,
    },
  ];

  const handleLoadSample = async (sample: (typeof samplePacks)[0]) => {
    setError(null);
    setLoading(true);

    try {
      const res = await api.pasteDocument({
        title: sample.title,
        text: sample.text,
      });
      if (user) {
        await firestoreService.saveDocument(user.id, res.document).catch((e) =>
          console.warn('Firestore doc save error:', e)
        );
      }
      setExtractedDoc(res.document);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample document.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setDocTitle('');
    setPasteText('');
    setExtractedDoc(null);
    setError(null);
    setProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Study Material</h3>
              <p className="text-xs text-slate-600">
                PDF, TXT, DOCX text extraction for AI summaries & quizzes
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Success Extraction Preview */}
          {extractedDoc ? (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{extractedDoc.title}</h4>
                    <p className="text-xs text-slate-600">
                      {extractedDoc.originalFilename} · {(extractedDoc.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Ready to Process
                </span>
              </div>

              {/* Document Statistics */}
              <div className="grid grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 text-center">
                <div>
                  <div className="text-xs text-slate-600">Word Count</div>
                  <div className="text-lg font-bold text-slate-900">{extractedDoc.wordCount}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Characters</div>
                  <div className="text-lg font-bold text-slate-900">{extractedDoc.characterCount}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-600">Read Time</div>
                  <div className="text-lg font-bold text-slate-900">
                    ~{Math.max(1, Math.round(extractedDoc.wordCount / 200))} min
                  </div>
                </div>
              </div>

              {/* Text Snippet */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Extracted Text Preview:</span>
                  <span className="text-[11px] text-emerald-700 font-medium">✓ Clean text verified</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-600 leading-relaxed max-h-32 overflow-y-auto">
                  {extractedDoc.snippet}
                </div>
              </div>

              {/* Next Steps CTA */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const doc = extractedDoc;
                    resetForm();
                    onSuccess(doc, 'summary');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Generate AI Summary</span>
                </button>

                <button
                  onClick={() => {
                    const doc = extractedDoc;
                    resetForm();
                    onSuccess(doc, 'quiz');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Create AI Quiz</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  onClick={() => {
                    const doc = extractedDoc;
                    resetForm();
                    onSuccess(doc);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Save to Study Library and close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setTab('upload')}
                  className={`pb-2.5 px-4 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                    tab === 'upload'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  File Upload (PDF / DOCX / TXT)
                </button>
                <button
                  onClick={() => setTab('paste')}
                  className={`pb-2.5 px-4 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                    tab === 'paste'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste Text Notes
                </button>
                <button
                  onClick={() => setTab('samples')}
                  className={`pb-2.5 px-4 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
                    tab === 'samples'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sample Study Packs
                </button>
              </div>

              {/* Tab 1: File Upload */}
              {tab === 'upload' && (
                <div className="space-y-4 pt-2">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-blue-500 bg-blue-50/60'
                        : file
                        ? 'border-emerald-400 bg-emerald-50/20'
                        : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          validateAndSetFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {file ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <FileCheck2 className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">{file.name}</p>
                        <p className="text-xs text-slate-600">
                          {(file.size / 1024).toFixed(1)} KB · Click or drag to replace
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800">
                          Drop your PDF, DOCX, or TXT file here
                        </p>
                        <p className="text-xs text-slate-600">
                          or <span className="text-blue-600 underline">browse files</span> on your computer (max 25MB)
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Material Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="e.g. Chapter 4: Organic Chemistry Lecture Notes"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {loading && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Extracting document text...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUploadSubmit}
                    disabled={!file || loading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Processing Document...' : 'Upload & Extract Text'}
                  </button>
                </div>
              )}

              {/* Tab 2: Paste Text */}
              {tab === 'paste' && (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="e.g. History Midterm Revision Notes"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Paste Study Notes or Reading Content
                    </label>
                    <textarea
                      rows={7}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder="Paste textbook excerpts, lecture slide transcripts, syllabus points, or study notes..."
                      className="w-full p-3 text-xs md:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-sans"
                    />
                    <div className="text-right text-[11px] text-slate-600 mt-1">
                      {pasteText.length} characters · {pasteText.split(/\s+/).filter(Boolean).length} words
                    </div>
                  </div>

                  <button
                    onClick={handlePasteSubmit}
                    disabled={loading || pasteText.trim().length < 20}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Processing Text...' : 'Save & Extract Notes'}
                  </button>
                </div>
              )}

              {/* Tab 3: Sample Packs */}
              {tab === 'samples' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Don't have a document handy? Click any curated academic pack below to load rich study material instantly:
                  </p>

                  <div className="space-y-3">
                    {samplePacks.map((sample, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h5 className="text-sm font-bold text-slate-900">{sample.title}</h5>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {sample.text.slice(0, 150)}...
                          </p>
                          <span className="text-[11px] text-slate-600 font-medium">
                            ~{sample.text.split(/\s+/).length} words · Factual concepts & formulas
                          </span>
                        </div>
                        <button
                          onClick={() => handleLoadSample(sample)}
                          disabled={loading}
                          className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
                        >
                          Load Sample
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
