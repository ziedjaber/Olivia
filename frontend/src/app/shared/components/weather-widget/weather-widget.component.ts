import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeatherService, WeatherData } from '../../../core/services/weather.service';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="weather" class="relative overflow-hidden bg-white/40 backdrop-blur-3xl border border-white/50 rounded-[2.5rem] p-8 shadow-2xl animate-fade-in group hover:shadow-[#3e5219]/10 transition-all duration-700">
      
      <!-- Decorative Backdrop Element -->
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

      <div class="flex flex-col lg:flex-row gap-10 relative z-10">
        
        <!-- Current Weather Section -->
        <div class="flex flex-col gap-4 border-r border-stone-200/50 pr-10">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-[#3e5219] uppercase tracking-[0.4em]">Conditions Actuelles</span>
            <div class="h-1 w-8 bg-primary/20 rounded-full"></div>
          </div>
          
          <div class="flex items-center gap-6">
            <div class="w-20 h-20 bg-white rounded-3xl shadow-lg flex items-center justify-center text-[#3e5219] border border-stone-50">
              <span class="material-symbols-outlined text-5xl animate-pulse-slow">{{ weather.current.icon }}</span>
            </div>
            <div>
              <div class="flex items-baseline">
                <span class="text-6xl font-black text-[#1e1c12] tracking-tighter">{{ weather.current.temp }}</span>
                <span class="text-2xl font-black text-stone-300 ml-1">°C</span>
              </div>
              <p class="text-sm font-black text-[#3e5219] uppercase tracking-widest mt-1">{{ weather.current.description }}</p>
            </div>
          </div>

          <div class="flex gap-6 mt-2">
             <div class="flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100">
                <span class="material-symbols-outlined text-stone-400 text-lg">air</span>
                <span class="text-[10px] font-bold text-stone-600 uppercase">{{ weather.current.windSpeed }} km/h</span>
             </div>
             <div class="flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100">
                <span class="material-symbols-outlined text-stone-400 text-lg">calendar_today</span>
                <span class="text-[10px] font-bold text-stone-600 uppercase">Tunisie Centrale</span>
             </div>
          </div>
        </div>

        <!-- Weekly Forecast Section -->
        <div class="flex-grow">
          <span class="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-6">Prévisions sur 7 jours</span>
          
          <div class="grid grid-cols-4 md:grid-cols-7 gap-4">
            <div *ngFor="let day of weather.daily; let i = index" 
                 class="flex flex-col items-center gap-3 p-4 rounded-3xl transition-all duration-300 group/day cursor-default"
                 [ngClass]="i === 0 ? 'bg-[#3e5219] text-white shadow-xl shadow-[#3e5219]/20' : 'hover:bg-white hover:shadow-lg'">
              
              <span class="text-[10px] font-black uppercase tracking-widest" [ngClass]="i === 0 ? 'text-white/60' : 'text-stone-400'">
                {{ i === 0 ? 'Auj.' : (day.date | date:'EEE') }}
              </span>
              
              <span class="material-symbols-outlined text-2xl" [ngClass]="i === 0 ? 'text-white' : 'text-[#3e5219]'">
                {{ day.icon }}
              </span>
              
              <div class="flex flex-col items-center leading-none">
                <span class="text-sm font-black">{{ day.maxTemp }}°</span>
                <span class="text-[10px] font-bold opacity-40 mt-0.5">{{ day.minTemp }}°</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .animate-pulse-slow {
      animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
    }
  `]
})
export class WeatherWidgetComponent implements OnInit {
  private weatherService = inject(WeatherService);
  weather?: WeatherData;

  ngOnInit() {
    this.weatherService.getWeather().subscribe(data => {
      this.weather = data;
    });
  }
}
