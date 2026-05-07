import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Search, ChevronDown } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  maxHeight?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = "max-w-lg", maxHeight = "max-h-[70vh]" }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col",
              maxWidth
            )}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={cn("p-4 sm:p-6 overflow-y-auto custom-scrollbar", maxHeight)}>
              {children}
            </div>
            {footer && (
              <div className="p-4 sm:p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-center sm:justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  };

  const colors = {
    success: "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10",
    error: "border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10",
    info: "border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10",
    warning: "border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "fixed bottom-6 right-6 z-[200] flex items-center gap-3 p-4 rounded-2xl border shadow-lg backdrop-blur-md min-w-[300px] max-w-md",
        colors[type]
      )}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-medium text-zinc-900 dark:text-white">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-zinc-400 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'error'
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'error' | 'warning' | 'info';
}) {
  const { t } = useLanguage();
  const finalConfirmText = confirmText || (type === 'error' ? t('delete') : t('confirm'));
  const finalCancelText = cancelText || t('cancel');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors order-2 sm:order-1"
          >
            {finalCancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "w-full sm:w-auto px-6 py-2 text-white text-sm font-bold rounded-xl transition-colors order-1 sm:order-2",
              type === 'error' ? "bg-red-600 hover:bg-red-700" :
                type === 'warning' ? "bg-amber-500 hover:bg-amber-600" :
                  "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            {finalConfirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          type === 'error' ? "bg-red-50 dark:bg-red-900/20 text-red-600" :
            type === 'warning' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" :
              "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
        )}>
          {type === 'error' ? <AlertTriangle className="w-5 h-5" /> :
            type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
              <Info className="w-5 h-5" />}
        </div>
        <div>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </Modal>
  );
}

export function SearchableSelect({
  name,
  options,
  defaultValue,
  placeholder = "Select an option...",
  className,
  multiple = false,
  onValueChange,
  disabled = false
}: {
  name: string;
  options: { value: string; label: string; sublabel?: string }[];
  defaultValue?: string | string[];
  placeholder?: string;
  className?: string;
  multiple?: boolean;
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | string[] | undefined>(
    defaultValue || (multiple ? [] : undefined)
  );
  const finalPlaceholder = placeholder || t('select_option_placeholder');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state with defaultValue prop changes
  useEffect(() => {
    setSelected(defaultValue || (multiple ? [] : undefined));
  }, [defaultValue, multiple]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    (opt.sublabel || "").toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (value: string) => {
    if (multiple && Array.isArray(selected)) {
      return selected.includes(value);
    }
    return selected === value;
  };

  const handleSelect = (value: string) => {
    if (multiple) {
      const currentSelected = Array.isArray(selected) ? selected : [];
      const newSelected = currentSelected.includes(value)
        ? currentSelected.filter(v => v !== value)
        : [...currentSelected, value];
      setSelected(newSelected);
      onValueChange?.(newSelected);
    } else {
      setSelected(value);
      setIsOpen(false);
      setSearch("");
      onValueChange?.(value);
    }
  };

  const getButtonText = () => {
    if (multiple && Array.isArray(selected)) {
      if (selected.length === 0) return finalPlaceholder;
      if (selected.length === 1) {
        return options.find(o => o.value === selected[0])?.label || finalPlaceholder;
      }
      return `${selected.length} ${t('items_selected')}`;
    }
    const selectedOption = options.find(opt => opt.value === selected);
    return selectedOption ? selectedOption.label : finalPlaceholder;
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <input type="hidden" name={name} value={multiple && Array.isArray(selected) ? selected.join(',') : (selected as string || "")} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-left outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={cn("truncate max-w-[calc(100%-20px)]", (!selected || (Array.isArray(selected) && selected.length === 0)) && "text-zinc-400")}>
          {getButtonText()}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-zinc-400 shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden min-w-[200px]"
          >
            <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full flex flex-col items-start px-3 py-2 rounded-xl text-sm transition-colors",
                      isSelected(opt.value)
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{opt.label}</span>
                      {multiple && isSelected(opt.value) && <CheckCircle className="w-3.5 h-3.5" />}
                    </div>
                    {opt.sublabel && (
                      <span className="text-[10px] opacity-60 font-normal">{opt.sublabel}</span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-zinc-400">{t('no_results_found')}</div>
              )}
            </div>
            {multiple && (
              <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  {t('done')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
