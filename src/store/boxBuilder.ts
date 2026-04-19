import { create } from "zustand";
import { BoxType, BoxBuilderItem, WrappingOption, NoteStyle, CustomBoxItem } from "@/types";

interface BoxBuilderState {
  // Current state
  currentStep: number;
  selectedBox: BoxType | null;
  items: CustomBoxItem[];
  message: string;
  selectedWrapping: WrappingOption | null;
  selectedNoteStyle: NoteStyle | null;
  
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  selectBox: (box: BoxType) => void;
  addItem: (item: BoxBuilderItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  setMessage: (message: string) => void;
  selectWrapping: (wrapping: WrappingOption | null) => void;
  selectNoteStyle: (noteStyle: NoteStyle | null) => void;
  reset: () => void;
  
  // Computed
  getUsedCapacity: () => number;
  getRemainingCapacity: () => number;
  getItemsTotal: () => number;
  getTotal: () => number;
  canAddItem: (item: BoxBuilderItem) => boolean;
}

const initialState = {
  currentStep: 1,
  selectedBox: null,
  items: [],
  message: "",
  selectedWrapping: null,
  selectedNoteStyle: null,
};

export const useBoxBuilderStore = create<BoxBuilderState>((set, get) => ({
  ...initialState,

  setStep: (step: number) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < 5) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  selectBox: (box: BoxType) => {
    const { selectedBox } = get();
    // If changing box type, clear items if they exceed capacity
    if (selectedBox && selectedBox.id !== box.id) {
      const usedCapacity = get().getUsedCapacity();
      if (usedCapacity > box.capacity) {
        set({ selectedBox: box, items: [] });
        return;
      }
    }
    set({ selectedBox: box });
  },

  addItem: (item: BoxBuilderItem, quantity = 1) => {
    const { items, selectedBox } = get();
    if (!selectedBox) return;

    const existingItem = items.find(i => i.item.id === item.id);
    const usedCapacity = get().getUsedCapacity();
    
    // Check if we can add more
    const additionalCapacity = item.capacityUnits * quantity;
    if (usedCapacity + additionalCapacity > selectedBox.capacity) {
      // Can only add partial
      const remainingCapacity = selectedBox.capacity - usedCapacity;
      const canAddUnits = Math.floor(remainingCapacity / item.capacityUnits);
      if (canAddUnits <= 0) return;
      
      if (existingItem) {
        set({
          items: items.map(i =>
            i.item.id === item.id
              ? { ...i, quantity: i.quantity + canAddUnits }
              : i
          ),
        });
      } else {
        set({ items: [...items, { item, quantity: canAddUnits }] });
      }
      return;
    }

    if (existingItem) {
      set({
        items: items.map(i =>
          i.item.id === item.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ),
      });
    } else {
      set({ items: [...items, { item, quantity }] });
    }
  },

  removeItem: (itemId: string) => {
    set(state => ({
      items: state.items.filter(i => i.item.id !== itemId),
    }));
  },

  updateItemQuantity: (itemId: string, quantity: number) => {
    const { selectedBox, items } = get();
    if (!selectedBox || quantity <= 0) return;

    const item = items.find(i => i.item.id === itemId);
    if (!item) return;

    // Check capacity for new quantity
    const otherItemsCapacity = items
      .filter(i => i.item.id !== itemId)
      .reduce((sum, i) => sum + i.item.capacityUnits * i.quantity, 0);
    
    const maxQuantity = Math.floor(
      (selectedBox.capacity - otherItemsCapacity) / item.item.capacityUnits
    );
    
    const newQuantity = Math.min(quantity, maxQuantity);
    
    set(state => ({
      items: state.items.map(i =>
        i.item.id === itemId ? { ...i, quantity: newQuantity } : i
      ),
    }));
  },

  setMessage: (message: string) => set({ message }),

  selectWrapping: (wrapping: WrappingOption | null) => set({ selectedWrapping: wrapping }),
  
  selectNoteStyle: (noteStyle: NoteStyle | null) => set({ selectedNoteStyle: noteStyle }),

  reset: () => set(initialState),

  getUsedCapacity: () => {
    const { items } = get();
    return items.reduce((sum, i) => sum + i.item.capacityUnits * i.quantity, 0);
  },

  getRemainingCapacity: () => {
    const { selectedBox } = get();
    if (!selectedBox) return 0;
    return selectedBox.capacity - get().getUsedCapacity();
  },

  getItemsTotal: () => {
    const { items } = get();
    return items.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
  },

  getTotal: () => {
    const { selectedBox, items, selectedWrapping, selectedNoteStyle } = get();
    if (!selectedBox) return 0;
    
    const boxPrice = selectedBox.basePrice;
    const itemsTotal = items.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
    const wrappingPrice = selectedWrapping?.price || 0;
    const notePrice = selectedNoteStyle?.price || 0;
    
    return boxPrice + itemsTotal + wrappingPrice + notePrice;
  },

  canAddItem: (item: BoxBuilderItem) => {
    const { selectedBox } = get();
    if (!selectedBox) return false;
    
    const remainingCapacity = get().getRemainingCapacity();
    return remainingCapacity >= item.capacityUnits;
  },
}));
