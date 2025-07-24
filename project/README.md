# Simple E-commerce Store

A basic e-commerce application built with Express.js backend and vanilla JavaScript frontend.

## Features

- **User Authentication**: Registration and login system
- **Product Catalog**: Browse and view product details
- **Shopping Cart**: Add/remove items, update quantities
- **Order Processing**: Checkout and order history
- **Responsive Design**: Mobile-friendly interface

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Access the Application**
   - Open your browser and go to `http://localhost:3000`
   - The server will create necessary data files automatically

## Project Structure

```
├── server.js              # Express.js backend server
├── package.json           # Node.js dependencies
├── data/                  # JSON data files (auto-created)
│   ├── users.json         # User accounts
│   ├── products.json      # Product catalog
│   └── orders.json        # Order history
└── public/                # Frontend files
    ├── index.html         # Main HTML file
    ├── styles.css         # CSS styles
    └── script.js          # JavaScript functionality
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product

### Orders
- `POST /api/orders` - Create new order (requires auth)
- `GET /api/orders` - Get user orders (requires auth)

## Usage

1. **Browse Products**: View available products on the home page
2. **Product Details**: Click "View Details" to see full product information
3. **Add to Cart**: Use "Add to Cart" buttons to add items
4. **Register/Login**: Create account or login to place orders
5. **Checkout**: Review cart and place orders
6. **Order History**: View past orders in "My Orders" section

## Data Storage

This application uses simple JSON files for data storage:
- User accounts with hashed passwords
- Product catalog with stock management
- Order history with item details

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS enabled for cross-origin requests
- Input validation and error handling

## Customization

- **Add Products**: Edit `data/products.json` or create admin interface
- **Styling**: Modify `public/styles.css` for custom appearance
- **Features**: Extend functionality in `server.js` and `public/script.js`

## Notes

- This is a basic implementation for learning/demonstration purposes
- For production use, consider using a proper database (PostgreSQL, MySQL, MongoDB)
- Add payment processing integration (Stripe, PayPal)
- Implement proper image upload and storage
- Add admin panel for product management