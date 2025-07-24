import { Component, type OnInit, type OnDestroy, inject, Inject } from "@angular/core"
import { ThemeService } from "../services/theme.service"
import { Subscription } from "rxjs"

@Component({
  selector: "app-theme-toggle",
  templateUrl: "./theme-toggle.html",
  styleUrls: ["./theme-toggle.css"],
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  isDarkMode = false
  private subscription: Subscription = new Subscription()
  constructor(@Inject(ThemeService) private themeService: ThemeService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.themeService.darkMode$.subscribe((isDark) => {
        this.isDarkMode = isDark
      }),
    )
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe()
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode()
  }
}
