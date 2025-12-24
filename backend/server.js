import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import { verifyEmailConfig } from './utils/emailService.js';
import authRoutes from './routes/auth.js';
import journalEntryRoutes from './routes/journalEntries.js';
import inventoryItemsRoutes from './routes/inventoryItems.js';
import binCardsRoutes from './routes/binCards.js';
import assetRoutes from './routes/assets.js';
import invoiceRoutes from './routes/invoices.js';
import customerRoutes from './routes/customers.js';
import receiptsRoutes from './routes/receipts.js';
import apSuppliersRoutes from './routes/apSuppliers.js';
import apInvoicesRoutes from './routes/apInvoices.js';
import apPaymentsRoutes from './routes/apPayments.js';
import customerSupplierRoutes from './routes/customerSupplier.js';
import procurementRoutes from './routes/procurement.js';
import partiesRoutes from './routes/parties.js';
import taxRegimesRoutes from './routes/taxRegimes.js';
import taxTypesRoutes from './routes/taxTypes.js';
import taxRatesRoutes from './routes/taxRates.js';
import companiesRoutes from './routes/companies.js';
import companyLocationsRoutes from './routes/companyLocations.js';
import chartOfAccountsRoutes from './routes/chartOfAccounts.js';
import profileRoutes from './routes/profile.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Build allowed origins list from env + local defaults
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000'
];

const extraOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [];

const allowedOrigins = [...defaultOrigins, ...extraOrigins].filter(Boolean);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", ...allowedOrigins],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests for resources
  crossOriginEmbedderPolicy: false, // Disable to allow embedding resources from different origins
}));

// CORS configuration - supports local dev + production domains from env
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically with CORS and CORP headers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Explicitly set Cross-Origin-Resource-Policy to allow cross-origin requests
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// CORS debug endpoint - shows allowed origins
app.get('/cors-info', (req, res) => {
  res.json({
    allowedOrigins: allowedOrigins,
    requestOrigin: req.headers.origin || 'No origin header',
    corsOriginEnv: process.env.CORS_ORIGIN || 'Not set'
  });
});

// Debug database connection - shows env vars and tries direct connection
app.get('/debug-db', async (req, res) => {
  const mysql = await import('mysql2/promise');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fluent_financial_flow',
    port: parseInt(process.env.DB_PORT) || 3306
  };
  
  // Show config (without password)
  const configSafe = {
    host: config.host,
    user: config.user,
    database: config.database,
    port: config.port,
    passwordSet: !!config.password
  };
  
  let connection = null;
  try {
    console.log('🔍 DEBUG: Attempting connection with:', configSafe);
    
    connection = await mysql.default.createConnection(config);
    await connection.query('SELECT 1 as test');
    
    const [tables] = await connection.execute("SHOW TABLES");
    
    await connection.end();
    
    res.json({
      success: true,
      message: 'Database connection successful',
      config: configSafe,
      tablesCount: tables.length
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {}
    }
    
    console.error('🔍 DEBUG: Connection failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      config: configSafe,
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      }
    });
  }
});

