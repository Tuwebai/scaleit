import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ActionModalProps = {
  children: ReactNode;
  onClose: () => void;
  subtitle: string;
  title: string;
};

export function ActionModal({ children, onClose, subtitle, title }: ActionModalProps) {
  return createPortal(
    <div className="client-modal-backdrop action-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="client-modal client-modal-small action-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="panel-head">
          <div>
            <span className="section-kicker">{subtitle}</span>
            <h3>{title}</h3>
          </div>
          <button className="ghost-btn" onClick={onClose}>Cerrar</button>
        </div>
        <div className="client-modal-body">
          {children}
        </div>
      </section>
    </div>,
    document.body,
  );
}
