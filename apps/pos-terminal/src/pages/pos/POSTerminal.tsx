import React, { useEffect, useState } from 'react';
import { apiClient } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import './POSTerminal.css';
import logoImg from '../../assets/bizadminfav.jpeg';

interface Category {
  id: string;
  name: string;
  displayName: string;
  colorHex?: string;
}

interface Subcategory {
  id: string;
  name: string;
  displayName: string;
  parentId: string;
}

interface Product {
  id: string;
  name: string;
  displayName: string;
  basePrice: any;
  categoryId: string;
  subcategoryId?: string;
}

interface ModifierGroup {
  id: string;
  name: string;
  displayName: string;
  selectionType: string;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
}

interface Modifier {
  id: string;
  name: string;
  displayName: string;
  priceChange: any;
  isDefault: boolean;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedModifiers: Modifier[];
  selectedOptions: { [key: string]: string };
  notes?: string;
  isCombo?: boolean;
}

interface Combo {
  id: string;
  name: string;
  displayName: string;
  price: number;
  regularPrice?: number;
  savings?: number;
  description?: string;
  comboItems?: ComboItem[];
}

interface ComboItem {
  id: string;
  product: Product;
  quantity: number;
}

type OrderType = 'dine-in' | 'home-delivery' | 'take-away';
type ViewMode = 'products' | 'product-detail' | 'combos';

