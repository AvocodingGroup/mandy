// TypeScript typy pre aplikáciu na manažovanie objednávok

import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  userId: string;
  nickname: string;
  createdAt: Timestamp;
}

// Order Item types
export type ItemType = 'burger' | 'fries';

export interface ItemCustomizations {
  removed: string[];  // ['rajčina', 'uhorka']
  doubled: string[];  // ['mäso']
}

export interface OrderItem {
  itemId: string;
  type: ItemType;
  customizations: ItemCustomizations;
  isPaid: boolean;
  isDelivered: boolean;
}

// Order types
export type OrderStatus = 'waiting' | 'completed';

export interface Order {
  orderId: string;
  orderNumber: number;
  priority: number;
  createdAt: Timestamp;
  completedAt?: Timestamp;  // Čas dokončenia objednávky
  createdBy: string;  // userId
  status: OrderStatus;
  items: OrderItem[];
}

// Comment types
export interface Comment {
  commentId: string;
  text: string;
  authorId: string;
  authorNickname: string;
  isResolved: boolean;
  createdAt: Timestamp;
}

// Settings types
export interface IngredientsSettings {
  ingredients: string[];
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  isActive: boolean;
}

export interface ActiveRecipeSettings {
  recipeName: string;
  ingredients: string[];
}

export interface RecipesSettings {
  recipes: Recipe[];
}

export interface PriceSettings {
  burgerPrice: number;
  friesPrice: number;
}

// Filter types for UI
export type FilterState = 'active' | 'inactive' | 'opposite';

export interface OrderFilters {
  statusFilter: FilterState;  // čakajúce/odovzdané/všetky
  paymentFilter: FilterState; // nezaplatené/zaplatené/všetky
}

// UI Helper types
export interface BurgerCustomization {
  ingredient: string;
  state: 0 | 1 | 2;  // 0x (removed), 1x (normal), 2x (doubled)
}

export interface OrderStats {
  totalBurgers: number;
  totalFries: number;
}

// Helper function to calculate order total
export function calculateOrderTotal(items: OrderItem[], prices: PriceSettings): number {
  return items.reduce((total, item) => {
    if (item.type === 'burger') {
      return total + prices.burgerPrice;
    } else if (item.type === 'fries') {
      return total + prices.friesPrice;
    }
    return total;
  }, 0);
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (nickname: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Gallery types
export interface Photo {
  photoId: string;
  albumId: string;
  url: string;  // Firebase Storage URL
  thumbnailUrl: string;  // Zmenšená verzia pre rýchle načítanie
  fileName: string;
  uploadedAt: Timestamp;
  uploadedBy: string;  // userId
}

export interface Album {
  albumId: string;
  name: string;
  createdAt: Timestamp;
  createdBy: string;  // userId
  photoCount: number;  // Počet fotiek v albume
}

// Expenses types
export interface ExpenseItem {
  itemId: string;
  actionId: string;
  description: string;  // napr. "Kaufland"
  amount: number;  // suma v eurách
  photoId?: string;  // odkaz na fotku z galérie (voliteľné)
  createdAt: Timestamp;
  createdBy: string;  // userId
}

export interface ExpenseAction {
  actionId: string;
  name: string;  // napr. "Halloween 2025"
  createdAt: Timestamp;
  createdBy: string;  // userId
  totalAmount: number;  // celková suma všetkých položiek
  itemCount: number;  // počet položiek
}
