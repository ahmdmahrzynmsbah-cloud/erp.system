import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { InventoryItem } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import Barcode from 'react-barcode';


const mockItems: InventoryItem[] = [];

let cachedInventory: InventoryItem[] | null = null;

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [items, setItems] = useState<InventoryItem[]>(cachedInventory || mockItems);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const handleDeleteItem = async () => {
    if (selectedItem) {
      const itemToDelete = selectedItem;
      // Optimistic update
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      
      const updatedItems = items.filter(item => item.id !== itemToDelete.id);
      setItems(updatedItems);
      cachedInventory = updatedItems;
      toast.success('تم حذف الصنف بنجاح');

      try {
        await deleteDoc(doc(db, 'inventory', itemToDelete.id));
      } catch (error) {
        console.error("Error deleting item:", error);
        toast.error('حدث خطأ أثناء الحذف الفعلي للصنف');
      }
    }
  };

  const exportToCSV = () => {
    if (items.length === 0) {
      toast.error('لا توجد بيانات لتصديرها');
      return;
    }

    const headers = ['كود الصنف', 'اسم الصنف', 'التصنيف', 'الكمية', 'الوحدة', 'سعر الشراء', 'سعر البيع'];
    
    // Add BOM for UTF-8 encoding so Excel reads Arabic correctly
    const BOM = '\uFEFF';
    
    const csvContent = 
      BOM +
      headers.join(',') + '\n' +
      items.map(item => {
        return [
          item.sku,
          `"${item.name}"`,
          item.category,
          item.quantity,
          item.unit,
          item.purchasePrice || 0,
          item.price
        ].join(',');
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('تم تصدير تقرير المخزون بنجاح');
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        if (querySnapshot.empty) {
          const defaultCategories = ['مواد بناء', 'حديد وصلب', 'دهانات', 'سباكة', 'كهرباء', 'أخرى'];
          const newCategories = [];
          for (const catName of defaultCategories) {
            const newCat = { id: Date.now().toString() + Math.random().toString(36).substring(7), name: catName };
            await setDoc(doc(db, 'categories', newCat.id), newCat);
            newCategories.push(newCat);
          }
          setCategories(newCategories);
        } else {
          const fetchedCategories: {id: string, name: string}[] = [];
          querySnapshot.forEach((doc) => {
            fetchedCategories.push({ id: doc.id, ...doc.data() } as {id: string, name: string});
          });
          setCategories(fetchedCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();

    if (cachedInventory) return;
    
    const fetchInventory = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        if (querySnapshot.empty) {
          // Seed the database if empty
          const batch = mockItems.map(item => setDoc(doc(db, 'inventory', item.id), item));
          await Promise.all(batch);
          cachedInventory = mockItems;
        } else {
          const fetchedItems: InventoryItem[] = [];
          querySnapshot.forEach((doc) => {
            fetchedItems.push({ id: doc.id, ...doc.data() } as InventoryItem);
          });
          setItems(fetchedItems);
          cachedInventory = fetchedItems;
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
        cachedInventory = mockItems;
      }
    };

    fetchInventory();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCat = { id: Date.now().toString(), name: newCategoryName.trim() };
      await setDoc(doc(db, 'categories', newCat.id), newCat);
      setCategories([...categories, newCat]);
      setNewCategoryName('');
      toast.success('تمت إضافة التصنيف بنجاح');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('حدث خطأ أثناء إضافة التصنيف');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(categories.filter(c => c.id !== id));
      toast.success('تم حذف التصنيف بنجاح');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('حدث خطأ أثناء حذف التصنيف');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    try {
      await setDoc(doc(db, 'categories', editingCategoryId), { id: editingCategoryId, name: editingCategoryName.trim() });
      setCategories(categories.map(c => c.id === editingCategoryId ? { ...c, name: editingCategoryName.trim() } : c));
      setEditingCategoryId(null);
      setEditingCategoryName('');
      toast.success('تم تحديث التصنيف بنجاح');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('حدث خطأ أثناء تحديث التصنيف');
    }
  };

  const normalize = (text?: string) => 
    text ? text.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ي/g, 'ى').toLowerCase() : '';

  const filteredItems = items.filter(item => {
    const matchesSearch = normalize(item.name).includes(normalize(searchTerm)) || 
                          normalize(item.sku).includes(normalize(searchTerm));
    const matchesCategory = filterCategory === 'all' || item.category.includes(filterCategory) || filterCategory.includes(item.category);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 flex-1 flex flex-col animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shrink-0">
        <h1 className="text-xl font-bold text-[#0f172a]">إدارة المخزون <span className="text-[#0ea5e9] font-normal">| الأرصدة الحالية</span></h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsCategoriesModalOpen(true)} className="bg-white border border-slate-200 text-[#0f172a] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>category</span>
            إدارة التصنيفات
          </button>
          <button onClick={exportToCSV} className="bg-white border border-slate-200 text-[#0f172a] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
            تصدير
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-100 hover:shadow-none hover:-translate-y-0.5">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            إضافة صنف
          </button>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-[#0f172a]">إضافة صنف جديد</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">اسم الصنف</label>
                  <input type="text" id="itemName" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكود (SKU)</label>
                  <input type="text" id="itemSku" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">التصنيف</label>
                  <select id="itemCategory" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الوحدة</label>
                  <input type="text" id="itemUnit" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكمية</label>
                  <input type="number" id="itemQty" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الحد الأدنى</label>
                  <input type="number" id="itemMinQty" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">سعر الشراء</label>
                    <input type="number" id="itemPurchasePrice" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">سعر البيع</label>
                    <input type="number" id="itemPrice" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 mt-auto shrink-0">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-sm transition-colors">إلغاء</button>
              <button onClick={async () => {
                const name = (document.getElementById('itemName') as HTMLInputElement).value;
                const sku = (document.getElementById('itemSku') as HTMLInputElement).value;
                const category = (document.getElementById('itemCategory') as HTMLSelectElement).value;
                const unit = (document.getElementById('itemUnit') as HTMLInputElement).value;
                const quantity = Number((document.getElementById('itemQty') as HTMLInputElement).value);
                const minStock = Number((document.getElementById('itemMinQty') as HTMLInputElement).value);
                const price = Number((document.getElementById('itemPrice') as HTMLInputElement).value);
                const purchasePrice = Number((document.getElementById('itemPurchasePrice') as HTMLInputElement).value);

                if (!name || !sku) {
                  toast.error('الرجاء إدخال اسم الصنف والكود');
                  return;
                }

                const newItem = { id: Date.now().toString(), name, sku, category, unit, quantity, minStock, price, purchasePrice };
                try {
                  await setDoc(doc(db, 'inventory', newItem.id), newItem);
                  setItems([newItem, ...items]);
                  toast.success('تمت إضافة الصنف بنجاح');
                  setIsAddModalOpen(false);
                } catch(e) {
                  toast.error('حدث خطأ أثناء الحفظ');
                }
              }} className="px-4 py-2 bg-[#0ea5e9] text-white rounded-xl hover:bg-[#0284c7] font-bold text-sm shadow-md transition-all">حفظ الصنف</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 hover:shadow-md transition-shadow duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="relative w-full sm:w-[400px]">
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '18px' }}>search</span>
            <input 
              type="text" 
              placeholder="ابحث بالاسم أو كود الصنف (SKU)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9] focus:bg-white transition-all text-slate-700 shadow-sm hover:shadow-md focus:shadow-md"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-slate-500 w-full sm:w-auto hover:text-[#0f172a] px-4 py-2.5 border border-slate-200 rounded-lg bg-white flex items-center gap-2 text-sm font-semibold transition-all hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="all">جميع التصنيفات</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-right text-sm border-collapse min-w-[800px]">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest sticky top-0 z-10 shadow-sm">
              <tr className="border-b border-slate-100">
                <th className="p-4 font-bold">كود الصنف</th>
                <th className="p-4 font-bold">اسم الصنف</th>
                <th className="p-4 font-bold">التصنيف</th>
                <th className="p-4 font-bold">الكمية</th>
                <th className="p-4 font-bold">سعر الشراء</th>
                <th className="p-4 font-bold">سعر البيع</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.map(item => {
                const isLow = item.quantity <= item.minStock;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="p-4 font-mono text-slate-400 group-hover:text-[#0ea5e9] transition-colors">{item.sku}</td>
                    <td className="p-4 font-semibold text-[#0f172a] group-hover:text-[#0ea5e9] transition-colors">{item.name}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">{item.category}</span>
                    </td>
                    <td className="p-4">
                      <span className={`font-bold ${isLow ? 'text-red-500' : 'text-[#0f172a]'}`}>
                        {item.quantity} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-500">{item.purchasePrice || 0} <span className="text-xs font-normal text-slate-400">ج.م</span></td>
                    <td className="p-4 font-semibold text-[#0f172a]">{item.price} <span className="text-xs font-normal text-slate-400">ج.م</span></td>
                    <td className="p-4">
                      {isLow ? (
                        <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-[10px] font-bold border border-red-100">نواقص (يطلب)</span>
                      ) : (
                        <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold border border-green-100">متوفر</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setIsBarcodeModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                          title="عرض الباركود"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>barcode</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setIsEditModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-[#0ea5e9] transition-colors"
                          title="تعديل"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          title="حذف"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined opacity-20" style={{ fontSize: '48px' }}>search_off</span>
                      لم يتم العثور على نتائج مطابقة للبحث
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-[#0f172a]">تعديل الصنف</h2>
              <button onClick={() => {setIsEditModalOpen(false); setSelectedItem(null);}} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">اسم الصنف</label>
                  <input type="text" id="editItemName" defaultValue={selectedItem.name} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">التصنيف</label>
                  <select id="editItemCategory" defaultValue={selectedItem.category} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الوحدة</label>
                  <select id="editItemUnit" defaultValue={selectedItem.unit} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]">
                    <option value="قطعة">قطعة</option>
                    <option value="كيس">كيس</option>
                    <option value="طن">طن</option>
                    <option value="جالون">جالون</option>
                    <option value="لفة">لفة</option>
                    <option value="متر">متر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الكمية الافتتاحية</label>
                  <input type="number" id="editItemQty" defaultValue={selectedItem.quantity} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">الحد الأدنى</label>
                  <input type="number" id="editItemMinQty" defaultValue={selectedItem.minStock} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                </div>
                <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">سعر الشراء</label>
                    <input type="number" id="editItemPurchasePrice" defaultValue={selectedItem.purchasePrice || 0} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">سعر البيع</label>
                    <input type="number" id="editItemPrice" defaultValue={selectedItem.price} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0ea5e9]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 mt-auto shrink-0">
              <button onClick={() => {setIsEditModalOpen(false); setSelectedItem(null);}} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-sm transition-colors">إلغاء</button>
              <button onClick={async () => {
                const name = (document.getElementById('editItemName') as HTMLInputElement).value;
                const category = (document.getElementById('editItemCategory') as HTMLSelectElement).value;
                const unit = (document.getElementById('editItemUnit') as HTMLSelectElement).value;
                const quantity = parseInt((document.getElementById('editItemQty') as HTMLInputElement).value) || 0;
                const minStock = parseInt((document.getElementById('editItemMinQty') as HTMLInputElement).value) || 0;
                const price = parseFloat((document.getElementById('editItemPrice') as HTMLInputElement).value) || 0;
                const purchasePrice = parseFloat((document.getElementById('editItemPurchasePrice') as HTMLInputElement).value) || 0;
                
                if (!name) {
                  toast.error('يرجى إدخال اسم الصنف');
                  return;
                }

                setLoading(true);
                try {
                  const updatedItem = { ...selectedItem, name, category, unit, quantity, minStock, price, purchasePrice };
                  await setDoc(doc(db, 'inventory', updatedItem.id), updatedItem);
                  
                  const updatedItems = items.map(item => item.id === updatedItem.id ? updatedItem : item);
                  setItems(updatedItems);
                  cachedInventory = updatedItems;
                  
                  toast.success('تم تحديث الصنف بنجاح');
                  setIsEditModalOpen(false);
                  setSelectedItem(null);
                } catch (error) {
                  toast.error('حدث خطأ أثناء تحديث الصنف');
                  console.error(error);
                } finally {
                  setLoading(false);
                }
              }} disabled={loading} className="px-6 py-2 bg-[#0ea5e9] text-white rounded-xl hover:bg-blue-600 font-bold text-sm transition-all shadow-md shadow-blue-100 flex items-center gap-2 disabled:opacity-50">
                {loading ? <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span> : <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>}
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {isBarcodeModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0f172a]">باركود الصنف</h2>
              <button onClick={() => {setIsBarcodeModalOpen(false); setSelectedItem(null);}} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center gap-4 bg-slate-50" id="print-barcode-area">
              <h3 className="font-bold text-[#0f172a] text-center">{selectedItem.name}</h3>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <Barcode value={selectedItem.sku.replace('#', '')} height={60} displayValue={true} />
              </div>
              <p className="font-bold text-lg text-[#0ea5e9]">{selectedItem.price} ج.م</p>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-center gap-3 bg-white">
              <button onClick={() => {
                const printContents = document.getElementById('print-barcode-area')?.innerHTML;
                const originalContents = document.body.innerHTML;
                if (printContents) {
                  document.body.innerHTML = printContents;
                  window.print();
                  document.body.innerHTML = originalContents;
                  window.location.reload();
                }
              }} className="px-6 py-2.5 w-full bg-[#0f172a] text-white rounded-xl hover:bg-slate-800 font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                طباعة الباركود
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 text-center border-b border-slate-100 shrink-0">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>warning</span>
              </div>
              <h2 className="text-lg font-bold text-[#0f172a] mb-2">حذف الصنف</h2>
              <p className="text-slate-500 text-sm">هل أنت متأكد من رغبتك في حذف "{selectedItem.name}"؟ لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div className="p-4 bg-slate-50 flex gap-3 shrink-0">
              <button 
                onClick={() => {setIsDeleteModalOpen(false); setSelectedItem(null);}} 
                className="flex-1 px-4 py-2.5 text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-sm transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleDeleteItem} 
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {isCategoriesModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0ea5e9]">category</span>
                إدارة التصنيفات
              </h2>
              <button onClick={() => setIsCategoriesModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="اسم التصنيف الجديد..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] transition-all text-slate-700"
                />
                <button 
                  type="button"
                  onClick={handleAddCategory}
                  className="bg-[#0f172a] hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                </button>
              </div>
              
              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">التصنيفات الحالية</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {editingCategoryId === cat.id ? (
                        <div className="flex items-center gap-2 flex-1 ml-2">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                            className="flex-1 px-3 py-1.5 bg-white border border-[#0ea5e9] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0ea5e9]"
                            autoFocus
                          />
                          <button
                            onClick={handleUpdateCategory}
                            className="text-[#0ea5e9] hover:text-[#0284c7] transition-colors bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm"
                            title="حفظ"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditingCategoryName('');
                            }}
                            className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm"
                            title="إلغاء"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="font-semibold text-slate-700">{cat.name}</span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingCategoryId(cat.id);
                                setEditingCategoryName(cat.name);
                              }}
                              className="text-slate-400 hover:text-[#0ea5e9] transition-colors p-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-white"
                              title="تعديل"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-white"
                              title="حذف"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-center p-4 text-slate-400 text-sm">لا توجد تصنيفات</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
