import { useState, useEffect } from "react";
import { ShoppingCart, AlertTriangle, RefreshCw, Zap } from "lucide-react";
import type { Product } from "../types";
import { getProducts, checkoutProduct } from "../features/products/api/productsApi";

export default function DashboardPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [messages, setMessages] = useState<{ [key: string]: string }>({});

    const fetchCatalog = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch products", err);
        }
    };

    useEffect(() => {
        fetchCatalog();
        const interval = setInterval(fetchCatalog, 3000); // Live poll for stock/surge updates
        return () => clearInterval(interval);
    }, []);

    const handleCheckout = async (productId: string) => {
        const idempotencyKey = crypto.randomUUID();

        try {
            const data = await checkoutProduct(productId, 1, idempotencyKey);
            setMessages((prev) => ({
                ...prev,
                [productId]: `Success! Order ID: ${data.order?.id || "Processed"}`,
            }));
            fetchCatalog();
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Checkout failed";
            setMessages((prev) => ({
                ...prev,
                [productId]: `Error: ${errorMsg}`,
            }));
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
                <RefreshCw className="animate-spin w-8 h-8 text-blue-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Zap className="text-yellow-400" /> Flash Sale Engine Dashboard
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Real-time inventory locks & dynamic surge pricing active
                        </p>
                    </div>
                    <button
                        onClick={fetchCatalog}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {products.map((product) => {
                        const isSurged = Number(product.currentPrice) > Number(product.basePrice);
                        const isLowStock = product.stockQuantity <= 5;

                        return (
                            <div
                                key={product.id}
                                className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden"
                            >
                                {isLowStock && product.stockQuantity > 0 && (
                                    <div className="absolute top-0 right-0 bg-red-600 text-white text-xs px-3 py-1 rounded-bl-lg font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Scarcity Surge Active
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                                    <p className="text-gray-400 text-sm mb-4">{product.description}</p>

                                    <div className="flex items-baseline gap-3 mb-4">
                                        <span className="text-2xl font-bold text-green-400">
                                            ${product.currentPrice}
                                        </span>
                                        {isSurged && (
                                            <span className="text-sm text-gray-500 line-through">
                                                Base: ${product.basePrice}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-4 text-sm bg-gray-950 p-3 rounded-lg border border-gray-800 flex justify-between items-center">
                                        <span className="text-gray-400">Available Stock:</span>
                                        <span
                                            className={`font-mono font-bold ${product.stockQuantity === 0
                                                ? "text-red-500"
                                                : product.stockQuantity <= 5
                                                    ? "text-yellow-500"
                                                    : "text-blue-400"
                                                }`}
                                        >
                                            {product.stockQuantity} units
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <button
                                        onClick={() => handleCheckout(product.id)}
                                        disabled={product.stockQuantity === 0}
                                        className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition ${product.stockQuantity === 0
                                            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                                            }`}
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        {product.stockQuantity === 0 ? "Sold Out" : "Buy 1 Unit"}
                                    </button>

                                    {messages[product.id] && (
                                        <p className="text-xs mt-3 text-center text-gray-300 bg-gray-950 p-2 rounded border border-gray-800">
                                            {messages[product.id]}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
