# Pink Tracker

A simple daily tracker for **sugar-free days (with a streak)**, **exercise minutes**, and a **daily fasting countdown**.
Plain HTML, CSS and JavaScript. No build step, no accounts, works offline, and stores everything on the phone.

## 1. Put the files on GitHub

1. Sign in at <https://github.com> and click **+ → New repository**.
2. Give it a name (for example `pink-tracker`), choose **Public**, and click **Create repository**.
3. On the new empty repository page, click **uploading an existing file**.
4. Unzip `pink-tracker.zip`, open the folder, select **everything inside it** (`index.html`, `styles.css`, `js`, `icons`, …) and drag it into the browser window.
   The files must sit at the top level of the repository, not inside an extra folder.
5. Click **Commit changes**.

(Command line instead: `git init`, `git add .`, `git commit -m "Pink Tracker"`, `git branch -M main`, `git remote add origin <repo-url>`, `git push -u origin main`.)

## 2. Turn on GitHub Pages

1. In the repository go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose branch **main** and folder **/ (root)**, then click **Save**.
4. After a minute or two the page shows your address: `https://USERNAME.github.io/REPO-NAME/`.

## 3. Install it on the iPhone

1. Open `https://USERNAME.github.io/REPO-NAME/` in **Safari** (it must be Safari, not Chrome).
2. Tap the **Share** button (square with an arrow).
3. Scroll and tap **Add to Home Screen**, then **Add**.
4. Open it from the new pink heart icon. It now works like a normal app, even with no internet.

## 4. Pushing an update to the phone

The phone keeps its own offline copy of the app, so it needs a nudge to notice changes:

1. Edit the files you want to change.
2. Open `service-worker.js` and **increase `CACHE_VERSION`** at the top (`1` → `2`, and so on).
   This step is what makes the phone download the new files.
3. Commit and push to `main` (or upload the changed files on github.com). Wait a minute for Pages to publish.
4. On the phone, open the app while it has internet. It downloads the update in the background and reloads itself once.
   If it still looks old, close the app completely (swipe it away) and open it again.

Her saved data is not touched by updates.

## Running it on your computer

```
python3 -m http.server 8000
```

then open <http://localhost:8000/>. (Opening `index.html` straight from the folder won't register the service worker.)

Tests (plain Node, nothing to install):

```
node tests/streak.test.js
node tests/fasting.test.js
```

## 5. Where the data lives

**Everything is stored only on that one phone**, in Safari's local storage. There is no account, no server and no sync.
Clearing Safari's website data, or deleting the app from the Home Screen, **erases all history**. It cannot be recovered, and it does not appear on any other device.

## How the streak works

- Weeks run Sunday to Saturday. Each day is *sugar-free*, *had sugar*, or not logged.
- Each sugar-free day adds 1 to the streak.
- The **first** sugar day in a week is forgiven: the streak holds (it doesn't grow or reset).
- A **second** sugar day in the same week resets the streak to 0. Counting restarts from the next sugar-free day; sugar days from that week don't count against the new streak.
- Days that aren't logged (including today until it's logged) neither add to nor break the streak.
- Editing a past day recalculates the streak.

The logic is in `js/streak.js`; the tests are in `tests/`.

## Files

```
index.html            the page
styles.css            all styling
manifest.webmanifest  install info (name, icons, colors)
service-worker.js     offline cache (bump CACHE_VERSION to update)
js/streak.js          streak + week/date logic (pure functions)
js/fasting.js         fasting window + countdown maths (pure functions)
js/storage.js         saving and loading
js/ui-*.js, app.js    the screens and wiring
icons/                app icons (made by tools/make_icons.py)
tests/                Node tests
```
