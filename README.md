# Portfolio: Dondie Godwin Gatan

Source for my personal portfolio site: plain HTML, CSS and JavaScript with no framework and no build step, deployed with GitHub Pages at
https://dondiegatan.github.io/dondiegatan-portfolio/

## Pages

| Page | What it shows |
|---|---|
| `index.html` | Home: a swipeable project carousel and the main stack |
| `about.html` | Profile, experience, education, certifications and awards |
| `projects.html` | Five projects with demo videos, source links and "how to try it" notes |
| `skills.html` | Skills grouped by category |
| `contact.html` | Email, GitHub, LinkedIn and the resume download |

`style.css` and `site.js` are shared by every page (themes, animations, the carousel and the demo video player).

## Run locally

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy (GitHub Pages)

The site is served from the `master` branch, root folder. Pushing to `master` publishes it within a minute or two.

## Structure

```
index.html, about.html, projects.html, skills.html, contact.html
style.css, site.js
assets/
  covers/      project cover images (WebP)
  demos/       demo videos and poster images
  fonts/       self-hosted fonts
  screenshots/ app screenshots for the project cards
  Dondie_Godwin_Gatan_CV.pdf   the downloadable resume
```
