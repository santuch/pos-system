import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Form, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";

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

type CouponFormProps = {
    coupon?: Coupon | null;
    onSave: (couponData: Omit<Coupon, "id" | "times_used">) => void;
    onCancel: () => void;
    isLoading: boolean;
};

type CouponFormValues = {
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: string;
    start_date: string;
    expiration_date: string;
    max_uses: string;
};

function formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1)
        .toString()
        .padStart(2, "0")}-${date
        .getUTCDate()
        .toString()
        .padStart(2, "0")}T${date
        .getUTCHours()
        .toString()
        .padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`;
}

const CouponForm: React.FC<CouponFormProps> = ({
    coupon,
    onSave,
    onCancel,
    isLoading,
}) => {
    const form = useForm<CouponFormValues>({
        defaultValues: {
            code: coupon?.code || "",
            discount_type:
                (coupon?.discount_type as "percentage" | "fixed") ||
                "percentage",
            discount_value: coupon?.discount_value?.toString() || "",
            start_date: formatDateForInput(coupon?.start_date),
            expiration_date: formatDateForInput(coupon?.expiration_date) || "",
            max_uses: coupon?.max_uses ? coupon.max_uses.toString() : "",
        },
    });

    const onSubmit = (data: CouponFormValues) => {
        const couponData: Omit<Coupon, "id" | "times_used"> = {
            code: data.code,
            discount_type: data.discount_type,
            discount_value: parseFloat(data.discount_value),
            start_date: data.start_date ? data.start_date : null,
            expiration_date: data.expiration_date,
            max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        };
        onSave(couponData);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    Code
                    <FormControl>
                        <Input
                            type="text"
                            placeholder="Enter coupon code"
                            {...form.register("code", {
                                required: "Code is required",
                            })}
                        />
                    </FormControl>
                </div>

                <div>
                    Discount Type
                    <Select
                        onValueChange={(value) =>
                            form.setValue(
                                "discount_type",
                                value as "percentage" | "fixed"
                            )
                        }
                        defaultValue={form.getValues("discount_type")}
                    >
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select discount type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="percentage">
                                Percentage
                            </SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    Discount Value
                    <FormControl>
                        <Input
                            type="number"
                            placeholder="Enter discount value"
                            {...form.register("discount_value", {
                                required: "Discount Value is required",
                            })}
                        />
                    </FormControl>
                </div>

                <div>
                    Start Date (optional)
                    <FormControl>
                        <Input
                            type="datetime-local"
                            {...form.register("start_date")}
                        />
                    </FormControl>
                </div>

                <div>
                    Expiration Date
                    <FormControl>
                        <Input
                            type="datetime-local"
                            {...form.register("expiration_date", {
                                required: "Expiration Date is required",
                            })}
                        />
                    </FormControl>
                </div>

                <div>
                    Max Uses (optional)
                    <FormControl>
                        <Input type="number" {...form.register("max_uses")} />
                    </FormControl>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {coupon
                            ? isLoading
                                ? "Updating..."
                                : "Update"
                            : isLoading
                            ? "Creating..."
                            : "Create"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default CouponForm;
