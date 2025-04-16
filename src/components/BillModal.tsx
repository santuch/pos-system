"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BillItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface BillModalProps {
  orderId: number;
  tableNumber: string;
  items: BillItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BillModal({ orderId, tableNumber, items, open, onOpenChange }: BillModalProps) {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.07;
  const tax = subtotal * taxRate;
  const grandTotal = subtotal + tax;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bill for Order #{orderId}</DialogTitle>
          <DialogDescription>Table: {tableNumber}</DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Item</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-1 border-t pt-2 text-right">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (7%)</span>
            <span>{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{grandTotal.toFixed(2)}</span>
          </div>
        </div>
        <Button className="mt-4 w-full" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
