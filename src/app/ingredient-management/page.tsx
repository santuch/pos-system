"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Package, Pencil, Trash } from "lucide-react";
import SideNav from "@/components/SideNav";

type Ingredient = {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    threshold: number;
};

export default function IngredientManagement() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingIngredient, setEditingIngredient] =
        useState<Ingredient | null>(null);

    const [ingredientName, setIngredientName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [threshold, setThreshold] = useState("");

    const [showAddStockModal, setShowAddStockModal] = useState(false);
    const [selectedIngredient, setSelectedIngredient] =
        useState<Ingredient | null>(null);
    const [addStockAmount, setAddStockAmount] = useState("");

    useEffect(() => {
        fetchIngredients();
    }, []);

    const fetchIngredients = async () => {
        try {
            const res = await fetch("/api/ingredients");
            if (!res.ok) throw new Error("Failed to fetch ingredients");
            const data = await res.json();
            console.log("Fetched ingredients:", data); // <-- Add this
            setIngredients(data);
        } catch (error) {
            console.error("Error fetching ingredients:", error);
        }
    };

    const refreshIngredients = async () => {
        try {
            const res = await fetch("/api/ingredients");
            const data = await res.json();
            setIngredients(data);
        } catch (error) {
            console.error("Error refreshing ingredients:", error);
        }
    };

    const openCreateIngredient = () => {
        setIngredientName("");
        setQuantity("");
        setUnit("");
        setThreshold("");
        setEditingIngredient(null);
        setShowModal(true);
    };

    const openEditIngredient = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setIngredientName(ingredient.name);
        setQuantity(ingredient.quantity.toString());
        setUnit(ingredient.unit);
        setThreshold(ingredient.threshold.toString());
        setShowModal(true);
    };

    const handleSaveIngredient = async () => {
        if (!ingredientName || !quantity || !unit || !threshold) {
            alert(
                "Please fill in all required fields: Name, Quantity, Unit, and Threshold."
            );
            return;
        }

        const newIngredient = {
            name: ingredientName,
            quantity: Number.parseFloat(quantity),
            unit,
            threshold: Number.parseFloat(threshold),
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

    const openAddStockModalForIngredient = (ingredient: Ingredient) => {
        setSelectedIngredient(ingredient);
        setAddStockAmount("");
        setShowAddStockModal(true);
    };

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

    const filteredIngredients = ingredients.filter((ing) =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen">
            {/* SideNav on the left */}
            <SideNav />

            {/* Main content area */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                <h1 className="text-2xl font-semibold mb-6">
                    Ingredient Management
                </h1>

                {/* Global warning banner if any ingredient is low */}
                {ingredients.some(
                    (ing) => Number(ing.quantity) < Number(ing.threshold)
                ) && (
                    <div className="bg-red-100 text-red-700 p-4 mb-4 rounded-md">
                        Warning: Some ingredients are low on stock. Please
                        restock soon.
                    </div>
                )}

                {/* Search and Create Ingredient */}
                <div className="flex justify-between items-center mb-8">
                    <div className="relative w-80">
                        <Input
                            placeholder="Search ingredients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                        <svg
                            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <Button
                        onClick={openCreateIngredient}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Ingredient
                    </Button>
                </div>

                {/* Ingredient Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {filteredIngredients.map((ingredient) => (
                        <Card key={ingredient.id} className="bg-white">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold">
                                        {ingredient.name}
                                    </h3>
                                    {Number(ingredient.quantity) <
                                    Number(ingredient.threshold) ? (
                                        <span className="px-2 py-1 text-sm bg-red-50 text-red-700 rounded-md">
                                            Restock Needed
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-sm bg-emerald-50 text-emerald-700 rounded-md">
                                            In Stock
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-2 text-gray-600">
                                    <p>
                                        Quantity: {ingredient.quantity}{" "}
                                        {ingredient.unit}
                                    </p>
                                    <p>
                                        Low Stock Threshold:{" "}
                                        {ingredient.threshold}
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter className="grid grid-cols-3 gap-2 p-4 bg-gray-50">
                                <Button
                                    variant="outline"
                                    className="flex items-center justify-center"
                                    onClick={() =>
                                        openAddStockModalForIngredient(
                                            ingredient
                                        )
                                    }
                                >
                                    <Package className="w-4 h-4 mr-2" />
                                    Add Stock
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex items-center justify-center"
                                    onClick={() =>
                                        openEditIngredient(ingredient)
                                    }
                                >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() =>
                                        handleDeleteIngredient(ingredient.id)
                                    }
                                >
                                    <Trash className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                {filteredIngredients.length === 0 && (
                    <p className="text-center text-gray-500 mt-8">
                        No ingredients found.
                    </p>
                )}

                {/* Modal for Creating/Editing an Ingredient */}
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>
                                {editingIngredient
                                    ? "Edit Ingredient"
                                    : "Add New Ingredient"}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={ingredientName}
                                    onChange={(e) =>
                                        setIngredientName(e.target.value)
                                    }
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="quantity"
                                    className="text-right"
                                >
                                    Quantity
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(e.target.value)
                                    }
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="unit" className="text-right">
                                    Unit
                                </Label>
                                <Input
                                    id="unit"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="threshold"
                                    className="text-right"
                                >
                                    Threshold
                                </Label>
                                <Input
                                    id="threshold"
                                    type="number"
                                    value={threshold}
                                    onChange={(e) =>
                                        setThreshold(e.target.value)
                                    }
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSaveIngredient}
                            className="w-full"
                        >
                            {editingIngredient
                                ? "Update Ingredient"
                                : "Save Ingredient"}
                        </Button>
                    </DialogContent>
                </Dialog>

                {/* Modal for Adding Stock */}
                <Dialog
                    open={showAddStockModal}
                    onOpenChange={setShowAddStockModal}
                >
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>
                                Add Stock for {selectedIngredient?.name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                    htmlFor="addStock"
                                    className="text-right"
                                >
                                    Amount
                                </Label>
                                <Input
                                    id="addStock"
                                    type="number"
                                    value={addStockAmount}
                                    onChange={(e) =>
                                        setAddStockAmount(e.target.value)
                                    }
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <Button onClick={handleAddStock} className="w-full">
                            Confirm
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
