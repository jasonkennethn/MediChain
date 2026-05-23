'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Pill, Search, Loader2, Plus, AlertTriangle, MapPin, 
  Trash2, Edit, Save, ArrowUpDown, ChevronDown, Check, X
} from 'lucide-react';
import { 
  apiGetPharmacyInventory, apiAddPharmacyInventoryItem, 
  apiUpdatePharmacyInventoryItem, apiDeletePharmacyInventoryItem 
} from '@/lib/api';

// Pre-defined medicines list for suggestions
const SUGGESTED_MEDICINES = [
  'Paracetamol 500mg', 'Paracetamol 650mg', 'Ibuprofen 400mg', 'Ibuprofen 200mg',
  'Amoxicillin 500mg', 'Amoxicillin 250mg', 'Azithromycin 500mg', 'Azithromycin 250mg',
  'Cetirizine 10mg', 'Levocetirizine 5mg', 'Montelukast 10mg', 'Montelukast 5mg',
  'Pantoprazole 40mg', 'Omeprazole 20mg', 'Ranitidine 150mg', 'Domperidone 10mg',
  'Metformin 500mg', 'Metformin 1000mg', 'Glimepiride 1mg', 'Glimepiride 2mg',
  'Amlodipine 5mg', 'Amlodipine 10mg', 'Telmisartan 40mg', 'Losartan 50mg',
  'Atorvastatin 10mg', 'Atorvastatin 20mg', 'Rosuvastatin 10mg', 'Rosuvastatin 5mg',
  'Clopidogrel 75mg', 'Aspirin 75mg', 'Dolo 650', 'Combiflam', 'Crocin 500mg',
  'Allegra 120mg', 'Allegra 180mg', 'Augmentin 625mg', 'Cefixime 200mg', 
  'Ciprofloxacin 500mg', 'Ofloxacin 200mg', 'Doxycycline 100mg', 'Metronidazole 400mg',
  'Fluconazole 150mg', 'Prednisolone 5mg', 'Prednisolone 10mg', 'Deflazacort 6mg'
];

export default function PharmacyInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editLoc, setEditLoc] = useState('');

  // Add stock state
  const [showAddForm, setShowAddForm] = useState(false);
  const [medName, setMedName] = useState('');
  const [stockQty, setStockQty] = useState('100');
  const [location, setLocation] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    const data = await apiGetPharmacyInventory();
    if (Array.isArray(data)) {
      setInventory(data);
    }
    setLoading(false);
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !stockQty) {
      toast.error('Please fill in medicine name and stock quantity');
      return;
    }
    const qty = parseInt(stockQty, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Invalid stock quantity');
      return;
    }

    setFormLoading(true);
    const result = await apiAddPharmacyInventoryItem({
      medicine_name: medName.trim(),
      stock_quantity: qty,
      location: location.trim() || undefined
    });
    setFormLoading(false);

    if (result && !result.error) {
      toast.success('Medicine added to inventory successfully');
      setShowAddForm(false);
      setMedName('');
      setStockQty('100');
      setLocation('');
      loadInventory();
    } else {
      toast.error(result?.error || 'Failed to add medicine');
    }
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditQty(item.stock_quantity.toString());
    setEditLoc(item.location || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id: string) => {
    const qty = parseInt(editQty, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    const success = await apiUpdatePharmacyInventoryItem(id, {
      stock_quantity: qty,
      location: editLoc.trim()
    });

    if (success) {
      toast.success('Inventory item updated successfully');
      setEditingId(null);
      loadInventory();
    } else {
      toast.error('Failed to update inventory item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this medicine from inventory?')) return;
    const success = await apiDeletePharmacyInventoryItem(id);
    if (success) {
      toast.success('Medicine removed from inventory');
      loadInventory();
    } else {
      toast.error('Failed to delete item');
    }
  };

  const filteredInventory = inventory.filter((item) => {
    if (searchTerm) {
      return item.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const lowStockItems = inventory.filter(item => item.stock_quantity < 10);
  const filteredSuggestions = SUGGESTED_MEDICINES.filter(med => 
    med.toLowerCase().includes(medName.toLowerCase()) && 
    med.toLowerCase() !== medName.toLowerCase()
  ).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Quick Add */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" /> Inventory Dashboard
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Monitor stocks, update quantities, and flag low-running medicines.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="shadow-md shadow-primary/20 gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add New Medicine
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 animate-slide-down">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-700">Low Stock Warning</p>
            <p className="text-amber-700/80 mt-0.5">
              The following medicines have less than 10 units remaining and need urgent restock:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {lowStockItems.map(item => (
                <Badge key={item.id} variant="outline" className="bg-background text-amber-600 border-amber-500/30 font-bold text-[9px]">
                  {item.medicine_name} ({item.stock_quantity})
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add New Stock Form */}
      {showAddForm && (
        <Card className="border-primary/20 shadow-md animate-slide-down">
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Add Medicine Stock
            </CardTitle>
            <CardDescription className="text-[11px]">List a new medicine or update initial batches in stock</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAddInventory} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
              <div className="space-y-1 relative">
                <Label className="text-xs">Medicine Name *</Label>
                <Input 
                  placeholder="Search or enter custom name"
                  value={medName}
                  onChange={(e) => { setMedName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  required
                  className="h-9 text-xs"
                />
                {showSuggestions && medName && filteredSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((med, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors flex items-center gap-1.5"
                        onClick={() => { setMedName(med); setShowSuggestions(false); }}
                      >
                        <Pill className="h-3 w-3 text-primary" /> {med}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stock Quantity *</Label>
                <Input 
                  type="number"
                  min="0"
                  placeholder="E.g. 100"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Shelf Location / Rack</Label>
                <Input 
                  placeholder="E.g. Shelf A4"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="h-9 w-full text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading} size="sm" className="h-9 w-full text-xs">
                  {formLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and Table Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Pill className="h-4.5 w-4.5 text-primary" /> Medicine Stock Registry
            </CardTitle>
            <CardDescription className="text-[11px]">List of all pharmaceutical supplies currently available in stock</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search stock..." 
              className="pl-9 h-8 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-xs">
              No inventory records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b text-muted-foreground font-semibold">
                    <th className="p-3 text-left">Medicine Name</th>
                    <th className="p-3 text-center">Stock Quantity</th>
                    <th className="p-3 text-left">Shelf Location</th>
                    <th className="p-3 text-center no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredInventory.map((item) => {
                    const isEditing = editingId === item.id;
                    const isLow = item.stock_quantity < 10;
                    return (
                      <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-semibold text-foreground flex items-center gap-2 min-w-[200px]">
                          <Pill className={`h-4 w-4 ${isLow ? 'text-amber-500' : 'text-primary'}`} />
                          <span>{item.medicine_name}</span>
                        </td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <Input 
                              type="number"
                              min="0"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              className="h-8 w-20 text-center mx-auto text-xs"
                            />
                          ) : (
                            <Badge 
                              variant={isLow ? 'destructive' : 'secondary'}
                              className="font-bold text-xs"
                            >
                              {item.stock_quantity} units
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Input 
                              value={editLoc}
                              onChange={(e) => setEditLoc(e.target.value)}
                              className="h-8 text-xs max-w-[150px]"
                            />
                          ) : (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {item.location || 'Not Placed'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center no-print min-w-[100px]">
                          {isEditing ? (
                            <div className="flex justify-center gap-1.5">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleSaveEdit(item.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/5" onClick={() => handleStartEdit(item)}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/5" onClick={() => handleDeleteItem(item.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
