import { useEffect, useRef } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export function BrandLogo({ monogram = false, className = '' }: { monogram?: boolean; className?: string }) {
  return <img className={className} src={monogram ? '/brand/cic-monogram.svg' : '/brand/cic-logo.svg'} alt="" />;
}
export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  return <button {...props} type={type} className={`button ${variant} ${className}`} />;
}
export function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={`cic-card ${className}`} />;
}
export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <section className="diary-intro"><span className="diary-eyebrow"><span /> {eyebrow}</span><h1>{title}</h1>{children}</section>;
}
export function FormField({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return <label className={className}><span>{label}</span>{children}</label>;
}
export function StatusIndicator({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={className} role="status" />;
}
export function Alert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  return <p className={tone === 'error' ? 'diary-error' : tone === 'success' ? 'diary-success' : 'cic-info'} role={tone === 'error' ? 'alert' : 'status'}>{children}</p>;
}
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-readings"><BrandLogo monogram className="cic-empty-logo" /><strong>{title}</strong>{children}</div>;
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="reading-count">{children}</span>;
}
export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={ref} className="cic-dialog" aria-label={title} onCancel={(event) => { event.preventDefault(); onClose(); }}><h2>{title}</h2>{children}<Button variant="secondary" onClick={onClose}>Close</Button></dialog>;
}
