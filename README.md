# Dhan Kuber - Complete Website with Admin Panel

A modern, full-stack Next.js 14 application for displaying Dhan Kuber results with a secure admin panel for managing charts and results.

## Features

- **Public Website**: Display results for Gali, Desawar, Faridabad, Ghaziabad and other markets
- **Admin Panel**: Secure authentication with role-based access control
- **Chart Management**: Add, edit, delete, and highlight chart results
- **Date/Year Management**: Dynamic year/month/date filtering with historical data
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **MongoDB**: Database with Mongoose ODM
- **Server Actions**: Secure server-side operations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with HTTP-only cookies (iron-session)
- **Validation**: Zod
- **Icons**: Lucide React
- **Forms**: React Hook Form (with server actions)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   ├── admin/
│   │   ├── login/page.tsx      # Admin login
│   │   ├── dashboard/page.tsx  # Admin dashboard
│   │   └── charts/
│   │       ├── page.tsx        # Charts list
│   │       ├── add/page.tsx    # Add chart
│   │       └── edit/[id]/page.tsx # Edit chart
│   └── api/
│       ├── admin/              # Admin API routes
│       ├── charts/             # Public charts API
│       └── contact/            # Contact form API
├── components/
│   ├── layout/                 # Header, Footer, Navigation
│   ├── home/                   # Home page components
│   ├── admin/                  # Admin panel components
│   └── shared/                 # Reusable UI components
├── lib/
│   ├── mongodb.ts              # MongoDB connection
│   ├── auth.ts                 # Authentication utilities
│   └── validations.ts          # Zod schemas
├── models/
│   ├── Admin.ts                # Admin schema
│   └── Chart.ts                # Chart schema
├── actions/
│   ├── admin.actions.ts        # Admin server actions
│   └── chart.actions.ts        # Chart server actions
└── types/                      # TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   MONGODB_URI=mongodb://localhost:27017/Dhan-Kuber
   ADMIN_SECRET_KEY=your-super-secret-key-min-32-chars-long
   ADMIN_COOKIE_PASSWORD=your-32-char-password-for-iron-session
   NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
   ```

4. Initialize database and create admin user:

   ```bash
   npm run db:push
   npm run seed
   ```

5. Start development server:

   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

### Admin Access

- URL: http://localhost:3000/admin/login
- Default credentials:
  - Username: `admin`
  - Password: `admin123`
- **Important**: Change password after first login!

## Available Scripts

| Command           | Description               |
| ----------------- | ------------------------- |
| `npm run dev`     | Start development server  |
| `npm run build`   | Build for production      |
| `npm run start`   | Start production server   |
| `npm run lint`    | Run ESLint                |
| `npm run seed`    | Create initial admin user |
| `npm run db:push` | Create database indexes   |

## Admin Panel Features

### Dashboard

- Total charts count
- Active results count
- Today's entries
- Latest added charts

### Charts Management

- **Add Chart**: Create new chart entries with all fields
- **Edit Chart**: Modify existing chart data
- **Delete Chart**: Remove charts with confirmation
- **Search & Filter**: By name, date, month, year, status
- **Pagination**: For large datasets
- **Highlight**: Mark important results
- **Active/Inactive**: Toggle visibility

### Date/Year Management

- Dynamic year options from database
- Future year support (2025, 2026, 2027+)
- Month/date filtering based on available data
- Historical data preservation

## Security Features

- Server-side authentication on all admin routes
- HTTP-only, Secure, SameSite cookies
- Bcrypt password hashing (12 rounds)
- Rate limiting on login attempts
- Account lockout after failed attempts
- Role-based authorization (super_admin, admin, editor)
- CSRF protection via SameSite cookies
- Input validation with Zod
- No client-side route protection only

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://...
ADMIN_SECRET_KEY=generate-secure-32-char-key
ADMIN_COOKIE_PASSWORD=generate-32-char-password
NEXT_PUBLIC_APP_URL=https://yourdomain.com
SESSION_SECURE=true
```

## Customization

### Markets/Charts

Edit `COMMON_CHARTS` array in `src/components/admin/ChartForm.tsx`

### Colors

Modify `tailwind.config.ts` for custom color palette

### Announcements

Update default announcements in `src/app/page.tsx`

## API Endpoints

### Public

- `GET /api/charts` - Get charts with filters
- `GET /api/charts/years` - Get available years
- `GET /api/charts/months?year=` - Get months for year
- `GET /api/charts/dates?year=&month=` - Get dates for month/year
- `POST /api/contact` - Contact form

### Admin (Protected)

- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/me` - Get current admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/charts` - List charts with pagination
- `POST /api/admin/charts` - Create chart
- `GET /api/admin/charts/[id]` - Get chart
- `PUT /api/admin/charts/[id]` - Update chart
- `DELETE /api/admin/charts/[id]` - Delete chart
- `POST /api/admin/charts/[id]/highlight` - Toggle highlight
- `POST /api/admin/charts/[id]/active` - Toggle active
- `GET /api/admin/charts/years` - Get years
- `GET /api/admin/charts/months?year=` - Get months
- `GET /api/admin/charts/dates?year=&month=` - get dates

## License

MIT License - feel free to use for your projects.

## Support

For issues or questions, please create a GitHub issue.
