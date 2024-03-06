import express from 'express';
import http from 'http';
import cors from 'cors';
import controller from './controllers';

const app = express();
app.use(cors({ credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

server.listen(8080, () => {
  console.log('Server is running on http://localhost:8080/');
});
app.get('/:id/filteredResponses', controller.filteredResponses);
