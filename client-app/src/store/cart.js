import { create } from "zustand";

export const useCart = create((set, get) => ({
    items: [],
    
    add: (product) => {
        const items = [...get().items];
        const exist = items.find((i) => i.id === product.id);
        if (exist) exist.qty++;
        else items.push({ ...product, qty: 1 });
        set({ items });
    },
    
    remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
    clear: () => set({ items: [] }),
    
    total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0)
}));