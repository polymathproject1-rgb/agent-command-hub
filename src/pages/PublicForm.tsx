import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TypeformViewer from '@/components/TypeformViewer';
import { toast, Toaster } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

const PublicForm = () => {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetch(`${SUPABASE_URL}/functions/v1/lexa-form-public?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.form) {
          setForm(data.form);
        } else {
          setError(data.error || 'Form not found');
        }
      })
      .catch(() => setError('Failed to load form'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/30 text-sm font-mono">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Form not found</h1>
          <p className="text-white/40">{error || 'This form does not exist or is no longer active.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" theme="dark" />
      <TypeformViewer
        fields={form.fields}
        theme={form.theme || { accent: '#14b8a6', background: '#0a0f1a', style: 'glass' }}
        formName={form.name}
        onSubmit={async (data) => {
          try {
            toast.loading('Submitting...', { id: 'form-submit' });
            const res = await fetch(
              `${SUPABASE_URL}/functions/v1/lexa-form-public?slug=${slug}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data }),
              }
            );
            const result = await res.json();
            if (result.success) {
              toast.success('Submitted!', { id: 'form-submit' });
              // If there's a lead magnet URL, open it after a short delay
              if (result.lead_magnet_url) {
                setTimeout(() => {
                  window.open(result.lead_magnet_url, '_blank');
                }, 1500);
              }
            } else {
              toast.error(result.error || 'Submission failed', { id: 'form-submit' });
            }
          } catch (err) {
            toast.error('Failed to submit form', { id: 'form-submit' });
          }
        }}
      />
    </div>
  );
};

export default PublicForm;
