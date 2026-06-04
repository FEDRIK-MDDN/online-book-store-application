# 🚀 Quick Start - Orders Management

## How to Use the New Orders Management Feature

### 1. Start Your Application

```bash
# Terminal 1 - Start Backend (Spring Boot)
cd backend
./mvnw spring-boot:run
# Backend runs on http://localhost:8080

# Terminal 2 - Start Frontend (React)
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

---

### 2. Login as Admin

1. Go to: `http://localhost:3000/login`
2. Enter admin credentials:
   - **Email:** admin@bookstore.com
   - **Password:** admin123
3. Click "Login"

---

### 3. Access Orders Management

1. You'll be redirected to **Admin Dashboard**
2. On the **left sidebar**, click **"📦 Orders"**
3. The **Orders Management page** loads on the right side

---

### 4. View All Orders

You'll see:
- **Statistics cards** at the top:
  - Total Orders
  - New Orders (Pending)
  - Completed Orders (Delivered)
  - Cancelled Orders
  
- **Search and filters**:
  - Search box (search by name, order ID, product)
  - Status dropdown (filter by status)
  - Date range picker (filter by date)

- **Orders table** showing:
  - Product image and name
  - Customer info with avatar
  - Order ID and date
  - Total amount
  - **Status dropdown** ← KEY FEATURE
  - Action buttons

---

### 5. Change Order Status (Main Feature!)

For any order in the table:

1. Find the **"Status"** column
2. Click the **dropdown** (shows current status)
3. Select new status:
   - **Pending** (🟠 Orange) - Order received, not yet processed
   - **Processing** (🔵 Blue) - Order is being prepared
   - **Shipped** (🟣 Purple) - Order has been shipped
   - **Delivered** (🟢 Green) - Order delivered to customer
   - **Cancelled** (🔴 Red) - Order cancelled

4. Status updates **immediately**:
   - ✅ Backend database updated
   - ✅ UI updates with new status
   - ✅ User's order history shows new status
   - ✅ Alert confirms success

---

### 6. Filter Orders

#### By Status:
- Click **"All Status"** dropdown
- Select: Pending, Processing, Shipped, Delivered, or Cancelled
- Table shows only orders with that status

#### By Search:
- Type in search box
- Searches: Customer name, Email, Order ID, Product name
- Results update in real-time

#### By Date:
- Select "From" date
- Select "To" date
- Shows orders within that date range

---

### 7. User Side Effect

When you change order status, the user automatically sees it:

1. **User logs in** to their account
2. Goes to **"My Orders"** or **"Order History"**
3. Sees **updated status** for their order
4. No page refresh needed!

Example:
```
Admin changes:  Order #12345 → "Shipped"
User sees:      Order #12345 → Status: 📦 SHIPPED
```

---

## 🎯 Common Admin Workflows

### Workflow 1: Process New Orders
```
1. Click "All Status" → Select "Pending"
2. Review new orders
3. For each order:
   - Change status to "Processing"
4. Orders are now being prepared
```

### Workflow 2: Ship Orders
```
1. Click "All Status" → Select "Processing"
2. See orders ready to ship
3. For each shipped order:
   - Change status to "Shipped"
4. Customers see tracking status
```

### Workflow 3: Mark as Delivered
```
1. Click "All Status" → Select "Shipped"
2. See orders in transit
3. When customer confirms receipt:
   - Change status to "Delivered"
4. Order lifecycle complete!
```

### Workflow 4: Cancel Order
```
1. Customer requests cancellation
2. Find the order (use search)
3. Change status to "Cancelled"
4. Process refund separately
```

---

## 📊 Testing the Feature

### Test Case 1: Create Order as User
```
1. Logout from admin
2. Login as regular user
3. Add books to cart
4. Checkout and place order
5. Order starts with status: "Pending"
```

### Test Case 2: Update Status as Admin
```
1. Login as admin
2. Go to Orders Management
3. Find the test order
4. Change status: Pending → Processing
5. Verify: Alert shows "Order status updated successfully!"
```

### Test Case 3: Verify User Sees Update
```
1. Logout from admin
2. Login as the user who placed order
3. Go to "My Orders" / Order History
4. Verify: Order status shows "Processing"
5. Success! ✅
```

---

## 🔧 Troubleshooting

### Issue: Orders not loading
**Solution:**
- Check backend is running on port 8080
- Open browser console (F12)
- Look for API errors
- Verify admin token is valid

### Issue: Status dropdown not updating
**Solution:**
- Check backend endpoint: `PUT /admin/orders/{id}/status`
- Verify JWT token in request headers
- Check backend logs for errors

### Issue: User doesn't see updated status
**Solution:**
- Have user refresh their order history page
- Check database: `SELECT * FROM orders WHERE id = ?`
- Verify orderStatus field is updated

---

## 📁 File Locations

### Frontend:
```
src/
├── pages/
│   └── AdminDashboard/
│       ├── AdminDashboard.jsx          (Main dashboard)
│       └── components/
│           ├── OrdersManagement.jsx    (Orders page - NEW)
│           ├── OrdersManagement.css    (Styles - NEW)
│           └── Sidebar.jsx             (Navigation)
└── api.js                              (API methods - UPDATED)
```

### Backend (Already implemented):
```
src/main/java/com/bookstore/
├── controller/
│   └── AdminController.java            (Admin endpoints)
├── service/
│   └── OrderService.java               (Order logic)
├── dto/
│   └── UpdateOrderStatusRequest.java   (Request DTO)
└── entity/
    └── Order.java                      (Order model)
```

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] Backend running on port 8080
- [ ] Frontend running on port 3000
- [ ] Can login as admin
- [ ] "Orders" link in sidebar works
- [ ] Orders Management page loads
- [ ] See all orders in table
- [ ] Statistics cards show correct counts
- [ ] Search box works
- [ ] Status filter works
- [ ] Date filter works
- [ ] Status dropdown shows 5 options
- [ ] Can change order status
- [ ] Alert confirms success
- [ ] UI updates immediately
- [ ] User sees updated status in their order history

---

## 🎉 Success!

If all checks pass, your **Orders Management System** is fully functional!

Admin can now:
- ✅ View all orders
- ✅ Search and filter orders
- ✅ Update order status with dropdown
- ✅ Track order lifecycle
- ✅ Manage order workflow efficiently

Users will:
- ✅ See real-time status updates
- ✅ Track their order progress
- ✅ Know exactly where their order is

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors (F12)
2. Check backend logs for API errors
3. Verify database schema matches requirements
4. Ensure JWT authentication is working
5. Test API endpoints with Postman/Insomnia

Happy order managing! 🎊
