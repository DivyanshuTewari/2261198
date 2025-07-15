import { Typography, List, ListItem, ListItemText, Button, Chip, Paper } from '@mui/material';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { logAction } from '../utils/logger';

export default function UrlList({ urls }) {
  const handleCopy = (url) => {
    logAction('URL copied to clipboard', { shortUrl: url.shortUrl });
    alert('Copied to clipboard!');
  };

  if (urls.length === 0) {
    return (
      <Typography variant="body1" color="textSecondary">
        No URLs shortened yet. Add one above!
      </Typography>
    );
  }

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Your Shortened URLs
      </Typography>
      <List>
        {urls.map((url, index) => (
          <Paper key={index} elevation={2} sx={{ mb: 2, p: 2 }}>
            <ListItem>
              <ListItemText
                primary={
                  <a href={url.shortUrl} target="_blank" rel="noopener noreferrer">
                    {url.shortUrl}
                  </a>
                }
                secondary={`Original: ${url.originalUrl}`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                secondary={`Expires: ${url.expiryDate.toLocaleString()}`}
              />
              <Chip 
                label={`${url.clicks || 0} clicks`} 
                variant="outlined" 
                size="small"
              />
            </ListItem>
            <CopyToClipboard text={url.shortUrl} onCopy={() => handleCopy(url)}>
              <Button size="small" variant="outlined" sx={{ mr: 1 }}>
                Copy
              </Button>
            </CopyToClipboard>
            <Button 
              size="small" 
              variant="outlined" 
              href={`/stats`}
              onClick={() => localStorage.setItem('selectedUrl', JSON.stringify(url))}
            >
              View Stats
            </Button>
          </Paper>
        ))}
      </List>
    </div>
  );
}