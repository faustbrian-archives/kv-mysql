import { complianceTestsAsync } from "@konceiver/kv-test-suite";

import { StoreAsync } from "./index";

complianceTestsAsync(
	() =>
		StoreAsync.new<string, string>({
			connection: {
				host: process.env.MYSQL_HOST || "localhost",
				port: process.env.MYSQL_PORT || 3306,
				database: process.env.MYSQL_DATABASE || "kv",
				password: process.env.MYSQL_PASSWORD || "kv",
				user: process.env.MYSQL_USER || "kv",
			},
		}),
	{
		key1: "value1",
		key2: "value2",
		key3: "value3",
		key4: "value4",
		key5: "value5",
	}
);
