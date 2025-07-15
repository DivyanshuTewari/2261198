import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

export default function StatsTable({ urls, onRowClick }) {
  if (urls.length === 0) {
    return <Typography variant="body1">No URLs have been shortened yet.</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Short URL</TableCell>
            <TableCell>Original URL</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Expires</TableCell>
            <TableCell>Clicks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {urls.map((url, index) => (
            <TableRow 
              key={index} 
              hover 
              onClick={() => onRowClick(url)}
              style={{ cursor: 'pointer' }}
            >
              <TableCell>{url.shortUrl}</TableCell>
              <TableCell style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {url.originalUrl}
              </TableCell>
              <TableCell>{url.createdAt.toLocaleString()}</TableCell>
              <TableCell>{url.expiryDate.toLocaleString()}</TableCell>
              <TableCell>{url.clicks || 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}