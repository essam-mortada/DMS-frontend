import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false)
  public darkMode$ = this.darkModeSubject.asObservable()

  constructor() {
    this.initializeTheme()
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches

    if (savedTheme) {
      this.setDarkMode(savedTheme === "dark")
    } else if (prefersDark) {
      this.setDarkMode(true)
    } else {
      this.setDarkMode(false)
    }

    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) {
          this.setDarkMode(e.matches)
        }
      })
    }
  }

  setDarkMode(isDark: boolean): void {
    this.darkModeSubject.next(isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")

    const htmlElement = document.documentElement
    const bodyElement = document.body

    // Remove existing theme classes
    htmlElement.classList.remove("light-theme", "dark-theme")
    bodyElement.classList.remove("light-theme", "dark-theme")

    // Add new theme class
    const themeClass = isDark ? "dark-theme" : "light-theme"
    htmlElement.classList.add(themeClass)
    bodyElement.classList.add(themeClass)

    // Set data attribute for additional targeting
    htmlElement.setAttribute("data-theme", isDark ? "dark" : "light")
    bodyElement.setAttribute("data-theme", isDark ? "dark" : "light")

    console.log(`Theme set to: ${isDark ? "dark" : "light"}`)
    console.log("HTML classes:", htmlElement.className)
    console.log("Body classes:", bodyElement.className)
  }

  toggleDarkMode(): void {
    this.setDarkMode(!this.darkModeSubject.value)
  }

  isDarkMode(): boolean {
    return this.darkModeSubject.value
  }
}
