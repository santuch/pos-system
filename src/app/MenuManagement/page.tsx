"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import SideNav from "@/components/SideNav";
import { Plus, Edit, Trash2, Search } from "lucide-react";

type Ingredient = {
    name: string;
    amount: number;
};

export type MenuItem = {
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
    const [category, setCategory] = useState("Main Dish");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const categories = ["Main Dish", "Drinks", "Desserts"];

    useEffect(() => {
        async function fetchMenuItems() {
            try {
                const response = await fetch("/api/menus");
                if (response.ok) {
                    const data = await response.json();
                    setMenuItems(data);
                } else {
                    const errorData = await response.json();
                    setErrorMessage(errorData.error || "Failed to fetch menu items.");
                }
            } catch (error) {
                console.error("Error fetching menu items:", error);
                setErrorMessage("Failed to fetch menu items. Please check your network connection.");
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
        const ing = menu.ingredients || [];
        console.log("Editing menu, ingredients:", ing);
        setIngredients(ing);
        setShowModal(true);
    };

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                const data = await response.json();
                setImage(data.filePath);
            } else {
                const errorData = await response.json();
                setErrorMessage(errorData.error || "Failed to upload image.");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            setErrorMessage("Something went wrong during image upload.");
        }
    };

    const addIngredient = () => {
        setIngredients([...ingredients, { name: "", amount: 0 }]);
    };

   const updateIngredient = (
        index: number,
        field: keyof Ingredient,
        value: string
    ) => {
        const updatedIngredients = [...ingredients];
        if (field === "amount") {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            alert("Please enter a valid number for the ingredient amount.");
            return;
          }
          updatedIngredients[index] = {
            ...updatedIngredients[index],
            amount: numValue,
          };
        } else {
            updatedIngredients[index] = {
                ...updatedIngredients[index],
                [field]: value,
            }
        }

        setIngredients(updatedIngredients);
    };

    const removeIngredient = (index: number) => {
        const updatedIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(updatedIngredients);
    };

    const handleSaveMenu = async () => {
        if (!menuName || !price || !image) {
            alert(
                "Please fill in all required fields: Name, Price, and Image."
            );
            return;
        }

        const parsedPrice = Number.parseFloat(price);
        if (isNaN(parsedPrice)) {
            alert("Please enter a valid number for price.");
            return;
        }

        const newMenuItem = {
            name: menuName,
            category,
            price: parsedPrice,
            description,
            image_url: image,
            ingredients,
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
                setErrorMessage(null); // Clear any previous error
            } else {
                const errorData = await response.json();
                setErrorMessage(errorData.error || "Failed to save menu item. Please try again.");
            }
        } catch (error) {
            console.error("Error saving menu item:", error);
            setErrorMessage("Something went wrong. Please try again.");
        }
    };

    const handleDeleteMenu = async (id: number) => {
        if (!confirm("Are you sure you want to delete this menu item?")) return;
        try {
            const response = await fetch(`/api/menus/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                refreshMenu();
                setErrorMessage(null);
            } else {
                const errorData = await response.json();
                setErrorMessage(errorData.error || "Failed to delete menu item.");
            }
        } catch (error) {
            console.error("Error deleting menu item:", error);
            setErrorMessage("Something went wrong while deleting the menu item.");
        }
    };

    const refreshMenu = async () => {
      try {
        const response = await fetch("/api/menus");
        const data = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error("Error refreshing menu items:", error);
        setErrorMessage("Failed to refresh menu items. Please check your network connection.");
      }
    };

    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <SideNav />
        <div className="flex-1 overflow-y-auto p-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            Menu Management
          </h2>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}

          <div className="flex justify-between mb-6">
            <div className="relative w-64">
              <Input
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={openCreateMenu}
            >
              <Plus className="mr-2 h-4 w-4" /> Create Menu
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {menuItems
              .filter((item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((menu) => (
                <Card key={menu.id} className="overflow-hidden">
                  <CardHeader className="p-0">
                    <Image
                      src={menu.image_url || "/placeholder.svg"}
                      alt={menu.name}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-xl mb-2">
                      {menu.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {menu.category}
                    </p>
                    <p className="text-lg font-semibold">
                      ${Number(menu.price).toFixed(2)}
                    </p>
                  </CardContent>
                  <CardFooter className="bg-gray-50 dark:bg-gray-800 p-4 flex justify-between">
                    <Button variant="outline" onClick={() => openEditMenu(menu)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteMenu(menu.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Menu Item" : "Create New Menu Item"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image" className="text-right">
                    Image
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right">Ingredients</Label>
                  <div className="col-span-3 space-y-2">
                    {ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Ingredient Name"
                          value={ingredient.name}
                          onChange={(e) =>
                            updateIngredient(index, "name", e.target.value)
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={ingredient.amount}
                          onChange={(e) =>
                            updateIngredient(index, "amount", e.target.value)
                          }
                        />
                        <Button
                          variant="destructive"
                          onClick={() => removeIngredient(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button onClick={addIngredient} variant="outline">
                      <Plus className="mr-2 h-4 w-4" /> Add Ingredient
                    </Button>
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveMenu} className="w-full">
                {editingItem ? "Update Menu Item" : "Save Menu Item"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
}
