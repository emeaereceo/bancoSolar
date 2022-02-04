const { Pool } = require('pg');
const moment = require('moment');

const pool = new Pool({
	user: 'postgres',
	host: 'localhost',
	password: 'password',
	database: 'bancosolar',
	port: 5432,
});

const leer = async () => {
	const client = await pool.connect();
	try {
		const resultado = await client.query('SELECT * FROM usuarios');
		return { ok: true, data: resultado.rows };
	} catch (e) {
		console.log(e);
		return { ok: false, data: 'Error' };
	} finally {
		client.release();
	}
};

const crear = async (datos) => {
	const query = {
		text: 'INSERT INTO usuarios (nombre, balance) VALUES ($1,$2) RETURNING*;',
		values: datos,
	};
	const client = await pool.connect();
	try {
		const resultado = await client.query(query);
		console.log('Usuario ingresado con exito');
		console.log(resultado.rows);
		return { ok: true, data: resultado.rows };
	} catch (e) {
		console.log(e);
		return { ok: false, data: 'error' };
	} finally {
		console.log('final');
		client.release();
	}
};

const actualizar = async (datos) => {
	const query = {
		text: 'UPDATE usuarios SET nombre=$1, balance=$2 where id=$3 RETURNING*;',
		values: datos,
	};

	const client = await pool.connect();
	try {
		const resultado = await client.query(query);
		console.log('Se actualiza informacion de usuario');
		console.log(resultado.rows);
		return { ok: true, data: resultado.rows };
	} catch (e) {
		console.log(e);
		return { ok: false, data: 'error' };
	} finally {
		console.log('final');
		client.release();
	}
};

const eliminar = async (id) => {
	const query = {
		text: 'DELETE FROM usuarios WHERE id = $1 RETURNING*',
		values: id,
	};
	const client = await pool.connect();
	try {
		const resultado = await client.query(query);
		return { ok: true, data: resultado.rows };
	} catch (e) {
		console.log(e);
		return { ok: false, data: 'error' };
	} finally {
		console.log('final');
		client.release();
	}
};

const postTransfer = async (emisor, receptor, monto) => {
	const client = await pool.connect();

	const querySender = {
		text: 'UPDATE usuarios SET balance = balance - $2 where nombre = $1 RETURNING*;',
		values: [emisor, monto],
	};
	const queryReceiver = {
		text: 'UPDATE usuarios SET balance = balance + $2 where nombre = $1 RETURNING*;',
		values: [receptor, monto],
	};

	const idEmisor = {
		text: 'SELECT id FROM usuarios WHERE nombre=$1;',
		values: [emisor],
	};
	const idReceptor = {
		text: 'SELECT id FROM usuarios WHERE nombre=$1;',
		values: [receptor],
	};
	const getIdEmisor = (await client.query(idEmisor)).rows[0].id;
	const getIdReceptor = (await client.query(idReceptor)).rows[0].id;

	// console.log(getIdEmisor);
	const queryRegister = {
		text: 'INSERT INTO transferencias (emisor, receptor, monto, fecha) values($1, $2, $3, $4)RETURNING*;',
		values: [getIdEmisor, getIdReceptor, monto, moment().format()],
	};

	try {
		await client.query('BEGIN');
		await client.query(querySender);
		await client.query(queryReceiver);
		await client.query(queryRegister);
		await client.query('COMMIT');

		console.log('Transaccion Realizada');
		return { ok: true, data: 'Funciona' };
		// return { ok: true, data: 'Funciona' };
	} catch (e) {
		await client.query('ROLLBACK');
		// console.log('Error en la transaccion');
		console.log(e);
		return { ok: false, data: 'Transact error' };
	} finally {
		client.release();
		// pool.end();
		// console.log('Final Final');
	}
};

const getTransfer = async () => {
	const client = await pool.connect();
	const query = {
		// text: 'SELECT * FROM transferencias;',
		text: 'select t.id, (select nombre from usuarios where id=t.emisor), (select nombre from usuarios where id=t.receptor), t.monto, t.fecha from transferencias as t;',
		rowMode: 'array',
	};
	try {
		const resultado = await client.query(query);
		return { ok: true, data: resultado.rows };
	} catch (e) {
		console.log(e);
		return { ok: false, data: 'Error' };
	} finally {
		client.release();
	}
};

module.exports = {
	leer,
	crear,
	actualizar,
	eliminar,
	postTransfer,
	getTransfer,
};
