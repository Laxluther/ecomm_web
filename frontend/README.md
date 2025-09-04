# WellNest - E-commerce Frontend

A modern, production-ready e-commerce frontend built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS
- **Real API Integration**: Connects to your backend API
- **SEO Optimized**: Dynamic metadata, sitemap, robots.txt
- **Responsive Design**: Mobile-first approach
- **State Management**: Zustand for cart and auth
- **Data Fetching**: TanStack Query with caching
- **Form Handling**: React Hook Form with validation
- **UI Components**: Radix UI with custom styling

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Your backend API running on `http://localhost:5000`

### Installation

1. **Clone and install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Environment Setup:**
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`
   
   Update `.env.local` with your configuration:
   \`\`\`env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_APP_NAME=WellNest
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   \`\`\`

3. **Start development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Backend Requirements

Make sure your backend API is running on `http://localhost:5000` with the following endpoints:

**User Endpoints:**
- `GET /api/products/featured` - Featured products
- `GET /api/categories` - Product categories
- `GET /api/products` - All products with filters
- `POST /api/user/auth/login` - User login
- `POST /api/user/auth/register` - User registration

**Admin Endpoints:**
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/products` - Admin product management

## 📁 Project Structure

\`\`\`
├── app/                    # Next.js 14 App Router
│   ├── page.tsx           # Homepage
│   ├── login/             # Authentication pages
│   ├── shop/              # Product catalog
│   ├── product/[id]/      # Product details
│   ├── cart/              # Shopping cart
│   ├── admin/             # Admin panel
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # UI components (shadcn)
│   ├── layout/           # Layout components
│   ├── product/          # Product components
│   └── pages/            # Page components
├── lib/                  # Utilities and configuration
│   ├── api.ts           # API client setup
│   ├── auth.ts          # Authentication store
│   ├── store.ts         # Cart store
│   └── seo.ts           # SEO utilities
└── public/              # Static assets
\`\`\`

## 🔧 Configuration

### API Integration

The app uses Axios for API calls with automatic token management:

\`\`\`typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
\`\`\`

### Authentication

JWT tokens are automatically handled for both user and admin authentication:

\`\`\`typescript
// Automatic token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
\`\`\`

### State Management

- **Cart**: Zustand store with persistence
- **Auth**: Zustand store for user/admin authentication
- **API Data**: TanStack Query for caching and synchronization

## 🎯 Production Deployment

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

### Environment Variables

For production, update your environment variables:

\`\`\`env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com
\`\`\`

### Deployment Platforms

- **Vercel**: `vercel --prod`
- **Netlify**: `npm run build` then deploy `out/` folder
- **Docker**: Use the included Dockerfile

## 🧪 Testing

### Test with Sample Data

Your backend should have:
- 20 products across 4 categories
- Sample users: `test@example.com` / `password123`
- Admin: `admin` / `admin123`

### API Testing

\`\`\`bash
# Test API connection
curl http://localhost:5000/api/products/featured

# Test authentication
curl -X POST http://localhost:5000/api/user/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
\`\`\`

## 📱 Features

### User Features
- Product browsing and search
- Shopping cart management
- User authentication
- Order management
- Referral system
- Wishlist functionality

### Admin Features
- Product management
- Category management
- User management
- Order management
- Dashboard analytics

### Technical Features
- SEO optimization
- Mobile responsiveness
- Error handling
- Loading states
- Form validation
- Image optimization

## 🤝 Support

For issues or questions:
1. Check that your backend API is running
2. Verify environment variables are set correctly
3. Check browser console for errors
4. Ensure API endpoints match your backend

## 📄 License

This project is licensed under the MIT License.
