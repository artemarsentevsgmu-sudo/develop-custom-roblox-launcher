import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const CODES: Record<number, { text: string; icon: string }> = {
  0: { text: "Ясно", icon: "☀️" },
  1: { text: "Малооблачно", icon: "🌤️" },
  2: { text: "Переменная облачность", icon: "⛅" },
  3: { text: "Пасмурно", icon: "☁️" },
  45: { text: "Туман", icon: "🌫️" },
  48: { text: "Изморозь", icon: "🌫️" },
  51: { text: "Морось", icon: "🌦️" },
  61: { text: "Дождь", icon: "🌧️" },
  63: { text: "Дождь", icon: "🌧️" },
  65: { text: "Ливень", icon: "⛈️" },
  71: { text: "Снег", icon: "🌨️" },
  73: { text: "Снег", icon: "❄️" },
  75: { text: "Сильный снег", icon: "❄️" },
  80: { text: "Ливни", icon: "🌦️" },
  95: { text: "Гроза", icon: "⛈️" },
};

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const lat = Number(p.get("lat"));
    const lon = Number(p.get("lon"));
    const city = p.get("city") || "";

    let latitude = Number.isFinite(lat) ? lat : NaN;
    let longitude = Number.isFinite(lon) ? lon : NaN;
    let place = city;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      const q = city || "Москва";
      const geo = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=ru&format=json`,
        { signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
      ).then((r) => r.json());
      const hit = geo?.results?.[0];
      if (!hit) return NextResponse.json({ error: "Город не найден" }, { status: 404 });
      latitude = hit.latitude;
      longitude = hit.longitude;
      place = hit.name;
    }

    const w = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m` +
        `&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`,
      { signal: AbortSignal.timeout(8000), next: { revalidate: 600 } }
    ).then((r) => r.json());

    const cur = w?.current ?? {};
    const code = Number(cur.weather_code) || 0;
    const meta = CODES[code] ?? { text: "Погода", icon: "🌡️" };

    if (!place) {
      const rev = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${latitude}&longitude=${longitude}&count=1&language=ru`,
        { signal: AbortSignal.timeout(5000) }
      )
        .then((r) => r.json())
        .catch(() => null);
      place = rev?.results?.[0]?.name ?? "Ваш город";
    }

    return NextResponse.json({
      place,
      temp: Math.round(Number(cur.temperature_2m) || 0),
      feels: Math.round(Number(cur.apparent_temperature) || 0),
      humidity: Math.round(Number(cur.relative_humidity_2m) || 0),
      wind: Math.round(Number(cur.wind_speed_10m) || 0),
      text: meta.text,
      icon: meta.icon,
      forecast: (w?.daily?.time ?? []).slice(0, 3).map((d: string, i: number) => ({
        date: d,
        max: Math.round(Number(w.daily.temperature_2m_max?.[i]) || 0),
        min: Math.round(Number(w.daily.temperature_2m_min?.[i]) || 0),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Погода недоступна" },
      { status: 502 }
    );
  }
}
