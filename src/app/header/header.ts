import { Component, EventEmitter, HostListener, Input, NgModule, Output } from '@angular/core';
import { AuthService } from '../services/auth';
import { Router, RouterModule } from '@angular/router';
import { ThemeToggleComponent } from "../theme-toggle/theme-toggle";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../services/search-service';

@Component({
  selector: 'app-header',
  imports: [ThemeToggleComponent, CommonModule, FormsModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
   @Input() showNavigation = true
  @Input() showNotifications = true
  @Output() searchQueryChange = new EventEmitter<string>()
   isDropdownOpen = false;
   searchQuery: string = '';
 showSearchSuggestions = false
  showUserMenu = false
  constructor(
    private authService: AuthService,
    private router: Router,
    private searchService: SearchService
  ) {}

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.isDropdownOpen = false;
    }
  }

  onSearch(event: Event): void {
  const input = event.target as HTMLInputElement;
  const value = input?.value || '';
  this.searchService.updateSearchTerm(value);
}

  logout(): void {
    this.isDropdownOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private setupClickOutsideListener(): void {
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement
      if (!target.closest(".search-container")) {
        this.showSearchSuggestions = false
      }
      if (!target.closest(".user-menu-dropdown")) {
        this.showUserMenu = false
      }
    })
  }



  onSearchBlur(): void {
    // Delay hiding to allow clicking on suggestions
    setTimeout(() => {
      this.showSearchSuggestions = false
    }, 200)
  }

  clearSearch(): void {
    this.searchQuery = ""
    this.searchQueryChange.emit("")
    this.showSearchSuggestions = false
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion
    this.searchQueryChange.emit(suggestion)
    this.showSearchSuggestions = false
  }

  toggleNotifications(): void {
    // Implement notifications toggle
    console.log("Toggle notifications")
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu
  }

  navigateToDashboard(): void {
    this.router.navigate(["/dashboard"])
  }
}


