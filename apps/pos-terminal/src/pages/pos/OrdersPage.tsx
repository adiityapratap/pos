import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/bizadminfav.jpeg';

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  specialInstructions?: string;
  modifiers: Array<{
    id: string;
    modifierName: string;
    priceAdjustment: number;
  }>;
}

interface Order {
  id: string;
  orderNumber: string;
  displayNumber: string;
  orderType: string;
  orderStatus: string;
  paymentStatus: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  createdAt: string;
  internalNotes?: string;
  orderItems: OrderItem[];
}

interface OrderStats {
  totalOrders: number;
  openOrders: number;
  completedOrders: number;
  totalSales: number;
}

type StatusFilter = 'all' | 'open' | 'preparing' | 'ready' | 'completed';
type OrderTypeFilter = 'all' | 'dine_in' | 'takeaway' | 'delivery';

const OrdersPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({ totalOrders: 0, openOrders: 0, completedOrders: 0, totalSales: 0 });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPanel, setShowPanel] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [statusFilter, orderTypeFilter, searchQuery]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.orderStatus = statusFilter;
      }
      if (orderTypeFilter !== 'all') {
        params.orderType = orderTypeFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      const response = await apiClient.get('/orders', { params });
      setOrders(response.data.orders || []);
      if (response.data.orders?.length > 0 && !selectedOrder) {
        setSelectedOrder(response.data.orders[0]);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/orders/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, { orderStatus: status });
      loadOrders();
      loadStats();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to refund this order?')) return;
    try {
      await apiClient.post(`/orders/${orderId}/refund`);
      loadOrders();
      loadStats();
      alert('Order refunded successfully');
    } catch (error) {
      console.error('Failed to refund order:', error);
      alert('Failed to refund order');
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  const getTimeSince = (dateStr: string) => {
    const date = new Date(dateStr);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; border: string; label: string }> = {
      open: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Open' },
      preparing: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', label: 'Preparing' },
      ready: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'Ready' },
      completed: { bg: 'bg-slate-600/20', text: 'text-slate-400', border: 'border-slate-600/30', label: 'Completed' },
      cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Cancelled' },
      voided: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Voided' },
    };
    return badges[status] || badges.open;
  };

  const getOrderTypeBadge = (type: string) => {
    const badges: Record<string, { bg: string; text: string; border: string; label: string }> = {
      dine_in: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', label: 'DINE IN' },
      takeaway: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30', label: 'TAKEAWAY' },
      delivery: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30', label: 'DELIVERY' },
    };
    return badges[type] || badges.dine_in;
  };

  const getPaymentIcon = (status: string) => {
    if (status === 'paid') return <i className="fa-brands fa-cc-visa text-lg"></i>;
    if (status === 'refunded') return <i className="fa-solid fa-rotate-left text-lg text-red-400"></i>;
    return <i className="fa-solid fa-clock text-lg text-yellow-400"></i>;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'GU';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name?: string) => {
    const colors = ['bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500'];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <div className="flex h-screen w-full bg-[#0B1120] text-slate-200">
      {/* Left Sidebar */}
      <aside className="w-[80px] h-full bg-[#151E32] flex flex-col items-center py-6 border-r border-[#1E293B] z-20 shadow-xl">
        <div className="mb-8 w-12 h-12 flex items-center justify-center bg-blue-600 rounded-xl shadow-lg overflow-hidden">
          <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
        </div>

        <nav className="flex-1 w-full flex flex-col gap-2">
          <a onClick={() => navigate('/')} className="w-full h-16 flex flex-col items-center justify-center text-slate-400 hover:text-white hover:bg-[#1E293B] transition-all cursor-pointer group">
            <i className="fa-solid fa-house text-xl mb-1 group-hover:scale-110 transition-transform"></i>
            <span className="text-[10px] font-medium">Home</span>
          </a>
          
          <a onClick={() => navigate('/')} className="w-full h-16 flex flex-col items-center justify-center text-slate-400 hover:text-white hover:bg-[#1E293B] transition-all cursor-pointer group">
            <i className="fa-solid fa-book-open text-xl mb-1 group-hover:scale-110 transition-transform"></i>
            <span className="text-[10px] font-medium">Menu</span>
          </a>

          <a className="w-full h-16 flex flex-col items-center justify-center text-slate-400 hover:text-white hover:bg-[#1E293B] transition-all cursor-pointer group">
            <i className="fa-solid fa-credit-card text-xl mb-1 group-hover:scale-110 transition-transform"></i>
            <span className="text-[10px] font-medium">Pay</span>
          </a>

          <a className="w-full h-16 flex flex-col items-center justify-center text-blue-400 border-l-4 border-blue-500" style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.1) 0%, transparent 100%)' }}>
            <i className="fa-solid fa-receipt text-xl mb-1"></i>
            <span className="text-[10px] font-bold">Orders</span>
          </a>

          <a className="w-full h-16 flex flex-col items-center justify-center text-slate-400 hover:text-white hover:bg-[#1E293B] transition-all cursor-pointer group">
            <i className="fa-solid fa-chart-pie text-xl mb-1 group-hover:scale-110 transition-transform"></i>
            <span className="text-[10px] font-medium">Report</span>
          </a>
        </nav>

        <div className="mt-auto w-full flex flex-col gap-4 items-center pb-4">
          <button className="w-10 h-10 rounded-full bg-[#1E293B] hover:bg-[#334155] flex items-center justify-center text-slate-300 transition-colors">
            <i className="fa-solid fa-gear"></i>
          </button>
          <button onClick={logout} className="w-10 h-10 rounded-full bg-[#1E293B] hover:bg-red-500/20 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors">
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Top Header */}
        <header className="h-16 bg-[#151E32]/90 backdrop-blur-md border-b border-[#1E293B] flex items-center justify-between px-6 z-10 sticky top-0 w-full">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-white tracking-wide">BIZPOS</h1>
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Online • {formatDate(currentTime)} • {formatTime(currentTime)}
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fa-solid fa-magnifying-glass text-slate-500 group-focus-within:text-blue-400 transition-colors"></i>
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#334155] text-white text-sm rounded-xl block pl-12 p-3 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                placeholder="Search order #, customer, table, or phone..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-xs bg-[#1E293B] text-slate-400 px-2 py-1 rounded border border-[#334155]">⌘K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setShowPanel(!showPanel)} className="p-2 text-blue-400 hover:bg-[#1E293B] rounded-lg transition-colors">
              <i className="fa-solid fa-sidebar text-lg"></i>
            </button>
          </div>
        </header>

        {/* Content Area Split */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Main Orders Area */}
          <main className="flex-1 flex flex-col bg-[#0B1120] overflow-hidden relative border-r border-[#1E293B]">
            
            {/* Stats Row */}
            <div className="px-6 py-5 grid grid-cols-4 gap-4">
              <div className="bg-[#151E32] p-3 rounded-xl border border-[#1E293B] flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Total Orders</p>
                  <p className="text-xl font-bold text-white mt-1">{stats.totalOrders}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <i className="fa-solid fa-clipboard-list"></i>
                </div>
              </div>
              <div className="bg-[#151E32] p-3 rounded-xl border border-[#1E293B] flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Total Sales</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">${Number(stats.totalSales).toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <i className="fa-solid fa-dollar-sign"></i>
                </div>
              </div>
              <div className="bg-[#151E32] p-3 rounded-xl border border-[#1E293B] flex items-center justify-between shadow-sm ring-1 ring-orange-500/30">
                <div>
                  <p className="text-xs text-orange-400 uppercase font-semibold">Open Orders</p>
                  <p className="text-xl font-bold text-orange-400 mt-1">{stats.openOrders}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 animate-pulse">
                  <i className="fa-solid fa-fire"></i>
                </div>
              </div>
              <div className="bg-[#151E32] p-3 rounded-xl border border-[#1E293B] flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Completed</p>
                  <p className="text-xl font-bold text-white mt-1">{stats.completedOrders}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                  <i className="fa-solid fa-check-double"></i>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 pb-4 border-b border-[#1E293B] flex items-center gap-3 overflow-x-auto">
              <div className="flex bg-[#151E32] rounded-lg p-1 border border-[#1E293B] shrink-0">
                {(['all', 'open', 'preparing', 'ready', 'completed'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="h-6 w-px bg-[#334155] mx-1 shrink-0"></div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setOrderTypeFilter(orderTypeFilter === 'dine_in' ? 'all' : 'dine_in')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                    orderTypeFilter === 'dine_in'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-[#334155] bg-[#151E32] text-slate-300 hover:border-blue-500 hover:text-blue-400'
                  }`}
                >
                  <i className="fa-solid fa-utensils text-[10px]"></i> Dine In
                </button>
                <button
                  onClick={() => setOrderTypeFilter(orderTypeFilter === 'takeaway' ? 'all' : 'takeaway')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                    orderTypeFilter === 'takeaway'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-[#334155] bg-[#151E32] text-slate-300 hover:border-blue-500 hover:text-blue-400'
                  }`}
                >
                  <i className="fa-solid fa-bag-shopping text-[10px]"></i> Takeaway
                </button>
                <button
                  onClick={() => setOrderTypeFilter(orderTypeFilter === 'delivery' ? 'all' : 'delivery')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                    orderTypeFilter === 'delivery'
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : 'border-[#334155] bg-[#151E32] text-slate-300 hover:border-blue-500 hover:text-blue-400'
                  }`}
                >
                  <i className="fa-solid fa-truck text-[10px]"></i> Delivery
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <i className="fa-solid fa-receipt text-4xl mb-4"></i>
                  <p>No orders found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 pb-20">
                  {orders.map((order) => {
                    const statusBadge = getStatusBadge(order.orderStatus);
                    const typeBadge = getOrderTypeBadge(order.orderType);
                    const isSelected = selectedOrder?.id === order.id;
                    
                    return (
                      <div
                        key={order.id}
                        onClick={() => { setSelectedOrder(order); setShowPanel(true); }}
                        className={`rounded-xl p-5 shadow-lg cursor-pointer relative transition-all ${
                          isSelected
                            ? 'bg-[#1E293B] border-2 border-blue-500'
                            : 'bg-[#151E32] border border-[#334155] hover:border-blue-500/50'
                        }`}
                      >
                        <div className="absolute top-0 right-0 p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                            {order.orderStatus === 'preparing' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>}
                            {statusBadge.label}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-bold text-white">{order.displayNumber}</h3>
                              {order.tableNumber && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeBadge.bg} ${typeBadge.text} border ${typeBadge.border}`}>
                                  TABLE {order.tableNumber}
                                </span>
                              )}
                              {!order.tableNumber && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeBadge.bg} ${typeBadge.text} border ${typeBadge.border}`}>
                                  {typeBadge.label}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                              <i className="fa-regular fa-clock"></i>
                              {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              <span className={`font-mono text-xs ${order.orderStatus === 'preparing' ? 'text-orange-400' : 'text-slate-500'}`}>
                                ({getTimeSince(order.createdAt)})
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-full ${getAvatarColor(order.customerName)} flex items-center justify-center text-xs font-bold text-white`}>
                              {getInitials(order.customerName)}
                            </div>
                            <span className="font-medium text-slate-200">{order.customerName || 'Guest'}</span>
                            <span className="text-xs text-slate-500">• {order.orderItems.length} items</span>
                          </div>
                          <div className="bg-[#0B1120]/50 rounded-lg p-3 text-sm text-slate-300 border border-[#334155]">
                            {order.orderItems.slice(0, 2).map((item, idx) => (
                              <p key={idx} className="flex justify-between mt-1 first:mt-0">
                                <span>{item.quantity}x {item.itemName}</span>
                                <span className="text-slate-500">${Number(item.lineTotal).toFixed(2)}</span>
                              </p>
                            ))}
                            {order.orderItems.length > 2 && (
                              <p className="text-xs text-slate-500 mt-1 italic">+ {order.orderItems.length - 2} more items...</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#334155]">
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            {getPaymentIcon(order.paymentStatus)}
                            <span className="capitalize">{order.paymentStatus}</span>
                          </div>
                          <span className="text-xl font-bold text-white">${Number(order.totalAmount).toFixed(2)}</span>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setShowPanel(true); }}
                            className="py-2 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-500"
                          >
                            View
                          </button>
                          <button className="py-2 rounded bg-[#151E32] text-slate-300 text-xs font-medium hover:bg-[#334155] border border-[#334155]">
                            Print
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'voided'); }}
                            className="py-2 rounded bg-[#151E32] text-slate-300 text-xs font-medium hover:bg-[#334155] border border-[#334155]"
                          >
                            Void
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRefund(order.id); }}
                            className="py-2 rounded bg-[#151E32] text-slate-300 text-xs font-medium hover:bg-[#334155] border border-[#334155]"
                          >
                            Refund
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* Right Side Panel - Order Details */}
          {showPanel && selectedOrder && (
            <aside className="w-[30%] min-w-[380px] bg-[#151E32] border-l border-[#1E293B] flex flex-col h-full shadow-2xl z-10">
              
              {/* Panel Header */}
              <div className="p-5 border-b border-[#1E293B]">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Order {selectedOrder.displayNumber}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(selectedOrder.orderStatus).bg} ${getStatusBadge(selectedOrder.orderStatus).text} border ${getStatusBadge(selectedOrder.orderStatus).border}`}>
                    {getStatusBadge(selectedOrder.orderStatus).label}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-[#0B1120] rounded-lg border border-[#334155]">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(selectedOrder.customerName)} flex items-center justify-center text-sm font-bold text-white`}>
                    {getInitials(selectedOrder.customerName)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{selectedOrder.customerName || 'Guest'}</p>
                    <p className="text-xs text-slate-400">{selectedOrder.customerPhone || 'No phone'}</p>
                  </div>
                  {selectedOrder.tableNumber && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-1 rounded">TABLE {selectedOrder.tableNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable Item List */}
              <div className="flex-1 overflow-y-auto p-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Order Items ({selectedOrder.orderItems.length})</h3>
                
                <div className="space-y-4">
                  {selectedOrder.orderItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                        {item.quantity}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium text-white text-sm">{item.itemName}</p>
                          <p className="font-medium text-white text-sm">${Number(item.lineTotal).toFixed(2)}</p>
                        </div>
                        {item.specialInstructions && (
                          <p className="text-xs text-slate-400 mt-1">{item.specialInstructions}</p>
                        )}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.modifiers.map((mod) => (
                              <span key={mod.id} className="text-[10px] bg-[#1E293B] text-slate-300 px-1.5 py-0.5 rounded border border-[#334155]">
                                {mod.modifierName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {selectedOrder.internalNotes && (
                    <>
                      <div className="h-px bg-[#334155] my-2"></div>
                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                        <p className="text-xs text-yellow-500 font-bold mb-1"><i className="fa-solid fa-note-sticky mr-1"></i> Kitchen Note</p>
                        <p className="text-xs text-yellow-200">{selectedOrder.internalNotes}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer Totals & Actions */}
              <div className="p-5 bg-[#0B1120] border-t border-[#1E293B]">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span>${Number(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Tax (8%)</span>
                    <span>${Number(selectedOrder.taxAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Discount</span>
                    <span>${Number(selectedOrder.discountAmount).toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-[#1E293B] my-2"></div>
                  <div className="flex justify-between items-end">
                    <span className="text-base font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-blue-400">${Number(selectedOrder.totalAmount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className={`flex flex-col items-center justify-center p-2 rounded cursor-pointer ${
                    selectedOrder.paymentStatus === 'paid' 
                      ? 'bg-[#151E32] border-2 border-blue-500' 
                      : 'bg-[#151E32] border border-[#334155] text-slate-400 hover:bg-[#1E293B]'
                  }`}>
                    <i className={`fa-brands fa-cc-visa text-lg mb-1 ${selectedOrder.paymentStatus === 'paid' ? 'text-blue-500' : ''}`}></i>
                    <span className={`text-[10px] font-medium ${selectedOrder.paymentStatus === 'paid' ? 'font-bold text-blue-500' : ''}`}>Card</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded bg-[#151E32] border border-[#334155] text-slate-400 hover:bg-[#1E293B] cursor-pointer">
                    <i className="fa-solid fa-money-bill text-lg mb-1"></i>
                    <span className="text-[10px] font-medium">Cash</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded bg-[#151E32] border border-[#334155] text-slate-400 hover:bg-[#1E293B] cursor-pointer">
                    <i className="fa-solid fa-ticket text-lg mb-1"></i>
                    <span className="text-[10px] font-medium">Voucher</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 rounded bg-[#151E32] border border-[#334155] text-slate-400 hover:bg-[#1E293B] cursor-pointer">
                    <i className="fa-solid fa-ellipsis text-lg mb-1"></i>
                    <span className="text-[10px] font-medium">Other</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 rounded-xl bg-[#151E32] text-white font-semibold border border-[#334155] hover:bg-[#1E293B] shadow-sm transition-all">
                    <i className="fa-solid fa-print mr-2"></i>Reprint Receipt
                  </button>
                  <button 
                    onClick={() => handleRefund(selectedOrder.id)}
                    className="py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg shadow-red-500/20 transition-all"
                  >
                    <i className="fa-solid fa-rotate-left mr-2"></i>Refund
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
