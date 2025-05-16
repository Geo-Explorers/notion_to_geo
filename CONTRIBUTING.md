# Contributing to Notion to Geo Publisher

This guide explains how to add new features and pages to the Express.js webserver.

## Project Structure

The project follows a simple structure:
- `public/` - Contains all static HTML files and assets
- `src/` - Contains server-side code
- `server.ts` - Main Express.js server file

## Adding a New Page

To add a new page to the application, follow these steps:

1. Create a new HTML file in the `public/` directory:
```html
<!DOCTYPE html>
<html>
  <head>
    <title>Title</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      /* Add your custom styles here */
    </style>
  </head>
  <body>
    <h1>Heading</h1>
    <!-- Add your content here -->
  </body>
</html>
```

2. Add a route in `server.ts` to serve your new page:
```typescript
app.get("/your-new-page", (_req, res) => {
  res.sendFile(path.join(publicPath, "your-new-page.html"));
});
```

3. Add a link to your new page in `public/index.html`:
```html
<ul>
  <li><a href="/your-new-page">Your New Page</a></li>
</ul>
```

## Adding New API Endpoints

To add new API functionality:

1. Add a new route in `server.ts`:
```typescript
app.post("/your-new-endpoint", async (req, res) => {
  try {
    // Handle the request
    const result = await yourFunction();
    
    res.json({
      success: true,
      message: "Operation successful",
      data: result
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Operation failed",
      trace: error
    });
  }
});
```

2. Call the endpoint from your HTML page using fetch:
```typescript
const response = await fetch("/your-new-endpoint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(yourData)
});
const result = await response.json();
```
