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
````

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

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

    Replace `your_username` and `your_database` with your PostgreSQL credentials.

3. **Environment Configuration:**  
   Ensure your environment variables (e.g., in a `.env` file) are correctly configured to connect to your PostgreSQL database.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```

---

This updated README file now provides instructions for setting up the PostgreSQL database using the provided `db/schema.sql` file, making it easy for your coworkers or new team members to get started with the project.
```
