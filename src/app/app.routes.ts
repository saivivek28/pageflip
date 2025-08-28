import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { LibraryComponent } from './library/library.component';
import { FavoritesComponent } from './favorites/favorites.component';
import { ProfileDetailsComponent } from './profile-details/profile-details.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { BookDetailsComponent } from './book-details/book-details.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AdminBookFormComponent } from './admin-book-form/admin-book-form.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'library', component: LibraryComponent, canActivate: [AuthGuard] },
  { path: 'favorites', component: FavoritesComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileDetailsComponent, canActivate: [AuthGuard] },
  { path: 'edit-profile', component: EditProfileComponent, canActivate: [AuthGuard] },
  { path: 'book/:id', component: BookDetailsComponent, canActivate: [AuthGuard] },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [AdminGuard] },
  { path: 'admin/book/add', component: AdminBookFormComponent, canActivate: [AdminGuard] },
  { path: 'admin/book/edit/:id', component: AdminBookFormComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: '/login' }
];