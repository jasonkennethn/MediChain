'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Image as ImageIcon, Save, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';

// Sortable Item Component
function SortableItem({ id, label }: { id: string, label: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-md shadow-sm mb-2 group">
      <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </div>
      <span className="font-medium">{label}</span>
    </div>
  );
}

export function PrescriptionBuilder({ hospitalProfile, onSave }: any) {
  const [headerImage, setHeaderImage] = useState<string | null>(hospitalProfile?.prescription_header || null);
  const [footerImage, setFooterImage] = useState<string | null>(hospitalProfile?.prescription_footer || null);
  
  const [items, setItems] = useState([
    { id: 'patient-details', label: 'Patient Details (Name, Age, Date)' },
    { id: 'vitals', label: 'Vitals (BP, HR, Temp)' },
    { id: 'symptoms', label: 'Symptoms & Diagnosis' },
    { id: 'rx', label: 'Rx (Medicines)' },
    { id: 'tests', label: 'Lab Tests' },
    { id: 'doctor-signature', label: 'Doctor Signature' }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSave = () => {
    const layout = items.map(i => i.id);
    onSave({
      prescription_layout: layout
    });
    toast.success('Prescription format saved successfully');
  };

  // Mock image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'footer') => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a local object URL for preview
      const url = URL.createObjectURL(file);
      if (type === 'header') setHeaderImage(url);
      else setFooterImage(url);
      toast.success(`${type} image uploaded (Preview Mode)`);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-primary" />
          Prescription Format Builder
        </CardTitle>
        <CardDescription>Upload headers and drag to arrange prescription components</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Header Image</Label>
              <div className="flex gap-2">
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'header')} />
              </div>
              {headerImage && (
                <div className="h-20 w-full border rounded flex items-center justify-center overflow-hidden bg-muted">
                  <img src={headerImage} alt="Header" className="object-contain h-full" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Footer Image</Label>
              <div className="flex gap-2">
                <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'footer')} />
              </div>
              {footerImage && (
                <div className="h-12 w-full border rounded flex items-center justify-center overflow-hidden bg-muted">
                  <img src={footerImage} alt="Footer" className="object-contain h-full" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border">
            <Label className="mb-4 block text-base">Arrange Components</Label>
            <p className="text-xs text-muted-foreground mb-4">Drag and drop to reorder how they appear on the printed prescription.</p>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={items}
                strategy={verticalListSortingStrategy}
              >
                {items.map(item => (
                  <SortableItem key={item.id} id={item.id} label={item.label} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} className="shadow-md">
            <Save className="mr-2 h-4 w-4" /> Save Layout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
