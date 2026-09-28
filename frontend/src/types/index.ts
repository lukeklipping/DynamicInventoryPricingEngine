export interface Product {
    id: string;
    name: string;
    description: string | null;
    basePrice: string;
    currentPrice: string;

}

export interface OrderResponse {
    id: string;

}