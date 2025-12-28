# Fluent Financial Flow - DMS (Document Management System)

A comprehensive financial management system built with React, TypeScript, and Node.js that provides complete accounting, inventory, and asset management capabilities.

## 🚀 Features

### Core Modules
- **General Accounting**: Journal entries, chart of accounts, financial reporting
- **Inventory Management**: Stock tracking, bin cards, item management
- **Fixed Assets**: Asset tracking, depreciation, maintenance scheduling
- **Payables**: Vendor invoice management, payment processing
- **Receivables**: Customer invoicing, receipt tracking
- **Cash Management**: Cash flow tracking and analysis
- **Intercompany Accounting**: Multi-entity transaction management
- **Budgetary Control**: Budget planning and variance analysis
- **Payroll Management**: Employee management and payroll processing
- **Expense Management**: Expense tracking and approval workflows
- **Receipt Accounting**: Receipt processing and reconciliation
- **Post Accounting**: Post-transaction processing and adjustments
- **Claim Management**: Claims processing and tracking
- **DSR Management**: Daily Sales Report management
- **Promotional Offers**: Marketing campaign and promotion tracking
- **Reports**: Custom report builder and analytics

### Technical Features
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Responsive Design**: Mobile-first approach with beautiful UI components
- **Real-time Updates**: Live data synchronization
- **Secure Authentication**: JWT-based authentication with role-based access
- **Database Integration**: MySQL database with comprehensive schema
- **API Backend**: RESTful API with Express.js
- **Form Validation**: Comprehensive client and server-side validation
- **Search & Filter**: Advanced search and filtering capabilities
- **Export Functionality**: Data export in multiple formats
- **Audit Trail**: Complete audit logging for compliance

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **React Hook Form** for form management
- **Zod** for validation
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **MySQL** database
- **JWT** authentication
- **bcrypt** for password hashing
- **Nodemailer** for email services
- **CORS** enabled for cross-origin requests

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- Git

### Backend Setup
   ```bash
   cd backend
   npm install
   ```

### Frontend Setup
   ```bash
   npm install
   ```

### Database Setup
1. Create a MySQL database
2. Update database configuration in `backend/config/database.js`
3. Run the database schema:
   ```bash
cd backend
node setup-database.js
```

## 🚀 Running the Application

### Development Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

## 📁 Project Structure

```
fluent-financial-flow/
├── backend/                 # Backend API server
│   ├── config/             # Configuration files
│   │   └── database.js     # Database configuration
│   ├── database/           # Database schema and setup
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── src/                    # Frontend React application
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard components
│   │   ├── forms/          # Form components
│   │   ├── modules/        # Main module components
│   │   └── ui/             # UI components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Page components
│   └── services/           # API services
├── public/                 # Static assets
└── package.json            # Project dependencies
```

## 🔐 Authentication

The system uses JWT-based authentication with the following default credentials:
- **Email**: admin@accuflow.com
- **Password**: admin123

## 📊 Database Schema

The application includes comprehensive database tables for:
- User management and authentication
- Chart of accounts and journal entries
- Inventory items and bin cards
- Fixed assets and depreciation
- Vendor invoices and payments
- Customer invoices and receipts
- Intercompany transactions
- Audit logging

## 🎨 UI Components

Built with a modern design system featuring:
- Responsive layouts
- Dark/light mode support
- Accessible components
- Interactive charts and graphs
- Data tables with sorting and filtering
- Modal dialogs and forms
- Toast notifications
- Loading states and skeletons

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=fluent_financial_flow
JWT_SECRET=your_jwt_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

### Email Setup
For email functionality, configure SMTP settings in `backend/utils/emailService.js`.

## 📈 Features in Detail

### Dashboard
- Real-time metrics and KPIs
- Cash flow charts and analysis
- Recent transactions overview
- Quick action buttons
- Performance indicators

### Inventory Management
- Stock level tracking
- Bin card management
- Reorder point alerts
- Item categorization
- Location management

### Financial Management
- Multi-currency support
- Automated journal entries
- Financial reporting
- Budget vs actual analysis
- Cash flow forecasting

### Asset Management
- Fixed asset tracking
- Depreciation calculations
- Maintenance scheduling
- Insurance tracking
- Asset disposal management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🔄 Version History

- **v1.0.0**: Initial release with core financial modules
- Complete accounting system
- Inventory management
- Asset tracking
- User authentication
- Modern UI/UX

---

**Fluent Financial Flow** - Streamlining financial operations with modern technology.
