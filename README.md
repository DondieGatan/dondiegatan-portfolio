# Portfolio — Dondie Godwin Gatan

Source for my personal portfolio site: plain HTML/CSS, no build step, deployed via GitHub Pages.

## Run locally

Open `index.html` directly in a browser, or serve it:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy (GitHub Pages)

1. Push this folder to a repo named `dondiegatan-portfolio` on GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Save. The site will be live at `https://dondiegatan.github.io/dondiegatan-portfolio/` within a minute or two.

## Structure

```
index.html
style.css
assets/screenshots/   — app screenshots used in the Projects section
```
