import { apiClient } from "../../../services/apiClient";
import type { OrderResponse, Product } from "../../../types/index"

export const getProducts = async (): Promise<Product[]> => {
    const response = await apiClient.get("/products");
    return response.data
}

export const checkoutProduct = async (productId: string, quantity: number, idempotencyKey: string): Promise<OrderResponse> => {
    const response = await apiClient.post<OrderResponse>("/checkout", {
        productId,
        quantity,
        idempotencyKey,
    });
    return response.data;
};
