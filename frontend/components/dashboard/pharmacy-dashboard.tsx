'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill, Plus, TrendingUp } from 'lucide-react';

export function PharmacyDashboard({
  handleScanPrescription,
  scanPatient,
  setScanPatient,
  scanMedicine,
  setScanMedicine,
  scanQty,
  setScanQty,
  pharmacyOrders,
  handleDispense,
  handleAddInventory,
  addInvName,
  setAddInvName,
  addInvStock,
  setAddInvStock,
  addInvLoc,
  setAddInvLoc,
  pharmacyInventory
}: any) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Prescription Scan Simulator */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-accent" />
                <span>Simulate Prescription Order</span>
              </CardTitle>
              <CardDescription>Simulates receiving/scanning a patient prescription</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScanPrescription} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="scanPatient">Patient Name</Label>
                    <Input id="scanPatient" placeholder="e.g. John Doe" value={scanPatient} onChange={(e) => setScanPatient(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="scanMedicine">Medicine Name</Label>
                    <Input id="scanMedicine" placeholder="e.g. Paracetamol 500mg" value={scanMedicine} onChange={(e) => setScanMedicine(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="scanQty">Quantity</Label>
                    <Input id="scanQty" type="number" min="1" value={scanQty} onChange={(e) => setScanQty(Number(e.target.value))} required />
                  </div>
                </div>
                <Button type="submit" variant="outline" className="w-full border-accent/30 hover:bg-accent/5 hover:border-accent/50 text-accent">
                  <Plus className="mr-1 h-4 w-4" /> Scan & Record Prescription
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Orders Queue */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Prescription Order Queue</CardTitle>
              <CardDescription>Manage active orders and dispatch status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pharmacyOrders?.map((order: any) => (
                  <div key={order.id} className="p-3 border border-border/50 rounded-lg flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-foreground">{order.medicine} x {order.quantity}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Patient: {order.patient} | {order.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="text-xs" variant={order.status === 'Dispensed' ? 'secondary' : 'default'}>
                        {order.status}
                      </Badge>
                      {order.status === 'Pending' && (
                        <Button size="sm" onClick={() => handleDispense(order.id)}>
                          Dispense
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Inventory */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-accent" />
                <span>Store Inventory</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add inventory form */}
              <form onSubmit={handleAddInventory} className="space-y-3 p-3 bg-muted/40 rounded-lg border border-border/50">
                <p className="text-xs font-semibold text-foreground">Add Stock Item</p>
                <Input placeholder="Medicine name" size="sm" className="h-8 text-xs" value={addInvName} onChange={(e) => setAddInvName(e.target.value)} required />
                <div className="flex gap-2">
                  <Input placeholder="Qty" type="number" min="1" className="h-8 text-xs flex-1" value={addInvStock} onChange={(e) => setAddInvStock(Number(e.target.value))} required />
                  <Input placeholder="Loc (e.g. A1)" className="h-8 text-xs flex-1" value={addInvLoc} onChange={(e) => setAddInvLoc(e.target.value)} />
                </div>
                <Button type="submit" size="sm" className="w-full text-xs h-8">Add Stock</Button>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {pharmacyInventory?.map((item: any) => (
                  <div key={item.id} className="p-2.5 border border-border/40 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Location: {item.location}</p>
                    </div>
                    <Badge variant={item.stock < 50 ? 'destructive' : 'outline'} className="text-[10px]">
                      {item.stock} in stock
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
