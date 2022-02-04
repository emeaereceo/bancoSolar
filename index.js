const http = require('http');
const url = require('url');
const fs = require('fs');
const {
	leer,
	crear,
	actualizar,
	eliminar,
	postTransfer,
	getTransfer,
} = require('./db/index.js');

http
	.createServer(async (req, res) => {
		// LEVANTO INICIO
		if (req.url === '/') {
			fs.readFile('index.html', 'utf8', (err, html) => {
				if (err) return res.end('Fallo html');

				res.writeHead(200, { 'Content-Type': 'text/html' });
				return res.end(html);
			});
		}

		if (req.url === '/usuario' && req.method === 'POST') {
			let body = '';
			req.on('data', (data) => {
				body += data;
				// console.log(data);
			});

			req.on('end', async () => {
				const { nombre, balance } = JSON.parse(body);
				const result = await crear([nombre, balance]);

				if (!result.ok) {
					res.writeHead(500, { 'Content-Type': 'application/json' });
					return res.end(JSON.stringify(result.data));
				}
				res.writeHead(201, { 'Content-Type': 'application/json' });
				return res.end(JSON.stringify(result.data));
			});
		}

		if (req.url === '/usuarios' && req.method === 'GET') {
			const resultado = await leer();

			if (!resultado.ok) {
				res.writeHead(500, { 'Content-Type': 'application/json' });
				return res.end(JSON.stringify(resultado.data));
			}

			res.writeHead(200, { 'Content-Type': 'application/json' });
			return res.end(JSON.stringify(resultado.data));
		}

		if (req.url.includes('/usuario') && req.method === 'PUT') {
			let body = '';
			req.on('data', (data) => {
				body += data;
				// console.log(body);
			});
			req.on('end', async () => {
				const { name, balance, id } = JSON.parse(body);
				const resultado = await actualizar([name, balance, id]);
				if (!resultado.ok) {
					res.writeHead(500, { 'Content-Type': 'application/json' });
					return res.end(JSON.stringify(resultado.data));
				}
				res.writeHead(201, { 'Content-Type': 'application/json' });
				return res.end(JSON.stringify(resultado.data));
			});
		}

		if (req.url.includes('/usuario') && req.method === 'DELETE') {
			const { id } = url.parse(req.url, true).query;

			const resultado = await eliminar([id]);

			if (resultado.data.length === 0) {
				res.writeHead(403, { 'Content-Type': 'application/json' });
				return res.end(JSON.stringify({ error: 'No hay ID' }));
			}
			res.writeHead(201, { 'Content-Type': 'application/json' });
			return res.end(JSON.stringify(resultado.data));
		}

		if (req.url.includes('/transferencia') && req.method === 'POST') {
			// console.log(req.method);
			let body = '';
			req.on('data', (data) => {
				body += data;
			});
			req.on('end', async () => {
				// console.log(body);
				const { emisor, receptor, monto } = JSON.parse(body);
				const result = await postTransfer(emisor, receptor, monto);
				// console.log(result);
				// if (!result.ok) {
				// res.writeHead(500, { 'Content-Type': 'application/json' });
				// return res.end(JSON.stringify(result.data));
				// }
				res.writeHead(201, { 'Content-Type': 'application/json' });
				return res.end(JSON.stringify(result.data));
			});
		}

		if (req.url === '/transferencias' && req.method === 'GET') {
			const resultado = await getTransfer();

			if (!resultado.ok) {
				res.writeHead(500, { 'Content-Type': 'application/json' });
				return res.end(JSON.stringify(resultado.data));
			}

			res.writeHead(200, { 'Content-Type': 'application/json' });
			return res.end(JSON.stringify(resultado.data));
		}
	})
	.listen(3000, () => console.log('Estamos al aire'));
