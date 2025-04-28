# POS System API Documentation

This document provides a comprehensive overview of the backend API endpoints that power the POS system.

## Table of Contents

1. [Menu Management](#1-menu-management)
2. [Ingredient Management](#2-ingredient-management)
3. [Order Processing](#3-order-processing)
4. [Payment Processing](#4-payment-processing)
5. [Store Analytics](#5-store-analytics)
6. [Frontend–Backend Interaction](#6-frontend-backend-interaction)

## 1. Menu Management

### GET `/api/menus`

**Purpose**: Retrieves all menu items with their associated ingredients.

**Response Format**:
```json
[
  {
    "id": 1,
    "name": "Pad Thai",
    "category": "Main Course",
    "price": 120,
    "description": "Classic Thai stir-fried noodles",
    "image_url": "/images/pad-thai.jpg",
    "created_at": "2025-04-01T10:00:00Z",
    "updated_at": "2025-04-01T10:00:00Z",
    "ingredients": [
      {
        "id": 1,
        "name": "Rice noodles",
        "quantity": 5000,
        "unit": "g",
        "threshold": 1000,
        "amount": 200
      },
      {
        "id": 2,
        "name": "Bean sprouts",
        "quantity": 2000,
        "unit": "g",
        "threshold": 500,
        "amount": 50
      }
    ]
  }
]
```

**SQL Query**:
```sql
SELECT
  m.id,
  m.name,
  m.category,
  m.price,
  m.description,
  m.image_url,
  m.created_at,
  m.updated_at,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', i.id,
        'name', i.name,
        'quantity', i.quantity,
        'unit', i.unit,
        'threshold', i.threshold,
        'amount', mii.amount_required
      )
    ) FILTER (WHERE i.id IS NOT NULL),
    '[]'
  ) AS ingredients
FROM menus m
LEFT JOIN menu_item_ingredients mii ON m.id = mii.menu_item_id
LEFT JOIN ingredients i ON mii.ingredient_id = i.id
GROUP BY m.id
ORDER BY m.created_at DESC;
```

**Explanation**:
- Joins `menus` with `menu_item_ingredients` and `ingredients` to get all ingredient details for each menu item.
- Aggregates ingredient info into a JSON array for each menu.
- Includes menu fields and a nested `ingredients` array.

### POST `/api/menus`

**Purpose**: Creates a new menu item and associates it with ingredients.

**Request Format**:
```json
{
  "name": "Green Curry",
  "category": "Main Course",
  "price": 150,
  "description": "Spicy Thai green curry with vegetables",
  "image_url": "/images/green-curry.jpg",
  "ingredients": [
    {
      "id": 5,
      "name": "Coconut milk",
      "amount": 100
    },
    {
      "name": "Green curry paste",
      "amount": 20
    }
  ]
}
```

**SQL Flow**:
1. Insert new menu:
```sql
INSERT INTO menus (name, category, price, description, image_url)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
```
2. For each ingredient:
    - Check for existence:
    ```sql
    SELECT id FROM ingredients WHERE LOWER(name) = $1 LIMIT 1;
    ```
    - If not found, insert:
    ```sql
    INSERT INTO ingredients (name, quantity, unit, threshold)
    VALUES ($1, 0, 'unit', 0)
    RETURNING id;
    ```
    - Link ingredient to menu:
    ```sql
    INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, amount_required)
    VALUES ($1, $2, $3);
    ```

**Explanation**:
- Adds a menu item and associates it with ingredients.
- New ingredients are created as needed.
- All actions are wrapped in a transaction for consistency.

### PUT/PATCH `/api/menus/[id]`

**Purpose**: Updates an existing menu item and its associated ingredients.

**Request Format**:
```json
{
  "name": "Green Curry",
  "category": "Main Course",
  "price": 150,
  "description": "Spicy green curry with chicken",
  "image_url": "/images/green-curry.jpg",
  "ingredients": [
    { "name": "Chicken", "amount": 100 },
    { "name": "Green curry paste", "amount": 20 }
  ]
}
```

**SQL Flow**:
1. Update menu item:
```sql
UPDATE menus SET name = $1, category = $2, price = $3, description = $4, image_url = $5, updated_at = NOW()
WHERE id = $6 RETURNING *;
```
2. Remove old ingredient links:
```sql
DELETE FROM menu_item_ingredients WHERE menu_item_id = $1;
```
3. For each ingredient in the new list:
    - Check for existence:
    ```sql
    SELECT id FROM ingredients WHERE LOWER(name) = $1 LIMIT 1;
    ```
    - If not found, insert:
    ```sql
    INSERT INTO ingredients (name, quantity, unit, threshold)
    VALUES ($1, 0, 'unit', 0)
    RETURNING id;
    ```
    - Link ingredient to menu:
    ```sql
    INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, amount_required)
    VALUES ($1, $2, $3);
    ```

**Explanation**:
- Updates menu details and resets all ingredient associations.
- Ensures all new/updated ingredients exist, creating them if needed.
- All actions are wrapped in a transaction for consistency.

### DELETE `/api/menus/[id]`

**Purpose**: Deletes a menu item and its ingredient associations.

**SQL Flow**:
1. Check if menu exists:
```sql
SELECT id FROM menus WHERE id = $1;
```
2. Delete ingredient associations:
```sql
DELETE FROM menu_item_ingredients WHERE menu_item_id = $1;
```
3. Delete the menu item:
```sql
DELETE FROM menus WHERE id = $1;
```

**Explanation**:
- Ensures the menu exists before deleting.
- Removes all links to ingredients, then deletes the menu itself.
- All actions are wrapped in a transaction for data integrity.

## 2. Ingredient Management

### GET `/api/ingredients`

**Purpose**: Retrieves all ingredients, prioritizing those closest to or below their threshold.

**Response Format**:
```json
[
  {
    "id": 3,
    "name": "Chicken",
    "quantity": 500,
    "unit": "g",
    "threshold": 1000,
    "created_at": "2025-04-01T10:00:00Z",
    "updated_at": "2025-04-01T10:00:00Z"
  }
]
```

**SQL Query**:
```sql
SELECT * FROM ingredients ORDER BY quantity-threshold ASC;
```

**Explanation**:
- Returns all ingredients, sorted by how close they are to their threshold (low stock first).

### POST `/api/ingredients`

**Purpose**: Creates a new ingredient in the inventory system.

**Request Format**:
```json
{
  "name": "Lemongrass",
  "quantity": 500,
  "unit": "g",
  "threshold": 100
}
```

**SQL Flow**:
1. Check for existing ingredient:
```sql
SELECT id FROM ingredients WHERE LOWER(name) = LOWER($1);
```
2. Insert new ingredient if not found:
```sql
INSERT INTO ingredients (name, quantity, unit, threshold)
VALUES (LOWER($1), $2, $3, $4)
RETURNING *;
```

**Explanation**:
- Prevents duplicates by checking for case-insensitive name match.
- Adds new ingredient with initial stock, unit, and threshold.

### PATCH `/api/ingredients/[id]`

**Purpose**: Updates the stock quantity of an existing ingredient (for restocking).

**Request Format**:
```json
{
  "amount": 500
}
```

**SQL Query**:
```sql
UPDATE ingredients
SET quantity = quantity + $1, updated_at = NOW()
WHERE id = $2
RETURNING *;
```

**Explanation**:
- Increases the stock for an ingredient by a given amount.
- Updates the timestamp for inventory tracking.

### DELETE `/api/ingredients/[id]`

**Purpose**: Deletes an ingredient from the system (with safety checks).

**SQL Flow**:
1. Check if ingredient exists:
```sql
SELECT id FROM ingredients WHERE id = $1;
```
2. Check if used in any menu items:
```sql
SELECT COUNT(*) as count FROM menu_item_ingredients WHERE ingredient_id = $1;
```
3. Delete if unused:
```sql
DELETE FROM ingredients WHERE id = $1;
```

**Explanation**:
- Ensures ingredients in use by menus cannot be deleted.
- Deletes only if safe.

## 3. Order Processing

### GET `/api/orders`

**Purpose**: Retrieves all orders with their line items.

**SQL Query**:
```sql
SELECT
  o.id,
  o.table_number,
  o.number_of_customers,
  o.total_price,
  o.status,
  o.created_at,
  o.updated_at,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', oi.id,
        'name', m.name,
        'price', oi.price_at_order,
        'quantity', oi.quantity
      )
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'
  ) AS items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN menus m ON oi.menu_item_id = m.id
GROUP BY o.id
ORDER BY o.created_at DESC;
```

**Explanation**:
- See above for detailed breakdown.

### POST `/api/orders`

**Purpose**: Creates a new order and automatically updates ingredient inventory.

**SQL Transaction**:
1. Begin:
```sql
BEGIN;
```
2. Insert order:
```sql
INSERT INTO orders (table_number, number_of_customers, total_price, status)
VALUES ($1, $2, $3, 'in-progress')
RETURNING *;
```
3. For each item:
    - Insert item:
    ```sql
    INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order)
    VALUES ($1, $2, $3, $4);
    ```
    - Fetch recipe:
    ```sql
    SELECT ingredient_id, amount_required FROM menu_item_ingredients WHERE menu_item_id = $1;
    ```
    - Deduct inventory:
    ```sql
    UPDATE ingredients SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2;
    ```
4. Commit:
```sql
COMMIT;
```

**Explanation**:
- Places a new order and deducts ingredient stock for each menu item ordered.
- Rolls back if any step fails.

## 4. Payment Processing

### POST `/api/create-checkout-session`

**Purpose**: Creates a Stripe checkout session for processing payments.

**Request Format**:
```json
{
  "orderId": 1,
  "amount": 45000,
  "currency": "thb"
}
```
Note: Amount is in smallest currency unit (e.g., cents/satang)

**Stripe API Call** (not SQL):
- Creates a Stripe checkout session with order details and returns a payment URL.

**Explanation**:
- No direct SQL. Relies on Stripe's API for payment session creation.

### POST `/api/webhooks/stripe`

**Purpose**: Handles Stripe webhook notifications to update order status and record payments.

**SQL Flow** (after Stripe webhook):
1. Update order status:
```sql
UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1;
```
2. Insert payment record:
```sql
INSERT INTO payments (order_id, stripe_session_id, payment_intent_id, payment_method, payment_status)
VALUES ($1, $2, $3, $4, 'succeeded');
```

**Explanation**:
- Marks the order as paid and records the payment in the database.
- Ensures payment and order data are linked.

## 5. Store Analytics

### GET `/api/store-analytics`

**Purpose**: Provides analytics data for the store dashboard.

**Query Parameters**:
- `range`: Time period for data (day, week, month, year)

**Response Format**:
```json
{
  "orders": [...],
  "dailySales": [
    {
      "date": "2025-04-21",
      "totalSales": 1250
    },
    {
      "date": "2025-04-22",
      "totalSales": 1450
    }
  ],
  "topItems": [
    {
      "name": "Pad Thai",
      "totalQuantity": 15,
      "totalRevenue": 1800
    }
  ],
  "salesHistory": [...],
  "totalCustomers": 25,
  "previousPeriod": {
    "totalSales": 1100,
    "totalOrders": 12
  }
}
```

**SQL Examples**:

- **Fetch paid orders (with date filter):**
```sql
SELECT o.*, p.created_at AS paid_at, COALESCE(p.payment_method, 'N/A') AS payment_method
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
WHERE o.status = 'paid' AND o.created_at >= NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;
```
- **Daily sales aggregation:**
```sql
SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, SUM(total_price) AS "totalSales"
FROM orders
WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY date
ORDER BY date;
```
- **Top items:**
```sql
SELECT m.name, SUM(oi.quantity) AS "totalQuantity", SUM(oi.quantity * oi.price_at_order) AS "totalRevenue"
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN menus m ON oi.menu_item_id = m.id
WHERE o.status = 'paid' AND o.created_at >= NOW() - INTERVAL '7 days'
GROUP BY m.name
ORDER BY "totalQuantity" DESC
LIMIT 5;
```
- **Total customers:**
```sql
SELECT COALESCE(SUM(number_of_customers), 0) AS total FROM orders WHERE status = 'paid' AND created_at >= NOW() - INTERVAL '7 days';
```

**Explanation**:
- Dynamically filters by time range (day, week, month, year)
- Aggregates total sales, orders, customers, and top-selling items
- Used for dashboard analytics and business intelligence

## 6. Frontend–Backend Interaction

This section describes how Next.js frontend components interact with the backend API.

### Key Patterns:
1. **Data Fetching**: Components use `fetch` with React hooks (`useEffect`, `useState`)
2. **Authentication**: JWT tokens included in Authorization headers
3. **Error Handling**: Global error handler shows toast notifications
4. **Loading States**: Skeleton loaders during API requests

### Component-Endpoint Mapping with Actions

#### Menu Management
- **Fetch Menus** (`GET /api/menus`)
  - **When**: Page load
  - **What Happens**: Menus are loaded and displayed in a table/list
  - **Code:**
    ```js
    useEffect(() => {
      fetch('/api/menus')
        .then(res => res.json())
        .then(setMenus);
    }, []);
    // setMenus updates the UI with fetched menu items
    ```
  - **After Action**: Menus are displayed in the UI, with loading state removed.
    ```js
    // Example code to update UI
    return (
      <div>
        {menus.map(menu => (
          <div key={menu.id}>{menu.name}</div>
        ))}
      </div>
    );
    ```
- **Create Menu** (`POST /api/menus`)
  - **When**: User submits the Add Menu form
  - **What Happens**: Menu is added, UI refreshes, success message shown
  - **Code:**
    ```js
    fetch('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuData)
    })
      .then(res => res.json())
      .then(() => {
        showSuccessToast('Menu created');
        refreshMenus(); // re-fetches and updates menu list
      });
    ```
  - **After Action**: Success message is shown, and the menu list is refreshed.
    ```js
    showSuccessToast('Menu created');
    ```
- **Edit Menu** (`PUT /api/menus/[id]` or `PATCH /api/menus/[id]`)
  - **When**: User submits the Edit Menu form
  - **What Happens**: Menu details are updated, UI refreshes, success message shown
  - **Code:**
    ```js
    fetch(`/api/menus/${id}`, {
      method: 'PUT', // or 'PATCH'
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMenuData)
    })
      .then(res => res.json())
      .then(() => {
        showSuccessToast('Menu updated');
        refreshMenus();
      });
    ```
  - **After Action**: Success message is shown, and the menu list is refreshed with updated data.
    ```js
    showSuccessToast('Menu updated');
    ```
- **Delete Menu** (`DELETE /api/menus/[id]`)
  - **When**: User confirms deletion (e.g., clicks Delete button and confirms)
  - **What Happens**: Menu is removed, UI refreshes, success message shown
  - **Code:**
    ```js
    fetch(`/api/menus/${id}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(() => {
        showSuccessToast('Menu deleted');
        refreshMenus();
      });
    ```
  - **After Action**: Success message is shown, and the menu list is refreshed without the deleted item.
    ```js
    showSuccessToast('Menu deleted');
    ```

#### Ingredient Management
- **Fetch Ingredients** (`GET /api/ingredients`)
  - **When**: Page load
  - **What Happens**: Ingredients are displayed in inventory list
  - **Code:**
    ```js
    useEffect(() => {
      fetch('/api/ingredients')
        .then(res => res.json())
        .then(setIngredients);
    }, []);
    // setIngredients updates the UI
    ```
  - **After Action**: Ingredients are displayed in the UI, with loading state removed.
    ```js
    // Example code to update UI
    return (
      <div>
        {ingredients.map(ingredient => (
          <div key={ingredient.id}>{ingredient.name}</div>
        ))}
      </div>
    );
    ```
- **Add Ingredient** (`POST /api/ingredients`)
  - **When**: Add Ingredient form submit
  - **What Happens**: Ingredient is added, list refreshes, success message
  - **Code:**
    ```js
    fetch('/api/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ingredientData)
    })
      .then(res => res.json())
      .then(() => {
        showSuccessToast('Ingredient added');
        refreshIngredients();
      });
    ```
  - **After Action**: Success message is shown, and the ingredient list is refreshed.
    ```js
    showSuccessToast('Ingredient added');
    ```

#### Order Processing
- **Place Order** (`POST /api/orders`)
  - **When**: Cart checkout/submit order
  - **What Happens**: Order is created, confirmation shown, cart cleared
  - **Code:**
    ```js
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })
      .then(res => res.json())
      .then(order => {
        showOrderConfirmation(order);
        clearCart();
      });
    ```
  - **After Action**: Order confirmation is shown, and the cart is cleared.
    ```js
    showOrderConfirmation(order);
    ```

#### Payment Processing
- **Create Checkout Session** (`POST /api/create-checkout-session`)
  - **When**: Pay Now button click
  - **What Happens**: Redirects to Stripe checkout page
  - **Code:**
    ```js
    fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount })
    })
      .then(res => res.json())
      .then(({ url }) => window.location.href = url);
    ```
  - **After Action**: User is redirected to the Stripe checkout page.
    ```js
    // No additional code needed
    ```

#### Store Analytics (Dashboard)
- **Fetch Analytics** (`GET /api/store-analytics`)
  - **When**: Dashboard load or time range change
  - **What Happens**: Charts/metrics updated in UI
  - **Code:**
    ```js
    useEffect(() => {
      fetch(`/api/store-analytics?range=${selectedRange}`)
        .then(res => res.json())
        .then(setAnalytics);
    }, [selectedRange]);
    // setAnalytics updates dashboard charts
    ```
  - **After Action**: Charts and metrics are updated in the UI.
    ```js
    // Example code to update UI
    return (
      <div>
        <Chart data={analytics.data} />
      </div>
    );
    ```

---

**Note:**
- All API calls are made using `fetch` with JSON payloads and responses.
- Error handling is done by checking HTTP status and showing alerts/snackbars in the UI.
- Loading states are managed with skeleton loaders and spinners.
- Data is refreshed on user action (e.g., refresh button, successful form submit).

{{ ... }}
