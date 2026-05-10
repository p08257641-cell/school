import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { DataTable } from '../DataTable';
import { 
  Download, 
  X, 
  FileSpreadsheet,
  AlertCircle,
  Users,
  ShieldCheck,
  CreditCard,
  Home,
  Activity,
  ShieldAlert,
  Package,
  Navigation,
  MapPin,
  Bus,
  Plus,
  Trash2,
  Heart,
  User
} from 'lucide-react';
import { UserRole, Ward } from '../../types';
import { downloadInventoryTemplate, parseInventoryExcel } from '../../lib/excel';
import { useLanguage } from '../../lib/LanguageContext';
import { SearchableSelect } from '../UI';

export const OperationsModules = {
  Transport: ({ role, currentStudentId, wards, onWardSelect, data, assignments = [], students, staff = [], onApprove, onSave, onDelete, onRefresh }: { role?: UserRole, currentStudentId?: string, wards?: Ward[], onWardSelect?: (id: string) => void, data?: any[], assignments?: any[], students?: any[], staff?: any[], onApprove?: (assignment: any) => void, onSave?: (data: any) => void, onDelete?: (item: any) => void, onRefresh?: () => void }) => {
    const { currency } = useLanguage();
    const [viewingStudents, setViewingStudents] = useState<any | null>(null);
    const [routeStudents, setRouteStudents] = useState<any[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [viewMode, setViewMode] = useState<'routes' | 'students'>('routes');
    const [requesting, setRequesting] = useState<string | null>(null);
    const [pickupInput, setPickupInput] = useState('');
    const [isAddingStudent, setIsAddingStudent] = useState(false);

    const handleViewStudents = async (route: any) => {
      setViewingStudents(route);
      setIsLoadingStudents(true);
      try {
        const { fetchRouteStudents } = await import('../../lib/api');
        const res = await fetchRouteStudents(route.id);
        setRouteStudents(res);
      } catch (err) {
        console.error('Failed to fetch route students:', err);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    const handleAssign = async (studentId: string) => {
      if (!viewingStudents) return;
      const pickupLocation = (document.getElementById('pickupLocation') as HTMLInputElement)?.value;
      try {
        const { assignStudentToTransport } = await import('../../lib/api');
        await assignStudentToTransport(viewingStudents.id, studentId, pickupLocation);
        // Refresh local list
        const { fetchRouteStudents } = await import('../../lib/api');
        const res = await fetchRouteStudents(viewingStudents.id);
        setRouteStudents(res);
        (window as any).showToast?.('Student assigned and invoice generated!', 'success');
        if (document.getElementById('pickupLocation')) (document.getElementById('pickupLocation') as HTMLInputElement).value = '';
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    const handleUnassign = async (studentId: string) => {
      try {
        const { unassignStudentFromTransport } = await import('../../lib/api');
        await unassignStudentFromTransport(studentId);
        setRouteStudents(prev => prev.filter(s => s.id !== studentId));
        (window as any).showToast?.('Student unassigned!', 'success');
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    if (role === 'STUDENT' || role === 'PARENT') {
      const handleRequest = async (routeId: string) => {
        setRequesting(routeId);
        try {
          const { requestTransport } = await import('../../lib/api');
          await requestTransport(routeId, pickupInput);
          (window as any).showToast?.('Transport request sent!', 'success');
          onRefresh?.();
        } catch (err: any) {
          (window as any).showToast?.(err, 'error');
        } finally {
          setRequesting(null);
        }
      };

      const myAssignment = assignments.find(a => String(a.id) === String(currentStudentId));

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">School Bus Service</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Safe and reliable transport for your ward</p>
            </div>
            <Bus className="w-8 h-8 text-indigo-600" />
          </div>

          {myAssignment && (
            <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 opacity-80">Current Status</p>
                  <h3 className="text-lg font-black uppercase tracking-tight">Active Assignment</h3>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/10 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase mb-1 opacity-80">Route</p>
                  <p className="font-bold">{myAssignment.route_name}</p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase mb-1 opacity-80">Location</p>
                  <p className="font-bold truncate">{myAssignment.transport_pickup_location || 'Main Gate'}</p>
                </div>
              </div>
            </div>
          )}

          {role === 'PARENT' && (
            <div className="flex items-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
              <User className="w-5 h-5 text-zinc-400" />
              <select 
                value={currentStudentId}
                onChange={(e) => onWardSelect?.(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-bold flex-1"
              >
                {wards?.map(ward => (
                  <option key={ward.id} value={ward.id}>{ward.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data || []).map(route => {
              const isApplied = myAssignment?.route_id === route.id;
              return (
                <div key={route.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl group hover:border-indigo-500 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                      <Bus className="w-5 h-5" />
                    </div>
                    <span className="text-lg font-black text-indigo-600">{currency} {route.price}</span>
                  </div>
                  <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-1">{route.route_name}</h4>
                  <p className="text-xs text-zinc-500 mb-6 flex items-center gap-2 font-medium">
                    <Navigation className="w-3 h-3" />
                    {route.driver_name || 'Driver TBD'} • {route.vehicle_number || 'Vehicle TBD'}
                  </p>

                  {isApplied ? (
                    <div className="w-full py-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/20">
                      Already Assigned
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Pickup Location (e.g. Landmark)"
                        className="w-full px-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        onChange={(e) => setPickupInput(e.target.value)}
                      />
                      <button
                        onClick={() => handleRequest(route.id)}
                        disabled={requesting === route.id}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                      >
                        {requesting === route.id ? 'Sending Request...' : 'Request to Join Route'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }


    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
            <button 
              onClick={() => setViewMode('routes')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'routes' ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Routes
            </button>
            <button 
              onClick={() => setViewMode('students')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'students' ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              Manage Students
            </button>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'students' && assignments.filter(a => a.transport_status === 'Pending').length > 0 && (
              <button 
                onClick={async () => {
                  const pending = assignments.filter(a => a.transport_status === 'Pending');
                  if (!confirm(`Approve all ${pending.length} pending transport requests? This will generate invoices.`)) return;
                  let successCount = 0;
                  for (const a of pending) {
                    try {
                      await onApprove?.(a);
                      successCount++;
                    } catch (err) {
                      console.error("Failed to approve transport in bulk:", err);
                    }
                  }
                  (window as any).showToast?.(`Successfully approved ${successCount} requests!`, 'success');
                  onRefresh?.();
                }}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-lg flex items-center gap-2"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Approve All Requests
              </button>
            )}
            {viewMode === 'students' && (
              <button 
                onClick={() => setIsAddingStudent(true)}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Student to Route
              </button>
            )}
          </div>
        </div>

        {viewMode === 'routes' ? (
          <DataTable 
            title="Transport Routes" 
            data={data || []}
            onSave={onSave}
            onEdit={() => {}}
            onDelete={onDelete}
            columns={[
            { header: 'Route Name', accessor: (item: any) => item.route_name, className: 'font-bold' },
            { header: 'Price', accessor: (item: any) => item.price ? `${currency}${item.price}` : 'Free' },
            { header: 'Students', accessor: (item: any) => (
              <button 
                onClick={(e) => { e.stopPropagation(); handleViewStudents(item); }}
                className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold transition-colors"
              >
                {item.student_count || 0} Students
              </button>
            )},
            { header: 'Vehicle', accessor: (item: any) => item.vehicle_number },
            { header: 'Driver', accessor: (item: any) => item.driver_name },
          ]}
          onAdd={onSave ? () => {} : undefined}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Route Name</label>
                  <input 
                    name="route_name" 
                    defaultValue={item?.route_name} 
                    required 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Route Price (Per Term/Month)</label>
                  <input 
                    type="number"
                    name="price" 
                    defaultValue={item?.price || 0} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Vehicle Number</label>
                <input 
                  name="vehicle_number" 
                  defaultValue={item?.vehicle_number} 
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Driver Name</label>
                  <SearchableSelect
                    name="driver_name"
                    defaultValue={item?.driver_name}
                    disabled={isViewOnly}
                    options={staff.map((s: any) => ({
                      value: s.name,
                      label: s.name,
                      sublabel: `${s.role}${s.phone ? ` • ${s.phone}` : ''}`
                    }))}
                    onValueChange={(val) => {
                      const selectedStaff = staff.find((s: any) => s.name === val);
                      if (selectedStaff?.phone) {
                        const phoneInput = document.getElementsByName('driver_phone')[0] as HTMLInputElement;
                        if (phoneInput) phoneInput.value = selectedStaff.phone;
                      }
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Driver Phone</label>
                  <input 
                    name="driver_phone" 
                    defaultValue={item?.driver_phone} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.route_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold uppercase">
                      {item.student_count || 0} Students
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase">Price: {item.price || '0.00'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Vehicle License</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white underline decoration-indigo-500/30 font-mono tracking-wider">{item.vehicle_number || 'Not Assigned'}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Registration Date</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-zinc-400 mb-0.5">Assigned Driver</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white leading-relaxed font-medium">
                      {item.driver_name || 'No driver assigned yet.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-zinc-400 mb-0.5">Driver Contact</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {item.driver_phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        />
        ) : (
          <DataTable 
            title="Assigned Students"
            data={assignments}
            columns={[
              { header: 'Student Name', accessor: (item: any) => item.name, className: 'font-bold' },
              { header: 'Adm No.', accessor: (item: any) => item.admission_no },
              { header: 'Route', accessor: (item: any) => (
                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase">
                  {item.route_name}
                </span>
              )},
              { header: 'Pickup Location', accessor: (item: any) => item.transport_pickup_location || 'Not Set', className: 'italic text-zinc-500' },
              { header: 'Status', accessor: (item: any) => (
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                    item.transport_status === 'Pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}>
                    {item.transport_status || 'Approved'}
                  </span>
                  {item.transport_status === 'Pending' && (
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm(`Approve transport request for ${item.name}?`)) return;
                        try {
                          await onApprove?.(item);
                          onRefresh?.();
                        } catch (err: any) {
                          (window as any).showToast?.(err, 'error');
                        }
                      }}
                      className="px-2 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[10px] font-bold transition-colors"
                    >
                      Approve
                    </button>
                  )}
                </div>
              )},
              { header: 'Price', accessor: (item: any) => item.price || '0.00' },
            ]}
            onDelete={async (item) => {
              const isPending = item.transport_status === 'Pending';
              if (!confirm(`${isPending ? 'Reject request for' : 'Unassign'} ${item.name} from transport?`)) return;
              try {
                if (isPending) {
                  const { rejectTransportRequest } = await import('../../lib/api');
                  await rejectTransportRequest(item.id);
                } else {
                  const { unassignStudentFromTransport } = await import('../../lib/api');
                  await unassignStudentFromTransport(item.id);
                }
                onRefresh?.();
                (window as any).showToast?.(isPending ? 'Request rejected' : 'Student unassigned successfully!', 'success');
              } catch (err: any) {
                (window as any).showToast?.(err, 'error');
              }
            }}
          />
        )}

        {/* Add Student Modal */}
        {isAddingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">Assign Student to Transport</h2>
                <button 
                  onClick={() => setIsAddingStudent(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Select Student</label>
                  <select 
                    id="newStudentId"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none font-medium"
                  >
                    <option value="">Choose student...</option>
                    {(students || [])
                      .filter(s => !assignments.find(a => a.id === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Select Route</label>
                  <select 
                    id="newRouteId"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none font-medium"
                  >
                    <option value="">Choose route...</option>
                    {(data || []).map(r => (
                      <option key={r.id} value={r.id}>{r.route_name} ({r.price})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Pickup Location</label>
                  <input 
                    id="newPickupLocation"
                    placeholder="Enter pickup location..."
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <button 
                  onClick={async () => {
                    const sid = (document.getElementById('newStudentId') as HTMLSelectElement).value;
                    const rid = (document.getElementById('newRouteId') as HTMLSelectElement).value;
                    const loc = (document.getElementById('newPickupLocation') as HTMLInputElement).value;
                    if (!sid || !rid) return (window as any).showToast?.('Select student and route', 'error');
                    try {
                      const { assignStudentToTransport } = await import('../../lib/api');
                      await assignStudentToTransport(rid, sid, loc);
                      onRefresh?.();
                      setIsAddingStudent(false);
                      (window as any).showToast?.('Student assigned successfully!', 'success');
                    } catch (err: any) {
                      (window as any).showToast?.(err, 'error');
                    }
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg"
                >
                  Assign to Transport
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
  Hostel: ({ role, currentStudentId, wards, onWardSelect, data, assignments = [], students, onApprove, onSave, onDelete, onRefresh }: { role?: UserRole, currentStudentId?: string, wards?: Ward[], onWardSelect?: (id: string) => void, data?: any[], assignments?: any[], students?: any[], onApprove?: (assignment: any) => void, onSave?: (data: any) => void, onDelete?: (item: any) => void, onRefresh?: () => void }) => {
    const { currency, t } = useLanguage();
    const [viewingRoomsHostel, setViewingRoomsHostel] = useState<any | null>(null);
    const [hostelRooms, setHostelRooms] = useState<any[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);

    const [viewingStudentsRoom, setViewingStudentsRoom] = useState<any | null>(null);
    const [roomStudents, setRoomStudents] = useState<any[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    const [viewMode, setViewMode] = useState<'hostels' | 'residents'>('hostels');
    const [isAddingResident, setIsAddingResident] = useState(false);
    const [allRooms, setAllRooms] = useState<any[]>([]);
    const [hostelRequesting, setHostelRequesting] = useState<string | null>(null);

    const fetchAllRooms = async () => {
      try {
        const { fetchHostelRooms } = await import('../../lib/api');
        const res = await fetchHostelRooms();
        setAllRooms(res);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      }
    };

    React.useEffect(() => {
      if (role === 'STUDENT') fetchAllRooms();
    }, [viewMode]);

    React.useEffect(() => {
      if (isAddingResident) fetchAllRooms();
    }, [isAddingResident]);

    const handleViewRooms = async (hostel: any) => {
      setViewingRoomsHostel(hostel);
      setIsLoadingRooms(true);
      try {
        const { fetchHostelRooms } = await import('../../lib/api');
        const res = await fetchHostelRooms(hostel.id);
        setHostelRooms(res);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      } finally {
        setIsLoadingRooms(false);
      }
    };

    const handleSaveRoom = async (roomData: any) => {
      if (!viewingRoomsHostel) return;
      try {
        const { createHostelRoom, updateHostelRoom, fetchHostelRooms } = await import('../../lib/api');
        if (roomData.id && !roomData.id.startsWith('temp-')) {
          await updateHostelRoom(roomData.id, { ...roomData, hostel_id: viewingRoomsHostel.id });
        } else {
          await createHostelRoom({ ...roomData, hostel_id: viewingRoomsHostel.id });
        }
        const res = await fetchHostelRooms(viewingRoomsHostel.id);
        setHostelRooms(res);
        (window as any).showToast?.('Room saved successfully!', 'success');
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    const handleDeleteRoom = async (room: any) => {
      if (!viewingRoomsHostel) return;
      if (!confirm(`Are you sure you want to delete room ${room.room_number}?`)) return;
      try {
        const { deleteHostelRoom, fetchHostelRooms } = await import('../../lib/api');
        await deleteHostelRoom(room.id);
        const res = await fetchHostelRooms(viewingRoomsHostel.id);
        setHostelRooms(res);
        (window as any).showToast?.('Room deleted!', 'success');
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    const handleViewStudents = async (room: any) => {
      setViewingStudentsRoom(room);
      setIsLoadingStudents(true);
      try {
        const { fetchRoomStudents } = await import('../../lib/api');
        const res = await fetchRoomStudents(room.id);
        setRoomStudents(res);
      } catch (err) {
        console.error('Failed to fetch room students:', err);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    const handleAssign = async (studentId: string) => {
      if (!viewingStudentsRoom) return;
      try {
        const { assignStudentToRoom, fetchRoomStudents } = await import('../../lib/api');
        await assignStudentToRoom(viewingStudentsRoom.id, studentId);
        const res = await fetchRoomStudents(viewingStudentsRoom.id);
        setRoomStudents(res);
        (window as any).showToast?.('Student assigned and invoice generated!', 'success');
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    const handleUnassign = async (studentId: string) => {
      try {
        const { unassignStudentFromRoom } = await import('../../lib/api');
        await unassignStudentFromRoom(studentId);
        setRoomStudents(prev => prev.filter(s => s.id !== studentId));
        (window as any).showToast?.('Student unassigned!', 'success');
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    const [localSelectedWardId, setLocalSelectedWardId] = useState(currentStudentId || wards?.[0]?.id || "");
    
    React.useEffect(() => {
      if (currentStudentId) setLocalSelectedWardId(currentStudentId);
    }, [currentStudentId]);

    const selectedWardId = currentStudentId || localSelectedWardId;
    const myHostelAssignments = assignments.filter((a: any) => String(a.student_id || a.studentId || a.id) === String(selectedWardId));

    return (
      <div className="space-y-6">
        {role === 'PARENT' && wards && wards.length > 1 && (
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-fit group hover:border-indigo-400 transition-colors">
            <span className="text-[10px] font-black text-zinc-400 ml-2 uppercase tracking-[0.2em]">Select Ward:</span>
            <select
              value={selectedWardId}
              onChange={(e) => {
                setLocalSelectedWardId(e.target.value);
                onWardSelect?.(e.target.value);
              }}
              className="bg-transparent text-sm font-black text-zinc-900 dark:text-white outline-none pr-4 cursor-pointer"
            >
              {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        {role === 'STUDENT' || role === 'PARENT' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Hostel & Residency</h2>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Safe and comfortable housing for your ward</p>
              </div>
              <Home className="w-8 h-8 text-indigo-600" />
            </div>

            {assignments.find(a => String(a.id) === String(currentStudentId)) && (
              <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-100 opacity-80">Current Status</p>
                    <h3 className="text-lg font-black uppercase tracking-tight">Active Residency</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/10 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase mb-1 opacity-80">Hostel</p>
                    <p className="font-bold truncate">{assignments.find(a => String(a.id) === String(currentStudentId)).hostel_name}</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase mb-1 opacity-80">Room Number</p>
                    <p className="font-bold">{assignments.find(a => String(a.id) === String(currentStudentId)).room_number}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {allRooms.filter(r => Number(r.student_count) < Number(r.capacity)).map(room => {
                const isAssigned = assignments.some(a => String(a.id) === String(currentStudentId) && a.room_id === room.id);
                return (
                  <div key={room.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl group hover:border-indigo-500 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                        <Home className="w-5 h-5" />
                      </div>
                      <span className="text-lg font-black text-indigo-600">{currency} {room.price}</span>
                    </div>
                    <h4 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-1">{room.hostel_name}</h4>
                    <p className="text-xs text-zinc-500 mb-6 flex items-center gap-2 font-medium">
                      Room {room.room_number} • {room.capacity - room.student_count} Slots Available
                    </p>

                    {isAssigned ? (
                      <div className="w-full py-3 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/20">
                        Current Residence
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          setHostelRequesting(room.id);
                          try {
                            const { assignStudentToRoom } = await import('../../lib/api');
                            await assignStudentToRoom(room.id, currentStudentId!);
                            (window as any).showToast?.('Residency request sent!', 'success');
                            onRefresh?.();
                          } catch (err: any) {
                            (window as any).showToast?.(err, 'error');
                          } finally {
                            setHostelRequesting(null);
                          }
                        }}
                        disabled={hostelRequesting === room.id}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                      >
                        {hostelRequesting === room.id ? 'Processing...' : 'Request Residency'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
                <button 
                  onClick={() => setViewMode('hostels')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    viewMode === 'hostels' ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  Hostels
                </button>
                <button 
                  onClick={() => setViewMode('residents')}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    viewMode === 'residents' ? "bg-white dark:bg-zinc-700 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  Manage Residents
                </button>
              </div>
              <div className="flex items-center gap-2">
                {viewMode === 'residents' && assignments.filter(a => a.hostel_status === 'Pending').length > 0 && (
                  <button 
                    onClick={async () => {
                      const pending = assignments.filter(a => a.hostel_status === 'Pending');
                      if (!confirm(`Approve all ${pending.length} pending hostel requests? This will generate invoices.`)) return;
                      let successCount = 0;
                      for (const a of pending) {
                        try {
                          await onApprove?.(a);
                          successCount++;
                        } catch (err) {
                          console.error("Failed to approve hostel in bulk:", err);
                        }
                      }
                      (window as any).showToast?.(`Successfully approved ${successCount} requests!`, 'success');
                      onRefresh?.();
                    }}
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Approve All Requests
                  </button>
                )}
                {viewMode === 'residents' && (
                  <button 
                    onClick={() => setIsAddingResident(true)}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Resident
                  </button>
                )}
              </div>
            </div>

            {viewMode === 'hostels' ? (
              <DataTable 
                title="Hostel Management" 
                data={data || []}
                onSave={onSave}
                onEdit={() => {}}
                onDelete={onDelete}
                columns={[
                { header: 'Hostel Name', accessor: (item: any) => item.name, className: 'font-bold' },
                { header: 'Type', accessor: (item: any) => (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    item.type === 'Boys' ? "bg-blue-50 text-blue-600" : 
                    item.type === 'Girls' ? "bg-pink-50 text-pink-600" : "bg-zinc-50 text-zinc-600"
                  )}>
                    {item.type}
                  </span>
                )},
                { header: 'Warden', accessor: (item: any) => item.warden_name },
                { header: 'Rooms', accessor: (item: any) => (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleViewRooms(item); }}
                    className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    {item.total_rooms || 0} Rooms
                  </button>
                )},
                { header: 'Capacity', accessor: (item: any) => item.total_capacity || '0' },
              ]}
              renderDetails={(item) => (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                          item.type === 'Boys' ? "bg-blue-100 text-blue-600" : 
                          item.type === 'Girls' ? "bg-pink-100 text-pink-600" : "bg-zinc-100 text-zinc-600"
                        )}>
                          {item.type} Hostel
                        </span>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hostel Management</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Total Capacity</p>
                      <p className="text-2xl font-black text-zinc-900 dark:text-white">{item.total_capacity || 0} Beds</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Total Rooms</p>
                      <p className="text-2xl font-black text-zinc-900 dark:text-white">{item.total_rooms || 0} Units</p>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Assigned Warden</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white">{item.warden_name || 'No warden assigned'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Hostel ID</p>
                      <p className="text-xs font-mono text-zinc-400 font-bold uppercase">#{item.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              )}
              renderForm={(item, isViewOnly) => (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Hostel Name</label>
                    <input 
                      name="name" 
                      defaultValue={item?.name} 
                      required 
                      disabled={isViewOnly}
                      className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Type</label>
                      <select 
                        name="type" 
                        defaultValue={item?.type || 'Boys'} 
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium"
                      >
                        <option value="Boys">Boys</option>
                        <option value="Girls">Girls</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Warden Name</label>
                      <input 
                        name="warden_name" 
                        defaultValue={item?.warden_name} 
                        disabled={isViewOnly}
                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            />
            ) : (
              <DataTable 
                title="Current Residents"
                data={assignments}
                columns={[
                  { header: 'Resident Name', accessor: (item: any) => item.name, className: 'font-bold' },
                  { header: 'Adm No.', accessor: (item: any) => item.admission_no },
                  { header: 'Hostel', accessor: (item: any) => item.hostel_name },
                  { header: 'Room', accessor: (item: any) => (
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold uppercase">
                      Room {item.room_number}
                    </span>
                  )},
                  { header: 'Status', accessor: (item: any) => (
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                        item.hostel_status === 'Pending' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {item.hostel_status || 'Approved'}
                      </span>
                      {item.hostel_status === 'Pending' && (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm(`Approve hostel request for ${item.name}?`)) return;
                            try {
                              await onApprove?.(item);
                              onRefresh?.();
                            } catch (err: any) {
                              (window as any).showToast?.(err, 'error');
                            }
                          }}
                          className="px-2 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  )},
                  { header: 'Price', accessor: (item: any) => item.price ? `${currency}${item.price}` : '0.00' },
                ]}
                onDelete={async (item) => {
                  const isPending = item.hostel_status === 'Pending';
                  if (!confirm(`${isPending ? 'Reject request for' : 'Unassign'} ${item.name} from hostel/room?`)) return;
                  try {
                    if (isPending) {
                      const { rejectHostelRequest } = await import('../../lib/api');
                      await rejectHostelRequest(item.id);
                    } else {
                      const { unassignStudentFromRoom } = await import('../../lib/api');
                      await unassignStudentFromRoom(item.id);
                    }
                    onRefresh?.();
                    (window as any).showToast?.(isPending ? 'Request rejected' : 'Resident unassigned successfully!', 'success');
                  } catch (err: any) {
                    (window as any).showToast?.(err, 'error');
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Rooms Modal */}
        {viewingRoomsHostel && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Rooms in {viewingRoomsHostel.name}</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">{viewingRoomsHostel.type} Hostel</p>
                </div>
                <button 
                  onClick={() => setViewingRoomsHostel(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <DataTable 
                  title="Hostel Rooms"
                  data={hostelRooms}
                  onSave={handleSaveRoom}
                  onDelete={handleDeleteRoom}
                  columns={[
                    { header: 'Room No.', accessor: (item: any) => item.room_number, className: 'font-bold' },
                    { header: 'Price', accessor: (item: any) => item.price ? `${currency}${item.price}` : '0.00' },
                    { header: 'Students', accessor: (item: any) => (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewStudents(item); }}
                        className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        {item.student_count || 0} / {item.capacity} Students
                      </button>
                    )},
                    { header: 'Capacity', accessor: (item: any) => item.capacity },
                  ]}
                  renderDetails={(item) => (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                          <Home className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-zinc-900 dark:text-white">Room {item.room_number}</h3>
                          <div className="flex items-center gap-2">
                             <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                              {item.student_count || 0} / {item.capacity} Occupied
                            </span>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hostel Accommodation</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                          <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Accommodation Fee</p>
                          <p className="text-2xl font-black text-indigo-600 font-serif">{currency}{parseFloat(item.price || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                          <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Room Capacity</p>
                          <p className="text-2xl font-black text-zinc-900 dark:text-white">{item.capacity} Beds</p>
                        </div>
                      </div>

                      <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs font-bold text-zinc-500 uppercase mb-3">Residential Status</p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500 font-medium">Availability</span>
                            <span className={cn(
                              "font-black uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-full",
                              (item.student_count || 0) >= item.capacity ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                            )}>
                              {(item.student_count || 0) >= item.capacity ? 'Full' : 'Available'}
                            </span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, ((item.student_count || 0) / item.capacity) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  renderForm={(item, isViewOnly) => (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Room Number</label>
                          <input 
                            name="room_number" 
                            defaultValue={item?.room_number} 
                            required 
                            disabled={isViewOnly}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase">Price (Per Term/Month)</label>
                          <input 
                            type="number"
                            name="price" 
                            defaultValue={item?.price || 0} 
                            disabled={isViewOnly}
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase">Capacity</label>
                        <input 
                          type="number"
                          name="capacity" 
                          defaultValue={item?.capacity || 1} 
                          disabled={isViewOnly}
                          className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Room Student Management Modal */}
        {viewingStudentsRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Students in Room: {viewingStudentsRoom.room_number}</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">{viewingStudentsRoom.hostel_name} | Price: {viewingStudentsRoom.price}</p>
                </div>
                <button 
                  onClick={() => setViewingStudentsRoom(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Assign Student to Room</label>
                  <div className="flex gap-2">
                    <select 
                      id="roomStudentToAssign"
                      className="flex-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-zinc-200 transition-all font-medium"
                    >
                      <option value="">Select a student...</option>
                      {(students || [])
                        .filter(s => !roomStudents.find(rs => rs.id === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                        ))}
                    </select>
                    <button 
                      onClick={() => {
                        const select = document.getElementById('roomStudentToAssign') as HTMLSelectElement;
                        if (select.value) handleAssign(select.value);
                      }}
                      disabled={roomStudents.length >= viewingStudentsRoom.capacity}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:scale-100"
                    >
                      {roomStudents.length >= viewingStudentsRoom.capacity ? 'Room Full' : 'Assign'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Current Residents ({roomStudents.length})</label>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto">
                      {isLoadingStudents ? (
                        <div className="p-8 text-center text-sm text-zinc-400 font-medium italic">Loading students...</div>
                      ) : roomStudents.length === 0 ? (
                        <div className="p-8 text-center text-sm text-zinc-400 font-medium italic">No students in this room yet.</div>
                      ) : (
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {roomStudents.map(student => (
                              <tr key={student.id} className="group hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                                <td className="px-4 py-3 font-bold">{student.name}</td>
                                <td className="px-4 py-3 text-zinc-500">{student.admission_no}</td>
                                <td className="px-4 py-3 text-right">
                                  <button 
                                    onClick={() => handleUnassign(student.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Add Resident Modal */}
        {isAddingResident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-bold">Assign Resident to Room</h2>
                <button 
                  onClick={() => setIsAddingResident(false)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Select Student</label>
                  <select 
                    id="newResStudentId"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none font-medium"
                  >
                    <option value="">Choose student...</option>
                    {(students || [])
                      .filter(s => !assignments.find(a => a.id === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Select Room</label>
                  <select 
                    id="newResRoomId"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none font-medium"
                  >
                    <option value="">Choose room...</option>
                    {allRooms.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.hostel_name} - Room {r.room_number} ({r.student_count}/{r.capacity})</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={async () => {
                    const sid = (document.getElementById('newResStudentId') as HTMLSelectElement).value;
                    const rid = (document.getElementById('newResRoomId') as HTMLSelectElement).value;
                    if (!sid || !rid) return (window as any).showToast?.('Select student and room', 'error');
                    try {
                      const { assignStudentToRoom } = await import('../../lib/api');
                      await assignStudentToRoom(rid, sid);
                      onRefresh?.();
                      setIsAddingResident(false);
                      (window as any).showToast?.('Resident assigned successfully!', 'success');
                    } catch (err: any) {
                      (window as any).showToast?.(err, 'error');
                    }
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg"
                >
                  Assign to Room
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
  Inventory: ({ data, onSave, onDelete }: { data?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const { currency } = useLanguage();
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState<any[] | null>(null);

    const handleDownloadTemplate = () => {
      downloadInventoryTemplate();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const parsed = await parseInventoryExcel(file);
        setPreviewData(parsed);
      } catch (err: any) {
        (window as any).showToast?.('Could not read the Excel file. Please check the format and try again.', 'error');
      } finally {
        setImporting(false);
        e.target.value = '';
      }
    };

    const confirmImport = async () => {
      if (!previewData || !onSave) return;
      
      try {
        for (const item of previewData) {
          await onSave(item);
        }
        setPreviewData(null);
        (window as any).showToast?.(`Successfully imported ${previewData.length} inventory items.`, 'success');
      } catch (err) {
        (window as any).showToast?.('Something went wrong while saving inventory items. Please try again.', 'error');
      }
    };

    return (
      <div className="space-y-6">
        <DataTable 
          title="Assets & Equipment Management" 
          data={data || []}
          onSave={onSave}
          onDelete={onDelete}
          columns={[
            { header: 'Item Name', accessor: (item: any) => item.item_name, className: 'font-bold' },
            { header: 'Category', accessor: (item: any) => item.category },
            { header: 'Status', accessor: (item: any) => (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                item.status?.toLowerCase().includes('good') ? "bg-emerald-50 text-emerald-600" :
                item.status?.toLowerCase().includes('repair') ? "bg-amber-50 text-amber-600" :
                "bg-zinc-100 text-zinc-600"
              )}>
                {item.status || 'Good Condition'}
              </span>
            )},
            { header: 'Quantity', accessor: (item: any) => item.quantity },
          ]}
          onAdd={onSave ? () => {} : undefined}
          actions={(
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Template
              </button>
              <label className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2 cursor-pointer text-xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Import Excel
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
              </label>
            </div>
          )}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.item_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      {item.category || 'Asset'}
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Asset Registry</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Asset Status</p>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold uppercase inline-block",
                    item.status?.toLowerCase().includes('good') ? "bg-emerald-50 text-emerald-600" :
                    item.status?.toLowerCase().includes('repair') ? "bg-amber-50 text-amber-600" :
                    "bg-zinc-100 text-zinc-600"
                  )}>
                    {item.status || 'Good Condition'}
                  </span>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Next Maintenance</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    {item.next_maintenance_date ? new Date(item.next_maintenance_date).toLocaleDateString() : 'Not Scheduled'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase">Current Stock Count</p>
                    <p className="text-lg font-black text-zinc-900 dark:text-white">{item.quantity} Units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Asset Unit Value</p>
                    <p className="text-lg font-black text-indigo-600">{currency}{Number(item.price || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                  <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Total Asset Valuation</p>
                  <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400 font-serif">{currency}{(item.quantity * (item.price || 0)).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Category</p>
                    <p className="text-sm text-zinc-900 dark:text-white font-medium">{item.category || 'Uncategorized'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Storage Location</p>
                    <p className="text-sm text-zinc-900 dark:text-white font-medium">{item.location || 'Not Specified'}</p>
                  </div>
                </div>
              </div>

              {item.created_at && (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest text-center">
                    Asset Registered On: {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Item Name</label>
                <input 
                  name="item_name" 
                  defaultValue={item?.item_name} 
                  required 
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
                  <input 
                    name="category" 
                    defaultValue={item?.category} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Quantity</label>
                  <input 
                    type="number"
                    name="quantity" 
                    defaultValue={item?.quantity || 0} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Asset Unit Value ({currency})</label>
                  <input 
                    type="number"
                    step="0.01"
                    name="price" 
                    defaultValue={item?.price || 0} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Location</label>
                  <input 
                    name="location" 
                    defaultValue={item?.location} 
                    disabled={isViewOnly}
                    placeholder="e.g. Lab 1, Library"
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                  <select 
                    name="status" 
                    defaultValue={item?.status || 'Good Condition'} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  >
                    <option value="Good Condition">Good Condition</option>
                    <option value="Needs Repair">Needs Repair</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Replacement Needed">Replacement Needed</option>
                    <option value="Lost/Stolen">Lost/Stolen</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-zinc-500 uppercase italic">Next Maintenance Date</label>
                <input 
                  type="date"
                  name="next_maintenance_date" 
                  defaultValue={item?.next_maintenance_date} 
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                />
              </div>
            </div>
          )}
        />

        {/* Inventory Import Preview Modal */}
        {previewData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Preview Inventory Import</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">Review the list of items before updating the inventory</p>
                </div>
                <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[50vh]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-100 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Item Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-zinc-500 uppercase">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3 font-bold">{row.item_name}</td>
                        <td className="px-4 py-3">{row.category}</td>
                        <td className="px-4 py-3 font-bold">{row.quantity}</td>
                        <td className="px-4 py-3">{currency}{row.price?.toLocaleString()}</td>
                        <td className="px-4 py-3 font-black text-indigo-600">{currency}{(row.quantity * row.price).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 flex gap-3">
                <button onClick={() => setPreviewData(null)} className="flex-1 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-bold text-sm">Cancel</button>
                <button 
                  onClick={confirmImport}
                  className="flex-3 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-200 dark:shadow-none"
                >
                  Confirm & Import {previewData.length} Items
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
  HealthMedical: ({ role, currentStudentId, wards, onWardSelect, data, staffList, students, onSave, onDelete }: { role?: UserRole, currentStudentId?: string, wards?: Ward[], onWardSelect?: (id: string) => void, data?: any[], staffList?: any[], students?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const [localSelectedWardId, setLocalSelectedWardId] = useState(currentStudentId || wards?.[0]?.id || "");
    
    React.useEffect(() => {
      if (currentStudentId) setLocalSelectedWardId(currentStudentId);
    }, [currentStudentId]);

    const selectedWardId = currentStudentId || localSelectedWardId;
    const filteredData = role === 'PARENT' ? (data || []).filter(d => d.wardId === selectedWardId) : (data || []);

    return (
      <div className="space-y-6">
        {role === 'PARENT' && wards && wards.length > 1 && (
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-fit group hover:border-emerald-400 transition-colors">
            <span className="text-[10px] font-black text-zinc-400 ml-2 uppercase tracking-[0.2em]">Select Ward:</span>
            <select
              value={selectedWardId}
              onChange={(e) => {
                setLocalSelectedWardId(e.target.value);
                onWardSelect?.(e.target.value);
              }}
              className="bg-transparent text-sm font-black text-zinc-900 dark:text-white outline-none pr-4 cursor-pointer"
            >
              {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        {(role === 'STUDENT' || role === 'PARENT') ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(data || []).map((record: any) => (
              <div key={record.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm group hover:shadow-xl hover:border-emerald-500 transition-all duration-500 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Record Date</p>
                      <p className="text-sm font-black text-zinc-900 dark:text-white">{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight group-hover:text-emerald-600 transition-colors">{record.condition}</h3>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6">{record.student_name}</p>

                  <div className="space-y-4 mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Treatment Plan</p>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">{record.treatment || 'No specific treatment recorded.'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Attending Physician</p>
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{record.doctor_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Heart className="absolute -right-8 -bottom-8 w-40 h-40 text-emerald-500/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
              </div>
            ))}
            {(data || []).length === 0 && (
              <div className="col-span-full py-16 text-center bg-zinc-50 dark:bg-zinc-800/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <Heart className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <p className="text-zinc-500 font-bold">No medical records found.</p>
              </div>
            )}
          </div>
        ) : (
          <DataTable 
            title="Health & Medical Records" 
            data={data || []}
            onSave={onSave}
            onEdit={() => {}}
            onDelete={onDelete}
            columns={[
              { header: 'Student', accessor: (item: any) => item.student_name, className: 'font-bold' },
              { header: 'Condition', accessor: (item: any) => item.condition },
              { header: 'Treatment', accessor: (item: any) => item.treatment },
              { header: 'Doctor', accessor: (item: any) => item.doctor_name },
              { header: 'Date', accessor: (item: any) => item.date ? new Date(item.date).toLocaleDateString() : 'N/A' },
            ]}
            onAdd={onSave ? () => {} : undefined}
          renderForm={(item, isViewOnly) => (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Student</label>
                <select 
                  name="student_id" 
                  defaultValue={item?.student_id} 
                  required 
                  disabled={isViewOnly}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                >
                  <option value="">Select Student...</option>
                  {(students || []).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Condition</label>
                  <input 
                    name="condition" 
                    defaultValue={item?.condition} 
                    required 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Treatment</label>
                  <input 
                    name="treatment" 
                    defaultValue={item?.treatment} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Doctor Name</label>
                  <input 
                    name="doctor_name" 
                    defaultValue={item?.doctor_name} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Date</label>
                  <input 
                    type="date"
                    name="date" 
                    defaultValue={item?.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
                    disabled={isViewOnly}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}
          renderDetails={(item) => (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100 dark:shadow-none">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.student_name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      Medical Record
                    </span>
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Condition Diagnosed
                  </p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">{item.condition || 'Not Specified'}</p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Treatment / Action
                  </p>
                  <p className="text-sm font-black text-zinc-900 dark:text-white">{item.treatment || 'No Treatment Logged'}</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Attending Clinician</p>
                  <p className="text-base font-black text-zinc-900 dark:text-white">{item.doctor_name || 'School Nurse'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Case Reference</p>
                  <p className="text-sm font-mono text-zinc-400 font-bold uppercase tracking-widest">#{String(item.id).slice(0, 8)}</p>
                </div>
              </div>

              {item.notes && (
                <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                  <p className="text-xs font-bold text-amber-600 uppercase mb-2 italic">Clinical Observations</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">{item.notes}</p>
                </div>
              )}
            </div>
          )}

        />
      )}
      </div>
    );
  },
  BehaviorDiscipline: ({ role, currentStudentId, wards, onWardSelect, data, students, onSave, onDelete }: { role?: UserRole, currentStudentId?: string, wards?: Ward[], onWardSelect?: (id: string) => void, data?: any[], students?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void }) => {
    const [localSelectedWardId, setLocalSelectedWardId] = useState(currentStudentId || (wards && wards.length > 0 ? wards[0].id : ""));
    
    React.useEffect(() => {
      if (currentStudentId) setLocalSelectedWardId(currentStudentId);
    }, [currentStudentId]);

    const selectedWardId = currentStudentId || localSelectedWardId;
    const filteredData = role === 'PARENT' ? (data || []).filter(d => String(d.student_id) === String(selectedWardId)) : (data || []);

    return (
    <div className="space-y-6">
      {role === 'PARENT' && wards && wards.length > 1 && (
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-fit group hover:border-indigo-400 transition-colors">
          <span className="text-[10px] font-black text-zinc-400 ml-2 uppercase tracking-[0.2em]">Select Ward:</span>
          <select
            value={selectedWardId}
            onChange={(e) => {
              setLocalSelectedWardId(e.target.value);
              onWardSelect?.(e.target.value);
            }}
            className="bg-transparent text-sm font-black text-zinc-900 dark:text-white outline-none pr-4 cursor-pointer"
          >
            {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      )}
    <DataTable 
      title="Behavior & Discipline" 
      data={filteredData}
      onSave={onSave}
      onEdit={() => {}}
      onDelete={onDelete}
      columns={[
        { header: 'Student Name', accessor: (item: any) => item.student_name, className: 'font-bold' },
        { header: 'Incident', accessor: (item: any) => item.incident },
        { header: 'Action Taken', accessor: (item: any) => item.action_taken },
        { header: 'Date', accessor: (item: any) => item.date ? new Date(item.date).toLocaleDateString() : 'N/A' },
        { 
          header: 'Status', 
          accessor: (item: any) => (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
              item.severity === 'High' ? "bg-red-50 text-red-600" : 
              item.severity === 'Medium' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
            )}>
              {item.severity}
            </span>
          )
        },
      ]}
      onAdd={onSave ? () => {} : undefined}
      renderForm={(item, isViewOnly) => (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">Student</label>
            <select 
              name="student_id" 
              defaultValue={item?.student_id} 
              required 
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
            >
              <option value="">Select Student...</option>
              {(students || []).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">Incident Description</label>
            <textarea
              name="incident" 
              defaultValue={item?.incident} 
              required 
              disabled={isViewOnly}
              rows={3}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">Action Taken</label>
              <input 
                name="action_taken" 
                defaultValue={item?.action_taken} 
                disabled={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase">Severity</label>
              <select 
                name="severity" 
                defaultValue={item?.severity || 'Low'} 
                disabled={isViewOnly}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase">Date</label>
            <input 
              type="date"
              name="date" 
              defaultValue={item?.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} 
              disabled={isViewOnly}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm"
            />
          </div>
        </div>
      )}
      renderDetails={(item) => (
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
              item.severity === 'High' ? "bg-red-600 shadow-red-100" :
              item.severity === 'Medium' ? "bg-amber-500 shadow-amber-100" : "bg-emerald-500 shadow-emerald-100"
            )}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.student_name}</h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest",
                  item.severity === 'High' ? "bg-red-100 text-red-600" :
                  item.severity === 'Medium' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {item.severity} Severity
                </span>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Disciplinary Record</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Incident Description</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium line-clamp-4">
                {item.incident}
              </p>
            </div>

            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
              <p className="text-xs font-bold text-indigo-600 uppercase mb-1 flex items-center gap-2">
                Action Carried Out
              </p>
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {item.action_taken || 'No action recorded yet.'}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
               <p className="text-[10px] text-zinc-400 uppercase tracking-widest text-center">
                Recorded On: {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    />
    </div>
  );
  },
  Clubs: ({ role, currentStudentId, wards, onWardSelect, data, students, staff, onSave, onDelete, onRefresh }: { role?: string, currentStudentId?: string, wards?: Ward[], onWardSelect?: (id: string) => void, data?: any[], students?: any[], staff?: any[], onSave?: (data: any) => void, onDelete?: (item: any) => void, onRefresh?: () => void }) => {
    const { currency } = useLanguage();
    const [viewingMembers, setViewingMembers] = useState<any | null>(null);
    const [clubMembers, setClubMembers] = useState<any[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [viewMode, setViewMode] = useState<'clubs' | 'memberships'>('clubs');
    const [allMemberships, setAllMemberships] = useState<any[]>([]);
    const [localSelectedWardId, setLocalSelectedWardId] = useState(currentStudentId || (wards && wards.length > 0 ? wards[0].id : ""));
    
    React.useEffect(() => {
      if (currentStudentId) setLocalSelectedWardId(currentStudentId);
    }, [currentStudentId]);

    const selectedWardId = currentStudentId || localSelectedWardId;
    const [isAddingMember, setIsAddingMember] = useState(false);

    const refreshMemberships = async () => {
      try {
        const { fetchClubMemberships } = await import('../../lib/api');
        const res = await fetchClubMemberships();
        setAllMemberships(res);
      } catch (err) {
        console.error('Failed to fetch memberships:', err);
      }
    };

    React.useEffect(() => {
      refreshMemberships();
    }, [viewMode]);

    const handleViewMembers = async (club: any) => {
      setViewingMembers(club);
      setIsLoadingMembers(true);
      try {
        const res = allMemberships.filter(m => m.club_id === club.id);
        setClubMembers(res);
      } catch (err) {
        console.error('Failed to filter club members:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    const handleJoin = async (clubId: string, studentId: string) => {
      try {
        const { joinClub } = await import('../../lib/api');
        await joinClub({ club_id: clubId, student_id: studentId });
        (window as any).showToast?.('Successfully joined club!', 'success');
        refreshMemberships();
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    const handleLeave = async (membershipId: string) => {
      try {
        const { leaveClub } = await import('../../lib/api');
        await leaveClub(membershipId);
        (window as any).showToast?.('Left club!', 'success');
        refreshMemberships();
        onRefresh?.();
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    const handleApprove = async (membershipId: string) => {
      try {
        const { updateMembershipStatus } = await import('../../lib/api');
        await updateMembershipStatus(membershipId, 'Active');
        (window as any).showToast?.('Membership approved!', 'success');
        refreshMemberships();
      } catch (err: any) {
        (window as any).showToast?.(err, 'error');
      }
    };

    if (role === 'STUDENT' || role === 'PARENT') {
      return (
        <div className="space-y-6">
          {role === 'PARENT' && wards && wards.length > 1 && (
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-fit group hover:border-indigo-400 transition-colors">
              <span className="text-[10px] font-black text-zinc-400 ml-2 uppercase tracking-[0.2em]">Select Ward:</span>
              <select
                value={selectedWardId}
                onChange={(e) => {
                  setLocalSelectedWardId(e.target.value);
                  onWardSelect?.(e.target.value);
                }}
                className="bg-transparent text-sm font-black text-zinc-900 dark:text-white outline-none pr-4 cursor-pointer"
              >
                {wards.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data || []).map((club: any) => {
              const myMembership = allMemberships.find(m => m.club_id === club.id && String(m.student_id) === String(selectedWardId));
              return (
                <div key={club.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                      <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    {club.dues_amount > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-100 dark:border-amber-800">
                        <CreditCard className="w-3 h-3" />
                        {currency}{club.dues_amount} / {club.dues_frequency}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-1">{club.name}</h3>
                  <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{club.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Schedule:</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{club.meeting_schedule}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Category:</span>
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md font-medium text-zinc-600 dark:text-zinc-400">{club.category}</span>
                    </div>
                  </div>

                  {myMembership ? (
                    <div className="flex items-center justify-between mt-auto">
                      <span className={cn(
                        "px-3 py-1 text-xs font-bold rounded-full",
                        myMembership.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {myMembership.status}
                      </span>
                      <button 
                        onClick={() => handleLeave(myMembership.id)}
                        className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                      >
                        Leave Club
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(club.id, selectedWardId!)}
                      disabled={club.status !== 'Active'}
                      className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {club.status === 'Active' ? 'Join Club' : 'Inactive'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 p-1 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('clubs')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all",
              viewMode === 'clubs' ? "bg-white dark:bg-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            Manage Clubs
          </button>
          <button
            onClick={() => setViewMode('memberships')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-lg transition-all",
              viewMode === 'memberships' ? "bg-white dark:bg-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            All Memberships
          </button>
        </div>

        {viewMode === 'clubs' ? (
          <DataTable
            data={data}
            title="Student Clubs"
            onSave={onSave}
            onAdd={onSave ? () => {} : undefined}
            onDelete={onDelete}
            columns={[
              { header: 'Club Name', accessor: (row: any) => row.name, className: 'font-bold' },
              { header: 'Category', accessor: (row: any) => row.category },
              { header: 'Schedule', accessor: (row: any) => row.meeting_schedule },
              { header: 'Dues', accessor: (row: any) => row.dues_amount ? `${currency}${row.dues_amount}` : 'Free' },
              { header: 'Members', accessor: (row: any) => row.member_count || 0 },
              { header: 'Status', accessor: (row: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  row.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-600"
                )}>
                  {row.status}
                </span>
              )},
            ]}
            extraActions={(row) => (
              <button
                onClick={() => handleViewMembers(row)}
                className="flex items-center w-full gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-indigo-600 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                View Members
              </button>
            )}
            renderForm={(item, isViewOnly) => (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Club Name</label>
                    <input name="name" defaultValue={item?.name} required disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Category</label>
                    <input name="category" defaultValue={item?.category} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                  <textarea name="description" defaultValue={item?.description} rows={3} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Schedule</label>
                    <input name="meeting_schedule" defaultValue={item?.meeting_schedule} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" placeholder="e.g. Every Friday, 3 PM" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Patron In Charge</label>
                    <select name="patron_staff_id" defaultValue={item?.patron_staff_id} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm">
                      <option value="">Select Patron...</option>
                      {(staff || []).map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Dues Amount</label>
                    <input type="number" name="dues_amount" defaultValue={item?.dues_amount || 0} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Frequency</label>
                    <select name="dues_frequency" defaultValue={item?.dues_frequency || 'Per Term'} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm">
                      <option value="One-time">One-time</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Per Term">Per Term</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                    <select name="status" defaultValue={item?.status || 'Active'} disabled={isViewOnly} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            renderDetails={(item) => {
              const patron = (staff || []).find((s: any) => s.id === item.patron_staff_id);
              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white">{item.name}</h3>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{item.category}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Club Status</p>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase w-fit",
                        item.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-600"
                      )}>
                        {item.status || 'Active'}
                      </span>
                    </div>
                    <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Total Members</p>
                      <p className="text-2xl font-black text-zinc-900 dark:text-white">{item.member_count || 0}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <p className="text-xs font-bold text-indigo-600 uppercase">Dues & Membership</p>
                    </div>
                    <p className="text-lg font-black text-indigo-700 dark:text-indigo-400">
                      {item.dues_amount > 0 ? `${currency}${item.dues_amount} / ${item.dues_frequency}` : 'No Membership Fees'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase mb-2">Club Description</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                        {item.description || 'No description provided for this club.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase mb-1 underline decoration-indigo-500/30">Meeting Schedule</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{item.meeting_schedule || 'Not scheduled'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-500 uppercase mb-1 underline decoration-indigo-500/30">Patron In Charge</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{patron?.name || 'Not assigned'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}

          />
        ) : (
          <DataTable
            data={allMemberships}
            title="Club Memberships"
            columns={[
              { header: 'Student', accessor: (row: any) => row.student_name, className: 'font-bold' },
              { header: 'Club', accessor: (row: any) => row.club_name },
              { header: 'Status', accessor: (row: any) => (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  row.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                )}>
                  {row.status}
                </span>
              )},
              { header: 'Date', accessor: (row: any) => row.joined_at ? new Date(row.joined_at).toLocaleDateString() : 'N/A' },
            ]}
            extraActions={(row) => (
              <>
                {row.status !== 'Active' && (
                  <button
                    onClick={() => handleApprove(row.id)}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Approve
                  </button>
                )}
              </>
            )}
            onDelete={async (item) => handleLeave(item.id)}
          />
        )}

        {/* Member Modal for Admin */}
        {viewingMembers && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 backdrop-blur-sm">
            <div className="w-full max-w-2xl h-full bg-white dark:bg-zinc-900 shadow-2xl overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-black">{viewingMembers?.name}</h2>
                    <p className="text-zinc-500">Club Members & Enrollment</p>
                  </div>
                  <button onClick={() => setViewingMembers(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-sm font-bold uppercase text-zinc-400 mb-4">Add Student to Club</h3>
                    <div className="flex gap-3">
                      <select id="manualStudentSelector" className="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm">
                        <option value="">Select Student...</option>
                        {(students || []).filter(s => !clubMembers.some(m => m.student_id === s.id)).map((s: any) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const sid = (document.getElementById('manualStudentSelector') as HTMLSelectElement).value;
                          if (sid && viewingMembers?.id) handleJoin(viewingMembers.id, sid);
                        }}
                        className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold rounded-xl shadow-lg active:scale-95 transition-all"
                      >
                        Add Member
                      </button>
                    </div>
                  </div>

                  <DataTable
                    data={allMemberships.filter(m => m.club_id === viewingMembers?.id)}
                    title="Active Members"
                    columns={[
                      { header: 'Student', accessor: (row: any) => row.student_name, className: 'font-bold' },
                      { header: 'Status', accessor: (row: any) => (
                         <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          row.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {row.status}
                        </span>
                      )},
                    ]}
                    onDelete={(row) => handleLeave(row.id)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },

  TripHistory: ({ role }: { role?: UserRole }) => {
    const { t } = useLanguage();
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const { fetchTransportHistory } = await import('../../lib/api');
        setHistory(await fetchTransportHistory());
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    React.useEffect(() => {
      loadHistory();
    }, []);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Trip History</h2>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recent pickup and drop-off activity logs</p>
          </div>
          <button onClick={loadHistory} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500">
            <Activity className={cn("w-6 h-6", isLoading && "animate-spin")} />
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Loading History...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-zinc-300" />
              </div>
              <p className="text-zinc-500 font-medium">No transport history recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
              {history.map((entry, i) => (
                <div key={entry.id || i} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 hover:border-indigo-500/30 transition-all">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0",
                    entry.action === 'pick_up' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'bg-emerald-600 shadow-lg shadow-emerald-600/20'
                  )}>
                    <Navigation className={cn("w-5 h-5", entry.action === 'pick_up' ? "-rotate-45" : "rotate-135")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-zinc-900 dark:text-white uppercase tracking-tight">{entry.student_name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-md border",
                        entry.action === 'pick_up'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/50'
                          : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/50'
                      )}>
                        {entry.action === 'pick_up' ? 'Picked Up' : 'Dropped Off'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                        <MapPin className="w-3 h-3" /> {entry.location || 'Standard Stop'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                        <User className="w-3 h-3 text-indigo-500" /> {entry.performed_by_name || 'Driver'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:block text-left sm:text-right shrink-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white bg-white dark:bg-zinc-900 sm:bg-transparent px-3 py-1.5 sm:px-0 sm:py-0 rounded-lg sm:rounded-none border sm:border-none border-zinc-200 dark:border-zinc-800">
                      {entry.created_at ? new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1 sm:mt-0">
                      {entry.created_at ? new Date(entry.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
};
