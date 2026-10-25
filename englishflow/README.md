# EnglishFlow — wersja 1.0 (beta)

Nowa aplikacja działa w folderze `englishflow/` bez zmieniania obecnej aplikacji Oxford na głównej ścieżce repozytorium.

## Uruchomienie

Po opublikowaniu repozytorium w GitHub Pages otwórz: https://bartekstefen.github.io/oxford3000-nauka/englishflow/

Dane Oxford (3805 rekordów) są pobierane z istniejącego `../data.json`, dzięki czemu nie duplikujemy ani nie zastępujemy źródła. Wymowa odtwarza istniejące pliki z `../audio/` (gdy są dostępne). Działa także w trybie offline po wcześniejszym załadowaniu strony i danych.

## Co działa

- Dashboard, codzienna checklista, elastyczny plan 5–90 min.
- Baza słówek Oxford, wyszukiwanie, poziomy, ulubione, fiszki, ćwiczenie pisania, powtórki.
- Krótkie lekcje gramatyki A1–B2 i quizy.
- Listening z syntezą mowy w przeglądarce, scenariusze speaking i ręczny dziennik.
- Busuu z potwierdzeniem odbytej lekcji.
- Statystyki, eksport/import postępów i tryb jasny/ciemny.
- Automatyczny import starych lokalnych postępów Oxford w przypadku wejścia z tego samego origin i przeglądarki, o ile EnglishFlow nie posiada jeszcze własnego zapisu.

## Synchronizacja: Supabase

1. Utwórz darmowy projekt w https://supabase.com/dashboard.
2. Otwórz SQL Editor i uruchom `supabase.sql`.
3. W Authentication > Providers włącz e-mail OTP / Magic Link.
4. W Authentication > URL Configuration dodaj https://bartekstefen.github.io/oxford3000-nauka/englishflow/ do dozwolonych Redirect URLs.
5. Odczytaj **Project URL** i publiczny **anon/publishable key** w Project Settings / API i wstaw do `cloud-config.js`. Klucz jest publiczny; ochrona danych opiera się na skonfigurowanym Row Level Security.
6. Zaloguj się na komputerze i iPhonie tym samym e-mailem. Synchronizacja działa po udanym logowaniu i podczas nauki online.

**Nie umieszczaj w pliku kluczy service_role ani sekretów AI.** Ta wersja nie ma jeszcze backendu Gemini ani pełnej inteligentnej synchronizacji offline: zapis lokalny i łączenie stanu odbywa się na poziomie podstawowym, a przy jednoczesnej pracy na kilku urządzeniach możliwe są kolizje. Eksportuj kopię przed importem lub migracją.

## Ograniczenia

- Powtórki używają prostego harmonogramu zamiast FSRS; zaplanowana rozbudowa.
- Nie ma jeszcze pełnej analizy mowy ani AI prowadzącego rozmowę w aplikacji.
- Busuu nie udostępnia tutaj odczytu postępów przez API; ukończenie lekcji wpisuje użytkownik.
- Należy zweryfikować licencje danych i nagrań Oxford przed publicznym udostępnianiem ich kopii.
