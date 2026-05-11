# Taskly – Task Reminder App

A clean, dark-themed personal task manager with due-date reminders, browser push notifications, and confetti celebrations when you finish a task.

## Files

| File | Purpose |
|------|---------|
| `index.html` | App markup & layout |
| `style.css` | All styling (dark theme, animations) |
| `app.js` | Task logic, reminders, notifications, storage |

## Features

- **Add tasks** with title, notes, due date/time, and priority (high / medium / low)
- **Persists** all tasks in `localStorage` — survives page refreshes
- **Reminder toasts** at 15 minutes before due, at due time, and when overdue
- **Browser push notifications** (requires one-time permission) work in the background
- **Confetti + congratulations** when you mark a task complete
- **Filter** tasks: All / Pending / Done / Overdue
- **Live overdue counter** in the header

## How to run

Simply open `index.html` in any modern browser — no server or build step needed.

```
double-click index.html   # or drag it into Chrome/Firefox/Edge
```

> **Tip:** For background browser notifications to fire, keep the tab open (it can be minimised). The reminder checker runs every 30 seconds.

## Customisation

| What | Where |
|------|-------|
| Colour theme | CSS variables at the top of `style.css` |
| Reminder lead time (15 min) | `checkReminders()` in `app.js` |
| Poll interval (30 s) | `setInterval` at the bottom of `app.js` |
