"use server";
import { z } from "zod";
import { Invoice } from "./definitions";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const InvoiceSchema = z.object({
  customerId: z.string({
    invalid_type_error: "customer ID is required",
  }),
  amount: z.coerce.number().gt(0, "Amount must be greater than 0"),
  status: z.enum(["pending", "paid"], {
    invalid_type_error: "One of statuses must be selected",
  }),
  id: z.string(),
  date: z.string(),
});
const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export const createInvoice = async (prevState: State, formData: FormData) => {
  // throw new Error("test");
  console.log(formData);
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  if (!validatedFields.success) {
    console.log(validatedFields);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { amount, customerId, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  try {
    // throw new Error("Test");
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error: any) {
    console.log(error);
    // return error;
    // Or
    // return {
    //   message: error,
    // };
    // Or
    // return {
    //   message: new Error("internal"),
    // };
    return {
      // message: error,
      message: "Cannot insert into DB",
    };
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
};

// Use Zod to update the expected types
const UpdateInvoice = InvoiceSchema.omit({ date: true });

// ...

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData
) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  if (!validatedFields.success) {
    console.log(validatedFields);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { amount, customerId, status } = validatedFields.data;

    const amountInCents = amount * 100;

    console.log("start");
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  } catch (error) {
    return { message: "cannot update item in db" };
  }

  console.log("done");
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath("/dashboard/invoices");
}
