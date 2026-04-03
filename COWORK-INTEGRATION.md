# Cowork Integration Guide

Add the appropriate snippet to your Cowork task instructions to push results to your dashboard.

Replace `YOUR_DASHBOARD_URL` with your Vercel deployment URL and `YOUR_API_KEY` with the API key you set during setup.

---

## Checklist Widget (e.g. Grocery List, To-Do List)

```
When your task is complete, push the results to my dashboard:

POST https://YOUR_DASHBOARD_URL/api/widgets/update
Headers:
  Content-Type: application/json
  x-api-key: YOUR_API_KEY

Body:
{
  "slug": "grocery-list",
  "title": "Grocery List",
  "type": "checklist",
  "content": ["item 1", "item 2", "item 3"]
}

The "slug" is a unique identifier for this widget (use lowercase letters and hyphens).
The "content" must be a flat array of strings — one string per checklist item.
```

---

## Markdown Widget (e.g. Daily Brief, Summary)

```
When your task is complete, push the results to my dashboard:

POST https://YOUR_DASHBOARD_URL/api/widgets/update
Headers:
  Content-Type: application/json
  x-api-key: YOUR_API_KEY

Body:
{
  "slug": "daily-brief",
  "title": "Daily Brief",
  "type": "markdown",
  "content": "# Your markdown content here\n\n- Bullet point\n- Another point"
}

The "content" field accepts standard Markdown formatting.
```

---

## HTML Widget (e.g. Meal Plan, Rich Report)

```
When your task is complete, push the results to my dashboard:

POST https://YOUR_DASHBOARD_URL/api/widgets/update
Headers:
  Content-Type: application/json
  x-api-key: YOUR_API_KEY

Body:
{
  "slug": "meal-plan",
  "title": "Weekly Meal Plan",
  "type": "html",
  "content": "<h2>Week of April 7</h2><p>Monday: Chicken stir fry...</p>"
}

The "content" field accepts HTML. Script tags and event handlers are automatically stripped for safety.
```

---

## Tips

- The `slug` is how your widget is identified. Use the same slug each time a task runs to update the same widget.
- A new widget is created automatically the first time a slug is pushed — no dashboard configuration needed.
- Checklist items that were checked off will stay checked even after a Cowork re-push, as long as the item text hasn't changed.
