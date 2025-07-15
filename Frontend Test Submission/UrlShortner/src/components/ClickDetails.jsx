import { Typography, List, ListItem, ListItemText, Divider } from '@mui/material';

export default function ClickDetails({ url }) {
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Click Details for: {url.shortUrl}
      </Typography>
      <Typography variant="body1" paragraph>
        Original URL: {url.originalUrl}
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Total clicks: {url.clicks || 0}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1">Click History</Typography>
      {url.clickData && url.clickData.length > 0 ? (
        <List>
          {url.clickData.map((click, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={new Date(click.timestamp).toLocaleString()}
                secondary={`From: ${click.source || 'Unknown'} | Location: ${click.location || 'Unknown'}`}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="textSecondary">
          No click data available.
        </Typography>
      )}
    </div>
  );
}