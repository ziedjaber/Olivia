import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface WeatherData {
  current: {
    temp: number;
    description: string;
    icon: string;
    windSpeed: number;
    humidity: number;
  };
  daily: Array<{
    date: Date;
    maxTemp: number;
    minTemp: number;
    icon: string;
    description: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private http = inject(HttpClient);
  
  // Default to Tunisia Central coordinates
  private lat = 34.0;
  private lon = 9.0;

  getWeather(): Observable<WeatherData> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.lat}&longitude=${this.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&current_weather=true&timezone=Africa/Tunis`;

    return this.http.get<any>(url).pipe(
      map(res => ({
        current: {
          temp: Math.round(res.current_weather.temperature),
          description: this.getWeatherDescription(res.current_weather.weathercode),
          icon: this.getWeatherIcon(res.current_weather.weathercode),
          windSpeed: res.current_weather.windspeed,
          humidity: 0 // Open-Meteo current_weather doesn't include humidity in the basic call
        },
        daily: res.daily.time.map((time: string, i: number) => ({
          date: new Date(time),
          maxTemp: Math.round(res.daily.temperature_2m_max[i]),
          minTemp: Math.round(res.daily.temperature_2m_min[i]),
          icon: this.getWeatherIcon(res.daily.weathercode[i]),
          description: this.getWeatherDescription(res.daily.weathercode[i])
        }))
      }))
    );
  }

  private getWeatherIcon(code: number): string {
    // WMO Weather interpretation codes (WW)
    if (code === 0) return 'sunny';
    if (code <= 3) return 'cloud';
    if (code <= 48) return 'foggy';
    if (code <= 57) return 'rainy_light';
    if (code <= 67) return 'rainy';
    if (code <= 77) return 'snowing';
    if (code <= 82) return 'rainy_heavy';
    if (code <= 86) return 'snowing_heavy';
    if (code <= 99) return 'thunderstorm';
    return 'wb_cloudy';
  }

  private getWeatherDescription(code: number): string {
    const descriptions: { [key: number]: string } = {
      0: 'Ciel dégagé',
      1: 'Principalement dégagé',
      2: 'Partiellement nuageux',
      3: 'Couvert',
      45: 'Brouillard',
      48: 'Brouillard givrant',
      51: 'Bruine légère',
      53: 'Bruine modérée',
      55: 'Bruine dense',
      61: 'Pluie légère',
      63: 'Pluie modérée',
      65: 'Pluie forte',
      71: 'Neige légère',
      73: 'Neige modérée',
      75: 'Neige forte',
      80: 'Averses de pluie légères',
      81: 'Averses de pluie modérées',
      82: 'Averses de pluie violentes',
      95: 'Orage',
      96: 'Orage avec grêle légère',
      99: 'Orage avec grêle forte'
    };
    return descriptions[code] || 'Inconnu';
  }
}
