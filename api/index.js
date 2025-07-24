const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.json');

function readDB() {
  const raw = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = async (req, res) => {
  const db = readDB();
  const { method, url } = req;

  if (url === '/items' && method === 'GET') {
    return res.end(JSON.stringify(db.items || []));
  }

  if (url === '/items' && method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      const item = JSON.parse(body);
      item.id = Date.now();
      db.items.push(item);
      writeDB(db);
      res.statusCode = 201;
      res.end(JSON.stringify(item));
    });
    return;
  }

  const itemIdMatch = url.match(/^\/items\/(\d+)$/);
  if (itemIdMatch && method === 'PUT') {
    const id = Number(itemIdMatch[1]);
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      const updated = JSON.parse(body);
      const index = db.items.findIndex((i) => i.id === id);
      if (index === -1) {
        res.statusCode = 404;
        return res.end(JSON.stringify({ message: 'Item not found' }));
      }
      db.items[index] = { ...db.items[index], ...updated };
      writeDB(db);
      res.end(JSON.stringify(db.items[index]));
    });
    return;
  }

  if (itemIdMatch && method === 'DELETE') {
    const id = Number(itemIdMatch[1]);
    const index = db.items.findIndex((i) => i.id === id);
    if (index === -1) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ message: 'Item not found' }));
    }
    db.items.splice(index, 1);
    writeDB(db);
    res.end(JSON.stringify({ message: 'Item deleted' }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ message: 'Not found' }));
};