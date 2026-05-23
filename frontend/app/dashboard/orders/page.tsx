'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  FileText, Search, Loader2, CheckCircle2, XCircle, Clock, Plus, 
  Pill, User, ShoppingBag, Trash2 
} from 'lucide-react';
import { apiGetPharmacyOrders, apiCreatePharmacyOrder, apiUpdatePharmacyOrderStatus } from '@/lib/api';

export default function PharmacyOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'dispensed' | 'cancelled'>('pending');

  // Form states for manual walk-in order
  const [showAddForm, setShowAddForm] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await apiGetPharmacyOrders();
    if (Array.isArray(data)) {
      setOrders(data);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: 'dispensed' | 'cancelled') => {
    const success = await apiUpdatePharmacyOrderStatus(id, status);
    if (success) {
      toast.success(`Order successfully marked as ${status}`);
      loadOrders();
    } else {
      toast.error('Failed to update order status');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !medicineName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setFormLoading(true);
    const result = await apiCreatePharmacyOrder({
      patient_name: patientName.trim(),
      medicine_name: medicineName.trim(),
      quantity: qty,
      status: 'pending'
    });
    setFormLoading(false);

    if (result && !result.error) {
      toast.success('Pharmacy order created successfully');
      setShowAddForm(false);
      setPatientName('');
      setMedicineName('');
      setQuantity('1');
      loadOrders();
    } else {
      toast.error(result?.error || 'Failed to create order');
    }
  };

  const filteredOrders = orders.filter((order) => {
    // Tab Filter
    if (filterTab !== 'all' && order.status !== filterTab) return false;

    // Search query
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      return (
        order.patient_name?.toLowerCase().includes(query) ||
        order.medicine_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" /> Order Management
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Process incoming prescriptions and manual walk-in orders.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} className="shadow-md shadow-primary/20 gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" /> Create Walk-in Order
        </Button>
      </div>

      {/* Manual Order Creation Form */}
      {showAddForm && (
        <Card className="border-primary/20 shadow-md animate-slide-down">
          <CardHeader className="bg-primary/5 pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Log Walk-in Order
            </CardTitle>
            <CardDescription className="text-[11px]">Fill details to record a manual pharmacy request</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleCreateOrder} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Patient Name *</Label>
                <Input 
                  placeholder="Enter patient full name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Medicine Name *</Label>
                <Input 
                  placeholder="E.g. Paracetamol 650mg"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Qty *</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="flex items-end gap-1.5">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="h-9 w-full text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading} size="sm" className="h-9 w-full text-xs">
                    {formLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Log'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by patient or medicine name..." 
            className="pl-9 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['pending', 'dispensed', 'cancelled', 'all'] as const).map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={filterTab === tab ? 'default' : 'outline'}
              className="text-xs capitalize shrink-0 h-9"
              onClick={() => setFilterTab(tab)}
            >
              {tab === 'pending' && <Clock className="h-3.5 w-3.5 mr-1" />}
              {tab === 'dispensed' && <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
              {tab === 'cancelled' && <XCircle className="h-3.5 w-3.5 mr-1" />}
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto opacity-30 mb-2" />
            <p className="font-semibold text-sm">No pharmacy orders found</p>
            <p className="text-xs mt-1">There are no orders matching the current filter state.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="border-border/50 shadow-sm hover:border-primary/20 hover:shadow-md transition-all">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 truncate">
                        <User className="h-4 w-4 text-primary shrink-0" /> {order.patient_name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">
                        Order ID: <span className="font-mono text-[9px]">{order.id.slice(0, 8)}...</span> • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        order.status === 'pending' ? 'default' : 
                        order.status === 'dispensed' ? 'secondary' : 'destructive'
                      }
                      className="text-[9px] tracking-wider uppercase shrink-0"
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/40 text-xs">
                    <Pill className="h-4.5 w-4.5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{order.medicine_name}</p>
                      <p className="text-[10px] text-muted-foreground">Quantity Ordered: {order.quantity} units</p>
                    </div>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 text-xs text-destructive border-destructive/20 hover:bg-destructive/10 h-8"
                      onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                      onClick={() => handleUpdateStatus(order.id, 'dispensed')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Dispense
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
