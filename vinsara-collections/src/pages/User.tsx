import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom"; 
import { 
  Package, MapPin, LogOut, ArrowLeft, Loader2, ChevronDown, 
  ChevronLeft, ChevronRight, Truck, CheckCircle, Clock, AlertCircle, 
  Trash2, Star, Plus 
} from "lucide-react";
import { toast } from "sonner";
import { orderService, authService } from "@/services/api";

// --- INTERFACES ---
interface OrderItem {
  id: number;
  product_id: number;
  product_slug?: string; 
  product_name: string;
  variant_label: string;
  price: string;
  quantity: number;
}

interface Order {
  id: number;
  total_amount: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  shipping_address: string;
  phone: string;
  items: OrderItem[];
}

interface SavedAddress {
  id: number;
  label: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  first_name?: string;
  last_name?: string;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  
  // --- ORDER STATE ---
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 20;

  // --- ADDRESS STATE ---
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);
  
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    first_name: '',
    last_name: '',
    address: '',
    apartment: '',
    city: '',
    state: 'Telangana',
    zip_code: '',
    country: 'India',
    phone: '',
    is_default: false,
  });

  // --- 1. AUTH CHECK (Redirect immediately if no token) ---
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // --- 2. CHECK ADMIN ROLE (Only if token exists) ---
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return; // 🛑 STOP here if no token

    const checkUserRole = async () => {
      try {
        const user = await authService.getProfile();
        if (user.is_staff || user.is_superuser) {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error("Failed to check user role", e);
      }
    };
    checkUserRole();
  }, []);

  // --- 3. FETCH DATA BASED ON TAB (Only if token exists) ---
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (!token) return; // 🛑 STOP here if no token

    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [activeTab]);

  // --- ORDER FUNCTIONS ---
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await orderService.getUserOrders();
      const ordersList = Array.isArray(data) ? data : data.results || [];
      setAllOrders(ordersList);
      setCurrentPage(1); 
    } catch (error: any) {
      console.error("Failed to load orders", error);
      // Only show error toast if NOT 401 (handled by interceptor)
      if (error?.response?.status !== 401) {
        toast.error("Could not load orders");
      }
      setAllOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success("Order status updated");
      setAllOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, order_status: newStatus } : order
        )
      );
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  // --- ADDRESS FUNCTIONS ---
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await authService.getSavedAddresses();
      const list = Array.isArray(data) ? data : data.results || [];
      setAddresses(list);
    } catch (err: any) {
      console.error("Failed to fetch addresses", err);
      if (err?.response?.status !== 401) {
        toast.error("Could not load saved addresses");
      }
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleAddressInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAddAddress = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (addresses.length >= 3) {
      toast.error("You can save up to 3 addresses only.");
      return;
    }
    // Validation
    if (!newAddress.address || !newAddress.city || !newAddress.zip_code || !newAddress.phone) {
      toast.error("Please fill required fields.");
      return;
    }

    try {
      setSubmittingAddress(true);
      await authService.saveAddress(newAddress);
      toast.success("Address saved");
      setShowAddForm(false);
      // Reset form
      setNewAddress({
        label: 'Home',
        first_name: '', last_name: '', 
        address: '', apartment: '', 
        city: '', state: 'Telangana', 
        zip_code: '', country: 'India', 
        phone: '', is_default: false,
      });
      fetchAddresses();
    } catch (err: any) {
      console.error("Save address error", err);
      toast.error(err?.response?.data?.[0] || "Failed to save address");
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await authService.deleteAddress(id);
      toast.success("Address deleted");
      fetchAddresses();
    } catch (err: any) {
      console.error("Delete address error", err);
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await authService.setDefaultAddress(id);
      toast.success("Default address updated");
      fetchAddresses();
    } catch (err: any) {
      console.error("Set default error", err);
      toast.error("Failed to set default");
    }
  };

  // --- SHARED UTILS ---
  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem('cart');
    toast.success("Logged out successfully");
    navigate("/login"); 
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return dateString; }
  };

  const filteredOrders = isAdmin 
    ? allOrders 
    : allOrders.filter(order => order.payment_status === 'Paid');

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    const pageNum = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Delivered': return { icon: <CheckCircle className="w-5 h-5" />, colorClass: 'bg-green-100 text-green-700 border-green-200', label: 'Delivered' };
      case 'Shipped': return { icon: <Truck className="w-5 h-5" />, colorClass: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Shipped' };
      case 'Processing': return { icon: <Clock className="w-5 h-5" />, colorClass: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Processing' };
      case 'Cancelled': return { icon: <AlertCircle className="w-5 h-5" />, colorClass: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' };
      default: return { icon: <Package className="w-5 h-5" />, colorClass: 'bg-gray-100 text-gray-700 border-gray-200', label: status };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        
        {/* Back Button */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-500 hover:text-black mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b pb-6">
          <div>
            <h1 className="text-3xl font-serif text-gray-900">My Account</h1>
            <p className="text-gray-500 mt-1">Manage your orders and details</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium mt-4 md:mt-0">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
          {/* Sidebar Navigation */}
          <div className="bg-white p-4 rounded-xl shadow-sm h-fit">
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left mb-2 transition-all ${activeTab === 'orders' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <Package className="w-5 h-5" /> Orders
            </button>
            <button 
              onClick={() => setActiveTab('addresses')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === 'addresses' ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <MapPin className="w-5 h-5" /> Addresses
            </button>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            
            {/* --- ORDERS TAB --- */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Order History</h2>
                  {filteredOrders.length > 0 && (
                    <span className="text-sm text-gray-500">
                      Showing {startIndex + 1}–{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
                    </span>
                  )}
                </div>
                    
                {loadingOrders ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : paginatedOrders.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                    <p className="text-gray-500">No orders found.</p>
                    <button onClick={() => navigate("/all-products")} className="text-black underline mt-2 font-medium hover:no-underline">
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {paginatedOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.order_status);
                        return (
                          <div key={order.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            
                            {/* Order Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap gap-y-4 justify-between items-center text-sm">
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-medium">Order Placed</p>
                                        <p className="text-gray-900 font-medium">{formatDate(order.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-medium">Total</p>
                                        <p className="text-gray-900 font-medium">
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(order.total_amount))}
                                        </p>
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-xs text-gray-500 uppercase font-medium">Ship To</p>
                                        <div className="relative group cursor-help">
                                            <p className="text-blue-600 truncate max-w-[150px]">View Address</p>
                                            <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded z-10 w-48 shadow-lg whitespace-pre-wrap">
                                                {order.shipping_address}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-end gap-2 text-xs font-medium">
                                        {order.payment_status === 'Paid' ? (
                                            <span className="text-green-600">Payment Paid</span>
                                        ) : (
                                            <span className="text-orange-600">Payment Pending</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Order Body */}
                            <div className="p-6 cursor-pointer" onClick={(e) => {
                                if ((e.target as HTMLElement).tagName === 'SELECT') return;
                                setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
                              }}>
                              <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="space-y-4">
                                        {order.items.slice(0, expandedOrderId === order.id ? undefined : 2).map((item, idx) => {
                                            const finalSlug = item.product_slug 
                                                ? item.product_slug 
                                                : item.product_name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                                            return (
                                              <div key={idx} className="flex gap-4 items-start group">
                                                  <div className="pt-1">
                                                      <Link 
                                                          to={`/product/${finalSlug}`} 
                                                          className="font-serif text-xl md:text-2xl font-medium text-gray-900 hover:text-black hover:underline transition-colors block leading-tight"
                                                          onClick={(e) => e.stopPropagation()}
                                                      >
                                                          {item.product_name}
                                                      </Link>
                                                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                                                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700 border border-gray-200">{item.variant_label}</span>
                                                          <span>Qty: {item.quantity}</span>
                                                      </div>
                                                      <p className="text-sm font-medium text-gray-900 mt-2">
                                                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(parseFloat(item.price))}
                                                      </p>
                                                  </div>
                                              </div>
                                            );
                                        })}
                                        {order.items.length > 2 && expandedOrderId !== order.id && (
                                            <p className="text-sm text-gray-500 mt-2">+ {order.items.length - 2} more items...</p>
                                        )}
                                    </div>
                                </div>

                                <div className="md:w-1/3 flex flex-col items-start md:items-end justify-center gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig.colorClass}`}>
                                        {statusConfig.icon}
                                        <span className="font-semibold text-sm">{statusConfig.label}</span>
                                    </div>
                                    {isAdmin && (
                                        <div className="w-full">
                                            <label className="text-xs text-gray-500 font-medium block mb-1">Update Status (Admin)</label>
                                            <select
                                                value={order.order_status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full border border-gray-300 rounded-md text-sm py-1.5 px-2 bg-white hover:border-black cursor-pointer focus:ring-1 focus:ring-black focus:outline-none"
                                            >
                                                <option value="Processing">Processing</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline mt-2">
                                        {expandedOrderId === order.id ? 'Hide Details' : 'View Order Details'}
                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedOrderId === order.id && (
                              <div className="border-t border-gray-200 bg-gray-50 p-6 animate-in slide-in-from-top-2 duration-200">
                                <div>
                                    <h4 className="font-semibold mb-4 text-sm flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Shipping Details
                                    </h4>
                                    <div className="bg-white p-4 rounded-md border border-gray-200 text-sm shadow-sm max-w-lg">
                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{order.shipping_address}</p>
                                        <p className="text-gray-500 mt-3 pt-3 border-t border-gray-100">Phone: <span className="text-gray-900 font-medium">{order.phone}</span></p>
                                    </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8 p-4 bg-white rounded-lg border border-gray-200">
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages)
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && <span className="px-2">...</span>}
                                <button onClick={() => goToPage(page)} className={`px-3 py-1 rounded transition-colors ${currentPage === page ? 'bg-black text-white font-semibold' : 'hover:bg-gray-100'}`}>
                                  {page}
                                </button>
                              </React.Fragment>
                            ))}
                        </div>
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* --- ADDRESSES TAB --- */}
            {activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Saved Addresses</h2>
                  {/* Show Add Button only if less than 3 addresses */}
                  {addresses.length < 3 && !showAddForm && (
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add New Address
                    </button>
                  )}
                </div>

                {loadingAddresses ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    {/* ADD ADDRESS FORM */}
                    {showAddForm && (
                      <form onSubmit={handleAddAddress} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2">
                        <h3 className="font-semibold mb-4">Add New Address</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input name="first_name" value={newAddress.first_name} onChange={handleAddressInput} placeholder="First name" className="px-3 py-2 border rounded" />
                          <input name="last_name" value={newAddress.last_name} onChange={handleAddressInput} placeholder="Last name" className="px-3 py-2 border rounded" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          <input name="label" placeholder="Label (e.g. Home, Office)" value={newAddress.label} onChange={handleAddressInput} className="p-2 border rounded" required />
                          <input name="phone" placeholder="Phone Number" value={newAddress.phone} onChange={handleAddressInput} className="p-2 border rounded" required />
                          <input name="address" placeholder="Address" value={newAddress.address} onChange={handleAddressInput} className="md:col-span-2 p-2 border rounded" required />
                          <input name="apartment" placeholder="Apartment (Optional)" value={newAddress.apartment} onChange={handleAddressInput} className="md:col-span-2 p-2 border rounded" />
                          <input name="city" placeholder="City" value={newAddress.city} onChange={handleAddressInput} className="p-2 border rounded" required />
                          <input name="zip_code" placeholder="Pin Code" value={newAddress.zip_code} onChange={handleAddressInput} className="p-2 border rounded" required />
                          <select name="state" value={newAddress.state} onChange={handleAddressInput} className="p-2 border rounded bg-white">
                            <option value="Telangana">Telangana</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Delhi">Delhi</option>
                          </select>
                          <input name="country" placeholder="Country" value={newAddress.country} onChange={handleAddressInput} className="p-2 border rounded bg-gray-100" readOnly />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <input type="checkbox" checked={newAddress.is_default} name="is_default" onChange={handleAddressInput} className="w-4 h-4" />
                          <label className="text-sm">Set as default address</label>
                        </div>
                        <div className="flex gap-3 mt-6">
                          <button type="submit" disabled={submittingAddress} className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 disabled:opacity-50">
                            {submittingAddress ? 'Saving...' : 'Save Address'}
                          </button>
                          <button type="button" onClick={() => setShowAddForm(false)} className="bg-white border px-4 py-2 rounded text-sm hover:bg-gray-50">Cancel</button>
                        </div>
                      </form>
                    )}

                    {/* ADDRESS LIST */}
                    {addresses.length === 0 && !showAddForm ? (
                      <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                        <p className="text-gray-500">No addresses saved.</p>
                        <button onClick={() => setShowAddForm(true)} className="text-black underline mt-2 font-medium">Add one now</button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {addresses.map((addr) => (
                          <div key={addr.id} className={`relative p-5 rounded-lg border transition-all ${addr.is_default ? "border-black bg-gray-50 shadow-sm" : "border-gray-200 bg-white"}`}>
                            {addr.is_default && (
                              <span className="absolute top-0 right-0 bg-black text-white text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg rounded-tr-sm">
                                Default
                              </span>
                            )}
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                              <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                                  {addr.label}
                                </h3>
                                <p className="text-sm text-gray-700 mt-2">{addr.address}</p>
                                {addr.apartment && <p className="text-sm text-gray-700">{addr.apartment}</p>}
                                <p className="text-sm text-gray-600 mt-1">{addr.city}, {addr.state} - {addr.zip_code}</p>
                                <p className="text-sm text-gray-600 mt-1">Phone: <span className="font-medium text-gray-900">{addr.phone}</span></p>
                              </div>
                              
                              <div className="flex gap-3">
                                {/* SET DEFAULT BUTTON */}
                                {!addr.is_default && (
                                  <button 
                                    onClick={() => handleSetDefault(addr.id)}
                                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline border border-blue-200 px-3 py-1.5 rounded-md transition-colors"
                                  >
                                    <Star className="w-3 h-3" /> Set Default
                                  </button>
                                )}
                                
                                {/* DELETE BUTTON */}
                                <button 
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 hover:underline border border-red-200 px-3 py-1.5 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" /> Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;