// Test database connection route
app.get('/test-db', async (req, res) => {
  let connection = null;
  try {
    console.log('Testing database connection...');
    const mysql = await import('mysql2/promise');
    const { dbConfig } = await import('./config/database.js');
    
    // Log config (without password)
    console.log('DB Config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    // Try direct connection first
    try {
      connection = await mysql.default.createConnection(dbConfig);
      await connection.query('SELECT 1');
      console.log('✅ Direct connection successful');
      
      // Test if required tables exist
      const [poAgreements] = await connection.execute("SHOW TABLES LIKE 'po_agreements'");
      const [apSuppliers] = await connection.execute("SHOW TABLES LIKE 'ap_suppliers'");
      const [poAgreementLines] = await connection.execute("SHOW TABLES LIKE 'po_agreement_lines'");
      
      await connection.end();
      
      res.json({
        success: true,
        message: 'Database connection successful',
        tables: {
          po_agreements: poAgreements.length > 0,
          ap_suppliers: apSuppliers.length > 0,
          po_agreement_lines: poAgreementLines.length > 0
        }
      });
    } catch (connError) {
      console.error('❌ Direct connection failed:', connError);
      
      if (connection) {
        try {
          await connection.end();
        } catch (e) {
          // Ignore
        }
      }
      
      // Return detailed error
      res.status(500).json({
        success: false,
        message: 'Database connection failed',
        details: connError.message || 'Unknown error',
        code: connError.code || null,
        errno: connError.errno || null,
        sqlState: connError.sqlState || null,
        config: {
          host: dbConfig.host,
          user: dbConfig.user,
          database: dbConfig.database,
          port: dbConfig.port
        }
      });
    }
  } catch (error) {
    console.error('Database test error:', error);
    
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // Ignore
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: 'Database test failed',
      details: error.message || 'Unknown error',
      code: error.code || null,
      errno: error.errno || null,
      sqlState: error.sqlState || null,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test suppliers endpoint
app.get('/test-suppliers', async (req, res) => {
  try {
    console.log('Testing suppliers...');
    const mysql = await import('mysql2/promise');
    const { dbConfig } = await import('./config/database.js');
    
    const connection = await mysql.default.createConnection(dbConfig);
    
    const [suppliers] = await connection.execute('SELECT supplier_id, supplier_name FROM ap_suppliers LIMIT 10');
    
    await connection.end();
    
    res.json({
      success: true,
      suppliers: suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suppliers',
      details: error.message
    });
  }
});

// Procurement suppliers endpoint (no auth) - Fetch existing suppliers with party info
app.get('/procurement-suppliers', async (req, res) => {
  try {
    console.log('Fetching existing suppliers with party information...');
    const mysql = await import('mysql2/promise');
    const { dbConfig } = await import('./config/database.js');
    
    const connection = await mysql.default.createConnection(dbConfig);
    
    // Fetch existing suppliers (ZIC, Steel Company, Akhter) with their party information
    const [suppliers] = await connection.execute(`
      SELECT 
        sp.supplier_id,
        sp.supplier_name,
        sp.supplier_number,
        sp.supplier_type,
        sp.supplier_class,
        sp.supplier_category,
        sp.party_id,
        p.party_name,
        sp.status as supplier_status,
        'ACTIVE' as status,
        (
          SELECT COUNT(*) 
          FROM party_sites ps 
          WHERE ps.party_id = sp.party_id AND ps.status = 'ACTIVE'
        ) as sites_count
      FROM ap_suppliers sp
      JOIN parties p ON sp.party_id = p.party_id
      WHERE sp.status = 'ACTIVE'
      ORDER BY sp.supplier_name
    `);
    
    console.log('Raw suppliers data from database:', suppliers);
    
    // Ensure we're returning the correct supplier names
    const processedSuppliers = suppliers.map(supplier => ({
      ...supplier,
      supplier_name: supplier.supplier_name, // This should be the actual supplier name
      display_name: `${supplier.supplier_name} (${supplier.supplier_number})` // Enhanced display name
    }));
    
    console.log('Processed suppliers data:', processedSuppliers);
    
    await connection.end();
    
    res.json(processedSuppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Test purchase agreement creation route
app.post('/test-agreement', async (req, res) => {
  try {
    console.log('=== TEST AGREEMENT CREATION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      supplier_id,
      site_id,
      description = '',
      lines = [],
      agreement_type = '',
      status = '',
      approval_status = '',
      currency_code = '',
      exchange_rate = '',
      total_amount = '',
      agreement_date = '',
      effective_start_date = '',
      effective_end_date = ''
    } = req.body;
    
    if (!supplier_id) {
      return res.status(400).json({ error: 'supplier_id is required' });
    }
    
    const mysql = await import('mysql2/promise');
    const { dbConfig } = await import('./config/database.js');
    
    console.log('Creating database connection...');
    const connection = await mysql.default.createConnection(dbConfig);
    console.log('Database connection created successfully');
    
    // Check if supplier exists in ap_suppliers
    let supplierExists = false;
    try {
      const [existingSuppliers] = await connection.execute('SELECT supplier_id FROM ap_suppliers WHERE supplier_id = ?', [supplier_id]);
      supplierExists = existingSuppliers.length > 0;
    } catch (error) {
      console.log('Error checking supplier:', error.message);
    }
    
    if (!supplierExists) {
      console.log(`Supplier ${supplier_id} does not exist in ap_suppliers, cannot create agreement`);
      await connection.end();
      return res.status(400).json({ 
        error: 'Supplier not found',
        details: `Supplier ID ${supplier_id} does not exist in the supplier profiles` 
      });
    }
    console.log('Database connection created successfully');
    
    // Generate agreement ID and number
    const agreementId = Date.now();
    const finalAgreementNumber = `PA${agreementId}`;
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Calculate total amount from line items if not provided
    let calculatedTotalAmount = 0;
    if (total_amount && !isNaN(parseFloat(total_amount))) {
      calculatedTotalAmount = parseFloat(total_amount);
    } else if (lines && lines.length > 0) {
      calculatedTotalAmount = lines.reduce((total, line) => {
        return total + (Number(line.line_amount) || 0);
      }, 0);
    }

    console.log('Creating agreement with:', {
      agreementId,
      finalAgreementNumber,
      supplier_id,
      description,
      calculatedTotalAmount
    });
    
    console.log('About to insert agreement header...');
    // Insert agreement header with minimal required fields
    const result = await connection.execute(`
      INSERT INTO po_agreements (
        agreement_id, 
        agreement_number, 
        agreement_type, 
        supplier_id, 
        supplier_site_id,
        buyer_id, 
        agreement_date, 
        effective_start_date, 
        effective_end_date,
        currency_code, 
        exchange_rate, 
        total_amount, 
        amount_used,
        payment_terms_id,
        description, 
        notes, 
        created_by,
        status,
        approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      agreementId,           // agreement_id
      finalAgreementNumber,  // agreement_number
      agreement_type,        // agreement_type
      supplier_id,          // supplier_id
      site_id || 1,         // supplier_site_id (use provided site_id or default to 1)
      1,                    // buyer_id (default)
      agreement_date || today,                // agreement_date
      effective_start_date || today,                // effective_start_date
      effective_end_date || endDate,              // effective_end_date
      currency_code || 'USD',                // currency_code
      exchange_rate || 1.0,                  // exchange_rate
      calculatedTotalAmount,                 // total_amount
      0,                    // amount_used (start with 0)
      30,                   // payment_terms_id (default)
      description,          // description
      '',                   // notes
      1,                    // created_by (default)
      status,               // status
      approval_status       // approval_status
    ]);
    
    console.log('Agreement header inserted successfully');
    
    // Create line items if provided
    if (lines && lines.length > 0) {
      console.log('Creating line items:', lines.length);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log(`Processing line ${i + 1}:`, line);
        
        // Use simple timestamp-based line ID
        const lineId = Date.now() + i;
        
        await connection.execute(`
          INSERT INTO po_agreement_lines (
            line_id, agreement_id, line_number, item_code, item_name, description,
            category, uom, quantity, unit_price, line_amount, min_quantity,
            max_quantity, need_by_date, suggested_supplier, suggested_supplier_id, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          lineId, 
          agreementId, 
          i + 1, 
          line.item_code || '', 
          line.item_name || '',
          line.description || '', 
          line.category || '', 
          line.uom || 'EACH',
          Number(line.quantity) || 1, 
          Number(line.unit_price) || 0, 
          Number(line.line_amount) || 0,
          line.min_quantity ? Number(line.min_quantity) : null, 
          line.max_quantity ? Number(line.max_quantity) : null,
          line.need_by_date || null, 
          line.suggested_supplier || '',
          line.suggested_supplier_id ? Number(line.suggested_supplier_id) : null, 
          line.notes || ''
        ]);
      }
      
      console.log('Line items created successfully');
    }
    
    await connection.end();
    
    console.log('Agreement created successfully');
    
    res.status(201).json({
      success: true,
      message: 'Agreement created successfully',
      agreement: {
        agreement_id: agreementId,
        agreement_number: finalAgreementNumber,
        supplier_id,
        description,
        lines_count: lines.length
      }
    });
    
  } catch (error) {
    console.error('Error creating purchase agreement:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to create agreement',
      details: error.message,
      stack: error.stack
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/journal-entries', journalEntryRoutes);
app.use('/api/inventory-items', inventoryItemsRoutes);
app.use('/api/bin-cards', binCardsRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/receipts', receiptsRoutes);


// Normalized Payables System Routes (Oracle E-Business Suite R12 Model)
app.use('/api/ap/suppliers', apSuppliersRoutes);
app.use('/api/ap/invoices', apInvoicesRoutes);
app.use('/api/ap/payments', apPaymentsRoutes);

// Customer/Supplier Management System Routes (Oracle Apps R12 Structure)
app.use('/api/customer-supplier', customerSupplierRoutes);

// Procurement System Routes
app.use('/api/procurement', procurementRoutes);
app.use('/api/parties', partiesRoutes);

// Tax Configuration Routes
app.use('/api/tax/regimes', taxRegimesRoutes);
app.use('/api/tax/types', taxTypesRoutes);
app.use('/api/tax/rates', taxRatesRoutes);

// Company Setup Routes
app.use('/api/companies', companiesRoutes);
app.use('/api/company-locations', companyLocationsRoutes);

// Chart of Accounts Routes
app.use('/api/chart-of-accounts', chartOfAccountsRoutes);


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors
    });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection (don't crash server if it fails – just log)
    const dbStatus = await testConnection();
    if (!dbStatus.ok) {
      console.error('❌ Failed to connect to database on startup. Server will still start, but DB-dependent routes may fail.');
    }

    // Test email configuration (also don't block server start)
    const emailConfigured = await verifyEmailConfig();
    if (!emailConfigured) {
      console.warn('⚠️ Email service not configured. OTP functionality will not work.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📧 Email service: ${emailConfigured ? '✅ Configured' : '❌ Not configured'}`);
      console.log(`🗄️ Database: ${dbStatus.ok ? '✅ Connected' : '❌ Connection failed'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // Do not force-exit; let platform handle restart / logs
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer(); 