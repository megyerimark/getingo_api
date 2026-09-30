import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { verifiedGuard } from './core/guards/verified.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home')
        .then(m => m.Home)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login')
        .then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register')
        .then(m => m.Register)
  },
  {
    path: 'adatkezelesi-tajekoztato',
    loadComponent: () =>
      import('./pages/privacy/privacy')
        .then(m => m.Privacy)
  },
  {
    path: 'premium',
    loadComponent: () =>
      import('./pages/premium/premium')
        .then(m => m.Premium)
  },
  {
    path: 'premium/siker',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/premium-success/premium-success')
        .then(m => m.PremiumSuccess)
  },
  {
    path: 'verify-email',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/verify-email/verify-email')
        .then(m => m.VerifyEmail)
  },
  {
    path: 'email-verified',
    loadComponent: () =>
      import('./pages/email-verified/email-verified')
        .then(m => m.EmailVerified)
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories/categories')
        .then(m => m.Categories)
  },
  {
    path: 'categories/:categoryId/lessons',
    loadComponent: () =>
      import('./pages/lessons/lessons')
        .then(m => m.Lessons)
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./pages/search/search')
        .then(m => m.Search)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, verifiedGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard')
        .then(m => m.Dashboard)
  },
  {
    path: 'buddy',
    canActivate: [authGuard, verifiedGuard],
    loadComponent: () =>
      import('./pages/buddy/buddy')
        .then(m => m.Buddy)
  },
  {
    path: 'projects',
    canActivate: [authGuard, verifiedGuard],
    loadComponent: () =>
      import('./pages/projects/projects')
        .then(m => m.Projects)
  },
  {
    path: 'portfolio',
    canActivate: [authGuard, verifiedGuard],
    loadComponent: () =>
      import('./pages/portfolio/portfolio')
        .then(m => m.Portfolio)
  },
  {
    path: 'projects/:id',
    canActivate: [authGuard, verifiedGuard],
    loadComponent: () =>
      import('./pages/project-detail/project-detail')
        .then(m => m.ProjectDetail)
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/account/account')
        .then(m => m.Account)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/admin')
        .then(m => m.Admin),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin/admin-dashboard/admin-dashboard')
            .then(m => m.AdminDashboard)
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/admin/admin-categories/admin-categories')
            .then(m => m.AdminCategories)
      },
      {
        path: 'lessons',
        loadComponent: () =>
          import('./pages/admin/admin-lessons/admin-lessons')
            .then(m => m.AdminLessons)
      },
      {
        path: 'quizzes',
        loadComponent: () =>
          import('./pages/admin/admin-quizzes/admin-quizzes')
            .then(m => m.AdminQuizzes)
      },
      {
        path: 'exercises',
        loadComponent: () =>
          import('./pages/admin/admin-exercises/admin-exercises')
            .then(m => m.AdminExercises)
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./pages/admin/admin-projects/admin-projects')
            .then(m => m.AdminProjects)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin/admin-users/admin-users')
            .then(m => m.AdminUsers)
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./pages/admin/admin-subscriptions/admin-subscriptions')
            .then(m => m.AdminSubscriptions)
      },
      {
        path: 'revenue',
        loadComponent: () =>
          import('./pages/admin/admin-revenue/admin-revenue')
            .then(m => m.AdminRevenue)
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./pages/admin/admin-audit-logs/admin-audit-logs')
            .then(m => m.AdminAuditLogs)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];