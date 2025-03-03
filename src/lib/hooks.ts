import { useState, useEffect } from 'react';

type Ingredient = {
    quantity: number;
    threshold: number;
};

export function useLowStockWarning() {
    const [isLowStock, setIsLowStock] = useState(false);

    useEffect(() => {
        async function checkIngredients() {
            try {
                const res = await fetch("/api/ingredients");
                if (!res.ok) {
                    console.error("Failed to fetch ingredients");
                    return;
                }
                const data: Ingredient[] = await res.json();
                const lowStock = data.some(
                    (ing) => Number(ing.quantity) < Number(ing.threshold)
                );
                setIsLowStock(lowStock);
            } catch (error) {
                console.error("Error checking ingredients:", error);
            }
        }

        checkIngredients();
    }, []);

    return isLowStock;
}