import { useState, useEffect } from 'react';

export type LowStockIngredient = {
    name: string;
    quantity: number;
    threshold: number;
    severity: 'low' | 'critical';
};

export function useLowStockWarning() {
    const [items, setItems] = useState<LowStockIngredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function checkIngredients() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/ingredients");
            if (!res.ok) {
                setError("Failed to fetch ingredients");
                setLoading(false);
                return;
            }
            const data = await res.json();
            // Expecting ingredient: { name, quantity, threshold }
            const lowStockItems = (data as { name: string; quantity: number; threshold: number }[]).filter((ing) => Number(ing.quantity) < Number(ing.threshold)).map((ing) => ({
                name: ing.name,
                quantity: ing.quantity,
                threshold: ing.threshold,
                severity: Number(ing.quantity) < Number(ing.threshold) / 2 ? ('critical' as const) : ('low' as const),
            }));
            setItems(lowStockItems);
        } catch {
            setError('Error checking ingredients');
        }
        setLoading(false);
    }

    useEffect(() => {
        checkIngredients();
        // Poll every 60 seconds
        const interval = setInterval(checkIngredients, 60000);
        return () => clearInterval(interval);
    }, []);

    return { items, loading, error, checkIngredients };
}