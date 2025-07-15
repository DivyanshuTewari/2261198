import { useEffect, useState } from 'react';
import { Button, Typography, Paper } from '@mui/material';
import StatsTable from '../components/StatsTable';
import { logAction } from '../utils/logger';

export default function StatsPage() {
  const [urls, setUrls] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);

  useEffect(() => {
    logAction('Accessed statistics page');
    // In a real app, this would fetch from your API
    const storedUrls = JSON.parse(localStorage.getItem('shortenedUrls') || '[]');
    setUrls(storedUrls);
  }, []);

  const handleUrlClick = (url) => {
    logAction('Viewed URL stats', { shortCode: url.shortCode });
    setSelectedUrl(url);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        URL Statistics
      </Typography>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <StatsTable urls={urls} onRowClick={handleUrlClick} />
      </Paper>
      {selectedUrl && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <ClickDetails url={selectedUrl} />
        </Paper>
      )}
    </div>
  );
}