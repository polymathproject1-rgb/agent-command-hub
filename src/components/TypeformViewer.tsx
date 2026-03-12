import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowDown, Check, ChevronDown, Sparkles } from 'lucide-react';

interface FormField {
  id: string;
  type: 'welcome' | 'text' | 'email' | 'phone' | 'company' | 'select' | 'textarea' | 'thankyou';
  label: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
  options?: string[];
  buttonText?: string;
}

interface TypeformViewerProps {
  fields: FormField[];
  theme?: { accent: string; background: string; style: string };
  formName: string;
  onSubmit: (data: Record<string, string>) => void;
  preview?: boolean;
}

const TypeformViewer = ({
  fields,
  theme = { accent: '#14b8a6', background: '#0a0f1a', style: 'glass' },
  formName,
  onSubmit,
  preview = false,
}: TypeformViewerProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const field = fields[currentStep];
  const totalQuestions = fields.filter(f => f.type !== 'welcome' && f.type !== 'thankyou').length;
  const currentQuestion = fields.slice(0, currentStep + 1).filter(f => f.type !== 'welcome' && f.type !== 'thankyou').length;
  const progress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;

  useEffect(() => {
    if (inputRef.current && field?.type !== 'welcome' && field?.type !== 'thankyou' && field?.type !== 'select') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [currentStep, field?.type]);

  const validateAndNext = useCallback(() => {
    if (!field) return;
    const value = answers[field.id] || '';

    if (field.required && !value.trim()) {
      setError('This field is required');
      return;
    }

    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Please enter a valid email');
      return;
    }

    if (field.type === 'phone' && value && !/^[+]?[\d\s()-]{7,}$/.test(value.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return;
    }

    setError('');

    if (currentStep < fields.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [field, answers, currentStep, fields.length]);

  const goBack = () => {
    if (currentStep > 0) {
      setError('');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!preview) {
      onSubmit(answers);
    }
    setSubmitted(true);
    // Move to thank you screen
    const tyIndex = fields.findIndex(f => f.type === 'thankyou');
    if (tyIndex >= 0) setCurrentStep(tyIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (field?.type === 'welcome') {
        setCurrentStep(currentStep + 1);
      } else if (isLastQuestion()) {
        if (!field?.required || answers[field.id]?.trim()) {
          handleSubmit();
        }
      } else {
        validateAndNext();
      }
    }
  };

  const isLastQuestion = () => {
    const remaining = fields.slice(currentStep + 1);
    return remaining.every(f => f.type === 'thankyou');
  };

  const setAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [field.id]: value }));
    setError('');
  };

  // ── Render Field ──
  const renderField = () => {
    if (!field) return null;

    // Welcome Screen
    if (field.type === 'welcome') {
      return (
        <motion.div
          key="welcome"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center text-center max-w-xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
            style={{ background: `${theme.accent}20` }}
          >
            <Sparkles size={28} style={{ color: theme.accent }} />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold font-heading leading-tight mb-4">
            {field.label}
          </h1>
          {field.description && (
            <p className="text-lg text-white/50 mb-10 leading-relaxed">
              {field.description}
            </p>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentStep(currentStep + 1)}
            className="px-8 py-4 rounded-xl text-white font-semibold text-lg flex items-center gap-3 transition-all"
            style={{ background: theme.accent }}
          >
            {field.buttonText || 'Get Started'}
            <ArrowRight size={20} />
          </motion.button>
          <p className="text-xs text-white/20 mt-8 font-mono">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/40">Enter ↵</kbd>
          </p>
        </motion.div>
      );
    }

    // Thank You Screen
    if (field.type === 'thankyou') {
      return (
        <motion.div
          key="thankyou"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center justify-center text-center max-w-xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
            style={{ background: `${theme.accent}20` }}
          >
            <Check size={36} style={{ color: theme.accent }} />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold font-heading leading-tight mb-4">
            {field.label}
          </h1>
          {field.description && (
            <p className="text-lg text-white/50 mb-8 leading-relaxed">
              {field.description}
            </p>
          )}
          {field.buttonText && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl text-white font-semibold text-lg flex items-center gap-3"
              style={{ background: theme.accent }}
            >
              {field.buttonText}
              <ArrowRight size={20} />
            </motion.button>
          )}
        </motion.div>
      );
    }

    // Question Fields
    return (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-xl mx-auto w-full"
        onKeyDown={handleKeyDown}
      >
        {/* Question number */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className="text-sm font-mono font-bold"
            style={{ color: theme.accent }}
          >
            {currentQuestion}
          </span>
          <ArrowRight size={12} style={{ color: theme.accent }} />
        </div>

        {/* Question */}
        <h2 className="text-2xl md:text-3xl font-bold font-heading leading-tight mb-2">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </h2>

        {field.description && (
          <p className="text-base text-white/40 mb-8">
            {field.description}
          </p>
        )}

        {/* Input */}
        <div className="mt-6">
          {field.type === 'select' && field.options ? (
            <div className="space-y-3">
              {field.options.map((opt, i) => {
                const selected = answers[field.id] === opt;
                return (
                  <motion.button
                    key={opt}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      setAnswer(opt);
                      // Auto-advance after selection
                      setTimeout(() => {
                        if (isLastQuestion()) {
                          setAnswers(prev => ({ ...prev, [field.id]: opt }));
                          // Will submit on next render cycle
                        } else {
                          setCurrentStep(currentStep + 1);
                        }
                      }, 300);
                    }}
                    className={`
                      w-full text-left p-4 rounded-xl border transition-all duration-200
                      flex items-center gap-3 group
                      ${selected
                        ? 'border-current bg-white/10'
                        : 'border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06]'
                      }
                    `}
                    style={selected ? { borderColor: theme.accent, color: theme.accent } : {}}
                  >
                    <span
                      className={`
                        w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 border
                        ${selected ? 'border-current bg-current/10' : 'border-white/20 text-white/40 group-hover:border-white/30'}
                      `}
                      style={selected ? { borderColor: theme.accent, color: theme.accent } : {}}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className={`text-base ${selected ? 'font-medium' : 'text-white/70'}`}>
                      {opt}
                    </span>
                    {selected && <Check size={16} className="ml-auto" style={{ color: theme.accent }} />}
                  </motion.button>
                );
              })}
            </div>
          ) : field.type === 'textarea' ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={answers[field.id] || ''}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={field.placeholder || 'Type your answer...'}
              rows={4}
              className="w-full bg-transparent border-b-2 border-white/20 focus:border-current text-xl py-3 outline-none resize-none placeholder:text-white/20 transition-colors"
              style={{ caretColor: theme.accent }}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              value={answers[field.id] || ''}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={field.placeholder || 'Type your answer...'}
              className="w-full bg-transparent border-b-2 border-white/20 focus:border-current text-xl md:text-2xl py-3 outline-none placeholder:text-white/20 transition-colors"
              style={{ caretColor: theme.accent }}
            />
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-sm mt-3"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit / Next button */}
          <div className="flex items-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={isLastQuestion() ? handleSubmit : validateAndNext}
              className="px-6 py-3 rounded-lg text-white font-semibold flex items-center gap-2 transition-all"
              style={{ background: theme.accent }}
            >
              {isLastQuestion() ? 'Submit' : 'OK'}
              <Check size={16} />
            </motion.button>
            <span className="text-xs text-white/20 font-mono">
              press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/30">Enter ↵</kbd>
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ background: theme.background }}
    >
      {/* Progress bar */}
      {field?.type !== 'welcome' && field?.type !== 'thankyou' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-10">
          <motion.div
            className="h-full"
            style={{ background: theme.accent }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Navigation */}
      {field?.type !== 'welcome' && field?.type !== 'thankyou' && (
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 disabled:opacity-30 transition-all text-sm"
          >
            ↑
          </button>
          <button
            onClick={validateAndNext}
            disabled={currentStep >= fields.length - 1}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 disabled:opacity-30 transition-all text-sm"
          >
            ↓
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {renderField()}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-4 flex items-center justify-between">
        <div className="text-[10px] text-white/15 font-mono">
          Powered by Agent Command Hub
        </div>
        {field?.type !== 'welcome' && field?.type !== 'thankyou' && (
          <div className="text-[10px] text-white/15 font-mono">
            {currentQuestion} of {totalQuestions}
          </div>
        )}
      </div>

      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.03]"
        style={{ background: `radial-gradient(circle, ${theme.accent}, transparent)` }}
      />
    </div>
  );
};

export default TypeformViewer;
