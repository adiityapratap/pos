import React, { useEffect, useState } from 'react';
import { apiClient } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface Category {
  id: string;
  name: string;
  displayName: string;
  colorHex?: string;
}

interface Product {
  id: string;
  name: string;
  displayName: string;
  basePrice: any;
  categoryId: string;
  imageUrl?: string;
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
  product: Product;
  quantity: number;
  selectedModifiers: Modifier[];
  notes?: string;
}

const POSTerminal: React.FC = () => {
  const { logout: _logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifiers, setModifiers] = useState<{ [groupId: string]: Modifier[] }>({});
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderNumber] = useState(Math.floor(Math.random() * 8000) + 1000);
  const [tableNumber] = useState('08');
  const [customerName] = useState('John Smith');
  const [orderType] = useState('DINE_IN');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadCategories();
    loadProducts();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/categories');
      const flatCategories = response.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        displayName: cat.displayName || cat.name,
        colorHex: cat.colorHex,
      }));
      setCategories([
        { id: 'all', name: 'all-items', displayName: 'All Items' },
        ...flatCategories,
      ]);
      setSelectedCategory('all');
    } catch (error) {
      console.error('Error loading categories:', error);
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

  const handleProductClick = async (product: Product) => {
    try {
      const response = await apiClient.get(`/modifiers/products/${product.id}/groups`);
      if (response.data.length > 0) {
        setSelectedProduct(product);
        setModifierGroups(response.data);
        const mods: { [key: string]: Modifier[] } = {};
        response.data.forEach((group: ModifierGroup & { modifiers: Modifier[] }) => {
          mods[group.id] = group.modifiers || [];
        });
        setModifiers(mods);
        const defaultMods: Modifier[] = [];
        Object.values(mods).forEach((groupMods) => {
          groupMods.forEach((mod) => {
            if (mod.isDefault) defaultMods.push(mod);
          });
        });
        setSelectedModifiers(defaultMods);
        setShowModifierModal(true);
      } else {
        setCart([...cart, { product, quantity: 1, selectedModifiers: [] }]);
      }
    } catch (error) {
      console.error('Error loading modifiers:', error);
    }
  };

  const handleModifierToggle = (group: ModifierGroup, modifier: Modifier) => {
    if (group.selectionType === 'single') {
      const filtered = selectedModifiers.filter(
        (m) => !modifiers[group.id].some((gm) => gm.id === m.id)
      );
      setSelectedModifiers([...filtered, modifier]);
    } else {
      const isSelected = selectedModifiers.some((m) => m.id === modifier.id);
      if (isSelected) {
        setSelectedModifiers(selectedModifiers.filter((m) => m.id !== modifier.id));
      } else {
        setSelectedModifiers([...selectedModifiers, modifier]);
      }
    }
  };

  const addToCart = () => {
    if (selectedProduct) {
      setCart([...cart, { product: selectedProduct, quantity: 1, selectedModifiers }]);
      setShowModifierModal(false);
      setSelectedProduct(null);
      setSelectedModifiers([]);
    }
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const calculateItemPrice = (item: CartItem): number => {
    let price = Number(item.product.basePrice);
    item.selectedModifiers.forEach((mod) => {
      price += Number(mod.priceChange);
    });
    return price * item.quantity;
  };

  const getSubtotal = (): number => {
    return cart.reduce((sum, item) => sum + calculateItemPrice(item), 0);
  };

  const getTax = (): number => {
    return getSubtotal() * 0.08;
  };

  const getPromoDiscount = (): number => {
    return getSubtotal() * 0.1;
  };

  const getTotalAmount = (): number => {
    const subtotal = getSubtotal();
    const tax = getTax();
    const discount = getPromoDiscount();
    return subtotal + tax - discount;
  };

  const handleCheckout = () => {
    alert(`Checkout: Total $${getTotalAmount().toFixed(2)}`);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).toUpperCase();
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#050505',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '1440px',
        height: '1024px',
        background: '#0F1217',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: '12px solid #2D3748',
        borderRadius: '40px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        {/* Header */}
        <header style={{
          height: '64px',
          borderBottom: '1px solid #1F2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: '#1A2027'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: '#00D4C8',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>⚡</div>
              <span style={{
                fontSize: '20px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>NEXUS POS</span>
            </div>
            <div style={{ height: '24px', width: '1px', background: '#374151' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#94A3B8' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                background: '#1F2937',
                borderRadius: '9999px',
                fontSize: '14px'
              }}>
                <span>👤</span>
                <span>Cashier: Alex M.</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                background: '#1F2937',
                borderRadius: '9999px',
                fontSize: '14px'
              }}>
                <span>🏪</span>
                <span>Main Counter</span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>
                {formatTime(currentTime)}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '1.5px'
              }}>
                {formatDate(currentTime)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#94A3B8', fontSize: '18px' }}>
              <span style={{ color: '#10B981' }}>📶</span>
              <span>🖨️</span>
              <span>🔄</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT: Product Area */}
          <section style={{
            width: '65%',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #1F2937'
          }}>
            {/* Search */}
            <div style={{ padding: '24px', paddingBottom: '8px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '20px',
                  color: '#94A3B8'
                }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search products, SKUs or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '64px',
                    background: '#1A2027',
                    border: '1px solid #374151',
                    borderRadius: '16px',
                    paddingLeft: '56px',
                    paddingRight: '24px',
                    fontSize: '20px',
                    color: 'white',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00D4C8'}
                  onBlur={(e) => e.target.style.borderColor = '#374151'}
                />
              </div>
            </div>

            {/* Categories */}
            <div style={{
              padding: '16px 24px',
              display: 'flex',
              gap: '12px',
              overflowX: 'auto'
            }}>
              {categories.map((category) => {
                const categoryProducts = category.id === 'all' 
                  ? products 
                  : products.filter(p => p.categoryId === category.id);
                const isActive = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: '16px 32px',
                      background: isActive ? 'rgba(0, 212, 200, 0.1)' : '#1A2027',
                      borderRadius: '16px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      color: isActive ? '#00D4C8' : '#94A3B8',
                      border: 'none',
                      cursor: 'pointer',
                      borderBottom: isActive ? '4px solid #00D4C8' : 'none',
                      transition: 'all 0.2s',
                      fontSize: '14px'
                    }}
                  >
                    {category.displayName}
                    {category.id !== 'all' && categoryProducts.length > 0 && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        background: '#00D4C8',
                        color: '#0F1217',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontWeight: '700'
                      }}>
                        {categoryProducts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Products Grid */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              alignContent: 'start'
            }}>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  style={{
                    background: '#1A2027',
                    borderRadius: '24px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 2px #00D4C8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    height: '128px',
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#475569'
                  }}>
                    {product.displayName[0]}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                      {product.displayName}
                    </h3>
                    <p style={{ fontSize: '24px', fontWeight: '900', color: '#00D4C8' }}>
                      ${Number(product.basePrice).toFixed(2)}
                    </p>
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    width: '12px',
                    height: '12px',
                    background: '#10B981',
                    borderRadius: '50%',
                    border: '2px solid #1A2027',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                  }}></div>
                </div>
              ))}
            </div>

            {/* Quick Action Footer */}
            <div style={{
              height: '96px',
              borderTop: '1px solid #1F2937',
              background: 'rgba(26, 32, 39, 0.5)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
              gap: '16px'
            }}>
              <button style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '96px',
                height: '64px',
                background: '#1F2937',
                borderRadius: '12px',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px'
              }}>
                <span>🪑</span>
                <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: '700', textTransform: 'uppercase' }}>Tables</span>
              </button>
              <button style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '96px',
                height: '64px',
                background: '#1F2937',
                borderRadius: '12px',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px'
              }}>
                <span>🔒</span>
                <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: '700', textTransform: 'uppercase' }}>Cash</span>
              </button>
              <button style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '96px',
                height: '64px',
                background: '#1F2937',
                borderRadius: '12px',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '18px'
              }}>
                <span>🎫</span>
                <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: '700', textTransform: 'uppercase' }}>Orders</span>
              </button>
              <div style={{ flex: 1 }}></div>
              <button style={{
                height: '64px',
                padding: '0 32px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                cursor: 'pointer'
              }}>
                Void Order
              </button>
            </div>
          </section>

          {/* RIGHT: Cart Panel */}
          <section style={{
            width: '35%',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(26, 32, 39, 0.3)'
          }}>
            {/* Cart Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #1F2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    margin: 0
                  }}>
                    ORDER #{orderNumber}
                  </h2>
                  <span style={{ fontSize: '14px', color: '#94A3B8', cursor: 'pointer' }}>✏️</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{
                    padding: '2px 8px',
                    background: 'rgba(0, 212, 200, 0.1)',
                    color: '#00D4C8',
                    fontSize: '10px',
                    fontWeight: '700',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {orderType.replace('_', '-')}
                  </span>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                    Table {tableNumber} • {customerName}
                  </span>
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #374151',
                background: '#1F2937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                👤
              </div>
            </div>

            {/* Items List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {cart.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: '#64748B',
                  fontSize: '14px'
                }}>
                  <p>No items in cart</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    background: 'rgba(26, 32, 39, 0.8)',
                    borderRadius: '16px',
                    border: '1px solid #1F2937',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                          {item.product.displayName}
                        </h4>
                        {item.selectedModifiers.length > 0 && (
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            marginTop: '8px'
                          }}>
                            {item.selectedModifiers.map((mod) => (
                              <span key={mod.id} style={{
                                padding: '2px 8px',
                                background: '#1F2937',
                                color: Number(mod.priceChange) > 0 ? '#00D4C8' : '#94A3B8',
                                fontSize: '11px',
                                borderRadius: '6px',
                                fontWeight: '500',
                                border: Number(mod.priceChange) > 0 ? '1px solid rgba(0, 212, 200, 0.2)' : '1px solid #374151'
                              }}>
                                {mod.displayName}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <div style={{
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#94A3B8',
                            fontSize: '12px',
                            fontStyle: 'italic'
                          }}>
                            <span>💬</span>
                            <span>"{item.notes}"</span>
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>
                          {item.quantity} × ${Number(item.product.basePrice).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#00D4C8' }}>
                          ${calculateItemPrice(item).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(index)}
                      style={{
                        position: 'absolute',
                        right: '-8px',
                        top: '-8px',
                        width: '28px',
                        height: '28px',
                        background: '#EF4444',
                        color: 'white',
                        borderRadius: '50%',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '14px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Totals & Checkout */}
            <div style={{
              padding: '24px',
              background: '#1A2027',
              borderTop: '1px solid #1F2937',
              boxShadow: '0 -10px 20px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                  <span>Subtotal</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                  <span>Tax (8%)</span>
                  <span>${getTax().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444', fontWeight: '500' }}>
                  <span>Promo: MORNING10</span>
                  <span>-${getPromoDiscount().toFixed(2)}</span>
                </div>
                <div style={{
                  paddingTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'end'
                }}>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    color: '#94A3B8'
                  }}>
                    Total
                  </span>
                  <span style={{ fontSize: '48px', fontWeight: '900', color: '#00D4C8' }}>
                    ${getTotalAmount().toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <button
                  onClick={() => alert('Split Bill - Feature coming soon!')}
                  style={{
                    height: '56px',
                    background: '#1F2937',
                    borderRadius: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <span>👥</span>
                  Split Bill
                </button>
                <button
                  onClick={() => alert('Discount - Feature coming soon!')}
                  style={{
                    height: '56px',
                    background: '#1F2937',
                    borderRadius: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <span>🏷️</span>
                  Discount
                </button>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                style={{
                  width: '100%',
                  height: '80px',
                  background: cart.length === 0 ? '#334155' : '#00D4C8',
                  color: '#0F1217',
                  fontSize: '24px',
                  fontWeight: '900',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(0, 212, 200, 0.2)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  border: 'none',
                  cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: cart.length === 0 ? 0.5 : 1
                }}
              >
                Pay Now
                <span style={{ fontSize: '20px' }}>▶</span>
              </button>
            </div>
          </section>
        </main>

        {/* Modifier Modal */}
        {showModifierModal && selectedProduct && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setShowModifierModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '600px',
                background: '#1A2027',
                border: '1px solid #374151',
                borderRadius: '32px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{
                padding: '24px',
                borderBottom: '1px solid #1F2937',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                  Customize {selectedProduct.displayName}
                </h3>
                <button
                  onClick={() => setShowModifierModal(false)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#1F2937',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{
                padding: '32px',
                maxHeight: '60vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
              }}>
                {modifierGroups.map((group) => (
                  <div key={group.id}>
                    <p style={{
                      color: '#94A3B8',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      fontSize: '12px',
                      letterSpacing: '1.5px',
                      marginBottom: '16px'
                    }}>
                      {group.displayName}
                      {group.isRequired && (
                        <span style={{
                          marginLeft: '8px',
                          background: '#EF4444',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          REQUIRED
                        </span>
                      )}
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: group.selectionType === 'single' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                      gap: '16px'
                    }}>
                      {(modifiers[group.id] || []).map((modifier) => {
                        const isSelected = selectedModifiers.some((m) => m.id === modifier.id);
                        return (
                          <button
                            key={modifier.id}
                            onClick={() => handleModifierToggle(group, modifier)}
                            style={{
                              height: '64px',
                              border: `2px solid ${isSelected ? '#00D4C8' : '#374151'}`,
                              background: isSelected ? 'rgba(0, 212, 200, 0.1)' : 'transparent',
                              color: isSelected ? '#00D4C8' : 'white',
                              borderRadius: '16px',
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              fontSize: '14px'
                            }}
                          >
                            {modifier.displayName}
                            {Number(modifier.priceChange) !== 0 && (
                              <span style={{ color: '#00D4C8', fontSize: '14px' }}>
                                +${Number(modifier.priceChange).toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '24px', background: 'rgba(31, 41, 55, 0.5)' }}>
                <button
                  onClick={addToCart}
                  style={{
                    width: '100%',
                    height: '64px',
                    background: '#00D4C8',
                    color: '#0F1217',
                    fontWeight: '900',
                    fontSize: '20px',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  Update Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POSTerminal;
