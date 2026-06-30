import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { InventoryItem } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, setDoc, doc, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

interface Client {
  id: string;
  name: string;
  type: string;
  balance: number;
}

const mockItems: InventoryItem[] = [];

const mockClients: Client[] = [];

let cachedPosProducts: InventoryItem[] | null = null;

function BarcodeScannerComponent({ onScan, onClose }: { onScan: (code: string) => void, onClose: () => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (error) => {
        // Ignore scan errors as they happen constantly when no barcode is in view
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-[#0f172a] flex items-center gap-2">
            <span className="material-symbols-outlined">barcode_scanner</span>
            مسح باركود
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-4">
          <div id="reader" className="w-full"></div>
          <p className="text-center text-xs text-slate-500 mt-4">ضع الباركود أمام الكاميرا للمسح التلقائي</p>
        </div>
      </div>
    </div>
  );
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<InventoryItem[]>(mockItems);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [clientInput, setClientInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState<{show: boolean, data: any}>({show: false, data: null});
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    const unsubscribeInventory = onSnapshot(collection(db, 'inventory'), (querySnapshot) => {
      if (querySnapshot.empty) {
        setProducts(mockItems);
      } else {
        const fetchedProducts: InventoryItem[] = [];
        querySnapshot.forEach((doc) => {
          fetchedProducts.push({ id: doc.id, ...doc.data() } as InventoryItem);
        });
        setProducts(fetchedProducts);
      }
    }, (error) => {
      console.error('Error fetching inventory for POS:', error);
    });

    const unsubscribeClients = onSnapshot(collection(db, 'clients'), (clientsSnapshot) => {
      const fetchedClients: Client[] = [];
      clientsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type?.includes('عميل')) {
          fetchedClients.push({ id: doc.id, name: data.name, type: data.type, balance: data.balance } as Client);
        }
      });
      if (fetchedClients.length > 0) {
        setClients(fetchedClients);
      } else {
        setClients(mockClients);
      }
    }, (error) => {
      console.error('Error fetching clients for POS:', error);
    });

    return () => {
      unsubscribeInventory();
      unsubscribeClients();
    };
  }, []);

  const normalize = (text?: string) => 
    text ? text.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').toLowerCase() : '';

  const filteredProducts = products.filter(p => 
    normalize(p.name).includes(normalize(searchTerm)) || 
    normalize(p.sku).includes(normalize(searchTerm))
  );

  const addToCart = (product: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.quantity) {
          toast.error('لا يمكن تجاوز الكمية المتاحة في المخزون');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.cartQuantity + delta;
        if (newQ > item.quantity) {
          toast.error('لا يمكن تجاوز الكمية المتاحة في المخزون');
          return item;
        }
        return newQ > 0 ? { ...item, cartQuantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const tax = total * 0.15; // 15% VAT
  const grandTotal = total + tax;

  const handleCheckout = (method: 'نقدي' | 'آجل') => {
    if (method === 'آجل' && !clientInput) {
      toast.error('يجب اختيار عميل لإصدار فاتورة آجلة');
      return;
    }

    try {
      const client = clients.find(c => c.name === clientInput);
      const clientName = clientInput || 'عميل مبيعات نقدية (كاشير)';

      const salesData = {
        date: new Date().toISOString(),
        client: clientName,
        total: grandTotal,
        status: method === 'آجل' ? 'آجل' : 'مدفوع',
        method: method,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.cartQuantity,
          price: item.price
        }))
      };

      // Fire and forget, don't await to avoid hanging offline
      addDoc(collection(db, 'sales'), salesData).catch(err => console.error("Sales sync error:", err));

      // Update client balance if credit
      if (method === 'آجل' && client) {
        const clientRef = doc(db, 'clients', client.id);
        updateDoc(clientRef, {
          balance: increment(-grandTotal) // Reduce balance (more negative means they owe us)
        }).catch(err => console.error("Client sync error:", err));
      }

      // Decrement inventory stock
      cart.forEach(item => {
        const itemRef = doc(db, 'inventory', item.id);
        updateDoc(itemRef, {
          quantity: increment(-item.cartQuantity)
        }).catch(err => console.error("Inventory sync error:", err));
      });

      toast.success(`تم إصدار الفاتورة بنجاح!`);
      
      setInvoiceModal({
        show: true,
        data: { ...salesData, tax, subtotal: total, id: Math.random().toString(36).substring(2, 8).toUpperCase() }
      });

      setCart([]);
      setClientInput('');
    } catch (error) {
      console.error('Error processing checkout:', error);
      toast.error('حدث خطأ أثناء إتمام عملية الدفع');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 flex-1 animate-fade-in-up items-start">
      {/* Products Section */}
      <div className="flex-[2] flex flex-col gap-4">
        <div className="flex items-center justify-between shrink-0 mb-2">
          <h1 className="text-xl font-bold text-[#0f172a]">نقطة البيع <span className="text-[#0ea5e9] font-normal">| كاشير 1</span></h1>
        </div>
        
        <div className="flex items-center gap-2 relative shrink-0">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '20px' }}>search</span>
            <input 
              type="text" 
              placeholder="ابحث عن منتج بالاسم أو الباركود..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const match = products.find(p => p.sku === searchTerm.trim());
                  if (match) {
                    addToCart(match);
                    setSearchTerm('');
                  } else if (filteredProducts.length === 1) {
                    addToCart(filteredProducts[0]);
                    setSearchTerm('');
                  }
                }
              }}
              className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all text-slate-700 shadow-sm hover:shadow-md focus:shadow-md"
            />
          </div>
          <button 
            onClick={() => setScannerOpen(true)}
            className="bg-[#0ea5e9] text-white p-3 rounded-xl hover:bg-[#0284c7] transition-colors shadow-sm hover:shadow-md flex items-center justify-center shrink-0 group"
            title="مسح باركود"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">barcode_scanner</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.quantity <= 0}
              className={`bg-white p-4 rounded-2xl shadow-sm transition-all duration-300 text-right flex flex-col h-32 group ${product.quantity <= 0 ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-lg hover:-translate-y-1 hover:border-[#0ea5e9]'}`}
            >
              <div className="text-[10px] text-slate-400 font-mono mb-1 group-hover:text-[#0ea5e9] transition-colors flex justify-between w-full">
                <span>{product.sku}</span>
                {product.quantity <= 0 && <span className="text-red-500 font-bold">نفد المخزون</span>}
              </div>
              <div className="font-bold text-[#0f172a] text-sm leading-tight flex-1 group-hover:text-[#0ea5e9] transition-colors">{product.name}</div>
              <div className="flex items-end justify-between mt-2 w-full">
                <div className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded group-hover:bg-blue-50 group-hover:text-[#0ea5e9] transition-colors">{product.quantity} {product.unit}</div>
                <div className="font-bold text-[#0ea5e9]">{product.price} <span className="text-xs font-normal">ج.م</span></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm flex flex-col min-w-[320px] sticky top-28 hover:shadow-md transition-shadow duration-300 self-start">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col gap-3 shrink-0 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#0f172a] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0ea5e9]" style={{ fontSize: '18px' }}>shopping_cart</span>
              الفاتورة الحالية
            </h2>
            <button 
              onClick={() => {
                if (cart.length > 0) {
                  setCart([]);
                  toast.info('تم إفراغ السلة');
                }
              }}
              disabled={cart.length === 0}
              className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
              إفراغ
            </button>
          </div>
          
          <div>
            <input 
              list="clients-list"
              value={clientInput} 
              onChange={(e) => setClientInput(e.target.value)}
              placeholder="ابحث عن عميل أو أضف عميل جديد..."
              className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-[#0ea5e9] focus:border-[#0ea5e9] block p-2.5"
            />
            <datalist id="clients-list">
              {clients.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-3 min-h-[200px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <span className="material-symbols-outlined opacity-20" style={{ fontSize: '48px' }}>shopping_cart</span>
              <p className="text-sm">السلة فارغة</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#0ea5e9] transition-colors group animate-fade-in-up">
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-sm text-[#0f172a] group-hover:text-[#0ea5e9] transition-colors">{item.name}</div>
                  <div className="font-bold text-sm text-[#0f172a]">{(item.price * item.cartQuantity).toFixed(2)}</div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-0.5">
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                    </button>
                    <span className="text-xs font-bold w-6 text-center">{item.cartQuantity}</span>
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>remove</span>
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors hover:scale-110">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-2">
          <div className="flex justify-between text-sm text-slate-500 font-semibold">
            <span>المجموع (بدون ضريبة):</span>
            <span>{total.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-sm text-slate-500 font-semibold">
            <span>الضريبة (15%):</span>
            <span>{tax.toFixed(2)} ج.م</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-[#0f172a] pt-2 border-t border-slate-200">
            <span>الإجمالي:</span>
            <span>{grandTotal.toFixed(2)} <span className="text-sm font-normal text-slate-500">ج.م</span></span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button 
              disabled={cart.length === 0} 
              onClick={() => handleCheckout('نقدي')}
              className="py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-green-700 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none flex items-center justify-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>payments</span> نقدي
            </button>
            <button 
              disabled={cart.length === 0} 
              onClick={() => handleCheckout('آجل')}
              className="py-3 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-100 hover:bg-orange-600 hover:shadow-none transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none flex items-center justify-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span> آجل
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {invoiceModal.show && invoiceModal.data && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-fade-in-up max-h-[90vh]">
            <div className="p-6 flex flex-col gap-4 text-center border-b border-dashed border-slate-200 shrink-0">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>check_circle</span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#0f172a]">تم الإصدار بنجاح</h3>
                <p className="text-sm text-slate-500 mt-1">فاتورة رقم: INV-{invoiceModal.data.id}</p>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 space-y-4 overflow-y-auto">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">العميل:</span>
                <span className="font-bold text-[#0f172a]">{invoiceModal.data.client}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="font-bold text-[#0f172a]">{invoiceModal.data.method}</span>
              </div>
              
              <div className="border-t border-slate-200 my-4 pt-4 space-y-2">
                {invoiceModal.data.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-[#0f172a]">{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                    <span className="font-semibold">{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 my-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">المجموع:</span>
                  <span>{invoiceModal.data.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">الضريبة (15%):</span>
                  <span>{invoiceModal.data.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-[#0f172a] pt-2">
                  <span>الإجمالي:</span>
                  <span>{invoiceModal.data.total.toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex gap-3 shrink-0">
              <button 
                onClick={() => setInvoiceModal({show: false, data: null})}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                إغلاق
              </button>
              <button 
                onClick={() => {
                  toast.success('تم إرسال أمر الطباعة!');
                  setInvoiceModal({show: false, data: null});
                }}
                className="flex-1 px-4 py-3 bg-[#0ea5e9] text-white rounded-xl font-bold hover:bg-[#0284c7] transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>print</span>
                طباعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {scannerOpen && (
        <BarcodeScannerComponent 
          onScan={(code) => {
            const match = products.find(p => p.sku === code.trim());
            if (match) {
              addToCart(match);
              toast.success(`تمت إضافة ${match.name}`);
              setScannerOpen(false);
            } else {
              toast.error('لم يتم العثور على منتج بهذا الباركود');
            }
          }} 
          onClose={() => setScannerOpen(false)} 
        />
      )}
    </div>
  );
}
