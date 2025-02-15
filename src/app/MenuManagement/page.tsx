"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import SideNav from "@/components/SideNav";

type Ingredient = {
    name: string;
    amount: number;
};

type MenuItem = {
    id: number;
    name: string;
    category: string;
    price: number;
    description: string;
    image_url: string;
    ingredients?: Ingredient[];
};

export default function MenuManagement() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    const [menuName, setMenuName] = useState("");
    const [category, setCategory] = useState("Main Course");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    const categories = [
        "Breakfast",
        "Soups",
        "Pasta",
        "Main Course",
        "Drinks",
        "Desserts",
    ];

    useEffect(() => {
        async function fetchMenuItems() {
            const response = await fetch("/api/menus");
            if (response.ok) {
                const data = await response.json();
                setMenuItems(data);
            } else {
                console.error("Failed to fetch menu items");
            }
        }
        fetchMenuItems();
    }, []);

    const openCreateMenu = () => {
        setMenuName("");
        setCategory("Main Course");
        setPrice("");
        setDescription("");
        setImage("");
        setIngredients([]);
        setEditingItem(null);
        setShowModal(true);
    };

    const openEditMenu = (menu: MenuItem) => {
        setEditingItem(menu);
        setMenuName(menu.name);
        setCategory(menu.category);
        setPrice(menu.price.toString());
        setDescription(menu.description);
        setImage(menu.image_url);
        setIngredients(menu.ingredients || []);
        setShowModal(true);
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            setImage(data.filePath);
        } else {
            alert("Failed to upload image.");
        }
    };

    // --- Ingredient handlers ---
    const addIngredient = () => {
        setIngredients([...ingredients, { name: "", amount: 0 }]);
    };

    const updateIngredient = (
        index: number,
        field: keyof Ingredient,
        value: string
    ) => {
        const updatedIngredients = [...ingredients];
        updatedIngredients[index] = {
            ...updatedIngredients[index],
            [field]: field === "amount" ? Number(value) : value,
        };
        setIngredients(updatedIngredients);
    };

    const removeIngredient = (index: number) => {
        const updatedIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(updatedIngredients);
    };
    // --- End Ingredient handlers ---

    const handleSaveMenu = async () => {
        if (!menuName || !price || !image) {
            alert(
                "Please fill in all required fields: Name, Price, and Image."
            );
            return;
        }

        const newMenuItem = {
            name: menuName,
            category,
            price: parseFloat(price),
            description,
            image_url: image,
            ingredients, // include the ingredient list
        };

        try {
            let response;
            if (editingItem) {
                response = await fetch(`/api/menus/${editingItem.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newMenuItem),
                });
            } else {
                response = await fetch("/api/menus", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newMenuItem),
                });
            }

            if (response.ok) {
                alert(editingItem ? "Menu item updated!" : "Menu item added!");
                setShowModal(false);
                refreshMenu();
            } else {
                alert("Failed to save menu item. Please try again.");
            }
        } catch (error) {
            console.error("Error saving menu item:", error);
            alert("Something went wrong. Please try again.");
        }
    };

    const handleDeleteMenu = async (id: number) => {
        if (!confirm("Are you sure you want to delete this menu item?")) return;
        try {
            const response = await fetch(`/api/menus/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert("Menu item deleted!");
                refreshMenu();
            } else {
                alert("Failed to delete menu item.");
            }
        } catch (error) {
            console.error("Error deleting menu item:", error);
            alert("Something went wrong.");
        }
    };

    const refreshMenu = async () => {
        const response = await fetch("/api/menus");
        const data = await response.json();
        setMenuItems(data);
    };

    return (
        <div className="flex h-screen">
            <SideNav />
            <div className="flex-1 overflow-y-auto p-4">
                <h2 className="text-xl font-bold mb-4">Menu Management</h2>
                {/* Search & Create Button */}
                <div className="flex justify-between mb-4">
                    <Input
                        placeholder="Search menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button
                        className="bg-green-500 hover:bg-green-600"
                        onClick={openCreateMenu}
                    >
                        Create Menu
                    </Button>
                </div>
                {/* Menu Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {menuItems
                        .filter((item) =>
                            item.name
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                        )
                        .map((menu) => (
                            <div
                                key={menu.id}
                                className="border rounded-lg p-2 flex flex-col items-center"
                            >
                                <Image
                                    src={menu.image_url}
                                    alt={menu.name}
                                    width={100}
                                    height={100}
                                    className="object-contain rounded-md"
                                />
                                <div className="mt-2 text-center">
                                    <h3 className="font-semibold">
                                        {menu.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        ${Number(menu.price).toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => openEditMenu(menu)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() =>
                                            handleDeleteMenu(menu.id)
                                        }
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                </div>
                {/* Modal for Create/Edit */}
                {showModal && (
                    <Dialog open={showModal} onOpenChange={setShowModal}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingItem
                                        ? "Edit Menu Item"
                                        : "Create New Menu Item"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Menu Name"
                                    value={menuName}
                                    onChange={(e) =>
                                        setMenuName(e.target.value)
                                    }
                                />
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={category}
                                    onChange={(e) =>
                                        setCategory(e.target.value)
                                    }
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    type="number"
                                    placeholder="Price ($)"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                />
                                <Textarea
                                    placeholder="Description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                {/* Ingredients Section */}
                                <div className="border p-2 rounded-md">
                                    <h3 className="font-bold mb-2">
                                        Ingredients
                                    </h3>
                                    {ingredients.map((ingredient, index) => (
                                        <div
                                            key={index}
                                            className="flex gap-2 mb-2"
                                        >
                                            <Input
                                                placeholder="Ingredient Name"
                                                value={ingredient.name}
                                                onChange={(e) =>
                                                    updateIngredient(
                                                        index,
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Input
                                                type="number"
                                                placeholder="Amount"
                                                value={ingredient.amount}
                                                onChange={(e) =>
                                                    updateIngredient(
                                                        index,
                                                        "amount",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            <Button
                                                variant="destructive"
                                                onClick={() =>
                                                    removeIngredient(index)
                                                }
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                                    <Button onClick={addIngredient}>
                                        Add Ingredient
                                    </Button>
                                </div>
                                <Button
                                    className="w-full bg-blue-500 hover:bg-blue-600"
                                    onClick={handleSaveMenu}
                                >
                                    {editingItem
                                        ? "Update Menu Item"
                                        : "Save Menu Item"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}
