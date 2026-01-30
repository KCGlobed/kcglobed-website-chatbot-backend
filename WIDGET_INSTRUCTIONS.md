# How to Build and Use the Chat Widget

We have configured a specific build process to package your React Chat Widget as a standalone file that can be embedded in any website.

## 1. Build the Widget

Run the following command in the `client` directory:

```bash
cd client
npm run build:widget
```

This will create a `widget-build` directory containing:
- `widget.js` (The main bundled logic)
- `widget.css` (The styles)

## 2. Host the Widget

You need to host these two files so they are accessible via valid URLs. You can upload them to:
- An S3 bucket
- A CDN (Netlify, Vercel, Cloudflare Pages)
- **Your existing backend server** (e.g., at `http://localhost:3000/widget/`)

### Serving from specific Backend (Node/Express)
Add this to your `src/app.ts` (or server entry point):

```typescript
import path from 'path';
import express from 'express';

// inside config() or before routes
this.app.use('/widget', express.static(path.join(process.cwd(), 'client/widget-build')));
```

## 3. Embed in Any Website

Add the following code to the HTML of the target website (inside `<head>` or before `</body>`):

```html
<!-- 1. Load Styles -->
<link rel="stylesheet" href="YOUR_HOST_URL/widget.css">

<!-- 2. Load Widget Script -->
<script type="module" src="YOUR_HOST_URL/widget.js"></script>

<!-- Note: The widget automatically creates its own container and mounts to the body. -->
```

Replace `YOUR_HOST_URL` with the actual URL where you are hosting the files (e.g., `http://localhost:3000/widget`).

## 4. Customization

The widget currently mounts fixed to the bottom-right.
- If you need to change positioning, edit `client/src/components/ChatWidget.tsx` (the Tailwind classes `fixed bottom-6 right-6`).
- If you want the user to specify a container, modify `client/src/widget.tsx`.
