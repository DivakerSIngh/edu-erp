import { useState, useRef, useEffect } from 'react';
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// ── Static knowledge base ────────────────────────────────────────────────────
const QUICK_OPTIONS = [
  { id: 'admission', label: '🎓 Admission Process' },
  { id: 'fees',      label: '💳 Fee Structure' },
  { id: 'courses',   label: '📚 Available Courses' },
  { id: 'campus',    label: '🏛️ Campus Facilities' },
  { id: 'contact',   label: '📞 Contact & Location' },
];

const STATIC_RESPONSES: Record<string, string> = {
  admission:
    'Our admissions are open twice a year — June and December. You can apply online through the Admissions portal. Required documents: 10th & 12th marksheets, ID proof, and passport-size photo. Shortlisted candidates will be called for a merit-based interview.',
  fees:
    'Annual tuition fees vary by programme:\n• B.Tech: ₹1,20,000/year\n• M.Tech: ₹90,000/year\n• BBA/MBA: ₹80,000/year\n• B.Sc: ₹60,000/year\nInstalment options are available. Scholarships are offered to meritorious students.',
  courses:
    'We currently offer:\n• B.Tech in Computer Science, Electronics, Mechanical\n• M.Tech in AI & Machine Learning\n• BBA & MBA\n• B.Sc. in Data Science\n• Ph.D. programmes in select disciplines\nAll programmes are AICTE approved.',
  campus:
    'Our campus spans 25 acres and includes:\n• State-of-the-art labs & smart classrooms\n• Central library with 50,000+ books\n• Sports complex, gymnasium & Olympic-size pool\n• On-campus hostel for 1,000+ students\n• Wi-Fi enabled campus, cafeteria & medical centre',
  contact:
    'You can reach us at:\n📍 14 Knowledge Park, Sector 62, Noida — 201309\n📞 +91 98765 43210\n✉️ admissions@eduerp.edu.in\n🕐 Office hours: Mon–Sat, 9 AM – 5 PM',
};

const FALLBACK =
  'Thanks for your question! For specific queries, please reach out to us at admissions@eduerp.edu.in or call +91 98765 43210. Our team will be happy to help.';

// ── Types ────────────────────────────────────────────────────────────────────
type Role = 'bot' | 'user';
interface Message {
  id: number;
  role: Role;
  text: string;
  showOptions?: boolean;
}

let msgId = 0;
const mkMsg = (role: Role, text: string, showOptions = false): Message => ({
  id: ++msgId,
  role,
  text,
  showOptions,
});

// ── Component ────────────────────────────────────────────────────────────────
export default function ChatbotWidget() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState('');
  const [messages, setMessages] = useState<Message[]>([
    mkMsg('bot', 'Hi there! 👋 I\'m the EduERP assistant. How can I help you today?', true),
  ]);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  const addMessage = (role: Role, text: string, showOptions = false) => {
    setMessages((prev) => [...prev, mkMsg(role, text, showOptions)]);
  };

  const handleOptionClick = (opt: (typeof QUICK_OPTIONS)[number]) => {
    addMessage('user', opt.label);
    setTimeout(() => {
      addMessage('bot', STATIC_RESPONSES[opt.id] ?? FALLBACK, true);
    }, 400);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    addMessage('user', text);

    // Simple keyword matching
    const lower = text.toLowerCase();
    let reply = FALLBACK;
    if (/admiss|apply|enrol/i.test(lower))         reply = STATIC_RESPONSES.admission;
    else if (/fee|cost|tuition|price|pay/i.test(lower)) reply = STATIC_RESPONSES.fees;
    else if (/course|program|branch|stream/i.test(lower)) reply = STATIC_RESPONSES.courses;
    else if (/campus|facil|hostel|lab|library/i.test(lower)) reply = STATIC_RESPONSES.campus;
    else if (/contact|address|location|phone|email/i.test(lower)) reply = STATIC_RESPONSES.contact;

    setTimeout(() => addMessage('bot', reply, true), 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* ── Floating button ──────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat assistant"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-slate-700 rotate-0 scale-95'
            : 'bg-gradient-to-br from-blue-600 to-cyan-500 hover:scale-110 shadow-blue-500/40'
        }`}
      >
        {open
          ? <XMarkIcon className="w-6 h-6 text-white" />
          : <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7 text-white" />
        }
        {/* Ping animation when closed */}
        {!open && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-400 border-2 border-white" />
          </span>
        )}
      </button>

      {/* ── Chat panel ───────────────────────────────────────────────────── */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10 transition-all duration-300 origin-bottom-right ${
          open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'
        }`}
        style={{ maxHeight: '520px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-cyan-600 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">EduERP Assistant</p>
            <p className="text-white/70 text-xs">Typically replies instantly</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors p-1">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Messages body */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3"
          style={{ minHeight: '260px', maxHeight: '340px' }}
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>

              {/* Quick option chips after bot messages */}
              {msg.role === 'bot' && msg.showOptions && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-full">
                  {QUICK_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionClick(opt)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors shadow-sm"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div className="bg-white border-t border-gray-100 px-3 py-2.5 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-gray-50 placeholder-gray-400 transition"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0 shadow"
            aria-label="Send"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
