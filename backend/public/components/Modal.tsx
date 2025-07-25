import * as React from 'react';      // 👈
const { useEffect } = React;

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ onClose, children }: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
