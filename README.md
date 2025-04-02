# Next.js POS System

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

---

## Database Setup

This project uses PostgreSQL as its database. All the necessary tables for the POS system are defined in the SQL schema file located in the `db` folder.

### How to Set Up the Database

1. **Locate the Schema File:**  
   The schema file is located at: `db/schema.sql`.

2. **Run the SQL Script:**  
   Use your preferred PostgreSQL client or the command line to execute the script. For example, using `psql`:

    ```bash
    psql -U your_username -d your_database -f db/schema.sql
    ```

    Replace `your_username` and `your_database` with your PostgreSQL credentials. This script creates the following tables:
    - **menus**
    - **ingredients**
    - **menu_item_ingredients** (pivot table linking menus and ingredients)
    - **orders** (includes fields for order status, Stripe integration, and customer info)

---

## Environment Variables

Create a file named `.env` (or `.env.local` for local development) in the project root. It should contain the following variables:

```env
# Database Configuration
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db_name

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_yourSecretKey
STRIPE_PUBLISHABLE_KEY=pk_test_yourPublishableKey
STRIPE_WEBHOOK_SECRET=whsec_yourWebhookSecret

```

- **DATABASE_URL** is used to connect to your PostgreSQL database.
- **STRIPE_SECRET_KEY**, **STRIPE_PUBLISHABLE_KEY**, and **STRIPE_WEBHOOK_SECRET** are required for Stripe payment integration and webhook verification.

Fill in the empty values with your actual credentials and keys.

---

## Stripe Integration & Webhooks

For payment processing, this project uses Stripe. Your coworkers will need to:

1. **Set Up Stripe Keys:**  
   Make sure to add your Stripe API keys and webhook secret to the `.env` file as shown above.

2. **(Optional) Install and Use Stripe CLI for Local Webhook Testing:**  
   - Download the Stripe CLI for your OS from [Stripe CLI Releases](https://github.com/stripe/stripe-cli/releases).
   - Add the executable to your system PATH if needed.
   - Log in with:
     ```bash
     stripe login
     ```
   - Forward webhook events to your local development server:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhooks/stripe
     ```

---

## Additional Features & Dashboard

The project includes a Store Dashboard that displays analytics such as:
- **Total Orders, Total Sales, Average Order Value, Total Customers, etc.**
- **Daily Sales Chart:** Built with Recharts and wrapped in a responsive container.
- **Sales History Table:** With CSV and PDF export functionality.
- **Top-Selling Items:** Aggregated from the orders data.

For full details, see the documentation in the `app/store` directory. The dashboard is designed with shadcn/ui components to provide a modern, responsive interface.

---

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Next.js GitHub Repository](https://github.com/vercel/next.js) - for feedback and contributions.

---

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).  
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
