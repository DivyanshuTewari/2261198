// This would contain your actual API calls
// For this demo, we're using localStorage to simulate persistence

export async function shortenUrl(urlData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const shortCode = urlData.shortCode || Math.random().toString(36).substring(2, 8);
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + (urlData.validity || 30));
      
      const shortenedUrl = {
        ...urlData,
        shortCode,
        shortUrl: `http://localhost:3000/${shortCode}`,
        createdAt: new Date(),
        expiryDate,
        clicks: 0,
        clickData: []
      };
      
      // Save to localStorage
      const urls = JSON.parse(localStorage.getItem('shortenedUrls') || '[]');
      urls.push(shortenedUrl);
      localStorage.setItem('shortenedUrls', JSON.stringify(urls));
      
      resolve(shortenedUrl);
    }, 500); // Simulate network delay
  });
}

export async function getUrlStats(shortCode) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const urls = JSON.parse(localStorage.getItem('shortenedUrls') || []);
      const url = urls.find(u => u.shortCode === shortCode);
      resolve(url || null);
    }, 300);
  });
}