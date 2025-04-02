"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { AlertDialogAction } from "@/components/ui/alert-dialog";
import { AlertDialogCancel } from "@/components/ui/alert-dialog";
import { AlertDialogContent } from "@/components/ui/alert-dialog";
import { AlertDialogDescription } from "@/components/ui/alert-dialog";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { AlertDialogHeader } from "@/components/ui/alert-dialog";
import { AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SideNav from "@/components/SideNav";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";
import CouponForm from "@/components/CouponForm";

type Coupon = {
    id: number;
    code: string;
    discount_type: string;
    discount_value: number;
    start_date: string | null;
    expiration_date: string;
    max_uses: number | null;
    times_used: number;
};

// Define a type for the coupon form data.
// Adjust this type based on the actual data structure you use in CouponForm.
type CouponFormData = Partial<Coupon>;

export default function CouponManagement() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

    const fetchCoupons = async () => {
        try {
            const response = await fetch("/api/coupons");
            if (response.ok) {
                const data = await response.json();
                setCoupons(data);
            } else {
                setMessage("Failed to fetch coupons.");
            }
        } catch {
            setMessage("An error occurred while fetching coupons.");
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleEdit = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`/api/coupons/${id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setMessage("Coupon deleted successfully!");
                fetchCoupons();
            } else {
                const data = await response.json();
                setMessage(data.error || "Failed to delete coupon.");
            }
        } catch {
            setMessage("An error occurred while deleting the coupon.");
        }
    };

    const handleSaveCoupon = async (couponData: CouponFormData) => {
        setLoading(true);
        setMessage("");
        try {
            const url = selectedCoupon
                ? `/api/coupons/${selectedCoupon.id}`
                : "/api/coupons";
            const method = selectedCoupon ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(couponData),
            });

            if (response.ok) {
                const successMessage = selectedCoupon
                    ? "Coupon updated successfully!"
                    : "Coupon created successfully!";
                setMessage(successMessage);
                fetchCoupons();
                setIsDialogOpen(false); // Close the dialog
                setSelectedCoupon(null); // Reset selected coupon
            } else {
                const data = await response.json();
                setMessage(
                    data.error ||
                        `Failed to ${
                            selectedCoupon ? "update" : "create"
                        } coupon.`
                );
            }
        } catch {
            setMessage(
                `An error occurred while ${
                    selectedCoupon ? "updating" : "creating"
                } the coupon.`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <SideNav />
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Coupon Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Dialog
                            open={isDialogOpen}
                            onOpenChange={setIsDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button>Add Coupon</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    {selectedCoupon
                                        ? "Edit Coupon"
                                        : "Add Coupon"}
                                </DialogTitle>
                                <CouponForm
                                    coupon={selectedCoupon}
                                    onSave={handleSaveCoupon}
                                    onCancel={() => {
                                        setIsDialogOpen(false);
                                        setSelectedCoupon(null);
                                    }}
                                    isLoading={loading}
                                />
                                {message && <p>{message}</p>}
                            </DialogContent>
                        </Dialog>

                        <Card>
                            <CardHeader>
                                <CardTitle>Existing Coupons</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead>
                                                Expiration Date
                                            </TableHead>
                                            <TableHead>Max Uses</TableHead>
                                            <TableHead>Times Used</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {coupons.map((coupon) => (
                                            <TableRow key={coupon.id}>
                                                <TableCell>
                                                    {coupon.code}
                                                </TableCell>
                                                <TableCell>
                                                    {coupon.discount_type}
                                                </TableCell>
                                                <TableCell>
                                                    {coupon.discount_value}
                                                </TableCell>
                                                <TableCell>
                                                    {coupon.start_date
                                                        ? new Date(
                                                              coupon.start_date
                                                          ).toLocaleString()
                                                        : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        coupon.expiration_date
                                                    ).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {coupon.max_uses ?? "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {coupon.times_used}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="mr-2"
                                                        onClick={() =>
                                                            handleEdit(coupon)
                                                        }
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />{" "}
                                                        Edit
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                            >
                                                                Delete
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Are you
                                                                    sure?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action
                                                                    cannot be
                                                                    undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            coupon.id
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
