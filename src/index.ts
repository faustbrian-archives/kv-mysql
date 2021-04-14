import { IKeyValueStoreAsync } from "@konceiver/kv";
// tslint:disable-next-line: no-submodule-imports
import mysql from "mysql2/promise";
import sql from "sql";

export class StoreAsync<K, T> implements IKeyValueStoreAsync<K, T> {
	public static async new<K, T>(
		opts?: Record<string, any>
	): Promise<StoreAsync<K, T>> {
		opts = {
			keySize: 255,
			table: "kv",
			...opts,
		};

		sql.setDialect("mysql");

		const table = sql.define({
			columns: [
				{
					dataType: `VARCHAR(${Number(opts.keySize)})`,
					// @ts-ignore
					name: "key",
					primaryKey: true,
				},
				{
					dataType: "TEXT",
					// @ts-ignore
					name: "value",
				},
			],
			name: opts.table,
		});

		const connection = await mysql.createConnection(opts.connection);

		await connection.execute(table.create().ifNotExists().toString());

		return new StoreAsync<K, T>({ connection, table });
	}

	private readonly table;
	private readonly executeQuery;

	private constructor({ connection, table }) {
		this.table = table;
		this.executeQuery = async (sqlQuery: string) =>
			(await connection.execute(sqlQuery))[0];
	}

	public async all(): Promise<Array<[K, T]>> {
		const rows = await this.executeQuery(this.table.select().toString());

		return rows.map((row) => [row.key, row.value]);
	}

	public async keys(): Promise<K[]> {
		return (await this.all()).map((row) => row[0]);
	}

	public async values(): Promise<T[]> {
		return (await this.all()).map((row) => row[1]);
	}

	public async get(key: K): Promise<T | undefined> {
		const rows = await this.executeQuery(
			this.table.select(this.table.value).where({ key }).toString()
		);

		const row = rows[0];

		if (row === undefined) {
			return undefined;
		}

		return row.value;
	}

	public async getMany(keys: K[]): Promise<Array<T | undefined>> {
		return Promise.all([...keys].map(async (key: K) => this.get(key)));
	}

	public async pull(key: K): Promise<T | undefined> {
		const item: T | undefined = await this.get(key);

		await this.forget(key);

		return item;
	}

	public async pullMany(keys: K[]): Promise<Array<T | undefined>> {
		const items: Array<T | undefined> = await this.getMany(keys);

		await this.forgetMany(keys);

		return items;
	}

	public async put(key: K, value: T): Promise<boolean> {
		await this.executeQuery(this.table.replace({ key, value }).toString());

		return this.has(key);
	}

	public async putMany(values: Array<[K, T]>): Promise<boolean[]> {
		return Promise.all(
			values.map(async (value: [K, T]) => this.put(value[0], value[1]))
		);
	}

	public async has(key: K): Promise<boolean> {
		return (await this.get(key)) !== undefined;
	}

	public async hasMany(keys: K[]): Promise<boolean[]> {
		return Promise.all([...keys].map(async (key: K) => this.has(key)));
	}

	public async missing(key: K): Promise<boolean> {
		return !(await this.has(key));
	}

	public async missingMany(keys: K[]): Promise<boolean[]> {
		return Promise.all([...keys].map(async (key: K) => this.missing(key)));
	}

	public async forget(key: K): Promise<boolean> {
		if (await this.missing(key)) {
			return false;
		}

		const rows = await this.executeQuery(
			this.table.select().where({ key }).toString()
		);

		if (rows[0] === undefined) {
			return false;
		}

		await this.executeQuery(this.table.delete().where({ key }).toString());

		return this.missing(key);
	}

	public async forgetMany(keys: K[]): Promise<boolean[]> {
		return Promise.all([...keys].map((key: K) => this.forget(key)));
	}

	public async flush(): Promise<boolean> {
		await this.executeQuery(this.table.truncate().toString());

		return this.isEmpty();
	}

	public async count(): Promise<number> {
		const rows = await this.executeQuery(
			this.table.select(this.table.count("count")).toString()
		);

		return +rows[0].count;
	}

	public async isEmpty(): Promise<boolean> {
		return (await this.count()) === 0;
	}

	public async isNotEmpty(): Promise<boolean> {
		return !(await this.isEmpty());
	}
}
