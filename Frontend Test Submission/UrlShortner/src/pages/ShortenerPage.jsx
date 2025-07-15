import { useState } from 'react';
import { Button, Grid, Paper, Typography } from '@mui/material';
import UrlForm from '../components/UrlForm';
import UrlList from '../components/UrlList';
import { logAction } from '../utils/logger';

export default function ShortenerPage() {
  const [urls, setUrls] = useState([]);

  const handleShortenUrl = (newUrl) => {
    logAction('Shorten URL attempt', { url: newUrl.originalUrl });
    // In a real app, this would call your API
    const shortCode = newUrl.shortCode || Math.random().toString(36).substring(2, 8);
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + (newUrl.validity || 30));
    
    const shortenedUrl = {
      ...newUrl,
      shortCode,
      shortUrl: `http://localhost:3000/${shortCode}`,
      createdAt: new Date(),
      expiryDate,
      clicks: 0,
      clickData: []
    };
    
    setUrls([...urls, shortenedUrl]);
    logAction('URL shortened successfully', { shortCode });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          URL Shortener
        </Typography>
        <Typography variant="body1" paragraph>
          Shorten up to 5 URLs at once. Customize validity and shortcodes as needed.
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <UrlForm onSubmit={handleShortenUrl} urlCount={urls.length} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <UrlList urls={urls} />
        </Paper>
      </Grid>
    </Grid>
  );
}