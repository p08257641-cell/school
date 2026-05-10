import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../lib/LanguageContext';
import { Search, Filter, Plus, ChevronLeft, ChevronRight, MoreVertical, Download, Trash2, Edit, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from './UI';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  hiddenOnMobile?: boolean;
  hiddenOnTablet?: boolean;
}

interface DataTableProps<T> {
  title: string;
  data: T[];
  columns: Column<T>[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  searchPlaceholder?: string;
  renderForm?: (item?: T, isViewOnly?: boolean, onEdit?: (item: T) => void) => React.ReactNode;
  autoModal?: boolean;
  autoViewModal?: boolean;
  extraActions?: (item: T) => React.ReactNode;
  onSave?: (data: any) => Promise<void> | void;
  itemsPerPage?: number;
  initialViewItem?: T;
  initialEditItem?: T;
  renderDetails?: (item: T) => React.ReactNode;
  onRefresh?: () => void;
  detailsMaxWidth?: string;
  actions?: React.ReactNode;
  hideExport?: boolean;
  canEdit?: (item: T) => boolean;
  canDelete?: (item: T) => boolean;
}

export function DataTable<T extends { id: string | number }>({
  title,
  data = [],
  columns,
  onAdd,
  onEdit,
  onDelete,
  onView,
  searchPlaceholder,
  renderForm,
  autoModal = true,
  autoViewModal = true,
  extraActions,
  onSave,
  itemsPerPage: initialItemsPerPage = 10,
  initialViewItem,
  initialEditItem,
  renderDetails,
  onRefresh,
  detailsMaxWidth,
  actions,
  hideExport = false,
  ...props
}: DataTableProps<T> & { modalTitle?: string; addLabel?: string }) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(!!initialViewItem);
  const [isViewOnly, setIsViewOnly] = useState(!!initialViewItem);
  const [editingItem, setEditingItem] = useState<T | undefined>(initialViewItem);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (initialViewItem) {
      setEditingItem(initialViewItem);
      setIsModalOpen(true);
      setIsViewOnly(true);
    } else if (initialEditItem) {
      setEditingItem(initialEditItem);
      setIsModalOpen(true);
      setIsViewOnly(false);
    }
  }, [initialViewItem, initialEditItem]);

  const handleView = (item: T) => {
    if (onView) {
      onView(item);
    } else if (autoModal && autoViewModal) {
      setEditingItem(item);
      setIsViewOnly(true);
      setIsModalOpen(true);
    }
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [activeDropdown, setActiveDropdown] = useState<string | number | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({ position: 'fixed', visibility: 'hidden' });

  // Reposition dropdown after it renders so we can measure its actual height
  useLayoutEffect(() => {
    if (!dropdownRef.current || !anchorRect) return;
    const dd = dropdownRef.current;
    const ddRect = dd.getBoundingClientRect();
    const margin = 8;
    const gap = 4;

    // Left: prefer right-aligned to button, clamp within viewport
    let left = anchorRect.right - ddRect.width;
    if (left < margin) left = margin;
    if (left + ddRect.width > window.innerWidth - margin) {
      left = window.innerWidth - ddRect.width - margin;
    }

    // Top: prefer below button, flip above if it would overflow
    let top = anchorRect.bottom + gap;
    if (top + ddRect.height > window.innerHeight - margin) {
      top = anchorRect.top - ddRect.height - gap;
      if (top < margin) top = margin;
    }

    setDropdownStyles({ position: 'fixed', top, left, visibility: 'visible' });
  }, [anchorRect, activeDropdown]);

  // Close dropdown on click outside or scroll
  React.useEffect(() => {
    const handleClose = () => setActiveDropdown(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true); // Capture scroll events from any parent
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);
  const filteredData = (data || []).filter(item => {
    if (!searchTerm) return true;
    return columns.some(col => {
      const val = typeof col.accessor === 'function'
        ? '' // Functions are hard to search
        : String(item[col.accessor as keyof T] || '').toLowerCase();
      return val.includes(searchTerm.toLowerCase());
    });
  });

  // Paginate filtered data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  // Reset current page if it exceeds total pages
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAdd = () => {
    if (autoModal) {
      setEditingItem(undefined);
      setIsViewOnly(false);
      setIsModalOpen(true);
    }
    if (onAdd) onAdd();
  };

  const handleEdit = (item: T) => {
    if (autoModal) {
      setEditingItem(item);
      setIsViewOnly(false);
      setIsModalOpen(true);
    }
    if (onEdit) onEdit(item);
  };

  const [isSaving, setIsSaving] = useState(false);

  const defaultForm = (item?: T) => (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        {item ? `${t('editing_record')}: ${item.id}` : `${t('adding_record')} ${title}`}
      </p>
      <div className="space-y-4">
        {columns.map((col, i) => {
          if (typeof col.accessor !== 'string') return null;
          return (
            <div key={i} className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{col.header}</label>
              <input
                type="text"
                name={col.accessor as string}
                defaultValue={item ? (item[col.accessor as keyof T] as any) : ''}
                placeholder={`Enter ${col.header.toLowerCase()}...`}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-500 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
            <p className="text-sm text-zinc-500">{t('manage_records')}</p>
          </div>
          <div className="flex items-center gap-2">
            {!hideExport && (
              <button className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>
            )}
            {actions}
            {onAdd && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> {props.addLabel || t('add_new')}
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={searchPlaceholder || t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">{t('show_label')}</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Filter className="w-4 h-4" /> {t('filters')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {isMobile ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {paginatedData.length === 0 ? (
                <div className="px-6 py-12 text-center text-zinc-500 italic">
                  {t('no_records_found')}
                </div>
              ) : paginatedData.map((item) => (
                <div key={item.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {columns.slice(0, 2).map((col, i) => (
                        <div key={i} className={cn("text-sm", i === 0 ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-500 mt-0.5")}>
                          {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                        </div>
                      ))}
                    </div>
                    {(onView || onEdit || onDelete || extraActions || (autoModal && (autoViewModal || renderDetails || renderForm))) && (
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeDropdown === item.id) {
                              setActiveDropdown(null);
                              setAnchorRect(null);
                              setDropdownStyles({ position: 'fixed', visibility: 'hidden' });
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveDropdown(item.id);
                              setAnchorRect(rect);
                              setDropdownStyles({ position: 'fixed', visibility: 'hidden' });
                            }
                          }}
                          className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Additional fields shown in detail layout on mobile */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {columns.slice(2).map((col, i) => (
                      <div key={i} className={cn(col.hiddenOnMobile ? "hidden" : "flex flex-col")}>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{col.header}</span>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                          {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-0">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                {columns.map((col, i) => (
                  <th key={i} className={cn(
                    "px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider",
                    col.hiddenOnMobile && "hidden sm:table-cell",
                    col.hiddenOnTablet && "hidden lg:table-cell",
                    col.className
                  )}>
                    {col.header}
                  </th>
                ))}
                {(onView || onEdit || onDelete || extraActions || (autoModal && (autoViewModal || renderDetails || renderForm))) && (
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">{t('actions')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-zinc-500 italic">
                    {t('no_records_found')}
                  </td>
                </tr>
              ) : paginatedData.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group relative",
                    activeDropdown === item.id ? "z-50" : "z-0"
                  )}
                >
                  {columns.map((col, i) => (
                    <td key={i} className={cn(
                      "px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400",
                      col.hiddenOnMobile && "hidden sm:table-cell",
                      col.hiddenOnTablet && "hidden lg:table-cell",
                      col.className
                    )}>
                      {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  {(onView || onEdit || onDelete || extraActions || (autoModal && (autoViewModal || renderDetails || renderForm))) && (
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeDropdown === item.id) {
                              setActiveDropdown(null);
                              setAnchorRect(null);
                              setDropdownStyles({ position: 'fixed', visibility: 'hidden' });
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveDropdown(item.id);
                              setAnchorRect(rect);
                              setDropdownStyles({ position: 'fixed', visibility: 'hidden' });
                            }
                          }}
                          className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {activeDropdown === item.id && anchorRect && createPortal(
                          <div
                            ref={dropdownRef}
                            className="z-[9999] w-48 origin-top-right rounded-xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 focus:outline-none"
                            style={dropdownStyles}
                          >
                            <div className="p-1.5 space-y-0.5" onClick={(e) => e.stopPropagation()}>
                              {(onView || (autoModal && autoViewModal && (renderDetails || renderForm))) && (
                                <button
                                  onClick={() => {
                                    handleView(item);
                                    setActiveDropdown(null);
                                    setAnchorRect(null);
                                  }}
                                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-indigo-600 rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                  {t('view')}
                                </button>
                              )}

                              {extraActions && (
                                <div className="px-1 py-1 border-y border-zinc-100 dark:border-zinc-800 my-1">
                                  {extraActions(item)}
                                </div>
                              )}

                              {(onEdit || (autoModal && renderForm && onSave)) && (!props.canEdit || props.canEdit(item)) && (
                                <button
                                  onClick={() => {
                                    handleEdit(item);
                                    setActiveDropdown(null);
                                    setAnchorRect(null);
                                  }}
                                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-indigo-600 rounded-lg transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                  {t('edit')}
                                </button>
                              )}

                              {onDelete && (!props.canDelete || props.canDelete(item)) && (
                                <button
                                  onClick={() => {
                                    onDelete(item);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {t('delete')}
                                </button>
                              )}
                            </div>
                          </div>
                          , document.body)}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {filteredData.length > 0
              ? `${t('showing')} ${(currentPage - 1) * itemsPerPage + 1} ${t('to')} ${Math.min(currentPage * itemsPerPage, filteredData.length)} ${t('of')} ${filteredData.length} ${t('entries')}`
              : t('no_entries_to_show')}
          </p>
          <div className="flex items-center gap-1">
            <button
              className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {(() => {
              const pages = [];
              const maxVisiblePages = 5;
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }

              if (startPage > 1) {
                pages.push(
                  <button key={1} onClick={() => setCurrentPage(1)} className="w-8 h-8 text-xs font-bold rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">1</button>
                );
                if (startPage > 2) pages.push(<span key="dots-start" className="text-zinc-400">...</span>);
              }

              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={cn(
                      "w-8 h-8 text-xs font-bold rounded-lg transition-colors",
                      i === currentPage ? "bg-indigo-600 text-white" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    {i}
                  </button>
                );
              }

              if (endPage < totalPages) {
                if (endPage < totalPages - 1) pages.push(<span key="dots-end" className="text-zinc-400">...</span>);
                pages.push(
                  <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="w-8 h-8 text-xs font-bold rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">{totalPages}</button>
                );
              }

              return pages;
            })()}

            <button
              className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-50"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {autoModal && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSaving && setIsModalOpen(false)}
          title={
            editingItem
              ? (isViewOnly ? t('view_record_title').replace('{title}', title) : t('edit_record_title').replace('{title}', title))
              : ((props as any).modalTitle || t('add_new_record_title').replace('{title}', title))
          }
          maxWidth={detailsMaxWidth || undefined}
          maxHeight={detailsMaxWidth ? "max-h-[85vh]" : undefined}
          footer={
            <>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
              >
                {isViewOnly ? t('close') : t('cancel')}
              </button>
              {!isViewOnly && (
                <button
                  disabled={isSaving}
                  onClick={async () => {
                    const form = document.getElementById('datatable-form') as HTMLFormElement;
                    if (form) {
                      setIsSaving(true);
                      try {
                        const formData = new FormData(form);
                        const values: any = {};

                        // Helper to convert File to base64
                        const fileToBase64 = (file: File): Promise<string> => {
                          return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = error => reject(error);
                          });
                        };

                        const entries = Array.from((formData as any).entries());
                        const processedKeys = new Set<string>();

                        for (const [key, value] of entries as any[]) {
                          if (processedKeys.has(key)) continue;

                          const element = form.elements.namedItem(key) as any;
                          const isMultiple = element && (element.multiple || (element instanceof NodeList && (element[0] as any).type === 'checkbox'));

                          if (isMultiple) {
                            values[key] = formData.getAll(key);
                            processedKeys.add(key);
                          } else if (value instanceof File && value.size > 0) {
                            try {
                              values[key] = await fileToBase64(value);
                            } catch (err) {
                              console.error('Error converting file:', err);
                            }
                            processedKeys.add(key);
                          } else if (!(value instanceof File)) {
                            values[key] = value;
                            processedKeys.add(key);
                          }
                        }

                        // Add false for unchecked checkboxes
                        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach((cb: any) => {
                          if (cb.name && !formData.has(cb.name)) {
                            values[cb.name] = false;
                          }
                        });

                        if (onSave) {
                          await onSave(editingItem ? { ...editingItem, ...values } : values);
                        }
                        setIsModalOpen(false);
                      } catch (err) {
                        console.error('Error saving:', err);
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('saving') || 'Saving...'}
                    </>
                  ) : (
                    editingItem ? t('save_changes') : t('add_record')
                  )}
                </button>
              )}
            </>
          }
        >
          <form id="datatable-form" onSubmit={(e) => e.preventDefault()}>
            {isViewOnly && renderDetails && editingItem
              ? renderDetails(editingItem)
              : (renderForm ? renderForm(editingItem, isViewOnly, (item) => {
                setEditingItem(item);
                setIsViewOnly(false);
              }) : defaultForm(editingItem))}
          </form>
        </Modal>
      )}
    </>
  );
}
