# Famous Jewish People — Blog

A newspaper-style blog celebrating famous Jewish people across sports, entertainment, music, business, content creation, and more.

## Running the Site

This is plain HTML/CSS/JS. You need a local server because browsers block `fetch()` on `file://` URLs.

**Python (easiest):**
```bash
cd famous-jewish-people
python3 -m http.server 8080
```
Then open http://localhost:8080

**Node.js:**
```bash
npx serve .
```

---

## Adding a New Post

### Step 1 — Write the post

Create a new `.md` file in the `posts/` folder. Use hyphens in the filename:

```
posts/gal-gadot.md
posts/drake.md
posts/mark-zuckerberg.md
```

Write in plain Markdown. Use `##` for section headings, `**bold**`, `*italic*`, `>` for quotes. No title needed at the top — it comes from `posts.json`.

### Step 2 — Register the post in posts.json

Open `posts.json` and add an entry to the array:

```json
{
  "id": "gal-gadot",
  "title": "Gal Gadot: Wonder Woman and Israeli Icon",
  "category": "Entertainment",
  "date": "2026-05-21",
  "excerpt": "From IDF service to Hollywood superstardom, Gal Gadot has made Jewish and Israeli identity a central part of her public persona.",
  "file": "posts/gal-gadot.md",
  "featured": false
}
```

Set `"featured": true` on any one post to display it prominently at the top of the homepage. Only one post should be featured at a time.

---

## Categories

Use one of these for consistency:

- `Athletes`
- `Entertainment`
- `Music`
- `Business`
- `Content Creators`
- `Science & History`

---

## File Structure

```
famous-jewish-people/
├── index.html        # Homepage
├── post.html         # Article page (shared template)
├── style.css         # All styles
├── app.js            # Homepage logic
├── post.js           # Article page logic
├── posts.json        # Post index (title, category, date, excerpt)
└── posts/
    └── adam-sandler.md   # Post content (Markdown)
```
