import Parser from 'rss-parser';

const parser = new Parser();

const NEWS_SOURCES = [
  { name: 'BBC Business', url: 'http://feeds.bbci.co.uk/news/business/rss.xml', defaultCategory: 'Global' },
  { name: 'CNN Business', url: 'http://rss.cnn.com/rss/money_latest.rss', defaultCategory: 'Economy' },
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex', defaultCategory: 'Markets' },
  { name: 'Google News Finance', url: 'https://news.google.com/rss/search?q=finance+markets+crypto+startups&hl=en-US&gl=US&ceid=US:en', defaultCategory: 'General' }
];

export default async function handler(req: any, res: any) {
  try {
    const feedPromises = NEWS_SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        return feed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          content: item.contentSnippet || item.content,
          source: source.name,
          category: source.defaultCategory,
          guid: item.guid || item.link
        }));
      } catch (error) {
        console.error(`Error fetching feed from ${source.name}:`, error);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    let allNews = results.flat();

    // Sort by date
    allNews.sort((a, b) => {
      return new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime();
    });

    // Keyword-based categorization
    allNews = allNews.map(item => {
      const text = (item.title + ' ' + (item.content || '')).toLowerCase();
      if (text.includes('crypto') || text.includes('bitcoin') || text.includes('ethereum') || text.includes('blockchain')) {
        item.category = 'Crypto';
      } else if (text.includes('startup') || text.includes('venture capital') || text.includes('funding round')) {
        item.category = 'Startups';
      } else if (text.includes('tech') || text.includes('apple') || text.includes('google') || text.includes('ai ')) {
        item.category = 'Technology';
      } else if (text.includes('market') || text.includes('stock') || text.includes('trading')) {
        item.category = 'Markets';
      } else if (text.includes('economy') || text.includes('inflation') || text.includes('fed ') || text.includes('interest rate')) {
        item.category = 'Economy';
      }
      return item;
    });

    // Set cache headers (10 minutes)
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    res.status(200).json(allNews);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
}
