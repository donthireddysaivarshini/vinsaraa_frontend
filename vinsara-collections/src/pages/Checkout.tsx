import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/pages/CartContext";
import { ChevronDown, Info, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { storeService } from "@/services/api";
import { toast } from "sonner";

const Checkout = () => {
  const { cartItems, cartTotal } = useCart(); // cartTotal here is SUBTOTAL
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [config, setConfig] = useState({
    shipping_flat_rate: 100,
    shipping_free_above: 2000,
    tax_rate_percentage: 18,
  });

  const [discountCode, setDiscountCode] = useState("");
  const [couponData, setCouponData] = useState<any>(null); // To store applied coupon info
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [saveInfo, setSaveInfo] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "Telangana",
    pinCode: "",
    phone: "",
    country: "India"
  });

  // --- FETCH CONFIGURATION (Shipping/Tax) ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await storeService.getSiteConfig();
        // Backend returns strings for decimals, parse them to floats
        setConfig({
          shipping_flat_rate: parseFloat(data.shipping_flat_rate),
          shipping_free_above: parseFloat(data.shipping_free_above),
          tax_rate_percentage: parseFloat(data.tax_rate_percentage),
        });
      } catch (error) {
        console.error("Failed to load site config", error);
        toast.error("Could not load shipping rates");
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // --- CALCULATIONS ---
  const calculations = useMemo(() => {
    // 1. Shipping
    const isFreeShipping = cartTotal >= config.shipping_free_above;
    const shippingCost = isFreeShipping ? 0 : config.shipping_flat_rate;

    // 2. Discount
    let discountAmount = 0;
    if (couponData) {
      discountAmount = couponData.discount; // Backend calculates the exact amount
    }

    // 3. Tax (Calculated on discounted subtotal? usually Tax is on taxable value)
    // Let's assume Tax is on (Subtotal - Discount)
    const taxableAmount = Math.max(0, cartTotal - discountAmount);
    const taxAmount = (taxableAmount * config.tax_rate_percentage) / 100;

    // 4. Final Total
    const finalTotal = taxableAmount + taxAmount + shippingCost;

    return {
      shippingCost,
      isFreeShipping,
      discountAmount,
      taxAmount,
      finalTotal
    };
  }, [cartTotal, config, couponData]);

  // --- HANDLERS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleApplyCoupon = async () => {
    if (!discountCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    
    try {
      setIsValidatingCoupon(true);
      // Validate against backend
      const response = await storeService.validateCoupon(discountCode, cartTotal);
      
      if (response.success) {
        setCouponData(response);
        toast.success(response.message || "Coupon applied!");
      }
    } catch (error: any) {
      setCouponData(null); // Reset if invalid
      const msg = error.error || "Invalid coupon code";
      toast.error(msg);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handlePayment = () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    
    if (!formData.email || !formData.address || !formData.phone) {
        toast.error("Please fill in required fields");
        return;
    }

    // HERE YOU WILL INTEGRATE RAZORPAY LATER
    console.log("Processing Order:", {
      items: cartItems,
      customer: formData,
      totals: calculations,
      coupon: couponData
    });
    
    toast.success("Redirecting to Payment Gateway...");
  };

  if (loadingConfig) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-12">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Back to Home Button */}
        <div className="flex justify-end mb-4 sm:mb-6">
          <Link to="/">
            <button className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium shadow-sm">
              <span>Back to Home</span>
            </button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
          
          {/* Left Side - Form */}
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 order-2 lg:order-1">
            <div className="space-y-6 sm:space-y-8">
              
              {/* Contact Section */}
              <div>
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold">Contact</h2>
                  <Link to="/user">
                    <button type="button" className="text-xs sm:text-sm text-blue-600 hover:underline">
                      Sign in
                    </button>
                  </Link>
                </div>
                
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Delivery Section */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Delivery</h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="relative">
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer"
                    >
                      <option value="India">India</option>
                      {/* Add other countries if needed */}
                    </select>
                    <label className="absolute -top-2 left-2 sm:left-3 px-1 bg-white text-xs text-gray-600">
                      Country/Region
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md"
                      required
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md"
                    required
                  />

                  <input
                    type="text"
                    name="apartment"
                    placeholder="Apartment, suite, etc. (optional)"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md col-span-2 sm:col-span-1"
                      required
                    />
                    <div className="relative">
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-2 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-base border border-gray-300 rounded-md bg-white cursor-pointer"
                      >
                         <option value="Andhra Pradesh">Andhra Pradesh</option>
                         <option value="Telangana">Telangana</option>
                         <option value="Karnataka">Karnataka</option>
                         <option value="Tamil Nadu">Tamil Nadu</option>
                         <option value="Maharashtra">Maharashtra</option>
                         <option value="Delhi">Delhi</option>
                         {/* Add rest of states */}
                      </select>
                    </div>
                    <input
                      type="text"
                      name="pinCode"
                      placeholder="PIN code"
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <label className="flex items-start sm:items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveInfo}
                      onChange={(e) => setSaveInfo(e.target.checked)}
                      className="w-4 h-4 mt-0.5 sm:mt-0 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-xs sm:text-sm text-gray-600">Save this information for next time</span>
                  </label>
                </div>
              </div>

              {/* Payment Info Box */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">Payment</h2>
                <div className="border border-gray-300 rounded-md">
                  <div className="p-3 sm:p-4 bg-blue-50 border-b border-gray-300 flex justify-between items-center">
                    <span className="text-sm font-medium">Razorpay Secure</span>
                    {/* Add Icons here if needed */}
                  </div>
                  <div className="p-4 text-center bg-white text-sm text-gray-600">
                    After clicking "Pay now", you will be redirected to Razorpay.
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePayment}
                className="w-full bg-gray-900 text-white py-3 sm:py-4 rounded-md font-medium hover:bg-gray-800 transition-colors text-base sm:text-lg"
              >
                Pay now
              </button>
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:sticky lg:top-32 h-fit order-1 lg:order-2">
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 space-y-4 sm:space-y-6">
              
              {/* Cart Items List */}
              <div className="space-y-3 sm:space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-3 sm:gap-4">
                    <div className="relative">
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-md border border-gray-200"
                      />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.size}</p>
                    </div>
                    <p className="text-sm font-semibold whitespace-nowrap">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Discount Code Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={couponData !== null} // Disable if applied
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <button 
                  type="button"
                  onClick={couponData ? () => { setCouponData(null); setDiscountCode(""); } : handleApplyCoupon}
                  disabled={isValidatingCoupon}
                  className={`px-4 py-2 text-sm rounded-md font-medium transition-colors whitespace-nowrap ${
                    couponData 
                    ? "bg-red-100 text-red-700 hover:bg-red-200" 
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {isValidatingCoupon ? <Loader2 className="w-4 h-4 animate-spin"/> : (couponData ? "Remove" : "Apply")}
                </button>
              </div>
              
              {/* Coupon Success Message */}
              {couponData && (
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded flex items-center justify-between">
                      <span>Coupon '{couponData.code}' applied!</span>
                      <span>- {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(calculations.discountAmount)}</span>
                  </div>
              )}

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(cartTotal)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-1">
                    <span>Shipping</span>
                    {calculations.isFreeShipping && <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">FREE</span>}
                  </div>
                  <span className="text-gray-600">
                    {calculations.isFreeShipping ? "₹0.00" : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(calculations.shippingCost)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>GST ({config.tax_rate_percentage}%)</span>
                  <span className="text-gray-600">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(calculations.taxAmount)}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold">Total</span>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 mr-2">INR</span>
                    <span className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(calculations.finalTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;