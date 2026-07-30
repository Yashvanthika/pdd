import Link from 'next/link';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ArrowLeft } from 'lucide-react';

type ButtonTone = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  tone?: ButtonTone;
}

export function Button({ children, className = '', icon, tone = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button className={`button button-${tone} ${className}`} type={type} {...props}>
      {icon ? <span className="button-icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ className = '', id, label, ...props }: InputProps) {
  const inputId = id || toFieldId(label);

  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} {...props} />
    </label>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function Textarea({ className = '', id, label, ...props }: TextareaProps) {
  const inputId = id || toFieldId(label);

  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span>{label}</span>
      <textarea id={inputId} {...props} />
    </label>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly string[];
  placeholder?: string;
}

export function Select({ className = '', id, label, options, placeholder = 'Select', ...props }: SelectProps) {
  const inputId = id || toFieldId(label);

  return (
    <label className={`field ${className}`} htmlFor={inputId}>
      <span>{label}</span>
      <select id={inputId} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

interface CheckboxProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function Checkbox({ checked, label, onChange }: CheckboxProps) {
  return (
    <label className="checkbox-row">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'success' | 'error' }) {
  return <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function PageHeader({ actions, backHref, eyebrow, subtitle, title }: {
  actions?: ReactNode;
  backHref?: string;
  eyebrow?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {backHref ? (
          <Link aria-label="Go back" className="icon-link" href={backHref}>
            <ArrowLeft size={20} />
          </Link>
        ) : null}
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function EmptyState({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

function toFieldId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
