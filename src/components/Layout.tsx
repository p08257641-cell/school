import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Search, Bell, User, ChevronDown, LogOut, 
  Settings, Sun, Moon, Globe, ChevronRight, ShieldCheck,
  GraduationCap, Users, FileText, Shirt, AlertTriangle, CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { NAVIGATION_CONFIG, MODULE_LINK_MAP, UserRole, NavItem } from '../constants';
import { Ward } from '../types';
import { FloatingAIChat } from './FloatingAIChat';
import { useLanguage } from '../lib/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
  allowedModules?: string[] | null;
  currentUser?: any;
  organization?: any;
  wards?: Ward[];
  selectedWardId?: string | null;
  onWardSelect?: (id: string) => void;
  subscriptionInfo?: {
    status: string;
    daysRemaining: number | null;
    isExpired: boolean;
    plan: string;
  } | null;
  notifications?: any[];
  unreadMessagesCount?: number;
}

interface NavLinkProps {
  item: NavItem;
  depth?: number;
  key?: string;
  currentView: string;
  onNavigate: (view: string) => void;
  currentRole: UserRole;
}

const getTranslationKey = (title: string) => {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
};

const NavLink = ({ item, depth = 0, expandedMenus, toggleMenu, currentView, onNavigate, currentRole }: NavLinkProps & { expandedMenus: string[], toggleMenu: (t: string) => void }) => {
  const { t } = useLanguage();
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedMenus.includes(item.title);
  const isActive = currentView === item.title || (item.href === currentView);

  return (
    <div className="w-full">
      <button
        onClick={() => {
          if (hasChildren) {
            toggleMenu(item.title);
          } else if (item.title) {
            onNavigate(item.title);
            if (window.innerWidth < 768) {
              // Close mobile menu if it's open
              const closeBtn = document.getElementById('mobile-menu-close');
              if (closeBtn) closeBtn.click();
            }
          }
        }}
        className={cn(
          "flex items-center w-full px-4 py-2.5 text-sm font-medium transition-colors rounded-lg group",
          isActive 
            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" 
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
          depth > 0 && "pl-11"
        )}
      >
        {item.icon && <item.icon className={cn("w-5 h-5 mr-3 shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300")} />}
        <span className="flex-1 text-left truncate">{t(getTranslationKey(item.title))}</span>
        {hasChildren && (
          <ChevronRight className={cn(
            "w-4 h-4 transition-transform",
            isExpanded && "rotate-90"
          )} />
        )}
      </button>
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {item.children?.filter(child => child.roles.includes(currentRole)).map(child => (
              <NavLink 
                key={child.title} 
                item={child} 
                depth={depth + 1} 
                expandedMenus={expandedMenus} 
                toggleMenu={toggleMenu}
                currentView={currentView}
                onNavigate={onNavigate}
                currentRole={currentRole}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Layout({ 
  children, 
  currentRole, 
  onRoleChange, 
  currentView, 
  onNavigate, 
  onLogout,
  allowedModules,
  currentUser,
  organization,
  wards = [],
  selectedWardId,
  onWardSelect,
  subscriptionInfo,
  notifications = [],
  unreadMessagesCount = 0
}: LayoutProps) {
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Sync dark mode with document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const filteredNav = NAVIGATION_CONFIG.filter(item => {
    // 1. Role Check
    if (!item.roles.includes(currentRole)) return false;

    // 2. Plan/Module Check (Skip for Super Admin)
    if (currentRole === 'SUPER_ADMIN') return true;
    if (!allowedModules) return true; // Fallback if data not yet loaded

    // Always allow E-Learning for key staff roles regardless of subscription
    if (item.title === 'E-Learning' && ['SCHOOL_ADMIN', 'HOD', 'STAFF'].includes(currentRole)) return true;

    const moduleName = MODULE_LINK_MAP[item.title];
    if (!moduleName) return true; // General items like Dashboard always allowed

    return allowedModules.some(m => m?.toLowerCase().includes(moduleName.toLowerCase()));
  });

  return (
    <div 
      className={cn("min-h-screen bg-zinc-50 dark:bg-zinc-950 flex transition-colors duration-300", isDarkMode && "dark")}
      style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
    >
      {/* Sidebar - Desktop */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300 sticky top-0 h-screen",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              {currentRole === 'SUPER_ADMIN' ? (
                <img 
                  src="/assets/schoolhub_full_logo.png" 
                  alt="SchoolHub" 
                  className="h-8 w-auto object-contain" 
                />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-indigo-600">
                    {organization?.logo ? (
                      <img src={organization.logo} alt={organization.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{organization?.name?.charAt(0) || 'S'}</span>
                    )}
                  </div>
                  <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white truncate max-w-[160px]">
                    {organization?.name || 'School Portal'}
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto overflow-hidden bg-indigo-600">
              {currentRole === 'SUPER_ADMIN' ? (
                <img 
                  src="/assets/schoolhub_icon.png" 
                  alt="SchoolHub" 
                  className="w-full h-full object-contain p-1" 
                />
              ) : (
                organization?.logo ? (
                  <img src={organization.logo} alt={organization.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{organization?.name?.charAt(0) || 'S'}</span>
                )
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNav.map(item => (
            <NavLink 
              key={item.title} 
              item={item} 
              expandedMenus={expandedMenus} 
              toggleMenu={toggleMenu}
              currentView={currentView}
              onNavigate={onNavigate}
              currentRole={currentRole}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
              <User className="w-6 h-6 text-zinc-500" />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                  {currentUser?.name || currentUser?.full_name || 'System User'}
                </p>
                <p className="text-xs text-zinc-500 truncate capitalize">{t(currentRole.toLowerCase())}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hidden md:block"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder={t('search')} 
                className="pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Role Switcher in Nav - Only shown if user has multiple roles */}
            {currentUser?.roles?.length > 1 && (
              <div className="relative group ml-0 sm:ml-2">
                <div className="flex items-center gap-2 p-1.5 sm:pl-3 sm:pr-2.5 bg-white dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer w-10 sm:w-auto h-10 sm:h-auto justify-center sm:justify-start">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 sm:w-3 sm:h-3 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  
                  <div className="hidden sm:block flex-1 min-w-0">
                    <span className="block text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest leading-none mb-0.5">Role</span>
                    <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none truncate">
                      {t(currentRole.toLowerCase()).toUpperCase()}
                    </span>
                  </div>

                  <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-zinc-400 transition-transform group-hover:rotate-180" />
                </div>

                <div className="absolute top-full left-0 pt-1 w-52 z-50 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-2 space-y-1">
                    {(currentUser.roles as UserRole[]).map((roleKey) => {
                      const isActive = roleKey === currentRole;
                      return (
                        <button
                          key={roleKey}
                          onClick={() => onRoleChange(roleKey)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group/item",
                            isActive 
                              ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                              : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            isActive ? "bg-indigo-100 dark:bg-indigo-900/40" : "bg-zinc-100 dark:bg-zinc-800 group-hover/item:bg-white dark:group-hover/item:bg-zinc-700"
                          )}>
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-bold uppercase tracking-tight">{t(roleKey.toLowerCase())}</p>
                            <p className="text-[10px] opacity-60">Switch to this dashboard</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ward Switcher for Parents */}
            {currentRole === 'PARENT' && wards.length > 0 && (
              <div className="relative ml-2 sm:ml-4 flex-1 sm:flex-initial flex">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-100 dark:border-indigo-800 shadow-sm transition-all hover:bg-indigo-100 dark:hover:bg-indigo-900/40 group max-w-[140px] sm:max-w-none">
                  <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-indigo-400 dark:text-indigo-600 uppercase tracking-tighter leading-none mb-0.5 truncate hidden sm:block">Select Ward</span>
                    <select 
                      value={selectedWardId || ''}
                      onChange={(e) => onWardSelect?.(e.target.value)}
                      className="bg-transparent border-none p-0 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:ring-0 cursor-pointer pr-4 sm:pr-6 leading-none truncate w-full"
                    >
                      {wards.map((ward) => (
                        <option key={ward.id} value={ward.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {currentRole !== 'PARENT' && (
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 relative transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {(unreadMessagesCount > 0 || notifications.length > 0) && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse"></span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                          <h3 className="font-bold text-zinc-900 dark:text-white">Notifications</h3>
                          {unreadMessagesCount > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full">
                              {unreadMessagesCount} New
                            </span>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notif, idx) => (
                              <div key={idx} className="p-4 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{notif.title}</p>
                                <p className="text-xs text-zinc-500 line-clamp-2">{notif.content || notif.message}</p>
                                <p className="text-[10px] text-zinc-400 mt-2 font-medium">
                                  {new Date(notif.created_at || new Date()).toLocaleDateString()}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-zinc-500">
                              <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                              <p className="text-sm">No new notifications</p>
                            </div>
                          )}
                        </div>
                        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                          <button 
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              onNavigate('Notifications');
                            }}
                            className="w-full py-2 text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          >
                            View All Notifications
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  {(currentUser?.name || currentUser?.full_name || 'U').split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">
                          {currentUser?.name || currentUser?.full_name || 'System User'}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {currentUser?.email || 'user@school.com'}
                        </p>
                      </div>
                      <div className="p-2">
                        {currentRole === 'STUDENT' ? (
                          <>
                            <p className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t('profile')}</p>
                            {[
                              { title: 'Personal Information', icon: User },
                              { title: 'Academic Information', icon: GraduationCap },
                              { title: 'Documents', icon: FileText },
                              { title: 'Edit Profile', icon: Settings },
                            ].map((item) => (
                              <button 
                                key={item.title}
                                onClick={() => {
                                  onNavigate(item.title);
                                  setIsProfileOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                                  currentView === item.title 
                                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 font-bold" 
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                )}
                              >
                                <item.icon className="w-4 h-4" /> {t(getTranslationKey(item.title))}
                              </button>
                            ))}
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => {
                                onNavigate(currentRole === 'STAFF' ? 'Staff Management' : 'profile');
                                setIsProfileOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <User className="w-4 h-4" /> {t('profile')}
                            </button>
                            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                              <Settings className="w-4 h-4" /> {t('settings')}
                            </button>
                          </>
                        )}
                      </div>

                      <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                        <button 
                          onClick={() => onLogout?.()}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> {t('logout')}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-2 sm:p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[10px] sm:text-xs text-zinc-400 mb-6 uppercase tracking-widest font-bold">
              <span className="hover:text-indigo-600 cursor-pointer transition-colors shrink-0">{t('home')}</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="text-zinc-900 dark:text-white shrink-0 truncate max-w-[80px] sm:max-w-none">{t(currentRole.toLowerCase())}</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="text-indigo-600 truncate max-w-[120px] sm:max-w-none">{t(getTranslationKey(currentView))}</span>
            </div>

            {/* Subscription Warning/Expired Banner */}
            {subscriptionInfo && (subscriptionInfo.isExpired || (subscriptionInfo.daysRemaining !== null && subscriptionInfo.daysRemaining <= 7)) && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mb-6 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 border shadow-sm",
                  subscriptionInfo.isExpired 
                    ? "bg-red-50 border-red-100 text-red-700 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400"
                    : "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/10 dark:border-amber-900/30 dark:text-amber-400"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  subscriptionInfo.isExpired ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                )}>
                  {subscriptionInfo.isExpired ? <AlertTriangle className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-bold text-sm uppercase tracking-tight">
                    {subscriptionInfo.isExpired ? "Subscription Expired" : "Subscription Expiring Soon"}
                  </p>
                  <p className="text-xs opacity-80">
                    {subscriptionInfo.isExpired 
                      ? "Your access to most features is currently restricted. Please renew to continue using the system."
                      : `Your subscription for the ${subscriptionInfo.plan} plan will end in ${subscriptionInfo.daysRemaining} days.`}
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('Subscriptions')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    subscriptionInfo.isExpired
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 dark:shadow-none"
                      : "bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200 dark:shadow-none"
                  )}
                >
                  Renew Subscription
                </button>
              </motion.div>
            )}

            {/* Content Restriction Logic */}
            {subscriptionInfo?.isExpired && !['Dashboard', 'Subscriptions', 'profile', 'Change Password'].includes(currentView) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 text-zinc-400">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">Feature Restricted</h2>
                <p className="text-zinc-500 max-w-md mx-auto mb-8">
                  The <strong>{currentView}</strong> module is currently unavailable due to an expired subscription. Please renew your plan to restore full access to all school management features.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => onNavigate('Dashboard')}
                    className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-xs uppercase tracking-widest transition-transform hover:scale-105"
                  >
                    Back to Dashboard
                  </button>
                  <button 
                    onClick={() => onNavigate('Subscriptions')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-transform hover:scale-105 shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    Go to Billing
                  </button>
                </div>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            ></motion.div>
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-zinc-900 z-50 md:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-indigo-600">
                    {currentRole === 'SUPER_ADMIN' ? (
                      <img src="/assets/schoolhub_icon.png" alt="SchoolHub" className="w-full h-full object-contain p-1" />
                    ) : (
                      organization?.logo ? (
                        <img src={organization.logo} alt={organization.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{organization?.name?.charAt(0) || 'S'}</span>
                      )
                    )}
                  </div>
                  <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white truncate max-w-[180px]">
                    {currentRole === 'SUPER_ADMIN' ? 'SchoolHub' : (organization?.name || 'School Portal')}
                  </span>
                </div>
                <button 
                  id="mobile-menu-close"
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="p-2 text-zinc-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {filteredNav.map(item => (
                  <NavLink 
                    key={item.title} 
                    item={item} 
                    expandedMenus={expandedMenus} 
                    toggleMenu={toggleMenu}
                    currentView={currentView}
                    onNavigate={onNavigate}
                    currentRole={currentRole}
                  />
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <FloatingAIChat 
        organization={organization} 
        currentUser={currentUser}
        currentRole={currentRole}
      />
    </div>
  );
}
