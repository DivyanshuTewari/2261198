import { useState } from 'react';
import { TextField, Button, Grid, Box, Typography } from '@mui/material';
import { logAction } from '../utils/logger';

export default function UrlForm({ onSubmit, urlCount }) {
  const [originalUrl, setOriginalUrl] = useState('');
  const [validity, setValidity] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    logAction('URL form submission attempted');

    if (!validateUrl(originalUrl)) {
      setError('Please enter a valid URL');
      logAction('Invalid URL entered', { url: originalUrl });
      return;
    }

    if (validity && isNaN(Number(validity))) {
      setError('Validity must be a number');
      logAction('Invalid validity entered', { validity });
      return;
    }

    if (shortCode && !/^[a-zA-Z0-9_-]{4,20}$/.test(shortCode)) {
      setError('Shortcode must be 4-20 alphanumeric characters');
      logAction('Invalid shortcode entered', { shortCode });
      return;
    }

    if (urlCount >= 5) {
      setError('Maximum of 5 URLs reached');
      logAction('Maximum URLs exceeded');
      return;
    }

    setError('');
    onSubmit({
      originalUrl,
      validity: validity ? Number(validity) : null,
      shortCode: shortCode || null
    });
    
    // Reset form
    setOriginalUrl('');
    setValidity('');
    setShortCode('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Shorten a New URL
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Original URL"
            variant="outlined"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Validity (minutes, default 30)"
            variant="outlined"
            type="number"
            value={validity}
            onChange={(e) => setValidity(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Custom Shortcode (optional)"
            variant="outlined"
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value)}
          />
        </Grid>
        {error && (
          <Grid item xs={12}>
            <Typography color="error">{error}</Typography>
          </Grid>
        )}
        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Shorten URL
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}