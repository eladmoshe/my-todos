import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(join(__dirname, '../../build')));

app.get('/api/todos', (req, res) => {
  // TODO: Implement todo list retrieval
  res.json([{ id: 1, text: 'Sample Todo', completed: false }]);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
