# ✿ Blush Board – Interactive Task Board (Kanban Lite)

A responsive, pink-themed Kanban board built with plain **HTML5, CSS3 and vanilla JavaScript (ES6+)**.

**Live demo:** https://favyabils234-hash.github.io/Interactive-Task-Board/

## Features

### Core
- **Add tasks** with title, description, category (Development / Design / Marketing) and priority (Low / Medium / High)
- **Move tasks** between **To Do**, **In Progress** and **Completed** with arrow buttons
- **Delete tasks**, with a 5-second **Undo**
- **Persistence** via `localStorage`, so tasks survive page refreshes
- **Priority colours:** High = coral, Medium = amber, Low = green
- **Search** by title and **filter** by category
- **Responsive:** 3 columns on desktop, 2 on tablet, 1 on mobile

### Bonus
- **Drag and drop** using the native HTML5 Drag and Drop API
- **Dark mode** toggle (remembers your choice and follows the system theme by default)
- **Task counter:** active vs completed, with a progress ring

### Extras
- Pill-style priority picker, "Clear completed" button, creation date on cards
- Empty-column messages, strikethrough for completed tasks
- User text is HTML-escaped to prevent injection

## Project structure
```
index.html   – semantic page structure
styles.css   – pink theme, light/dark variables, responsive layout
script.js    – state, rendering, persistence, drag & drop, theme
```

## Run locally
Open `index.html` in a browser. No build step is needed.