const POSTerminal: React.FC = () => {
  const { logout } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifiers, setModifiers] = useState<{ [groupId: string]: Modifier[] }>({});
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [productQuantity, setProductQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [selectedTable, setSelectedTable] = useState('4');
  const [discountInput, setDiscountInput] = useState('');
  const [_phoneNumber, _setPhoneNumber] = useState('');
  const [_customerName, _setCustomerName] = useState('');
  
  const [orderNumber] = useState(`#${Math.floor(Math.random() * 90000) + 10000}`);
  const [customerDisplay] = useState(`Customer${Math.floor(Math.random() * 9000) + 1000}`);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Cash Payment Modal
  const [showCashModal, setShowCashModal] = useState(false);
  const [amountReceived, setAmountReceived] = useState('');

  const categoryIcons: { [key: string]: string } = {
    'burger': 'fa-burger', 'burgers': 'fa-burger',
    'noodles': 'fa-bowl-food', 'noodle': 'fa-bowl-food',
    'drinks': 'fa-mug-hot', 'drink': 'fa-mug-hot', 'beverages': 'fa-mug-hot',
    'desserts': 'fa-ice-cream', 'dessert': 'fa-ice-cream',
    'pizza': 'fa-pizza-slice', 'pizzas': 'fa-pizza-slice',
    'chicken': 'fa-drumstick-bite',
    'espresso': 'fa-mug-hot', 'coffee': 'fa-mug-hot', 'coffees': 'fa-mug-hot',
    'margherita': 'fa-pizza-slice',
    'default': 'fa-utensils'
  };

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadSubcategories();
    loadCombos();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      // Filter to only show parent categories (those with null parentId)
      const parentCats = response.data
        .filter((cat: any) => cat.parentId === null || cat.parentId === undefined)
        .map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          displayName: cat.displayName || cat.name,
          colorHex: cat.colorHex,
        }));
      setCategories(parentCats);
      if (parentCats.length > 0) setSelectedCategory(parentCats[0].id);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSubcategories = async () => {
    try {
      // Get all categories and filter to only subcategories (those with parentId)
      const response = await apiClient.get('/categories');
      const subs = response.data
        .filter((cat: any) => cat.parentId !== null && cat.parentId !== undefined)
        .map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          displayName: cat.displayName || cat.name,
          parentId: cat.parentId,
        }));
      setSubcategories(subs);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadCombos = async () => {
    try {
      const response = await apiClient.get('/combos');
      setCombos(response.data);
    } catch (error) {
      console.error('Error loading combos:', error);
    }
  };

  const handleProductClick = async (product: Product) => {
    console.log('handleProductClick called for product:', product.id, product.name);
    try {
      console.log('Fetching modifiers from:', `/modifiers/products/${product.id}/groups`);
      const response = await apiClient.get(`/modifiers/products/${product.id}/groups`);
      console.log('Modifiers API response:', response.data);
      
      setSelectedProduct(product);
      setProductQuantity(1);
      setSpecialInstructions('');
      setSelectedOptions({});
      
      if (response.data && response.data.length > 0) {
        // Transform API response: extract modifierGroup from each ProductModifierGroup
        const groups = response.data.map((pmg: any) => ({
          ...pmg.modifierGroup,
          isRequired: pmg.isRequired,
          sortOrder: pmg.sortOrder,
        }));
        console.log('Transformed modifier groups:', groups);
        setModifierGroups(groups);
        
        const mods: { [key: string]: Modifier[] } = {};
        const defaultMods: Modifier[] = [];
        groups.forEach((group: ModifierGroup & { modifiers: Modifier[] }) => {
          mods[group.id] = group.modifiers || [];
          group.modifiers?.forEach((mod: Modifier) => { if (mod.isDefault) defaultMods.push(mod); });
        });
        console.log('Modifiers by group:', mods);
        setModifiers(mods);
        setSelectedModifiers(defaultMods);
      } else {
        console.log('No modifier groups found for product');
        setModifierGroups([]);
        setModifiers({});
        setSelectedModifiers([]);
      }
      setViewMode('product-detail');
    } catch (error) {
      console.error('Error fetching modifiers:', error);
      setModifierGroups([]);
      setModifiers({});
      setSelectedModifiers([]);
      setViewMode('product-detail');
    }
  };

  const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
    if (group.selectionType?.toLowerCase() === 'single') {
      const filtered = selectedModifiers.filter((m) => !modifiers[group.id]?.some((gm) => gm.id === m.id));
      setSelectedModifiers([...filtered, modifier]);
    } else {
      const isSelected = selectedModifiers.some((m) => m.id === modifier.id);
      if (isSelected) setSelectedModifiers(selectedModifiers.filter((m) => m.id !== modifier.id));
      else setSelectedModifiers([...selectedModifiers, modifier]);
    }
  };

  const addToCart = () => {
    if (selectedProduct) {
      const newItem: CartItem = {
        id: `${selectedProduct.id}-${Date.now()}`,
        product: selectedProduct,
        quantity: productQuantity,
        selectedModifiers,
        selectedOptions,
        notes: specialInstructions || undefined
      };
      setCart([...cart, newItem]);
      cancelProductDetail();
    }
  };

  const addComboToCart = (combo: Combo) => {
    const comboAsProduct: Product = {
      id: combo.id,
      name: combo.name,
      displayName: combo.displayName,
      basePrice: combo.price,
      categoryId: '',
    };
    const newItem: CartItem = {
      id: `combo-${combo.id}-${Date.now()}`,
      product: comboAsProduct,
      quantity: 1,
      selectedModifiers: [],
      selectedOptions: {},
      isCombo: true,
    };
    setCart([...cart, newItem]);
  };

  const cancelProductDetail = () => {
    setViewMode('products');
    setSelectedProduct(null);
    setSelectedModifiers([]);
    setSelectedOptions({});
    setSpecialInstructions('');
    setProductQuantity(1);
  };

  const updateCartItemQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(item => item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const removeFromCart = (itemId: string) => setCart(cart.filter(item => item.id !== itemId));

  const calculateItemPrice = (item: CartItem): number => {
    let price = Number(item.product.basePrice);
    item.selectedModifiers.forEach((mod) => { price += Number(mod.priceChange); });
    return price * item.quantity;
  };

  const getSubtotal = (): number => cart.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  const getDiscount = (): number => {
    if (discountInput) {
      const percent = parseFloat(discountInput);
      if (!isNaN(percent) && percent > 0 && percent <= 100) return getSubtotal() * (percent / 100);
    }
    return 0;
  };
  const getServiceCharge = (): number => 5.00;
  const getTax = (): number => (getSubtotal() - getDiscount()) * 0.1;
  const getTotal = (): number => getSubtotal() - getDiscount() + getServiceCharge() + getTax();

  const getProductPrice = (): number => {
    if (!selectedProduct) return 0;
    let price = Number(selectedProduct.basePrice);
    selectedModifiers.forEach((mod) => { price += Number(mod.priceChange); });
    return price * productQuantity;
  };

  const filteredProducts = products.filter((product) => {
    // Get all subcategory IDs for the selected parent category
    const childCategoryIds = subcategories.filter(sub => sub.parentId === selectedCategory).map(sub => sub.id);
    
    // Match if product belongs to parent category OR any of its subcategories
    const matchesCategory = !selectedCategory || 
      product.categoryId === selectedCategory || 
      childCategoryIds.includes(product.categoryId);
    
    // If subcategory is selected, filter by that specific subcategory
    const matchesSubcategory = !selectedSubcategory || product.categoryId === selectedSubcategory;
    
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  const filteredSubcategories = subcategories.filter(sub => sub.parentId === selectedCategory);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const getCategoryIcon = (categoryName: string): string => categoryIcons[categoryName.toLowerCase()] || categoryIcons['default'];
  const getModifiersDisplay = (item: CartItem): string => {
    const parts: string[] = [...item.selectedModifiers.map(mod => mod.displayName)];
    Object.values(item.selectedOptions).forEach(value => parts.push(value));
    return parts.join(', ');
  };

  return (
    <div className="pos-container">
      {/* Left Sidebar */}
      <aside className="pos-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><img src={logoImg} alt="Logo" /></div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item"><i className="fa-solid fa-home"></i><span>Home</span></a>
          <a href="#" className="nav-item active"><i className="fa-solid fa-utensils"></i><span>Menu</span></a>
          <a href="#" className="nav-item"><i className="fa-solid fa-credit-card"></i><span>Payments</span></a>
          <a href="#" className="nav-item"><i className="fa-solid fa-receipt"></i><span>Receipts</span></a>
          <a href="#" className="nav-item"><i className="fa-solid fa-truck"></i><span>Delivery</span></a>
          <a href="#" className="nav-item"><i className="fa-solid fa-cog"></i><span>Back Office</span></a>
        </nav>
        <button onClick={logout} className="logout-btn"><i className="fa-solid fa-arrow-left"></i></button>
      </aside>

      {/* Main Content */}
      <main className="pos-main">
        {/* Top Header */}
        <header className="pos-header">
          <div className="header-left">
            <div className="brand">
              <div className="brand-icon"><img src={logoImg} alt="Logo" /></div>
              <div className="brand-text">
                <span className="brand-name">BIZPOS</span>
              </div>
            </div>
            <div className="header-time">
              <i className="fa-regular fa-clock"></i>
              <span>{formatTime(currentTime)} {formatDate(currentTime)}</span>
            </div>
          </div>
          <div className="header-search">
            <i className="fa-solid fa-search search-icon"></i>
            <input type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="header-right">
            <div className="header-info"><span className="info-label">Customer</span><span className="info-value">{customerDisplay}</span></div>
            <button className="header-btn notification"><i className="fa-solid fa-bell"></i><span className="badge"></span></button>
            <button onClick={logout} className="header-btn logout"><i className="fa-solid fa-power-off"></i></button>
          </div>
        </header>

        {/* Content Area */}
        <div className="pos-content">
          {(viewMode === 'products' || viewMode === 'combos') ? (
            <section className="products-section">
              {/* Order Type Bar */}
              <div className="order-bar">
                <div className="order-bar-left">
                  <h2>Choose Items</h2>
                  <button className="icon-btn"><i className="fa-regular fa-heart"></i></button>
                  <button className="icon-btn"><i className="fa-regular fa-comment"></i></button>
                  <button className="icon-btn"><i className="fa-solid fa-ellipsis"></i></button>
                </div>
                <div className="order-bar-right">
                  <button className={`order-type-btn ${orderType === 'dine-in' ? 'active' : ''}`} onClick={() => setOrderType('dine-in')}>Dine In</button>
                  <button className={`order-type-btn ${orderType === 'home-delivery' ? 'active' : ''}`} onClick={() => setOrderType('home-delivery')}>Home Delivery</button>
                  <button className={`order-type-btn ${orderType === 'take-away' ? 'active' : ''}`} onClick={() => setOrderType('take-away')}>Take Away</button>
                  <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="table-select">
                    {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Table {n}</option>)}
                  </select>
                </div>
              </div>

              {/* Products/Combos Toggle */}
              <div className="menu-tabs">
                <button className={`menu-tab ${viewMode === 'products' ? 'active' : ''}`} onClick={() => setViewMode('products')}>
                  <i className="fa-solid fa-utensils"></i> Products
                </button>
                <button className={`menu-tab ${viewMode === 'combos' ? 'active' : ''}`} onClick={() => setViewMode('combos')}>
                  <i className="fa-solid fa-layer-group"></i> Combos ({combos.length})
                </button>
              </div>

              {viewMode === 'products' && (
                <>
                  {/* Category Bar */}
                  <div className="category-bar">
                    {categories.map((cat) => (
                      <button 
                        key={cat.id} 
                        className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(''); }}
                        style={cat.colorHex ? {
                          '--category-color': cat.colorHex,
                          '--category-color-light': `${cat.colorHex}20`,
                          backgroundColor: selectedCategory === cat.id ? cat.colorHex : `${cat.colorHex}15`,
                          borderColor: cat.colorHex,
                          color: selectedCategory === cat.id ? '#fff' : cat.colorHex
                        } as React.CSSProperties : undefined}
                      >
                        <i className={`fa-solid ${getCategoryIcon(cat.name)}`}></i>
                        <span>{cat.displayName}</span>
                      </button>
                    ))}
                  </div>

                  {/* Subcategory Bar */}
                  {filteredSubcategories.length > 0 && (
                    <div className="subcategory-bar">
                      <button className={`subcategory-btn ${selectedSubcategory === '' ? 'active' : ''}`} onClick={() => setSelectedSubcategory('')}>All</button>
                      {filteredSubcategories.map((sub) => (
                        <button key={sub.id} className={`subcategory-btn ${selectedSubcategory === sub.id ? 'active' : ''}`} onClick={() => setSelectedSubcategory(sub.id)}>{sub.displayName}</button>
                      ))}
                    </div>
                  )}

                  {/* Product Grid */}
                  <div className="product-grid">
                    {filteredProducts.map((product) => (
                      <button key={product.id} className="product-card" onClick={() => handleProductClick(product)}>
                        <div className="product-name">{product.displayName}</div>
                        <div className="product-price">${Number(product.basePrice).toFixed(0)}</div>
                        <div className="product-count">{Math.floor(Math.random() * 15) + 5} Items</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {viewMode === 'combos' && (
                <div className="product-grid">
                  {combos.length === 0 ? (
                    <div className="no-combos-msg">
                      <i className="fa-solid fa-layer-group"></i>
                      <p>No combos available</p>
                    </div>
                  ) : (
                    combos.map((combo) => (
                      <button key={combo.id} className="product-card combo-card" onClick={() => addComboToCart(combo)}>
                        <div className="combo-badge">COMBO</div>
                        <div className="product-name">{combo.displayName}</div>
                        <div className="product-price">${Number(combo.price).toFixed(0)}</div>
                        {combo.description && <div className="product-count">{combo.description}</div>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </section>
          ) : (
            /* Product Detail Screen */
            <section className="product-detail-section">
              <div className="detail-header">
                <h2>{selectedProduct?.displayName}</h2>
                <button onClick={cancelProductDetail} className="close-btn"><i className="fa-solid fa-times"></i></button>
              </div>

              {/* Dynamic Modifier Groups - Single Selection (Radio) */}
              {modifierGroups.filter(g => g.selectionType?.toLowerCase() === 'single').map((group) => (
                <div key={group.id} className="detail-group">
                  <h3>{group.displayName || group.name}{group.isRequired && <span className="required-badge">Required</span>}</h3>
                  <div className="options-list">
                    {(modifiers[group.id] || []).map((modifier) => (
                      <label key={modifier.id} className="option-item">
                        <input type="radio" name={`opt-${group.id}`} checked={selectedModifiers.some(m => m.id === modifier.id)} onChange={() => handleModifierToggle(group, modifier)} />
                        <span className="option-name">{modifier.displayName || modifier.name}</span>
                        <span className="option-price">{Number(modifier.priceChange) > 0 ? `+$${Number(modifier.priceChange).toFixed(0)}` : 'Free'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Dynamic Modifier Groups - Multiple Selection (Checkbox) */}
              {modifierGroups.filter(g => g.selectionType?.toLowerCase() === 'multiple').map((group) => (
                <div key={group.id} className="detail-group">
                  <h3>{group.displayName || group.name}{group.minSelections > 0 && <span className="required-badge">Min {group.minSelections}</span>}</h3>
                  <div className="addons-list">
                    {(modifiers[group.id] || []).map((modifier) => (
                      <label key={modifier.id} className="addon-item">
                        <input type="checkbox" checked={selectedModifiers.some(m => m.id === modifier.id)} onChange={() => handleModifierToggle(group, modifier)} />
                        <span className="addon-name">{modifier.displayName || modifier.name}</span>
                        <span className="addon-price">{Number(modifier.priceChange) > 0 ? `+$${Number(modifier.priceChange).toFixed(0)}` : 'Free'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Show message if no modifiers */}
              {modifierGroups.length === 0 && (
                <div className="detail-group">
                  <p className="no-options-msg">No customization options available for this item.</p>
                </div>
              )}

              <div className="detail-group">
                <h3>Special Instructions</h3>
                <textarea placeholder="E.g., No onions, well done, allergies..." value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)}></textarea>
              </div>

              <div className="detail-footer">
                <div className="quantity-section">
                  <span>Quantity</span>
                  <div className="quantity-controls">
                    <button onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}><i className="fa-solid fa-minus"></i></button>
                    <span className="qty-value">{productQuantity}</span>
                    <button onClick={() => setProductQuantity(productQuantity + 1)}><i className="fa-solid fa-plus"></i></button>
                  </div>
                </div>
                <div className="detail-total">
                  <span>Total</span>
                  <span className="total-price">${getProductPrice().toFixed(0)}</span>
                </div>
              </div>

              <div className="detail-actions">
                <button className="cancel-btn" onClick={cancelProductDetail}>Cancel</button>
                <button className="add-btn" onClick={addToCart}>Add to Order</button>
              </div>
            </section>
          )}

          {/* Cart Panel */}
          <aside className="cart-panel">
            {/* Compact Top Bar */}
            <div className="cart-top-bar">
              <div className="top-bar-left">
                <i className="fa-solid fa-wifi status-icon"></i>
                <span className="bill-num">#{orderNumber}</span>
              </div>
              <div className="top-bar-right">
                <span className="user-label">John</span>
                <button className="hold-btn"><i className="fa-solid fa-pause"></i></button>
                <button className="draft-btn"><i className="fa-solid fa-save"></i></button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty"><i className="fa-solid fa-shopping-cart"></i><p>No items in cart</p></div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <div className="item-header">
                        <div className="item-name">{item.product.displayName}</div>
                        <button onClick={() => removeFromCart(item.id)} className="delete-btn"><i className="fa-solid fa-trash"></i></button>
                      </div>
                      {(item.selectedModifiers.length > 0 || Object.keys(item.selectedOptions).length > 0) && <div className="item-mods">{getModifiersDisplay(item)}</div>}
                      {item.notes && <div className="item-notes">"{item.notes}"</div>}
                      <div className="item-bottom">
                        <div className="item-qty-controls">
                          <button onClick={() => updateCartItemQuantity(item.id, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateCartItemQuantity(item.id, 1)}>+</button>
                        </div>
                        <div className="item-price">${calculateItemPrice(item).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount Row */}
            <div className="cart-discount-row">
              <span className="discount-label"><i className="fa-solid fa-percent"></i> Discount</span>
              <input type="text" placeholder="0%" value={discountInput} onChange={(e) => setDiscountInput(e.target.value)} className="discount-input" />
            </div>

            {/* Totals */}
            <div className="cart-totals">
              <div className="total-row"><span>Tax</span><span>${getTax().toFixed(2)}</span></div>
              <div className="total-row grand"><span>Total</span><span>${getTotal().toFixed(2)}</span></div>
            </div>

            {/* Payment Buttons */}
            <div className="cart-payment-actions">
              <button className="pay-btn cash" onClick={() => { setShowCashModal(true); setAmountReceived(''); }}><i className="fa-solid fa-money-bill"></i> Cash</button>
              <button className="pay-btn card"><i className="fa-solid fa-credit-card"></i> Card</button>
              <button className="pay-btn split"><i className="fa-solid fa-divide"></i> Split</button>
            </div>
          </aside>
        </div>
      </main>

      {/* Cash Payment Modal */}
      {showCashModal && (
        <div className="modal-overlay" onClick={() => setShowCashModal(false)}>
          <div className="cash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cash Payment</h2>
              <button className="modal-close" onClick={() => setShowCashModal(false)}><i className="fa-solid fa-times"></i></button>
            </div>
            
            <div className="modal-total-row">
              <span>Total Amount</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
            
            <div className="modal-input-group">
              <label>Amount Received</label>
              <input 
                type="number" 
                value={amountReceived} 
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
            
            <div className="modal-change-row">
              <span>Change</span>
              <span>${Math.max(0, (parseFloat(amountReceived) || 0) - getTotal()).toFixed(2)}</span>
            </div>
            
            <div className="quick-amounts">
              <button className="quick-amount-btn" onClick={() => setAmountReceived('20')}>$20</button>
              <button className="quick-amount-btn" onClick={() => setAmountReceived('50')}>$50</button>
              <button className="quick-amount-btn" onClick={() => setAmountReceived('100')}>$100</button>
            </div>
            
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowCashModal(false)}>Cancel</button>
              <button 
                className="modal-confirm-btn" 
                onClick={() => {
                  // TODO: Process payment
                  alert('Payment confirmed!');
                  setShowCashModal(false);
                  setCart([]);
                }}
                disabled={(parseFloat(amountReceived) || 0) < getTotal()}
              >
                <i className="fa-solid fa-check"></i> Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSTerminal;
