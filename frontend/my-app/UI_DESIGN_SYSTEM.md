# UI Design System Documentation

## Overview

This document outlines the tech-inspired design system for the EA Tournament Manager application. The design follows a modern, futuristic aesthetic with cyber-blue and electric-purple color schemes, glass morphism effects, and smooth animations.

---

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Components](#components)
5. [Animations](#animations)
6. [Best Practices](#best-practices)

---

## Color Palette

### Primary Colors

#### Cyber Blue
```
cyber-50:  #f0f9ff
cyber-100: #e0f2fe
cyber-200: #bae6fd
cyber-300: #7dd3fc
cyber-400: #38bdf8
cyber-500: #0ea5e9
cyber-600: #0284c7
cyber-700: #0369a1
cyber-800: #075985
cyber-900: #0c4a6e
cyber-950: #082f49
```

#### Electric Purple
```
electric-50:  #faf5ff
electric-100: #f3e8ff
electric-200: #e9d5ff
electric-300: #d8b4fe
electric-400: #c084fc
electric-500: #a855f7
electric-600: #9333ea
electric-700: #7e22ce
electric-800: #6b21a8
electric-900: #581c87
electric-950: #3b0764
```

#### Neon Accents
```
neon-pink:   #ff006e
neon-purple: #8338ec
neon-blue:   #3a86ff
neon-cyan:   #00f5ff
neon-green:  #06ffa5
neon-yellow: #ffbe0b
```

#### Dark Backgrounds
```
dark-50:  #18181b
dark-100: #27272a
dark-200: #3f3f46
dark-300: #52525b
dark-400: #71717a
dark-500: #a1a1aa
dark-600: #d4d4d8
dark-700: #e4e4e7
dark-800: #f4f4f5
dark-900: #fafafa
```

### Gradient Presets

- **gradient-tech**: Linear gradient from #667eea to #764ba2
- **gradient-cyber**: Linear gradient from cyber-500 to electric-600
- **gradient-electric**: Linear gradient from electric-500 to pink-500
- **gradient-neon**: Linear gradient from neon-blue to neon-pink

### Usage Example
```tsx
<div className="bg-gradient-to-r from-cyber-400 to-electric-600">
  Gradient Background
</div>
```

---

## Typography

### Font Stack
The application uses Next.js default font stack with system fonts for optimal performance.

### Text Sizes
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)
- **5xl**: 3rem (48px)
- **6xl**: 3.75rem (60px)
- **7xl**: 4.5rem (72px)

### Gradient Text
```tsx
<h1 className="bg-gradient-to-r from-cyber-400 to-electric-500 bg-clip-text text-transparent">
  Gradient Text
</h1>
```

---

## Spacing & Layout

### Border Radius
- **tech**: 0.75rem (12px)
- **tech-lg**: 1.25rem (20px)

### Box Shadows

#### Standard Shadows
- **shadow-glow-sm**: Subtle cyan glow
- **shadow-glow**: Medium cyan glow
- **shadow-glow-lg**: Large cyan glow
- **shadow-glow-purple**: Purple glow effect
- **shadow-glow-pink**: Pink glow effect

#### Neon Shadows
- **shadow-neon-blue**: Triple-layer blue neon effect
- **shadow-neon-purple**: Triple-layer purple neon effect
- **shadow-neon-pink**: Triple-layer pink neon effect

### Usage Example
```tsx
<div className="rounded-tech-lg shadow-glow">
  Card with tech styling
</div>
```

---

## Components

### Layout Components

#### MainLayout
Main page wrapper with animated background effects.

**Props:**
- `children`: React.ReactNode
- `className?`: string
- `showBackground?`: boolean (default: true)

**Usage:**
```tsx
import MainLayout from '@/components/layouts/MainLayout';

<MainLayout>
  <YourContent />
</MainLayout>
```

#### PageHeader
Tech-style page header with gradient text and animations.

**Props:**
- `title`: string
- `subtitle?`: string
- `className?`: string
- `gradient?`: 'cyber' | 'electric' | 'neon' | 'tech'

**Usage:**
```tsx
import PageHeader from '@/components/layouts/PageHeader';

<PageHeader
  title="EA TOURNAMENT MANAGER"
  subtitle="Manage your football leagues"
  gradient="tech"
/>
```

#### Container
Content wrapper with responsive max-width.

**Props:**
- `children`: React.ReactNode
- `className?`: string
- `maxWidth?`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

**Usage:**
```tsx
import Container from '@/components/layouts/Container';

<Container maxWidth="xl">
  <YourContent />
</Container>
```

---

### UI Components

#### Button
Modern button with tech styling and glow effects.

**Props:**
- `variant?`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size?`: 'sm' | 'md' | 'lg'
- `isLoading?`: boolean
- `leftIcon?`: React.ReactNode
- `rightIcon?`: React.ReactNode
- `glow?`: boolean

**Usage:**
```tsx
import Button from '@/components/ui/Button';
import { Save } from 'lucide-react';

<Button
  variant="primary"
  size="md"
  leftIcon={<Save />}
  glow
>
  Save Changes
</Button>
```

#### Card
Modern card with gradient borders and glass morphism.

**Props:**
- `children`: React.ReactNode
- `className?`: string
- `variant?`: 'default' | 'gradient' | 'glass' | 'solid'
- `hover?`: boolean
- `glow?`: boolean
- `onClick?`: () => void

**Usage:**
```tsx
import Card from '@/components/ui/Card';

<Card variant="glass" hover glow>
  <h3>Card Title</h3>
  <p>Card content here</p>
</Card>
```

#### Badge
Status badge with glow effects.

**Props:**
- `children`: React.ReactNode
- `variant?`: 'default' | 'success' | 'warning' | 'danger' | 'info'
- `glow?`: boolean
- `className?`: string

**Usage:**
```tsx
import Badge from '@/components/ui/Badge';

<Badge variant="success" glow>
  Active
</Badge>
```

#### Input
Form input with tech styling.

**Props:**
- `label?`: string
- `error?`: string
- `leftIcon?`: React.ReactNode
- `rightIcon?`: React.ReactNode
- All standard HTML input props

**Usage:**
```tsx
import Input from '@/components/ui/Input';
import { Search } from 'lucide-react';

<Input
  label="Search"
  placeholder="Search players..."
  leftIcon={<Search className="w-4 h-4" />}
/>
```

#### Modal
Modern modal/dialog with backdrop blur.

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title?`: string
- `children`: React.ReactNode
- `footer?`: React.ReactNode
- `size?`: 'sm' | 'md' | 'lg' | 'xl'
- `closeOnBackdrop?`: boolean

**Usage:**
```tsx
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary">
        Confirm
      </Button>
    </>
  }
>
  Are you sure you want to proceed?
</Modal>
```

#### Table
Responsive table with tech styling.

**Props:**
- `columns`: Array<{ key: string; label: string; className?: string }>
- `data`: any[]
- `className?`: string
- `hover?`: boolean
- `striped?`: boolean

**Usage:**
```tsx
import Table from '@/components/ui/Table';

const columns = [
  { key: 'name', label: 'Player Name' },
  { key: 'goals', label: 'Goals' },
  { key: 'assists', label: 'Assists' },
];

const data = [
  { name: 'Player 1', goals: 12, assists: 5 },
  { name: 'Player 2', goals: 8, assists: 10 },
];

<Table columns={columns} data={data} hover striped />
```

---

### Landing Components

#### NavigationCard
Large interactive card for navigation.

**Props:**
- `title`: string
- `description`: string
- `icon`: string (path to SVG icon)
- `route`: string
- `stats?`: string
- `gradient?`: 'cyber' | 'electric' | 'neon' | 'tech'
- `delay?`: number

**Usage:**
```tsx
import NavigationCard from '@/components/landing/NavigationCard';

<NavigationCard
  title="Leagues"
  description="Manage your football leagues"
  icon="/icons/league.svg"
  route="/leagues"
  stats="12 Active"
  gradient="cyber"
  delay={0.1}
/>
```

#### StatsSection
Display quick statistics with icons and trends.

**Props:**
- `stats`: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    color?: 'cyber' | 'electric' | 'neon' | 'green';
  }>
- `title?`: string

**Usage:**
```tsx
import StatsSection from '@/components/landing/StatsSection';
import { Trophy } from 'lucide-react';

const stats = [
  {
    label: 'Total Leagues',
    value: '12',
    icon: <Trophy className="w-6 h-6" />,
    color: 'cyber',
    trend: '+2 this month',
  },
];

<StatsSection stats={stats} title="Quick Stats" />
```

---

## Animations

### Framer Motion Animations

All components use Framer Motion for smooth animations.

#### Common Animation Patterns

**Fade In:**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

**Slide Up:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

**Hover Effects:**
```tsx
<motion.button
  whileHover={{ scale: 1.02, y: -5 }}
  whileTap={{ scale: 0.98 }}
>
  Button
</motion.button>
```

### Tailwind Animations

**Available Animations:**
- `animate-float`: Floating effect (6s)
- `animate-glow`: Glowing effect (2s)
- `animate-pulse-slow`: Slow pulse (3s)
- `animate-shimmer`: Shimmer effect (2s)
- `animate-gradient`: Gradient animation (8s)

**Usage:**
```tsx
<div className="animate-float">
  Floating element
</div>
```

---

## Best Practices

### 1. Component Composition
Always compose components from smaller, reusable pieces:

```tsx
// Good
<Card variant="glass">
  <h3>Title</h3>
  <Button variant="primary">Action</Button>
</Card>

// Avoid creating monolithic components
```

### 2. Responsive Design
Use mobile-first approach with Tailwind breakpoints:

```tsx
<div className="text-sm sm:text-base md:text-lg lg:text-xl">
  Responsive text
</div>
```

### 3. Performance
- Use `motion.div` sparingly for critical animations only
- Lazy load heavy components when possible
- Optimize images with Next.js Image component

### 4. Accessibility
- Always include ARIA labels
- Ensure keyboard navigation works
- Maintain proper color contrast ratios

```tsx
<button
  aria-label="Close modal"
  onClick={handleClose}
>
  <X className="w-5 h-5" />
</button>
```

### 5. Color Usage
- Primary actions: `cyber` or `electric` gradients
- Success states: `green` colors
- Warnings: `yellow` colors
- Errors/Destructive: `red` or `pink` colors
- Info: `cyber` or `blue` colors

### 6. Spacing Consistency
Follow the spacing scale (4px base unit):
- xs: 0.5rem (8px)
- sm: 0.75rem (12px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)
- 2xl: 3rem (48px)

---

## File Structure

```
src/
├── app/
│   ├── components/
│   │   ├── layouts/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── Container.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Table.tsx
│   │   └── landing/
│   │       ├── NavigationCard.tsx
│   │       └── StatsSection.tsx
│   └── page.tsx
└── lib/
    └── AuthContext.tsx
```

---

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install lucide-react framer-motion
   ```

2. **Import Components:**
   ```tsx
   import Button from '@/components/ui/Button';
   import Card from '@/components/ui/Card';
   ```

3. **Use in Your Pages:**
   ```tsx
   export default function MyPage() {
     return (
       <MainLayout>
         <Container>
           <Card>
             <Button variant="primary">Click Me</Button>
           </Card>
         </Container>
       </MainLayout>
     );
   }
   ```

---

## Support

For questions or issues with the design system, please refer to:
- Tailwind CSS documentation: https://tailwindcss.com
- Framer Motion documentation: https://www.framer.com/motion
- Lucide Icons: https://lucide.dev

---

**Last Updated:** December 2024
**Version:** 1.0.0
