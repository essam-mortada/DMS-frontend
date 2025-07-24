import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ThemeToggleComponent } from "../../theme-toggle/theme-toggle";

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule, ThemeToggleComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  backendError :string | null = null;
 showPassword = false;
  isLoading = false;
  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(from: NgForm) {
    if (from.invalid) {
      return;
    }
      setTimeout(() => {
        this.isLoading = false;
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.router.navigate(['/dashboard']);
      },
          error: (err) => {
        this.backendError = err?.error?.message || 'Login failed';
      }    });
       console.log('Login attempt:', { email: this.email, password: this.password });
      }, 2000);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
