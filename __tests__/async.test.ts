import { complianceTestsAsync } from "@keeveestore/test-suite";
import { StoreAsync } from "../src/async";

complianceTestsAsync(
	new StoreAsync<string, string>({
		connection: {
			database: process.env.MYSQL_DATABASE || "keeveestore",
			user: process.env.MYSQL_USER || "keeveestore",
			password: process.env.MYSQL_PASSWORD || "keeveestore",
		},
	}),
	{
		key1: "value1",
		key2: "value2",
		key3: "value3",
		key4: "value4",
		key5: "value5",
	},
);
