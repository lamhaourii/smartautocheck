# SmartAutoCheck Frontend

Modern, professional Next.js 14 frontend for the SmartAutoCheck vehicle inspection platform.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI + Custom components
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── dashboard/         # Customer dashboard
│   ├── booking/           # Booking wizard
│   ├── inspector/         # Inspector dashboard
│   ├── admin/             # Admin panel
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/
│   └── ui/                # Reusable UI components
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
├── hooks/                 # Custom React hooks
│   └── useAppointments.ts
├── lib/                   # Utilities
│   ├── api.ts            # Axios instance with interceptors
│   └── utils.ts          # Helper functions
├── store/                 # Zustand stores
│   └── useAuthStore.ts   # Authentication state
└── public/               # Static assets
```

## 🎨 Design Features

### Professional Landing Page
- **Interactive animations** with Framer Motion
- **Gradient mesh background** with cursor glow effect
- **Real-time stats** from backend API
- **Social proof** with testimonials
- **Responsive pricing cards**
- **Modern glassmorphism** effects

### Authentication System
- Login with email/password
- Registration with password strength indicator
- Forgot password flow
- Demo accounts for testing
- Auto token refresh on expiry
- Role-based redirects

### Customer Dashboard
- View all appointments
- Track inspection status
- Download certificates
- Update profile
- View payment history

### Inspector Dashboard
- View assigned inspections
- Update inspection checkpoints
- Complete inspections
- Generate certificates
- Daily statistics

### Admin Panel
- System overview
- User management
- Appointment analytics
- Service monitoring
- Real-time metrics

## 🚦 Getting Started

### Prerequisites
```bash
Node.js 18+
npm or yarn
```

### Installation

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure environment**:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
```

3. **Run development server**:
```bash
npm run dev
```

Open [http://localhost:3010](http://localhost:3010)

### Production Build

```bash
npm run build
npm start
```

## 🔐 Demo Accounts

The system comes with pre-seeded demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@smartautocheck.com | Password123! |
| Inspector | inspector@smartautocheck.com | Password123! |
| Admin | admin@smartautocheck.com | Password123! |

## 📱 Pages Overview

### Public Pages

#### Landing Page (`/`)
- Hero section with live statistics
- Feature highlights
- Pricing comparison
- Customer testimonials
- Call-to-action sections

### Authentication Pages

#### Login (`/auth/login`)
- Email/password login
- Remember me option
- Forgot password link
- Demo account quick access

#### Register (`/auth/register`)
- Full registration form
- Password strength validator
- Phone verification ready
- Auto-redirect after success

#### Forgot Password (`/auth/forgot-password`)
- Email-based password reset
- Success confirmation
- Resend option

### Protected Pages

#### Customer Dashboard (`/dashboard`)
- Upcoming appointments
- Past inspections
- Certificates download
- Quick actions

#### Booking Wizard (`/booking`)
- 5-step booking process
- Service selection
- Date/time picker
- Vehicle details
- Document upload
- PayPal payment integration

#### Inspector Dashboard (`/inspector/dashboard`)
- Assigned inspections
- Inspection workflow
- Certificate generation
- Performance metrics

#### Admin Panel (`/admin`)
- System metrics
- User management
- Appointment oversight
- Analytics dashboard

## 🎨 Styling System

### TailwindCSS Configuration

Custom classes defined in `globals.css`:

```css
.btn-primary         → Blue gradient button
.btn-secondary       → Outline button
.card                → Glassmorphism card
.card-gradient       → Gradient card
.badge               → Rounded badge
.section-title       → Large heading
.mesh-gradient       → Animated mesh background
```

### Color Palette

- **Primary**: Blue (600-700)
- **Secondary**: Indigo (600-700)
- **Accent**: Purple (500-600)
- **Success**: Green (500-600)
- **Warning**: Yellow (400-500)
- **Error**: Red (500-600)

## 🔧 API Integration

### Axios Instance (`lib/api.ts`)

Features:
- Base URL configuration
- Auto token injection
- Token refresh on 401
- Error handling
- Request/response logging

Usage:
```typescript
import api from '@/lib/api';

const response = await api.get('/appointments');
const data = response.data.data;
```

### React Query Hooks

```typescript
// Fetch appointments
const { data, isLoading } = useAppointments();

// Create appointment
const { mutate } = useCreateAppointment();
mutate(appointmentData);

// Get available slots
const { data: slots } = useAvailableSlots('2024-01-20');
```

## 🛡️ Authentication Flow

1. User logs in → Receives `accessToken` & `refreshToken`
2. Tokens stored in Zustand + localStorage
3. Axios interceptor adds token to requests
4. On 401, auto-refresh using `refreshToken`
5. On refresh failure, redirect to login

## 🎭 State Management

### Zustand Store (`store/useAuthStore.ts`)

```typescript
const { user, isAuthenticated, setAuth, logout } = useAuthStore();

// Set auth after login
setAuth(user, accessToken, refreshToken);

// Logout
logout(); // Clears all state
```

## 📦 Build for Production

### Docker Build

```bash
docker build -t smartautocheck-frontend .
docker run -p 3010:3000 smartautocheck-frontend
```

### Environment Variables

Production `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.smartautocheck.com/api/v1
NEXT_PUBLIC_PAYPAL_CLIENT_ID=live_paypal_client_id
NEXTAUTH_SECRET=production_secret
NEXTAUTH_URL=https://smartautocheck.com
```

## 🧪 Testing

### Run Linter
```bash
npm run lint
```

### Type Check
```bash
npx tsc --noEmit
```

## 📈 Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Lighthouse Score**: 90+

Optimizations:
- Image optimization with Next.js Image
- Code splitting by route
- Lazy loading components
- Optimistic UI updates
- Caching with React Query

## 🎯 Best Practices

1. **TypeScript**: All components typed
2. **Accessibility**: ARIA labels, keyboard navigation
3. **SEO**: Meta tags, semantic HTML
4. **Mobile-first**: Responsive design
5. **Performance**: Optimized builds
6. **Security**: XSS protection, CSRF tokens

## 🐛 Troubleshooting

### API Connection Issues
```bash
# Check if backend is running
curl http://localhost:3000/health

# Check environment variables
cat .env.local
```

### Build Errors
```bash
# Clear cache
rm -rf .next
npm run build
```

### TypeScript Errors
```bash
# Check types
npx tsc --noEmit
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)

## 🤝 Contributing

1. Follow existing code style
2. Use TypeScript
3. Add comments for complex logic
4. Test on mobile devices
5. Ensure accessibility

## 📄 License

MIT

---

**Built with 💙 by the SmartAutoCheck team**
