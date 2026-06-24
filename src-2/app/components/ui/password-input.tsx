import { useState } from 'react';

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  autoComplete?: string;
}

export function PasswordInput({ id, value, onChange, placeholder = '••••••••', required, className, autoComplete }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={className ?? 'w-full px-4 py-3 pl-12 text-base border border-[#e1e6ec] rounded-lg focus:outline-none focus:border-[#0d47a1] focus:ring-2 focus:ring-[#0d47a1]/20 transition'}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 text-[#6b7c93] hover:text-[#1a2332] rounded-md transition"
        aria-label={show ? 'הסתר סיסמה' : 'הצג סיסמה'}
        aria-pressed={show}
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
