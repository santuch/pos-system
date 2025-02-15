"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import SideNav from "@/components/SideNav";

// Define the Ingredient type
type Ingredient = {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    threshold: number;
};

export default function IngredientManagement() {
    // Main ingredient list and search/filter state
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingIngredient, setEditingIngredient] =
        useState<Ingredient | null>(null);

    // Form fields for creating/updating an ingredient
    const [ingredientName, setIngredientName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [threshold, setThreshold] = useState("");

    // State for Add Stock modal
    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [selectedIngredient, setSelectedIngredient] =
        useState<Ingredient | null>(null);
    const [addStockAmount, setAddStockAmount] = useState("");

    // Fetch ingredients from the API when the component mounts
    useEffect(() => {
        async function fetchIngredients() {
            try {
                const res = await fetch("/api/ingredients");
                if (!res.ok) throw new Error("Failed to fetch ingredients");
                const data = await res.json();
                setIngredients(data);
            } catch (error) {
                console.error("Error fetching ingredients:", error);
            }
        }
        fetchIngredients();
    }, []);

    // Refresh ingredient list
    const refreshIngredients = async () => {
        const res = await fetch("/api/ingredients");
        const data = await res.json();
        setIngredients(data);
    };

    // Open the modal to create a new ingredient
    const openCreateIngredient = () => {
        setIngredientName("");
        setQuantity("");
        setUnit("");
        setThreshold("");
        setEditingIngredient(null);
        setShowModal(true);
    };

    // Open the modal to edit an existing ingredient
    const openEditIngredient = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setIngredientName(ingredient.name);
        setQuantity(ingredient.quantity.toString());
        setUnit(ingredient.unit);
        setThreshold(ingredient.threshold.toString());
        setShowModal(true);
    };

    // Handle saving (creating/updating) an ingredient
    const handleSaveIngredient = async () => {
        if (!ingredientName || !quantity || !unit || !threshold) {
            alert(
                "Please fill in all required fields: Name, Quantity, Unit, and Threshold."
            );
            return;
        }

        const newIngredient = {
            name: ingredientName,
            quantity: parseFloat(quantity),
            unit,
            threshold: parseFloat(threshold),
        };

        try {
            let response;
            if (editingIngredient) {
                response = await fetch(
                    `/api/ingredients/${editingIngredient.id}`,
                    {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newIngredient),
                    }
                );
            } else {
                response = await fetch("/api/ingredients", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newIngredient),
                });
            }

            if (response.ok) {
                alert(
                    editingIngredient
                        ? "Ingredient updated!"
                        : "Ingredient added!"
                );
                setShowModal(false);
                refreshIngredients();
            } else {
                alert("Failed to save ingredient. Please try again.");
            }
        } catch (error) {
            console.error("Error saving ingredient:", error);
            alert("Something went wrong. Please try again.");
        }
    };

    // Handle deleting an ingredient
    const handleDeleteIngredient = async (id: number) => {
        if (!confirm("Are you sure you want to delete this ingredient?"))
            return;
        try {
            const res = await fetch(`/api/ingredients/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                alert("Ingredient deleted!");
                refreshIngredients();
            } else {
                alert("Failed to delete ingredient.");
            }
        } catch (error) {
            console.error("Error deleting ingredient:", error);
            alert("Something went wrong.");
        }
    };

    // Open the Add Stock modal for a specific ingredient
    const openAddStockModal = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        setAddStockAmount("");
        setShowAddStockModal(true);
    };

    // Handle adding stock to the selected ingredient
    const handleAddStock = async () => {
        if (!addStockAmount || isNaN(Number(addStockAmount))) {
            alert("Please enter a valid number for stock amount.");
            return;
        }
        if (!selectedIngredient) return;

        try {
            const res = await fetch(
                `/api/ingredients/${selectedIngredient.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: Number(addStockAmount) }),
                }
            );
            if (res.ok) {
                alert("Stock updated successfully!");
                setShowAddStockModal(false);
                refreshIngredients();
            } else {
                alert("Failed to update stock. Please try again.");
            }
        } catch (error) {
            console.error("Error updating stock:", error);
            alert("Something went wrong. Please try again.");
        }
    };

    // Filter ingredients based on search term
    const filteredIngredients = ingredients.filter((ing) =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen">
            <SideNav />
            <div className="flex-1 overflow-y-auto p-4">
                <h2 className="text-xl font-bold mb-4">
                    Ingredient Management
                </h2>
                {/* Search and Add Ingredient button */}
                <div className="flex justify-between mb-4">
                    <Input
                        placeholder="Search ingredients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                        className="bg-green-500 hover:bg-green-600"
                        onClick={openCreateIngredient}
                    >
                        Add Ingredient
                    </Button>
                </div>
                {/* Ingredient list */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredIngredients.map((ingredient) => (
                        <div
                            key={ingredient.id}
                            className="border rounded-lg p-4 flex flex-col"
                        >
                            <h3 className="font-semibold text-lg">
                                {ingredient.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Quantity: {ingredient.quantity}{" "}
                                {ingredient.unit}
                            </p>
                            <p className="text-sm text-gray-500">
                                Low Stock Threshold: {ingredient.threshold}
                            </p>
                            <div className="mt-2 flex gap-2">
                                <Button
                                    variant="default"
                                    onClick={() =>
                                        openAddStockModal(ingredient)
                                    }
                                >
                                    Add Stock
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        openEditIngredient(ingredient)
                                    }
                                >
                                    Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() =>
                                        handleDeleteIngredient(ingredient.id)
                                    }
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))}
                    {filteredIngredients.length === 0 && (
                        <p className="text-center text-gray-500 col-span-full">
                            No ingredients found.
                        </p>
                    )}
                </div>

                {/* Modal for Adding/Editing an Ingredient */}
                {showModal && (
                    <Dialog open={showModal} onOpenChange={setShowModal}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingIngredient
                                        ? "Edit Ingredient"
                                        : "Add New Ingredient"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Ingredient Name
                                </label>
                                <Input
                                    placeholder="e.g., Meat"
                                    value={ingredientName}
                                    onChange={(e) =>
                                        setIngredientName(e.target.value)
                                    }
                                />
                                <label className="block text-sm font-medium text-gray-700">
                                    Quantity
                                </label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 10"
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(e.target.value)
                                    }
                                />
                                <label className="block text-sm font-medium text-gray-700">
                                    Unit of Measurement
                                </label>
                                <Input
                                    placeholder="e.g., kg, liters, pieces"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                />
                                <label className="block text-sm font-medium text-gray-700">
                                    Low Stock Threshold
                                </label>
                                <Input
                                    type="number"
                                    placeholder="e.g., 5"
                                    value={threshold}
                                    onChange={(e) =>
                                        setThreshold(e.target.value)
                                    }
                                />
                                <Button
                                    className="w-full bg-blue-500 hover:bg-blue-600"
                                    onClick={handleSaveIngredient}
                                >
                                    {editingIngredient
                                        ? "Update Ingredient"
                                        : "Save Ingredient"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Modal for Adding Stock */}
                {showAddStockModal && selectedIngredient && (
                    <Dialog
                        open={showAddStockModal}
                        onOpenChange={setShowAddStockModal}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Add Stock for {selectedIngredient.name}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Amount to Add
                                </label>
                                <Input
                                    type="number"
                                    placeholder="Enter stock amount to add"
                                    value={addStockAmount}
                                    onChange={(e) =>
                                        setAddStockAmount(e.target.value)
                                    }
                                />
                                <Button
                                    className="w-full bg-blue-500 hover:bg-blue-600"
                                    onClick={handleAddStock}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}
