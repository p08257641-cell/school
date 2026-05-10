import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';
import { Package, ShieldCheck, Box, Truck, AlertCircle, HardDrive, ShoppingCart, Users } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { Modal } from '../UI';
import { API_BASE_URL } from '../../constants';

export const InventoryAssetManagement = () => {
  const { currency, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'store' | 'assets' | 'transactions' | 'suppliers' | 'alerts'>('store');
  const [items, setItems] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [itemsRes, assetsRes, txRes, suppRes] = await Promise.all([
        fetch(`${API_BASE_URL}/inventory/items`, { headers }),
        fetch(`${API_BASE_URL}/assets`, { headers }),
        fetch(`${API_BASE_URL}/inventory/transactions`, { headers }),
        fetch(`${API_BASE_URL}/inventory/suppliers`, { headers })
      ]);

      if (itemsRes.ok) setItems(await itemsRes.json());
      if (assetsRes.ok) setAssets(await assetsRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (suppRes.ok) setSuppliers(await suppRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveItem = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const method = data.id ? 'PATCH' : 'POST';
      const url = data.id ? `${API_BASE_URL}/inventory/items/${data.id}` : `${API_BASE_URL}/inventory/items`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        (window as any).showToast?.('Item saved successfully', 'success');
        fetchData();
      } else {
        const err = await res.json();
        (window as any).showToast?.(err.error, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAsset = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const method = data.id ? 'PATCH' : 'POST';
      const url = data.id ? `${API_BASE_URL}/assets/${data.id}` : `${API_BASE_URL}/assets`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        (window as any).showToast?.('Asset saved successfully', 'success');
        fetchData();
      } else {
        const err = await res.json();
        (window as any).showToast?.(err.error, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSupplier = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const method = data.id ? 'PATCH' : 'POST';
      const url = data.id ? `${API_BASE_URL}/inventory/suppliers/${data.id}` : `${API_BASE_URL}/inventory/suppliers`;
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        (window as any).showToast?.('Supplier saved successfully', 'success');
        fetchData();
      } else {
        const err = await res.json();
        (window as any).showToast?.(err.error, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTransaction = async (data: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/inventory/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        (window as any).showToast?.('Transaction recorded successfully', 'success');
        fetchData();
      } else {
        const err = await res.json();
        (window as any).showToast?.(err.error, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRecord = async (id: string, endpoint: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        (window as any).showToast?.('Deleted successfully', 'success');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const lowStockItems = items.filter(i => i.quantity <= i.min_stock_level);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Inventory & Assets</h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Manage school supplies, fixed assets, and purchases</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('store')}
          className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", activeTab === 'store' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500 hover:text-zinc-700")}
        >
          <Box className="w-4 h-4" /> Store Management
        </button>
        <button 
          onClick={() => setActiveTab('assets')}
          className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", activeTab === 'assets' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500 hover:text-zinc-700")}
        >
          <HardDrive className="w-4 h-4" /> Asset Tracking
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", activeTab === 'transactions' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500 hover:text-zinc-700")}
        >
          <ShoppingCart className="w-4 h-4" /> Purchase Records
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", activeTab === 'suppliers' ? "bg-white dark:bg-zinc-700 shadow-sm text-indigo-600" : "text-zinc-500 hover:text-zinc-700")}
        >
          <Truck className="w-4 h-4" /> Suppliers
        </button>
        <button 
          onClick={() => setActiveTab('alerts')}
          className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2", activeTab === 'alerts' ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "text-zinc-500 hover:text-red-500")}
        >
          <AlertCircle className="w-4 h-4" /> Stock Alerts ({lowStockItems.length})
        </button>
      </div>

      {activeTab === 'store' && (
        <DataTable
          title="Store Items"
          data={items}
          columns={[
            { header: 'Item Name', accessor: (item: any) => item.name, className: 'font-bold' },
            { header: 'Category', accessor: (item: any) => item.category },
            { header: 'Unit Price', accessor: (item: any) => `${currency} ${item.unit_price}` },
            { header: 'In Stock', accessor: (item: any) => (
              <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase", item.quantity <= item.min_stock_level ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                {item.quantity} Units
              </span>
            )}
          ]}
          onAdd={() => {}}
          onEdit={(item) => {}}
          onDelete={(item) => deleteRecord(item.id, '/inventory/items')}
          onSave={handleSaveItem}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">In Stock</p>
                  <p className={cn("text-2xl font-black", item.quantity <= item.min_stock_level ? "text-red-600" : "text-zinc-900 dark:text-white")}>{item.quantity} Units</p>
                  {item.quantity <= item.min_stock_level && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">Low Stock</p>}
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Unit Price</p>
                  <p className="text-2xl font-black text-indigo-600">{currency}{item.unit_price}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Min Stock Level</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.min_stock_level}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Total Value</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{currency}{(parseFloat(item.quantity) * parseFloat(item.unit_price)).toLocaleString()}</p>
                 </div>
              </div>
              
              {item.description && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Description</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.description}</p>
                </div>
              )}
            </div>
          )}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Item Name</label>
                  <input name="name" defaultValue={item?.name} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
                  <input name="category" defaultValue={item?.category} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Unit Price</label>
                  <input type="number" step="0.01" name="unit_price" defaultValue={item?.unit_price} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Min Stock Level</label>
                  <input type="number" name="min_stock_level" defaultValue={item?.min_stock_level || 5} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                <textarea name="description" defaultValue={item?.description} rows={3} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm resize-none" />
              </div>
            </div>
          )}
        />
      )}

      {activeTab === 'assets' && (
        <DataTable
          title="Fixed Assets"
          data={assets}
          columns={[
            { header: 'Asset Name', accessor: (item: any) => item.name, className: 'font-bold' },
            { header: 'Serial Number', accessor: (item: any) => item.serial_number || 'N/A', className: 'font-mono text-xs text-zinc-500' },
            { header: 'Assigned To', accessor: (item: any) => item.assigned_to_name || 'Unassigned' },
            { header: 'Condition', accessor: (item: any) => (
              <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase", item.condition === 'Good' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                {item.condition}
              </span>
            )}
          ]}
          onAdd={() => {}}
          onEdit={(item) => {}}
          onDelete={(item) => deleteRecord(item.id, '/assets')}
          onSave={handleSaveAsset}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100 dark:shadow-none">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest", item.condition === 'Good' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400")}>
                      {item.condition}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Serial Number</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{item.serial_number || 'N/A'}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Assigned To</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.assigned_to_name || 'Unassigned'}</p>
                 </div>
              </div>
              
              <div className="space-y-1">
                 <p className="text-xs font-bold text-zinc-500 uppercase">Location</p>
                 <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.location || 'N/A'}</p>
              </div>
            </div>
          )}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Asset Name</label>
                  <input name="name" defaultValue={item?.name} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Serial Number</label>
                  <input name="serial_number" defaultValue={item?.serial_number} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Condition</label>
                  <select name="condition" defaultValue={item?.condition || 'Good'} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm">
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Location</label>
                  <input name="location" defaultValue={item?.location} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
              </div>
            </div>
          )}
        />
      )}

      {activeTab === 'transactions' && (
        <DataTable
          title="Inventory Transactions"
          data={transactions}
          columns={[
            { header: 'Date', accessor: (item: any) => new Date(item.created_at).toLocaleDateString() },
            { header: 'Type', accessor: (item: any) => (
              <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase", item.type === 'IN' ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700")}>
                {item.type === 'IN' ? 'Purchase (IN)' : 'Issuance (OUT)'}
              </span>
            )},
            { header: 'Item', accessor: (item: any) => item.item_name, className: 'font-bold' },
            { header: 'Quantity', accessor: (item: any) => item.quantity },
            { header: 'Total Price', accessor: (item: any) => item.total_price ? `${currency} ${item.total_price}` : '-' },
          ]}
          onAdd={() => {}}
          onSave={handleSaveTransaction}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg", item.type === 'IN' ? "bg-indigo-600 shadow-indigo-100 dark:shadow-none" : "bg-amber-500 shadow-amber-100 dark:shadow-none")}>
                  {item.type === 'IN' ? <Box className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.item_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest", item.type === 'IN' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400")}>
                      {item.type === 'IN' ? 'Purchase (IN)' : 'Issuance (OUT)'}
                    </span>
                    <span className="text-xs font-bold text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Quantity</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white">{item.quantity} Units</p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Total Price</p>
                  <p className="text-2xl font-black text-indigo-600">{item.total_price ? `${currency}${item.total_price}` : 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Unit Price</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.unit_price ? `${currency}${item.unit_price}` : 'N/A'}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Reference Number</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{item.reference_number || 'N/A'}</p>
                 </div>
              </div>
              
              {item.type === 'IN' && item.supplier_id && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Supplier</p>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {suppliers.find((s: any) => s.id === item.supplier_id)?.name || 'Unknown Supplier'}
                  </p>
                </div>
              )}
            </div>
          )}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Transaction Type</label>
                  <select name="type" defaultValue={item?.type || 'IN'} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm">
                    <option value="IN">Purchase (Stock IN)</option>
                    <option value="OUT">Issuance (Stock OUT)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Item</label>
                  <select name="item_id" defaultValue={item?.item_id} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm">
                    <option value="">Select Item...</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.quantity})</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Supplier</label>
                  <select name="supplier_id" defaultValue={item?.supplier_id} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm">
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Quantity</label>
                  <input type="number" name="quantity" defaultValue={item?.quantity} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Unit Price</label>
                  <input type="number" step="0.01" name="unit_price" defaultValue={item?.unit_price} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Ref Number / Invoice</label>
                  <input name="reference_number" defaultValue={item?.reference_number} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
              </div>
            </div>
          )}
        />
      )}

      {activeTab === 'suppliers' && (
        <DataTable
          title="Suppliers Directory"
          data={suppliers}
          columns={[
            { header: 'Supplier Name', accessor: (item: any) => item.name, className: 'font-bold' },
            { header: 'Contact Person', accessor: (item: any) => item.contact_person },
            { header: 'Phone', accessor: (item: any) => item.phone },
            { header: 'Email', accessor: (item: any) => item.email },
          ]}
          onAdd={() => {}}
          onEdit={(item) => {}}
          onDelete={(item) => deleteRecord(item.id, '/inventory/suppliers')}
          onSave={handleSaveSupplier}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100 dark:shadow-none">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      Supplier
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Contact Person</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.contact_person || 'N/A'}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Phone</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.phone || 'N/A'}</p>
                 </div>
              </div>
              
              <div className="space-y-1">
                 <p className="text-xs font-bold text-zinc-500 uppercase">Email</p>
                 <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.email || 'N/A'}</p>
              </div>
            </div>
          )}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Supplier Name</label>
                  <input name="name" defaultValue={item?.name} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Contact Person</label>
                  <input name="contact_person" defaultValue={item?.contact_person} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Phone</label>
                  <input name="phone" defaultValue={item?.phone} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Email</label>
                  <input type="email" name="email" defaultValue={item?.email} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl text-sm" />
                </div>
              </div>
            </div>
          )}
        />
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-white">Low Stock Alerts</h3>
              <p className="text-sm text-zinc-500">Items that fall below their minimum stock level threshold.</p>
            </div>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-emerald-200 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-emerald-700 dark:text-emerald-400">All Stock Levels Healthy</h4>
              <p className="text-sm text-emerald-600/70">No items require immediate restocking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">{item.name}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-red-600">{item.quantity} <span className="text-xs text-red-400 font-bold">IN STOCK</span></p>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mt-1">Min Level: {item.min_stock_level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
