export interface Product {
    id: string;
    name: string;
    description: string | null;
    basePrice: string;
    currentPrice: string;
    stockQuantity: number;

}

export interface OrderResponse {
    // Present when the backend returns the order directly (new order, 201)
    id?: string;
    message?: string;
    order?: {
        id: string;
        totalAmount: string;
        status: string;
        idempotencyKey: string;
    };
    error?: string;
}